// Authentication & Admin Role Management System

export const STORAGE_KEY_USER_EMAIL = 'cs_logged_in_user_email';
export const STORAGE_KEY_ADMIN_LIST = 'cs_admin_emails_list';
export const STORAGE_KEY_REGISTERED_USERS = 'cs_registered_users_db';

export const SUPER_ADMIN_EMAIL = 'hongbunly89@gmail.com';
export const DEFAULT_ADMIN_EMAILS = [
  'hongbunly89@gmail.com'
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
    return { success: false, message: `អាសយដ្ឋាន Gmail [${cleanEmail}] នេះបានចុះឈ្មោះក្នុងប្រព័ន្ធរួចរាល់ហើយ! មិនអាចចុះឈ្មោះម្តងទៀតបានទេ។ សូមជ្រើសរើស "ចូលប្រើប្រាស់ (Sign In)"។` };
  }

  users[cleanEmail] = password;
  localStorage.setItem(STORAGE_KEY_REGISTERED_USERS, JSON.stringify(users));
  return { success: true, message: 'ចុះឈ្មោះបង្កើតគណនីបានជោគជ័យ!' };
};

/**
 * Register a new Gmail user account with central server & local cache
 */
export const registerNewUserAsync = async (email: string, password: string, photoUrl?: string): Promise<{ success: boolean; message: string }> => {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { success: false, message: 'សូមបញ្ចូលអាសយដ្ឋាន Gmail ឱ្យបានត្រឹមត្រូវ!' };
  }
  if (!password || password.length < 4) {
    return { success: false, message: 'ពាក្យសម្ងាត់ត្រូវមានយ៉ាងហោចណាស់ 4 តួអក្សរ!' };
  }

  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, password, photoUrl })
    });
    const data = await res.json();
    if (data) {
      if (data.success) {
        const users = getRegisteredUsers();
        users[cleanEmail] = password;
        localStorage.setItem(STORAGE_KEY_REGISTERED_USERS, JSON.stringify(users));
        return { success: true, message: data.message || 'ចុះឈ្មោះបង្កើតគណនីបានជោគជ័យ!' };
      } else {
        return { success: false, message: data.message || 'មិនអាចចុះឈ្មោះបានទេ!' };
      }
    }
  } catch (err) {
    console.warn('Backend server register offline, using local store:', err);
  }

  return registerNewUser(cleanEmail, password);
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
 * Reset password for user with central server
 */
export const resetUserPasswordAsync = async (email: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { success: false, message: 'សូមបញ្ចូលអាសយដ្ឋាន Gmail ឱ្យបានត្រឹមត្រូវ!' };
  }
  if (!newPassword || newPassword.length < 4) {
    return { success: false, message: 'ពាក្យសម្ងាត់ថ្មីត្រូវមានយ៉ាងហោចណាស់ 4 តួអក្សរ!' };
  }

  try {
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, newPassword })
    });
    const data = await res.json();
    if (data) {
      if (data.success) {
        const users = getRegisteredUsers();
        users[cleanEmail] = newPassword;
        localStorage.setItem(STORAGE_KEY_REGISTERED_USERS, JSON.stringify(users));
        return { success: true, message: data.message || 'ប្តូរពាក្យសម្ងាត់បានជោគជ័យ!' };
      } else {
        return { success: false, message: data.message || 'មិនអាចប្តូរពាក្យសម្ងាត់បានទេ!' };
      }
    }
  } catch (err) {
    console.warn('Backend server reset password offline, using local store:', err);
  }

  return resetUserPassword(cleanEmail, newPassword);
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
    return { success: false, message: `អាសយដ្ឋាន Gmail [${cleanEmail}] នេះមិនទាន់មានក្នុងប្រព័ន្ធទេ! សូមចុះឈ្មោះបង្កើតគណនី (Register) ជាមុនសិន។` };
  }

  if (storedPassword !== password) {
    return { success: false, message: 'ពាក្យសម្ងាត់មិនត្រឹមត្រូវទេ! សូមពិនិត្យឡើងវិញ។' };
  }

  return { success: true, message: 'ផ្ទៀងផ្ទាត់ជោគជ័យ!' };
};

/**
 * Verify user credentials for login with central server
 */
