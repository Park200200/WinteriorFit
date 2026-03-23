import React, { useState, useMemo, useCallback } from 'react';
import { Search, Factory, ChevronDown, CheckSquare, Square, Scissors, Package, Layers, X, Ruler, AlertCircle, Plus, RotateCcw, Zap, ArrowRight, ExternalLink, Printer, Wrench, ChevronRight, Calculator } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProductContext } from './ProductContext';
import { NodeData } from '../types';
import basicTreeRaw from './data/basic_tree.json';

const basicTree = basicTreeRaw as Record<string, any>;

// --- Types ---

interface SystemOrderSpec {
    id: string;
    orderNo: string;
    productNo: string;
    width: number;   // mm
    height: number;  // mm
    qty: number;     // 건수
    selected: boolean;
}

interface SystemBomPart {
    id: string;
    name: string;
    spec: string;
    usageUnit: string;
    usageFormula: string;  // 'W*H/1000000' | 'W/1000' | 'H/1000' | fixed qty
    inventoryUnit: string;
    cost: string;
    stripSize?: number; // 길이단위 부품의 원자재 길이 (mm 단위, 예: 6200)
}
interface ProductionSize {
    width: number;
    height: number;
    label: string;
    uid?: string; // unique id for tracking placement
}

interface OrderProduct {
    id: string;
    orderNo: string;
    productNo: string;
    sizes: ProductionSize[];
    selected: boolean;
}

interface ColorStock {
    colorName: string;
    productionQty: number;
    stockQty: number;
    orders: OrderProduct[];
    expanded: boolean;
}

interface ProductItem {
    id: string;
    name: string;
    totalProductionQty: number;
    colors: ColorStock[];
    expanded: boolean;
}

interface CuttingLine {
    sizes: ProductionSize[];
    used: number;
    waste: number;
    fabricWidth: number; // 해당 라인의 원단폭 (210 or 280)
}

// Fabric width options (global)
const FABRIC_WIDTH_OPTIONS = [210, 280];

// 규격 헬퍼
const sz = (w: number, h: number): ProductionSize => ({ width: w, height: h, label: `${w}×${h}` });

// --- System Order & BOM Mock Data ---
const SYSTEM_ORDER_QTY_MAP: Record<string, number> = {}; // 런타임에 채워짐

// 시스템별 목업 주문 규격 (규격ID → 주문목록)
function generateSystemOrders(sysId: string, systemName: string): SystemOrderSpec[] {
    // 시스템 이름 기반 seed로 결정적 랜덤
    let hash = 0;
    for (let i = 0; i < systemName.length; i++) hash = (hash * 31 + systemName.charCodeAt(i)) & 0xffffffff;
    const abs = Math.abs(hash);
    const count = 12 + (abs % 9); // 12~20건

    const widths = [800, 900, 1000, 1100, 1200, 1300, 1400, 1500, 1600, 1800, 2000, 2200];
    const heights = [1200, 1400, 1600, 1800, 2000, 2200, 2400, 2600];
    const orders: SystemOrderSpec[] = [];
    for (let i = 0; i < count; i++) {
        const seed = abs + i;
        const w = widths[seed % widths.length];
        const h = heights[(seed * 7) % heights.length];
        orders.push({
            id: `sysord-${sysId}-${i}`,
            orderNo: `ORD-26-${(3000 + abs % 1000 + i).toString().padStart(5, '0')}`,
            productNo: `SYS-${systemName.slice(0, 3).toUpperCase()}-${(i + 1).toString().padStart(2, '0')}`,
            width: w,
            height: h,
            qty: 1 + (seed % 3),
            selected: true,
        });
    }
    return orders;
}

// 시스템별 목업 BOM 부품 리스트
function generateSystemBom(sysId: string, systemName: string): SystemBomPart[] {
    const baseList: SystemBomPart[] = [
        {
            id: `bom-${sysId}-1`,
            name: '브라켓',
            spec: '스틸 L형 32mm',
            usageUnit: '개',
            usageFormula: 'fixed:2',
            inventoryUnit: '개',
            cost: '850',
        },
        {
            id: `bom-${sysId}-2`,
            name: '헤드레일',
            spec: '알루미늄 25mm',
            usageUnit: 'm',
            usageFormula: 'W/1000',
            inventoryUnit: 'm',
            cost: '3200',
        },
        {
            id: `bom-${sysId}-3`,
            name: '바텀레일',
            spec: '알루미늄 18mm',
            usageUnit: 'm',
            usageFormula: 'W/1000',
            inventoryUnit: 'm',
            cost: '2100',
        },
        {
            id: `bom-${sysId}-4`,
            name: '라더코드',
            spec: '4mm 폴리에스터',
            usageUnit: 'm',
            usageFormula: 'H/1000*2',
            inventoryUnit: 'm',
            cost: '450',
        },
        {
            id: `bom-${sysId}-5`,
            name: '리프팅코드',
            spec: '2.5mm 나일론',
            usageUnit: 'm',
            usageFormula: 'H/1000*3',
            inventoryUnit: 'm',
            cost: '280',
        },
        {
            id: `bom-${sysId}-6`,
            name: '슬랫',
            spec: '50mm 목재',
            usageUnit: '개',
            usageFormula: 'H/50',
            inventoryUnit: '개',
            cost: '120',
        },
        {
            id: `bom-${sysId}-7`,
            name: '조작봉',
            spec: '플라스틱 Ø8',
            usageUnit: 'm',
            usageFormula: 'H/1000',
            inventoryUnit: 'm',
            cost: '600',
        },
        {
            id: `bom-${sysId}-8`,
            name: '앤드캡',
            spec: 'ABS 수지',
            usageUnit: '개',
            usageFormula: 'fixed:4',
            inventoryUnit: '개',
            cost: '150',
        },
    ];
    // 시스템별로 일부만 노출 (4~6개)
    let hash = 0;
    for (let i = 0; i < systemName.length; i++) hash = (hash * 31 + systemName.charCodeAt(i)) & 0xffffffff;
    const count = 4 + (Math.abs(hash) % 3);
    return baseList.slice(0, count);
}

// BOM 공식으로 소모량 계산
function calcBomUsage(formula: string, w: number, h: number, qty: number): number {
    const W = w, H = h;
    try {
        if (formula.startsWith('fixed:')) {
            return parseFloat(formula.replace('fixed:', '')) * qty;
        }
        // safe eval for simple math expressions with W, H
        // eslint-disable-next-line no-new-func
        const fn = new Function('W', 'H', `return (${formula});`);
        return fn(W, H) * qty;
    } catch {
        return 0;
    }
}

