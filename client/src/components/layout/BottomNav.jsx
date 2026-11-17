import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, Globe, MessageCircle, Link2, UserRound } from 'lucide-react';
import { SPRING } from '../../lib/motion.js';

function NavItem({ to, icon: Icon, label }) {
  return (
    <NavLink
      to={to}
      end={to === '/' || to === '/demo'}
      className={({ isActive }) =>
        `group pressable relative flex flex-col items-center justify-center flex-1 h-full transition-colors duration-200 ${
          isActive ? 'text-primary' : 'text-base-content/45 hover:text-base-content/80'
        }`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            // The pill morphs between tabs — an interruptible spring. layoutId
            // shares one element across NavItems, so framer animates position.
            <motion.span
              layoutId="bottomnav-active"
              transition={SPRING}
              className="absolute top-0 w-8 h-1 rounded-b-full bg-primary shadow-bloom"
            />
          )}
          <Icon
            size={19}
            className="mb-1 transition-transform duration-200 group-active:scale-90"
            style={isActive ? { filter: 'drop-shadow(0 0 6px hsl(var(--p) / 0.55))' } : undefined}
          />
          <span className="text-[10px] font-semibold tracking-wide">{label}</span>
        </>
      )}
    </NavLink>
  );
}

export default function BottomNav({ demo = false }) {

  if (demo) return <nav aria-label="Demo navigation" className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-stretch h-20 pb-safe pl-safe pr-safe px-2 no-print demo-bottom-nav">
    <NavItem to="/demo" icon={LayoutDashboard} label="Home" />
    <NavItem to="/demo/ask" icon={MessageCircle} label="Ask" />
    <NavItem to="/demo/life" icon={Globe} label="Life" />
    <NavItem to="/demo/connections" icon={Link2} label="Connect" />
    <NavItem to="/demo/profile" icon={UserRound} label="Profile" />
  </nav>;

  return (
    <nav aria-label="Primary navigation" className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-stretch h-20 pb-safe pl-safe pr-safe px-2 no-print app-bottom-nav">
      <NavItem to="/" icon={LayoutDashboard} label="Home" />
      <NavItem to="/ask" icon={MessageCircle} label="Ask" />
      <NavItem to="/life" icon={Globe} label="Life" />
      <NavItem to="/connections" icon={Link2} label="Connect" />
      <NavItem to="/profile" icon={UserRound} label="Profile" />
    </nav>
  );
}
