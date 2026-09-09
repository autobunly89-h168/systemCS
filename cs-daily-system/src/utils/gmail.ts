import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/gmail.send');

let cachedAccessToken: string | null = null;

export const getCachedAccessToken = () => cachedAccessToken;

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (credential?.accessToken) {
      cachedAccessToken = credential.accessToken;
    }
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (err) {
    console.error('Sign in with Google error:', err);
    throw err;
  }
};

/**
 * Base64URL encode string for Gmail API
 */
function base64UrlEncode(str: string) {
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Send 6-digit verification code email via Gmail API
 */
export async function sendVerificationCodeEmail(
  toEmail: string,
  code: string,
  accessTokenOverride?: string | null
): Promise<{ success: boolean; message?: string }> {
  let token = accessTokenOverride || cachedAccessToken;

  if (!token) {
    try {
      const res = await signInWithGoogle();
      token = res.accessToken;
    } catch (err: any) {
      return {
        success: false,
        message: 'សូមចុច Sign in with Google ដើម្បីអនុញ្ញាតឲ្យប្រព័ន្ធផ្ញើសារចូល Gmail របស់អ្នក។ (' + (err.message || '') + ')'
      };
    }
  }

  if (!token) {
    return { success: false, message: 'មិនមាន Google Access Token សម្រាប់ផ្ញើសារឡើយ។' };
  }

  const subject = `[CS Daily System] លេខកូដផ្លាស់ប្តូរពាក្យសម្ងាត់របស់អ្នកគឺ: ${code}`;
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #334155; border-radius: 12px; background-color: #0f172a; color: #f8fafc;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #38bdf8; margin: 0; font-size: 20px;">CS Daily System</h2>
        <p style="color: #94a3b8; font-size: 13px; margin-top: 4px;">ប្រព័ន្ធផ្លាស់ប្តូរពាក្យសម្ងាត់សុវត្ថិភាព</p>
      </div>
      <div style="background-color: #1e293b; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px; border: 1px solid #475569;">
        <p style="color: #cbd5e1; font-size: 14px; margin-top: 0;">លេខកូដផ្ទៀងផ្ទាត់ 6 ខ្ទង់របស់អ្នកគឺ៖</p>
        <div style="font-size: 32px; font-weight: bold; font-family: monospace; letter-spacing: 6px; color: #f59e0b; background-color: #090d16; padding: 12px 20px; border-radius: 6px; display: inline-block; margin: 12px 0;">
          ${code}
        </div>
        <p style="color: #94a3b8; font-size: 12px; margin-bottom: 0;">លេខកូដនេះត្រូវបានប្រើសម្រាប់ផ្លាស់ប្តូរពាក្យសម្ងាត់គណនីរបស់អ្នក។</p>
      </div>
      <p style="color: #64748b; font-size: 11px; text-align: center; margin: 0;">ប្រសិនបើអ្នកមិនបានស្នើសុំលេខកូដនេះទេ សូមរំលងសារនេះ។</p>
    </div>
  `;

  const rawMessage = [
    `To: ${toEmail}`,
    `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
    `Content-Type: text/html; charset=utf-8`,
    `MIME-Version: 1.0`,
    ``,
    htmlBody
  ].join('\r\n');

  const encodedRaw = base64UrlEncode(rawMessage);

  try {
    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ raw: encodedRaw })
    });

    const data = await res.json();
    if (res.ok && data.id) {
      return { success: true };
    } else {
      console.error('Gmail API Error Response:', data);
      return {
        success: false,
        message: data.error?.message || 'ការផ្ញើសារតាម Gmail មានបញ្ហា! សូមព្យាយាមម្ដងទៀត។'
      };
    }
  } catch (err: any) {
    console.error('Gmail Send Exception:', err);
    return { success: false, message: err.message || ' Network Connection Error ' };
  }
}
