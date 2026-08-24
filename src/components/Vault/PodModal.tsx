import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { Box, Plus, Trash2, X, Sparkles } from "lucide-react";
import { 
  POD_COLOR_PALETTE, 
  normalizePod, 
  getPodColor, 
  setPodColor, 
  deletePodColor 
} from "../../lib/podUtils.ts";

export interface PodModalProps {
  isOpen: boolean;
  mode: "create" | "edit";
  initialPodName?: string;
  initialColor?: string;
  onClose: () => void;
  onSave: (podName: string, color: string) => void;
  onDelete?: (podName: string) => void;
}

export function PodModal({
  isOpen,
  mode,
  initialPodName = "",
  initialColor,
  onClose,
  onSave,
  onDelete
}: PodModalProps) {
  const [podName, setPodName] = useState(initialPodName);
  const [selectedColor, setSelectedColor] = useState(initialColor || POD_COLOR_PALETTE[0]);
  const [customColorInput, setCustomColorInput] = useState("#06b6d4");

  useEffect(() => {
    if (isOpen) {
      setPodName(initialPodName);
      setSelectedColor(initialColor || (initialPodName ? getPodColor(initialPodName) : POD_COLOR_PALETTE[0]));
    }
  }, [isOpen, initialPodName, initialColor]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (typeof document === "undefined") return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = podName.trim();
    if (!trimmed) return;
    const normalized = normalizePod(trimmed);
    setPodColor(normalized, selectedColor);
    onSave(normalized, selectedColor);
    onClose();
  };

  const handleDelete = () => {
    if (!initialPodName) return;
    if (window.confirm(`Are you sure you want to delete pod "${initialPodName}"?`)) {
      deletePodColor(initialPodName);
      if (onDelete) {
        onDelete(initialPodName);
      }
      onClose();
    }
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 md:p-8 bg-black/80 backdrop-blur-md overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              onClose();
            }
          }}
        >
          {/* Modal Container: Faithful ClawChives aesthetic with rich deep background, subtle cyan glow, and rounded-3xl container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ type: "spring", damping: 26, stiffness: 320 }}
            className="bg-[#0b1322] border border-cyan-500/40 rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-[0_0_50px_-12px_rgba(6,182,212,0.35)] relative text-white my-auto overflow-hidden"
          >
            {/* Top decorative gradient edge */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400/80 to-transparent" />

            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6 pb-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Box size={18} />
                </div>
                <h3 className="text-sm font-black uppercase tracking-widest text-white">
                  {mode === "create" ? "NEW POD" : "EDIT POD"}
                </h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-xl bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-slate-700/50"
                title="Close (Esc)"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 1. Pod Name Input */}
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-300 mb-2.5">
                  Pod Name
                </label>
                <input
                  type="text"
                  required
                  value={podName}
                  onChange={(e) => setPodName(e.target.value)}
                  placeholder="e.g. Research, Ideas, Work..."
                  className="w-full bg-[#050b14] border border-slate-700/90 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition-all font-medium"
                  autoFocus
                />
              </div>

              {/* 2. Color Selection (Palette Swatches from ClawChives) */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-300">
                    Color
                  </label>
                  <span className="text-[10px] font-mono text-slate-400 uppercase">
                    {selectedColor}
                  </span>
                </div>

                <div className="flex items-center gap-3 flex-wrap bg-[#050b14]/60 p-3.5 rounded-2xl border border-slate-800/80">
                  {POD_COLOR_PALETTE.map((color) => {
                    const isSelected = selectedColor.toLowerCase() === color.toLowerCase();
                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setSelectedColor(color)}
                        className={`w-8 h-8 rounded-full cursor-pointer transition-all transform relative ${
                          isSelected
                            ? "ring-2 ring-cyan-400 ring-offset-3 ring-offset-[#0b1322] scale-110 shadow-lg"
                            : "hover:scale-105 opacity-80 hover:opacity-100"
                        }`}
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    );
                  })}

                  {/* Custom Color Button with '+' */}
                  <label 
                    className={`w-8 h-8 rounded-full border-2 border-dashed flex items-center justify-center cursor-pointer transition-all ${
                      !POD_COLOR_PALETTE.includes(selectedColor)
                        ? "border-cyan-400 ring-2 ring-cyan-400 ring-offset-3 ring-offset-[#0b1322] scale-110"
                        : "border-slate-600 hover:border-cyan-400 text-slate-400 hover:text-cyan-400"
                    }`}
                    style={
                      !POD_COLOR_PALETTE.includes(selectedColor)
                        ? { backgroundColor: selectedColor }
                        : {}
                    }
                    title="Choose Custom Color"
                  >
                    <Plus size={15} className={!POD_COLOR_PALETTE.includes(selectedColor) ? "text-white drop-shadow-md" : ""} />
                    <input
                      type="color"
                      value={customColorInput}
                      onChange={(e) => {
                        setCustomColorInput(e.target.value);
                        setSelectedColor(e.target.value);
                      }}
                      className="opacity-0 w-0 h-0 absolute pointer-events-none"
                    />
                  </label>
                </div>
              </div>

              {/* 3. Live Preview Bar (ClawChives exact visual preview card) */}
              <div className="bg-[#050b14] border border-slate-800/90 rounded-2xl p-4 flex items-center justify-between shadow-inner">
                <div className="flex items-center gap-3 min-w-0">
                  <span 
                    className="w-3.5 h-3.5 rounded-full flex-shrink-0 shadow-sm transition-colors duration-200"
                    style={{ backgroundColor: selectedColor }}
                  />
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      PREVIEW:
                    </span>
                    <span className="text-xs font-bold text-white truncate font-mono">
                      {podName.trim() || "Pod Name"}
                    </span>
                  </div>
                </div>
                <div className="px-2 py-0.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-[10px] font-mono text-slate-300">
                  0 items
                </div>
              </div>

              {/* 4. Action Buttons (Cancel / Create or Save) */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
                {mode === "edit" ? (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="px-3.5 py-2.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/50 border border-rose-900/40 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 active:scale-95"
                  >
                    <Trash2 size={14} />
                    <span>Delete Pod</span>
                  </button>
                ) : <span />}

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2.5 bg-slate-800/90 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer border border-slate-700/80"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    disabled={!podName.trim()}
                    className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-black font-black rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/25 transition-all cursor-pointer active:scale-95 flex items-center gap-1.5"
                  >
                    <span>{mode === "create" ? "CREATE" : "SAVE"}</span>
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
