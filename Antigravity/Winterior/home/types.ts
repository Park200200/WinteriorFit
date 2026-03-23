
import { LucideIcon } from 'lucide-react';

export enum UserRole {
  GUEST = 'GUEST',          // 로그인 전
  USER = 'USER',            // 일반 사용자
  AGENCY = 'AGENCY',        // 대리점
  DISTRIBUTOR = 'DISTRIBUTOR', // 유통사
  MANUFACTURER = 'MANUFACTURER', // 제조사
  FABRIC_SUPPLIER = 'FABRIC_SUPPLIER', // 원단공급사
  ADMIN = 'ADMIN'           // 관리사
}

export interface MenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
  isPersistent?: boolean; // If true, stays visible even when sidebar auto-hides
  action?: 'LOGIN' | 'LOGOUT' | 'TOGGLE_THEME' | 'NAVIGATE';
  isBottomFixed?: boolean; // For the fixed 'Ai카다록' menu in User role
  badge?: string; // Notification badge count (e.g., "1", "2")
  subItems?: MenuItem[]; // Optional nested sub-menus
}

export interface RoleConfig {
  role: UserRole;
  label: string;
  description: string;
  color: string;
}

// --- Mind Map & Product Data Types ---
export type NodeType = 'ROOT' | 'CATEGORY' | 'DATA' | 'REFERENCE' | 'MODIFIED';

export interface NodeData {
  id: string;
  parentId: string | null;
  type: NodeType;
  label: string;
  isExpanded: boolean;
  sourceId?: string; // Legacy support
  sourceIds?: string[]; // Supports multiple reference sources
  childrenIds: string[];
  attributes?: Record<string, string>;
}

// --- Partner Types ---
export type PartnerType = 'DISTRIBUTOR' | 'AGENCY' | 'MANUFACTURER' | 'FABRIC_SUPPLIER';

export interface Address {
  id: string;
  label?: string;   // 주소 이름 (예: 집, 회사)
  address: string;
}

export interface PartnerCostSettings {
  aiCost: string;
  dbManagementCost: string;
  dbUsageCost: string;
  transactionFee: string;
}

export interface GradeMargin {
  id: string;
  grade: string;
  margin: string;
}

export interface FreightInfo {
  transporter: string;
  branchName: string;
  phone: string;
  address: string;
}

export interface PartnerData {
  id: string;
  partnerName: string; // 거래처명
  partnerCode?: string; // 거래처 코드 (3자리)
  adminId: string;     // 관리자ID
  password: string;    // 패스워드
  ceoName: string;     // 대표자명
  addresses: Address[]; // 주소 목록
  companyPhone: string;// 업체전화
  ceoPhone: string;    // 대표전화
  managerName: string; // 담당자명
  managerPhone: string;// 담당전화
  businessNo: string;  // 사업자번호
  businessType: string;// 업태
  businessItem: string;// 업종
  taxEmail: string;    // 계산서이메일
  type: PartnerType;   // 구분
  parentPartnerId?: string; // 상위 유통사 ID (가맹점/제조사일 경우)
  costSettings?: PartnerCostSettings; // 관리비 설정 (Optional)
  grade?: string;      // 거래등급 (A, B, C, D)
  note?: string;       // 비고
  gradeMargins?: GradeMargin[]; // 등급별 마진 설정 (원단공급사 전용)
  freightInfo?: FreightInfo; // 화물도착 정보 (원단공급사 전용)
  creatorId?: string; // 거래처를 등록한 사용자(=공급자) ID
  allowedMenuIds?: string[]; // 총괄관리사가 할당한 메뉴 ID 목록
}
