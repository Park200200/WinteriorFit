import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Search, Plus, User, Phone, Mail, Calendar, MapPin, FileSpreadsheet, Truck, Ruler, Radio, ChevronRight, ChevronDown, Trash2, Package, Clock, DollarSign, StickyNote, Cake, Check, Edit3, X, RefreshCw, Edit, Image as ImageIcon, CheckCircle2 } from 'lucide-react';
import { useProductContext } from './ProductContext';
import { usePartnerContext } from '../PartnerContext';
import { MOCK_MEASURE_IMAGES } from '../constants';

// --- Types ---
interface CustomerInfo {
    name: string;
    phone: string;
    birthday: string;
    email: string;
    address: string;
    memo: string;
}

interface EstimateItem {
    id: string;
    productName: string;
    spec: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
}

interface Estimate {
    id: string;
    customer: CustomerInfo;
    estimateDate: string;
    totalAmount: number;
    constructionDate: string;
    measureDate: string;
    deliveryType: 'construction' | 'delivery' | 'direct';
    items: EstimateItem[];
}

// --- Sample Data ---
const sampleEstimates: Estimate[] = [
    {
        id: 'est-001',
        customer: { name: '김영수', phone: '010-1234-5678', birthday: '1985-03-15', email: 'kim@email.com', address: '서울시 강남구 역삼동 123-4', memo: '오전 방문 선호' },
        estimateDate: '2026-02-20',
        totalAmount: 1850000,
        constructionDate: '2026-03-05',
        measureDate: '2026-02-25',
        deliveryType: 'construction',
        items: [
            { id: 'item-1', productName: '우드블라인드 25mm 소나무', spec: '1200×1500', quantity: 3, unitPrice: 250000, totalPrice: 750000 },
            { id: 'item-2', productName: '롤블라인드 시드니', spec: '900×1200', quantity: 2, unitPrice: 180000, totalPrice: 360000 },
            { id: 'item-3', productName: '콤비블라인드 일반', spec: '1500×1800', quantity: 4, unitPrice: 185000, totalPrice: 740000 },
        ]
    },
    {
        id: 'est-002',
        customer: { name: '박지현', phone: '010-9876-5432', birthday: '1990-07-22', email: 'park@email.com', address: '서울시 서초구 반포동 56-7', memo: '' },
        estimateDate: '2026-02-19',
        totalAmount: 2340000,
        constructionDate: '2026-03-10',
        measureDate: '2026-02-26',
        deliveryType: 'delivery',
        items: [
            { id: 'item-4', productName: '우드블라인드 35mm 대나무', spec: '1400×1600', quantity: 5, unitPrice: 280000, totalPrice: 1400000 },
            { id: 'item-5', productName: '허니콤셰이드', spec: '1100×1400', quantity: 4, unitPrice: 235000, totalPrice: 940000 },
        ]
    },
    {
        id: 'est-003',
        customer: { name: '이민호', phone: '010-5555-7777', birthday: '1988-11-05', email: 'lee@email.com', address: '경기도 성남시 분당구 정자동 89', memo: '주말 시공 희망' },
        estimateDate: '2026-02-18',
        totalAmount: 980000,
        constructionDate: '2026-03-01',
        measureDate: '2026-02-22',
        deliveryType: 'direct',
        items: [
            { id: 'item-6', productName: '롤블라인드 암막', spec: '1000×1300', quantity: 2, unitPrice: 190000, totalPrice: 380000 },
            { id: 'item-7', productName: '버티칼블라인드', spec: '2000×2200', quantity: 1, unitPrice: 350000, totalPrice: 350000 },
            { id: 'item-8', productName: '제단원단', spec: '50-280', quantity: 1, unitPrice: 250000, totalPrice: 250000 },
        ]
    },
    {
        id: 'est-004',
        customer: { name: '최수아', phone: '010-3333-4444', birthday: '1995-01-30', email: 'choi@email.com', address: '서울시 마포구 상암동 234', memo: '계약금 50% 선결제' },
        estimateDate: '2026-02-17',
        totalAmount: 3200000,
        constructionDate: '2026-03-15',
        measureDate: '2026-02-28',
        deliveryType: 'construction',
        items: [
            { id: 'item-9', productName: '우드블라인드 55mm 소나무', spec: '1600×2000', quantity: 6, unitPrice: 320000, totalPrice: 1920000 },
            { id: 'item-10', productName: '콤비블라인드 프리미엄', spec: '1200×1500', quantity: 4, unitPrice: 320000, totalPrice: 1280000 },
        ]
    },
    {
        id: 'est-005',
        customer: { name: '정하나', phone: '010-8888-9999', birthday: '1992-06-18', email: 'jung@email.com', address: '인천시 연수구 송도동 67-8', memo: '' },
        estimateDate: '2026-02-15',
        totalAmount: 1560000,
        constructionDate: '2026-03-08',
        measureDate: '2026-02-24',
        deliveryType: 'delivery',
        items: [
            { id: 'item-11', productName: '롤블라인드 시드니', spec: '800×1000', quantity: 3, unitPrice: 160000, totalPrice: 480000 },
            { id: 'item-12', productName: '우드블라인드 25mm 대나무', spec: '1300×1400', quantity: 3, unitPrice: 260000, totalPrice: 780000 },
            { id: 'item-13', productName: '실사블라인드', spec: '1000×1200', quantity: 1, unitPrice: 300000, totalPrice: 300000 },
        ]
    }
];


