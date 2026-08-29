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
import { hashToken } from "../../lib/crypto.ts";
import { restAdapter } from "../../services/api/restAdapter.ts";

interface ImportExportViewProps {
  items: VaultItem[];
  lobster: Lobster;
  onImportItems?: (importedItems: VaultItem[]) => void;
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
  const [importStatus, setImportStatus] = useState<"idle" | "success" | "error">("idle");
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

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
      setExportJSONError("Invalid ShellKey©™ format (must start with hu- and be 67 characters).");
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
      setExportJSONError(err.message || "Identity verification failed. Invalid ShellKey©™.");
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

  const handleProcessImport = () => {
    if (!importJsonText.trim()) {
      setImportStatus("error");
      setImportMessage("Please paste JSON or upload a backup file.");
      return;
    }

    setIsImporting(true);
    setImportStatus("idle");
    setImportMessage(null);

    try {
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

      if (onImportItems) {
        onImportItems(listToImport);
      }

      setImportStatus("success");
      setImportMessage(`Successfully imported ${listToImport.length} vault record(s) into your session.`);
      setImportJsonText("");
    } catch (err: any) {
      setImportStatus("error");
      setImportMessage(err.message || "Invalid JSON syntax.");
    } finally {
      setIsImporting(false);
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
                  Download a full decrypted JSON backup of all vault credentials. Requires confirmation and ShellKey©™ challenge verification.
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
                  <strong>High-Risk Action:</strong> This will export a JSON backup containing all <strong>{items.length}</strong> passwords, keys, and notes in plain text. Please confirm and enter your ShellKey©™ to authorize.
                </span>
              </div>
              
              <form onSubmit={handleVerifyAndExportJSON} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
                    Your ShellKey©™ Authorization
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
    </div>
  );
}
