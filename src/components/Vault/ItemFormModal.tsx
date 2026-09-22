import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Lock, Eye, EyeOff, Globe, Sparkles, Paperclip, Upload, Plus, AlertTriangle, RefreshCw, Check, Zap, Terminal, History, Copy, Trash2 } from 'lucide-react';
import { VaultItem, VaultItemType, CustomField, CustomFieldType, CustomFieldLinkedProperty, Tag, PasswordHistoryEntry } from '../../types.ts';
import { FolderInputGroup } from './FolderInputGroup.tsx';
import { TagSelectorInput } from './TagSelectorInput.tsx';
import { parseTags, extractAllTags } from '../../lib/tagUtils.ts';
import { PendingAttachment, formatBytes, MAX_ATTACHMENT_BYTES } from '../../lib/attachmentUtils.ts';
import { generateUUID } from '../../lib/crypto.ts';
import { extractDomain } from '../../lib/urlUtils.ts';
import { generatePassword, getGlobalGeneratorConfig, GeneratorConfig } from '../../lib/generator.ts';
import { generateSshKeyPair, keypairGenerationSupported, GeneratedSshKeyPair, SshKeyAlgorithm, parseSshKeySecret, serializeSshKeySecret, formatAuthorizedKeysCommand } from '../../lib/keyGen.ts';
import { parseTotpSecret, formatTotpSecret, TotpAlgorithm } from '../../lib/totpUtils.ts';

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
    uris?: string;
    category: string;
    type: VaultItemType;
    tags?: string;
    notes?: string;
    totp_secret?: string;
    password_history?: string;
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
  const [tags, setTags] = useState<Tag[]>([]);
  
  // Extra fields
  const [notes, setNotes] = useState("");
  const [totpSecret, setTotpSecret] = useState("");
  const [totpAlgorithm, setTotpAlgorithm] = useState<TotpAlgorithm>('SHA1');
  const [totpDigits, setTotpDigits] = useState<number>(6);
  const [totpPeriod, setTotpPeriod] = useState<number>(30);
  const [showAdvancedTotp, setShowAdvancedTotp] = useState(false);

  // Multi-URI & Password History
  const [extraUris, setExtraUris] = useState<string[]>([]);
  const [passwordHistory, setPasswordHistory] = useState<PasswordHistoryEntry[]>([]);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  
  // Field visibility
  const [showNoteField, setShowNoteField] = useState(false);
  const [showTotpField, setShowTotpField] = useState(false);

  // SSH keypair generator (Phase 18)
  const [showKeyGen, setShowKeyGen] = useState(false);
  const [keyGenAlgo, setKeyGenAlgo] = useState<SshKeyAlgorithm>('ed25519');
  const [generatedKp, setGeneratedKp] = useState<GeneratedSshKeyPair | null>(null);
  const [generating, setGenerating] = useState(false);
  const [keyGenError, setKeyGenError] = useState<string | null>(null);
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
  const [isNewFieldMasked, setIsNewFieldMasked] = useState(true);
  const [unmaskedFieldIds, setUnmaskedFieldIds] = useState<Set<string>>(new Set());

  // SSH Key Public Key state
  const [sshPublicKey, setSshPublicKey] = useState("");

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
        if (initialItem.type === 'key') {
          const parsedSsh = parseSshKeySecret(initialItem.secret || "");
          setPassword(parsedSsh.privateKey);
          setSshPublicKey(parsedSsh.publicKey || "");
        } else {
          setPassword(initialItem.secret || "");
          setSshPublicKey("");
        }
        setUrl(initialItem.url || "");
        if (initialItem.uris) {
          try {
            const parsed = JSON.parse(initialItem.uris);
            if (Array.isArray(parsed)) setExtraUris(parsed);
            else setExtraUris([]);
          } catch { setExtraUris([]); }
        } else {
          setExtraUris([]);
        }

        if (initialItem.password_history) {
          try {
            const parsed = JSON.parse(initialItem.password_history);
            if (Array.isArray(parsed)) setPasswordHistory(parsed);
            else setPasswordHistory([]);
          } catch { setPasswordHistory([]); }
        } else {
          setPasswordHistory([]);
        }

        setCategory(initialItem.category === "all" || initialItem.category?.toLowerCase() === "attachment" ? "" : (initialItem.category || ""));
        
        if (initialItem.notes) {
          setNotes(initialItem.notes);
          setShowNoteField(true);
        } else {
          setNotes("");
          setShowNoteField(false);
        }
        
        if (initialItem.totp_secret) {
          const parsedConfig = parseTotpSecret(initialItem.totp_secret);
          if (parsedConfig) {
            setTotpSecret(parsedConfig.secret);
            setTotpAlgorithm(parsedConfig.algorithm);
            setTotpDigits(parsedConfig.digits);
            setTotpPeriod(parsedConfig.period);
          } else {
            setTotpSecret(initialItem.totp_secret);
            setTotpAlgorithm('SHA1');
            setTotpDigits(6);
            setTotpPeriod(30);
          }
          setShowTotpField(true);
        } else {
          setTotpSecret("");
          setTotpAlgorithm('SHA1');
          setTotpDigits(6);
          setTotpPeriod(30);
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

        // Parse tags from existing item
        setTags(parseTags(initialItem.tags));

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
        setSshPublicKey("");
        setUrl("");
        setExtraUris([]);
        setPasswordHistory([]);
        setShowHistoryDrawer(false);
        setCategory("all");
        setTags([]);
        setNotes("");
        setTotpSecret("");
        setTotpAlgorithm('SHA1');
        setTotpDigits(6);
        setTotpPeriod(30);
        setShowAdvancedTotp(false);
        setShowNoteField(false);
        setShowTotpField(false);
        setShowAttachmentField(false);
        setShowKeyGen(false);
        setKeyGenAlgo('ed25519');
        setGeneratedKp(null);
        setGenerating(false);
        setKeyGenError(null);
        setLinkedAttachmentIds([]);
        setCustomFieldsState([]);
        setIsAddFieldOpen(false);
        setNewFieldName("");
        setNewFieldValue("");
        setNewFieldType("text");
        setNewFieldLinkedProperty("username");
      }
      setIsNewFieldMasked(true);
      setUnmaskedFieldIds(new Set());
      setPendingAttachments([]);
      setRemovedAttachmentIds([]);
      setAttachmentError(null);
      setIsExtraDropdownOpen(false);
      setShowPassword(false);
      setIsSaving(false);
    }
  }, [isOpen, initialItem, initialType]);

  const availableVaultTags = React.useMemo(() => extractAllTags(items), [items]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    if (type === 'attachment') {
      if (!isEdit && pendingAttachments.length === 0 && linkedAttachmentIds.length === 0) return;
    } else {
      if (!password) return;
    }

    setIsSaving(true);
    try {
      const finalSecret = type === 'key' 
        ? serializeSshKeySecret(password, sshPublicKey) 
        : type === 'attachment'
          ? (pendingAttachments[0]?.file_name || "")
          : password;
      
      let finalTotp = "";
      if (showTotpField && totpSecret.trim()) {
        finalTotp = formatTotpSecret({
          secret: totpSecret.trim(),
          algorithm: totpAlgorithm,
          digits: totpDigits,
          period: totpPeriod,
        }, title);
      }

      const validUris = extraUris.map(u => u.trim()).filter(Boolean);

      await onSave({
        title,
        secret: finalSecret,
        username: type === 'attachment' ? (pendingAttachments[0]?.file_name || username) : username,
        url,
        uris: validUris.length > 0 ? JSON.stringify(validUris) : undefined,
        category,
        type,
        tags: JSON.stringify(tags),
        notes: showNoteField ? notes : "",
        totp_secret: finalTotp,
        password_history: passwordHistory.length > 0 ? JSON.stringify(passwordHistory) : undefined,
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
    const newPass = generatePassword(config);
    if (password && password !== newPass) {
      setPasswordHistory(prev => [...prev, { password, generatedAt: new Date().toISOString() }]);
    }
    setPassword(newPass);
    setShowPassword(true);
  };

  const handleGenerateKeypair = async () => {
    setGenerating(true);
    setKeyGenError(null);
    try {
      const kp = await generateSshKeyPair(keyGenAlgo);
      setGeneratedKp(kp);
      // Populate clean PEM into private key textarea and OpenSSH public key into public key field
      setPassword(kp.privateKeyPkcs8Pem);
      setSshPublicKey(kp.publicKeyOpenSsh);
    } catch (e: any) {
      setKeyGenError(e?.message || 'Keypair generation failed.');
    } finally {
      setGenerating(false);
    }
  };

  const downloadGeneratedPrivate = () => {
    if (!generatedKp) return;
    const name = generatedKp.algorithm === 'ed25519' ? 'id_ed25519_shellguard.pem' : 'id_rsa_shellguard.pem';
    const blob = new Blob([generatedKp.privateKeyPkcs8Pem], { type: 'application/x-pem-file' });
    const objUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objUrl;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(objUrl), 1000);
  };

  const stageAttachmentFile = (file: File) => {
    if (file.size > MAX_ATTACHMENT_BYTES) {
      setAttachmentError(`File ${file.name} exceeds the ${Math.round(MAX_ATTACHMENT_BYTES / (1024 * 1024))}MB limit.`);
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
            mime_type: file.type || 'application/octet-stream',
            size: file.size,
            dataUrl: e.target!.result!.toString()
          }
        ]);
        if (!title.trim()) {
          setTitle(file.name);
        }
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/60 backdrop-blur-sm overflow-hidden">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-3xl h-[90vh] md:h-[85vh] max-h-[90vh] md:max-h-[85vh] bg-theme-surface border-2 border-claw-cyan/40 rounded-3xl shadow-2xl relative flex flex-col overflow-hidden my-auto"
      >
        <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
          {/* Header - Pinned */}
          <div className="flex items-center justify-between gap-4 px-6 py-4 md:px-8 md:py-5 border-b border-theme-subtle shrink-0 bg-theme-surface z-10">
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
              className="text-theme-muted hover:text-theme-main p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body - Scrollable */}
          <div className="flex-1 overflow-y-auto px-6 py-5 md:px-8 md:py-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

            {/* Tags */}
            <div className="col-span-1 md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-theme-muted mb-2">
                Tags
              </label>
              <TagSelectorInput
                value={tags}
                onChange={setTags}
                availableTags={availableVaultTags}
              />
            </div>

            {/* Standalone Attachment Dropzone */}
            {type === 'attachment' && (
              <div className="col-span-1 md:col-span-2 space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-theme-muted mb-2">
                  Attachment File (Encrypted Storage, max 500MB) {!isEdit && <span className="text-red-500">*</span>}
                </label>
                <div 
                  onClick={openAttachmentPicker} 
                  className="w-full border-2 border-dashed border-claw-cyan/50 rounded-2xl p-8 flex flex-col items-center justify-center bg-claw-cyan/5 hover:bg-claw-cyan/10 transition-colors cursor-pointer text-center"
                >
                  <Upload size={32} className="text-claw-cyan/70 mb-2" />
                  <p className="text-theme-main font-bold text-sm">Click to select file</p>
                  <p className="text-xs text-theme-muted mt-1">Single-file encrypted BLOB storage (up to 500MB)</p>
                </div>
                {attachmentError && <p className="text-xs text-red-500">{attachmentError}</p>}

                {/* Staged pending attachment */}
                {pendingAttachments.length > 0 && (
                  <ul className="space-y-2">
                    {pendingAttachments.map(att => (
                      <li key={att.id} className="flex items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/50 border border-theme-subtle rounded-xl px-3.5 py-2.5">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Paperclip size={16} className="text-claw-cyan flex-shrink-0" />
                          <span className="text-sm font-medium text-theme-main truncate">{att.file_name}</span>
                          <span className="text-xs text-theme-muted font-mono shrink-0">({formatBytes(att.size)})</span>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => setPendingAttachments(prev => prev.filter(a => a.id !== att.id))} 
                          className="text-slate-400 hover:text-red-500 p-1 rounded-lg transition-colors cursor-pointer"
                          title="Remove file"
                        >
                          <X size={15}/>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

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
                    <div className="flex items-center gap-2">
                      {passwordHistory.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setShowHistoryDrawer(!showHistoryDrawer)}
                          className={`text-xs font-semibold flex items-center gap-1 px-2 py-0.5 rounded-lg border transition-colors cursor-pointer ${
                            showHistoryDrawer
                              ? 'bg-claw-cyan/15 text-claw-cyan border-claw-cyan/30'
                              : 'text-theme-muted hover:text-theme-main border-theme-subtle'
                          }`}
                          title="View Password Generation History"
                        >
                          <History size={13} /> History ({passwordHistory.length})
                        </button>
                      )}
                      <button type="button" onClick={handleGeneratePassword} className="text-xs font-semibold text-claw-cyan hover:text-cyan-600 flex items-center gap-1 cursor-pointer">
                        <Sparkles size={13} /> Generate
                      </button>
                    </div>
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
                      className="absolute right-3 text-slate-400 hover:text-theme-main p-1 cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <PasswordStrengthIndicator password={password} />

                  {/* Password Generation History Drawer */}
                  {showHistoryDrawer && passwordHistory.length > 0 && (
                    <div className="mt-2.5 p-3 bg-theme-base/60 border border-theme-subtle rounded-xl space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-theme-muted">
                        <span>Password Generation History</span>
                        <button type="button" onClick={() => setShowHistoryDrawer(false)} className="hover:text-theme-main cursor-pointer"><X size={13} /></button>
                      </div>
                      <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                        {passwordHistory.slice().reverse().map((hist, idx) => (
                          <div key={idx} className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-theme-surface border border-theme-subtle text-xs">
                            <div className="flex flex-col min-w-0">
                              <span className="font-mono text-theme-main truncate">{hist.password}</span>
                              <span className="text-[10px] text-theme-muted">{new Date(hist.generatedAt).toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => navigator.clipboard?.writeText(hist.password)}
                                className="p-1 hover:text-claw-cyan text-theme-muted cursor-pointer"
                                title="Copy"
                              >
                                <Copy size={12} />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (password && password !== hist.password) {
                                    setPasswordHistory(prev => [...prev, { password, generatedAt: new Date().toISOString() }]);
                                  }
                                  setPassword(hist.password);
                                }}
                                className="text-[10px] font-bold text-claw-cyan hover:underline px-1.5 py-0.5 rounded bg-claw-cyan/10 cursor-pointer"
                                title="Restore this password"
                              >
                                Restore
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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

                  {/* Extra Multi-URIs */}
                  {extraUris.map((extraUri, idx) => (
                    <div key={idx} className="relative mt-2 flex items-center gap-2">
                      <div className="relative flex-1">
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"><Globe size={16} /></div>
                        <input
                          type="text"
                          value={extraUri}
                          onChange={(e) => {
                            const updated = [...extraUris];
                            updated[idx] = e.target.value;
                            setExtraUris(updated);
                          }}
                          placeholder="https://alternative-login.example.com"
                          className="w-full bg-theme-base border border-theme-subtle rounded-xl pl-10 pr-4 py-2.5 text-sm focus:border-claw-cyan outline-none transition-all text-theme-main"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setExtraUris(prev => prev.filter((_, i) => i !== idx))}
                        className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Remove URL"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => setExtraUris(prev => [...prev, ''])}
                    className="mt-2 text-xs font-semibold text-claw-cyan hover:text-cyan-600 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={13} /> Add Another URL
                  </button>
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

            {/* SSH Key Specifics (Phase 18 — keypair generation & dual-key management) */}
            {type === 'key' && (
              <div className="col-span-1 md:col-span-2 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-theme-muted">
                    SSH Private Key (PKCS#8 / OpenSSH) <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowKeyGen((v) => !v)}
                    disabled={!keypairGenerationSupported()}
                    title={keypairGenerationSupported() ? 'Generate an Ed25519 or RSA-4096 keypair in your browser' : 'Keypair generation requires a secure context (HTTPS or localhost)'}
                    className="text-xs font-semibold text-claw-cyan hover:text-cyan-600 flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Zap size={14} /> {showKeyGen ? 'Hide Generator' : 'Generate Keypair'}
                  </button>
                </div>
                {!keypairGenerationSupported() && (
                  <p className="text-xs text-amber-500">
                    Keypair generation requires a secure context (HTTPS or localhost). On plain-HTTP LAN
                    origins, paste or import an existing key instead — everything else works.
                  </p>
                )}
                <textarea
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="-----BEGIN PRIVATE KEY-----&#10;Paste an OpenSSH / PKCS#8 private key, or generate a new keypair above…"
                  className="w-full bg-theme-base border border-theme-subtle rounded-xl px-4 py-3 text-xs focus:border-claw-cyan outline-none transition-all text-theme-main min-h-[130px] font-mono leading-relaxed"
                />

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold uppercase tracking-wider text-theme-muted">
                      SSH Public Key (OpenSSH format)
                    </label>
                    {sshPublicKey && (
                      <button
                        type="button"
                        onClick={() => navigator.clipboard?.writeText(sshPublicKey)}
                        className="text-xs font-semibold text-claw-cyan hover:text-cyan-600 cursor-pointer"
                      >
                        Copy Public Key
                      </button>
                    )}
                  </div>
                  <textarea
                    value={sshPublicKey}
                    onChange={(e) => setSshPublicKey(e.target.value)}
                    placeholder="ssh-ed25519 AAAAC3... (auto-filled on generation, or paste corresponding public key)"
                    className="w-full bg-theme-base border border-theme-subtle rounded-xl px-4 py-2.5 text-xs focus:border-claw-cyan outline-none transition-all text-theme-main min-h-[60px] font-mono leading-relaxed"
                  />
                </div>

                {showKeyGen && keypairGenerationSupported() && (
                  <div className="border border-claw-cyan/40 rounded-xl p-3 bg-claw-cyan/5 space-y-2.5">
                    <div className="flex items-center gap-2">
                      <select
                        value={keyGenAlgo}
                        onChange={(e) => setKeyGenAlgo(e.target.value as SshKeyAlgorithm)}
                        className="bg-theme-base border border-theme-subtle rounded-lg px-2 py-1.5 text-xs focus:border-claw-cyan outline-none text-theme-main cursor-pointer"
                      >
                        <option value="ed25519">Ed25519 (recommended)</option>
                        <option value="rsa-4096">RSA-4096</option>
                      </select>
                      <button
                        type="button"
                        onClick={handleGenerateKeypair}
                        disabled={generating}
                        className="text-xs font-bold px-3 py-1.5 rounded-lg bg-claw-cyan/10 text-claw-cyan hover:bg-claw-cyan/20 transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        {generating ? 'Generating…' : 'Generate'}
                      </button>
                      <span className="text-[11px] text-theme-muted">Generated in your browser — private key never leaves unencrypted.</span>
                    </div>
                    {keyGenError && <p className="text-xs text-red-500">{keyGenError}</p>}
                    {generatedKp && (
                      <div className="space-y-2 pt-1 border-t border-claw-cyan/20">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-theme-muted">Generated Public Key</div>
                        <code className="block text-[11px] break-all bg-theme-base border border-theme-subtle rounded-lg p-2 font-mono text-theme-main select-all">
                          {generatedKp.publicKeyOpenSsh}
                        </code>
                        <div className="flex flex-wrap gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => navigator.clipboard?.writeText(generatedKp.publicKeyOpenSsh)}
                            className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-theme-base border border-theme-subtle text-claw-cyan hover:bg-claw-cyan/10 flex items-center gap-1 cursor-pointer"
                          >
                            📋 Copy Public Key
                          </button>
                          <button
                            type="button"
                            onClick={() => navigator.clipboard?.writeText(formatAuthorizedKeysCommand(generatedKp.publicKeyOpenSsh))}
                            title="Copy command to append this key to ~/.ssh/authorized_keys"
                            className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-theme-base border border-theme-subtle text-slate-300 hover:text-claw-cyan hover:bg-claw-cyan/10 flex items-center gap-1 cursor-pointer"
                          >
                            <Terminal size={12} /> Copy authorized_keys Command
                          </button>
                          <button
                            type="button"
                            onClick={downloadGeneratedPrivate}
                            className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-theme-base border border-theme-subtle text-slate-300 hover:text-claw-cyan hover:bg-claw-cyan/10 flex items-center gap-1 cursor-pointer"
                          >
                            ⬇ Download .pem
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Extra Fields Section */}
            {(type === 'password' || type === 'note' || type === 'key') && (
              <>
                {showNoteField && type === 'password' && (
                  <div className="col-span-1 md:col-span-2 relative">
                    <label className="block text-xs font-bold uppercase tracking-wider text-theme-muted mb-2">Note</label>
                    <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full bg-theme-base border border-theme-subtle rounded-xl px-4 py-3 text-sm focus:border-claw-cyan outline-none transition-all text-theme-main min-h-[80px]" />
                    <button type="button" onClick={() => setShowNoteField(false)} className="absolute top-8 right-3 text-slate-400 hover:text-red-500"><X size={16}/></button>
                  </div>
                )}
                {showTotpField && (
                  <div className="col-span-1 md:col-span-2 relative p-4 bg-theme-base/40 border border-theme-subtle rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold uppercase tracking-wider text-theme-muted">
                        Authenticator Key (TOTP)
                      </label>
                      <button type="button" onClick={() => setShowTotpField(false)} className="text-slate-400 hover:text-red-500 cursor-pointer"><X size={16}/></button>
                    </div>
                    <input
                      type="text"
                      value={totpSecret}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val.trim().toLowerCase().startsWith('otpauth://')) {
                          const parsed = parseTotpSecret(val);
                          if (parsed) {
                            setTotpSecret(parsed.secret);
                            setTotpAlgorithm(parsed.algorithm);
                            setTotpDigits(parsed.digits);
                            setTotpPeriod(parsed.period);
                            return;
                          }
                        }
                        setTotpSecret(val);
                      }}
                      placeholder="Base32 key (e.g. JBSWY3DPEHPK3PXP) or otpauth:// URI"
                      className="w-full bg-theme-base border border-theme-subtle rounded-xl px-4 py-3 text-sm focus:border-claw-cyan outline-none transition-all text-theme-main font-mono uppercase"
                    />

                    {/* Advanced TOTP Settings Toggle */}
                    <div>
                      <button
                        type="button"
                        onClick={() => setShowAdvancedTotp(!showAdvancedTotp)}
                        className="text-xs font-semibold text-claw-cyan hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        ⚙️ {showAdvancedTotp ? 'Hide' : 'Show'} Advanced TOTP Variables
                      </button>

                      {showAdvancedTotp && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-theme-subtle mt-2">
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-theme-muted mb-1">Algorithm</label>
                            <select
                              value={totpAlgorithm}
                              onChange={e => setTotpAlgorithm(e.target.value as TotpAlgorithm)}
                              className="w-full bg-theme-base border border-theme-subtle rounded-lg px-2.5 py-1.5 text-xs text-theme-main outline-none focus:border-claw-cyan cursor-pointer"
                            >
                              <option value="SHA1">SHA-1 (Default)</option>
                              <option value="SHA256">SHA-256</option>
                              <option value="SHA512">SHA-512</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-theme-muted mb-1">Digits</label>
                            <select
                              value={totpDigits}
                              onChange={e => setTotpDigits(Number(e.target.value))}
                              className="w-full bg-theme-base border border-theme-subtle rounded-lg px-2.5 py-1.5 text-xs text-theme-main outline-none focus:border-claw-cyan cursor-pointer"
                            >
                              <option value={6}>6 Digits (Standard)</option>
                              <option value={8}>8 Digits</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-theme-muted mb-1">Period (Interval)</label>
                            <select
                              value={totpPeriod}
                              onChange={e => setTotpPeriod(Number(e.target.value))}
                              className="w-full bg-theme-base border border-theme-subtle rounded-lg px-2.5 py-1.5 text-xs text-theme-main outline-none focus:border-claw-cyan cursor-pointer"
                            >
                              <option value={30}>30 Seconds (Standard)</option>
                              <option value={60}>60 Seconds</option>
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {showAttachmentField && (
                  <div className="col-span-1 md:col-span-2 relative">
                    <label className="block text-xs font-bold uppercase tracking-wider text-theme-muted mb-2">Attachments (max 500MB per attachment)</label>
                    {linkedAttachmentIds.length === 0 && pendingAttachments.length === 0 && (
                      <button type="button" onClick={() => setShowAttachmentField(false)} className="absolute -top-1 right-0 text-slate-400 hover:text-red-500"><X size={16}/></button>
                    )}
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
                      {customFieldsState.map((cf) => {
                        const isFieldUnmasked = unmaskedFieldIds.has(cf.id);
                        return (
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
                              {cf.type === "text" && (
                                <span className="text-xs text-theme-muted font-mono truncate max-w-[140px]">{cf.value}</span>
                              )}
                              {cf.type === "hidden" && (
                                <span className="text-xs text-theme-muted font-mono truncate max-w-[160px]">{isFieldUnmasked ? cf.value : "••••••••"}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {cf.type === "hidden" && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setUnmaskedFieldIds(prev => {
                                      const next = new Set(prev);
                                      if (next.has(cf.id)) next.delete(cf.id);
                                      else next.add(cf.id);
                                      return next;
                                    });
                                  }}
                                  className="text-slate-400 hover:text-theme-main p-1 rounded transition-colors cursor-pointer"
                                  title={isFieldUnmasked ? "Mask secret" : "Unmask secret"}
                                >
                                  {isFieldUnmasked ? <EyeOff size={14} /> : <Eye size={14} />}
                                </button>
                              )}
                              <button type="button" onClick={() => setCustomFieldsState(prev => prev.filter(f => f.id !== cf.id))} className="text-slate-400 hover:text-red-500 p-1 rounded transition-colors shrink-0 cursor-pointer" title="Remove custom field"><X size={14}/></button>
                            </div>
                          </div>
                        );
                      })}
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
                      ) : newFieldType === "hidden" ? (
                        <div className="relative flex items-center">
                          <input
                            type={isNewFieldMasked ? "password" : "text"}
                            value={newFieldValue}
                            onChange={(e) => setNewFieldValue(e.target.value)}
                            placeholder="Secret field value"
                            className="w-full bg-theme-base border border-theme-subtle rounded-lg pl-3 pr-8 py-2 text-xs focus:border-claw-cyan outline-none text-theme-main font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => setIsNewFieldMasked(prev => !prev)}
                            className="absolute right-2 text-slate-400 hover:text-theme-main p-1 cursor-pointer"
                            title={isNewFieldMasked ? "Reveal secret" : "Mask secret"}
                          >
                            {isNewFieldMasked ? <Eye size={13} /> : <EyeOff size={13} />}
                          </button>
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={newFieldValue}
                          onChange={(e) => setNewFieldValue(e.target.value)}
                          placeholder="Field value"
                          className="bg-theme-base border border-theme-subtle rounded-lg px-3 py-2 text-xs focus:border-claw-cyan outline-none text-theme-main"
                        />
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
                          setIsNewFieldMasked(true);
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
          </div>

          {/* Footer - Pinned */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 md:px-8 md:py-4 border-t border-theme-subtle shrink-0 bg-theme-surface z-10">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-theme-muted hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-medium text-sm transition-colors cursor-pointer">
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSaving || !title.trim() || (type === 'attachment' ? (!isEdit && pendingAttachments.length === 0 && linkedAttachmentIds.length === 0) : !password)} 
              className="px-6 py-2.5 bg-gradient-to-r from-claw-cyan to-deep-teal hover:from-cyan-500 hover:to-teal-600 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/20 disabled:opacity-50 transition-all flex items-center gap-2 text-sm cursor-pointer"
            >
              {isSaving ? <RefreshCw size={16} className="animate-spin" /> : <Check size={16} />}
              {isSaving ? (isEdit ? "Updating..." : "Saving...") : (isEdit ? "Save Changes" : (type === 'attachment' ? "Save Attachment" : "Save Item"))}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
