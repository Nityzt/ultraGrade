import { LogOut, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

export default function UserMenu() {
  const { user, signOut } = useAuth();
  if (!user) return null;

  const name = user.user_metadata?.full_name || user.user_metadata?.name || '';
  const email = user.email || '';
  const avatarUrl = user.user_metadata?.avatar_url;
  const initials = name
    ? name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : email[0]?.toUpperCase() || 'U';

  return (
    <div className="flex items-center gap-2 px-2 py-2">
      {/* Avatar */}
      <div className="avatar placeholder flex-shrink-0">
        {avatarUrl ? (
          <div className="w-8 h-8 rounded-full overflow-hidden">
            <img src={avatarUrl} alt={name || email} referrerPolicy="no-referrer" />
          </div>
        ) : (
          <div className="bg-primary/20 text-primary rounded-full w-8 h-8 flex items-center justify-center">
            <span className="text-xs font-semibold">{initials}</span>
          </div>
        )}
      </div>

      {/* Name + email */}
      <div className="flex-1 min-w-0">
        {name && <p className="text-xs font-medium text-base-content truncate">{name}</p>}
        <p className="text-xs text-base-content/50 truncate">{email}</p>
      </div>

      {/* Sign out */}
      <button
        onClick={signOut}
        className="btn btn-ghost btn-xs btn-circle text-base-content/50 hover:text-error"
        title="Sign out"
      >
        <LogOut size={14} />
      </button>
    </div>
  );
}
