import React, { useState, useMemo } from "react";
import { 
  Plus, 
  Search, 
  Pencil, 
  X, 
  Layers
} from "lucide-react";
import { 
  PodNode, 
  buildPodTree, 
  normalizePod, 
  POD_COLOR_PALETTE, 
  getPodColor, 
  setPodColor, 
  deletePodColor
} from "../../lib/podUtils.ts";
import { VaultItem } from "../../types.ts";
import { PodModal } from "./PodModal.tsx";

interface SidebarFolderTreeProps {
  items: VaultItem[];
  selectedFolder: string;
  onSelectFolder: (podPath: string) => void;
  onAddNewFolder?: (podPath: string) => void;
  onRenameFolder?: (oldPath: string, newPath: string) => void;
  onDeleteFolder?: (podPath: string) => void;
  isCollapsed?: boolean;
}

export function SidebarFolderTree({
  items,
  selectedFolder,
  onSelectFolder,
  onAddNewFolder,
  onRenameFolder,
  onDeleteFolder,
  isCollapsed = false
}: SidebarFolderTreeProps) {
  const [podSearch, setPodSearch] = useState("");
  
  // Modal state for New / Edit Pod (Full-screen page overlay portal)
  const [isPodModalOpen, setIsPodModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingTargetPod, setEditingTargetPod] = useState<string>("");
  const [modalPodName, setModalPodName] = useState("");
  const [modalSelectedColor, setModalSelectedColor] = useState(POD_COLOR_PALETTE[0]);

  const { rootNodes, totalAllCount } = buildPodTree(items);

  // Filter pods according to search
  const filteredPods = useMemo(() => {
    if (!podSearch.trim()) return rootNodes;
    const q = podSearch.toLowerCase().trim();
    return rootNodes.filter(node => node.name.toLowerCase().includes(q) || node.path.toLowerCase().includes(q));
  }, [rootNodes, podSearch]);

  const handleOpenCreateModal = () => {
    setModalMode("create");
    setEditingTargetPod("");
    setModalPodName("");
    setModalSelectedColor(POD_COLOR_PALETTE[0]);
    setIsPodModalOpen(true);
  };

  const handleOpenEditModal = (e: React.MouseEvent, pod: PodNode) => {
    e.stopPropagation();
    setModalMode("edit");
    setEditingTargetPod(pod.path);
    setModalPodName(pod.name);
    setModalSelectedColor(pod.color || getPodColor(pod.path));
    setIsPodModalOpen(true);
  };

  const handleSaveModal = (normalizedName: string, color: string) => {
    setPodColor(normalizedName, color);

    if (modalMode === "create") {
      if (onAddNewFolder) {
        onAddNewFolder(normalizedName);
      }
      onSelectFolder(normalizedName);
    } else {
      // Edit mode
      if (editingTargetPod && editingTargetPod !== normalizedName) {
        if (onRenameFolder) {
          onRenameFolder(editingTargetPod, normalizedName);
        }
        deletePodColor(editingTargetPod);
        setPodColor(normalizedName, color);
        if (selectedFolder === editingTargetPod) {
          onSelectFolder(normalizedName);
        }
      }
    }
  };

  const handleDeletePod = (podToDelete: string) => {
    deletePodColor(podToDelete);
    if (onDeleteFolder) {
      onDeleteFolder(podToDelete);
    }
    if (selectedFolder === podToDelete) {
      onSelectFolder("all");
    }
  };

  if (isCollapsed) {
    return (
      <div className="py-2 flex flex-col items-center gap-1">
        <button
          type="button"
          onClick={() => onSelectFolder("all")}
          className={`p-2 rounded-2xl transition-colors cursor-pointer ${
            selectedFolder === "all"
              ? "bg-claw-cyan/15 text-claw-cyan"
              : "text-theme-muted hover:text-theme-main hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
          title={`All Items (${totalAllCount})`}
        >
          <Layers size={18} />
        </button>

        {/* Global Page-Level Pod Modal */}
        <PodModal
          isOpen={isPodModalOpen}
          mode={modalMode}
          initialPodName={modalPodName}
          initialColor={modalSelectedColor}
          onClose={() => setIsPodModalOpen(false)}
          onSave={handleSaveModal}
          onDelete={handleDeletePod}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-2 pt-2">
      {/* ── PODS Header (ClawChives Style: uppercase tracked + Plus action) ── */}
      <div className="flex items-center justify-between px-3 pt-1">
        <span className="text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-400">
          PODS
        </span>
        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="p-1 text-slate-400 hover:text-claw-cyan hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-lg transition-colors cursor-pointer"
          title="Create New Pod"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* ── Search Pods Input (ClawChives pill curvature) ── */}
      <div className="px-1">
        <div className="relative flex items-center">
          <Search size={14} className="absolute left-3 text-slate-500 pointer-events-none" />
          <input
            type="text"
            value={podSearch}
            onChange={(e) => setPodSearch(e.target.value)}
            placeholder="Search Pods..."
            className="w-full bg-slate-100 dark:bg-slate-900/60 hover:bg-slate-200/60 dark:hover:bg-slate-900/80 border border-theme-subtle dark:border-slate-800/80 focus:border-claw-cyan/70 focus:bg-theme-surface rounded-2xl pl-8 pr-7 py-2 text-xs text-theme-main placeholder:text-slate-500 outline-none transition-all"
          />
          {podSearch && (
            <button
              type="button"
              onClick={() => setPodSearch("")}
              className="absolute right-2.5 text-slate-400 hover:text-slate-200 p-0.5 cursor-pointer"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* ── Pods List (ClawChives Faithfully Recreated) ── */}
      <div className="space-y-1 overflow-y-auto max-h-64 px-1 pr-1 custom-scrollbar">
        {filteredPods.map((node) => {
          const isSelected = selectedFolder === node.path;
          const nodeColor = node.color || getPodColor(node.path);

          return (
            <div
              key={node.path}
              onClick={() => onSelectFolder(node.path)}
              className={`group flex items-center justify-between px-3 py-2 rounded-2xl text-xs font-semibold cursor-pointer transition-all ${
                isSelected
                  ? "bg-slate-800/90 dark:bg-[#15233b] text-white font-bold shadow-xs border border-claw-cyan/20"
                  : "text-slate-600 dark:text-slate-300 hover:text-theme-main hover:bg-slate-100 dark:hover:bg-slate-800/60"
              }`}
              title={`${node.name} (${node.totalCount} items)`}
            >
              {/* Left: Solid Color Bullet + Pod Name */}
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <span 
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-xs"
                  style={{ backgroundColor: nodeColor }}
                />
                <span className="truncate text-xs font-semibold">{node.name}</span>
              </div>

              {/* Right: Count Badge & Edit Pencil Icon */}
              <div className="flex items-center gap-1.5 flex-shrink-0 ml-1">
                <span
                  className={`px-2 py-0.5 text-[11px] font-bold font-mono rounded-full ${
                    isSelected
                      ? "bg-slate-700/80 text-white"
                      : "bg-slate-200/80 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {node.totalCount}
                </span>

                {/* Edit Pencil Icon (matches ClawChives screenshot 1) */}
                <button
                  type="button"
                  onClick={(e) => handleOpenEditModal(e, node)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-claw-cyan hover:text-cyan-400 hover:bg-claw-cyan/10 rounded-lg transition-all cursor-pointer"
                  title="Edit Pod"
                >
                  <Pencil size={13} />
                </button>
              </div>
            </div>
          );
        })}

        {filteredPods.length === 0 && (
          <div className="py-4 text-center text-xs text-slate-500">
            {podSearch ? "No matching pods found" : "No pods"}
          </div>
        )}
      </div>

      {/* ── Page-Level Full Screen Portal Pod Modal ── */}
      <PodModal
        isOpen={isPodModalOpen}
        mode={modalMode}
        initialPodName={modalPodName}
        initialColor={modalSelectedColor}
        onClose={() => setIsPodModalOpen(false)}
        onSave={handleSaveModal}
        onDelete={handleDeletePod}
      />
    </div>
  );
}

export const SidebarPodsTree = SidebarFolderTree;
