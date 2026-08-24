import React, { useState, useEffect } from "react";
import { Key } from "lucide-react";
import { getFaviconUrl, extractDomain } from "../../lib/urlUtils.ts";

interface FaviconProps {
  url?: string;
  title?: string;
  size?: number;
  className?: string;
}

const GRADIENTS = [
  "from-pink-500 to-rose-500",
  "from-cyan-500 to-blue-600",
  "from-purple-500 to-indigo-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-violet-500 to-purple-600",
];

function getGradientForTitle(title: string): string {
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = (hash << 5) - hash + title.charCodeAt(i);
    hash |= 0;
  }
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
}

export function Favicon({ url, title = "Password", size = 40, className = "" }: FaviconProps) {
  const [hasError, setHasError] = useState(false);
  const faviconUrl = getFaviconUrl(url);

  useEffect(() => {
    setHasError(false);
  }, [url]);

  const initial = title ? title.trim().charAt(0).toUpperCase() : "P";
  const gradient = getGradientForTitle(title || "Password");

  if (faviconUrl && !hasError) {
    return (
      <div 
        className={`relative flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 border border-theme-subtle shadow-sm overflow-hidden p-1.5 flex-shrink-0 ${className}`}
        style={{ width: `${size}px`, height: `${size}px` }}
      >
        <img
          src={faviconUrl}
          alt={`${title} favicon`}
          className="w-full h-full object-contain"
          onError={() => setHasError(true)}
          referrerPolicy="no-referrer"
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-white font-bold shadow-sm flex-shrink-0 border border-white/10 ${className}`}
      style={{ width: `${size}px`, height: `${size}px`, fontSize: `${Math.max(12, Math.floor(size * 0.42))}px` }}
      title={url ? `${title} (${extractDomain(url)})` : title}
    >
      {initial || <Key size={Math.floor(size * 0.5)} />}
    </div>
  );
}
