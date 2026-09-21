import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Download, 
  Upload, 
  FileSpreadsheet, 
  FileCode, 
  ShieldAlert, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ArrowUpDown,
  FileJson,
  Check,
  ShieldCheck,
  FolderSync,
  Smartphone,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Clock,
  Sparkles,
  Shield,
  Layers,
  Key,
  Folder,
  FileText,
  RotateCcw
} from "lucide-react";
import { VaultItem, Lobster, VaultItemType } from "../../types.ts";
import { hashToken, generateUUID } from "../../lib/crypto.ts";
import { restAdapter } from "../../services/api/restAdapter.ts";
import {
  sniffSgTotpBackup,
  parseSgTotpBackup,
  mapSgTotpItemsToVaultItems
} from "../../lib/sgtotpBackup.ts";
import {
  isBitwardenJson,
  isEncryptedBitwardenExport,
  isBitwardenCsv,
  mapBitwardenToVaultItems,
  parseBitwardenCsv
} from "../../lib/bitwarden.ts";
import {
  generateVaultCsv,
  encryptBackupPayload,
  decryptBackupPayload,
  isShellGuardEncryptedBackup
} from "../../lib/vaultExport.ts";

interface ImportExportViewProps {
  items: VaultItem[];
  lobster: Lobster;
  onImportItems?: (importedItems: VaultItem[]) => Promise<{ inserted: string[]; errors?: { index: number; reason: string }[] } | void> | void;
}

