export const GAME_ENGINE_VERSION = '2.8.1';

/**
 * Compares two semver strings (e.g. "2.8.0" vs "2.8.1" or "v2.8.0").
 * Returns 0 if equal, 1 if v1 > v2, -1 if v1 < v2.
 */
export function compareVersions(v1: string, v2: string): number {
  const clean1 = (v1 || '').replace(/^v/i, '').trim();
  const clean2 = (v2 || '').replace(/^v/i, '').trim();

  if (clean1 === clean2) return 0;

  const parts1 = clean1.split('.').map(n => parseInt(n, 10) || 0);
  const parts2 = clean2.split('.').map(n => parseInt(n, 10) || 0);

  const maxLen = Math.max(parts1.length, parts2.length);
  for (let i = 0; i < maxLen; i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }

  return 0;
}

/**
 * Checks if a remote version requires a page reload.
 * Returns true if remote version is defined and does not match local version.
 */
export function isVersionMismatch(localVersion: string, remoteVersion?: string | null): boolean {
  if (!remoteVersion) return false;
  return compareVersions(localVersion, remoteVersion) !== 0;
}
