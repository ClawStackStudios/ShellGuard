import React, { useState, useEffect, useReducer } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Waves,
  Play,
  Pause,
  X,
  RotateCcw,
  ChevronUp,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Paperclip
} from 'lucide-react';
import { globalIngestionQueue, QueueStats, AttachmentQueueItem } from '../../lib/habitatImport.ts';
import { formatBytes } from '../../lib/attachmentUtils.ts';

export function AbyssalIngestionDock() {
  const [, forceUpdate] = useReducer((x) => x + 1, 0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const unsubscribe = globalIngestionQueue.subscribe(() => {
      forceUpdate();
      // If new items arrive after dismissal, reset dismissed
      if (globalIngestionQueue.getItems().length > 0) {
        setDismissed(false);
      }
    });
    return unsubscribe;
  }, []);

  const items = globalIngestionQueue.getItems();
  const stats: QueueStats = globalIngestionQueue.getStats();
  const isPaused = globalIngestionQueue.isQueuePaused();

  if (items.length === 0 || (dismissed && stats.completed === stats.total)) {
    return null;
  }

  const activeItem = items.find((i) => i.status === 'uploading');
  const isAllComplete = stats.total > 0 && stats.completed === stats.total;

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-md w-full px-3 sm:px-0">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="bg-slate-900/95 text-slate-100 rounded-2xl border border-claw-cyan/40 shadow-2xl backdrop-blur-md overflow-hidden"
      >
        {/* Dock Header Bar */}
        <div className="p-3.5 px-4 bg-slate-950/60 border-b border-claw-cyan/20 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`p-1.5 rounded-lg ${isAllComplete ? 'bg-emerald-500/20 text-emerald-400' : 'bg-claw-cyan/20 text-claw-cyan'} shrink-0`}>
              {isAllComplete ? (
                <CheckCircle2 size={16} />
              ) : isPaused ? (
                <Pause size={16} />
              ) : (
                <Waves size={16} className="animate-pulse" />
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-slate-100 flex items-center gap-1.5 truncate">
                Abyssal Ingestion Dock
                {isPaused && (
                  <span className="text-[10px] font-mono font-bold text-amber-400 uppercase bg-amber-400/10 px-1.5 py-0.2 rounded border border-amber-400/30">
                    Paused
                  </span>
                )}
              </span>
              <span className="text-[10px] text-slate-400 truncate">
                {isAllComplete
                  ? `All ${stats.total} attachments verified & linked`
                  : activeItem
                  ? `Uploading ${activeItem.fileName} (${activeItem.progressPercent}%)`
                  : `${stats.completed} of ${stats.total} completed (${stats.percent}%)`}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {!isAllComplete && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    if (isPaused) {
                      globalIngestionQueue.resume();
                    } else {
                      globalIngestionQueue.pause();
                    }
                  }}
                  title={isPaused ? 'Resume ingestion' : 'Pause ingestion'}
                  className="p-1.5 text-slate-300 hover:text-claw-cyan hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  {isPaused ? <Play size={14} /> : <Pause size={14} />}
                </button>
                <button
                  type="button"
                  onClick={() => globalIngestionQueue.cancelAll()}
                  title="Cancel all pending uploads"
                  className="p-1.5 text-slate-400 hover:text-lobster-red hover:bg-lobster-red/10 rounded-lg transition-colors cursor-pointer"
                >
                  <X size={14} />
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              title={isExpanded ? 'Collapse dock' : 'Expand dock details'}
              className="p-1.5 text-slate-300 hover:text-claw-cyan hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              {isExpanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            </button>

            {isAllComplete && (
              <button
                type="button"
                onClick={() => setDismissed(true)}
                title="Dismiss dock"
                className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar Track */}
        <div className="w-full bg-slate-950/80 h-1.5 relative overflow-hidden">
          <motion.div
            className={`h-full ${isAllComplete ? 'bg-emerald-400' : 'bg-gradient-to-r from-cyan-400 via-claw-cyan to-pink-500'}`}
            initial={{ width: 0 }}
            animate={{ width: `${stats.percent}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Expanded View Drawer */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="p-3.5 space-y-3 border-t border-slate-800 text-xs"
            >
              {/* Summary Stats Row */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span>Progress: {stats.percent}%</span>
                <span>
                  {formatBytes(stats.uploadedBytes)} / {formatBytes(stats.totalBytes)}
                </span>
                {stats.failed > 0 && (
                  <button
                    type="button"
                    onClick={() => globalIngestionQueue.retryAllFailed()}
                    className="text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw size={11} />
                    <span>Retry {stats.failed} Failed</span>
                  </button>
                )}
              </div>

              {/* Items List */}
              <div className="max-h-52 overflow-y-auto space-y-1.5 custom-scrollbar pr-1">
                {items.map((item: AttachmentQueueItem) => (
                  <div
                    key={item.id}
                    className="p-2 rounded-xl bg-slate-950/50 border border-slate-800/80 flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Paperclip size={13} className="text-slate-400 shrink-0" />
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-slate-200 truncate">{item.fileName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {formatBytes(item.sizeBytes)} • {item.parentType}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {item.status === 'uploading' && (
                        <div className="flex items-center gap-1.5 text-claw-cyan font-mono text-[11px]">
                          <Loader2 size={12} className="animate-spin" />
                          <span>{item.progressPercent}%</span>
                        </div>
                      )}

                      {item.status === 'queued' && (
                        <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">
                          Queued
                        </span>
                      )}

                      {item.status === 'verified' && (
                        <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded flex items-center gap-1">
                          <CheckCircle2 size={10} />
                          Verified
                        </span>
                      )}

                      {item.status === 'error' && (
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] uppercase font-bold text-lobster-red bg-lobster-red/10 px-1.5 py-0.5 rounded flex items-center gap-1" title={item.errorMessage}>
                            <AlertTriangle size={10} />
                            Failed
                          </span>
                          <button
                            type="button"
                            onClick={() => globalIngestionQueue.retry(item.id)}
                            className="p-1 hover:text-claw-cyan text-slate-400 transition-colors cursor-pointer"
                            title="Retry upload"
                          >
                            <RotateCcw size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
