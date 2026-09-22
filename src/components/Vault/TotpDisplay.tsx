import React, { useState, useEffect } from 'react';
import { Smartphone } from 'lucide-react';
import { parseTotpSecret, generateTotp } from '../../lib/totpUtils.ts';

export function TotpDisplay({ secret }: { secret: string }) {
  const [code, setCode] = useState("---");
  const [progress, setProgress] = useState(100);
  const [digits, setDigits] = useState(6);

  useEffect(() => {
    const config = parseTotpSecret(secret);
    if (!config) {
      setCode("INVALID");
      setProgress(0);
      return;
    }

    setDigits(config.digits);

    const updateTotp = () => {
      const result = generateTotp(config);
      if (!result) {
        setCode("INVALID");
        setProgress(0);
        return;
      }
      setCode(result.code);
      setProgress(result.progressPercent);
    };

    updateTotp();
    const interval = setInterval(updateTotp, 1000);
    return () => clearInterval(interval);
  }, [secret]);

  const formattedCode = React.useMemo(() => {
    if (code.length === 6) {
      return `${code.slice(0, 3)} ${code.slice(3)}`;
    }
    if (code.length === 8) {
      return `${code.slice(0, 4)} ${code.slice(4)}`;
    }
    return code;
  }, [code]);

  return (
    <div className="flex items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl px-3 py-2 border border-theme-subtle w-full max-w-[220px]">
      <div className="flex items-center gap-2">
        <Smartphone size={14} className="text-slate-400" />
        <span className="font-mono text-lg font-bold tracking-[0.2em] text-claw-cyan">
          {formattedCode}
        </span>
      </div>
      <div className="relative w-5 h-5 flex items-center justify-center">
        <svg className="w-5 h-5 transform -rotate-90">
          <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" fill="transparent" className="text-slate-200 dark:text-slate-700" />
          <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" fill="transparent" strokeDasharray="50" strokeDashoffset={50 - (progress / 100) * 50} className={`transition-all duration-1000 linear ${progress < 20 ? 'text-red-500' : 'text-claw-cyan'}`} />
        </svg>
      </div>
    </div>
  );
}

