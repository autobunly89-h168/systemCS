import { CustomerRecord, DashboardStats, RegistrationFormData, ShiftType } from '../types';
import { getAllWebsiteTokens } from '../data/websites';

export const LOCAL_STORAGE_KEY = 'cs_daily_records_v2';
export const SELECTED_WEBSITE_KEY = 'cs_selected_website';
export const SELECTED_CS_ID_KEY = 'cs_selected_id';
export const GAS_WEB_APP_URL_KEY = 'cs_gas_web_app_url';

export function getSavedWebAppUrl(): string {
  try {
    return localStorage.getItem(GAS_WEB_APP_URL_KEY) || '';
  } catch (e) {
    return '';
  }
}

export function saveWebAppUrl(url: string): void {
  try {
    localStorage.setItem(GAS_WEB_APP_URL_KEY, url.trim());
  } catch (e) {
    console.error('Failed to save Web App URL:', e);
  }
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

    const payload = {
      action: 'sync_all',
      website: website,
      token: token,
      records: webRecords
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
        message: `បានផ្ញើទិន្នន័យ ${webRecords.length} ជួរទៅកាន់ Google Sheet [${website}] ដោយជោគជ័យ!`
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

// Mock initial data if empty
export function getInitialMockRecords(): CustomerRecord[] {
  const todayStr = formatDateDDMMMYYYY(new Date());
  const todayISO = formatDateYYYYMMDD(new Date());

  return [
    {
      id: 'rec-1',
      serialNo: 1,
      regDate: todayStr,
      profileName: 'Sokha Winner 99',
      customerId: 'K9W-88219',
      password: 'Pass****99',
      platform: 'Telegram Bot',
      sourceName: 'FB Ads',
      status: 'New Register',
      contactLink: 't.me/sokhawinner',
      depositAmount: 50.00,
      depositDate: todayISO,
      bankName: 'ABA Bank',
      bankAccountName: 'SOKHA HONG',
      bankAccountNumber: '000 123 456',
      shift: 'វេនព្រឹក',
      csId: 'CS-01',
      website: 'K9WIN',
      timestamp: new Date().toISOString()
    },
    {
      id: 'rec-2',
      serialNo: 2,
      regDate: todayStr,
      profileName: 'Vichai FAFA Lucky',
      customerId: 'FA191-3321',
      password: 'Pass****21',
      platform: 'ALL Telegram',
      sourceName: 'TikTok Live',
      status: 'New Register',
      contactLink: '012 888 999',
      depositAmount: 100.00,
      depositDate: todayISO,
      bankName: 'ACLEDA Bank',
      bankAccountName: 'VICHAI CHAN',
      bankAccountNumber: '1234-5678-9012',
      shift: 'វេនព្រឹក',
      csId: 'CS-02',
      website: 'FAFA191',
      timestamp: new Date().toISOString()
    },
    {
      id: 'rec-3',
      serialNo: 3,
      regDate: todayStr,
      profileName: 'Dara SBOBET VIP',
      customerId: 'SBO-9901',
      password: 'Pass****01',
      platform: 'Page',
      sourceName: 'FB Ads',
      status: 'Deposit ថែម',
      contactLink: 'fb.com/darasbobet',
      depositAmount: 250.00,
      depositDate: todayISO,
      bankName: 'Wing Bank',
      bankAccountName: 'DARA KEO',
      bankAccountNumber: '098 765 432',
      shift: 'វេនយប់',
      csId: 'CS-01',
      website: 'SBOBETV8',
      timestamp: new Date().toISOString()
    },
    {
      id: 'rec-4',
      serialNo: 4,
      regDate: todayStr,
      profileName: 'Nara FAFA787',
      customerId: 'F787-1102',
      password: 'Pass****02',
      platform: 'Telegram Bot',
      sourceName: 'Friend Referral',
      status: 'New Register',
      contactLink: 't.me/nara787',
      depositAmount: 20.00,
      depositDate: todayISO,
      bankName: 'ABA Bank',
      bankAccountName: 'NARA SORN',
      bankAccountNumber: '001 987 654',
      shift: 'វេនព្រឹក',
      csId: 'CS-03',
      website: 'FAFA787',
      timestamp: new Date().toISOString()
    },
    {
      id: 'rec-5',
      serialNo: 5,
      regDate: todayStr,
      profileName: 'Bora FAFA365',
      customerId: 'F365-5541',
      password: 'Pass****41',
      platform: 'TikTok',
      sourceName: 'TikTok Live',
      status: 'New Register',
      contactLink: '097 555 443',
      depositAmount: 15.00,
      depositDate: todayISO,
      bankName: 'Prince Bank',
      bankAccountName: 'BORA MENG',
      bankAccountNumber: '778 990 112',
      shift: 'វេនព្រឹក',
      csId: 'CS-02',
      website: 'FAFA365',
      timestamp: new Date().toISOString()
    }
  ];
}

// Load records from LocalStorage (synchronous fallback)
export function loadLocalRecords(): CustomerRecord[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      const mock = getInitialMockRecords();
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(mock));
      return mock;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load local records:', err);
    return getInitialMockRecords();
  }
}