// --- Mock Data (칼라별 규격 20개 이상) ---
const MOCK_PRODUCTS: ProductItem[] = [
    {
        id: 'prod-1', name: '콤비블라인드 엘레강스', totalProductionQty: 125, expanded: false,
        colors: [
            {
                colorName: '아이보리', productionQty: 25, stockQty: 85, expanded: false, orders: [
                    { id: 'op-1a', orderNo: 'ORD-26-001', productNo: 'CB-EL-I-01', selected: true, sizes: [sz(800, 1000), sz(850, 1100), sz(900, 1200), sz(950, 1200), sz(1000, 1200), sz(1050, 1300), sz(1100, 1400)] },
                    { id: 'op-1b', orderNo: 'ORD-26-002', productNo: 'CB-EL-I-02', selected: true, sizes: [sz(1150, 1400), sz(1200, 1500), sz(1250, 1500), sz(1300, 1600), sz(1330, 1650), sz(1360, 1600), sz(1380, 1620)] },
                    { id: 'op-1c', orderNo: 'ORD-26-003', productNo: 'CB-EL-I-03', selected: true, sizes: [sz(1400, 1700), sz(1450, 1700), sz(1480, 1750), sz(1500, 1800), sz(1550, 1800), sz(1580, 1850), sz(1600, 1900)] },
                ]
            },
            {
                colorName: '그레이', productionQty: 22, stockQty: 42, expanded: false, orders: [
                    { id: 'op-2a', orderNo: 'ORD-26-011', productNo: 'CB-EL-G-01', selected: true, sizes: [sz(750, 1000), sz(800, 1050), sz(850, 1100), sz(900, 1150), sz(950, 1200), sz(1000, 1300), sz(1050, 1350)] },
                    { id: 'op-2b', orderNo: 'ORD-26-012', productNo: 'CB-EL-G-02', selected: true, sizes: [sz(1100, 1400), sz(1150, 1450), sz(1200, 1500), sz(1250, 1550), sz(1300, 1600), sz(1350, 1650), sz(1400, 1700)] },
                    { id: 'op-2c', orderNo: 'ORD-26-013', productNo: 'CB-EL-G-03', selected: true, sizes: [sz(1450, 1800), sz(1500, 1800), sz(1550, 1900), sz(1600, 1900), sz(1650, 2000), sz(1700, 2000), sz(1750, 2100)] },
                ]
            },
            {
                colorName: '베이지', productionQty: 20, stockQty: 60, expanded: false, orders: [
                    { id: 'op-3a', orderNo: 'ORD-26-021', productNo: 'CB-EL-B-01', selected: true, sizes: [sz(820, 1000), sz(880, 1050), sz(920, 1100), sz(960, 1200), sz(1000, 1300), sz(1040, 1300), sz(1100, 1400)] },
                    { id: 'op-3b', orderNo: 'ORD-26-022', productNo: 'CB-EL-B-02', selected: true, sizes: [sz(1150, 1450), sz(1200, 1500), sz(1250, 1550), sz(1300, 1600), sz(1350, 1650), sz(1400, 1700), sz(1450, 1800)] },
                    { id: 'op-3c', orderNo: 'ORD-26-023', productNo: 'CB-EL-B-03', selected: true, sizes: [sz(1500, 1850), sz(1550, 1900), sz(1600, 1950), sz(1650, 2000), sz(1700, 2050), sz(1750, 2100), sz(1800, 2200)] },
                ]
            },
            {
                colorName: '모카브라운', productionQty: 20, stockQty: 33, expanded: false, orders: [
                    { id: 'op-4a', orderNo: 'ORD-26-031', productNo: 'CB-EL-M-01', selected: true, sizes: [sz(780, 950), sz(830, 1000), sz(880, 1100), sz(930, 1150), sz(980, 1200), sz(1030, 1300), sz(1080, 1350)] },
                    { id: 'op-4b', orderNo: 'ORD-26-032', productNo: 'CB-EL-M-02', selected: true, sizes: [sz(1130, 1400), sz(1180, 1450), sz(1230, 1500), sz(1280, 1550), sz(1330, 1600), sz(1380, 1650), sz(1430, 1700)] },
                    { id: 'op-4c', orderNo: 'ORD-26-033', productNo: 'CB-EL-M-03', selected: true, sizes: [sz(1480, 1750), sz(1530, 1800), sz(1580, 1900), sz(1630, 2000), sz(1680, 2100), sz(1730, 2200), sz(1780, 2300)] },
                ]
            },
            {
                colorName: '올리브', productionQty: 20, stockQty: 25, expanded: false, orders: [
                    { id: 'op-5a', orderNo: 'ORD-26-041', productNo: 'CB-EL-O-01', selected: true, sizes: [sz(810, 1000), sz(860, 1050), sz(910, 1100), sz(960, 1150), sz(1010, 1200), sz(1060, 1300), sz(1110, 1350)] },
                    { id: 'op-5b', orderNo: 'ORD-26-042', productNo: 'CB-EL-O-02', selected: true, sizes: [sz(1160, 1400), sz(1210, 1450), sz(1260, 1500), sz(1310, 1550), sz(1360, 1600), sz(1410, 1650), sz(1460, 1700)] },
                    { id: 'op-5c', orderNo: 'ORD-26-043', productNo: 'CB-EL-O-03', selected: true, sizes: [sz(1510, 1800), sz(1560, 1850), sz(1610, 1900), sz(1660, 2000), sz(1710, 2100), sz(1760, 2200), sz(1810, 2300)] },
                ]
            },
        ]
    },
    {
        id: 'prod-2', name: '우드블라인드 50mm', totalProductionQty: 105, expanded: false,
        colors: [
            {
                colorName: '오크내추럴', productionQty: 25, stockQty: 35, expanded: false, orders: [
                    { id: 'op-6a', orderNo: 'ORD-26-051', productNo: 'WB-50-OK-01', selected: true, sizes: [sz(900, 1200), sz(1000, 1300), sz(1100, 1400), sz(1200, 1500), sz(1300, 1600), sz(1400, 1700), sz(1500, 1800)] },
                    { id: 'op-6b', orderNo: 'ORD-26-052', productNo: 'WB-50-OK-02', selected: true, sizes: [sz(1550, 1850), sz(1600, 1900), sz(1700, 2000), sz(1750, 2100), sz(1800, 2200), sz(1850, 2250), sz(1900, 2300)] },
                    { id: 'op-6c', orderNo: 'ORD-26-053', productNo: 'WB-50-OK-03', selected: true, sizes: [sz(1950, 2400), sz(2000, 2400), sz(2100, 2500), sz(2200, 2600), sz(2300, 2700), sz(2400, 2800), sz(2500, 2900)] },
                ]
            },
            {
                colorName: '월넛다크', productionQty: 22, stockQty: 28, expanded: false, orders: [
                    { id: 'op-7a', orderNo: 'ORD-26-061', productNo: 'WB-50-WD-01', selected: true, sizes: [sz(850, 1100), sz(950, 1200), sz(1050, 1300), sz(1150, 1400), sz(1250, 1550), sz(1350, 1650), sz(1450, 1750)] },
                    { id: 'op-7b', orderNo: 'ORD-26-062', productNo: 'WB-50-WD-02', selected: true, sizes: [sz(1500, 1850), sz(1550, 1850), sz(1600, 1950), sz(1650, 2050), sz(1750, 2100), sz(1800, 2200), sz(1850, 2300)] },
                    { id: 'op-7c', orderNo: 'ORD-26-063', productNo: 'WB-50-WD-03', selected: true, sizes: [sz(1900, 2400), sz(2000, 2500), sz(2100, 2600), sz(2200, 2700), sz(2300, 2800), sz(2400, 2900), sz(2500, 3000)] },
                ]
            },
            {
                colorName: '체리', productionQty: 20, stockQty: 20, expanded: false, orders: [
                    { id: 'op-8a', orderNo: 'ORD-26-071', productNo: 'WB-50-CH-01', selected: true, sizes: [sz(800, 1000), sz(900, 1100), sz(1000, 1200), sz(1100, 1350), sz(1200, 1500), sz(1300, 1600), sz(1400, 1700)] },
                    { id: 'op-8b', orderNo: 'ORD-26-072', productNo: 'WB-50-CH-02', selected: true, sizes: [sz(1450, 1800), sz(1500, 1800), sz(1550, 1900), sz(1600, 1950), sz(1650, 2000), sz(1700, 2100), sz(1750, 2200)] },
                    { id: 'op-8c', orderNo: 'ORD-26-073', productNo: 'WB-50-CH-03', selected: true, sizes: [sz(1800, 2300), sz(1900, 2400), sz(2000, 2500), sz(2100, 2600), sz(2200, 2700), sz(2300, 2800), sz(2400, 2900)] },
                ]
            },
            {
                colorName: '애쉬그레이', productionQty: 20, stockQty: 18, expanded: false, orders: [
                    { id: 'op-9a', orderNo: 'ORD-26-081', productNo: 'WB-50-AG-01', selected: true, sizes: [sz(750, 1000), sz(850, 1100), sz(950, 1150), sz(1050, 1300), sz(1150, 1400), sz(1250, 1500), sz(1350, 1600)] },
                    { id: 'op-9b', orderNo: 'ORD-26-082', productNo: 'WB-50-AG-02', selected: true, sizes: [sz(1400, 1750), sz(1450, 1750), sz(1500, 1850), sz(1550, 1950), sz(1600, 2100), sz(1650, 2200), sz(1700, 2300)] },
                    { id: 'op-9c', orderNo: 'ORD-26-083', productNo: 'WB-50-AG-03', selected: true, sizes: [sz(1750, 2400), sz(1850, 2450), sz(1950, 2550), sz(2050, 2650), sz(2150, 2750), sz(2250, 2850), sz(2350, 2950)] },
                ]
            },
        ]
    },
    {
        id: 'prod-3', name: '롤스크린 암막', totalProductionQty: 115, expanded: false,
        colors: [
            {
                colorName: '화이트', productionQty: 30, stockQty: 120, expanded: false, orders: [
                    { id: 'op-10a', orderNo: 'ORD-26-091', productNo: 'RS-AM-WH-01', selected: true, sizes: [sz(700, 900), sz(800, 1000), sz(900, 1100), sz(950, 1150), sz(1000, 1200), sz(1050, 1300), sz(1100, 1400)] },
                    { id: 'op-10b', orderNo: 'ORD-26-092', productNo: 'RS-AM-WH-02', selected: true, sizes: [sz(1150, 1450), sz(1200, 1500), sz(1250, 1550), sz(1300, 1600), sz(1400, 1700), sz(1500, 1800), sz(1600, 1900)] },
                    { id: 'op-10c', orderNo: 'ORD-26-093', productNo: 'RS-AM-WH-03', selected: true, sizes: [sz(1700, 2000), sz(1800, 2100), sz(1900, 2200), sz(2000, 2400), sz(2100, 2500), sz(2200, 2600), sz(2300, 2700)] },
                ]
            },
            {
                colorName: '차콜', productionQty: 26, stockQty: 90, expanded: false, orders: [
                    { id: 'op-11a', orderNo: 'ORD-26-101', productNo: 'RS-AM-CH-01', selected: true, sizes: [sz(700, 900), sz(800, 1000), sz(850, 1100), sz(950, 1150), sz(1000, 1200), sz(1050, 1300), sz(1100, 1400)] },
                    { id: 'op-11b', orderNo: 'ORD-26-102', productNo: 'RS-AM-CH-02', selected: true, sizes: [sz(1150, 1450), sz(1200, 1500), sz(1300, 1600), sz(1400, 1700), sz(1500, 1800), sz(1550, 1850), sz(1600, 1900)] },
                    { id: 'op-11c', orderNo: 'ORD-26-103', productNo: 'RS-AM-CH-03', selected: true, sizes: [sz(1700, 2000), sz(1800, 2100), sz(1900, 2300), sz(2000, 2400), sz(2100, 2500), sz(2200, 2600), sz(2350, 2800)] },
                ]
            },
            {
                colorName: '스카이블루', productionQty: 20, stockQty: 50, expanded: false, orders: [
                    { id: 'op-12a', orderNo: 'ORD-26-111', productNo: 'RS-AM-SB-01', selected: true, sizes: [sz(750, 950), sz(850, 1100), sz(950, 1200), sz(1050, 1300), sz(1150, 1400), sz(1250, 1500), sz(1300, 1600)] },
                    { id: 'op-12b', orderNo: 'ORD-26-112', productNo: 'RS-AM-SB-02', selected: true, sizes: [sz(1350, 1700), sz(1450, 1750), sz(1550, 1850), sz(1650, 1950), sz(1750, 2100), sz(1850, 2200), sz(1950, 2300)] },
                    { id: 'op-12c', orderNo: 'ORD-26-113', productNo: 'RS-AM-SB-03', selected: true, sizes: [sz(2050, 2450), sz(2150, 2550), sz(2250, 2650), sz(2350, 2750), sz(2450, 2850), sz(2550, 2950), sz(2650, 3050)] },
                ]
            },
            {
                colorName: '머스타드', productionQty: 20, stockQty: 40, expanded: false, orders: [
                    { id: 'op-13a', orderNo: 'ORD-26-121', productNo: 'RS-AM-MS-01', selected: true, sizes: [sz(700, 900), sz(800, 1000), sz(900, 1100), sz(1000, 1200), sz(1100, 1350), sz(1200, 1500), sz(1250, 1550)] },
                    { id: 'op-13b', orderNo: 'ORD-26-122', productNo: 'RS-AM-MS-02', selected: true, sizes: [sz(1300, 1650), sz(1400, 1700), sz(1500, 1800), sz(1600, 1900), sz(1700, 2000), sz(1800, 2100), sz(1850, 2200)] },
                    { id: 'op-13c', orderNo: 'ORD-26-123', productNo: 'RS-AM-MS-03', selected: true, sizes: [sz(1950, 2300), sz(2050, 2450), sz(2150, 2550), sz(2250, 2650), sz(2350, 2750), sz(2450, 2850), sz(2550, 2950)] },
                ]
            },
        ]
    },
    {
        id: 'prod-4', name: '허니콤셰이드 프리미엄', totalProductionQty: 100, expanded: false,
        colors: [
            {
                colorName: '크림', productionQty: 25, stockQty: 45, expanded: false, orders: [
                    { id: 'op-14a', orderNo: 'ORD-26-131', productNo: 'HC-PR-CR-01', selected: true, sizes: [sz(800, 1000), sz(900, 1100), sz(1000, 1200), sz(1050, 1300), sz(1100, 1400), sz(1150, 1450), sz(1200, 1500)] },
                    { id: 'op-14b', orderNo: 'ORD-26-132', productNo: 'HC-PR-CR-02', selected: true, sizes: [sz(1250, 1550), sz(1300, 1600), sz(1350, 1650), sz(1400, 1700), sz(1450, 1750), sz(1500, 1800), sz(1550, 1850)] },
                    { id: 'op-14c', orderNo: 'ORD-26-133', productNo: 'HC-PR-CR-03', selected: true, sizes: [sz(1600, 1900), sz(1700, 2000), sz(1800, 2100), sz(1900, 2200), sz(2000, 2300), sz(2050, 2400), sz(2100, 2500)] },
                ]
            },
            {
                colorName: '라이트그린', productionQty: 22, stockQty: 30, expanded: false, orders: [
                    { id: 'op-15a', orderNo: 'ORD-26-141', productNo: 'HC-PR-LG-01', selected: true, sizes: [sz(750, 950), sz(850, 1050), sz(950, 1150), sz(1000, 1200), sz(1050, 1300), sz(1150, 1400), sz(1250, 1500)] },
                    { id: 'op-15b', orderNo: 'ORD-26-142', productNo: 'HC-PR-LG-02', selected: true, sizes: [sz(1350, 1650), sz(1450, 1750), sz(1550, 1850), sz(1650, 1950), sz(1750, 2050), sz(1850, 2150), sz(1900, 2200)] },
                    { id: 'op-15c', orderNo: 'ORD-26-143', productNo: 'HC-PR-LG-03', selected: true, sizes: [sz(1950, 2300), sz(2050, 2450), sz(2150, 2550), sz(2250, 2650), sz(2350, 2750), sz(2450, 2850), sz(2500, 2900)] },
                ]
            },
            {
                colorName: '라벤더', productionQty: 20, stockQty: 35, expanded: false, orders: [
                    { id: 'op-16a', orderNo: 'ORD-26-151', productNo: 'HC-PR-LV-01', selected: true, sizes: [sz(800, 1000), sz(900, 1100), sz(1000, 1200), sz(1100, 1300), sz(1200, 1400), sz(1250, 1500), sz(1300, 1600)] },
                    { id: 'op-16b', orderNo: 'ORD-26-152', productNo: 'HC-PR-LV-02', selected: true, sizes: [sz(1350, 1700), sz(1450, 1800), sz(1550, 1900), sz(1650, 2000), sz(1750, 2100), sz(1800, 2200), sz(1850, 2300)] },
                    { id: 'op-16c', orderNo: 'ORD-26-153', productNo: 'HC-PR-LV-03', selected: true, sizes: [sz(1900, 2400), sz(2000, 2500), sz(2100, 2600), sz(2200, 2700), sz(2300, 2800), sz(2400, 2900), sz(2500, 3000)] },
                ]
            },
            {
                colorName: '코랄핑크', productionQty: 20, stockQty: 22, expanded: false, orders: [
                    { id: 'op-17a', orderNo: 'ORD-26-161', productNo: 'HC-PR-CP-01', selected: true, sizes: [sz(700, 900), sz(800, 1050), sz(900, 1150), sz(1000, 1250), sz(1100, 1350), sz(1200, 1450), sz(1250, 1500)] },
                    { id: 'op-17b', orderNo: 'ORD-26-162', productNo: 'HC-PR-CP-02', selected: true, sizes: [sz(1350, 1700), sz(1450, 1800), sz(1550, 1900), sz(1650, 2000), sz(1750, 2100), sz(1850, 2200), sz(1900, 2250)] },
                    { id: 'op-17c', orderNo: 'ORD-26-163', productNo: 'HC-PR-CP-03', selected: true, sizes: [sz(1950, 2300), sz(2050, 2450), sz(2150, 2550), sz(2250, 2650), sz(2350, 2800), sz(2450, 2900), sz(2500, 3000)] },
                ]
            },
        ]
    },
    {
        id: 'prod-5', name: '버티컬블라인드', totalProductionQty: 100, expanded: false,
        colors: [
            {
                colorName: '실버', productionQty: 25, stockQty: 55, expanded: false, orders: [
                    { id: 'op-18a', orderNo: 'ORD-26-171', productNo: 'VB-SL-01', selected: true, sizes: [sz(900, 1200), sz(1000, 1300), sz(1100, 1400), sz(1200, 1500), sz(1300, 1600), sz(1400, 1700), sz(1500, 1800)] },
                    { id: 'op-18b', orderNo: 'ORD-26-172', productNo: 'VB-SL-02', selected: true, sizes: [sz(1600, 1900), sz(1700, 2000), sz(1800, 2100), sz(1900, 2200), sz(2000, 2300), sz(2050, 2400), sz(2100, 2500)] },
                    { id: 'op-18c', orderNo: 'ORD-26-173', productNo: 'VB-SL-03', selected: true, sizes: [sz(2200, 2600), sz(2300, 2700), sz(2400, 2800), sz(2500, 2900), sz(2600, 3000), sz(2700, 3100), sz(2800, 3200)] },
                ]
            },
            {
                colorName: '네이비', productionQty: 22, stockQty: 38, expanded: false, orders: [
                    { id: 'op-19a', orderNo: 'ORD-26-181', productNo: 'VB-NV-01', selected: true, sizes: [sz(950, 1250), sz(1050, 1350), sz(1150, 1450), sz(1250, 1550), sz(1350, 1650), sz(1450, 1750), sz(1550, 1850)] },
                    { id: 'op-19b', orderNo: 'ORD-26-182', productNo: 'VB-NV-02', selected: true, sizes: [sz(1650, 1950), sz(1750, 2100), sz(1850, 2200), sz(1950, 2300), sz(2050, 2400), sz(2100, 2450), sz(2150, 2500)] },
                    { id: 'op-19c', orderNo: 'ORD-26-183', productNo: 'VB-NV-03', selected: true, sizes: [sz(2250, 2650), sz(2350, 2750), sz(2450, 2850), sz(2550, 2950), sz(2650, 3050), sz(2750, 3150), sz(2850, 3250)] },
                ]
            },
            {
                colorName: '버건디', productionQty: 20, stockQty: 15, expanded: false, orders: [
                    { id: 'op-20a', orderNo: 'ORD-26-191', productNo: 'VB-BG-01', selected: true, sizes: [sz(900, 1100), sz(1000, 1200), sz(1100, 1300), sz(1200, 1400), sz(1300, 1550), sz(1400, 1650), sz(1500, 1800)] },
                    { id: 'op-20b', orderNo: 'ORD-26-192', productNo: 'VB-BG-02', selected: true, sizes: [sz(1600, 1950), sz(1700, 2050), sz(1800, 2150), sz(1900, 2250), sz(2000, 2400), sz(2100, 2500)] },
                    { id: 'op-20c', orderNo: 'ORD-26-193', productNo: 'VB-BG-03', selected: true, sizes: [sz(2200, 2600), sz(2300, 2750), sz(2400, 2850), sz(2500, 2950), sz(2600, 3050), sz(2750, 3150), sz(2850, 3250)] },
                ]
            },
            {
                colorName: '민트', productionQty: 20, stockQty: 28, expanded: false, orders: [
                    { id: 'op-21a', orderNo: 'ORD-26-201', productNo: 'VB-MT-01', selected: true, sizes: [sz(850, 1100), sz(950, 1200), sz(1050, 1300), sz(1150, 1400), sz(1250, 1550), sz(1350, 1650), sz(1450, 1750)] },
                    { id: 'op-21b', orderNo: 'ORD-26-202', productNo: 'VB-MT-02', selected: true, sizes: [sz(1550, 1900), sz(1650, 2000), sz(1750, 2100), sz(1850, 2200), sz(1950, 2300), sz(2050, 2400), sz(2100, 2500)] },
                    { id: 'op-21c', orderNo: 'ORD-26-203', productNo: 'VB-MT-03', selected: true, sizes: [sz(2200, 2600), sz(2300, 2700), sz(2400, 2800), sz(2500, 2900), sz(2600, 3000), sz(2700, 3150), sz(2800, 3250)] },
                ]
            },
        ]
    },
];

