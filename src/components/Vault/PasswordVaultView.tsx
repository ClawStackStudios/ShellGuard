import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import * as OTPAuth from "otpauth";
import { 
  Key, 
  Lock, 
  Plus, 
  Trash2, 
  Pencil,
  Eye, 
  EyeOff, 
  Copy, 
  Check, 
  ExternalLink, 
  Search, 
  Globe, 
  User, 
  ShieldCheck, 
  FileText, 
  Smartphone, 
  Binary, 
  Paperclip,
  Sparkles,
  RefreshCw,
  X,
  Upload,
  Download,
  MoreVertical,
  Zap,
  Tag,
  Folder,
  FolderOpen,
  CheckSquare,
  Square,
  MinusSquare,
  AlertTriangle,
  Clock,
  SlidersHorizontal,
  ChevronDown,
  RotateCcw
} from "lucide-react";
import { Favicon } from "./Favicon.tsx";
import { extractDomain } from "../../lib/urlUtils.ts";
import { VaultItem, VaultItemType } from "../../types.ts";
import { VaultTabView } from './VaultTabView.tsx';
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator.tsx';
import { Highlight } from './Highlight.tsx';
import { GeneratorOptions } from '../Generator/GeneratorOptions.tsx';
import { getGlobalGeneratorConfig, generatePassword, GeneratorConfig } from '../../lib/generator.ts';
import { FolderInputGroup } from './FolderInputGroup.tsx';
import { PasswordAgeBadge, calculatePasswordAge } from './PasswordAgeBadge.tsx';
import { 
  isItemInFolder, 
  buildFolderTree, 
  getAllUniqueFolders, 
  getFolderSegments,
  DEFAULT_ROOT_CATEGORIES,
  getPodColor
} from '../../lib/folderUtils.ts';
import { generateUUID } from '../../lib/crypto.ts';
import {
  MAX_ATTACHMENT_BYTES,
  PendingAttachment,
  parseAttachmentIds,
  formatBytes,
  downloadAttachment,
} from '../../lib/attachmentUtils.ts';

interface PasswordVaultViewProps {
  items: VaultItem[];
  isLocked?: boolean;
  onUnlock?: () => void;
  onAdd: (item: {
    title: string;
    secret: string;
    username: string;
    url: string;
    category: string;
    type: VaultItemType;
    notes?: string;
    totp_secret?: string;
    /** JSON array of vault_secure_attachments IDs linked to this pearl. */
    attachments?: string;
    /** Staged files to upload (ShellCrypted + POSTed by App.tsx on submit). */
    newAttachments?: PendingAttachment[];
  }) => Promise<void>;
  onUpdate: (id: string, item: {
    title: string;
    secret: string;
    username: string;
    url: string;
    category: string;
    type: VaultItemType;
    notes?: string;
    totp_secret?: string;
    /** JSON array of vault_secure_attachments IDs linked to this pearl. */
    attachments?: string;
    /** Staged files to upload on save. */
    newAttachments?: PendingAttachment[];
    /** Existing attachment IDs unlinked in this edit — DELETEd by App.tsx. */
    removedAttachmentIds?: string[];
  }) => Promise<void>;
  onDelete: (id: string, type: VaultItemType) => Promise<void>;
  onDeleteMultiple?: (selectedItems: { id: string; type: VaultItemType }[]) => Promise<void>;
  selectedFolder?: string;
  onSelectFolder?: (folder: string) => void;
  searchQuery?: string;
  onSearchQueryChange?: (query: string) => void;
  activeTypeTab?: VaultItemType;
  onActiveTypeTabChange?: (tab: VaultItemType) => void;
  isAdding?: boolean;
  onToggleIsAdding?: (isAdding: boolean) => void;
}

