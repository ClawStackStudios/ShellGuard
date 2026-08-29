import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Shield, 
  Key, 
  Lock, 
  Plus, 
  Trash2, 
  LogOut, 
  User, 
  Bot, 
  Activity,
  ChevronRight,
  Eye,
  EyeOff,
  Download,
  Copy,
  Upload,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Check,
  Loader2,
  Zap,
  Settings,
  Menu,
  Search,
  Database,
  Save,
  CheckCircle2,
  LayoutGrid,
  ArrowUpDown,
  FileText,
  FileCode,
  Paperclip,
  CornerDownLeft,
  ChevronDown,
  X
} from "lucide-react";
import { restAdapter, SESSION_KEYS } from "./services/api/restAdapter.ts";
import { InteractiveBrand } from "./components/Branding/InteractiveBrand.tsx";
import { ThemeToggle } from "./components/Theme/ThemeToggle.tsx";
import { LandingView } from "./components/LandingView.tsx";
import { LoginView } from "./components/LoginView.tsx";
import { SetupView } from "./components/SetupView.tsx";
import { Sidebar } from "./components/Layout/Sidebar.tsx";
import { Header } from "./components/Layout/Header.tsx";
import { QuickLoginModal, AuthModalConfig } from "./components/QuickLoginModal.tsx";
import { PasswordVaultView } from "./components/Vault/PasswordVaultView.tsx";
import { SuperLobsterProvider, useSuperLobster } from "./components/Admin/SuperLobsterContext.tsx";
import { SuperLobsterLogin } from "./components/Admin/SuperLobsterLogin.tsx";
import { SuperLobsterPanel } from "./components/Admin/SuperLobsterPanel.tsx";
import { GeneratorToolView } from "./components/Generator/GeneratorToolView.tsx";
import { ImportExportView } from "./components/Settings/ImportExportView.tsx";
import { 
  generateUUID, 
  generateHumanKey, 
  hashToken, 
  downloadIdentityFile 
} from "./lib/crypto.ts";
import { 
  deriveShellKey, 
  encryptField, 
  decryptField 
} from "./lib/shellCryption.ts";
import { PendingAttachment } from "./lib/attachmentUtils.ts";
import { VaultItem, Agent, Lobster, VaultItemType } from "./types.ts";
import { GeneratorConfig, getGlobalGeneratorConfig, setGlobalGeneratorConfig } from "./lib/generator.ts";
import { GeneratorOptions } from "./components/Generator/GeneratorOptions.tsx";
import { 
  getStoredLobsters, 
  saveStoredLobsters, 
  getActiveLobsterId, 
  setActiveLobsterId, 
  getSessions, 
  setSessionForUser, 
  removeSessionForUser, 
  activateUserSession, 
  migrateLegacySession 
} from "./lib/sessionManager.ts";

