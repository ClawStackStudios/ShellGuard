import React, { useState } from "react";
import { Contact, Eye, EyeOff } from "lucide-react";
import type { IdentityFormValues } from "../../lib/identityFieldUtils.ts";

interface IdentityFormSectionProps {
  values: IdentityFormValues;
  username: string;
  onChange: (next: IdentityFormValues) => void;
  onUsernameChange: (username: string) => void;
}

export const IdentityFormSection: React.FC<IdentityFormSectionProps> = ({
  values,
  username,
  onChange,
  onUsernameChange,
}) => {
  const [showSsn, setShowSsn] = useState(false);
  const [showPassport, setShowPassport] = useState(false);
  const [showLicense, setShowLicense] = useState(false);

  const updateField = (key: keyof IdentityFormValues, value: string) => {
    onChange({ ...values, [key]: value });
  };

  return (
    <div className="col-span-1 md:col-span-2 space-y-5">
      {/* 1. Personal Names */}
      <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/20 space-y-3">
        <div className="flex items-center gap-2 text-blue-500 font-bold text-xs uppercase tracking-wider">
          <Contact size={16} />
          <span>Personal Details</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-theme-muted mb-1">Title</label>
            <input
              type="text"
              value={values.title}
              onChange={(e) => updateField("title", e.target.value)}
              placeholder="Mr / Mrs / Dr"
              className="w-full bg-theme-base border border-theme-subtle rounded-xl px-3 py-2 text-sm focus:border-claw-cyan outline-none text-theme-main"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-theme-muted mb-1">First Name</label>
            <input
              type="text"
              value={values.firstName}
              onChange={(e) => updateField("firstName", e.target.value)}
              placeholder="First"
              className="w-full bg-theme-base border border-theme-subtle rounded-xl px-3 py-2 text-sm focus:border-claw-cyan outline-none text-theme-main"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-theme-muted mb-1">Middle Name</label>
            <input
              type="text"
              value={values.middleName}
              onChange={(e) => updateField("middleName", e.target.value)}
              placeholder="Middle"
              className="w-full bg-theme-base border border-theme-subtle rounded-xl px-3 py-2 text-sm focus:border-claw-cyan outline-none text-theme-main"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-theme-muted mb-1">Last Name</label>
            <input
              type="text"
              value={values.lastName}
              onChange={(e) => updateField("lastName", e.target.value)}
              placeholder="Last"
              className="w-full bg-theme-base border border-theme-subtle rounded-xl px-3 py-2 text-sm focus:border-claw-cyan outline-none text-theme-main"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-theme-muted mb-1">Username / Handle</label>
          <input
            type="text"
            value={username}
            onChange={(e) => onUsernameChange(e.target.value)}
            placeholder="e.g. captain_reef"
            className="w-full bg-theme-base border border-theme-subtle rounded-xl px-3 py-2 text-sm focus:border-claw-cyan outline-none text-theme-main font-mono"
          />
        </div>
      </div>

      {/* 2. Contact Information */}
      <div className="p-4 rounded-2xl bg-slate-900/30 dark:bg-black/20 border border-theme-subtle space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-theme-muted block">Contact Information</span>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-theme-muted mb-1">Company</label>
            <input
              type="text"
              value={values.company}
              onChange={(e) => updateField("company", e.target.value)}
              placeholder="Company Ltd."
              className="w-full bg-theme-base border border-theme-subtle rounded-xl px-3 py-2 text-sm focus:border-claw-cyan outline-none text-theme-main"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-theme-muted mb-1">Email</label>
            <input
              type="email"
              value={values.email}
              onChange={(e) => updateField("email", e.target.value)}
              placeholder="user@example.com"
              className="w-full bg-theme-base border border-theme-subtle rounded-xl px-3 py-2 text-sm focus:border-claw-cyan outline-none text-theme-main"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-theme-muted mb-1">Phone</label>
            <input
              type="tel"
              value={values.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              placeholder="+1 (555) 000-0000"
              className="w-full bg-theme-base border border-theme-subtle rounded-xl px-3 py-2 text-sm focus:border-claw-cyan outline-none text-theme-main"
            />
          </div>
        </div>
      </div>

      {/* 3. Address Information */}
      <div className="p-4 rounded-2xl bg-slate-900/30 dark:bg-black/20 border border-theme-subtle space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-theme-muted block">Address Details</span>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-theme-muted mb-1">Address Line 1</label>
            <input
              type="text"
              value={values.address1}
              onChange={(e) => updateField("address1", e.target.value)}
              placeholder="123 Ocean Way"
              className="w-full bg-theme-base border border-theme-subtle rounded-xl px-3 py-2 text-sm focus:border-claw-cyan outline-none text-theme-main"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-theme-muted mb-1">Address Line 2</label>
            <input
              type="text"
              value={values.address2}
              onChange={(e) => updateField("address2", e.target.value)}
              placeholder="Suite / Apt"
              className="w-full bg-theme-base border border-theme-subtle rounded-xl px-3 py-2 text-sm focus:border-claw-cyan outline-none text-theme-main"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-theme-muted mb-1">Address Line 3</label>
            <input
              type="text"
              value={values.address3}
              onChange={(e) => updateField("address3", e.target.value)}
              placeholder="Building / Floor"
              className="w-full bg-theme-base border border-theme-subtle rounded-xl px-3 py-2 text-sm focus:border-claw-cyan outline-none text-theme-main"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-theme-muted mb-1">City</label>
            <input
              type="text"
              value={values.city}
              onChange={(e) => updateField("city", e.target.value)}
              placeholder="City"
              className="w-full bg-theme-base border border-theme-subtle rounded-xl px-3 py-2 text-sm focus:border-claw-cyan outline-none text-theme-main"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-theme-muted mb-1">State / Province</label>
            <input
              type="text"
              value={values.state}
              onChange={(e) => updateField("state", e.target.value)}
              placeholder="State / Region"
              className="w-full bg-theme-base border border-theme-subtle rounded-xl px-3 py-2 text-sm focus:border-claw-cyan outline-none text-theme-main"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-theme-muted mb-1">Postal Code</label>
            <input
              type="text"
              value={values.postalCode}
              onChange={(e) => updateField("postalCode", e.target.value)}
              placeholder="Postal Code"
              className="w-full bg-theme-base border border-theme-subtle rounded-xl px-3 py-2 text-sm focus:border-claw-cyan outline-none text-theme-main"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-theme-muted mb-1">Country</label>
            <input
              type="text"
              value={values.country}
              onChange={(e) => updateField("country", e.target.value)}
              placeholder="Country"
              className="w-full bg-theme-base border border-theme-subtle rounded-xl px-3 py-2 text-sm focus:border-claw-cyan outline-none text-theme-main"
            />
          </div>
        </div>
      </div>

      {/* 4. Identification Documents */}
      <div className="p-4 rounded-2xl bg-slate-900/30 dark:bg-black/20 border border-theme-subtle space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-theme-muted block">Identification Documents (Encrypted & Masked)</span>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-theme-muted mb-1">SSN / National ID</label>
            <div className="relative flex items-center">
              <input
                type={showSsn ? "text" : "password"}
                value={values.ssn}
                onChange={(e) => updateField("ssn", e.target.value)}
                placeholder="•••-••-••••"
                className="w-full bg-theme-base border border-theme-subtle rounded-xl pl-3 pr-10 py-2 text-sm focus:border-claw-cyan outline-none text-theme-main font-mono"
              />
              <button
                type="button"
                onClick={() => setShowSsn((prev) => !prev)}
                className="absolute right-2 text-slate-400 hover:text-theme-main p-1 cursor-pointer"
              >
                {showSsn ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-theme-muted mb-1">Passport Number</label>
            <div className="relative flex items-center">
              <input
                type={showPassport ? "text" : "password"}
                value={values.passport}
                onChange={(e) => updateField("passport", e.target.value)}
                placeholder="Passport Number"
                className="w-full bg-theme-base border border-theme-subtle rounded-xl pl-3 pr-10 py-2 text-sm focus:border-claw-cyan outline-none text-theme-main font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassport((prev) => !prev)}
                className="absolute right-2 text-slate-400 hover:text-theme-main p-1 cursor-pointer"
              >
                {showPassport ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-theme-muted mb-1">Driver's License</label>
            <div className="relative flex items-center">
              <input
                type={showLicense ? "text" : "password"}
                value={values.license}
                onChange={(e) => updateField("license", e.target.value)}
                placeholder="License Number"
                className="w-full bg-theme-base border border-theme-subtle rounded-xl pl-3 pr-10 py-2 text-sm focus:border-claw-cyan outline-none text-theme-main font-mono"
              />
              <button
                type="button"
                onClick={() => setShowLicense((prev) => !prev)}
                className="absolute right-2 text-slate-400 hover:text-theme-main p-1 cursor-pointer"
              >
                {showLicense ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
