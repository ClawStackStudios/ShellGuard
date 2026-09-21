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
  FolderSync
} from "lucide-react";
import { VaultItem, Lobster } from "../../types.ts";
import { hashToken, generateUUID } from "../../lib/crypto.ts";
import { restAdapter } from "../../services/api/restAdapter.ts";
import {
  sniffSgTotpBackup,
  parseSgTotpBackup,
  mapSgTotpItemsToVaultItems
} from "../../lib/sgtotpBackup.ts";
import { Smartphone } from "lucide-react";

interface ImportExportViewProps {
  items: VaultItem[];
  lobster: Lobster;
  onImportItems?: (importedItems: VaultItem[]) => Promise<{ inserted: string[]; errors?: { index: number; reason: string }[] } | void> | void;
}

export function ImportExportView({ items, lobster, onImportItems }: ImportExportViewProps) {
  // Export States
  const [isExportCSVModalOpen, setIsExportCSVModalOpen] = useState(false);
  const [isExportJSONModalOpen, setIsExportJSONModalOpen] = useState(false);
  const [exportJSONKey, setExportJSONKey] = useState("");
  const [exportJSONError, setExportJSONError] = useState<string | null>(null);
  const [isExportingJSON, setIsExportingJSON] = useState(false);
  const [csvExportSuccess, setCsvExportSuccess] = useState(false);
  const [jsonExportSuccess, setJsonExportSuccess] = useState(false);

  // Import States
  const [importJsonText, setImportJsonText] = useState("");
  const [importStatus, setImportStatus] = useState<"idle" | "success" | "warning" | "error">("idle");
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [importErrors, setImportErrors] = useState<{ index: number; title?: string; reason: string }[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  // sgtotp.bak import states
  const [isSgtotpKeyModalOpen, setIsSgtotpKeyModalOpen] = useState(false);
  const [sgtotpPendingText, setSgtotpPendingText] = useState("");
  const [sgtotpKey, setSgtotpKey] = useState("");
  const [sgtotpError, setSgtotpError] = useState<string | null>(null);

  const executeExportCSV = () => {
    const headers = ["Title", "Category", "Type", "Username", "URL/Notes"];
    const rows = items.map(i => [
      `"${(i.title || "").replace(/"/g, '""')}"`,
      `"${(i.category || "").replace(/"/g, '""')}"`,
      `"${(i.type || "password").replace(/"/g, '""')}"`,
      `"${(i.username || "").replace(/"/g, '""')}"`,
      `"${(i.url || i.notes || "").replace(/"/g, '""')}"`
    ]);
    const csvStr = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `shellguard_vault_metadata_${new Date().toISOString().slice(0, 10)}.csv`);
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
      
      // Verified! Export formatted JSON
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

  /**
   * Imports a ShellGuard-TOTP `sgtotp.bak` backup (encrypted envelope, plain export,
   * or bare item array). Items are mapped client-side (fresh UUIDs, Base32-normalized
   * seeds, normalized pods) and encrypted via lockTheClaw with vault_pearls_totp AAD.
   */
  const importSgTotp = (rawText: string, exportKey?: string) => {
    const parsedBackup = parseSgTotpBackup(rawText, exportKey);
    const mapped = mapSgTotpItemsToVaultItems(parsedBackup.items, () => generateUUID());
    if (mapped.length === 0) {
      throw new Error("No valid TOTP items found in the sgtotp.bak backup.");
    }
    if (onImportItems) {
      onImportItems(mapped);
    }
    setImportStatus("success");
    setImportMessage(
      `Successfully imported ${mapped.length} TOTP record(s) from the sgtotp.bak backup${parsedBackup.kind === "encrypted" ? " (envelope decrypted & checksum verified)" : ""}.`
    );
    setImportJsonText("");
  };

  const [importPreviewList, setImportPreviewList] = useState<any[] | null>(null);

  const handleProcessImport = () => {
    if (!importJsonText.trim()) {
      setImportStatus("error");
      setImportMessage("Please paste JSON or upload a backup file.");
      return;
    }

    setIsImporting(true);
    setImportStatus("idle");
    setImportMessage(null);
    setImportErrors([]);

    try {
      // ShellGuard-TOTP sgtotp.bak detection first — encrypted envelopes route to the key modal.
      const kind = sniffSgTotpBackup(importJsonText);
      if (kind === "encrypted") {
        setSgtotpPendingText(importJsonText);
        setSgtotpKey("");
        setSgtotpError(null);
        setIsSgtotpKeyModalOpen(true);
        setIsImporting(false);
        return;
      }
      if (kind === "plain" || kind === "array") {
        importSgTotp(importJsonText);
        setIsImporting(false);
        return;
      }

      const parsed = JSON.parse(importJsonText);
      let listToImport: any[] = [];

      if (Array.isArray(parsed)) {
        listToImport = parsed;
      } else if (parsed && Array.isArray(parsed.items)) {
        listToImport = parsed.items;
      } else {
        throw new Error("Invalid structure. Expected an array of vault items or a ShellGuard backup object with an 'items' property.");
      }

      if (listToImport.length === 0) {
        throw new Error("No vault items found in import payload.");
      }

      setImportPreviewList(listToImport);
    } catch (err: any) {
      setImportStatus("error");
      setImportMessage(err.message || "Invalid JSON syntax.");
    } finally {
      setIsImporting(false);
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

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h2 className="text-3xl font-black text-theme-main flex items-center gap-3">
          <ArrowUpDown className="text-claw-cyan" size={30} />
          Import & Export
        </h2>
        <p className="text-theme-muted mt-1">
          Export your encrypted/decrypted data or restore records from external backup files.
        </p>
      </div>

      {/* ── EXPORT OPTIONS SECTION ── */}
      <div className="bg-theme-surface/50 rounded-3xl border border-theme-subtle overflow-hidden shadow-sm">
        <div className="p-6 border-b border-theme-subtle flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2 text-theme-main">
              <Download className="text-claw-cyan" size={20} />
              Vault Export Options
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Download your vault data for offline archival, device migration, or disaster recovery.
            </p>
          </div>
          <span className="text-xs px-2.5 py-1 bg-claw-cyan/10 text-claw-cyan font-bold rounded-full border border-claw-cyan/20">
            {items.length} Record{items.length === 1 ? '' : 's'} Available
          </span>
        </div>

        <div className="p-6 space-y-6">
          {/* Metadata CSV Export */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-theme-base border border-theme-subtle">
            <div className="flex items-start gap-3.5">
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex-shrink-0 mt-0.5">
                <FileSpreadsheet size={20} />
              </div>
              <div>
                <label className="block text-sm font-bold text-theme-main">
                  Export Vault Metadata (CSV)
                </label>
                <p className="text-xs text-theme-muted mt-0.5 max-w-md leading-relaxed">
                  Download a structured CSV spreadsheet containing sanitized catalog metadata (Titles, Folders, Categories, URLs). Zero secret keys or passwords are exposed.
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsExportCSVModalOpen(true)}
              disabled={items.length === 0}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-theme-main font-bold rounded-xl transition-all flex items-center justify-center gap-2 flex-shrink-0 cursor-pointer shadow-sm border border-theme-subtle"
            >
              <Download size={16} />
              <span>Export CSV</span>
            </button>
          </div>

          {csvExportSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2"
            >
              <CheckCircle2 size={16} />
              <span>CSV metadata spreadsheet downloaded successfully.</span>
            </motion.div>
          )}

          {/* Full Decrypted JSON Export */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-theme-base border border-theme-subtle">
            <div className="flex items-start gap-3.5">
              <div className="p-3 rounded-xl bg-lobster-red/10 text-lobster-red flex-shrink-0 mt-0.5">
                <FileCode size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <label className="block text-sm font-bold text-lobster-red">
                    Export Decrypted Vault (JSON)
                  </label>
                  <span className="text-[10px] uppercase tracking-wider font-bold bg-lobster-red/15 text-lobster-red px-2 py-0.5 rounded-full border border-lobster-red/30">
                    High Security
                  </span>
                </div>
                <p className="text-xs text-theme-muted mt-0.5 max-w-md leading-relaxed">
                  Download a full decrypted JSON backup of all vault credentials. Requires confirmation and ClawKey©™ challenge verification.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setExportJSONError(null);
                setExportJSONKey("");
                setIsExportJSONModalOpen(true);
              }}
              disabled={items.length === 0}
              className="px-5 py-2.5 bg-lobster-red hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 flex-shrink-0 cursor-pointer shadow-sm shadow-lobster-red/20"
            >
              <Download size={16} />
              <span>Export JSON</span>
            </button>
          </div>

          {jsonExportSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2"
            >
              <CheckCircle2 size={16} />
              <span>Decrypted backup downloaded successfully. Store this backup in an encrypted physical drive.</span>
            </motion.div>
          )}
        </div>
      </div>

      {/* ── IMPORT SECTION ── */}
      <div className="bg-theme-surface/50 rounded-3xl border border-theme-subtle overflow-hidden shadow-sm">
        <div className="p-6 border-b border-theme-subtle">
          <h3 className="text-lg font-bold flex items-center gap-2 text-theme-main">
            <Upload className="text-claw-cyan" size={20} />
            Import Vault Backup
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Restore credentials from a previous ShellGuard JSON export file.
          </p>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
              Select Backup File (.json)
            </label>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <label className="w-full sm:w-auto px-5 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-theme-main font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer border border-theme-subtle">
                <FileJson size={18} className="text-claw-cyan" />
                <span>Choose Backup JSON</span>
                <input 
                  type="file" 
                  accept=".json,application/json" 
                  onChange={handleFileUpload} 
                  className="hidden" 
                />
              </label>
              <span className="text-xs text-theme-muted">or paste JSON raw data below:</span>
            </div>
          </div>

          <div>
            <textarea
              rows={4}
              value={importJsonText}
              onChange={(e) => setImportJsonText(e.target.value)}
              placeholder='Paste JSON payload (e.g. { "items": [ ... ] } or [ { "title": "...", "password": "..." } ])'
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
              <AlertCircle size={16} />
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
              <span>Import to Vault</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── CONFIRMATION MODAL FOR CSV EXPORT ── */}
      <AnimatePresence>
        {isExportCSVModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              key="export-csv-modal"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-theme-surface rounded-2xl shadow-2xl p-6 max-w-md w-full border border-theme-subtle"
            >
              <div className="flex items-center gap-3 mb-4 text-theme-main">
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-claw-cyan flex items-center justify-center">
                  <FileSpreadsheet size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Confirm CSV Export</h3>
                  <p className="text-xs text-theme-muted">Download vault metadata spreadsheet</p>
                </div>
              </div>
              
              <div className="space-y-3 mb-6">
                <p className="text-sm text-theme-muted leading-relaxed">
                  Are you sure you want to download an export of your vault metadata?
                </p>

                <div className="p-3.5 rounded-xl bg-theme-base border border-theme-subtle space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-theme-muted">Format:</span>
                    <span className="font-mono font-bold text-theme-main">CSV (.csv)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-theme-muted">Total Records:</span>
                    <span className="font-bold text-claw-cyan">{items.length} item(s)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-theme-muted">Data Included:</span>
                    <span className="text-theme-main font-medium">Titles, Folders, Types, URLs</span>
                  </div>
                  <div className="flex justify-between border-t border-theme-subtle/50 pt-1.5">
                    <span className="text-theme-muted">Secret Passwords:</span>
                    <span className="text-emerald-500 font-bold">Excluded (Sanitized)</span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3">
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

      {/* ── SECURITY VERIFICATION & CONFIRMATION MODAL FOR JSON EXPORT ── */}
      <AnimatePresence>
        {isExportJSONModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              key="export-json-modal"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-theme-surface rounded-2xl shadow-2xl p-6 max-w-md w-full border border-theme-subtle"
            >
              <div className="flex items-center gap-3 mb-3 text-lobster-red">
                <div className="w-10 h-10 rounded-xl bg-lobster-red/10 flex items-center justify-center">
                  <ShieldAlert size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Confirm Decrypted Export</h3>
                  <p className="text-xs text-lobster-red font-medium">Unencrypted plaintext credential download</p>
                </div>
              </div>
              
              <div className="p-3 bg-lobster-red/10 border border-lobster-red/30 rounded-xl text-lobster-red text-xs leading-relaxed mb-4 flex items-start gap-2">
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

        {/* ── BATCH IMPORT PREVIEW MODAL ── */}
        {importPreviewList !== null && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-theme-surface rounded-2xl shadow-2xl p-6 max-w-2xl w-full border border-theme-subtle flex flex-col max-h-[80vh]"
            >
              <h3 className="text-xl font-bold flex items-center gap-2 text-theme-main">
                <FolderSync size={20} className="text-claw-cyan" />
                Batch Import Preview
              </h3>
              <p className="text-sm text-theme-muted mt-2">
                You are about to import {importPreviewList.length} items. Please confirm.
              </p>

              <div className="mt-4 flex-1 overflow-y-auto custom-scrollbar border border-theme-subtle rounded-xl p-2 bg-theme-base space-y-2">
                {importPreviewList.slice(0, 10).map((item, i) => (
                  <div key={i} className="text-xs p-2 bg-theme-surface rounded-lg border border-theme-subtle">
                    <div className="font-bold text-theme-main">{item.title || "Untitled"}</div>
                    <div className="text-theme-muted mt-1">{item.username || "No username"}</div>
                  </div>
                ))}
                {importPreviewList.length > 10 && (
                  <div className="text-center text-xs text-theme-muted p-2 font-mono">
                    ...and {importPreviewList.length - 10} more items
                  </div>
                )}
              </div>

              {importStatus === "error" && (
                <div className="mt-4 p-3.5 bg-lobster-red/10 border border-lobster-red/30 rounded-xl text-lobster-red text-xs font-semibold flex items-center gap-2">
                  <AlertCircle size={16} />
                  <span>{importMessage}</span>
                </div>
              )}

              <div className="flex justify-end gap-3 mt-6">
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
                  <span>Confirm Import</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* ── SGTOTP.BAK EXPORT-KEY MODAL ── */}
        {isSgtotpKeyModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => { setIsSgtotpKeyModalOpen(false); setSgtotpPendingText(""); setSgtotpKey(""); setSgtotpError(null); }}>
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.97 }}
              transition={{ type: "spring", damping: 26, stiffness: 320 }}
              className="bg-theme-surface border border-theme-subtle rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-4"
              onClick={(e) => e.stopPropagation()}
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
                  This backup was encrypted on your Android device. Enter the <strong>PIN or key used at export time</strong> to decrypt it locally. Decryption, checksum verification, and re-encryption all happen in your browser — the key is never sent to the server.
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
                    className="flex-1 px-4 py-2.5 rounded-xl font-bold bg-claw-cyan hover:bg-cyan-500 text-black transition-colors cursor-pointer flex justify-center items-center gap-2 text-sm"
                  >
                    <Smartphone size={16} />
                    <span>Decrypt & Import</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