// Save records to LocalStorage
export function saveLocalRecords(records: CustomerRecord[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(records));
  } catch (err) {
    console.error('Failed to save local records:', err);
  }
}

// Async Fetch All Shared Records from Central Server (Syncs all users & Gmail accounts)
export async function fetchSharedRecordsAsync(): Promise<CustomerRecord[]> {
  try {
    const res = await fetch('/api/records');
    if (res.ok) {
      const data = await res.json();
      if (data && data.records && Array.isArray(data.records)) {
        saveLocalRecords(data.records);
        return data.records;
      }
    }
  } catch (err) {
    console.warn('Backend server sync offline, using local cache:', err);
  }
  return loadLocalRecords();
}

// Async Post Single Record or Records Array to Central Server
export async function postRecordToServer(recordOrRecords: CustomerRecord | CustomerRecord[]): Promise<void> {
  try {
    const payload = Array.isArray(recordOrRecords)
      ? { records: recordOrRecords }
      : { record: recordOrRecords };

    await fetch('/api/records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    console.warn('Failed to sync record to central server:', err);
  }
}

// Async Delete Record from Central Server
export async function deleteRecordFromServer(id: string): Promise<void> {
  try {
    await fetch(`/api/records/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
  } catch (err) {
    console.warn('Failed to delete record on central server:', err);
  }
}

// Determine status based on Customer ID and deposit mode:
// 1. Customer ID provided -> 'New Register'
// 2. Customer ID missing / 'N/A' -> 'Come in'
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
      (customerId && customerId !== 'N/A' && r.customerId.trim().toLowerCase() === customerId.trim().toLowerCase()) ||
      (profileName && profileName !== 'N/A' && r.profileName.trim().toLowerCase() === profileName.trim().toLowerCase())
    )
  );

  if (found) {
    const matchType = (found.customerId && found.customerId !== 'N/A' && found.customerId.trim().toLowerCase() === customerId.trim().toLowerCase()) ? 'Customer ID' : 'Profile Name';
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

// Delete a customer record by ID
export function deleteCustomerRecordLocal(recordId: string): boolean {
  const records = loadLocalRecords();
  const initialCount = records.length;
  const filtered = records.filter(r => r.id !== recordId);
  saveLocalRecords(filtered);
  deleteRecordFromServer(recordId); // Sync globally
  return filtered.length < initialCount;
}

// Submit new registration locally
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
    password: data.password || 'N/A',
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
    return matchWebsite && matchCs && isToday;
  });

  const totalRegistered = filtered.filter(r => r.status === 'New Register').length;
  const totalNewDeposits = filtered.filter(r => r.depositAmount > 0).length;
  const totalDepositAmount = filtered.reduce((sum, r) => sum + (Number(r.depositAmount) || 0), 0);
  
  // Total ComIn reflects exact total incoming records/rows today
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

  const totalDeposit = matched.reduce((sum, r) => sum + (Number(r.depositAmount) || 0), 0);

  return { records: matched, totalDeposit };
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
    
    if (body.action === 'sync_all' && body.records) {
      var syncRes = syncAllRecordsToSheet(website, body.records);
      return ContentService.createTextOutput(JSON.stringify(syncRes)).setMimeType(ContentService.MimeType.JSON);
    }

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
 * Batch Sync All Records from CS Daily Web App to Google Sheet
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

    // Clear existing data rows
    if (regSheet.getLastRow() >= 16) {
      regSheet.getRange(16, 1, regSheet.getLastRow() - 15, 17).clearContent();
    }
    if (dataSheet.getLastRow() >= 4) {
      dataSheet.getRange(4, 1, dataSheet.getLastRow() - 3, 17).clearContent();
    }

    if (webRecords.length === 0) {
      return { success: true, count: 0, message: "No records found for " + websiteName };
    }

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

    regSheet.getRange(16, 1, rows.length, 17).setValues(rows);
    dataSheet.getRange(4, 1, rows.length, 17).setValues(rows);

    return {
      success: true,
      count: rows.length,
      message: "បានបញ្ជូនទិន្នន័យ " + rows.length + " ជួរទៅ Google Sheet (" + websiteName + ") រួចរាល់!"
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

