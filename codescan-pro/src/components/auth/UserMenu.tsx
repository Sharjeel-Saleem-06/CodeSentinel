import { useUser, useClerk } from '@clerk/clerk-react';
import { dark } from '@clerk/themes';
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

  // Configure appearance for Clerk's built-in modal
  const handleOpenProfile = () => {
    openUserProfile({
      appearance: {
        baseTheme: isDark ? dark : undefined,
        variables: isDark ? {
          colorPrimary: '#8b5cf6',
          colorBackground: '#0f172a',
          colorInputBackground: '#1e293b',
          colorInputText: '#ffffff',
          colorText: '#e2e8f0',
          colorTextSecondary: '#cbd5e1',
          colorNeutral: '#94a3b8',
        } : {
          colorPrimary: '#7c3aed',
          colorBackground: '#ffffff',
          colorInputBackground: '#ffffff',
          colorInputText: '#0f172a',
          colorText: '#0f172a',
          colorTextSecondary: '#475569',
          colorNeutral: '#64748b',
        },
        elements: {
          rootBox: 'w-full',
          card: 'shadow-2xl rounded-2xl',
          modalBackdrop: 'backdrop-blur-sm',

          // Navbar/Sidebar
          navbar: isDark ? '' : 'bg-slate-50',
          navbarButton: cn(
            'transition-all',
            isDark
              ? 'text-slate-300 hover:text-white data-[active]:bg-slate-700 data-[active]:text-white'
              : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100 data-[active]:bg-purple-50 data-[active]:text-purple-600'
          ),
          navbarButtonIcon: isDark ? 'text-slate-400' : 'text-slate-600',

          // Headers and labels - CRITICAL FOR READABILITY
          formFieldLabel: isDark
            ? 'text-slate-300 font-medium'
            : 'text-slate-700 font-medium',
          formFieldLabelRow: isDark ? 'text-slate-300' : 'text-slate-700',

          // Profile section titles
          profileSectionTitle: isDark
            ? 'text-white font-semibold'
            : 'text-slate-900 font-semibold',
          profileSectionPrimaryButton: isDark
            ? 'text-purple-400'
            : 'text-purple-600',

          // General text
          text: isDark ? 'text-slate-200' : 'text-slate-900',
          headerTitle: isDark ? 'text-white' : 'text-slate-900',
          headerSubtitle: isDark ? 'text-slate-400' : 'text-slate-600',

          // Input fields
          formFieldInput: cn(
            isDark
              ? 'bg-slate-800 border-slate-600 text-white'
              : 'bg-white border-slate-200 text-slate-900'
          ),

          // Buttons
          formButtonPrimary:
            'bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white font-semibold shadow-lg shadow-purple-500/25',

          // Hide branding
          footer: '!hidden',
          footerAction: '!hidden',
          logoBox: '!hidden',
          logoImage: '!hidden',
        },
        layout: {
          logoPlacement: 'none' as const,
        },
      }
    });
  };

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

      {/* Avatar Button */}
      <button
        onClick={handleOpenProfile}
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