export function ImportExportView({ items, lobster, onImportItems }: ImportExportViewProps) {
  // ── Encrypted Archive Export States ──
  const [isEncryptedExportModalOpen, setIsEncryptedExportModalOpen] = useState(false);
  const [encryptedExportType, setEncryptedExportType] = useState<"clawkey" | "custom">("clawkey");
  const [clawKeyExport, setClawKeyExport] = useState("");
  const [customExportPassphrase, setCustomExportPassphrase] = useState("");
  const [customExportPassphraseConfirm, setCustomExportPassphraseConfirm] = useState("");
  const [showCustomPassphrase, setShowCustomPassphrase] = useState(false);
  const [encryptedExportError, setEncryptedExportError] = useState<string | null>(null);
  const [isExportingEncrypted, setIsExportingEncrypted] = useState(false);
  const [encryptedExportSuccess, setEncryptedExportSuccess] = useState(false);

  // ── CSV Export States ──
  const [isExportCSVModalOpen, setIsExportCSVModalOpen] = useState(false);
  const [csvIncludePasswords, setCsvIncludePasswords] = useState(false);
  const [csvExportSuccess, setCsvExportSuccess] = useState(false);

  // ── Unencrypted JSON Export States ──
  const [isExportJSONModalOpen, setIsExportJSONModalOpen] = useState(false);
  const [exportJSONKey, setExportJSONKey] = useState("");
  const [exportJSONError, setExportJSONError] = useState<string | null>(null);
  const [isExportingJSON, setIsExportingJSON] = useState(false);
  const [jsonExportSuccess, setJsonExportSuccess] = useState(false);

  // ── Import Pipeline States ──
  const [importJsonText, setImportJsonText] = useState("");
  const [importStatus, setImportStatus] = useState<"idle" | "success" | "warning" | "error">("idle");
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [importErrors, setImportErrors] = useState<{ index: number; title?: string; reason: string }[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [detectedFormatName, setDetectedFormatName] = useState<string>("Standard Import");
  const [importPreviewList, setImportPreviewList] = useState<VaultItem[] | null>(null);

  // ── ShellGuard Encrypted Backup Decryption States ──
  const [isEncryptedBackupModalOpen, setIsEncryptedBackupModalOpen] = useState(false);
  const [encryptedBackupPending, setEncryptedBackupPending] = useState<any | null>(null);
  const [encryptedBackupPassword, setEncryptedBackupPassword] = useState("");
  const [encryptedBackupError, setEncryptedBackupError] = useState<string | null>(null);
  const [isDecryptingBackup, setIsDecryptingBackup] = useState(false);

  // ── Android sgtotp.bak Import States ──
  const [isSgtotpKeyModalOpen, setIsSgtotpKeyModalOpen] = useState(false);
  const [sgtotpPendingText, setSgtotpPendingText] = useState("");
  const [sgtotpKey, setSgtotpKey] = useState("");
  const [sgtotpError, setSgtotpError] = useState<string | null>(null);

  // ── EXPORT ACTIONS ──

  const executeExportEncryptedBackup = async (e: React.FormEvent) => {
    e.preventDefault();
    setEncryptedExportError(null);

    let keyToUse = "";
    if (encryptedExportType === "clawkey") {
      if (!clawKeyExport.startsWith("hu-") || clawKeyExport.length !== 67) {
        setEncryptedExportError("Invalid ClawKey©™ format (must start with hu- and be 67 characters).");
        return;
      }
      keyToUse = clawKeyExport;
    } else {
      if (!customExportPassphrase || customExportPassphrase.length < 8) {
        setEncryptedExportError("Backup passphrase must be at least 8 characters long.");
        return;
      }
      if (customExportPassphrase !== customExportPassphraseConfirm) {
        setEncryptedExportError("Passphrases do not match.");
        return;
      }
      keyToUse = customExportPassphrase;
    }

    setIsExportingEncrypted(true);
    try {
      if (encryptedExportType === "clawkey") {
        const keyHash = await hashToken(clawKeyExport);
        await restAdapter.POST("/api/auth/token", { 
          uuid: lobster.uuid, 
          keyHash 
        });
      }

      const exportPayload = {
        app: "ShellGuard Vault Backup",
        version: "1.0",
        exportedAt: new Date().toISOString(),
        ownerUuid: lobster.uuid,
        itemCount: items.length,
        items: items
      };

      const jsonStr = JSON.stringify(exportPayload, null, 2);
      const envelope = await encryptBackupPayload(jsonStr, keyToUse, 'json');

      const envelopeStr = JSON.stringify(envelope, null, 2);
      const blob = new Blob([envelopeStr], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `shellguard_encrypted_backup_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setIsEncryptedExportModalOpen(false);
      setClawKeyExport("");
      setCustomExportPassphrase("");
      setCustomExportPassphraseConfirm("");
      setEncryptedExportSuccess(true);
      setTimeout(() => setEncryptedExportSuccess(false), 4000);
    } catch (err: any) {
      setEncryptedExportError(err.message || "Failed to create encrypted backup envelope.");
    } finally {
      setIsExportingEncrypted(false);
    }
  };

  const executeExportCSV = () => {
    const csvStr = generateVaultCsv(items, { includePasswords: csvIncludePasswords });
    const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    const filename = csvIncludePasswords 
      ? `shellguard_vault_full_${new Date().toISOString().slice(0, 10)}.csv`
      : `shellguard_vault_metadata_${new Date().toISOString().slice(0, 10)}.csv`;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setIsExportCSVModalOpen(false);
    setCsvExportSuccess(true);
    setTimeout(() => setCsvExportSuccess(false), 4000);
  };

  const handleVerifyAndExportJSON = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exportJSONKey.startsWith("hu-") || exportJSONKey.length !== 67) {
      setExportJSONError("Invalid ClawKey©™ format (must start with hu- and be 67 characters).");
      return;
    }
    
    setIsExportingJSON(true);
    setExportJSONError(null);
    
    try {
      const keyHash = await hashToken(exportJSONKey);
      await restAdapter.POST("/api/auth/token", { 
        uuid: lobster.uuid, 
        keyHash 
      });
      
      const exportPayload = {
        app: "ShellGuard Vault Backup",
        version: "1.0",
        exportedAt: new Date().toISOString(),
        ownerUuid: lobster.uuid,
        itemCount: items.length,
        items: items
      };

      const jsonStr = JSON.stringify(exportPayload, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `shellguard_decrypted_vault_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setIsExportJSONModalOpen(false);
      setExportJSONKey("");
      setJsonExportSuccess(true);
      setTimeout(() => setJsonExportSuccess(false), 4000);
    } catch (err: any) {
      setExportJSONError(err.message || "Identity verification failed. Invalid ClawKey©™.");
    } finally {
      setIsExportingJSON(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        setImportJsonText(text);
      } catch {
        setImportStatus("error");
        setImportMessage("Failed to read file.");
      }
    };
    reader.readAsText(file);
  };

  const importSgTotp = (rawText: string, exportKey?: string) => {
    const parsedBackup = parseSgTotpBackup(rawText, exportKey);
    const mapped = mapSgTotpItemsToVaultItems(parsedBackup.items, () => generateUUID());
    if (mapped.length === 0) {
      throw new Error("No valid TOTP items found in the sgtotp.bak backup.");
    }
    setDetectedFormatName("ShellGuard Android TOTP (.bak)");
    setImportPreviewList(mapped);
  };

  // ── IMPORT PROCESSING WITH SAFE FORMAT SNIFFER ──

  const handleProcessImport = () => {
    if (!importJsonText.trim()) {
      setImportStatus("error");
      setImportMessage("Please paste JSON/CSV data or upload a backup file.");
      return;
    }

    setIsImporting(true);
    setImportStatus("idle");
    setImportMessage(null);
    setImportErrors([]);

    const raw = importJsonText.trim();

    // 1. Bitwarden CSV detection
    if (isBitwardenCsv(raw)) {
      try {
        const parsedItems = parseBitwardenCsv(raw);
        if (parsedItems.length === 0) {
          throw new Error("No valid records found in the Bitwarden CSV.");
        }
        setDetectedFormatName("Bitwarden CSV Export");
        setImportPreviewList(parsedItems);
      } catch (err: any) {
        setImportStatus("error");
        setImportMessage(err.message || "Failed to parse Bitwarden CSV.");
      } finally {
        setIsImporting(false);
      }
      return;
    }

    // 2. Try JSON parsing
    try {
      const parsed = JSON.parse(raw);

      // 2a. Bitwarden Encrypted Export check
      if (isEncryptedBitwardenExport(parsed)) {
        setImportStatus("error");
        setImportMessage(
          "Encrypted Bitwarden export detected. ShellGuard cannot decrypt Bitwarden's proprietary account-derived key. Please re-export from Bitwarden as an unencrypted 'JSON' or 'CSV' file to import into ShellGuard."
        );
        setIsImporting(false);
        return;
      }

      // 2b. ShellGuard Encrypted Backup Envelope check
      if (isShellGuardEncryptedBackup(parsed)) {
        setEncryptedBackupPending(parsed);
        setEncryptedBackupPassword("");
        setEncryptedBackupError(null);
        setIsEncryptedBackupModalOpen(true);
        setIsImporting(false);
        return;
      }

      // 2c. Bitwarden JSON Export check
      if (isBitwardenJson(parsed)) {
        const parsedItems = mapBitwardenToVaultItems(parsed);
        if (parsedItems.length === 0) {
          throw new Error("No vault items found in the Bitwarden JSON export.");
        }
        setDetectedFormatName("Bitwarden Vault (JSON)");
        setImportPreviewList(parsedItems);
        setIsImporting(false);
        return;
      }

      // 2d. SGTOTP Backup check
      try {
        const kind = sniffSgTotpBackup(raw);
        if (kind === "encrypted") {
          setSgtotpPendingText(raw);
          setSgtotpKey("");
          setSgtotpError(null);
          setIsSgtotpKeyModalOpen(true);
          setIsImporting(false);
          return;
        }
        if (kind === "plain" || kind === "array") {
          importSgTotp(raw);
          setIsImporting(false);
          return;
        }
      } catch {
        // Not an sgtotp backup; fall through to standard JSON
      }

      // 2e. Standard ShellGuard JSON export (array or { items: [...] })
      let listToImport: any[] = [];
      if (Array.isArray(parsed)) {
        listToImport = parsed;
      } else if (parsed && Array.isArray(parsed.items)) {
        listToImport = parsed.items;
      } else {
        throw new Error("Unrecognized structure. Expected an array of vault items, a ShellGuard backup, or a Bitwarden export.");
      }

      if (listToImport.length === 0) {
        throw new Error("No vault items found in import payload.");
      }

      setDetectedFormatName("ShellGuard JSON Backup");
      setImportPreviewList(listToImport);
    } catch (err: any) {
      setImportStatus("error");
      setImportMessage(err.message || "Invalid JSON or CSV syntax.");
    } finally {
      setIsImporting(false);
    }
  };

  const handleDecryptEncryptedBackup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!encryptedBackupPassword.trim()) {
      setEncryptedBackupError("Please enter your ClawKey or backup passphrase.");
      return;
    }
    setIsDecryptingBackup(true);
    setEncryptedBackupError(null);

    try {
      const decrypted = await decryptBackupPayload(encryptedBackupPending, encryptedBackupPassword);
      if (decrypted.kind === "json") {
        const parsed = JSON.parse(decrypted.data);
        let list: any[] = [];
        if (Array.isArray(parsed)) {
          list = parsed;
        } else if (parsed && Array.isArray(parsed.items)) {
          list = parsed.items;
        } else {
          throw new Error("Decrypted payload does not contain an items array.");
        }
        setDetectedFormatName("ShellGuard Encrypted Archive (Decrypted)");
        setImportPreviewList(list);
      } else {
        if (isBitwardenCsv(decrypted.data)) {
          setDetectedFormatName("CSV Spreadsheet (Decrypted)");
          setImportPreviewList(parseBitwardenCsv(decrypted.data));
        } else {
          throw new Error("Unrecognized format inside decrypted envelope.");
        }
      }
      setIsEncryptedBackupModalOpen(false);
      setEncryptedBackupPending(null);
      setEncryptedBackupPassword("");
      setEncryptedBackupError(null);
    } catch (err: any) {
      setEncryptedBackupError(err.message || "Decryption failed. Please verify your password.");
    } finally {
      setIsDecryptingBackup(false);
    }
  };

  const executeBulkImport = async () => {
    if (!importPreviewList) return;

    setIsImporting(true);
    setImportStatus("idle");
    setImportMessage(null);
    setImportErrors([]);
    try {
      let result: { inserted: string[]; errors?: { index: number; reason: string }[] } | void;
      if (onImportItems) {
        result = await onImportItems(importPreviewList);
      }

      if (result && result.errors && result.errors.length > 0) {
        const enrichedErrors = result.errors.map(err => ({
          ...err,
          title: importPreviewList[err.index]?.title || `Record #${err.index + 1}`
        }));
        setImportErrors(enrichedErrors);
        setImportStatus("warning");
        setImportMessage(
          `Partially imported: ${result.inserted.length} record(s) saved, ${result.errors.length} record(s) failed validation.`
        );
      } else {
        setImportStatus("success");
        setImportMessage(`Successfully imported ${importPreviewList.length} vault record(s) into your session.`);
      }

      setImportJsonText("");
      setImportPreviewList(null);
    } catch (err: any) {
      setImportStatus("error");
      setImportMessage(err.message || "Import failed.");
    } finally {
      setIsImporting(false);
    }
  };

  const cancelBulkImport = () => {
    setImportPreviewList(null);
    setImportStatus("idle");
    setImportMessage(null);
    setImportErrors([]);
  };

  const handleSgtotpDecryptAndImport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sgtotpKey.trim()) {
      setSgtotpError("Enter the PIN or key used when exporting the backup on your device.");
      return;
    }
    try {
      importSgTotp(sgtotpPendingText, sgtotpKey);
      setIsSgtotpKeyModalOpen(false);
      setSgtotpPendingText("");
      setSgtotpKey("");
      setSgtotpError(null);
    } catch (err: any) {
      const msg = err.message === "SGTOTP_MISSING_KEY"
        ? "Export key required."
        : err.message || "Failed to decrypt the sgtotp.bak backup.";
      setSgtotpError(msg);
    }
  };

  // Breakdown statistics for preview
  const passwordCount = importPreviewList?.filter(i => i.type === 'password' || !i.type).length || 0;
  const noteCount = importPreviewList?.filter(i => i.type === 'note').length || 0;
  const keyCount = importPreviewList?.filter(i => i.type === 'key').length || 0;

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h2 className="text-3xl font-black text-theme-main flex items-center gap-3">
          <ArrowUpDown className="text-claw-cyan" size={30} />
          Import & Export
        </h2>
        <p className="text-theme-muted mt-1">
          Export your vault archives securely, migrate between password managers, or restore records from Bitwarden, ShellGuard, and Android backups.
        </p>
      </div>

      {/* ── EXPORT OPTIONS SECTION ── */}
      <div className="bg-theme-surface/50 rounded-3xl border border-theme-subtle overflow-hidden shadow-sm">
        <div className="p-6 border-b border-theme-subtle flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2 text-theme-main">
              <Download className="text-claw-cyan" size={20} />
              Vault Export Suite
            </h3>
            <p className="text-sm text-theme-muted mt-1">
              Download your vault data for offline archival, disaster recovery, or external password manager migration.
            </p>
          </div>
          <span className="text-xs px-2.5 py-1 bg-claw-cyan/10 text-claw-cyan font-bold rounded-full border border-claw-cyan/20">
            {items.length} Record{items.length === 1 ? '' : 's'} Available
          </span>
        </div>

        <div className="p-6 space-y-6">
          {/* Option 1: Encrypted Backup Archive (Recommended) */}
          <div className="p-5 rounded-2xl bg-theme-base border border-claw-cyan/30 shadow-sm relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="p-3 rounded-xl bg-claw-cyan/15 text-claw-cyan flex-shrink-0 mt-0.5">
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <label className="block text-sm font-bold text-theme-main">
                      Encrypted Vault Archive (Recommended)
                    </label>
                    <span className="text-[10px] uppercase tracking-wider font-bold bg-emerald-500/15 text-emerald-500 px-2 py-0.5 rounded-full border border-emerald-500/30">
                      Zero-Knowledge
                    </span>
                  </div>
                  <p className="text-xs text-theme-muted mt-1 max-w-md leading-relaxed">
                    Seals your complete vault (passwords, TOTP seeds, notes, custom fields, history) inside an AES-256-GCM authenticated envelope protected by your ClawKey©™ or a custom passphrase. Safe for cloud storage.
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setEncryptedExportError(null);
                  setClawKeyExport("");
                  setCustomExportPassphrase("");
                  setCustomExportPassphraseConfirm("");
                  setIsEncryptedExportModalOpen(true);
                }}
                disabled={items.length === 0}
                className="px-5 py-2.5 bg-claw-cyan hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-ocean-dark font-bold rounded-xl transition-all flex items-center justify-center gap-2 flex-shrink-0 cursor-pointer shadow-sm shadow-claw-cyan/20"
              >
                <Lock size={16} />
                <span>Create Backup</span>
              </button>
            </div>

            {encryptedExportSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2"
              >
                <CheckCircle2 size={16} />
                <span>Encrypted archive generated and downloaded safely. Keep your password or ClawKey secure!</span>
              </motion.div>
            )}
          </div>

          {/* Option 2: Unencrypted Exports Section */}
          <div className="pt-2">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
              Plaintext Exports (For Migration & Audits)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* CSV Spreadsheet Export */}
              <div className="p-4 rounded-2xl bg-theme-base border border-theme-subtle flex flex-col justify-between">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex-shrink-0">
                    <FileSpreadsheet size={18} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-theme-main">
                      CSV Spreadsheet
                    </label>
                    <p className="text-xs text-theme-muted mt-1 leading-relaxed">
                      RFC 4180 format. Export sanitized catalog metadata or include secret passwords for spreadsheet migration.
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-theme-subtle/50 flex justify-end">
                  <button
                    onClick={() => setIsExportCSVModalOpen(true)}
                    disabled={items.length === 0}
                    className="w-full px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-50 text-theme-main text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer border border-theme-subtle"
                  >
                    <Download size={14} />
                    <span>Configure CSV</span>
                  </button>
                </div>
              </div>

              {/* Unencrypted JSON Export */}
              <div className="p-4 rounded-2xl bg-theme-base border border-theme-subtle flex flex-col justify-between">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-lobster-red/10 text-lobster-red flex-shrink-0">
                    <FileCode size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <label className="block text-sm font-bold text-theme-main">
                        Unencrypted JSON
                      </label>
                      <span className="text-[9px] uppercase tracking-wider font-bold bg-lobster-red/15 text-lobster-red px-1.5 py-0.5 rounded-full">
                        High Risk
                      </span>
                    </div>
                    <p className="text-xs text-theme-muted mt-1 leading-relaxed">
                      Raw plaintext JSON. Requires ClawKey challenge authorization. Store in encrypted storage.
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-theme-subtle/50 flex justify-end">
                  <button
                    onClick={() => {
                      setExportJSONError(null);
                      setExportJSONKey("");
                      setIsExportJSONModalOpen(true);
                    }}
                    disabled={items.length === 0}
                    className="w-full px-4 py-2 bg-lobster-red/10 hover:bg-lobster-red hover:text-white text-lobster-red text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer border border-lobster-red/30"
                  >
                    <Download size={14} />
                    <span>Export Plain JSON</span>
                  </button>
                </div>
              </div>
            </div>

            {csvExportSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2"
              >
                <CheckCircle2 size={16} />
                <span>CSV spreadsheet downloaded successfully.</span>
              </motion.div>
            )}

            {jsonExportSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2"
              >
                <CheckCircle2 size={16} />
                <span>Unencrypted JSON downloaded. Store this backup on a secure encrypted volume.</span>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* ── IMPORT SECTION ── */}
      <div className="bg-theme-surface/50 rounded-3xl border border-theme-subtle overflow-hidden shadow-sm">
        <div className="p-6 border-b border-theme-subtle">
          <h3 className="text-lg font-bold flex items-center gap-2 text-theme-main">
            <Upload className="text-claw-cyan" size={20} />
            Universal Vault Ingestion Engine
          </h3>
          <p className="text-sm text-theme-muted mt-1">
            Import records seamlessly from Bitwarden (JSON/CSV), ShellGuard Encrypted Archives, standard JSON backups, or Android sgtotp.bak files.
          </p>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
              Select Backup File (.json, .csv, .bak)
            </label>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <label className="w-full sm:w-auto px-5 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-theme-main font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer border border-theme-subtle">
                <FileJson size={18} className="text-claw-cyan" />
                <span>Choose Backup File</span>
                <input 
                  type="file" 
                  accept=".json,.csv,.bak,application/json,text/csv" 
                  onChange={handleFileUpload} 
                  className="hidden" 
                />
              </label>
              <span className="text-xs text-theme-muted">or paste raw JSON / CSV payload below:</span>
            </div>
          </div>

          <div>
            <textarea
              rows={4}
              value={importJsonText}
              onChange={(e) => setImportJsonText(e.target.value)}
              placeholder="Paste Bitwarden JSON, Bitwarden CSV, ShellGuard backup envelope, or JSON item array here..."
              className="w-full bg-theme-base border border-theme-subtle rounded-xl p-3.5 text-xs font-mono text-theme-main placeholder:text-slate-500 outline-none focus:border-claw-cyan focus:ring-1 focus:ring-claw-cyan transition-all"
            />
          </div>

          {importStatus === "success" && (
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
              <ShieldCheck size={16} />
              <span>{importMessage}</span>
            </div>
          )}

          {importStatus === "warning" && (
            <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-600 dark:text-amber-400 text-xs space-y-3">
              <div className="flex items-center gap-2 font-semibold">
                <AlertCircle size={16} />
                <span>{importMessage}</span>
              </div>
              {importErrors.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                    Skipped Items ({importErrors.length}):
                  </span>
                  <div className="flex flex-wrap gap-1.5 pt-1 max-h-40 overflow-y-auto">
                    {importErrors.map((err, i) => (
                      <div
                        key={i}
                        className="px-2.5 py-1 bg-amber-500/20 dark:bg-amber-500/30 border border-amber-500/40 rounded-lg text-[11px] font-mono flex items-center gap-1.5"
                        title={`Index ${err.index}: ${err.reason}`}
                      >
                        <span className="font-bold">{err.title || `#${err.index + 1}`}:</span>
                        <span className="opacity-90">{err.reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {importStatus === "error" && (
            <div className="p-3.5 bg-lobster-red/10 border border-lobster-red/30 rounded-xl text-lobster-red text-xs font-semibold flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{importMessage}</span>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              onClick={handleProcessImport}
              disabled={isImporting || !importJsonText.trim()}
              className="px-6 py-2.5 bg-claw-cyan hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-ocean-dark font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-sm shadow-claw-cyan/20"
            >
              {isImporting ? <Loader2 size={16} className="animate-spin" /> : <FolderSync size={16} />}
              <span>Inspect & Preview Import</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── MODAL 1: ENCRYPTED ARCHIVE EXPORT ── */}
      <AnimatePresence>
        {isEncryptedExportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-theme-surface rounded-2xl shadow-2xl p-6 max-w-md w-full border border-theme-subtle space-y-4"
            >
              <div className="flex items-center gap-3 text-theme-main">
                <div className="w-10 h-10 rounded-xl bg-claw-cyan/15 text-claw-cyan flex items-center justify-center">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Encrypted Vault Backup</h3>
                  <p className="text-xs text-theme-muted">AES-256-GCM zero-knowledge archive</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-claw-cyan/10 border border-claw-cyan/20 text-xs text-theme-main leading-relaxed">
                Your vault payload will be encrypted in your browser using HKDF-SHA256 and AES-256-GCM before downloading. The server never sees the raw archive.
              </div>

              {/* Protection Mode Toggle */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Encryption Key Source
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => { setEncryptedExportType("clawkey"); setEncryptedExportError(null); }}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                      encryptedExportType === "clawkey"
                        ? "bg-claw-cyan/20 border-claw-cyan text-claw-cyan"
                        : "bg-theme-base border-theme-subtle text-theme-muted hover:text-theme-main"
                    }`}
                  >
                    Active ClawKey©™
                  </button>
                  <button
                    type="button"
                    onClick={() => { setEncryptedExportType("custom"); setEncryptedExportError(null); }}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                      encryptedExportType === "custom"
                        ? "bg-claw-cyan/20 border-claw-cyan text-claw-cyan"
                        : "bg-theme-base border-theme-subtle text-theme-muted hover:text-theme-main"
                    }`}
                  >
                    Custom Passphrase
                  </button>
                </div>
              </div>

              <form onSubmit={executeExportEncryptedBackup} className="space-y-4">
                {encryptedExportType === "clawkey" ? (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
                      Enter Your ClawKey©™
                    </label>
                    <input
                      type="password"
                      value={clawKeyExport}
                      onChange={(e) => setClawKeyExport(e.target.value)}
                      placeholder="hu-..."
                      className="w-full bg-theme-base border border-theme-subtle rounded-xl px-4 py-2.5 text-sm focus:border-claw-cyan focus:ring-1 focus:ring-claw-cyan outline-none transition-all text-theme-main font-mono"
                      autoFocus
                    />
                    <p className="text-[11px] text-theme-muted mt-1">
                      Authenticates your identity and seals the archive.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
                        Backup Passphrase (min 8 chars)
                      </label>
                      <div className="relative">
                        <input
                          type={showCustomPassphrase ? "text" : "password"}
                          value={customExportPassphrase}
                          onChange={(e) => setCustomExportPassphrase(e.target.value)}
                          placeholder="Create strong passphrase..."
                          className="w-full bg-theme-base border border-theme-subtle rounded-xl px-4 py-2.5 text-sm focus:border-claw-cyan focus:ring-1 focus:ring-claw-cyan outline-none transition-all text-theme-main font-mono pr-10"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => setShowCustomPassphrase(!showCustomPassphrase)}
                          className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                        >
                          {showCustomPassphrase ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
                        Confirm Passphrase
                      </label>
                      <input
                        type="password"
                        value={customExportPassphraseConfirm}
                        onChange={(e) => setCustomExportPassphraseConfirm(e.target.value)}
                        placeholder="Re-enter passphrase..."
                        className="w-full bg-theme-base border border-theme-subtle rounded-xl px-4 py-2.5 text-sm focus:border-claw-cyan focus:ring-1 focus:ring-claw-cyan outline-none transition-all text-theme-main font-mono"
                      />
                    </div>
                  </div>
                )}

                {encryptedExportError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-500 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle size={15} />
                    <span>{encryptedExportError}</span>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEncryptedExportModalOpen(false);
                      setEncryptedExportError(null);
                    }}
                    className="flex-1 px-4 py-2.5 rounded-xl font-bold border border-theme-subtle hover:bg-theme-base transition-colors cursor-pointer text-sm text-theme-main"
                    disabled={isExportingEncrypted}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isExportingEncrypted}
                    className="flex-1 px-4 py-2.5 rounded-xl font-bold bg-claw-cyan hover:bg-cyan-500 text-ocean-dark transition-colors cursor-pointer flex justify-center items-center gap-2 text-sm shadow-sm"
                  >
                    {isExportingEncrypted ? <Loader2 className="animate-spin w-4 h-4" /> : (
                      <>
                        <Download size={16} />
                        <span>Encrypt & Download</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL 2: CSV EXPORT CONFIGURATION ── */}
      <AnimatePresence>
        {isExportCSVModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-theme-surface rounded-2xl shadow-2xl p-6 max-w-md w-full border border-theme-subtle space-y-4"
            >
              <div className="flex items-center gap-3 text-theme-main">
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-claw-cyan flex items-center justify-center">
                  <FileSpreadsheet size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold">CSV Spreadsheet Export</h3>
                  <p className="text-xs text-theme-muted">Configure fields and credential exposure</p>
                </div>
              </div>

              {/* Password Inclusion Toggle */}
              <div className="p-4 rounded-xl bg-theme-base border border-theme-subtle space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-bold text-theme-main">Include Secret Passwords</span>
                    <p className="text-xs text-theme-muted mt-0.5">
                      {csvIncludePasswords ? "Plaintext passwords included in CSV" : "Passwords omitted (sanitized)"}
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={csvIncludePasswords}
                      onChange={(e) => setCsvIncludePasswords(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-lobster-red"></div>
                  </label>
                </div>

                {csvIncludePasswords ? (
                  <div className="p-2.5 bg-lobster-red/10 border border-lobster-red/30 rounded-lg text-lobster-red text-xs flex items-start gap-2">
                    <AlertCircle size={15} className="shrink-0 mt-0.5" />
                    <span>
                      <strong>Warning:</strong> The exported CSV will contain unencrypted plaintext passwords. Anyone with access to this spreadsheet can read them.
                    </span>
                  </div>
                ) : (
                  <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
                    <ShieldCheck size={15} />
                    <span>
                      Passwords will be excluded. Safe for auditing structure, pods, and item catalogs.
                    </span>
                  </div>
                )}
              </div>

              <div className="p-3.5 rounded-xl bg-theme-base border border-theme-subtle space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-theme-muted">Total Records:</span>
                  <span className="font-bold text-claw-cyan">{items.length} items</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-theme-muted">Columns Included:</span>
                  <span className="text-theme-main font-medium">Title, Pod, Type, User, Pass, URL, Notes, TOTP, Tags</span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsExportCSVModalOpen(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl font-bold border border-theme-subtle hover:bg-theme-base transition-colors cursor-pointer text-sm text-theme-main"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={executeExportCSV}
                  className="flex-1 px-4 py-2.5 rounded-xl font-bold bg-claw-cyan hover:bg-cyan-500 text-ocean-dark transition-colors cursor-pointer flex justify-center items-center gap-2 text-sm shadow-sm"
                >
                  <Download size={16} />
                  <span>Download CSV</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL 3: UNENCRYPTED JSON EXPORT ── */}
      <AnimatePresence>
        {isExportJSONModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-theme-surface rounded-2xl shadow-2xl p-6 max-w-md w-full border border-theme-subtle space-y-4"
            >
              <div className="flex items-center gap-3 text-lobster-red">
                <div className="w-10 h-10 rounded-xl bg-lobster-red/10 flex items-center justify-center">
                  <ShieldAlert size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Confirm Decrypted Export</h3>
                  <p className="text-xs text-lobster-red font-medium">Unencrypted plaintext credential download</p>
                </div>
              </div>
              
              <div className="p-3 bg-lobster-red/10 border border-lobster-red/30 rounded-xl text-lobster-red text-xs leading-relaxed flex items-start gap-2">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>
                  <strong>High-Risk Action:</strong> This will export a JSON backup containing all <strong>{items.length}</strong> passwords, keys, and notes in plain text. Please confirm and enter your ClawKey©™ to authorize.
                </span>
              </div>
              
              <form onSubmit={handleVerifyAndExportJSON} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
                    Your ClawKey©™ Authorization
                  </label>
                  <input
                    type="password"
                    value={exportJSONKey}
                    onChange={(e) => setExportJSONKey(e.target.value)}
                    placeholder="hu-..."
                    className="w-full bg-theme-base border border-theme-subtle rounded-xl px-4 py-3 text-sm focus:border-claw-cyan focus:ring-1 focus:ring-claw-cyan outline-none transition-all text-theme-main font-mono"
                    autoFocus
                  />
                </div>
                
                {exportJSONError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-500 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle size={15} />
                    <span>{exportJSONError}</span>
                  </div>
                )}
                
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsExportJSONModalOpen(false);
                      setExportJSONError(null);
                      setExportJSONKey("");
                    }}
                    className="flex-1 px-4 py-2.5 rounded-xl font-bold border border-theme-subtle hover:bg-theme-base transition-colors cursor-pointer text-sm text-theme-main"
                    disabled={isExportingJSON}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isExportingJSON || !exportJSONKey}
                    className="flex-1 px-4 py-2.5 rounded-xl font-bold bg-lobster-red hover:bg-red-700 text-white transition-colors cursor-pointer flex justify-center items-center gap-2 disabled:opacity-50 text-sm"
                  >
                    {isExportingJSON ? <Loader2 className="animate-spin w-4 h-4" /> : (
                      <>
                        <Download size={16} />
                        <span>Authorize & Download</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL 4: SHELLGUARD ENCRYPTED BACKUP DECRYPTION ── */}
      <AnimatePresence>
        {isEncryptedBackupModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-theme-surface rounded-2xl shadow-2xl p-6 max-w-md w-full border border-theme-subtle space-y-4"
            >
              <div className="flex items-center gap-3 text-theme-main">
                <div className="w-10 h-10 rounded-xl bg-claw-cyan/15 text-claw-cyan flex items-center justify-center">
                  <Lock size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Encrypted Archive Detected</h3>
                  <p className="text-xs text-theme-muted">ShellGuard AES-256-GCM Backup</p>
                </div>
              </div>

              <div className="p-3 bg-claw-cyan/10 border border-claw-cyan/20 rounded-xl text-xs text-theme-main leading-relaxed">
                This backup is sealed with client-side zero-knowledge encryption. Enter the <strong>ClawKey©™</strong> or <strong>custom passphrase</strong> configured when creating this export.
              </div>

              <form onSubmit={handleDecryptEncryptedBackup} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
                    Passphrase or ClawKey
                  </label>
                  <input
                    type="password"
                    value={encryptedBackupPassword}
                    onChange={(e) => setEncryptedBackupPassword(e.target.value)}
                    placeholder="Enter backup passphrase or hu-..."
                    className="w-full bg-theme-base border border-theme-subtle rounded-xl px-4 py-3 text-sm focus:border-claw-cyan focus:ring-1 focus:ring-claw-cyan outline-none transition-all text-theme-main font-mono"
                    autoFocus
                  />
                </div>

                {encryptedBackupError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-500 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle size={15} />
                    <span>{encryptedBackupError}</span>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEncryptedBackupModalOpen(false);
                      setEncryptedBackupPending(null);
                      setEncryptedBackupPassword("");
                      setEncryptedBackupError(null);
                    }}
                    className="flex-1 px-4 py-2.5 rounded-xl font-bold border border-theme-subtle hover:bg-theme-base transition-colors cursor-pointer text-sm text-theme-main"
                    disabled={isDecryptingBackup}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isDecryptingBackup || !encryptedBackupPassword}
                    className="flex-1 px-4 py-2.5 rounded-xl font-bold bg-claw-cyan hover:bg-cyan-500 text-ocean-dark transition-colors cursor-pointer flex justify-center items-center gap-2 text-sm shadow-sm"
                  >
                    {isDecryptingBackup ? <Loader2 className="animate-spin w-4 h-4" /> : (
                      <>
                        <Unlock size={16} />
                        <span>Decrypt & Preview</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL 5: SGTOTP.BAK EXPORT-KEY MODAL ── */}
      <AnimatePresence>
        {isSgtotpKeyModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-theme-surface border border-theme-subtle rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-claw-cyan/10 flex items-center justify-center">
                  <Smartphone size={20} className="text-claw-cyan" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-theme-main">ShellGuard TOTP Backup</h3>
                  <p className="text-xs text-theme-muted font-medium">Encrypted sgtotp.bak envelope detected</p>
                </div>
              </div>

              <div className="p-3 bg-claw-cyan/10 border border-claw-cyan/30 rounded-xl text-claw-cyan text-xs leading-relaxed flex items-start gap-2">
                <ShieldAlert size={16} className="shrink-0 mt-0.5" />
                <span>
                  This backup was encrypted on your Android device. Enter the <strong>PIN or key used at export time</strong> to decrypt it locally.
                </span>
              </div>

              <form onSubmit={handleSgtotpDecryptAndImport} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
                    Export PIN / Key
                  </label>
                  <input
                    type="password"
                    value={sgtotpKey}
                    onChange={(e) => setSgtotpKey(e.target.value)}
                    placeholder="Export credential..."
                    className="w-full bg-theme-base border border-theme-subtle rounded-xl px-4 py-3 text-sm focus:border-claw-cyan focus:ring-1 focus:ring-claw-cyan outline-none transition-all text-theme-main font-mono"
                    autoFocus
                  />
                </div>

                {sgtotpError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-500 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle size={15} />
                    <span>{sgtotpError}</span>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => { setIsSgtotpKeyModalOpen(false); setSgtotpPendingText(""); setSgtotpKey(""); setSgtotpError(null); }}
                    className="flex-1 px-4 py-2.5 rounded-xl font-bold border border-theme-subtle hover:bg-theme-base transition-colors cursor-pointer text-sm text-theme-main"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2.5 rounded-xl font-bold bg-claw-cyan hover:bg-cyan-500 text-ocean-dark transition-colors cursor-pointer flex justify-center items-center gap-2 text-sm"
                  >
                    <Smartphone size={16} />
                    <span>Decrypt & Preview</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL 6: ENRICHED BATCH IMPORT PREVIEW MODAL ── */}
      <AnimatePresence>
        {importPreviewList !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-theme-surface rounded-3xl shadow-2xl p-6 max-w-2xl w-full border border-theme-subtle flex flex-col max-h-[85vh]"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-theme-subtle">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-claw-cyan/15 text-claw-cyan flex items-center justify-center">
                    <FolderSync size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-theme-main flex items-center gap-2">
                      Batch Import Preview
                    </h3>
                    <span className="text-xs px-2 py-0.5 rounded-md bg-claw-cyan/15 text-claw-cyan font-semibold border border-claw-cyan/30">
                      {detectedFormatName}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-lg font-black text-theme-main">{importPreviewList.length}</span>
                  <span className="text-xs text-theme-muted block">Records Staged</span>
                </div>
              </div>

              {/* Breakdown Stats */}
              <div className="py-3 flex flex-wrap gap-2 text-xs">
                {passwordCount > 0 && (
                  <span className="px-2.5 py-1 bg-theme-base border border-theme-subtle rounded-lg text-theme-main font-medium">
                    🔑 {passwordCount} Passwords
                  </span>
                )}
                {noteCount > 0 && (
                  <span className="px-2.5 py-1 bg-theme-base border border-theme-subtle rounded-lg text-theme-main font-medium">
                    📝 {noteCount} Secure Notes
                  </span>
                )}
                {keyCount > 0 && (
                  <span className="px-2.5 py-1 bg-theme-base border border-theme-subtle rounded-lg text-theme-main font-medium">
                    🗝️ {keyCount} SSH Keys
                  </span>
                )}
              </div>

              {/* Scrollable Items List */}
              <div className="flex-1 overflow-y-auto custom-scrollbar border border-theme-subtle rounded-xl p-3 bg-theme-base space-y-2.5 min-h-[160px]">
                {importPreviewList.slice(0, 50).map((item, i) => {
                  let customFieldCount = 0;
                  if (item.custom_fields) {
                    try {
                      const cf = JSON.parse(item.custom_fields);
                      if (Array.isArray(cf)) customFieldCount = cf.length;
                    } catch {}
                  }

                  let historyCount = 0;
                  if (item.password_history) {
                    try {
                      const ph = JSON.parse(item.password_history);
                      if (Array.isArray(ph)) historyCount = ph.length;
                    } catch {}
                  }

                  return (
                    <div key={i} className="p-3 bg-theme-surface rounded-xl border border-theme-subtle/80 flex items-center justify-between gap-3 text-xs">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-theme-main truncate max-w-xs">{item.title || "Untitled Record"}</span>
                          <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-theme-muted border border-theme-subtle">
                            {item.type || "password"}
                          </span>
                          {item.category && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-claw-cyan/10 text-claw-cyan flex items-center gap-1 border border-claw-cyan/20">
                              <Folder size={10} />
                              {item.category}
                            </span>
                          )}
                        </div>
                        <div className="text-theme-muted mt-1 truncate max-w-md">
                          {item.username || item.url || (item.notes ? item.notes.slice(0, 40) + "..." : "No additional metadata")}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {item.totp_secret && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold border border-emerald-500/20 flex items-center gap-1" title="TOTP Authenticator Attached">
                            <Clock size={10} />
                            TOTP
                          </span>
                        )}
                        {customFieldCount > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-bold border border-indigo-500/20 flex items-center gap-1" title={`${customFieldCount} Custom Fields`}>
                            <Layers size={10} />
                            +{customFieldCount}
                          </span>
                        )}
                        {historyCount > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 text-[10px] font-bold border border-purple-500/20 flex items-center gap-1" title={`${historyCount} Password Revisions`}>
                            <RotateCcw size={10} />
                            +{historyCount}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}

                {importPreviewList.length > 50 && (
                  <div className="text-center text-xs text-theme-muted p-2 font-mono">
                    ...and {importPreviewList.length - 50} more records ready for ingestion
                  </div>
                )}
              </div>

              {importStatus === "error" && (
                <div className="mt-3 p-3 bg-lobster-red/10 border border-lobster-red/30 rounded-xl text-lobster-red text-xs font-semibold flex items-center gap-2">
                  <AlertCircle size={16} />
                  <span>{importMessage}</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-theme-subtle">
                <button
                  type="button"
                  onClick={cancelBulkImport}
                  className="px-4 py-2 text-sm font-semibold rounded-xl text-theme-main hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isImporting}
                  onClick={executeBulkImport}
                  className="px-6 py-2 bg-claw-cyan hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-ocean-dark font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-sm shadow-claw-cyan/20 text-sm"
                >
                  {isImporting ? <Loader2 size={16} className="animate-spin" /> : <FolderSync size={16} />}
                  <span>Confirm & Import to Vault</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
