import { NodeData } from '../types';

export type CostTab = 'FABRIC' | 'CUTTING' | 'ASSEMBLY' | 'MEASURE';
export type SidebarMode = 'PRODUCT' | 'ASSEMBLY';
export type CostCategory = 'ROLL' | 'SLAT' | 'GRID';
export type LengthUnit = 'm' | 'yd' | 'cm' | 'inch';
export type MeasureUnit = 'SQM' | 'CUTTING_LINK' | 'PER_PIECE';
export type MeasureCategory = 'MARGIN_MEASURE' | 'FULL_MEASURE' | 'MARGIN_LOGO' | 'FIXED_LOGO';

export interface GridSizeItem {
    id: string;
    width: string;   // 가로 (cm), 소수 1자리까지
    height: string;  // 세로 (cm), 소수 1자리까지
    price: string;   // 표준원가 (원)
}

export interface FabricCostItem {
    id: string;
    category: CostCategory; // 구분
    lengthUnit: LengthUnit; // 단위
    width: string;     // 폭
    height?: string;   // 높이 (SLAT specific)
    rollLength: string;// 표준롤길이
    rollPrice: string; // 롤단가
    meterPrice: string;// 단위당단가 (m or yd)
    cuttingPrice?: string; // 절단 표준원가 (New)
    cuttingMeterPrice?: string; // 절단 길이(m) 표준원가 (New)
    gridItems?: GridSizeItem[]; // 규격(GRID) 복수 항목 (New)
    updatedAt: string;
}

export interface CuttingCostItem {
    id: string;
    basicArea: string;    // 기본㎡
    minWidth: string;     // 가로 최소
    maxWidth: string;     // 가로 최대
    minHeight: string;    // 세로 최소
    maxHeight: string;    // 세로 최대
    standardPrice: string;// 표준원가
    unit?: 'SQM' | 'WIDTH'; // 단위 (제곱미터 or 폭)
    standardWidth?: string; // 기준폭 (cm) - unit이 WIDTH일 때 사용
    updatedAt: string;
}

export interface MeasureCostItem {
    id: string;
    category: MeasureCategory; // 구분 (여백실사, 꽉찬실사 등)
    unit: MeasureUnit;    // 단위 (㎡, 제단연동, 건당)
    standardPrice: string;// 표준원가 (or Percentage for CUTTING_LINK)
    updatedAt: string;
}

export interface PartCostItem {
    id: string;
    name: string;             // 부품명
    spec: string;             // 규격
    usageUnit: string;        // 사용단위
    usageQty: string;         // 사용량
    inventoryUnit: string;    // 재고단위
    cost: string;             // 원가
    workOrderType: 'OK' | 'NO'; // 작업지시서 OK/NO
    workOrderDesc: string;    // 작지설명
    updatedAt: string;
}

export interface BomItem {
    id: string;
    partId: string;
    usageUnit: string;
    usageQty: string;
    extraFormula?: string;
}

export interface TabConfigOptions {
    includeSourceIds: boolean;
    includeVirtualChildren: boolean;
    useSystemTree: boolean;
}

export const TAB_CONFIG: Record<CostTab, TabConfigOptions> = {
    FABRIC: {
        includeSourceIds: true,
        includeVirtualChildren: true,
        useSystemTree: false
    },
    CUTTING: {
        includeSourceIds: true,
        includeVirtualChildren: true,
        useSystemTree: false
    },
    ASSEMBLY: {
        includeSourceIds: false,  // 명시적으로 false (중복 방지)
        includeVirtualChildren: false,
        useSystemTree: true
    },
    MEASURE: {
        includeSourceIds: true,
        includeVirtualChildren: true,
        useSystemTree: false
    }
};
