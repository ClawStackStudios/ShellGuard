import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Lock, Eye, EyeOff, Globe, Sparkles, Paperclip, Upload, Plus, AlertTriangle, RefreshCw, Check, Zap } from 'lucide-react';
import { VaultItem, VaultItemType, CustomField, CustomFieldType, CustomFieldLinkedProperty } from '../../types.ts';
import { FolderInputGroup } from './FolderInputGroup.tsx';
import { PendingAttachment, formatBytes, MAX_ATTACHMENT_BYTES } from '../../lib/attachmentUtils.ts';
import { generateUUID } from '../../lib/crypto.ts';
import { extractDomain } from '../../lib/urlUtils.ts';
import { generatePassword, getGlobalGeneratorConfig, GeneratorConfig } from '../../lib/generator.ts';

// We inline Favicon and PasswordStrengthIndicator here for simplicity if needed, 
// or import them if they are exported.
import { Favicon } from './Favicon.tsx';
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator.tsx';

interface ItemFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: VaultItem[];
  initialItem?: VaultItem | null;
  initialType?: VaultItemType;
  onSave: (data: {
    title: string;
    secret: string;
    username: string;
    url: string;
    category: string;
    type: VaultItemType;
    notes?: string;
    totp_secret?: string;
    attachments?: string;
    custom_fields?: string;
    newAttachments?: PendingAttachment[];
    removedAttachmentIds?: string[];
  }) => Promise<void>;
}