export const verifyUserLoginAsync = async (email: string, password: string): Promise<{ success: boolean; message: string; photoUrl?: string }> => {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { success: false, message: 'សូមបញ្ចូលអាសយដ្ឋាន Gmail ឱ្យបានត្រឹមត្រូវ!' };
  }
  if (!password) {
    return { success: false, message: 'សូមបញ្ចូលពាក្យសម្ងាត់!' };
  }

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, password })
    });
    const data = await res.json();
    if (data) {
      if (data.success) {
        const users = getRegisteredUsers();
        users[cleanEmail] = password;
        localStorage.setItem(STORAGE_KEY_REGISTERED_USERS, JSON.stringify(users));
        if (data.photoUrl) {
          setUserProfilePhoto(cleanEmail, data.photoUrl);
        }
        return { success: true, message: data.message || 'ចូលប្រើប្រាស់បានជោគជ័យ!', photoUrl: data.photoUrl };
      } else {
        return { success: false, message: data.message || 'មិនអាចចូលប្រើប្រាស់បានទេ!' };
      }
    }
  } catch (err) {
    console.warn('Backend server login offline, using local store:', err);
  }

  return verifyUserLogin(cleanEmail, password);
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
    const superAdmin = SUPER_ADMIN_EMAIL.toLowerCase();
    if (!cleaned.includes(superAdmin)) {
      cleaned.unshift(superAdmin);
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
        const superAdmin = SUPER_ADMIN_EMAIL.toLowerCase();
        if (!cleaned.includes(superAdmin)) {
          cleaned.unshift(superAdmin);
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
export const syncAdminsToServer = async (admins: string[]): Promise<string[]> => {
  try {
    const res = await fetch('/api/admins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ admins })
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.admins && Array.isArray(data.admins)) {
        const cleaned = data.admins.map((e: string) => String(e).trim().toLowerCase());
        const superAdmin = SUPER_ADMIN_EMAIL.toLowerCase();
        if (!cleaned.includes(superAdmin)) {
          cleaned.unshift(superAdmin);
        }
        localStorage.setItem(STORAGE_KEY_ADMIN_LIST, JSON.stringify(cleaned));
        return cleaned;
      }
    }
  } catch (err) {
    console.warn('Failed to sync admins to central server:', err);
  }
  return admins;
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
 * Logout current user and remove from active list
 */
export const logoutUser = () => {
  const current = getLoggedInUser();
  if (current) {
    try {
      fetch('/api/active-users/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: current })
      }).catch(err => console.warn('Logout notification error:', err));
    } catch {
      // Ignore network error on logout
    }
  }
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
export const addAdminEmail = async (email: string): Promise<{ success: boolean; message: string }> => {
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
  await syncAdminsToServer(admins);
  return { success: true, message: `បានបន្ថែម Admin (${clean}) ដោយជោគជ័យ!` };
};

/**
 * Remove an Admin Gmail
 */
export const removeAdminEmail = async (email: string): Promise<{ success: boolean; message: string }> => {
  const clean = email.trim().toLowerCase();
  if (clean === SUPER_ADMIN_EMAIL.toLowerCase()) {
    return { success: false, message: 'មិនអាចលុប Super Admin (hongbunly89@gmail.com) បានទេ!' };
  }
  const admins = getAdminEmails();
  const filtered = admins.filter(a => a !== clean);
  localStorage.setItem(STORAGE_KEY_ADMIN_LIST, JSON.stringify(filtered));
  await syncAdminsToServer(filtered);
  return { success: true, message: `បានលុប Admin (${clean}) រួចរាល់!` };
};

export const STORAGE_KEY_USER_PROFILES = 'cs_user_profiles_db';

/**
 * Get saved profile photo for a user email
 */
export const getUserProfilePhoto = (email: string): string => {
  if (!email) return '';
  try {
    const clean = email.trim().toLowerCase();
    const raw = localStorage.getItem(STORAGE_KEY_USER_PROFILES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed[clean] && parsed[clean].photoUrl) {
        return parsed[clean].photoUrl;
      }
    }
  } catch (err) {
    console.warn('Error reading user profile photo:', err);
  }
  return '';
};

/**
 * Save custom profile photo (URL or Base64 image) for a user email
 */
export const setUserProfilePhoto = (email: string, photoUrl: string): void => {
  if (!email) return;
  try {
    const clean = email.trim().toLowerCase();
    const raw = localStorage.getItem(STORAGE_KEY_USER_PROFILES);
    const parsed = raw ? JSON.parse(raw) : {};
    parsed[clean] = { ...(parsed[clean] || {}), photoUrl };
    localStorage.setItem(STORAGE_KEY_USER_PROFILES, JSON.stringify(parsed));
    // Ping backend with updated photoUrl immediately
    pingActiveUserAsync(clean, undefined, photoUrl);
  } catch (err) {
    console.warn('Error saving user profile photo:', err);
  }
};

export interface ActiveUserRecord {
  email: string;
  displayName?: string;
  photoUrl?: string;
  lastActive: string;
  role: 'Super Admin' | 'Admin' | 'CS Staff';
}

export interface ActiveUsersDataResponse {
  users: ActiveUserRecord[];
  blockedUsers: string[];
}

/**
 * Fetch all active/logged-in users and blocked users from backend
 */
export const fetchActiveUsersDataAsync = async (): Promise<ActiveUsersDataResponse> => {
  try {
    const res = await fetch('/api/active-users');
    if (res.ok) {
      const data = await res.json();
      if (data) {
        return {
          users: Array.isArray(data.users) ? data.users : [],
          blockedUsers: Array.isArray(data.blockedUsers) ? data.blockedUsers : []
        };
      }
    }
  } catch (err) {
    console.warn('Failed to fetch active users:', err);
  }
  return { users: [], blockedUsers: [] };
};

/**
 * Fetch all active/logged-in users from backend
 */
export const fetchActiveUsersAsync = async (): Promise<ActiveUserRecord[]> => {
  const data = await fetchActiveUsersDataAsync();
  return data.users;
};

/**
 * Block/Revoke a user Gmail address by Admin
 */
export const blockUserAsync = async (email: string): Promise<{ success: boolean; message: string; users: ActiveUserRecord[]; blockedUsers: string[] }> => {
  const cleanEmail = email.trim().toLowerCase();
  try {
    const res = await fetch('/api/active-users/block', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail })
    });
    const data = await res.json();
    if (res.ok && data.success) {
      return {
        success: true,
        message: data.message || `បានដកសិទ្ធិ ${cleanEmail} រួចរាល់!`,
        users: Array.isArray(data.users) ? data.users : [],
        blockedUsers: Array.isArray(data.blockedUsers) ? data.blockedUsers : []
      };
    } else {
      return {
        success: false,
        message: data.message || 'មិនអាចដកសិទ្ធិបានទេ!',
        users: [],
        blockedUsers: []
      };
    }
  } catch (err) {
    return { success: false, message: 'កំហុសបណ្តាញ!', users: [], blockedUsers: [] };
  }
};

