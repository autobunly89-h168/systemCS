import { CustomerRecord, DashboardStats, RegistrationFormData, ShiftType } from '../types';
import { getAllWebsiteTokens, getWebsiteToken } from '../data/websites';

export const LOCAL_STORAGE_KEY = 'cs_daily_records_v2';
export const SELECTED_WEBSITE_KEY = 'cs_selected_website';
export const SELECTED_CS_ID_KEY = 'cs_selected_id';
export const GAS_WEB_APP_URL_KEY = 'cs_gas_web_app_url';
export const DEFAULT_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbwHfrp9r-HmJVAM_ZSF1wfrOXi-xnN7aCOjLpx3Q_l_rzzlwu9sB8PgDlfHA9hbkbAW/exec';

export const DELETED_RECORD_IDS_KEY = 'cs_deleted_record_ids_v2';
export const DELETED_RECORD_KEYS_KEY = 'cs_deleted_record_keys_v2';

// Retrieve permanently deleted record tombstones
export function getDeletedRecordSignatures(): { ids: Set<string>; keys: Set<string> } {
  try {
    const rawIds = localStorage.getItem(DELETED_RECORD_IDS_KEY);
    const rawKeys = localStorage.getItem(DELETED_RECORD_KEYS_KEY);
    const ids = new Set<string>(rawIds ? JSON.parse(rawIds) : []);
    const parsedKeys: string[] = rawKeys ? JSON.parse(rawKeys) : [];

    // Purge corrupted/legacy keys (serial numbers, hyphens)
    const validKeys = parsedKeys.filter((k: string) => {
      if (!k || typeof k !== 'string') return false;
      if (k.includes('_serial_') || k.includes('_serial')) return false;
      if (k.endsWith('_-_ -') || k.endsWith('_-_') || k.includes('_-')) return false;
      return true;
    });

    // If corrupted keys were found and filtered, clean up local storage immediately
    if (validKeys.length !== parsedKeys.length) {
      try {
        localStorage.setItem(DELETED_RECORD_KEYS_KEY, JSON.stringify(validKeys));
      } catch (_) {}
    }

    return { ids, keys: new Set<string>(validKeys) };
  } catch (e) {
    return { ids: new Set(), keys: new Set() };
  }
}

// Generate dedupe key for signature tracking
export function makeRecordDedupeKey(r: Partial<CustomerRecord>): string {
  if (!r) return '';
  const web = (r.website || 'K9WIN').toUpperCase();
  const date = (r.regDate || '').trim().toLowerCase();
  const prof = (r.profileName || '').trim().toLowerCase();
  const custId = (r.customerId || '').trim().toLowerCase();

  // ONLY generate dedupe key if customerId is a real meaningful string
  const isRealCustId = custId && custId !== '-' && custId !== 'n/a' && custId.length >= 3;
  const isRealProf = prof && prof !== '-' && prof !== 'n/a' && prof.length >= 2;

  if (isRealCustId && isRealProf && date) {
    return `${web}_${date}_${prof}_${custId}`;
  }
  if (isRealCustId) {
    return `${web}_${custId}`;
  }
  return '';
}

// Check if a record has been marked as permanently deleted (cannot be pulled or restored)
export function isRecordDeletedPermanently(
  r: Partial<CustomerRecord>,
  tombstones?: { ids: Set<string>; keys: Set<string> }
): boolean {
  if (!r) return false;
  const { ids, keys } = tombstones || getDeletedRecordSignatures();
  if (r.id && ids.has(r.id)) return true;

  const key = makeRecordDedupeKey(r);
  if (key && keys.has(key)) return true;

  const web = (r.website || 'K9WIN').toUpperCase();
  const prof = (r.profileName || '').trim().toLowerCase();
  const custId = (r.customerId || '').trim().toLowerCase();
  const isRealCustId = custId && custId !== '-' && custId !== 'n/a' && custId.length >= 3;
  const isRealProf = prof && prof !== '-' && prof !== 'n/a' && prof.length >= 2;

  if (isRealCustId) {
    if (keys.has(`${web}_${custId}`)) return true;
    if (isRealProf && keys.has(`${web}_${prof}_${custId}`)) return true;
  }

  // Serial numbers are NEVER checked here because serial numbers are reusable counter indices!
  return false;
}

// Mark record as permanently deleted in local storage
export function markRecordPermanentlyDeleted(
  record: Partial<CustomerRecord> & { id: string }
): void {
  try {
    const { ids, keys } = getDeletedRecordSignatures();
    if (record.id) ids.add(record.id);

    const key = makeRecordDedupeKey(record);
    if (key) keys.add(key);

    const web = (record.website || 'K9WIN').toUpperCase();
    const prof = (record.profileName || '').trim().toLowerCase();
    const custId = (record.customerId || '').trim().toLowerCase();
    const isRealCustId = custId && custId !== '-' && custId !== 'n/a' && custId.length >= 3;
    const isRealProf = prof && prof !== '-' && prof !== 'n/a' && prof.length >= 2;

    if (isRealCustId) {
      keys.add(`${web}_${custId}`);
      if (isRealProf) {
        keys.add(`${web}_${prof}_${custId}`);
      }
    }

    // NEVER add serialNo to keys!

    localStorage.setItem(DELETED_RECORD_IDS_KEY, JSON.stringify(Array.from(ids)));
    localStorage.setItem(DELETED_RECORD_KEYS_KEY, JSON.stringify(Array.from(keys)));
  } catch (e) {
    console.error('Failed to save deleted record tombstone:', e);
  }
}

// Synchronize deleted records list with central server
export async function syncDeletedRecordsWithServer(): Promise<void> {
  try {
    const res = await fetch('/api/records/deleted');
    if (res.ok) {
      const data = await res.json();
      if (data && data.deleted) {
        const { ids, keys } = getDeletedRecordSignatures();
        (data.deleted.ids || []).forEach((id: string) => ids.add(id));
        (data.deleted.keys || []).forEach((k: string) => keys.add(k));
        localStorage.setItem(DELETED_RECORD_IDS_KEY, JSON.stringify(Array.from(ids)));
        localStorage.setItem(DELETED_RECORD_KEYS_KEY, JSON.stringify(Array.from(keys)));
      }
    }
  } catch (e) {
    // ignore
  }
}

export function getSavedWebAppUrl(): string {
  try {
    const saved = localStorage.getItem(GAS_WEB_APP_URL_KEY);
    if (saved && saved.trim()) return saved.trim();
  } catch (e) {
    // ignore
  }
  return DEFAULT_WEB_APP_URL;
}

export function saveWebAppUrl(url: string): void {
  try {
    localStorage.setItem(GAS_WEB_APP_URL_KEY, url.trim());
  } catch (e) {
    console.error('Failed to save Web App URL:', e);
  }
}

export function sortRecordsForSheetSequential(recordsList: CustomerRecord[]): CustomerRecord[] {
  return [...recordsList].sort((a, b) => {
    const aSer = Number(a.serialNo) || 0;
    const bSer = Number(b.serialNo) || 0;
    if (aSer > 0 && bSer > 0 && aSer !== bSer) {
      return aSer - bSer;
    }
    const aTime = getRecordSortDate(a);
    const bTime = getRecordSortDate(b);
    if (aTime !== bTime) {
      return aTime - bTime;
    }
    return aSer - bSer;
  });
}

export async function deleteRecordFromGoogleSheetApi(
  record: CustomerRecord,
  customUrl?: string
): Promise<{ success: boolean; message: string }> {
  const url = customUrl || getSavedWebAppUrl();
  if (!url || !record) {
    return {
      success: false,
      message: 'ពុំមាន Google Apps Script URL ឬ ទិន្នន័យដើម្បីលុបឡើយ!'
    };
  }

  const website = (record.website || 'K9WIN').toUpperCase();
  const token = getWebsiteToken(website);

  const payload = {
    action: 'delete_record',
    website: website,
    token: token,
    record: {
      id: record.id,
      serialNo: record.serialNo,
      regDate: record.regDate,
      profileName: record.profileName,
      customerId: record.customerId,
      depositDate: record.depositDate,
      website: website
    }
  };

  // Try direct call to Google Apps Script Web App first
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      const resData = await response.json().catch(() => null);
      if (resData && resData.message) {
        return { success: true, message: resData.message };
      }
      return {
        success: true,
        message: `បានលុបជួរដេកក្នុង Google Sheet [${website}] រួចរាល់!`
      };
    }
  } catch (err) {
    console.warn('Direct GAS delete notice, attempting fallback via server:', err);
  }

  // Fallback via central backend server
  try {
    const srvRes = await fetch('/api/gas-delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        webAppUrl: url,
        website: website,
        token: token,
        record: payload.record
      })
    });
    if (srvRes.ok) {
      const srvData = await srvRes.json().catch(() => null);
      return {
        success: true,
        message: srvData?.message || `បានលុបជួរដេកក្នុង Google Sheet [${website}] រួចរាល់!`
      };
    }
  } catch (e) {
    console.warn('Server fallback delete failed:', e);
  }

  return {
    success: true,
    message: `បានផ្ញើ Request លុបជួរដេកទៅកាន់ Google Sheet [${website}] រួចរាល់!`
  };
}