export function PasswordVaultView({ 
  items, 
  onAdd, 
  onUpdate, 
  onDelete,
  onDeleteMultiple,
  isLocked = false,
  onUnlock,
  selectedFolder = "all",
  onSelectFolder,
  searchQuery: externalSearchQuery,
  onSearchQueryChange,
  activeTypeTab: externalActiveTypeTab,
  onActiveTypeTabChange,
  isAdding: externalIsAdding,
  onToggleIsAdding
}: PasswordVaultViewProps) {
  // Navigation & Filter states
  const [activeTypeTab, setActiveTypeTab] = useState<VaultItemType>(externalActiveTypeTab || "password");
  const [searchQuery, setSearchQuery] = useState(externalSearchQuery || "");
  const [filterCategory, setFilterCategory] = useState<string>(selectedFolder || "all");

  // Sync external search query
  useEffect(() => {
    if (externalSearchQuery !== undefined) {
      setSearchQuery(externalSearchQuery);
    }
  }, [externalSearchQuery]);

  // Sync external active tab
  useEffect(() => {
    if (externalActiveTypeTab !== undefined) {
      setActiveTypeTab(externalActiveTypeTab);
    }
  }, [externalActiveTypeTab]);

  // Sync external isAdding state
  useEffect(() => {
    if (externalIsAdding !== undefined) {
      setIsAdding(externalIsAdding);
    }
  }, [externalIsAdding]);

  const handleTabChange = (tab: VaultItemType) => {
    setActiveTypeTab(tab);
    if (onActiveTypeTabChange) {
      onActiveTypeTabChange(tab);
    }
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    if (onSearchQueryChange) {
      onSearchQueryChange(val);
    }
  };
  const [filterAgeStatus, setFilterAgeStatus] = useState<"all" | "fresh" | "normal" | "aging" | "expired">("all");
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [sortBy, setSortBy] = useState<"created_at" | "title" | "username" | "age">("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Multi-selection states
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [isBulkDeletingInProgress, setIsBulkDeletingInProgress] = useState(false);

  // Sync filter category when external selectedFolder changes
  useEffect(() => {
    if (selectedFolder) {
      setFilterCategory(selectedFolder);
    }
  }, [selectedFolder]);

  const handleSetCategory = (cat: string) => {
    setFilterCategory(cat);
    if (onSelectFolder) {
      onSelectFolder(cat);
    }
  };

  // Add Form state
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState(selectedFolder !== "all" ? selectedFolder : "");
  const [notes, setNotes] = useState("");
  const [showNoteField, setShowNoteField] = useState(false);
  const [totpSecret, setTotpSecret] = useState("");
  const [showTotpField, setShowTotpField] = useState(false);
  const [showAttachmentField, setShowAttachmentField] = useState(false);
  // Staged new files for the add form (uploaded on submit by App.tsx)
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [isExtraDropdownOpen, setIsExtraDropdownOpen] = useState(false);
  const [showPasswordInForm, setShowPasswordInForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatorConfig, setGeneratorConfig] = useState<GeneratorConfig>(getGlobalGeneratorConfig());
  const [showGeneratorOptions, setShowGeneratorOptions] = useState(false);

  // Edit Form state
  const [editingItem, setEditingItem] = useState<VaultItem | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editShowNoteField, setEditShowNoteField] = useState(false);
  const [editTotpSecret, setEditTotpSecret] = useState("");
  const [editShowTotpField, setEditShowTotpField] = useState(false);
  const [editShowAttachmentField, setEditShowAttachmentField] = useState(false);
  // Edit-form attachment state: kept IDs, staged new files, and unlinked IDs
  const [editExistingAttachmentIds, setEditExistingAttachmentIds] = useState<string[]>([]);
  const [editPendingAttachments, setEditPendingAttachments] = useState<PendingAttachment[]>([]);
  const [editRemovedAttachmentIds, setEditRemovedAttachmentIds] = useState<string[]>([]);
  const [editAttachmentError, setEditAttachmentError] = useState<string | null>(null);
  const [isEditExtraDropdownOpen, setIsEditExtraDropdownOpen] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Reveal & Copy feedback states
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});
  const [copyFeedback, setCopyFeedback] = useState<{ id: string; field: string } | null>(null);
  const [quickActionOpenId, setQuickActionOpenId] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<VaultItem | null>(null);

  // Password Generator Helper
  const generateStrongPassword = (target: "add" | "edit") => {
    const generated = generatePassword(generatorConfig);
    if (target === "add") {
      setPassword(generated);
    } else {
      setEditPassword(generated);
    }
  };

  // ── Attachment staging ─────────────────────────────────────────────────────
  // Lookup for attachment records already in the vault (file_name + decrypted
  // data URL live on type === "attachment" items).
  const attachmentItemsById = useMemo(() => {
    const map = new Map<string, VaultItem>();
    for (const it of items) {
      if (it.type === "attachment") map.set(it.id, it);
    }
    return map;
  }, [items]);

  const stageAttachmentFile = (file: File, target: "add" | "edit") => {
    const setError = target === "add" ? setAttachmentError : setEditAttachmentError;
    if (file.size > MAX_ATTACHMENT_BYTES) {
      setError(`"${file.name}" is ${formatBytes(file.size)} — the hard limit is 10 MB per file.`);
      return;
    }
    setError(null);
    const reader = new FileReader();
    reader.onload = (re) => {
      const dataUrl = re.target?.result?.toString();
      if (!dataUrl) return;
      const staged: PendingAttachment = {
        id: generateUUID(),
        file_name: file.name,
        mime_type: file.type || "application/octet-stream",
        size: file.size,
        dataUrl,
      };
      if (target === "add") {
        setPendingAttachments(prev => [...prev, staged]);
      } else {
        setEditPendingAttachments(prev => [...prev, staged]);
      }
    };
    reader.onerror = () => setError(`Could not read "${file.name}".`);
    reader.readAsDataURL(file);
  };

  const openAttachmentPicker = (target: "add" | "edit") => {
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = (e: any) => {
      const file = e.target?.files?.[0];
      if (file) stageAttachmentFile(file, target);
    };
    input.click();
  };

  // Copy handler with visual feedback
  const handleCopy = (text: string, id: string, field: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopyFeedback({ id, field });
    setTimeout(() => {
      setCopyFeedback(null);
    }, 2000);
  };

  const handleResetAddForm = () => {
    setTitle("");
    setUsername("");
    setPassword("");
    setUrl("");
    setCategory(selectedFolder !== "all" ? selectedFolder : "");
    setNotes("");
    setShowNoteField(false);
    setTotpSecret("");
    setShowTotpField(false);
    setPendingAttachments([]);
    setAttachmentError(null);
    setShowAttachmentField(false);
    setIsExtraDropdownOpen(false);
    setShowPasswordInForm(false);
    setIsAdding(false);
    if (onToggleIsAdding) {
      onToggleIsAdding(false);
    }
  };

  const handleStartEdit = (item: VaultItem) => {
    setEditingItem(item);
    setEditTitle(item.title || "");
    setEditUsername(item.username || "");
    setEditPassword(item.secret || "");
    setEditUrl(item.url || "");
    setEditCategory(item.category || "");
    setEditNotes(item.notes || "");
    setEditShowNoteField(!!item.notes);
    setEditTotpSecret(item.totp_secret || "");
    setEditShowTotpField(!!item.totp_secret);
    const linkedIds = parseAttachmentIds(item.attachments);
    setEditExistingAttachmentIds(linkedIds);
    setEditShowAttachmentField(linkedIds.length > 0);
    setEditPendingAttachments([]);
    setEditRemovedAttachmentIds([]);
    setEditAttachmentError(null);
    setIsEditExtraDropdownOpen(false);
    setShowEditPassword(false);
  };

  const handleCloseEdit = () => {
    setEditingItem(null);
    setShowEditPassword(false);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !password) return;

    setIsSubmitting(true);
    try {
      await onAdd({
        title: title.trim(),
        username: username.trim(),
        secret: password,
        url: url.trim(),
        category: category.trim(),
        type: activeTypeTab,
        notes: showNoteField ? notes.trim() : "",
        totp_secret: showTotpField ? totpSecret.trim() : "",
        attachments: JSON.stringify(pendingAttachments.map(a => a.id)),
        newAttachments: showAttachmentField ? pendingAttachments : [],
      });
      handleResetAddForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editTitle.trim() || !editPassword) return;

    setIsUpdating(true);
    try {
      await onUpdate(editingItem.id, {
        title: editTitle.trim(),
        username: editUsername.trim(),
        secret: editPassword,
        url: editUrl.trim(),
        category: editCategory.trim(),
        type: editingItem.type || "password",
        notes: editShowNoteField ? editNotes.trim() : "",
        totp_secret: editShowTotpField ? editTotpSecret.trim() : "",
        attachments: JSON.stringify([
          ...editExistingAttachmentIds,
          ...editPendingAttachments.map(a => a.id),
        ]),
        newAttachments: editPendingAttachments,
        removedAttachmentIds: editRemovedAttachmentIds,
      });
      handleCloseEdit();
    } finally {
      setIsUpdating(false);
    }
  };

  // Filter and Sort passwords with hierarchical sub-folder matching
  const filteredPasswords = useMemo(() => {
    return items
      .filter((item) => {
        // Match current type (or default to password)
        const itemType = item.type || "password";
        if (itemType !== activeTypeTab) return false;

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = item.title?.toLowerCase().includes(q);
          const matchUser = item.username?.toLowerCase().includes(q);
          const matchUrl = item.url?.toLowerCase().includes(q);
          const matchCat = item.category?.toLowerCase().includes(q);
          const matchNotes = item.notes?.toLowerCase().includes(q);
          const matchSecret = itemType === "note" ? item.secret?.toLowerCase().includes(q) : false;
          if (!matchTitle && !matchUser && !matchUrl && !matchCat && !matchNotes && !matchSecret) return false;
        }

        // Sub-folder / Category filter (matches exact folder or nested children)
        if (filterCategory !== "all" && !isItemInFolder(item.category, filterCategory)) {
          return false;
        }

        // Age Status filter
        if (filterAgeStatus !== "all") {
          const ageInfo = calculatePasswordAge(item.created_at);
          if (ageInfo.status !== filterAgeStatus) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        let cmp = 0;
        if (sortBy === "title") {
          cmp = (a.title || "").localeCompare(b.title || "");
        } else if (sortBy === "username") {
          cmp = (a.username || "").localeCompare(b.username || "");
        } else if (sortBy === "age") {
          // Sort by age: older items (longer time ago) have smaller timestamp ms -> larger age days
          const timeA = new Date(a.created_at || 0).getTime();
          const timeB = new Date(b.created_at || 0).getTime();
          cmp = timeA - timeB; // smaller timestamp = older
        } else {
          cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        }
        return sortOrder === "asc" ? cmp : -cmp;
      });
  }, [items, activeTypeTab, searchQuery, filterCategory, filterAgeStatus, sortBy, sortOrder]);

  const totalPasswordsCount = useMemo(() => items.filter(i => (i.type || "password") === "password").length, [items]);
  const totalNotesCount = useMemo(() => items.filter(i => i.type === "note").length, [items]);
  const totalKeysCount = useMemo(() => items.filter(i => i.type === "key").length, [items]);
  const totalAttachmentsCount = useMemo(() => items.filter(i => i.type === "attachment").length, [items]);

  // All unique folders from items
  const allUniqueFolders = useMemo(() => getAllUniqueFolders(items, true), [items]);

  // Folder Tree for current active tab
  const { rootNodes: currentFolderTree } = useMemo(
    () => buildFolderTree(items, activeTypeTab), 
    [items, activeTypeTab]
  );

  // Dynamic category counts for the currently active tab (including sub-folder subtree counts)
  const categoryCounts = useMemo(() => {
    const currentTabItems = items.filter(i => (i.type || "password") === activeTypeTab);
    const counts: Record<string, number> = {
      all: currentTabItems.length,
    };
    allUniqueFolders.forEach(folder => {
      counts[folder] = currentTabItems.filter(i => isItemInFolder(i.category, folder)).length;
    });
    return counts;
  }, [items, activeTypeTab, allUniqueFolders]);

  // Dynamic Age Status counts for the currently active tab
  const ageCounts = useMemo(() => {
    const currentTabItems = items.filter(i => (i.type || "password") === activeTypeTab);
    const counts = {
      all: currentTabItems.length,
      fresh: 0,
      normal: 0,
      aging: 0,
      expired: 0,
    };
    currentTabItems.forEach(item => {
      const ageInfo = calculatePasswordAge(item.created_at);
      counts[ageInfo.status] = (counts[ageInfo.status] || 0) + 1;
    });
    return counts;
  }, [items, activeTypeTab]);

  // Multi-selection operations
  const toggleSelectItem = (id: string) => {
    setSelectedItemIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const isAllVisibleSelected = filteredPasswords.length > 0 && filteredPasswords.every(p => selectedItemIds.has(p.id));
  const isSomeVisibleSelected = filteredPasswords.some(p => selectedItemIds.has(p.id)) && !isAllVisibleSelected;

  const toggleSelectAllVisible = () => {
    if (isAllVisibleSelected) {
      setSelectedItemIds(new Set());
    } else {
      const allIds = new Set(filteredPasswords.map(p => p.id));
      setSelectedItemIds(allIds);
    }
  };

  const selectedItemsList = useMemo(() => {
    return items.filter(i => selectedItemIds.has(i.id));
  }, [items, selectedItemIds]);

  const handleExecuteBulkDelete = async () => {
    if (selectedItemsList.length === 0) return;
    setIsBulkDeletingInProgress(true);
    try {
      if (onDeleteMultiple) {
        await onDeleteMultiple(selectedItemsList.map(i => ({ id: i.id, type: i.type || "password" })));
      } else {
        for (const it of selectedItemsList) {
          await onDelete(it.id, it.type || "password");
        }
      }
      setSelectedItemIds(new Set());
      setIsBulkDeleting(false);
    } finally {
      setIsBulkDeletingInProgress(false);
    }
  };

  if (isLocked) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center py-20 px-4 text-center mt-10">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-theme-surface/60 border border-theme-subtle rounded-3xl p-8 max-w-sm w-full shadow-lg backdrop-blur-sm mx-auto"
        >
          <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-10 h-10 text-amber-500" />
          </div>
          <h2 className="text-2xl font-black text-theme-main tracking-tight mb-2">
            Vault Locked
          </h2>
          <p className="text-theme-muted text-sm mb-8">
            Your session is locked. You must provide your ShellKey to view this vault.
          </p>
          <button
            onClick={onUnlock}
            className="w-full py-3.5 bg-theme-main hover:bg-theme-main/90 text-theme-base font-bold uppercase tracking-widest text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Key className="w-4 h-4" />
            UNLOCK VAULT
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ── Single Item Delete Confirmation Modal ── */}
      <AnimatePresence>
        {itemToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-theme-surface rounded-2xl shadow-2xl p-6 max-w-md w-full border border-theme-subtle"
            >
              <div className="flex items-center gap-3 mb-3 text-red-500">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                  <Trash2 size={20} />
                </div>
                <h3 className="text-xl font-bold text-theme-main">Delete {activeTypeTab === "password" ? "Password" : "Item"}?</h3>
              </div>
              <p className="text-theme-muted text-sm mb-6 leading-relaxed">
                Are you sure you want to permanently delete the credentials for{" "}
                <span className="font-semibold text-theme-main">"{itemToDelete.title}"</span>? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setItemToDelete(null)}
                  className="px-4 py-2.5 text-theme-muted hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-medium text-sm transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await onDelete(itemToDelete.id, itemToDelete.type);
                    setItemToDelete(null);
                    setSelectedItemIds(prev => {
                      const next = new Set(prev);
                      next.delete(itemToDelete.id);
                      return next;
                    });
                  }}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold text-sm shadow-md shadow-red-900/20 transition-all cursor-pointer"
                >
                  Delete {activeTypeTab === "password" ? "Password" : "Item"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Bulk Delete Confirmation Modal ── */}
      <AnimatePresence>
        {isBulkDeleting && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-theme-surface rounded-2xl shadow-2xl p-6 max-w-lg w-full border border-theme-subtle"
            >
              <div className="flex items-center gap-3 mb-3 text-red-500">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                  <AlertTriangle size={22} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-theme-main">Delete {selectedItemsList.length} Selected Items?</h3>
                  <p className="text-xs text-red-500 font-semibold">Bulk cleanup action</p>
                </div>
              </div>

              <p className="text-theme-muted text-sm mb-4 leading-relaxed">
                Are you sure you want to permanently delete these <span className="font-bold text-theme-main">{selectedItemsList.length} items</span> from your encrypted vault? This action cannot be undone.
              </p>

              {/* Items Preview List */}
              <div className="max-h-48 overflow-y-auto mb-6 p-2 bg-theme-base rounded-xl border border-theme-subtle space-y-1.5">
                {selectedItemsList.map(it => (
                  <div key={it.id} className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-theme-surface text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <Favicon url={it.url} title={it.title} size={20} />
                      <span className="font-semibold text-theme-main truncate">{it.title}</span>
                      {it.username && <span className="text-theme-muted truncate">({it.username})</span>}
                    </div>
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-500 font-mono flex-shrink-0">
                      {it.category || "Uncategorized"}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  disabled={isBulkDeletingInProgress}
                  onClick={() => setIsBulkDeleting(false)}
                  className="px-4 py-2.5 text-theme-muted hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-medium text-sm transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isBulkDeletingInProgress}
                  onClick={handleExecuteBulkDelete}
                  className="px-6 py-2.5 bg-red-600 hover:bg-red-700 active:scale-95 text-white rounded-xl font-bold text-sm shadow-md shadow-red-900/20 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  {isBulkDeletingInProgress ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      <span>Deleting {selectedItemsList.length} Items...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} />
                      <span>Delete {selectedItemsList.length} Selected Items</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Edit Password Modal ── */}
      <AnimatePresence>
        {editingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-theme-surface rounded-3xl shadow-2xl p-6 md:p-8 max-w-2xl w-full border-2 border-claw-cyan/40 my-8"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-theme-subtle">
                <div className="flex items-center gap-3.5">
                  <Favicon url={editUrl} title={editTitle || "Password"} size={46} />
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-xl font-black text-theme-main">
                        Edit Credentials
                      </h3>
                      <span className="px-2 py-0.5 rounded-md bg-claw-cyan/10 text-claw-cyan text-xs font-bold font-mono">
                        Ref: {editingItem.id.slice(0, 6)}...
                      </span>
                      <PasswordAgeBadge timestamp={editingItem.created_at} />
                    </div>
                    <p className="text-xs text-theme-muted">
                      Update details, username, password, or URL for {editTitle || "this service"}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCloseEdit}
                  className="text-theme-muted hover:text-theme-main p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Edit Form */}
              <form onSubmit={handleUpdateSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Title */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-theme-muted mb-2">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      required
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder={editingItem.type === 'password' ? "e.g. GitHub, Google, ProtonMail" : "Item Title"}
                      className="w-full bg-theme-base border border-theme-subtle rounded-xl px-4 py-3 text-sm focus:border-claw-cyan focus:ring-1 focus:ring-claw-cyan outline-none transition-all text-theme-main placeholder:text-slate-400"
                    />
                  </div>

                  {/* Pod (Category) */}
                  <div>
                    <FolderInputGroup
                      category={editCategory}
                      onChange={setEditCategory}
                      items={items}
                      label="Pod (Category)"
                    />
                  </div>

                  {/* LOGINS SPECIFIC FIELDS */}
                  {(!editingItem.type || editingItem.type === "password") && (
                    <>
                      {/* Username / Email */}
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-theme-muted mb-2">
                          Username / Email / Account
                        </label>
                        <input 
                          type="text" 
                          value={editUsername}
                          onChange={(e) => setEditUsername(e.target.value)}
                          placeholder="e.g. captain_crab@ocean.reef"
                          className="w-full bg-theme-base border border-theme-subtle rounded-xl px-4 py-3 text-sm focus:border-claw-cyan focus:ring-1 focus:ring-claw-cyan outline-none transition-all text-theme-main placeholder:text-slate-400 font-mono"
                        />
                      </div>

                      {/* Password Field + Generator */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-xs font-bold uppercase tracking-wider text-theme-muted">
                            Password <span className="text-red-500">*</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => generateStrongPassword("edit")}
                            className="text-xs font-semibold text-claw-cyan hover:text-cyan-600 flex items-center gap-1 cursor-pointer"
                          >
                            <Sparkles size={13} />
                            Generate Strong
                          </button>
<button type="button" onClick={() => setShowGeneratorOptions(!showGeneratorOptions)} className="p-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-colors shrink-0" title="Generator Options"><Zap size={18} /></button>
                        </div>
                        <div className="relative flex items-center">
                          <input 
                            type={showEditPassword ? "text" : "password"}
                            required
                            value={editPassword}
                            onChange={(e) => setEditPassword(e.target.value)}
                            placeholder="••••••••••••••••"
                            className="w-full bg-theme-base border border-theme-subtle rounded-xl pl-4 pr-12 py-3 text-sm focus:border-claw-cyan focus:ring-1 focus:ring-claw-cyan outline-none transition-all text-theme-main placeholder:text-slate-400 font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => setShowEditPassword(!showEditPassword)}
                            className="absolute right-3 text-slate-400 hover:text-theme-main p-1"
                            title={showEditPassword ? "Hide Password" : "Show Password"}
                          >
                            {showEditPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                        <PasswordStrengthIndicator password={editPassword} />
                      </div>

                      {/* Website URL (Loads Favicon) */}
                      <div className="col-span-1 md:col-span-2">
                        <label className="block text-xs font-bold uppercase tracking-wider text-theme-muted mb-2">
                          Website URL (Loads Favicon)
                        </label>
                        <div className="relative">
                          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                            <Globe size={16} />
                          </div>
                          <input 
                            type="text" 
                            value={editUrl}
                            onChange={(e) => setEditUrl(e.target.value)}
                            placeholder="https://github.com/login"
                            className="w-full bg-theme-base border border-theme-subtle rounded-xl pl-10 pr-4 py-3 text-sm focus:border-claw-cyan focus:ring-1 focus:ring-claw-cyan outline-none transition-all text-theme-main placeholder:text-slate-400"
                          />
                        </div>
                      </div>

                      {/* Extra Fields */}
                      {editShowNoteField && (
                        <div className="col-span-1 md:col-span-2 relative">
                          <label className="block text-xs font-bold uppercase tracking-wider text-theme-muted mb-2">Note</label>
                          <textarea
                            value={editNotes}
                            onChange={(e) => setEditNotes(e.target.value)}
                            placeholder="Secure note content..."
                            className="w-full bg-theme-base border border-theme-subtle rounded-xl px-4 py-3 text-sm focus:border-claw-cyan focus:ring-1 focus:ring-claw-cyan outline-none transition-all text-theme-main placeholder:text-slate-400 min-h-[80px]"
                          />
                          <button type="button" onClick={() => setEditShowNoteField(false)} className="absolute top-8 right-3 text-slate-400 hover:text-red-500"><X size={16}/></button>
                        </div>
                      )}
                      {editShowTotpField && (
                        <div className="col-span-1 md:col-span-2 relative">
                          <label className="block text-xs font-bold uppercase tracking-wider text-theme-muted mb-2">TOTP Secret</label>
                          <input
                            type="text"
                            value={editTotpSecret}
                            onChange={(e) => setEditTotpSecret(e.target.value)}
                            placeholder="e.g. JBSWY3DPEHPK3PXP"
                            className="w-full bg-theme-base border border-theme-subtle rounded-xl px-4 py-3 text-sm focus:border-claw-cyan focus:ring-1 focus:ring-claw-cyan outline-none transition-all text-theme-main placeholder:text-slate-400 font-mono uppercase"
                          />
                          <button type="button" onClick={() => setEditShowTotpField(false)} className="absolute top-8 right-3 text-slate-400 hover:text-red-500"><X size={16}/></button>
                        </div>
                      )}
                      {editShowAttachmentField && (
                        <div className="col-span-1 md:col-span-2 relative">
                          <label className="block text-xs font-bold uppercase tracking-wider text-theme-muted mb-2">
                            Attachments <span className="normal-case font-medium">(max 10 MB per file, unlimited files)</span>
                          </label>
                          <button type="button" onClick={() => setEditShowAttachmentField(false)} className="absolute -top-1 right-0 text-slate-400 hover:text-red-500"><X size={16}/></button>

                          {/* Existing linked attachments */}
                          {editExistingAttachmentIds.length > 0 && (
                            <ul className="mb-3 space-y-2">
                              {editExistingAttachmentIds.map(attId => {
                                const att = attachmentItemsById.get(attId);
                                return (
                                  <li key={attId} className="flex items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/50 border border-theme-subtle rounded-xl px-3 py-2">
                                    <span className="flex items-center gap-2 min-w-0">
                                      <Paperclip size={14} className="text-claw-cyan shrink-0" />
                                      <span className="text-sm text-theme-main truncate">{att?.file_name || "Attachment"}</span>
                                    </span>
                                    <span className="flex items-center gap-1 shrink-0">
                                      {att?.secret && (
                                        <button
                                          type="button"
                                          onClick={() => downloadAttachment(att.secret, att.file_name || "attachment")}
                                          className="text-slate-400 hover:text-claw-cyan transition-colors cursor-pointer p-1"
                                          title="Download decrypted file"
                                        >
                                          <Download size={14} />
                                        </button>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditExistingAttachmentIds(prev => prev.filter(id => id !== attId));
                                          setEditRemovedAttachmentIds(prev => [...prev, attId]);
                                        }}
                                        className="text-slate-400 hover:text-red-500 transition-colors cursor-pointer p-1"
                                        title="Remove attachment"
                                      >
                                        <X size={14} />
                                      </button>
                                    </span>
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                          {/* Upload zone — click or drag a single file */}
                          <div
                            className="w-full border-2 border-dashed border-claw-cyan/50 rounded-xl p-6 flex flex-col items-center justify-center bg-claw-cyan/5 hover:bg-claw-cyan/10 transition-colors cursor-pointer text-center"
                            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                            onDrop={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const file = e.dataTransfer.files?.[0];
                              if (file) stageAttachmentFile(file, "edit");
                            }}
                            onClick={() => openAttachmentPicker("edit")}
                          >
                            <Upload size={28} className="text-claw-cyan/60 mb-2" />
                            <p className="text-theme-main font-bold mb-1">Click to browse or drag a file here</p>
                            <p className="text-theme-muted text-xs">Each file is encrypted client-side before upload · 10 MB hard limit</p>
                          </div>

                          {editAttachmentError && (
                            <p className="mt-2 text-xs text-red-500 flex items-center gap-1.5">
                              <AlertTriangle size={13} /> {editAttachmentError}
                            </p>
                          )}

                          {/* Newly staged files */}
                          {editPendingAttachments.length > 0 && (
                            <ul className="mt-3 space-y-2">
                              {editPendingAttachments.map(att => (
                                <li key={att.id} className="flex items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/50 border border-theme-subtle rounded-xl px-3 py-2">
                                  <span className="flex items-center gap-2 min-w-0">
                                    <Paperclip size={14} className="text-claw-cyan shrink-0" />
                                    <span className="text-sm text-theme-main truncate">{att.file_name}</span>
                                    <span className="text-xs text-theme-muted shrink-0 font-mono">{formatBytes(att.size)}</span>
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => setEditPendingAttachments(prev => prev.filter(a => a.id !== att.id))}
                                    className="text-slate-400 hover:text-red-500 transition-colors shrink-0 cursor-pointer"
                                    title="Remove attachment"
                                  >
                                    <X size={14} />
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                      
                      {(!editShowNoteField || !editShowTotpField || !editShowAttachmentField) && (
                        <div className="col-span-1 md:col-span-2 relative">
                          <button 
                            type="button" 
                            onClick={() => setIsEditExtraDropdownOpen(!isEditExtraDropdownOpen)} 
                            className="w-full border-2 border-dashed border-claw-cyan/50 rounded-xl py-3 text-claw-cyan font-bold hover:bg-claw-cyan/5 flex justify-center items-center gap-2 transition-colors cursor-pointer"
                          >
                            <Plus size={16} /> Add Extra Field
                          </button>
                          
                          <AnimatePresence>
                            {isEditExtraDropdownOpen && (
                              <motion.div
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -5 }}
                                className="absolute top-full mt-2 w-48 bg-theme-surface border border-theme-subtle rounded-xl shadow-lg z-20 py-2 left-1/2 -translate-x-1/2"
                              >
                                {!editShowNoteField && <button type="button" onClick={() => { setEditShowNoteField(true); setIsEditExtraDropdownOpen(false); }} className="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-medium text-theme-main cursor-pointer">Note</button>}
                                {!editShowTotpField && <button type="button" onClick={() => { setEditShowTotpField(true); setIsEditExtraDropdownOpen(false); }} className="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-medium text-theme-main cursor-pointer">TOTP Secret</button>}
                                {!editShowAttachmentField && <button type="button" onClick={() => { setEditShowAttachmentField(true); setIsEditExtraDropdownOpen(false); }} className="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-medium text-theme-main cursor-pointer">Attachment</button>}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}
                    </>
                  )}

                  {/* NOTES SPECIFIC FIELDS */}
                  {editingItem.type === "note" && (
                    <div className="col-span-1 md:col-span-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-theme-muted mb-2">
                        Secure Note Content <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        required
                        value={editPassword}
                        onChange={(e) => setEditPassword(e.target.value)}
                        placeholder="Write your secure note here..."
                        className="w-full bg-theme-base border border-theme-subtle rounded-xl px-4 py-3 text-sm focus:border-claw-cyan focus:ring-1 focus:ring-claw-cyan outline-none transition-all text-theme-main placeholder:text-slate-400 min-h-[150px] font-mono"
                      />
                    </div>
                  )}

                  {/* SSH KEYS SPECIFIC FIELDS */}
                  {editingItem.type === "key" && (
                    <>
                      <div className="col-span-1 md:col-span-2">
                        <label className="block text-xs font-bold uppercase tracking-wider text-theme-muted mb-2">
                          Username (Optional)
                        </label>
                        <input 
                          type="text" 
                          value={editUsername}
                          onChange={(e) => setEditUsername(e.target.value)}
                          placeholder="e.g. root, ubuntu, git"
                          className="w-full bg-theme-base border border-theme-subtle rounded-xl px-4 py-3 text-sm focus:border-claw-cyan focus:ring-1 focus:ring-claw-cyan outline-none transition-all text-theme-main placeholder:text-slate-400 font-mono"
                        />
                      </div>
                      <div className="col-span-1 md:col-span-2">
                        <label className="block text-xs font-bold uppercase tracking-wider text-theme-muted mb-2">
                          Private Key <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          required
                          value={editPassword}
                          onChange={(e) => setEditPassword(e.target.value)}
                          placeholder="-----BEGIN OPENSSH PRIVATE KEY-----&#10;...&#10;-----END OPENSSH PRIVATE KEY-----"
                          className="w-full bg-theme-base border border-theme-subtle rounded-xl px-4 py-3 text-sm focus:border-claw-cyan focus:ring-1 focus:ring-claw-cyan outline-none transition-all text-theme-main placeholder:text-slate-400 min-h-[150px] font-mono whitespace-pre text-xs"
                          spellCheck={false}
                        />
                      </div>
                    </>
                  )}

                  {/* ATTACHMENTS SPECIFIC FIELDS */}
                  {editingItem.type === "attachment" && (
                    <div className="col-span-1 md:col-span-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-theme-muted mb-2">
                        Secure File <span className="text-red-500">*</span>
                      </label>
                      <div 
                        className="w-full border-2 border-dashed border-claw-cyan/50 rounded-xl p-8 flex flex-col items-center justify-center bg-claw-cyan/5 hover:bg-claw-cyan/10 transition-colors cursor-pointer text-center relative overflow-hidden"
                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                            const file = e.dataTransfer.files[0];
                            setEditUsername(file.name);
                            const reader = new FileReader();
                            reader.onload = (re) => {
                              if (re.target?.result) setEditPassword(re.target.result.toString());
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.onchange = (e: any) => {
                            if (e.target.files && e.target.files.length > 0) {
                              const file = e.target.files[0];
                              setEditUsername(file.name);
                              const reader = new FileReader();
                              reader.onload = (re) => {
                                if (re.target?.result) setEditPassword(re.target.result.toString());
                              };
                              reader.readAsDataURL(file);
                            }
                          };
                          input.click();
                        }}
                      >
                        {editPassword ? (
                          <>
                            <Paperclip size={32} className="text-claw-cyan mb-3" />
                            <p className="text-theme-main font-bold mb-1">{editUsername || "File Selected"}</p>
                            <p className="text-theme-muted text-xs">Ready to re-encrypt</p>
                            <button 
                              type="button"
                              className="absolute top-2 right-2 p-1 text-slate-400 hover:text-red-500 bg-theme-surface rounded-md shadow-sm border border-theme-subtle"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditPassword("");
                                setEditUsername("");
                              }}
                            >
                              <X size={14} />
                            </button>
                          </>
                        ) : (
                          <>
                            <Upload size={32} className="text-claw-cyan/60 mb-3" />
                            <p className="text-theme-main font-bold mb-1">Click to browse or drag file here</p>
                            <p className="text-theme-muted text-xs">Update your encrypted file</p>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-end gap-3 pt-6 border-t border-theme-subtle">
                  <button
                    type="button"
                    onClick={handleCloseEdit}
                    className="px-5 py-2.5 text-theme-muted hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-medium text-sm transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!editTitle.trim() || !editPassword || isUpdating}
                    className="px-6 py-2.5 bg-gradient-to-r from-claw-cyan to-deep-teal hover:from-cyan-500 hover:to-teal-600 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/20 disabled:opacity-50 transition-all active:scale-95 cursor-pointer text-sm flex items-center gap-2"
                  >
                    {isUpdating ? (
                      <><RefreshCw size={16} className="animate-spin" /> Re-encrypting...</>
                    ) : (
                      <><Check size={16} /> Save Changes</>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-3xl font-black tracking-tight text-theme-main">Password Vault</h2>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#e4048a]/10 text-[#e4048a] border border-[#e4048a]/20">
              <ShieldCheck size={12} />
              AES-GCM Protected
            </span>
          </div>
          <p className="text-theme-muted text-sm max-w-xl">
            Store, manage, edit, and autofill your secure vault items. Click any saved data to copy it directly to your clipboard.
          </p>
        </div>
      </div>

      {/* ── Scalable Vault Item Types Navigation with Category/Item Count Badges ── */}
      <VaultTabView 
        activeTypeTab={activeTypeTab} 
        setActiveTypeTab={handleTabChange} 
        totalPasswordsCount={totalPasswordsCount}
        totalNotesCount={totalNotesCount}
        totalKeysCount={totalKeysCount}
        totalAttachmentsCount={totalAttachmentsCount}
      />

      {/* ── Add Password Card / Form ── */}
      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            className="overflow-hidden"
          >
            <form 
              onSubmit={handleAddSubmit}
              className="bg-theme-surface border-2 border-claw-cyan/40 rounded-3xl p-6 md:p-8 shadow-xl relative"
            >
              {/* Form Header */}
              <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-theme-subtle">
                <div className="flex items-center gap-3">
                  <Favicon url={url} title={title || "Password"} size={44} />
                  <div>
                    <h3 className="text-xl font-bold text-theme-main capitalize">
                      {title.trim() ? `New ${activeTypeTab} for ${title}` : `Add New ${activeTypeTab}`}
                    </h3>
                    <p className="text-xs text-theme-muted">
                      {url ? `Favicon preview loaded for ${extractDomain(url) || "service"}` : "Enter service details, credentials, and URL"}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleResetAddForm}
                  className="text-theme-muted hover:text-theme-main p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Input Fields Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* 1. Title */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-theme-muted mb-2">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input 
                      type="text" 
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder={activeTypeTab === 'password' ? "e.g. GitHub, Google, ProtonMail" : "Item Title"}
                      className="w-full bg-theme-base border border-theme-subtle rounded-xl px-4 py-3 text-sm focus:border-claw-cyan focus:ring-1 focus:ring-claw-cyan outline-none transition-all text-theme-main placeholder:text-slate-400"
                    />
                  </div>
                </div>

                {/* 5. Pod (Category) */}
                <div>
                  <FolderInputGroup
                    category={category}
                    onChange={setCategory}
                    items={items}
                    label="Pod (Category)"
                  />
                </div>

                {/* LOGINS SPECIFIC FIELDS */}
                {activeTypeTab === "password" && (
                  <>
                    {/* 2. Username / Email */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-theme-muted mb-2">
                        Username / Email / Account
                      </label>
                      <div className="relative">
                        <input 
                          type="text" 
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="e.g. captain_crab@ocean.reef"
                          className="w-full bg-theme-base border border-theme-subtle rounded-xl px-4 py-3 text-sm focus:border-claw-cyan focus:ring-1 focus:ring-claw-cyan outline-none transition-all text-theme-main placeholder:text-slate-400 font-mono"
                        />
                      </div>
                    </div>

                    {/* 3. Password Field + Generator */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs font-bold uppercase tracking-wider text-theme-muted">
                          Password <span className="text-red-500">*</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => generateStrongPassword("add")}
                          className="text-xs font-semibold text-claw-cyan hover:text-cyan-600 flex items-center gap-1 cursor-pointer"
                        >
                          <Sparkles size={13} />
                          Generate Strong
                        </button>
<button type="button" onClick={() => setShowGeneratorOptions(!showGeneratorOptions)} className="p-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-colors shrink-0" title="Generator Options"><Zap size={18} /></button>
                      </div>
                      <div className="relative flex items-center">
                        <input 
                          type={showPasswordInForm ? "text" : "password"}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••••••••••"
                          className="w-full bg-theme-base border border-theme-subtle rounded-xl pl-4 pr-12 py-3 text-sm focus:border-claw-cyan focus:ring-1 focus:ring-claw-cyan outline-none transition-all text-theme-main placeholder:text-slate-400 font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswordInForm(!showPasswordInForm)}
                          className="absolute right-3 text-slate-400 hover:text-theme-main p-1"
                          title={showPasswordInForm ? "Hide Password" : "Show Password"}
                        >
                          {showPasswordInForm ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                      <PasswordStrengthIndicator password={password} />
                    </div>

                    {/* 4. Website URL (Loads Favicon) */}
                    <div className="col-span-1 md:col-span-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-theme-muted mb-2">
                        Website URL (Loads Favicon)
                      </label>
                      <div className="relative">
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                          <Globe size={16} />
                        </div>
                        <input 
                          type="text" 
                          value={url}
                          onChange={(e) => setUrl(e.target.value)}
                          placeholder="https://github.com/login"
                          className="w-full bg-theme-base border border-theme-subtle rounded-xl pl-10 pr-4 py-3 text-sm focus:border-claw-cyan focus:ring-1 focus:ring-claw-cyan outline-none transition-all text-theme-main placeholder:text-slate-400"
                        />
                      </div>
                    </div>

                    {/* Extra Fields */}
                    {showNoteField && (
                      <div className="col-span-1 md:col-span-2 relative">
                        <label className="block text-xs font-bold uppercase tracking-wider text-theme-muted mb-2">Note</label>
                        <textarea
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Secure note content..."
                          className="w-full bg-theme-base border border-theme-subtle rounded-xl px-4 py-3 text-sm focus:border-claw-cyan focus:ring-1 focus:ring-claw-cyan outline-none transition-all text-theme-main placeholder:text-slate-400 min-h-[80px]"
                        />
                        <button type="button" onClick={() => setShowNoteField(false)} className="absolute top-8 right-3 text-slate-400 hover:text-red-500"><X size={16}/></button>
                      </div>
                    )}
                    {showTotpField && (
                      <div className="col-span-1 md:col-span-2 relative">
                        <label className="block text-xs font-bold uppercase tracking-wider text-theme-muted mb-2">TOTP Secret</label>
                        <input
                          type="text"
                          value={totpSecret}
                          onChange={(e) => setTotpSecret(e.target.value)}
                          placeholder="e.g. JBSWY3DPEHPK3PXP"
                          className="w-full bg-theme-base border border-theme-subtle rounded-xl px-4 py-3 text-sm focus:border-claw-cyan focus:ring-1 focus:ring-claw-cyan outline-none transition-all text-theme-main placeholder:text-slate-400 font-mono uppercase"
                        />
                        <button type="button" onClick={() => setShowTotpField(false)} className="absolute top-8 right-3 text-slate-400 hover:text-red-500"><X size={16}/></button>
                      </div>
                    )}
                    {showAttachmentField && (
                      <div className="col-span-1 md:col-span-2 relative">
                        <label className="block text-xs font-bold uppercase tracking-wider text-theme-muted mb-2">
                          Attachments <span className="normal-case font-medium">(max 10 MB per file, unlimited files)</span>
                        </label>
                        <button type="button" onClick={() => setShowAttachmentField(false)} className="absolute -top-1 right-0 text-slate-400 hover:text-red-500"><X size={16}/></button>

                        {/* Upload zone — click or drag a single file */}
                        <div
                          className="w-full border-2 border-dashed border-claw-cyan/50 rounded-xl p-6 flex flex-col items-center justify-center bg-claw-cyan/5 hover:bg-claw-cyan/10 transition-colors cursor-pointer text-center"
                          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const file = e.dataTransfer.files?.[0];
                            if (file) stageAttachmentFile(file, "add");
                          }}
                          onClick={() => openAttachmentPicker("add")}
                        >
                          <Upload size={28} className="text-claw-cyan/60 mb-2" />
                          <p className="text-theme-main font-bold mb-1">Click to browse or drag a file here</p>
                          <p className="text-theme-muted text-xs">Each file is encrypted client-side before upload · 10 MB hard limit</p>
                        </div>

                        {attachmentError && (
                          <p className="mt-2 text-xs text-red-500 flex items-center gap-1.5">
                            <AlertTriangle size={13} /> {attachmentError}
                          </p>
                        )}

                        {/* Staged files — unlimited count, one file each */}
                        {pendingAttachments.length > 0 && (
                          <ul className="mt-3 space-y-2">
                            {pendingAttachments.map(att => (
                              <li key={att.id} className="flex items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/50 border border-theme-subtle rounded-xl px-3 py-2">
                                <span className="flex items-center gap-2 min-w-0">
                                  <Paperclip size={14} className="text-claw-cyan shrink-0" />
                                  <span className="text-sm text-theme-main truncate">{att.file_name}</span>
                                  <span className="text-xs text-theme-muted shrink-0 font-mono">{formatBytes(att.size)}</span>
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setPendingAttachments(prev => prev.filter(a => a.id !== att.id))}
                                  className="text-slate-400 hover:text-red-500 transition-colors shrink-0 cursor-pointer"
                                  title="Remove attachment"
                                >
                                  <X size={14} />
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}

                    {(!showNoteField || !showTotpField || !showAttachmentField) && (
                      <div className="col-span-1 md:col-span-2 relative">
                        <button 
                          type="button" 
                          onClick={() => setIsExtraDropdownOpen(!isExtraDropdownOpen)} 
                          className="w-full border-2 border-dashed border-claw-cyan/50 rounded-xl py-3 text-claw-cyan font-bold hover:bg-claw-cyan/5 flex justify-center items-center gap-2 transition-colors cursor-pointer"
                        >
                          <Plus size={16} /> Add Extra Field
                        </button>
                        
                        <AnimatePresence>
                          {isExtraDropdownOpen && (
                            <motion.div
                              initial={{ opacity: 0, y: -5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -5 }}
                              className="absolute top-full mt-2 w-48 bg-theme-surface border border-theme-subtle rounded-xl shadow-lg z-20 py-2 left-1/2 -translate-x-1/2"
                            >
                              {!showNoteField && <button type="button" onClick={() => { setShowNoteField(true); setIsExtraDropdownOpen(false); }} className="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-medium text-theme-main cursor-pointer">Note</button>}
                              {!showTotpField && <button type="button" onClick={() => { setShowTotpField(true); setIsExtraDropdownOpen(false); }} className="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-medium text-theme-main cursor-pointer">TOTP Secret</button>}
                              {!showAttachmentField && <button type="button" onClick={() => { setShowAttachmentField(true); setIsExtraDropdownOpen(false); }} className="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-medium text-theme-main cursor-pointer">Attachment</button>}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </>
                )}

                {/* NOTES SPECIFIC FIELDS */}
                {activeTypeTab === "note" && (
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-theme-muted mb-2">
                      Secure Note Content <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Write your secure note here..."
                      className="w-full bg-theme-base border border-theme-subtle rounded-xl px-4 py-3 text-sm focus:border-claw-cyan focus:ring-1 focus:ring-claw-cyan outline-none transition-all text-theme-main placeholder:text-slate-400 min-h-[150px] font-mono"
                    />
                  </div>
                )}

                {/* SSH KEYS SPECIFIC FIELDS */}
                {activeTypeTab === "key" && (
                  <>
                    <div className="col-span-1 md:col-span-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-theme-muted mb-2">
                        Username (Optional)
                      </label>
                      <input 
                        type="text" 
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="e.g. root, ubuntu, git"
                        className="w-full bg-theme-base border border-theme-subtle rounded-xl px-4 py-3 text-sm focus:border-claw-cyan focus:ring-1 focus:ring-claw-cyan outline-none transition-all text-theme-main placeholder:text-slate-400 font-mono"
                      />
                    </div>
                    <div className="col-span-1 md:col-span-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-theme-muted mb-2">
                        Private Key <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="-----BEGIN OPENSSH PRIVATE KEY-----&#10;...&#10;-----END OPENSSH PRIVATE KEY-----"
                        className="w-full bg-theme-base border border-theme-subtle rounded-xl px-4 py-3 text-sm focus:border-claw-cyan focus:ring-1 focus:ring-claw-cyan outline-none transition-all text-theme-main placeholder:text-slate-400 min-h-[150px] font-mono whitespace-pre text-xs"
                        spellCheck={false}
                      />
                    </div>
                  </>
                )}

                {/* ATTACHMENTS SPECIFIC FIELDS */}
                {activeTypeTab === "attachment" && (
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-theme-muted mb-2">
                      Secure File <span className="text-red-500">*</span>
                    </label>
                    <div 
                      className="w-full border-2 border-dashed border-claw-cyan/50 rounded-xl p-8 flex flex-col items-center justify-center bg-claw-cyan/5 hover:bg-claw-cyan/10 transition-colors cursor-pointer text-center relative overflow-hidden"
                      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                          const file = e.dataTransfer.files[0];
                          setUsername(file.name);
                          const reader = new FileReader();
                          reader.onload = (re) => {
                            if (re.target?.result) setPassword(re.target.result.toString());
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.onchange = (e: any) => {
                          if (e.target.files && e.target.files.length > 0) {
                            const file = e.target.files[0];
                            setUsername(file.name);
                            const reader = new FileReader();
                            reader.onload = (re) => {
                              if (re.target?.result) setPassword(re.target.result.toString());
                            };
                            reader.readAsDataURL(file);
                          }
                        };
                        input.click();
                      }}
                    >
                      {password ? (
                        <>
                          <Paperclip size={32} className="text-claw-cyan mb-3" />
                          <p className="text-theme-main font-bold mb-1">{username || "File Selected"}</p>
                          <p className="text-theme-muted text-xs">Ready to encrypt</p>
                          <button 
                            type="button"
                            className="absolute top-2 right-2 p-1 text-slate-400 hover:text-red-500 bg-theme-surface rounded-md shadow-sm border border-theme-subtle"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPassword("");
                              setUsername("");
                            }}
                          >
                            <X size={14} />
                          </button>
                        </>
                      ) : (
                        <>
                          <Upload size={32} className="text-claw-cyan/60 mb-3" />
                          <p className="text-theme-main font-bold mb-1">Click to browse or drag file here</p>
                          <p className="text-theme-muted text-xs">File will be encrypted client-side</p>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-theme-subtle">
                <button
                  type="button"
                  onClick={handleResetAddForm}
                  className="px-6 py-3 text-theme-muted font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!title.trim() || !password || isSubmitting}
                  className="px-8 py-3 bg-gradient-to-r from-claw-cyan to-deep-teal hover:from-cyan-500 hover:to-teal-600 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/20 disabled:opacity-50 transition-all active:scale-95 cursor-pointer text-sm flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <><RefreshCw size={16} className="animate-spin" /> Encrypting...</>
                  ) : (
                    <><Lock size={16} /> Encrypt &amp; Save Password</>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Search & Filter Toolbar with Progressive Disclosure ── */}
      {(() => {
        const activeFilterCount = (filterCategory !== "all" ? 1 : 0) + (filterAgeStatus !== "all" ? 1 : 0);
        const hasAnyActiveFilter = activeFilterCount > 0 || searchQuery.trim().length > 0;

        return (
          <div className="space-y-3 bg-theme-surface/70 p-3 sm:p-4 rounded-2xl border border-theme-subtle shadow-xs">
            {/* Primary Action Bar: High Proximity & Cognitive Clarity */}
            <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder={`Search ${activeTypeTab === "password" ? "logins" : activeTypeTab === "note" ? "notes" : activeTypeTab === "key" ? "SSH keys" : "attachments"} by name, username, or URL...`}
                  className="w-full bg-theme-base border border-theme-subtle focus:border-claw-cyan/80 focus:bg-theme-surface rounded-xl pl-9 pr-8 py-2 text-xs font-medium text-theme-main placeholder:text-slate-500 outline-none transition-all"
                />
                {searchQuery && (
                  <button 
                    type="button"
                    onClick={() => handleSearchChange("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-theme-main p-0.5 cursor-pointer"
                    title="Clear search"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              {/* Action Controls: Filters, Sort, Select */}
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                {/* Progressive Disclosure Filter Toggle */}
                <button
                  type="button"
                  onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border shrink-0 ${
                    isFilterPanelOpen || activeFilterCount > 0
                      ? "bg-slate-800 text-white dark:bg-[#15233b] border-claw-cyan/50 shadow-xs"
                      : "bg-theme-base border-theme-subtle text-theme-muted hover:text-theme-main hover:border-slate-400/50"
                  }`}
                  title="Toggle Filter Options"
                >
                  <SlidersHorizontal size={13} className={activeFilterCount > 0 ? "text-claw-cyan" : ""} />
                  <span>Filters</span>
                  {activeFilterCount > 0 && (
                    <span className="w-4 h-4 rounded-full bg-claw-cyan text-white text-[10px] font-mono flex items-center justify-center font-black">
                      {activeFilterCount}
                    </span>
                  )}
                  <ChevronDown 
                    size={13} 
                    className={`transition-transform duration-200 ${isFilterPanelOpen ? "rotate-180 text-claw-cyan" : "text-slate-400"}`} 
                  />
                </button>

                {/* Unified Sort Control */}
                <div className="flex items-center bg-theme-base border border-theme-subtle rounded-xl text-xs font-medium text-theme-main shadow-xs shrink-0">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-transparent pl-3 pr-1.5 py-2 text-xs font-medium outline-none cursor-pointer text-theme-main"
                  >
                    <option value="created_at">Date Added</option>
                    <option value="age">Age (Freshness)</option>
                    <option value="title">Name</option>
                    <option value="username">Username</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))}
                    className="px-2 py-2 text-theme-muted hover:text-theme-main border-l border-theme-subtle cursor-pointer transition-colors"
                    title={`Sort ${sortOrder === "asc" ? "Ascending" : "Descending"}`}
                  >
                    <span className="font-mono text-xs font-bold">{sortOrder === "asc" ? "↑" : "↓"}</span>
                  </button>
                </div>

                {/* Select All Visible Toggle */}
                {filteredPasswords.length > 0 && (
                  <button
                    type="button"
                    onClick={toggleSelectAllVisible}
                    className={`px-3 py-2 rounded-xl border flex items-center gap-1.5 transition-all text-xs font-bold cursor-pointer shrink-0 ${
                      isAllVisibleSelected
                        ? "bg-claw-cyan border-claw-cyan text-white shadow-xs"
                        : isSomeVisibleSelected
                        ? "bg-claw-cyan/10 border-claw-cyan text-claw-cyan"
                        : "bg-theme-base border-theme-subtle text-theme-muted hover:border-claw-cyan hover:text-theme-main"
                    }`}
                    title={isAllVisibleSelected ? "Deselect All Visible Items" : "Select All Visible Items"}
                  >
                    {isAllVisibleSelected ? (
                      <CheckSquare size={14} />
                    ) : isSomeVisibleSelected ? (
                      <MinusSquare size={14} />
                    ) : (
                      <Square size={14} />
                    )}
                    <span className="hidden md:inline">
                      {isAllVisibleSelected ? "Deselect" : "Select All"}
                    </span>
                    <span className="font-mono text-[11px] opacity-75">
                      ({filteredPasswords.length})
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* Active Filters Pill Strip (Gestalt Recognition over Recall) */}
            {hasAnyActiveFilter && (
              <div className="flex items-center gap-1.5 flex-wrap pt-1 text-xs">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mr-1">
                  Active Filters:
                </span>

                {/* Active Pod Tag */}
                {filterCategory !== "all" && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 text-white dark:bg-[#15233b] border border-claw-cyan/40 text-xs font-medium shadow-xs">
                    <span 
                      className="w-2 h-2 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: getPodColor(filterCategory) }} 
                    />
                    <span className="text-slate-300">Pod:</span>
                    <strong className="font-mono text-claw-cyan font-bold">{filterCategory}</strong>
                    <button
                      type="button"
                      onClick={() => handleSetCategory("all")}
                      className="ml-0.5 text-slate-400 hover:text-rose-400 cursor-pointer transition-colors"
                      title="Clear Pod Filter"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}

                {/* Active Secret Age Tag */}
                {filterAgeStatus !== "all" && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 text-white dark:bg-[#15233b] border border-slate-700 text-xs font-medium shadow-xs">
                    <span className={`w-2 h-2 rounded-full ${
                      filterAgeStatus === "fresh" ? "bg-emerald-400" :
                      filterAgeStatus === "normal" ? "bg-cyan-400" :
                      filterAgeStatus === "aging" ? "bg-amber-400" : "bg-rose-400"
                    }`} />
                    <span className="text-slate-300">Age:</span>
                    <strong className="capitalize text-white">
                      {filterAgeStatus === "fresh" ? "Fresh (≤30d)" :
                       filterAgeStatus === "normal" ? "Active (31–89d)" :
                       filterAgeStatus === "aging" ? "Aging (90–179d)" : "Stale (≥180d)"}
                    </strong>
                    <button
                      type="button"
                      onClick={() => setFilterAgeStatus("all")}
                      className="ml-0.5 text-slate-400 hover:text-rose-400 cursor-pointer transition-colors"
                      title="Clear Age Filter"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}

                {/* Active Search Query Tag */}
                {searchQuery.trim() && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-theme-base border border-theme-subtle text-xs font-medium shadow-xs">
                    <span className="text-slate-400">Search:</span>
                    <strong className="font-mono text-theme-main">"{searchQuery.trim()}"</strong>
                    <button
                      type="button"
                      onClick={() => handleSearchChange("")}
                      className="ml-0.5 text-slate-400 hover:text-rose-400 cursor-pointer transition-colors"
                      title="Clear Search"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}

                {/* Reset All Filters Button */}
                <button
                  type="button"
                  onClick={() => {
                    handleSetCategory("all");
                    setFilterAgeStatus("all");
                    handleSearchChange("");
                  }}
                  className="text-[11px] font-bold text-slate-400 hover:text-rose-400 transition-colors ml-1.5 cursor-pointer underline flex items-center gap-1"
                >
                  <RotateCcw size={11} />
                  <span>Reset all</span>
                </button>
              </div>
            )}

            {/* Progressive Disclosure Expandable Filter Shelf */}
            <AnimatePresence>
              {isFilterPanelOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.22, ease: "easeInOut" }}
                  className="overflow-hidden pt-3 border-t border-theme-subtle/80"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-900/30 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-800/80">
                    {/* Filter Group 1: Secret Freshness & Rotation Health */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                          <Clock size={13} className="text-claw-cyan" /> Secret Freshness
                        </span>
                        {filterAgeStatus !== "all" && (
                          <button 
                            type="button"
                            onClick={() => setFilterAgeStatus("all")}
                            className="text-[10px] text-slate-400 hover:text-white underline cursor-pointer"
                          >
                            Reset
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => setFilterAgeStatus("all")}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                            filterAgeStatus === "all"
                              ? "bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs"
                              : "bg-theme-base border border-theme-subtle text-theme-muted hover:text-theme-main hover:bg-slate-100 dark:hover:bg-slate-800"
                          }`}
                        >
                          <span>All Ages</span>
                          <span className="px-1.5 py-0.2 rounded-full font-mono text-[10px] bg-slate-200 dark:bg-slate-800 text-theme-muted">
                            {ageCounts.all}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setFilterAgeStatus("fresh")}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                            filterAgeStatus === "fresh"
                              ? "bg-emerald-500 text-white border-emerald-500 shadow-xs"
                              : "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20"
                          }`}
                          title="Fresh: 0–30 days old"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>Fresh (≤30d)</span>
                          <span className="px-1.5 py-0.2 rounded-full font-mono text-[10px] bg-emerald-500/20">
                            {ageCounts.fresh}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setFilterAgeStatus("normal")}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                            filterAgeStatus === "normal"
                              ? "bg-cyan-500 text-white border-cyan-500 shadow-xs"
                              : "bg-cyan-500/10 border-cyan-500/30 text-cyan-700 dark:text-cyan-400 hover:bg-cyan-500/20"
                          }`}
                          title="Normal: 31–89 days old"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                          <span>Active (31–89d)</span>
                          <span className="px-1.5 py-0.2 rounded-full font-mono text-[10px] bg-cyan-500/20">
                            {ageCounts.normal}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setFilterAgeStatus("aging")}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                            filterAgeStatus === "aging"
                              ? "bg-amber-500 text-white border-amber-500 shadow-xs"
                              : "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20"
                          }`}
                          title="Aging: 90–179 days old"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                          <span>Aging (90–179d)</span>
                          <span className="px-1.5 py-0.2 rounded-full font-mono text-[10px] bg-amber-500/20">
                            {ageCounts.aging}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setFilterAgeStatus("expired")}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                            filterAgeStatus === "expired"
                              ? "bg-rose-500 text-white border-rose-500 shadow-xs"
                              : "bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-400 hover:bg-rose-500/20"
                          }`}
                          title="Stale: ≥180 days old"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          <span>Stale (≥180d)</span>
                          <span className="px-1.5 py-0.2 rounded-full font-mono text-[10px] bg-rose-500/20">
                            {ageCounts.expired}
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Filter Group 2: Pod Scope Quick Filter */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-claw-cyan" /> Filter By Pod
                        </span>
                        {filterCategory !== "all" && (
                          <button 
                            type="button"
                            onClick={() => handleSetCategory("all")}
                            className="text-[10px] text-slate-400 hover:text-white underline cursor-pointer"
                          >
                            Show All
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap max-h-28 overflow-y-auto pr-1 custom-scrollbar">
                        <button
                          type="button"
                          onClick={() => handleSetCategory("all")}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                            filterCategory === "all"
                              ? "bg-claw-cyan text-white shadow-xs"
                              : "bg-theme-base border border-theme-subtle text-theme-muted hover:text-theme-main hover:bg-slate-100 dark:hover:bg-slate-800"
                          }`}
                        >
                          <span>All Pods</span>
                          <span className={`px-1.5 py-0.2 rounded-full font-mono text-[10px] ${
                            filterCategory === "all" ? "bg-white/20 text-white" : "bg-slate-200 dark:bg-slate-800 text-theme-muted"
                          }`}>
                            {categoryCounts.all || 0}
                          </span>
                        </button>

                        {allUniqueFolders.map((folder) => {
                          const count = categoryCounts[folder] || 0;
                          const isSelected = filterCategory === folder;
                          const color = getPodColor(folder);
                          return (
                            <button
                              key={folder}
                              type="button"
                              onClick={() => handleSetCategory(folder)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                                isSelected
                                  ? "bg-slate-800 text-white dark:bg-[#15233b] border border-claw-cyan/40 shadow-xs"
                                  : "bg-theme-base border border-theme-subtle text-theme-muted hover:text-theme-main hover:bg-slate-100 dark:hover:bg-slate-800"
                              }`}
                            >
                              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                              <span>{folder}</span>
                              <span className={`px-1.5 py-0.2 rounded-full font-mono text-[10px] ${
                                isSelected ? "bg-slate-700 text-white" : "bg-slate-200 dark:bg-slate-800 text-theme-muted"
                              }`}>
                                {count}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })()}

      {/* ── Saved Passwords List ── */}
      <div className="grid gap-3.5">
        {filteredPasswords.length === 0 ? (
          <div className="text-center py-16 px-4 border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-3xl bg-theme-surface/30">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-400">
              <Key size={30} />
            </div>
            <h3 className="text-lg font-bold text-theme-main mb-1">
              {items.length === 0 ? "No Items Stored Yet" : "No Matching Items Found"}
            </h3>
            <p className="text-theme-muted text-sm max-w-sm mx-auto mb-6">
              {items.length === 0 
                ? "Start securing your data. Add your first item to keep it armor-encrypted."
                : "Try refining your search terms or selecting a different category filter."}
            </p>
            {items.length === 0 && (
              <button
                onClick={() => setIsAdding(true)}
                className="px-6 py-2.5 bg-claw-cyan hover:bg-cyan-600 text-white text-sm font-bold rounded-xl shadow-md cursor-pointer transition-all active:scale-95"
              >
                + Add Your First Password
              </button>
            )}
          </div>
        ) : (
          <AnimatePresence>
          {filteredPasswords.map((item) => {
            const isRevealed = !!revealedPasswords[item.id];
            const isUsernameCopied = copyFeedback?.id === item.id && copyFeedback.field === "username";
            const isPasswordCopied = copyFeedback?.id === item.id && copyFeedback.field === "password";
            const isRefIdCopied = copyFeedback?.id === item.id && copyFeedback.field === "refId";
            const isSelected = selectedItemIds.has(item.id);

            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.2 }}
                className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col gap-4 ${
                  isSelected 
                    ? "bg-claw-cyan/[0.04] border-claw-cyan shadow-md shadow-claw-cyan/5 ring-1 ring-claw-cyan/40" 
                    : "bg-theme-surface border-theme-subtle hover:border-claw-cyan/40 shadow-sm"
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left: Checkbox + Favicon + Service Info */}
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                    
                    {/* Multi-selection Checkbox */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelectItem(item.id);
                      }}
                      className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all cursor-pointer flex-shrink-0 mt-1 sm:mt-0 ${
                        isSelected
                          ? "bg-claw-cyan border-claw-cyan text-white shadow-xs"
                          : "bg-theme-base border-slate-300 dark:border-slate-700 hover:border-claw-cyan text-transparent"
                      }`}
                      title={isSelected ? "Deselect item" : "Select item for bulk actions"}
                    >
                      <Check size={13} strokeWidth={3} className={isSelected ? "opacity-100" : "opacity-0"} />
                    </button>

                    <Favicon url={item.url} title={item.title} size={46} />
                  
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-base text-theme-main truncate" title={item.title}>
                          <Highlight text={item.title} match={searchQuery} />
                        </h4>

                        {/* Interactive Pod Badge */}
                        {item.category && item.category.trim() && (
                          <button
                            type="button"
                            onClick={() => handleSetCategory(item.category!)}
                            className="px-2.5 py-0.5 rounded-full bg-slate-100 hover:bg-claw-cyan/10 hover:text-claw-cyan dark:bg-slate-800 text-[10px] font-semibold text-slate-500 tracking-wider border border-theme-subtle transition-colors flex items-center gap-1.5 cursor-pointer"
                            title={`Filter by Pod: ${item.category}`}
                          >
                            <span 
                              className="w-1.5 h-1.5 rounded-full flex-shrink-0" 
                              style={{ backgroundColor: getPodColor(item.category) }} 
                            />
                            <span>{item.category}</span>
                          </button>
                        )}

                        {/* Secret Age Badge */}
                        <PasswordAgeBadge
                          timestamp={item.created_at}
                          onClick={() => {
                            const status = calculatePasswordAge(item.created_at).status;
                            setFilterAgeStatus(filterAgeStatus === status ? "all" : status);
                          }}
                        />
                      </div>

                    <div className="flex items-center gap-3 mt-1 text-xs text-theme-muted flex-wrap">
                      {item.url && (
                        <a
                          href={item.url.startsWith("http") ? item.url : `https://${item.url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-claw-cyan hover:underline truncate max-w-[200px]"
                          title={`Visit ${item.url}`}
                        >
                          <Globe size={12} />
                          <span>{extractDomain(item.url)}</span>
                          <ExternalLink size={10} className="opacity-70" />
                        </a>
                      )}
                      
                      {/* AI Lobster Reference ID */}
                      <button
                        onClick={() => handleCopy(item.id, item.id, "refId")}
                        className="flex items-center gap-1 text-[11px] font-mono text-slate-400 hover:text-claw-cyan bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded border border-theme-subtle cursor-pointer transition-colors"
                        title="Copy Reference ID for Lobster Agents"
                      >
                        <span>Ref: {item.id.slice(0, 6)}...</span>
                        {isRefIdCopied ? <Check size={11} className="text-green-500" /> : <Copy size={11} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right: Username & Password interactive Click-to-Copy bars + Action Buttons */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 md:gap-3 flex-shrink-0">
                  
                  {/* ── Username Click-to-Copy Field ── */}
                  {item.username ? (
                    <button
                      type="button"
                      onClick={() => handleCopy(item.username!, item.id, "username")}
                      className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl border text-xs font-mono transition-all cursor-pointer text-left min-w-[150px] max-w-[210px] ${
                        isUsernameCopied
                          ? "bg-green-500/15 border-green-500/40 text-green-600 dark:text-green-400"
                          : "bg-theme-base border-theme-subtle hover:border-claw-cyan/60 text-theme-main"
                      }`}
                      title="Click to copy username"
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <User size={13} className="text-slate-400 flex-shrink-0" />
                        <span className="truncate">{item.username}</span>
                      </div>
                      <span className="flex-shrink-0 ml-1">
                        {isUsernameCopied ? (
                          <span className="flex items-center gap-0.5 text-[10px] font-bold uppercase text-green-500">
                            <Check size={12} /> Copied
                          </span>
                        ) : (
                          <Copy size={12} className="text-slate-400 hover:text-claw-cyan" />
                        )}
                      </span>
                    </button>
                  ) : (
                    <div className="text-[11px] text-slate-400 italic px-2 py-1">
                      No username
                    </div>
                  )}

                  {/* ── Password Click-to-Copy Field ── */}
                  <div className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl border text-xs font-mono transition-all min-w-[170px] ${
                    isPasswordCopied
                      ? "bg-green-500/15 border-green-500/40 text-green-600 dark:text-green-400"
                      : "bg-theme-base border-theme-subtle text-theme-main"
                  }`}>
                    {/* Secret / Content text (click to copy) */}
                    <button
                      type="button"
                      onClick={() => handleCopy(item.secret, item.id, "password")}
                      className="flex items-center gap-1.5 min-w-0 flex-1 cursor-pointer text-left hover:text-claw-cyan transition-colors"
                      title={`Click to copy ${activeTypeTab === "password" ? "password" : "content"}`}
                    >
                      <Lock size={13} className="text-slate-400 flex-shrink-0" />
                      <span className="truncate max-w-[100px]">
                        {isRevealed ? <Highlight text={item.secret} match={searchQuery} /> : "••••••••••••"}
                      </span>
                    </button>

                    {/* Actions: Copy Button + Reveal Eye */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => handleCopy(item.secret, item.id, "password")}
                        className="text-slate-400 hover:text-claw-cyan p-0.5 cursor-pointer"
                        title={`Copy ${activeTypeTab === "password" ? "Password" : "Content"}`}
                      >
                        {isPasswordCopied ? (
                          <Check size={13} className="text-green-500" />
                        ) : (
                          <Copy size={13} />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setRevealedPasswords(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                        className="text-slate-400 hover:text-claw-cyan p-0.5 cursor-pointer"
                        title={isRevealed ? "Hide" : "Reveal"}
                      >
                        {isRevealed ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                    </div>
                  </div>

                  {/* ── Action Buttons: Edit & Delete ── */}
                  <div className="flex items-center gap-1 self-end sm:self-center">
                    {/* Quick Actions Dropdown */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setQuickActionOpenId(quickActionOpenId === item.id ? null : item.id);
                        }}
                        className="p-2 text-slate-400 hover:text-claw-cyan hover:bg-cyan-50 dark:hover:bg-cyan-950/30 rounded-xl transition-colors cursor-pointer"
                        title="Quick Actions"
                      >
                        <Zap size={16} />
                      </button>
                      
                      <AnimatePresence>
                        {quickActionOpenId === item.id && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 5 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 5 }}
                            transition={{ duration: 0.15 }}
                            className="absolute right-0 top-full mt-1 w-44 bg-theme-surface border border-theme-subtle rounded-xl shadow-lg shadow-black/10 z-50 overflow-hidden flex flex-col py-1"
                          >
                            <button
                              onClick={(e) => { e.stopPropagation(); handleCopy(item.username || "", item.id, "username_quick_copy"); setQuickActionOpenId(null); }}
                              className="px-3 py-2 text-xs text-left hover:bg-slate-50 dark:hover:bg-slate-800 text-theme-main flex items-center justify-between transition-colors disabled:opacity-50"
                              disabled={!item.username}
                            >
                              <span>Copy Username</span>
                              {copyFeedback?.id === item.id && copyFeedback.field === "username_quick_copy" ? <Check size={14} className="text-green-500" /> : <Copy size={14} className="text-slate-400" />}
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleCopy(item.secret, item.id, "secret_quick_copy"); setQuickActionOpenId(null); }}
                              className="px-3 py-2 text-xs text-left hover:bg-slate-50 dark:hover:bg-slate-800 text-theme-main flex items-center justify-between transition-colors"
                            >
                              <span>Copy {activeTypeTab === "password" ? "Password" : "Secret"}</span>
                              {copyFeedback?.id === item.id && copyFeedback.field === "secret_quick_copy" ? <Check size={14} className="text-green-500" /> : <Copy size={14} className="text-slate-400" />}
                            </button>
                            {item.url && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleCopy(item.url, item.id, "url_quick_copy"); setQuickActionOpenId(null); }}
                                className="px-3 py-2 text-xs text-left hover:bg-slate-50 dark:hover:bg-slate-800 text-theme-main flex items-center justify-between transition-colors"
                              >
                                <span>Copy URL</span>
                                {copyFeedback?.id === item.id && copyFeedback.field === "url_quick_copy" ? <Check size={14} className="text-green-500" /> : <Copy size={14} className="text-slate-400" />}
                              </button>
                            )}
                            {item.totp_secret && (
                              <button
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  const token = new OTPAuth.TOTP({ secret: item.totp_secret }).generate();
                                  handleCopy(token, item.id, "totp_quick_copy"); 
                                  setQuickActionOpenId(null); 
                                }}
                                className="px-3 py-2 text-xs text-left hover:bg-slate-50 dark:hover:bg-slate-800 text-theme-main flex items-center justify-between transition-colors"
                              >
                                <span>Copy 2FA Code</span>
                                {copyFeedback?.id === item.id && copyFeedback.field === "totp_quick_copy" ? <Check size={14} className="text-green-500" /> : <Copy size={14} className="text-slate-400" />}
                              </button>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    {/* Edit Button */}
                    <button
                      type="button"
                      onClick={() => handleStartEdit(item)}
                      className="p-2 text-slate-400 hover:text-claw-cyan hover:bg-cyan-50 dark:hover:bg-cyan-950/30 rounded-xl transition-colors cursor-pointer"
                      title="Edit Password & Details"
                    >
                      <Pencil size={16} />
                    </button>

                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={() => setItemToDelete(item)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors cursor-pointer"
                      title="Delete Password"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                </div>

                {/* Extra Fields Container */}
                {(item.totp_secret || item.notes || parseAttachmentIds(item.attachments).length > 0) && (
                  <div className="pt-3 border-t border-theme-subtle flex flex-col gap-3">
                    {item.notes && (
                      <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-xl p-3 text-sm text-amber-900 dark:text-amber-200">
                        <div className="font-bold flex items-center gap-1.5 mb-1 text-xs uppercase tracking-wider opacity-70">
                          <FileText size={12} /> Secure Note
                        </div>
                        <div className="whitespace-pre-wrap"><Highlight text={item.notes} match={searchQuery} /></div>
                      </div>
                    )}
                    {item.totp_secret && (
                      <div>
                        <div className="font-bold flex items-center gap-1.5 mb-1.5 text-xs uppercase tracking-wider text-slate-500">
                          <Smartphone size={12} /> TOTP Authenticator Code
                        </div>
                        <TotpDisplay secret={item.totp_secret} />
                      </div>
                    )}
                    {(() => {
                      const linkedIds = parseAttachmentIds(item.attachments);
                      return linkedIds.length > 0 ? (
                        <div>
                          <div className="font-bold flex items-center gap-1.5 mb-1.5 text-xs uppercase tracking-wider text-slate-500">
                            <Paperclip size={12} /> Attachments ({linkedIds.length})
                          </div>
                          <ul className="space-y-1.5">
                            {linkedIds.map(attId => {
                              const att = attachmentItemsById.get(attId);
                              return (
                                <li key={attId} className="flex items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl px-3 py-2 border border-theme-subtle">
                                  <span className="flex items-center gap-2 min-w-0 text-sm text-theme-main">
                                    <Paperclip size={13} className="text-claw-cyan shrink-0" />
                                    <span className="truncate">{att?.file_name || "Attachment"}</span>
                                  </span>
                                  {att?.secret && (
                                    <button
                                      type="button"
                                      onClick={() => downloadAttachment(att.secret, att.file_name || "attachment")}
                                      className="flex items-center gap-1.5 text-xs font-semibold text-claw-cyan hover:text-cyan-600 transition-colors shrink-0 cursor-pointer"
                                      title="Download decrypted file"
                                    >
                                      <Download size={13} /> Download
                                    </button>
                                  )}
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      ) : null;
                    })()}
                  </div>
                )}
              </motion.div>
            );
          })}
          </AnimatePresence>
        )}
      </div>

      {/* ── Floating / Sticky Bulk Action Bar ── */}
      <AnimatePresence>
        {selectedItemIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 25, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 25, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="sticky bottom-6 z-30 bg-slate-900/95 dark:bg-slate-800/95 text-white p-4 rounded-2xl shadow-2xl border border-slate-700/80 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="w-9 h-9 rounded-xl bg-claw-cyan/20 border border-claw-cyan/30 text-claw-cyan flex items-center justify-center font-black text-sm flex-shrink-0">
                {selectedItemIds.size}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-white flex items-center gap-2">
                  <span>{selectedItemIds.size} {selectedItemIds.size === 1 ? "Item" : "Items"} Selected</span>
                  <span className="text-[11px] font-normal text-slate-400 font-mono">
                    ({Math.round((selectedItemIds.size / (items.length || 1)) * 100)}% of vault)
                  </span>
                </p>
                <p className="text-xs text-slate-400 truncate">
                  Perform bulk actions across selected items
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end flex-wrap">
              <button
                type="button"
                onClick={toggleSelectAllVisible}
                className="px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-xl transition-colors cursor-pointer"
              >
                {isAllVisibleSelected ? "Deselect All" : `Select All Visible (${filteredPasswords.length})`}
              </button>

              <button
                type="button"
                onClick={() => setSelectedItemIds(new Set())}
                className="px-3 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                Clear
              </button>

              <button
                type="button"
                onClick={() => setIsBulkDeleting(true)}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-lg shadow-red-950/40 flex items-center gap-2 transition-all cursor-pointer"
              >
                <Trash2 size={15} />
                <span>Delete Selected ({selectedItemIds.size})</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TotpDisplay({ secret }: { secret: string }) {
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
