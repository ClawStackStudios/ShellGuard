import React from "react";
import { Check, Contact, Copy, Eye, EyeOff, Mail, MapPin, Phone, Shield, User } from "lucide-react";
import type { IdentityDetail } from "../../lib/identityFieldUtils.ts";

interface IdentityDetailSectionProps {
  identityDetails: IdentityDetail;
  copyFeedback: string | null;
  revealedHiddenFields: Set<string>;
  onCopy: (text: string, id: string) => void;
  onToggleReveal: (fieldKey: string) => void;
}

export const IdentityDetailSection: React.FC<IdentityDetailSectionProps> = ({
  identityDetails,
  copyFeedback,
  revealedHiddenFields,
  onCopy,
  onToggleReveal,
}) => {
  const sensitiveDocs = [
    {
      key: "iden_ssn",
      label: "Social Security Number (SSN)",
      value: identityDetails.ssn,
      copyId: "iden-ssn",
      title: "SSN",
    },
    {
      key: "iden_passport",
      label: "Passport Number",
      value: identityDetails.passport,
      copyId: "iden-passport",
      title: "Passport Number",
    },
    {
      key: "iden_license",
      label: "Driver's License Number",
      value: identityDetails.license,
      copyId: "iden-license",
      title: "Driver's License Number",
    },
  ].filter((doc) => Boolean(doc.value));

  return (
    <div className="space-y-3 pt-1">
      {/* Profile Banner */}
      <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 dark:bg-blue-950/20 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center flex-shrink-0 border border-blue-500/20">
            <Contact size={20} />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              {identityDetails.title && (
                <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
                  {identityDetails.title}
                </span>
              )}
              <h4 className="text-base font-bold text-theme-main truncate">
                {identityDetails.fullName}
              </h4>
            </div>
            {(identityDetails.company || identityDetails.username) && (
              <span className="text-xs text-theme-muted truncate">
                {identityDetails.company ? identityDetails.company : ""}
                {identityDetails.company && identityDetails.username ? " • " : ""}
                {identityDetails.username ? `@${identityDetails.username}` : ""}
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => onCopy(identityDetails.fullName, "iden-fullname")}
          title="Copy Full Name"
          className={`p-2 rounded-lg transition-colors cursor-pointer ${
            copyFeedback === "iden-fullname" ? "text-green-500 bg-green-500/10" : "text-slate-400 hover:text-blue-500"
          }`}
        >
          {copyFeedback === "iden-fullname" ? <Check size={16} /> : <Copy size={16} />}
        </button>
      </div>

      {/* Contact Information (Email, Phone, Username) */}
      {(identityDetails.email || identityDetails.phone || identityDetails.username) && (
        <div className="p-3.5 rounded-xl border border-theme-subtle bg-slate-900/30 dark:bg-black/20 space-y-2.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Contact Details
          </span>

          {identityDetails.email && (
            <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-theme-surface border border-theme-subtle">
              <div className="flex items-center gap-2.5 min-w-0">
                <Mail size={15} className="text-slate-400 flex-shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Email</span>
                  <a href={`mailto:${identityDetails.email}`} className="text-xs font-mono text-claw-cyan hover:underline truncate">
                    {identityDetails.email}
                  </a>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onCopy(identityDetails.email, "iden-email")}
                title="Copy Email"
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  copyFeedback === "iden-email" ? "text-green-500 bg-green-500/10" : "text-slate-400 hover:text-claw-cyan"
                }`}
              >
                {copyFeedback === "iden-email" ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
          )}

          {identityDetails.phone && (
            <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-theme-surface border border-theme-subtle">
              <div className="flex items-center gap-2.5 min-w-0">
                <Phone size={15} className="text-slate-400 flex-shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Phone</span>
                  <a href={`tel:${identityDetails.phone}`} className="text-xs font-mono text-theme-main hover:text-claw-cyan truncate">
                    {identityDetails.phone}
                  </a>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onCopy(identityDetails.phone, "iden-phone")}
                title="Copy Phone"
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  copyFeedback === "iden-phone" ? "text-green-500 bg-green-500/10" : "text-slate-400 hover:text-claw-cyan"
                }`}
              >
                {copyFeedback === "iden-phone" ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
          )}

          {identityDetails.username && (
            <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-theme-surface border border-theme-subtle">
              <div className="flex items-center gap-2.5 min-w-0">
                <User size={15} className="text-slate-400 flex-shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Username</span>
                  <span className="text-xs font-mono text-theme-main truncate">{identityDetails.username}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onCopy(identityDetails.username, "iden-uname")}
                title="Copy Username"
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  copyFeedback === "iden-uname" ? "text-green-500 bg-green-500/10" : "text-slate-400 hover:text-claw-cyan"
                }`}
              >
                {copyFeedback === "iden-uname" ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Address Block */}
      {identityDetails.fullAddress && (
        <div className="p-3.5 rounded-xl border border-theme-subtle bg-slate-900/30 dark:bg-black/20 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <MapPin size={15} className="text-slate-400 flex-shrink-0" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Address & Location
              </span>
            </div>
            <button
              type="button"
              onClick={() => onCopy(identityDetails.fullAddress, "iden-address")}
              title="Copy Full Address"
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                copyFeedback === "iden-address" ? "text-green-500 bg-green-500/10" : "text-slate-400 hover:text-claw-cyan"
              }`}
            >
              {copyFeedback === "iden-address" ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>
          <div className="p-2.5 rounded-lg bg-theme-surface border border-theme-subtle text-xs font-mono text-theme-main whitespace-pre-line leading-relaxed select-all">
            {identityDetails.fullAddress}
          </div>
        </div>
      )}

      {/* Identification Documents (SSN, Passport, License) with Eye-beside-Copy */}
      {sensitiveDocs.length > 0 && (
        <div className="p-3.5 rounded-xl border border-theme-subtle bg-slate-900/30 dark:bg-black/20 space-y-2.5">
          <div className="flex items-center gap-2">
            <Shield size={15} className="text-amber-400 flex-shrink-0" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Identification Documents
            </span>
          </div>

          {sensitiveDocs.map((doc) => {
            const isRevealed = revealedHiddenFields.has(doc.key);
            return (
              <div key={doc.key} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-theme-surface border border-theme-subtle">
                <div className="flex flex-col min-w-0">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                    {doc.label}
                  </span>
                  <span className="text-xs font-mono text-theme-main truncate mt-0.5">
                    {isRevealed ? doc.value : "•••••••••"}
                  </span>
                </div>
                {/* Eye-beside-Copy Invariant */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => onToggleReveal(doc.key)}
                    title={isRevealed ? `Mask ${doc.title}` : `Reveal ${doc.title}`}
                    className="p-1.5 text-slate-400 hover:text-claw-cyan hover:bg-claw-cyan/10 rounded-lg transition-colors cursor-pointer"
                  >
                    {isRevealed ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  <button
                    type="button"
                    onClick={() => onCopy(doc.value, doc.copyId)}
                    title={`Copy ${doc.title}`}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      copyFeedback === doc.copyId ? "text-green-500 bg-green-500/10" : "text-slate-400 hover:text-claw-cyan"
                    }`}
                  >
                    {copyFeedback === doc.copyId ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
