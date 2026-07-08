import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, AtSign, Lock, Eye, EyeOff, AlertCircle, CheckCircle, UserRound, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useThemeTransition } from '../hooks/useThemeTransition.js';
import WelcomeIntro from '../components/onboarding/WelcomeIntro.jsx';

// Shown once per device before the login form. The flag is checked lazily so a
// returning visitor never sees a flash of the intro before it's dismissed.
const INTRO_SEEN_KEY = 'ultragrade_intro_seen';

// Usernames (no "@") map to a synthetic email so Supabase can store them.
const USERNAME_DOMAIN = 'ultragrade.app';
function toEmail(identifier) {
  const v = (identifier || '').trim();
  return v.includes('@') ? v : `${v.toLowerCase().replace(/\s+/g, '')}@${USERNAME_DOMAIN}`;
}

const SPRING = { type: 'spring', stiffness: 380, damping: 34, mass: 0.9 };
const POP_MS = 300;
const POP_EASE = 'cubic-bezier(0.32, 0.72, 0, 1)';
const INLINE_TRANSITION = `grid-template-columns ${POP_MS}ms ${POP_EASE}`;
// Collapsing rows (password field / reset paragraph) use a CSS grid-rows
// trick (0fr <-> 1fr) instead of measured-height JS or framer-motion's
// layout/AnimatePresence — those were tried first and got stuck permanently
// mid-animation in this environment. Pure CSS never has that failure mode:
// worst case it just snaps instead of animating, it can't hang.
const ROW_TRANSITION = `grid-template-rows ${POP_MS}ms ${POP_EASE}`;

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
      <path d="M47.532 24.552c0-1.636-.132-3.2-.378-4.695H24.48v9.098h12.902c-.558 2.94-2.22 5.432-4.728 7.104v5.892h7.656c4.476-4.122 7.062-10.2 7.062-17.4z" fill="#4285F4"/>
      <path d="M24.48 48c6.48 0 11.916-2.148 15.888-5.832l-7.656-5.892c-2.148 1.44-4.896 2.292-8.232 2.292-6.312 0-11.664-4.266-13.578-9.996H3.006v6.084C6.96 42.936 15.144 48 24.48 48z" fill="#34A853"/>
      <path d="M10.902 28.572A14.46 14.46 0 0 1 10.05 24c0-1.584.27-3.12.852-4.572v-6.084H3.006A23.994 23.994 0 0 0 .48 24c0 3.876.924 7.548 2.526 10.656l7.896-6.084z" fill="#FBBC05"/>
      <path d="M24.48 9.432c3.564 0 6.756 1.224 9.27 3.636l6.948-6.948C36.396 2.148 30.96 0 24.48 0 15.144 0 6.96 5.064 3.006 13.344l7.896 6.084c1.914-5.73 7.266-9.996 13.578-9.996z" fill="#EA4335"/>
    </svg>
  );
}

// A row that grows/shrinks its content out of view via CSS grid-rows instead
// of unmounting it, so react-hook-form-registered inputs inside never get
// mounted/unmounted (no duplicate-registration risk, no remount flicker).
function CollapsibleRow({ show, children }) {
  return (
    <div style={{ display: 'grid', gridTemplateRows: show ? '1fr' : '0fr', transition: ROW_TRANSITION }}>
      <div className="overflow-hidden min-h-0">{children}</div>
    </div>
  );
}

// Same idea as CollapsibleRow but horizontal: grows/shrinks a piece of text
// sideways so a neighboring bit of shared text can smoothly slide over to
// make room for it, instead of the whole label doing a full swap.
function CollapsibleInline({ show, children }) {
  return (
    <span style={{ display: 'inline-grid', gridTemplateColumns: show ? '1fr' : '0fr', transition: INLINE_TRANSITION }}>
      <span className="overflow-hidden whitespace-nowrap min-w-0">{children}</span>
    </span>
  );
}

