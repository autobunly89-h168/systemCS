// Authentication & Admin Role Management System

export const STORAGE_KEY_USER_EMAIL = 'cs_logged_in_user_email';
export const STORAGE_KEY_ADMIN_LIST = 'cs_admin_emails_list';
export const STORAGE_KEY_REGISTERED_USERS = 'cs_registered_users_db';

export const SUPER_ADMIN_EMAIL = 'hongbunly89@gmail.com';
export const DEFAULT_ADMIN_EMAILS = [
  'hongbunly89@gmail.com',
  'todofi4256@barumart.com'
];

/**
 * Get registered user credentials map (email -> password)
 */
export const getRegisteredUsers = (): Record<string, string> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_REGISTERED_USERS);
    if (!raw) {
      const initial: Record<string, string> = {
        [SUPER_ADMIN_EMAIL.toLowerCase()]: 'admin123',
      };
      localStorage.setItem(STORAGE_KEY_REGISTERED_USERS, JSON.stringify(initial));
      return initial;
    }
    const parsed: Record<string, string> = JSON.parse(raw);
    if (!parsed[SUPER_ADMIN_EMAIL.toLowerCase()]) {
      parsed[SUPER_ADMIN_EMAIL.toLowerCase()] = 'admin123';
      localStorage.setItem(STORAGE_KEY_REGISTERED_USERS, JSON.stringify(parsed));
    }
    return parsed;
  } catch {
    return {
      [SUPER_ADMIN_EMAIL.toLowerCase()]: 'admin123',
    };
  }
};

/**
 * Register a new Gmail user account with password
 */
export const registerNewUser = (email: string, password: string): { success: boolean; message: string } => {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { success: false, message: 'សូមបញ្ចូលអាសយដ្ឋាន Gmail ឱ្យបានត្រឹមត្រូវ!' };
  }
  if (!password || password.length < 4) {
    return { success: false, message: 'ពាក្យសម្ងាត់ត្រូវមានយ៉ាងហោចណាស់ 4 តួអក្សរ!' };
  }

  const users = getRegisteredUsers();
  if (users[cleanEmail]) {
    return { success: false, message: 'Gmail នេះបានចុះឈ្មោះរួចហើយ! សូមជ្រើសរើស "ចូលប្រើប្រាស់ (Sign In)"។' };
  }

  users[cleanEmail] = password;
  localStorage.setItem(STORAGE_KEY_REGISTERED_USERS, JSON.stringify(users));
  return { success: true, message: 'ចុះឈ្មោះបង្កើតគណនីបានជោគជ័យ!' };
};

/**
 * Reset password for user
 */
export const resetUserPassword = (email: string, newPassword: string): { success: boolean; message: string } => {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { success: false, message: 'សូមបញ្ចូលអាសយដ្ឋាន Gmail ឱ្យបានត្រឹមត្រូវ!' };
  }
  if (!newPassword || newPassword.length < 4) {
    return { success: false, message: 'ពាក្យសម្ងាត់ថ្មីត្រូវមានយ៉ាងហោចណាស់ 4 តួអក្សរ!' };
  }

  const users = getRegisteredUsers();
  users[cleanEmail] = newPassword;
  localStorage.setItem(STORAGE_KEY_REGISTERED_USERS, JSON.stringify(users));
  return { success: true, message: 'ប្តូរពាក្យសម្ងាត់បានជោគជ័យ!' };
};

/**
 * Verify user credentials for login
 */
export const verifyUserLogin = (email: string, password: string): { success: boolean; message: string } => {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { success: false, message: 'សូមបញ្ចូលអាសយដ្ឋាន Gmail ឱ្យបានត្រឹមត្រូវ!' };
  }
  if (!password) {
    return { success: false, message: 'សូមបញ្ចូលពាក្យសម្ងាត់!' };
  }

  const users = getRegisteredUsers();
  const storedPassword = users[cleanEmail];

  if (!storedPassword) {
    return { success: false, message: 'អាសយដ្ឋាន Gmail នេះមិនទាន់មានក្នុងប្រព័ន្ធទេ! សូមចុះឈ្មោះបង្កើតគណនី (Register) ជាមុនសិន។' };
  }

  if (storedPassword !== password) {
    return { success: false, message: 'ពាក្យសម្ងាត់មិនត្រឹមត្រូវទេ! សូមពិនិត្យឡើងវិញ។' };
  }

  return { success: true, message: 'ផ្ទៀងផ្ទាត់ជោគជ័យ!' };
};

/**
 * Get current admin list from localStorage or initialize with DEFAULT_ADMIN_EMAILS
 */
