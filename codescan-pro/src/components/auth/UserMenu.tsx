import { UserButton, useUser } from '@clerk/clerk-react';
import { motion } from 'framer-motion';
import { LogOut, Settings, User, Crown } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { cn } from '../../utils/cn';

export function UserMenu() {
  const { user, isLoaded } = useUser();
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

      {/* Clerk User Button */}
      <UserButton 
        afterSignOutUrl="/"
        appearance={{
          elements: {
            avatarBox: 'w-9 h-9 ring-2 ring-purple-500/50',
            userButtonPopoverCard: cn(
              'border shadow-xl',
              isDark 
                ? 'bg-slate-900 border-slate-700' 
                : 'bg-white border-gray-200'
            ),
            userButtonPopoverActionButton: cn(
              'transition-colors',
              isDark 
                ? 'text-slate-300 hover:bg-slate-800' 
                : 'text-gray-700 hover:bg-gray-100'
            ),
            userButtonPopoverActionButtonText: cn(
              isDark ? 'text-slate-300' : 'text-gray-700'
            ),
            userButtonPopoverActionButtonIcon: cn(
              isDark ? 'text-slate-400' : 'text-gray-500'
            ),
            userButtonPopoverFooter: 'hidden',
          },
        }}
      />
    </motion.div>
  );
}

export default UserMenu;

