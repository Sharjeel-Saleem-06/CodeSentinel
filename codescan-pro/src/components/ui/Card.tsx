/**
 * Card Component
 * Glass morphism styled card
 */

import { forwardRef, type HTMLAttributes } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

interface CardProps {
  variant?: 'default' | 'glass' | 'bordered';
  hover?: boolean;
  animate?: boolean;
  children?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', hover = false, animate = false, children, onClick }, ref) => {
    const baseStyles = 'rounded-2xl';

    const variants = {
      default: 'bg-obsidian-900/80 backdrop-blur-sm',
      glass: 'glass',
      bordered: 'bg-obsidian-900/50 border border-obsidian-800',
    };

    const hoverStyles = hover 
      ? 'transition-all duration-300 hover:border-cyber-500/30 hover:shadow-lg hover:shadow-cyber-500/10' 
      : '';

    if (animate) {
      return (
        <motion.div
          ref={ref}
          className={cn(baseStyles, variants[variant], hoverStyles, className)}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          onClick={onClick}
        >
          {children}
        </motion.div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(baseStyles, variants[variant], hoverStyles, className)}
        onClick={onClick}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

// Card Header
export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('px-6 py-4 border-b border-obsidian-800/50', className)}
      {...props}
    />
  )
);

CardHeader.displayName = 'CardHeader';

// Card Title
export const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-lg font-semibold text-obsidian-100', className)}
      {...props}
    />
  )
);

CardTitle.displayName = 'CardTitle';

// Card Content
export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('p-6', className)}
      {...props}
    />
  )
);

CardContent.displayName = 'CardContent';

// Card Footer
export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('px-6 py-4 border-t border-obsidian-800/50', className)}
      {...props}
    />
  )
);

CardFooter.displayName = 'CardFooter';

