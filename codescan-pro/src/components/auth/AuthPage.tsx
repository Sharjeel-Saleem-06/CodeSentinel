import { useState, useEffect } from 'react';
import { SignIn, SignUp } from '@clerk/clerk-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Code2,
  Sparkles,
  Eye,
  Zap,
  Github,
  Linkedin
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { cn } from '../../utils/cn';
import { TermsOfService } from '../legal/TermsOfService';
import { PrivacyPolicy } from '../legal/PrivacyPolicy';

type AuthMode = 'signin' | 'signup';
type PageView = 'auth' | 'terms' | 'privacy';

const features = [
  {
    icon: Shield,
    title: 'Security Analysis',
    description: 'OWASP Top 10 vulnerability detection',
    color: 'from-rose-500 to-red-600',
    iconBg: 'bg-rose-500/20',
  },
  {
    icon: Code2,
    title: 'Code Quality',
    description: 'Advanced metrics & best practices',
    color: 'from-cyan-500 to-blue-600',
    iconBg: 'bg-cyan-500/20',
  },
  {
    icon: Sparkles,
    title: 'AI-Powered',
    description: 'Intelligent code optimization',
    color: 'from-violet-500 to-purple-600',
    iconBg: 'bg-violet-500/20',
  },
  {
    icon: Eye,
    title: 'Flow Visualization',
    description: 'Interactive control flow graphs',
    color: 'from-emerald-500 to-green-600',
    iconBg: 'bg-emerald-500/20',
  },
];

