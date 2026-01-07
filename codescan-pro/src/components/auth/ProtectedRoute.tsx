import { ReactNode } from 'react';
import { SignedIn, SignedOut, useAuth } from '@clerk/clerk-react';
import { motion } from 'framer-motion';
import { Code2 } from 'lucide-react';
import { AuthPage } from './AuthPage';
import { useTheme } from '../../context/ThemeContext';
import { cn } from '../../utils/cn';

interface ProtectedRouteProps {
  children: ReactNode;
}

// Loading screen component while Clerk is initializing
function LoadingScreen() {
  const { isDark } = useTheme();
  
  return (
    <div className={cn(
      "min-h-screen flex items-center justify-center",
      isDark 
        ? "bg-gradient-to-br from-slate-950 via-slate-900 to-purple-950" 
        : "bg-gradient-to-br from-gray-50 via-white to-purple-50"
    )}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        {/* Logo */}
        <motion.div
          animate={{ 
            scale: [1, 1.05, 1],
            rotate: [0, 5, -5, 0]
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-purple-600 to-fuchsia-600 flex items-center justify-center shadow-2xl shadow-purple-500/30"
        >
          <Code2 className="w-10 h-10 text-white" />
        </motion.div>
        
        {/* Title */}
        <h1 className={cn(
          "text-2xl font-bold mb-2",
          isDark ? "text-white" : "text-gray-900"
        )}>
          Code<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-fuchsia-500">Sentinel</span>
        </h1>
        
        {/* Loading spinner */}
        <div className="flex items-center justify-center gap-2 mt-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className={cn(
              "w-5 h-5 border-2 rounded-full",
              isDark 
                ? "border-purple-500/30 border-t-purple-500" 
                : "border-purple-300 border-t-purple-600"
            )}
          />
          <span className={cn(
            "text-sm",
            isDark ? "text-slate-400" : "text-gray-500"
          )}>
            Initializing...
          </span>
        </div>
      </motion.div>
    </div>
  );
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isLoaded } = useAuth();
  
  // Show loading screen while Clerk is initializing
  if (!isLoaded) {
    return <LoadingScreen />;
  }
  
  return (
    <>
      <SignedIn>
        {children}
      </SignedIn>
      <SignedOut>
        <AuthPage />
      </SignedOut>
    </>
  );
}

export default ProtectedRoute;

