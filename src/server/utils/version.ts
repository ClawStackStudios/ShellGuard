/**
 * version.ts — ShellGuard©™
 *
 * Ground-truth application version resolver. Reads package.json dynamically
 * with fallbacks, ensuring state consistency across the SuperLobster panel,
 * health endpoints, backup manifests, and CLI utilities.
 *
 * Maintained by CrustAgent©™
 */

import fs from 'fs';
import path from 'path';

let cachedVersion: string | null = null;

/**
 * Returns the current application version string.
 * Priority:
 * 1. package.json in process.cwd() or root
 * 2. process.env.npm_package_version
 * 3. Fallback default
 */
export function getAppVersion(): string {
  try {
    const pkgPath = path.join(process.cwd(), 'package.json');
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      if (pkg.version) {
        cachedVersion = pkg.version;
        return cachedVersion;
      }
    }
  } catch {
    // Ignore read error
  }

  if (process.env.npm_package_version) {
    cachedVersion = process.env.npm_package_version;
    return cachedVersion;
  }

  return cachedVersion || '0.0.1.8';
}
