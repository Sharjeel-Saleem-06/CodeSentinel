import { UserButton, useUser } from '@clerk/clerk-react';
import { motion } from 'framer-motion';
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

      {/* Clerk User Button with enhanced styling for dark/light mode */}
      <UserButton 
        afterSignOutUrl="/"
        appearance={{
          elements: {
            // Avatar styling
            avatarBox: 'w-9 h-9 ring-2 ring-purple-500/50',
            
            // Popover card - the main dropdown container
            userButtonPopoverCard: cn(
              'border-2 shadow-2xl rounded-xl overflow-hidden',
              isDark 
                ? '!bg-slate-900 !border-slate-600' 
                : '!bg-white !border-gray-200'
            ),
            
            // User preview section at top of dropdown
            userPreview: cn(
              'p-4',
              isDark ? '!bg-slate-800/50' : '!bg-gray-50'
            ),
            userPreviewMainIdentifier: cn(
              'font-semibold text-base',
              isDark ? '!text-white' : '!text-gray-900'
            ),
            userPreviewSecondaryIdentifier: cn(
              'text-sm',
              isDark ? '!text-slate-300' : '!text-gray-600'
            ),
            
            // Action buttons (Manage account, Sign out)
            userButtonPopoverActionButton: cn(
              'transition-all rounded-lg mx-2 my-1',
              isDark 
                ? '!text-white hover:!bg-slate-700' 
                : '!text-gray-800 hover:!bg-gray-100'
            ),
            userButtonPopoverActionButtonText: cn(
              'font-medium',
              isDark ? '!text-white' : '!text-gray-800'
            ),
            userButtonPopoverActionButtonIcon: cn(
              isDark ? '!text-slate-300' : '!text-gray-600'
            ),
            
            // Footer with Clerk branding - hide it
            userButtonPopoverFooter: '!hidden',
            footer: '!hidden',
            badge: '!hidden',
            
            // Menu items
            userButtonPopoverActions: cn(
              'py-2',
              isDark ? '!bg-slate-900' : '!bg-white'
            ),
          },
        }}
      />
    </motion.div>
  );
}

export default UserMenu;