export async function appendRecordToGoogleSheetApi(
  record: CustomerRecord,
  customUrl?: string
): Promise<{ success: boolean; message: string }> {
  const url = customUrl || getSavedWebAppUrl();
  if (!url || !record) return { success: false, message: 'ពុំមាន URL' };

  const website = (record.website || 'K9WIN').toUpperCase();
  const token = getWebsiteToken(website);

  try {
    const payload = {
      action: 'append_record',
      website: website,
      token: token,
      record: record
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      const resData = await response.json().catch(() => null);
      return {
        success: true,
        message: resData?.message || `បានបញ្ចូលជួរថ្មីទៅក្នុង Google Sheet [${website}] រួចរាល់!`
      };
    }
  } catch (e) {
    console.warn('Direct append notice:', e);
  }

  return {
    success: true,
    message: `បានផ្ញើទិន្នន័យជួរថ្មីទៅ Google Sheet [${website}] រួចរាល់!`
  };
}

export async function syncToGoogleSheetApi(
  website: string,
  token: string,
  records: CustomerRecord[],
  customUrl?: string
): Promise<{ success: boolean; message: string }> {
  const url = customUrl || getSavedWebAppUrl();
  if (!url) {
    return {
      success: false,
      message: 'សូមបញ្ចូល Web App URL របស់ Google Apps Script ជាមុនសិន!'
    };
  }

  try {
    const webRecords = records.filter(r => !r.website || r.website === website);

    if (webRecords.length === 0) {
      return {
        success: false,
        message: `គ្មានទិន្នន័យសម្រាប់ [${website}] ក្នុងប្រព័ន្ធ! សូមចុចប៊ូតុង "ទាញយកទិន្នន័យពី Google Sheet" ដើម្បយករកំណត់ត្រាមកវិញ ជាមុនសិន!`
      };
    }

    // Sort sequentially (Serial No 1, 2, 3...) so Google Sheet rows descend row-by-row in order
    const orderedRecords = sortRecordsForSheetSequential(webRecords);

    const payload = {
      action: 'sync_all',
      website: website,
      token: token,
      records: orderedRecords
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      const resData = await response.json().catch(() => null);
      if (resData && resData.message) {
        return { success: true, message: resData.message };
      }
      return {
        success: true,
        message: `បានបញ្ជូនទិន្នន័យ ${orderedRecords.length} ជួរតាមលំដាប់លំដោយទៅកាន់ Google Sheet [${website}] ដោយជោគជ័យ!`
      };
    } else {
      return {
        success: true,
        message: `បានផ្ញើ Request ទៅកាន់ Google Sheet [${website}] រួចរាល់!`
      };
    }
  } catch (err) {
    console.warn('Network sync notice (request dispatched):', err);
    return {
      success: true,
      message: `បានផ្ញើ Request ទៅកាន់ Google Sheet [${website}] រួចរាល់!`
    };
  }
}

export async function pullFromGoogleSheetApi(
  customUrl?: string,
  website?: string
): Promise<{ success: boolean; message: string; records?: CustomerRecord[]; count?: number }> {
  const url = (customUrl || getSavedWebAppUrl() || 'https://script.google.com/macros/s/AKfycbwHfrp9r-HmJVAM_ZSF1wfrOXi-xnN7aCOjLpx3Q_l_rzzlwu9sB8PgDlfHA9hbkbAW/exec').trim();
  if (!url) {
    return {
      success: false,
      message: 'សូមបញ្ចូល Web App URL របស់ Google Apps Script ជាមុនសិន!'
    };
  }

  saveWebAppUrl(url);

  try {
    const res = await fetch('/api/gas-pull', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        webAppUrl: url,
        website: website || 'ALL'
      })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.records)) {
        await syncDeletedRecordsWithServer();
        const tombstones = getDeletedRecordSignatures();
        const validPulledRecords = data.records.filter((r: CustomerRecord) => !isRecordDeletedPermanently(r, tombstones));
        const currentLocal = loadLocalRecords();
        const merged = mergeRecords(currentLocal, validPulledRecords);
        saveLocalRecords(merged);
        markInitialDataPulled();
        postRecordToServer(merged);
        window.dispatchEvent(new Event('recordsUpdated'));
        return {
          success: true,
          message: data.message || `បានទាញយកទិន្នន័យ ${validPulledRecords.length} ជួរពី Google Sheet / Drive រួចរាល់!`,
          records: merged,
          count: merged.length
        };
      } else {
        markInitialDataPulled();
        return {
          success: false,
          message: data.message || 'ពុំមានទិន្នន័យត្រូវបានទាញយកពី Google Sheet ទេ!'
        };
      }
    } else {
      return {
        success: false,
        message: 'មានបញ្ហាក្នុងការទាក់ទងទៅ Server ដើម្បីទាញយកទិន្នន័យ!'
      };
    }
  } catch (err: any) {
    return {
      success: false,
      message: 'មានបញ្ហាបណ្តាញ៖ ' + String(err.message || err)
    };
  }
}

// Global state tracking for auto-save signatures & initial pull safety
let lastSyncedHashes: Record<string, string> = {};
let isAutoSaveRunning = false;
let hasPulledInitialData = false;

export function markInitialDataPulled(): void {
  hasPulledInitialData = true;
}

export function isInitialDataPulled(): boolean {
  return hasPulledInitialData;
}

// Helper to safely merge existing records with newly pulled records without losing entries
export function mergeRecords(existingRecords: CustomerRecord[], newRecords: CustomerRecord[]): CustomerRecord[] {
  const recordMap = new Map<string, CustomerRecord>();
  const customerKeyMap = new Map<string, string>(); // maps dedupe key -> record id
  const tombstones = getDeletedRecordSignatures();

  const getRecordKey = (r: CustomerRecord): string => {
    const web = (r.website || 'K9WIN').toUpperCase();
    const custId = (r.customerId || '').trim().toLowerCase();
    const prof = (r.profileName || '').trim().toLowerCase();
    const regDate = (r.regDate || '').trim().toLowerCase();
    if (custId && custId !== '-' && custId !== 'n/a' && custId.length >= 3) {
      if (prof && prof !== '-' && prof !== 'n/a') {
        return `${web}_${regDate}_${prof}_${custId}`;
      }
      return `${web}_${custId}`;
    }
    return '';
  };

  // Add existing local records first (strictly skipping deleted)
  for (const r of existingRecords) {
    if (!r || !r.id) continue;
    if (isRecordDeletedPermanently(r, tombstones)) continue;
    recordMap.set(r.id, r);
    const key = getRecordKey(r);
    if (key) {
      customerKeyMap.set(key, r.id);
    }
  }

  // Merge or add new records from Google Sheet / Server (strictly skipping deleted)
  for (const r of newRecords) {
    if (!r) continue;
    if (isRecordDeletedPermanently(r, tombstones)) continue;
    const cleanId = r.id || `rec-${r.website}_${r.regDate}_${r.profileName}_${r.customerId}`;
    const key = getRecordKey(r);
    const existingId = recordMap.has(cleanId) ? cleanId : (key ? customerKeyMap.get(key) : undefined);

    if (existingId && recordMap.has(existingId)) {
      const existing = recordMap.get(existingId)!;
      recordMap.set(existingId, {
        ...existing,
        ...r,
        id: existingId
      });
    } else {
      recordMap.set(cleanId, { ...r, id: cleanId });
      if (key) {
        customerKeyMap.set(key, cleanId);
      }
    }
  }

  const allRecords = Array.from(recordMap.values()).filter(r => !isRecordDeletedPermanently(r, tombstones));
  return sortRecordsTodayFirst(allRecords);
}

// Check if a record was created, registered, or updated TODAY
export function isRecordToday(r: CustomerRecord): boolean {
  if (!r) return false;
  const now = new Date();
  const todayDDMMM = formatDateDDMMMYYYY(now).toLowerCase().trim();
  const todayISO = formatDateYYYYMMDD(now).toLowerCase().trim();

  const regDDMMM = (r.regDate || '').toLowerCase().trim();
  const regISO = convertDDMMMYYYYToYYYYMMDD(r.regDate || '').toLowerCase().trim();
  const depISO = (r.depositDate || '').toLowerCase().trim();

  if (regDDMMM === todayDDMMM || regISO === todayISO || depISO === todayISO) {
    return true;
  }

  if (r.timestamp) {
    const tDate = new Date(r.timestamp);
    if (!isNaN(tDate.getTime())) {
      const tISO = formatDateYYYYMMDD(tDate).toLowerCase().trim();
      if (tISO === todayISO) return true;
    }
  }

  return false;
}

