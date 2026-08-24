import React from "react";
import { Clock, AlertCircle, ShieldAlert, Sparkles } from "lucide-react";

export interface AgeInfo {
  days: number;
  label: string;
  relativeTime: string;
  status: "fresh" | "normal" | "aging" | "expired";
  badgeBg: string;
  badgeBorder: string;
  textColor: string;
  indicatorDot: string;
  description: string;
}

/**
 * Computes age in days and status styling based on item timestamp (updated_at or created_at).
 * - Fresh (0-30 days): Green / Emerald - Recently updated & optimal
 * - Normal (31-89 days): Cyan / Blue - Standard active age
 * - Aging (90-179 days): Amber / Yellow - 3+ months old, consider rotating
 * - Critical / Stale (180+ days): Rose / Red - 6+ months old, rotation recommended
 */
export function calculatePasswordAge(timestamp?: string | null): AgeInfo {
  if (!timestamp) {
    return {
      days: 0,
      label: "New",
      relativeTime: "Just now",
      status: "fresh",
      badgeBg: "bg-emerald-500/10 dark:bg-emerald-500/15",
      badgeBorder: "border-emerald-500/30",
      textColor: "text-emerald-700 dark:text-emerald-400",
      indicatorDot: "bg-emerald-500",
      description: "Secret is fresh (updated recently)"
    };
  }

  const parsedDate = new Date(timestamp);
  const now = new Date();
  
  // Guard against invalid dates
  if (isNaN(parsedDate.getTime())) {
    return {
      days: 0,
      label: "New",
      relativeTime: "Just now",
      status: "fresh",
      badgeBg: "bg-emerald-500/10 dark:bg-emerald-500/15",
      badgeBorder: "border-emerald-500/30",
      textColor: "text-emerald-700 dark:text-emerald-400",
      indicatorDot: "bg-emerald-500",
      description: "Secret is fresh"
    };
  }

  const diffMs = Math.max(0, now.getTime() - parsedDate.getTime());
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  let relativeTime = "";
  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours === 0) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      relativeTime = diffMins <= 1 ? "Just now" : `${diffMins}m ago`;
    } else {
      relativeTime = `${diffHours}h ago`;
    }
  } else if (diffDays === 1) {
    relativeTime = "1 day ago";
  } else if (diffDays < 30) {
    relativeTime = `${diffDays} days ago`;
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    relativeTime = months === 1 ? "1 month ago" : `${months} mos ago`;
  } else {
    const years = (diffDays / 365).toFixed(1);
    relativeTime = `${years} yrs ago`;
  }

  if (diffDays <= 30) {
    return {
      days: diffDays,
      label: diffDays === 0 ? "Today" : `${diffDays}d old`,
      relativeTime,
      status: "fresh",
      badgeBg: "bg-emerald-500/10 dark:bg-emerald-500/15",
      badgeBorder: "border-emerald-500/30",
      textColor: "text-emerald-700 dark:text-emerald-400",
      indicatorDot: "bg-emerald-500",
      description: "Fresh secret (0–30 days)"
    };
  } else if (diffDays < 90) {
    return {
      days: diffDays,
      label: `${diffDays}d old`,
      relativeTime,
      status: "normal",
      badgeBg: "bg-cyan-500/10 dark:bg-cyan-500/15",
      badgeBorder: "border-cyan-500/30",
      textColor: "text-cyan-700 dark:text-cyan-400",
      indicatorDot: "bg-cyan-500",
      description: "Standard age (31–89 days)"
    };
  } else if (diffDays < 180) {
    return {
      days: diffDays,
      label: `${diffDays}d old`,
      relativeTime,
      status: "aging",
      badgeBg: "bg-amber-500/10 dark:bg-amber-500/15",
      badgeBorder: "border-amber-500/40",
      textColor: "text-amber-700 dark:text-amber-400",
      indicatorDot: "bg-amber-500 animate-pulse",
      description: "Aging secret (>90 days) - consider rotating"
    };
  } else {
    return {
      days: diffDays,
      label: `${diffDays}d old`,
      relativeTime,
      status: "expired",
      badgeBg: "bg-rose-500/10 dark:bg-rose-500/15",
      badgeBorder: "border-rose-500/40",
      textColor: "text-rose-700 dark:text-rose-400",
      indicatorDot: "bg-rose-500 animate-ping",
      description: "Stale secret (>180 days) - rotation strongly recommended"
    };
  }
}

interface PasswordAgeBadgeProps {
  timestamp?: string | null;
  compact?: boolean;
  className?: string;
  onClick?: () => void;
}

export function PasswordAgeBadge({
  timestamp,
  compact = false,
  className = "",
  onClick
}: PasswordAgeBadgeProps) {
  const age = calculatePasswordAge(timestamp);

  const content = (
    <div
      id={`age-badge-${age.status}`}
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border font-mono text-[11px] transition-colors ${age.badgeBg} ${age.badgeBorder} ${age.textColor} ${className}`}
      title={`Secret Age: ${age.days} days (${age.relativeTime}) - ${age.description}`}
    >
      {/* Visual Color Dot Indicator */}
      <span className="relative flex h-2 w-2 flex-shrink-0">
        {age.status === "aging" || age.status === "expired" ? (
          <>
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${age.indicatorDot.split(" ")[0]}`} />
            <span className={`relative inline-flex rounded-full h-2 w-2 ${age.indicatorDot.split(" ")[0]}`} />
          </>
        ) : (
          <span className={`inline-flex rounded-full h-2 w-2 ${age.indicatorDot}`} />
        )}
      </span>

      {/* Icon */}
      {age.status === "expired" ? (
        <ShieldAlert size={11} className="flex-shrink-0" />
      ) : age.status === "aging" ? (
        <AlertCircle size={11} className="flex-shrink-0" />
      ) : age.status === "fresh" && age.days === 0 ? (
        <Sparkles size={11} className="flex-shrink-0" />
      ) : (
        <Clock size={11} className="flex-shrink-0 opacity-70" />
      )}

      {/* Label */}
      <span className="font-semibold whitespace-nowrap">
        {compact ? age.label : `Age: ${age.label}`}
      </span>
    </div>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="cursor-pointer hover:opacity-80 transition-opacity"
      >
        {content}
      </button>
    );
  }

  return content;
}