// Rolls between a small, KNOWN set of values (label, icon, short text) — the
// outgoing one rolls out above while the incoming one rolls in from below.
// Deliberately NOT framer-motion's AnimatePresence: every option is always
// mounted (never enters/exits the DOM) and just repositioned via a plain CSS
// `transform: translateY()` that's recomputed from current React state on
// every render, so there's nothing to get stuck mid-animation — worst case
// it snaps instead of animating, it can never show stale content. This
// replaced an AnimatePresence version that intermittently froze showing the
// outgoing value permanently, in this app's own browser, not just automated
// testing. `options` always renders EVERY value invisibly too, so the box is
// permanently sized to the widest one and never resizes mid-transition.
function Swap({ id, options, className = '', align = 'center' }) {
  const currentIndex = options.findIndex(o => o.key === id);
  const justify = align === 'start' ? 'justify-start' : 'justify-center';
  return (
    <span className={`relative inline-grid align-middle overflow-hidden shrink-0 ${className}`}>
      {options.map(o => (
        <span key={`size-${o.key}`} className={`invisible col-start-1 row-start-1 pointer-events-none whitespace-nowrap flex ${justify}`}>
          {o.node}
        </span>
      ))}
      {options.map((o, i) => (
        <span
          key={o.key}
          className={`col-start-1 row-start-1 flex items-center ${justify} whitespace-nowrap`}
          style={{
            // 130%, not 100% — a hidden copy sitting exactly one box-height
            // away touches the visible one edge-to-edge with zero gap, so a
            // glyph's ascender/descender (or just antialiasing) can bleed
            // across the boundary by a pixel. The extra 30% buffer clears it.
            transform: `translateY(${(i - currentIndex) * 130}%)`,
            transition: `transform ${POP_MS}ms ${POP_EASE}`,
          }}
        >
          {o.node}
        </span>
      ))}
    </span>
  );
}

// Entrance stagger. Deliberately restrained now: only the three structural
// blocks (brand mark, wordmark, card) animate in, as a calm fade-up rather than
// a spring "pop" — the inner controls just settle inside the card's reveal
// instead of each firing its own bounce.
const stagger = (i) => ({ animationDelay: `${i * 90}ms` });

// ── Draggable floating theme toggle ─────────────────────────────────────────
// Click toggles the theme; click-and-drag (>6px) picks the button up and moves
// it anywhere on screen. It doesn't stay there: after a short pause it glides
// smoothly back to its home in the top-right corner. A drag never fires the
// toggle (`justDragged` swallows the click that follows pointerup).
//
// Three motion beats, all transform/position transitions (GPU-cheap):
//   • pick-up  — while dragging: lifts (scale + glow ring), follows the cursor 1:1
//   • place    — on drop: springy scale-settle back to rest (overshoot easing)
//   • return   — after RETURN_DELAY: eased glide of left/top back to the corner,
//                then hand position back to the `top-4 right-4` class seamlessly.
const TOGGLE_SIZE = 36;   // w-9/h-9
const HOME_MARGIN = 16;   // matches top-4 / right-4 so the class↔coords swap is pixel-exact
const RETURN_DELAY = 1800;
const RETURN_MS = 620;
const RETURN_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';   // smooth glide, no overshoot (won't fly off-corner)
const SETTLE_EASE = 'cubic-bezier(0.34, 1.56, 0.64, 1)'; // springy scale settle on pick-up/drop
const clampPos = (x, y, m = 8) => ({
  x: Math.min(Math.max(x, m), window.innerWidth - TOGGLE_SIZE - m),
  y: Math.min(Math.max(y, m), window.innerHeight - TOGGLE_SIZE - m),
});
const homePos = () => clampPos(window.innerWidth - TOGGLE_SIZE - HOME_MARGIN, HOME_MARGIN);

