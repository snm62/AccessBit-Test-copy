export interface AuthData {
  sessionToken: string;
  firstName: string;
  email: string;
  siteId: string;
  exp: number;
}
export interface SiteInfo {
  siteId: string;
  name?: string;
  siteName?: string;
  shortName: string;
  url?: string;
  email?: string;
  // Add other site info properties as needed
}
// ALL keys now use sessionStorage (commented out localStorage usage)
const ALL_KEYS = [
  'accessbit-userinfo',  // Primary key (no legacy duplicate)
  'siteInfo',
  'explicitly_logged_out',
  'cookiePreferences',
  'selectedOptions',
  'scriptContext_scripts',
  'cookieBannerAdded',
  'bannerAdded',
  'wf_hybrid_user'
];
/**
* Check if a key should use sessionStorage (now all keys do)
*/
function isSessionStorageKey(key: string): boolean {
  return true; // All keys now use sessionStorage
}
/**
* Get storage instance - now always sessionStorage
*/
function getStorage(key: string): Storage {
  return sessionStorage; // Always use sessionStorage now
}
/**
* Set item in appropriate storage
*/
export function setAuthStorageItem(key: string, value: string): void {
  if (typeof window === 'undefined') return;
  const storage = getStorage(key);
  storage.setItem(key, value);
}
/**
* Get item from appropriate storage
*/
export function getAuthStorageItem(key: string): string | null {
  if (typeof window === 'undefined') return null;
  const storage = getStorage(key);
  return storage.getItem(key);
}
/**
* Remove item from appropriate storage
*/
export function removeAuthStorageItem(key: string): void {
  if (typeof window === 'undefined') return;
  const storage = getStorage(key);
  storage.removeItem(key);
}
/**
* Clear all data (sessionStorage only now)
*/
export function clearAuthData(): void {
  if (typeof window === 'undefined') return;
  const keysToRemove: string[] = [];
  // Clear from sessionStorage
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key) {
      sessionStorage.removeItem(key);
      keysToRemove.push(key);
    }
  }
  // COMMENTED OUT: Also clear from localStorage (for migration purposes)
  // AUTH_KEYS.forEach(key => {
  //   if (localStorage.getItem(key) !== null) {
  //     localStorage.removeItem(key);
  //     keysToRemove.push(key);
  //   }
  // });
}
/**
* COMMENTED OUT: Clear all app data (localStorage) but preserve auth data
* Now everything is in sessionStorage
*/
export function clearAppData(): void {
  if (typeof window === 'undefined') return;
  // COMMENTED OUT: localStorage usage
  // const keysToRemove: string[] = [];
  // // Get all localStorage keys
  // for (let i = 0; i < localStorage.length; i++) {
  //   const key = localStorage.key(i);
  //   if (key && !isAuthKey(key)) {
  //     localStorage.removeItem(key);
  //     keysToRemove.push(key);
  //   }
  // }
}
/**
* Clear all data (sessionStorage only now)
*/
export function clearAllData(): void {
  if (typeof window === 'undefined') return;
  // COMMENTED OUT: localStorage.clear();
  sessionStorage.clear();
}
/**
* Get authentication data from sessionStorage
*/
export function getAuthData(): AuthData | null {
  // Only use the ContrastKit key
  const authData = getAuthStorageItem('accessbit-userinfo');
  if (!authData) return null;
  try {
    return JSON.parse(authData);
  } catch (error) {
    return null;
  }
}
/**
* Set authentication data in sessionStorage
*/
export function setAuthData(authData: AuthData): void {
  // Store only under ContrastKit key
  setAuthStorageItem('accessbit-userinfo', JSON.stringify(authData));
  // Proactively remove any legacy key so it doesn't linger
  try { removeAuthStorageItem('consentbit-userinfo'); } catch {}
}
/**
* Get site info from sessionStorage for a specific site
*/
export function getSiteInfo(siteId?: string): SiteInfo | null {
  // If no siteId provided, try to get current site ID
  if (!siteId) {
    siteId = getAuthStorageItem('currentSiteId');
  }
  if (!siteId) {
    // Fallback to old key for backward compatibility
    const siteInfo = getAuthStorageItem('siteInfo');
    if (siteInfo) {
      try {
        return JSON.parse(siteInfo);
      } catch (error) {
        return null;
      }
    }
    return null;
  }
  const siteSpecificKey = `siteInfo_${siteId}`;
  const siteInfo = getAuthStorageItem(siteSpecificKey);
  if (!siteInfo) return null;
  try {
    return JSON.parse(siteInfo);
  } catch (error) {
    return null;
  }
}
/**
* Set site info in sessionStorage with site-specific key
*/
export function setSiteInfo(siteInfo: SiteInfo): void {
  const siteSpecificKey = `siteInfo_${siteInfo.siteId}`;
  setAuthStorageItem(siteSpecificKey, JSON.stringify(siteInfo));
  // Also store the current site ID for reference
  setAuthStorageItem('currentSiteId', siteInfo.siteId);
}
/**
* Update current site ID (useful when switching between sites)
*/
export function setCurrentSiteId(siteId: string): void {
  setAuthStorageItem('currentSiteId', siteId);
}
/**
* Check if user is authenticated
*/
export function isAuthenticated(): boolean {
  const authData = getAuthData();
  if (!authData) return false;
  // Check if token is expired
  const now = Math.floor(Date.now() / 1000);
  return authData.exp > now;
}
/**
* Migration function to move existing data from localStorage to sessionStorage
*/
export function migrateAuthDataToSessionStorage(): void {
  if (typeof window === 'undefined') return;
  const migrationStartTime = performance.now();
  // Check if migration has already been completed in this session
  const migrationCompleted = sessionStorage.getItem('migration_completed');
  if (migrationCompleted) {
    return; // Migration already done, skip expensive operations
  }
  // Only migrate essential keys to avoid expensive operations
  const essentialKeys = ['accessbit-userinfo', 'siteInfo', 'explicitly_logged_out'];
  let migratedCount = 0;
  essentialKeys.forEach(key => {
    const value = localStorage.getItem(key);
    if (value) {
      sessionStorage.setItem(key, value);
      localStorage.removeItem(key);
      migratedCount++;
    }
  });
  // Mark migration as completed for this session
  sessionStorage.setItem('migration_completed', 'true');
}
/**
* Debug function to show current storage state
*/
export function debugStorageState(): void {
  if (typeof window === 'undefined') return;
  const authData = getAuthData();
  const siteInfo = getSiteInfo();
}

/**
* Get ContrastKit authentication data from sessionStorage
*/
export function getContrastKitAuthData(): AuthData | null {
  const authData = getAuthStorageItem('accessbit-userinfo');
  if (!authData) return null;
  try {
    return JSON.parse(authData);
  } catch (error) {
    return null;
  }
}

/**
* Set ContrastKit authentication data in sessionStorage
*/
export function setContrastKitAuthData(authData: AuthData): void {
  setAuthStorageItem('accessbit-userinfo', JSON.stringify(authData));
}

/**
* Check if ContrastKit user is authenticated
*/
export function isContrastKitAuthenticated(): boolean {
  const authData = getContrastKitAuthData();
  if (!authData) return false;
  // Check if token is expired
  const now = Math.floor(Date.now() / 1000);
  return authData.exp > now;
}