export const getAdminEmails = (): string[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ADMIN_LIST);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_ADMIN_LIST, JSON.stringify(DEFAULT_ADMIN_EMAILS));
      return DEFAULT_ADMIN_EMAILS;
    }
    const parsed: string[] = JSON.parse(raw);
    const cleaned = parsed.map(e => e.trim().toLowerCase());
    let modified = false;
    for (const def of DEFAULT_ADMIN_EMAILS) {
      if (!cleaned.includes(def.toLowerCase())) {
        cleaned.push(def.toLowerCase());
        modified = true;
      }
    }
    if (modified) {
      localStorage.setItem(STORAGE_KEY_ADMIN_LIST, JSON.stringify(cleaned));
    }
    return cleaned;
  } catch {
    return DEFAULT_ADMIN_EMAILS;
  }
};

/**
 * Fetch shared admin emails list from central backend server
 */
export const fetchSharedAdminsAsync = async (): Promise<string[]> => {
  try {
    const res = await fetch('/api/admins');
    if (res.ok) {
      const data = await res.json();
      if (data && data.admins && Array.isArray(data.admins)) {
        const cleaned = data.admins.map((e: string) => String(e).trim().toLowerCase());
        for (const def of DEFAULT_ADMIN_EMAILS) {
          if (!cleaned.includes(def.toLowerCase())) {
            cleaned.push(def.toLowerCase());
          }
        }
        localStorage.setItem(STORAGE_KEY_ADMIN_LIST, JSON.stringify(cleaned));
        return cleaned;
      }
    }
  } catch (err) {
    console.warn('Backend server admin fetch offline, using local admin cache:', err);
  }
  return getAdminEmails();
};

/**
 * Sync admin list to central backend server
 */
export const syncAdminsToServer = async (admins: string[]): Promise<void> => {
  try {
    await fetch('/api/admins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ admins })
    });
  } catch (err) {
    console.warn('Failed to sync admins to central server:', err);
  }
};

/**
 * Get logged in Gmail address
 */
export const getLoggedInUser = (): string | null => {
  return localStorage.getItem(STORAGE_KEY_USER_EMAIL);
};

/**
 * Set logged in Gmail address
 */
export const setLoggedInUser = (email: string) => {
  const cleanEmail = email.trim().toLowerCase();
  localStorage.setItem(STORAGE_KEY_USER_EMAIL, cleanEmail);
};

/**
 * Logout current user
 */
export const logoutUser = () => {
  localStorage.removeItem(STORAGE_KEY_USER_EMAIL);
};

/**
 * Check if given email or logged in user is Super Admin
 */
export const isSuperAdmin = (email?: string | null): boolean => {
  const target = (email || getLoggedInUser() || '').trim().toLowerCase();
  return target === SUPER_ADMIN_EMAIL.toLowerCase();
};

/**
 * Check if given email or logged in user is Admin
 */
export const isAdminUser = (email?: string | null): boolean => {
  const target = (email || getLoggedInUser() || '').trim().toLowerCase();
  if (!target) return false;
  const adminList = getAdminEmails();
  return adminList.includes(target);
};

/**
 * Add a new Admin Gmail
 */
export const addAdminEmail = (email: string): { success: boolean; message: string } => {
  const clean = email.trim().toLowerCase();
  if (!clean || !clean.includes('@')) {
    return { success: false, message: 'សូមបញ្ចូលអាសយដ្ឋាន Gmail ត្រឹមត្រូវ!' };
  }
  const admins = getAdminEmails();
  if (admins.includes(clean)) {
    return { success: false, message: 'Gmail នេះមានសិទ្ធិជា Admin រួចហើយ!' };
  }
  admins.push(clean);
  localStorage.setItem(STORAGE_KEY_ADMIN_LIST, JSON.stringify(admins));
  syncAdminsToServer(admins);
  return { success: true, message: `បានបន្ថែម Admin (${clean}) ដោយជោគជ័យ!` };
};

/**
 * Remove an Admin Gmail
 */
export const removeAdminEmail = (email: string): { success: boolean; message: string } => {
  const clean = email.trim().toLowerCase();
  if (clean === SUPER_ADMIN_EMAIL.toLowerCase()) {
    return { success: false, message: 'មិនអាចលុប Super Admin (hongbunly89@gmail.com) បានទេ!' };
  }
  const admins = getAdminEmails();
  const filtered = admins.filter(a => a !== clean);
  localStorage.setItem(STORAGE_KEY_ADMIN_LIST, JSON.stringify(filtered));
  syncAdminsToServer(filtered);
  return { success: true, message: `បានលុប Admin (${clean}) រួចរាល់!` };
};
