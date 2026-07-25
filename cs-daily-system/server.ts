import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // File path for shared records across all users / Gmail accounts
  const dataDir = path.join(process.cwd(), 'data');
  const sharedDataFile = path.join(dataDir, 'shared_records.json');
  const sharedAdminsFile = path.join(dataDir, 'shared_admins.json');

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const DEFAULT_ADMINS = ['hongbunly89@gmail.com', 'todofi4256@barumart.com'];

  // Load shared admins
  function getSharedAdmins(): string[] {
    try {
      if (fs.existsSync(sharedAdminsFile)) {
        const raw = fs.readFileSync(sharedAdminsFile, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const cleaned = parsed.map((e: string) => String(e).trim().toLowerCase());
          for (const d of DEFAULT_ADMINS) {
            if (!cleaned.includes(d.toLowerCase())) {
              cleaned.push(d.toLowerCase());
            }
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

  // Load shared records
  function getSharedRecords(): any[] {
    try {
      if (fs.existsSync(sharedDataFile)) {
        const raw = fs.readFileSync(sharedDataFile, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.error('Error reading shared_records.json:', err);
    }
    return [];
  }

  // Save shared records
  function saveSharedRecords(records: any[]) {
    try {
      fs.writeFileSync(sharedDataFile, JSON.stringify(records, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error writing shared_records.json:', err);
    }
  }

  // Seed initial records if empty file
  if (!fs.existsSync(sharedDataFile) || getSharedRecords().length === 0) {
    const todayStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const todayISO = new Date().toISOString().split('T')[0];

    const initialSeed = [
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
        status: 'Deposit',
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

    saveSharedRecords(initialSeed);
  }

  // --- API Endpoints ---

  // GET /api/records -> Retrieve all central shared customer registration records
  app.get('/api/records', (req, res) => {
    const records = getSharedRecords();
    res.json({ success: true, count: records.length, records });
  });

  // POST /api/records -> Save or update a single record or array of records
  app.post('/api/records', (req, res) => {
    const { record, records } = req.body;
    let currentRecords = getSharedRecords();

    if (Array.isArray(records)) {
      currentRecords = records;
    } else if (record && record.id) {
      const existingIdx = currentRecords.findIndex((r: any) => r.id === record.id);
      if (existingIdx >= 0) {
        currentRecords[existingIdx] = record;
      } else {
        currentRecords.unshift(record);
      }
    }

    saveSharedRecords(currentRecords);
    res.json({ success: true, count: currentRecords.length, records: currentRecords });
  });

  // DELETE /api/records/:id -> Delete a record by ID
  app.delete('/api/records/:id', (req, res) => {
    const { id } = req.params;
    let currentRecords = getSharedRecords();
    const initialCount = currentRecords.length;
    currentRecords = currentRecords.filter((r: any) => String(r.id) !== String(id));
    saveSharedRecords(currentRecords);
    res.json({ success: true, deleted: currentRecords.length < initialCount, count: currentRecords.length, records: currentRecords });
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
      for (const d of DEFAULT_ADMINS) {
        if (!cleaned.includes(d.toLowerCase())) {
          cleaned.push(d.toLowerCase());
        }
      }
      saveSharedAdmins(cleaned);
      res.json({ success: true, admins: cleaned });
    } else {
      res.status(400).json({ success: false, message: 'Invalid admins array' });
    }
  });

  // Vite middleware setup for development vs production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