function DraggableThemeToggle() {
  const { meta, nextMeta, toggleProps } = useThemeTransition();
  const ThemeIcon = meta.Icon;
  const btnRef = useRef(null);
  const drag = useRef(null);      // { startX, startY, origX, origY, moved }
  const justDragged = useRef(false);
  const returnTimer = useRef(null);
  const [pos, setPos] = useState(null);          // null = resting at the top-right home (class-based)
  const [dragging, setDragging] = useState(false);
  const [returning, setReturning] = useState(false); // gliding home → enables the left/top transition

  useEffect(() => {
    const onResize = () => setPos((p) => (p ? clampPos(p.x, p.y) : p));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  useEffect(() => () => clearTimeout(returnTimer.current), []);

  const scheduleReturn = () => {
    clearTimeout(returnTimer.current);
    returnTimer.current = setTimeout(() => {
      setReturning(true);   // turn on the left/top transition, then move to home so it glides
      setPos(homePos());
    }, RETURN_DELAY);
  };

  const onPointerDown = (e) => {
    clearTimeout(returnTimer.current);
    const r = btnRef.current.getBoundingClientRect();
    // If grabbed mid-glide, freeze at the current visual spot so it doesn't jump.
    if (returning) { setReturning(false); setPos({ x: r.left, y: r.top }); }
    drag.current = { startX: e.clientX, startY: e.clientY, origX: r.left, origY: r.top, moved: false };
    try { btnRef.current.setPointerCapture(e.pointerId); } catch { /* fine without capture */ }
  };
  const onPointerMove = (e) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.startX, dy = e.clientY - d.startY;
    if (!d.moved && Math.hypot(dx, dy) < 6) return; // ignore jitter so a plain click still toggles
    if (!d.moved) setDragging(true);                // first real movement → pick up
    d.moved = true;
    setPos(clampPos(d.origX + dx, d.origY + dy));
  };
  const onPointerUp = () => {
    const d = drag.current;
    drag.current = null;
    if (d?.moved) {
      justDragged.current = true;   // swallow the trailing click
      setDragging(false);           // drop → springy scale-settle (SETTLE_EASE on transform)
      scheduleReturn();             // …and start the countdown to glide home
    }
  };
  const onTransitionEnd = (e) => {
    // Once the glide-home finishes, hand positioning back to the class so the
    // button rests exactly where `top-4 right-4` puts it (survives later resizes).
    if (returning && (e.propertyName === 'left' || e.propertyName === 'top')) {
      setReturning(false);
      setPos(null);
    }
  };

  const style = { touchAction: 'none' };
  if (pos) { style.left = pos.x; style.top = pos.y; }
  style.transition = [
    'background-color 300ms',
    'box-shadow 300ms',
    `transform 320ms ${SETTLE_EASE}`,
    returning && `left ${RETURN_MS}ms ${RETURN_EASE}`,
    returning && `top ${RETURN_MS}ms ${RETURN_EASE}`,
  ].filter(Boolean).join(', ');

  return (
    <button
      ref={btnRef}
      {...toggleProps}
      onClick={(e) => {
        if (justDragged.current) { justDragged.current = false; return; } // drop the click a drag leaves behind
        toggleProps.onClick(e);
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onTransitionEnd={onTransitionEnd}
      className={`fixed z-20 w-9 h-9 rounded-full bg-base-200/60 border border-base-300 flex items-center justify-center text-primary group animate-fade-up ${pos ? '' : 'top-4 right-4'} ${
        dragging
          ? 'scale-125 shadow-xl shadow-primary/40 ring-2 ring-primary/50 bg-base-300/80 cursor-grabbing z-40'
          : 'hover:bg-base-300/60 cursor-grab'
      }`}
      style={style}
      aria-label={`Theme: ${meta.label}. Click to switch to ${nextMeta.label}. Drag to move (it glides back).`}
      title={`${meta.label} — click for ${nextMeta.label} · drag to fling it around`}
    >
      <ThemeIcon size={16} className={`transition-transform duration-300 ${dragging ? 'rotate-[-12deg] scale-110' : 'group-hover:rotate-[18deg] group-active:scale-90'}`} />
    </button>
  );
}

export default function Login() {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, signInAnonymously, resetPassword } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('signin'); // 'signin' | 'signup' | 'reset'
  const [showIntro, setShowIntro] = useState(() => {
    try { return localStorage.getItem(INTRO_SEEN_KEY) !== '1'; } catch { return false; }
  });
  const dismissIntro = () => {
    try { localStorage.setItem(INTRO_SEEN_KEY, '1'); } catch { /* private mode — just proceed */ }
    setShowIntro(false);
  };
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);

  const { register, handleSubmit, watch, formState: { errors }, reset } = useForm();
  const identifierValue = watch('identifier');
  const passwordValue = watch('password');

  const goToTab = (nextTab) => {
    if (nextTab === tab) return;
    setStatus(null);
    reset();
    setTab(nextTab);
  };

  const handleGoogleSignIn = async () => {
    setStatus(null);
    const { error } = await signInWithGoogle();
    if (error) setStatus({ type: 'error', msg: error.message });
  };

  const handleGuest = async () => {
    setStatus(null);
    setGuestLoading(true);
    try {
      const { error } = await signInAnonymously();
      if (error) throw error;
      navigate('/');
    } catch (err) {
      const raw = err.message || '';
      const msg = raw.toLowerCase().includes('anonymous')
        ? 'Guest mode isn’t enabled yet. Enable "Anonymous sign-ins" in Supabase Auth settings.'
        : raw || 'Could not start a guest session.';
      setStatus({ type: 'error', msg });
    } finally {
      setGuestLoading(false);
    }
  };

  const onSubmit = async ({ identifier, password }) => {
    setSubmitting(true);
    setStatus(null);
    const email = toEmail(identifier);
    const isUsername = !identifier.includes('@');
    try {
      if (tab === 'reset') {
        if (isUsername) throw new Error('Password reset needs a real email address.');
        const { error } = await resetPassword(email);
        if (error) throw error;
        setStatus({ type: 'success', msg: 'Check your email for a password reset link.' });
        reset();
        return;
      }
      if (tab === 'signup') {
        const { data, error } = await signUpWithEmail(email, password, isUsername ? { username: identifier.trim() } : undefined);
        if (error) throw error;
        // Email confirmation OFF (or username signup) → we get a session
        // immediately and go straight in. Otherwise prompt to verify.
        if (data?.session) {
          navigate('/');
        } else {
          setStatus({ type: 'success', msg: 'Account created — check your inbox (and spam folder) to verify before signing in.' });
          reset();
        }
        return;
      }
      const { error } = await signInWithEmail(email, password);
      if (error) throw error;
      navigate('/');
    } catch (err) {
      const raw = err.message || '';
      let msg = raw;
      if (raw === 'Invalid login credentials') {
        msg = 'Incorrect username/email or password.';
      } else if (raw.toLowerCase().includes('email not confirmed')) {
        msg = 'Email not confirmed — check your inbox (and spam folder) for the verification link.';
      } else if (raw.toLowerCase().includes('user already registered')) {
        msg = 'That username/email is already taken. Try signing in instead.';
      } else if (raw.toLowerCase().includes('rate limit')) {
        msg = 'Too many attempts — please wait a moment and try again.';
      }
      setStatus({ type: 'error', msg });
    } finally {
      setSubmitting(false);
    }
  };

  const isReset = tab === 'reset';

  return (
    <div className="min-h-screen bg-base-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Pre-login intro (once per device). It's a curtain over the login card:
          on completion it lifts up-and-away with a curved bottom edge, revealing
          the already-settled form beneath. */}
      <AnimatePresence>
        {showIntro && (
          <motion.div
            className="absolute inset-0 z-40 overflow-hidden"
            initial={{ y: 0 }}
            exit={{ y: '-100%', borderBottomLeftRadius: '42%', borderBottomRightRadius: '42%' }}
            transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
          >
            <WelcomeIntro onDone={dismissIntro} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 0%, oklch(from var(--p) l c h / 0.12) 0%, transparent 70%)' }}
      />

      {/* Theme toggle — reachable pre-login too. Click switches (locks while
          the reveal runs — see useThemeTransition); drag repositions it. */}
      <DraggableThemeToggle />

      <div className="w-full max-w-md relative z-10">
        {/* Brand */}
        <div className="flex flex-col items-center mb-8 gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-bloom animate-fade-up" style={stagger(0)}>
            <GraduationCap size={30} className="text-primary-content" />
          </div>
          <div className="text-center animate-fade-up" style={stagger(1)}>
            <h1 className="text-4xl font-bold tracking-tight">
              <span className="text-primary">ultra</span>
              <span className="text-base-content">Grade</span>
            </h1>
            <p className="text-sm text-base-content/40 mt-1.5">Your academic toolkit</p>
          </div>
        </div>

        <div className="glass-card shadow-2xl animate-fade-up" style={stagger(2)}>
          <div className="card-body gap-5 p-8">
            {/* Pill tab switcher — sliding highlight via shared layoutId */}
            <div className="relative flex gap-1 p-1 bg-base-300/40 rounded-2xl">
              {['signin', 'signup'].map(t => (
                <button
                  key={t}
                  className={`relative flex-1 py-1.5 text-xs font-semibold rounded-xl transition-colors active:scale-[0.98] ${
                    tab === t ? 'text-base-100' : 'text-base-content/50 hover:text-base-content'
                  }`}
                  onClick={() => goToTab(t)}
                >
                  {tab === t && (
                    <motion.div
                      layoutId="login-tab-highlight"
                      className="absolute inset-0 bg-primary rounded-xl shadow-sm shadow-primary/20"
                      transition={SPRING}
                    />
                  )}
                  <span className="relative z-10">{t === 'signin' ? 'Sign In' : 'Sign Up'}</span>
                </button>
              ))}
            </div>

            {/* Status banner */}
            {status && (
              <div className={`alert ${status.type === 'success' ? 'alert-success' : 'alert-error'} py-2.5 text-sm rounded-2xl`}>
                {status.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                <span>{status.msg}</span>
              </div>
            )}

            {/* Google OAuth + guest */}
            <div className="flex flex-col gap-2">
              <button
                onClick={handleGoogleSignIn}
                className="btn w-full gap-2 font-medium rounded-2xl bg-base-200/70 border border-base-300 text-base-content hover:bg-base-300/70 hover:border-base-content/20 active:scale-[0.98] transition-all"
              >
                <GoogleIcon />
                Continue with Google
              </button>
              <button onClick={handleGuest} disabled={guestLoading} className="btn btn-ghost w-full gap-2 font-medium rounded-2xl text-base-content/70 hover:bg-base-content/5 active:scale-[0.98] transition-all">
                {guestLoading ? <span className="loading loading-spinner loading-xs" /> : <UserRound size={16} />}
                Continue as guest
              </button>
            </div>

            <div className="divider font-mono text-[10px] uppercase tracking-[0.08em] text-base-content/30 my-0">
              <Swap
                id={isReset ? 'reset' : 'form'}
                options={[
                  { key: 'reset', node: 'reset your password' },
                  {
                    key: 'form',
                    node: (
                      <span className="flex items-center whitespace-nowrap">
                        <span>or&nbsp;</span>
                        <Swap
                          id={tab}
                          align="start"
                          options={[
                            { key: 'signin', node: 'with a username' },
                            { key: 'signup', node: 'create an account' },
                          ]}
                        />
                      </span>
                    ),
                  },
                ]}
              />
            </div>

            {/* One persistent form throughout — only the bits that actually
                differ between signin/signup/reset mount/unmount or collapse,
                so shared elements (fields, button, link) never remount or jump. */}
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
              <CollapsibleRow show={isReset}>
                <p className="text-sm text-base-content/50 pb-3">Enter your email and we'll send a reset link.</p>
              </CollapsibleRow>

              <div>
                <div className="relative group">
                  <div className="flex items-center gap-3 px-4 py-3.5 bg-base-300/25 rounded-t-xl border-b border-base-300 group-focus-within:bg-base-300/40 transition-colors">
                    <Swap
                      id={isReset ? 'mail' : 'at'}
                      className="w-3.5 h-3.5"
                      options={[
                        { key: 'at', node: <AtSign size={14} className="text-base-content/40" /> },
                        { key: 'mail', node: <Mail size={14} className="text-base-content/40" /> },
                      ]}
                    />
                    <div className="relative grow">
                      {/* Native placeholder can't animate — this real text node
                          overlays the empty input and reveals like everything
                          else. Sign-in <-> sign-up specifically don't do a full
                          swap: "username or email" stays put and just slides
                          right as "Choose a " grows in before it, instead of
                          the whole phrase replacing itself. */}
                      {!identifierValue && (
                        <span className="absolute inset-0 flex items-center pointer-events-none text-base-content/40">
                          <Swap
                            id={isReset ? 'reset' : 'form'}
                            options={[
                              { key: 'reset', node: 'Email address' },
                              {
                                key: 'form',
                                node: (
                                  <span className="flex items-center whitespace-nowrap">
                                    <CollapsibleInline show={tab === 'signup'}>
                                      <span className="pr-1">Choose a</span>
                                    </CollapsibleInline>
                                    <span className={tab === 'signin' ? 'first-letter:uppercase' : ''}>username or email</span>
                                  </span>
                                ),
                              },
                            ]}
                          />
                        </span>
                      )}
                      <input
                        type={isReset ? 'email' : 'text'}
                        autoCapitalize="none"
                        autoCorrect="off"
                        spellCheck="false"
                        className="w-full bg-transparent outline-none text-sm"
                        {...register('identifier', { required: isReset ? 'Email is required' : 'Username or email is required' })}
                      />
                    </div>
                  </div>
                  <span className="absolute bottom-0 left-0 h-0.5 bg-primary w-0 transition-all duration-300 group-focus-within:w-full" />
                </div>
                {errors.identifier && <p className="text-error text-xs mt-1">{errors.identifier.message}</p>}
              </div>

              <CollapsibleRow show={!isReset}>
                <div className="pt-3">
                  <div className="relative group">
                    <div className="flex items-center gap-3 px-4 py-3.5 bg-base-300/25 rounded-t-xl border-b border-base-300 group-focus-within:bg-base-300/40 transition-colors">
                      <Lock size={14} className="text-base-content/40 shrink-0" />
                      <div className="relative grow">
                        {/* Same technique as the identifier field above:
                            "password" stays put and "Choose a " grows in
                            before it, instead of the whole word swapping. */}
                        {!passwordValue && (
                          <span className="absolute inset-0 flex items-center pointer-events-none text-base-content/40">
                            <span className="flex items-center whitespace-nowrap">
                              <CollapsibleInline show={tab === 'signup'}>
                                <span className="pr-1">Choose a</span>
                              </CollapsibleInline>
                              <span className={tab === 'signin' ? 'first-letter:uppercase' : ''}>password</span>
                            </span>
                          </span>
                        )}
                        <input
                          type={showPassword ? 'text' : 'password'}
                          className="w-full bg-transparent outline-none text-sm"
                          {...register('password', {
                            required: isReset ? false : 'Password is required',
                            minLength: isReset ? undefined : { value: 6, message: 'At least 6 characters' },
                          })}
                        />
                      </div>
                      <button type="button" onClick={() => setShowPassword(v => !v)} className="text-base-content/40 hover:text-primary transition-colors shrink-0">
                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                    <span className="absolute bottom-0 left-0 h-0.5 bg-primary w-0 transition-all duration-300 group-focus-within:w-full" />
                  </div>
                  {!isReset && errors.password && <p className="text-error text-xs mt-1">{errors.password.message}</p>}
                </div>
              </CollapsibleRow>

              <button type="submit" className="btn btn-primary w-full mt-2 rounded-2xl font-bold shadow-bloom active:scale-[0.98] transition-transform" disabled={submitting}>
                {submitting && <span className="loading loading-spinner loading-xs" />}
                <Swap
                  id={isReset ? 'reset' : tab}
                  options={[
                    { key: 'signin', node: 'Sign In' },
                    { key: 'signup', node: 'Create Account' },
                    { key: 'reset', node: 'Send Reset Link' },
                  ]}
                />
              </button>

              <button
                type="button"
                onClick={() => goToTab(isReset ? 'signin' : 'reset')}
                className="text-xs text-base-content/40 hover:text-primary text-center mt-2 underline decoration-primary/20 underline-offset-4 transition-colors"
              >
                <Swap
                  id={isReset ? 'back' : 'forgot'}
                  options={[
                    { key: 'forgot', node: 'Forgot password?' },
                    { key: 'back', node: 'Back to sign in' },
                  ]}
                />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
