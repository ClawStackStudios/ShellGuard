/**
 * BouncyBrand.tsx — ShellGuard©™
 *
 * Per-letter spring-physics brand mark. "Shell" rides the lobster-red,
 * "Guard" rides the claw-cyan — Bioluminescent Defense in motion.
 * Hover a letter to bounce it; spring physics settle it back home.
 *
 * Maintained by CrustAgent©™
 */

import React, { useRef } from 'react';

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
  subtle: { y: -3, scale: 1.05, damping: 30 },
  prominent: { y: -12, scale: 1.15, damping: 12 },
} as const;

interface BouncyLetterProps {
  letter: string;
  className?: string;
  variant?: 'subtle' | 'prominent';
}

const BouncyLetter: React.FC<BouncyLetterProps> = ({ letter, className, variant = 'subtle' }) => {
  const elRef = useRef<HTMLSpanElement>(null);
  const animRef = useRef<number>(0);
  const stateRef = useRef({ cy: 0, cs: 1, vy: 0, vs: 0 });

  const animateTo = (targetY: number, targetScale: number) => {
    if (animRef.current) cancelAnimationFrame(animRef.current);

    const v = VARIANTS[variant];
    const localSpring = new Spring(400, v.damping, 1);

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
      className={`inline-block origin-bottom cursor-default will-change-transform ${className || ''}`}
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
}

export const BouncyBrand: React.FC<BouncyBrandProps> = ({
  variant = 'subtle',
  className = '',
  logo = false,
  suffix,
}) => {
  return (
    <div className={`flex select-none font-bold ${className}`}>
      {logo && (
        <span className="flex mr-3">
          <BouncyLetter letter="🦞" variant={variant} className="text-transparent drop-shadow-md" />
        </span>
      )}
      <span className="flex">
        {'Shell'.split('').map((char, i) => (
          <BouncyLetter
            key={`shell-${i}`}
            letter={char}
            variant={variant}
            className="text-[#e4048a]"
          />
        ))}
      </span>
      <span className="flex">
        {'Guard'.split('').map((char, i) => (
          <BouncyLetter
            key={`guard-${i}`}
            letter={char}
            variant={variant}
            className="text-[#06b6d4]"
          />
        ))}
      </span>
      {suffix !== undefined ? suffix : (
        <span className="text-theme-muted text-[0.6em] font-normal ml-0.5 self-end mb-1 tracking-tighter">
          ©™
        </span>
      )}
    </div>
  );
};

export default BouncyBrand;
