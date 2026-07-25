import { WebsiteInfo } from '../types';

export const WEBSITE_LIST: WebsiteInfo[] = [
  { id: 'K9WIN', name: 'K9WIN', displayName: 'K9WIN', color: 'from-amber-500 to-yellow-600' },
  { id: 'FAFA191', name: 'FAFA191', displayName: 'FAFA191', color: 'from-blue-600 to-indigo-700' },
  { id: 'FAFA787', name: 'FAFA787', displayName: 'FAFA787', color: 'from-emerald-500 to-teal-700' },
  { id: 'FAFA365', name: 'FAFA365', displayName: 'FAFA365', color: 'from-purple-600 to-pink-600' },
  { id: 'SBOBETV8', name: 'SBOBETV8', displayName: 'SBOBETV8', color: 'from-sky-500 to-blue-700' },
  { id: 'FAFA123', name: 'FAFA123', displayName: 'FAFA123', color: 'from-rose-500 to-red-700' },
  { id: 'FAFA855', name: 'FAFA855', displayName: 'FAFA855', color: 'from-amber-600 to-orange-700' },
  { id: 'FAFA989', name: 'FAFA989', displayName: 'FAFA989', color: 'from-cyan-600 to-blue-600' },
  { id: 'FAFA88', name: 'FAFA88', displayName: 'FAFA88', color: 'from-violet-600 to-purple-800' },
  { id: 'FAFA368', name: 'FAFA368', displayName: 'FAFA368', color: 'from-green-600 to-emerald-800' },
  { id: 'FAFA178', name: 'FAFA178', displayName: 'FAFA178', color: 'from-pink-600 to-rose-700' },
  { id: 'FAFA117', name: 'FAFA117', displayName: 'FAFA117', color: 'from-indigo-500 to-blue-800' },
  { id: 'FAFA678', name: 'FAFA678', displayName: 'FAFA678', color: 'from-teal-500 to-cyan-700' },
  { id: 'FAFA138', name: 'FAFA138', displayName: 'FAFA138', color: 'from-fuchsia-600 to-purple-700' },
  { id: 'FAFA789', name: 'FAFA789', displayName: 'FAFA789', color: 'from-orange-500 to-amber-700' },
  { id: 'FAFA666', name: 'FAFA666', displayName: 'FAFA666', color: 'from-red-600 to-rose-800' },
  { id: 'FAFA118', name: 'FAFA118', displayName: 'FAFA118', color: 'from-blue-500 to-teal-600' },
  { id: 'FAFA777', name: 'FAFA777', displayName: 'FAFA777', color: 'from-yellow-500 to-amber-600' },
  { id: 'FAFA999', name: 'FAFA999', displayName: 'FAFA999', color: 'from-purple-500 to-indigo-700' },
  { id: 'FAFA889', name: 'FAFA889', displayName: 'FAFA889', color: 'from-emerald-600 to-green-700' },
  { id: 'FAFA988', name: 'FAFA988', displayName: 'FAFA988', color: 'from-sky-600 to-indigo-600' },
  { id: 'FAFA2U', name: 'FAFA2U', displayName: 'FAFA2U', color: 'from-pink-500 to-fuchsia-700' },
  { id: 'LYNSBOBET', name: 'LYNSBOBET', displayName: 'LYNSBOBET', color: 'from-blue-700 to-cyan-800' },
  { id: 'FAFA1X2', name: 'FAFA1X2', displayName: 'FAFA1X2', color: 'from-violet-500 to-purple-700' },
  { id: 'FAFA800', name: 'FAFA800', displayName: 'FAFA800', color: 'from-teal-600 to-emerald-800' },
  { id: 'FAFA212', name: 'FAFA212', displayName: 'FAFA212', color: 'from-amber-500 to-orange-600' },
  { id: 'JPGO', name: 'JPGO', displayName: 'JPGO', color: 'from-amber-500 to-rose-600' },
  { id: 'UUNA', name: 'UUNA', displayName: 'UUNA', color: 'from-indigo-600 to-blue-700' },
];

export const CS_CUSTOM_WEBSITES_KEY = 'cs_custom_websites';
export const CS_DELETED_WEBSITES_KEY = 'cs_deleted_websites';

