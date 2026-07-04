import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

/**
 * Rate limiting middleware factory.
 *
 * Uses Upstash Redis (distributed, survives restarts, safe across multiple
 * instances) when UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN are set.
 * Otherwise falls back to a per-process in-memory limiter so the app is still
 * protected with zero configuration in single-instance deployments.
 *
 * @param {Object}  opts
 * @param {string}  opts.name     - Unique prefix (keeps buckets per-endpoint)
 * @param {number}  opts.limit    - Max requests allowed per window
 * @param {number}  opts.windowMs - Window length in milliseconds
 * @returns {import('express').RequestHandler}
 */
export function rateLimit({ name, limit, windowMs }) {
  const limiter = createLimiter({ name, limit, windowMs });

  return async function rateLimitMiddleware(req, res, next) {
    try {
      const key = clientKey(req);
      const { success, remaining, reset } = await limiter(key);

      res.setHeader('RateLimit-Limit', limit);
      res.setHeader('RateLimit-Remaining', Math.max(0, remaining));

      if (!success) {
        const retryAfter = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
        res.setHeader('Retry-After', retryAfter);
        return res.status(429).json({
          success: false,
          error: 'Too many requests. Please slow down and try again shortly.',
        });
      }
      next();
    } catch (err) {
      // Never let a limiter failure take down the endpoint — fail open.
      console.error('Rate limiter error (failing open):', err.message);
      next();
    }
  };
}

/** Identifies the caller — authenticated user id if present, else client IP. */
function clientKey(req) {
  return req.user?.id || req.ip || 'unknown';
}

function createLimiter({ name, limit, windowMs }) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (url && token) {
    const ratelimit = new Ratelimit({
      redis: new Redis({ url, token }),
      limiter: Ratelimit.slidingWindow(limit, `${windowMs} ms`),
      prefix: `ultragrade:${name}`,
    });
    return async (key) => {
      const { success, remaining, reset } = await ratelimit.limit(key);
      return { success, remaining, reset };
    };
  }

  console.warn(
    `[rateLimit:${name}] Upstash not configured — using in-memory limiter ` +
      '(not shared across instances, resets on restart).'
  );
  return inMemoryLimiter({ limit, windowMs });
}

/** Simple fixed-window counter keyed in a Map. */
function inMemoryLimiter({ limit, windowMs }) {
  const buckets = new Map();

  return async (key) => {
    const now = Date.now();
    let bucket = buckets.get(key);

    if (!bucket || now >= bucket.reset) {
      bucket = { count: 0, reset: now + windowMs };
      buckets.set(key, bucket);
    }

    bucket.count += 1;
    pruneExpired(buckets, now);

    return {
      success: bucket.count <= limit,
      remaining: limit - bucket.count,
      reset: bucket.reset,
    };
  };
}

function pruneExpired(buckets, now) {
  for (const [key, bucket] of buckets) {
    if (now >= bucket.reset) buckets.delete(key);
  }
}
