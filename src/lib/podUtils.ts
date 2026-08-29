import { VaultItem, VaultItemType } from "../types.ts";

export interface PodNode {
  id: string; // full path e.g. 'Work/Finance'
  name: string; // display name e.g. 'Finance'
  path: string; // full path e.g. 'Work/Finance'
  level: number; // 0 for root, 1 for sub-pod, etc.
  directCount: number; // items exactly in this pod
  totalCount: number; // items in this pod and all sub-pods
  color: string; // color hex code
  children: PodNode[];
}

export type FolderNode = PodNode;

export const POD_COLOR_PALETTE = [
  "#06b6d4", // Cyan (ClawChives signature)
  "#38bdf8", // Sky Blue
  "#a855f7", // Purple
  "#10b981", // Emerald
  "#ef4444", // Lobster Red
  "#3b82f6", // Blue
  "#ec4899", // Pink
  "#f59e0b", // Amber / Gold
];

export const DEFAULT_ROOT_PODS = [
  "Personal",
  "Work"
];

export const DEFAULT_ROOT_CATEGORIES = DEFAULT_ROOT_PODS;

export const DEFAULT_SUGGESTED_PODS = [
  "Personal",
  "Personal/Banking",
  "Personal/Shopping",
  "Personal/Social",
  "Work",
  "Work/Finance",
  "Work/Engineering",
  "Work/Clients"
];

export const DEFAULT_SUGGESTED_FOLDERS = DEFAULT_SUGGESTED_PODS;

const POD_COLOR_STORAGE_KEY = "shellguard_pod_colors";

const INITIAL_DEFAULT_COLORS: Record<string, string> = {
  "Personal": "#06b6d4",
  "Work": "#a855f7"
};

/**
 * Retrieves all stored pod colors
 */
