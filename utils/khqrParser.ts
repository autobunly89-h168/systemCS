import jsQR from 'jsqr';

export const CAMBODIA_BANKS: Record<string, string> = {
  "aba": "ABA Bank",
  "abab": "ABA Bank",
  "abaa": "ABA Bank",
  "acleda": "ACLEDA Bank",
  "aclb": "ACLEDA Bank",
  "wing": "Wing Bank",
  "canadia": "Canadia Bank",
  "cnba": "Canadia Bank",
  "cpbk": "Canadia Bank",
  "sathapana": "Sathapana Bank",
  "spbb": "Sathapana Bank",
  "hattha": "Hattha Bank",
  "hata": "Hattha Bank",
  "prasac": "KB Prasac Bank",
  "kbprasac": "KB Prasac Bank",
  "prsk": "KB Prasac Bank",
  "amk": "AMK Microfinance",
  "amkm": "AMK Microfinance",
  "ppcb": "PPCBank",
  "phillip": "Phillip Bank",
  "plpb": "Phillip Bank",
  "ftb": "Foreign Trade Bank (FTB)",
  "ftbc": "Foreign Trade Bank (FTB)",
  "chipmong": "Chip Mong Bank",
  "cmcb": "Chip Mong Bank",
  "maybank": "Maybank Cambodia",
  "mbcb": "Maybank Cambodia",
  "rhb": "RHB Bank",
  "bic": "BIC Bank",
  "hongleong": "Hong Leong Bank",
  "cathay": "Cathay United Bank",
  "jtrust": "J Trust Royal Bank",
  "jtrb": "J Trust Royal Bank",
  "prince": "Prince Bank",
  "woori": "Woori Bank",
  "vattanac": "Vattanac Bank",
  "vbac": "Vattanac Bank",
  "bred": "BRED Bank",
  "shinhan": "Shinhan Bank",
  "cica": "Chiyu Banking Corporation",
  "truemoney": "TrueMoney",
  "true": "TrueMoney",
  "emoney": "eMoney",
  "pipay": "Pi Pay",
  "pipayasia": "Pi Pay",
  "bkng": "Bakong System",
  "bakong": "Bakong System"
};

export interface KhqrSecondaryNumber {
  label: string;
  value: string;
  type: 'phone' | 'account' | 'merchant' | 'bakong';
}

export interface KhqrParseResult {
  success: boolean;
  rawText?: string;
  accountNumber: string;
  accountName: string;
  bankName: string;
  amount?: string;
  currency?: string;
  isKhqr: boolean;
  error?: string;
  mobileNumber?: string;
  merchantId?: string;
  bakongAccountId?: string;
  secondaryNumbers?: KhqrSecondaryNumber[];
}

export const CAMBODIA_MOBILE_PREFIXES = [
  // 2-digit operator prefixes after 0 or 855:
  '10', '11', '12', '13', '14', '15', '16', '17', '18', '19',
  '31', '38',
  '60', '61', '66', '67', '68', '69',
  '70', '71', '76', '77', '78', '79',
  '80', '81', '85', '86', '87', '88', '89',
  '90', '92', '93', '95', '96', '97', '98', '99'
];

export function isCambodiaMobilePrefix(twoDigits: string): boolean {
  return CAMBODIA_MOBILE_PREFIXES.includes(twoDigits);
}

// Normalize Cambodian phone numbers (e.g. 855967956983 -> 0967956983)
// STRICT: Only converts international prefix (855...) to standard local prefix (0...).
// DOES NOT prepend '0' to bank account numbers like Wing (100467375) or ABA.
export function normalizeCambodiaPhoneNumber(val: string): string {
  if (!val) return '';
  const trimmed = val.trim();
  // Strip bank domain if present (e.g. "0967956983@aclb" -> "0967956983")
  const beforeAt = trimmed.split('@')[0].trim();
  const digits = beforeAt.replace(/[^0-9]/g, '');

  // 1. If starts with 855 followed by valid mobile prefix and 8-9 digits (total 11-12 digits)
  if (digits.startsWith('855') && digits.length >= 11 && digits.length <= 12) {
    const prefix = digits.substring(3, 5);
    if (isCambodiaMobilePrefix(prefix)) {
      return '0' + digits.substring(3);
    }
  }

  // 2. If already starts with 0 and followed by valid mobile prefix and 8-9 digits (total 9-10 digits)
  if (digits.startsWith('0') && (digits.length === 9 || digits.length === 10)) {
    const prefix = digits.substring(1, 3);
    if (isCambodiaMobilePrefix(prefix)) {
      return digits;
    }
  }

  // Not a phone number; return empty so it is treated as an account number
  return '';
}

