export type ShiftType = 'វេនព្រឹក' | 'វេនយប់';

export type PlatformType = 'Telegram Bot' | 'ALL Telegram' | 'Page' | 'Facebook' | 'TikTok' | 'Website Direct' | 'Other' | (string & {});

export type StatusType = 'New Register' | 'Come in' | 'Deposit' | 'Deposit ថែម' | 'Updated (កែទិន្នន័យ)' | 'Pending';

export interface CustomerRecord {
  id: string; // Internal unique ID
  serialNo: number; // Col 0
  regDate: string; // Col 1: dd MMM yyyy or yyyy-MM-dd
  profileName: string; // Col 2
  customerId: string; // Col 3
  password?: string; // Col 4
  platform: PlatformType; // Col 5
  sourceName: string; // Col 6
  status: StatusType | string; // Col 7
  contactLink: string; // Col 8: TG / FB Link / Phone
  col9?: string; // Col 9: Reserved
  col10?: string; // Col 10: Reserved
  depositAmount: number; // Col 11
  depositDate: string; // Col 12
  bankName: string; // Col 13
  bankAccountName: string; // Col 14
  bankAccountNumber: string; // Col 15
  shift: ShiftType; // Col 16
  csId: string; // Col 17
  website: string; // Col 18: Website Name
  timestamp: string; // Col 19
}

export interface RegistrationFormData {
  profileName: string;
  customerId: string;
  password?: string;
  platform: PlatformType;
  sourceName: string;
  status: StatusType | string;
  contactLink: string;
  depositAmount: number;
  depositDate: string;
  bankName: string;
  bankAccountName: string;
  bankAccountNumber: string;
  csId: string;
  isDepositOnly?: boolean;
}

export interface WebsiteInfo {
  id: string;
  name: string;
  displayName: string;
  color: string;
  category?: string;
}

export interface DashboardStats {
  totalComIn: number;
  totalRegistered: number;
  totalNewDeposits: number;
  totalDepositAmount: number;
  platformBreakdown: Record<string, { count: number; amount: number }>;
  shiftBreakdown: {
    morningCount: number;
    morningAmount: number;
    nightCount: number;
    nightAmount: number;
  };
}

export interface ReportFilter {
  startDate: string;
  endDate: string;
  website: string; // 'ALL' or specific website name
  source: string; // 'ALL' or specific source
  csId: string; // 'ALL' or specific CS ID
}
