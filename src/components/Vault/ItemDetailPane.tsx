import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Copy, Check, Lock, Eye, EyeOff, User, Globe, ExternalLink, Download, FileText, Key as KeyIcon, Edit, Trash2, Binary, Terminal, History, Paperclip, CreditCard, Contact, Shield, MapPin, Phone, Mail } from 'lucide-react';
import { VaultItem, VaultItemType, CustomField, CustomFieldLinkedProperty, PasswordHistoryEntry } from '../../types.ts';
import { Favicon } from './Favicon.tsx';
import { TotpDisplay } from './TotpDisplay.tsx';
import { ConfirmDialog } from '../ui/ConfirmDialog.tsx';
import { getPodColor, getTagColor } from '../../lib/podUtils.ts';
import { parseTags } from '../../lib/tagUtils.ts';
import { extractDomain } from '../../lib/urlUtils.ts';
import { downloadAttachment, formatBytes } from '../../lib/attachmentUtils.ts';
import { parseSshKeySecret, formatAuthorizedKeysCommand } from '../../lib/keyGen.ts';
import { formatCardNumber, maskCardNumber, cleanCardNumber, detectCardBrand } from '../../lib/cardUtils.ts';
import { globalIngestionQueue } from '../../lib/habitatImport.ts';

interface ItemDetailPaneProps {
  item: VaultItem | null;
  onClose: () => void;
  onEdit: (item: VaultItem) => void;
  onDelete: (item: VaultItem) => void;
  isLocked: boolean;
  attachmentItemsById: Map<string, VaultItem>;
  /** Phase 19: streams + decrypts an attachment payload on demand. */
  onFetchAttachment?: (id: string) => Promise<string>;
}

