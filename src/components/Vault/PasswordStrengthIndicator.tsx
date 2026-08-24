import React from 'react';

interface PasswordStrengthIndicatorProps {
  password: string;
}

export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  if (!password) return null;

  const calculateStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (pass.length >= 12) score += 1;
    if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass) || /[^A-Za-z0-9]/.test(pass)) score += 1;

    let label = "Very Weak";
    let color = "bg-red-500";
    let textColor = "text-red-500";

    if (score === 1) {
      label = "Weak";
      color = "bg-orange-500";
      textColor = "text-orange-500";
    } else if (score === 2) {
      label = "Fair";
      color = "bg-yellow-500";
      textColor = "text-yellow-500";
    } else if (score === 3) {
      label = "Strong";
      color = "bg-blue-500";
      textColor = "text-blue-500";
    } else if (score === 4) {
      label = "Very Strong";
      color = "bg-green-500";
      textColor = "text-green-500";
    }

    return { score, label, color, textColor };
  };

  const { score, label, color, textColor } = calculateStrength(password);

  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {[1, 2, 3, 4].map((step) => (
          <div
            key={step}
            className={`h-1 flex-1 rounded-full ${
              step <= score ? color : 'bg-slate-200 dark:bg-slate-800'
            }`}
          />
        ))}
      </div>
      <div className={`text-xs font-semibold ${textColor} text-right`}>
        {label}
      </div>
    </div>
  );
}