export function ItemFormModal({
  isOpen,
  onClose,
  items,
  initialItem,
  initialType = 'password',
  onSave
}: ItemFormModalProps) {
  // Form State
  const [type, setType] = useState<VaultItemType>(initialType);
  const [title, setTitle] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState("all");
  
  // Extra fields
  const [notes, setNotes] = useState("");
  const [totpSecret, setTotpSecret] = useState("");
  
  // Field visibility
  const [showNoteField, setShowNoteField] = useState(false);
  const [showTotpField, setShowTotpField] = useState(false);
  const [showAttachmentField, setShowAttachmentField] = useState(false);
  const [isExtraDropdownOpen, setIsExtraDropdownOpen] = useState(false);
  
  // Attachments
  const [linkedAttachmentIds, setLinkedAttachmentIds] = useState<string[]>([]);
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);
  const [removedAttachmentIds, setRemovedAttachmentIds] = useState<string[]>([]);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);

  // Custom Fields
  const [customFieldsState, setCustomFieldsState] = useState<CustomField[]>([]);
  const [isAddFieldOpen, setIsAddFieldOpen] = useState(false);
  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldType, setNewFieldType] = useState<CustomFieldType>("text");
  const [newFieldLinkedProperty, setNewFieldLinkedProperty] = useState<CustomFieldLinkedProperty>("username");
  const [newFieldValue, setNewFieldValue] = useState("");

  // UI State
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize form when opened or initialItem changes
  useEffect(() => {
    if (isOpen) {
      if (initialItem) {
        setType(initialItem.type || 'password');
        setTitle(initialItem.title || "");
        setUsername(initialItem.username || "");
        setPassword(initialItem.secret || "");
        setUrl(initialItem.url || "");
        setCategory(initialItem.category || "all");
        
        if (initialItem.notes) {
          setNotes(initialItem.notes);
          setShowNoteField(true);
        } else {
          setNotes("");
          setShowNoteField(false);
        }
        
        if (initialItem.totp_secret) {
          setTotpSecret(initialItem.totp_secret);
          setShowTotpField(true);
        } else {
          setTotpSecret("");
          setShowTotpField(false);
        }

        if (initialItem.attachments) {
          try {
            const ids = JSON.parse(initialItem.attachments);
            if (ids.length > 0) {
              setLinkedAttachmentIds(ids);
              setShowAttachmentField(true);
            } else {
              setLinkedAttachmentIds([]);
              setShowAttachmentField(false);
            }
          } catch {
            setLinkedAttachmentIds([]);
            setShowAttachmentField(false);
          }
        } else {
          setLinkedAttachmentIds([]);
          setShowAttachmentField(false);
        }

        // Parse custom fields from existing item
        if (initialItem.custom_fields) {
          try {
            const parsed = JSON.parse(initialItem.custom_fields);
            if (Array.isArray(parsed)) setCustomFieldsState(parsed);
          } catch { setCustomFieldsState([]); }
        } else {
          setCustomFieldsState([]);
        }
      } else {
        // Reset for Add
        setType(initialType);
        setTitle("");
        setUsername("");
        setPassword("");
        setUrl("");
        setCategory("all");
        setNotes("");
        setTotpSecret("");
        setShowNoteField(false);
        setShowTotpField(false);
        setShowAttachmentField(false);
        setLinkedAttachmentIds([]);
        setCustomFieldsState([]);
        setIsAddFieldOpen(false);
        setNewFieldName("");
        setNewFieldValue("");
        setNewFieldType("text");
        setNewFieldLinkedProperty("username");
      }
      setPendingAttachments([]);
      setRemovedAttachmentIds([]);
      setAttachmentError(null);
      setIsExtraDropdownOpen(false);
      setShowPassword(false);
      setIsSaving(false);
    }
  }, [isOpen, initialItem, initialType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !password) return;

    setIsSaving(true);
    try {
      await onSave({
        title,
        secret: password,
        username,
        url,
        category,
        type,
        notes: showNoteField ? notes : "",
        totp_secret: showTotpField ? totpSecret : "",
        attachments: JSON.stringify(linkedAttachmentIds),
        custom_fields: customFieldsState.length > 0 ? JSON.stringify(customFieldsState) : "",
        newAttachments: pendingAttachments,
        removedAttachmentIds
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleGeneratePassword = () => {
    const config = getGlobalGeneratorConfig();
    setPassword(generatePassword(config));
    setShowPassword(true);
  };

  const stageAttachmentFile = (file: File) => {
    if (file.size > MAX_ATTACHMENT_BYTES) {
      setAttachmentError(`File ${file.name} exceeds 10MB limit.`);
      return;
    }
    setAttachmentError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setPendingAttachments(prev => [
          ...prev, 
          {
            id: generateUUID(),
            file_name: file.name,
            size: file.size,
            dataUrl: e.target!.result!.toString()
          }
        ]);
      }
    };
    reader.readAsDataURL(file);
  };

  const openAttachmentPicker = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = (e: any) => {
      if (e.target.files && e.target.files.length > 0) {
        stageAttachmentFile(e.target.files[0]);
      }
    };
    input.click();
  };

  const removeLinkedAttachment = (id: string) => {
    setLinkedAttachmentIds(prev => prev.filter(attId => attId !== id));
    setRemovedAttachmentIds(prev => [...prev, id]);
  };

  if (!isOpen) return null;

  const isEdit = !!initialItem;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl bg-theme-surface border-2 border-claw-cyan/40 rounded-3xl p-6 md:p-8 shadow-xl relative my-auto"
      >
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-theme-subtle">
            <div className="flex items-center gap-3">
              <Favicon url={url} title={title || "Password"} size={44} />
              <div>
                <h3 className="text-xl font-bold text-theme-main capitalize">
                  {isEdit ? `Edit ${type}` : `Add New ${type}`}
                </h3>
                <p className="text-xs text-theme-muted">
                  {url ? `Preview for ${extractDomain(url) || "service"}` : "Enter item details"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-theme-muted hover:text-theme-main p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Title */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-theme-muted mb-2">
                Title <span className="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Item Title"
                className="w-full bg-theme-base border border-theme-subtle rounded-xl px-4 py-3 text-sm focus:border-claw-cyan focus:ring-1 focus:ring-claw-cyan outline-none transition-all text-theme-main placeholder:text-slate-400"
              />
            </div>

            {/* Folder */}
            <div>
              <FolderInputGroup
                category={category}
                onChange={setCategory}
                items={items}
                label="Pod (Category)"
              />
            </div>

            {/* Password/Login specifics */}
            {type === 'password' && (
              <>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-theme-muted mb-2">Username / Email</label>
                  <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. captain@ocean.reef"
                    className="w-full bg-theme-base border border-theme-subtle rounded-xl px-4 py-3 text-sm focus:border-claw-cyan outline-none transition-all text-theme-main font-mono"
                  />
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-theme-muted">Password <span className="text-red-500">*</span></label>
                    <button type="button" onClick={handleGeneratePassword} className="text-xs font-semibold text-claw-cyan hover:text-cyan-600 flex items-center gap-1">
                      <Sparkles size={13} /> Generate
                    </button>
                  </div>
                  <div className="relative flex items-center">
                    <input 
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••••••"
                      className="w-full bg-theme-base border border-theme-subtle rounded-xl pl-4 pr-12 py-3 text-sm focus:border-claw-cyan outline-none transition-all text-theme-main font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 text-slate-400 hover:text-theme-main p-1"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <PasswordStrengthIndicator password={password} />
                </div>

                <div className="col-span-1 md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-theme-muted mb-2">Website URL</label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"><Globe size={16} /></div>
                    <input 
                      type="text" 
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://"
                      className="w-full bg-theme-base border border-theme-subtle rounded-xl pl-10 pr-4 py-3 text-sm focus:border-claw-cyan outline-none transition-all text-theme-main"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Note Specifics */}
            {type === 'note' && (
              <div className="col-span-1 md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-theme-muted mb-2">Secure Note Content <span className="text-red-500">*</span></label>
                <textarea
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Secure note here..."
                  className="w-full bg-theme-base border border-theme-subtle rounded-xl px-4 py-3 text-sm focus:border-claw-cyan outline-none transition-all text-theme-main min-h-[150px] font-mono"
                />
              </div>
            )}

            {/* Extra Fields Section */}
            {(type === 'password' || type === 'note') && (
              <>
                {showNoteField && type === 'password' && (
                  <div className="col-span-1 md:col-span-2 relative">
                    <label className="block text-xs font-bold uppercase tracking-wider text-theme-muted mb-2">Note</label>
                    <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full bg-theme-base border border-theme-subtle rounded-xl px-4 py-3 text-sm focus:border-claw-cyan outline-none transition-all text-theme-main min-h-[80px]" />
                    <button type="button" onClick={() => setShowNoteField(false)} className="absolute top-8 right-3 text-slate-400 hover:text-red-500"><X size={16}/></button>
                  </div>
                )}
                {showTotpField && (
                  <div className="col-span-1 md:col-span-2 relative">
                    <label className="block text-xs font-bold uppercase tracking-wider text-theme-muted mb-2">TOTP Secret</label>
                    <input type="text" value={totpSecret} onChange={(e) => setTotpSecret(e.target.value)} className="w-full bg-theme-base border border-theme-subtle rounded-xl px-4 py-3 text-sm focus:border-claw-cyan outline-none transition-all text-theme-main font-mono uppercase" />
                    <button type="button" onClick={() => setShowTotpField(false)} className="absolute top-8 right-3 text-slate-400 hover:text-red-500"><X size={16}/></button>
                  </div>
                )}
                {showAttachmentField && (
                  <div className="col-span-1 md:col-span-2 relative">
                    <label className="block text-xs font-bold uppercase tracking-wider text-theme-muted mb-2">Attachments (max 10MB)</label>
                    <button type="button" onClick={() => setShowAttachmentField(false)} className="absolute -top-1 right-0 text-slate-400 hover:text-red-500"><X size={16}/></button>
                    <div onClick={openAttachmentPicker} className="w-full border-2 border-dashed border-claw-cyan/50 rounded-xl p-6 flex flex-col items-center justify-center bg-claw-cyan/5 hover:bg-claw-cyan/10 transition-colors cursor-pointer text-center">
                      <Upload size={28} className="text-claw-cyan/60 mb-2" />
                      <p className="text-theme-main font-bold">Click to browse file</p>
                    </div>
                    {attachmentError && <p className="mt-2 text-xs text-red-500">{attachmentError}</p>}
                    
                    {/* Linked existing attachments */}
                    {linkedAttachmentIds.length > 0 && (
                      <ul className="mt-3 space-y-2">
                        {linkedAttachmentIds.map(id => {
                          const att = items.find(i => i.id === id);
                          if (!att) return null;
                          return (
                            <li key={id} className="flex items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/50 border border-theme-subtle rounded-xl px-3 py-2">
                              <span className="text-sm text-theme-main truncate">{att.title || "File"}</span>
                              <button type="button" onClick={() => removeLinkedAttachment(id)} className="text-slate-400 hover:text-red-500"><X size={14}/></button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                    {/* Pending attachments */}
                    {pendingAttachments.length > 0 && (
                      <ul className="mt-3 space-y-2">
                        {pendingAttachments.map(att => (
                          <li key={att.id} className="flex items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/50 border border-theme-subtle rounded-xl px-3 py-2">
                            <span className="text-sm text-theme-main truncate">{att.file_name} <span className="text-xs text-theme-muted font-mono">{formatBytes(att.size)}</span> (New)</span>
                            <button type="button" onClick={() => setPendingAttachments(prev => prev.filter(a => a.id !== att.id))} className="text-slate-400 hover:text-red-500"><X size={14}/></button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {/* ── Custom Fields List ── */}
                {customFieldsState.length > 0 && (
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-theme-muted mb-2">Custom Fields</label>
                    <div className="space-y-2">
                      {customFieldsState.map((cf) => (
                        <div key={cf.id} className="flex items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/50 border border-theme-subtle rounded-xl px-3 py-2">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="text-xs font-bold uppercase tracking-wider text-theme-muted shrink-0 w-16 truncate">{cf.type === "checkbox" ? "☑" : cf.type === "hidden" ? "🔒" : cf.type === "linked" ? "🔗" : "📝"}</span>
                            <span className="text-sm font-semibold text-theme-main truncate">{cf.name}</span>
                            {cf.type === "checkbox" && (
                              <span className={`text-xs font-bold ${cf.value === "true" ? "text-green-600" : "text-slate-500"}`}>{cf.value === "true" ? "ON" : "OFF"}</span>
                            )}
                            {cf.type === "linked" && (
                              <span className="text-xs text-claw-cyan italic">→ {cf.linkedProperty}</span>
                            )}
                            {(cf.type === "text" || cf.type === "hidden") && (
                              <span className="text-xs text-theme-muted font-mono truncate max-w-[120px]">{cf.type === "hidden" ? "••••••••" : cf.value}</span>
                            )}
                          </div>
                          <button type="button" onClick={() => setCustomFieldsState(prev => prev.filter(f => f.id !== cf.id))} className="text-slate-400 hover:text-red-500 shrink-0"><X size={14}/></button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Inline Custom Field Builder Form ── */}
                {isAddFieldOpen && (
                  <div className="col-span-1 md:col-span-2 border border-claw-cyan/40 rounded-xl p-3 bg-claw-cyan/5 space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-claw-cyan">New Custom Field</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input type="text" autoFocus value={newFieldName} onChange={(e) => setNewFieldName(e.target.value)} placeholder="Field name (e.g. PIN, Security Answer)" className="col-span-2 bg-theme-base border border-theme-subtle rounded-lg px-3 py-2 text-xs focus:border-claw-cyan outline-none text-theme-main" />
                      <select value={newFieldType} onChange={(e) => setNewFieldType(e.target.value as CustomFieldType)} className="bg-theme-base border border-theme-subtle rounded-lg px-3 py-2 text-xs focus:border-claw-cyan outline-none text-theme-main cursor-pointer">
                        <option value="text">📝 Text</option>
                        <option value="hidden">🔒 Hidden</option>
                        <option value="checkbox">☑️ Checkbox</option>
                        <option value="linked">🔗 Linked</option>
                      </select>
                      {newFieldType === "linked" ? (
                        <select value={newFieldLinkedProperty} onChange={(e) => setNewFieldLinkedProperty(e.target.value as CustomFieldLinkedProperty)} className="bg-theme-base border border-theme-subtle rounded-lg px-3 py-2 text-xs focus:border-claw-cyan outline-none text-theme-main cursor-pointer">
                          <option value="username">Username</option>
                          <option value="password">Password</option>
                          <option value="url">URL</option>
                          <option value="notes">Notes</option>
                          <option value="totp">TOTP</option>
                        </select>
                      ) : newFieldType === "checkbox" ? (
                        <div className="flex items-center gap-2">
                          <button type="button" onClick={() => setNewFieldValue(newFieldValue === "true" ? "false" : "true")} className={`px-3 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${newFieldValue === "true" ? "bg-green-500 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-500"}`}>
                            {newFieldValue === "true" ? "ON" : "OFF"}
                          </button>
                        </div>
                      ) : (
                        <input type={newFieldType === "hidden" ? "password" : "text"} value={newFieldValue} onChange={(e) => setNewFieldValue(e.target.value)} placeholder="Field value" className="bg-theme-base border border-theme-subtle rounded-lg px-3 py-2 text-xs focus:border-claw-cyan outline-none text-theme-main" />
                      )}
                    </div>
                    <div className="flex gap-2 justify-end pt-1">
                      <button type="button" onClick={() => setIsAddFieldOpen(false)} className="px-3 py-1.5 text-xs text-theme-muted hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer">Cancel</button>
                      <button type="button" disabled={!newFieldName.trim()} onClick={() => {
                        if (newFieldName.trim()) {
                          setCustomFieldsState(prev => [...prev, {
                            id: generateUUID(),
                            name: newFieldName.trim(),
                            type: newFieldType,
                            value: newFieldType === "checkbox" ? (newFieldValue || "false") : newFieldValue,
                            ...(newFieldType === "linked" ? { linkedProperty: newFieldLinkedProperty } : {})
                          }]);
                          setNewFieldName("");
                          setNewFieldValue("");
                          setNewFieldType("text");
                          setIsAddFieldOpen(false);
                        }
                      }} className="px-3 py-1.5 text-xs font-bold bg-claw-cyan text-white rounded-lg hover:bg-cyan-600 transition-colors disabled:opacity-50 cursor-pointer">Add Field</button>
                    </div>
                  </div>
                )}

                {/* ── Unified Add Extra Field Button & Dropdown ── */}
                <div className="col-span-1 md:col-span-2 relative">
                  <button type="button" onClick={() => setIsExtraDropdownOpen(!isExtraDropdownOpen)} className="w-full border-2 border-dashed border-claw-cyan/50 rounded-xl py-3 text-claw-cyan font-bold hover:bg-claw-cyan/5 flex justify-center items-center gap-2 transition-colors cursor-pointer text-sm">
                    <Plus size={16} /> Add Extra Field
                  </button>
                  {isExtraDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setIsExtraDropdownOpen(false)} />
                      <motion.div 
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                        className="absolute bottom-full mb-2 w-52 bg-theme-surface border border-theme-subtle rounded-xl shadow-2xl z-20 py-2 left-1/2 -translate-x-1/2"
                      >
                        {!showNoteField && type === 'password' && (
                          <button type="button" onClick={() => { setShowNoteField(true); setIsExtraDropdownOpen(false); }} className="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-medium flex items-center gap-2 text-theme-main cursor-pointer">
                            📝 Note
                          </button>
                        )}
                        {!showTotpField && (
                          <button type="button" onClick={() => { setShowTotpField(true); setIsExtraDropdownOpen(false); }} className="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-medium flex items-center gap-2 text-theme-main cursor-pointer">
                            ⏱️ TOTP Secret
                          </button>
                        )}
                        {!showAttachmentField && (
                          <button type="button" onClick={() => { setShowAttachmentField(true); setIsExtraDropdownOpen(false); }} className="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-medium flex items-center gap-2 text-theme-main cursor-pointer">
                            📎 Attachment
                          </button>
                        )}
                        <button type="button" onClick={() => { setIsAddFieldOpen(true); setIsExtraDropdownOpen(false); setNewFieldName(""); setNewFieldValue(""); setNewFieldType("text"); }} className="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-medium flex items-center gap-2 text-theme-main cursor-pointer border-t border-theme-subtle/50">
                          ✨ Custom Field
                        </button>
                      </motion.div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-6 border-t border-theme-subtle">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-theme-muted hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-medium text-sm transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={!title.trim() || !password || isSaving} className="px-6 py-2.5 bg-gradient-to-r from-claw-cyan to-deep-teal hover:from-cyan-500 hover:to-teal-600 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/20 disabled:opacity-50 transition-all flex items-center gap-2 text-sm">
              {isSaving ? <RefreshCw size={16} className="animate-spin" /> : <Check size={16} />}
              {isSaving ? (isEdit ? "Updating..." : "Saving...") : (isEdit ? "Save Changes" : "Save Item")}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