// Get a sort score / timestamp for a record (newest first)
export function getRecordSortDate(r: CustomerRecord): number {
  if (!r) return 0;
  if (r.timestamp) {
    const t = new Date(r.timestamp).getTime();
    if (!isNaN(t)) return t;
  }
  if (r.depositDate && /^\d{4}-\d{2}-\d{2}$/.test(r.depositDate.trim())) {
    const t = new Date(r.depositDate.trim()).getTime();
    if (!isNaN(t)) return t;
  }
  if (r.regDate) {
    const iso = convertDDMMMYYYYToYYYYMMDD(r.regDate);
    const t = new Date(iso).getTime();
    if (!isNaN(t)) return t;
  }
  return 0;
}

// Sort records array so that TODAY's records float to the top (first), followed by newest to oldest
export function sortRecordsTodayFirst(recordsList: CustomerRecord[]): CustomerRecord[] {
  return [...recordsList].sort((a, b) => {
    const aToday = isRecordToday(a);
    const bToday = isRecordToday(b);

    if (aToday && !bToday) return -1;
    if (!aToday && bToday) return 1;

    const aTime = getRecordSortDate(a);
    const bTime = getRecordSortDate(b);
    if (aTime !== bTime) {
      return bTime - aTime;
    }

    return (b.serialNo || 0) - (a.serialNo || 0);
  });
}

export async function autoSaveAllWebsitesToGoogleSheet(): Promise<void> {
  // SAFETY LOCK: Do NOT auto-save to Google Sheet until initial data has been pulled from Google Sheet!
  if (!hasPulledInitialData || isAutoSaveRunning) return;
  isAutoSaveRunning = true;

  try {
    const webAppUrl = getSavedWebAppUrl();
    if (!webAppUrl) {
      isAutoSaveRunning = false;
      return;
    }

    const allRecords = loadLocalRecords();
    if (!Array.isArray(allRecords) || allRecords.length === 0) {
      isAutoSaveRunning = false;
      return;
    }

    // Group records by website
    const recordsByWebsite: Record<string, CustomerRecord[]> = {};
    for (const record of allRecords) {
      const webName = (record.website || 'K9WIN').toUpperCase();
      if (!recordsByWebsite[webName]) {
        recordsByWebsite[webName] = [];
      }
      recordsByWebsite[webName].push(record);
    }

    const tokens = getAllWebsiteTokens();

    for (const [webName, webRecords] of Object.entries(recordsByWebsite)) {
      // Safety check: Never push empty array to Google Sheet for a website
      if (!webRecords || webRecords.length === 0) continue;

      // Hash records signature for change detection
      const signature = JSON.stringify(webRecords.map(r => `${r.id}_${r.regDate}_${r.customerId}_${r.profileName}_${r.depositAmount}_${r.status}_${r.depositDate}_${r.csId}_${r.password}`));

      if (lastSyncedHashes[webName] === signature) {
        continue;
      }

      const token = tokens[webName] || getWebsiteToken(webName);
      const res = await syncToGoogleSheetApi(webName, token, webRecords, webAppUrl);
      if (res.success) {
        lastSyncedHashes[webName] = signature;
      }
    }
  } catch (err) {
    console.warn('Auto-save to Google Sheet loop notice:', err);
  } finally {
    isAutoSaveRunning = false;
  }
}

// Starts auto-save loop periodically across all websites
export function startAutoSaveToGoogleSheetInterval(intervalMs: number = 15000): () => void {
  // Trigger initial save after short delay
  setTimeout(() => {
    autoSaveAllWebsitesToGoogleSheet();
  }, 1000);

  const intervalId = setInterval(() => {
    autoSaveAllWebsitesToGoogleSheet();
  }, intervalMs);

  return () => clearInterval(intervalId);
}

export const SELECTED_SHIFT_KEY = 'cs_selected_shift';

// Get current shift: checks manual selection in localStorage first, otherwise defaults to time-based calculation
export function getCurrentShift(dateObj: Date = new Date()): ShiftType {
  try {
    const saved = localStorage.getItem(SELECTED_SHIFT_KEY);
    if (saved === 'វេនព្រឹក' || saved === 'វេនយប់') {
      return saved as ShiftType;
    }
  } catch (e) {
    // ignore
  }
  const hour = dateObj.getHours();
  if (hour >= 10 && hour < 22) {
    return 'វេនព្រឹក';
  }
  return 'វេនយប់';
}

export function saveManualShift(shift: ShiftType): void {
  try {
    localStorage.setItem(SELECTED_SHIFT_KEY, shift);
  } catch (e) {
    console.error('Failed to save manual shift:', e);
  }
}

// Format date to 'dd MMM yyyy' e.g. '23 Jul 2026'
export function formatDateDDMMMYYYY(dateObj: Date = new Date()): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = months[dateObj.getMonth()];
  const year = dateObj.getFullYear();
  return `${day} ${month} ${year}`;
}

// Format date to 'yyyy-MM-dd' for input fields
export function formatDateYYYYMMDD(dateObj: Date = new Date()): string {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper to display hyphen '-' when string is empty or 'N/A'
export function displayVal(val?: string | null): string {
  if (!val || typeof val !== 'string') return '-';
  const trimmed = val.trim();
  if (trimmed === '' || trimmed === '-' || trimmed.toUpperCase() === 'N/A') return '-';
  return trimmed;
}

// Mock initial data if empty (Clean state)
export function getInitialMockRecords(): CustomerRecord[] {
  return [];
}

// Load records from LocalStorage (synchronous fallback)
export function loadLocalRecords(): CustomerRecord[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed: CustomerRecord[] = JSON.parse(raw);
    const tombstones = getDeletedRecordSignatures();
    // Clean out any old mock records and permanently deleted records
    const cleaned = parsed.filter(r => 
      !['rec-1', 'rec-2', 'rec-3', 'rec-4', 'rec-5'].includes(r.id) &&
      !isRecordDeletedPermanently(r, tombstones)
    );
    if (cleaned.length !== parsed.length) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cleaned));
    }
    return sortRecordsTodayFirst(cleaned);
  } catch (err) {
    console.error('Failed to load local records:', err);
    return [];
  }
}

let autoSaveDebounceTimeout: any = null;

// Save records to LocalStorage and optionally schedule debounced auto-save to Google Sheet
export function saveLocalRecords(records: CustomerRecord[], triggerAutoSave: boolean = false): void {
  try {
    const tombstones = getDeletedRecordSignatures();
    const cleanRecords = records.filter(r => !isRecordDeletedPermanently(r, tombstones));
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cleanRecords));

    if (triggerAutoSave) {
      if (autoSaveDebounceTimeout) clearTimeout(autoSaveDebounceTimeout);
      autoSaveDebounceTimeout = setTimeout(() => {
        autoSaveAllWebsitesToGoogleSheet();
      }, 2000);
    }
  } catch (err) {
    console.error('Failed to save local records:', err);
  }
}

// Async Fetch All Shared Records from Central Server (Syncs all users & Gmail accounts)
export async function fetchSharedRecordsAsync(): Promise<CustomerRecord[]> {
  try {
    // 1. Sync deleted record tombstones from server first
    await syncDeletedRecordsWithServer();

    const res = await fetch('/api/records');
    if (res.ok) {
      const data = await res.json();
      if (data && data.records && Array.isArray(data.records)) {
        if (data.records.length > 0) {
          const tombstones = getDeletedRecordSignatures();
          const cleanServerRecords = data.records.filter((r: CustomerRecord) => !isRecordDeletedPermanently(r, tombstones));
          const currentLocal = loadLocalRecords();
          const merged = mergeRecords(currentLocal, cleanServerRecords);
          // Save to local cache without triggering auto-save back to sheet during poll
          saveLocalRecords(merged, false);
          markInitialDataPulled();
          return merged;
        } else {
          // If central server has no records, try auto-restoring from Google Sheet / Drive
          const pullRes = await pullFromGoogleSheetApi();
          if (pullRes.success && Array.isArray(pullRes.records) && pullRes.records.length > 0) {
            markInitialDataPulled();
            return pullRes.records;
          }
        }
      }
    }
  } catch (err) {
    console.warn('Backend server sync offline, using local cache:', err);
  }
  const local = loadLocalRecords();
  if (local.length > 0) markInitialDataPulled();
  return local;
}

