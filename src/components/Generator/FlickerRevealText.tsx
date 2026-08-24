import React, { useEffect, useState, useRef } from "react";
import { motion } from "motion/react";

interface FlickerRevealTextProps {
  text: string;
  className?: string;
  durationMs?: number;
  triggerKey?: string | number;
}

const GLYPHS = "!<>-_\\/[]{}—=+*^?#0123456789ABCDEF0123456789";

export function FlickerRevealText({
  text,
  className = "",
  durationMs = 380,
  triggerKey,
}: FlickerRevealTextProps) {
  const [displayText, setDisplayText] = useState<string>(text);
  const [isFlickering, setIsFlickering] = useState<boolean>(false);
  const [resolvedIndices, setResolvedIndices] = useState<Set<number>>(new Set());
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!text) {
      setDisplayText("");
      setIsFlickering(false);
      setResolvedIndices(new Set());
      return;
    }

    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      setDisplayText(text);
      setIsFlickering(false);
      return;
    }

    setIsFlickering(true);
    const targetLength = text.length;
    const startTime = performance.now();
    const resolved = new Set<number>();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(1, elapsed / durationMs);

      // Number of characters that should be locked in based on progress
      const lockedCount = Math.floor(progress * targetLength);
      
      for (let i = 0; i < lockedCount; i++) {
        resolved.add(i);
      }
      setResolvedIndices(new Set(resolved));

      let currentScramble = "";
      for (let i = 0; i < targetLength; i++) {
        if (resolved.has(i) || progress >= 1) {
          currentScramble += text[i];
        } else {
          // Preserve spaces or separators for word rhythm if passphrase
          if (text[i] === " " || text[i] === "-" || text[i] === "_") {
            currentScramble += text[i];
          } else {
            const randomGlyph = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
            currentScramble += randomGlyph;
          }
        }
      }

      setDisplayText(currentScramble);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayText(text);
        setIsFlickering(false);
        setResolvedIndices(new Set(Array.from({ length: targetLength }, (_, i) => i)));
      }
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [text, durationMs, triggerKey]);

  return (
    <motion.div
      key={triggerKey || text}
      initial={{ opacity: 0.85, scale: 0.995 }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        filter: isFlickering 
          ? ["drop-shadow(0 0 8px rgba(6,182,212,0.6))", "drop-shadow(0 0 2px rgba(6,182,212,0.2))", "none"]
          : "none"
      }}
      transition={{ duration: 0.3 }}
      className={`font-mono relative select-all flex flex-wrap items-center justify-center text-center ${className}`}
    >
      {/* High-tech reveal char tokens */}
      <span className="inline-block break-all">
        {displayText.split("").map((char, index) => {
          const isResolved = !isFlickering || resolvedIndices.has(index);
          const isSpecial = char === "-" || char === "_" || char === " " || char === "." || char === "@";

          return (
            <motion.span
              key={`${index}-${char}`}
              initial={!isResolved ? { opacity: 0.7, y: -1 } : false}
              animate={!isResolved ? { opacity: [0.5, 1, 0.7], y: 0 } : { opacity: 1, y: 0 }}
              transition={{ duration: 0.08 }}
              className={`inline-block transition-colors duration-100 ${
                !isResolved
                  ? "text-claw-cyan font-black animate-pulse"
                  : isSpecial
                  ? "text-claw-cyan font-bold opacity-80"
                  : "text-theme-main"
              }`}
            >
              {char}
            </motion.span>
          );
        })}
      </span>

      {/* Subtle Scanline / Cyber Glow Line during flicker */}
      {isFlickering && (
        <motion.div
          initial={{ left: "0%", opacity: 0.8 }}
          animate={{ left: "100%", opacity: 0 }}
          transition={{ duration: durationMs / 1000, ease: "linear" }}
          className="absolute inset-y-0 w-8 bg-gradient-to-r from-transparent via-claw-cyan/30 to-transparent pointer-events-none"
        />
      )}
    </motion.div>
  );
}
