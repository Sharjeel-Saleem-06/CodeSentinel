import { useState, useEffect } from 'react';
import { SignIn, SignUp } from '@clerk/clerk-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  Code2, 
  Sparkles, 
  Lock, 
  Eye, 
  Zap,
  CheckCircle2,
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

const benefits = [
  'Multi-language support (15+ languages)',
  'Real-time code analysis',
  'Custom rule creation with AI',
  'Senior architect-level reviews',
  'Export reports in multiple formats',
];

export function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [pageView, setPageView] = useState<PageView>('auth');
  const { isDark } = useTheme();

  // Show Terms of Service page
  if (pageView === 'terms') {
    return <TermsOfService onBack={() => setPageView('auth')} />;
  }

  // Show Privacy Policy page
  if (pageView === 'privacy') {
    return <PrivacyPolicy onBack={() => setPageView('auth')} />;
  }

  // Hide Clerk branding elements after render
  useEffect(() => {
    const hideClerkBranding = () => {
      // Target specific elements by their name attribute
      document.querySelectorAll('[name="Secured by"], [name="Development mode"]').forEach(el => {
        if (el instanceof HTMLElement && el.parentElement && el.parentElement.parentElement) {
          // Hide the grandparent container that holds both the badge and text
          el.parentElement.parentElement.style.display = 'none';
        }
      });
      
      // Also hide links to clerk.com
      document.querySelectorAll('a[href*="clerk.com"], a[href*="clerk.dev"]').forEach(el => {
        if (el instanceof HTMLElement && el.parentElement) {
          el.parentElement.style.display = 'none';
        }
      });
    };

    // Run after delays to catch dynamically loaded content
    const timer1 = setTimeout(hideClerkBranding, 100);
    const timer2 = setTimeout(hideClerkBranding, 500);
    const timer3 = setTimeout(hideClerkBranding, 1000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [mode]);

  // Enhanced Clerk appearance with better contrast and readability
  const clerkAppearance = {
    elements: {
      rootBox: 'w-full',
      card: cn(
        'w-full shadow-2xl border-0 rounded-2xl',
        isDark 
          ? 'bg-slate-900/95 backdrop-blur-xl' 
          : 'bg-white'
      ),
      headerTitle: cn(
        'text-xl font-bold',
        isDark ? 'text-white' : 'text-gray-900'
      ),
      headerSubtitle: cn(
        'text-base',
        isDark ? 'text-slate-300' : 'text-gray-600'
      ),
      socialButtonsBlockButton: cn(
        'border-2 transition-all font-medium text-base py-3',
        isDark 
          ? 'bg-slate-800/80 border-slate-600 text-white hover:bg-slate-700 hover:border-purple-500' 
          : 'bg-gray-50 border-gray-200 text-gray-900 hover:bg-gray-100 hover:border-purple-400'
      ),
      socialButtonsBlockButtonText: cn(
        'font-medium text-base',
        isDark ? 'text-white' : 'text-gray-900'
      ),
      formFieldLabel: cn(
        'font-medium text-sm',
        isDark ? 'text-slate-200' : 'text-gray-700'
      ),
      formFieldInput: cn(
        'border-2 rounded-xl transition-all text-base py-3 px-4',
        isDark 
          ? 'bg-slate-800/80 border-slate-600 text-white placeholder-slate-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20' 
          : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20'
      ),
      formButtonPrimary: 
        'bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white font-semibold shadow-lg shadow-purple-500/30 py-3 text-base rounded-xl transition-all hover:shadow-xl hover:shadow-purple-500/40',
      footerActionLink: 'text-purple-400 hover:text-purple-300 font-medium',
      footerActionText: cn(
        isDark ? 'text-slate-300' : 'text-gray-600'
      ),
      identityPreviewText: cn(
        'font-medium',
        isDark ? 'text-white' : 'text-gray-900'
      ),
      identityPreviewEditButton: 'text-purple-400 hover:text-purple-300',
      dividerLine: cn(
        isDark ? 'bg-slate-600' : 'bg-gray-300'
      ),
      dividerText: cn(
        'text-sm font-medium',
        isDark ? 'text-slate-300' : 'text-gray-500'
      ),
      formFieldInputShowPasswordButton: cn(
        isDark ? 'text-slate-300 hover:text-white' : 'text-gray-500 hover:text-gray-700'
      ),
      otpCodeFieldInput: cn(
        'border-2 rounded-lg',
        isDark 
          ? 'bg-slate-800 border-slate-600 text-white' 
          : 'bg-gray-50 border-gray-200 text-gray-900'
      ),
      formResendCodeLink: 'text-purple-400 hover:text-purple-300',
      alertText: cn(
        isDark ? 'text-slate-200' : 'text-gray-700'
      ),
      // Hide development mode and powered by badges
      footer: '!hidden',
      footerAction: '!hidden',
      badge: '!hidden',
      internal: '!hidden',
      logoBox: '!hidden',
      logoImage: '!hidden',
      // Hide the powered by footer completely
      cardFooter: '!hidden',
      footerPages: '!hidden',
      footerPagesLink: '!hidden',
      // Additional selectors for Clerk branding
      poweredByClerk: '!hidden',
      clerkBadge: '!hidden',
    },
    layout: {
      socialButtonsPlacement: 'top' as const,
      showOptionalFields: false,
      logoPlacement: 'none' as const,
    },
  };

  return (
    <div className={cn(
      "min-h-screen flex",
      isDark 
        ? "bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950" 
        : "bg-gradient-to-br from-slate-50 via-white to-purple-50"
    )}>
      {/* Left Panel - Branding & Features */}
      <div className={cn(
        "hidden lg:flex lg:w-1/2 xl:w-2/5 flex-col justify-between p-8 xl:p-12 relative overflow-hidden",
        isDark ? "bg-slate-900/60 backdrop-blur-sm" : "bg-white/60 backdrop-blur-sm"
      )}>
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-[0.03]">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        {/* Floating Orbs - More subtle */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-purple-600/15 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-fuchsia-600/10 rounded-full blur-2xl" />

        {/* Logo & Branding */}
        <div className="relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 mb-8"
          >
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-fuchsia-600 flex items-center justify-center shadow-xl shadow-purple-500/30">
              <Code2 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className={cn(
                "text-2xl font-bold tracking-tight",
                isDark ? "text-white" : "text-gray-900"
              )}>
                Code<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-fuchsia-400">Sentinel</span>
              </h1>
              <p className={cn(
                "text-sm font-medium",
                isDark ? "text-slate-400" : "text-gray-500"
              )}>Professional Static Analysis</p>
            </div>
          </motion.div>

          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={cn(
              "text-3xl xl:text-4xl font-bold mb-4 leading-tight",
              isDark ? "text-white" : "text-gray-900"
            )}
          >
            Secure Your Code with{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-fuchsia-400 to-pink-400">
              AI-Powered Analysis
            </span>
          </motion.h2>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={cn(
              "text-lg leading-relaxed",
              isDark ? "text-slate-300" : "text-gray-600"
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
                  ? "bg-slate-800/40 border-slate-700/50 hover:border-slate-600" 
                  : "bg-white/80 border-gray-200 hover:border-gray-300 shadow-sm"
              )}
            >
              <div className={cn(
                "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center mb-3 shadow-lg",
                feature.color
              )}>
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className={cn(
                "font-bold mb-1 text-base",
                isDark ? "text-white" : "text-gray-900"
              )}>{feature.title}</h3>
              <p className={cn(
                "text-sm leading-relaxed",
                isDark ? "text-slate-400" : "text-gray-600"
              )}>{feature.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Benefits List */}
        <div className="relative z-10">
          <h3 className={cn(
            "text-xs font-bold uppercase tracking-widest mb-4",
            isDark ? "text-slate-500" : "text-gray-400"
          )}>What you get</h3>
          <ul className="space-y-3">
            {benefits.map((benefit, index) => (
              <motion.li
                key={benefit}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                className="flex items-center gap-3"
              >
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <span className={cn(
                  "text-sm font-medium",
                  isDark ? "text-slate-300" : "text-gray-700"
                )}>{benefit}</span>
              </motion.li>
            ))}
          </ul>
        </div>

        {/* Footer - Simplified */}
        <div className="relative z-10 flex items-center gap-6 pt-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <span className={cn(
              "text-sm font-medium",
              isDark ? "text-slate-400" : "text-gray-500"
            )}>Enterprise-grade Security</span>
          </div>
          <div className={cn(
            "w-px h-5",
            isDark ? "bg-slate-700" : "bg-gray-300"
          )} />
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <span className={cn(
              "text-sm font-medium",
              isDark ? "text-slate-400" : "text-gray-500"
            )}>AI-Powered Analysis</span>
          </div>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-fuchsia-600 flex items-center justify-center shadow-xl shadow-purple-500/30">
              <Code2 className="w-7 h-7 text-white" />
            </div>
            <h1 className={cn(
              "text-2xl font-bold tracking-tight",
              isDark ? "text-white" : "text-gray-900"
            )}>
              Code<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-fuchsia-400">Sentinel</span>
            </h1>
          </div>

          {/* Auth Mode Toggle */}
          <div className={cn(
            "flex p-1.5 rounded-2xl mb-6",
            isDark ? "bg-slate-800/60" : "bg-gray-100"
          )}>
            <button
              onClick={() => setMode('signin')}
              className={cn(
                "flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all",
                mode === 'signin'
                  ? "bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-lg shadow-purple-500/30"
                  : isDark ? "text-slate-400 hover:text-white" : "text-gray-500 hover:text-gray-900"
              )}
            >
              Sign In
            </button>
            <button
              onClick={() => setMode('signup')}
              className={cn(
                "flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all",
                mode === 'signup'
                  ? "bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-lg shadow-purple-500/30"
                  : isDark ? "text-slate-400 hover:text-white" : "text-gray-500 hover:text-gray-900"
              )}
            >
              Sign Up
            </button>
          </div>

          {/* Clerk Auth Components - wrapped to hide footer */}
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="clerk-auth-wrapper"
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

          {/* Additional Info */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6 text-center"
          >
            <p className={cn(
              "text-sm",
              isDark ? "text-slate-400" : "text-gray-500"
            )}>
              By continuing, you agree to our{' '}
              <button 
                onClick={() => setPageView('terms')} 
                className="text-purple-400 hover:text-purple-300 font-medium underline-offset-2 hover:underline"
              >
                Terms of Service
              </button>
              {' '}and{' '}
              <button 
                onClick={() => setPageView('privacy')} 
                className="text-purple-400 hover:text-purple-300 font-medium underline-offset-2 hover:underline"
              >
                Privacy Policy
              </button>
            </p>
          </motion.div>

          {/* Social Links - GitHub and LinkedIn */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-8 flex items-center justify-center gap-4"
          >
            <a 
              href="https://github.com/Sharjeel-Saleem-06/CodeSentinel" 
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "p-3 rounded-xl transition-all flex items-center gap-2",
                isDark 
                  ? "text-slate-400 hover:text-white hover:bg-slate-800/80 border border-slate-700/50 hover:border-slate-600" 
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-100 border border-gray-200 hover:border-gray-300"
              )}
              title="View on GitHub"
            >
              <Github className="w-5 h-5" />
              <span className="text-sm font-medium">GitHub</span>
            </a>
            <a 
              href="https://www.linkedin.com/in/msharjeelsaleem/" 
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "p-3 rounded-xl transition-all flex items-center gap-2",
                isDark 
                  ? "text-slate-400 hover:text-white hover:bg-slate-800/80 border border-slate-700/50 hover:border-slate-600" 
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-100 border border-gray-200 hover:border-gray-300"
              )}
              title="Connect on LinkedIn"
            >
              <Linkedin className="w-5 h-5" />
              <span className="text-sm font-medium">LinkedIn</span>
            </a>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

export default AuthPage;
