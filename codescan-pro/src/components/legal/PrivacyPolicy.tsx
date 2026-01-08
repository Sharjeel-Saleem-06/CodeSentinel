
import { ArrowLeft, Shield, Lock, Eye, Database, Globe, Mail, Code2, Server, Cookie } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { cn } from '../../utils/cn';

interface PrivacyPolicyProps {
  onBack: () => void;
}

export function PrivacyPolicy({ onBack }: PrivacyPolicyProps) {
  const { isDark } = useTheme();
  console.log('PrivacyPolicy Rendering');

  const sections = [
    {
      icon: Eye,
      title: '1. Information We Collect',
      content: `CodeSentinel collects the following types of information:

**Account Information:**
• Email address (through Clerk authentication)
• Name (if provided during signup)
• Profile picture (if using social login)
• Authentication tokens

**Code Analysis Data:**
• Source code submitted for analysis (processed in real-time)
• Programming language of submitted code
• Analysis results and metrics
• Custom rules you create

**Usage Data:**
• Features and tools you use
• Analysis frequency and patterns
• Error logs for debugging purposes
• Browser type and version

**Technical Data:**
• IP address (anonymized)
• Device information
• Operating system`
    },
    {
      icon: Database,
      title: '2. How We Use Your Information',
      content: `We use the collected information for:

**Service Delivery:**
• Processing and analyzing your code
• Generating security reports and recommendations
• Providing AI-powered code reviews
• Creating control flow visualizations

**Service Improvement:**
• Improving our analysis algorithms
• Enhancing user experience
• Fixing bugs and technical issues
• Developing new features

**Communication:**
• Responding to your inquiries
• Sending important service updates
• Notifying you of security issues (if applicable)

We do NOT use your code for:
• Training AI models
• Sharing with third parties
• Marketing purposes
• Any purpose other than providing the analysis service`
    },
    {
      icon: Server,
      title: '3. Data Processing and Storage',
      content: `**Code Processing:**
• Your code is processed in real-time when you submit it for analysis
• Code is NOT permanently stored on our servers
• Analysis results may be cached temporarily (up to 24 hours) for performance
• You can request deletion of any cached data at any time

**Third-Party Services:**
We use the following third-party services:

• **Clerk** - Authentication and user management
  - Handles login, signup, and session management
  - Stores account credentials securely
  - Privacy: clerk.com/privacy

• **Groq** - AI inference for code analysis
  - Processes code for AI-powered reviews
  - Does not store your code
  - Privacy: groq.com/privacy

• **Netlify** - Hosting (if applicable)
  - Serves the web application
  - Standard web hosting logs`
    },
    {
      icon: Lock,
      title: '4. Data Security',
      content: `We implement industry-standard security measures:

**Technical Safeguards:**
• HTTPS encryption for all data transmission
• Secure authentication through Clerk
• No plain-text storage of sensitive data
• Regular security audits

**Access Controls:**
• Limited access to user data
• Role-based permissions
• Secure API key management

**Best Practices:**
• Following OWASP security guidelines
• Regular dependency updates
• Secure coding practices

While we strive to protect your data, no method of transmission over the Internet is 100% secure. We cannot guarantee absolute security.`
    },
    {
      icon: Cookie,
      title: '5. Cookies and Tracking',
      content: `**Essential Cookies:**
We use essential cookies for:
• Authentication session management
• User preferences (theme settings)
• Security tokens

**We Do NOT Use:**
• Advertising cookies
• Third-party tracking cookies
• Analytics cookies that track personal information

**Local Storage:**
We may store the following in your browser's local storage:
• Theme preference (dark/light mode)
• UI state preferences
• Cached analysis settings`
    },
    {
      icon: Globe,
      title: '6. Data Sharing and Disclosure',
      content: `**We Do NOT Sell Your Data**

We may share information only in these circumstances:

**Service Providers:**
• Clerk (authentication)
• Groq (AI processing)
These providers are bound by their own privacy policies and data protection agreements.

**Legal Requirements:**
We may disclose information if required by law or in response to:
• Valid legal processes
• Government requests
• Protection of our rights
• Prevention of fraud or security issues

**Business Transfers:**
If CodeSentinel is involved in a merger or acquisition, your information may be transferred. We will notify users of any such change.`
    },
    {
      icon: Shield,
      title: '7. Your Rights',
      content: `You have the following rights regarding your data:

**Access:**
• Request a copy of your personal data
• View what information we have about you

**Correction:**
• Update inaccurate information
• Modify your account details

**Deletion:**
• Request deletion of your account
• Remove cached analysis data
• Delete custom rules you've created

**Portability:**
• Export your custom rules
• Download analysis reports

**Opt-Out:**
• Disable optional features
• Unsubscribe from communications

To exercise these rights, contact us through GitHub or LinkedIn.`
    },
    {
      icon: Eye,
      title: '8. Children\'s Privacy',
      content: `CodeSentinel is not intended for users under the age of 13. We do not knowingly collect personal information from children under 13.

If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately. We will take steps to remove such information from our systems.

Users between 13-18 should have parental consent before using the Service.`
    },
    {
      icon: Globe,
      title: '9. International Data Transfers',
      content: `CodeSentinel may process your data in different countries. By using our Service, you consent to the transfer of your information to:

• Countries where our service providers operate
• Regions with different data protection laws

We ensure appropriate safeguards are in place for international transfers, including:
• Standard contractual clauses
• Privacy Shield compliance (where applicable)
• Adequate data protection agreements`
    },
    {
      icon: Mail,
      title: '10. Changes to This Policy',
      content: `We may update this Privacy Policy periodically. Changes will be:

• Posted on this page
• Effective immediately upon posting
• Noted with an updated "Last Modified" date

We encourage you to review this policy regularly. Continued use of CodeSentinel after changes constitutes acceptance of the updated policy.

**Last Updated:** January 2026`
    },
    {
      icon: Mail,
      title: '11. Contact Us',
      content: `If you have questions about this Privacy Policy or our data practices, please contact us:

**GitHub:** github.com/Sharjeel-Saleem-06/CodeSentinel
**LinkedIn:** linkedin.com/in/msharjeelsaleem

We aim to respond to all inquiries within 48 hours.`
    }
  ];

  return (
    <div className={cn(
      "min-h-screen w-full relative",
      isDark
        ? "bg-slate-950 text-slate-200"
        : "bg-slate-50 text-slate-800"
    )}>
      <div className={cn(
        "absolute inset-0 z-0 pointer-events-none",
        isDark
          ? "bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950"
          : "bg-gradient-to-br from-slate-50 via-white to-purple-50"
      )} />

      {/* Header */}
      <header className={cn(
        "sticky top-0 z-50 backdrop-blur-xl border-b",
        isDark
          ? "bg-slate-900/80 border-slate-700/50"
          : "bg-white/80 border-gray-200"
      )}>
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={onBack}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all",
              isDark
                ? "text-slate-300 hover:text-white hover:bg-slate-800"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            )}
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-fuchsia-600 flex items-center justify-center shadow-lg">
              <Code2 className="w-5 h-5 text-white" />
            </div>
            <span className={cn(
              "font-bold text-lg",
              isDark ? "text-white" : "text-gray-900"
            )}>
              Code<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-fuchsia-400">Sentinel</span>
            </span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="relative z-10 max-w-4xl mx-auto px-6 py-12">
        <div>
          {/* Title */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-fuchsia-600 mb-6 shadow-lg shadow-purple-500/30">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className={cn(
              "text-4xl font-bold mb-4",
              isDark ? "text-white" : "text-gray-900"
            )}>
              Privacy Policy
            </h1>
            <p className={cn(
              "text-lg",
              isDark ? "text-slate-400" : "text-gray-600"
            )}>
              Your privacy is important to us. Learn how CodeSentinel handles your data.
            </p>
          </div>

          {/* Quick Summary */}
          <div className={cn(
            "rounded-2xl border p-6 mb-8 transition-all hover:shadow-lg",
            isDark
              ? "bg-gradient-to-br from-purple-900/30 to-fuchsia-900/30 border-purple-500/30"
              : "bg-gradient-to-br from-purple-50 to-fuchsia-50 border-purple-200"
          )}>
            <h2 className={cn(
              "text-lg font-bold mb-4 flex items-center gap-2",
              isDark ? "text-white" : "text-gray-900"
            )}>
              <Lock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              Quick Summary
            </h2>
            <ul className={cn(
              "space-y-2 text-sm",
              isDark ? "text-slate-300" : "text-gray-600"
            )}>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-1">✓</span>
                <span>Your code is processed in real-time and NOT permanently stored</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-1">✓</span>
                <span>We do NOT sell or share your code with third parties</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-1">✓</span>
                <span>Authentication is handled securely by Clerk</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-1">✓</span>
                <span>AI analysis uses Groq's secure API</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-1">✓</span>
                <span>You can request deletion of your data at any time</span>
              </li>
            </ul>
          </div>

          {/* Sections */}
          <div className="space-y-8">
            {sections.map((section) => (
              <div
                key={section.title}
                className={cn(
                  "rounded-2xl border p-6 transition-all hover:shadow-lg",
                  isDark
                    ? "bg-slate-800/50 border-slate-700/50 hover:bg-slate-800/80"
                    : "bg-white border-gray-200 shadow-sm hover:shadow-md"
                )}
              >
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center",
                    isDark ? "bg-purple-500/20" : "bg-purple-100"
                  )}>
                    <section.icon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <h2 className={cn(
                      "text-xl font-bold mb-3",
                      isDark ? "text-white" : "text-gray-900"
                    )}>
                      {section.title}
                    </h2>
                    <div className={cn(
                      "text-sm leading-relaxed whitespace-pre-line",
                      isDark ? "text-slate-300" : "text-gray-600"
                    )}>
                      {section.content}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className={cn(
            "mt-12 text-center text-sm",
            isDark ? "text-slate-500" : "text-gray-500"
          )}>
            <p>© 2026 CodeSentinel. All rights reserved.</p>
            <p className="mt-2">
              Created by{' '}
              <a
                href="https://www.linkedin.com/in/msharjeelsaleem/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-500 hover:text-purple-400 font-medium"
              >
                Muhammad Sharjeel Saleem
              </a>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default PrivacyPolicy;