// Add unique IDs to sizes
let uidCounter = 0;
function addUids(sizes: ProductionSize[]): ProductionSize[] {
    return sizes.map(s => ({ ...s, uid: `sz-${uidCounter++}` }));
}

// Color map for swatches (20 칼라)
const COLOR_MAP: Record<string, string> = {
    '아이보리': '#FFFFF0', '그레이': '#9CA3AF', '베이지': '#F5F0E1', '오크내추럴': '#C8A96E',
    '월넛다크': '#5C4033', '화이트': '#FFFFFF', '차콜': '#36454F', '크림': '#FFFDD0',
    '라이트그린': '#90EE90', '실버': '#C0C0C0', '네이비': '#000080',
    '모카브라운': '#7B5B3A', '올리브': '#808000', '체리': '#DE3163', '애쉬그레이': '#B2BEB5',
    '스카이블루': '#87CEEB', '머스타드': '#FFDB58', '라벤더': '#E6E6FA', '코랄핑크': '#F88379',
    '버건디': '#800020', '민트': '#98FF98',
};

const BLOCK_COLORS = ['bg-purple-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500', 'bg-indigo-500', 'bg-teal-500'];
const LABEL_COLORS = ['bg-purple-100 text-purple-700', 'bg-blue-100 text-blue-700', 'bg-emerald-100 text-emerald-700', 'bg-amber-100 text-amber-700', 'bg-rose-100 text-rose-700', 'bg-cyan-100 text-cyan-700', 'bg-indigo-100 text-indigo-700', 'bg-teal-100 text-teal-700'];

