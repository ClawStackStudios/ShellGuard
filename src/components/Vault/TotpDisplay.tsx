import React, { useState, useEffect } from 'react';
import * as OTPAuth from "otpauth";
import { Smartphone } from 'lucide-react';

export function TotpDisplay({ secret }: { secret: string }) {
  const [code, setCode] = useState("---");
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    let totp: OTPAuth.TOTP | null = null;
    try {
      const cleanSecret = secret.replace(/\s+/g, '').toUpperCase();
      if (cleanSecret) {
        totp = new OTPAuth.TOTP({
          issuer: "Vault",
          label: "TOTP",
          algorithm: "SHA1",
          digits: 6,
          period: 30,
          secret: OTPAuth.Secret.fromBase32(cleanSecret)
        });
      }
    } catch (e) {
      // invalid secret
      totp = null;
    }

    const updateTotp = () => {
      if (!totp) {
        setCode("INVALID");
        setProgress(0);
        return;
      }
      try {
        setCode(totp.generate());
        const seconds = Math.floor(Date.now() / 1000);
        const period = totp.period;
        const remaining = period - (seconds % period);
        setProgress((remaining / period) * 100);
      } catch (e) {
        setCode("ERR");
        setProgress(0);
      }
    };

    updateTotp();
    const interval = setInterval(updateTotp, 1000);
    return () => clearInterval(interval);
  }, [secret]);

  return (
    <div className="flex items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl px-3 py-2 border border-theme-subtle w-full max-w-[200px]">
      <div className="flex items-center gap-2">
        <Smartphone size={14} className="text-slate-400" />
        <span className="font-mono text-lg font-bold tracking-[0.2em] text-claw-cyan">{code.slice(0, 3)} {code.slice(3)}</span>
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
