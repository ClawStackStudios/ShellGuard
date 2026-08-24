import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils.ts';

interface InteractiveBrandProps {
  className?: string; // Container classes
  onClick?: () => void;
  showCopyright?: boolean; // Toggle ©™
  showIcon?: boolean; // Toggle Lobster Icon
  hideText?: boolean; // Toggle text visibility for collapsed sidebar
  iconClassName?: string; // Custom icon sizing/styling
  variant?: 'subtle' | 'prominent'; // Animation profiles
  suffix?: string; // e.g. "Wizard"
  suffixClassName?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
}

export function InteractiveBrand({ 
  className, 
  onClick, 
  showCopyright = true, 
  showIcon = false,
  hideText = false,
  iconClassName,
  variant = 'subtle',
  suffix,
  suffixClassName,
  size = 'md'
}: InteractiveBrandProps) {
  const shell = "Shell".split("");
  const guard = "Guard".split("");
  const suffixLetters = suffix ? suffix.split("") : [];

  const isProminent = variant === 'prominent';

  const letterVariants = {
    initial: { y: 0, scale: 1 },
    hover: { 
      y: isProminent ? -8 : -4, 
      scale: isProminent ? 1.15 : 1.08,
      transition: { 
        type: 'spring', 
        stiffness: 450, 
        damping: isProminent ? 12 : 25 
      } 
    }
  };

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
    xl: 'text-2xl',
    '2xl': 'text-3xl',
    '3xl': 'text-4xl'
  };

  return (
    <div 
      className={cn("inline-flex items-center gap-2.5 cursor-pointer select-none", sizeClasses[size], className)}
      onClick={onClick}
    >
      {showIcon && (
        <motion.div 
          className={cn(
            "w-9 h-9 bg-gradient-to-br from-[#e4048a] to-[#ef4444] rounded-xl flex items-center justify-center shadow-lg shadow-[#e4048a]/20 origin-bottom flex-shrink-0",
            iconClassName
          )}
          variants={letterVariants}
          initial="initial"
          whileHover="hover"
        >
          <span className="text-xl select-none">🦞</span>
        </motion.div>
      )}
      <div className="flex items-center font-headline font-bold tracking-tight">
        <span className="flex">
          {shell.map((letter, i) => (
            <motion.span
              key={`shell-${i}`}
              variants={letterVariants}
              initial="initial"
              whileHover="hover"
              className="text-[#e4048a] inline-block origin-bottom transition-colors"
            >
              {letter}
            </motion.span>
          ))}
        </span>
        <span className="flex">
          {guard.map((letter, i) => (
            <motion.span
              key={`guard-${i}`}
              variants={letterVariants}
              initial="initial"
              whileHover="hover"
              className="text-[#ef4444] inline-block origin-bottom transition-colors"
            >
              {letter}
            </motion.span>
          ))}
        </span>

        {suffix && (
          <span className={cn("flex ml-1.5 text-slate-900 dark:text-white", suffixClassName)}>
            {suffixLetters.map((letter, i) => (
              <motion.span
                key={`suffix-${i}`}
                variants={letterVariants}
                initial="initial"
                whileHover="hover"
                className="inline-block origin-bottom transition-colors"
              >
                {letter}
              </motion.span>
            ))}
          </span>
        )}

        {showCopyright && (
          <span className="text-slate-400 dark:text-slate-500 text-[0.55em] font-normal ml-0.5 self-start -mt-1 tracking-tighter select-none">
            ©™
          </span>
        )}
      </div>
    </div>
  );
}