export function getStoredPodColors(): Record<string, string> {
  try {
    const raw = localStorage.getItem(POD_COLOR_STORAGE_KEY);
    if (raw) {
      return { ...INITIAL_DEFAULT_COLORS, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.error("Error reading pod colors:", e);
  }
  return { ...INITIAL_DEFAULT_COLORS };
}

/**
 * Gets the color for a specific Pod
 */
export function getPodColor(podName: string): string {
  const norm = normalizePod(podName);
  const colors = getStoredPodColors();
  if (colors[norm]) return colors[norm];

  // If sub-pod, check parent pod color
  const parts = norm.split("/");
  if (parts.length > 1 && colors[parts[0]]) {
    return colors[parts[0]];
  }

  // Deterministic color assignment based on name hash
  let hash = 0;
  for (let i = 0; i < norm.length; i++) {
    hash = norm.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % POD_COLOR_PALETTE.length;
  return POD_COLOR_PALETTE[index];
}

/**
 * Saves color for a Pod
 */
export function setPodColor(podName: string, color: string): void {
  const norm = normalizePod(podName);
  const colors = getStoredPodColors();
  colors[norm] = color;
  try {
    localStorage.setItem(POD_COLOR_STORAGE_KEY, JSON.stringify(colors));
  } catch (e) {
    console.error("Error saving pod color:", e);
  }
}

/**
 * Deletes color for a Pod
 */
export function deletePodColor(podName: string): void {
  const norm = normalizePod(podName);
  const colors = getStoredPodColors();
  delete colors[norm];
  try {
    localStorage.setItem(POD_COLOR_STORAGE_KEY, JSON.stringify(colors));
  } catch (e) {
    console.error("Error removing pod color:", e);
  }
}

/**
 * Normalizes pod name strings (trims spaces, trims leading/trailing slashes, consolidates multiple slashes)
 */
export function normalizePod(pod?: string): string {
  if (!pod) return "Personal";
  const cleaned = pod
    .trim()
    .replace(/\\+/g, "/")
    .replace(/\/+/g, "/")
    .replace(/^\/+|\/+$/g, "");
  return cleaned || "Personal";
}

export const normalizeCategory = normalizePod;

/**
 * Splits a pod path into its path segments (e.g. "Work/Finance/Q3" -> ["Work", "Finance", "Q3"])
 */
export function getPodSegments(pod?: string): string[] {
  const norm = normalizePod(pod);
  return norm.split("/").filter(Boolean);
}

export const getFolderSegments = getPodSegments;

/**
 * Determines whether an item belongs to a target pod (matches exact pod or any sub-pod)
 */
export function isItemInPod(itemCategory?: string, targetPod: string = "all"): boolean {
  if (!targetPod || targetPod === "all") return true;
  
  const normItem = normalizePod(itemCategory);
  const normTarget = normalizePod(targetPod);

  if (normItem === normTarget) return true;
  if (normItem.startsWith(normTarget + "/")) return true;

  return false;
}

export const isItemInFolder = isItemInPod;

/**
 * Extracts all unique pod paths from a list of items plus defaults
 */
export function getAllUniquePods(items: VaultItem[], includeDefaults: boolean = true): string[] {
  const podSet = new Set<string>();

  if (includeDefaults) {
    DEFAULT_ROOT_PODS.forEach(c => podSet.add(c));
  }

  // Also include any explicitly stored pods
  const storedColors = getStoredPodColors();
  Object.keys(storedColors).forEach(p => podSet.add(p));

  items.forEach(item => {
    const norm = normalizePod(item.category);
    // Add all ancestor paths as well
    const parts = norm.split("/");
    let current = "";
    for (let i = 0; i < parts.length; i++) {
      current = current ? `${current}/${parts[i]}` : parts[i];
      podSet.add(current);
    }
  });

  return Array.from(podSet).sort((a, b) => a.localeCompare(b));
}

export const getAllUniqueFolders = getAllUniquePods;

/**
 * Builds a hierarchical tree of pods with item counts and color styling
 */
export function buildPodTree(
  items: VaultItem[],
  activeTabType?: VaultItemType
): { rootNodes: PodNode[]; totalAllCount: number } {
  const filteredItems = activeTabType 
    ? items.filter(i => (i.type || "password") === activeTabType)
    : items;

  const totalAllCount = filteredItems.length;

  // Direct counts map
  const directCounts = new Map<string, number>();
  filteredItems.forEach(item => {
    const cat = normalizePod(item.category);
    directCounts.set(cat, (directCounts.get(cat) || 0) + 1);
  });

  // Collect all pod paths
  const allPods = getAllUniquePods(filteredItems, true);

  // Map to hold nodes by their path
  const nodeMap = new Map<string, PodNode>();

  allPods.forEach(path => {
    const parts = path.split("/");
    const name = parts[parts.length - 1];
    const level = parts.length - 1;
    const directCount = directCounts.get(path) || 0;
    const color = getPodColor(path);

    nodeMap.set(path, {
      id: path,
      name,
      path,
      level,
      directCount,
      totalCount: directCount,
      color,
      children: []
    });
  });

  // Calculate total counts including sub-pods
  nodeMap.forEach((node, path) => {
    let matches = 0;
    filteredItems.forEach(item => {
      if (isItemInPod(item.category, path)) {
        matches++;
      }
    });
    node.totalCount = matches;
  });

  // Build tree
  const rootNodes: PodNode[] = [];
  nodeMap.forEach((node, path) => {
    const parts = path.split("/");
    if (parts.length === 1) {
      rootNodes.push(node);
    } else {
      const parentPath = parts.slice(0, -1).join("/");
      const parentNode = nodeMap.get(parentPath);
      if (parentNode) {
        parentNode.children.push(node);
      } else {
        rootNodes.push(node);
      }
    }
  });

  // Sort root nodes and children alphabetically
  const sortNodes = (nodes: PodNode[]) => {
    nodes.sort((a, b) => a.name.localeCompare(b.name));
    nodes.forEach(n => sortNodes(n.children));
  };
  sortNodes(rootNodes);

  return { rootNodes, totalAllCount };
}

export const buildFolderTree = buildPodTree;
