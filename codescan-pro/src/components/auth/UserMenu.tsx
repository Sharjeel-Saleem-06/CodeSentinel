import { useUser, useClerk } from '@clerk/clerk-react';
import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { cn } from '../../utils/cn';

export function UserMenu() {
  const { user, isLoaded } = useUser();
  const { openUserProfile } = useClerk();
  const { isDark } = useTheme();

  if (!isLoaded) {
    return (
      <div className={cn(
        "w-8 h-8 rounded-full animate-pulse",
        isDark ? "bg-slate-700" : "bg-gray-200"
      )} />
    );
  }

  if (!user) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center gap-3"
    >
      {/* User Info */}
      <div className="hidden sm:flex flex-col items-end">
        <span className={cn(
          "text-sm font-medium",
          isDark ? "text-white" : "text-gray-900"
        )}>
          {user.firstName || user.username || 'User'}
        </span>
        <span className={cn(
          "text-xs",
          isDark ? "text-slate-400" : "text-gray-500"
        )}>
          {user.primaryEmailAddress?.emailAddress}
        </span>
      </div>

      {/* Custom Avatar Button to open Profile directly */}
      <button
        onClick={() => openUserProfile()}
        className={cn(
          "relative w-10 h-10 rounded-full overflow-hidden transition-all duration-300",
          "ring-2 ring-purple-500/50 hover:ring-purple-500",
          "focus:outline-none focus:ring-offset-2",
          isDark ? "focus:ring-offset-slate-900" : "focus:ring-offset-white"
        )}
      >
        <img
          src={user.imageUrl}
          alt="Profile"
          className="w-full h-full object-cover"
        />
      </button>
    </motion.div>
  );
}

export default UserMenu;

