import { ClerkProvider, useAuth, useUser } from '@clerk/clerk-react';
import { createContext, useContext, ReactNode } from 'react';

// Get Clerk publishable key from environment
const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!CLERK_PUBLISHABLE_KEY) {
  console.warn('Missing Clerk Publishable Key - Authentication will be disabled');
}

// Auth context type
interface AuthContextType {
  isLoaded: boolean;
  isSignedIn: boolean;
  userId: string | null;
  user: {
    firstName: string | null;
    lastName: string | null;
    fullName: string | null;
    email: string | null;
    imageUrl: string | null;
  } | null;
}

const AuthContext = createContext<AuthContextType>({
  isLoaded: false,
  isSignedIn: false,
  userId: null,
  user: null,
});

// Custom hook to use auth context
export const useAuthContext = () => useContext(AuthContext);

// Auth provider wrapper component
function AuthContextProvider({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const { user } = useUser();

  const value: AuthContextType = {
    isLoaded,
    isSignedIn: isSignedIn ?? false,
    userId: userId ?? null,
    user: user ? {
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      email: user.primaryEmailAddress?.emailAddress ?? null,
      imageUrl: user.imageUrl,
    } : null,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Main Auth Provider with Clerk
export function AuthProvider({ children }: { children: ReactNode }) {
  // If no Clerk key, render children without auth (development mode)
  if (!CLERK_PUBLISHABLE_KEY) {
    return (
      <AuthContext.Provider value={{
        isLoaded: true,
        isSignedIn: false,
        userId: null,
        user: null,
      }}>
        {children}
      </AuthContext.Provider>
    );
  }

  return (
    <ClerkProvider 
      publishableKey={CLERK_PUBLISHABLE_KEY}
      appearance={{
        variables: {
          colorPrimary: '#8b5cf6',
          colorBackground: '#0f172a',
          colorText: '#f8fafc',
          colorInputBackground: '#1e293b',
          colorInputText: '#f8fafc',
          borderRadius: '0.75rem',
        },
        elements: {
          formButtonPrimary: 
            'bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white font-medium',
          card: 'bg-slate-900 border border-slate-700/50 shadow-2xl',
          headerTitle: 'text-white',
          headerSubtitle: 'text-slate-400',
          socialButtonsBlockButton: 
            'bg-slate-800 border border-slate-700 text-white hover:bg-slate-700',
          formFieldLabel: 'text-slate-300',
          formFieldInput: 
            'bg-slate-800 border-slate-700 text-white placeholder-slate-500',
          footerActionLink: 'text-purple-400 hover:text-purple-300',
          identityPreviewText: 'text-white',
          identityPreviewEditButton: 'text-purple-400',
        },
      }}
    >
      <AuthContextProvider>
        {children}
      </AuthContextProvider>
    </ClerkProvider>
  );
}

export { useAuth, useUser } from '@clerk/clerk-react';

