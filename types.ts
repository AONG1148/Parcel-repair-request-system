
export enum Department {
  IT = 'แผนกช่างคอมพิวเตอร์',
  ACCOUNTING = 'แผนกการบัญชี',
  MARKETING = 'แผนกการตลาด',
  MECHANIC = 'แผนกช่างยนต์',
  ELECTRIC = 'แผนกช่างไฟฟ้า',
  GENERAL = 'สำนักงานทั่วไป'
}

export enum RepairStatus {
  PENDING = 'รออนุมัติ',
  IN_PROGRESS = 'อยู่ระหว่างดำเนินการ',
  WAITING_PARTS = 'รออะไหล่',
  COMPLETED = 'ซ่อมเสร็จแล้ว',
  CANCELLED = 'ยกเลิก'
}

export interface RepairRequest {
  reporterName: string;
  department: string;
  roomNumber: string;
  parcelQuantity: number | string;
  assetId: string;
  symptoms: string;
  timestamp: string;
  aiDiagnosis?: string;
  urgency?: string;
  status: RepairStatus;
  estimatedDays?: number;
  returnDate?: string;
}

export interface AIAnalysisResult {
  urgency: 'Low' | 'Medium' | 'High';
  probableCause: string;
  suggestion: string;
  estimatedRepairDays: number;
}

export interface AppConfig {
  sheetUrl: string;
}

export interface RepairTicket {
  rowIndex: number;
  timestamp: string;
  reporterName: string;
  department: string;
  roomNumber: string;
  assetId: string;
  symptoms: string;
  parcelQuantity: string | number;
  aiDiagnosis: string;
  status: string;
  estimatedDays: string | number;
  returnDate: string;
}