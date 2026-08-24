export function extractDomain(urlStr?: string): string {
  if (!urlStr) return "";
  let clean = urlStr.trim();
  if (!clean) return "";
  
  if (!clean.startsWith("http://") && !clean.startsWith("https://")) {
    clean = "https://" + clean;
  }
  
  try {
    const parsed = new URL(clean);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return urlStr
      .replace(/^https?:\/\//, "")
      .split("/")[0]
      .split("?")[0]
      .replace(/^www\./, "");
  }
}

export function getFaviconUrl(urlStr?: string): string | null {
  const domain = extractDomain(urlStr);
  if (!domain || domain.length < 3) return null;
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`;
}
