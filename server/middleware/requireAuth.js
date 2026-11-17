import { jwtVerify, createRemoteJWKSet } from 'jose';

const supabaseUrl = process.env.SUPABASE_URL;
const JWKS = supabaseUrl
  ? createRemoteJWKSet(new URL(`${supabaseUrl}/auth/v1/.well-known/jwks.json`))
  : null;

export default async function requireAuth(req, res, next) {
  if (!JWKS || !supabaseUrl) {
    return res.status(503).json({ success: false, error: 'Authentication is not configured on this server.' });
  }
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Missing authorization token' });
  }
  const token = authHeader.slice(7);
  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: `${process.env.SUPABASE_URL}/auth/v1`,
      audience: 'authenticated',
    });
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch {
    res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
}
