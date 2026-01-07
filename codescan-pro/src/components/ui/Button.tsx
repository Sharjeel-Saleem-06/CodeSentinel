/**
 * Button Component
 * Styled button with variants
 */

import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant = 'primary', 
    size = 'md', 
    isLoading, 
    leftIcon, 
    rightIcon,
    children, 
    disabled,
    ...props 
  }, ref) => {
    const baseStyles = `
      inline-flex items-center justify-center gap-2
      font-medium rounded-xl transition-all duration-200
      focus:outline-none focus-visible:ring-2 focus-visible:ring-cyber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-obsidian-950
      disabled:opacity-50 disabled:cursor-not-allowed
    `;

    const variants = {
      primary: `
        bg-gradient-to-r from-cyber-500 to-neon-purple
        text-obsidian-950 font-semibold
        hover:from-cyber-400 hover:to-neon-pink
        shadow-lg shadow-cyber-500/25
        hover:shadow-cyber-500/40
      `,
      secondary: `
        bg-obsidian-800 text-obsidian-100
        border border-obsidian-700
        hover:bg-obsidian-700 hover:border-obsidian-600
      `,
      ghost: `
        bg-transparent text-obsidian-300
        hover:bg-obsidian-800/50 hover:text-obsidian-100
      `,
      danger: `
        bg-gradient-to-r from-neon-red to-neon-orange
        text-white font-semibold
        hover:from-neon-red/90 hover:to-neon-orange/90
        shadow-lg shadow-neon-red/25
      `,
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
    };

    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: disabled ? 1 : 1.02 }}
        whileTap={{ scale: disabled ? 1 : 0.98 }}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : leftIcon}
        {children}
        {!isLoading && rightIcon}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

