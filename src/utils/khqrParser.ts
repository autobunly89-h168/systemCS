import jsQR from 'jsqr';

export const CAMBODIA_BANKS: Record<string, string> = {
  "aba": "ABA Bank",
  "abab": "ABA Bank",
  "abaa": "ABA Bank",
  "acleda": "ACLEDA Bank",
  "wing": "Wing Bank",
  "canadia": "Canadia Bank",
  "sathapana": "Sathapana Bank",
  "hattha": "Hattha Bank",
  "hata": "Hattha Bank",
  "prasac": "KB Prasac Bank",
  "kbprasac": "KB Prasac Bank",
  "amk": "AMK Microfinance",
  "ppcb": "PPCBank",
  "phillip": "Phillip Bank",
  "ftb": "Foreign Trade Bank (FTB)",
  "chipmong": "Chip Mong Bank",
  "maybank": "Maybank Cambodia",
  "rhb": "RHB Bank",
  "bic": "BIC Bank",
  "hongleong": "Hong Leong Bank",
  "cathay": "Cathay United Bank",
  "jtrust": "J Trust Royal Bank",
  "jtrb": "J Trust Royal Bank",
  "prince": "Prince Bank",
  "woori": "Woori Bank",
  "vattanac": "Vattanac Bank",
  "bred": "BRED Bank",
  "shinhan": "Shinhan Bank",
  "cica": "Chiyu Banking Corporation",
  "truemoney": "TrueMoney",
  "true": "TrueMoney",
  "emoney": "eMoney",
  "pipay": "Pi Pay",
  "pipayasia": "Pi Pay",
  "bakong": "Bakong System"
};

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

  for (const t of blockTags) {
    if (rootData[t]) {
      merchantBlock = rootData[t];
      break;
    }
  }

  if (merchantBlock) {
    const acc = parseTLV(merchantBlock);
    const rawNumber = acc["01"] || acc["00"] || '';
    const name = rootData["59"] || acc["02"] || '';
    const bank = detectBankName(acc, rootData);
    const amount = rootData["54"] || undefined;
    const currencyCode = rootData["53"];
    const currency = currencyCode === '840' ? 'USD' : currencyCode === '116' ? 'KHR' : undefined;

    // Clean account number (if format is like username@bank, keep it or clean)
    const accountNumber = rawNumber.trim();

    return {
      success: true,
      rawText: clean,
      accountNumber,
      accountName: name.trim().toUpperCase(),
      bankName: bank,
      amount,
      currency,
      isKhqr: true
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
