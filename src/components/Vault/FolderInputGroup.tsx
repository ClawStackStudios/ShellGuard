import React, { useState, useMemo } from "react";
import { Box, Plus, Tag } from "lucide-react";
import { VaultItem } from "../../types.ts";
import { 
  getAllUniquePods, 
  normalizePod, 
  DEFAULT_SUGGESTED_PODS,
  getPodSegments,
  getPodColor
} from "../../lib/podUtils.ts";

interface PodInputGroupProps {
  category: string;
  onChange: (category: string) => void;
  items: VaultItem[];
  label?: string;
}

export function FolderInputGroup({
  category,
  onChange,
  items,
  label = "Pod (Category)"
}: PodInputGroupProps) {
  const availablePods = useMemo(() => {
    return getAllUniquePods(items);
  }, [items]);

  const [isCustomMode, setIsCustomMode] = useState(() => {
    return availablePods.length === 0 || (!availablePods.includes(category) && Boolean(category));
  });
  const [customInput, setCustomInput] = useState(category || "");

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === "__CUSTOM__") {
      setIsCustomMode(true);
      setCustomInput(category);
    } else if (val === "__NONE__") {
      setIsCustomMode(false);
      onChange("");
    } else {
      setIsCustomMode(false);
      onChange(val);
    }
  };

  const handleCustomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomInput(val);
    onChange(normalizePod(val));
  };

  const selectSuggestion = (pod: string) => {
    onChange(pod);
    setCustomInput(pod);
  };

  const segments = getPodSegments(category);
  const currentColor = category ? getPodColor(category) : "#64748b";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold uppercase tracking-wider text-theme-muted flex items-center gap-2">
          {category && (
            <span 
              className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
              style={{ backgroundColor: currentColor }} 
            />
          )}
          <span>{label}</span>
        </label>
        
        {availablePods.length > 0 && (
          <button
            type="button"
            onClick={() => {
              setIsCustomMode(!isCustomMode);
              if (!isCustomMode) {
                setCustomInput(category);
              }
            }}
            className="text-xs font-semibold text-claw-cyan hover:text-cyan-600 flex items-center gap-1 cursor-pointer"
          >
            {isCustomMode ? (
              <span>Use Pod Dropdown</span>
            ) : (
              <>
                <Plus size={12} />
                <span>+ Custom Pod</span>
              </>
            )}
          </button>
        )}
      </div>

      {!isCustomMode && availablePods.length > 0 ? (
        <select
          value={category ? (availablePods.includes(category) ? category : "__CUSTOM__") : "__NONE__"}
          onChange={handleSelectChange}
          className="w-full bg-theme-base border border-theme-subtle rounded-xl px-4 py-3 text-sm focus:border-claw-cyan focus:ring-1 focus:ring-claw-cyan outline-none transition-all text-theme-main cursor-pointer"
        >
          <option value="__NONE__">— None (Uncategorized) —</option>
          {availablePods.map((pod) => {
            const parts = pod.split("/");
            const indent = parts.length > 1 ? "  ↳ ".repeat(parts.length - 1) : "";
            return (
              <option key={pod} value={pod}>
                {indent}● {pod}
              </option>
            );
          })}
          <option value="__CUSTOM__">+ Create New Pod...</option>
        </select>
      ) : (
        <div className="space-y-2">
          <div className="relative">
            <input
              type="text"
              value={customInput}
              onChange={handleCustomInputChange}
              placeholder="e.g. Work/Finance, Personal/Banking, Research (or leave blank)"
              className="w-full bg-theme-base border border-theme-subtle rounded-xl px-4 py-3 text-sm focus:border-claw-cyan focus:ring-1 focus:ring-claw-cyan outline-none transition-all text-theme-main placeholder:text-slate-400 font-medium"
            />
          </div>

          {availablePods.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-theme-muted font-bold flex items-center gap-1 mr-1">
                <Tag size={11} /> Existing Pods:
              </span>
              {availablePods.slice(0, 6).map((sug) => {
                const sugColor = getPodColor(sug);
                return (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => selectSuggestion(sug)}
                    className={`px-2.5 py-1 text-[11px] rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
                      category === sug
                        ? "bg-claw-cyan text-white border-claw-cyan font-bold shadow-xs"
                        : "bg-slate-100 dark:bg-slate-800 text-theme-muted border-theme-subtle hover:text-theme-main hover:border-claw-cyan"
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: sugColor }} />
                    <span>{sug}</span>
                  </button>
                );
              })}
            </div>
          )}

          <p className="text-[11px] text-slate-400">
            Organize with slashes, e.g. <span className="font-mono text-claw-cyan font-bold">Work/Finance</span> or <span className="font-mono text-claw-cyan font-bold">Personal/Banking</span>.
          </p>
        </div>
      )}

      {/* Active Pod Breadcrumb Preview */}
      {segments.length > 0 && (
        <div className="flex items-center gap-1.5 text-[11px] text-theme-muted flex-wrap">
          <span className="opacity-70">Assigned Pod:</span>
          {segments.map((seg, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <span className="text-slate-400">/</span>}
              <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 font-semibold text-theme-main border border-theme-subtle flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: currentColor }} />
                <span>{seg}</span>
              </span>
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
}

export const PodInputGroup = FolderInputGroup;