export function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [pageView, setPageView] = useState<PageView>('auth');
  const { isDark } = useTheme();

  // Hide Clerk branding elements and social buttons after render
  useEffect(() => {
    const hideClerkElements = () => {
      // Hide "Secured by" and "Development mode" badges
      document.querySelectorAll('[name="Secured by"], [name="Development mode"]').forEach(el => {
        if (el instanceof HTMLElement) {
          el.style.display = 'none';
          if (el.parentElement) {
            el.parentElement.style.display = 'none';
            if (el.parentElement.parentElement) {
              el.parentElement.parentElement.style.display = 'none';
            }
          }
        }
      });

      // Hide links to clerk.com
      document.querySelectorAll('a[href*="clerk.com"], a[href*="clerk.dev"]').forEach(el => {
        if (el instanceof HTMLElement) {
          el.style.display = 'none';
          if (el.parentElement) {
            el.parentElement.style.display = 'none';
          }
        }
      });

      // Hide social buttons (Google, etc.)
      document.querySelectorAll('[class*="socialButtons"], [class*="cl-socialButtons"], button[class*="Google"]').forEach(el => {
        if (el instanceof HTMLElement) {
          el.style.display = 'none';
        }
      });

      // Hide any element containing "Continue with Google" text
      document.querySelectorAll('button').forEach(btn => {
        if (btn.textContent?.includes('Continue with Google') || btn.textContent?.includes('Google')) {
          btn.style.display = 'none';
          if (btn.parentElement) {
            btn.parentElement.style.display = 'none';
          }
        }
      });

      // Hide divider rows
      document.querySelectorAll('[class*="dividerRow"], [class*="cl-divider"]').forEach(el => {
        if (el instanceof HTMLElement) {
          el.style.display = 'none';
        }
      });
    };

    // Run after delays to catch dynamically loaded content
    const timer1 = setTimeout(hideClerkElements, 100);
    const timer2 = setTimeout(hideClerkElements, 300);
    const timer3 = setTimeout(hideClerkElements, 600);
    const timer4 = setTimeout(hideClerkElements, 1000);
    const timer5 = setTimeout(hideClerkElements, 2000);

    // Also run on any DOM changes
    const observer = new MutationObserver(hideClerkElements);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearTimeout(timer5);
      observer.disconnect();
    };
  }, [mode]);

  // Show Terms of Service page
  if (pageView === 'terms') {
    return <TermsOfService onBack={() => setPageView('auth')} />;
  }

  // Show Privacy Policy page
  if (pageView === 'privacy') {
    return <PrivacyPolicy onBack={() => setPageView('auth')} />;
  }

  // Enhanced Clerk appearance with better contrast and readability for BOTH themes
  const clerkAppearance = {
    variables: {
      // Theme-aware colors
      colorPrimary: '#8b5cf6',
      colorText: isDark ? '#f1f5f9' : '#0f172a',
      colorTextSecondary: isDark ? '#94a3b8' : '#475569',
      colorBackground: isDark ? 'rgba(15, 23, 42, 0.9)' : '#ffffff',
      colorInputBackground: isDark ? '#1e293b' : '#ffffff',
      colorInputText: isDark ? '#f1f5f9' : '#0f172a',
      colorDanger: '#ef4444',
      colorSuccess: '#22c55e',
      colorWarning: '#f59e0b',
      borderRadius: '0.75rem',
      fontFamily: 'DM Sans, system-ui, sans-serif',
    },
    elements: {
      rootBox: 'w-full',
      card: cn(
        'w-full shadow-2xl rounded-3xl p-8 transition-all',
        isDark
          ? 'bg-slate-900/80 backdrop-blur-xl border border-slate-700/50'
          : 'bg-white border border-slate-200 shadow-xl'
      ),
      headerTitle: cn(
        'text-2xl font-bold tracking-tight mb-2',
        isDark ? 'text-white' : 'text-slate-900'
      ),
      headerSubtitle: cn(
        'text-base font-medium',
        isDark ? 'text-slate-400' : 'text-slate-500'
      ),
      // Form field labels
      formFieldLabel: cn(
        'font-semibold text-sm mb-2',
        isDark ? 'text-slate-300' : 'text-slate-700'
      ),
      // Form field inputs - clean styling
      formFieldInput: cn(
        'w-full rounded-xl transition-all text-base py-3.5 px-4',
        isDark
          ? 'bg-slate-800 text-white placeholder-slate-500 border-2 border-slate-600 focus:border-purple-500'
          : 'bg-white text-slate-900 placeholder-slate-400 border-2 border-slate-200 focus:border-purple-500'
      ),
      formFieldInputShowPasswordButton: cn(
        'transition-colors',
        isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
      ),
      // OTP Code inputs - individual boxes, no container border
      otpCodeFieldInputs: 'gap-2 bg-transparent border-none shadow-none p-0',
      otpCodeFieldInput: cn(
        'w-12 h-14 rounded-xl text-center text-xl font-bold transition-all border-2',
        isDark
          ? 'bg-slate-800 text-white border-slate-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30'
          : 'bg-white text-slate-900 border-slate-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30'
      ),
      // Email badge / identity preview - NO container styling, only text
      identityPreview: 'bg-transparent border-none shadow-none p-0 flex items-center gap-3',
      identityPreviewText: cn(
        'text-base font-semibold px-5 py-3 rounded-xl border-2',
        isDark
          ? 'bg-slate-800 border-slate-600 text-white'
          : 'bg-slate-50 border-slate-200 text-slate-900'
      ),
      identityPreviewEditButton: cn(
        'font-semibold p-2 rounded-lg transition-colors',
        isDark 
          ? 'text-purple-400 hover:text-purple-300 hover:bg-purple-500/10' 
          : 'text-purple-600 hover:text-purple-700 hover:bg-purple-100'
      ),
      // Alert (verification message)
      alert: cn(
        'rounded-xl p-4 border mb-6 flex items-start gap-3',
        isDark
          ? 'bg-amber-950/40 border-amber-700/50 text-amber-200'
          : '!bg-amber-50 !border-amber-200 !text-amber-800'
      ),
      alertText: cn(
        'text-sm font-medium',
        isDark ? 'text-amber-200' : '!text-amber-800'
      ),

      // Primary button - Always purple gradient
      formButtonPrimary:
        'w-full bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 !text-white font-bold shadow-lg shadow-purple-500/25 py-4 text-base rounded-xl transition-all hover:shadow-xl hover:shadow-purple-500/40 hover:scale-[1.02] active:scale-[0.98]',

      // Footer links
      footerActionLink: cn(
        'font-semibold transition-colors',
        isDark ? 'text-purple-400 hover:text-purple-300' : '!text-purple-600 hover:!text-purple-700'
      ),
      footerActionText: cn(
        isDark ? 'text-slate-400' : '!text-slate-600'
      ),
      
      // Resend code link
      formResendCodeLink: cn(
        'font-semibold',
        isDark ? 'text-purple-400 hover:text-purple-300' : '!text-purple-600 hover:!text-purple-700'
      ),

      // Hide social buttons in Clerk (we use custom ones)
      socialButtonsBlockButton: '!hidden',
      socialButtonsProviderIcon: '!hidden',
      socialButtons: '!hidden',
      socialButtonsIconButton: '!hidden',
      dividerRow: '!hidden',

      footer: '!hidden',
      logoBox: '!hidden',
      
      // Internal elements - ensure proper colors
      formFieldLabelRow: cn(
        isDark ? 'text-slate-300' : '!text-slate-700'
      ),
      formFieldHintText: cn(
        isDark ? 'text-slate-500' : '!text-slate-500'
      ),
      formFieldErrorText: cn(
        isDark ? 'text-red-400' : '!text-red-600'
      ),
      formFieldSuccessText: cn(
        isDark ? 'text-green-400' : '!text-green-600'
      ),
    },
    layout: {
      socialButtonsPlacement: 'bottom' as const,
      showOptionalFields: false,
      logoPlacement: 'none' as const,
    },
  };

  return (
    <div className={cn(
      "min-h-screen flex selection:bg-purple-500/30",
      isDark
        ? "bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950"
        : "bg-gradient-to-br from-slate-50 via-white to-purple-50"
    )}>
      {/* Left Panel - Branding & Features */}
      <div className={cn(
        "hidden lg:flex lg:w-1/2 xl:w-2/5 flex-col justify-between p-8 xl:p-12 relative overflow-hidden",
        isDark ? "bg-slate-900/40 backdrop-blur-sm border-r border-slate-800" : "bg-white/40 backdrop-blur-sm border-r border-white/50"
      )}>
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        {/* Floating Orbs */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-purple-600/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px]" />

        {/* Logo & Branding */}
        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 mb-10"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/25 ring-4 ring-purple-600/10">
              <Code2 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className={cn(
                "text-2xl font-bold tracking-tight leading-none",
                isDark ? "text-white" : "text-slate-900"
              )}>
                Code<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500">Sentinel</span>
              </h1>
              <p className={cn(
                "text-sm font-medium mt-1",
                isDark ? "text-slate-400" : "text-slate-500"
              )}>Professional Static Analysis</p>
            </div>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={cn(
              "text-4xl xl:text-5xl font-extrabold mb-6 leading-tight",
              isDark ? "text-white" : "text-slate-900"
            )}
          >
            Secure Your Code with{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500">
              AI-Powered Analysis
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={cn(
              "text-lg leading-relaxed max-w-lg",
              isDark ? "text-slate-300" : "text-slate-600"
            )}
          >
            Join thousands of developers who trust CodeSentinel for comprehensive
            code analysis, security scanning, and AI-powered optimization.
          </motion.p>
        </div>

        {/* Features Grid */}
        <div className="relative z-10 grid grid-cols-2 gap-4 my-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className={cn(
                "p-5 rounded-2xl border backdrop-blur-sm transition-all hover:scale-[1.02]",
                isDark
                  ? "bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/60"
                  : "bg-white/60 border-white/60 shadow-sm hover:shadow-md hover:bg-white/80"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center mb-3 shadow-md",
                feature.color
              )}>
                <feature.icon className="w-5 h-5 text-white" />
              </div>
              <h3 className={cn(
                "font-bold mb-1 text-sm",
                isDark ? "text-white" : "text-slate-900"
              )}>{feature.title}</h3>
              <p className={cn(
                "text-xs leading-relaxed",
                isDark ? "text-slate-400" : "text-slate-600"
              )}>{feature.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Footer - Simplified */}
        <div className="relative z-10 flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <Shield className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <span className={cn(
              "text-sm font-medium",
              isDark ? "text-slate-400" : "text-slate-600"
            )}>Enterprise-grade Security</span>
          </div>
          <div className={cn(
            "w-px h-5",
            isDark ? "bg-slate-700" : "bg-slate-300"
          )} />
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-amber-500/10 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <span className={cn(
              "text-sm font-medium",
              isDark ? "text-slate-400" : "text-slate-600"
            )}>AI-Powered Analysis</span>
          </div>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-8 relative overflow-y-auto">
        <div className="w-full max-w-md my-auto">
          {/* Mobile Logo */}
          <div className="lg:hidden flex flex-col items-center justify-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/25 ring-4 ring-purple-600/10">
              <Code2 className="w-8 h-8 text-white" />
            </div>
            <h1 className={cn(
              "text-2xl font-bold tracking-tight",
              isDark ? "text-white" : "text-slate-900"
            )}>
              Code<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500">Sentinel</span>
            </h1>
          </div>

          {/* Auth Mode Toggle */}
          <div className={cn(
            "flex p-1.5 rounded-2xl mb-8 relative",
            isDark ? "bg-slate-900/50 ring-1 ring-slate-800" : "bg-slate-100/80 ring-1 ring-slate-200"
          )}>
            <button
              onClick={() => setMode('signin')}
              className={cn(
                "flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all relative z-10",
                mode === 'signin'
                  ? "text-white shadow-md shadow-purple-500/20"
                  : isDark ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-900"
              )}
            >
              <span className="relative z-10">Sign In</span>
              {mode === 'signin' && (
                <motion.div
                  layoutId="tab-bg"
                  className="absolute inset-0 bg-gradient-to-r from-purple-600 to-fuchsia-600 rounded-xl"
                />
              )}
            </button>
            <button
              onClick={() => setMode('signup')}
              className={cn(
                "flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all relative z-10",
                mode === 'signup'
                  ? "text-white shadow-md shadow-purple-500/20"
                  : isDark ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-900"
              )}
            >
              <span className="relative z-10">Sign Up</span>
              {mode === 'signup' && (
                <motion.div
                  layoutId="tab-bg"
                  className="absolute inset-0 bg-gradient-to-r from-purple-600 to-fuchsia-600 rounded-xl"
                />
              )}
            </button>
          </div>

          {/* Clerk Auth Components */}
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="clerk-auth-wrapper min-h-[400px]"
            >
              {mode === 'signin' ? (
                <SignIn
                  routing="hash"
                  signUpUrl="#signup"
                  appearance={clerkAppearance}
                />
              ) : (
                <SignUp
                  routing="hash"
                  signInUrl="#signin"
                  appearance={clerkAppearance}
                />
              )}
            </motion.div>
          </AnimatePresence>

          {/* Custom Social Buttons - More prominent */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-8 grid grid-cols-2 gap-4"
          >
            <a
              href="https://github.com/Sharjeel-Saleem-06/CodeSentinel"
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "group flex items-center justify-center gap-3 p-4 rounded-xl border transition-all duration-300",
                isDark
                  ? "bg-slate-900/40 border-slate-700 hover:border-slate-500 hover:bg-slate-800 text-white"
                  : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700"
              )}
            >
              <Github className="w-5 h-5 transition-transform group-hover:scale-110" />
              <span className="font-semibold">GitHub</span>
            </a>
            <a
              href="https://www.linkedin.com/in/msharjeelsaleem/"
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "group flex items-center justify-center gap-3 p-4 rounded-xl border transition-all duration-300",
                isDark
                  ? "bg-blue-900/20 border-blue-900/50 hover:border-blue-700/50 hover:bg-blue-900/30 text-blue-400"
                  : "bg-blue-50 border-blue-100 hover:border-blue-200 hover:bg-blue-100 text-blue-700"
              )}
            >
              <Linkedin className="w-5 h-5 transition-transform group-hover:scale-110" />
              <span className="font-semibold">LinkedIn</span>
            </a>
          </motion.div>

          {/* Additional Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 text-center"
          >
            <p className={cn(
              "text-xs leading-relaxed",
              isDark ? "text-slate-500" : "text-slate-400"
            )}>
              By continuing, you agree to our{' '}
              <button
                onClick={() => setPageView('terms')}
                className={cn(
                  "font-medium underline-offset-2 hover:underline transition-colors",
                  isDark ? "text-slate-400 hover:text-white" : "text-slate-600 hover:text-slate-900"
                )}
              >
                Terms of Service
              </button>
              {' '}and{' '}
              <button
                onClick={() => setPageView('privacy')}
                className={cn(
                  "font-medium underline-offset-2 hover:underline transition-colors",
                  isDark ? "text-slate-400 hover:text-white" : "text-slate-600 hover:text-slate-900"
                )}
              >
                Privacy Policy
              </button>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default AuthPage;