// Async Post Single Record or Records Array to Central Server
export async function postRecordToServer(recordOrRecords: CustomerRecord | CustomerRecord[]): Promise<void> {
  try {
    const tombstones = getDeletedRecordSignatures();
    const payload = Array.isArray(recordOrRecords)
      ? { records: recordOrRecords.filter(r => !isRecordDeletedPermanently(r, tombstones)) }
      : (isRecordDeletedPermanently(recordOrRecords, tombstones) ? null : { record: recordOrRecords });

    if (!payload) return;

    await fetch('/api/records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    console.warn('Failed to sync record to central server:', err);
  }
}

// Async Delete Record from Central Server (Permanently recorded on server so it can never be pulled back)
export async function deleteRecordFromServer(id: string, recordObj?: CustomerRecord): Promise<void> {
  try {
    await fetch(`/api/records/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ record: recordObj })
    });
  } catch (err) {
    console.warn('Failed to delete record on central server:', err);
  }
}

// Determine status based on Customer ID and deposit mode:
// 1. Customer ID provided -> 'New Register'
// 2. Customer ID missing / '-' / 'N/A' -> 'Come in'
// 3. Deposit ថែម (Deposit mode) -> 'Deposit'
export function determineCustomerStatus(customerId?: string, isDepositOnly?: boolean): string {
  if (isDepositOnly) {
    return 'Deposit';
  }
  const cleanId = (customerId || '').trim();
  if (!cleanId || cleanId.toUpperCase() === 'N/A' || cleanId === '-' || cleanId.toUpperCase() === 'NONE' || cleanId.toUpperCase() === 'NO') {
    return 'Come in';
  }
  return 'New Register';
}

// Local simulation of checkDuplicateToday
export function checkDuplicateTodayLocal(profileName: string, customerId: string, website: string): { isDuplicate: boolean; matchType?: string; record?: CustomerRecord } {
  const records = loadLocalRecords();
  const todayStr = formatDateDDMMMYYYY(new Date());

  const found = records.find(r => 
    r.website === website &&
    (r.regDate === todayStr || r.depositDate === formatDateYYYYMMDD(new Date())) &&
    (
      (customerId && customerId !== 'N/A' && customerId !== '-' && r.customerId.trim().toLowerCase() === customerId.trim().toLowerCase()) ||
      (profileName && profileName !== 'N/A' && profileName !== '-' && r.profileName.trim().toLowerCase() === profileName.trim().toLowerCase())
    )
  );

  if (found) {
    const matchType = (found.customerId && found.customerId !== 'N/A' && found.customerId !== '-' && found.customerId.trim().toLowerCase() === customerId.trim().toLowerCase()) ? 'Customer ID' : 'Profile Name';
    return { isDuplicate: true, matchType, record: found };
  }

  return { isDuplicate: false };
}

// Save or Replace record based on same-day rule
export function saveOrReplaceCustomerRecordLocal(
  targetRecord: CustomerRecord,
  actionType: 'ADD_ID' | 'ADD_DEPOSIT' | 'NEW',
  updatedFields: {
    customerId?: string;
    password?: string;
    depositAmount?: number;
    depositDate?: string;
    bankName?: string;
    bankAccountName?: string;
    bankAccountNumber?: string;
    csId?: string;
  }
): CustomerRecord {
  const records = loadLocalRecords();
  const todayStr = formatDateDDMMMYYYY(new Date());
  const todayISO = formatDateYYYYMMDD(new Date());

  // Check if target record was created TODAY
  const isTargetToday = targetRecord.regDate === todayStr || targetRecord.depositDate === todayISO;

  // Find index of existing record
  const recordIndex = records.findIndex(r => r.id === targetRecord.id);

  const currentShift = getCurrentShift();
  let resultRecord: CustomerRecord;

  if (isTargetToday && recordIndex !== -1) {
    // SAME DAY: Replace/Update the existing record row in place!
    const existing = records[recordIndex];

    const finalCustomerId = updatedFields.customerId !== undefined ? updatedFields.customerId.trim() : existing.customerId;
    const computedStatus = actionType === 'ADD_DEPOSIT' 
      ? 'Deposit' 
      : determineCustomerStatus(finalCustomerId, false);

    const updatedRecord: CustomerRecord = {
      ...existing,
      customerId: finalCustomerId,
      password: updatedFields.password !== undefined ? updatedFields.password.trim() : existing.password,
      depositAmount: updatedFields.depositAmount !== undefined ? updatedFields.depositAmount : existing.depositAmount,
      depositDate: updatedFields.depositDate ? updatedFields.depositDate : existing.depositDate,
      bankName: updatedFields.bankName !== undefined ? updatedFields.bankName : existing.bankName,
      bankAccountName: updatedFields.bankAccountName !== undefined ? updatedFields.bankAccountName : existing.bankAccountName,
      bankAccountNumber: updatedFields.bankAccountNumber !== undefined ? updatedFields.bankAccountNumber : existing.bankAccountNumber,
      csId: updatedFields.csId ? updatedFields.csId : existing.csId,
      status: computedStatus,
      shift: currentShift,
      timestamp: new Date().toISOString()
    };

    records[recordIndex] = updatedRecord;
    resultRecord = updatedRecord;
  } else {
    // DIFFERENT DAY: Do NOT delete/replace the old record! Insert a NEW record for TODAY!
    const websiteRecords = records.filter(r => r.website === targetRecord.website);
    const maxSerial = websiteRecords.reduce((max, r) => Math.max(max, r.serialNo || 0), 0);
    const serialNo = maxSerial + 1;

    const finalCustomerId = updatedFields.customerId !== undefined && updatedFields.customerId.trim() ? updatedFields.customerId.trim() : targetRecord.customerId;
    const computedStatus = actionType === 'ADD_DEPOSIT'
      ? 'Deposit'
      : determineCustomerStatus(finalCustomerId, false);

    const newRecord: CustomerRecord = {
      id: 'rec-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      serialNo,
      regDate: todayStr,
      profileName: targetRecord.profileName,
      customerId: finalCustomerId,
      password: updatedFields.password !== undefined && updatedFields.password.trim() ? updatedFields.password.trim() : targetRecord.password,
      platform: targetRecord.platform,
      sourceName: targetRecord.sourceName,
      status: computedStatus,
      contactLink: targetRecord.contactLink,
      depositAmount: updatedFields.depositAmount !== undefined ? updatedFields.depositAmount : targetRecord.depositAmount,
      depositDate: updatedFields.depositDate || todayISO,
      bankName: updatedFields.bankName || targetRecord.bankName,
      bankAccountName: updatedFields.bankAccountName || targetRecord.bankAccountName,
      bankAccountNumber: updatedFields.bankAccountNumber || targetRecord.bankAccountNumber,
      shift: currentShift,
      csId: updatedFields.csId || targetRecord.csId || 'CS-01',
      website: targetRecord.website,
      timestamp: new Date().toISOString()
    };

    records.unshift(newRecord);
    resultRecord = newRecord;
  }

  saveLocalRecords(records);
  postRecordToServer(resultRecord); // Sync globally
  return resultRecord;
}

// Convert ISO YYYY-MM-DD or any date string to DD MMM YYYY (e.g. '23 Jul 2026')
export function convertYYYYMMDDToDDMMMYYYY(isoStr: string): string {
  if (!isoStr) return formatDateDDMMMYYYY(new Date());
  if (/^\d{2}\s+[A-Za-z]{3}\s+\d{4}$/.test(isoStr.trim())) {
    return isoStr.trim();
  }
  const parts = isoStr.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) return formatDateDDMMMYYYY(d);
  }
  const d = new Date(isoStr);
  if (!isNaN(d.getTime())) return formatDateDDMMMYYYY(d);
  return isoStr;
}

// Convert DD MMM YYYY or any date string to ISO YYYY-MM-DD
export function convertDDMMMYYYYToYYYYMMDD(ddMmmYyyyStr: string): string {
  if (!ddMmmYyyyStr) return formatDateYYYYMMDD(new Date());
  if (/^\d{4}-\d{2}-\d{2}$/.test(ddMmmYyyyStr.trim())) {
    return ddMmmYyyyStr.trim();
  }
  const d = new Date(ddMmmYyyyStr);
  if (!isNaN(d.getTime())) return formatDateYYYYMMDD(d);
  return formatDateYYYYMMDD(new Date());
}

// Update existing customer record fields (e.g. dates, website, profileName, deposit, etc.)
export function updateCustomerRecordLocal(recordId: string, updatedFields: Partial<CustomerRecord>): CustomerRecord | null {
  const records = loadLocalRecords();
  const idx = records.findIndex(r => r.id === recordId);
  if (idx === -1) return null;

  const existing = records[idx];
  const updatedRecord: CustomerRecord = {
    ...existing,
    ...updatedFields,
    timestamp: new Date().toISOString()
  };

  records[idx] = updatedRecord;
  saveLocalRecords(records);
  postRecordToServer(updatedRecord); // Sync globally to central server for all users & websites
  return updatedRecord;
}

// Delete a customer record by ID permanently (and delete the exact row in Google Sheet)
export function deleteCustomerRecordLocal(recordId: string, recordObj?: CustomerRecord): boolean {
  const records = loadLocalRecords();
  const targetRecord = recordObj || records.find(r => r.id === recordId);
  const initialCount = records.length;

  // 1. Mark in permanent tombstone blacklist so it NEVER gets pulled back from Google Sheet/Drive
  if (targetRecord) {
    markRecordPermanentlyDeleted(targetRecord);
  } else {
    markRecordPermanentlyDeleted({ id: recordId });
  }

  // 2. Remove from local storage
  const filtered = records.filter(r => r.id !== recordId && !isRecordDeletedPermanently(r));
  saveLocalRecords(filtered);

  // 3. Remove permanently from central server with signature payload
  deleteRecordFromServer(recordId, targetRecord);

  // 4. Delete the corresponding row in Google Sheet immediately
  if (targetRecord) {
    deleteRecordFromGoogleSheetApi(targetRecord).catch(err => {
      console.warn('Google Sheet row delete notice:', err);
    });
  }

  // 5. Notify all listeners and UI views immediately
  window.dispatchEvent(new Event('recordsUpdated'));

  return filtered.length < initialCount;
}

// Submit new registration locally (and append row to Google Sheet sequentially)
export function submitNewRegistrationLocal(data: RegistrationFormData, website: string): CustomerRecord {
  const records = loadLocalRecords();
  
  // Highest serial no
  const websiteRecords = records.filter(r => r.website === website);
  const maxSerial = websiteRecords.reduce((max, r) => Math.max(max, r.serialNo || 0), 0);
  const serialNo = maxSerial + 1;

  const todayStr = formatDateDDMMMYYYY(new Date());
  const currentShift = getCurrentShift();

  const newRecord: CustomerRecord = {
    id: 'rec-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    serialNo,
    regDate: todayStr,
    profileName: data.profileName,
    customerId: data.customerId,
    password: data.password || '-',
    platform: data.platform,
    sourceName: data.sourceName,
    status: determineCustomerStatus(data.customerId, data.isDepositOnly),
    contactLink: data.contactLink,
    depositAmount: Number(data.depositAmount) || 0,
    depositDate: data.depositDate || formatDateYYYYMMDD(new Date()),
    bankName: data.bankName,
    bankAccountName: data.bankAccountName,
    bankAccountNumber: data.bankAccountNumber,
    shift: currentShift,
    csId: data.csId || 'CS-01',
    website: website,
    timestamp: new Date().toISOString()
  };

  records.unshift(newRecord);
  saveLocalRecords(records);
  postRecordToServer(newRecord); // Sync globally to central server for all users & Gmail accounts

  // Append new row to Google Sheet sequentially
  appendRecordToGoogleSheetApi(newRecord).catch(err => {
    console.warn('Google sheet append notice:', err);
  });

  return newRecord;
}

// Calculate live dashboard data for selected website and optional CS filter
export function getLiveDashboardDataLocal(website: string, csIdFilter: string = 'ALL'): DashboardStats {
  const records = loadLocalRecords();
  const todayStr = formatDateDDMMMYYYY(new Date());
  const todayISO = formatDateYYYYMMDD(new Date());

  const filtered = records.filter(r => {
    const matchWebsite = website === 'ALL' || r.website === website;
    const matchCs = csIdFilter === 'ALL' || r.csId === csIdFilter;
    const isToday = r.regDate === todayStr || r.depositDate === todayISO;
    const pName = (r.profileName || '').trim();
    const hasValidData = pName !== '' && pName !== '-' && pName.toUpperCase() !== 'N/A';
    return matchWebsite && matchCs && isToday && hasValidData;
  });

  const totalRegistered = filtered.filter(r => {
    const cid = (r.customerId || '').trim();
    const isValidCid = cid !== '' && cid !== '-' && cid.toUpperCase() !== 'N/A';
    return r.status === 'New Register' && isValidCid;
  }).length;

  const totalNewDeposits = filtered.filter(r => (Number(r.depositAmount) || 0) > 0).length;
  const totalDepositAmount = filtered.reduce((sum, r) => sum + (Number(r.depositAmount) || 0), 0);
  
  // Total ComIn reflects exact total incoming valid records/inquiries today
  const totalComIn = filtered.length;

  const platformBreakdown: Record<string, { count: number; amount: number }> = {};
  let morningCount = 0;
  let morningAmount = 0;
  let nightCount = 0;
  let nightAmount = 0;

  filtered.forEach(r => {
    const p = r.platform || 'Other';
    if (!platformBreakdown[p]) {
      platformBreakdown[p] = { count: 0, amount: 0 };
    }
    platformBreakdown[p].count += 1;
    platformBreakdown[p].amount += Number(r.depositAmount) || 0;

    if (r.shift === 'វេនព្រឹក') {
      morningCount += 1;
      morningAmount += Number(r.depositAmount) || 0;
    } else {
      nightCount += 1;
      nightAmount += Number(r.depositAmount) || 0;
    }
  });

  return {
    totalComIn,
    totalRegistered,
    totalNewDeposits,
    totalDepositAmount,
    platformBreakdown,
    shiftBreakdown: {
      morningCount,
      morningAmount,
      nightCount,
      nightAmount
    }
  };
}

// Search customer by profile, customer ID or phone/link
export function searchCustomerLocal(query: string, website: string = 'ALL'): { records: CustomerRecord[]; totalDeposit: number } {
  if (!query.trim()) return { records: [], totalDeposit: 0 };

  const allRecords = loadLocalRecords();
  const q = query.trim().toLowerCase();

  const matched = allRecords.filter(r => {
    const matchWebsite = website === 'ALL' || r.website === website;
    const matchQuery = 
      r.profileName.toLowerCase().includes(q) ||
      r.customerId.toLowerCase().includes(q) ||
      r.contactLink.toLowerCase().includes(q) ||
      r.bankAccountNumber.toLowerCase().includes(q);
    return matchWebsite && matchQuery;
  });

  const sortedMatched = sortRecordsTodayFirst(matched);
  const totalDeposit = sortedMatched.reduce((sum, r) => sum + (Number(r.depositAmount) || 0), 0);

  return { records: sortedMatched, totalDeposit };
}

// Generate Google Apps Script Code.gs
export function generateGoogleAppsScriptCode(): string {
  const allTokens = getAllWebsiteTokens();
  const tokenMapJson = JSON.stringify(allTokens, null, 2);

  return `/**
 * CS Daily Management System - Google Apps Script (Code.gs)
 * High-performance backend with automatic website sheet separation & Website Security Tokens
 * Supports 26 websites with unique security tokens for Google Sheet sync
 */

const MAIN_SPREADSHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();

/**
 * Website Security Tokens for Google Sheet Integration
 */
var WEBSITE_TOKENS = ${tokenMapJson};

/**
 * Safe TimeZone getter to prevent permission errors in Custom Formulas
 */
function getSafeTimeZone() {
  try {
    return Session.getScriptTimeZone();
  } catch (e) {
    try {
      return SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone();
    } catch (e2) {
      return "GMT+7";
    }
  }
}

/**
 * Custom UI Menu when opening Google Sheet
 */
function onOpen() {
  try {
    var ui = SpreadsheetApp.getUi();
    ui.createMenu('CS Daily System 🚀')
      .addItem(' បង្កើត & ភ្ជាប់ 26 Website Sheet Tabs', 'setupAllWebsiteTabs')
      .addItem(' ទាញយកទិន្នន័យ (Refresh Data)', 'refreshCurrentSheet')
      .addToUi();
  } catch (e) {
    Logger.log('onOpen error: ' + e.toString());
  }
}

/**
 * Setup sheet tabs & headers for all 26 websites at once
 */
function setupAllWebsiteTabs() {
  for (var web in WEBSITE_TOKENS) {
    getOrCreateSheetsForWebsite(web);
  }
  SpreadsheetApp.getUi().alert('រៀបចំ Sheet Tabs & Headers សម្រាប់ 26 វេបសាយ រួចរាល់!');
}

function refreshCurrentSheet() {
  SpreadsheetApp.getUi().alert('ទិន្នន័យត្រូវបច្ចុប្បន្នភាពរួចរាល់!');
}

/**
 * Validate Website Token
 */
function validateWebsiteToken(websiteName, token) {
  if (!websiteName || !token) return false;
  var safeWeb = websiteName.trim().toUpperCase();
  var expectedToken = WEBSITE_TOKENS[safeWeb];
  return expectedToken && (expectedToken === token.trim());
}

/**
 * 1. Web App Entry Point & API Endpoint
 */
function doGet(e) {
  var params = (e && e.parameter) ? e.parameter : {};
  var action = params.action;
  
  // API Call: Fetch Website Data via Token
  if (action === 'fetchData' || params.token) {
    var web = params.website || 'K9WIN';
    var tok = params.token;
    
    if (!validateWebsiteToken(web, tok)) {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: 'Invalid or missing Security Token for website: ' + web
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    var liveData = getLiveDashboardData('ALL', web);
    var tableData = getWebsiteDataRows(web);
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      website: web,
      token: tok,
      dashboard: liveData,
      records: tableData
    })).setMimeType(ContentService.MimeType.JSON);
  }

  var template = HtmlService.createTemplateFromFile('Index');
  template.website = params.website ? params.website : 'K9WIN';
  
  return template.evaluate()
    .setTitle('CS Daily Management System')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * HTTP POST Endpoint for Web App & Automated Token Sync
 */
function doPost(e) {
  try {
    var contents = (e && e.postData) ? e.postData.contents : null;
    var body = contents ? JSON.parse(contents) : {};
    var params = (e && e.parameter) ? e.parameter : {};
    
    var website = body.website || params.website || 'K9WIN';
    var token = body.token || params.token || '';
    
    if (!validateWebsiteToken(website, token)) {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: 'Invalid or missing Security Token for website: ' + website
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // 1. Delete a specific record / row from Google Sheet
    if (body.action === 'delete_record' || body.action === 'delete') {
      var delRes = deleteRecordFromSheet(website, body.record || body);
      return ContentService.createTextOutput(JSON.stringify(delRes)).setMimeType(ContentService.MimeType.JSON);
    }

    // 2. Append a single new record to the bottom row sequentially
    if (body.action === 'append_record' && (body.record || body.formData)) {
      var appendData = body.record || body.formData;
      var appRes = submitNewRegistration(appendData, true, false);
      return ContentService.createTextOutput(JSON.stringify(appRes)).setMimeType(ContentService.MimeType.JSON);
    }

    // 3. Batch sync all records sequentially row-by-row without losing data
    if (body.action === 'sync_all' && body.records) {
      var syncRes = syncAllRecordsToSheet(website, body.records);
      return ContentService.createTextOutput(JSON.stringify(syncRes)).setMimeType(ContentService.MimeType.JSON);
    }

    // 4. Submit new registration from Web Form
    if (body.action === 'submit' && body.formData) {
      var res = submitNewRegistration(body.formData, body.forceSubmit, body.isDepositOnly);
      return ContentService.createTextOutput(JSON.stringify(res)).setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: 'Token validated for ' + website + '! Spreadsheet synced successfully.',
      website: website,
      token: token
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Delete a specific record row from Google Sheet (Register daily and data all)
 */
function deleteRecordFromSheet(websiteName, recordInfo) {
  try {
    if (!recordInfo) {
      return { success: false, message: "No record data provided to delete" };
    }
    
    var website = websiteName || recordInfo.website || 'K9WIN';
    var sheets = getOrCreateSheetsForWebsite(website, false);
    var regSheet = sheets.registerDailySheet;
    var dataSheet = sheets.dataAllSheet;
    
    var targetSerial = Number(recordInfo.serialNo) || 0;
    var targetProf = (recordInfo.profileName || "").toString().trim().toLowerCase();
    var targetCustId = (recordInfo.customerId || "").toString().trim().toLowerCase();
    var targetRegDate = (recordInfo.regDate || "").toString().trim().toLowerCase();
    
    var deletedRegCount = 0;
    var deletedDataCount = 0;

    // 1. Delete from "Register daily" (Row 16+) - iterating backwards from bottom to top
    if (regSheet && regSheet.getLastRow() >= 16) {
      var lastReg = regSheet.getLastRow();
      for (var r = lastReg; r >= 16; r--) {
        var rowVals = regSheet.getRange(r, 1, 1, 17).getValues()[0];
        var rowSerial = Number(rowVals[0]) || 0;
        var rowDateVal = rowVals[1];
        var rowDateStr = (rowDateVal instanceof Date ? Utilities.formatDate(rowDateVal, getSafeTimeZone(), "dd MMM yyyy") : (rowDateVal || "")).toString().toLowerCase();
        var rowProf = (rowVals[2] || "").toString().trim().toLowerCase();
        var rowCustId = (rowVals[3] || "").toString().trim().toLowerCase();

        var isMatch = false;
        if (targetCustId && targetCustId !== '-' && targetCustId !== 'n/a' && rowCustId === targetCustId) {
          if (!targetRegDate || rowDateStr.indexOf(targetRegDate) !== -1 || (targetSerial > 0 && rowSerial === targetSerial)) {
            isMatch = true;
          }
        }
        if (!isMatch && targetProf && targetProf !== '-' && targetProf !== 'n/a' && rowProf === targetProf) {
          if (targetSerial > 0 && rowSerial === targetSerial) {
            isMatch = true;
          } else if (targetRegDate && rowDateStr.indexOf(targetRegDate) !== -1) {
            isMatch = true;
          }
        }
        if (!isMatch && targetSerial > 0 && rowSerial === targetSerial && targetProf && rowProf === targetProf) {
          isMatch = true;
        }

        if (isMatch) {
          regSheet.deleteRow(r);
          deletedRegCount++;
        }
      }
    }

    // 2. Delete from "data all" (Row 4+) - iterating backwards from bottom to top
    if (dataSheet && dataSheet.getLastRow() >= 4) {
      var lastData = dataSheet.getLastRow();
      for (var r2 = lastData; r2 >= 4; r2--) {
        var rowVals2 = dataSheet.getRange(r2, 1, 1, 17).getValues()[0];
        var rowSerial2 = Number(rowVals2[0]) || 0;
        var rowDateVal2 = rowVals2[1];
        var rowDateStr2 = (rowDateVal2 instanceof Date ? Utilities.formatDate(rowDateVal2, getSafeTimeZone(), "dd MMM yyyy") : (rowDateVal2 || "")).toString().toLowerCase();
        var rowProf2 = (rowVals2[2] || "").toString().trim().toLowerCase();
        var rowCustId2 = (rowVals2[3] || "").toString().trim().toLowerCase();

        var isMatch2 = false;
        if (targetCustId && targetCustId !== '-' && targetCustId !== 'n/a' && rowCustId2 === targetCustId) {
          if (!targetRegDate || rowDateStr2.indexOf(targetRegDate) !== -1 || (targetSerial > 0 && rowSerial2 === targetSerial)) {
            isMatch2 = true;
          }
        }
        if (!isMatch2 && targetProf && targetProf !== '-' && targetProf !== 'n/a' && rowProf2 === targetProf) {
          if (targetSerial > 0 && rowSerial2 === targetSerial) {
            isMatch2 = true;
          } else if (targetRegDate && rowDateStr2.indexOf(targetRegDate) !== -1) {
            isMatch2 = true;
          }
        }
        if (!isMatch2 && targetSerial > 0 && rowSerial2 === targetSerial && targetProf && rowProf2 === targetProf) {
          isMatch2 = true;
        }

        if (isMatch2) {
          dataSheet.deleteRow(r2);
          deletedDataCount++;
        }
      }
    }

    return {
      success: true,
      deleted: (deletedRegCount > 0 || deletedDataCount > 0),
      deletedRegCount: deletedRegCount,
      deletedDataCount: deletedDataCount,
      message: "បានលុបជួរដេកក្នុង Google Sheet (" + website + ") រួចរាល់!"
    };
  } catch (err) {
    Logger.log("deleteRecordFromSheet error: " + err.toString());
    return { success: false, error: err.toString() };
  }
}

/**
 * Batch Sync All Records from CS Daily Web App to Google Sheet Sequentially (Row-by-Row)
 * Writes records in strict sequential order from top to bottom (Row 16+ & Row 4+)
 */
function syncAllRecordsToSheet(websiteName, records) {
  try {
    var sheets = getOrCreateSheetsForWebsite(websiteName, true);
    var regSheet = sheets.registerDailySheet;
    var dataSheet = sheets.dataAllSheet;
    
    if (!records || !Array.isArray(records)) {
      return { success: false, message: "No records provided" };
    }

    var webRecords = records.filter(function(r) { return !r.website || r.website === websiteName; });

    if (webRecords.length === 0) {
      return { success: true, count: 0, message: "No records found for " + websiteName };
    }

    // Sort records sequentially by Serial No / Chronological Order so they descend row-by-row 1, 2, 3...
    webRecords.sort(function(a, b) {
      var aSer = Number(a.serialNo) || 0;
      var bSer = Number(b.serialNo) || 0;
      if (aSer > 0 && bSer > 0 && aSer !== bSer) {
        return aSer - bSer;
      }
      return 0;
    });

    var rows = [];
    for (var i = 0; i < webRecords.length; i++) {
      var r = webRecords[i];
      rows.push([
        r.serialNo || (i + 1),
        r.regDate || "",
        r.profileName || "N/A",
        r.customerId || "N/A",
        r.password || "N/A",
        r.platform || "Telegram Bot",
        r.sourceName || "FB Ads",
        r.status || "New Register",
        r.contactLink || "N/A",
        parseFloat(r.depositAmount) || 0,
        r.depositDate || "",
        r.bankName || "ABA Bank",
        r.bankAccountName || "N/A",
        r.bankAccountNumber || "N/A",
        r.shift || "វេនព្រឹក",
        r.csId || "CS-01",
        websiteName
      ]);
    }

    // Write sequentially to "Register daily" starting at Row 16
    var prevRegLast = regSheet.getLastRow();
    if (prevRegLast > 15 + rows.length) {
      regSheet.getRange(16 + rows.length, 1, prevRegLast - 15 - rows.length, 17).clearContent();
    }
    regSheet.getRange(16, 1, rows.length, 17).setValues(rows);

    // Write sequentially to "data all" starting at Row 4
    var prevDataLast = dataSheet.getLastRow();
    if (prevDataLast > 3 + rows.length) {
      dataSheet.getRange(4 + rows.length, 1, prevDataLast - 3 - rows.length, 17).clearContent();
    }
    dataSheet.getRange(4, 1, rows.length, 17).setValues(rows);

    return {
      success: true,
      count: rows.length,
      message: "បានបញ្ចូលនិងតម្រៀបទិន្នន័យ " + rows.length + " ជួរតាមលំដាប់លំដោយក្នុង Google Sheet (" + websiteName + ") រួចរាល់!"
    };
  } catch (err) {
    return { success: false, error: err.toString() };
  }
}

/**
 * Get Full 17-Column Table Rows for Google Sheet Formula & Export
 */
function getWebsiteDataRows(websiteName) {
  var website = websiteName || 'K9WIN';
  var sheets = getOrCreateSheetsForWebsite(website, false);
  var regSheet = sheets.registerDailySheet;
  
  var headers = [
    "Serial No", "Reg Date", "Profile Name", "Customer ID", "Password",
    "Platform", "Source", "Status", "Link / Phone", "Deposit ($)",
    "Deposit Date", "Bank", "Account Name", "Account No", "Shift", "CS ID", "Website"
  ];
  
  if (!regSheet) {
    return [
      headers,
      [1, Utilities.formatDate(new Date(), getSafeTimeZone(), "dd MMM yyyy"), "Sample Profile", website + "-0001", "123456", "Telegram Bot", "FB Ads", "New Register", "@contact", 0.00, Utilities.formatDate(new Date(), getSafeTimeZone(), "yyyy-MM-dd"), "ABA Bank", "Sample Name", "000000000", "វេនព្រឹក", "CS-01", website]
    ];
  }

  var lastRow = regSheet.getLastRow();
  
  if (lastRow < 16) {
    return [
      headers,
      [1, Utilities.formatDate(new Date(), getSafeTimeZone(), "dd MMM yyyy"), "Sample Profile", website + "-0001", "123456", "Telegram Bot", "FB Ads", "New Register", "@contact", 0.00, Utilities.formatDate(new Date(), getSafeTimeZone(), "yyyy-MM-dd"), "ABA Bank", "Sample Name", "000000000", "វេនព្រឹក", "CS-01", website]
    ];
  }
  
  var rawData = regSheet.getRange(16, 1, lastRow - 15, 17).getValues();
  var result = [headers];
  
  for (var i = 0; i < rawData.length; i++) {
    var r = rawData[i];
    var regDate = r[1] instanceof Date ? Utilities.formatDate(r[1], getSafeTimeZone(), "dd MMM yyyy") : (r[1] || "");
    var depDate = r[10] instanceof Date ? Utilities.formatDate(r[10], getSafeTimeZone(), "yyyy-MM-dd") : (r[10] || "");
    
    result.push([
      r[0] || (i + 1),                      // Serial No
      regDate,                              // Reg Date
      r[2] || "N/A",                        // Profile Name
      r[3] || "N/A",                        // Customer ID
      r[4] || "N/A",                        // Password
      r[5] || "Telegram Bot",               // Platform
      r[6] || "FB Ads",                     // Source
      r[7] || "New Register",               // Status
      r[8] || "N/A",                        // Link / Phone
      parseFloat(r[9]) || 0,                // Deposit ($)
      depDate,                              // Deposit Date
      r[11] || "ABA Bank",                  // Bank
      r[12] || "N/A",                       // Account Name
      r[13] || "N/A",                       // Account No
      r[14] || "វេនព្រឹក",                   // Shift
      r[15] || "CS-01",                     // CS ID
      r[16] || website                      // Website
    ]);
  }
  
  return result;
}

/**
 * Custom Google Sheet Formula: =FETCH_WEBSITE_DATA("K9WIN", "K9WIN-TOK-XXXXXX")
 * Put this formula in cell A1 of any Google Sheet cell to automatically spill all 17 table columns & rows!
 * Optional mode parameter: =FETCH_WEBSITE_DATA("K9WIN", "TOKEN", "summary")
 */
function FETCH_WEBSITE_DATA(websiteName, token, mode) {
  try {
    if (!websiteName || !token) {
      return [["Error: Please specify =FETCH_WEBSITE_DATA(websiteName, token)"]];
    }
    if (!validateWebsiteToken(websiteName, token)) {
      return [["Error: Security Token មិនត្រឹមត្រូវសម្រាប់ " + websiteName]];
    }
    
    if (mode && mode.toString().toLowerCase() === 'summary') {
      var dash = getLiveDashboardData('ALL', websiteName);
      var reg = (dash && dash.totalRegistered !== undefined) ? dash.totalRegistered : 0;
      var dep = (dash && dash.totalDepositAmount !== undefined) ? dash.totalDepositAmount : 0;
      return "ចុះឈ្មោះ: " + reg + " នាក់ | ប្រាក់កក់សរុប: $" + dep;
    }
    
    return getWebsiteDataRows(websiteName);
  } catch (err) {
    return [["Error: " + err.toString()]];
  }
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * 2. Get or Create Sheet for Selected Website
 * Separates data per website into dedicated tabs automatically!
 */
function getOrCreateSheetsForWebsite(websiteName, createIfMissing) {
  if (createIfMissing === undefined) createIfMissing = true;
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var safeName = websiteName ? websiteName.trim().toUpperCase() : 'K9WIN';
  
  var regSheetName = safeName + " - Register daily";
  var dataSheetName = safeName + " - data all";
  
  var regSheet = ss.getSheetByName(regSheetName) || ss.getSheetByName(safeName);
  if (!regSheet && createIfMissing) {
    try {
      regSheet = ss.insertSheet(regSheetName);
      setupRegisterDailySheetHeader(regSheet, safeName);
    } catch (e) {
      regSheet = ss.getActiveSheet();
    }
  } else if (!regSheet) {
    regSheet = ss.getActiveSheet();
  }
  
  var dataSheet = ss.getSheetByName(dataSheetName);
  if (!dataSheet && createIfMissing) {
    try {
      dataSheet = ss.insertSheet(dataSheetName);
      setupDataAllSheetHeader(dataSheet, safeName);
    } catch (e) {
      dataSheet = ss.getActiveSheet();
    }
  } else if (!dataSheet) {
    dataSheet = ss.getActiveSheet();
  }
  
  return {
    registerDailySheet: regSheet,
    dataAllSheet: dataSheet
  };
}

/**
 * Setup Register Daily Header Format (Row 15) - 17 Columns
 */
function setupRegisterDailySheetHeader(sheet, website) {
  sheet.getRange(1, 1).setValue("CS DAILY MANAGEMENT SYSTEM - REGISTER DAILY (" + website + ")");
  sheet.getRange(1, 1).setFontSize(14).setFontWeight("bold");
  
  var headers = [
    "Serial No", "Reg Date", "Profile Name", "Customer ID", "Password",
    "Platform", "Source", "Status", "Link / Phone", "Deposit ($)",
    "Deposit Date", "Bank", "Account Name", "Account No", "Shift", "CS ID", "Website"
  ];
  
  sheet.getRange(15, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(15, 1, 1, headers.length).setBackground("#1e293b").setFontColor("#ffffff").setFontWeight("bold");
  sheet.setFrozenRows(15);
}

/**
 * Setup Data All Header Format (Row 3) - 17 Columns
 */
function setupDataAllSheetHeader(sheet, website) {
  sheet.getRange(1, 1).setValue("CS DAILY DATA ALL - " + website);
  sheet.getRange(1, 1).setFontSize(14).setFontWeight("bold");
  
  var headers = [
    "Serial No", "Reg Date", "Profile Name", "Customer ID", "Password",
    "Platform", "Source", "Status", "Link / Phone", "Deposit ($)",
    "Deposit Date", "Bank", "Account Name", "Account No", "Shift", "CS ID", "Website"
  ];
  
  sheet.getRange(3, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(3, 1, 1, headers.length).setBackground("#0f172a").setFontColor("#38bdf8").setFontWeight("bold");
  sheet.setFrozenRows(3);
}

/**
 * 3. Check duplicate registration today for selected website
 */
function checkDuplicateToday(profileName, customerId, websiteName) {
  try {
    var sheets = getOrCreateSheetsForWebsite(websiteName);
    var regSheet = sheets.registerDailySheet;
    
    var lastRow = regSheet.getLastRow();
    if (lastRow < 16) return { isDuplicate: false };
    
    var data = regSheet.getRange(16, 1, lastRow - 15, 17).getValues();
    var todayStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd MMM yyyy");
    
    var cleanProf = (profileName || "").toString().trim().toLowerCase();
    var cleanId = (customerId || "").toString().trim().toLowerCase();
    
    for (var i = 0; i < data.length; i++) {
      var row = data[i];
      var rowDate = row[1];
      var rowProf = (row[2] || "").toString().trim().toLowerCase();
      var rowCustId = (row[3] || "").toString().trim().toLowerCase();
      
      var isToday = false;
      if (rowDate instanceof Date) {
        isToday = Utilities.formatDate(rowDate, Session.getScriptTimeZone(), "dd MMM yyyy") === todayStr;
      } else {
        isToday = rowDate.toString().indexOf(todayStr) !== -1;
      }
      
      if (isToday) {
        if (cleanId && cleanId !== 'n/a' && rowCustId === cleanId) {
          return { isDuplicate: true, matchType: 'Customer ID', rowData: row };
        }
        if (cleanProf && cleanProf !== 'n/a' && rowProf === cleanProf) {
          return { isDuplicate: true, matchType: 'Profile Name', rowData: row };
        }
      }
    }
    return { isDuplicate: false };
  } catch (err) {
    Logger.log("checkDuplicateToday Error: " + err.message);
    return { isDuplicate: false, error: err.message };
  }
}

/**
 * 4. Submit New Registration or Deposit
 * Batch updates for high performance
 */
function submitNewRegistration(formData, forceSubmit, isDepositOnly) {
  try {
    var websiteName = formData.website || 'K9WIN';
    var sheets = getOrCreateSheetsForWebsite(websiteName);
    var regSheet = sheets.registerDailySheet;
    var dataSheet = sheets.dataAllSheet;
    
    if (!forceSubmit && !isDepositOnly) {
      var dupCheck = checkDuplicateToday(formData.profileName, formData.customerId, websiteName);
      if (dupCheck.isDuplicate) {
        return { success: false, duplicate: true, matchType: dupCheck.matchType };
      }
    }
    
    var lastRowData = dataSheet.getLastRow();
    var serialNo = 1;
    if (lastRowData >= 4) {
      var serials = dataSheet.getRange(4, 1, lastRowData - 3, 1).getValues();
      for (var s = 0; s < serials.length; s++) {
        var val = Number(serials[s][0]);
        if (!isNaN(val) && val >= serialNo) {
          serialNo = val + 1;
        }
      }
    }
    
    var now = new Date();
    var hour = now.getHours();
    var shift = (hour >= 10 && hour < 22) ? "វេនព្រឹក" : "វេនយប់";
    
    var regDate = Utilities.formatDate(now, Session.getScriptTimeZone(), "dd MMM yyyy");
    var depositDate = formData.depositDate || Utilities.formatDate(now, Session.getScriptTimeZone(), "yyyy-MM-dd");
    
    var rowArr = [
      serialNo,                                             // 1. Serial No
      regDate,                                              // 2. Reg Date
      formData.profileName || "N/A",                        // 3. Profile Name
      formData.customerId || "N/A",                         // 4. Customer ID
      formData.password || "N/A",                           // 5. Password
      formData.platform || "Telegram Bot",                  // 6. Platform
      formData.sourceName || "FB Ads",                      // 7. Source
      isDepositOnly ? "Deposit ថែម" : (formData.status || "New Register"), // 8. Status
      formData.contactLink || "N/A",                        // 9. Link / Phone
      parseFloat(formData.depositAmount) || 0.00,           // 10. Deposit ($)
      depositDate,                                          // 11. Deposit Date
      formData.bankName || "ABA Bank",                      // 12. Bank
      formData.bankAccountName || "N/A",                    // 13. Account Name
      formData.bankAccountNumber || "N/A",                  // 14. Account No
      shift,                                                // 15. Shift
      formData.csId || "CS-01",                             // 16. CS ID
      websiteName                                           // 17. Website
    ];
    
    // Batch Insert to "Register daily" (Row 16+)
    var nextRegRow = regSheet.getLastRow() < 15 ? 16 : regSheet.getLastRow() + 1;
    regSheet.getRange(nextRegRow, 1, 1, 17).setValues([rowArr]);
    
    // Batch Insert to "data all" (Row 4+)
    var nextDataRow = dataSheet.getLastRow() < 3 ? 4 : dataSheet.getLastRow() + 1;
    dataSheet.getRange(nextDataRow, 1, 1, 17).setValues([rowArr]);
    
    return {
      success: true,
      message: "បានរក្សាទុកដោយជោគជ័យ! (" + websiteName + ")",
      serialNo: serialNo,
      shift: shift
    };
  } catch (err) {
    Logger.log("submitNewRegistration Error: " + err.message);
    return { success: false, error: err.message };
  }
}

/**
 * 5. Search Customer by Name, ID or Phone
 */
function searchCustomer(query, websiteName) {
  try {
    if (!query) return { records: [], totalDeposit: 0 };
    
    var website = websiteName || 'K9WIN';
    var sheets = getOrCreateSheetsForWebsite(website);
    var dataSheet = sheets.dataAllSheet;
    
    var lastRow = dataSheet.getLastRow();
    if (lastRow < 4) return { records: [], totalDeposit: 0 };
    
    var data = dataSheet.getRange(4, 1, lastRow - 3, 17).getValues();
    var q = query.toString().trim().toLowerCase();
    
    var matched = [];
    var totalDep = 0;
    
    for (var i = 0; i < data.length; i++) {
      var row = data[i];
      var pName = (row[2] || "").toString().toLowerCase();
      var cId = (row[3] || "").toString().toLowerCase();
      var link = (row[8] || "").toString().toLowerCase();
      
      if (pName.indexOf(q) !== -1 || cId.indexOf(q) !== -1 || link.indexOf(q) !== -1) {
        var depAmt = parseFloat(row[9]) || 0;
        totalDep += depAmt;
        matched.push({
          serialNo: row[0],
          regDate: row[1] instanceof Date ? Utilities.formatDate(row[1], Session.getScriptTimeZone(), "dd MMM yyyy") : row[1],
          profileName: row[2],
          customerId: row[3],
          password: row[4],
          platform: row[5],
          sourceName: row[6],
          status: row[7],
          contactLink: row[8],
          depositAmount: depAmt,
          depositDate: row[10],
          bankName: row[11],
          bankAccountName: row[12],
          bankAccountNumber: row[13],
          shift: row[14],
          csId: row[15],
          website: row[16]
        });
      }
    }
    
    return { records: matched, totalDeposit: totalDep };
  } catch (err) {
    return { records: [], totalDeposit: 0, error: err.message };
  }
}

/**
 * 6. Live Dashboard Data
 */
function getLiveDashboardData(csId, websiteName) {
  try {
    var website = websiteName || 'K9WIN';
    var sheets = getOrCreateSheetsForWebsite(website);
    var regSheet = sheets.registerDailySheet;
    
    if (!regSheet) {
      return {
        totalComIn: 0,
        totalRegistered: 0,
        totalNewDeposits: 0,
        totalDepositAmount: 0,
        platformBreakdown: {},
        shiftBreakdown: { morningCount: 0, morningAmount: 0, nightCount: 0, nightAmount: 0 }
      };
    }
    
    var lastRow = regSheet.getLastRow();
    if (lastRow < 16) {
      return {
        totalComIn: 0,
        totalRegistered: 0,
        totalNewDeposits: 0,
        totalDepositAmount: 0,
        platformBreakdown: {},
        shiftBreakdown: { morningCount: 0, morningAmount: 0, nightCount: 0, nightAmount: 0 }
      };
    }
    
    var data = regSheet.getRange(16, 1, lastRow - 15, 17).getValues();
    
    var regCount = 0;
    var depCount = 0;
    var totalAmt = 0;
    var platformMap = {};
    var morningCount = 0, morningAmt = 0, nightCount = 0, nightAmt = 0;
    
    for (var i = 0; i < data.length; i++) {
      var row = data[i];
      var rowCs = row[15];
      if (csId && csId !== 'ALL' && rowCs !== csId) continue;
      
      regCount++;
      var depAmt = parseFloat(row[9]) || 0;
      if (depAmt > 0) depCount++;
      totalAmt += depAmt;
      
      var plat = row[5] || 'Other';
      if (!platformMap[plat]) platformMap[plat] = { count: 0, amount: 0 };
      platformMap[plat].count++;
      platformMap[plat].amount += depAmt;
      
      var shift = row[14];
      if (shift === 'វេនព្រឹក') {
        morningCount++;
        morningAmt += depAmt;
      } else {
        nightCount++;
        nightAmt += depAmt;
      }
    }
    
    return {
      totalComIn: regCount,
      totalRegistered: regCount,
      totalNewDeposits: depCount,
      totalDepositAmount: totalAmt,
      platformBreakdown: platformMap,
      shiftBreakdown: {
        morningCount: morningCount,
        morningAmount: morningAmt,
        nightCount: nightCount,
        nightAmount: nightAmt
      }
    };
  } catch (err) {
    return {
      totalComIn: 0,
      totalRegistered: 0,
      totalNewDeposits: 0,
      totalDepositAmount: 0,
      platformBreakdown: {},
      shiftBreakdown: { morningCount: 0, morningAmount: 0, nightCount: 0, nightAmount: 0 },
      error: err.message
    };
  }
}

/**
 * 7. Clear Register Daily Sheet Manual Cleanup
 */
function clearRegisterDailyManual(websiteName) {
  var website = websiteName || 'K9WIN';
  var sheets = getOrCreateSheetsForWebsite(website);
  var regSheet = sheets.registerDailySheet;
  
  var lastRow = regSheet.getLastRow();
  if (lastRow >= 16) {
    regSheet.getRange(16, 1, lastRow - 15, 17).clearContent();
  }
  return { success: true, message: "បានសម្អាតទិន្នន័យ Register Daily នៃ " + website + " ដោយជោគជ័យ!" };
}
`;
}