export default function App() {
  const [isMolting, setIsMolting] = useState(true);
  const [lobsters, setLobsters] = useState<Lobster[]>([]);
  const [activeLobsterId, setActiveLobsterIdState] = useState<string | null>(null);
  const [shellKey, setShellKey] = useState<CryptoKey | null>(null);
  const [authModalConfig, setAuthModalConfig] = useState<AuthModalConfig | null>(null);

  const lobster = useMemo(() => {
    return lobsters.find(l => l.uuid === activeLobsterId) || null;
  }, [lobsters, activeLobsterId]);

  const activeSessions = useMemo(() => {
    const sessions = getSessions();
    const map: Record<string, boolean> = {};
    for (const l of lobsters) {
      map[l.uuid] = Boolean(sessions[l.uuid]);
    }
    return map;
  }, [lobsters, activeLobsterId, shellKey]);
  const [view, setView] = useState<"landing" | "vault" | "agents" | "setup" | "login" | "settings" | "generator" | "settings_generator" | "settings_agents" | "settings_import_export">("landing");
  const [vaultItems, setVaultItems] = useState<VaultItem[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string>("all");
  const [agents, setAgents] = useState<Agent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Global Header Search & Vault Tab sync
  const [headerSearchQuery, setHeaderSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [activeVaultTab, setActiveVaultTab] = useState<VaultItemType>("password");
  const [isAddingVaultItem, setIsAddingVaultItem] = useState(false);
  const [isHeaderAddMenuOpen, setIsHeaderAddMenuOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchDropdownRef = useRef<HTMLDivElement>(null);
  const headerAddMenuRef = useRef<HTMLDivElement>(null);

  const handleOpenAdd = (type: VaultItemType) => {
    setActiveVaultTab(type);
    setView("vault");
    setIsAddingVaultItem(true);
    setIsHeaderAddMenuOpen(false);
  };

  // ── SuperLobster Panel (admin plane) ─────────────────────────────────────────
  // Two entry hashes: #/super-lobster (canonical) and #/admin-login (alias).
  const isAdminHash = () =>
    typeof window !== 'undefined' &&
    (window.location.hash === '#/super-lobster' || window.location.hash === '#/admin-login');

  const [isSuperLobster, setIsSuperLobster] = useState(isAdminHash);

  useEffect(() => {
    const onHashChange = () => setIsSuperLobster(isAdminHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Global keyboard shortcuts for quick search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchFocused(true);
      } else if (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchFocused(true);
      } else if (e.key === "Escape") {
        setIsSearchFocused(false);
        setIsHeaderAddMenuOpen(false);
        searchInputRef.current?.blur();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Click outside to dismiss search results dropdown and header add menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchDropdownRef.current && 
        !searchDropdownRef.current.contains(e.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(e.target as Node)
      ) {
        setIsSearchFocused(false);
      }
      if (
        headerAddMenuRef.current &&
        !headerAddMenuRef.current.contains(e.target as Node)
      ) {
        setIsHeaderAddMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter vault items in real time for global search
  const matchingVaultItems = useMemo(() => {
    if (!headerSearchQuery.trim()) return [];
    const q = headerSearchQuery.toLowerCase();
    return vaultItems.filter((item) => {
      const matchTitle = item.title?.toLowerCase().includes(q);
      const matchUser = item.username?.toLowerCase().includes(q);
      const matchUrl = item.url?.toLowerCase().includes(q);
      const matchCategory = item.category?.toLowerCase().includes(q);
      const matchNotes = item.notes?.toLowerCase().includes(q);
      const matchSecret = item.type === "note" && item.secret?.toLowerCase().includes(q);
      return Boolean(matchTitle || matchUser || matchUrl || matchCategory || matchNotes || matchSecret);
    });
  }, [vaultItems, headerSearchQuery]);

  const handleSelectSearchResult = (item: VaultItem) => {
    const itemType = (item.type as VaultItemType) || "password";
    setActiveVaultTab(itemType);
    setHeaderSearchQuery(item.title);
    setView("vault");
    setIsSearchFocused(false);
    searchInputRef.current?.blur();
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setView("vault");
    setIsSearchFocused(false);
    searchInputRef.current?.blur();
  };

  // Inactivity timeout in minutes. 0 means disabled.
  const [inactivityTimeout, setInactivityTimeout] = useState<number>(() => {
    const stored = localStorage.getItem("sg_inactivity_timeout");
    return stored ? parseInt(stored, 10) : 15;
  });

  const scuttleVault = useCallback(async (key: CryptoKey) => {
    try {
      const [reefLogins, reefNotes, reefKeys, reefAttachments] = await Promise.all([
        restAdapter.GET("/api/vault").catch(() => []),
        restAdapter.GET("/api/notes").catch(() => []),
        restAdapter.GET("/api/keys").catch(() => []),
        restAdapter.GET("/api/attachments").catch(() => []),
      ]);
      
      const decryptedLogins = await Promise.all(reefLogins.map(async (p: any) => {
        try {
          const decryptedSecret = await decryptField(p.secret, key, "vault_pearls", p.id);
          let decryptedTotp = "";
          if (p.totp_secret) {
            try { decryptedTotp = await decryptField(p.totp_secret, key, "vault_pearls_totp", p.id); } catch (e) { decryptedTotp = "⚠️ [Decryption Failed]"; }
          }
          return { ...p, secret: decryptedSecret, totp_secret: decryptedTotp, type: "password", category: p.category || "Personal" };
        } catch (e) {
          return { ...p, secret: "⚠️ [Decryption Failed]", totp_secret: "⚠️ [Decryption Failed]", type: "password", category: p.category || "Personal" };
        }
      }));

      const decryptedNotes = await Promise.all(reefNotes.map(async (p: any) => {
        try {
          const content = await decryptField(p.content, key, "vault_secure_notes", p.id);
          return { ...p, secret: content, type: "note", category: p.category || "Personal" };
        } catch (e) {
          return { ...p, secret: "⚠️ [Decryption Failed]", type: "note", category: p.category || "Personal" };
        }
      }));

      const decryptedKeys = await Promise.all(reefKeys.map(async (p: any) => {
        try {
          const kv = await decryptField(p.key_value, key, "vault_ssh_keys", p.id);
          return { ...p, secret: kv, type: "key", category: p.category || "Personal" };
        } catch (e) {
          return { ...p, secret: "⚠️ [Decryption Failed]", type: "key", category: p.category || "Personal" };
        }
      }));

      const decryptedAttachments = await Promise.all(reefAttachments.map(async (p: any) => {
        try {
          const fd = await decryptField(p.file_data, key, "vault_secure_attachments", p.id);
          return { ...p, secret: fd, type: "attachment", category: p.category || "Personal" };
        } catch (e) {
          return { ...p, secret: "⚠️ [Decryption Failed]", type: "attachment", category: p.category || "Personal" };
        }
      }));

      setVaultItems([...decryptedLogins, ...decryptedNotes, ...decryptedKeys, ...decryptedAttachments]);
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  const scuttleAgents = useCallback(async () => {
    try {
      const reef = await restAdapter.GET("/api/agent-keys");
      setAgents(reef);
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  const handleLogout = useCallback(() => {
    if (activeLobsterId) {
      removeSessionForUser(activeLobsterId);
    }
    setShellKey(null);
    setActiveLobsterId(null);
    setActiveLobsterIdState(null);
    setAuthModalConfig(null);
    setView("landing");
  }, [activeLobsterId]);


  const handleSwitchAccount = async (uuid: string) => {
    const session = activateUserSession(uuid);
    setActiveLobsterIdState(uuid);
    const target = lobsters.find((l) => l.uuid === uuid) || null;

    if (session) {
      try {
        const sk = await deriveShellKey(session.rawKey, uuid);
        setShellKey(sk);
        setView("vault");
        scuttleVault(sk);
      } catch {
        removeSessionForUser(uuid);
        setShellKey(null);
        setAuthModalConfig({ mode: "unlock", target });
      }
    } else {
      setShellKey(null);
      setAuthModalConfig({ mode: "unlock", target });
    }
  };

  const handleAddAccount = () => {
    setAuthModalConfig({ mode: "add" });
  };

  const handleRemoveAccount = (uuid: string) => {
    removeSessionForUser(uuid);
    const nextLobsters = lobsters.filter((l) => l.uuid !== uuid);
    setLobsters(nextLobsters);
    saveStoredLobsters(nextLobsters);

    if (activeLobsterId === uuid) {
      if (nextLobsters.length > 0) {
        handleSwitchAccount(nextLobsters[0].uuid);
      } else {
        setActiveLobsterId(null);
        setActiveLobsterIdState(null);
        setShellKey(null);
        setView("landing");
      }
    }
  };

  const handleLockAccount = (uuid: string) => {
    removeSessionForUser(uuid);
    // Force a re-render so the header updates the icon immediately
    setLobsters([...lobsters]);
  };

  // Inactivity timer effect
  useEffect(() => {
    if (!shellKey || inactivityTimeout <= 0) return;

    let timeoutId: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        handleLogout();
      }, inactivityTimeout * 60 * 1000);
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => document.addEventListener(event, resetTimer, true));

    resetTimer();

    return () => {
      clearTimeout(timeoutId);
      events.forEach(event => document.removeEventListener(event, resetTimer, true));
    };
  }, [shellKey, inactivityTimeout, handleLogout]);

  // 🐚 Initial scuttle to check auth
  useEffect(() => {
    const { lobsters: migratedLobsters, activeId } = migrateLegacySession();
    setLobsters(migratedLobsters);
    setActiveLobsterIdState(activeId);

    if (activeId) {
      const session = activateUserSession(activeId);
      if (session) {
        deriveShellKey(session.rawKey, activeId)
          .then((sk) => {
            setShellKey(sk);
            setView("vault");
          })
          .catch(() => {
            handleLogout();
          });
      } else {
        const target = migratedLobsters.find((l) => l.uuid === activeId);
        if (target) {
          setAuthModalConfig({ mode: "unlock", target });
        }
        setView("vault");
      }
    } else if (migratedLobsters.length > 0) {
      // If no active session, but we know accounts, default to the first one as locked
      const target = migratedLobsters[0];
      setActiveLobsterIdState(target.uuid);
      setAuthModalConfig({ mode: "unlock", target });
      setView("vault");
    } else {
      setView("landing");
    }
    setIsMolting(false);
  }, []);

  /**
   * ShellCrypt + upload a staged attachment file to /api/attachments.
   */
  const uploadAttachmentRecord = async (key: CryptoKey, att: PendingAttachment): Promise<string> => {
    const encryptedFile = await encryptField(att.dataUrl, key, "vault_secure_attachments", att.id);
    await restAdapter.POST("/api/attachments", {
      id: att.id,
      title: att.file_name,
      file_data: encryptedFile,
      file_name: att.file_name,
      mime_type: att.mime_type,
      category: "Attachment",
    });
    return att.id;
  };

  const lockTheClaw = async (item: {
    title: string;
    secret: string;
    username: string;
    url: string;
    category: string;
    type: VaultItemType;
    notes?: string;
    totp_secret?: string;
    attachments?: string;
    newAttachments?: PendingAttachment[];
  }) => {
    if (!shellKey) return;
    try {
      const id = generateUUID();
      
      if (item.type === 'note') {
        const encryptedContent = await encryptField(item.secret, shellKey, "vault_secure_notes", id);
        await restAdapter.POST("/api/notes", { id, title: item.title, content: encryptedContent, category: item.category });
      } else if (item.type === 'key') {
        const encryptedKey = await encryptField(item.secret, shellKey, "vault_ssh_keys", id);
        await restAdapter.POST("/api/keys", { id, title: item.title, key_value: encryptedKey, username: item.username, category: item.category });
      } else if (item.type === 'attachment') {
        const encryptedFile = await encryptField(item.secret, shellKey, "vault_secure_attachments", id);
        await restAdapter.POST("/api/attachments", { id, title: item.title, file_data: encryptedFile, file_name: item.username, mime_type: "", category: item.category });
      } else {
        let attachmentIdsJson = item.attachments || "[]";
        if (item.newAttachments && item.newAttachments.length > 0) {
          const uploadedIds: string[] = [];
          for (const att of item.newAttachments) {
            uploadedIds.push(await uploadAttachmentRecord(shellKey, att));
          }
          attachmentIdsJson = JSON.stringify(uploadedIds);
        }
        const encryptedSecret = await encryptField(item.secret, shellKey, "vault_pearls", id);
        let encryptedTotp = "";
        if (item.totp_secret) {
          encryptedTotp = await encryptField(item.totp_secret, shellKey, "vault_pearls_totp", id);
        }
        await restAdapter.POST("/api/vault", {
          id,
          title: item.title,
          secret: encryptedSecret,
          username: item.username,
          url: item.url,
          category: item.category,
          type: item.type,
          notes: item.notes,
          totp_secret: encryptedTotp,
          attachments: attachmentIdsJson
        });
      }
      scuttleVault(shellKey);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const updateTheClaw = async (id: string, item: {
    title: string;
    secret: string;
    username: string;
    url: string;
    category: string;
    type: VaultItemType;
    notes?: string;
    totp_secret?: string;
    attachments?: string;
    newAttachments?: PendingAttachment[];
    removedAttachmentIds?: string[];
  }) => {
    if (!shellKey) return;
    try {
      if (item.type === 'note') {
        const encryptedContent = await encryptField(item.secret, shellKey, "vault_secure_notes", id);
        await restAdapter.PUT(`/api/notes/${id}`, { title: item.title, content: encryptedContent, category: item.category });
      } else if (item.type === 'key') {
        const encryptedKey = await encryptField(item.secret, shellKey, "vault_ssh_keys", id);
        await restAdapter.PUT(`/api/keys/${id}`, { title: item.title, key_value: encryptedKey, username: item.username, category: item.category });
      } else if (item.type === 'attachment') {
        const encryptedFile = await encryptField(item.secret, shellKey, "vault_secure_attachments", id);
        await restAdapter.PUT(`/api/attachments/${id}`, { title: item.title, file_data: encryptedFile, file_name: item.username, mime_type: "", category: item.category });
      } else {
        if (item.newAttachments && item.newAttachments.length > 0) {
          for (const att of item.newAttachments) {
            await uploadAttachmentRecord(shellKey, att);
          }
        }
        if (item.removedAttachmentIds && item.removedAttachmentIds.length > 0) {
          for (const attId of item.removedAttachmentIds) {
            await restAdapter.DELETE(`/api/attachments/${attId}`).catch(() => {});
          }
        }
        const encryptedSecret = await encryptField(item.secret, shellKey, "vault_pearls", id);
        let encryptedTotp = "";
        if (item.totp_secret) {
          encryptedTotp = await encryptField(item.totp_secret, shellKey, "vault_pearls_totp", id);
        }
        await restAdapter.PUT(`/api/vault/${id}`, {
          title: item.title,
          secret: encryptedSecret,
          username: item.username,
          url: item.url,
          category: item.category,
          type: item.type,
          notes: item.notes,
          totp_secret: encryptedTotp,
          attachments: item.attachments || "[]"
        });
      }
      scuttleVault(shellKey);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleRenamePod = async (oldPod: string, newPod: string) => {
    if (!shellKey) return;
    const itemsToUpdate = vaultItems.filter(
      (i) => (i.category || "Personal") === oldPod || (i.category || "Personal").startsWith(oldPod + "/")
    );
    for (const item of itemsToUpdate) {
      const currentCat = item.category || "Personal";
      const updatedCat = currentCat === oldPod ? newPod : currentCat.replace(new RegExp(`^${oldPod}/`), `${newPod}/`);
      await updateTheClaw(item.id, {
        title: item.title,
        secret: item.secret,
        username: item.username || "",
        url: item.url || "",
        category: updatedCat,
        type: item.type,
        notes: item.notes,
        totp_secret: item.totp_secret,
        attachments: item.attachments
      });
    }
  };

  const handleDeletePod = async (podToDelete: string) => {
    if (!shellKey) return;
    const itemsToUpdate = vaultItems.filter((i) => (i.category || "Personal") === podToDelete);
    for (const item of itemsToUpdate) {
      await updateTheClaw(item.id, {
        title: item.title,
        secret: item.secret,
        username: item.username || "",
        url: item.url || "",
        category: "Personal",
        type: item.type,
        notes: item.notes,
        totp_secret: item.totp_secret,
        attachments: item.attachments
      });
    }
  };

  const handleLoginSuccess = (l: Lobster, t: string, sk: CryptoKey, rk: string) => {
    setSessionForUser(l.uuid, t, rk);
    setActiveLobsterId(l.uuid);
    setActiveLobsterIdState(l.uuid);

    setLobsters((prev) => {
      const exists = prev.some((item) => item.uuid === l.uuid);
      const next = exists
        ? prev.map((item) => (item.uuid === l.uuid ? { ...item, ...l } : item))
        : [...prev, l];
      saveStoredLobsters(next);
      return next;
    });

    setShellKey(sk);
    setView("vault");
  };

  if (isSuperLobster) {
    return (
      <SuperLobsterProvider>
        <SuperLobsterGate />
      </SuperLobsterProvider>
    );
  }

  if (isMolting) {
    return (
      <div className="min-h-screen bg-theme-base flex items-center justify-center">
        <motion.div 
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="text-lobster-red text-6xl"
        >
          🦞
        </motion.div>
      </div>
    );
  }

  const isLocked = Boolean(lobster && !shellKey);
  const isModalOpen = Boolean(authModalConfig || isLocked);
  const activeModalConfig = authModalConfig || (isLocked && lobster ? { mode: "unlock" as const, target: lobster } : null);

  const handleAuthModalSuccess = (l: Lobster, t: string, sk: CryptoKey, rk: string) => {
    handleLoginSuccess(l, t, sk, rk);
    setAuthModalConfig(null);
  };

  const handleAuthModalClose = () => {
    // We intentionally stay on the dashboard even if locked, so they can use the Header dropdown
    setAuthModalConfig(null);
  };

  if (view === "landing" || view === "login" || view === "setup") {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-ocean text-slate-900 dark:text-slate-50 antialiased flex flex-col justify-center items-center p-4 sm:p-6 overflow-auto relative selection:bg-[#e4048a]/30">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-[#e4048a]/10 dark:bg-[#e4048a]/5 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-[#06b6d4]/10 dark:bg-[#06b6d4]/5 blur-[100px] pointer-events-none" />

        {activeModalConfig && (
          <QuickLoginModal 
            config={activeModalConfig} 
            onSuccess={handleAuthModalSuccess} 
            onClose={handleAuthModalClose} 
          />
        )}

        <div className="w-full max-w-md my-8 relative z-10">
          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                key="error"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-6 p-4 bg-lobster-red/10 border border-lobster-red/30 rounded-xl flex items-center gap-3 text-lobster-red"
              >
                <AlertCircle size={20} />
                <p className="text-sm font-medium">{error}</p>
                <button onClick={() => setError(null)} className="ml-auto text-xs underline cursor-pointer">Dismiss</button>
              </motion.div>
            )}

            {view === "landing" && (
              <LandingView 
                onClawIn={() => setView("login")} 
                onHatch={() => setView("setup")} 
              />
            )}
            {view === "setup" && (
              <SetupView 
                onSuccess={handleLoginSuccess} 
                onSwitch={() => setView("login")} 
                onCancel={lobster ? () => setView("vault") : undefined}
              />
            )}
            {view === "login" && (
              <LoginView 
                onSuccess={handleLoginSuccess} 
                onSwitch={() => setView("setup")} 
                onBack={() => setView("landing")}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // Authenticated Dashboard Layout
  const isSettingsMode = view.startsWith('settings');

  return (
    <div className="h-screen bg-theme-surface text-theme-main overflow-hidden font-sans selection:bg-claw-cyan/30 flex">
      {activeModalConfig && (
        <QuickLoginModal 
          config={activeModalConfig} 
          onSuccess={handleAuthModalSuccess} 
          onClose={handleAuthModalClose} 
        />
      )}
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 z-40 transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - FIXED to the left viewport wall */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 h-full flex flex-col overflow-hidden bg-theme-surface border-r border-theme-subtle transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? "w-16 translate-x-0" : 
          isSidebarOpen ? "w-64 translate-x-0" : "w-64 -translate-x-full lg:translate-x-0"
        }`}
      >
        <Sidebar
          view={view}
          setView={setView}
          settingsMode={isSettingsMode}
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
          onClose={() => setIsSidebarOpen(false)}
          onLogout={handleLogout}
          vaultItems={vaultItems}
          selectedFolder={selectedFolder}
          setSelectedFolder={setSelectedFolder}
          handleRenamePod={handleRenamePod}
          handleDeletePod={handleDeletePod}
          scuttleVault={() => shellKey && scuttleVault(shellKey)}
          scuttleAgents={scuttleAgents}
        />
      </aside>

      {/* Main Content Area */}
      <main 
        className="h-full w-full flex flex-col min-h-0 bg-theme-base text-theme-main overflow-hidden relative transition-all duration-300 ease-in-out"
        style={{ 
          paddingLeft: window.innerWidth < 1024 ? 0 : isSidebarCollapsed ? "64px" : "256px" 
        }}
      >
        <Header
          user={lobster}
          lobsters={lobsters}
          activeSessions={activeSessions}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          view={view}
          onSwitchAccount={handleSwitchAccount}
          onAddAccount={handleAddAccount}
          onRemoveAccount={handleRemoveAccount}
          onLockAccount={handleLockAccount}
          // Search props
          searchQuery={headerSearchQuery}
          onSearchQueryChange={setHeaderSearchQuery}
          isSearchFocused={isSearchFocused}
          onSearchFocusChange={setIsSearchFocused}
          matchingVaultItems={matchingVaultItems}
          onSelectSearchResult={handleSelectSearchResult}
          onSearchSubmit={handleSearchSubmit}
          searchInputRef={searchInputRef}
          searchDropdownRef={searchDropdownRef}
          // Add menu props
          isHeaderAddMenuOpen={isHeaderAddMenuOpen}
          onHeaderAddMenuToggle={() => setIsHeaderAddMenuOpen(!isHeaderAddMenuOpen)}
          onOpenAdd={handleOpenAdd}
          headerAddMenuRef={headerAddMenuRef}
        />

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8 custom-scrollbar relative">
          <div className="max-w-5xl mx-auto">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                  key="error"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mb-8 p-4 bg-lobster-red/10 border border-lobster-red/30 rounded-xl flex items-center gap-3 text-lobster-red"
                >
                  <AlertCircle size={20} />
                  <p className="text-sm font-medium">{error}</p>
                  <button onClick={() => setError(null)} className="ml-auto text-xs underline cursor-pointer">Dismiss</button>
                </motion.div>
              )}

              {view === "vault" && (
                <motion.div key="vault" className="w-full">
                  <PasswordVaultView 
                    items={vaultItems} 
                    isLocked={isLocked}
                    onUnlock={() => setAuthModalConfig({ mode: "unlock", target: lobster })}
                    onAdd={lockTheClaw} 
                    onUpdate={updateTheClaw}
                    selectedFolder={selectedFolder}
                    onSelectFolder={setSelectedFolder}
                    searchQuery={headerSearchQuery}
                    onSearchQueryChange={setHeaderSearchQuery}
                    activeTypeTab={activeVaultTab}
                    onActiveTypeTabChange={setActiveVaultTab}
                    isAdding={isAddingVaultItem}
                    onToggleIsAdding={setIsAddingVaultItem}
                    onDelete={async (id, type) => { 
                      const endpoint = type === 'password' ? '/api/vault' : 
                                       type === 'note' ? '/api/notes' : 
                                       type === 'key' ? '/api/keys' : '/api/attachments';
                      await restAdapter.DELETE(`${endpoint}/${id}`); 
                      if(shellKey) scuttleVault(shellKey); 
                    }} 
                    onDeleteMultiple={async (selectedList) => {
                      for (const item of selectedList) {
                        const endpoint = item.type === 'password' ? '/api/vault' : 
                                         item.type === 'note' ? '/api/notes' : 
                                         item.type === 'key' ? '/api/keys' : '/api/attachments';
                        await restAdapter.DELETE(`${endpoint}/${item.id}`);
                      }
                      if (shellKey) scuttleVault(shellKey);
                    }}
                  />
                </motion.div>
              )}
              {(view === "settings_agents" || view === "agents") && (
                <motion.div key="agents" className="w-full">
                  <AgentsView agents={agents} onAdd={async (name, perms) => { await restAdapter.POST("/api/agent-keys", { name, permissions: perms }); scuttleAgents(); }} onDelete={async (id) => { await restAdapter.DELETE(`/api/agent-keys/${id}`); scuttleAgents(); }} />
                </motion.div>
              )}
              {view === "generator" && (
                <motion.div key="generator" className="w-full">
                  <GeneratorToolView onSaveToVault={lockTheClaw} />
                </motion.div>
              )}
              {(view === "settings" || view === "settings_generator") && (
                <motion.div key="settings" className="w-full">
                  <SettingsView 
                    tab={view === "settings" ? "profile" : "generator"}
                    lobster={lobster} 
                    onUpdateLobster={(updated) => {
                      setLobsters((prev) => {
                        const next = prev.map((l) => (l.uuid === updated.uuid ? updated : l));
                        saveStoredLobsters(next);
                        return next;
                      });
                    }} 
                    inactivityTimeout={inactivityTimeout}
                    setInactivityTimeout={setInactivityTimeout}
                  />
                </motion.div>
              )}
              {view === "settings_import_export" && (
                <motion.div key="settings_import_export" className="w-full">
                  <ImportExportView 
                    items={vaultItems} 
                    lobster={lobster} 
                    onImportItems={async (imported) => {
                      for (const item of imported) {
                        await lockTheClaw({
                          title: item.title || "Imported Record",
                          secret: item.secret || "",
                          username: item.username || "",
                          url: item.url || "",
                          category: item.category || "Personal",
                          type: (item.type as VaultItemType) || "password",
                          notes: item.notes || "",
                          totp_secret: item.totp_secret || "",
                          attachments: item.attachments || "[]"
                        });
                      }
                      if (shellKey) await scuttleVault(shellKey);
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}

function SettingsView({ 
  tab,
  lobster, 
  onUpdateLobster,
  inactivityTimeout,
  setInactivityTimeout
}: { 
  tab: "profile" | "generator";
  lobster: Lobster; 
  onUpdateLobster: (updated: Lobster) => void;
  inactivityTimeout: number;
  setInactivityTimeout: (val: number) => void;
}) {
  const [displayName, setDisplayName] = useState(lobster.displayName || lobster.username);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [genConfig, setGenConfig] = useState<GeneratorConfig>(getGlobalGeneratorConfig());
  
  const handleGenConfigChange = (newCfg: GeneratorConfig) => {
    setGenConfig(newCfg);
    setGlobalGeneratorConfig(newCfg);
  };

  // Sync state if lobster prop changes
  useEffect(() => {
    setDisplayName(lobster.displayName || lobster.username);
  }, [lobster.displayName, lobster.username]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;

    setIsSaving(true);
    setSaveError(null);
    setSavedSuccess(false);

    try {
      const res = await restAdapter.PUT("/api/auth/profile", { 
        displayName: displayName.trim() 
      });
      const updated: Lobster = {
        ...lobster,
        displayName: res.displayName || displayName.trim()
      };
      onUpdateLobster(updated);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      setSaveError(err.message || "Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTimeoutChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = parseInt(e.target.value, 10);
    setInactivityTimeout(val);
    localStorage.setItem("sg_inactivity_timeout", val.toString());
  };

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h2 className="text-3xl font-black text-theme-main">Settings</h2>
        <p className="text-theme-muted mt-1">Manage your ShellGuard©™ identity and preferences.</p>
      </div>

      {tab === "generator" ? (
        <div className="bg-theme-surface/50 rounded-3xl border border-theme-subtle overflow-hidden">
          <div className="p-6 border-b border-theme-subtle">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Zap className="text-claw-cyan" size={20} />
              Generator Options
            </h3>
            <p className="text-sm text-slate-500 mt-1">Configure global defaults for the password generator used across ShellGuard.</p>
          </div>
          <div className="p-6">
            <GeneratorOptions config={genConfig} onChange={handleGenConfigChange} />
          </div>
        </div>
      ) : (
        <>
<div className="bg-theme-surface/50 rounded-3xl border border-theme-subtle overflow-hidden">
        <div className="p-6 border-b border-theme-subtle">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <User className="text-claw-cyan" size={20} />
            Identity Details
          </h3>
          <p className="text-sm text-slate-500 mt-1">Your sovereign identity anchored to this device.</p>
        </div>
        <div className="p-6 space-y-6">
          {/* Display Name Edit Form */}
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Display Name
                </label>
                <span className="text-xs text-slate-400">Shown across the reef dashboard</span>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <input 
                  type="text" 
                  maxLength={48}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Larry Lobster"
                  className="flex-1 bg-theme-base border border-theme-subtle rounded-xl px-4 py-3 text-theme-main font-medium outline-none focus:border-claw-cyan focus:ring-2 focus:ring-claw-cyan/20 transition-all placeholder:text-slate-500"
                />
                <button
                  type="submit"
                  disabled={isSaving || !displayName.trim() || displayName.trim() === (lobster.displayName || lobster.username)}
                  className="px-6 py-3 bg-claw-cyan hover:bg-claw-cyan/90 disabled:opacity-50 disabled:cursor-not-allowed text-ocean-dark font-bold rounded-xl transition-all flex items-center justify-center gap-2 flex-shrink-0 cursor-pointer shadow-sm"
                >
                  {isSaving ? (
                    <span className="inline-block animate-spin">🐚</span>
                  ) : (
                    <Save size={16} />
                  )}
                  <span>Save</span>
                </button>
              </div>
            </div>

            {savedSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2"
              >
                <CheckCircle2 size={15} />
                <span>Display name updated across your ShellGuard session.</span>
              </motion.div>
            )}

            {saveError && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-lobster-red/10 border border-lobster-red/30 rounded-xl text-lobster-red text-xs font-semibold flex items-center gap-2"
              >
                <AlertCircle size={15} />
                <span>{saveError}</span>
              </motion.div>
            )}
          </form>

          <div className="pt-2 border-t border-theme-subtle space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Username</label>
              <input 
                type="text" 
                value={lobster.username}
                readOnly
                className="w-full bg-theme-base/60 border border-theme-subtle rounded-xl px-4 py-3 text-slate-500 font-medium outline-none cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Sovereign UUID</label>
              <input 
                type="text" 
                value={lobster.uuid}
                readOnly
                className="w-full bg-theme-base/60 border border-theme-subtle rounded-xl px-4 py-3 text-slate-500 font-mono text-sm outline-none cursor-not-allowed"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-theme-surface/50 rounded-3xl border border-theme-subtle overflow-hidden">
        <div className="p-6 border-b border-theme-subtle">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Shield className="text-claw-cyan" size={20} />
            Security Preferences
          </h3>
          <p className="text-sm text-slate-500 mt-1">Manage vault auto-locking timeouts.</p>
        </div>
        <div className="p-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">
                Inactivity Auto-Lock
              </label>
            </div>
            <select
              value={inactivityTimeout}
              onChange={handleTimeoutChange}
              className="w-full bg-theme-base border border-theme-subtle rounded-xl px-4 py-3 text-theme-main font-medium outline-none focus:border-claw-cyan focus:ring-2 focus:ring-claw-cyan/20 transition-all cursor-pointer"
            >
              <option value={0}>Disabled</option>
              <option value={5}>5 Minutes</option>
              <option value={15}>15 Minutes</option>
              <option value={30}>30 Minutes</option>
              <option value={60}>1 Hour</option>
            </select>
            <p className="text-xs text-slate-500 mt-2">
              Automatically locks your vault and logs you out when no mouse or keyboard activity is detected.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-red-50 dark:bg-red-950/10 rounded-3xl border border-red-200 dark:border-red-900/30 overflow-hidden">
        <div className="p-6 border-b border-red-200 dark:border-red-900/30">
          <h3 className="text-lg font-bold text-red-600 dark:text-red-500 flex items-center gap-2">
            <AlertCircle size={20} />
            Danger Zone
          </h3>
        </div>
        <div className="p-6">
          <p className="text-sm text-red-800 dark:text-red-400 mb-4">
            Scuttling your identity will permanently delete your account and all associated encrypted secrets from this server. This action cannot be undone.
          </p>
          <button className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl cursor-pointer">
            Scuttle Identity
          </button>
        </div>
      </div>
        </>
      )}
    </div>
  );
}


function AgentsView({ agents, onAdd, onDelete }: { agents: Agent[]; onAdd: (n: string, p: any) => void; onDelete: (id: string) => void }) {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});

  const toggleKeyVisibility = (id: string) => {
    setVisibleKeys(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopyKey = (key: string) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(key);
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = key;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
    }
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-theme-main">Lobster Keys</h2>
          <p className="text-theme-muted mt-1 max-w-xl">
            Manage delegated access keys for your agents and automated services. Agents use these keys to authenticate and request secrets from the vault.
          </p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-lobster-red text-white font-bold rounded-xl hover:bg-red-600 shadow-lg shadow-red-200 dark:shadow-red-900/20 whitespace-nowrap cursor-pointer transition-all"
        >
          {isAdding ? "Cancel" : <><Plus size={20} /> Forge Lobster Key</>}
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div 
            key="adding"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-theme-surface/50 p-6 rounded-3xl border-2 border-lobster-red shadow-sm mb-4">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-lobster-red/10 flex items-center justify-center text-lobster-red">
                  <Bot size={20} />
                </div>
                <h3 className="text-xl font-bold">Forge New Lobster Key</h3>
              </div>
              
              <div className="mb-6">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Agent / Service Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-theme-base border border-theme-subtle rounded-xl px-4 py-3 focus:border-lobster-red focus:ring-1 focus:ring-lobster-red outline-none text-theme-main"
                  placeholder="e.g. RSS_Scuttler_Bot"
                />
              </div>
              
              <div className="p-4 bg-theme-base rounded-xl border border-theme-subtle mb-6">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Default Permissions</p>
                <div className="flex flex-wrap gap-3">
                  <span className="text-xs font-medium bg-green-500/10 text-green-600 dark:text-green-500 px-3 py-1.5 rounded-lg border border-green-500/20 flex items-center gap-1.5">
                    <Check size={14} /> canRead
                  </span>
                  <span className="text-xs font-medium bg-claw-cyan/10 text-claw-cyan px-3 py-1.5 rounded-lg border border-claw-cyan/20 flex items-center gap-1.5">
                    <Check size={14} /> canWrite
                  </span>
                </div>
              </div>
              
              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setIsAdding(false)}
                  className="px-6 py-3 text-slate-500 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => { onAdd(name, { canRead: true, canWrite: true }); setName(""); setIsAdding(false); }}
                  disabled={!name}
                  className="px-8 py-3 bg-lobster-red hover:bg-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-200 dark:shadow-red-900/40 disabled:opacity-50 cursor-pointer"
                >
                  Forge lb- Key
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid gap-4">
        {agents.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-3xl bg-white/50 dark:bg-slate-900/20">
            <Bot className="mx-auto text-slate-300 dark:text-slate-700 mb-4" size={48} />
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-1">No Lobster Keys Forged</h3>
            <p className="text-slate-500 text-sm">Forge your first delegated access key above.</p>
          </div>
        ) : (
          agents.map((agent) => (
            <motion.div 
              key={agent.id}
              layout
              className="bg-theme-surface/40 p-5 rounded-2xl border border-theme-subtle hover:border-lobster-red/50 flex flex-col gap-4 group shadow-sm transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 bg-lobster-red/10 border border-lobster-red/20 rounded-xl flex items-center justify-center text-lobster-red flex-shrink-0">
                    <Bot size={22} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-base text-theme-main truncate">{agent.name}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] font-mono text-slate-400">ID: {agent.id.substring(0, 8)}</span>
                      <span className="text-[10px] px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded-md font-medium border border-emerald-500/20">
                        Active Key
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => onDelete(agent.id)}
                    className="p-2 text-slate-400 hover:text-lobster-red hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors cursor-pointer"
                    title="Revoke Lobster Key"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              {/* API Key Box with 1-Click Copy Full Key Button */}
              <div className="bg-theme-base p-3 rounded-xl border border-theme-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex-shrink-0">API Key:</span>
                  <div 
                    onClick={() => handleCopyKey(agent.apiKey)}
                    className="font-mono text-xs text-theme-main truncate bg-theme-surface hover:bg-slate-100 dark:hover:bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-theme-subtle flex-1 cursor-pointer transition-colors"
                    title="Click to copy full key"
                  >
                    {visibleKeys[agent.id] ? (
                      agent.apiKey
                    ) : (
                      `${agent.apiKey.substring(0, 6)}${"•".repeat(Math.max(8, agent.apiKey.length - 10))}${agent.apiKey.slice(-4)}`
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleKeyVisibility(agent.id)}
                    className="p-1.5 text-slate-400 hover:text-theme-main rounded-lg hover:bg-theme-surface cursor-pointer transition-colors flex-shrink-0"
                    title={visibleKeys[agent.id] ? "Hide key" : "Reveal key"}
                  >
                    {visibleKeys[agent.id] ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>

                <button 
                  type="button"
                  onClick={() => handleCopyKey(agent.apiKey)}
                  className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex-shrink-0 ${
                    copiedKey === agent.apiKey 
                      ? "bg-emerald-500 text-white shadow-emerald-500/20" 
                      : "bg-lobster-red hover:bg-red-600 text-white shadow-red-500/20"
                  }`}
                  title="Copy full complete API Key to clipboard"
                >
                  {copiedKey === agent.apiKey ? (
                    <>
                      <Check size={14} />
                      <span>Copied Full Key!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      <span>Copy Full Key</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

/** Auth gate for the SuperLobster Panel — login or panel, nothing else. */
function SuperLobsterGate() {
  const { isAdmin, isChecking } = useSuperLobster();
  if (isChecking) {
    return (
      <div className="min-h-screen bg-theme-base flex items-center justify-center">
        <p className="text-theme-muted text-sm animate-pulse font-mono">checking the shell…</p>
      </div>
    );
  }
  return isAdmin ? <SuperLobsterPanel /> : <SuperLobsterLogin />;
}
