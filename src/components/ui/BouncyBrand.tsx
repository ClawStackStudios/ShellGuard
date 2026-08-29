/**
 * BouncyBrand.tsx — ShellGuard©™
 *
 * Per-letter spring-physics brand mark. "Shell" rides the lobster-pink (#e4048a),
 * "Guard" rides the bioluminescent cyan (#06b6d4) — Bioluminescent Defense in motion.
 * Hover a letter to bounce it; spring physics settle it back home.
 * Supports staggered wave entrance on mount and prominent hero sizing.
 *
 * Maintained by CrustAgent©™
 */

import React, { useRef, useEffect } from 'react';

// Spring Physics: stiffness=400, damping=10, mass=1
class Spring {
  stiffness: number;
  damping: number;
  mass: number;
  
  constructor(stiffness = 400, damping = 10, mass = 1) {
    this.stiffness = stiffness;
    this.damping = damping;
    this.mass = mass;
  }

  step(current: number, velocity: number, target: number, dt: number) {
    const force = -this.stiffness * (current - target) - this.damping * velocity;
    velocity += (force / this.mass) * dt;
    current += velocity * dt;
    return { current, velocity };
  }

  isSettled(current: number, velocity: number, target: number) {
    return Math.abs(current - target) < 0.01 && Math.abs(velocity) < 0.01;
  }
}

const VARIANTS = {
  subtle: { y: -4, scale: 1.06, damping: 24, stiffness: 420 },
  prominent: { y: -16, scale: 1.2, damping: 10, stiffness: 450 },
} as const;

interface BouncyLetterProps {
  letter: string;
  className?: string;
  variant?: 'subtle' | 'prominent';
  delayMs?: number;
  autoBounce?: boolean;
}

const BouncyLetter: React.FC<BouncyLetterProps> = ({ 
  letter, 
  className, 
  variant = 'subtle',
  delayMs = 0,
  autoBounce = false
}) => {
  const elRef = useRef<HTMLSpanElement>(null);
  const animRef = useRef<number>(0);
  const stateRef = useRef({ cy: 0, cs: 1, vy: 0, vs: 0 });

  const animateTo = (targetY: number, targetScale: number) => {
    if (animRef.current) cancelAnimationFrame(animRef.current);

    const v = VARIANTS[variant];
    const localSpring = new Spring(v.stiffness, v.damping, 1);

    const dt = 1 / 60;
    const tick = () => {
      const state = stateRef.current;
      const yr = localSpring.step(state.cy, state.vy, targetY, dt);
      const sr = localSpring.step(state.cs, state.vs, targetScale, dt);

      state.cy = yr.current;
      state.vy = yr.velocity;
      state.cs = sr.current;
      state.vs = sr.velocity;

      if (elRef.current) {
        elRef.current.style.transform = `translateY(${state.cy}px) scale(${state.cs})`;
      }

      if (
        !localSpring.isSettled(state.cy, state.vy, targetY) ||
        !localSpring.isSettled(state.cs, state.vs, targetScale)
      ) {
        animRef.current = requestAnimationFrame(tick);
      } else {
        animRef.current = 0;
      }
    };

    tick();
  };

  const triggerBounce = () => {
    const v = VARIANTS[variant];
    animateTo(v.y, v.scale);
    setTimeout(() => {
      animateTo(0, 1);
    }, 180);
  };

  useEffect(() => {
    if (autoBounce && delayMs >= 0) {
      const timer = setTimeout(() => {
        triggerBounce();
      }, delayMs);
      return () => clearTimeout(timer);
    }
  }, [autoBounce, delayMs]);

  const handleMouseEnter = () => {
    const v = VARIANTS[variant];
    animateTo(v.y, v.scale);
  };

  const handleMouseLeave = () => {
    animateTo(0, 1);
  };

  return (
    <span
      ref={elRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`inline-block origin-bottom cursor-default will-change-transform transition-colors duration-150 ${className || ''}`}
    >
      {letter === ' ' ? '\u00A0' : letter}
    </span>
  );
};

interface BouncyBrandProps {
  variant?: 'subtle' | 'prominent';
  className?: string;
  logo?: boolean;
  suffix?: React.ReactNode;
  animateOnMount?: boolean;
}

export const BouncyBrand: React.FC<BouncyBrandProps> = ({
  variant = 'subtle',
  className = '',
  logo = false,
  suffix,
  animateOnMount = false,
}) => {
  const shellLetters = 'Shell'.split('');
  const guardLetters = 'Guard'.split('');

  return (
    <div className={`inline-flex items-baseline select-none font-bold ${className}`}>
      {logo && (
        <span className="inline-flex mr-3">
          <BouncyLetter 
            letter="🦞" 
            variant={variant} 
            className="drop-shadow-md text-3xl" 
            autoBounce={animateOnMount}
            delayMs={100}
          />
        </span>
      )}
      <span className="inline-flex">
        {shellLetters.map((char, i) => (
          <BouncyLetter
            key={`shell-${i}`}
            letter={char}
            variant={variant}
            className="text-[#e4048a] hover:text-[#ff2aa6]"
            autoBounce={animateOnMount}
            delayMs={150 + i * 50}
          />
        ))}
      </span>
      <span className="inline-flex">
        {guardLetters.map((char, i) => (
          <BouncyLetter
            key={`guard-${i}`}
            letter={char}
            variant={variant}
            className="text-[#06b6d4] hover:text-[#38bdf8]"
            autoBounce={animateOnMount}
            delayMs={150 + (shellLetters.length + i) * 50}
          />
        ))}
      </span>
      {suffix !== undefined ? suffix : (
        <span className="text-theme-muted text-[0.45em] font-normal ml-1 self-start tracking-tighter opacity-75">
          ©™
        </span>
      )}
    </div>
  );
};

export default BouncyBrand;