export function getCustomWebsites(): WebsiteInfo[] {
  try {
    const raw = localStorage.getItem(CS_CUSTOM_WEBSITES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Failed to parse custom websites:', e);
  }
  return [];
}

export function getDeletedWebsites(): string[] {
  try {
    const raw = localStorage.getItem(CS_DELETED_WEBSITES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map(s => String(s).toUpperCase());
    }
  } catch (e) {
    console.error('Failed to parse deleted websites:', e);
  }
  return [];
}

export function getAllWebsites(): WebsiteInfo[] {
  const custom = getCustomWebsites();
  const deleted = new Set(getDeletedWebsites());
  const existingNames = new Set(WEBSITE_LIST.map(w => w.name.toUpperCase()));
  const uniqueCustom = custom.filter(c => !existingNames.has(c.name.toUpperCase()));
  const combined = [...WEBSITE_LIST, ...uniqueCustom];
  return combined.filter(w => !deleted.has(w.name.toUpperCase()));
}

export function deleteWebsite(name: string): void {
  const cleanName = name.trim().toUpperCase();
  const currentCustom = getCustomWebsites();
  const updatedCustom = currentCustom.filter(c => c.name.toUpperCase() !== cleanName);
  try {
    localStorage.setItem(CS_CUSTOM_WEBSITES_KEY, JSON.stringify(updatedCustom));
  } catch (e) {
    console.error('Failed to save custom website list after delete:', e);
  }

  const deletedList = getDeletedWebsites();
  if (!deletedList.includes(cleanName)) {
    deletedList.push(cleanName);
    try {
      localStorage.setItem(CS_DELETED_WEBSITES_KEY, JSON.stringify(deletedList));
    } catch (e) {
      console.error('Failed to save deleted website list:', e);
    }
  }
}

export function addCustomWebsite(name: string): WebsiteInfo {
  const cleanName = name.trim().toUpperCase();

  // If was previously deleted, remove from deleted list
  const deletedList = getDeletedWebsites();
  if (deletedList.includes(cleanName)) {
    const updatedDeleted = deletedList.filter(d => d !== cleanName);
    try {
      localStorage.setItem(CS_DELETED_WEBSITES_KEY, JSON.stringify(updatedDeleted));
    } catch (e) {
      console.error('Failed to save deleted website list after restore:', e);
    }
  }

  const colors = [
    'from-emerald-500 to-teal-700',
    'from-blue-600 to-indigo-700',
    'from-purple-600 to-pink-600',
    'from-amber-500 to-orange-700',
    'from-rose-500 to-red-700',
    'from-cyan-600 to-blue-600',
    'from-violet-600 to-purple-800'
  ];
  const randomColor = colors[Math.floor(Math.random() * colors.length)];

  const newWeb: WebsiteInfo = {
    id: cleanName,
    name: cleanName,
    displayName: cleanName,
    color: randomColor
  };

  const current = getCustomWebsites();
  const updated = [...current, newWeb];
  try {
    localStorage.setItem(CS_CUSTOM_WEBSITES_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save custom website:', e);
  }
  return newWeb;
}

export const PLATFORM_OPTIONS = [
  'Telegram Bot',
  'ALL Telegram',
  'Page',
  'Facebook',
  'TikTok',
  'Website Direct',
  'Other'
];

export const SOURCE_OPTIONS = [
  'FB Ads',
  'Telegram Channel',
  'TikTok Live',
  'Direct Call',
  'Friend Referral',
  'Google SEO',
  'Agent Line',
  'Other'
];

export const BANK_OPTIONS = [
  'ABA Bank',
  'ACLEDA Bank',
  'Wing Bank',
  'Prince Bank',
  'Canadia Bank',
  'Sathapana Bank',
  'TrueMoney',
  'Bakong',
  'Other Bank'
];

export const CS_ID_LIST = [
  'CS-01',
  'CS-02',
  'CS-03',
  'CS-04',
  'CS-05',
  'CS-06',
  'CS-07',
  'CS-08',
  'CS-SHIFT-LEAD'
];

// Helper to get or generate unique website security token
export function getWebsiteToken(websiteId: string): string {
  const cleanId = (websiteId || 'K9WIN').toUpperCase().replace(/[^A-Z0-9]/g, '');
  
  // Deterministic 6-digit hash from cleanId
  let hash = 0;
  for (let i = 0; i < cleanId.length; i++) {
    hash = (hash << 5) - hash + cleanId.charCodeAt(i);
    hash |= 0;
  }
  const tokenNum = Math.abs(hash % 899999) + 100000;
  return `${cleanId}-TOK-${tokenNum}`;
}

export function getAllWebsiteTokens(): Record<string, string> {
  const map: Record<string, string> = {};
  getAllWebsites().forEach(w => {
    map[w.name] = getWebsiteToken(w.name);
  });
  return map;
}