export function ItemDetailPane({
  item,
  onClose,
  onEdit,
  onDelete,
  isLocked,
  attachmentItemsById,
  onFetchAttachment
}: ItemDetailPaneProps) {
  const [revealed, setRevealed] = useState(false);
  const [revealedCvv, setRevealedCvv] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [revealedHiddenFields, setRevealedHiddenFields] = useState<Set<string>>(new Set());
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  // Reset state when item changes
  useEffect(() => {
    setRevealed(false);
    setRevealedCvv(false);
    setShowHistory(false);
    setCopyFeedback(null);
    setRevealedHiddenFields(new Set());
    setIsConfirmingDelete(false);
  }, [item?.id]);

  const [, forceQueueUpdate] = useState(0);
  useEffect(() => {
    return globalIngestionQueue.subscribe(() => forceQueueUpdate(n => n + 1));
  }, []);

  const downloadWithFetch = async (att: VaultItem) => {
    if (!onFetchAttachment) return;
    try {
      const dataUrl = await onFetchAttachment(att.id);
      downloadAttachment(dataUrl, att.title || 'attachment');
    } catch (e) {
      console.error('Download failed:', e);
    }
  };

  const handleDownloadPrivateKey = (keyPem: string, itemTitle: string) => {
    const cleanTitle = (itemTitle || 'id_shellguard').toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    const filename = `${cleanTitle}.pem`;
    const blob = new Blob([keyPem], { type: 'application/x-pem-file' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const sshPayload = useMemo(() => {
    if (!item || item.type !== 'key') return null;
    return parseSshKeySecret(item.secret);
  }, [item?.type, item?.secret]);

  const cardDetails = useMemo(() => {
    if (!item || item.type !== 'card') return null;
    let customFields: CustomField[] = [];
    try {
      if (item.custom_fields) {
        const parsed = JSON.parse(item.custom_fields);
        if (Array.isArray(parsed)) customFields = parsed;
      }
    } catch {}

    const findField = (names: string[]) => {
      return customFields.find(f => names.includes(f.name.toLowerCase()))?.value || '';
    };

    const rawNumber = item.secret || '';
    const storedBrand = findField(['card brand', 'brand']);
    const detectedBrand = detectCardBrand(rawNumber);
    const brand = storedBrand || detectedBrand;
    const exp = findField(['expiration']);
    const expMonth = findField(['expiration month']);
    const expYear = findField(['expiration year']);
    const expiration = exp || (expMonth && expYear ? `${expMonth.padStart(2, '0')}/${expYear}` : expMonth || expYear || '••/••');
    const cvv = findField(['security code (cvv)', 'cvv', 'code']);

    const formattedNumber = formatCardNumber(rawNumber);
    const maskedNumber = maskCardNumber(rawNumber);
    const cleanNumber = cleanCardNumber(rawNumber);

    return {
      cardholder: item.username || 'Cardholder',
      number: rawNumber,
      formattedNumber: formattedNumber || rawNumber,
      maskedNumber,
      copyNumber: cleanNumber || rawNumber,
      brand,
      expiration,
      cvv,
    };
  }, [item?.type, item?.secret, item?.username, item?.custom_fields]);

  const identityDetails = useMemo(() => {
    if (!item || item.type !== 'identity') return null;
    let customFields: CustomField[] = [];
    try {
      if (item.custom_fields) {
        const parsed = JSON.parse(item.custom_fields);
        if (Array.isArray(parsed)) customFields = parsed;
      }
    } catch {}

    const getVal = (names: string[]) => {
      const match = customFields.find(f => names.includes(f.name.toLowerCase()));
      return match ? match.value : '';
    };

    const title = getVal(['title']);
    const firstName = getVal(['first name']);
    const middleName = getVal(['middle name']);
    const lastName = getVal(['last name']);
    const fullName = getVal(['full name']) || [firstName, middleName, lastName].filter(Boolean).join(' ') || item.username || item.title;
    const username = getVal(['username']) || (item.username !== fullName ? item.username : '');
    const company = getVal(['company']);
    const email = getVal(['email']);
    const phone = getVal(['phone']);

    const address1 = getVal(['address 1', 'address1']);
    const address2 = getVal(['address 2', 'address2']);
    const address3 = getVal(['address 3', 'address3']);
    const city = getVal(['city']);
    const state = getVal(['state / province', 'state']);
    const postalCode = getVal(['postal code', 'zip']);
    const country = getVal(['country']);
    const location = getVal(['location']) || [city, state, postalCode, country].filter(Boolean).join(', ');
    const fullAddress = [address1, address2, address3, location].filter(Boolean).join('\n');

    const ssn = getVal(['ssn']);
    const passport = getVal(['passport number', 'passport']);
    const license = getVal(['license number', 'license']);

    return {
      title,
      fullName,
      username,
      company,
      email,
      phone,
      address1,
      address2,
      address3,
      city,
      state,
      postalCode,
      country,
      location,
      fullAddress,
      ssn,
      passport,
      license,
    };
  }, [item?.type, item?.title, item?.username, item?.custom_fields]);

  if (isLocked) {
    return (
      <div className="flex-1 h-full flex items-center justify-center bg-theme-base p-8 text-center text-slate-500">
        <div className="flex flex-col items-center gap-4">
          <Lock size={32} className="opacity-50" />
          <p>Vault is locked</p>
        </div>
      </div>
    );
  }

  const handleCopy = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyFeedback(fieldName);
      setTimeout(() => setCopyFeedback(null), 2000);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  const getTypeIcon = (type?: VaultItemType) => {
    switch (type) {
      case "card": return <CreditCard size={16} className="text-amber-500" />;
      case "identity": return <Contact size={16} className="text-blue-500" />;
      case "note": return <FileText size={16} className="text-emerald-500" />;
      case "key": return <Binary size={16} className="text-purple-500" />;
      case "attachment": return <Paperclip size={16} className="text-claw-cyan" />;
      default: return <KeyIcon size={16} className="text-claw-cyan" />;
    }
  };

  // Helper for mobile slide-up sheet vs desktop pane
  const content = (
    <div className="flex flex-col h-full bg-theme-base overflow-hidden relative">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-16 border-b border-theme-subtle bg-theme-surface flex-shrink-0">
        <h3 className="font-bold text-lg">Item Details</h3>
        <div className="flex items-center gap-2">
          {item && (
            <>
              <button 
                onClick={() => onEdit(item)}
                className="p-2 text-slate-500 hover:text-claw-cyan hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                title="Edit Item"
              >
                <Edit size={16} />
              </button>
              <button 
                onClick={() => setIsConfirmingDelete(true)}
                className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                title="Delete Item"
              >
                <Trash2 size={16} />
              </button>
            </>
          )}
          <button 
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer lg:hidden"
            title="Close Details"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Content Stream */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
        {!item ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-4">
            <KeyIcon size={32} className="opacity-20" />
            <p>Select an item to view details</p>
          </div>
        ) : (
          <div className="max-w-xl mx-auto space-y-6">
            
            {/* Title & Icon Header */}
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                <Favicon url={item.url} title={item.title} size={56} />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <h2 className="text-xl font-bold truncate text-theme-main">{item.title}</h2>
                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                  {item.category && item.category !== "all" && (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800/80 border border-theme-subtle">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getPodColor(item.category) }} />
                      <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold">{item.category}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 dark:bg-slate-800/50 px-2 py-0.5 rounded-md border border-transparent">
                    {getTypeIcon(item.type)}
                    <span className="capitalize font-semibold">{item.type || "login"}</span>
                  </div>
                </div>

                {/* Tag Badges */}
                {parseTags(item.tags).length > 0 && (
                  <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                    {parseTags(item.tags).map((tag, idx) => {
                      const color = tag.color || getTagColor(tag.name);
                      return (
                        <span
                          key={`${tag.name}-${idx}`}
                          className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-semibold rounded-lg border shadow-xs"
                          style={{
                            backgroundColor: `${color}18`,
                            borderColor: `${color}40`,
                            color: color,
                          }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                          {tag.name}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Click to Copy Fields */}
            <div className="space-y-3 bg-theme-surface p-1 rounded-2xl border border-theme-subtle shadow-sm">
              
              {/* Username */}
              {item.username && item.type !== 'card' && item.type !== 'identity' && (
                <div className="flex items-center justify-between gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                  <div className="flex items-center gap-3 min-w-0">
                    <User size={16} className="text-slate-400" />
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Username</span>
                      <span className="text-sm font-mono text-theme-main truncate">{item.username}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleCopy(item.username!, "username")}
                    className={`p-2 rounded-lg transition-colors flex-shrink-0 ${copyFeedback === "username" ? "text-green-500 bg-green-500/10" : "text-slate-400 hover:text-claw-cyan hover:bg-claw-cyan/10 opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer"}`}
                  >
                    {copyFeedback === "username" ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              )}

              {/* Standalone Attachment, SSH Key, Credit Card, Identity, or Password / Secret */}
              {item.type === "attachment" ? (
                <div className="p-4 rounded-xl border border-theme-subtle bg-slate-900/30 dark:bg-black/20 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Paperclip size={20} className="text-claw-cyan flex-shrink-0" />
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-semibold text-theme-main truncate">{item.title}</span>
                        <span className="text-xs text-theme-muted font-mono">
                          {typeof (item as any).size_bytes === 'number' ? formatBytes((item as any).size_bytes) : ''}
                          {item.mime_type ? ` • ${item.mime_type}` : ''}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => downloadWithFetch(item)}
                      className="px-3.5 py-2 rounded-xl bg-claw-cyan/10 hover:bg-claw-cyan/20 text-claw-cyan font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                      title="Download Attachment"
                    >
                      <Download size={15} /> Download
                    </button>
                  </div>
                </div>
              ) : item.type === "key" ? (
                <div className="space-y-3 pt-1">
                  {/* Public Key Card (if present) */}
                  {sshPayload?.publicKey && (
                    <div className="p-3.5 rounded-xl border border-theme-subtle bg-slate-900/30 dark:bg-black/20 space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <Globe size={15} className="text-claw-cyan flex-shrink-0" />
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Public Key (OpenSSH)
                          </span>
                          {sshPayload.publicKey.startsWith('ssh-ed25519') ? (
                            <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">Ed25519</span>
                          ) : sshPayload.publicKey.startsWith('ssh-rsa') ? (
                            <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-purple-500/10 text-purple-400 border border-purple-500/20">RSA-4096</span>
                          ) : null}
                        </div>
                      </div>

                      <code className="block text-xs font-mono text-theme-main break-all bg-theme-base/60 border border-theme-subtle rounded-lg p-2.5 select-all">
                        {sshPayload.publicKey}
                      </code>

                      <div className="flex flex-wrap items-center gap-2 pt-0.5">
                        <button
                          onClick={() => handleCopy(sshPayload.publicKey!, "publicKey")}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                            copyFeedback === "publicKey"
                              ? "text-green-400 bg-green-500/10 border border-green-500/30"
                              : "text-slate-300 hover:text-claw-cyan bg-theme-base hover:bg-claw-cyan/10 border border-theme-subtle"
                          }`}
                        >
                          {copyFeedback === "publicKey" ? <Check size={13} /> : <Copy size={13} />}
                          {copyFeedback === "publicKey" ? "Copied Public Key" : "Copy Public Key"}
                        </button>

                        <button
                          onClick={() => handleCopy(formatAuthorizedKeysCommand(sshPayload.publicKey!), "authKeysCmd")}
                          title="Copy one-line command to append this key to remote ~/.ssh/authorized_keys"
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                            copyFeedback === "authKeysCmd"
                              ? "text-green-400 bg-green-500/10 border border-green-500/30"
                              : "text-slate-300 hover:text-claw-cyan bg-theme-base hover:bg-claw-cyan/10 border border-theme-subtle"
                          }`}
                        >
                          {copyFeedback === "authKeysCmd" ? <Check size={13} /> : <Terminal size={13} />}
                          {copyFeedback === "authKeysCmd" ? "Command Copied!" : "Copy authorized_keys Command"}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Private Key Card */}
                  <div className="p-3.5 rounded-xl border border-theme-subtle bg-slate-900/30 dark:bg-black/20 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Lock size={15} className="text-amber-400 flex-shrink-0" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          SSH Private Key (Sealed)
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20">PKCS#8</span>
                      </div>

                      {/* The Eye-beside-Copy action cluster rule */}
                      <div className="flex items-center gap-1">
                        {sshPayload?.privateKey && (
                          <button
                            onClick={() => handleDownloadPrivateKey(sshPayload.privateKey, item.title)}
                            title="Download private key as .pem file"
                            className="p-1.5 text-slate-400 hover:text-claw-cyan hover:bg-claw-cyan/10 rounded-lg transition-colors cursor-pointer"
                          >
                            <Download size={15} />
                          </button>
                        )}
                        <button
                          onClick={() => setRevealed(!revealed)}
                          title={revealed ? "Mask private key" : "Reveal private key"}
                          className="p-1.5 text-slate-400 hover:text-claw-cyan hover:bg-claw-cyan/10 rounded-lg transition-colors cursor-pointer"
                        >
                          {revealed ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                        <button
                          onClick={() => handleCopy(sshPayload?.privateKey || item.secret, "privateKey")}
                          title="Copy private key PEM"
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            copyFeedback === "privateKey"
                              ? "text-green-400 bg-green-500/10"
                              : "text-slate-400 hover:text-claw-cyan hover:bg-claw-cyan/10"
                          }`}
                        >
                          {copyFeedback === "privateKey" ? <Check size={15} /> : <Copy size={15} />}
                        </button>
                      </div>
                    </div>

                    {revealed ? (
                      <pre className="font-mono text-xs text-theme-main whitespace-pre overflow-x-auto p-3 bg-theme-base/80 border border-theme-subtle rounded-lg select-all max-h-56 overflow-y-auto leading-relaxed">
                        {sshPayload?.privateKey || item.secret}
                      </pre>
                    ) : (
                      <div className="flex items-center justify-between p-2.5 bg-theme-base/40 border border-theme-subtle rounded-lg">
                        <span className="text-xs font-mono text-slate-500 tracking-widest">
                          ••••••••••••••••••••••••••••••••••••••••
                        </span>
                        <span className="text-[10px] text-theme-muted font-medium">Click eye to reveal PEM</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : item.type === "card" && cardDetails ? (
                <div className="space-y-3 pt-1">
                  {/* Reef Modernist Credit Card Visual Card */}
                  <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-5 text-white shadow-xl">
                    <div className="absolute -top-12 -right-12 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
                    <div className="absolute -bottom-10 -left-10 w-28 h-28 bg-claw-cyan/10 rounded-full blur-2xl pointer-events-none" />

                    {/* Card Header: Chip and Brand */}
                    <div className="relative z-10 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-7 rounded-md bg-amber-400/20 border border-amber-400/50 flex items-center justify-center p-1">
                          <div className="w-full h-full border border-amber-300/40 rounded-sm grid grid-cols-2 gap-0.5 opacity-80" />
                        </div>
                        <span className="text-xs font-bold tracking-wider uppercase text-amber-300/90 font-mono">
                          {cardDetails.brand}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-amber-400/80">
                        <CreditCard size={20} />
                      </div>
                    </div>

                    {/* Card Number */}
                    <div className="relative z-10 my-5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Card Number
                        </span>
                        {/* Eye-beside-Copy Invariant */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setRevealed(!revealed)}
                            title={revealed ? "Mask card number" : "Reveal card number"}
                            className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                          >
                            {revealed ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopy(cardDetails.copyNumber || cardDetails.number, "card-number")}
                            title="Copy clean card number"
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              copyFeedback === "card-number"
                                ? "text-green-400 bg-green-500/20"
                                : "text-slate-400 hover:text-amber-400 hover:bg-white/10"
                            }`}
                          >
                            {copyFeedback === "card-number" ? <Check size={15} /> : <Copy size={15} />}
                          </button>
                        </div>
                      </div>

                      <div className="mt-1 font-mono text-base sm:text-lg md:text-xl font-bold tracking-wider sm:tracking-widest text-slate-100 select-all whitespace-nowrap overflow-x-auto custom-scrollbar">
                        {revealed ? cardDetails.formattedNumber : cardDetails.maskedNumber}
                      </div>
                    </div>

                    {/* Card Footer: Cardholder, Expiration, CVV */}
                    <div className="relative z-10 grid grid-cols-3 gap-3 pt-2 border-t border-slate-700/60 text-xs">
                      {/* Cardholder */}
                      <div className="col-span-1 min-w-0">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block truncate">
                          Cardholder
                        </span>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="font-semibold text-slate-200 truncate select-all">
                            {cardDetails.cardholder}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(cardDetails.cardholder, "cardholder")}
                            title="Copy cardholder"
                            className={`p-1 rounded transition-colors cursor-pointer ${
                              copyFeedback === "cardholder" ? "text-green-400" : "text-slate-400 hover:text-white"
                            }`}
                          >
                            {copyFeedback === "cardholder" ? <Check size={12} /> : <Copy size={12} />}
                          </button>
                        </div>
                      </div>

                      {/* Expiration */}
                      <div className="col-span-1 text-center min-w-0">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">
                          Expires
                        </span>
                        <span className="font-mono font-bold text-slate-200 mt-0.5 block">
                          {cardDetails.expiration}
                        </span>
                      </div>

                      {/* CVV */}
                      <div className="col-span-1 text-right min-w-0">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">
                          CVV / CVC
                        </span>
                        <div className="flex items-center justify-end gap-1 mt-0.5">
                          <span className="font-mono font-bold text-slate-200 select-all">
                            {revealedCvv ? (cardDetails.cvv || '—') : (cardDetails.cvv ? '•••' : '—')}
                          </span>
                          {cardDetails.cvv && (
                            <div className="flex items-center gap-0.5">
                              {/* Eye-beside-Copy Invariant */}
                              <button
                                type="button"
                                onClick={() => setRevealedCvv(!revealedCvv)}
                                title={revealedCvv ? "Mask CVV" : "Reveal CVV"}
                                className="p-1 text-slate-400 hover:text-amber-400 hover:bg-white/10 rounded transition-colors cursor-pointer"
                              >
                                {revealedCvv ? <EyeOff size={12} /> : <Eye size={12} />}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCopy(cardDetails.cvv, "card-cvv")}
                                title="Copy CVV"
                                className={`p-1 rounded transition-colors cursor-pointer ${
                                  copyFeedback === "card-cvv" ? "text-green-400" : "text-slate-400 hover:text-white"
                                }`}
                              >
                                {copyFeedback === "card-cvv" ? <Check size={12} /> : <Copy size={12} />}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : item.type === "identity" && identityDetails ? (
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
                            {identityDetails.company ? identityDetails.company : ''}
                            {identityDetails.company && identityDetails.username ? ' • ' : ''}
                            {identityDetails.username ? `@${identityDetails.username}` : ''}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(identityDetails.fullName, "iden-fullname")}
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
                            onClick={() => handleCopy(identityDetails.email, "iden-email")}
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
                            onClick={() => handleCopy(identityDetails.phone, "iden-phone")}
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
                            onClick={() => handleCopy(identityDetails.username, "iden-uname")}
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
                          onClick={() => handleCopy(identityDetails.fullAddress, "iden-address")}
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
                  {(identityDetails.ssn || identityDetails.passport || identityDetails.license) && (
                    <div className="p-3.5 rounded-xl border border-theme-subtle bg-slate-900/30 dark:bg-black/20 space-y-2.5">
                      <div className="flex items-center gap-2">
                        <Shield size={15} className="text-amber-400 flex-shrink-0" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Identification Documents
                        </span>
                      </div>

                      {identityDetails.ssn && (
                        <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-theme-surface border border-theme-subtle">
                          <div className="flex flex-col min-w-0">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                              Social Security Number (SSN)
                            </span>
                            <span className="text-xs font-mono text-theme-main truncate mt-0.5">
                              {revealedHiddenFields.has('iden_ssn') ? identityDetails.ssn : '•••••••••'}
                            </span>
                          </div>
                          {/* Eye-beside-Copy Invariant */}
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              type="button"
                              onClick={() => setRevealedHiddenFields(prev => {
                                const next = new Set(prev);
                                if (next.has('iden_ssn')) next.delete('iden_ssn'); else next.add('iden_ssn');
                                return next;
                              })}
                              title={revealedHiddenFields.has('iden_ssn') ? "Mask SSN" : "Reveal SSN"}
                              className="p-1.5 text-slate-400 hover:text-claw-cyan hover:bg-claw-cyan/10 rounded-lg transition-colors cursor-pointer"
                            >
                              {revealedHiddenFields.has('iden_ssn') ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCopy(identityDetails.ssn, "iden-ssn")}
                              title="Copy SSN"
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                copyFeedback === "iden-ssn" ? "text-green-500 bg-green-500/10" : "text-slate-400 hover:text-claw-cyan"
                              }`}
                            >
                              {copyFeedback === "iden-ssn" ? <Check size={14} /> : <Copy size={14} />}
                            </button>
                          </div>
                        </div>
                      )}

                      {identityDetails.passport && (
                        <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-theme-surface border border-theme-subtle">
                          <div className="flex flex-col min-w-0">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                              Passport Number
                            </span>
                            <span className="text-xs font-mono text-theme-main truncate mt-0.5">
                              {revealedHiddenFields.has('iden_passport') ? identityDetails.passport : '•••••••••'}
                            </span>
                          </div>
                          {/* Eye-beside-Copy Invariant */}
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              type="button"
                              onClick={() => setRevealedHiddenFields(prev => {
                                const next = new Set(prev);
                                if (next.has('iden_passport')) next.delete('iden_passport'); else next.add('iden_passport');
                                return next;
                              })}
                              title={revealedHiddenFields.has('iden_passport') ? "Mask Passport" : "Reveal Passport"}
                              className="p-1.5 text-slate-400 hover:text-claw-cyan hover:bg-claw-cyan/10 rounded-lg transition-colors cursor-pointer"
                            >
                              {revealedHiddenFields.has('iden_passport') ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCopy(identityDetails.passport, "iden-passport")}
                              title="Copy Passport Number"
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                copyFeedback === "iden-passport" ? "text-green-500 bg-green-500/10" : "text-slate-400 hover:text-claw-cyan"
                              }`}
                            >
                              {copyFeedback === "iden-passport" ? <Check size={14} /> : <Copy size={14} />}
                            </button>
                          </div>
                        </div>
                      )}

                      {identityDetails.license && (
                        <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-theme-surface border border-theme-subtle">
                          <div className="flex flex-col min-w-0">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                              Driver's License Number
                            </span>
                            <span className="text-xs font-mono text-theme-main truncate mt-0.5">
                              {revealedHiddenFields.has('iden_license') ? identityDetails.license : '•••••••••'}
                            </span>
                          </div>
                          {/* Eye-beside-Copy Invariant */}
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              type="button"
                              onClick={() => setRevealedHiddenFields(prev => {
                                const next = new Set(prev);
                                if (next.has('iden_license')) next.delete('iden_license'); else next.add('iden_license');
                                return next;
                              })}
                              title={revealedHiddenFields.has('iden_license') ? "Mask Driver's License" : "Reveal Driver's License"}
                              className="p-1.5 text-slate-400 hover:text-claw-cyan hover:bg-claw-cyan/10 rounded-lg transition-colors cursor-pointer"
                            >
                              {revealedHiddenFields.has('iden_license') ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCopy(identityDetails.license, "iden-license")}
                              title="Copy Driver's License Number"
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                copyFeedback === "iden-license" ? "text-green-500 bg-green-500/10" : "text-slate-400 hover:text-claw-cyan"
                              }`}
                            >
                              {copyFeedback === "iden-license" ? <Check size={14} /> : <Copy size={14} />}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : item.type === "note" ? null : (
                /* Standard Password Row */
                <div className="flex items-center justify-between gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Lock size={16} className="text-slate-400" />
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Password
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono text-theme-main truncate max-w-full">
                          {revealed ? item.secret : "••••••••••••••••"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {(() => {
                      let histList: PasswordHistoryEntry[] = [];
                      if (item.password_history) {
                        try {
                          const parsed = JSON.parse(item.password_history);
                          if (Array.isArray(parsed)) histList = parsed;
                        } catch {}
                      }
                      if (histList.length === 0) return null;
                      return (
                        <button
                          onClick={() => setShowHistory(!showHistory)}
                          className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                            showHistory ? 'bg-claw-cyan/15 text-claw-cyan border border-claw-cyan/30' : 'text-slate-400 hover:text-theme-main hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                          title="Password History"
                        >
                          <History size={14} />
                          <span className="text-[10px]">{histList.length}</span>
                        </button>
                      );
                    })()}
                    <button
                      onClick={() => setRevealed(!revealed)}
                      className="p-2 text-slate-400 hover:text-claw-cyan hover:bg-claw-cyan/10 rounded-lg transition-colors cursor-pointer"
                    >
                      {revealed ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    <button
                      onClick={() => handleCopy(item.secret, "password")}
                      className={`p-2 rounded-lg transition-colors ${copyFeedback === "password" ? "text-green-500 bg-green-500/10" : "text-slate-400 hover:text-claw-cyan hover:bg-claw-cyan/10 opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer"}`}
                    >
                      {copyFeedback === "password" ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>
              )}

              {/* Password History Drawer */}
              {showHistory && item.password_history && (() => {
                let histList: PasswordHistoryEntry[] = [];
                try {
                  const parsed = JSON.parse(item.password_history);
                  if (Array.isArray(parsed)) histList = parsed;
                } catch {}
                if (histList.length === 0) return null;
                return (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-theme-subtle rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-theme-muted">
                      <span>Password Generation History</span>
                      <button onClick={() => setShowHistory(false)} className="hover:text-theme-main cursor-pointer"><X size={13} /></button>
                    </div>
                    <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                      {histList.slice().reverse().map((hist, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-theme-surface border border-theme-subtle text-xs">
                          <div className="flex flex-col min-w-0">
                            <span className="font-mono text-theme-main truncate select-all">{hist.password}</span>
                            <span className="text-[10px] text-theme-muted">{new Date(hist.generatedAt).toLocaleString()}</span>
                          </div>
                          <button
                            onClick={() => handleCopy(hist.password, `hist-${idx}`)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              copyFeedback === `hist-${idx}` ? "text-green-500 bg-green-500/10" : "text-slate-400 hover:text-claw-cyan"
                            }`}
                            title="Copy Password"
                          >
                            {copyFeedback === `hist-${idx}` ? <Check size={14} /> : <Copy size={14} />}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* URL */}
              {item.url && (
                <div className="flex items-center justify-between gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Globe size={16} className="text-slate-400" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Website</span>
                      <a href={item.url.startsWith('http') ? item.url : `https://${item.url}`} target="_blank" rel="noopener noreferrer" className="text-sm text-claw-cyan hover:underline flex items-center gap-1 truncate">
                        {extractDomain(item.url)} <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>
                  <button
                    onClick={() => handleCopy(item.url!, "url")}
                    className={`p-2 rounded-lg transition-colors flex-shrink-0 ${copyFeedback === "url" ? "text-green-500 bg-green-500/10" : "text-slate-400 hover:text-claw-cyan hover:bg-claw-cyan/10 opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer"}`}
                  >
                    {copyFeedback === "url" ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              )}

              {/* Extra Multi-URIs */}
              {item.uris && (() => {
                let urisList: string[] = [];
                try {
                  const parsed = JSON.parse(item.uris);
                  if (Array.isArray(parsed)) urisList = parsed.filter(Boolean);
                } catch {}
                if (urisList.length === 0) return null;
                return urisList.map((extraUrl, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <Globe size={16} className="text-slate-400" />
                      <div className="flex flex-col min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Additional Website</span>
                        <a href={extraUrl.startsWith('http') ? extraUrl : `https://${extraUrl}`} target="_blank" rel="noopener noreferrer" className="text-sm text-claw-cyan hover:underline flex items-center gap-1 truncate">
                          {extractDomain(extraUrl)} <ExternalLink size={12} />
                        </a>
                      </div>
                    </div>
                    <button
                      onClick={() => handleCopy(extraUrl, `url-${idx}`)}
                      className={`p-2 rounded-lg transition-colors flex-shrink-0 ${copyFeedback === `url-${idx}` ? "text-green-500 bg-green-500/10" : "text-slate-400 hover:text-claw-cyan hover:bg-claw-cyan/10 opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer"}`}
                    >
                      {copyFeedback === `url-${idx}` ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                ));
              })()}
            </div>

            {/* TOTP */}
            {item.totp_secret && (
              <div className="pt-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2 block ml-1">Authenticator Code</span>
                <TotpDisplay secret={item.totp_secret} />
              </div>
            )}

            {/* Notes */}
            {(item.notes || (item.type === "note" && item.secret)) && (
              <div className="pt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block ml-1">
                    {item.type === "note" ? "Secure Note Content" : "Notes"}
                  </span>
                  <button
                    onClick={() => handleCopy(item.notes || item.secret || "", "note-content")}
                    className={`p-1 rounded-md text-xs flex items-center gap-1 transition-colors cursor-pointer ${
                      copyFeedback === "note-content"
                        ? "text-green-500 bg-green-500/10"
                        : "text-slate-400 hover:text-claw-cyan hover:bg-claw-cyan/10"
                    }`}
                    title="Copy note content"
                  >
                    {copyFeedback === "note-content" ? <Check size={13} /> : <Copy size={13} />}
                    <span className="text-[10px] font-semibold">Copy</span>
                  </button>
                </div>
                <div className="bg-theme-surface border border-theme-subtle rounded-xl p-4 text-sm whitespace-pre-wrap leading-relaxed text-theme-main shadow-sm font-mono">
                  {item.notes || item.secret}
                </div>
              </div>
            )}

            {/* Custom Fields */}
            {item.custom_fields && (() => {
              let customFields: CustomField[] = [];
              try {
                const parsed = JSON.parse(item.custom_fields);
                if (Array.isArray(parsed)) customFields = parsed;
              } catch {}

              // Filter out handled fields for card and identity to avoid duplication
              if (item.type === 'card') {
                const cardHandled = new Set(['card brand', 'brand', 'expiration', 'expiration month', 'expiration year', 'security code (cvv)', 'cvv', 'code']);
                customFields = customFields.filter(f => !cardHandled.has(f.name.toLowerCase()));
              } else if (item.type === 'identity') {
                const idenHandled = new Set([
                  'title', 'first name', 'middle name', 'last name', 'full name',
                  'username', 'company', 'email', 'phone', 'address 1', 'address 2',
                  'address 3', 'city', 'state / province', 'state', 'postal code',
                  'country', 'location', 'ssn', 'passport number', 'passport',
                  'license number', 'license'
                ]);
                customFields = customFields.filter(f => !idenHandled.has(f.name.toLowerCase()));
              }

              if (customFields.length === 0) return null;

              const resolveLinkedValue = (cf: CustomField): string => {
                switch (cf.linkedProperty) {
                  case "password": return item.secret || "";
                  case "username": return item.username || "";
                  case "url": return item.url || "";
                  case "notes": return item.notes || "";
                  case "totp": return ""; // rendered with TotpDisplay
                  default: return "";
                }
              };

              return (
                <div className="pt-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2 block ml-1">Custom Fields</span>
                  <div className="flex flex-col gap-2">
                    {customFields.map(cf => (
                      <div key={cf.id} className="flex items-center justify-between p-3 rounded-xl border border-theme-subtle bg-theme-surface">
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="text-xs font-semibold text-theme-muted uppercase tracking-wider truncate">{cf.name}</span>
                          {cf.type === "checkbox" ? (
                            <span className={`text-sm font-bold mt-0.5 ${cf.value === "true" ? "text-green-600" : "text-slate-500"}`}>
                              {cf.value === "true" ? "☑ Enabled" : "☐ Disabled"}
                            </span>
                          ) : cf.type === "linked" && cf.linkedProperty === "totp" ? (
                            <div className="mt-1"><TotpDisplay secret={item.totp_secret || ""} /></div>
                          ) : cf.type === "linked" ? (
                            <span className="text-sm font-mono mt-0.5 text-theme-main truncate">{resolveLinkedValue(cf) || "—"}</span>
                          ) : cf.type === "hidden" ? (
                            <div className="flex items-center mt-0.5">
                              <span className="text-sm font-mono text-theme-main truncate">
                                {revealedHiddenFields.has(cf.id) ? cf.value : "••••••••••••••••"}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm font-mono mt-0.5 text-theme-main truncate">{cf.value || "—"}</span>
                          )}
                        </div>
                        {/* Phase 19 fold-in: Unmask (Eye) sits immediately LEFT of Copy
                            in the right-hand action cluster on every masked row. */}
                        {cf.type === "hidden" && (
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              type="button"
                              onClick={() => setRevealedHiddenFields(prev => {
                                const next = new Set(prev);
                                if (next.has(cf.id)) next.delete(cf.id); else next.add(cf.id);
                                return next;
                              })}
                              className="p-2 text-slate-400 hover:text-claw-cyan hover:bg-claw-cyan/10 rounded-lg transition-colors cursor-pointer"
                            >
                              {revealedHiddenFields.has(cf.id) ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                            {cf.value && (
                              <button
                                type="button"
                                onClick={() => handleCopy(cf.value, `custom_${cf.id}`)}
                                className={`p-2 rounded-lg transition-colors cursor-pointer ${copyFeedback === `custom_${cf.id}` ? "text-green-500 bg-green-500/10" : "text-slate-400 hover:text-claw-cyan hover:bg-claw-cyan/10"}`}
                              >
                                {copyFeedback === `custom_${cf.id}` ? <Check size={14} /> : <Copy size={14} />}
                              </button>
                            )}
                          </div>
                        )}
                        {cf.type === "text" && cf.value && (
                          <button
                            type="button"
                            onClick={() => handleCopy(cf.value, `custom_${cf.id}`)}
                            className={`p-2 rounded-lg transition-colors flex-shrink-0 cursor-pointer ${copyFeedback === `custom_${cf.id}` ? "text-green-500 bg-green-500/10" : "text-slate-400 hover:text-claw-cyan hover:bg-claw-cyan/10"}`}
                          >
                            {copyFeedback === `custom_${cf.id}` ? <Check size={14} /> : <Copy size={14} />}
                          </button>
                        )}
                        {cf.type === "linked" && cf.linkedProperty !== "totp" && resolveLinkedValue(cf) && (
                          <button
                            type="button"
                            onClick={() => handleCopy(resolveLinkedValue(cf), `custom_${cf.id}`)}
                            className={`p-2 rounded-lg transition-colors flex-shrink-0 cursor-pointer ${copyFeedback === `custom_${cf.id}` ? "text-green-500 bg-green-500/10" : "text-slate-400 hover:text-claw-cyan hover:bg-claw-cyan/10"}`}
                          >
                            {copyFeedback === `custom_${cf.id}` ? <Check size={14} /> : <Copy size={14} />}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Attachments & Reactive In-Flight Ingestion State */}
            {(() => {
              let parsedIds: string[] = [];
              if (item.attachments) {
                try {
                  parsedIds = JSON.parse(item.attachments);
                } catch (e) {
                  // Ignore
                }
              }
              const actualAttachments = parsedIds.map(id => attachmentItemsById.get(id)).filter(Boolean) as VaultItem[];
              const inFlight = globalIngestionQueue.getParentItemStatus(item.id);

              if (actualAttachments.length === 0 && !inFlight.hasActive && inFlight.status !== 'verified') {
                return null;
              }

              return (
                <div className="pt-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2 block ml-1">Attachments</span>
                  <div className="flex flex-col gap-2">
                    {/* Glowing Pulsing Chip for in-flight background upload */}
                    {inFlight.hasActive && (
                      <div className="flex items-center justify-between p-3 rounded-xl border border-claw-cyan/50 bg-claw-cyan/10 shadow-sm shadow-claw-cyan/10 animate-pulse">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Paperclip size={15} className="text-claw-cyan animate-spin shrink-0" />
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-semibold text-claw-cyan truncate">
                              {inFlight.fileName || 'Attachment'}
                            </span>
                            <span className="text-[10px] text-claw-cyan/80">
                              Background Ingestion in progress...
                            </span>
                          </div>
                        </div>
                        <span className="text-[11px] font-mono font-bold text-claw-cyan bg-claw-cyan/20 px-2.5 py-1 rounded-full border border-claw-cyan/30">
                          Uploading {inFlight.progressPercent || 0}%...
                        </span>
                      </div>
                    )}

                    {/* Recently Verified Ready Chip */}
                    {!inFlight.hasActive && inFlight.status === 'verified' && (
                      <div className="flex items-center justify-between p-2.5 px-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10">
                        <div className="flex items-center gap-2 min-w-0">
                          <Check size={14} className="text-emerald-400 shrink-0" />
                          <span className="text-xs font-semibold text-emerald-300 truncate">
                            {inFlight.fileName || 'Attachment'}
                          </span>
                        </div>
                        <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full">
                          Verified
                        </span>
                      </div>
                    )}

                    {/* Persisted Attachments */}
                    {actualAttachments.map(att => (
                      <div key={att.id} className="flex items-center justify-between p-3 rounded-xl border border-theme-subtle bg-theme-surface hover:border-claw-cyan/40 transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <FileText size={16} className="text-slate-400 flex-shrink-0" />
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm font-semibold truncate text-theme-main">{att.title}</span>
                            <span className="text-[10px] text-theme-muted uppercase tracking-wider">
                              {typeof (att as any).size_bytes === 'number'
                                ? `${((att as any).size_bytes / 1024).toFixed(1)} KB`
                                : `${(att.mime_type || '').toUpperCase()}`}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => downloadWithFetch(att)}
                            className="p-2 text-slate-400 hover:text-claw-cyan hover:bg-claw-cyan/10 rounded-lg transition-colors cursor-pointer"
                            title="Download"
                          >
                            <Download size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop static pane (hidden on small screens) */}
      <div className="hidden lg:block h-full border-l border-theme-subtle w-full">
        {content}
      </div>

      {/* Mobile slide-up sheet */}
      <AnimatePresence>
        {item && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="lg:hidden fixed inset-0 bg-black/40 z-40"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="lg:hidden fixed inset-x-0 bottom-0 top-[10%] z-50 rounded-t-3xl shadow-2xl overflow-hidden border-t border-theme-subtle flex flex-col bg-theme-base"
            >
              {/* Drag Handle purely visual */}
              <div className="w-full h-6 bg-theme-surface flex items-center justify-center flex-shrink-0 rounded-t-3xl border-b border-theme-subtle pt-2 pb-1 cursor-grab active:cursor-grabbing">
                <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full" />
              </div>
              <div className="flex-1 min-h-0">
                {content}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete Item Confirm Dialog */}
      <ConfirmDialog
        isOpen={isConfirmingDelete}
        title="Delete Vault Item"
        description={`Are you sure you want to delete "${item?.title || 'this item'}"? This action cannot be undone and will cascade to any associated attachments.`}
        confirmText="Delete Item"
        cancelText="Cancel"
        onConfirm={() => {
          setIsConfirmingDelete(false);
          if (item) {
            onDelete(item);
          }
        }}
        onCancel={() => setIsConfirmingDelete(false)}
      />
    </>
  );
}