// Parse EMVCo / KHQR Tag-Length-Value (TLV) string
export function parseTLV(raw: string): Record<string, string> {
  const res: Record<string, string> = {};
  let i = 0;
  while (i + 4 <= raw.length) {
    const tag = raw.substring(i, i + 2);
    const len = parseInt(raw.substring(i + 2, i + 4), 10);
    if (isNaN(len) || i + 4 + len > raw.length) break;
    const val = raw.substring(i + 4, i + 4 + len);
    res[tag] = val;
    i += 4 + len;
  }
  return res;
}

// Detect Bank Name from sub-account TLV data and root TLV data
export function detectBankName(acc: Record<string, string>, data: Record<string, string>): string {
  const globalId = (acc["00"] || "").toLowerCase();
  const merchantId = (acc["01"] || "").toLowerCase();
  const acqId = (acc["02"] || "").toLowerCase();
  const fullText = (
    JSON.stringify(data).toLowerCase() + ' ' + 
    JSON.stringify(acc).toLowerCase()
  );

  // 1. Match against Bakong account domain / subtag (e.g. 'abab', 'aba', 'acleda')
  for (const [key, name] of Object.entries(CAMBODIA_BANKS)) {
    if (
      globalId.includes(key) || 
      merchantId.includes(key) || 
      acqId.includes(key)
    ) {
      return name;
    }
  }

  // 2. Match against full text contents
  for (const [key, name] of Object.entries(CAMBODIA_BANKS)) {
    if (fullText.includes(key)) {
      return name;
    }
  }

  return "ធនាគារក្នុងស្រុក (KHQR)";
}