/**
 * Unblock a user Gmail address by Admin
 */
export const unblockUserAsync = async (email: string): Promise<{ success: boolean; message: string; users: ActiveUserRecord[]; blockedUsers: string[] }> => {
  const cleanEmail = email.trim().toLowerCase();
  try {
    const res = await fetch('/api/active-users/unblock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail })
    });
    const data = await res.json();
    if (res.ok && data.success) {
      return {
        success: true,
        message: data.message || `បានអនុញ្ញាត ${cleanEmail} ឡើងវិញ!`,
        users: Array.isArray(data.users) ? data.users : [],
        blockedUsers: Array.isArray(data.blockedUsers) ? data.blockedUsers : []
      };
    } else {
      return {
        success: false,
        message: data.message || 'មិនអាចអនុញ្ញាតឡើងវិញបានទេ!',
        users: [],
        blockedUsers: []
      };
    }
  } catch (err) {
    return { success: false, message: 'កំហុសបណ្តាញ!', users: [], blockedUsers: [] };
  }
};

/**
 * Ping active status for current logged-in user
 */
export const pingActiveUserAsync = async (email: string, displayName?: string, photoUrl?: string): Promise<{ users: ActiveUserRecord[]; blocked?: boolean; message?: string }> => {
  if (!email) return { users: await fetchActiveUsersAsync() };
  const cleanEmail = email.trim().toLowerCase();
  const resolvedPhoto = photoUrl || getUserProfilePhoto(cleanEmail) || `https://unavatar.io/${cleanEmail}`;

  try {
    const res = await fetch('/api/active-users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, displayName, photoUrl: resolvedPhoto })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.blocked) {
        return { users: [], blocked: true, message: data.message };
      }
      if (data && data.users && Array.isArray(data.users)) {
        return { users: data.users };
      }
    }
  } catch (err) {
    console.warn('Failed to ping active user:', err);
  }
  return { users: await fetchActiveUsersAsync() };
};