// --- Component ---
const ProductionManagement: React.FC = () => {
    // 1. Get nodes from ProductContext
    const { nodes, isLoading } = useProductContext();

    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'product' | 'system'>('product');
    const [selectedSystemCategory, setSelectedSystemCategory] = useState<string>('전체');
    const [products, setProducts] = useState<ProductItem[]>(MOCK_PRODUCTS);
    const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
    const [selectedColorName, setSelectedColorName] = useState<string | null>(null);
    const [selectedFabricWidth, setSelectedFabricWidth] = useState<number | 'mixed' | null>(null);

    // System tab state
    const [selectedSystemId, setSelectedSystemId] = useState<string | null>(null);
    const [systemOrderSpecs, setSystemOrderSpecs] = useState<SystemOrderSpec[]>([]);
    const [selectedBomPartId, setSelectedBomPartId] = useState<string | null>(null);
    const [systemBomParts, setSystemBomParts] = useState<SystemBomPart[]>([]);

    // Interactive cutting state
    const [cuttingLines, setCuttingLines] = useState<CuttingLine[]>([]);
    const [placedUids, setPlacedUids] = useState<Set<string>>(new Set());
    const [autoFillSuggestion, setAutoFillSuggestion] = useState<ProductionSize | null>(null);
    const [suggestionLineIdx, setSuggestionLineIdx] = useState<number>(-1);
    const [selectedDetailLineIdx, setSelectedDetailLineIdx] = useState<number | null>(null);
    const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });

    const showToast = (message: string) => {
        setToast({ message, visible: true });
        setTimeout(() => setToast({ message: '', visible: false }), 2000);
    };

    const printLabel = (size: ProductionSize) => {
        showToast(`라벨 출력 중: ${size.label}`);
    };

    const totalProductionQty = useMemo(() => products.reduce((s, p) => s + p.totalProductionQty, 0), [products]);

    // 2. Compute System Categories from virtualChildMap of global system root
    // This matches the systems shown in 표준상품원가>조립탭>제작탭
    const systemCategories = useMemo(() => {
        const GLOBAL_SYSTEM_ROOT = 'root-1770804399939';
        const globalSysRoot = basicTree[GLOBAL_SYSTEM_ROOT] as any;

        // virtualChildMap이 있으면 해당 구조 사용 (조립탭+제작탭과 동일)
        if (globalSysRoot?.attributes?.virtualChildMap) {
            try {
                const virtualMap = JSON.parse(globalSysRoot.attributes.virtualChildMap) as Record<string, string[]>;
                const results: { id: string; catId: string; name: string; topCategory: string; count: number }[] = [];

                // 카테고리 키의 조상 경로를 타고 올라가서 전체 경로 구성 헬퍼
                const getAncestorPath = (nodeId: string): string[] => {
                    const parts: string[] = [];
                    let curId: string | undefined = nodeId;
                    while (curId) {
                        const btNode = basicTree[curId] as any;
                        const rtNode = nodes[curId] as any;
                        if (!btNode && !rtNode) break;
                        if ((btNode?.type === 'ROOT') || (rtNode?.type === 'ROOT')) break;
                        // nodes의 레이블 우선, 없으면 basicTree 레이블
                        parts.unshift(rtNode?.label || btNode?.label || curId);
                        curId = btNode?.parentId || rtNode?.parentId;
                    }
                    return parts;
                };

                Object.keys(virtualMap).forEach(catKey => {
                    const catPath = getAncestorPath(catKey); // e.g. ['블라인드', '우드']
                    // 두 번째 카테고리(예: 우드, 콤비 등)에 "(제조)" 접미사 추가
                    if (catPath.length > 1 && !catPath[1].includes('(제조)')) {
                        catPath[1] = catPath[1] + '(제조)';
                    } else if (catPath.length === 1 && !catPath[0].includes('(제조)')) {
                        // 혹시 경로가 1개밖에 없다면 거기에 붙임
                        catPath[0] = catPath[0] + '(제조)';
                    }
                    // topCategory(탭 이름)에서는 "(제조)" 텍스트를 제거하여 깔끔하게 표시
                    const baseTopCategory = catPath[0] || catKey;
                    const topCategory = baseTopCategory.replace(/\(제조\)/g, '').trim();
                    const systemNodeIds: string[] = virtualMap[catKey];

                    systemNodeIds.forEach(sysId => {
                        const sysNode = basicTree[sysId] as any;
                        const sysRtNode = nodes[sysId] as any;
                        if (!sysNode && !sysRtNode) return;
                        const sysLabel = sysRtNode?.label || sysNode?.label || sysId;
                        const fullPath = [...catPath, sysLabel].join(' > ');
                        results.push({
                            id: sysId,
                            catId: catKey, // 상품원가에서 cost_parts_list 저장하는 카테고리 노드 ID
                            name: fullPath,
                            topCategory,
                            count: 0
                        });
                    });
                });

                return results;
            } catch (e) {
                console.warn('[ProductionManagement] Failed to parse virtualChildMap', e);
            }
        }

        // Fallback: m1 파트너 시스템 루트에서 리프 노드 순회
        const M1_SYSTEM_ROOT = 'root-1770804399939-partner-m1';
        let rootNode: any = basicTree[M1_SYSTEM_ROOT] || globalSysRoot;
        if (!rootNode || !rootNode.childrenIds?.length) return [];

        const results: { id: string; name: string; topCategory: string; count: number }[] = [];
        const visited = new Set<string>();
        const traverse = (nodeId: string, pathParts: string[], topCat: string) => {
            if (visited.has(nodeId)) return;
            visited.add(nodeId);
            const node = basicTree[nodeId] as any;
            if (!node) return;
            const isRoot = nodeId === rootNode.id;
            const newParts = isRoot ? [] : [...pathParts, node.label];
            const newTop = isRoot ? topCat : (pathParts.length === 0 ? node.label : topCat);
            const children: string[] = node.childrenIds || [];
            const hasContainerKids = children.some((c: string) => {
                const ch = basicTree[c] as any;
                return ch && (ch.type === 'CATEGORY' || ch.type === 'REFERENCE');
            });
            if (!isRoot && (children.length === 0 || !hasContainerKids)) {
                results.push({ id: node.id, name: newParts.join(' > '), topCategory: newTop, count: 0 });
            }
            children.forEach((id: string) => traverse(id, newParts, newTop));
        };
        traverse(rootNode.id, [], '');
        return results;
    }, [nodes]);

    // 시스템 카테고리 목록 (중복 제거)
    const systemTopCategories = useMemo(() => {
        const cats = Array.from(new Set(systemCategories.map(s => s.topCategory).filter(Boolean)));
        return cats;
    }, [systemCategories]);

    // 필터링된 시스템 목록
    const filteredSystemCategories = useMemo(() => {
        if (selectedSystemCategory === '전체') return systemCategories;
        return systemCategories.filter(s => s.topCategory === selectedSystemCategory);
    }, [systemCategories, selectedSystemCategory]);

    const filteredProducts = useMemo(() => {
        if (!searchQuery.trim()) return products;
        const q = searchQuery.toLowerCase();
        return products.filter(p => p.name.toLowerCase().includes(q) || p.colors.some(c => c.colorName.toLowerCase().includes(q)));
    }, [products, searchQuery]);

    const toggleProduct = (productId: string) => {
        setProducts(prev => prev.map(p => p.id === productId ? { ...p, expanded: !p.expanded } : p));
        setSelectedProductId(productId);
        setSelectedColorName(null);
        setSelectedFabricWidth(null);
        resetCutting();
    };

    // System order spec toggle
    const toggleSystemOrderSpec = (specId: string) => {
        setSystemOrderSpecs(prev => prev.map(s => s.id === specId ? { ...s, selected: !s.selected } : s));
        setSelectedBomPartId(null);
    };

    const toggleAllSystemSpecs = (checked: boolean) => {
        setSystemOrderSpecs(prev => prev.map(s => ({ ...s, selected: checked })));
        setSelectedBomPartId(null);
    };

    const handleSystemClick = (sysId: string, sysName: string) => {
        if (selectedSystemId === sysId) {
            setSelectedSystemId(null);
            setSystemOrderSpecs([]);
            setSystemBomParts([]);
            setSelectedBomPartId(null);
            return;
        }
        setSelectedSystemId(sysId);
        setSystemOrderSpecs(generateSystemOrders(sysId, sysName));

        const parsePartsList = (raw: string | undefined): SystemBomPart[] => {
            if (!raw) return [];
            try {
                const parsed: Array<{ id: string; name: string; spec: string; usageUnit: string; usageQty: string; inventoryUnit: string; cost: string; }> = JSON.parse(raw);
                return parsed.map(p => ({
                    id: p.id,
                    name: p.name,
                    spec: p.spec || '',
                    usageUnit: p.usageUnit || '개',
                    usageFormula: `fixed:${parseFloat(p.usageQty) || 1}`,
                    inventoryUnit: p.inventoryUnit || p.usageUnit || '개',
                    cost: p.cost?.replace(/,/g, '') || '0',
                }));
            } catch (e) {
                console.warn('[BOM] cost_parts_list 파싱 실패', e);
                return [];
            }
        };

        // 1차: sysId 직접 조회
        let realParts = parsePartsList(nodes[sysId]?.attributes?.cost_parts_list);

        // 2차: runtime nodes의 virtualChildMap을 역방향 검색 (copy 노드도 포함)
        if (realParts.length === 0) {
            const GLOBAL_SYS_ROOT = 'root-1770804399939';
            const globalRootNode = nodes[GLOBAL_SYS_ROOT];
            if (globalRootNode?.attributes?.virtualChildMap) {
                try {
                    const vMap = JSON.parse(globalRootNode.attributes.virtualChildMap) as Record<string, string[]>;
                    for (const [catKey, sysIds] of Object.entries(vMap)) {
                        if (Array.isArray(sysIds) && sysIds.includes(sysId)) {
                            realParts = parsePartsList(nodes[catKey]?.attributes?.cost_parts_list);
                            console.log(`[BOM] runtime virtualChildMap 역검색: catKey=${catKey}, 부품수=${realParts.length}`);
                            break;
                        }
                    }
                } catch (e) { console.warn('[BOM] virtualChildMap 파싱 실패', e); }
            }
        }

        // 3차: staticTree virtualChildMap에서 역방향 검색 (시스템 카테고리 항목의 catId)
        if (realParts.length === 0) {
            const sysCatEntry = systemCategories.find(s => s.id === sysId);
            const catId = (sysCatEntry as any)?.catId;
            if (catId) {
                realParts = parsePartsList(nodes[catId]?.attributes?.cost_parts_list);
                if (realParts.length > 0) console.log(`[BOM] staticTree catId(${catId})에서 ${realParts.length}개 부품 로드`);
            }
        }

        // 4차: 부모→조상 노드 traversal
        if (realParts.length === 0) {
            let curId: string | undefined = nodes[sysId]?.parentId;
            let depth = 0;
            while (curId && depth < 5) {
                const found = parsePartsList(nodes[curId]?.attributes?.cost_parts_list);
                if (found.length > 0) {
                    realParts = found;
                    console.log(`[BOM] 조상노드(${curId}, depth=${depth + 1})에서 ${realParts.length}개 부품 로드`);
                    break;
                }
                curId = nodes[curId]?.parentId;
                depth++;
            }
        }

        // 5차: 이름 기반 매칭 (sysName에서 부모 카테고리명 추출 → 노드 레이블 매칭)
        // catNodeId도 별도로 추적
        let catNodeId: string | undefined;
        if (realParts.length === 0) {
            const nameParts = sysName.split(' > ');
            for (let i = nameParts.length - 2; i >= 0; i--) {
                const targetLabel = nameParts[i].replace(/\s*\([^)]*\)$/, '').trim();
                for (const [nodeId, nodeRaw] of Object.entries(nodes)) {
                    const node = nodeRaw as NodeData;
                    const label = (node.label || '').replace(/\s*\([^)]*\)$/, '').trim();
                    if (label === targetLabel && node.attributes?.cost_parts_list) {
                        const found = parsePartsList(node.attributes.cost_parts_list);
                        if (found.length > 0) {
                            realParts = found;
                            catNodeId = nodeId;
                            console.log(`[BOM] 이름매칭(${targetLabel})노드(${nodeId})에서 ${realParts.length}개 부품 로드`);
                            break;
                        }
                    }
                }
                if (realParts.length > 0) break;
            }
        }

        // [핵심] BOM 등록 부품만 필터: sysId 노드 + 모든 하위 노드의 bomList 수집
        const leafName = sysName.split(' > ').pop()?.replace(/\s*\([^)]*\)$/, '').trim() || '';
        const applyBomFilter = (catNid: string): boolean => {
            const catNode = nodes[catNid];
            if (!catNode?.attributes?.cost_assembly_list) return false;
            try {
                const assemblyCosts: Record<string, { price?: string; unit?: string; bomList?: Array<{ partId: string; usageUnit: string; usageQty: string; extraFormula?: string }> }> =
                    JSON.parse(catNode.attributes.cost_assembly_list);

                // sysId 직접 매칭 또는 leaf 이름으로 매칭
                let matchedKey: string | undefined = assemblyCosts[sysId] ? sysId : undefined;
                if (!matchedKey && leafName) {
                    for (const [key] of Object.entries(assemblyCosts)) {
                        const kLabel = (nodes[key]?.label || '').replace(/\s*\([^)]*\)$/, '').trim();
                        if (kLabel === leafName) { matchedKey = key; break; }
                    }
                }
                if (!matchedKey) return false;

                // matchedKey 노드 자체의 bomList가 비어있으면 → 하위 탐색 없이 빈 배열로 필터링 완료 처리
                const matchedEntry = assemblyCosts[matchedKey];
                if (!matchedEntry?.bomList || matchedEntry.bomList.length === 0) {
                    console.log(`[BOM] 시스템 "${leafName}"(${matchedKey})에 직접 등록된 BOM이 없어 빈 목록 반환`);
                    realParts = [];
                    return true; // 필터링은 성공적으로 수행되었음 (0건 발견)
                }

                // matchedKey 노드 하나만의 bomList만 볼 것인가, 하위 것도 볼 것인가?
                // 이전 수정에서: 하위 노드의 BOM(선택안한 옵션 부품)까지 다 나오는 것을 막기 위해 matchedKey 노드만 보도록 했음.
                const allBomItems = matchedEntry.bomList || [];

                if (allBomItems.length === 0) {
                    realParts = [];
                    return true;
                }

                const allPartsRaw: Array<{ id: string; name: string; spec: string; usageUnit: string; usageQty: string; inventoryUnit: string; cost: string }> =
                    JSON.parse(catNode.attributes?.cost_parts_list || '[]');
                const filtered: SystemBomPart[] = allBomItems.map(bomItem => {
                    const part = allPartsRaw.find(p => p.id === bomItem.partId);
                    if (!part) return null;
                    const baseQty = parseFloat(bomItem.usageQty) || 1;
                    // 단위 결정: partUnit, bomUnit, 부품명 순으로 길이단위 감지
                    const partUnit = (part.usageUnit || '').toLowerCase();
                    const bomUnit = (bomItem.usageUnit || '').toLowerCase();
                    const partNameHasLen = /\d+m\b/i.test(part.name); // "100m 알미늄해드" 등
                    const isLenPart = ['m', 'cm', 'mm'].some(u => partUnit.includes(u))
                        || ['m', 'cm', 'mm'].some(u => bomUnit.includes(u))
                        || partNameHasLen;
                    let formula: string;
                    if (isLenPart) {
                        // 길이단위: 항상 cm 출력 (W/10 + extra)
                        const extra = bomItem.extraFormula || '';
                        formula = extra ? `W/10${extra}` : `W/10`;
                    } else {
                        // EA 단위: baseQty + extraFormula
                        formula = bomItem.extraFormula
                            ? `${baseQty}${bomItem.extraFormula}`
                            : `fixed:${baseQty}`;
                    }
                    const stripSizeVal = isLenPart ? (parseFloat(bomItem.usageQty) || parseFloat(part.usageQty) || 0) : undefined;
                    return {
                        id: `${catNid}-${bomItem.partId}`,
                        name: part.name, spec: part.spec || '',
                        usageUnit: isLenPart ? 'cm' : (bomUnit || partUnit || '개'),
                        usageFormula: formula,
                        inventoryUnit: part.inventoryUnit || part.usageUnit || '개',
                        cost: (part.cost || '0').replace(/,/g, ''),
                        stripSize: stripSizeVal,
                    } as SystemBomPart;
                }).filter(Boolean) as SystemBomPart[];

                realParts = filtered;
                console.log(`[BOM] bomList 필터: ${filtered.length}개 (전체 ${allPartsRaw.length}개 중)`);
                return true; // 필터 적용 완료
            } catch (e) { console.warn('[BOM] assemblyCosts 파싱 실패', e); return false; }
        };

        // 1. catNodeId 기반으로 우선 필터 시도
        let bomFilterApplied = false;
        if (catNodeId) bomFilterApplied = applyBomFilter(catNodeId);

        // 2. 만약 catNodeId에 assemblyCosts 속성 자체가 없거나 파싱 실패해서 못했다면, 다른 노드 탐색
        if (!bomFilterApplied && leafName) {
            for (const [nid, nRaw] of Object.entries(nodes)) {
                if (nid === catNodeId) continue;
                const n = nRaw as NodeData;
                if (n.attributes?.cost_assembly_list) {
                    if (applyBomFilter(nid)) {
                        bomFilterApplied = true;
                        break;
                    }
                }
            }
        }

        // 3. 그래도 필터링이 안됐다면(해당 이름의 시스템/assembly 설정이 아예 없음), 전체 부품 비우기
        if (!bomFilterApplied && realParts.length > 0) {
            console.log(`[BOM] ⚠ 시스템 "${leafName}"에 대한 BOM 설정을 찾을 수 없음. 부품 목록을 비웁니다.`);
            realParts = [];
        }
        if (realParts.length === 0) {
            const allWithParts = (Object.entries(nodes) as [string, NodeData][])
                .filter(([, n]) => n.attributes?.cost_parts_list && n.attributes.cost_parts_list !== '[]')
                .map(([id, n]) => ({ id, label: n.label, parentId: n.parentId, partCount: (() => { try { return JSON.parse(n.attributes!.cost_parts_list!).length; } catch { return 0; } })() }))
                .filter(n => n.partCount > 0);
            console.log('[BOM] ⚠ 탐색 실패. cost_parts_list 있는 노드들:', allWithParts);
        }

        console.log(`[BOM] 최종 sysId=${sysId}, sysName=${sysName}, 부품수=${realParts.length}`);
        setSystemBomParts(realParts);
        setSelectedBomPartId(null);
    };

    const toggleColor = (productId: string, colorName: string) => {
        setProducts(prev => prev.map(p => p.id === productId ? { ...p, colors: p.colors.map(c => c.colorName === colorName ? { ...c, expanded: !c.expanded } : c) } : p));
        setSelectedProductId(productId);
        setSelectedColorName(colorName);
        setSelectedFabricWidth(null);
        resetCutting();
    };

    const toggleOrderSelection = (productId: string, colorName: string, orderId: string) => {
        setProducts(prev => prev.map(p => p.id === productId ? { ...p, colors: p.colors.map(c => c.colorName === colorName ? { ...c, orders: c.orders.map(o => o.id === orderId ? { ...o, selected: !o.selected } : o) } : c) } : p));
        resetCutting();
    };

    const selectedProduct = useMemo(() => products.find(p => p.id === selectedProductId), [products, selectedProductId]);
    const selectedColor = useMemo(() => selectedProduct?.colors.find(c => c.colorName === selectedColorName), [selectedProduct, selectedColorName]);

    // All sizes with UIDs
    const allSizesWithUids = useMemo(() => {
        if (!selectedColor) return [];
        const sizes = selectedColor.orders.filter(o => o.selected).flatMap(o => o.sizes);
        return addUids(sizes);
    }, [selectedColor]);

    // Available (not yet placed) sizes
    const availableSizes = useMemo(() => allSizesWithUids.filter(s => !placedUids.has(s.uid!)), [allSizesWithUids, placedUids]);

    const resetCutting = useCallback(() => {
        setCuttingLines([]);
        setPlacedUids(new Set());
        setAutoFillSuggestion(null);
        setSuggestionLineIdx(-1);
        uidCounter = 0;
    }, []);

    // Find best fit: largest size that fits in remaining space
    const findBestFit = useCallback((remainingSpace: number, available: ProductionSize[]): ProductionSize | null => {
        const fitting = available.filter(s => s.width <= remainingSpace);
        if (fitting.length === 0) return null;
        fitting.sort((a, b) => b.width - a.width);
        return fitting[0];
    }, []);

    // Greedy bin-packing for a single width
    const simulateSingleWidth = useCallback((sizes: ProductionSize[], fabricWidthCm: number): CuttingLine[] => {
        const fwMm = fabricWidthCm * 10;
        const sorted = [...sizes].sort((a, b) => b.width - a.width);
        const lines: CuttingLine[] = [];
        for (const size of sorted) {
            let fitted = false;
            for (let i = 0; i < lines.length; i++) {
                if (lines[i].used + size.width <= fwMm) {
                    lines[i] = { ...lines[i], sizes: [...lines[i].sizes, size], used: lines[i].used + size.width, waste: fwMm - lines[i].used - size.width };
                    fitted = true;
                    break;
                }
            }
            if (!fitted) {
                lines.push({ sizes: [size], used: size.width, waste: fwMm - size.width, fabricWidth: fabricWidthCm });
            }
        }
        return lines;
    }, []);

    // Mixed optimization: best-fit across 210 and 280
    const optimizeMixedCutting = useCallback((sizes: ProductionSize[]): CuttingLine[] => {
        const sorted = [...sizes].sort((a, b) => b.width - a.width);
        const lines: CuttingLine[] = [];
        for (const size of sorted) {
            // Find best existing line (minimum remaining waste after placing)
            let bestLineIdx = -1;
            let bestRemaining = Infinity;
            for (let i = 0; i < lines.length; i++) {
                const fwMm = lines[i].fabricWidth * 10;
                const remaining = fwMm - lines[i].used - size.width;
                if (remaining >= 0 && remaining < bestRemaining) {
                    bestRemaining = remaining;
                    bestLineIdx = i;
                }
            }
            if (bestLineIdx >= 0) {
                const line = lines[bestLineIdx];
                const fwMm = line.fabricWidth * 10;
                lines[bestLineIdx] = { ...line, sizes: [...line.sizes, size], used: line.used + size.width, waste: fwMm - line.used - size.width };
            } else {
                // New line: choose 210 or 280 — pick the one with less waste
                const w210 = 2100, w280 = 2800;
                const waste210 = w210 - size.width;
                const waste280 = w280 - size.width;
                // If size doesn't fit 210, use 280
                if (size.width > w210) {
                    lines.push({ sizes: [size], used: size.width, waste: waste280, fabricWidth: 280 });
                } else {
                    // Choose the width that leaves less waste, but prefer 210 to save material
                    const best = waste210 <= waste280 ? 210 : 280;
                    // Heuristic: if waste in 210 is very small (< 20% of 210), use 210
                    // Otherwise use 280 to have more room for future items
                    const fw = waste210 < 500 ? 210 : 280;
                    const fwMm = fw * 10;
                    lines.push({ sizes: [size], used: size.width, waste: fwMm - size.width, fabricWidth: fw });
                }
            }
        }
        return lines;
    }, []);

    // Comparison results for all 3 modes
    const comparisonResults = useMemo(() => {
        if (allSizesWithUids.length === 0) return null;
        const r210 = simulateSingleWidth(allSizesWithUids, 210);
        const r280 = simulateSingleWidth(allSizesWithUids, 280);
        const rMix = optimizeMixedCutting(allSizesWithUids);
        const calc = (lines: CuttingLine[]) => {
            const used = lines.reduce((s, l) => s + l.used, 0);
            const waste = lines.reduce((s, l) => s + l.waste, 0);
            return { lines: lines.length, used, waste, efficiency: used + waste > 0 ? Math.round((used / (used + waste)) * 100) : 0 };
        };
        return { r210: calc(r210), r280: calc(r280), rMix: calc(rMix) };
    }, [allSizesWithUids, simulateSingleWidth, optimizeMixedCutting]);

    // Place a size on cutting line (user clicks a size)
    const placeSizeOnLine = useCallback((size: ProductionSize) => {
        if (!selectedFabricWidth) return;
        const isMixed = selectedFabricWidth === 'mixed';
        const defaultFw = isMixed ? 210 : (selectedFabricWidth as number);
        const fabricWidthMm = defaultFw * 10;

        setCuttingLines(prev => {
            const newLines = [...prev];
            let targetLineIdx = -1;

            if (isMixed) {
                // Best-fit across all existing lines
                let bestRemaining = Infinity;
                for (let i = 0; i < newLines.length; i++) {
                    const fwMm = newLines[i].fabricWidth * 10;
                    const remaining = fwMm - newLines[i].used - size.width;
                    if (remaining >= 0 && remaining < bestRemaining) {
                        bestRemaining = remaining;
                        targetLineIdx = i;
                    }
                }
            } else {
                for (let i = 0; i < newLines.length; i++) {
                    if (newLines[i].used + size.width <= fabricWidthMm) {
                        targetLineIdx = i;
                        break;
                    }
                }
            }

            if (targetLineIdx === -1) {
                // New line
                let fw = defaultFw;
                if (isMixed) {
                    // Choose best width for this size
                    if (size.width > 2100) { fw = 280; }
                    else { fw = (2100 - size.width) < 500 ? 210 : 280; }
                }
                const fwMm = fw * 10;
                newLines.push({ sizes: [size], used: size.width, waste: fwMm - size.width, fabricWidth: fw });
                targetLineIdx = newLines.length - 1;
            } else {
                const line = newLines[targetLineIdx];
                const fwMm = line.fabricWidth * 10;
                newLines[targetLineIdx] = {
                    ...line,
                    sizes: [...line.sizes, size],
                    used: line.used + size.width,
                    waste: fwMm - line.used - size.width,
                };
            }

            // Find auto-fill suggestion
            const lineFwMm = newLines[targetLineIdx].fabricWidth * 10;
            const remaining = lineFwMm - newLines[targetLineIdx].used;
            const nextAvailable = availableSizes.filter(s => s.uid !== size.uid);
            const bestFit = findBestFit(remaining, nextAvailable);
            if (bestFit) {
                setAutoFillSuggestion(bestFit);
                setSuggestionLineIdx(targetLineIdx);
            } else {
                setAutoFillSuggestion(null);
                setSuggestionLineIdx(-1);
            }

            return newLines;
        });

        setPlacedUids(prev => {
            const next = new Set(prev);
            next.add(size.uid!);
            return next;
        });
    }, [selectedFabricWidth, availableSizes, findBestFit]);

    // Accept auto-fill suggestion
    const acceptSuggestion = useCallback(() => {
        if (!autoFillSuggestion || suggestionLineIdx < 0 || !selectedFabricWidth) return;
        const suggestion = autoFillSuggestion;

        setCuttingLines(prev => {
            const newLines = [...prev];
            const line = newLines[suggestionLineIdx];
            if (!line) return prev;
            const fwMm = line.fabricWidth * 10;
            if (line.used + suggestion.width > fwMm) return prev;

            newLines[suggestionLineIdx] = {
                ...line,
                sizes: [...line.sizes, suggestion],
                used: line.used + suggestion.width,
                waste: fwMm - line.used - suggestion.width,
            };

            const remaining = fwMm - newLines[suggestionLineIdx].used;
            const nextAvailable = availableSizes.filter(s => s.uid !== suggestion.uid);
            const bestFit = findBestFit(remaining, nextAvailable);
            if (bestFit) {
                setAutoFillSuggestion(bestFit);
            } else {
                setAutoFillSuggestion(null);
                setSuggestionLineIdx(-1);
            }

            return newLines;
        });

        setPlacedUids(prev => {
            const next = new Set(prev);
            next.add(suggestion.uid!);
            return next;
        });
    }, [autoFillSuggestion, suggestionLineIdx, selectedFabricWidth, availableSizes, findBestFit]);

    // Auto-fill all
    const autoFillAll = useCallback(() => {
        if (!selectedFabricWidth) return;
        const isMixed = selectedFabricWidth === 'mixed';

        if (isMixed) {
            // Use mixed optimization
            const unplaced = availableSizes;
            const mixedResult = optimizeMixedCutting(unplaced);
            const allUids = new Set(placedUids);
            unplaced.forEach(s => allUids.add(s.uid!));
            setCuttingLines([...cuttingLines, ...mixedResult]);
            setPlacedUids(allUids);
        } else {
            const fabricWidthMm = (selectedFabricWidth as number) * 10;
            const remaining = [...availableSizes].sort((a, b) => b.width - a.width);
            const lines = [...cuttingLines];
            const placed = new Set(placedUids);
            for (const size of remaining) {
                if (placed.has(size.uid!)) continue;
                let fitted = false;
                for (let i = 0; i < lines.length; i++) {
                    if (lines[i].used + size.width <= fabricWidthMm) {
                        lines[i] = { ...lines[i], sizes: [...lines[i].sizes, size], used: lines[i].used + size.width, waste: fabricWidthMm - lines[i].used - size.width };
                        fitted = true;
                        break;
                    }
                }
                if (!fitted) {
                    lines.push({ sizes: [size], used: size.width, waste: fabricWidthMm - size.width, fabricWidth: selectedFabricWidth as number });
                }
                placed.add(size.uid!);
            }
            setCuttingLines(lines);
            setPlacedUids(placed);
        }
        setAutoFillSuggestion(null);
        setSuggestionLineIdx(-1);
    }, [selectedFabricWidth, availableSizes, cuttingLines, placedUids, optimizeMixedCutting]);

    // Stats
    const totalUsed = cuttingLines.reduce((s, l) => s + l.used, 0);
    const totalWaste = cuttingLines.reduce((s, l) => s + l.waste, 0);
    const efficiency = totalUsed + totalWaste > 0 ? Math.round((totalUsed / (totalUsed + totalWaste)) * 100) : 0;

    if (isLoading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
                    <p className="text-sm font-bold text-gray-500">생산 관리 데이터를 불러오는 중...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full w-full bg-gray-50 overflow-hidden font-sans">
            {/* HEADER */}
            <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4 shadow-sm z-20">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2 min-w-fit">
                        <Factory className="text-purple-600" size={22} /> 생산관리
                    </h1>
                    <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-100">
                        생산예정 총 : {totalProductionQty}건
                    </span>
                    <div className="flex-1 max-w-lg relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input type="text" placeholder="제품명, 칼라명으로 검색..." className="w-full pl-11 pr-10 py-2.5 rounded-xl bg-gray-100 border border-gray-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-300 focus:bg-white transition-all" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                        {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full"><X size={14} /></button>}
                    </div>
                </div>
            </div>

            {/* BODY */}
            <div className="flex-1 flex min-h-0 overflow-hidden">
                {/* LEFT PANEL */}
                <div className="w-[420px] bg-white border-r border-gray-200 flex flex-col flex-shrink-0 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-200 flex-shrink-0">
                        <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
                            <button onClick={() => setViewMode('product')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${viewMode === 'product' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                                <Layers size={14} /> 원단(제품)
                            </button>
                            <button onClick={() => setViewMode('system')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${viewMode === 'system' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                                <Package size={14} /> 시스템
                            </button>
                        </div>
                    </div>
                    <div className="flex items-center bg-gray-50 border-b border-gray-200 text-[10px] font-bold text-gray-400 uppercase tracking-wider px-4 py-2.5 flex-shrink-0">
                        <div className="flex-1">{viewMode === 'product' ? '제품명' : '시스템명'}</div>
                        <div className="w-[80px] text-right">주문량</div>
                        <div className="w-[20px]"></div>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {viewMode === 'product' ? (
                            <div>
                                {filteredProducts.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                                        <Package size={40} strokeWidth={1.5} /><p className="text-sm font-medium mt-3">제품이 없습니다</p>
                                    </div>
                                ) : filteredProducts.map(product => (
                                    <div key={product.id}>
                                        <motion.div onClick={() => toggleProduct(product.id)} className={`flex items-center px-4 py-3.5 border-b border-gray-100 cursor-pointer transition-all ${product.expanded ? 'bg-purple-50/50 border-l-[3px] border-l-purple-400' : 'hover:bg-gray-50 border-l-[3px] border-l-transparent'}`} whileHover={{ x: 2 }} transition={{ duration: 0.15 }}>
                                            <div className="flex-1 min-w-0">
                                                <span className={`text-sm font-bold ${selectedProductId === product.id ? 'text-purple-700' : 'text-gray-800'}`}>{product.name}</span>
                                                <div className="text-[10px] text-gray-400 mt-0.5">{product.colors.length}개 칼라</div>
                                            </div>
                                            <div className="w-[80px] text-right">
                                                <span className="text-sm font-bold font-mono text-purple-600">{product.totalProductionQty}</span>
                                                <span className="text-[10px] text-gray-400 ml-0.5">건</span>
                                            </div>
                                            <ChevronDown size={16} className={`text-gray-400 ml-2 flex-shrink-0 transition-transform duration-200 ${product.expanded ? 'rotate-180' : ''}`} />
                                        </motion.div>
                                        <AnimatePresence>
                                            {product.expanded && (
                                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden bg-gray-50/80">
                                                    {product.colors.map(color => (
                                                        <div key={color.colorName}>
                                                            <div onClick={() => toggleColor(product.id, color.colorName)} className={`flex items-center px-4 pl-8 py-3 border-b border-gray-100/80 cursor-pointer transition-all ${selectedColorName === color.colorName && selectedProductId === product.id ? 'bg-indigo-50 border-l-[3px] border-l-indigo-400' : 'hover:bg-gray-100/60 border-l-[3px] border-l-transparent'}`}>
                                                                <div className="w-5 h-5 rounded-full border-2 border-gray-300 mr-3 flex-shrink-0" style={{ backgroundColor: COLOR_MAP[color.colorName] || '#E5E7EB' }} />
                                                                <div className="flex-1 min-w-0 flex items-center gap-2">
                                                                    <span className="text-xs font-bold text-gray-700">{color.colorName}</span>
                                                                    <span className="text-[10px] text-gray-400 font-medium">25롤 1,045m</span>
                                                                </div>
                                                                <div className="flex items-center gap-3 mr-2">
                                                                    <div className="text-right">
                                                                        <div className="text-[10px] text-gray-400">주문</div>
                                                                        <div className="text-xs font-bold text-purple-600 font-mono">
                                                                            {color.orders.reduce((sum, o) => sum + o.sizes.length, 0)}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <ChevronDown size={14} className={`text-gray-400 flex-shrink-0 transition-transform duration-200 ${color.expanded ? 'rotate-180' : ''}`} />
                                                            </div>
                                                            <AnimatePresence>
                                                                {color.expanded && (
                                                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden bg-white/60">
                                                                        {color.orders.map(order => (
                                                                            <div key={order.id} className="border-b border-gray-100/50">
                                                                                <div className="flex items-center px-4 pl-12 py-2.5 cursor-pointer hover:bg-gray-50/80 transition-all" onClick={() => toggleOrderSelection(product.id, color.colorName, order.id)}>
                                                                                    {order.selected ? <CheckSquare size={16} className="text-purple-500 mr-2.5 flex-shrink-0" /> : <Square size={16} className="text-gray-300 mr-2.5 flex-shrink-0" />}
                                                                                    <div className="flex-1 min-w-0">
                                                                                        <div className="flex items-center gap-2">
                                                                                            <span className="text-[10px] font-mono text-gray-400">{order.orderNo}</span>
                                                                                            <span className="text-xs font-bold text-gray-700">{order.productNo}</span>
                                                                                        </div>
                                                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                                                            {order.sizes.map((size, i) => <span key={i} className="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-mono">{size.label}</span>)}
                                                                                        </div>
                                                                                    </div>
                                                                                    <span className="text-[10px] text-gray-400 flex-shrink-0">{order.sizes.length}개</span>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </motion.div>
                                                                )}
                                                            </AnimatePresence>
                                                        </div>
                                                    ))}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col h-full">
                                {/* 카테고리 탭 */}
                                {systemTopCategories.length > 0 && (
                                    <div className="flex gap-1 px-3 py-2 border-b border-gray-100 flex-shrink-0 flex-wrap">
                                        <button
                                            onClick={() => setSelectedSystemCategory('전체')}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedSystemCategory === '전체'
                                                ? 'bg-indigo-600 text-white shadow-sm'
                                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                                }`}
                                        >
                                            전체
                                        </button>
                                        {systemTopCategories.map(cat => (
                                            <button
                                                key={cat}
                                                onClick={() => setSelectedSystemCategory(cat)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedSystemCategory === cat
                                                    ? 'bg-indigo-600 text-white shadow-sm'
                                                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                                    }`}
                                            >
                                                {cat}
                                            </button>
                                        ))}
                                    </div>
                                )}
                                {/* 시스템 목록 */}
                                {filteredSystemCategories.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                                        <Package size={40} strokeWidth={1.5} />
                                        <p className="text-sm font-medium mt-3">등록된 시스템이 없습니다</p>
                                    </div>
                                ) : (
                                    filteredSystemCategories.map((sys, idx) => {
                                        const parts = sys.name.split(' > ');
                                        const sysDisplayName = parts[parts.length - 1];
                                        const parentPath = parts.slice(0, -1).join(' > ');
                                        // Deterministic order qty per system
                                        let hash = 0;
                                        for (let i = 0; i < sys.name.length; i++) hash = (hash * 31 + sys.name.charCodeAt(i)) & 0xffffffff;
                                        const orderQty = 10 + (Math.abs(hash) % 11);
                                        const isSelected = selectedSystemId === sys.id + idx;
                                        const realId = sys.id + idx;
                                        return (
                                            <div key={realId}>
                                                <div
                                                    onClick={() => handleSystemClick(realId, sys.name)}
                                                    className={`flex items-center px-4 py-3.5 border-b border-gray-100 cursor-pointer transition-all group ${isSelected
                                                        ? 'bg-indigo-50 border-l-[3px] border-l-indigo-500'
                                                        : 'hover:bg-indigo-50/40 border-l-[3px] border-l-transparent'
                                                        }`}
                                                >
                                                    <div className="flex-1 min-w-0">
                                                        {parentPath && (
                                                            <div className="text-[10px] text-gray-400 font-medium mb-0.5 truncate">
                                                                {parentPath}
                                                            </div>
                                                        )}
                                                        <div className="flex items-center gap-2">
                                                            <span className={`text-sm font-bold truncate transition-colors ${isSelected ? 'text-indigo-700' : 'text-gray-800 group-hover:text-indigo-700'
                                                                }`}>
                                                                {sysDisplayName}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 flex-shrink-0">
                                                        <div className="text-right">
                                                            <span className="text-sm font-bold font-mono text-indigo-600">{orderQty}</span>
                                                            <span className="text-[10px] text-gray-400 ml-0.5">건</span>
                                                        </div>
                                                        <ChevronRight size={14} className={`text-gray-400 transition-transform duration-200 ${isSelected ? 'rotate-90 text-indigo-500' : ''}`} />
                                                    </div>
                                                </div>
                                                {/* 주문 규격 리스트 서브패널 */}
                                                <AnimatePresence>
                                                    {isSelected && systemOrderSpecs.length > 0 && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: 'auto', opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            transition={{ duration: 0.22 }}
                                                            className="overflow-hidden bg-indigo-50/60"
                                                        >
                                                            {/* 헤더: 전체선택 */}
                                                            <div className="flex items-center justify-between px-4 pl-6 py-2 border-b border-indigo-100/70">
                                                                <span className="text-[11px] font-bold text-indigo-600">주문 규격 목록 ({systemOrderSpecs.length}건)</span>
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); toggleAllSystemSpecs(!systemOrderSpecs.every(s => s.selected)); }}
                                                                    className="flex items-center gap-1 text-[10px] font-bold text-indigo-500 hover:text-indigo-700 transition-colors"
                                                                >
                                                                    {systemOrderSpecs.every(s => s.selected)
                                                                        ? <CheckSquare size={12} />
                                                                        : <Square size={12} />}
                                                                    전체선택
                                                                </button>
                                                            </div>
                                                            {/* 규격 목록 */}
                                                            <div className="max-h-[280px] overflow-y-auto">
                                                                {systemOrderSpecs.map(spec => (
                                                                    <div
                                                                        key={spec.id}
                                                                        onClick={(e) => { e.stopPropagation(); toggleSystemOrderSpec(spec.id); }}
                                                                        className={`flex items-center px-4 pl-8 py-2.5 border-b border-indigo-100/40 cursor-pointer transition-all hover:bg-indigo-100/40 ${spec.selected ? '' : 'opacity-50'
                                                                            }`}
                                                                    >
                                                                        {spec.selected
                                                                            ? <CheckSquare size={14} className="text-indigo-500 mr-2.5 flex-shrink-0" />
                                                                            : <Square size={14} className="text-gray-300 mr-2.5 flex-shrink-0" />}
                                                                        <div className="flex-1 min-w-0">
                                                                            <div className="flex items-center gap-1.5">
                                                                                <span className="text-[10px] font-mono text-gray-400">{spec.orderNo}</span>
                                                                                <span className="text-[10px] font-bold text-gray-600">{spec.productNo}</span>
                                                                            </div>
                                                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                                                <span className="text-[11px] font-bold text-indigo-700 bg-indigo-100 px-1.5 py-0.5 rounded font-mono">
                                                                                    {spec.width} × {spec.height}
                                                                                </span>
                                                                                <span className="text-[10px] text-gray-400">mm</span>
                                                                                {spec.qty > 1 && (
                                                                                    <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                                                                                        ×{spec.qty}
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT PANEL */}
                <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                    {/* 시스템 탭 오른쪽: BOM 부품 + 소모량 계산 패널 */}
                    {viewMode === 'system' && selectedSystemId ? (
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {/* 선택된 시스템 정보 */}
                            <div className="bg-white rounded-2xl shadow-sm border border-indigo-200 overflow-hidden">
                                <div className="px-5 py-3.5 bg-gradient-to-r from-indigo-50 to-violet-50 border-b border-indigo-100 flex items-center gap-3">
                                    <div className="w-9 h-9 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                                        <Wrench size={18} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-800 text-sm">BOM 부품 소모량 계산</h3>
                                        <span className="text-xs text-gray-400">
                                            선택 규격 {systemOrderSpecs.filter(s => s.selected).length}건 기준
                                        </span>
                                    </div>
                                    <div className="ml-auto flex items-center gap-2">
                                        <span className="text-[11px] font-bold text-indigo-600 bg-indigo-100 px-2.5 py-1 rounded-full">
                                            총 {systemOrderSpecs.filter(s => s.selected).reduce((a, s) => a + s.qty, 0)}건 선택됨
                                        </span>
                                    </div>
                                </div>
                                <div className="px-5 py-3 text-[11px] text-amber-700 bg-amber-50 border-b border-amber-100 flex items-center gap-2">
                                    <Calculator size={13} className="flex-shrink-0" />
                                    부품을 클릭하면 선택된 주문 규격에 대한 총 소모량을 계산합니다
                                </div>
                                {/* 부품 리스트 */}
                                <div className="divide-y divide-gray-100">
                                    {systemBomParts.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-10 text-center px-6">
                                            <Wrench size={32} className="text-gray-200 mb-3" />
                                            <p className="text-sm font-bold text-gray-400">등록된 BOM 부품이 없습니다</p>
                                            <p className="text-[11px] text-gray-300 mt-1.5 leading-relaxed">
                                                표준설정 → 상품원가 → 조립탭 → 제작탭 에서<br />해당 시스템의 부품을 등록해 주세요
                                            </p>
                                        </div>
                                    ) : systemBomParts.map(part => {
                                        const isActive = selectedBomPartId === part.id;
                                        const selectedSpecs = systemOrderSpecs.filter(s => s.selected);
                                        const isLenUnitEarly = ['m', 'cm', 'mm'].some(u => part.usageUnit.toLowerCase().includes(u));
                                        // EA 단위: 제품번호(작업번호)당 고정 수량 → qty=1 사용 (건수×공식값)
                                        // 길이 단위: 수량비례 계산 → spec.qty 사용
                                        const totalUsage = selectedSpecs.reduce((sum, spec) => {
                                            const effectiveQty = isLenUnitEarly ? spec.qty : 1;
                                            return sum + calcBomUsage(part.usageFormula, spec.width, spec.height, effectiveQty);
                                        }, 0);

                                        // 길이단위 로스 사전 계산
                                        const isLenUnit = ['m', 'cm', 'mm'].some(u => part.usageUnit.toLowerCase().includes(u));
                                        let previewLossTotal = 0, previewLossCount = 0;
                                        if (isLenUnit && selectedSpecs.length > 0) {
                                            const stripSz = (part.stripSize && part.stripSize > 0)
                                                ? part.stripSize
                                                : part.usageFormula.startsWith('fixed:')
                                                    ? (parseFloat(part.usageFormula.replace('fixed:', '')) || 1)
                                                    : Math.max(...selectedSpecs.map(s => calcBomUsage(part.usageFormula, s.width, s.height, 1)));
                                            const pItems = [...selectedSpecs]
                                                .map(s => calcBomUsage(part.usageFormula, s.width, s.height, 1))
                                                .sort((a, b) => a - b);
                                            const pUnplaced = new Set(pItems.map((_, i) => i));
                                            let pRem = stripSz, pSafety = 0;
                                            while (pUnplaced.size > 0 && pSafety++ < 2000) {
                                                let bIdx = -1, bUsage = 0;
                                                for (const i of pUnplaced) {
                                                    if (pItems[i] <= pRem && pItems[i] > bUsage) { bUsage = pItems[i]; bIdx = i; }
                                                }
                                                if (bIdx >= 0) { pUnplaced.delete(bIdx); pRem -= pItems[bIdx]; }
                                                else { if (pRem > 0) { previewLossTotal += pRem; previewLossCount++; } pRem = stripSz; }
                                            }
                                            if (pRem > 0 && pRem < stripSz) { previewLossTotal += pRem; previewLossCount++; }
                                        }

                                        // 줄길이 기반 소모량 합계 계산 (줄길이*2+10)
                                        let cordBasedTotal = 0;
                                        if (isLenUnit && selectedSpecs.length > 0) {
                                            selectedSpecs.forEach((spec, i) => {
                                                const cordLength = 150 + Math.floor(Math.abs(Math.sin(spec.width * 7 + spec.height * 13 + i)) * 51);
                                                cordBasedTotal += cordLength * 2 + 10;
                                            });
                                        }

                                        // 총예상원가 계산: 길이단위는 단가 × ea수(로스개수), EA단위는 totalUsage × 단가
                                        const unitCost = parseFloat(part.cost || '0');
                                        const totalCost = isLenUnit && previewLossCount > 0
                                            ? unitCost * previewLossCount
                                            : totalUsage * unitCost;

                                        return (
                                            <div key={part.id}>
                                                <div
                                                    onClick={() => setSelectedBomPartId(isActive ? null : part.id)}
                                                    className={`flex items-center px-5 py-3.5 cursor-pointer transition-all ${isActive
                                                        ? 'bg-violet-50 border-l-[3px] border-l-violet-500'
                                                        : 'hover:bg-gray-50 border-l-[3px] border-l-transparent'
                                                        }`}
                                                >
                                                    <div className="w-8 h-8 rounded-lg mr-3 flex items-center justify-center flex-shrink-0" style={{ background: isActive ? '#ede9fe' : '#f3f4f6' }}>
                                                        <Wrench size={14} className={isActive ? 'text-violet-600' : 'text-gray-400'} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`text-sm font-bold ${isActive ? 'text-violet-700' : 'text-gray-800'}`}>{part.name}</span>
                                                            <span className="text-[10px] text-gray-400 font-medium">{part.spec}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <span className="text-[10px] text-gray-400">공식: </span>
                                                            <code className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-mono">
                                                                {part.usageFormula.startsWith('fixed:') ? `${part.usageFormula.replace('fixed:', '')} ${part.usageUnit}/건` : part.usageFormula}
                                                            </code>
                                                            <span className="text-[10px] text-gray-400">단가: {Number(part.cost).toLocaleString()}원/{part.inventoryUnit}</span>
                                                        </div>
                                                    </div>
                                                    {/* 우측: 총예상소요량 + 총예상원가 박스 - 고정 너비로 직선 정렬 */}
                                                    <div className="flex items-center gap-2 flex-shrink-0 mr-2">
                                                        <div className="text-center px-2.5 py-1.5 rounded-lg bg-violet-50 border border-violet-100">
                                                            <div className="text-[9px] font-bold text-violet-400 mb-0.5">총예상소요량</div>
                                                            <div className="text-[10px] font-extrabold text-violet-700 font-mono whitespace-nowrap">
                                                                {part.name.includes('코드줄')
                                                                    ? `${selectedSpecs.length}건 ${(cordBasedTotal / 100).toFixed(1)} m`
                                                                    : isLenUnit && previewLossCount > 0
                                                                        ? <>{selectedSpecs.length}건 {previewLossCount}ea <span className="text-red-400">로스 {previewLossTotal.toFixed(previewLossTotal % 1 === 0 ? 0 : 1)}{part.usageUnit}</span></>
                                                                        : `${selectedSpecs.length}건 ${totalUsage.toFixed(totalUsage % 1 === 0 ? 0 : 1)}${part.usageUnit}`
                                                                }
                                                            </div>
                                                        </div>
                                                        <div className="text-center min-w-[90px] px-2.5 py-1.5 rounded-lg bg-amber-50 border border-amber-100">
                                                            <div className="text-[9px] font-bold text-amber-400 mb-0.5">총예상원가</div>
                                                            <div className="text-xs font-extrabold text-amber-700 font-mono mt-1">
                                                                {Math.round(totalCost).toLocaleString()}
                                                                <span className="text-[9px] font-bold text-gray-400 ml-0.5">원</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 flex-shrink-0 ${isActive ? 'rotate-180 text-violet-500' : ''}`} />
                                                </div>
                                                {/* 소모량 계산 결과 펼치기 */}
                                                <AnimatePresence>
                                                    {isActive && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: 'auto', opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            transition={{ duration: 0.2 }}
                                                            className="overflow-hidden"
                                                        >
                                                            <div className="px-5 py-4 bg-violet-50/60 border-t border-violet-100">
                                                                {/* 선택된 규격별 계산 테이블 */}
                                                                {selectedSpecs.length === 0 ? (
                                                                    <div className="text-center py-3 text-sm text-gray-400">선택된 주문 규격이 없습니다</div>
                                                                ) : (
                                                                    <>
                                                                        {(() => {
                                                                            const isLenUnit = ['m', 'cm', 'mm'].some(u => part.usageUnit.toLowerCase().includes(u));
                                                                            const isEa = !isLenUnit;

                                                                            // --- 길이 단위: 패킹 알고리즘 ---
                                                                            if (isLenUnit) {
                                                                                // 스트립 크기: fixed:X면 X, 아니면 max usage
                                                                                // stripSize: part.stripSize(mm)를 표시 단위로 변환
                                                                                const getStripSize = () => {
                                                                                    if (part.stripSize && part.stripSize > 0) {
                                                                                        // stripSize를 그대로 cm 단위로 사용 (BOM 사용량 = cm 기준)
                                                                                        return part.stripSize;
                                                                                    }
                                                                                    if (part.usageFormula.startsWith('fixed:')) {
                                                                                        return parseFloat(part.usageFormula.replace('fixed:', '')) || 1;
                                                                                    }
                                                                                    return Math.max(...selectedSpecs.map(s => calcBomUsage(part.usageFormula, s.width, s.height, 1)));
                                                                                };
                                                                                const stripSize = getStripSize();

                                                                                // 그리디 패킹: 작은 것부터 넣고, 넣을 수 없으면 로스 후 새 스트립
                                                                                type Row = { type: 'item'; spec: typeof selectedSpecs[0]; itemUsage: number; remaining: number } | { type: 'loss'; amount: number };
                                                                                const rows: Row[] = [];
                                                                                let totalLoss = 0;
                                                                                let lossCount = 0;

                                                                                // 사용량 오름차순 정렬 복사본
                                                                                const items = [...selectedSpecs]
                                                                                    .map(s => ({ spec: s, usage: calcBomUsage(part.usageFormula, s.width, s.height, 1) }))
                                                                                    .sort((a, b) => a.usage - b.usage);

                                                                                const unplaced = new Set(items.map((_, i) => i));
                                                                                let remaining = stripSize;
                                                                                let safety = 0;

                                                                                while (unplaced.size > 0 && safety++ < 2000) {
                                                                                    // 남은 공간에 들어갈 가장 큰 아이템 찾기
                                                                                    let bestIdx = -1, bestUsage = 0;
                                                                                    for (const i of unplaced) {
                                                                                        if (items[i].usage <= remaining && items[i].usage > bestUsage) {
                                                                                            bestUsage = items[i].usage; bestIdx = i;
                                                                                        }
                                                                                    }
                                                                                    if (bestIdx >= 0) {
                                                                                        unplaced.delete(bestIdx);
                                                                                        remaining -= items[bestIdx].usage;
                                                                                        rows.push({ type: 'item', spec: items[bestIdx].spec, itemUsage: items[bestIdx].usage, remaining });
                                                                                    } else {
                                                                                        // 아무것도 안 들어감 → 로스 기록 후 새 스트립
                                                                                        if (remaining > 0) {
                                                                                            rows.push({ type: 'loss', amount: remaining });
                                                                                            totalLoss += remaining; lossCount++;
                                                                                        }
                                                                                        remaining = stripSize;
                                                                                    }
                                                                                }
                                                                                // 마지막 스트립 잔량
                                                                                if (remaining > 0 && remaining < stripSize) {
                                                                                    rows.push({ type: 'loss', amount: remaining });
                                                                                    totalLoss += remaining; lossCount++;
                                                                                }

                                                                                const lossStr = totalLoss > 0
                                                                                    ? ` 로스(${(totalLoss / 1000).toFixed(1)}m)`
                                                                                    : '';

                                                                                return (
                                                                                    <>
                                                                                        {part.name.includes('코드줄') ? (
                                                                                            /* 코드줄: 줄길이 + 소모량(줄길이*2+10) */
                                                                                            <table className="w-full text-[11px] mb-1">
                                                                                                <thead>
                                                                                                    <tr className="border-b border-violet-200">
                                                                                                        <th className="py-2 text-left font-bold text-gray-500">작업번호</th>
                                                                                                        <th className="py-2 text-left font-bold text-gray-500">규격</th>
                                                                                                        <th className="py-2 text-right font-bold text-blue-500">줄길이</th>
                                                                                                        <th className="py-2 text-right font-bold text-gray-500">소모량</th>
                                                                                                    </tr>
                                                                                                </thead>
                                                                                                <tbody>
                                                                                                    {rows.filter(row => row.type === 'item').map((row, ri) => {
                                                                                                        const cordLength = 150 + Math.floor(Math.abs(Math.sin(row.spec.width * 7 + row.spec.height * 13 + ri)) * 51);
                                                                                                        const usage = cordLength * 2 + 10;
                                                                                                        return (
                                                                                                            <tr key={`item-${ri}`} className="hover:bg-violet-100/30 transition-colors">
                                                                                                                <td className="py-2 font-mono font-bold text-indigo-700 text-[10px]">{row.spec.orderNo}</td>
                                                                                                                <td className="py-2 text-gray-600 font-mono text-[10px]">{row.spec.width}×{row.spec.height}</td>
                                                                                                                <td className="py-2 text-right font-mono font-bold text-blue-600 text-[10px]">{cordLength} cm</td>
                                                                                                                <td className="py-2 text-right font-mono text-gray-700">
                                                                                                                    {usage} {part.usageUnit}
                                                                                                                </td>
                                                                                                            </tr>
                                                                                                        );
                                                                                                    })}
                                                                                                </tbody>
                                                                                            </table>
                                                                                        ) : (
                                                                                            /* 비코드줄: 소모량 + 규격사용잔량 + 로스 */
                                                                                            <>
                                                                                                {totalLoss > 0 && (
                                                                                                    <div className="mb-2 px-2 py-1.5 bg-red-50 border border-red-100 rounded-lg text-[10px] text-red-600 font-bold">
                                                                                                        ⚠ {lossCount}회 로스 누적 {(totalLoss / 1000).toFixed(1)}m
                                                                                                    </div>
                                                                                                )}
                                                                                                <table className="w-full text-[11px] mb-1">
                                                                                                    <thead>
                                                                                                        <tr className="border-b border-violet-200">
                                                                                                            <th className="py-2 text-left font-bold text-gray-500">작업번호</th>
                                                                                                            <th className="py-2 text-left font-bold text-gray-500">규격</th>
                                                                                                            <th className="py-2 text-right font-bold text-gray-500">소모량</th>
                                                                                                            <th className="py-2 text-right font-bold text-emerald-600">규격사용잔량</th>
                                                                                                        </tr>
                                                                                                    </thead>
                                                                                                    <tbody>
                                                                                                        {rows.map((row, ri) => row.type === 'loss' ? (
                                                                                                            <tr key={`loss-${ri}`} className="bg-red-50/60">
                                                                                                                <td colSpan={2} className="py-1.5 text-[10px] font-bold text-red-500 italic">↳ 로스</td>
                                                                                                                <td className="py-1.5 text-right font-mono font-bold text-red-500 text-[10px]">
                                                                                                                    {row.amount.toLocaleString()} {part.usageUnit}
                                                                                                                </td>
                                                                                                                <td></td>
                                                                                                            </tr>
                                                                                                        ) : (
                                                                                                            <tr key={`item-${ri}`} className="hover:bg-violet-100/30 transition-colors">
                                                                                                                <td className="py-2 font-mono font-bold text-indigo-700 text-[10px]">{row.spec.orderNo}</td>
                                                                                                                <td className="py-2 text-gray-600 font-mono text-[10px]">{row.spec.width}×{row.spec.height}</td>
                                                                                                                <td className="py-2 text-right font-mono text-gray-700">
                                                                                                                    {row.itemUsage.toFixed(row.itemUsage % 1 === 0 ? 0 : 2)} {part.usageUnit}
                                                                                                                </td>
                                                                                                                <td className="py-2 text-right font-mono font-bold text-emerald-700">
                                                                                                                    {row.remaining > 0
                                                                                                                        ? `${row.remaining.toFixed(row.remaining % 1 === 0 ? 0 : 1)} ${part.usageUnit}`
                                                                                                                        : <span className="text-red-400">-</span>}
                                                                                                                </td>
                                                                                                            </tr>
                                                                                                        ))}
                                                                                                    </tbody>
                                                                                                </table>
                                                                                                {totalLoss > 0 && (
                                                                                                    <p className="text-[9px] text-gray-400 mt-1">
                                                                                                        * 스트립 단위: {stripSize.toLocaleString()}{part.usageUnit} | 총 {selectedSpecs.length}건{lossStr}
                                                                                                    </p>
                                                                                                )}
                                                                                            </>
                                                                                        )}
                                                                                    </>
                                                                                );
                                                                            }

                                                                            // --- EA 단위: 소계 없음 ---
                                                                            return (
                                                                                <table className="w-full text-[11px] mb-3">
                                                                                    <thead>
                                                                                        <tr className="border-b border-violet-200">
                                                                                            <th className="py-2 text-left font-bold text-gray-500">작업번호</th>
                                                                                            <th className="py-2 text-left font-bold text-gray-500">규격 (폭×높이)</th>
                                                                                            <th className="py-2 text-right font-bold text-gray-500">소모량</th>
                                                                                        </tr>
                                                                                    </thead>
                                                                                    <tbody className="divide-y divide-violet-100">
                                                                                        {selectedSpecs.map(spec => {
                                                                                            const usage = calcBomUsage(part.usageFormula, spec.width, spec.height, 1);
                                                                                            return (
                                                                                                <tr key={spec.id} className="hover:bg-violet-100/30 transition-colors">
                                                                                                    <td className="py-2 font-mono font-bold text-indigo-700">{spec.orderNo}</td>
                                                                                                    <td className="py-2 text-gray-600 font-mono">{spec.width}×{spec.height}</td>
                                                                                                    <td className="py-2 text-right font-mono text-gray-700">
                                                                                                        {usage.toFixed(usage % 1 === 0 ? 0 : 2)} {part.usageUnit}
                                                                                                    </td>
                                                                                                </tr>
                                                                                            );
                                                                                        })}
                                                                                    </tbody>
                                                                                </table>
                                                                            );
                                                                        })()}
                                                                    </>
                                                                )}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    ) : viewMode === 'system' && !selectedSystemId ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-300">
                            <div className="text-center opacity-60 flex flex-col items-center gap-4 bg-white/80 p-10 rounded-3xl border border-gray-200">
                                <div className="w-20 h-20 rounded-2xl bg-indigo-50 flex items-center justify-center">
                                    <Wrench size={40} className="text-indigo-300" />
                                </div>
                                <div>
                                    <p className="text-lg font-bold text-gray-500">BOM 소모량 계산</p>
                                    <p className="text-sm text-gray-400 mt-1">좌측에서 시스템을 선택하세요</p>
                                </div>
                            </div>
                        </div>
                    ) : selectedProduct && selectedColor ? (
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {/* Fabric Width Selection */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="px-5 py-3.5 bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-gray-100 flex items-center gap-3">
                                    <div className="w-9 h-9 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center"><Ruler size={18} /></div>
                                    <h3 className="font-bold text-gray-800 text-sm">원단 폭 선택</h3>

                                    <div className="flex items-center gap-2 ml-4">
                                        <span className="bg-purple-600 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-sm">{selectedProduct.name}</span>
                                        <span className="bg-indigo-500 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-sm">{selectedColor.colorName}</span>
                                    </div>

                                    {selectedFabricWidth && <span className="text-xs font-bold text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full ml-auto">{selectedFabricWidth === 'mixed' ? '혼합 최적화' : `${selectedFabricWidth}cm`} 선택됨</span>}
                                </div>
                                <div className="px-5 py-4 flex flex-wrap items-center gap-3">
                                    {FABRIC_WIDTH_OPTIONS.map(fw => (
                                        <button key={fw} onClick={() => { setSelectedFabricWidth(fw); resetCutting(); }} className={`px-5 py-3 rounded-xl text-sm font-bold transition-all border flex items-center gap-2 ${selectedFabricWidth === fw ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-200' : 'bg-white text-gray-600 border-gray-200 hover:border-purple-300 hover:bg-purple-50'}`}>
                                            <span>{fw}cm</span>
                                            <span className={`text-[11px] font-medium ${selectedFabricWidth === fw ? 'text-purple-200' : 'text-gray-400'}`}> : 25Roll-1,345m</span>
                                        </button>
                                    ))}
                                    <button onClick={() => { setSelectedFabricWidth('mixed'); resetCutting(); }} className={`px-5 py-3 rounded-xl text-sm font-bold transition-all border flex items-center gap-2 ${selectedFabricWidth === 'mixed' ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white border-purple-600 shadow-md shadow-purple-200' : 'bg-white text-gray-600 border-gray-200 hover:border-purple-300 hover:bg-purple-50'}`}>
                                        ✨ 210+280 혼합 최적화
                                    </button>
                                </div>
                                {/* Comparison Card */}
                                {comparisonResults && (
                                    <div className="px-5 pb-4">
                                        <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl border border-gray-200 overflow-hidden">
                                            <div className="px-4 py-2 bg-gray-100 border-b border-gray-200">
                                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">📊 모드별 효율 비교 (자동배치 시뮬레이션)</span>
                                            </div>
                                            <div className="grid grid-cols-3 divide-x divide-gray-200">
                                                {[
                                                    { label: '210cm 단일', data: comparisonResults.r210, mode: 210 as number | 'mixed', color: 'blue' },
                                                    { label: '280cm 단일', data: comparisonResults.r280, mode: 280 as number | 'mixed', color: 'indigo' },
                                                    { label: '210+280 혼합', data: comparisonResults.rMix, mode: 'mixed' as number | 'mixed', color: 'purple' },
                                                ].map((item) => {
                                                    const isBest = item.data.efficiency >= comparisonResults.r210.efficiency && item.data.efficiency >= comparisonResults.r280.efficiency && item.data.efficiency >= comparisonResults.rMix.efficiency;
                                                    const isSelected = selectedFabricWidth === item.mode;
                                                    return (
                                                        <button key={item.label} onClick={() => { setSelectedFabricWidth(item.mode); resetCutting(); }} className={`px-3 py-3 text-center transition-all hover:bg-gray-50 ${isSelected ? 'bg-purple-50 ring-2 ring-inset ring-purple-300' : ''}`}>
                                                            <div className="flex items-center justify-center gap-1">
                                                                <span className={`text-xs font-bold ${isSelected ? 'text-purple-700' : 'text-gray-700'}`}>{item.label}</span>
                                                                {isBest && <span className="text-[9px] bg-emerald-500 text-white px-1.5 py-0.5 rounded-full font-bold">최적</span>}
                                                            </div>
                                                            <div className="mt-1.5 space-y-0.5">
                                                                <div className="text-lg font-extrabold font-mono" style={{ color: item.data.efficiency >= 80 ? '#059669' : item.data.efficiency >= 60 ? '#d97706' : '#dc2626' }}>{item.data.efficiency}%</div>
                                                                <div className="text-[9px] text-gray-400">라인 {item.data.lines}개 · 잔여 {(item.data.waste / 10).toFixed(1)}cm</div>
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Interactive Cutting Area */}
                            {selectedFabricWidth && (
                                <>
                                    {/* Available Sizes - Click to Place */}
                                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                                        <div className="px-5 py-3.5 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-gray-100 flex items-center gap-3">
                                            <div className="w-9 h-9 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center"><Layers size={18} /></div>
                                            <div className="flex-1">
                                                <h3 className="font-bold text-gray-800 text-sm">주문요청 사이즈 <span className="text-gray-400 font-normal">— 클릭하여 제단 라인에 배치</span></h3>
                                                <span className="text-xs text-gray-400">미배치 {availableSizes.length}개 / 전체 {allSizesWithUids.length}개</span>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={autoFillAll} disabled={availableSizes.length === 0} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                                                    <Zap size={12} /> 자동배치
                                                </button>
                                                <button onClick={resetCutting} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-200 text-gray-600 hover:bg-gray-300 transition-all">
                                                    <RotateCcw size={12} /> 초기화
                                                </button>
                                            </div>
                                        </div>
                                        <div className="px-5 py-4">
                                            {availableSizes.length > 0 ? (
                                                <div className="flex flex-wrap gap-2">
                                                    {availableSizes.map((size, i) => (
                                                        <motion.button key={size.uid} onClick={() => placeSizeOnLine(size)} className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border-2 transition-all cursor-pointer ${autoFillSuggestion?.uid === size.uid ? 'bg-green-50 border-green-400 text-green-700 ring-2 ring-green-200 animate-pulse' : 'bg-white border-gray-200 text-gray-700 hover:border-purple-400 hover:bg-purple-50'}`}
                                                            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                                            <Plus size={10} />
                                                            {size.label}
                                                            <span className="text-[9px] text-gray-400 font-mono">({(size.width / 10)}cm)</span>
                                                            {autoFillSuggestion?.uid === size.uid && <span className="text-[9px] bg-green-500 text-white px-1.5 py-0.5 rounded ml-1">추천</span>}
                                                        </motion.button>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center py-4 text-sm text-emerald-600 font-bold">✓ 모든 사이즈가 배치되었습니다</div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Auto-fill Suggestion Banner */}
                                    {autoFillSuggestion && (
                                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl">
                                            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0"><Zap size={20} className="text-green-600" /></div>
                                            <div className="flex-1">
                                                <div className="text-sm font-bold text-green-800">로스 감소 추천</div>
                                                <div className="text-xs text-green-600">제단 라인 #{suggestionLineIdx + 1}의 잔여 공간에 <span className="font-bold">{autoFillSuggestion.label}</span> ({(autoFillSuggestion.width / 10)}cm) 배치 가능</div>
                                            </div>
                                            <button onClick={acceptSuggestion} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold bg-green-600 text-white hover:bg-green-700 transition-all shadow-sm">
                                                <ArrowRight size={14} /> 배치하기
                                            </button>
                                        </motion.div>
                                    )}

                                    {/* Cutting Lines */}
                                    {cuttingLines.length > 0 && (
                                        <div className="bg-white rounded-2xl shadow-sm border border-purple-200 overflow-hidden ring-1 ring-purple-100">
                                            <div className="px-5 py-3.5 bg-gradient-to-r from-purple-50 to-violet-50 border-b border-purple-100 flex items-center gap-3">
                                                <div className="w-9 h-9 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center"><Scissors size={18} /></div>
                                                <div className="flex-1">
                                                    <h3 className="font-bold text-gray-800 text-sm">제단작업 가이드</h3>
                                                    <span className="text-xs text-gray-400">{selectedFabricWidth === 'mixed' ? '혼합(210+280)' : `원단폭 ${selectedFabricWidth}cm`} · {cuttingLines.length}개 라인 · {allSizesWithUids.length - availableSizes.length}개 배치됨</span>
                                                </div>
                                                <div className={`text-xs font-bold px-2.5 py-1 rounded-full ${efficiency >= 80 ? 'bg-emerald-100 text-emerald-700' : efficiency >= 60 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                                                    효율 {efficiency}%
                                                </div>
                                            </div>
                                            <div className="px-5 py-4 space-y-3">
                                                {/* Efficiency Bar */}
                                                <div className="flex items-center gap-3 mb-4">
                                                    <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                                                        <motion.div initial={{ width: 0 }} animate={{ width: `${efficiency}%` }} transition={{ duration: 0.8 }} className={`h-full rounded-full ${efficiency >= 80 ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : efficiency >= 60 ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 'bg-gradient-to-r from-red-400 to-red-500'}`} />
                                                    </div>
                                                    <div className="flex gap-4 text-xs">
                                                        <span className="text-gray-500">사용: <span className="font-bold text-gray-800 font-mono">{(totalUsed / 10).toFixed(1)}cm</span></span>
                                                        <span className="text-gray-500">잔여: <span className="font-bold text-red-500 font-mono">{(totalWaste / 10).toFixed(1)}cm</span></span>
                                                    </div>
                                                </div>

                                                {cuttingLines.map((line, lineIdx) => {
                                                    const fwMm = line.fabricWidth * 10;
                                                    return (
                                                        <div key={lineIdx} className={`border rounded-xl overflow-hidden ${suggestionLineIdx === lineIdx ? 'border-green-300 ring-1 ring-green-200' : 'border-gray-200'}`}>
                                                            <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-xs font-bold text-gray-600">제단 라인 #{lineIdx + 1}</span>
                                                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${line.fabricWidth === 210 ? 'bg-blue-100 text-blue-700' : 'bg-violet-100 text-violet-700'}`}>{line.fabricWidth}cm</span>
                                                                </div>
                                                                <div className="flex items-center gap-3">
                                                                    <button onClick={() => setSelectedDetailLineIdx(lineIdx)} className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold bg-white border border-purple-200 text-purple-600 hover:bg-purple-50 transition-all">
                                                                        <ExternalLink size={10} /> 상세보기
                                                                    </button>
                                                                    <div className="flex items-center gap-3 text-[10px]">
                                                                        <span className="text-gray-500">사용 <span className="font-bold text-purple-600 font-mono">{(line.used / 10).toFixed(1)}cm</span></span>
                                                                        <span className="text-gray-500">잔여 <span className={`font-bold font-mono ${line.waste > 0 ? 'text-orange-500' : 'text-emerald-500'}`}>{(line.waste / 10).toFixed(1)}cm</span></span>
                                                                        <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold ${line.waste === 0 ? 'bg-emerald-100 text-emerald-700' : line.waste < fwMm * 0.1 ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                                                                            {Math.round((line.used / fwMm) * 100)}%
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="px-4 py-3">
                                                                <div className="relative bg-gray-100 rounded-lg h-16 overflow-hidden border border-gray-200">
                                                                    {line.sizes.map((size, sizeIdx) => {
                                                                        const offset = line.sizes.slice(0, sizeIdx).reduce((s, sz) => s + sz.width, 0);
                                                                        return (
                                                                            <motion.button key={sizeIdx} initial={{ scaleX: 0, opacity: 0 }} animate={{ scaleX: 1, opacity: 1 }} transition={{ duration: 0.3, delay: sizeIdx * 0.1 }}
                                                                                className={`absolute top-0 h-full ${BLOCK_COLORS[sizeIdx % BLOCK_COLORS.length]} flex items-center justify-center border-r border-white/50 cursor-pointer hover:brightness-110 active:scale-[0.98]`}
                                                                                style={{ left: `${(offset / fwMm) * 100}%`, width: `${(size.width / fwMm) * 100}%`, transformOrigin: 'left' }}
                                                                                onClick={() => printLabel(size)}>
                                                                                <div className="text-center px-1">
                                                                                    <div className="text-[9px] font-bold text-white drop-shadow-sm whitespace-nowrap">{size.label}</div>
                                                                                    <div className="text-[8px] text-white/80 font-mono">{(size.width / 10)}cm</div>
                                                                                </div>
                                                                            </motion.button>
                                                                        );
                                                                    })}
                                                                    {/* Suggestion ghost */}
                                                                    {suggestionLineIdx === lineIdx && autoFillSuggestion && (
                                                                        <div className="absolute top-0 h-full bg-green-300/40 border-2 border-dashed border-green-500 flex items-center justify-center animate-pulse"
                                                                            style={{ left: `${(line.used / fwMm) * 100}%`, width: `${(autoFillSuggestion.width / fwMm) * 100}%` }}>
                                                                            <span className="text-[9px] font-bold text-green-700">{autoFillSuggestion.label}</span>
                                                                        </div>
                                                                    )}
                                                                    {line.waste > 0 && !(suggestionLineIdx === lineIdx && autoFillSuggestion) && (
                                                                        <div className="absolute top-0 h-full bg-red-100 border-l-2 border-dashed border-red-300 flex items-center justify-center"
                                                                            style={{ left: `${(line.used / fwMm) * 100}%`, width: `${(line.waste / fwMm) * 100}%` }}>
                                                                            <span className="text-[8px] font-bold text-red-400">잔여 {(line.waste / 10).toFixed(1)}cm</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                                                                    {line.sizes.map((size, sizeIdx) => (
                                                                        <span key={sizeIdx} className={`inline-flex px-2 py-0.5 rounded text-[9px] font-bold ${LABEL_COLORS[sizeIdx % LABEL_COLORS.length]}`}>{size.label}</span>
                                                                    ))}
                                                                    {line.waste > 0 && (
                                                                        <div className="flex items-center gap-1 ml-auto">
                                                                            <span className="text-[9px] font-bold text-gray-400">잔여:</span>
                                                                            <span className="inline-flex px-2 py-0.5 rounded text-[9px] font-bold bg-gray-100 text-gray-500">{(line.waste / 10).toFixed(1)}cm ({(line.fabricWidth * 10 - line.used) / 10}cm 실측)</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}

                                                {/* Summary */}
                                                <div className="mt-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
                                                    <div className="grid grid-cols-4 gap-4 text-center">
                                                        <div><div className="text-[10px] font-bold text-gray-400">제단 라인</div><div className="text-xl font-extrabold text-gray-800 mt-1 font-mono">{cuttingLines.length}</div></div>
                                                        <div><div className="text-[10px] font-bold text-gray-400">배치 수</div><div className="text-xl font-extrabold text-purple-600 mt-1 font-mono">{allSizesWithUids.length - availableSizes.length}</div></div>
                                                        <div><div className="text-[10px] font-bold text-gray-400">총 사용량</div><div className="text-xl font-extrabold text-blue-600 mt-1 font-mono">{(totalUsed / 10).toFixed(1)}<span className="text-xs text-gray-400">cm</span></div></div>
                                                        <div><div className="text-[10px] font-bold text-gray-400">총 잔여량</div><div className={`text-xl font-extrabold mt-1 font-mono ${totalWaste > 0 ? 'text-red-500' : 'text-emerald-500'}`}>{(totalWaste / 10).toFixed(1)}<span className="text-xs text-gray-400">cm</span></div></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {cuttingLines.length === 0 && (
                                        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                                            <AlertCircle size={18} className="text-amber-500 flex-shrink-0" />
                                            <span className="text-sm text-amber-700 font-medium">위 사이즈를 클릭하여 제단 라인에 배치하세요. 로스에 맞는 최적 사이즈를 자동 추천합니다.</span>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-300">
                            <div className="text-center opacity-60 flex flex-col items-center gap-4 bg-white/80 p-10 rounded-3xl border border-gray-200">
                                <div className="w-20 h-20 rounded-2xl bg-purple-50 flex items-center justify-center"><Scissors size={40} className="text-purple-300" /></div>
                                <div>
                                    <p className="text-lg font-bold text-gray-500">상세제단</p>
                                    <p className="text-sm text-gray-400 mt-1">{!selectedProduct ? '좌측에서 제품을 선택하세요' : '칼라를 선택하면 제단 가이드가 표시됩니다'}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal for Cutting Line Details */}
            <AnimatePresence>
                {selectedDetailLineIdx !== null && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden">
                            <div className="px-6 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-between text-white">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"><Scissors size={20} /></div>
                                    <div>
                                        <h3 className="font-bold text-lg">제단 라인 #{selectedDetailLineIdx + 1} 상세 가이드</h3>
                                        <p className="text-xs text-white/70">정밀 치수 및 라벨 출력 가이드</p>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedDetailLineIdx(null)} className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center hover:bg-black/20 transition-all text-white"><X size={18} /></button>
                            </div>
                            <div className="p-0 space-y-0">
                                {/* Fabric Visualization (Image 2 Style) */}
                                <div className="relative w-full h-[320px] bg-[#f8fbff] flex items-start justify-start overflow-hidden border-b border-gray-200">
                                    {cuttingLines[selectedDetailLineIdx].sizes.map((size, idx) => {
                                        const offsetHorizontal = cuttingLines[selectedDetailLineIdx].sizes.slice(0, idx).reduce((sum, s) => sum + s.width, 0);
                                        const fwMm = cuttingLines[selectedDetailLineIdx].fabricWidth * 10;
                                        const vWidth = (size.width / fwMm) * 100;
                                        const vLeft = (offsetHorizontal / fwMm) * 100;

                                        // Calculate max height in current line for scaling
                                        const maxH = Math.max(...cuttingLines[selectedDetailLineIdx].sizes.map(s => s.height), 1);
                                        const vHeight = (size.height / maxH) * 85;

                                        return (
                                            <div key={idx} className="absolute border-r border-b border-dashed border-gray-400 flex items-center justify-center p-2"
                                                style={{ left: `${vLeft}%`, width: `${vWidth}%`, height: `${vHeight}%`, top: 0 }}>
                                                <span className="text-[14px] font-bold text-gray-500 text-center leading-tight tracking-wide">
                                                    {size.width} X {size.height}
                                                </span>
                                            </div>
                                        );
                                    })}

                                    {/* Additional measurement lines */}
                                    <div className="absolute right-0 bottom-1 flex gap-2" style={{ left: `${(cuttingLines[selectedDetailLineIdx].used / (cuttingLines[selectedDetailLineIdx].fabricWidth * 10)) * 100}%` }}>
                                        <div className="bg-blue-50 text-blue-600 text-[9px] font-bold px-2 py-0.5 rounded border border-blue-100 shadow-sm whitespace-nowrap -ml-4">
                                            {cuttingLines[selectedDetailLineIdx].waste} mm
                                        </div>
                                    </div>
                                    <div className="absolute bottom-6 left-[38%] flex gap-2">
                                        <div className="bg-blue-50 text-blue-600 text-[9px] font-bold px-2 py-0.5 rounded border border-blue-100 shadow-sm">50 mm</div>
                                    </div>
                                    <div className="absolute bottom-12 left-[65%] flex gap-2">
                                        <div className="bg-blue-50 text-blue-600 text-[9px] font-bold px-2 py-0.5 rounded border border-blue-100 shadow-sm">100 mm</div>
                                    </div>
                                    <div className="absolute right-4 top-[80%] flex flex-col gap-2">
                                        <div className="bg-blue-50 text-blue-600 text-[9px] font-bold px-2 py-0.5 rounded border border-blue-100 shadow-sm">10 mm</div>
                                    </div>
                                </div>

                                <div className="p-6">
                                    <div className="overflow-hidden">
                                        <table className="w-full text-[13px]">
                                            <thead>
                                                <tr className="border-b border-gray-100">
                                                    <th className="py-3 text-left font-bold text-gray-400">순서</th>
                                                    <th className="py-3 text-left font-bold text-gray-700">규격</th>
                                                    <th className="py-3 text-right font-bold text-gray-400">라벨</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {cuttingLines[selectedDetailLineIdx].sizes.map((size, idx) => (
                                                    <tr key={idx} className="hover:bg-gray-50/30 transition-all text-gray-600">
                                                        <td className="py-5 text-gray-400 font-medium">{idx + 1}</td>
                                                        <td className="py-5 font-bold italic tracking-wider text-gray-800 text-[15px]">{size.label}</td>
                                                        <td className="py-5 text-right w-[80px]">
                                                            <button onClick={() => printLabel(size)} className="w-full py-1.5 rounded bg-[#f3edfd] text-[#8e44ad] text-[11px] font-bold hover:bg-[#ebdcf8] transition-all">출력</button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Detailed Dimension Badges Section (v2) */}
                                    <div className="mt-6 space-y-3">
                                        <div className="flex flex-wrap gap-2">
                                            <div className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded border border-blue-100 font-bold text-[11px] flex items-center gap-2">
                                                가로 : <span className="font-mono text-blue-500">{cuttingLines[selectedDetailLineIdx].used} mm</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {cuttingLines[selectedDetailLineIdx].sizes.map((size, idx) => (
                                                <div key={`h-badge-${idx}`} className="bg-red-50 text-[#ff6b6b] px-3 py-1.5 rounded border border-red-100 font-bold text-[11px] flex items-center gap-2">
                                                    세로 : <span className="font-mono text-[#ff8787]">{size.height} mm</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {cuttingLines[selectedDetailLineIdx].sizes.map((size, idx) => (
                                                <div key={`w-badge-${idx}`} className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded border border-blue-100 font-bold text-[11px] flex items-center gap-2">
                                                    가로 : <span className="font-mono text-blue-500">{size.width} mm</span>
                                                </div>
                                            ))}
                                            <div className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded border border-blue-100 font-bold text-[11px] flex items-center gap-2">
                                                가로 : <span className="font-mono text-blue-500">{cuttingLines[selectedDetailLineIdx].waste} mm</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-8 p-4 bg-[#f8fbff] rounded-2xl flex gap-3">
                                        <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 border border-blue-200"><Printer size={20} /></div>
                                        <p className="text-xs text-blue-800 leading-relaxed">
                                            <b className="block mb-1 text-blue-700 font-extrabold text-[12px] flex items-center gap-1"><span role="img" aria-label="bulb">💡</span> 제단 팁</b>
                                            <span className="text-blue-500">위 표의 <b className="font-bold text-blue-600">재단 치수(mm)</b>는 원단 시작점으로부터의 누적되지 않은 거리입니다.<br />각 규격 블록 또는 출력 버튼을 클릭하여 공정 라벨을 즉시 발행할 수 있습니다.</span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
                                <button onClick={() => setSelectedDetailLineIdx(null)} className="px-6 py-2 rounded-xl bg-gray-800 text-white font-bold text-sm hover:bg-gray-900 transition-all shadow-sm">닫기</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toast Notification */}
            <AnimatePresence>
                {toast.visible && (
                    <motion.div initial={{ opacity: 0, y: 50, x: '-50%' }} animate={{ opacity: 1, y: 0, x: '-50%' }} exit={{ opacity: 0, y: 50, x: '-50%' }}
                        className="fixed bottom-10 left-1/2 z-[200] px-6 py-3 bg-gray-900/90 text-white rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-md border border-white/10">
                        <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/30"><Printer size={16} /></div>
                        <span className="text-sm font-bold">{toast.message}</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ProductionManagement;