// Parse KHQR or plain text decoded from QR Code
export function parseKhqrData(qrText: string): KhqrParseResult {
  const clean = qrText.trim();
  if (!clean) {
    return {
      success: false,
      accountNumber: '',
      accountName: '',
      bankName: '',
      isKhqr: false,
      error: 'មិនមានទិន្នន័យក្នុង QR Code ឡើយ'
    };
  }

  const rootData = parseTLV(clean);
  const blockTags = ["29", "30", "15", "26", "27", "28", "31"];
  let merchantBlock = '';
  let activeTag = '';

  for (const t of blockTags) {
    if (rootData[t]) {
      merchantBlock = rootData[t];
      activeTag = t;
      break;
    }
  }

  if (merchantBlock) {
    const acc = parseTLV(merchantBlock);
    const tag62 = rootData["62"] ? parseTLV(rootData["62"]) : {};
    
    const sub00 = (acc["00"] || '').trim(); // Bakong Account ID / GUID (e.g. 0967956983@aclb or 855967956983@aclb)
    const sub01 = (acc["01"] || '').trim(); // Tag 29: Account info | Tag 30: Merchant ID (e.g. 85529912293)
    const mobile62 = (tag62["02"] || '').trim(); // Tag 62 subtag 02: Explicit Mobile Number

    // Extract phone numbers and normalize 855 country code to 0xx
    const phoneFrom62 = normalizeCambodiaPhoneNumber(mobile62);
    const phoneFromSub00 = normalizeCambodiaPhoneNumber(sub00);
    const phoneFromSub01 = normalizeCambodiaPhoneNumber(sub01);

    // Prioritize phone number for Cambodian banking
    const detectedPhone = phoneFrom62 || phoneFromSub00 || phoneFromSub01;

    // Tag 30 is EMVCo Corporate/Merchant KHQR where sub01 is the Terminal/Merchant ID (e.g. ACLEDA 85529912293).
    // Tag 29 is Individual KHQR where sub01 is the user's Bank Account Number (e.g. Wing 100467375, ABA 001234567).
    const isTag30Merchant = activeTag === '30';
    const merchantId = isTag30Merchant && sub01 ? sub01 : undefined;

    // Primary account number selection:
    // If a phone number is present, it's what Cambodian bank apps (like ACLEDA mobile) show and accept for transfers.
    let accountNumber = '';
    if (detectedPhone) {
      accountNumber = detectedPhone;
    } else if (sub01) {
      accountNumber = sub01;
    } else if (sub00) {
      accountNumber = sub00.split('@')[0] || sub00;
    }

    const name = rootData["59"] || acc["02"] || '';
    const bank = detectBankName(acc, rootData);
    const amount = rootData["54"] || undefined;
    const currencyCode = rootData["53"];
    const currency = currencyCode === '840' ? 'USD' : currencyCode === '116' ? 'KHR' : undefined;

    // Collect all available secondary numbers / IDs so the user can easily select or verify
    const rawSecondary: KhqrSecondaryNumber[] = [];
    if (detectedPhone) {
      rawSecondary.push({
        label: `លេខទូរស័ព្ទ (${detectedPhone})`,
        value: detectedPhone,
        type: 'phone'
      });
    }
    if (sub01 && sub01 !== detectedPhone && sub01 !== merchantId) {
      rawSecondary.push({
        label: `លេខគណនី (${sub01})`,
        value: sub01,
        type: 'account'
      });
    }
    if (merchantId && merchantId !== detectedPhone) {
      rawSecondary.push({
        label: `លេខកូដ Merchant (${merchantId})`,
        value: merchantId,
        type: 'merchant'
      });
    }
    if (sub00 && sub00 !== detectedPhone && sub00.split('@')[0] !== detectedPhone && sub00 !== sub01) {
      rawSecondary.push({
        label: `Bakong ID (${sub00})`,
        value: sub00,
        type: 'bakong'
      });
    }

    // Deduplicate by value
    const secondaryNumbers: KhqrSecondaryNumber[] = [];
    const seenValues = new Set<string>();
    for (const item of rawSecondary) {
      if (!seenValues.has(item.value)) {
        seenValues.add(item.value);
        secondaryNumbers.push(item);
      }
    }

    return {
      success: true,
      rawText: clean,
      accountNumber,
      accountName: name.trim().toUpperCase(),
      bankName: bank,
      amount,
      currency,
      isKhqr: true,
      mobileNumber: detectedPhone || undefined,
      merchantId,
      bakongAccountId: sub00 || undefined,
      secondaryNumbers
    };
  }

  // Fallback for non-TLV or standard plain QR
  return {
    success: true,
    rawText: clean,
    accountNumber: clean,
    accountName: '',
    bankName: 'ធនាគារក្នុងស្រុក',
    isKhqr: false
  };
}

// Decode QR Code from an image element or Data URL / Blob
export async function decodeQrFromImageSrc(imageSrc: string): Promise<KhqrParseResult> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          resolve({
            success: false,
            accountNumber: '',
            accountName: '',
            bankName: '',
            isKhqr: false,
            error: 'មិនអាចដំណើរការ Canvas លើកម្មវិធីរុករកនេះទេ'
          });
          return;
        }

        // Limit maximum dimensions for performance while keeping QR sharp
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;
        const maxDim = 1200;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        const imageData = ctx.getImageData(0, 0, width, height);
        let code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'attemptBoth'
        });

        // If not detected, try a second pass with higher contrast if needed
        if (!code) {
          code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'invertFirst'
          });
        }

        if (!code || !code.data) {
          resolve({
            success: false,
            accountNumber: '',
            accountName: '',
            bankName: '',
            isKhqr: false,
            error: 'មិនអាចអាន QR Code នេះបានទេ! សូមព្យាយាមប្រើរូបភាពដែលច្បាស់ជាងនេះ។'
          });
          return;
        }

        const parsed = parseKhqrData(code.data);
        resolve(parsed);
      } catch (err) {
        resolve({
          success: false,
          accountNumber: '',
          accountName: '',
          bankName: '',
          isKhqr: false,
          error: 'មានបញ្ហាក្នុងការអាន QR Code៖ ' + String(err)
        });
      }
    };

    img.onerror = () => {
      resolve({
        success: false,
        accountNumber: '',
        accountName: '',
        bankName: '',
        isKhqr: false,
        error: 'មិនអាចបើករូបភាពបានទេ។ សូមពិនិត្យឯកសាររូបភាពឡើងវិញ។'
      });
    };

    img.src = imageSrc;
  });
}
