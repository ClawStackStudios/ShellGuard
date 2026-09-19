import { Tag, VaultItem } from "../types.ts";
import { getTagColor } from "./podUtils.ts";

/**
 * Parses raw tags (JSON string, comma-separated string, or Tag array) into Tag[] objects.
 */
export function parseTags(raw?: string | null | Tag[] | string[]): Tag[] {
  if (!raw) return [];

  let parsedList: (string | { name?: string; color?: string })[] = [];

  if (Array.isArray(raw)) {
    parsedList = raw;
  } else if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed || trimmed === '[]') return [];

    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          parsedList = parsed;
        } else {
          parsedList = [trimmed];
        }
      } catch {
        parsedList = trimmed.split(',').map(s => s.trim()).filter(Boolean);
      }
    } else {
      parsedList = trimmed.split(',').map(s => s.trim()).filter(Boolean);
    }
  }

  const result: Tag[] = [];
  const seen = new Set<string>();

  for (const item of parsedList) {
    if (!item) continue;
    let name = '';
    let color: string | undefined;

    if (typeof item === 'string') {
      name = item.trim();
    } else if (typeof item === 'object' && item.name) {
      name = String(item.name).trim();
      color = item.color ? String(item.color).trim() : undefined;
    }

    if (!name) continue;
    const lower = name.toLowerCase();
    if (seen.has(lower)) continue;
    seen.add(lower);

    result.push({
      name,
      color: getTagColor(name, color),
    });
  }

  return result;
}

/**
 * Extracts all unique tags with item frequency counts from a set of vault items.
 */
export function extractAllTags(items: VaultItem[]): { name: string; color: string; count: number }[] {
  const tagCounts = new Map<string, { displayName: string; color?: string; count: number }>();

  for (const item of items) {
    const tags = parseTags(item.tags);
    for (const tag of tags) {
      const lower = tag.name.toLowerCase();
      const existing = tagCounts.get(lower);
      if (existing) {
        existing.count += 1;
        if (!existing.color && tag.color) existing.color = tag.color;
      } else {
        tagCounts.set(lower, {
          displayName: tag.name,
          color: tag.color,
          count: 1,
        });
      }
    }
  }

  const result: { name: string; color: string; count: number }[] = [];
  for (const [, data] of tagCounts.entries()) {
    result.push({
      name: data.displayName,
      color: getTagColor(data.displayName, data.color),
      count: data.count,
    });
  }

  return result.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Filters a list of items against a set of selected tag names.
 * Supports 'AND' (item must contain all selected tags) and 'OR' (item must contain any selected tag).
 */
export function filterItemsByTags(
  items: VaultItem[],
  selectedTags: string[],
  mode: 'AND' | 'OR' = 'AND'
): VaultItem[] {
  if (!selectedTags || selectedTags.length === 0) return items;

  const targetLower = selectedTags.map(t => t.trim().toLowerCase()).filter(Boolean);
  if (targetLower.length === 0) return items;

  return items.filter(item => {
    const itemTags = parseTags(item.tags).map(t => t.name.toLowerCase());
    if (itemTags.length === 0) return false;

    if (mode === 'AND') {
      return targetLower.every(tag => itemTags.includes(tag));
    } else {
      return targetLower.some(tag => itemTags.includes(tag));
    }
  });
}
