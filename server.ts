import express from "express";
import path from "path";
import fs from "fs";
import nodemailer from "nodemailer";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Cloud Run / Ingress health check endpoints (must respond with 200 OK immediately)
  app.get(['/api/health', '/health'], (_req, res) => {
    res.status(200).json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
  });

  // CORS and preflight handling for custom domains, previews, and iframes
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }
    next();
  });

  app.use(express.json({ limit: '10mb' }));

  // File path for shared records across all users / Gmail accounts
  const dataDir = path.join(process.cwd(), 'data');
  const sharedDataFile = path.join(dataDir, 'shared_records.json');
  const sharedAdminsFile = path.join(dataDir, 'shared_admins.json');
  const sharedUsersFile = path.join(dataDir, 'shared_active_users.json');
  const sharedWebsitesFile = path.join(dataDir, 'shared_websites.json');
  const sharedBlockedFile = path.join(dataDir, 'shared_blocked_users.json');
  const sharedRegisteredUsersFile = path.join(dataDir, 'shared_registered_accounts.json');

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Load shared registered user accounts
  function getSharedRegisteredUsers(): Record<string, { password: string; registeredAt: string; photoUrl?: string }> {
    try {
      if (fs.existsSync(sharedRegisteredUsersFile)) {
        const raw = fs.readFileSync(sharedRegisteredUsersFile, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          return parsed;
        }
      }
    } catch (err) {
      console.error('Error reading shared_registered_accounts.json:', err);
    }
    return {
      'hongbunly89@gmail.com': { password: 'admin123', registeredAt: new Date().toISOString() }
    };
  }

  function saveSharedRegisteredUsers(users: Record<string, any>) {
    try {
      fs.writeFileSync(sharedRegisteredUsersFile, JSON.stringify(users, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error writing shared_registered_accounts.json:', err);
    }
  }

  if (!fs.existsSync(sharedRegisteredUsersFile)) {
    saveSharedRegisteredUsers(getSharedRegisteredUsers());
  }

  // Load blocked users list
  function getSharedBlockedUsers(): string[] {
    try {
      if (fs.existsSync(sharedBlockedFile)) {
        const raw = fs.readFileSync(sharedBlockedFile, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.map((e: string) => String(e).trim().toLowerCase());
        }
      }
    } catch (err) {
      console.error('Error reading shared_blocked_users.json:', err);
    }
    return [];
  }

  function saveSharedBlockedUsers(blocked: string[]) {
    try {
      fs.writeFileSync(sharedBlockedFile, JSON.stringify(blocked, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error writing shared_blocked_users.json:', err);
    }
  }

  if (!fs.existsSync(sharedBlockedFile)) {
    saveSharedBlockedUsers([]);
  }

  // Load shared websites list and custom options
  function getSharedWebsitesData() {
    try {
      if (fs.existsSync(sharedWebsitesFile)) {
        const raw = fs.readFileSync(sharedWebsitesFile, 'utf-8');
        const parsed = JSON.parse(raw);
        return {
          customWebsites: Array.isArray(parsed?.customWebsites) ? parsed.customWebsites : [],
          deletedWebsites: Array.isArray(parsed?.deletedWebsites) ? parsed.deletedWebsites : []
        };
      }
    } catch (err) {
      console.error('Error reading shared_websites.json:', err);
    }
    return { customWebsites: [], deletedWebsites: [] };
  }

  function saveSharedWebsitesData(data: { customWebsites: any[]; deletedWebsites: any[] }) {
    try {
      fs.writeFileSync(sharedWebsitesFile, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error writing shared_websites.json:', err);
    }
  }

  if (!fs.existsSync(sharedWebsitesFile)) {
    saveSharedWebsitesData(getSharedWebsitesData());
  }

  const DEFAULT_ADMINS = ['hongbunly89@gmail.com'];

  // Load shared active users (only return currently active, non-logged-out users within last 10 minutes)
  function getSharedActiveUsers(): any[] {
    try {
      if (fs.existsSync(sharedUsersFile)) {
        const raw = fs.readFileSync(sharedUsersFile, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const tenMinsAgo = Date.now() - 10 * 60 * 1000;
          // Filter out users who logged out or have been inactive for > 10 minutes
          return parsed.filter((u: any) => {
            if (u.isLoggedOut) return false;
            if (!u.lastActive) return false;
            const time = new Date(u.lastActive).getTime();
            return !isNaN(time) && time > tenMinsAgo;
          });
        }
      }
    } catch (err) {
      console.error('Error reading shared_active_users.json:', err);
    }
    return [];
  }

  // Save shared active users
  function saveSharedActiveUsers(users: any[]) {
    try {
      fs.writeFileSync(sharedUsersFile, JSON.stringify(users, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error writing shared_active_users.json:', err);
    }
  }

  if (!fs.existsSync(sharedUsersFile)) {
    saveSharedActiveUsers(getSharedActiveUsers());
  }

  // Load shared admins
  function getSharedAdmins(): string[] {
    try {
      if (fs.existsSync(sharedAdminsFile)) {
        const raw = fs.readFileSync(sharedAdminsFile, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const cleaned = parsed.map((e: string) => String(e).trim().toLowerCase());
          const superAdmin = 'hongbunly89@gmail.com';
          if (!cleaned.includes(superAdmin)) {
            cleaned.unshift(superAdmin);
          }
          return cleaned;
        }
      }
    } catch (err) {
      console.error('Error reading shared_admins.json:', err);
    }
    return DEFAULT_ADMINS;
  }

  // Save shared admins
  function saveSharedAdmins(admins: string[]) {
    try {
      fs.writeFileSync(sharedAdminsFile, JSON.stringify(admins, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error writing shared_admins.json:', err);
    }
  }

  if (!fs.existsSync(sharedAdminsFile)) {
    saveSharedAdmins(DEFAULT_ADMINS);
  }

  const sharedDataBackupFile = path.join(dataDir, 'shared_records_backup.json');
  const deletedRecordsFile = path.join(dataDir, 'deleted_records.json');

  // Load deleted record tombstones (IDs and unique composite signatures)
  function getDeletedRecordsList(): { ids: string[]; keys: string[] } {
    try {
      if (fs.existsSync(deletedRecordsFile)) {
        const raw = fs.readFileSync(deletedRecordsFile, 'utf-8');
        const parsed = JSON.parse(raw);
        const rawKeys = Array.isArray(parsed?.keys) ? parsed.keys : [];
        // Sanitize legacy keys: purge any serial numbers or keys with invalid/hyphen values
        const validKeys = rawKeys.filter((k: string) => {
          if (!k || typeof k !== 'string') return false;
          if (k.includes('_serial_') || k.includes('_serial')) return false;
          if (k.endsWith('_-_ -') || k.endsWith('_-_') || k.includes('_-')) return false;
          return true;
        });
        return {
          ids: Array.isArray(parsed?.ids) ? parsed.ids : [],
          keys: validKeys
        };
      }
    } catch (e) {
      console.error('Error reading deleted_records.json:', e);
    }
    return { ids: [], keys: [] };
  }

  // Save deleted record tombstone so it is NEVER restored or pulled back from Google Sheet/Drive
  function saveDeletedRecord(recordId: string, recordObj?: any) {
    try {
      const list = getDeletedRecordsList();
      const idSet = new Set(list.ids);
      const keySet = new Set(list.keys);

      if (recordId) idSet.add(String(recordId));
      if (recordObj) {
        if (recordObj.id) idSet.add(String(recordObj.id));
        const web = String(recordObj.website || 'K9WIN').toUpperCase();
        const regDate = String(recordObj.regDate || '').trim().toLowerCase();
        const prof = String(recordObj.profileName || '').trim().toLowerCase();
        const custId = String(recordObj.customerId || '').trim().toLowerCase();

        // ONLY record customer ID key if customerId is a real meaningful string (not '-', not 'n/a', length >= 3)
        const isRealCustId = custId && custId !== '-' && custId !== 'n/a' && custId.length >= 3;
        const isRealProf = prof && prof !== '-' && prof !== 'n/a' && prof.length >= 2;
        if (isRealCustId) {
          keySet.add(`${web}_${custId}`);
          if (isRealProf && regDate) {
            keySet.add(`${web}_${regDate}_${prof}_${custId}`);
          }
        }
        // NEVER add serialNo to keySet because serial numbers are reusable counters!
      }

      fs.writeFileSync(deletedRecordsFile, JSON.stringify({
        ids: Array.from(idSet),
        keys: Array.from(keySet)
      }, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error writing deleted_records.json:', e);
    }
  }

  // Check if a record has been marked as deleted
  function isServerRecordDeleted(r: any, deletedList?: { ids: string[]; keys: string[] }): boolean {
    if (!r) return false;
    const list = deletedList || getDeletedRecordsList();
    const idSet = new Set(list.ids);
    const keySet = new Set(list.keys);

    if (r.id && idSet.has(String(r.id))) return true;

    const web = String(r.website || 'K9WIN').toUpperCase();
    const regDate = String(r.regDate || '').trim().toLowerCase();
    const prof = String(r.profileName || '').trim().toLowerCase();
    const custId = String(r.customerId || '').trim().toLowerCase();

    const isRealCustId = custId && custId !== '-' && custId !== 'n/a' && custId.length >= 3;
    const isRealProf = prof && prof !== '-' && prof !== 'n/a' && prof.length >= 2;

    if (isRealCustId) {
      if (keySet.has(`${web}_${custId}`)) return true;
      if (isRealProf && regDate && keySet.has(`${web}_${regDate}_${prof}_${custId}`)) return true;
    }

    // NEVER check serialNo!
    return false;
  }

  // Load shared records
  function getSharedRecords(): any[] {
    const deletedList = getDeletedRecordsList();
    try {
      if (fs.existsSync(sharedDataFile)) {
        const raw = fs.readFileSync(sharedDataFile, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.filter((r: any) => !isServerRecordDeleted(r, deletedList));
        }
      }
      // Fallback to backup if primary is empty
      if (fs.existsSync(sharedDataBackupFile)) {
        const raw = fs.readFileSync(sharedDataBackupFile, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.filter((r: any) => !isServerRecordDeleted(r, deletedList));
        }
      }
    } catch (err) {
      console.error('Error reading shared_records.json:', err);
    }
    return [];
  }

  // Save shared records with auto-backup (strictly excluding deleted records)
  function saveSharedRecords(records: any[]) {
    try {
      const deletedList = getDeletedRecordsList();
      const sanitized = Array.isArray(records)
        ? records.filter((r: any) => !isServerRecordDeleted(r, deletedList))
        : [];

      if (sanitized.length > 0) {
        fs.writeFileSync(sharedDataFile, JSON.stringify(sanitized, null, 2), 'utf-8');
        fs.writeFileSync(sharedDataBackupFile, JSON.stringify(sanitized, null, 2), 'utf-8');
      } else if (Array.isArray(records) && records.length === 0) {
        fs.writeFileSync(sharedDataFile, JSON.stringify([], null, 2), 'utf-8');
        fs.writeFileSync(sharedDataBackupFile, JSON.stringify([], null, 2), 'utf-8');
      }
    } catch (err) {
      console.error('Error writing shared_records.json:', err);
    }
  }

  // Seed initial records if empty file (Clean state)
  if (!fs.existsSync(sharedDataFile)) {
    saveSharedRecords([]);
  }

  // Helper to ensure demo records and deleted records are cleaned out
  function getCleanSharedRecords(): any[] {
    const raw = getSharedRecords();
    return raw.filter((r: any) => !['rec-1', 'rec-2', 'rec-3', 'rec-4', 'rec-5'].includes(r.id));
  }

  // --- API Endpoints ---

  // GET /api/records -> Retrieve all central shared customer registration records
  app.get('/api/records', (req, res) => {
    const records = getCleanSharedRecords();
    res.json({ success: true, count: records.length, records });
  });

  // GET /api/records/deleted -> Retrieve list of deleted record tombstones
  app.get('/api/records/deleted', (req, res) => {
    const deletedList = getDeletedRecordsList();
    res.json({ success: true, deleted: deletedList });
  });

  // POST /api/records -> Save or update a single record or array of records (filters out deleted items)
  app.post('/api/records', (req, res) => {
    const { record, records } = req.body;
    let currentRecords = getCleanSharedRecords();
    const deletedList = getDeletedRecordsList();

    if (Array.isArray(records)) {
      currentRecords = records.filter((r: any) => !isServerRecordDeleted(r, deletedList));
    } else if (record && record.id) {
      if (!isServerRecordDeleted(record, deletedList)) {
        const existingIdx = currentRecords.findIndex((r: any) => r.id === record.id);
        if (existingIdx >= 0) {
          currentRecords[existingIdx] = record;
        } else {
          currentRecords.unshift(record);
        }
      }
    }

    saveSharedRecords(currentRecords);
    res.json({ success: true, count: currentRecords.length, records: currentRecords });
  });

  // DELETE /api/records/:id -> Permanently delete a record by ID
  app.delete('/api/records/:id', async (req, res) => {
    const { id } = req.params;
    let currentRecords = getSharedRecords();
    const initialCount = currentRecords.length;
    const targetRecord = currentRecords.find((r: any) => String(r.id) === String(id)) || req.body?.record;

    // Permanently record tombstone so it can never be pulled back from Google Sheet or Drive
    saveDeletedRecord(id, targetRecord);

    currentRecords = currentRecords.filter((r: any) => String(r.id) !== String(id) && !isServerRecordDeleted(r));
    saveSharedRecords(currentRecords);

    // If target record found, attempt asynchronous Google Sheet row delete in background
    if (targetRecord) {
      const gasUrl = 'https://script.google.com/macros/s/AKfycbwHfrp9r-HmJVAM_ZSF1wfrOXi-xnN7aCOjLpx3Q_l_rzzlwu9sB8PgDlfHA9hbkbAW/exec';
      const web = (targetRecord.website || 'K9WIN').toUpperCase();
      const tok = getWebsiteTokenForServer(web);
      fetch(gasUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'delete_record',
          website: web,
          token: tok,
          record: targetRecord
        })
      }).catch((e: any) => {
        console.warn('Server background GAS delete error:', e?.message || e);
      });
    }

    res.json({ success: true, deleted: currentRecords.length < initialCount, count: currentRecords.length, records: currentRecords });
  });

  // POST /api/gas-delete -> Delete row from Google Sheet via Apps Script Web App URL
  app.post('/api/gas-delete', async (req, res) => {
    try {
      const { webAppUrl, website, token, record } = req.body;
      const targetUrl = (webAppUrl || '').trim() || 'https://script.google.com/macros/s/AKfycbwHfrp9r-HmJVAM_ZSF1wfrOXi-xnN7aCOjLpx3Q_l_rzzlwu9sB8PgDlfHA9hbkbAW/exec';
      const targetWeb = (website || (record && record.website) || 'K9WIN').toUpperCase();
      const tok = token || getWebsiteTokenForServer(targetWeb);

      // Permanently record tombstone in server memory
      if (record) {
        saveDeletedRecord(record.id || '', record);
        let currentRecords = getSharedRecords().filter((r: any) => !isServerRecordDeleted(r));
        saveSharedRecords(currentRecords);
      }

      const payload = {
        action: 'delete_record',
        website: targetWeb,
        token: tok,
        record: record || {}
      };

      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });

      const data = await response.json().catch(() => null);
      res.json({
        success: true,
        data,
        message: `បានលុបជួរដេកពី Google Sheet [${targetWeb}] រួចរាល់`
      });
    } catch (err: any) {
      console.warn('Error in /api/gas-delete:', err);
      res.status(500).json({
        success: false,
        message: 'បញ្ហាក្នុងការលុបទិន្នន័យពី Google Sheet: ' + String(err.message || err)
      });
    }
  });

  // Helper to compute deterministic website token on server
  function getWebsiteTokenForServer(websiteId: string): string {
    const cleanId = (websiteId || 'K9WIN').toUpperCase().replace(/[^A-Z0-9]/g, '');
    let hash = 0;
    for (let i = 0; i < cleanId.length; i++) {
      hash = (hash << 5) - hash + cleanId.charCodeAt(i);
      hash |= 0;
    }
    const tokenNum = Math.abs(hash % 899999) + 100000;
    return `${cleanId}-TOK-${tokenNum}`;
  }

  // POST /api/gas-pull -> Pull / restore all records directly from Google Sheet via Apps Script Web App URL
  app.post('/api/gas-pull', async (req, res) => {
    try {
      const { webAppUrl, website } = req.body;
      const targetUrl = (webAppUrl || '').trim() || 'https://script.google.com/macros/s/AKfycbwHfrp9r-HmJVAM_ZSF1wfrOXi-xnN7aCOjLpx3Q_l_rzzlwu9sB8PgDlfHA9hbkbAW/exec';

      if (!targetUrl) {
        return res.status(400).json({ success: false, message: 'Google Apps Script Web App URL ត្រូវតែបានបញ្ចូល' });
      }

      const defaultWebsiteList = [
        'FAFAVIP', 'K9WIN', 'FAFA191', 'FAFA787', 'FAFA365', 'SBOBETV8', 'FAFA123',
        'FAFA855', 'FAFA989', 'FAFA88', 'FAFA368', 'FAFA178', 'FAFA117', 'FAFA678',
        'FAFA138', 'FAFA789', 'FAFA666', 'FAFA118', 'FAFA777', 'FAFA999', 'FAFA889',
        'FAFA988', 'FAFA2U', 'LYNSBOBET', 'FAFA1X2', 'FAFA800', 'FAFA212', 'JPGO', 'UUNA'
      ];

      const { customWebsites } = getSharedWebsitesData();
      const customNames = (customWebsites || []).map((w: any) => String(w?.name || '').trim().toUpperCase()).filter(Boolean);
      const websiteList = Array.from(new Set([...defaultWebsiteList, ...customNames]));

      const targetWebsites = (website && website !== 'ALL') ? [website.toUpperCase()] : websiteList;

      let currentRecords = getCleanSharedRecords();
      let newlyPulledCount = 0;
      let totalRecordsExtracted = 0;

      await Promise.all(targetWebsites.map(async (webName) => {
        try {
          const tok = getWebsiteTokenForServer(webName);
          const reqUrl = `${targetUrl}?action=fetchData&website=${encodeURIComponent(webName)}&token=${encodeURIComponent(tok)}`;
          const response = await fetch(reqUrl);
          if (!response.ok) return;

          const data = await response.json().catch(() => null);
          if (!data || data.status !== 'success' || !Array.isArray(data.records)) return;

          const rows = data.records;
          for (const r of rows) {
            if (!Array.isArray(r) || r.length < 3) continue;
            // Skip header row or sample profile
            if (r[0] === 'Serial No' || r[2] === 'Profile Name' || String(r[2]).includes('Sample Profile')) continue;

            const regDateStr = String(r[1] || '').trim();
            const profNameStr = String(r[2] || '').trim();
            const customerIdStr = String(r[3] || '').trim();

            if ((!profNameStr || profNameStr === '-' || profNameStr.toUpperCase() === 'N/A') &&
                (!customerIdStr || customerIdStr === '-' || customerIdStr.toUpperCase() === 'N/A')) {
              continue;
            }

            totalRecordsExtracted++;

            const serialNo = Number(r[0]) || 1;
            const password = String(r[4] || '-');
            const platform = String(r[5] || 'ALL Telegram');
            const sourceName = String(r[6] || '-');
            const status = String(r[7] || 'New Register');
            const contactLink = String(r[8] || '-');
            const depositAmount = parseFloat(r[9]) || 0;
            const depositDate = String(r[10] || '');
            const bankName = String(r[11] || 'ABA Bank');
            const bankAccountName = String(r[12] || '-');
            const bankAccountNumber = String(r[13] || '-');
            const shift = String(r[14] || 'វេនព្រឹក');
            const csId = String(r[15] || 'CS-01');
            const recWebsite = String(r[16] || webName).toUpperCase();

            const dedupeKey = `${recWebsite}_${regDateStr}_${profNameStr.toLowerCase()}_${customerIdStr.toLowerCase()}`;

            const recordObj = {
              id: `rec-gas-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
              serialNo,
              regDate: regDateStr,
              profileName: profNameStr,
              customerId: customerIdStr,
              password,
              platform,
              sourceName,
              status,
              contactLink,
              depositAmount,
              depositDate,
              bankName,
              bankAccountName,
              bankAccountNumber,
              shift,
              csId,
              website: recWebsite,
              timestamp: new Date().toISOString()
            };

            // STRICT CHECK: If this record was deleted previously, NEVER restore or pull it back!
            if (isServerRecordDeleted(recordObj)) {
              continue;
            }

            const existingIdx = currentRecords.findIndex((ex: any) => {
              const exKey = `${ex.website}_${ex.regDate}_${String(ex.profileName || '').toLowerCase()}_${String(ex.customerId || '').toLowerCase()}`;
              return exKey === dedupeKey;
            });

            if (existingIdx >= 0) {
              recordObj.id = currentRecords[existingIdx].id;
              currentRecords[existingIdx] = { ...currentRecords[existingIdx], ...recordObj };
            } else {
              currentRecords.unshift(recordObj);
              newlyPulledCount++;
            }
          }
        } catch (err) {
          console.warn(`Failed to pull records for ${webName}:`, err);
        }
      }));

      saveSharedRecords(currentRecords);
      res.json({
        success: true,
        pulledCount: newlyPulledCount,
        totalExtracted: totalRecordsExtracted,
        totalCount: currentRecords.length,
        records: currentRecords,
        message: `បានទាញយកទិន្នន័យ ${totalRecordsExtracted} ជួរពី Google Sheet / Drive រួចរាល់!`
      });
    } catch (err: any) {
      console.error('Error in /api/gas-pull:', err);
      res.status(500).json({ success: false, message: 'មានបញ្ហាក្នុងការទាញយកទិន្នន័យពី Google Sheet: ' + String(err.message || err) });
    }
  });

  // GET /api/admins -> Retrieve list of all admin Gmail addresses
  app.get('/api/admins', (req, res) => {
    const admins = getSharedAdmins();
    res.json({ success: true, admins });
  });

  // POST /api/admins -> Update list of all admin Gmail addresses
  app.post('/api/admins', (req, res) => {
    const { admins } = req.body;
    if (Array.isArray(admins)) {
      const cleaned = admins.map((e: string) => String(e).trim().toLowerCase());
      const superAdmin = 'hongbunly89@gmail.com';
      if (!cleaned.includes(superAdmin)) {
        cleaned.unshift(superAdmin);
      }
      saveSharedAdmins(cleaned);
      res.json({ success: true, admins: cleaned });
    } else {
      res.status(400).json({ success: false, message: 'Invalid admins array' });
    }
  });

  // GET /api/websites -> Retrieve shared custom and deleted websites list
  app.get('/api/websites', (req, res) => {
    try {
      const data = getSharedWebsitesData();
      res.json({ success: true, ...data });
    } catch (err) {
      console.error('Error handling GET /api/websites:', err);
      res.status(500).json({ success: false, message: 'Failed to retrieve websites' });
    }
  });

  // POST /api/websites -> Update shared custom and deleted websites list
  app.post('/api/websites', (req, res) => {
    try {
      const { customWebsites, deletedWebsites } = req.body || {};
      let data = getSharedWebsitesData();

      // Set or merge deletedWebsites
      if (Array.isArray(deletedWebsites)) {
        data.deletedWebsites = Array.from(
          new Set(
            deletedWebsites
              .filter((d: any) => typeof d === 'string' && d.trim())
              .map((d: string) => d.trim().toUpperCase())
          )
        );
      }

      const deletedSet = new Set(data.deletedWebsites);

      // Merge customWebsites intelligently by name
      const customMap = new Map<string, any>();
      if (Array.isArray(data.customWebsites)) {
        data.customWebsites.forEach((w: any) => {
          if (w && w.name) customMap.set(String(w.name).trim().toUpperCase(), w);
        });
      }
      if (Array.isArray(customWebsites)) {
        customWebsites.forEach((w: any) => {
          if (w && w.name) {
            customMap.set(String(w.name).trim().toUpperCase(), w);
          }
        });
      }

      // Filter out custom websites that are in deleted list
      const updatedCustom = Array.from(customMap.values()).filter(
        (w: any) => !deletedSet.has(String(w.name).trim().toUpperCase())
      );
      data.customWebsites = updatedCustom;

      saveSharedWebsitesData(data);
      res.json({ success: true, ...data });
    } catch (err) {
      console.error('Error handling POST /api/websites:', err);
      res.status(500).json({ success: false, message: 'Failed to update websites' });
    }
  });

  // GET /api/active-users -> Retrieve list of all users who have accessed/logged in
  app.get('/api/active-users', (req, res) => {
    const users = getSharedActiveUsers();
    const admins = getSharedAdmins();
    const blockedUsers = getSharedBlockedUsers();
    const superAdmin = 'hongbunly89@gmail.com';

    // Filter out blocked users from active list
    const filteredUsers = users.filter((u: any) => !blockedUsers.includes(String(u.email).trim().toLowerCase()));

    // Update role for each user dynamically
    const updatedUsers = filteredUsers.map((u: any) => {
      const e = String(u.email || '').trim().toLowerCase();
      let role = 'CS Staff';
      if (e === superAdmin) role = 'Super Admin';
      else if (admins.includes(e)) role = 'Admin';
      return { ...u, role };
    });

    res.json({ success: true, users: updatedUsers, blockedUsers });
  });

  // POST /api/active-users -> Ping / record active logged-in user
  app.post('/api/active-users', (req, res) => {
    const { email, displayName, photoUrl } = req.body;
    if (!email || !String(email).includes('@')) {
      return res.status(400).json({ success: false, message: 'Invalid email' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const blockedUsers = getSharedBlockedUsers();

    if (blockedUsers.includes(cleanEmail)) {
      return res.json({
        success: false,
        blocked: true,
        message: 'អាសយដ្ឋាន Gmail នេះត្រូវបាន Admin ដកសិទ្ធិ និងហាមឃាត់មិនឱ្យចូលប្រើប្រាស់!'
      });
    }

    const admins = getSharedAdmins();
    const superAdmin = 'hongbunly89@gmail.com';

    let role = 'CS Staff';
    if (cleanEmail === superAdmin) role = 'Super Admin';
    else if (admins.includes(cleanEmail)) role = 'Admin';

    let users = getSharedActiveUsers();
    const existingIdx = users.findIndex((u: any) => String(u.email).trim().toLowerCase() === cleanEmail);

    const updatedUser = {
      email: cleanEmail,
      displayName: displayName || cleanEmail.split('@')[0],
      photoUrl: photoUrl || (existingIdx >= 0 ? users[existingIdx].photoUrl : ''),
      lastActive: new Date().toISOString(),
      isLoggedOut: false,
      role
    };

    if (existingIdx >= 0) {
      users[existingIdx] = { ...users[existingIdx], ...updatedUser };
    } else {
      users.unshift(updatedUser);
    }

    saveSharedActiveUsers(users);
    res.json({ success: true, users, blockedUsers });
  });

  // POST /api/active-users/block -> Admin revokes/blocks a user Gmail address
  app.post('/api/active-users/block', (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email required' });

    const cleanEmail = String(email).trim().toLowerCase();
    const superAdmin = 'hongbunly89@gmail.com';

    if (cleanEmail === superAdmin) {
      return res.status(400).json({ success: false, message: 'Cannot block Super Admin' });
    }

    // Add to blocked list
    let blocked = getSharedBlockedUsers();
    if (!blocked.includes(cleanEmail)) {
      blocked.push(cleanEmail);
      saveSharedBlockedUsers(blocked);
    }

    // Remove from active users list
    let users = getSharedActiveUsers();
    users = users.filter((u: any) => String(u.email).trim().toLowerCase() !== cleanEmail);
    saveSharedActiveUsers(users);

    res.json({ success: true, message: `បានដកសិទ្ធិ និងហាមឃាត់ Gmail ${cleanEmail} រួចរាល់!`, users, blockedUsers: blocked });
  });

  // POST /api/active-users/unblock -> Admin unblocks a user Gmail address
  app.post('/api/active-users/unblock', (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email required' });

    const cleanEmail = String(email).trim().toLowerCase();
    let blocked = getSharedBlockedUsers();
    blocked = blocked.filter((e: string) => e !== cleanEmail);
    saveSharedBlockedUsers(blocked);

    res.json({ success: true, message: `បានអនុញ្ញាត Gmail ${cleanEmail} ឡើងវិញ!`, users: getSharedActiveUsers(), blockedUsers: blocked });
  });

  // --- REGISTER & LOGIN AUTH API ROUTES ---

  // GET /api/auth/registered-users -> Get all registered accounts map
  app.get('/api/auth/registered-users', (req, res) => {
    const users = getSharedRegisteredUsers();
    res.json({ success: true, users });
  });

  // POST /api/auth/register -> Register a new Gmail account
  app.post('/api/auth/register', (req, res) => {
    const { email, password, photoUrl } = req.body;
    if (!email || !String(email).trim() || !String(email).includes('@')) {
      return res.status(400).json({ success: false, message: 'សូមបញ្ចូលអាសយដ្ឋាន Gmail ឱ្យបានត្រឹមត្រូវ!' });
    }
    if (!password || String(password).length < 4) {
      return res.status(400).json({ success: false, message: 'ពាក្យសម្ងាត់ត្រូវមានយ៉ាងហោចណាស់ 4 តួអក្សរ!' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const blockedUsers = getSharedBlockedUsers();

    if (blockedUsers.includes(cleanEmail)) {
      return res.json({
        success: false,
        blocked: true,
        message: 'អាសយដ្ឋាន Gmail នេះត្រូវបាន Admin ដកសិទ្ធិ និងហាមឃាត់មិនឱ្យចូលប្រើប្រាស់!'
      });
    }

    const registeredUsers = getSharedRegisteredUsers();
    if (registeredUsers[cleanEmail]) {
      return res.json({
        success: false,
        alreadyRegistered: true,
        message: `អាសយដ្ឋាន Gmail [${cleanEmail}] នេះបានចុះឈ្មោះក្នុងប្រព័ន្ធរួចរាល់ហើយ! មិនអាចចុះឈ្មោះម្តងទៀតបានទេ។ សូមជ្រើសរើស "ចូលប្រើប្រាស់ (Sign In)"។`
      });
    }

    registeredUsers[cleanEmail] = {
      password: String(password),
      registeredAt: new Date().toISOString(),
      photoUrl: photoUrl || ''
    };
    saveSharedRegisteredUsers(registeredUsers);

    res.json({
      success: true,
      message: 'ចុះឈ្មោះបង្កើតគណនីបានជោគជ័យ!',
      email: cleanEmail
    });
  });

  // POST /api/auth/login -> Verify login credentials
  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !String(email).trim() || !String(email).includes('@')) {
      return res.status(400).json({ success: false, message: 'សូមបញ្ចូលអាសយដ្ឋាន Gmail ឱ្យបានត្រឹមត្រូវ!' });
    }
    if (!password) {
      return res.status(400).json({ success: false, message: 'សូមបញ្ចូលពាក្យសម្ងាត់!' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const blockedUsers = getSharedBlockedUsers();

    if (blockedUsers.includes(cleanEmail)) {
      return res.json({
        success: false,
        blocked: true,
        message: 'អាសយដ្ឋាន Gmail នេះត្រូវបាន Admin ដកសិទ្ធិ និងហាមឃាត់មិនឱ្យចូលប្រើប្រាស់!'
      });
    }

    const registeredUsers = getSharedRegisteredUsers();
    const userObj = registeredUsers[cleanEmail];

    if (!userObj) {
      return res.json({
        success: false,
        notRegistered: true,
        message: `អាសយដ្ឋាន Gmail [${cleanEmail}] នេះមិនទាន់បានចុះឈ្មោះក្នុងប្រព័ន្ធទេ! សូមចុះឈ្មោះបង្កើតគណនី (Register) ជាមុនសិន។`
      });
    }

    if (userObj.password !== String(password)) {
      return res.json({
        success: false,
        message: 'ពាក្យសម្ងាត់មិនត្រឹមត្រូវទេ! សូមពិនិត្យឡើងវិញ។'
      });
    }

    res.json({
      success: true,
      message: 'ចូលប្រើប្រាស់បានជោគជ័យ!',
      email: cleanEmail,
      photoUrl: userObj.photoUrl || ''
    });
  });

  // POST /api/auth/reset-password -> Reset user password
  app.post('/api/auth/reset-password', (req, res) => {
    const { email, newPassword } = req.body;
    if (!email || !String(email).trim() || !String(email).includes('@')) {
      return res.status(400).json({ success: false, message: 'សូមបញ្ចូលអាសយដ្ឋាន Gmail ឱ្យបានត្រឹមត្រូវ!' });
    }
    if (!newPassword || String(newPassword).length < 4) {
      return res.status(400).json({ success: false, message: 'ពាក្យសម្ងាត់ថ្មីត្រូវមានយ៉ាងហោចណាស់ 4 តួអក្សរ!' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const registeredUsers = getSharedRegisteredUsers();

    if (!registeredUsers[cleanEmail]) {
      registeredUsers[cleanEmail] = {
        password: String(newPassword),
        registeredAt: new Date().toISOString()
      };
    } else {
      registeredUsers[cleanEmail].password = String(newPassword);
    }

    saveSharedRegisteredUsers(registeredUsers);
    res.json({ success: true, message: 'ប្តូរពាក្យសម្ងាត់បានជោគជ័យ!' });
  });

  // POST /api/active-users/logout -> Logout user and remove from active list
  app.post('/api/active-users/logout', (req, res) => {
    const { email } = req.body;
    if (!email) return res.json({ success: true, users: getSharedActiveUsers() });

    const cleanEmail = String(email).trim().toLowerCase();
    let users = getSharedActiveUsers();
    users = users.filter((u: any) => String(u.email).trim().toLowerCase() !== cleanEmail);
    saveSharedActiveUsers(users);

    res.json({ success: true, users });
  });

  // Verification codes store in memory
  const verificationCodes: Record<string, { code: string; expires: number }> = {};

  // Helper to get email transporter
  function getMailTransporter() {
    if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASS) {
      return nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASS,
        },
      });
    }

    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    }

    return null;
  }

  // POST /api/send-code -> Generate 6-digit verification code and deliver via email / direct verification
  app.post('/api/send-code', async (req, res) => {
    const { email } = req.body;
    if (!email || !String(email).includes('@')) {
      return res.status(400).json({ success: false, message: 'សូមបញ្ចូលអាសយដ្ឋាន Gmail ឲ្យបានត្រឹមត្រូវ!' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 15 * 60 * 1000; // 15 minutes

    verificationCodes[cleanEmail] = { code, expires };

    const transporter = getMailTransporter();
    let emailSentReal = false;
    let emailError = '';

    if (transporter) {
      try {
        await transporter.sendMail({
          from: `"CS Daily System" <${process.env.GMAIL_USER || process.env.SMTP_USER}>`,
          to: cleanEmail,
          subject: `[CS Daily System] លេខកូដផ្ទៀងផ្ទាត់ 6 ខ្ទង់៖ ${code}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border-radius: 16px; background-color: #0f172a; color: #f8fafc; border: 1px solid #334155;">
              <div style="text-align: center; margin-bottom: 24px;">
                <h2 style="color: #38bdf8; margin: 0; font-size: 22px; font-weight: bold;">CS Daily System</h2>
                <p style="color: #94a3b8; font-size: 13px; margin-top: 6px;">លេខកូដផ្លាស់ប្តូរពាក្យសម្ងាត់សុវត្ថិភាព</p>
              </div>
              <div style="background-color: #1e293b; padding: 24px; border-radius: 12px; text-align: center; margin-bottom: 24px; border: 1px solid #475569;">
                <p style="color: #cbd5e1; font-size: 14px; margin-top: 0;">លេខកូដផ្ទៀងផ្ទាត់ 6 ខ្ទង់របស់អ្នកគឺ៖</p>
                <div style="font-size: 36px; font-weight: 800; font-family: monospace; letter-spacing: 8px; color: #f59e0b; background-color: #090d16; padding: 14px 24px; border-radius: 8px; display: inline-block; margin: 16px 0; border: 1px solid #d97706;">
                  ${code}
                </div>
                <p style="color: #94a3b8; font-size: 12px; margin-bottom: 0;">លេខកូដនេះមានសុពលភាពរយៈពេល 15 នាទី។</p>
              </div>
              <p style="color: #64748b; font-size: 11px; text-align: center; margin: 0;">ប្រសិនបើអ្នកមិនបានស្នើសុំលេខកូដនេះទេ សូមរំលងសារនេះ។</p>
            </div>
          `
        });
        emailSentReal = true;
      } catch (err: any) {
        console.error('Nodemailer send error:', err);
        emailError = err.message || '';
      }
    }

    res.json({
      success: true,
      email: cleanEmail,
      code,
      emailSentReal,
      message: emailSentReal
        ? `លេខកូដ 6 ខ្ទង់ត្រូវបានផ្ញើទៅកាន់ប្រអប់សារ Gmail (${cleanEmail}) រួចរាល់ហើយ!`
        : `លេខកូដ 6 ខ្ទង់ (${code}) ត្រូវបានបង្កើត និងរៀបចំសម្រាប់ ${cleanEmail}!`
    });
  });

  // POST /api/verify-code -> Verify 6-digit code
  app.post('/api/verify-code', (req, res) => {
    const { email, code } = req.body;
    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanCode = String(code || '').trim();

    const record = verificationCodes[cleanEmail];
    if (!record) {
      return res.status(400).json({ success: false, message: 'សូមចុចផ្ញើកូដជាមុនសិន!' });
    }

    if (Date.now() > record.expires) {
      delete verificationCodes[cleanEmail];
      return res.status(400).json({ success: false, message: 'លេខកូដនេះបានផុតកំណត់ហើយ! សូមចុចផ្ញើកូដម្ដងទៀត។' });
    }

    if (record.code !== cleanCode) {
      return res.status(400).json({ success: false, message: 'លេខកូដផ្ទៀងផ្ទាត់មិនត្រឹមត្រូវទេ!' });
    }

    res.json({ success: true, message: 'ផ្ទៀងផ្ទាត់លេខកូដជោគជ័យ!' });
  });

  // Vite middleware setup for development vs production
  const isProduction =
    process.env.NODE_ENV === "production" ||
    (typeof __filename !== "undefined" && __filename.endsWith(".cjs"));

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = fs.existsSync(path.join(process.cwd(), 'dist', 'index.html'))
      ? path.join(process.cwd(), 'dist')
      : fs.existsSync(path.join(__dirname, 'index.html'))
      ? __dirname
      : path.join(process.cwd(), 'dist');

    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(200).send('<!doctype html><html><body><div id="root">Loading application...</div></body></html>');
      }
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

startServer();
