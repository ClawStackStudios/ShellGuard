import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Copy, Check, Lock, Eye, EyeOff, User, Globe, ExternalLink, Download, FileText, Key as KeyIcon, Edit, Trash2, Binary } from 'lucide-react';
import { VaultItem, VaultItemType } from '../../types.ts';
import { Favicon } from './Favicon.tsx';
import { TotpDisplay } from './TotpDisplay.tsx';
import { getPodColor } from '../../lib/podUtils.ts';
import { extractDomain } from '../../lib/urlUtils.ts';
import { downloadAttachment } from '../../lib/attachmentUtils.ts';

interface ItemDetailPaneProps {
  item: VaultItem | null;
  onClose: () => void;
  onEdit: (item: VaultItem) => void;
  onDelete: (item: VaultItem) => void;
  isLocked: boolean;
  attachmentItemsById: Map<string, VaultItem>;
}

export function ItemDetailPane({
  item,
  onClose,
  onEdit,
  onDelete,
  isLocked,
  attachmentItemsById
}: ItemDetailPaneProps) {
  const [revealed, setRevealed] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  // Reset state when item changes
  useEffect(() => {
    setRevealed(false);
    setCopyFeedback(null);
  }, [item?.id]);

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
      case "note": return <FileText size={16} className="text-emerald-500" />;
      case "key": return <Binary size={16} className="text-purple-500" />;
      default: return <KeyIcon size={16} className="text-claw-cyan" />;
    }
  };

  // Helper for mobile slide-up sheet vs desktop pane
  const content = (
    <div className="flex flex-col h-full bg-theme-base overflow-hidden relative">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-theme-subtle bg-theme-surface flex-shrink-0">
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
                onClick={() => onDelete(item)}
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
              </div>
            </div>

            {/* Click to Copy Fields */}
            <div className="space-y-3 bg-theme-surface p-1 rounded-2xl border border-theme-subtle shadow-sm">
              
              {/* Username */}
              {item.username && (
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

              {/* Password / Secret */}
              <div className="flex items-center justify-between gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <Lock size={16} className="text-slate-400" />
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      {item.type === "note" ? "Secure Content" : (item.type === "key" ? "Private Key" : "Password")}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono text-theme-main truncate max-w-full">
                        {revealed ? item.secret : "••••••••••••••••"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
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
            </div>

            {/* TOTP */}
            {item.totp_secret && (
              <div className="pt-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2 block ml-1">Authenticator Code</span>
                <TotpDisplay secret={item.totp_secret} />
              </div>
            )}

            {/* Notes */}
            {item.notes && (
              <div className="pt-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2 block ml-1">Notes</span>
                <div className="bg-theme-surface border border-theme-subtle rounded-xl p-4 text-sm whitespace-pre-wrap leading-relaxed text-theme-main shadow-sm">
                  {item.notes}
                </div>
              </div>
            )}

            {/* Attachments */}
            {item.attachments && (() => {
              let parsedIds: string[] = [];
              try {
                parsedIds = JSON.parse(item.attachments);
              } catch (e) {
                // Ignore
              }
              const actualAttachments = parsedIds.map(id => attachmentItemsById.get(id)).filter(Boolean) as VaultItem[];
              
              if (actualAttachments.length > 0) {
                return (
                  <div className="pt-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2 block ml-1">Attachments</span>
                    <div className="flex flex-col gap-2">
                      {actualAttachments.map(att => (
                        <div key={att.id} className="flex items-center justify-between p-3 rounded-xl border border-theme-subtle bg-theme-surface hover:border-claw-cyan/40 transition-colors">
                          <div className="flex items-center gap-3 min-w-0">
                            <FileText size={16} className="text-slate-400 flex-shrink-0" />
                            <div className="flex flex-col min-w-0">
                              <span className="text-sm font-semibold truncate text-theme-main">{att.title}</span>
                              <span className="text-[10px] text-theme-muted uppercase tracking-wider">{(att.secret.length / 1024).toFixed(1)} KB</span>
                            </div>
                          </div>
                          <button
                            onClick={() => downloadAttachment(att.secret, att.title || "attachment")}
                            className="p-2 text-slate-400 hover:text-claw-cyan hover:bg-claw-cyan/10 rounded-lg transition-colors cursor-pointer"
                            title="Download"
                          >
                            <Download size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }
              return null;
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
    </>
  );
}
