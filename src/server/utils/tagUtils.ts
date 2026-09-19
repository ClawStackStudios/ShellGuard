/**
 * 🏷️ Server-side tag utility functions for Vault items, notes, and SSH keys.
 */

export function normalizeTagsForDb(tags: unknown): string {
  if (!tags) return '[]';
  if (Array.isArray(tags)) return JSON.stringify(tags);
  if (typeof tags === 'string') {
    const trimmed = tags.trim();
    if (!trimmed) return '[]';
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        JSON.parse(trimmed);
        return trimmed;
      } catch {
        return JSON.stringify([trimmed]);
      }
    }
    return JSON.stringify(trimmed.split(',').map(s => s.trim()).filter(Boolean));
  }
  return '[]';
}

export function filterByTags(items: Record<string, unknown>[], tagsQuery?: string): Record<string, unknown>[] {
  if (!tagsQuery || !tagsQuery.trim()) return items;
  const requiredTags = tagsQuery
    .split(',')
    .map(t => t.trim().toLowerCase())
    .filter(Boolean);
  if (requiredTags.length === 0) return items;

  return items.filter(item => {
    let itemTags: string[] = [];
    const rawTags = item.tags;
    if (typeof rawTags === 'string') {
      try {
        const parsed = JSON.parse(rawTags);
        if (Array.isArray(parsed)) {
          itemTags = parsed.map(p => (typeof p === 'string' ? p : (p && typeof p === 'object' && 'name' in p ? String(p.name) : ''))).filter(Boolean);
        } else {
          itemTags = [rawTags];
        }
      } catch {
        itemTags = rawTags.split(',').map(t => t.trim());
      }
    } else if (Array.isArray(rawTags)) {
      itemTags = rawTags.map(p => (typeof p === 'string' ? p : (p && typeof p === 'object' && 'name' in p ? String(p.name) : ''))).filter(Boolean);
    }
    const lowerItemTags = itemTags.map(t => String(t).toLowerCase());
    return requiredTags.every(rt => lowerItemTags.includes(rt));
  });
}