const EstimateManagement: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedEstimateId, setSelectedEstimateId] = useState<string | null>(sampleEstimates[0]?.id || null);
    const [estimates, setEstimates] = useState<Estimate[]>(sampleEstimates);

    // --- New Estimate Popup State ---
    const [isNewEstimatePopupOpen, setIsNewEstimatePopupOpen] = useState(false);
    const [newCustSearch, setNewCustSearch] = useState('');
    const [newCustForm, setNewCustForm] = useState({ name: '', phone: '', email: '', birthday: '', birthdayType: 'solar' as 'solar' | 'lunar', address: '', memo: '' });
    const [newCustSearchResults, setNewCustSearchResults] = useState<{ id: string; name: string; phone: string; email: string; birthday: string; address: string; memo: string }[]>([]);
    const [newCustSelectedExisting, setNewCustSelectedExisting] = useState<string | null>(null);
    const [newCustMode, setNewCustMode] = useState<'search' | 'input'>('search');

    // --- Customer Info Edit State ---
    const [editingCustomer, setEditingCustomer] = useState<CustomerInfo>(sampleEstimates[0]?.customer || {
        name: '', phone: '', birthday: '', email: '', address: '', memo: ''
    });
    const [editingDeliveryType, setEditingDeliveryType] = useState<'construction' | 'delivery' | 'direct' | 'other'>(sampleEstimates[0]?.deliveryType || 'construction');
    const [otherDeliveryText, setOtherDeliveryText] = useState('');
    const [isEstimateExpanded, setIsEstimateExpanded] = useState(false);
    const [isItemsExpanded, setIsItemsExpanded] = useState(false);
    const [estimateAddress, setEstimateAddress] = useState('');
    const [sameAsCustomerAddress, setSameAsCustomerAddress] = useState(false);

    // --- Add Item Modal State ---
    const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
    const [modalInputMode, setModalInputMode] = useState<'FABRIC' | 'PRODUCT'>('PRODUCT');
    const [modalProductSearch, setModalProductSearch] = useState('');
    const [modalForm, setModalForm] = useState({
        productId: '', productName: '', colorName: '', width: '',
        prodWidth: '', prodHeight: '', prodArea: 0, prodAppliedArea: 0,
        prodCuttingUnit: '', sizeError: '',
        quantity: '1', unitPrice: 0, originalUnitPrice: 0, price: '0',
        unit: 'Roll', note: '',
        selectedSystemId: '', selectedSystemName: '',
        systemDrillPath: [] as { id: string; name: string }[],
        selectedOptions: [] as any[],
        measureCategory: '', measureUnitPrice: 0,
        measureImageId: '', measureImageName: '', measureImageUrl: '',
    });
    // 실사 패널 상태
    const [showMeasurePanel, setShowMeasurePanel] = useState(false);
    const [measureSearchText, setMeasureSearchText] = useState('');
    const [measurePositionOption, setMeasurePositionOption] = useState('여백실사');
    // 실사 이미지 위치/사이즈 (제품박스 기준 %)
    const [measureImgPos, setMeasureImgPos] = useState({ x: 10, y: 10 });
    const [measureImgSize, setMeasureImgSize] = useState({ w: 80, h: 80 });
    const [measureScale, setMeasureScale] = useState(100);
    const [measureFullOffset, setMeasureFullOffset] = useState({ x: 50, y: 50 });
    const [measureImgNaturalRatio, setMeasureImgNaturalRatio] = useState(1);
    // 여백로고
    const [logoPos, setLogoPos] = useState({ x: 35, y: 35 });
    const [logoSize, setLogoSize] = useState({ w: 30, h: 30 });
    const [logoScale, setLogoScale] = useState(30);
    // 고정로고
    const [fixedLogoPos, setFixedLogoPos] = useState({ x: 0, y: 0 });
    const [fixedLogoScale, setFixedLogoScale] = useState(10);
    const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
    const [isColorDropdownOpen, setIsColorDropdownOpen] = useState(false);
    const productDropdownRef = useRef<HTMLDivElement>(null);
    const colorDropdownRef = useRef<HTMLDivElement>(null);
    const measurePanelRef = useRef<HTMLDivElement>(null);
    const resetModalForm = () => {
        setModalProductSearch('');
        setIsProductDropdownOpen(false);
        setIsColorDropdownOpen(false);
        setShowMeasurePanel(false);
        setMeasureSearchText('');
        setMeasurePositionOption('여백실사');
        setModalForm({ productId: '', productName: '', colorName: '', width: '', prodWidth: '', prodHeight: '', prodArea: 0, prodAppliedArea: 0, prodCuttingUnit: '', sizeError: '', quantity: '1', unitPrice: 0, originalUnitPrice: 0, price: '0', unit: 'Roll', note: '', selectedSystemId: '', selectedSystemName: '', systemDrillPath: [] as { id: string; name: string }[], selectedOptions: [] as any[], measureCategory: '', measureUnitPrice: 0, measureImageId: '', measureImageName: '', measureImageUrl: '' });
    };

    // --- Product List from nodes (단가설정 상품리스트) ---
    const { nodes } = useProductContext();
    const { partners } = usePartnerContext();
    const salesProductList = useMemo(() => {
        const results: { id: string; label: string; path: string }[] = [];
        const rootId = 'root-partner-d1';
        const rootNode = nodes[rootId];
        if (!rootNode) return results;

        const traverse = (nodeId: string, pathStr: string) => {
            const node = nodes[nodeId];
            if (!node) return;
            const currentPath = pathStr ? `${pathStr} > ${node.label}` : node.label;
            const attributes = node.attributes || {};
            const nodeType = attributes.nodeType;

            let isProductRow = false;
            if (nodeType === 'product') {
                isProductRow = true;
            } else if (nodeType === 'color' || attributes.color || nodeType === 'option') {
                return;
            } else if (node.type === 'CATEGORY' || node.type === 'ROOT' || nodeType === 'category' || nodeType === 'species' || nodeType === 'item' || node.type === 'REFERENCE') {
                // container - traverse deeper
            } else {
                const children = node.childrenIds.map(id => nodes[id]).filter(Boolean);
                const hasColorChildren = children.some(c => c.attributes?.nodeType === 'color' || c.attributes?.color);
                if (hasColorChildren || children.length === 0) {
                    isProductRow = true;
                }
            }

            if (isProductRow) {
                results.push({ id: node.id, label: node.label, path: currentPath });
                return;
            }

            if (node.childrenIds.length > 0) {
                node.childrenIds.forEach(childId => traverse(childId, currentPath));
            }
            if (node.sourceIds && node.sourceIds.length > 0) {
                node.sourceIds.forEach(srcId => {
                    const src = nodes[srcId];
                    if (src && src.childrenIds) {
                        src.childrenIds.forEach(childId => traverse(childId, currentPath));
                    }
                });
            }
        };

        // Traverse real children
        rootNode.childrenIds.forEach(childId => traverse(childId, ''));
        // Traverse virtual children
        (rootNode.sourceIds || []).forEach(srcId => {
            const src = nodes[srcId];
            if (src) src.childrenIds.forEach(childId => traverse(childId, ''));
        });

        return results;
    }, [nodes]);

    const filteredSalesProducts = useMemo(() => {
        if (!modalProductSearch) return salesProductList;
        const q = modalProductSearch.toLowerCase();
        return salesProductList.filter(p => p.label.toLowerCase().includes(q) || p.path.toLowerCase().includes(q));
    }, [modalProductSearch, salesProductList]);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (productDropdownRef.current && !productDropdownRef.current.contains(e.target as Node)) {
                setIsProductDropdownOpen(false);
            }
            if (colorDropdownRef.current && !colorDropdownRef.current.contains(e.target as Node)) {
                setIsColorDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // --- Available Colors from selected product ---
    const availableColors = useMemo(() => {
        if (!modalForm.productId) return [];
        const productNode = nodes[modalForm.productId];
        if (!productNode) return [];

        const colors: { id: string; label: string; color?: string }[] = [];

        const collectColors = (childIds: string[]) => {
            childIds.forEach(childId => {
                const child = nodes[childId];
                if (!child) return;
                if (child.attributes?.nodeType === 'color' || child.attributes?.color) {
                    colors.push({ id: child.id, label: child.label, color: child.attributes?.color });
                }
            });
        };

        // Direct children
        collectColors(productNode.childrenIds);

        // Virtual children from sourceIds
        if (productNode.sourceIds) {
            productNode.sourceIds.forEach(srcId => {
                const src = nodes[srcId];
                if (src) collectColors(src.childrenIds);
            });
        }

        return colors;
    }, [modalForm.productId, nodes]);

    // --- productCuttingData: 제단 설정 (상품원가에서 설정한 정보 + 판매단가) ---
    const productCuttingData = useMemo(() => {
        if (modalInputMode !== 'PRODUCT' || !modalForm.productId) return null;
        const productNode = nodes[modalForm.productId];
        if (!productNode) return null;
        try {
            let dataNode = productNode;
            if (productNode.sourceIds && productNode.sourceIds.length > 0) {
                const srcNode = nodes[productNode.sourceIds[0]];
                if (srcNode) dataNode = srcNode;
            }
            const raw = dataNode.attributes?.cost_cutting_list;
            if (!raw) return null;
            const list = JSON.parse(raw);
            if (!Array.isArray(list) || list.length === 0) return null;
            const item = list[0];
            const stdPrice = parseFloat(String(item.standardPrice || '0').replace(/,/g, '')) || 0;
            const itemId = item.id || '';

            // 판매단가 조회 (sales_price_cutting)
            // SalesPriceManagement는 각 상품 노드(selectedNodeId)에 해당 상품의
            // cost_cutting_list item.id를 키로 가격을 저장함.
            // 하지만 노드 리셋 시 cost_cutting_list의 item.id가 재생성되어
            // sales_price_cutting에 저장된 OLD item.id와 불일치.
            // 해결: 같은 라벨(상품명) 노드에서 sales_price_cutting의 유효한 가격을 직접 추출.
            let salesPrice = stdPrice; // 기본값: 원가
            const partnerId = 'd1';
            const productLabel = productNode.label;

            const extractPrice = (entry: any): number | null => {
                if (!entry || typeof entry !== 'object') return null;
                const partner = partners.find(p => p.id === partnerId);
                if (entry[partnerId]?.price) {
                    const p = entry[partnerId].price;
                    return typeof p === 'string' ? parseFloat(p.replace(/,/g, '')) : Number(p || 0);
                }
                if (partner?.grade && entry[partner.grade]?.price) {
                    const p = entry[partner.grade].price;
                    return typeof p === 'string' ? parseFloat(p.replace(/,/g, '')) : Number(p || 0);
                }
                if (entry['ALL']?.price) {
                    const p = entry['ALL'].price;
                    return typeof p === 'string' ? parseFloat(p.replace(/,/g, '')) : Number(p || 0);
                }
                for (const k of Object.keys(entry)) {
                    if (entry[k]?.price) {
                        const p = entry[k].price;
                        return typeof p === 'string' ? parseFloat(p.replace(/,/g, '')) : Number(p || 0);
                    }
                }
                return null;
            };

            // 전략: 모든 노드를 순회하며 같은 라벨 + sales_price_cutting 비어있지 않은 노드 찾기
            const allNodesArr = Object.values(nodes) as any[];
            let found = false;
            for (const n of allNodesArr) {
                if (!n.attributes?.sales_price_cutting) continue;
                if (n.label !== productLabel) continue;
                try {
                    const spMap = JSON.parse(n.attributes.sales_price_cutting);
                    const spKeys = Object.keys(spMap);
                    if (spKeys.length === 0) continue; // 비어있는 노드 건너뜀
                    // 첫 번째 유효한 가격 엔트리 사용 (동일 상품 노드이므로 안전)
                    for (const key of spKeys) {
                        const price = extractPrice(spMap[key]);
                        if (price !== null && price > 0) {
                            salesPrice = price;
                            found = true;
                            break;
                        }
                    }
                    if (found) break;
                } catch (e) { }
            }

            // 라벨 매칭 실패 시 fallback: 모든 노드에서 해당 상품의 가격을 
            // 해당 노드 자체의 cost_cutting_list item.id로 매칭 (같은 노드 내에서는 일치)
            if (!found) {
                for (const n of allNodesArr) {
                    if (!n.attributes?.sales_price_cutting || !n.attributes?.cost_cutting_list) continue;
                    if (n.label !== productLabel) continue;
                    try {
                        const spMap = JSON.parse(n.attributes.sales_price_cutting);
                        const ccl = JSON.parse(n.attributes.cost_cutting_list);
                        if (!Array.isArray(ccl) || ccl.length === 0) continue;
                        const localItemId = ccl[0].id;
                        if (localItemId && spMap[localItemId]) {
                            const price = extractPrice(spMap[localItemId]);
                            if (price !== null && price > 0) {
                                salesPrice = price;
                                found = true;
                                break;
                            }
                        }
                    } catch (e) { }
                }
            }

            // 가맹대리점(AGENCY) 가격 계산:
            // 1단계: 공급사(f1) 마진 → 유통관리사(d1) 판매가 = 가맹대리점 원가(표준원가)
            const supplierPartner = partners.find(p => p.id === 'f1');
            const supplierGradeMargins = (supplierPartner as any)?.gradeMargins || [
                { grade: 'A', margin: '15' },
                { grade: 'B', margin: '20' },
                { grade: 'C', margin: '25' },
                { grade: 'D', margin: '30' },
            ];
            const distributorPartner = partners.find(p => p.id === partnerId); // d1
            const distributorGrade = distributorPartner?.grade || 'A';
            const supplierMarginStr = supplierGradeMargins.find((g: any) => g.grade === distributorGrade)?.margin || '15';
            const supplierMargin = parseFloat(supplierMarginStr) || 0;

            // 가맹대리점 원가 = 유통관리사의 판매가 (표준원가로 표시됨)
            let agencyCost = stdPrice;
            if (found && salesPrice > 0) {
                // 저장된 가격이 있으면 그것이 유통관리사의 판매가 = 가맹대리점 원가
                agencyCost = salesPrice;
            } else if (supplierMargin > 0 && supplierMargin < 100) {
                // 저장된 가격이 없으면 공급사 마진으로 계산
                agencyCost = Math.round((stdPrice / (1 - supplierMargin / 100)) / 100) * 100;
            }

            // 2단계: 유통관리사(d1) 마진 → 가맹대리점 최종 판매가
            // SalesPriceManagement에서 에이전시 기본 마진은 50% (isAgency ? '50')
            // distributorPartner.gradeMargins는 유통관리사 자체 등급 설정(5%,10%등)이므로 사용하지 않음
            {
                const agencyDefaultMargin = 50; // SalesPriceManagement의 isAgency 기본 마진과 동일
                const agencyMargin = agencyDefaultMargin;

                if (agencyMargin > 0 && agencyMargin < 100) {
                    salesPrice = Math.round((agencyCost / (1 - agencyMargin / 100)) / 100) * 100;
                } else {
                    salesPrice = agencyCost;
                }
            }

            return {
                basicArea: parseFloat(String(item.basicArea || '0').replace(/,/g, '')) || 0,
                minWidth: parseFloat(String(item.minWidth || '0').replace(/,/g, '')) || 0,
                maxWidth: parseFloat(String(item.maxWidth || '0').replace(/,/g, '')) || 0,
                minHeight: parseFloat(String(item.minHeight || '0').replace(/,/g, '')) || 0,
                maxHeight: parseFloat(String(item.maxHeight || '0').replace(/,/g, '')) || 0,
                standardPrice: agencyCost,
                salesPrice: salesPrice,
                unit: item.unit || 'SQM',
                standardWidth: parseFloat(String(item.standardWidth || '180').replace(/,/g, '')) || 180,
            };
        } catch (e) { return null; }
    }, [modalInputMode, modalForm.productId, nodes, partners]);

    // === 시스템/옵션 로직 (OrderReception 동일) ===

    // 전체 virtualChildMap 수집
    const systemVirtualMap = useMemo(() => {
        let merged: Record<string, string[]> = {};
        (Object.values(nodes) as any[]).forEach((n) => {
            if (n.attributes?.virtualChildMap) {
                try {
                    const map = JSON.parse(n.attributes.virtualChildMap);
                    merged = { ...merged, ...map };
                } catch (e) { }
            }
        });
        return merged;
    }, [nodes]);

    // 선택된 상품의 카테고리 조상으로 매칭되는 시스템 노드 목록
    const productSystemNodes = useMemo(() => {
        if (modalInputMode !== 'PRODUCT' || !modalForm.productId) return [];
        const productNode = nodes[modalForm.productId] as any;
        if (!productNode) return [];

        // 1. 조상 노드 수집 (productNode ~ ROOT 직전까지)
        const ancestors: any[] = [];
        let curr: any = productNode;
        while (curr) {
            ancestors.unshift(curr);
            curr = curr.parentId ? nodes[curr.parentId] : null;
            if (!curr || curr.type === 'ROOT') break;
        }

        // 2. linkedSystemCategory 찾기
        let linkedCategoryId: string | null = null;

        // Strategy A: 직접 ID / originalSourceId 매칭
        for (let i = ancestors.length - 1; i >= 0; i--) {
            const anc = ancestors[i];
            if (systemVirtualMap[anc.id]) { linkedCategoryId = anc.id; break; }
            if (anc.attributes?.originalSourceId && systemVirtualMap[anc.attributes.originalSourceId]) {
                linkedCategoryId = anc.attributes.originalSourceId; break;
            }
            if (anc.sourceIds && Array.isArray(anc.sourceIds)) {
                for (const srcId of anc.sourceIds) {
                    if (systemVirtualMap[srcId]) { linkedCategoryId = srcId; break; }
                    const srcNode = nodes[srcId] as any;
                    if (srcNode?.attributes?.originalSourceId && systemVirtualMap[srcNode.attributes.originalSourceId]) {
                        linkedCategoryId = srcNode.attributes.originalSourceId; break;
                    }
                }
                if (linkedCategoryId) break;
            }
        }

        // Strategy B: 라벨 기반 fallback
        if (!linkedCategoryId) {
            const vmapKeys = Object.keys(systemVirtualMap);
            for (let i = ancestors.length - 1; i >= 0; i--) {
                const ancLabel = ancestors[i].label?.trim();
                if (!ancLabel) continue;
                const ancLabelNorm = ancLabel.replace(/\s*\(.*?\)\s*/g, '').trim();
                for (const key of vmapKeys) {
                    const keyNode = nodes[key] as any;
                    if (!keyNode) continue;
                    const keyLabel = keyNode.label?.trim() || '';
                    const keyLabelNorm = keyLabel.replace(/\s*\(.*?\)\s*/g, '').trim();
                    if (ancLabel === keyLabel || ancLabelNorm === keyLabelNorm ||
                        ancLabelNorm.startsWith(keyLabelNorm) || keyLabelNorm.startsWith(ancLabelNorm)) {
                        linkedCategoryId = key; break;
                    }
                }
                if (linkedCategoryId) break;
            }
        }

        if (!linkedCategoryId) return [];
        const mappedIds = systemVirtualMap[linkedCategoryId] || [];
        const candidates = (Array.isArray(mappedIds) ? mappedIds : [mappedIds]).filter(id => !!nodes[id]);
        return candidates.map(id => {
            const node = nodes[id] as any;
            return { id, label: node?.label || id };
        });
    }, [modalInputMode, modalForm.productId, nodes, systemVirtualMap]);

    // 노드의 자식 수집 (소스 참조 포함)
    const getChildNodes = useMemo(() => {
        return (nid: string): any[] => {
            const n = nodes[nid] as any;
            if (!n) return [];
            let childIds = Array.isArray(n.childrenIds) ? [...n.childrenIds] : [];
            if (childIds.length === 0 && n.attributes?.originalSourceId) {
                const src = nodes[n.attributes.originalSourceId] as any;
                if (src && Array.isArray(src.childrenIds)) childIds = [...src.childrenIds];
            }
            if (n.sourceIds && Array.isArray(n.sourceIds)) {
                for (const srcId of n.sourceIds) {
                    const src = nodes[srcId] as any;
                    if (src && Array.isArray(src.childrenIds)) childIds.push(...src.childrenIds);
                }
            }
            return [...new Set(childIds)].map(id => nodes[id]).filter(Boolean) as any[];
        };
    }, [nodes]);

    // 노드에서 리프까지 최대 깊이
    const depthToLeaf = useMemo(() => {
        const cache: Record<string, number> = {};
        const calc = (nid: string, visited: Set<string> = new Set(), depth: number = 0): number => {
            try {
                if (depth > 8) return 0;
                if (cache[nid] !== undefined) return cache[nid];
                if (visited.has(nid)) return 0;
                visited.add(nid);
                const n = nodes[nid] as any;
                if (!n) { cache[nid] = 0; return 0; }
                const childIds = Array.isArray(n.childrenIds) ? n.childrenIds : [];
                const validChildren = childIds.map((id: string) => nodes[id]).filter(Boolean);
                if (validChildren.length === 0) { cache[nid] = 0; return 0; }
                const d = 1 + Math.max(...validChildren.map((c: any) => calc(c.id, new Set(visited), depth + 1)));
                cache[nid] = d;
                return d;
            } catch { return 0; }
        };
        return calc;
    }, [nodes]);

    // 시스템 선택 핸들러
    const handleSelectSystem = (systemId: string, systemName: string) => {
        const sysDepth = depthToLeaf(systemId);
        let initialDrillPath: { id: string; name: string }[] = [];
        if (sysDepth > 2) {
            const children = getChildNodes(systemId);
            if (children.length > 0) {
                initialDrillPath = [{ id: children[0].id, name: (children[0] as any).label || '' }];
            }
        }
        setModalForm(prev => ({
            ...prev,
            selectedSystemId: systemId,
            selectedSystemName: systemName,
            systemDrillPath: initialDrillPath,
            selectedOptions: [],
        }));
    };

    // 드릴다운 선택 핸들러
    const handleDrillDown = (level: number, nodeId: string, nodeName: string) => {
        setModalForm(prev => {
            const newPath = (prev.systemDrillPath || []).slice(0, level);
            newPath.push({ id: nodeId, name: nodeName });
            return { ...prev, systemDrillPath: newPath, selectedOptions: [] };
        });
    };

    // 제품 선택 시 첫 번째 시스템 자동 선택
    useEffect(() => {
        if (modalInputMode === 'PRODUCT' && modalForm.productId && productSystemNodes.length > 0 && !modalForm.selectedSystemId) {
            const firstSys = productSystemNodes[0];
            handleSelectSystem(firstSys.id, firstSys.label || '');
        }
    }, [productSystemNodes, modalForm.productId]);

    // 드릴다운 위치 결정
    const drillPath = modalForm.systemDrillPath || [];
    const currentDrillNodeId = drillPath.length > 0
        ? drillPath[drillPath.length - 1].id
        : modalForm.selectedSystemId;
    const currentDrillDepth = currentDrillNodeId ? depthToLeaf(currentDrillNodeId) : 0;

    // 각 드릴 레벨의 스위치 목록
    const drillSwitchLevels = useMemo(() => {
        if (!modalForm.selectedSystemId) return [];
        const dp = modalForm.systemDrillPath || [];
        const levels: { nodes: { id: string; label: string }[]; selectedId: string }[] = [];
        let curId = modalForm.selectedSystemId;
        for (let i = 0; i <= dp.length; i++) {
            const d = depthToLeaf(curId);
            if (d <= 2) break;
            const children = getChildNodes(curId);
            const selectedId = i < dp.length ? dp[i].id : '';
            levels.push({
                nodes: children.map((c: any) => ({ id: c.id, label: c.label || '' })),
                selectedId,
            });
            if (!selectedId) break;
            curId = selectedId;
        }
        return levels;
    }, [modalForm.selectedSystemId, modalForm.systemDrillPath, depthToLeaf, getChildNodes]);

    // 옵션 소스 ID
    const optionSourceId = currentDrillDepth <= 2 && currentDrillNodeId ? currentDrillNodeId : '';

    // 선택된 시스템의 하위 옵션 + 원가/판매단가 (OrderReception 동일)
    const systemOptions = useMemo(() => {
        if (!optionSourceId) return [];
        const systemNode = nodes[optionSourceId];
        if (!systemNode) return [];

        // assembly cost 수집
        let assemblyCostMap: Record<string, { price: string; unit: string }> = {};
        const getAssemblyCost = (nid: string) => {
            const n = nodes[nid] as any;
            if (!n) return;
            if (n.attributes?.cost_assembly_list) {
                try { Object.assign(assemblyCostMap, JSON.parse(n.attributes.cost_assembly_list)); } catch (e) { }
            }
            if (n.attributes?.originalSourceId) {
                const src = nodes[n.attributes.originalSourceId] as any;
                if (src?.attributes?.cost_assembly_list) {
                    try { Object.assign(assemblyCostMap, JSON.parse(src.attributes.cost_assembly_list)); } catch (e) { }
                }
            }
            if (n.sourceIds && Array.isArray(n.sourceIds)) {
                for (const srcId of n.sourceIds) {
                    const srcN = nodes[srcId] as any;
                    if (srcN?.attributes?.cost_assembly_list) {
                        try { Object.assign(assemblyCostMap, JSON.parse(srcN.attributes.cost_assembly_list)); } catch (e) { }
                    }
                }
            }
        };
        let costCurr: any = systemNode;
        let costLimit = 10;
        while (costCurr && costLimit > 0) {
            costLimit--;
            getAssemblyCost(costCurr.id);
            costCurr = costCurr.parentId ? nodes[costCurr.parentId] : null;
            if (!costCurr || costCurr.type === 'ROOT') break;
        }
        if ((systemNode as any).sourceIds) {
            for (const srcId of (systemNode as any).sourceIds) {
                let srcCurr: any = nodes[srcId];
                let srcLimit = 10;
                while (srcCurr && srcLimit > 0) {
                    srcLimit--;
                    getAssemblyCost(srcCurr.id);
                    srcCurr = srcCurr.parentId ? nodes[srcCurr.parentId] : null;
                    if (!srcCurr || srcCurr.type === 'ROOT') break;
                }
            }
        }
        if (Object.keys(assemblyCostMap).length === 0) {
            const allNodes = Object.values(nodes) as any[];
            for (const n of allNodes) {
                if (n.attributes?.cost_assembly_list) {
                    try { Object.assign(assemblyCostMap, JSON.parse(n.attributes.cost_assembly_list)); } catch (e) { }
                }
            }
        }

        // 판매단가 조회 (SalesPriceManagement 조립비 탭에서 sales_price_assembly로 저장)
        let salesPriceMap: Record<string, any> = {};
        const allNodesArr = Object.values(nodes) as any[];
        for (const n of allNodesArr) {
            if (n.attributes?.sales_price_assembly) {
                try { Object.assign(salesPriceMap, JSON.parse(n.attributes.sales_price_assembly)); } catch (e) { }
            }
        }

        const partnerId = 'd1'; // 가맹대리점은 유통관리사 기준
        const calcSalesPrice = (lookupId: string, childId: string, stdPrice: number): number => {
            let sPrice = stdPrice;
            let itemSalesData = salesPriceMap[lookupId] || salesPriceMap[childId];
            const childNode = nodes[childId] as any;
            console.log(`[EST-PRICE] lookup: ${lookupId}(${(nodes[lookupId] as any)?.label || 'NO'}) child: ${childId}(${childNode?.label || 'NO'}) std:${stdPrice} directMatch:${!!salesPriceMap[lookupId]} childMatch:${!!salesPriceMap[childId]}`);
            if (!itemSalesData) {
                if (childNode?.label) {
                    const labelNorm = childNode.label.trim().replace(/\s*\(.*?\)\s*/g, '');
                    for (const [key, val] of Object.entries(salesPriceMap)) {
                        const keyNode = nodes[key] as any;
                        if (keyNode && keyNode.label) {
                            const keyLabel = keyNode.label.trim().replace(/\s*\(.*?\)\s*/g, '');
                            if (keyLabel === labelNorm) {
                                console.log('[EST-PRICE] Label match found:', { key, keyLabel, labelNorm });
                                itemSalesData = val; break;
                            }
                        }
                    }
                }
            }
            if (itemSalesData) {
                console.log('[EST-PRICE] itemSalesData found:', itemSalesData, 'checking partnerId:', partnerId);
                const partner = partners.find(p => p.id === partnerId);
                if (itemSalesData[partnerId]) {
                    const pr = itemSalesData[partnerId].price;
                    sPrice = typeof pr === 'string' ? parseFloat(pr.replace(/,/g, '')) : Number(pr || 0);
                    console.log('[EST-PRICE] Partner match:', partnerId, '→ price:', sPrice);
                } else if (partner?.grade && itemSalesData[partner.grade]) {
                    const pr = itemSalesData[partner.grade].price;
                    sPrice = typeof pr === 'string' ? parseFloat(pr.replace(/,/g, '')) : Number(pr || 0);
                    console.log('[EST-PRICE] Grade match:', partner.grade, '→ price:', sPrice);
                } else if (itemSalesData['ALL']) {
                    const pr = itemSalesData['ALL'].price;
                    sPrice = typeof pr === 'string' ? parseFloat(pr.replace(/,/g, '')) : Number(pr || 0);
                    console.log('[EST-PRICE] ALL match → price:', sPrice);
                } else {
                    console.log('[EST-PRICE] No partner/grade/ALL match found. Available keys:', Object.keys(itemSalesData));
                }
            } else {
                console.log('[EST-PRICE] No salesData found for this item');
            }
            return sPrice;
        };

        const getChildren = (nid: string): any[] => {
            const n = nodes[nid] as any;
            if (!n) return [];
            let childIds = Array.isArray(n.childrenIds) ? [...n.childrenIds] : [];
            // 항상 원본 소스의 children도 합침 (파트너 복사 후 원본에 옵션 추가 시 반영)
            if (n.attributes?.originalSourceId) {
                const src = nodes[n.attributes.originalSourceId] as any;
                if (src && Array.isArray(src.childrenIds)) childIds.push(...src.childrenIds);
            }
            if (n.sourceIds && Array.isArray(n.sourceIds)) {
                for (const srcId of n.sourceIds) {
                    const src = nodes[srcId] as any;
                    if (src && Array.isArray(src.childrenIds)) childIds.push(...src.childrenIds);
                }
            }
            const uniqueIds = [...new Set(childIds)];
            if (nid === optionSourceId) {
                console.log(`[EST-DEBUG] getChildren(${nid}): own=${(n.childrenIds || []).length}, origSrc=${n.attributes?.originalSourceId || 'none'}, srcIds=${(n.sourceIds || []).join(',')}, merged=${uniqueIds.length}, labels=${uniqueIds.map((id: string) => (nodes[id] as any)?.label || '?').join(',')}`);
            }
            return uniqueIds.map(id => nodes[id]).filter(Boolean) as any[];
        };

        const findCostByLabel = (label: string): { price: string; unit: string } | null => {
            if (!label) return null;
            const labelNorm = label.trim().replace(/\s*\(.*?\)\s*/g, '');
            for (const [nid, data] of Object.entries(assemblyCostMap)) {
                const n = nodes[nid] as any;
                if (n && n.label) {
                    const nLabel = n.label.trim().replace(/\s*\(.*?\)\s*/g, '');
                    if (nLabel === labelNorm) return data;
                }
            }
            return null;
        };

        const getOriginalLabel = (n: any): string => {
            if (n?.attributes?.originalSourceId) {
                const src = nodes[n.attributes.originalSourceId] as any;
                if (src?.label) return src.label;
            }
            if (n?.sourceIds && Array.isArray(n.sourceIds)) {
                for (const srcId of n.sourceIds) {
                    const src = nodes[srcId] as any;
                    if (src?.label) return src.label;
                }
            }
            return n?.label || '';
        };

        type OptionItem = { id: string; name: string; standardPrice: number; salesPrice: number; unit: string; type: 'single' | 'group'; checked: boolean; quantity: number; children?: { id: string; name: string; unitPrice: number; originalUnitPrice: number; unit: string }[]; selectedChildId?: string };
        const options: OptionItem[] = [];
        const directChildren = getChildren(optionSourceId);

        // 파트너 복사 트리에서 누락된 옵션을 같은 라벨의 원본 트리에서 보충
        const currentChildLabels = new Set(directChildren.map((c: any) => getOriginalLabel(c)));
        const systemLabel = getOriginalLabel(nodes[optionSourceId] as any);
        if (systemLabel) {
            for (const [nid, nd] of Object.entries(nodes)) {
                const n = nd as any;
                if (nid !== optionSourceId && n.label === systemLabel) {
                    const altChildren = getChildren(nid);
                    for (const ac of altChildren) {
                        const acLabel = getOriginalLabel(ac);
                        if (acLabel && !currentChildLabels.has(acLabel)) {
                            directChildren.push(ac);
                            currentChildLabels.add(acLabel);
                        }
                    }
                }
            }
        }

        console.log('[EST-DEBUG] directChildren (merged):', directChildren.map((c: any) => `${c.id}(${c.label})`).join(', '));

        for (const child of directChildren) {
            const lookupId = (child as any).attributes?.originalSourceId || child.id;
            const costData = assemblyCostMap[lookupId] || assemblyCostMap[child.id] || findCostByLabel(child.label);
            const stdPrice = costData ? (parseFloat(String(costData.price).replace(/,/g, '')) || 0) : 0;
            const sPrice = calcSalesPrice(lookupId, child.id, stdPrice);
            const childChildren = getChildren(child.id);

            if (childChildren.length > 0) {
                const groupLabel = getOriginalLabel(child);
                // 하단바, 해드커버 등 가로길이 기반 그룹은 m단위 강제
                const isWidthBasedGroup = /하단바|해드커버|헤드커버/.test(groupLabel);
                const groupChildren: OptionItem['children'] = [];
                for (const gc of childChildren) {
                    const gcLookupId = (gc as any).attributes?.originalSourceId || gc.id;
                    const gcCostData = assemblyCostMap[gcLookupId] || assemblyCostMap[gc.id] || findCostByLabel(gc.label);
                    const gcStdPrice = gcCostData ? (parseFloat(String(gcCostData.price).replace(/,/g, '')) || 0) : 0;
                    const gcSPrice = calcSalesPrice(gcLookupId, gc.id, gcStdPrice);
                    groupChildren.push({
                        id: gc.id,
                        name: getOriginalLabel(gc),
                        unitPrice: gcSPrice || gcStdPrice,
                        originalUnitPrice: gcSPrice || gcStdPrice,
                        unit: isWidthBasedGroup ? 'm' : (gcCostData?.unit || ''),
                    });
                }
                options.push({
                    id: child.id, name: getOriginalLabel(child),
                    standardPrice: stdPrice, salesPrice: sPrice || stdPrice,
                    unit: isWidthBasedGroup ? 'm' : (costData?.unit || ''), type: 'group',
                    checked: false, quantity: 1, children: groupChildren,
                });
            } else {
                const finalPrice = sPrice || stdPrice;
                options.push({
                    id: child.id, name: getOriginalLabel(child),
                    standardPrice: stdPrice, salesPrice: finalPrice,
                    unit: costData?.unit || 'm', type: 'single',
                    checked: false, quantity: 1,
                });
            }
        }
        return options;
    }, [optionSourceId, nodes, partners]);

    // === 실사 관련 로직 ===

    // 실사가능 여부 (isReal 속성 또는 cost_measure_list 존재)
    const isMeasureAllowed = useMemo(() => {
        if (!modalForm.productId) return false;
        const prodNode = nodes[modalForm.productId] as any;
        if (!prodNode) return false;
        // isReal 속성 확인
        if (prodNode.attributes?.isReal === 'true') return true;
        if (prodNode.sourceIds && Array.isArray(prodNode.sourceIds)) {
            for (const srcId of prodNode.sourceIds) {
                const src = nodes[srcId] as any;
                if (src?.attributes?.isReal === 'true') return true;
            }
        }
        if (prodNode.attributes?.originalSourceId) {
            const src = nodes[prodNode.attributes.originalSourceId] as any;
            if (src?.attributes?.isReal === 'true') return true;
        }
        // cost_measure_list 존재 여부 (fallback)
        let dataNode = prodNode;
        if (prodNode.sourceIds && prodNode.sourceIds.length > 0) {
            const srcNode = nodes[prodNode.sourceIds[0]];
            if (srcNode) dataNode = srcNode;
        }
        try {
            const raw = dataNode.attributes?.cost_measure_list;
            if (raw) { const list = JSON.parse(raw); return Array.isArray(list) && list.length > 0; }
        } catch { }
        return false;
    }, [modalForm.productId, nodes]);

    // 실사비 데이터 조회
    const measureCostData = useMemo(() => {
        if (!modalForm.productId || !isMeasureAllowed) return [];
        const prodNode = nodes[modalForm.productId] as any;
        if (!prodNode) return [];

        let measureRaw = '';
        const tryGet = (n: any) => {
            if (n?.attributes?.cost_measure_list) return n.attributes.cost_measure_list;
            return '';
        };
        measureRaw = tryGet(prodNode);
        if (!measureRaw && prodNode.sourceIds && Array.isArray(prodNode.sourceIds)) {
            for (const srcId of prodNode.sourceIds) {
                measureRaw = tryGet(nodes[srcId]);
                if (measureRaw) break;
            }
        }
        if (!measureRaw && prodNode.attributes?.originalSourceId) {
            measureRaw = tryGet(nodes[prodNode.attributes.originalSourceId]);
        }
        if (!measureRaw) {
            let cur = prodNode;
            let limit = 5;
            while (cur?.parentId && limit > 0 && !measureRaw) {
                limit--;
                cur = nodes[cur.parentId] as any;
                measureRaw = tryGet(cur);
            }
        }
        if (!measureRaw) return [];
        try {
            const list = JSON.parse(measureRaw);
            if (!Array.isArray(list)) return [];

            let salesPriceMap: Record<string, any> = {};
            const allNodes = Object.values(nodes) as any[];
            for (const n of allNodes) {
                if (n.attributes?.sales_price_measure) {
                    try { Object.assign(salesPriceMap, JSON.parse(n.attributes.sales_price_measure)); } catch (e) { }
                }
            }
            const partnerId = 'd1';
            return list.map((item: any) => {
                const stdPrice = parseFloat(String(item.standardPrice || '0').replace(/,/g, '')) || 0;
                let salesPrice = stdPrice;
                const spData = salesPriceMap[item.id];
                if (spData) {
                    const pPrice = spData[partnerId]?.price || spData['ALL']?.price;
                    if (pPrice) salesPrice = parseFloat(String(pPrice).replace(/,/g, '')) || stdPrice;
                }
                return { id: item.id, category: item.category || 'MARGIN_MEASURE', unit: item.unit || 'SQM', standardPrice: stdPrice, salesPrice };
            });
        } catch (e) { return []; }
    }, [modalForm.productId, isMeasureAllowed, nodes]);

    // 실사비 계산 헬퍼
    const calcMeasurePrice = (category: string, appliedArea: number, cuttingUnitPrice: number, qty: number): number => {
        if (!category || measureCostData.length === 0) return 0;
        const costItem = measureCostData.find((c: any) => c.category === category);
        if (!costItem) return 0;
        const price = costItem.salesPrice;
        if (costItem.unit === 'SQM') return Math.round(price * appliedArea * qty);
        if (costItem.unit === 'CUTTING_LINK') return Math.round(cuttingUnitPrice * (price / 100) * qty);
        if (costItem.unit === 'PER_PIECE') return Math.round(price * qty);
        return 0;
    };

    // 카테고리 라벨
    const MEASURE_CATEGORY_LABELS: Record<string, string> = {
        'MARGIN_MEASURE': '여백실사', 'FULL_MEASURE': '꽉찬실사',
        'MARGIN_LOGO': '여백로고', 'FIXED_LOGO': '고정로고',
    };

    // 실사 카테고리 변경 핸들러
    const handleMeasureCategoryChange = (category: string) => {
        setModalForm(prev => {
            const costItem = measureCostData.find((c: any) => c.category === category);
            const measurePrice = costItem ? costItem.salesPrice : 0;
            const measureTotal = calcMeasurePrice(category, prev.prodAppliedArea, prev.unitPrice, parseFloat(prev.quantity) || 1);
            const cuttingTotal = prev.unitPrice * (parseFloat(prev.quantity) || 1);
            const optionTotal = calcOptionTotal(prev.selectedOptions || []);
            const rawTotal = cuttingTotal + measureTotal + optionTotal;
            const roundedTotal = Math.round(rawTotal / 10) * 10;
            return {
                ...prev,
                measureCategory: category,
                measureUnitPrice: measurePrice,
                price: String(roundedTotal),
            };
        });
    };

    // 옵션비 합산 헬퍼 (m 단위는 10의 자리 반올림)
    const calcOptionTotal = (opts: any[]): number => {
        return opts.filter(o => o.checked).reduce((sum: number, o: any) => {
            let qty = parseFloat(String(o.quantity)) || 0;
            if (o.unit === 'm') qty = qty / 100;
            if (o.type === 'group') {
                const selectedChild = o.children?.find((c: any) => c.id === o.selectedChildId);
                const childUnit = selectedChild?.unit || '';
                let groupQty = parseFloat(String(o.quantity)) || 0;
                if (childUnit === 'm') groupQty = groupQty / 100;
                const raw = selectedChild ? selectedChild.unitPrice * groupQty : 0;
                return sum + (childUnit === 'm' ? Math.round(raw / 100) * 100 : raw);
            }
            const raw = o.unitPrice * qty;
            return sum + (o.unit === 'm' ? Math.round(raw / 100) * 100 : raw);
        }, 0);
    };

    // 옵션 체크/해제 핸들러
    const handleToggleOption = (optionId: string) => {
        setModalForm(prev => {
            const newOptions = (prev.selectedOptions || []).map((o: any) =>
                o.id === optionId ? { ...o, checked: !o.checked } : o
            );
            const optionTotal = calcOptionTotal(newOptions);
            const cuttingTotal = prev.unitPrice * (parseFloat(prev.quantity) || 1);
            const measureTotal = calcMeasurePrice(prev.measureCategory, prev.prodAppliedArea, prev.unitPrice, parseFloat(prev.quantity) || 1);
            const rawTotal = cuttingTotal + measureTotal + optionTotal;
            const roundedTotal = Math.round(rawTotal / 10) * 10;
            return { ...prev, selectedOptions: newOptions, price: String(roundedTotal) };
        });
    };

    // group 옵션에서 자식 선택 변경 핸들러
    const handleSelectOptionChild = (optionId: string, childId: string) => {
        setModalForm(prev => {
            const newOptions = (prev.selectedOptions || []).map((o: any) =>
                o.id === optionId ? { ...o, selectedChildId: childId, checked: true } : o
            );
            const optionTotal = calcOptionTotal(newOptions);
            const cuttingTotal = prev.unitPrice * (parseFloat(prev.quantity) || 1);
            const measureTotal = calcMeasurePrice(prev.measureCategory, prev.prodAppliedArea, prev.unitPrice, parseFloat(prev.quantity) || 1);
            const rawTotal = cuttingTotal + measureTotal + optionTotal;
            const roundedTotal = Math.round(rawTotal / 10) * 10;
            return { ...prev, selectedOptions: newOptions, price: String(roundedTotal) };
        });
    };

    // 옵션 수량/단가 변경 핸들러
    const handleOptionChange = (optionId: string, field: 'quantity' | 'unitPrice', value: string) => {
        setModalForm(prev => {
            const newOptions = (prev.selectedOptions || []).map((o: any) => {
                if (o.id !== optionId) return o;
                if (field === 'quantity') return { ...o, quantity: value };
                const numVal = parseFloat(value.replace(/,/g, '')) || 0;
                return { ...o, [field]: numVal };
            });
            const optionTotal = calcOptionTotal(newOptions);
            const cuttingTotal = prev.unitPrice * (parseFloat(prev.quantity) || 1);
            const measureTotal = calcMeasurePrice(prev.measureCategory, prev.prodAppliedArea, prev.unitPrice, parseFloat(prev.quantity) || 1);
            const rawTotal = cuttingTotal + measureTotal + optionTotal;
            const roundedTotal = Math.round(rawTotal / 10) * 10;
            return { ...prev, selectedOptions: newOptions, price: String(roundedTotal) };
        });
    };

    // systemOptions 변경 시 selectedOptions 자동 초기화
    // group(하단바) m단위 → 가로길이, single(줄길이) m단위 → 세로길이
    useEffect(() => {
        if (systemOptions.length > 0) {
            setModalForm(prev => {
                const initialOptions = systemOptions.map((opt: any) => {
                    const childUnit = opt.children?.[0]?.unit || '';
                    const isGroupM = opt.type === 'group' && childUnit === 'm';
                    const isSingleM = opt.type === 'single' && opt.unit === 'm';
                    let autoQty = '1';
                    if (isGroupM && prev.prodWidth) autoQty = prev.prodWidth;
                    else if (isSingleM && prev.prodHeight) autoQty = prev.prodHeight;
                    return {
                        ...opt,
                        checked: opt.type === 'group',
                        quantity: autoQty,
                        selectedChildId: opt.type === 'group' && opt.children?.length > 0 ? opt.children[0].id : undefined,
                        unitPrice: opt.type === 'single' ? opt.salesPrice : 0,
                    };
                });
                return { ...prev, selectedOptions: initialOptions };
            });
        }
    }, [systemOptions]);

    // prodWidth 변경 시 group m단위 옵션(하단바) 수량 자동 갱신
    useEffect(() => {
        const w = modalForm.prodWidth;
        if (!w) return;
        setModalForm(prev => {
            if (!prev.selectedOptions || prev.selectedOptions.length === 0) return prev;
            const updated = prev.selectedOptions.map((opt: any) => {
                const childUnit = opt.children?.[0]?.unit || '';
                if (opt.type === 'group' && childUnit === 'm') return { ...opt, quantity: w };
                return opt;
            });
            return { ...prev, selectedOptions: updated };
        });
    }, [modalForm.prodWidth]);

    // prodHeight 변경 시 single m단위 옵션(줄길이) 수량 자동 갱신
    useEffect(() => {
        const h = modalForm.prodHeight;
        if (!h) return;
        setModalForm(prev => {
            if (!prev.selectedOptions || prev.selectedOptions.length === 0) return prev;
            const updated = prev.selectedOptions.map((opt: any) => {
                if (opt.type === 'single' && opt.unit === 'm') return { ...opt, quantity: h };
                return opt;
            });
            return { ...prev, selectedOptions: updated };
        });
    }, [modalForm.prodHeight]);

    // --- 제품 모드: 가로/세로 변경 핸들러 ---
    const handleEstProdSizeChange = (field: 'prodWidth' | 'prodHeight', value: string) => {
        setModalForm(prev => {
            const next = { ...prev, [field]: value };
            const w = parseFloat(next.prodWidth) || 0;
            const h = parseFloat(next.prodHeight) || 0;
            const area = (w * h) / 10000; // cm² → ㎡
            let appliedArea = area;
            let sizeError = '';
            if (productCuttingData) {
                if (w > 0 && productCuttingData.maxWidth > 0 && w > productCuttingData.maxWidth) {
                    sizeError = `가로 최대(${productCuttingData.maxWidth}cm) 초과`;
                } else if (h > 0 && productCuttingData.maxHeight > 0 && h > productCuttingData.maxHeight) {
                    sizeError = `세로 최대(${productCuttingData.maxHeight}cm) 초과`;
                }
                let appliedW = w, appliedH = h;
                if (appliedW > 0 && appliedW < productCuttingData.minWidth) appliedW = productCuttingData.minWidth;
                if (appliedH > 0 && appliedH < productCuttingData.minHeight) appliedH = productCuttingData.minHeight;
                appliedArea = (appliedW * appliedH) / 10000;
                if (productCuttingData.basicArea > 0 && appliedArea > 0 && appliedArea < productCuttingData.basicArea) {
                    appliedArea = productCuttingData.basicArea;
                }
            }
            let unitPrice = prev.unitPrice;
            let price = prev.price;
            if (productCuttingData && appliedArea > 0 && !sizeError) {
                unitPrice = productCuttingData.salesPrice;
                const qty = parseFloat(next.quantity) || 1;
                let cuttingTotal: number;
                if (productCuttingData.unit === 'SQM') {
                    cuttingTotal = Math.round(unitPrice * appliedArea * qty);
                } else {
                    cuttingTotal = Math.round(unitPrice * qty);
                }
                const measureTotal = calcMeasurePrice(prev.measureCategory, appliedArea, unitPrice, qty);
                const optionTotal = calcOptionTotal(prev.selectedOptions || []);
                const rawTotal = cuttingTotal + measureTotal + optionTotal;
                price = String(Math.round(rawTotal / 10) * 10);
            }
            return { ...next, prodArea: area, prodAppliedArea: appliedArea, sizeError, unitPrice, originalUnitPrice: productCuttingData?.salesPrice || 0, price };
        });
    };

    // 제품 선택 후 productCuttingData가 로드되면 기본 사이즈로 자동 계산
    useEffect(() => {
        if (modalInputMode === 'PRODUCT' && productCuttingData && modalForm.prodWidth && modalForm.prodHeight && modalForm.unitPrice === 0) {
            handleEstProdSizeChange('prodWidth', modalForm.prodWidth);
        }
    }, [productCuttingData]);

    // Filtered estimates
    const filteredEstimates = useMemo(() => {
        if (!searchQuery.trim()) return estimates;
        const q = searchQuery.toLowerCase();
        return estimates.filter(e =>
            e.customer.name.toLowerCase().includes(q) ||
            e.customer.phone.includes(q)
        );
    }, [searchQuery, estimates]);

    const selectedEstimate = useMemo(() => {
        return estimates.find(e => e.id === selectedEstimateId) || null;
    }, [selectedEstimateId, estimates]);

    const handleSelectEstimate = (est: Estimate) => {
        setSelectedEstimateId(est.id);
        setEditingCustomer(est.customer);
        setEditingDeliveryType(est.deliveryType);
    };

    const deliveryTypeLabels: Record<string, string> = {
        construction: '시공',
        delivery: '배달',
        direct: '직출',
        other: '기타'
    };

    const mainContent = (
        <div className="flex flex-col h-full w-full bg-gray-50 overflow-hidden font-sans">

            {/* HEADER */}
            <div className="flex-shrink-0 bg-white border-b border-gray-200 px-8 py-4 shadow-sm z-20 flex items-center justify-between gap-4 h-20">
                <div className="flex items-center gap-3 min-w-fit">
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <FileText className="text-blue-600" /> 견적서관리
                    </h1>
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100 shadow-sm">
                        총 {filteredEstimates.length}건
                    </span>
                </div>

                {/* Search */}
                <div className="flex-1 max-w-lg mx-auto">
                    <div className="relative w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="고객명, 전화번호로 검색..."
                            className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-gray-100 border border-gray-200 text-sm font-medium
                                       focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 focus:bg-white transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* New Estimate Button */}
                <button onClick={() => {
                    setNewCustSearch('');
                    setNewCustForm({ name: '', phone: '', email: '', birthday: '', birthdayType: 'solar', address: '', memo: '' });
                    setNewCustSearchResults([]);
                    setNewCustSelectedExisting(null);
                    setNewCustMode('search');
                    setIsNewEstimatePopupOpen(true);
                }} className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-sm">
                    <Plus size={16} /> 신규 견적
                </button>
            </div>

            {/* BODY */}
            <div className="flex-1 flex min-h-0 overflow-hidden">

                {/* LEFT: Estimate Grid */}
                <div className="w-[420px] bg-white border-r border-gray-200 flex flex-col flex-shrink-0 overflow-hidden">
                    {/* Grid Header */}
                    <div className="flex items-center bg-gray-50 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider px-4 py-3 flex-shrink-0">
                        <div className="w-20">고객명</div>
                        <div className="w-28">전화번호</div>
                        <div className="w-24">견적일</div>
                        <div className="flex-1 text-right">견적가</div>
                    </div>

                    {/* Grid Body */}
                    <div className="flex-1 overflow-y-auto">
                        {filteredEstimates.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                                <FileSpreadsheet size={40} strokeWidth={1.5} />
                                <p className="text-sm font-medium mt-3">검색 결과가 없습니다</p>
                            </div>
                        ) : (
                            filteredEstimates.map((est) => (
                                <motion.div
                                    key={est.id}
                                    onClick={() => handleSelectEstimate(est)}
                                    className={`flex items-center px-4 py-3.5 border-b border-gray-100 cursor-pointer transition-all
                                        ${selectedEstimateId === est.id
                                            ? 'bg-blue-50 border-l-[3px] border-l-blue-500'
                                            : 'hover:bg-gray-50 border-l-[3px] border-l-transparent'
                                        }`}
                                    whileHover={{ x: 2 }}
                                    transition={{ duration: 0.15 }}
                                >
                                    <div className="w-20">
                                        <span className={`text-sm font-bold ${selectedEstimateId === est.id ? 'text-blue-700' : 'text-gray-800'}`}>
                                            {est.customer.name}
                                        </span>
                                    </div>
                                    <div className="w-28">
                                        <span className="text-xs text-gray-500 font-mono">{est.customer.phone}</span>
                                    </div>
                                    <div className="w-24">
                                        <span className="text-xs text-gray-500">{est.estimateDate}</span>
                                    </div>
                                    <div className="flex-1 text-right">
                                        <span className={`text-sm font-bold font-mono ${selectedEstimateId === est.id ? 'text-blue-600' : 'text-gray-700'}`}>
                                            {est.totalAmount.toLocaleString()}
                                        </span>
                                    </div>
                                    <ChevronRight size={14} className="text-gray-300 ml-2 flex-shrink-0" />
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>

                {/* RIGHT: Estimate Detail / Creation */}
                <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
                    {!selectedEstimate ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
                            <FileText size={48} strokeWidth={1.5} />
                            <p className="text-sm font-medium">좌측 목록에서 견적서를 선택하세요</p>
                        </div>
                    ) : (
                        <>
                            {/* FIXED TOP: Customer Info - always visible */}
                            <div className="flex-shrink-0 bg-white border-b border-gray-200 shadow-sm z-10">
                                {/* Customer Info Header with Name */}
                                <div className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
                                    <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg">
                                        <User size={16} />
                                    </div>
                                    <h3 className="font-bold text-gray-800">고객정보</h3>
                                    <span className="text-xs text-gray-400 mx-1">|</span>
                                    <span className="text-sm font-bold text-blue-700">{editingCustomer.name}</span>
                                    <span className="text-xs text-gray-400 font-mono ml-2">{editingCustomer.phone}</span>
                                </div>

                                {/* Customer Detail Fields - collapsible */}
                                <motion.div
                                    animate={{ height: isEstimateExpanded ? 0 : 'auto', opacity: isEstimateExpanded ? 0 : 1 }}
                                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                    className="overflow-hidden"
                                >
                                    <div className="p-5 grid grid-cols-2 gap-3">
                                        {/* Name */}
                                        <div>
                                            <label className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 uppercase mb-1">
                                                <User size={12} /> 이름
                                            </label>
                                            <input
                                                type="text"
                                                className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:bg-white transition-all"
                                                value={editingCustomer.name}
                                                onChange={(e) => setEditingCustomer(prev => ({ ...prev, name: e.target.value }))}
                                            />
                                        </div>
                                        {/* Phone */}
                                        <div>
                                            <label className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 uppercase mb-1">
                                                <Phone size={12} /> 전화번호
                                            </label>
                                            <input
                                                type="tel"
                                                className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:bg-white transition-all"
                                                value={editingCustomer.phone}
                                                onChange={(e) => setEditingCustomer(prev => ({ ...prev, phone: e.target.value }))}
                                            />
                                        </div>
                                        {/* Birthday */}
                                        <div>
                                            <label className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 uppercase mb-1">
                                                <Cake size={12} /> 생일
                                            </label>
                                            <input
                                                type="date"
                                                className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:bg-white transition-all"
                                                value={editingCustomer.birthday}
                                                onChange={(e) => setEditingCustomer(prev => ({ ...prev, birthday: e.target.value }))}
                                            />
                                        </div>
                                        {/* Email */}
                                        <div>
                                            <label className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 uppercase mb-1">
                                                <Mail size={12} /> 이메일
                                            </label>
                                            <input
                                                type="email"
                                                className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:bg-white transition-all"
                                                value={editingCustomer.email}
                                                onChange={(e) => setEditingCustomer(prev => ({ ...prev, email: e.target.value }))}
                                            />
                                        </div>
                                        {/* Address */}
                                        <div className="col-span-2">
                                            <label className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 uppercase mb-1">
                                                <MapPin size={12} /> 주소
                                            </label>
                                            <input
                                                type="text"
                                                className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:bg-white transition-all"
                                                value={editingCustomer.address}
                                                onChange={(e) => setEditingCustomer(prev => ({ ...prev, address: e.target.value }))}
                                            />
                                        </div>
                                        {/* Memo */}
                                        <div className="col-span-2">
                                            <label className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 uppercase mb-1">
                                                <StickyNote size={12} /> 비고
                                            </label>
                                            <textarea
                                                className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:bg-white transition-all resize-none"
                                                rows={2}
                                                value={editingCustomer.memo}
                                                onChange={(e) => setEditingCustomer(prev => ({ ...prev, memo: e.target.value }))}
                                                placeholder="비고 사항을 입력하세요..."
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            </div>

                            {/* BOTTOM: Estimate Total + List (scrollable, slides up over customer fields) */}
                            <div className="flex-1 overflow-y-auto z-20 bg-gray-50">
                                <div className="space-y-0">

                                    {/* SECTION 2: Estimate Total */}
                                    <div className="bg-white border-b border-gray-200 shadow-sm overflow-hidden">
                                        <div
                                            className="flex items-center justify-between px-6 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100 cursor-pointer select-none hover:from-blue-100 hover:to-indigo-100 transition-all"
                                            onClick={() => setIsEstimateExpanded(!isEstimateExpanded)}
                                        >
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg">
                                                    <DollarSign size={16} />
                                                </div>
                                                <h3 className="font-bold text-gray-800">견적토탈</h3>
                                                <span className="text-sm font-extrabold text-blue-600 font-mono ml-2">
                                                    {selectedEstimate.totalAmount.toLocaleString()}
                                                </span>
                                            </div>
                                            <motion.div
                                                animate={{ rotate: isEstimateExpanded ? 180 : 0 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                <ChevronDown size={18} className="text-gray-400" />
                                            </motion.div>
                                        </div>
                                        <motion.div
                                            animate={{ height: isItemsExpanded ? 0 : 'auto', opacity: isItemsExpanded ? 0 : 1 }}
                                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="p-5">
                                                <div className="grid grid-cols-3 gap-4 mb-4">
                                                    {/* Total Amount */}
                                                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100 flex flex-col justify-center">
                                                        <div className="px-4 py-2">
                                                            <span className="text-[10px] font-bold text-blue-400 uppercase block mb-1">견적총금액</span>
                                                            <span className="text-xl font-extrabold text-blue-700 font-mono">
                                                                {selectedEstimate.totalAmount.toLocaleString()}
                                                                <span className="text-sm font-bold text-blue-400 ml-0.5">원</span>
                                                            </span>
                                                        </div>
                                                    </div>
                                                    {/* Construction Date */}
                                                    <div className="flex flex-col">
                                                        <label className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 uppercase mb-1.5">
                                                            <Truck size={12} /> 시공일
                                                        </label>
                                                        <input
                                                            type="date"
                                                            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:bg-white transition-all flex-1"
                                                            defaultValue={selectedEstimate.constructionDate}
                                                        />
                                                    </div>
                                                    {/* Measure Date */}
                                                    <div className="flex flex-col">
                                                        <label className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 uppercase mb-1.5">
                                                            <Ruler size={12} /> 실측일
                                                        </label>
                                                        <input
                                                            type="date"
                                                            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:bg-white transition-all flex-1"
                                                            defaultValue={selectedEstimate.measureDate}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Address with same-as-customer checkbox */}
                                                <div className="mb-4">
                                                    <div className="flex items-center justify-between mb-1.5">
                                                        <label className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 uppercase">
                                                            <MapPin size={12} /> 시공주소
                                                        </label>
                                                        <label className="flex items-center gap-1.5 cursor-pointer select-none">
                                                            <div
                                                                className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${sameAsCustomerAddress
                                                                    ? 'bg-blue-600 border-blue-600'
                                                                    : 'bg-white border-gray-300 hover:border-blue-400'
                                                                    }`}
                                                                onClick={() => {
                                                                    const next = !sameAsCustomerAddress;
                                                                    setSameAsCustomerAddress(next);
                                                                    if (next) setEstimateAddress(editingCustomer.address);
                                                                }}
                                                            >
                                                                {sameAsCustomerAddress && <Check size={12} className="text-white" strokeWidth={3} />}
                                                            </div>
                                                            <span className="text-[11px] font-bold text-gray-500">고객주소와 동일</span>
                                                        </label>
                                                    </div>
                                                    <input
                                                        type="text"
                                                        className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:bg-white transition-all"
                                                        value={sameAsCustomerAddress ? editingCustomer.address : estimateAddress}
                                                        onChange={(e) => {
                                                            if (!sameAsCustomerAddress) setEstimateAddress(e.target.value);
                                                        }}
                                                        readOnly={sameAsCustomerAddress}
                                                        placeholder="시공 주소를 입력하세요..."
                                                    />
                                                </div>

                                                {/* Delivery Type Radio */}
                                                <div>
                                                    <label className="text-[11px] font-bold text-gray-400 uppercase block mb-2">배송 유형</label>
                                                    <div className="flex items-center gap-3 flex-wrap">
                                                        {(['construction', 'delivery', 'direct', 'other'] as const).map(type => (
                                                            <label
                                                                key={type}
                                                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border cursor-pointer transition-all text-sm font-bold
                                                                    ${editingDeliveryType === type
                                                                        ? 'bg-blue-50 border-blue-300 text-blue-700 ring-1 ring-blue-200'
                                                                        : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
                                                                    }`}
                                                            >
                                                                <input
                                                                    type="radio"
                                                                    name="deliveryType"
                                                                    value={type}
                                                                    checked={editingDeliveryType === type}
                                                                    onChange={() => setEditingDeliveryType(type)}
                                                                    className="accent-blue-600"
                                                                />
                                                                {type === 'construction' && <Truck size={14} />}
                                                                {type === 'delivery' && <Package size={14} />}
                                                                {type === 'direct' && <FileSpreadsheet size={14} />}
                                                                {type === 'other' && <Edit3 size={14} />}
                                                                {deliveryTypeLabels[type]}
                                                            </label>
                                                        ))}
                                                        {editingDeliveryType === 'other' && (
                                                            <input
                                                                type="text"
                                                                className="flex-1 min-w-[120px] px-3 py-2.5 rounded-xl border border-blue-300 bg-blue-50 text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:bg-white transition-all"
                                                                value={otherDeliveryText}
                                                                onChange={(e) => setOtherDeliveryText(e.target.value)}
                                                                placeholder="직접 입력..."
                                                                autoFocus
                                                            />
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    </div>

                                    {/* SECTION 3: Estimate Items List */}
                                    <div className="bg-white border-b border-gray-200 shadow-sm overflow-hidden">
                                        <div
                                            className="flex items-center justify-between px-6 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100 cursor-pointer select-none hover:from-blue-100 hover:to-indigo-100 transition-all"
                                            onClick={() => setIsItemsExpanded(!isItemsExpanded)}
                                        >
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg">
                                                    <Package size={16} />
                                                </div>
                                                <h3 className="font-bold text-gray-800">견적리스트</h3>
                                                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                                                    {selectedEstimate.items.length}개
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-all shadow-sm"
                                                    onClick={(e) => { e.stopPropagation(); setIsAddItemModalOpen(true); }}
                                                >
                                                    <Plus size={14} /> 항목 추가
                                                </button>
                                                <motion.div
                                                    animate={{ rotate: isItemsExpanded ? 180 : 0 }}
                                                    transition={{ duration: 0.2 }}
                                                >
                                                    <ChevronDown size={18} className="text-gray-400" />
                                                </motion.div>
                                            </div>
                                        </div>

                                        {/* Items Header */}
                                        <div className="flex items-center bg-gray-50 border-b border-gray-200 text-[10px] font-bold text-gray-400 uppercase tracking-wider px-6 py-2.5">
                                            <div className="flex-1">상품명</div>
                                            <div className="w-24 text-center">규격</div>
                                            <div className="w-16 text-center">수량</div>
                                            <div className="w-24 text-right">단가</div>
                                            <div className="w-28 text-right">금액</div>
                                            <div className="w-10"></div>
                                        </div>

                                        {/* Items */}
                                        <div className="divide-y divide-gray-100">
                                            <AnimatePresence>
                                                {selectedEstimate.items.map((item, idx) => (
                                                    <motion.div
                                                        key={item.id}
                                                        initial={{ opacity: 0, y: -10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, x: -20 }}
                                                        transition={{ delay: idx * 0.05 }}
                                                        className="flex items-center px-6 py-3.5 hover:bg-gray-50 transition-colors group"
                                                    >
                                                        <div className="flex-1">
                                                            <span className="text-sm font-bold text-gray-800">{item.productName}</span>
                                                        </div>
                                                        <div className="w-24 text-center">
                                                            <span className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-0.5 rounded">{item.spec}</span>
                                                        </div>
                                                        <div className="w-16 text-center">
                                                            <span className="text-sm font-bold text-gray-700">{item.quantity}</span>
                                                        </div>
                                                        <div className="w-24 text-right">
                                                            <span className="text-xs text-gray-500 font-mono">{item.unitPrice.toLocaleString()}</span>
                                                        </div>
                                                        <div className="w-28 text-right">
                                                            <span className="text-sm font-bold text-blue-600 font-mono">{item.totalPrice.toLocaleString()}</span>
                                                        </div>
                                                        <div className="w-10 flex justify-end">
                                                            <button className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </AnimatePresence>
                                        </div>

                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div >
        </div >
    );

    // Helper: render add-item modal
    function renderAddItemModal() {
        if (!isAddItemModalOpen) return null;
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsAddItemModalOpen(false)} />

                {/* Modal Container */}
                <div className="bg-white rounded-3xl shadow-2xl relative z-10 flex flex-col overflow-hidden" style={{ width: '90vw', maxWidth: '1200px', height: '85vh' }}>

                    {/* Header */}
                    <div className="px-8 py-5 border-b border-gray-100 flex items-center justify-between bg-white/80 backdrop-blur-md">
                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <Edit className="text-blue-600" size={24} />
                            상품선택
                            <span className="text-sm font-normal text-gray-400 ml-2">견적 항목을 추가합니다.</span>
                        </h2>
                        <button onClick={() => setIsAddItemModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                            <X size={24} />
                        </button>
                    </div>

                    {/* Content Scroll Area */}
                    <div className="flex-1 overflow-y-auto p-8 bg-gray-50/50 space-y-6">

                        {/* SECTION: Product Entry Form */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
                            <div className="bg-gray-50/50 px-6 py-3 border-b border-gray-200 flex justify-between items-center rounded-t-2xl">
                                <div className="flex items-center gap-3">
                                    <h3 className="font-bold text-gray-700 flex items-center gap-2"><Package size={18} /> 주문 상품 입력</h3>
                                    {/* 제품/원단 스위치 */}
                                    <div className="flex bg-white p-0.5 rounded-lg border border-gray-200 ml-2">
                                        <button
                                            onClick={() => { setModalInputMode('PRODUCT'); resetModalForm(); }}
                                            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${modalInputMode === 'PRODUCT' ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                        >
                                            제품
                                        </button>
                                        <button
                                            onClick={() => { setModalInputMode('FABRIC'); resetModalForm(); }}
                                            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${modalInputMode === 'FABRIC' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                        >
                                            원단
                                        </button>
                                    </div>
                                </div>
                                <button onClick={resetModalForm} className="text-xs text-gray-500 hover:text-blue-600 flex items-center gap-1">
                                    <RefreshCw size={12} /> 초기화
                                </button>
                            </div>

                            <div className="p-6 space-y-4">

                                {/* ============ 원단 모드 ============ */}
                                {modalInputMode === 'FABRIC' && (
                                    <>
                                        {/* Row 1: Product / Color / Width */}
                                        <div className="grid grid-cols-12 gap-4">
                                            <div className="col-span-5" ref={modalInputMode === 'FABRIC' ? productDropdownRef : undefined}>
                                                <label className="text-xs font-bold text-gray-400 mb-1 block">상품 검색</label>
                                                <div className="relative">
                                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                                                    <input
                                                        type="text"
                                                        value={modalProductSearch}
                                                        onChange={(e) => { setModalProductSearch(e.target.value); setIsProductDropdownOpen(true); }}
                                                        onFocus={() => setIsProductDropdownOpen(true)}
                                                        placeholder="단가설정 상품 검색..."
                                                        className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:border-blue-500 outline-none transition-all"
                                                    />
                                                    {isProductDropdownOpen && modalInputMode === 'FABRIC' && (
                                                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-64 overflow-y-auto">
                                                            {filteredSalesProducts.length === 0 ? (
                                                                <div className="px-4 py-3 text-sm text-gray-400 text-center">검색 결과가 없습니다</div>
                                                            ) : (
                                                                filteredSalesProducts.map(p => (
                                                                    <button
                                                                        key={p.id}
                                                                        onClick={() => {
                                                                            setModalProductSearch(p.label);
                                                                            setModalForm(prev => ({ ...prev, productId: p.id, productName: p.label, colorName: '' }));
                                                                            setIsProductDropdownOpen(false);
                                                                        }}
                                                                        className="w-full px-4 py-2.5 text-left hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-0"
                                                                    >
                                                                        <div className="text-sm font-semibold text-gray-800">{p.label}</div>
                                                                        <div className="text-[11px] text-gray-400 truncate">{p.path}</div>
                                                                    </button>
                                                                ))
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="col-span-3" ref={modalInputMode === 'FABRIC' ? colorDropdownRef : undefined}>
                                                <label className="text-xs font-bold text-gray-400 mb-1 block">색상</label>
                                                <div className="relative">
                                                    <button
                                                        onClick={() => setIsColorDropdownOpen(!isColorDropdownOpen)}
                                                        disabled={availableColors.length === 0}
                                                        className={`w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-left flex justify-between items-center ${availableColors.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-300'}`}
                                                    >
                                                        <span className={modalForm.colorName ? 'text-gray-800' : 'text-gray-400'}>{modalForm.colorName || (availableColors.length === 0 ? '상품을 먼저 선택' : '색상 선택')}</span>
                                                        <ChevronDown size={14} className="text-gray-400" />
                                                    </button>
                                                    {isColorDropdownOpen && modalInputMode === 'FABRIC' && availableColors.length > 0 && (
                                                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                                                            {availableColors.map(c => (
                                                                <button
                                                                    key={c.id}
                                                                    onClick={() => {
                                                                        setModalForm(prev => ({ ...prev, colorName: c.label }));
                                                                        setIsColorDropdownOpen(false);
                                                                    }}
                                                                    className="w-full px-4 py-2.5 text-left hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-0 flex items-center gap-2"
                                                                >
                                                                    {c.color && <div className="w-4 h-4 rounded-full border border-gray-200" style={{ backgroundColor: c.color }} />}
                                                                    <span className="text-sm font-medium text-gray-800">{c.label}</span>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="col-span-4">
                                                <label className="text-xs font-bold text-gray-400 mb-1 block">규격 (폭)</label>
                                                <div className="relative">
                                                    <button className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-left flex justify-between items-center">
                                                        <span className={modalForm.width ? 'text-gray-800' : 'text-gray-400'}>{modalForm.width || '규격 선택'}</span>
                                                        <ChevronDown size={14} className="text-gray-400" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Row 2: Unit / Qty / Price / Total / Add */}
                                        <div className="grid grid-cols-12 gap-4 items-end bg-gray-50 p-4 rounded-xl border border-gray-200">
                                            <div className="col-span-2">
                                                <label className="text-xs font-bold text-gray-400 mb-1 block">단위</label>
                                                <div className="flex bg-white p-1 rounded-lg border border-gray-200">
                                                    <button
                                                        onClick={() => setModalForm(prev => ({ ...prev, unit: 'Roll' }))}
                                                        className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${modalForm.unit === 'Roll' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                                    >Roll</button>
                                                    <button
                                                        onClick={() => setModalForm(prev => ({ ...prev, unit: 'm' }))}
                                                        className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${modalForm.unit === 'm' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                                    >m</button>
                                                </div>
                                            </div>
                                            <div className="col-span-1">
                                                <label className="text-xs font-bold text-gray-400 mb-1 block">수량</label>
                                                <input
                                                    type="number"
                                                    value={modalForm.quantity}
                                                    onChange={(e) => setModalForm(prev => ({ ...prev, quantity: e.target.value }))}
                                                    className="w-full px-2 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-bold text-right"
                                                    placeholder="0"
                                                />
                                            </div>
                                            <div className="col-span-3">
                                                <label className="text-xs font-bold text-gray-400 mb-1 block">단가</label>
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        value={modalForm.unitPrice.toLocaleString()}
                                                        onChange={(e) => {
                                                            const val = Number(e.target.value.replace(/,/g, ''));
                                                            if (!isNaN(val)) setModalForm(prev => ({ ...prev, unitPrice: val }));
                                                        }}
                                                        className="w-full pr-8 px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-right font-mono"
                                                    />
                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">원</span>
                                                </div>
                                            </div>
                                            <div className="col-span-3">
                                                <label className="text-xs font-bold text-gray-400 mb-1 block">총 금액</label>
                                                <div className="w-full px-3 py-2.5 bg-gray-100 border border-gray-200 rounded-lg text-sm text-right font-bold text-blue-600 font-mono flex items-center justify-end gap-1">
                                                    {(Number(modalForm.quantity || 0) * (modalForm.unitPrice || 0)).toLocaleString()}
                                                    <span className="text-[10px] font-normal text-gray-500">원</span>
                                                </div>
                                            </div>
                                            <div className="col-span-3">
                                                <button className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow-sm">
                                                    추가
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* ============ 제품 모드 ============ */}
                                {modalInputMode === 'PRODUCT' && (
                                    <>
                                        {/* Row 1: Product / Unit / Color */}
                                        <div className="grid grid-cols-12 gap-4">
                                            <div className="col-span-5" ref={modalInputMode === 'PRODUCT' ? productDropdownRef : undefined}>
                                                <label className="text-xs font-bold text-gray-400 mb-1 block">제품명</label>
                                                <div className="relative">
                                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                                                    <input
                                                        type="text"
                                                        value={modalProductSearch}
                                                        onChange={(e) => { setModalProductSearch(e.target.value); setIsProductDropdownOpen(true); }}
                                                        onFocus={() => setIsProductDropdownOpen(true)}
                                                        placeholder="단가설정 상품 검색..."
                                                        className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:border-emerald-500 outline-none transition-all"
                                                    />
                                                    {isProductDropdownOpen && modalInputMode === 'PRODUCT' && (
                                                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-64 overflow-y-auto">
                                                            {filteredSalesProducts.length === 0 ? (
                                                                <div className="px-4 py-3 text-sm text-gray-400 text-center">검색 결과가 없습니다</div>
                                                            ) : (
                                                                filteredSalesProducts.map(p => (
                                                                    <button
                                                                        key={p.id}
                                                                        onClick={() => {
                                                                            // 상품 선택: 기본사이즈/단위 로드 + 색상 자동 펼침
                                                                            const pNode = nodes[p.id];
                                                                            let cuttingUnit = '';
                                                                            let defaultWidth = '';
                                                                            let defaultHeight = '';
                                                                            if (pNode) {
                                                                                let dn = pNode;
                                                                                if (dn.sourceIds && dn.sourceIds.length > 0) {
                                                                                    const sn = nodes[dn.sourceIds[0]];
                                                                                    if (sn) dn = sn;
                                                                                }
                                                                                try {
                                                                                    const cRaw = dn.attributes?.cost_cutting_list;
                                                                                    if (cRaw) {
                                                                                        const cList = JSON.parse(cRaw);
                                                                                        if (Array.isArray(cList) && cList.length > 0) {
                                                                                            cuttingUnit = cList[0].unit || 'SQM';
                                                                                            defaultWidth = String(parseFloat(String(cList[0].minWidth || '0').replace(/,/g, '')) || '');
                                                                                            defaultHeight = String(parseFloat(String(cList[0].minHeight || '0').replace(/,/g, '')) || '');
                                                                                        }
                                                                                    }
                                                                                } catch (e) { }
                                                                            }
                                                                            setModalProductSearch(p.label);
                                                                            setModalForm(prev => ({ ...prev, productId: p.id, productName: p.label, colorName: '', prodWidth: defaultWidth, prodHeight: defaultHeight, prodArea: 0, prodAppliedArea: 0, prodCuttingUnit: cuttingUnit, sizeError: '', unitPrice: 0, originalUnitPrice: 0, price: '0' }));
                                                                            setIsProductDropdownOpen(false);
                                                                            setIsColorDropdownOpen(true);
                                                                        }}
                                                                        className="w-full px-4 py-2.5 text-left hover:bg-emerald-50 transition-colors border-b border-gray-50 last:border-0"
                                                                    >
                                                                        <div className="text-sm font-semibold text-gray-800">{p.label}</div>
                                                                        <div className="text-[11px] text-gray-400 truncate">{p.path}</div>
                                                                    </button>
                                                                ))
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="col-span-2">
                                                <label className="text-xs font-bold text-gray-400 mb-1 block">단위</label>
                                                <div className="w-full px-3 py-2.5 bg-gray-100 border border-gray-200 rounded-lg text-sm font-bold text-emerald-700">
                                                    {modalForm.prodCuttingUnit === 'SQM' ? '㎡ (제곱미터)' : modalForm.prodCuttingUnit === 'WIDTH' ? '폭 기준' : '상품을 선택하세요'}
                                                </div>
                                            </div>
                                            <div className="col-span-5" ref={modalInputMode === 'PRODUCT' ? colorDropdownRef : undefined}>
                                                <label className="text-xs font-bold text-gray-400 mb-1 block">색상</label>
                                                <div className="relative">
                                                    <button
                                                        onClick={() => setIsColorDropdownOpen(!isColorDropdownOpen)}
                                                        disabled={availableColors.length === 0}
                                                        className={`w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-left flex justify-between items-center ${availableColors.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:border-emerald-300'}`}
                                                    >
                                                        <span className={modalForm.colorName ? 'text-gray-800' : 'text-gray-400'}>{modalForm.colorName || (availableColors.length === 0 ? '상품을 먼저 선택' : '색상 선택')}</span>
                                                        <ChevronDown size={14} className="text-gray-400" />
                                                    </button>
                                                    {isColorDropdownOpen && modalInputMode === 'PRODUCT' && availableColors.length > 0 && (
                                                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                                                            {availableColors.map(c => (
                                                                <button
                                                                    key={c.id}
                                                                    onClick={() => {
                                                                        setModalForm(prev => ({ ...prev, colorName: c.label }));
                                                                        setIsColorDropdownOpen(false);
                                                                    }}
                                                                    className="w-full px-4 py-2.5 text-left hover:bg-emerald-50 transition-colors border-b border-gray-50 last:border-0 flex items-center gap-2"
                                                                >
                                                                    {c.color && <div className="w-4 h-4 rounded-full border border-gray-200" style={{ backgroundColor: c.color }} />}
                                                                    <span className="text-sm font-medium text-gray-800">{c.label}</span>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Row 2: 가로/세로 + 면적 + 수량 + 단가 + 총금액 + 추가 */}
                                        <div className="grid grid-cols-10 gap-4 items-start bg-emerald-50/50 p-4 rounded-xl border border-emerald-200">
                                            {/* 가로 */}
                                            <div className="col-span-1">
                                                <label className="text-xs font-bold text-gray-400 mb-1 block">가로 (cm)</label>
                                                <input
                                                    type="text"
                                                    inputMode="decimal"
                                                    value={modalForm.prodWidth}
                                                    onChange={(e) => handleEstProdSizeChange('prodWidth', e.target.value)}
                                                    onFocus={(e) => e.target.select()}
                                                    onBlur={(e) => {
                                                        const v = parseFloat(e.target.value);
                                                        if (!isNaN(v) && v > 0) setModalForm(prev => ({ ...prev, prodWidth: v.toFixed(1) }));
                                                    }}
                                                    className={`w-full px-2 py-2 bg-white border rounded-lg text-sm font-bold text-right ${modalForm.sizeError && modalForm.sizeError.includes('가로') ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
                                                    placeholder="0"
                                                    disabled={!modalForm.productId}
                                                />
                                                {productCuttingData && (productCuttingData.minWidth > 0 || productCuttingData.maxWidth > 0) && (
                                                    <div className="text-[10px] text-gray-400 mt-1">
                                                        범위 {productCuttingData.minWidth > 0 ? productCuttingData.minWidth : ''}{productCuttingData.maxWidth > 0 ? ` ~ ${productCuttingData.maxWidth}` : ' ~'}
                                                    </div>
                                                )}
                                            </div>

                                            {/* 세로 */}
                                            <div className="col-span-1">
                                                <label className="text-xs font-bold text-gray-400 mb-1 block">세로 (cm)</label>
                                                <input
                                                    type="text"
                                                    inputMode="decimal"
                                                    value={modalForm.prodHeight}
                                                    onChange={(e) => handleEstProdSizeChange('prodHeight', e.target.value)}
                                                    onFocus={(e) => e.target.select()}
                                                    onBlur={(e) => {
                                                        const v = parseFloat(e.target.value);
                                                        if (!isNaN(v) && v > 0) setModalForm(prev => ({ ...prev, prodHeight: v.toFixed(1) }));
                                                    }}
                                                    className={`w-full px-2 py-2 bg-white border rounded-lg text-sm font-bold text-right ${modalForm.sizeError && modalForm.sizeError.includes('세로') ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
                                                    placeholder="0"
                                                    disabled={!modalForm.productId}
                                                />
                                                {productCuttingData && (productCuttingData.minHeight > 0 || productCuttingData.maxHeight > 0) && (
                                                    <div className="text-[10px] text-gray-400 mt-1">
                                                        범위 {productCuttingData.minHeight > 0 ? productCuttingData.minHeight : ''}{productCuttingData.maxHeight > 0 ? ` ~ ${productCuttingData.maxHeight}` : ' ~'}
                                                    </div>
                                                )}
                                            </div>

                                            {/* 면적 */}
                                            <div className="col-span-1">
                                                <label className="text-xs font-bold text-gray-400 mb-1 block">면적 (㎡)</label>
                                                <div className={`w-full px-2 py-2 bg-white border border-gray-200 rounded-lg text-sm text-right font-mono font-bold ${modalForm.prodArea > 0 && modalForm.prodAppliedArea > 0 && modalForm.prodArea < modalForm.prodAppliedArea ? 'text-red-500' : 'text-gray-700'}`}>
                                                    {modalForm.prodAppliedArea > 0 ? modalForm.prodAppliedArea.toFixed(1) : (modalForm.prodArea > 0 ? modalForm.prodArea.toFixed(1) : '-')}
                                                </div>
                                                {productCuttingData && productCuttingData.basicArea > 0 && (
                                                    <div className="text-[10px] text-gray-400 mt-1">
                                                        기본:{productCuttingData.basicArea}㎡
                                                    </div>
                                                )}
                                            </div>

                                            {/* 수량 */}
                                            <div className="col-span-1">
                                                <label className="text-xs font-bold text-gray-400 mb-1 block">수량</label>
                                                <input
                                                    type="text"
                                                    inputMode="numeric"
                                                    value={modalForm.quantity}
                                                    onChange={(e) => setModalForm(prev => ({ ...prev, quantity: e.target.value }))}
                                                    onFocus={(e) => e.target.select()}
                                                    className="w-full px-2 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-right"
                                                    placeholder="1"
                                                />
                                            </div>

                                            {/* 단가 */}
                                            <div className="col-span-2">
                                                <label className="text-xs font-bold text-gray-400 mb-1 block">단가</label>
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        inputMode="numeric"
                                                        value={modalForm.unitPrice > 0 ? modalForm.unitPrice.toLocaleString() : ''}
                                                        onChange={(e) => {
                                                            const val = Number(e.target.value.replace(/,/g, ''));
                                                            if (!isNaN(val)) setModalForm(prev => ({ ...prev, unitPrice: val }));
                                                        }}
                                                        onFocus={(e) => e.target.select()}
                                                        className={`w-full px-2 py-2 pr-6 bg-white border rounded-lg text-sm font-bold text-right font-mono ${modalForm.unitPrice !== modalForm.originalUnitPrice && modalForm.originalUnitPrice > 0 ? 'border-red-400 text-red-600' : 'border-gray-200 text-gray-800'}`}
                                                        placeholder="0"
                                                        disabled={!modalForm.productId}
                                                    />
                                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">원</span>
                                                </div>
                                                {modalForm.unitPrice !== modalForm.originalUnitPrice && modalForm.originalUnitPrice > 0 && (
                                                    <div className="text-[10px] text-red-500 font-bold mt-1">
                                                        기본 {modalForm.originalUnitPrice.toLocaleString()}원 ({modalForm.unitPrice > modalForm.originalUnitPrice ? '+' : ''}{(modalForm.unitPrice - modalForm.originalUnitPrice).toLocaleString()})
                                                    </div>
                                                )}


                                            </div>

                                            {/* 총금액 */}
                                            <div className="col-span-2">
                                                <label className="text-xs font-bold text-gray-400 mb-1 block">총 금액</label>
                                                <div className="w-full px-2 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm text-right font-bold text-emerald-600 font-mono flex items-center justify-end gap-1">
                                                    {Number(modalForm.price || 0).toLocaleString()}
                                                    <span className="text-[10px] font-normal text-gray-500">원</span>
                                                </div>
                                            </div>

                                            {/* 실사 + 추가 버튼 */}
                                            <div className="col-span-2">
                                                <label className="text-xs font-bold text-gray-400 mb-1 block">&nbsp;</label>
                                                <div className="flex gap-1.5">
                                                    {isMeasureAllowed && modalForm.productId && (
                                                        modalForm.measureImageId ? (
                                                            <>
                                                                <button
                                                                    className="px-3 py-2 rounded-md text-[11px] font-bold flex items-center justify-center gap-1 transition-all bg-emerald-500 hover:bg-emerald-600 text-white whitespace-nowrap"
                                                                    onClick={() => { setShowMeasurePanel(prev => { const next = !prev; if (next) { setTimeout(() => measurePanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100); } return next; }); }}
                                                                >
                                                                    실사수정
                                                                </button>
                                                                <button
                                                                    className="px-3 py-2 rounded-md text-[11px] font-bold flex items-center justify-center gap-1 transition-all border border-red-400 text-red-500 bg-white hover:bg-red-50 whitespace-nowrap"
                                                                    onClick={() => {
                                                                        setShowMeasurePanel(false);
                                                                        setModalForm(prev => {
                                                                            const cuttingTotal = prev.unitPrice * (parseFloat(prev.quantity) || 1);
                                                                            const optionTotal = calcOptionTotal(prev.selectedOptions || []);
                                                                            const rawTotal = cuttingTotal + optionTotal;
                                                                            const roundedTotal = Math.round(rawTotal / 10) * 10;
                                                                            return { ...prev, measureImageId: '', measureImageName: '', measureImageUrl: '', measureCategory: '', measureUnitPrice: 0, price: String(roundedTotal) };
                                                                        });
                                                                    }}
                                                                >
                                                                    취소
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <button
                                                                className={`px-3 py-2 rounded-md text-[11px] font-bold flex items-center justify-center gap-1 transition-all whitespace-nowrap ${showMeasurePanel ? 'bg-purple-600 hover:bg-purple-700 text-white ring-2 ring-purple-300' : 'bg-emerald-500 hover:bg-emerald-600 text-white'}`}
                                                                onClick={() => { setShowMeasurePanel(prev => { const next = !prev; if (next) { setTimeout(() => measurePanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100); } return next; }); }}
                                                            >
                                                                <Ruler size={12} />
                                                                실사
                                                            </button>
                                                        )
                                                    )}
                                                    <button className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold shadow-sm">
                                                        추가
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        {/* 사이즈 에러 표시 */}
                                        {modalForm.sizeError && (
                                            <div className="text-xs text-red-500 font-bold bg-red-50 px-3 py-2 rounded-lg border border-red-200">
                                                ⚠️ {modalForm.sizeError}
                                            </div>
                                        )}

                                        {/* 시스템 탭 — productSystemNodes 기반 */}
                                        {modalForm.productId && productSystemNodes.length > 0 && (
                                            <div className="space-y-3">
                                                {/* 시스템 탭 */}
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold text-gray-500">시스템</span>
                                                    <div className="flex bg-white p-0.5 rounded-lg border border-gray-200 flex-wrap gap-0.5">
                                                        {productSystemNodes.map((sys: any) => (
                                                            <button
                                                                key={sys.id}
                                                                onClick={() => handleSelectSystem(sys.id, sys.label)}
                                                                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${modalForm.selectedSystemId === sys.id
                                                                    ? 'bg-blue-600 text-white shadow-sm'
                                                                    : 'text-gray-400 hover:text-gray-600'
                                                                    }`}
                                                            >
                                                                {sys.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* 드릴다운 스위치 */}
                                                {drillSwitchLevels.map((level: any, idx: number) => (
                                                    <div key={idx} className="flex items-center gap-2">
                                                        <span className="text-xs font-bold text-gray-400">├</span>
                                                        <div className="flex bg-white p-0.5 rounded-lg border border-gray-200 flex-wrap gap-0.5">
                                                            {level.nodes.map((n: any) => (
                                                                <button
                                                                    key={n.id}
                                                                    onClick={() => handleDrillDown(idx, n.id, n.label)}
                                                                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${level.selectedId === n.id
                                                                        ? 'bg-blue-500 text-white shadow-sm'
                                                                        : 'text-gray-400 hover:text-gray-600'
                                                                        }`}
                                                                >
                                                                    {n.label}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}

                                                {/* 옵션 요약 라인 */}
                                                {(modalForm.selectedOptions || []).length > 0 && (() => {
                                                    const optTotal = Math.round(calcOptionTotal(modalForm.selectedOptions || []));
                                                    return (
                                                        <div className="flex items-center flex-wrap gap-0 text-xs bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 overflow-x-auto">
                                                            <span className="text-gray-500 font-bold whitespace-nowrap shrink-0">
                                                                {productSystemNodes.find((s: any) => s.id === modalForm.selectedSystemId)?.label || ''}
                                                            </span>
                                                            {drillPath.map((dp: any, i: number) => (
                                                                <React.Fragment key={dp.id}>
                                                                    <span className="text-gray-300 text-xs mx-1 shrink-0">&gt;</span>
                                                                    <span className="text-xs whitespace-nowrap shrink-0">
                                                                        <span className="font-bold text-orange-600">{dp.name}</span>
                                                                    </span>
                                                                </React.Fragment>
                                                            ))}
                                                            {(modalForm.selectedOptions || []).filter((o: any) => o.checked).map((opt: any) => {
                                                                let display = '';
                                                                let price = 0;
                                                                const rawQty = parseFloat(String(opt.quantity)) || 0;
                                                                if (opt.type === 'group' && opt.children) {
                                                                    const sel = opt.children.find((c: any) => c.id === opt.selectedChildId);
                                                                    display = sel ? `${sel.name}${sel?.unit === 'm' ? ` ${rawQty}cm` : (rawQty > 1 ? ' ×' + rawQty : '')}` : '';
                                                                    const effectiveQty = sel?.unit === 'm' ? rawQty / 100 : rawQty;
                                                                    price = sel ? (sel.unit === 'm' ? Math.round(sel.unitPrice * effectiveQty / 100) * 100 : Math.round(sel.unitPrice * effectiveQty)) : 0;
                                                                } else {
                                                                    display = String(opt.quantity);
                                                                    const effectiveQty = opt.unit === 'm' ? rawQty / 100 : rawQty;
                                                                    price = opt.unit === 'm' ? Math.round(opt.unitPrice * effectiveQty / 100) * 100 : Math.round(opt.unitPrice * effectiveQty);
                                                                }
                                                                return (
                                                                    <React.Fragment key={opt.id}>
                                                                        <span className="text-gray-300 text-xs mx-1 shrink-0">&gt;</span>
                                                                        <span className="text-xs text-gray-600 whitespace-nowrap shrink-0">
                                                                            <span className="font-bold">{opt.name}</span>
                                                                            <span className="text-gray-400 mx-0.5">:</span>
                                                                            <span className="font-bold text-gray-800">{display}</span>
                                                                            {price > 0 && (
                                                                                <span className="text-blue-500 font-mono ml-1">₩{price.toLocaleString()}</span>
                                                                            )}
                                                                        </span>
                                                                    </React.Fragment>
                                                                );
                                                            })}
                                                            <span className="text-gray-300 text-xs mx-1 shrink-0">&gt;</span>
                                                            <span className="text-xs font-bold text-blue-600 whitespace-nowrap shrink-0 ml-auto">
                                                                총합 : ₩{optTotal.toLocaleString()}
                                                            </span>
                                                        </div>
                                                    );
                                                })()}

                                                {/* 옵션 카드 리스트 */}
                                                {(modalForm.selectedOptions || []).length > 0 && (
                                                    <div className="flex gap-3 flex-wrap">
                                                        {(modalForm.selectedOptions || []).map((opt: any) => (
                                                            <div key={opt.id} className="bg-white rounded-xl border border-gray-200 shadow-sm min-w-[140px] flex-1 max-w-[220px]">
                                                                {/* 카드 타이틀 + 수량 입력 */}
                                                                {(() => {
                                                                    const integerUnits = ['ea', '개'];
                                                                    const decimalUnits = ['m', 'cm'];
                                                                    const childUnit = opt.children?.[0]?.unit || '';
                                                                    const rawUnit = (opt.type === 'group' && childUnit) ? childUnit : opt.unit;
                                                                    const effectiveUnit = rawUnit === 'm' ? 'cm' : rawUnit;
                                                                    const isInteger = integerUnits.includes(effectiveUnit);
                                                                    const isDecimal = decimalUnits.includes(effectiveUnit);
                                                                    const showInput = isInteger || isDecimal;
                                                                    return (
                                                                        <div className="px-3 py-2 border-b border-gray-100 bg-gray-50 rounded-t-xl flex items-center justify-between gap-2">
                                                                            <span className="text-xs font-bold text-gray-700">{opt.name}</span>
                                                                            {showInput && (
                                                                                <div className="flex items-center gap-1 shrink-0">
                                                                                    <input
                                                                                        type="text"
                                                                                        inputMode={isInteger ? 'numeric' : 'decimal'}
                                                                                        value={opt.quantity}
                                                                                        onChange={(e) => {
                                                                                            const v = e.target.value;
                                                                                            if (isInteger) {
                                                                                                if (v === '' || /^[1-9]\d*$/.test(v)) handleOptionChange(opt.id, 'quantity', v || '1');
                                                                                            } else {
                                                                                                if (v === '' || /^\d*\.?\d{0,1}$/.test(v)) handleOptionChange(opt.id, 'quantity', v || '0');
                                                                                            }
                                                                                        }}
                                                                                        onFocus={(e) => e.target.select()}
                                                                                        className="w-12 px-1 py-0.5 border border-gray-300 rounded text-center text-xs font-bold text-gray-700 bg-white focus:border-blue-400 outline-none"
                                                                                    />
                                                                                    <span className="text-[10px] text-gray-400">{effectiveUnit}</span>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })()}
                                                                {/* 카드 내용 */}
                                                                <div className="px-3 py-2.5">
                                                                    {opt.type === 'group' && opt.children ? (
                                                                        <div className="space-y-2">
                                                                            <div className="flex flex-col gap-1.5">
                                                                                {opt.children.map((child: any) => {
                                                                                    const isSelected = opt.selectedChildId === child.id;
                                                                                    return (
                                                                                        <button
                                                                                            key={child.id}
                                                                                            onClick={() => handleSelectOptionChild(opt.id, child.id)}
                                                                                            className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center justify-between ${isSelected
                                                                                                ? 'bg-blue-50 text-blue-700 border-blue-300'
                                                                                                : 'bg-white text-gray-500 border-gray-100 hover:border-blue-200 hover:text-blue-500'
                                                                                                }`}
                                                                                        >
                                                                                            <span>{child.name}</span>
                                                                                            {child.unitPrice > 0 && (
                                                                                                <span className={`font-mono text-[11px] ${isSelected ? 'text-blue-500' : 'text-gray-400'}`}>
                                                                                                    ₩{child.unitPrice.toLocaleString()}
                                                                                                </span>
                                                                                            )}
                                                                                        </button>
                                                                                    );
                                                                                })}
                                                                            </div>
                                                                            {/* 금액 표시 */}
                                                                            {(() => {
                                                                                const sel = opt.children?.find((c: any) => c.id === opt.selectedChildId);
                                                                                let qty = parseFloat(String(opt.quantity)) || 0;
                                                                                if (sel?.unit === 'm') qty = qty / 100;
                                                                                if (!sel || sel.unitPrice <= 0) return null;
                                                                                const isItemUnit = sel.unit === '항' || sel.unit === '건';
                                                                                const total = sel.unit === 'm' ? Math.round(sel.unitPrice * qty / 100) * 100 : Math.round(sel.unitPrice * qty);
                                                                                return (
                                                                                    <div className="pt-1.5 border-t border-gray-100">
                                                                                        {isItemUnit ? (
                                                                                            <div className="text-xs font-bold text-blue-600 font-mono">
                                                                                                ₩{sel.unitPrice.toLocaleString()}
                                                                                            </div>
                                                                                        ) : (
                                                                                            <>
                                                                                                <div className="text-xs text-gray-500 font-mono">
                                                                                                    단가 ₩{sel.unitPrice.toLocaleString()} × {sel.unit === 'm' ? `${opt.quantity} cm` : qty}
                                                                                                </div>
                                                                                                <div className="text-xs font-bold text-blue-600 font-mono">
                                                                                                    = ₩{total.toLocaleString()}
                                                                                                </div>
                                                                                            </>
                                                                                        )}
                                                                                    </div>
                                                                                );
                                                                            })()}
                                                                        </div>
                                                                    ) : (
                                                                        <div className="space-y-1">
                                                                            {opt.unitPrice > 0 && (
                                                                                <div className="text-xs text-gray-500 font-mono">
                                                                                    단가 ₩{opt.unitPrice.toLocaleString()} / {opt.unit === 'm' ? 'cm' : opt.unit}
                                                                                </div>
                                                                            )}
                                                                            <div className="text-xs font-bold text-blue-600 font-mono">
                                                                                = ₩{(opt.unit === 'm' ? Math.round(opt.unitPrice * ((parseFloat(String(opt.quantity)) || 0) * 0.01) / 100) * 100 : Math.round(opt.unitPrice * ((parseFloat(String(opt.quantity)) || 0) * (opt.unit === 'm' ? 0.01 : 1)))).toLocaleString()}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* === 실사 이미지 선택 패널 === */}
                                        {isMeasureAllowed && modalForm.productId && showMeasurePanel && (
                                            <div ref={measurePanelRef}>
                                                <div className="space-y-3">
                                                    {/* 실사 검색바 + 상세정보 오버레이 */}
                                                    <div className="flex flex-col gap-1">
                                                        <div className="relative">
                                                            <ImageIcon size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-purple-400 z-10" />
                                                            <input
                                                                type="text"
                                                                value={measureSearchText}
                                                                onChange={(e) => setMeasureSearchText(e.target.value)}
                                                                placeholder="실사 검색..."
                                                                className="w-full pl-8 pr-3 py-2 bg-white border border-purple-200 rounded-lg text-sm text-gray-700 placeholder-purple-300 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-200"
                                                            />
                                                            {/* 선택된 이미지 상세정보 오버레이 */}
                                                            {modalForm.measureImageId && (() => {
                                                                const pw = parseFloat(modalForm.prodWidth) || 100;
                                                                const ph = parseFloat(modalForm.prodHeight) || 100;
                                                                const catLabel = measurePositionOption || '-';
                                                                const POSITION_TO_CATEGORY: Record<string, string> = { '여백실사': 'MARGIN_MEASURE', '꽉찬실사': 'FULL_MEASURE', '여백로고': 'MARGIN_LOGO', '고정로고': 'FIXED_LOGO' };
                                                                const effectiveCategory = POSITION_TO_CATEGORY[measurePositionOption] || modalForm.measureCategory || '';
                                                                let sizeW = pw, sizeH = ph;
                                                                let posInfo = '';
                                                                if (measurePositionOption === '여백실사') {
                                                                    const sc = measureScale / 100;
                                                                    const elemW = pw * measureImgSize.w / 100; const elemH = ph * measureImgSize.h / 100;
                                                                    const elemR = elemW / elemH; const imgR = measureImgNaturalRatio || elemR;
                                                                    let hP = 0, vP = 0;
                                                                    if (imgR < elemR) hP = (elemW - elemH * imgR) / 2; else vP = (elemH - elemW / imgR) / 2;
                                                                    const cx = pw * measureImgPos.x / 100 + elemW / 2; const cy = ph * measureImgPos.y / 100 + elemH / 2;
                                                                    const mL = Math.round((cx - (elemW / 2 - hP) * sc) * 10) / 10;
                                                                    const mT = Math.round((cy - (elemH / 2 - vP) * sc) * 10) / 10;
                                                                    const mR = Math.round((pw - cx - (elemW / 2 - hP) * sc) * 10) / 10;
                                                                    const mB = Math.round((ph - cy - (elemH / 2 - vP) * sc) * 10) / 10;
                                                                    sizeW = Math.round((elemW - 2 * hP) * sc * 10) / 10; sizeH = Math.round((elemH - 2 * vP) * sc * 10) / 10;
                                                                    posInfo = `좌${mL} 상${mT} 우${mR} 하${mB}`;
                                                                } else if (measurePositionOption === '꽉찬실사') {
                                                                    const productRatio = pw / ph; const imgRatio = measureImgNaturalRatio;
                                                                    let mL = 0, mT = 0, mR = 0, mB = 0;
                                                                    if (imgRatio > productRatio) { const o = ph * imgRatio - pw; mL = Math.round(o * (measureFullOffset.x / 100) * 10) / 10; mR = Math.round(o * (1 - measureFullOffset.x / 100) * 10) / 10; }
                                                                    else { const o = pw / imgRatio - ph; mT = Math.round(o * (measureFullOffset.y / 100) * 10) / 10; mB = Math.round(o * (1 - measureFullOffset.y / 100) * 10) / 10; }
                                                                    posInfo = `좌${mL ? '-' + mL : 0} 상${mT ? '-' + mT : 0} 우${mR ? '-' + mR : 0} 하${mB ? '-' + mB : 0}`;
                                                                } else if (measurePositionOption === '여백로고') {
                                                                    const sc = logoScale / 30;
                                                                    const elemW = pw * logoSize.w / 100; const elemH = ph * logoSize.h / 100;
                                                                    const elemR = elemW / elemH; const imgR = measureImgNaturalRatio || elemR;
                                                                    let hP = 0, vP = 0; if (imgR < elemR) hP = (elemW - elemH * imgR) / 2; else vP = (elemH - elemW / imgR) / 2;
                                                                    const cx = pw * logoPos.x / 100 + elemW / 2; const cy = ph * logoPos.y / 100 + elemH / 2;
                                                                    const mL = Math.round((cx - (elemW / 2 - hP) * sc) * 10) / 10;
                                                                    const mT = Math.round((cy - (elemH / 2 - vP) * sc) * 10) / 10;
                                                                    sizeW = Math.round((elemW - 2 * hP) * sc * 10) / 10; sizeH = Math.round((elemH - 2 * vP) * sc * 10) / 10;
                                                                    posInfo = `좌${mL} 상${mT}`;
                                                                } else if (measurePositionOption === '고정로고') {
                                                                    sizeW = Math.round(pw * fixedLogoScale / 100 * 10) / 10; sizeH = Math.round(ph * fixedLogoScale / 100 * 10) / 10;
                                                                    posInfo = `좌${fixedLogoPos.x} 상${fixedLogoPos.y}`;
                                                                }
                                                                const effectiveArea = (sizeW * sizeH) / 10000;
                                                                const measureTotal = calcMeasurePrice(effectiveCategory, effectiveArea, modalForm.unitPrice, Number(modalForm.quantity || 1));
                                                                return (
                                                                    <div className="absolute inset-0 flex items-center pointer-events-none overflow-hidden rounded-lg" style={{ paddingLeft: '2rem', paddingRight: '0.5rem' }}>
                                                                        <div className="flex-1" />
                                                                        <span className="text-xs font-mono font-bold text-purple-600 whitespace-nowrap" style={{ direction: 'rtl', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 'calc(100% - 2rem)' }}>
                                                                            {modalForm.measureImageName} · {catLabel} · {sizeW}×{sizeH} · {posInfo} · {measureTotal.toLocaleString()}
                                                                        </span>
                                                                    </div>
                                                                );
                                                            })()}
                                                        </div>
                                                    </div>

                                                    {/* 실사위치 설정 + 썸네일 그리드 */}
                                                    <div className="space-y-2">
                                                        <div style={{ aspectRatio: '2.5' }}>
                                                            <div className="grid grid-cols-5 gap-2 h-full">
                                                                {/* 좌측: 실사위치 설정 카드 */}
                                                                <div className="col-span-2 row-span-2 rounded-lg border-2 border-purple-300 bg-white shadow-lg p-2 flex flex-col gap-1 overflow-hidden">
                                                                    {/* 완료 + 마진 정보 + X */}
                                                                    <div className="flex items-center gap-1">
                                                                        <button
                                                                            onClick={() => {
                                                                                const POSITION_TO_CAT: Record<string, string> = { '여백실사': 'MARGIN_MEASURE', '꽉찬실사': 'FULL_MEASURE', '여백로고': 'MARGIN_LOGO', '고정로고': 'FIXED_LOGO' };
                                                                                handleMeasureCategoryChange(POSITION_TO_CAT[measurePositionOption] || '');
                                                                                setShowMeasurePanel(false);
                                                                            }}
                                                                            className="px-3 py-1.5 rounded-md border border-gray-300 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all whitespace-nowrap"
                                                                        >완료</button>
                                                                        {modalForm.measureImageUrl && (() => {
                                                                            const pw = parseFloat(modalForm.prodWidth) || 100;
                                                                            const ph = parseFloat(modalForm.prodHeight) || 100;
                                                                            if (measurePositionOption === '여백실사') {
                                                                                const iL = measureImgPos.x; const iT = measureImgPos.y;
                                                                                const iW = measureImgSize.w; const iH = measureImgSize.h;
                                                                                const sc = measureScale / 100;
                                                                                const elemW = pw * iW / 100; const elemH = ph * iH / 100;
                                                                                const elemR = elemW / elemH; const imgR = measureImgNaturalRatio || elemR;
                                                                                let hPad = 0, vPad = 0;
                                                                                if (imgR < elemR) { hPad = (elemW - elemH * imgR) / 2; } else { vPad = (elemH - elemW / imgR) / 2; }
                                                                                const cx = pw * iL / 100 + elemW / 2; const cy = ph * iT / 100 + elemH / 2;
                                                                                const mL = Math.round((cx - (elemW / 2 - hPad) * sc) * 10) / 10;
                                                                                const mT = Math.round((cy - (elemH / 2 - vPad) * sc) * 10) / 10;
                                                                                const mR = Math.round((pw - cx - (elemW / 2 - hPad) * sc) * 10) / 10;
                                                                                const mB = Math.round((ph - cy - (elemH / 2 - vPad) * sc) * 10) / 10;
                                                                                const rW = Math.round((elemW - 2 * hPad) * sc * 10) / 10;
                                                                                const rH = Math.round((elemH - 2 * vPad) * sc * 10) / 10;
                                                                                return <span className="flex-1 text-xs font-mono text-gray-700 leading-snug truncate">↑{mT} ↓{mB} ←{mL} →{mR} | {rW}×{rH}cm</span>;
                                                                            }
                                                                            if (measurePositionOption === '꽉찬실사') {
                                                                                const productRatio = pw / ph; const imgRatio = measureImgNaturalRatio;
                                                                                let fmL = 0, fmT = 0, fmR = 0, fmB = 0;
                                                                                if (imgRatio > productRatio) { const overflow = ph * imgRatio - pw; fmL = Math.round(overflow * (measureFullOffset.x / 100) * 10) / 10; fmR = Math.round(overflow * (1 - measureFullOffset.x / 100) * 10) / 10; }
                                                                                else { const overflow = pw / imgRatio - ph; fmT = Math.round(overflow * (measureFullOffset.y / 100) * 10) / 10; fmB = Math.round(overflow * (1 - measureFullOffset.y / 100) * 10) / 10; }
                                                                                return <span className="flex-1 text-xs font-mono text-gray-700 leading-snug truncate">↑{fmT ? '-' + fmT : 0} ↓{fmB ? '-' + fmB : 0} ←{fmL ? '-' + fmL : 0} →{fmR ? '-' + fmR : 0} | {pw}×{ph}cm</span>;
                                                                            }
                                                                            if (measurePositionOption === '여백로고') {
                                                                                const sc = logoScale / 30;
                                                                                const elemW = pw * logoSize.w / 100; const elemH = ph * logoSize.h / 100;
                                                                                const elemR = elemW / elemH; const imgR = measureImgNaturalRatio || elemR;
                                                                                let hPad = 0, vPad = 0;
                                                                                if (imgR < elemR) { hPad = (elemW - elemH * imgR) / 2; } else { vPad = (elemH - elemW / imgR) / 2; }
                                                                                const cx = pw * logoPos.x / 100 + elemW / 2; const cy = ph * logoPos.y / 100 + elemH / 2;
                                                                                const lL = Math.round((cx - (elemW / 2 - hPad) * sc) * 10) / 10;
                                                                                const lT = Math.round((cy - (elemH / 2 - vPad) * sc) * 10) / 10;
                                                                                const lR = Math.round((pw - cx - (elemW / 2 - hPad) * sc) * 10) / 10;
                                                                                const lB = Math.round((ph - cy - (elemH / 2 - vPad) * sc) * 10) / 10;
                                                                                const lW = Math.round((elemW - 2 * hPad) * sc * 10) / 10;
                                                                                const lH = Math.round((elemH - 2 * vPad) * sc * 10) / 10;
                                                                                return <span className="flex-1 text-xs font-mono text-gray-700 leading-snug truncate">↑{lT} ↓{lB} ←{lL} →{lR} | {lW}×{lH}cm ({logoScale}%)</span>;
                                                                            }
                                                                            if (measurePositionOption === '고정로고') {
                                                                                const aW = Math.round(pw * fixedLogoScale / 100 * 10) / 10;
                                                                                const aH = Math.round(ph * fixedLogoScale / 100 * 10) / 10;
                                                                                const rR = Math.round((pw - fixedLogoPos.x - aW) * 10) / 10;
                                                                                const rB = Math.round((ph - fixedLogoPos.y - aH) * 10) / 10;
                                                                                return <span className="flex-1 text-xs font-mono text-gray-700 leading-snug truncate">↑{fixedLogoPos.y} ↓{rB} ←{fixedLogoPos.x} →{rR} | {aW}×{aH}cm ({fixedLogoScale}%)</span>;
                                                                            }
                                                                            return null;
                                                                        })()}
                                                                        <button onClick={() => { setShowMeasurePanel(false); }} className="w-5 h-5 flex items-center justify-center rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"><X size={12} /></button>
                                                                    </div>
                                                                    {/* 사이즈 + 카테고리 탭 */}
                                                                    <div className="flex items-center gap-2 flex-wrap">
                                                                        <span className="px-2 py-1 rounded bg-gray-100 text-[12px] font-bold text-gray-600 font-mono whitespace-nowrap">
                                                                            {modalForm.prodWidth || '0'} x {modalForm.prodHeight || '0'}
                                                                        </span>
                                                                        {['여백실사', '꽉찬실사', '여백로고', '고정로고'].map(opt => (
                                                                            <button key={opt} onClick={() => { setMeasurePositionOption(opt); const MAP: Record<string, string> = { '여백실사': 'MARGIN_MEASURE', '꽉찬실사': 'FULL_MEASURE', '여백로고': 'MARGIN_LOGO', '고정로고': 'FIXED_LOGO' }; handleMeasureCategoryChange(MAP[opt] || ''); }}
                                                                                className={`px-2 py-1 rounded text-[12px] font-bold transition-all border ${measurePositionOption === opt ? 'bg-purple-100 text-purple-700 border-purple-300' : 'bg-white text-gray-500 border-gray-200 hover:border-purple-300'}`}
                                                                            >{opt}</button>
                                                                        ))}
                                                                    </div>
                                                                    {/* 캔버스: 실사 위치 미리보기 */}
                                                                    <div className="flex-1 relative rounded-lg border-2 border-dashed border-purple-200 bg-purple-50/50 flex items-center justify-center mb-0 overflow-hidden">
                                                                        {(() => {
                                                                            const prodW = parseFloat(modalForm.prodWidth) || 100;
                                                                            const prodH = parseFloat(modalForm.prodHeight) || 100;
                                                                            const maxPct = 91;
                                                                            const ratio = prodW / prodH;
                                                                            let boxW: number, boxH: number;
                                                                            if (ratio >= 1) { boxW = maxPct; boxH = maxPct / ratio; } else { boxH = maxPct; boxW = maxPct * ratio; }
                                                                            const imgLeft = measureImgPos.x;
                                                                            const imgTop = measureImgPos.y;
                                                                            const imgW = measureImgSize.w;
                                                                            const imgH = measureImgSize.h;
                                                                            const sc = measureScale / 100;
                                                                            const elemW = prodW * imgW / 100;
                                                                            const elemH = prodH * imgH / 100;
                                                                            const elemR = elemW / elemH;
                                                                            const imgR = measureImgNaturalRatio || elemR;
                                                                            let hPad = 0, vPad = 0;
                                                                            if (imgR < elemR) { hPad = (elemW - elemH * imgR) / 2; }
                                                                            else { vPad = (elemH - elemW / imgR) / 2; }

                                                                            const handleMouseDown = (e: React.MouseEvent, mode: 'move' | 'nw' | 'ne' | 'sw' | 'se') => {
                                                                                e.preventDefault(); e.stopPropagation();
                                                                                const boxEl = (e.currentTarget as HTMLElement).closest('[data-prodbox]') as HTMLElement;
                                                                                if (!boxEl) return;
                                                                                const rect = boxEl.getBoundingClientRect();
                                                                                const startX = e.clientX; const startY = e.clientY;
                                                                                const startPos = { ...measureImgPos }; const startSize = { ...measureImgSize };
                                                                                const snapPx = 5;
                                                                                const snapPctX = (snapPx / rect.width) * 100;
                                                                                const snapPctY = (snapPx / rect.height) * 100;
                                                                                const onMove = (ev: MouseEvent) => {
                                                                                    const dx = ((ev.clientX - startX) / rect.width) * 100;
                                                                                    const dy = ((ev.clientY - startY) / rect.height) * 100;
                                                                                    if (mode === 'move') {
                                                                                        let nx = startPos.x + dx; let ny = startPos.y + dy;
                                                                                        const eW = startSize.w; const eH = startSize.h;
                                                                                        const eWcm = prodW * eW / 100; const eHcm = prodH * eH / 100;
                                                                                        const eR = eWcm / eHcm; const iR = measureImgNaturalRatio || eR;
                                                                                        let hPadPct = 0, vPadPct = 0;
                                                                                        if (iR < eR) { hPadPct = ((eWcm - eHcm * iR) / 2) / prodW * 100; }
                                                                                        else { vPadPct = ((eHcm - eWcm / iR) / 2) / prodH * 100; }
                                                                                        const contentHalfW = (eW / 2 - hPadPct) * sc;
                                                                                        const contentHalfH = (eH / 2 - vPadPct) * sc;
                                                                                        const cxPct = nx + eW / 2; const cyPct = ny + eH / 2;
                                                                                        const visLeft = cxPct - contentHalfW; const visTop = cyPct - contentHalfH;
                                                                                        if (Math.abs(visLeft) < snapPctX) nx = nx - visLeft;
                                                                                        if (Math.abs(visTop) < snapPctY) ny = ny - visTop;
                                                                                        const visRight2 = (nx + eW / 2) + contentHalfW;
                                                                                        const visBottom2 = (ny + eH / 2) + contentHalfH;
                                                                                        if (Math.abs(visRight2 - 100) < snapPctX) nx = nx - (visRight2 - 100);
                                                                                        if (Math.abs(visBottom2 - 100) < snapPctY) ny = ny - (visBottom2 - 100);
                                                                                        setMeasureImgPos({ x: nx, y: ny });
                                                                                    } else if (mode === 'se') {
                                                                                        setMeasureImgSize({ w: startSize.w + dx, h: startSize.h + dy });
                                                                                    } else if (mode === 'nw') {
                                                                                        const newX = startPos.x + dx; const newY = startPos.y + dy;
                                                                                        setMeasureImgPos({ x: newX, y: newY });
                                                                                        setMeasureImgSize({ w: Math.max(10, startPos.x + startSize.w - newX), h: Math.max(10, startPos.y + startSize.h - newY) });
                                                                                    } else if (mode === 'ne') {
                                                                                        const newY = startPos.y + dy;
                                                                                        setMeasureImgPos(p => ({ ...p, y: newY }));
                                                                                        setMeasureImgSize({ w: Math.max(10, startSize.w + dx), h: Math.max(10, startPos.y + startSize.h - newY) });
                                                                                    } else if (mode === 'sw') {
                                                                                        const newX = startPos.x + dx;
                                                                                        setMeasureImgPos(p => ({ ...p, x: newX }));
                                                                                        setMeasureImgSize({ w: Math.max(10, startPos.x + startSize.w - newX), h: Math.max(10, startSize.h + dy) });
                                                                                    }
                                                                                };
                                                                                const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
                                                                                window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp);
                                                                            };

                                                                            return (
                                                                                <div data-prodbox className={`rounded bg-cyan-100 border border-cyan-200 relative ${measurePositionOption === '꽉찬실사' ? 'overflow-hidden' : 'overflow-visible'}`} style={{ width: `${boxW}%`, height: `${boxH}%` }}>
                                                                                    {measurePositionOption === '여백실사' && modalForm.measureImageUrl && (
                                                                                        <>
                                                                                            <img src={modalForm.measureImageUrl} alt="" className="absolute object-contain cursor-move select-none"
                                                                                                style={{ left: `${imgLeft}%`, top: `${imgTop}%`, width: `${imgW}%`, height: `${imgH}%`, opacity: 0.15, transform: `scale(${measureScale / 100})`, transformOrigin: 'center center' }}
                                                                                                draggable={false} onMouseDown={(e) => handleMouseDown(e, 'move')}
                                                                                                onDoubleClick={() => { setMeasureImgPos({ x: 10, y: 10 }); setMeasureImgSize({ w: 80, h: 80 }); setMeasureScale(100); }}
                                                                                            />
                                                                                            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                                                                                                <img src={modalForm.measureImageUrl} alt="" className="absolute object-contain select-none"
                                                                                                    style={{ left: `${imgLeft}%`, top: `${imgTop}%`, width: `${imgW}%`, height: `${imgH}%`, transform: `scale(${measureScale / 100})`, transformOrigin: 'center center' }}
                                                                                                    draggable={false}
                                                                                                    onLoad={(e) => { const img = e.currentTarget; if (img.naturalWidth && img.naturalHeight) setMeasureImgNaturalRatio(img.naturalWidth / img.naturalHeight); }}
                                                                                                />
                                                                                            </div>
                                                                                        </>
                                                                                    )}
                                                                                    {measurePositionOption === '여백로고' && modalForm.measureImageUrl && (() => {
                                                                                        const lx = logoPos.x; const ly = logoPos.y; const lw = logoSize.w; const lh = logoSize.h;
                                                                                        const handleLogoDrag = (e: React.MouseEvent) => {
                                                                                            e.preventDefault(); e.stopPropagation();
                                                                                            const boxEl = (e.currentTarget as HTMLElement).closest('[data-prodbox]') as HTMLElement;
                                                                                            if (!boxEl) return;
                                                                                            const rect = boxEl.getBoundingClientRect();
                                                                                            const startX = e.clientX; const startY = e.clientY; const startPos = { ...logoPos };
                                                                                            const snapPx2 = 5; const snapPctX2 = (snapPx2 / rect.width) * 100; const snapPctY2 = (snapPx2 / rect.height) * 100;
                                                                                            const onMove = (ev: MouseEvent) => {
                                                                                                const dx2 = ((ev.clientX - startX) / rect.width) * 100; const dy2 = ((ev.clientY - startY) / rect.height) * 100;
                                                                                                let nx = startPos.x + dx2; let ny = startPos.y + dy2;
                                                                                                if (Math.abs(nx) < snapPctX2) nx = 0; if (Math.abs(ny) < snapPctY2) ny = 0;
                                                                                                const curScale = logoScale / 30; const imgWPct = lw * curScale; const imgHPct = lh * curScale;
                                                                                                if (Math.abs((nx + imgWPct) - 100) < snapPctX2) nx = 100 - imgWPct;
                                                                                                if (Math.abs((ny + imgHPct) - 100) < snapPctY2) ny = 100 - imgHPct;
                                                                                                setLogoPos({ x: nx, y: ny });
                                                                                            };
                                                                                            const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
                                                                                            window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp);
                                                                                        };
                                                                                        const handleLogoResize = (e: React.MouseEvent) => {
                                                                                            e.preventDefault(); e.stopPropagation();
                                                                                            const boxEl = (e.currentTarget as HTMLElement).closest('[data-prodbox]') as HTMLElement;
                                                                                            if (!boxEl) return;
                                                                                            const rect = boxEl.getBoundingClientRect();
                                                                                            const startX = e.clientX; const startY = e.clientY; const startSize = { ...logoSize };
                                                                                            const onMove = (ev: MouseEvent) => {
                                                                                                const dx2 = ((ev.clientX - startX) / rect.width) * 100; const dy2 = ((ev.clientY - startY) / rect.height) * 100;
                                                                                                setLogoSize({ w: Math.max(5, Math.min(40, startSize.w + dx2)), h: Math.max(5, Math.min(40, startSize.h + dy2)) });
                                                                                            };
                                                                                            const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
                                                                                            window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp);
                                                                                        };
                                                                                        return (
                                                                                            <>
                                                                                                <img src={modalForm.measureImageUrl} alt="" className="absolute object-contain cursor-move select-none"
                                                                                                    style={{ left: `${lx}%`, top: `${ly}%`, width: `${lw}%`, height: `${lh}%`, opacity: 0.15, transform: `scale(${logoScale / 30})`, transformOrigin: 'center center' }}
                                                                                                    draggable={false} onMouseDown={handleLogoDrag}
                                                                                                    onDoubleClick={() => { setLogoPos({ x: 35, y: 35 }); setLogoSize({ w: 30, h: 30 }); setLogoScale(30); }}
                                                                                                />
                                                                                                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                                                                                                    <img src={modalForm.measureImageUrl} alt="" className="absolute object-contain select-none"
                                                                                                        style={{ left: `${lx}%`, top: `${ly}%`, width: `${lw}%`, height: `${lh}%`, transform: `scale(${logoScale / 30})`, transformOrigin: 'center center' }}
                                                                                                        draggable={false}
                                                                                                    />
                                                                                                </div>
                                                                                            </>
                                                                                        );
                                                                                    })()}
                                                                                    {/* 고정로고 */}
                                                                                    {measurePositionOption === '고정로고' && modalForm.measureImageUrl && (() => {
                                                                                        const fLeftPct = (fixedLogoPos.x / prodW) * 100;
                                                                                        const fTopPct = (fixedLogoPos.y / prodH) * 100;
                                                                                        const fSizePct = fixedLogoScale;
                                                                                        const handleFixedLogoDrag = (e: React.MouseEvent) => {
                                                                                            e.preventDefault(); e.stopPropagation();
                                                                                            const imgEl = e.currentTarget as HTMLElement;
                                                                                            const boxEl2 = imgEl.closest('[data-prodbox]') as HTMLElement;
                                                                                            if (!boxEl2) return;
                                                                                            const rect = boxEl2.getBoundingClientRect();
                                                                                            const imgRect = imgEl.getBoundingClientRect();
                                                                                            const imgWCm = (imgRect.width / rect.width) * prodW;
                                                                                            const imgHCm = (imgRect.height / rect.height) * prodH;
                                                                                            const maxX = Math.max(0, prodW - imgWCm); const maxY = Math.max(0, prodH - imgHCm);
                                                                                            const startX = e.clientX; const startY = e.clientY; const startPos = { ...fixedLogoPos };
                                                                                            const snapPx3 = 5; const snapCmX = (snapPx3 / rect.width) * prodW; const snapCmY = (snapPx3 / rect.height) * prodH;
                                                                                            const onMove = (ev: MouseEvent) => {
                                                                                                const dxCm = ((ev.clientX - startX) / rect.width) * prodW;
                                                                                                const dyCm = ((ev.clientY - startY) / rect.height) * prodH;
                                                                                                let nx = Math.min(maxX, Math.max(0, startPos.x + dxCm));
                                                                                                let ny = Math.min(maxY, Math.max(0, startPos.y + dyCm));
                                                                                                if (Math.abs(nx) < snapCmX) nx = 0; if (Math.abs(ny) < snapCmY) ny = 0;
                                                                                                if (Math.abs(nx - maxX) < snapCmX) nx = maxX; if (Math.abs(ny - maxY) < snapCmY) ny = maxY;
                                                                                                setFixedLogoPos({ x: +nx.toFixed(1), y: +ny.toFixed(1) });
                                                                                            };
                                                                                            const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
                                                                                            window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp);
                                                                                        };
                                                                                        return (
                                                                                            <>
                                                                                                <img src={modalForm.measureImageUrl} alt="" className="absolute select-none cursor-move"
                                                                                                    style={{ left: `${fLeftPct}%`, top: `${fTopPct}%`, width: `${fSizePct}%`, height: 'auto', opacity: 0.15 }}
                                                                                                    draggable={false} onMouseDown={handleFixedLogoDrag}
                                                                                                />
                                                                                                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                                                                                                    <img src={modalForm.measureImageUrl} alt="" className="absolute select-none"
                                                                                                        style={{ left: `${fLeftPct}%`, top: `${fTopPct}%`, width: `${fSizePct}%`, height: 'auto' }}
                                                                                                        draggable={false}
                                                                                                    />
                                                                                                </div>
                                                                                            </>
                                                                                        );
                                                                                    })()}
                                                                                    {measurePositionOption === '꽉찬실사' && modalForm.measureImageUrl && (() => {
                                                                                        const handleFullDrag = (e: React.MouseEvent) => {
                                                                                            e.preventDefault(); e.stopPropagation();
                                                                                            const boxEl = (e.currentTarget as HTMLElement).closest('[data-prodbox]') as HTMLElement;
                                                                                            if (!boxEl) return;
                                                                                            const rect = boxEl.getBoundingClientRect();
                                                                                            const startX = e.clientX; const startY = e.clientY; const startOff = { ...measureFullOffset };
                                                                                            const onMove = (ev: MouseEvent) => {
                                                                                                const dx2 = ((ev.clientX - startX) / rect.width) * 100; const dy2 = ((ev.clientY - startY) / rect.height) * 100;
                                                                                                setMeasureFullOffset({ x: Math.max(0, Math.min(100, startOff.x - dx2)), y: Math.max(0, Math.min(100, startOff.y - dy2)) });
                                                                                            };
                                                                                            const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
                                                                                            window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp);
                                                                                        };
                                                                                        return (
                                                                                            <img src={modalForm.measureImageUrl} alt="" className="absolute inset-0 w-full h-full object-cover cursor-move select-none"
                                                                                                style={{ objectPosition: `${measureFullOffset.x}% ${measureFullOffset.y}%` }}
                                                                                                draggable={false} onMouseDown={handleFullDrag}
                                                                                                onLoad={(e) => { const img = e.currentTarget; if (img.naturalWidth && img.naturalHeight) setMeasureImgNaturalRatio(img.naturalWidth / img.naturalHeight); }}
                                                                                            />
                                                                                        );
                                                                                    })()}
                                                                                </div>
                                                                            );
                                                                        })()}
                                                                        {/* 꽉찬실사: 오버플로우 블러 배경 */}
                                                                        {measurePositionOption === '꽉찬실사' && modalForm.measureImageUrl && (
                                                                            <img src={modalForm.measureImageUrl} alt="" className="absolute inset-0 w-full h-full object-cover -z-10"
                                                                                style={{ filter: 'blur(6px) opacity(0.35)', objectPosition: `${measureFullOffset.x}% ${measureFullOffset.y}%` }}
                                                                                draggable={false}
                                                                            />
                                                                        )}
                                                                    </div>
                                                                    {/* 슬라이더 (여백실사/여백로고) */}
                                                                    {(measurePositionOption === '여백실사' || measurePositionOption === '여백로고') && modalForm.measureImageUrl && (
                                                                        <div className="relative flex items-center border border-purple-300 rounded bg-white px-2 py-0.5 mt-0.5">
                                                                            <input type="range" min={measurePositionOption === '여백로고' ? 5 : 10} max={measurePositionOption === '여백로고' ? 30 : 200} value={measurePositionOption === '여백실사' ? measureScale : logoScale}
                                                                                onChange={(e) => { const v = Number(e.target.value); if (measurePositionOption === '여백실사') setMeasureScale(v); else setLogoScale(v); }}
                                                                                className="flex-1 h-1.5 accent-purple-500 cursor-pointer" />
                                                                            <span className="ml-2 text-[10px] font-mono font-bold text-purple-600 whitespace-nowrap">{measurePositionOption === '여백실사' ? measureScale : logoScale}%</span>
                                                                        </div>
                                                                    )}
                                                                    {/* 고정로고: 좌/상 + 슬라이더 + 사이즈 */}
                                                                    {measurePositionOption === '고정로고' && modalForm.measureImageUrl && (() => {
                                                                        const prodW = parseFloat(modalForm.prodWidth) || 100; const prodH = parseFloat(modalForm.prodHeight) || 100;
                                                                        const actualW = (prodW * fixedLogoScale / 100); const actualH = (prodH * fixedLogoScale / 100);
                                                                        return (
                                                                            <div className="flex items-end gap-1 mt-0.5">
                                                                                <div className="flex flex-col items-center">
                                                                                    <label className="text-[7px] text-gray-400 font-bold">좌(cm)</label>
                                                                                    <input type="number" step="0.1" value={fixedLogoPos.x} onChange={(e) => setFixedLogoPos(p => ({ ...p, x: parseFloat(e.target.value) || 0 }))} className="w-14 text-center text-[10px] font-mono border border-purple-200 rounded px-1 py-0.5 focus:outline-none focus:border-purple-400" />
                                                                                </div>
                                                                                <div className="flex flex-col items-center">
                                                                                    <label className="text-[7px] text-gray-400 font-bold">상(cm)</label>
                                                                                    <input type="number" step="0.1" value={fixedLogoPos.y} onChange={(e) => setFixedLogoPos(p => ({ ...p, y: parseFloat(e.target.value) || 0 }))} className="w-14 text-center text-[10px] font-mono border border-purple-200 rounded px-1 py-0.5 focus:outline-none focus:border-purple-400" />
                                                                                </div>
                                                                                <div className="flex-1 flex items-center border border-purple-300 rounded bg-white px-2 py-0.5">
                                                                                    <input type="range" min={5} max={30} value={fixedLogoScale} onChange={(e) => setFixedLogoScale(Math.max(1, Math.min(30, Number(e.target.value))))} className="flex-1 h-1.5 accent-purple-500 cursor-pointer" />
                                                                                    <span className="ml-2 text-[10px] font-mono font-bold text-purple-600 whitespace-nowrap">{fixedLogoScale}%</span>
                                                                                </div>
                                                                                <div className="flex items-center px-1.5 py-0.5 rounded bg-purple-50 border border-purple-200">
                                                                                    <span className="text-[10px] font-mono font-bold text-purple-700 whitespace-nowrap">{actualW.toFixed(1)} × {actualH.toFixed(1)} cm</span>
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })()}
                                                                </div>

                                                                {/* 우측: 이미지 그리드 */}
                                                                <div className="col-span-3 row-span-2 overflow-y-auto">
                                                                    <div className="grid grid-cols-3 gap-2">
                                                                        {MOCK_MEASURE_IMAGES
                                                                            .filter(img => !measureSearchText || img.tags.some(t => t.toLowerCase().includes(measureSearchText.toLowerCase())))
                                                                            .map(img => (
                                                                                <button
                                                                                    key={img.id}
                                                                                    onClick={() => {
                                                                                        if (modalForm.measureImageId === String(img.id)) {
                                                                                            setModalForm(prev => {
                                                                                                const cuttingTotal = prev.unitPrice * (parseFloat(prev.quantity) || 1);
                                                                                                const optionTotal = calcOptionTotal(prev.selectedOptions || []);
                                                                                                const rawTotal = cuttingTotal + optionTotal;
                                                                                                const roundedTotal = Math.round(rawTotal / 10) * 10;
                                                                                                return { ...prev, measureImageId: '', measureImageName: '', measureImageUrl: '', measureCategory: '', measureUnitPrice: 0, price: String(roundedTotal) };
                                                                                            });
                                                                                        } else {
                                                                                            setModalForm(prev => {
                                                                                                const measureTotal = calcMeasurePrice(prev.measureCategory, prev.prodAppliedArea, prev.unitPrice, parseFloat(prev.quantity) || 1);
                                                                                                const cuttingTotal = prev.unitPrice * (parseFloat(prev.quantity) || 1);
                                                                                                const optionTotal = calcOptionTotal(prev.selectedOptions || []);
                                                                                                const rawTotal = cuttingTotal + measureTotal + optionTotal;
                                                                                                const roundedTotal = Math.round(rawTotal / 10) * 10;
                                                                                                return { ...prev, measureImageId: String(img.id), measureImageName: img.tags[0] || '', measureImageUrl: img.imageUrl || '', price: String(roundedTotal) };
                                                                                            });
                                                                                        }
                                                                                    }}
                                                                                    className={`relative rounded-lg overflow-hidden border-2 transition-all aspect-square ${modalForm.measureImageId === String(img.id) ? 'border-purple-500 shadow-lg ring-2 ring-purple-200' : 'border-gray-200 hover:border-purple-300'}`}
                                                                                >
                                                                                    <img src={img.imageUrl} alt={img.tags[0]} className="w-full h-full object-cover" loading="lazy" />
                                                                                    {modalForm.measureImageId === String(img.id) && (
                                                                                        <div className="absolute inset-0 bg-purple-500/20 flex items-center justify-center"><CheckCircle2 size={20} className="text-white drop-shadow" /></div>
                                                                                    )}
                                                                                </button>
                                                                            ))}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* 옵션 플레이스홀더 — 시스템이 없을 때만 */}
                                        {(!modalForm.productId || productSystemNodes.length === 0) && (
                                            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                                                <h4 className="text-xs font-bold text-blue-600 mb-2 flex items-center gap-1">
                                                    <Package size={14} /> 옵션 (시스템별 자동 로드)
                                                </h4>
                                                <p className="text-xs text-gray-400">상품을 선택하면 해당 시스템의 옵션이 여기에 표시됩니다.</p>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        {/* SECTION 3: Added Items List */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
                            <div className="px-6 py-3 border-b border-gray-200 flex justify-between items-center bg-gray-50/50 rounded-t-2xl">
                                <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                    <FileText size={16} /> 추가된 항목
                                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">0개</span>
                                </h3>
                            </div>
                            <div className="p-6">
                                <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-3">
                                    <Package size={48} className="opacity-20" />
                                    <p className="text-sm">추가된 항목이 없습니다. 위에서 상품을 선택하고 추가해주세요.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-8 py-4 border-t border-gray-200 flex items-center justify-between bg-white">
                        <div className="text-sm text-gray-500">
                            총 <span className="font-bold text-blue-700">0</span>개 항목 · 합계 <span className="font-bold text-blue-700 font-mono">0</span>원
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setIsAddItemModalOpen(false)}
                                className="px-6 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-200 transition-all"
                            >
                                취소
                            </button>
                            <button
                                onClick={() => setIsAddItemModalOpen(false)}
                                className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-sm"
                            >
                                견적에 추가
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // === NEW ESTIMATE POPUP HANDLERS ===
    const handleNewCustSearchChange = (q: string) => {
        setNewCustSearch(q);
        setNewCustSelectedExisting(null);
        if (!q.trim()) {
            setNewCustSearchResults([]);
            setNewCustMode('search');
            return;
        }
        // Search from existing estimates + localStorage customers
        const results: { id: string; name: string; phone: string; email: string; birthday: string; address: string; memo: string }[] = [];
        const seen = new Set<string>();
        // from estimates
        for (const est of estimates) {
            const key = est.customer.name + est.customer.phone;
            if (!seen.has(key) && (est.customer.name.includes(q) || est.customer.phone.includes(q))) {
                seen.add(key);
                results.push({ id: key, name: est.customer.name, phone: est.customer.phone, email: est.customer.email, birthday: est.customer.birthday, address: est.customer.address, memo: est.customer.memo });
            }
        }
        // from localStorage (CustomerManagement)
        try {
            const raw = localStorage.getItem('winterior_customers');
            if (raw) {
                const custs = JSON.parse(raw);
                for (const c of custs) {
                    const key = c.name + c.phone;
                    if (!seen.has(key) && (c.name.includes(q) || c.phone.includes(q))) {
                        seen.add(key);
                        results.push({ id: c.id || key, name: c.name, phone: c.phone, email: c.email || '', birthday: c.birthday || '', address: c.address || '', memo: c.memo || '' });
                    }
                }
            }
        } catch { }
        setNewCustSearchResults(results);
        if (results.length === 0) {
            setNewCustMode('input');
            setNewCustForm(prev => ({ ...prev, name: q }));
        } else {
            setNewCustMode('search');
        }
    };

    const handleNewCustSelectExisting = (cust: typeof newCustSearchResults[0]) => {
        setNewCustSelectedExisting(cust.id);
        setNewCustForm({
            name: cust.name, phone: cust.phone, email: cust.email,
            birthday: cust.birthday, birthdayType: 'solar', address: cust.address, memo: cust.memo
        });
    };

    const handleNewEstimateAdd = () => {
        if (!newCustForm.name.trim() || !newCustForm.phone.trim()) return;

        const birthdayStr = newCustForm.birthdayType === 'lunar' && newCustForm.birthday
            ? `(음)${newCustForm.birthday}` : newCustForm.birthday;

        const newEstimate: Estimate = {
            id: `est-${Date.now()}`,
            customer: {
                name: newCustForm.name, phone: newCustForm.phone,
                email: newCustForm.email, birthday: birthdayStr,
                address: newCustForm.address, memo: newCustForm.memo
            },
            estimateDate: new Date().toISOString().split('T')[0],
            totalAmount: 0,
            constructionDate: '', measureDate: '',
            deliveryType: 'construction',
            items: []
        };

        setEstimates(prev => [newEstimate, ...prev]);
        setSelectedEstimateId(newEstimate.id);
        setEditingCustomer(newEstimate.customer);
        setEditingDeliveryType('construction');

        // Save to localStorage for CustomerManagement sync
        if (!newCustSelectedExisting) {
            try {
                const raw = localStorage.getItem('winterior_customers');
                const custs = raw ? JSON.parse(raw) : [];
                custs.unshift({
                    id: `c${Date.now()}`, name: newCustForm.name, phone: newCustForm.phone,
                    email: newCustForm.email, birthday: birthdayStr,
                    address: newCustForm.address, memo: newCustForm.memo, images: [],
                    createdAt: new Date().toISOString().split('T')[0]
                });
                localStorage.setItem('winterior_customers', JSON.stringify(custs));
                window.dispatchEvent(new Event('winterior_customers_updated'));
            } catch { }
        }

        setIsNewEstimatePopupOpen(false);
    };

    // === FINAL RETURN ===
    return (
        <>
            {mainContent}
            {renderAddItemModal()}

            {/* New Estimate Customer Popup */}
            <AnimatePresence>
                {isNewEstimatePopupOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4"
                        onClick={() => setIsNewEstimatePopupOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-2xl shadow-2xl w-[520px] max-h-[90vh] overflow-hidden flex flex-col"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Popup Header */}
                            <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg"><User size={18} /></div>
                                    <h2 className="text-lg font-bold text-gray-800">신규 견적 - 고객 정보</h2>
                                </div>
                                <button onClick={() => setIsNewEstimatePopupOpen(false)} className="p-1.5 hover:bg-gray-200 rounded-lg transition-all">
                                    <X size={18} className="text-gray-500" />
                                </button>
                            </div>

                            {/* Popup Body */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                {/* Customer Search */}
                                <div>
                                    <label className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 uppercase mb-1.5">
                                        <Search size={12} /> 고객 검색
                                    </label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                        <input
                                            type="text"
                                            placeholder="고객명 또는 전화번호로 검색..."
                                            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-200 focus:bg-white transition-all"
                                            value={newCustSearch}
                                            onChange={e => handleNewCustSearchChange(e.target.value)}
                                        />
                                    </div>

                                    {/* Search Results */}
                                    {newCustMode === 'search' && newCustSearchResults.length > 0 && (
                                        <div className="mt-2 border border-gray-200 rounded-lg max-h-[150px] overflow-y-auto">
                                            {newCustSearchResults.map(r => (
                                                <div
                                                    key={r.id}
                                                    onClick={() => handleNewCustSelectExisting(r)}
                                                    className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-all border-b border-gray-50 last:border-b-0
                                                        ${newCustSelectedExisting === r.id ? 'bg-blue-50 border-l-2 border-l-blue-500' : 'hover:bg-gray-50'}`}
                                                >
                                                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                        <User size={14} className="text-gray-500" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <span className="text-sm font-bold text-gray-800">{r.name}</span>
                                                        <span className="text-xs text-gray-400 font-mono ml-2">{r.phone}</span>
                                                    </div>
                                                    {newCustSelectedExisting === r.id && <Check size={16} className="text-blue-600" />}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* No results message */}
                                    {newCustSearch.trim() && newCustSearchResults.length === 0 && (
                                        <div className="mt-2 text-xs text-orange-600 bg-orange-50 px-3 py-2 rounded-lg border border-orange-100">
                                            검색 결과가 없습니다. 아래에서 직접 입력해주세요.
                                        </div>
                                    )}

                                    {/* Switch to manual input button */}
                                    {newCustMode === 'search' && newCustSearchResults.length > 0 && (
                                        <button
                                            onClick={() => {
                                                setNewCustMode('input');
                                                setNewCustSelectedExisting(null);
                                                setNewCustForm(prev => ({ ...prev, name: newCustSearch }));
                                            }}
                                            className="mt-2 text-xs text-blue-600 hover:text-blue-800 font-bold transition-all"
                                        >
                                            + 새 고객으로 직접 입력
                                        </button>
                                    )}
                                </div>

                                {/* Customer Form Fields */}
                                {(newCustMode === 'input' || newCustSelectedExisting) && (
                                    <div className="space-y-3 pt-2 border-t border-gray-100">
                                        <div className="grid grid-cols-2 gap-3">
                                            {/* Name */}
                                            <div>
                                                <label className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 uppercase mb-1">
                                                    <User size={11} /> 고객명 <span className="text-red-400">*</span>
                                                </label>
                                                <input type="text" value={newCustForm.name}
                                                    onChange={e => setNewCustForm(p => ({ ...p, name: e.target.value }))}
                                                    placeholder="고객명"
                                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-200 focus:bg-white transition-all"
                                                />
                                            </div>
                                            {/* Phone */}
                                            <div>
                                                <label className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 uppercase mb-1">
                                                    <Phone size={11} /> 전화번호 <span className="text-red-400">*</span>
                                                </label>
                                                <input type="tel" value={newCustForm.phone}
                                                    onChange={e => setNewCustForm(p => ({ ...p, phone: e.target.value }))}
                                                    placeholder="010-0000-0000"
                                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-200 focus:bg-white transition-all"
                                                />
                                            </div>
                                            {/* Email */}
                                            <div>
                                                <label className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 uppercase mb-1">
                                                    <Mail size={11} /> 이메일
                                                </label>
                                                <input type="email" value={newCustForm.email}
                                                    onChange={e => setNewCustForm(p => ({ ...p, email: e.target.value }))}
                                                    placeholder="email@example.com"
                                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-200 focus:bg-white transition-all"
                                                />
                                            </div>
                                            {/* Birthday */}
                                            <div>
                                                <label className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 uppercase mb-1">
                                                    <Cake size={11} /> 생일
                                                </label>
                                                <div className="flex gap-1.5">
                                                    <input type="date" value={newCustForm.birthday}
                                                        onChange={e => setNewCustForm(p => ({ ...p, birthday: e.target.value }))}
                                                        className="flex-1 px-2 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-200 focus:bg-white transition-all"
                                                    />
                                                    <div className="flex rounded-lg border border-gray-200 overflow-hidden flex-shrink-0">
                                                        <button
                                                            onClick={() => setNewCustForm(p => ({ ...p, birthdayType: 'solar' }))}
                                                            className={`px-2.5 py-1.5 text-[11px] font-bold transition-all ${newCustForm.birthdayType === 'solar' ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                                                        >양</button>
                                                        <button
                                                            onClick={() => setNewCustForm(p => ({ ...p, birthdayType: 'lunar' }))}
                                                            className={`px-2.5 py-1.5 text-[11px] font-bold transition-all ${newCustForm.birthdayType === 'lunar' ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                                                        >음</button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        {/* Address */}
                                        <div>
                                            <label className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 uppercase mb-1">
                                                <MapPin size={11} /> 주소
                                            </label>
                                            <input type="text" value={newCustForm.address}
                                                onChange={e => setNewCustForm(p => ({ ...p, address: e.target.value }))}
                                                placeholder="주소를 입력하세요"
                                                className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-200 focus:bg-white transition-all"
                                            />
                                        </div>
                                        {/* Memo */}
                                        <div>
                                            <label className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 uppercase mb-1">
                                                <StickyNote size={11} /> 비고
                                            </label>
                                            <textarea value={newCustForm.memo}
                                                onChange={e => setNewCustForm(p => ({ ...p, memo: e.target.value }))}
                                                placeholder="비고 사항..."
                                                rows={2}
                                                className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-200 focus:bg-white transition-all resize-none"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Popup Footer */}
                            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-3">
                                <button
                                    onClick={() => setIsNewEstimatePopupOpen(false)}
                                    className="px-5 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-200 transition-all"
                                >취소</button>
                                <button
                                    onClick={handleNewEstimateAdd}
                                    disabled={!newCustForm.name.trim() || !newCustForm.phone.trim()}
                                    className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                                >추가</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default EstimateManagement;
