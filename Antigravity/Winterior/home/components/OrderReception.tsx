
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, User, FileText, X, ChevronRight, ChevronLeft, Plus, Minus, RefreshCw, Trash2, Edit, Check, AlertCircle, Package, Scroll, Scissors, Calendar, ChevronDown, Filter, Download, MapPin, CheckCircle2, Ruler, ToggleLeft, ToggleRight, Image as ImageIcon } from 'lucide-react';
import { usePartnerContext } from '../PartnerContext';
import { useProductContext } from './ProductContext';
import { MOCK_MEASURE_IMAGES } from '../constants';
import { NodeData } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import PremiumDatePicker from './PremiumDatePicker';
import { useAdminTheme } from './theme/AdminThemeContext';

// --- Mock Data Types ---
interface OrderData {
    id: string;
    inputTime: string;    // 입력시간
    partnerName: string;  // 거래처명
    ceoName: string;      // 대표자
    phone: string;        // 전화번호
    productName: string;  // 주문상품 (상품명 + 색상)
    shippingDate: string; // 출고일
    quantity: number;     // 주문량
    unit: string;         // 단위 (Roll/m)
    amount: number;       // 금액
    balance: number;      // 잔액
    inventory: number;    // 재고량
    destination: string;  // 도착지
    note: string;         // 비고
    width?: string;       // 규격 (New)
}

// --- Internal Type for Modal Item Entry ---
interface OrderItemEntry {
    id: string;
    inputTime: string;
    orderMode: 'FABRIC' | 'PRODUCT'; // 원단/제품 구분
    productId: string;
    productName: string;
    colorId: string;
    colorName: string;
    width: string;      // 폭 정보
    costItemId: string; // 선택된 원가 항목 ID
    unitType: 'ROLL' | 'CUT' | 'SLAT'; // 롤 or 절단 or 슬랫
    quantity: string;
    cuttingFee: string; // 절단비
    price: string;      // 최종 금액 (Total)
    unitPrice: number;  // 개당/m당 단가 (Actual)
    originalUnitPrice: number; // For Diff Display (Standard)
    shipDate: string;
    destination: string;
    note: string;
    // 제품 모드 전용 필드
    prodWidth: string;   // 가로 (mm)
    prodHeight: string;  // 세로 (mm)
    prodArea: number;    // 면적 (㎡)
    prodAppliedArea: number; // 적용면적 (basicArea 이상)
    prodCuttingUnit: string; // 단위 (SQM/WIDTH)
    sizeError: string;   // 사이즈 에러 메시지
    // 시스템/옵션 필드
    selectedSystemId: string;
    selectedSystemName: string;
    systemDrillPath: { id: string; name: string }[];  // 동적 드릴다운 경로
    selectedOptions: {
        id: string;
        name: string;
        checked: boolean;
        quantity: number;
        unitPrice: number;
        originalUnitPrice: number;
        unit: string;
        // 그룹 옵션 (자식이 있는 옵션)
        type: 'single' | 'group';  // single=리프, group=부모(자식중 택1)
        children?: { id: string; name: string; unitPrice: number; originalUnitPrice: number; unit: string }[];
        selectedChildId?: string;  // group일 때 선택된 자식 ID
    }[];
    // 실사 이미지 필드
    measureImageId: string;       // 선택된 실사 이미지 ID
    measureImageName: string;     // 실사 이미지명 (태그)
    measureImageUrl: string;      // 미리보기 URL
    measureCategory: string;      // 여백실사 | 꽉찬실사 | 여백로고 | 고정로고
    measureUnitPrice: number;     // 실사비 단가
    installLocation: string;      // 설치위치
    totalLength: number;           // ROLL 모드: 선택된 총 미터(m)
    selectedLots: { lotNo: string; length: number }[];  // ROLL 모드: 선택된 LOT 리스트
}

// --- Mock Data Generation ---
const MOCK_ORDERS: OrderData[] = Array.from({ length: 15 }).map((_, i) => ({
    id: `ord-${Date.now()}-${i}`,
    inputTime: `10:${30 + i}`,
    partnerName: i % 4 === 0 ? '(주)경동물류' : i % 4 === 1 ? '(주)나이스창' : i % 4 === 2 ? '햇살드림' : '(주)윈도우앤',
    ceoName: i % 4 === 0 ? '김준호' : i % 4 === 1 ? '이서준' : i % 4 === 2 ? '박지훈' : '최요한',
    phone: `010-${1000 + i}-${2000 + i}`,
    productName: i % 5 === 0 ? '블라인드 > 콤비 > 시드니 (화이트)' :
                 i % 5 === 1 ? '블라인드 > 콤비 > 파리 (블랙)' :
                 i % 5 === 2 ? '블라인드 > 롤 > 암막 (그레이)' :
                 i % 5 === 3 ? '커튼 > 린넨 > 내추럴 (아이보리)' :
                               '블라인드 > 콤비 > 런던 (베이지)',
    shippingDate: '2026-03-15',
    quantity: (i + 1) * 10,
    unit: 'Roll',
    amount: (i + 1) * 150000,
    balance: 5000000 - (i * 100000),
    inventory: 500 - (i * 10),
    destination: i % 3 === 0 ? '화물-대신화물-서원주지점' : i % 3 === 1 ? '화물-경동화물-수원지점' : '직배송-강남구 테헤란로 123',
    width: i % 3 === 0 ? '280 cm' : i % 3 === 1 ? '320 cm' : '210 cm',
    note: i === 0 ? '긴급 배송 요망' : '',
}));

interface OrderReceptionProps {
    rootId?: string;
}

const OrderReception: React.FC<OrderReceptionProps> = ({ rootId }) => {
    // Context
    const { partners } = usePartnerContext();
    const { nodes } = useProductContext();
    const { theme } = useAdminTheme();

    // rootId 기반 필터: rootId에서 childrenIds를 BFS로 순회하여 트리에 속한 모든 노드 ID 집합 구성
    const treeNodeIds = useMemo(() => {
        const visited = new Set<string>();

        const bfs = (startId: string) => {
            if (!nodes[startId]) return;
            const queue = [startId];
            while (queue.length > 0) {
                const id = queue.shift()!;
                if (visited.has(id)) continue;
                visited.add(id);
                const node = nodes[id];
                if (node?.childrenIds) {
                    node.childrenIds.forEach((childId: string) => queue.push(childId));
                }
            }
        };

        // 1. rootId가 직접 존재하면 사용
        if (rootId && nodes[rootId]) {
            bfs(rootId);
            return visited.size > 0 ? visited : null;
        }

        // 2. rootId가 없으면 파트너 ID 추출하여 동적 탐색 (파트너 트리만 사용)
        if (rootId) {
            const partnerIdMatch = rootId.match(/root-partner-(.+)/);
            if (partnerIdMatch) {
                const partnerId = partnerIdMatch[1];
                const EXCLUDED = ['1768350630954', '1768350652484', '1770804399939'];
                Object.keys(nodes).forEach(key => {
                    const n = nodes[key];
                    if (n.type === 'ROOT' && key.includes(partnerId) && !EXCLUDED.some(ex => key.includes(ex))) {
                        bfs(key);
                    }
                });
            }
        }

        return visited.size > 0 ? visited : null;
    }, [rootId, nodes]);

    const isUnderRoot = (node: any): boolean => {
        if (!treeNodeIds) return true;
        return treeNodeIds.has(node.id);
    };

    // Main Page State
    const [currentDate, setCurrentDate] = useState<Date>(new Date());
    const [searchQuery, setSearchQuery] = useState('');
    const [orderList, setOrderList] = useState<OrderData[]>([]);
    // Load Data & Listen for External Updates (e.g. from DataBackupManager)
    useEffect(() => {
        const loadFromStorage = () => {
            try {
                const saved = localStorage.getItem('winterior_orders');
                if (!saved) {
                    setOrderList(MOCK_ORDERS);
                    return;
                }
                const parsed = JSON.parse(saved);
                if (!Array.isArray(parsed)) {
                    setOrderList(MOCK_ORDERS);
                    return;
                }
                // If explicit empty array, use it. Otherwise filter.
                if (parsed.length === 0) {
                    setOrderList([]);
                } else {
                    setOrderList(parsed.filter(item => item && typeof item === 'object'));
                }
            } catch (e) { setOrderList(MOCK_ORDERS); }
        };

        // Initial Load
        loadFromStorage();

        // Listener
        const handleDataChange = () => loadFromStorage();
        window.addEventListener('orderDataChanged', handleDataChange);
        return () => window.removeEventListener('orderDataChanged', handleDataChange);
    }, []);

    // Save to LocalStorage (Only when orderList changes)
    useEffect(() => {
        if (orderList.length > 0 || localStorage.getItem('winterior_orders') === '[]') {
            localStorage.setItem('winterior_orders', JSON.stringify(orderList));
        }
    }, [orderList]);

    // --- Modal State (Registration) ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [orderInputMode, setOrderInputMode] = useState<'FABRIC' | 'PRODUCT'>('FABRIC');

    // --- Modal State (Detail/Edit) ---
    const [selectedDetailOrder, setSelectedDetailOrder] = useState<OrderData | null>(null);

    // Modal: Partner Selection
    const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
    const [partnerSearch, setPartnerSearch] = useState('');
    const [showPartnerResults, setShowPartnerResults] = useState(false);
    const [partnerSectionCollapsed, setPartnerSectionCollapsed] = useState(false);
    const [partnerDropdownRect, setPartnerDropdownRect] = useState<{ top: number; left: number; width: number; openUp: boolean } | null>(null);
    const shippingInfoRef = useRef<HTMLDivElement>(null);
    const partnerSearchWrapperRef = useRef<HTMLDivElement>(null);
    const [shippingInfoHeight, setShippingInfoHeight] = useState(0);
    const productInputRowsRef = useRef<HTMLDivElement>(null);
    const [productInputRowsHeight, setProductInputRowsHeight] = useState(500);

    // 배송정보/제품입력 영역 높이 측정
    useEffect(() => {
        if (shippingInfoRef.current) {
            const h = shippingInfoRef.current.offsetHeight;
            setShippingInfoHeight(h);
        }
        if (productInputRowsRef.current && !showMeasurePanel) {
            const h = productInputRowsRef.current.scrollHeight;
            setProductInputRowsHeight(h);
        }
    });

    // 거래처 검색 드롭다운 외부 클릭 & ESC 키 닫기
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (partnerSearchWrapperRef.current && !partnerSearchWrapperRef.current.contains(e.target as Node)) {
                setShowPartnerResults(false);
            }
        };
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setShowPartnerResults(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    // Modal: Product Entry Form
    const initialFormState: OrderItemEntry = {
        id: '', inputTime: '', orderMode: orderInputMode, productId: '', productName: '', colorId: '', colorName: '',
        width: '', costItemId: '',
        unitType: 'ROLL', quantity: '', cuttingFee: '0', price: '', unitPrice: 0, originalUnitPrice: 0,
        shipDate: new Date().toISOString().split('T')[0], destination: '', note: '',
        prodWidth: '', prodHeight: '', prodArea: 0, prodAppliedArea: 0, prodCuttingUnit: '', sizeError: '',
        selectedSystemId: '', selectedSystemName: '', systemDrillPath: [], selectedOptions: [],
        measureImageId: '', measureImageName: '', measureImageUrl: '', measureCategory: '', measureUnitPrice: 0,
        installLocation: '',
        totalLength: 0,
        selectedLots: []
    };
    const [itemForm, setItemForm] = useState<OrderItemEntry>(initialFormState);

    // Check Stock Logic
    const [currentStock, setCurrentStock] = useState<{ qty: number, length: number } | null>(null);
    const [stockLots, setStockLots] = useState<{ id: string, lotNo: string, length: number, qty: number }[]>([]);
    const [selectedLotIds, setSelectedLotIds] = useState<Set<string>>(new Set());
    const [showLotDropdown, setShowLotDropdown] = useState(false);

    // Search States for Form
    const [productSearch, setProductSearch] = useState('');
    const [showProductResults, setShowProductResults] = useState(false);
    const [debugData, setDebugData] = useState<any>({});

    // -- Derived State: Available Stock Items (Replicated from StockAdjustment.tsx) --
    const availableProducts = useMemo(() => {
        // SalesPriceManagement의 traverseAdmin 방식과 정확히 동일한 로직
        const supplierId = 'f1';

        // 원가 확인 함수 — SalesPriceManagement와 동일 (cost_fabric/cutting/measure만, cost_parts 제외)
        const checkHasCost = (n: any, costKey: string): boolean => {
            try {
                if (n?.attributes?.[costKey]) {
                    const list = JSON.parse(n.attributes[costKey]);
                    if (Array.isArray(list) && list.length > 0) return true;
                }
            } catch (e) { }
            return false;
        };

        const rows: { id: string; displayLabel: string; label: string;[key: string]: any }[] = [];
        const seen = new Set<string>();

        // SalesPriceManagement traverseAdmin 로직 그대로
        const traverseAdmin = (nodeId: string, pathStr: string) => {
            const node = nodes[nodeId];
            if (!node) return;
            const currentPath = pathStr ? `${pathStr} > ${node.label}` : node.label;

            // cost_fabric_list, cost_cutting_list, cost_measure_list 중 하나라도 있으면 상품 목록에 추가
            const costKeys = ['cost_fabric_list', 'cost_cutting_list', 'cost_measure_list'];
            let hasCost = false;
            for (const costKey of costKeys) {
                hasCost = checkHasCost(node, costKey);
                // sourceIds에서도 확인
                if (!hasCost && node.sourceIds && Array.isArray(node.sourceIds)) {
                    for (const srcId of node.sourceIds as string[]) {
                        if (checkHasCost(nodes[srcId], costKey)) { hasCost = true; break; }
                    }
                }
                // originalSourceId에서도 확인
                if (!hasCost && node.attributes?.originalSourceId) {
                    hasCost = checkHasCost(nodes[node.attributes.originalSourceId], costKey);
                }
                if (hasCost) break;
            }

            if (hasCost) {
                const normalizedKey = currentPath.replace(/\s+/g, '');
                if (!seen.has(normalizedKey)) {
                    seen.add(normalizedKey);
                    rows.push({ ...node, displayLabel: currentPath, label: node.label });
                }
            }

            // 원가 있어도 자식 노드 계속 순회 (SalesPriceManagement와 동일)
            if (node.childrenIds && node.childrenIds.length > 0) {
                node.childrenIds.forEach((childId: string) => traverseAdmin(childId, currentPath));
            }
            if (node.sourceIds && node.sourceIds.length > 0) {
                (node.sourceIds as string[]).forEach(srcId => {
                    const src = nodes[srcId];
                    if (src && src.childrenIds) {
                        src.childrenIds.forEach((childId: string) => traverseAdmin(childId, currentPath));
                    }
                });
            }
        };

        // SalesPriceManagement와 동일: root-f1 있으면 거기서, 없으면 rootId에서
        const startNodeId = nodes[`root-${supplierId}`] ? `root-${supplierId}` : rootId;
        const startNode = startNodeId ? nodes[startNodeId] : null;
        if (startNode) {
            startNode.childrenIds?.forEach((childId: string) => traverseAdmin(childId, ''));
        }

        console.log('[availableProducts] 원가 설정 상품 목록:', rows.length, rows.map(r => r.displayLabel));
        return rows;
    }, [nodes, rootId]);
    const [colorSearch, setColorSearch] = useState(''); // Optional if we want to search colors
    const [showColorDropdown, setShowColorDropdown] = useState(false);
    const [showWidthDropdown, setShowWidthDropdown] = useState(false); // New Width Dropdown State
    const [showMeasurePanel, setShowMeasurePanel] = useState(false); // 실사 선택 패널 토글
    const [measureSettingExpanded, setMeasureSettingExpanded] = useState(false); // 실사위치 설정 카드 확장
    const [measurePositionOption, setMeasurePositionOption] = useState('여백실사'); // 실사 위치 옵션
    const [measureSearchText, setMeasureSearchText] = useState(''); // 실사 검색어
    // 실사 이미지 위치/사이즈 (제품박스 기준 %)
    const [measureImgPos, setMeasureImgPos] = useState({ x: 10, y: 10 }); // left%, top%
    const [measureImgSize, setMeasureImgSize] = useState({ w: 80, h: 80 }); // width%, height%
    const [measureScale, setMeasureScale] = useState(100); // 스케일 % (10~200)
    // 꽉찬실사 오프셋 (object-position %)
    const [measureFullOffset, setMeasureFullOffset] = useState({ x: 50, y: 50 });
    const [measureImgNaturalRatio, setMeasureImgNaturalRatio] = useState(1); // 이미지 원본 가로/세로 비율 (w/h)
    // 여백로고 위치/사이즈 (제품박스 기준 %)
    const [logoPos, setLogoPos] = useState({ x: 35, y: 35 }); // left%, top%
    const [logoSize, setLogoSize] = useState({ w: 30, h: 30 }); // width%, height% (base)
    const [logoScale, setLogoScale] = useState(30); // 실제 크기 % (5~30)
    // 고정로고 위치/배율
    const [fixedLogoPos, setFixedLogoPos] = useState({ x: 0, y: 0 }); // left cm, top cm
    const [fixedLogoScale, setFixedLogoScale] = useState(10); // 배율 % (제품 사이즈 대비)

    const [isEditingItem, setIsEditingItem] = useState(false);

    const [showDatePicker, setShowDatePicker] = useState(false);

    // Mock Data for Order List
    const [newOrderItems, setNewOrderItems] = useState<OrderItemEntry[]>([]);
    const [expandedItemIds, setExpandedItemIds] = useState<Set<string>>(new Set());
    const [contentPreview, setContentPreview] = useState<{ nodeId: string; name: string; contents: { id: string; type: string; url: string; name: string }[] } | null>(null);

    // --- Helpers: Supplier Default Margins ---
    const supplierId = 'f1';
    const supplier = useMemo(() => partners.find(p => p.id === supplierId), [partners]);
    const defaultGradeMargins = useMemo(() => supplier?.gradeMargins || [
        { id: 'def-a', grade: 'A', margin: '15' },
        { id: 'def-b', grade: 'B', margin: '20' },
        { id: 'def-c', grade: 'C', margin: '25' },
        { id: 'def-d', grade: 'D', margin: '30' },
    ], [supplier]);

    // --- Helpers: Flatten Product List for Search ---
    // SalesPriceManagement의 traverseAdmin 방식과 동일하게
    // root-f1 트리를 순회하며 원가가 직접 설정된 상품만 수집
    const productList = useMemo(() => {
        const list: { id: string, label: string, node: NodeData }[] = [];
        const supplierId = 'f1';

        // 원가 확인 함수 (직접 설정된 원가만, 폴백 없음)
        const checkHasCost = (n: any): boolean => {
            const costKeys = ['cost_fabric_list', 'cost_cutting_list', 'cost_measure_list', 'cost_parts_list'];
            for (const key of costKeys) {
                try {
                    if (n?.attributes?.[key]) {
                        const val = JSON.parse(n.attributes[key]);
                        if (Array.isArray(val) && val.length > 0) return true;
                        if (typeof val === 'object' && val !== null && Object.keys(val).length > 0) return true;
                    }
                } catch { }
            }
            return false;
        };

        // SalesPriceManagement의 traverseAdmin과 동일한 트리 순회 함수
        const traverseAdmin = (nodeId: string, pathStr: string) => {
            const node = nodes[nodeId];
            if (!node) return;
            const currentPath = pathStr ? `${pathStr} > ${node.label}` : node.label;

            // 원가가 있으면 이 노드를 상품으로 등록
            if (checkHasCost(node)) {
                list.push({ id: node.id, label: currentPath, node });
                return; // 색상/자식 노드로 내려가지 않음
            }

            // 자식 노드 순회
            if (node.childrenIds && node.childrenIds.length > 0) {
                node.childrenIds.forEach(childId => traverseAdmin(childId, currentPath));
            }
            // sourceIds의 자식 노드 순회 (가상 자식)
            if (node.sourceIds && node.sourceIds.length > 0) {
                node.sourceIds.forEach(srcId => {
                    const src = nodes[srcId];
                    if (src && src.childrenIds) {
                        src.childrenIds.forEach(childId => traverseAdmin(childId, currentPath));
                    }
                });
            }
        };

        // root-f1 에서 시작하여 트리를 순회
        const startNodeId = `root-${supplierId}`;
        const startNode = nodes[startNodeId];
        if (startNode) {
            startNode.childrenIds.forEach(childId => traverseAdmin(childId, ''));
        }

        // 중복 경로 제거 (seen set)
        const seen = new Set<string>();
        const dedupedList: typeof list = [];
        for (const item of list) {
            const normalizedKey = item.label.replace(/\s+/g, '');
            if (!seen.has(normalizedKey)) {
                seen.add(normalizedKey);
                dedupedList.push(item);
            }
        }

        console.log('Product Search Debug (tree traversal):', {
            rootId,
            startNodeId,
            finalList: dedupedList.length,
            sample: dedupedList.slice(0, 10).map(l => l.label)
        });

        return dedupedList;
    }, [nodes, rootId]);



    // --- Helpers: Get Colors for Selected Product (STRICT FILTERING) ---
    const availableColors = useMemo(() => {
        if (!itemForm.productId) return [];
        const productNode = nodes[itemForm.productId];
        if (!productNode) return [];

        const effectiveSourceId = productNode.sourceIds && productNode.sourceIds.length > 0 ? productNode.sourceIds[0] : null;
        const sourceNode = effectiveSourceId ? nodes[effectiveSourceId] : null;

        let excludedIds: string[] = [];
        try {
            if (productNode.attributes?.excludedIds) {
                const parsed = typeof productNode.attributes.excludedIds === 'string'
                    ? JSON.parse(productNode.attributes.excludedIds)
                    : productNode.attributes.excludedIds;
                excludedIds = parsed;
            }
        } catch (e) { }

        const candidates: NodeData[] = [];
        productNode.childrenIds.forEach(id => { if (nodes[id]) candidates.push(nodes[id]); });
        if (sourceNode) {
            sourceNode.childrenIds.forEach(id => { if (nodes[id]) candidates.push(nodes[id]); });
        }

        const uniqueColors = new Map<string, any>();
        candidates.forEach(node => {
            if (excludedIds.includes(node.id)) return;
            if (node.attributes?.nodeType === 'color' || node.attributes?.color) {
                if (!uniqueColors.has(node.id)) {
                    uniqueColors.set(node.id, { id: node.id, label: node.label, color: node.attributes?.color });
                }
            }
        });

        return Array.from(uniqueColors.values());
    }, [itemForm.productId, nodes]);

    // --- Helpers: Get Widths (Cost Items) for Selected Product (STRICT FILTERING) ---
    const availableWidths = useMemo(() => {
        if (!nodes || !itemForm.productId) return [];
        const productNode = nodes[itemForm.productId];
        if (!productNode) return [];

        try {
            // productNode(원단공급사 직접 설정값)를 1순위로 사용
            // sourceNode 우선이었을 때 원본 트리의 200cm 등 오래된 데이터가 사용되는 버그 수정
            let costsStr = null; // Start null

            let dataNode = productNode;

            // 1. productNode 자체에 cost_fabric_list가 있으면 최우선 사용
            if (productNode.attributes?.cost_fabric_list) {
                costsStr = productNode.attributes.cost_fabric_list;
            }

            // 2. productNode에 없으면 Source Node Fallback
            if (!costsStr && productNode.sourceIds && productNode.sourceIds.length > 0) {
                const sourceNode = nodes[productNode.sourceIds[0]];
                if (sourceNode) {
                    dataNode = sourceNode;
                    if (sourceNode.attributes?.cost_fabric_list) {
                        costsStr = sourceNode.attributes.cost_fabric_list;
                    }
                }
            }

            // 2. Fallback for Detached Copies (No Source ID but clearly a copy)
            if (dataNode === productNode && !costsStr) {
                // If current node is a 'copy-' and has no cost list (or suspicious data), try to find original.
                // Even if it HAS a cost list, if it's 'copy-' and detached, it might be stale. 
                // Let's look for a name match in the Standard Tree.

                const currentLabel = productNode.label;
                const parentNode = nodes[productNode.parentId || ''];
                const parentLabel = parentNode?.label;

                if (currentLabel && parentLabel) {
                    const allNodes = Object.values(nodes);
                    const standardMatch = allNodes.find((n: any) => {
                        // 1. Match Name
                        if (n.label !== currentLabel) return false;
                        // 2. Match Parent Name
                        const p = nodes[n.parentId];
                        if (!p || p.label !== parentLabel) return false;
                        // 3. Must NOT be the current node
                        if (n.id === productNode.id) return false;
                        // 4. Must NOT be a 'copy-' (Standard nodes usually 'prod-', 'c-' etc or just check ID)
                        //    And should not be in a Partner Tree (Partner trees usually have 'ptn-' or 'root-...' ancestors, but simplifying: ID check)
                        if (n.id.startsWith('copy-')) return false;

                        // 5. Must have cost list
                        // return !!n.attributes?.cost_fabric_list;
                        return true; // Just find the node first
                    });

                    if (standardMatch) {
                        console.log('Found Standard Match for Detached Copy:', standardMatch.id);
                        dataNode = standardMatch;
                        if (standardMatch.attributes?.cost_fabric_list) {
                            costsStr = standardMatch.attributes.cost_fabric_list;
                        }
                    }
                }
            }

            // 3. Last Resort: Local Node
            if (!costsStr) {
                costsStr = productNode.attributes?.cost_fabric_list;
            }

            const costs = JSON.parse(costsStr || '[]');

            let allowedIds: Set<string> | null = null;
            if (itemForm.colorId) {
                const colorNode = nodes[itemForm.colorId];
                if (colorNode?.attributes?.availableWidths) {
                    try {
                        const parsed = JSON.parse(colorNode.attributes.availableWidths);
                        if (Array.isArray(parsed) && parsed.length > 0) {
                            allowedIds = new Set(parsed.map((id: any) => String(id)));
                        }
                    } catch (e) { }
                }
            }

            // Strict Filter: Only allow widths present in allowedIds
            let filtered = costs;
            if (allowedIds) {
                filtered = costs.filter((c: any) => allowedIds!.has(String(c.id)));
            } else {
                // allowedIds가 없으면 (색상에 availableWidths 미설정) 전체 규격 표시
                // 롤백 등으로 availableWidths 속성이 사라진 경우 대응
            }


            // If the Selected Node (productNode) implies a specific variant (e.g. Parent is "55mm"),
            // try to filter the Source Costs to match that variant.
            if (productNode.parentId && nodes[productNode.parentId]) {
                const parentLabel = nodes[productNode.parentId].label;
                const normalize = (s: string) => s.replace(/\s+/g, '').toLowerCase();
                const parentKey = normalize(parentLabel);

                // Detect Size Context
                if (parentKey.includes('25mm') || parentKey.includes('35mm') || parentKey.includes('50mm') || parentKey.includes('55mm')) {
                    // Check if filterable (cost items have matching width/category)
                    // Note: Cost items usually have 'width' property like "25mm", "35mm" or just numbers "25", "35".
                    const hasMatchingWidth = filtered.some((c: any) => c.width && normalize(String(c.width)).includes(parentKey));

                    if (hasMatchingWidth) {
                        console.log(`[ContextFilter] Filtering costs for context '${parentLabel}'`);
                        filtered = filtered.filter((c: any) => c.width && normalize(String(c.width)).includes(parentKey));
                    }
                }
            }

            console.log(`[Debug] availableWidths for ${productNode.label} (Parent: ${nodes[productNode.parentId]?.label})`, filtered);
            return filtered.map((c: any) => ({
                id: c.id,
                width: c.width || '기본',
                title: c.title,
                rollPrice: c.rollPrice,
                meterPrice: c.meterPrice,
                cuttingPrice: c.cuttingPrice,
                cuttingMeterPrice: c.cuttingMeterPrice,
                rollLength: c.rollLength,
                category: c.category
            }));
        } catch (e) {
            console.error("Error parsing/filtering costs:", e);
        }

        return [];
    }, [itemForm.productId, itemForm.colorId, nodes]);



    // --- Derived State for Date Display (Main Page) ---
    const formattedDateStr = useMemo(() => {
        const y = currentDate.getFullYear();
        const m = String(currentDate.getMonth() + 1).padStart(2, '0');
        const d = String(currentDate.getDate()).padStart(2, '0');
        return `${y}. ${m}. ${d}`;
    }, [currentDate]);

    const relativeDateStr = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const target = new Date(currentDate);
        target.setHours(0, 0, 0, 0);

        const diffTime = target.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return "오늘";
        return diffDays > 0 ? `오늘 +${diffDays}` : `오늘 ${diffDays}`;
    }, [currentDate]);

    // Stats & Filtered List (Main Page)
    const stats = useMemo(() => {
        const totalCount = orderList.length;
        const totalQty = orderList.reduce((acc, cur) => acc + (cur?.quantity || 0), 0);
        const uniquePartners = new Set(orderList.map(o => o?.partnerName || '')).size;
        const uniqueProducts = new Set(orderList.map(o => o?.productName || '')).size;
        return { totalCount, totalQty, uniquePartners, uniqueProducts };
    }, [orderList]);

    const filteredList = useMemo(() => {
        if (!searchQuery) return orderList;
        return orderList.filter(o =>
            (o?.partnerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (o?.productName || '').toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [searchQuery, orderList]);

    // --- Modal Logic ---
    const selectedPartnerData = useMemo(() => {
        return partners.find(p => p.id === selectedPartnerId);
    }, [selectedPartnerId, partners]);

    const filteredPartners = useMemo(() => {
        if (!partnerSearch) return [];
        return partners.filter(p => p.partnerName.includes(partnerSearch));
    }, [partnerSearch, partners]);

    const filteredProducts = useMemo(() => {
        if (!productSearch) return [];
        return productList.filter(p => p.label.includes(productSearch));
    }, [productSearch, productList]);

    // --- PRICING LOGIC ---
    useEffect(() => {
        // Must have product, partner, AND CostItem (Width) selected
        if (!nodes || !itemForm.productId || !selectedPartnerData || !itemForm.costItemId) return;

        const productNode = nodes[itemForm.productId];
        const grade = selectedPartnerData.grade || 'B'; // Default to B if undefined
        const qty = parseFloat(itemForm.quantity) || 0;

        // 1. Get Standard Costs from Selected Cost Item
        const costItem = availableWidths.find(w => w.id === itemForm.costItemId);
        if (!costItem) return;

        const stdRollPrice = parseFloat(costItem.rollPrice?.replace(/,/g, '') || '0');
        const stdMeterPrice = parseFloat(costItem.meterPrice?.replace(/,/g, '') || '0');
        const stdCuttingPrice = parseFloat(costItem.cuttingPrice?.replace(/,/g, '') || '0');
        const stdCuttingMeterPrice = parseFloat(costItem.cuttingMeterPrice?.replace(/,/g, '') || '0');
        const costItemId = itemForm.costItemId;


        let margin = 0;
        const gradeDef = defaultGradeMargins.find(g => g.grade === grade);
        if (gradeDef) {
            margin = parseFloat(gradeDef.margin);
        }

        // [DEBUG] Pricing Trace
        console.log('[PriceCalc] Start', {
            product: itemForm.productName,
            unitType: itemForm.unitType,
            costItemId,
            stdRollPrice,
            grade,
            initialMargin: margin
        });

        // Resolve the Node that holds the Sales Data (Standard/Source Node)
        // We reuse the same logic as availableWidths to ensuring matching.
        let dataNode = productNode;
        let localDataFound = false;

        // [DEBUG] Hoist duplicates for global access
        const allNodesArr = Object.values(nodes);
        const duplicates = allNodesArr.filter((n: any) => n.label === productNode.label);

        // 0. PRE-CHECK: Does the Local Node (Partner Copy) have the sales data?
        // If SalesPriceManagement saves to the Partner Copy, we must use it!
        if (productNode.attributes?.sales_price_fabric) {
            try {
                const localSales = JSON.parse(productNode.attributes.sales_price_fabric);

                // [DEBUG] Duplicate Detector (Already calculated above)
                // const allNodesArr = ... 
                // const duplicates = ...
                if (duplicates.length > 1) {
                    console.warn('[PriceCalc] DUPLICATE PRODUCTS DETECTED:', duplicates.map((d: any) => ({
                        id: d.id,
                        label: d.label,
                        parentId: d.parentId,
                        parentLabel: d.parentId ? nodes[d.parentId]?.label : 'Unknown',
                        hasSalesData: !!d.attributes?.sales_price_fabric
                    })));

                    // Attach to debug data
                    setDebugData(prev => ({
                        ...prev,
                        duplicatesFound: duplicates.map((d: any) => ({
                            id: d.id,
                            parent: d.parentId ? nodes[d.parentId]?.label : '?',
                            hasSales: !!d.attributes?.sales_price_fabric
                        }))
                    }));
                }

                // Check 1: Direct ID Match
                if (localSales[itemForm.costItemId]) {
                    localDataFound = true;
                    console.log('[PriceCalc] Local Node has Sales Data (Direct ID)', { nodeId: productNode.id });
                }
                // Check 2: Width Match (if IDs diverged)
                else {
                    const selectedWidth = availableWidths.find(w => w.id === itemForm.costItemId)?.width;
                    if (selectedWidth) {
                        const localCosts = JSON.parse(productNode.attributes.cost_fabric_list || '[]');
                        const widthMatch = localCosts.find((c: any) => c.width === selectedWidth);
                        if (widthMatch && localSales[widthMatch.id]) {
                            localDataFound = true;
                            // Just flag it here, ID remapping logic below will handle the lookupId
                            console.log('[PriceCalc] Local Node has Sales Data (Width Match)', { nodeId: productNode.id, matchId: widthMatch.id });
                        }
                    }
                }
            } catch (e) { }
        }

        if (!localDataFound) {
            // 1. Try Source Node First
            if (productNode.sourceIds && productNode.sourceIds.length > 0) {
                const sourceNode = nodes[productNode.sourceIds[0]];
                if (sourceNode) {
                    console.log('[PriceCalc] Using Source Node for Sales Data', { sourceId: sourceNode.id, originalId: productNode.id });
                    dataNode = sourceNode;
                }
            }
        }

        // 2. Fallback for Detached Copies (No Source ID but clearly a copy)
        // This handles the "Local Node (No Source ID)" case by finding the original.
        if (dataNode === productNode) {
            const currentLabel = productNode.label;
            const parentNode = nodes[productNode.parentId || ''];
            const parentLabel = parentNode?.label;

            // Strategy A: Name Match (Existing)
            if (currentLabel && parentLabel) {
                const allNodes = Object.values(nodes);
                const standardMatch = allNodes.find((n: any) => {
                    if (n.label !== currentLabel) return false;
                    const p = nodes[n.parentId];
                    if (!p || p.label !== parentLabel) return false;
                    if (n.id === productNode.id) return false;
                    if (n.id.startsWith('copy-')) return false;
                    return true;
                });

                if (standardMatch) {
                    console.log('[PriceCalc] Found Standard Match for Detached Copy (Strategy A):', standardMatch.id);
                    dataNode = standardMatch;

                    // [DEBUG] Attach Strategy A info
                    (dataNode as any).__debugStrategyA = {
                        method: 'StrategyA (Standard Name Match)',
                        standardId: standardMatch.id,
                        matchedLabel: currentLabel,
                        matchedParent: parentLabel
                    };
                }
            }

            // Strategy B: Cost Item Reverse Lookup (New & Robust)
            // If Strategy A failed or we want to be sure, check ownership of Cost Item.
            // Updated: Find ALL candidates, then prioritize the one with Sales Data.
            if (dataNode === productNode && itemForm.costItemId) {
                const allNodes = Object.values(nodes);
                const candidates = allNodes.filter((n: any) => {
                    // Skip self and explicit copies
                    if (n.id === productNode.id) return false;
                    if (n.id.startsWith('copy-')) return false;

                    // Check if this node owns the cost item
                    if (n.attributes?.cost_fabric_list) {
                        // Strict check: Only if it contains the ID
                        if (!n.attributes.cost_fabric_list.includes(itemForm.costItemId)) return false;

                        // Validation: Parent Label Check (if available)
                        // Prevents matching "35mm Bamboo" if we are looking for "55mm Bamboo"
                        if (parentLabel) {
                            const p = nodes[n.parentId];
                            if (!p || p.label !== parentLabel) return false;
                        }
                        return true;
                    }
                    return false;
                });

                if (candidates.length > 0) {
                    // Log ALL candidates
                    const candidateSummary = candidates.map(c => ({
                        id: c.id,
                        label: c.label,
                        hasSalesData: !!c.attributes?.sales_price_fabric,
                        salesDataKeys: c.attributes?.sales_price_fabric ? Object.keys(JSON.parse(c.attributes.sales_price_fabric)) : []
                    }));
                    console.log('[PriceCalc] Candidates Analysis:', candidateSummary);

                    // Sort candidates: Priority to node with sales_price_fabric
                    const sorted = candidates.sort((a: any, b: any) => {
                        const hasA = !!a.attributes?.sales_price_fabric;
                        const hasB = !!b.attributes?.sales_price_fabric;
                        if (hasA && !hasB) return -1;
                        if (!hasA && hasB) return 1;
                        // Secondary sort: Prefer 'prod-' IDs if both have/don't have data
                        if (a.id.startsWith('prod-') && !b.id.startsWith('prod-')) return -1;
                        if (!a.id.startsWith('prod-') && b.id.startsWith('prod-')) return 1;
                        return 0;
                    });

                    const bestMatch = sorted[0];
                    dataNode = bestMatch;

                    // Hack: Attach summary to dataNode for debug extraction
                    (dataNode as any).__debugCandidates = candidateSummary;
                }
            }
        }

        // Strategy C: Name + Width Match (Handling Diverged IDs)
        // If we still don't have valid sales data (or just to be safe), try to find Standard Node by Name
        // AND match the Cost Item by WIDTH (ignoring ID).
        if (!dataNode.attributes?.sales_price_fabric) {
            const currentLabel = productNode.label;
            const parentNode = nodes[productNode.parentId || ''];
            const parentLabel = parentNode?.label;

            if (currentLabel && parentLabel) {
                const allNodes = Object.values(nodes);
                const standardMatch = allNodes.find((n: any) => {
                    if (n.label !== currentLabel) return false;
                    const p = nodes[n.parentId];
                    if (!p || p.label !== parentLabel) return false;
                    if (n.id.startsWith('copy-')) return false; // Prefer Standard
                    // Must have Sales Data
                    return !!n.attributes?.sales_price_fabric;
                });

                if (standardMatch) {
                    // We found the Standard Node. Now find the matching Cost Item by WIDTH.
                    const selectedWidth = itemForm.widthItem?.width || availableWidths.find(w => w.id === itemForm.costItemId)?.width;

                    if (selectedWidth) {
                        try {
                            const stdCosts = JSON.parse(standardMatch.attributes?.cost_fabric_list || '[]');
                            const widthMatch = stdCosts.find((c: any) => c.width === selectedWidth);

                            if (widthMatch) {
                                console.log('[PriceCalc] Strategy C Success:', {
                                    standardIds: standardMatch.id,
                                    remappedCostId: widthMatch.id,
                                    originalCostId: itemForm.costItemId
                                });
                                dataNode = standardMatch;

                                // [DEBUG] Attach Strategy C info
                                (dataNode as any).__debugStrategyC = {
                                    method: 'StrategyC (Standard+Width)',
                                    standardId: standardMatch.id,
                                    matchedWidth: selectedWidth,
                                    remappedId: widthMatch.id
                                };
                            }
                        } catch (e) { }
                    }
                }
            }
        }


        // Strategy D: Partner Explicit Copy Lookup (The "Missing Link" Fix)
        // If we still don't have valid sales data, try to find ANY Copy Node that sources this product
        // and actually has the sales settings.
        if (!dataNode.attributes?.sales_price_fabric) {
            const allNodes = Object.values(nodes);

            // [DEBUG] Scan for potential matches manually
            const potentialMatches = allNodes.filter((n: any) =>
                n.id.startsWith('copy-') && n.label === productNode.label
            );

            // [DEBUG] Deep inspection of Parent Labels
            const productParentId = productNode.parentId;
            const productParentLabel = productParentId ? nodes[productParentId]?.label : 'NoParent';
            const normalizedProductLabel = productNode.label?.trim();

            console.log('[PriceCalc] Strategy D Debug:', {
                target: {
                    id: productNode.id,
                    label: normalizedProductLabel,
                    parentId: productParentId,
                    parentLabel: productParentLabel
                }
            });

            const debugCandidates: any[] = [];

            // 1. Try Strict Source ID Match first, BUT with Parent Validation
            let partnerCopy = allNodes.find((n: any) => {
                if (!n.id.startsWith('copy-')) return false;

                // Must be linked by Source ID
                if (!n.sourceIds?.includes(productNode.id)) return false;

                // Validation: Parent Label Check (if available)
                // This prevents "35mm Copy" from being used for "55mm Product" even if incorrectly linked
                if (productParentLabel) {
                    const copyParentLabel = n.parentId ? nodes[n.parentId]?.label : null;

                    // Log for Debug
                    debugCandidates.push({
                        method: 'StrictSourceID',
                        id: n.id,
                        label: n.label,
                        parent: copyParentLabel,
                        match: copyParentLabel === productParentLabel ? 'YES' : 'NO (Mismatch)'
                    });

                    if (copyParentLabel && copyParentLabel !== productParentLabel) {
                        console.warn('[PriceCalc] Strict Match Rejected due to Parent Mismatch:', {
                            copyId: n.id,
                            copyParent: copyParentLabel,
                            targetParent: productParentLabel
                        });
                        return false;
                    }
                }

                return !!n.attributes?.sales_price_fabric;
            });

            // 2. Fallback: Name Match (Relaxed + Strict Parent Context)
            if (!partnerCopy) {
                const candidates = allNodes.filter((n: any) => {
                    if (!n.id.startsWith('copy-')) return false;
                    // Label Match (Trimmed)
                    const nLabel = n.label?.trim();
                    if (nLabel !== normalizedProductLabel) return false;
                    // Must have Sales Data
                    return !!n.attributes?.sales_price_fabric;
                });

                // Find FIRST one with matching parent
                partnerCopy = candidates.find((n: any) => {
                    const copyParentId = n.parentId;
                    const copyParentLabel = copyParentId ? nodes[copyParentId]?.label : null;

                    // Log for Debug
                    debugCandidates.push({
                        method: 'NameMatch',
                        id: n.id,
                        label: n.label,
                        parent: copyParentLabel,
                        match: copyParentLabel === productParentLabel ? 'YES' : 'NO'
                    });

                    // If original has parent, copy MUST have same parent label
                    if (productParentLabel) {
                        return copyParentLabel === productParentLabel;
                    }
                    return true;
                });
            }

            // [DEBUG] Attach Strategy D analysis to dataNode (for Candidates)
            if (debugCandidates.length > 0) {
                (productNode as any).__debugStrategyD = debugCandidates;
                if (partnerCopy) {
                    (partnerCopy as any).__debugStrategyD = debugCandidates;
                }
            }

            if (partnerCopy) {
                console.log('[PriceCalc] Strategy D: Resolved:', {
                    product: productNode.label,
                    parent: productParentLabel,
                    copyId: partnerCopy.id
                });
                dataNode = partnerCopy;
            }

        }


        let explicitPrice = 0;
        let explicitRollPrice = 0;
        let explicitCutPrice = 0;
        // Determine the ID to use for lookup (Original or Remapped)
        let lookupCostItemId = costItemId;

        // If dataNode is different from productNode, check if we need to remap the ID (Strategy C confirmation)
        if (dataNode !== productNode) {
            try {
                const stdCosts = JSON.parse(dataNode.attributes?.cost_fabric_list || '[]');
                // Check if the current costItemId exists in the target node
                const exists = stdCosts.some((c: any) => c.id === costItemId);
                if (!exists) {
                    // ID Mismatch! Try to find by Width
                    const selectedWidth = availableWidths.find(w => w.id === itemForm.costItemId)?.width;
                    const widthMatch = stdCosts.find((c: any) => c.width === selectedWidth);
                    if (widthMatch) {
                        console.log('[PriceCalc] ID Remapping Active:', costItemId, '->', widthMatch.id);
                        lookupCostItemId = widthMatch.id;
                    }
                }
            } catch (e) { }
        }


        try {
            const salesData = dataNode.attributes?.sales_price_fabric ? JSON.parse(dataNode.attributes.sales_price_fabric) : {};

            // DEBUG INJECTION
            setDebugData(prev => ({
                salesDataFound: !!salesData[lookupCostItemId],
                salesDataForThisItem: salesData[lookupCostItemId] || 'None',
                allSalesDataKeys: Object.keys(salesData),
                explicitPriceFound: explicitPrice,

                // Deep Node Comparison
                targetNode: {
                    id: productNode.id,
                    label: productNode.label,
                    len: productNode.label?.length,
                    parentId: productNode.parentId,
                    sourceIds: productNode.sourceIds
                },
                resolvedNode: {
                    id: dataNode.id,
                    label: dataNode.label,
                    len: dataNode.label?.length,
                    parentId: dataNode.parentId,
                    sourceIds: dataNode.sourceIds
                },
                resolvedMethod: dataNode === productNode ? 'Local' : (dataNode.id === productNode.sourceIds?.[0] ? 'SourceId' : 'SmartLookup'),

                lookupCostItemId,
                candidates: (dataNode as any).__debugStrategyD || (dataNode as any).__debugStrategyC || (dataNode as any).__debugStrategyA || (dataNode as any).__debugCandidates || [],
                // duplicates field removed for stability
                ...prev,

            }));

            // Fix: Check Partner Specific ID first, then Grade
            if (salesData[lookupCostItemId]) {
                const itemSales = salesData[lookupCostItemId]; // Use Lookup ID
                let targetData = null;

                if (itemSales[selectedPartnerId]) {
                    targetData = itemSales[selectedPartnerId];
                    console.log('[PriceCalc] Found Partner Specific Data', targetData);
                } else if (itemSales[grade]) {
                    targetData = itemSales[grade];
                    console.log('[PriceCalc] Found Grade Data', targetData);
                }

                if (targetData) {
                    margin = parseFloat(targetData.margin || '0');
                    if (targetData.price) {
                        explicitPrice = parseFloat(targetData.price.replace(/,/g, ''));
                        console.log('[PriceCalc] Found Explicit Saved Price', explicitPrice);
                    }
                    // 롤 판매단가 로드
                    if (targetData.rollSalesPrice) {
                        explicitRollPrice = parseFloat(targetData.rollSalesPrice.replace(/,/g, ''));
                        console.log('[PriceCalc] Found Explicit Roll Price', explicitRollPrice);
                    }
                    // 절단비 판매단가 로드
                    if (targetData.cutSalesPrice) {
                        explicitCutPrice = parseFloat(targetData.cutSalesPrice.replace(/,/g, ''));
                        console.log('[PriceCalc] Found Explicit Cut Price', explicitCutPrice);
                    }
                } else {
                    console.log('[PriceCalc] No SalesData for Partner/Grade', { costItemId, grade, selectedPartnerId });
                }
            } else {
                console.log('[PriceCalc] No SalesData for CostItem', { costItemId });
            }
        } catch (e) { console.error('[PriceCalc] Error parsing salesData', e); }

        const calcPrice = (cost: number, overridePrice: number = 0) => {
            if (!cost) return 0;
            if (margin >= 100) return 0;
            const rawPrice = cost / (1 - (margin / 100));
            return Math.round(rawPrice / 100) * 100;
        };

        // Determine which price the Explicit Price represents
        // In SalesPriceManagement, for SLAT it saves RollPrice. For others MeterPrice.
        const isSlat = itemForm.unitType === 'SLAT';

        let gradeRollPrice = calcPrice(stdRollPrice);
        let gradeMeterPrice = calcPrice(stdMeterPrice);

        if (explicitPrice > 0) {
            if (isSlat) {
                // For Slat, explicit price IS the Roll Price
                gradeRollPrice = explicitPrice;
            } else {
                // For Fabric, explicit price IS the Meter Price
                gradeMeterPrice = explicitPrice;
            }
        }

        // 저장된 롤 판매단가가 있으면 사용 (SLAT 아닌 ROLL 전용)
        if (!isSlat && explicitRollPrice > 0) {
            gradeRollPrice = explicitRollPrice;
        }

        console.log('[PriceCalc] Result', { margin, gradeRollPrice, gradeMeterPrice, explicitRollPrice, explicitCutPrice });
        // 절단비: 저장된 값이 있으면 사용, 없으면 margin 기반 계산
        const gradeCuttingFee = explicitCutPrice > 0 ? explicitCutPrice : calcPrice(stdCuttingPrice);
        // 절단m 판매단가 계산
        const gradeCuttingMeterFee = calcPrice(stdCuttingMeterPrice);

        // Standard Unit Price for Display/Comparison
        // Slat items use the 'Roll Price' field (first column in cost settings)
        const standardUnitPrice = itemForm.unitType === 'SLAT' ? gradeRollPrice : gradeMeterPrice;

        // [DEBUG] Attach Calc Result
        setDebugData(prev => ({
            ...prev,
            finalCalculation: {
                explicitPrice,
                isSlat,
                stdRollPrice,
                stdMeterPrice,
                gradeRollPrice,
                gradeMeterPrice,
                standardUnitPrice,
                margin
            }
        }));

        let finalTotal = 0;
        let finalCuttingFee = itemForm.cuttingFee;

        // Determine Final Unit Price
        // If user hasn't edited (unitPrice is 0 or matches previous standard), update it.
        // Or if the BASIS changed (Product/Color/Width/Unit), we overwrite.
        // We can detect basis change by dependencies.
        // But if user edited, `unitPrice` in state is the EDITED value.
        // We need to know if we should overwrite it.
        // Simple rule: If `unitPrice` is 0, overwrite.
        // If `originalUnitPrice` changed (meaning basis changed), overwrite.

        let activeUnitPrice = itemForm.unitPrice;

        // Check if basis changed (standard price different from stored original)
        // OR if unitPrice is uninitialized
        if (itemForm.originalUnitPrice !== standardUnitPrice || itemForm.unitPrice === 0) {
            activeUnitPrice = standardUnitPrice;
        }

        if (itemForm.unitType === 'ROLL') {
            // ROLL 모드: 선택된 총 미터 × m단가
            const rollTotalLength = stockLots.filter(l => selectedLotIds.has(l.id)).reduce((s, l) => s + l.length, 0);
            if (itemForm.originalUnitPrice !== standardUnitPrice || itemForm.cuttingFee === '0') {
                finalCuttingFee = gradeCuttingFee.toLocaleString();
            }
            finalTotal = Math.round((rollTotalLength * (activeUnitPrice || 0)) / 10) * 10;
        } else {
            // For CUT (m 모드), 절단비 계산:
            // 절단m단가 × 수량 vs 절단비(기본) 비교 → 큰 값 사용
            if (itemForm.unitType === 'CUT') {
                if (gradeCuttingMeterFee > 0 && qty > 0) {
                    const meterCuttingTotal = gradeCuttingMeterFee * qty;
                    finalCuttingFee = Math.max(gradeCuttingFee, meterCuttingTotal).toLocaleString();
                    console.log('[CuttingFee] CUT mode:', { gradeCuttingFee, gradeCuttingMeterFee, qty, meterCuttingTotal, final: Math.max(gradeCuttingFee, meterCuttingTotal) });
                } else {
                    finalCuttingFee = gradeCuttingFee.toLocaleString();
                }
            }
            const feeNum = parseFloat(finalCuttingFee.replace(/,/g, '') || '0') || 0;
            finalTotal = (qty * (activeUnitPrice || 0)) + feeNum;
        }

        // NaN 방지
        if (isNaN(finalTotal)) finalTotal = 0;
        const safeUnitPrice = isNaN(activeUnitPrice) ? 0 : activeUnitPrice;
        const safeStdPrice = isNaN(standardUnitPrice) ? 0 : standardUnitPrice;

        setItemForm(prev => ({
            ...prev,
            unitPrice: safeUnitPrice,
            originalUnitPrice: safeStdPrice,
            price: finalTotal.toLocaleString(),
            cuttingFee: finalCuttingFee,
            totalLength: itemForm.unitType === 'ROLL' ? stockLots.filter(l => selectedLotIds.has(l.id)).reduce((s, l) => s + l.length, 0) : 0,
            selectedLots: itemForm.unitType === 'ROLL' ? stockLots.filter(l => selectedLotIds.has(l.id)).map(l => ({ lotNo: l.lotNo, length: l.length })) : []
        }));

    }, [
        itemForm.productId,
        itemForm.unitType,
        itemForm.quantity,
        itemForm.costItemId, // Dependency on CostItem (Width)
        itemForm.cuttingFee, // Depend on fee for Total calc
        // itemForm.unitPrice, // Don't depend on unitPrice to avoid loop, rely on setters
        // But we need activeUnitPrice...
        // If we remove unitPrice from dependency, we won't recalculate Total when user edits UnitPrice.
        // We need a separate handler for User Edit that updates Total.
        // OR we include it and ensure stability.
        // If we include `itemForm.unitPrice`, this effect runs when user types.
        // Then `activeUnitPrice` = `itemForm.unitPrice`.
        // `standardUnitPrice` hasn't changed.
        // `itemForm.originalUnitPrice` matches `standardUnitPrice`.
        // So `activeUnitPrice` remains `itemForm.unitPrice`.
        // Final Total is updated.
        // This works!
        itemForm.unitPrice,

        selectedPartnerData,
        nodes,
        defaultGradeMargins,
        availableWidths,
        stockLots,
        selectedLotIds
    ]);


    const handleOpenModal = () => {
        setIsModalOpen(true);
        setNewOrderItems([]);
        setSelectedPartnerId(null);
        setPartnerSearch('');
        resetItemForm();
    };

    const resetItemForm = () => {
        const today = new Date().toISOString().split('T')[0];
        const defaultDest = selectedPartnerData && selectedPartnerData.addresses.length > 0
            ? selectedPartnerData.addresses[0].address
            : '';

        setItemForm({
            id: '', inputTime: '', orderMode: orderInputMode, productId: '', productName: '', colorId: '', colorName: '',
            width: '', costItemId: '',
            unitType: 'ROLL', quantity: '', cuttingFee: '0', price: '0', unitPrice: 0, originalUnitPrice: 0,
            shipDate: today, destination: defaultDest, note: '',
            prodWidth: '', prodHeight: '', prodArea: 0, prodAppliedArea: 0, prodCuttingUnit: '', sizeError: '',
            selectedSystemId: '', selectedSystemName: '', selectedOptions: [],
            measureImageId: '', measureImageName: '', measureImageUrl: '', measureCategory: '', measureUnitPrice: 0
        });
        setCurrentStock(null);
        setProductSearch('');
        setIsEditingItem(false);
    };

    const handleSelectPartner = (partner: any) => {
        setSelectedPartnerId(partner.id);
        setPartnerSearch(partner.partnerName);
        setShowPartnerResults(false);
        setItemForm(prev => ({
            ...prev,
            destination: partner.addresses[0]?.address || '',
            productId: '', productName: '', colorId: '', colorName: '',
            width: '', costItemId: '', unitType: 'ROLL', quantity: '', cuttingFee: '0', price: '0', unitPrice: 0, originalUnitPrice: 0,
            prodWidth: '', prodHeight: '', prodArea: 0, prodAppliedArea: 0, prodCuttingUnit: '', sizeError: '',
            selectedSystemId: '', selectedSystemName: '', selectedOptions: []
        }));
        setCurrentStock(null);
        setProductSearch('');
    };

    const handleSelectProduct = (product: any) => {
        const parentNode = nodes[product.node.parentId || ''];
        const parentLabel = parentNode ? parentNode.label : '';
        const fullName = parentLabel ? `${parentLabel} > ${product.label}` : product.label;

        // 제품 모드: 제단 데이터 자동 로드
        let cuttingUnit = '';
        if (orderInputMode === 'PRODUCT') {
            try {
                const cuttingRaw = product.node.attributes?.cost_cutting_list;
                if (cuttingRaw) {
                    const cuttingList = JSON.parse(cuttingRaw);
                    if (Array.isArray(cuttingList) && cuttingList.length > 0) {
                        cuttingUnit = cuttingList[0].unit || 'SQM';
                    }
                }
            } catch (e) { }
        }

        // 제품 모드: 최소사이즈를 기본값으로 설정
        let defaultWidth = '';
        let defaultHeight = '';
        if (orderInputMode === 'PRODUCT') {
            try {
                let dn = product.node;
                if (dn.sourceIds && dn.sourceIds.length > 0) {
                    const sn = nodes[dn.sourceIds[0]];
                    if (sn) dn = sn;
                }
                const cRaw = dn.attributes?.cost_cutting_list;
                if (cRaw) {
                    const cList = JSON.parse(cRaw);
                    if (Array.isArray(cList) && cList.length > 0) {
                        const ci = cList[0];
                        defaultWidth = String(parseFloat(String(ci.minWidth || '0').replace(/,/g, '')) || '');
                        defaultHeight = String(parseFloat(String(ci.minHeight || '0').replace(/,/g, '')) || '');
                    }
                }
            } catch (e) { }
        }

        setItemForm(prev => ({
            ...prev,
            productId: product.id,
            productName: fullName,
            colorId: '', colorName: '',
            width: '', costItemId: '',
            unitType: 'ROLL', quantity: orderInputMode === 'PRODUCT' ? '1' : '', cuttingFee: '0', price: '0', unitPrice: 0, originalUnitPrice: 0,
            prodWidth: defaultWidth, prodHeight: defaultHeight, prodArea: 0, prodAppliedArea: 0, prodCuttingUnit: cuttingUnit, sizeError: '',
            selectedSystemId: '', selectedSystemName: '', systemDrillPath: [], selectedOptions: [],
            measureImageId: '', measureImageName: '', measureImageUrl: '', measureCategory: '', measureUnitPrice: 0
        }));
        setProductSearch(fullName);
        setShowProductResults(false);
        setShowColorDropdown(true);
        // 제품 모드: 기본 사이즈로 자동 계산 트리거 (useEffect에서 처리)
    };

    const handleSelectColor = (color: any) => {
        setItemForm(prev => ({ ...prev, colorId: color.id, colorName: color.label }));
        setShowColorDropdown(false);
        setShowWidthDropdown(true); // Auto-open Width
    };

    const handleSelectWidth = (widthItem: any) => {
        // Detect Slat Category
        let newUnitType: 'ROLL' | 'CUT' | 'SLAT' = 'ROLL';
        if (widthItem.category === 'SLAT') {
            newUnitType = 'SLAT';
        }

        setItemForm(prev => {
            let unitPrice = prev.unitPrice;
            let originalUnitPrice = prev.originalUnitPrice;

            if (newUnitType === 'SLAT') {
                // Fix: Slat items use Roll Price (Piece Price) field.
                // Ignore meterPrice as it might be garbage or irrelevant for Slats.
                const stdPriceRaw = widthItem.rollPrice;
                const stdPrice = typeof stdPriceRaw === 'string'
                    ? parseFloat(stdPriceRaw.replace(/,/g, ''))
                    : Number(stdPriceRaw || 0);

                let finalPrice = stdPrice;
                console.log('Slat Debug:', { widthItem, stdPrice });

                // Try to find Partner-Specific Sales Price
                if (itemForm.productId && selectedPartnerId) {
                    const productNode = nodes[itemForm.productId];
                    const partner = partners.find(p => p.id === selectedPartnerId);


                    // Fix: Look up Sales Price on Source Node if missing on current node (Standard Match Logic)
                    let salesPriceStr = productNode?.attributes?.sales_price_fabric;

                    // 1. Try Source Node
                    if (!salesPriceStr && productNode.sourceIds && productNode.sourceIds.length > 0) {
                        const sourceNode = nodes[productNode.sourceIds[0]];
                        if (sourceNode) salesPriceStr = sourceNode.attributes?.sales_price_fabric;
                    }

                    // 2. Try Standard Match (Fallback for detached copies)
                    if (!salesPriceStr) {
                        const currentLabel = productNode.label;
                        const parentNode = nodes[productNode.parentId || ''];
                        const parentLabel = parentNode?.label;

                        if (currentLabel && parentLabel) {
                            const allNodes = Object.values(nodes);
                            const standardMatch = allNodes.find((n: any) => {
                                // 1. Match Name
                                if (n.label !== currentLabel) return false;
                                // 2. Match Parent Name
                                const p = nodes[n.parentId];
                                if (!p || p.label !== parentLabel) return false;
                                // 3. Must NOT be the current node
                                if (n.id === productNode.id) return false;
                                // 4. Must NOT be a 'copy-'
                                if (n.id.startsWith('copy-')) return false;

                                // 5. Must have sales price
                                return !!n.attributes?.sales_price_fabric;
                            });

                            if (standardMatch) {
                                console.log('Found Standard Match for Sales Price:', standardMatch.id);
                                salesPriceStr = standardMatch.attributes.sales_price_fabric;
                            }
                        }
                    }

                    if (salesPriceStr) {
                        try {
                            const salesPriceMap = JSON.parse(salesPriceStr);
                            const itemSalesData = salesPriceMap[widthItem.id]; // Keyed by CostItemID

                            if (itemSalesData) {
                                // Priority 1: Specific Partner ID
                                if (itemSalesData[selectedPartnerId]) {
                                    const priceRaw = itemSalesData[selectedPartnerId].price;
                                    finalPrice = typeof priceRaw === 'string'
                                        ? parseFloat(priceRaw.replace(/,/g, ''))
                                        : Number(priceRaw);
                                    console.log('Found Partner Price:', finalPrice);
                                }
                                // Priority 2: Grade
                                else if (partner?.grade && itemSalesData[partner.grade]) {
                                    const priceRaw = itemSalesData[partner.grade].price;
                                    finalPrice = typeof priceRaw === 'string'
                                        ? parseFloat(priceRaw.replace(/,/g, ''))
                                        : Number(priceRaw);
                                    console.log('Found Grade Price:', finalPrice);
                                }
                            }
                        } catch (e) {
                            console.error("Error parsing sales price:", e);
                        }
                    }
                }

                unitPrice = finalPrice;
                originalUnitPrice = finalPrice;
            } else {
                // ROLL / CUT 모드: meterPrice를 기본값으로 사용, 판매가 있으면 판매가 우선
                const stdPriceRaw2 = widthItem.meterPrice;
                const stdPrice2 = typeof stdPriceRaw2 === 'string'
                    ? parseFloat(stdPriceRaw2.replace(/,/g, ''))
                    : Number(stdPriceRaw2 || 0);

                let finalPrice2 = stdPrice2;
                console.log('Roll/Cut Debug:', { widthItem, stdPrice2, productId: itemForm.productId, selectedPartnerId });

                // Try to find Partner-Specific Sales Price
                if (itemForm.productId && selectedPartnerId) {
                    const productNode2 = nodes[itemForm.productId];
                    const partner2 = partners.find(p => p.id === selectedPartnerId);

                    let salesPriceStr2 = productNode2?.attributes?.sales_price_fabric;

                    // 1. Try Source Node
                    if (!salesPriceStr2 && productNode2.sourceIds && productNode2.sourceIds.length > 0) {
                        const sourceNode2 = nodes[productNode2.sourceIds[0]];
                        if (sourceNode2) salesPriceStr2 = sourceNode2.attributes?.sales_price_fabric;
                    }

                    // 2. Try Standard Match (Fallback for detached copies)
                    if (!salesPriceStr2) {
                        const currentLabel2 = productNode2.label;
                        const parentNode2 = nodes[productNode2.parentId || ''];
                        const parentLabel2 = parentNode2?.label;

                        if (currentLabel2 && parentLabel2) {
                            const allNodes2 = Object.values(nodes);
                            const standardMatch2 = allNodes2.find((n: any) => {
                                if (n.label !== currentLabel2) return false;
                                const p = nodes[n.parentId];
                                if (!p || p.label !== parentLabel2) return false;
                                if (n.id === productNode2.id) return false;
                                if (n.id.startsWith('copy-')) return false;
                                return !!n.attributes?.sales_price_fabric;
                            });

                            if (standardMatch2) {
                                console.log('Found Standard Match for Roll Sales Price:', standardMatch2.id);
                                salesPriceStr2 = standardMatch2.attributes.sales_price_fabric;
                            }
                        }
                    }

                    if (salesPriceStr2) {
                        try {
                            const salesPriceMap2 = JSON.parse(salesPriceStr2);
                            const itemSalesData2 = salesPriceMap2[widthItem.id];

                            if (itemSalesData2) {
                                // Priority 1: Specific Partner ID
                                if (itemSalesData2[selectedPartnerId]) {
                                    const priceRaw2 = itemSalesData2[selectedPartnerId].price;
                                    finalPrice2 = typeof priceRaw2 === 'string'
                                        ? parseFloat(priceRaw2.replace(/,/g, ''))
                                        : Number(priceRaw2);
                                    console.log('Found Partner Roll Price:', finalPrice2);
                                }
                                // Priority 2: Grade
                                else if (partner2?.grade && itemSalesData2[partner2.grade]) {
                                    const priceRaw2 = itemSalesData2[partner2.grade].price;
                                    finalPrice2 = typeof priceRaw2 === 'string'
                                        ? parseFloat(priceRaw2.replace(/,/g, ''))
                                        : Number(priceRaw2);
                                    console.log('Found Grade Roll Price:', finalPrice2);
                                }
                            }
                        } catch (e) {
                            console.error("Error parsing roll sales price:", e);
                        }
                    }
                }

                unitPrice = finalPrice2;
                originalUnitPrice = finalPrice2;
            }

            return {
                ...prev,
                width: widthItem.width,
                costItemId: widthItem.id,
                unitType: newUnitType,
                unitPrice: unitPrice,
                originalUnitPrice: originalUnitPrice
            };
        });
        setShowWidthDropdown(false);

        // Fetch Stock Data
        if (itemForm.colorId) {
            const colorNode = nodes[itemForm.colorId];
            if (colorNode?.attributes?.stockData) {
                try {
                    const stockMap = JSON.parse(colorNode.attributes.stockData);
                    const stock = stockMap[widthItem.id];
                    if (stock) {
                        setCurrentStock({ qty: stock.qty, length: stock.length });
                        // lots 데이터 로드
                        if (stock.lots && Array.isArray(stock.lots) && stock.lots.length > 0) {
                            setStockLots(stock.lots.map((lot: any) => ({
                                id: lot.id || `lot-${Math.random().toString(36).substr(2, 6)}`,
                                lotNo: lot.lotNo || '',
                                length: lot.length || 0,
                                qty: lot.qty || 1
                            })));
                        } else if (stock.qty > 0 && stock.length > 0) {
                            // lots 배열이 없으면 qty/length로 가상 LOT 생성
                            const count = stock.qty;
                            const totalLen = stock.length;
                            const avgLen = Math.floor(totalLen / count);
                            const remainder = totalLen % count;
                            const now = new Date();
                            const datePrefix = `${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
                            const generated = [];
                            for (let i = 0; i < count; i++) {
                                generated.push({
                                    id: `lot-auto-${i}`,
                                    lotNo: `LOT-${datePrefix}-${String(i + 1).padStart(3, '0')}`,
                                    length: i === count - 1 ? avgLen + remainder : avgLen,
                                    qty: 1
                                });
                            }
                            setStockLots(generated);
                        } else {
                            setStockLots([]);
                        }
                    } else {
                        setCurrentStock({ qty: 0, length: 0 });
                        setStockLots([]);
                    }
                } catch (e) {
                    setCurrentStock({ qty: 0, length: 0 });
                    setStockLots([]);
                }
            } else {
                setCurrentStock({ qty: 0, length: 0 });
                setStockLots([]);
            }
            setSelectedLotIds(new Set());
            setShowLotDropdown(false);
        }
    };

    const handleDateChange = (days: number) => {
        const current = new Date(itemForm.shipDate);
        current.setDate(current.getDate() + days);
        const newDateStr = current.toISOString().split('T')[0];
        setItemForm(prev => ({ ...prev, shipDate: newDateStr }));
    };

    const handleAddItem = () => {
        if (orderInputMode === 'PRODUCT') {
            // 제품 모드 검증
            if (!itemForm.productId) { alert("상품을 선택해주세요."); return; }
            if (!itemForm.prodWidth || !itemForm.prodHeight) { alert("가로/세로 사이즈를 입력해주세요."); return; }
            if (itemForm.sizeError) { alert(itemForm.sizeError); return; }
            if (itemForm.unitPrice === 0) { alert("단가가 0원입니다. 사이즈를 확인해주세요."); return; }
            if (!itemForm.quantity || Number(itemForm.quantity) <= 0) { alert("수량을 입력해주세요."); return; }
        } else {
            // 원단 모드 검증
            if (!itemForm.productId || !itemForm.colorId || !itemForm.costItemId || !itemForm.quantity) {
                alert("상품, 색상, 폭(규격), 수량은 필수입니다.");
                return;
            }
        }

        const now = new Date();
        const timeString = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        const entryData: OrderItemEntry = {
            ...itemForm,
            orderMode: orderInputMode,
        };

        if (isEditingItem) {
            setNewOrderItems(prev => prev.map(item => item.id === itemForm.id ? { ...entryData } : item));
        } else {
            setNewOrderItems(prev => [...prev, { ...entryData, id: `temp-${Date.now()}`, inputTime: timeString }]);
        }
        resetItemForm();
    };

    const handleEditItem = (item: OrderItemEntry) => {
        setItemForm(item);
        setProductSearch(item.productName);
        setIsEditingItem(true);
    };

    const handleDeleteItem = (id: string) => {
        setNewOrderItems(prev => prev.filter(i => i.id !== id));
    };

    const handleRegisterOrder = () => {
        if (!selectedPartnerData) {
            alert("거래처를 선택해주세요.");
            return;
        }
        if (newOrderItems.length === 0) {
            alert("등록할 주문 내역이 없습니다.");
            return;
        }

        const newOrders: OrderData[] = newOrderItems.map((item, idx) => ({
            id: `new-${Date.now()}-${idx}`,
            inputTime: item.inputTime,
            partnerName: selectedPartnerData.partnerName,
            ceoName: selectedPartnerData.ceoName,
            phone: selectedPartnerData.companyPhone,
            productName: `${item.productName} > ${item.colorName}`, // Removed Width from Name
            width: item.width, // Save Width separately
            shippingDate: item.shipDate,
            quantity: parseFloat(item.quantity),
            unit: item.unitType === 'ROLL' ? 'Roll' : 'm',
            amount: parseFloat(item.price.replace(/,/g, '')),
            balance: 0,
            inventory: 100,
            destination: item.destination,
            note: item.note
        }));

        setOrderList(prev => [...newOrders, ...prev]);
        setIsModalOpen(false);
        alert("주문 접수가 완료되었습니다.");
    };

    const handleMainPrevDay = () => {
        const newDate = new Date(currentDate);
        newDate.setDate(currentDate.getDate() - 1);
        setCurrentDate(newDate);
    };
    const handleMainNextDay = () => {
        const newDate = new Date(currentDate);
        newDate.setDate(currentDate.getDate() + 1);
        setCurrentDate(newDate);
    };
    const handleMainToday = () => {
        setCurrentDate(new Date());
    };

    // --- DETAIL & EDIT HANDLERS (New) ---
    const handleRowDoubleClick = (order: OrderData) => {
        setSelectedDetailOrder({ ...order });
    };

    const handleDetailChange = (field: keyof OrderData, value: any) => {
        setSelectedDetailOrder(prev => {
            if (!prev) return null;
            const updated = { ...prev, [field]: value };
            // Auto-recalculate amount if quantity changes
            if (field === 'quantity') {
                const unitPrice = prev.quantity > 0 ? prev.amount / prev.quantity : 0;
                updated.amount = Math.round(parseFloat(value) * unitPrice);
            }
            return updated;
        });
    };

    const handleDetailSave = () => {
        if (!selectedDetailOrder) return;
        setOrderList(prev => prev.map(o => o.id === selectedDetailOrder.id ? selectedDetailOrder : o));
        setSelectedDetailOrder(null);
        alert("주문 내역이 수정되었습니다.");
    };

    const handleDetailDelete = () => {
        if (!selectedDetailOrder) return;
        if (confirm("해당 주문 내역을 삭제하시겠습니까?")) {
            setOrderList(prev => prev.filter(o => o.id !== selectedDetailOrder.id));
            setSelectedDetailOrder(null);
        }
    };

    // Auto-select width if only one exists (Moved to end to ensure handleSelectWidth is defined)
    useEffect(() => {
        if (availableWidths.length === 1 && !itemForm.costItemId) {
            const w = availableWidths[0];
            handleSelectWidth(w);
        }
    }, [availableWidths, itemForm.costItemId]);

    // === 제품 모드 전용 로직 ===

    // 제단 데이터 조회 (선택된 상품의 cost_cutting_list + 판매단가)
    const productCuttingData = useMemo(() => {
        if (orderInputMode !== 'PRODUCT' || !itemForm.productId) return null;
        const productNode = nodes[itemForm.productId];
        if (!productNode) return null;

        try {
            // 원본(소스) 노드 우선 참조
            let dataNode = productNode;
            if (productNode.sourceIds && productNode.sourceIds.length > 0) {
                const srcNode = nodes[productNode.sourceIds[0]];
                if (srcNode) dataNode = srcNode;
            }

            const raw = dataNode.attributes?.cost_cutting_list;
            if (!raw) return null;
            const list = JSON.parse(raw);
            if (!Array.isArray(list) || list.length === 0) return null;
            const item = list[0]; // 첫 번째 제단 설정 사용
            const stdPrice = parseFloat(String(item.standardPrice || '0').replace(/,/g, '')) || 0;
            const itemId = item.id || '';

            // 판매단가 조회 (sales_price_cutting)
            let salesPrice = stdPrice; // 기본값: 원가 (후에 마진 적용)
            let salesPriceFound = false;
            if (selectedPartnerId && itemId) {
                let salesPriceStr = dataNode.attributes?.sales_price_cutting;

                // 소스 노드에서 먼저 조회
                if (!salesPriceStr && productNode.sourceIds && productNode.sourceIds.length > 0) {
                    const srcNode = nodes[productNode.sourceIds[0]];
                    if (srcNode) salesPriceStr = srcNode.attributes?.sales_price_cutting;
                }

                // 표준 매칭 Fallback (detached copies)
                if (!salesPriceStr) {
                    const currentLabel = productNode.label;
                    const parentNode = nodes[productNode.parentId || ''];
                    const parentLabel = parentNode?.label;
                    if (currentLabel && parentLabel) {
                        const allNodes = Object.values(nodes);
                        const standardMatch = allNodes.find((n: any) => {
                            if (n.label !== currentLabel) return false;
                            const p = nodes[n.parentId];
                            if (!p || p.label !== parentLabel) return false;
                            if (n.id === productNode.id) return false;
                            if (n.id.startsWith('copy-')) return false;
                            return !!n.attributes?.sales_price_cutting;
                        });
                        if (standardMatch) salesPriceStr = (standardMatch as any).attributes.sales_price_cutting;
                    }
                }

                if (salesPriceStr) {
                    try {
                        const salesPriceMap = JSON.parse(salesPriceStr);
                        const itemSalesData = salesPriceMap[itemId];
                        if (itemSalesData) {
                            const partner = partners.find(p => p.id === selectedPartnerId);
                            // 우선순위 1: 거래처 ID
                            if (itemSalesData[selectedPartnerId]) {
                                const priceRaw = itemSalesData[selectedPartnerId].price;
                                salesPrice = typeof priceRaw === 'string'
                                    ? parseFloat(priceRaw.replace(/,/g, ''))
                                    : Number(priceRaw || 0);
                                salesPriceFound = true;
                            }
                            // 우선순위 2: 등급
                            else if (partner?.grade && itemSalesData[partner.grade]) {
                                const priceRaw = itemSalesData[partner.grade].price;
                                salesPrice = typeof priceRaw === 'string'
                                    ? parseFloat(priceRaw.replace(/,/g, ''))
                                    : Number(priceRaw || 0);
                                salesPriceFound = true;
                            }
                        }
                    } catch (e) { console.error('Error parsing sales_price_cutting:', e); }
                }
            }

            // 판매단가를 찾지 못한 경우: 등급별 기본 마진 적용
            if (!salesPriceFound && stdPrice > 0 && selectedPartnerId) {
                const partner = partners.find(p => p.id === selectedPartnerId);
                const grade = partner?.grade || 'A';
                const gradeDef = defaultGradeMargins.find(g => g.grade === grade);
                const margin = parseFloat(gradeDef?.margin || '0');
                if (margin > 0 && margin < 100) {
                    salesPrice = Math.round((stdPrice / (1 - margin / 100)) / 100) * 100;
                }
            }

            return {
                basicArea: parseFloat(String(item.basicArea || '0').replace(/,/g, '')) || 0,
                minWidth: parseFloat(String(item.minWidth || '0').replace(/,/g, '')) || 0,
                maxWidth: parseFloat(String(item.maxWidth || '0').replace(/,/g, '')) || 0,
                minHeight: parseFloat(String(item.minHeight || '0').replace(/,/g, '')) || 0,
                maxHeight: parseFloat(String(item.maxHeight || '0').replace(/,/g, '')) || 0,
                standardPrice: stdPrice,
                salesPrice: salesPrice, // 판매단가 (마진 포함)
                unit: item.unit || 'SQM',
                standardWidth: parseFloat(String(item.standardWidth || '180').replace(/,/g, '')) || 180,
            };
        } catch (e) { return null; }
    }, [orderInputMode, itemForm.productId, nodes, selectedPartnerId, partners, defaultGradeMargins]);

    // === 시스템/옵션 로직 ===

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
        if (orderInputMode !== 'PRODUCT' || !itemForm.productId) return [];
        const productNode = nodes[itemForm.productId] as any;
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
        //    - 직접 ID 매칭
        //    - originalSourceId 매칭
        //    - sourceIds 매칭
        //    - 라벨 기반 fallback (systemVirtualMap의 키 노드 라벨과 조상 라벨 비교)
        let linkedCategoryId: string | null = null;

        // Strategy A: 직접 ID / originalSourceId 매칭
        for (let i = ancestors.length - 1; i >= 0; i--) {
            const anc = ancestors[i];
            const idToMatch = anc.id;
            const originalId = anc.attributes?.originalSourceId;
            if (systemVirtualMap[idToMatch]) {
                linkedCategoryId = idToMatch;
                break;
            }
            if (originalId && systemVirtualMap[originalId]) {
                linkedCategoryId = originalId;
                break;
            }
            // sourceIds 체크
            if (anc.sourceIds && Array.isArray(anc.sourceIds)) {
                for (const srcId of anc.sourceIds) {
                    if (systemVirtualMap[srcId]) {
                        linkedCategoryId = srcId;
                        break;
                    }
                    // sourceIds의 originalSourceId도 체크
                    const srcNode = nodes[srcId] as any;
                    if (srcNode?.attributes?.originalSourceId && systemVirtualMap[srcNode.attributes.originalSourceId]) {
                        linkedCategoryId = srcNode.attributes.originalSourceId;
                        break;
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
                // 괄호 내용 제거하여 정규화 (예: "우드(재조)" → "우드")
                const ancLabelNorm = ancLabel.replace(/\s*\(.*?\)\s*/g, '').trim();
                // systemVirtualMap 키 노드의 라벨과 비교
                for (const key of vmapKeys) {
                    const keyNode = nodes[key] as any;
                    if (!keyNode) continue;
                    const keyLabel = keyNode.label?.trim() || '';
                    const keyLabelNorm = keyLabel.replace(/\s*\(.*?\)\s*/g, '').trim();
                    // 정확 일치, 정규화 일치, startsWith 매칭
                    if (ancLabel === keyLabel
                        || ancLabelNorm === keyLabelNorm
                        || ancLabelNorm.startsWith(keyLabelNorm)
                        || keyLabelNorm.startsWith(ancLabelNorm)) {
                        linkedCategoryId = key;
                        break;
                    }
                }
                if (linkedCategoryId) break;
            }
        }

        if (!linkedCategoryId) return [];

        // 3. 매핑된 시스템 노드들
        const mappedIds = systemVirtualMap[linkedCategoryId] || [];
        const candidates = (Array.isArray(mappedIds) ? mappedIds : [mappedIds]).filter(id => !!nodes[id]);

        // 4. 시스템 노드 목록 반환 (라벨 + ID)
        // 소스(제조공급사) 노드의 라벨 우선 사용
        const getSourceLabel = (n: any): string => {
            if (n?.sourceIds && Array.isArray(n.sourceIds)) {
                for (const srcId of n.sourceIds) {
                    const src = nodes[srcId] as any;
                    if (src?.label) return src.label;
                }
            }
            if (n?.attributes?.originalSourceId) {
                const src = nodes[n.attributes.originalSourceId] as any;
                if (src?.label) return src.label;
            }
            return n?.label || '';
        };
        return candidates.map(id => {
            const node = nodes[id] as any;
            return { id, label: getSourceLabel(node) || id };
        });
    }, [orderInputMode, itemForm.productId, nodes, systemVirtualMap]);

    // === 동적 드릴다운 시스템 ===
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

    // 노드에서 리프까지 최대 깊이 (경량: childrenIds만 사용, sourceIds 탐색 안 함)
    const depthToLeaf = useMemo(() => {
        const cache: Record<string, number> = {};
        const calc = (nid: string, visited: Set<string> = new Set(), depth: number = 0): number => {
            try {
                if (depth > 8) return 0;
                if (cache[nid] !== undefined) return cache[nid];
                if (visited.has(nid)) return 0;
                visited.add(nid);
                // childrenIds만 직접 사용 (sourceIds는 깊이 계산에서 제외 — 성능)
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

    // 현재 드릴 위치 결정 (systemDrillPath가 undefined일 수 있음 — 기존 데이터 호환)
    const drillPath = itemForm.systemDrillPath || [];
    const currentDrillNodeId = drillPath.length > 0
        ? drillPath[drillPath.length - 1].id
        : itemForm.selectedSystemId;
    const currentDrillDepth = currentDrillNodeId ? depthToLeaf(currentDrillNodeId) : 0;

    // 각 드릴 레벨의 스위치 목록 (UI 렌더링용)
    const drillSwitchLevels = useMemo(() => {
        if (!itemForm.selectedSystemId) return [];
        const dp = itemForm.systemDrillPath || [];
        const levels: { nodes: { id: string; label: string }[]; selectedId: string }[] = [];
        let curId = itemForm.selectedSystemId;
        for (let i = 0; i <= dp.length; i++) {
            const d = depthToLeaf(curId);
            if (d <= 2) break;
            const children = getChildNodes(curId);
            const selectedId = i < dp.length ? dp[i].id : '';
            levels.push({
                nodes: children.map(c => {
                    let label = c.label || '';
                    // 소스(제조공급사) 노드 라벨 우선
                    if (c.sourceIds && Array.isArray(c.sourceIds)) {
                        for (const srcId of c.sourceIds) {
                            const src = nodes[srcId] as any;
                            if (src?.label) { label = src.label; break; }
                        }
                    } else if (c.attributes?.originalSourceId) {
                        const src = nodes[c.attributes.originalSourceId] as any;
                        if (src?.label) label = src.label;
                    }
                    return { id: c.id, label };
                }),
                selectedId,
            });
            if (!selectedId) break;
            curId = selectedId;
        }
        return levels;
    }, [itemForm.selectedSystemId, itemForm.systemDrillPath, depthToLeaf, getChildNodes]);

    // 옵션 소스: depth <= 2 이면 현재 드릴 노드, 아니면 빈값 (아직 스위치 선택 필요)
    const optionSourceId = currentDrillDepth <= 2 && currentDrillNodeId ? currentDrillNodeId : '';

    // 선택된 시스템의 하위 옵션 + 원가/판매단가 (계층형)
    const systemOptions = useMemo(() => {
        if (!optionSourceId) return [];
        const systemNode = nodes[optionSourceId];
        if (!systemNode) return [];

        // 시스템 노드에서 cost_assembly_list 조회
        let assemblyCostMap: Record<string, { price: string; unit: string }> = {};
        const getAssemblyCost = (nid: string) => {
            const n = nodes[nid] as any;
            if (!n) return;
            if (n.attributes?.cost_assembly_list) {
                try { const parsed = JSON.parse(n.attributes.cost_assembly_list); Object.assign(assemblyCostMap, parsed); } catch (e) { }
            }
            // originalSourceId 경로
            if (n.attributes?.originalSourceId) {
                const src = nodes[n.attributes.originalSourceId] as any;
                if (src?.attributes?.cost_assembly_list) {
                    try { const parsed = JSON.parse(src.attributes.cost_assembly_list); Object.assign(assemblyCostMap, parsed); } catch (e) { }
                }
            }
            // sourceIds 경로 (참조 원본들)
            if (n.sourceIds && Array.isArray(n.sourceIds)) {
                for (const srcId of n.sourceIds) {
                    const srcN = nodes[srcId] as any;
                    if (srcN?.attributes?.cost_assembly_list) {
                        try { const parsed = JSON.parse(srcN.attributes.cost_assembly_list); Object.assign(assemblyCostMap, parsed); } catch (e) { }
                    }
                }
            }
            // 라벨 매칭 fallback
            const allNodes = Object.values(nodes) as any[];
            const labelMatch = allNodes.find(sn =>
                (sn.attributes?.nodeType === 'system' || sn.attributes?.nodeType === 'category' || sn.attributes?.nodeType === 'item') &&
                sn.label?.trim() === n.label?.trim() && sn.id !== nid && !sn.id.includes('partner')
            );
            if (labelMatch?.attributes?.cost_assembly_list) {
                try { const parsed = JSON.parse(labelMatch.attributes.cost_assembly_list); Object.assign(assemblyCostMap, parsed); } catch (e) { }
            }
        };
        // 시스템 노드에서 ROOT까지 올라가며 cost 수집
        let costCurr: any = systemNode;
        let costLimit = 10;
        while (costCurr && costLimit > 0) {
            costLimit--;
            getAssemblyCost(costCurr.id);
            costCurr = costCurr.parentId ? nodes[costCurr.parentId] : null;
            if (!costCurr || costCurr.type === 'ROOT') break;
        }
        // sourceIds 경로도 별도로 올라감
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

        // 최후 fallback: assemblyCostMap이 비어있으면 전체 노드에서 수집
        if (Object.keys(assemblyCostMap).length === 0) {
            const allNodes = Object.values(nodes) as any[];
            for (const n of allNodes) {
                if (n.attributes?.cost_assembly_list) {
                    try { Object.assign(assemblyCostMap, JSON.parse(n.attributes.cost_assembly_list)); } catch (e) { }
                }
            }
        }

        // 판매단가 조회 — 전체 노드에서 sales_price_assembly 수집
        let salesPriceMap: Record<string, any> = {};
        const allNodesArr = Object.values(nodes) as any[];
        for (const n of allNodesArr) {
            if (n.attributes?.sales_price_assembly) {
                try { Object.assign(salesPriceMap, JSON.parse(n.attributes.sales_price_assembly)); } catch (e) { }
            }
        }

        // Helper: 특정 항목의 판매 단가 계산 (ID 직접 → 라벨 매칭 fallback)
        const calcSalesPrice = (lookupId: string, childId: string, stdPrice: number): number => {
            let sPrice = stdPrice;
            // ID 기반 조회
            let itemSalesData = salesPriceMap[lookupId] || salesPriceMap[childId];
            // 라벨 기반 fallback
            if (!itemSalesData) {
                const childNode = nodes[childId] as any;
                if (childNode?.label) {
                    const labelNorm = childNode.label.trim().replace(/\s*\(.*?\)\s*/g, '');
                    for (const [key, val] of Object.entries(salesPriceMap)) {
                        const keyNode = nodes[key] as any;
                        if (keyNode && keyNode.label) {
                            const keyLabel = keyNode.label.trim().replace(/\s*\(.*?\)\s*/g, '');
                            if (keyLabel === labelNorm) { itemSalesData = val; break; }
                        }
                    }
                }
            }
            if (itemSalesData && selectedPartnerId) {
                const partner = partners.find(p => p.id === selectedPartnerId);
                if (itemSalesData[selectedPartnerId]) {
                    const pr = itemSalesData[selectedPartnerId].price;
                    sPrice = typeof pr === 'string' ? parseFloat(pr.replace(/,/g, '')) : Number(pr || 0);
                } else if (partner?.grade && itemSalesData[partner.grade]) {
                    const pr = itemSalesData[partner.grade].price;
                    sPrice = typeof pr === 'string' ? parseFloat(pr.replace(/,/g, '')) : Number(pr || 0);
                } else if (itemSalesData['ALL']) {
                    const pr = itemSalesData['ALL'].price;
                    sPrice = typeof pr === 'string' ? parseFloat(pr.replace(/,/g, '')) : Number(pr || 0);
                }
            }
            return sPrice;
        };

        // 하위 노드 수집
        const getChildren = (nid: string): any[] => {
            const n = nodes[nid] as any;
            if (!n) return [];
            // 소스(제조공급사) 노드의 자식을 우선 사용 (최신 항목 반영)
            let sourceChildIds: string[] = [];
            if (n.sourceIds && Array.isArray(n.sourceIds)) {
                for (const srcId of n.sourceIds) {
                    const src = nodes[srcId] as any;
                    if (src && Array.isArray(src.childrenIds) && src.childrenIds.length > 0) {
                        sourceChildIds.push(...src.childrenIds);
                    }
                }
            }
            if (sourceChildIds.length === 0 && n.attributes?.originalSourceId) {
                const src = nodes[n.attributes.originalSourceId] as any;
                if (src && Array.isArray(src.childrenIds)) sourceChildIds = [...src.childrenIds];
            }
            // 소스 자식이 있으면 소스 우선, 없으면 로컬 자식 사용
            const childIds = sourceChildIds.length > 0 ? sourceChildIds : (Array.isArray(n.childrenIds) ? [...n.childrenIds] : []);
            return [...new Set(childIds)].map(id => nodes[id]).filter(Boolean) as any[];
        };

        // 라벨 기반 원가 조회 fallback
        const findCostByLabel = (label: string): { price: string; unit: string } | null => {
            if (!label) return null;
            const labelNorm = label.trim().replace(/\s*\(.*?\)\s*/g, '');
            // assemblyCostMap의 키(node ID)에 해당하는 노드의 라벨로 매칭
            for (const [nid, data] of Object.entries(assemblyCostMap)) {
                const n = nodes[nid] as any;
                if (n && n.label) {
                    const nLabel = n.label.trim().replace(/\s*\(.*?\)\s*/g, '');
                    if (nLabel === labelNorm) return data;
                }
            }
            return null;
        };

        // 1차 자식 순회 → group vs single 결정
        type OptionItem = { id: string; name: string; standardPrice: number; salesPrice: number; unit: string; type: 'single' | 'group'; children?: { id: string; name: string; unitPrice: number; originalUnitPrice: number; unit: string }[]; };
        const options: OptionItem[] = [];
        const directChildren = getChildren(optionSourceId);

        // Helper: 원본 노드의 label을 우선 사용 (파트너 copy 노드의 잘못된 label 방지)
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

        for (const child of directChildren) {
            const lookupId = (child as any).attributes?.originalSourceId || child.id;
            const costData = assemblyCostMap[lookupId] || assemblyCostMap[child.id] || findCostByLabel(child.label);
            const stdPrice = costData ? (parseFloat(String(costData.price).replace(/,/g, '')) || 0) : 0;
            const sPrice = calcSalesPrice(lookupId, child.id, stdPrice);
            const childChildren = getChildren(child.id);

            if (childChildren.length > 0) {
                // Group 옵션 (자식 선택지 있음) → 스위치 UI
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
                        unit: gcCostData?.unit || '건',
                    });
                }
                // Group 옵션은 가격 여부와 관계없이 항상 표시 (선택지 제공)
                options.push({
                    id: child.id,
                    name: getOriginalLabel(child),
                    standardPrice: stdPrice,
                    salesPrice: sPrice || stdPrice,
                    unit: costData?.unit || '건',
                    type: 'group',
                    children: groupChildren,
                });
            } else {
                // Single 옵션 (리프) — 가격 여부 무관 모두 표시
                const finalPrice = sPrice || stdPrice;
                options.push({
                    id: child.id,
                    name: getOriginalLabel(child),
                    standardPrice: stdPrice,
                    salesPrice: finalPrice,
                    unit: costData?.unit || 'm',
                    type: 'single',
                });
            }
        }
        return options;
    }, [optionSourceId, nodes, selectedPartnerId, partners]);

    // 시스템 선택 핸들러
    const handleSelectSystem = (systemId: string, systemName: string) => {
        // depth > 2이면 첫 번째 자식을 자동 드릴다운 선택
        const sysDepth = depthToLeaf(systemId);
        let initialDrillPath: { id: string; name: string }[] = [];
        if (sysDepth > 2) {
            const children = getChildNodes(systemId);
            if (children.length > 0) {
                initialDrillPath = [{ id: children[0].id, name: children[0].label || '' }];
            }
        }
        setItemForm(prev => ({
            ...prev,
            selectedSystemId: systemId,
            selectedSystemName: systemName,
            systemDrillPath: initialDrillPath,
            selectedOptions: [],
        }));
    };

    // 제품 선택 시 첫 번째 시스템 자동 선택
    useEffect(() => {
        if (orderInputMode === 'PRODUCT' && itemForm.productId && productSystemNodes.length > 0 && !itemForm.selectedSystemId) {
            const firstSys = productSystemNodes[0];
            handleSelectSystem(firstSys.id, firstSys.label || '');
        }
    }, [productSystemNodes, itemForm.productId]);

    // 드릴다운 선택 핸들러 (특정 레벨에서 선택)
    const handleDrillDown = (level: number, nodeId: string, nodeName: string) => {
        setItemForm(prev => {
            const newPath = (prev.systemDrillPath || []).slice(0, level);
            newPath.push({ id: nodeId, name: nodeName });
            return { ...prev, systemDrillPath: newPath, selectedOptions: [] };
        });
    };

    // 드릴다운 경로(국산/솜피/외산 등)의 가격 합산 — useMemo로 실시간 계산
    const drillSystemPrice = useMemo(() => {
        if (!itemForm.systemDrillPath?.length) return 0;
        // 전체 노드에서 sales_price_assembly 수집 (1회만)
        const allN = Object.values(nodes) as any[];
        const spMap: Record<string, any> = {};
        for (const n of allN) {
            if (n.attributes?.sales_price_assembly) {
                try { Object.assign(spMap, JSON.parse(n.attributes.sales_price_assembly)); } catch (e) { }
            }
        }
        let total = 0;
        for (const dp of itemForm.systemDrillPath) {
            const dpNode = nodes[dp.id] as any;
            const lookupIds = [dp.id];
            if (dpNode?.attributes?.originalSourceId) lookupIds.push(dpNode.attributes.originalSourceId);
            if (dpNode?.sourceIds && Array.isArray(dpNode.sourceIds)) lookupIds.push(...dpNode.sourceIds);
            let dpPrice = 0;
            for (const lid of lookupIds) {
                const spData = spMap[lid];
                if (spData) {
                    const pPrice = spData[selectedPartnerId!]?.price || spData['ALL']?.price;
                    if (pPrice) { dpPrice = parseFloat(String(pPrice).replace(/,/g, '')) || 0; break; }
                }
            }
            // label 기반 fallback
            if (dpPrice <= 0) {
                const dpLabel = dp.name.trim();
                for (const [key, spData] of Object.entries(spMap)) {
                    const kNode = nodes[key] as any;
                    if (kNode && kNode.label?.trim() === dpLabel) {
                        const pPrice = (spData as any)[selectedPartnerId!]?.price || (spData as any)['ALL']?.price;
                        if (pPrice) { dpPrice = parseFloat(String(pPrice).replace(/,/g, '')) || 0; break; }
                    }
                }
            }
            total += dpPrice;
        }
        return total;
    }, [itemForm.systemDrillPath, nodes, selectedPartnerId]);

    // === 실사 관련 로직 ===

    // 실사가능 여부 판별 (상품 노드의 isReal 속성 — 표준설정>상품원가>상품관리에서 설정)
    const isMeasureAllowed = useMemo(() => {
        if (!itemForm.productId) return false;
        const prodNode = nodes[itemForm.productId] as any;
        if (!prodNode) return false;
        // 직접 속성 확인
        if (prodNode.attributes?.isReal === 'true') return true;
        // sourceIds 탐색
        if (prodNode.sourceIds && Array.isArray(prodNode.sourceIds)) {
            for (const srcId of prodNode.sourceIds) {
                const src = nodes[srcId] as any;
                if (src?.attributes?.isReal === 'true') return true;
            }
        }
        // originalSourceId 탐색
        if (prodNode.attributes?.originalSourceId) {
            const src = nodes[prodNode.attributes.originalSourceId] as any;
            if (src?.attributes?.isReal === 'true') return true;
        }
        return false;
    }, [itemForm.productId, nodes]);

    // 실사비 데이터 조회 (cost_measure_list + sales_price_measure)
    const measureCostData = useMemo(() => {
        if (!itemForm.productId || !isMeasureAllowed) return [];
        const prodNode = nodes[itemForm.productId] as any;
        if (!prodNode) return [];

        // cost_measure_list 수집 (노드 + sourceIds + originalSourceId + 조상)
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
        // 조상 탐색
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

            // sales_price_measure 조회 (판매단가 적용)
            let salesPriceMap: Record<string, any> = {};
            const allNodes = Object.values(nodes) as any[];
            for (const n of allNodes) {
                if (n.attributes?.sales_price_measure) {
                    try { Object.assign(salesPriceMap, JSON.parse(n.attributes.sales_price_measure)); } catch (e) { }
                }
            }

            return list.map((item: any) => {
                const stdPrice = parseFloat(String(item.standardPrice || '0').replace(/,/g, '')) || 0;
                // 거래처별 판매단가 확인
                let salesPrice = stdPrice;
                const spData = salesPriceMap[item.id];
                if (spData) {
                    const pPrice = spData[selectedPartnerId!]?.price || spData['ALL']?.price;
                    if (pPrice) salesPrice = parseFloat(String(pPrice).replace(/,/g, '')) || stdPrice;
                }
                return {
                    id: item.id,
                    category: item.category || 'MARGIN_MEASURE',
                    unit: item.unit || 'SQM',
                    standardPrice: stdPrice,
                    salesPrice,
                };
            });
        } catch (e) { return []; }
    }, [itemForm.productId, isMeasureAllowed, nodes, selectedPartnerId]);

    // 실사비 계산 헬퍼
    const calcMeasurePrice = (category: string, appliedArea: number, cuttingUnitPrice: number, qty: number): number => {
        if (!category || measureCostData.length === 0) return 0;
        const costItem = measureCostData.find((c: any) => c.category === category);
        if (!costItem) return 0;
        const price = costItem.salesPrice;
        if (costItem.unit === 'SQM') {
            return Math.round(price * appliedArea * qty);
        } else if (costItem.unit === 'CUTTING_LINK') {
            // 제단비 연동: 제단 단가를 실사 단가로 사용 × 면적 × 수량
            // standardPrice가 비율(%)이면 적용, 아니면 100% (제단 단가 그대로)
            const ratio = costItem.standardPrice > 0 && costItem.standardPrice <= 200 ? costItem.standardPrice / 100 : 1;
            return Math.round(cuttingUnitPrice * ratio * appliedArea * qty);
        } else if (costItem.unit === 'PER_PIECE') {
            return Math.round(price * qty);
        }
        return 0;
    };

    // 카테고리 라벨 매핑
    const MEASURE_CATEGORY_LABELS: Record<string, string> = {
        'MARGIN_MEASURE': '여백실사',
        'FULL_MEASURE': '꽉찬실사',
        'MARGIN_LOGO': '여백로고',
        'FIXED_LOGO': '고정로고',
    };

    // 실사 이미지 선택 핸들러
    const handleSelectMeasureImage = (img: any) => {
        setItemForm(prev => {
            // 이미 선택된 이미지 클릭 시 선택 해제 (토글)
            if (prev.measureImageId === String(img.id)) {
                const qty = parseFloat(prev.quantity) || 1;
                const cuttingTotal = prev.prodAppliedArea > 0 ? Math.round(prev.unitPrice * prev.prodAppliedArea * qty) : Math.round(prev.unitPrice * qty);
                const optionTotal = calcOptionTotal(prev.selectedOptions);
                const rawTotal = cuttingTotal + optionTotal;
                const roundedTotal = Math.round(rawTotal / 10) * 10;
                return {
                    ...prev,
                    measureImageId: '', measureImageName: '', measureImageUrl: '',
                    measureCategory: '', measureUnitPrice: 0,
                    price: String(roundedTotal),
                };
            }
            const qty2 = parseFloat(prev.quantity) || 1;
            const measureTotal = calcMeasurePrice(prev.measureCategory, prev.prodAppliedArea, prev.unitPrice, qty2);
            const cuttingTotal = prev.prodAppliedArea > 0 ? Math.round(prev.unitPrice * prev.prodAppliedArea * qty2) : Math.round(prev.unitPrice * qty2);
            const optionTotal = calcOptionTotal(prev.selectedOptions);
            const rawTotal = cuttingTotal + measureTotal + optionTotal;
            const roundedTotal = Math.round(rawTotal / 10) * 10;
            return {
                ...prev,
                measureImageId: String(img.id),
                measureImageName: img.tags[0] || '',
                measureImageUrl: img.imageUrl || '',
                measureUnitPrice: measureTotal,
                price: String(roundedTotal),
            };
        });
    };

    // 실사 카테고리 변경 핸들러
    const handleMeasureCategoryChange = (category: string) => {
        setItemForm(prev => {
            const costItem = measureCostData.find((c: any) => c.category === category);
            const measurePrice = costItem ? costItem.salesPrice : 0;
            const qty3 = parseFloat(prev.quantity) || 1;
            const measureTotal = calcMeasurePrice(category, prev.prodAppliedArea, prev.unitPrice, qty3);
            const cuttingTotal = prev.prodAppliedArea > 0 ? Math.round(prev.unitPrice * prev.prodAppliedArea * qty3) : Math.round(prev.unitPrice * qty3);
            const optionTotal = calcOptionTotal(prev.selectedOptions);
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

    // 옵션비 합산 헬퍼
    const calcOptionTotal = (opts: typeof itemForm.selectedOptions): number => {
        return opts.filter(o => o.checked).reduce((sum, o) => {
            let qty = parseFloat(String(o.quantity)) || 0;
            // unit이 'm'이면 입력값은 cm이므로 m으로 변환
            if (o.unit === 'm') qty = qty / 100;
            if (o.type === 'group') {
                const selectedChild = o.children?.find(c => c.id === o.selectedChildId);
                // group의 child unit이 'm'이면 동일 변환
                const childUnit = selectedChild?.unit || '';
                let groupQty = parseFloat(String(o.quantity)) || 0;
                if (childUnit === 'm') groupQty = groupQty / 100;
                return sum + (selectedChild ? selectedChild.unitPrice * groupQty : 0);
            }
            return sum + (o.unitPrice * qty);
        }, 0);
    };

    // 시스템 선택 시 옵션 자동 로드
    useEffect(() => {
        if (itemForm.selectedSystemId && systemOptions.length > 0) {
            setItemForm(prev => {
                if (prev.selectedOptions.length > 0 && prev.selectedOptions[0]?.id === systemOptions[0]?.id) return prev;
                const prodW = parseFloat(prev.prodWidth) || 0;
                const prodH = parseFloat(prev.prodHeight) || 0;
                const newOptions = systemOptions.map(opt => {
                    const nameNorm = opt.name.trim().replace(/\s/g, '');
                    const is줄길이 = nameNorm.includes('줄길이');
                    const is하단바 = nameNorm.includes('하단바');
                    // 줄길이: quantity를 세로사이즈(cm)로 기본 설정
                    // 하단바: quantity를 가로사이즈(m)로 설정 (단가 × 가로사이즈)
                    let qty = 1;
                    if (is줄길이 && prodH > 0) qty = prodH;
                    if (is하단바 && prodW > 0) qty = Math.round((prodW / 100) * 10) / 10;
                    return {
                        id: opt.id,
                        name: opt.name,
                        checked: true,
                        quantity: qty,
                        unitPrice: opt.salesPrice,
                        originalUnitPrice: opt.salesPrice,
                        unit: opt.unit,
                        type: opt.type as 'single' | 'group',
                        children: opt.children,
                        selectedChildId: opt.children?.[0]?.id || '',
                    };
                });
                const optionTotal = calcOptionTotal(newOptions);
                const cuttingTotal = prev.unitPrice * (parseFloat(prev.quantity) || 1);
                const measureTotal = calcMeasurePrice(prev.measureCategory, prev.prodAppliedArea, prev.unitPrice, parseFloat(prev.quantity) || 1);
                const rawTotal = cuttingTotal + measureTotal + optionTotal + drillSystemPrice;
                const roundedTotal = Math.round(rawTotal / 10) * 10;
                return { ...prev, selectedOptions: newOptions, price: String(roundedTotal) };
            });
        }
    }, [systemOptions, itemForm.selectedSystemId]);

    // 옵션 체크/해제 핸들러
    const handleToggleOption = (optionId: string) => {
        setItemForm(prev => {
            const newOptions = prev.selectedOptions.map(o =>
                o.id === optionId ? { ...o, checked: !o.checked } : o
            );
            const optionTotal = calcOptionTotal(newOptions);
            const cuttingTotal = prev.unitPrice * (parseFloat(prev.quantity) || 1);
            const measureTotal = calcMeasurePrice(prev.measureCategory, prev.prodAppliedArea, prev.unitPrice, parseFloat(prev.quantity) || 1);
            const rawTotal = cuttingTotal + measureTotal + optionTotal + drillSystemPrice;
            const roundedTotal = Math.round(rawTotal / 10) * 10;
            return { ...prev, selectedOptions: newOptions, price: String(roundedTotal) };
        });
    };

    // group 옵션에서 자식 선택 변경 핸들러 (스위치)
    const handleSelectOptionChild = (optionId: string, childId: string) => {
        setItemForm(prev => {
            const newOptions = prev.selectedOptions.map(o =>
                o.id === optionId ? { ...o, selectedChildId: childId, checked: true } : o
            );
            const optionTotal = calcOptionTotal(newOptions);
            const cuttingTotal = prev.unitPrice * (parseFloat(prev.quantity) || 1);
            const measureTotal = calcMeasurePrice(prev.measureCategory, prev.prodAppliedArea, prev.unitPrice, parseFloat(prev.quantity) || 1);
            const rawTotal = cuttingTotal + measureTotal + optionTotal + drillSystemPrice;
            const roundedTotal = Math.round(rawTotal / 10) * 10;
            return { ...prev, selectedOptions: newOptions, price: String(roundedTotal) };
        });
    };

    // 옵션 수량/단가 변경 핸들러
    const handleOptionChange = (optionId: string, field: 'quantity' | 'unitPrice', value: string) => {
        setItemForm(prev => {
            const newOptions = prev.selectedOptions.map(o => {
                if (o.id !== optionId) return o;
                if (field === 'quantity') {
                    return { ...o, quantity: value as any };
                }
                const numVal = parseFloat(value.replace(/,/g, '')) || 0;
                return { ...o, [field]: numVal };
            });
            const optionTotal = calcOptionTotal(newOptions);
            const cuttingTotal = prev.unitPrice * (parseFloat(prev.quantity) || 1);
            const measureTotal = calcMeasurePrice(prev.measureCategory, prev.prodAppliedArea, prev.unitPrice, parseFloat(prev.quantity) || 1);
            const rawTotal = cuttingTotal + measureTotal + optionTotal + drillSystemPrice;
            const roundedTotal = Math.round(rawTotal / 10) * 10;
            return { ...prev, selectedOptions: newOptions, price: String(roundedTotal) };
        });
    };

    // 가로/세로 사이즈 변경 핸들러
    const handleProdSizeChange = (field: 'prodWidth' | 'prodHeight', value: string) => {
        const numVal = parseFloat(value) || 0;
        const otherField = field === 'prodWidth' ? 'prodHeight' : 'prodWidth';

        setItemForm(prev => {
            const w = field === 'prodWidth' ? numVal : (parseFloat(prev.prodWidth) || 0);
            const h = field === 'prodHeight' ? numVal : (parseFloat(prev.prodHeight) || 0);

            // 면적 계산 (cm → m 변환: /100)
            const area = (w / 100) * (h / 100);
            let sizeError = '';

            // 사이즈 검증
            if (productCuttingData) {
                if (w > 0 && productCuttingData.maxWidth > 0 && w > productCuttingData.maxWidth) {
                    sizeError = `가로 사이즈가 제작 최대사이즈(${productCuttingData.maxWidth}cm)를 초과하였습니다.`;
                } else if (h > 0 && productCuttingData.maxHeight > 0 && h > productCuttingData.maxHeight) {
                    sizeError = `세로 사이즈가 제작 최대사이즈(${productCuttingData.maxHeight}cm)를 초과하였습니다.`;
                }
            }

            // 적용 면적 계산 (최소사이즈 적용 + basicArea 적용)
            let appliedW = w;
            let appliedH = h;
            if (productCuttingData) {
                if (appliedW > 0 && appliedW < productCuttingData.minWidth) appliedW = productCuttingData.minWidth;
                if (appliedH > 0 && appliedH < productCuttingData.minHeight) appliedH = productCuttingData.minHeight;
            }
            let appliedArea = (appliedW / 100) * (appliedH / 100);
            if (productCuttingData && productCuttingData.basicArea > 0 && appliedArea > 0 && appliedArea < productCuttingData.basicArea) {
                appliedArea = productCuttingData.basicArea;
            }

            // 단가: 설정된 판매단가 그대로 사용 (면적/수량과 무관)
            let unitPrice = 0;
            if (productCuttingData && appliedArea > 0 && !sizeError) {
                unitPrice = productCuttingData.salesPrice;
            }

            // 총금액: (단가 × 면적 × 수량) + 실사비 + 옵션비, 10원 단위 반올림
            const qty = parseFloat(prev.quantity) || 1;
            const newAppliedArea = Math.round(appliedArea * 10) / 10;
            let cuttingTotal = 0;
            if (productCuttingData && !sizeError && unitPrice > 0) {
                if (productCuttingData.unit === 'SQM') {
                    cuttingTotal = Math.round(unitPrice * newAppliedArea * qty);
                } else if (productCuttingData.unit === 'WIDTH') {
                    const appliedWidthCm = appliedW;
                    cuttingTotal = Math.round(unitPrice * (appliedWidthCm / productCuttingData.standardWidth) * qty);
                } else {
                    cuttingTotal = unitPrice * qty;
                }
            }
            const measureTotal = calcMeasurePrice(prev.measureCategory, newAppliedArea, unitPrice, qty);
            // 줄길이/하단바 옵션 사이즈 연동 업데이트
            const updatedOptions = prev.selectedOptions.map(o => {
                const nameNorm = o.name.trim().replace(/\s/g, '');
                const is줄길이 = nameNorm.includes('줄길이');
                const is하단바 = nameNorm.includes('하단바');
                if (is줄길이 && h > 0) {
                    return { ...o, quantity: h };
                }
                if (is하단바 && w > 0) {
                    return { ...o, quantity: Math.round((w / 100) * 10) / 10 };
                }
                return o;
            });

            const optionTotal = calcOptionTotal(updatedOptions);
            const rawTotal = cuttingTotal + measureTotal + optionTotal;
            const roundedTotal = Math.round(rawTotal / 10) * 10;

            return {
                ...prev,
                [field]: value,
                prodArea: Math.round(area * 10) / 10,
                prodAppliedArea: newAppliedArea,
                sizeError,
                unitPrice: sizeError ? 0 : unitPrice,
                originalUnitPrice: unitPrice,
                selectedOptions: updatedOptions,
                price: sizeError ? '0' : String(roundedTotal),
            };
        });
    };

    // 제품 모드 수량 변경 시 가격 재계산
    const handleProdQuantityChange = (value: string) => {
        setItemForm(prev => {
            const qty = parseFloat(value) || 0;
            let cuttingTotal = qty * prev.unitPrice;
            if (prev.prodAppliedArea > 0) {
                cuttingTotal = Math.round(prev.unitPrice * prev.prodAppliedArea * qty);
            }
            const measureTotal = calcMeasurePrice(prev.measureCategory, prev.prodAppliedArea, prev.unitPrice, qty);
            const optionTotal = calcOptionTotal(prev.selectedOptions);
            const rawTotal = cuttingTotal + measureTotal + optionTotal;
            const roundedTotal = Math.round(rawTotal / 10) * 10;
            return {
                ...prev,
                quantity: value,
                price: String(roundedTotal),
            };
        });
    };

    // 제품 모드 단가 수동 변경 핸들러
    const handleProdUnitPriceChange = (value: string) => {
        setItemForm(prev => {
            const newPrice = parseFloat(value.replace(/,/g, '')) || 0;
            const qty = parseFloat(prev.quantity) || 1;
            let cuttingTotal = newPrice * qty;
            if (prev.prodAppliedArea > 0) {
                cuttingTotal = Math.round(newPrice * prev.prodAppliedArea * qty);
            }
            const measureTotal = calcMeasurePrice(prev.measureCategory, prev.prodAppliedArea, newPrice, qty);
            const optionTotal = calcOptionTotal(prev.selectedOptions);
            const rawTotal = cuttingTotal + measureTotal + optionTotal;
            const roundedTotal = Math.round(rawTotal / 10) * 10;
            return {
                ...prev,
                unitPrice: newPrice,
                price: String(roundedTotal),
            };
        });
    };

    // 제품 선택 후 productCuttingData가 로드되면 기본 사이즈로 자동 계산
    useEffect(() => {
        if (orderInputMode === 'PRODUCT' && productCuttingData && itemForm.prodWidth && itemForm.prodHeight && itemForm.unitPrice === 0) {
            handleProdSizeChange('prodWidth', itemForm.prodWidth);
        }
    }, [productCuttingData]);

    return (
        <div className="flex flex-col h-full w-full overflow-hidden font-sans relative" style={{ background: 'var(--admin-bg)', color: 'var(--admin-text)', fontSize: 'var(--theme-font-base)' }}>

            {/* 1. Title & Controls Area */}
            <div className="flex-shrink-0 px-8 py-4 shadow-sm z-20 h-20 flex items-center justify-between" style={{ background: 'var(--admin-surface)', borderBottom: '1px solid var(--admin-border)' }}>

                {/* Title */}
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--admin-text)' }}>
                        <FileText style={{ color: 'var(--theme-primary)' }} /> 주문접수
                    </h1>
                </div>

                {/* Controls: Date & Search */}
                <div className="flex flex-1 md:justify-end gap-3 min-w-0 items-center">

                    {/* Custom Date Picker UI */}
                    <div className="flex items-center rounded-xl p-1 shadow-sm h-[40px]" style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}>
                        <button onClick={handleMainToday} className="px-3 h-full rounded-lg text-xs font-bold transition-colors flex items-center" style={{ background: 'var(--admin-bg)', color: 'var(--admin-text-sub)' }} onMouseEnter={e => (e.currentTarget.style.background = 'var(--admin-list-hover)')} onMouseLeave={e => (e.currentTarget.style.background = 'var(--admin-bg)')}>오늘</button>
                        <div className="w-px h-4 mx-2" style={{ background: 'var(--admin-border)' }} />
                        <div className="flex items-center gap-2 px-1">
                            <button onClick={handleMainPrevDay} className="p-1 rounded-full transition-colors" style={{ color: 'var(--admin-text-sub)' }} onMouseEnter={e => (e.currentTarget.style.background = 'var(--admin-list-hover)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}><ChevronLeft size={18} strokeWidth={2.5} /></button>
                            <div className="flex items-center justify-center gap-2 min-w-[120px]">
                                <span className="text-base font-extrabold leading-none tracking-tight" style={{ color: 'var(--theme-primary)' }}>{formattedDateStr}</span>
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ color: 'var(--theme-primary)', background: 'var(--theme-primary-bg)' }}>{relativeDateStr}</span>
                            </div>
                            <button onClick={handleMainNextDay} className="p-1 rounded-full transition-colors" style={{ color: 'var(--admin-text-sub)' }} onMouseEnter={e => (e.currentTarget.style.background = 'var(--admin-list-hover)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}><ChevronRight size={18} strokeWidth={2.5} /></button>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="relative w-full max-w-xs h-[40px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={16} style={{ color: 'var(--admin-text-sub)' }} />
                        <input type="text" placeholder="거래처명, 상품명 검색..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-full pl-9 pr-4 rounded-xl text-sm font-medium outline-none transition-all"
                            style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}
                            onFocus={e => { e.currentTarget.style.borderColor = 'var(--theme-primary)'; }}
                            onBlur={e => { e.currentTarget.style.borderColor = 'var(--admin-border)'; }}
                        />
                    </div>
                </div>
            </div>


            {/* 2. Status Cards */}
            <div className="flex-shrink-0 px-8 py-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <button onClick={handleOpenModal} className="text-white rounded-2xl p-5 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all flex flex-col justify-between items-start group text-left h-32 relative overflow-hidden" style={{ background: 'var(--theme-primary)' }}>
                        <div className="absolute right-[-20px] top-[-20px] bg-white/10 w-24 h-24 rounded-full blur-xl group-hover:bg-white/20 transition-colors" />
                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm"><Plus size={24} className="text-white" strokeWidth={3} /></div>
                        <div><span className="text-lg font-bold block">접수 +</span><span className="text-xs opacity-80">신규 주문 직접 등록</span></div>
                    </button>
                    <div className="rounded-2xl p-5 shadow-sm flex flex-col justify-between h-32" style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}>
                        <div className="flex justify-between items-start"><div className="p-2 rounded-lg" style={{ background: 'var(--theme-primary-bg)', color: 'var(--theme-primary)' }}><FileText size={20} /></div><span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: 'var(--theme-primary-bg)', color: 'var(--theme-primary)' }}>Today</span></div>
                        <div><span className="text-xs font-bold block mb-1" style={{ color: 'var(--admin-text-sub)' }}>금일접수 건수 / 수량</span><div className="flex items-baseline gap-2"><span className="text-2xl font-bold" style={{ color: 'var(--admin-text)' }}>{stats.totalCount}</span><span className="text-sm" style={{ color: 'var(--admin-text-sub)' }}>건</span><span style={{ color: 'var(--admin-border)' }}>|</span><span className="text-2xl font-bold" style={{ color: 'var(--admin-text)' }}>{stats.totalQty}</span><span className="text-sm" style={{ color: 'var(--admin-text-sub)' }}>롤</span></div></div>
                    </div>
                    <div className="rounded-2xl p-5 shadow-sm flex flex-col justify-between h-32" style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}>
                        <div className="flex justify-between items-start"><div className="p-2 rounded-lg" style={{ background: 'var(--theme-primary-bg)', color: 'var(--theme-primary)' }}><User size={20} /></div><span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: 'var(--theme-primary-bg)', color: 'var(--theme-primary)' }}>Today</span></div>
                        <div><span className="text-xs font-bold block mb-1" style={{ color: 'var(--admin-text-sub)' }}>금일접수 거래처수</span><div className="flex items-baseline gap-2"><span className="text-2xl font-bold" style={{ color: 'var(--admin-text)' }}>{stats.uniquePartners}</span><span className="text-sm" style={{ color: 'var(--admin-text-sub)' }}>개사</span></div></div>
                    </div>
                    <div className="rounded-2xl p-5 shadow-sm flex flex-col justify-between h-32" style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}>
                        <div className="flex justify-between items-start"><div className="p-2 rounded-lg" style={{ background: 'var(--theme-primary-bg)', color: 'var(--theme-primary)' }}><Package size={20} /></div><span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: 'var(--theme-primary-bg)', color: 'var(--theme-primary)' }}>Today</span></div>
                        <div><span className="text-xs font-bold block mb-1" style={{ color: 'var(--admin-text-sub)' }}>금일접수 상품수</span><div className="flex items-baseline gap-2"><span className="text-2xl font-bold" style={{ color: 'var(--admin-text)' }}>{stats.uniqueProducts}</span><span className="text-sm" style={{ color: 'var(--admin-text-sub)' }}>종</span></div></div>
                    </div>
                </div>
            </div>

            {/* 3. Data Grid */}
            <div className="flex-1 px-8 pb-8 overflow-hidden flex flex-col">
                <div className="rounded-2xl flex-1 flex flex-col shadow-sm overflow-hidden" style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}>
                    <div className="px-5 py-3 flex justify-between items-center" style={{ background: 'var(--admin-grid-header)', borderBottom: '1px solid var(--admin-border)' }}>
                        <div className="text-sm font-bold" style={{ color: 'var(--admin-text)' }}>접수 내역 리스트 (더블클릭하여 수정)</div>
                        <div className="flex gap-2"><button className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold" style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', color: 'var(--admin-text-sub)' }}><Filter size={14} /> 필터</button><button className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold" style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', color: 'var(--admin-text-sub)' }}><Download size={14} /> 엑셀 다운로드</button></div>
                    </div>
                    <div className="flex-1 overflow-auto scrollbar-hide">
                        <table className="w-full text-sm text-left whitespace-nowrap">
                            <thead className="font-bold text-xs uppercase sticky top-0 z-10 shadow-sm" style={{ background: 'var(--admin-grid-header)', color: 'var(--admin-text-sub)' }}>
                                <tr>
                                    <th className="px-4 py-3 text-center w-12">NO</th>
                                    <th className="px-4 py-3 text-center">입력시간</th>
                                    <th className="px-4 py-3">거래처명</th>
                                    <th className="px-4 py-3 text-left">주문상품</th>
                                    <th className="px-4 py-3 text-center w-24">규격</th>
                                    <th className="px-4 py-3 text-center w-28">출고일</th>
                                    <th className="px-4 py-3 text-right">주문량</th>
                                    <th className="px-4 py-3 text-right">금액</th>
                                    <th className="px-4 py-3 text-right">잔액</th>
                                    <th className="px-4 py-3 text-right">재고량</th>
                                    <th className="px-4 py-3">도착지</th>
                                    <th className="px-4 py-3">비고</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredList.map((item, index) => {
                                    if (!item) return null;
                                    return (
                                        <tr
                                            key={item.id}
                                            onDoubleClick={() => handleRowDoubleClick(item)}
                                            className="transition-colors group cursor-pointer"
                                            style={{ borderBottom: '1px solid var(--admin-border)' }}
                                            onMouseEnter={e => { e.currentTarget.style.background = 'var(--admin-list-hover)'; }}
                                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                                        >
                                        <td className="px-4 py-3 text-center font-medium" style={{ color: 'var(--admin-text-sub)' }}>{index + 1}</td>
                                            <td className="px-4 py-3 text-center font-mono" style={{ color: 'var(--admin-text-sub)' }}>{item.inputTime}</td>
                                            <td className="px-4 py-3 font-bold" style={{ color: 'var(--admin-text)' }}>{item.partnerName}</td>
                                            <td className="px-4 py-3 font-medium" style={{ color: 'var(--theme-primary)' }}>{item.productName}</td>
                                            <td className="px-4 py-3 text-center font-medium" style={{ color: 'var(--admin-text)' }}>{item.width}</td>
                                            <td className="px-4 py-3 text-center font-mono" style={{ color: 'var(--admin-text-sub)' }}>{item.shippingDate}</td>
                                            <td className="px-4 py-3 text-right font-bold" style={{ color: 'var(--admin-text)' }}>
                                                {item.quantity} <span className="text-[10px] font-normal" style={{ color: 'var(--admin-text-sub)' }}>{item.unit}</span>
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono" style={{ color: 'var(--admin-text)' }}>{item.amount?.toLocaleString()}</td>
                                            <td className="px-4 py-3 text-right font-mono" style={{ color: 'var(--color-danger, #ef4444)' }}>{item.balance?.toLocaleString()}</td>
                                            <td className="px-4 py-3 text-right font-mono" style={{ color: 'var(--admin-text)' }}>
                                                {item.inventory?.toLocaleString()} <span className="text-[10px] font-normal" style={{ color: 'var(--admin-text-sub)' }}>{item.unit}</span>
                                            </td>
                                            <td className="px-4 py-3 truncate max-w-[150px]" style={{ color: 'var(--admin-text-sub)' }} title={item.destination}>{item.destination}</td>
                                            <td className="px-4 py-3 text-xs truncate max-w-[100px]" style={{ color: 'var(--admin-text-sub)' }}>{item.note}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {filteredList.length === 0 && (<div className="flex flex-col items-center justify-center h-64 gap-3" style={{ color: 'var(--admin-text-sub)' }}><FileText size={48} className="opacity-20" /><p>접수된 주문 내역이 없습니다.</p></div>)}
                    </div>
                </div>
            </div>

            {/* ========================================================================================= */}
            {/* 4. ORDER REGISTRATION MODAL (DEBUGGING) */}
            {/* ========================================================================================= */}
            {
                isModalOpen && (
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />

                        {/* Modal Container */}
                        <div className="rounded-3xl shadow-2xl relative z-10 flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200" style={{ width: '95vw', maxWidth: '1400px', height: '92vh', background: 'var(--admin-modal-bg)', color: 'var(--admin-text)' }}>

                            {/* Header */}
                            <div className="px-8 py-5 flex items-center justify-between sticky top-0 z-20 backdrop-blur-md" style={{ borderBottom: '1px solid var(--admin-border)', background: 'var(--admin-modal-bg)' }}>
                                <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--admin-text)' }}>
                                    <Edit style={{ color: 'var(--theme-primary)' }} size={24} />
                                    주문 직접 등록
                                    <span className="text-sm font-normal ml-2" style={{ color: 'var(--admin-text-sub)' }}>신규 주문을 직접 입력합니다.</span>
                                </h2>
                                <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-full transition-colors" style={{ color: 'var(--admin-text-sub)' }} onMouseEnter={e => (e.currentTarget.style.background = 'var(--admin-border)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}><X size={24} /></button>
                            </div>

                            {/* Content Scroll Area */}
                            <div className="flex-1 overflow-y-auto p-8 space-y-8" style={{ background: 'var(--admin-bg)' }}>

                                {/* SECTION 1: Order Info (Partner & Shipping) */}
                                <div className="p-6 rounded-2xl shadow-sm space-y-6" style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}>

                                    {/* Row 1: Partner Selection & Info */}
                                    <div className="flex flex-col md:flex-row gap-6 items-start md:items-center pb-6" style={{ borderBottom: '1px solid var(--admin-border)' }}>
                                        {/* Partner Search */}
                                        <div className="w-full md:w-1/3 relative z-30" ref={partnerSearchWrapperRef}>
                                            <label className="text-sm font-bold flex items-center gap-2 mb-2" style={{ color: 'var(--admin-text-sub)' }}><MapPin size={16} /> 거래처 선택</label>
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={16} style={{ color: 'var(--admin-text-sub)' }} />
                                                <input
                                                    type="text"
                                                    placeholder="거래처명 검색"
                                                    value={partnerSearch}
                                                    onChange={(e) => {
                                                        setPartnerSearch(e.target.value);
                                                        if (partnerSearchWrapperRef.current) {
                                                            const rect = partnerSearchWrapperRef.current.getBoundingClientRect();
                                                            const spaceBelow = window.innerHeight - rect.bottom;
                                                            const openUp = spaceBelow < 320;
                                                            setPartnerDropdownRect({ top: rect.bottom + 4, left: rect.left, width: rect.width, openUp });
                                                        }
                                                        setShowPartnerResults(true);
                                                    }}
                                                    onFocus={(e) => {
                                                        setPartnerSectionCollapsed(false);
                                                        e.currentTarget.style.borderColor = 'var(--theme-primary)';
                                                        if (partnerSearchWrapperRef.current) {
                                                            const rect = partnerSearchWrapperRef.current.getBoundingClientRect();
                                                            const spaceBelow = window.innerHeight - rect.bottom;
                                                            const openUp = spaceBelow < 320;
                                                            setPartnerDropdownRect({ top: rect.bottom + 4, left: rect.left, width: rect.width, openUp });
                                                        }
                                                        setShowPartnerResults(true);
                                                    }}
                                                    onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--admin-border)'; }}
                                                    onKeyDown={(e) => { if (e.key === 'Escape') { setShowPartnerResults(false); (e.target as HTMLInputElement).blur(); } }}
                                                    className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all"
                                                    style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}
                                                />
                                            </div>
                                        </div>

                                        {/* Partner Dropdown - fixed position to avoid overflow clipping */}
                                        {showPartnerResults && partnerDropdownRect && (() => {
                                            const filtered = partners.filter(p => (p.creatorId === supplierId || p.id === supplierId || p.id === `partner-${supplierId}`) && p.partnerName.includes(partnerSearch));
                                            const { top, left, width, openUp } = partnerDropdownRect;
                                            return (
                                                <div
                                                    onMouseDown={(e) => e.preventDefault()}
                                                    className="fixed z-[9999] rounded-xl shadow-2xl overflow-hidden"
                                                    style={{
                                                        background: 'var(--admin-surface)',
                                                        border: '1px solid var(--admin-border)',
                                                        boxShadow: openUp ? '0 -8px 32px rgba(0,0,0,0.28)' : '0 8px 32px rgba(0,0,0,0.28)',
                                                        width: `${width}px`,
                                                        left: `${left}px`,
                                                        ...(openUp
                                                            ? { bottom: `${window.innerHeight - top + 8}px` }
                                                            : { top: `${top}px` }
                                                        ),
                                                        maxHeight: '280px',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                    }}
                                                >
                                                    {/* 드롭다운 헤더 */}
                                                    <div className="px-4 py-2 flex items-center justify-between flex-shrink-0" style={{ borderBottom: '1px solid var(--admin-border)', background: 'var(--admin-bg)' }}>
                                                        <span className="text-xs font-bold" style={{ color: 'var(--admin-text-sub)' }}>거래처 목록</span>
                                                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: 'var(--theme-primary-bg)', color: 'var(--theme-primary)' }}>{filtered.length}건</span>
                                                    </div>
                                                    <div className="overflow-y-auto">
                                                        {filtered.length > 0 ? filtered.map(partner => (
                                                            <div
                                                                key={partner.id}
                                                                onClick={() => { handleSelectPartner(partner); setShowPartnerResults(false); }}
                                                                onMouseDown={(e) => { e.preventDefault(); handleSelectPartner(partner); setShowPartnerResults(false); }}
                                                                className="px-4 py-3 cursor-pointer flex items-center justify-between"
                                                                style={{ borderBottom: '1px solid var(--admin-border)', color: 'var(--admin-text)', background: 'transparent', transition: 'background 0.15s, color 0.15s' }}
                                                                onMouseEnter={e => {
                                                                    e.currentTarget.style.background = 'var(--admin-list-hover)';
                                                                    e.currentTarget.style.color = 'var(--theme-primary)';
                                                                }}
                                                                onMouseLeave={e => {
                                                                    e.currentTarget.style.background = 'transparent';
                                                                    e.currentTarget.style.color = 'var(--admin-text)';
                                                                }}
                                                            >
                                                                <div>
                                                                    <div className="font-bold text-sm">{partner.partnerName}</div>
                                                                    <div className="text-xs mt-0.5" style={{ color: 'var(--admin-text-sub)' }}>{partner.ceoName} | {partner.companyPhone}</div>
                                                                </div>
                                                                <span className="text-[10px] px-1.5 py-0.5 rounded font-bold" style={{ background: 'var(--theme-primary-bg)', color: 'var(--theme-primary)' }}>선택</span>
                                                            </div>
                                                        )) : (
                                                            <div className="px-4 py-6 text-center text-sm" style={{ color: 'var(--admin-text-sub)' }}>
                                                                <MapPin size={20} className="mx-auto mb-2 opacity-40" />
                                                                {partnerSearch ? `"${partnerSearch}"에 해당하는 거래처가 없습니다.` : '검색어를 입력해주세요.'}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })()}

                                        {/* Selected Info (Horizontal) */}
                                        <div className="flex-1 w-full relative z-0">
                                            {selectedPartnerId ? (
                                                <div className="flex items-center gap-8 px-6 py-3 rounded-xl" style={{ background: 'var(--theme-primary-bg)', border: '1px solid var(--admin-border)' }}>
                                                    <div><span className="text-xs block mb-0.5" style={{ color: 'var(--admin-text-sub)' }}>거래처명</span><span className="text-sm font-bold" style={{ color: 'var(--theme-primary)' }}>{partners.find(p => p.id === selectedPartnerId)?.partnerName}</span></div>
                                                    <div className="w-px h-8" style={{ background: 'var(--admin-border)' }} />
                                                    <div><span className="text-xs block mb-0.5" style={{ color: 'var(--admin-text-sub)' }}>대표자</span><span className="text-sm font-bold" style={{ color: 'var(--admin-text)' }}>{partners.find(p => p.id === selectedPartnerId)?.ceoName}</span></div>
                                                    <div className="w-px h-8" style={{ background: 'var(--admin-border)' }} />
                                                    <div><span className="text-xs block mb-0.5" style={{ color: 'var(--admin-text-sub)' }}>연락처</span><span className="text-sm font-bold font-mono" style={{ color: 'var(--admin-text)' }}>{partners.find(p => p.id === selectedPartnerId)?.companyPhone}</span></div>
                                                    <div className="w-px h-8" style={{ background: 'var(--admin-border)' }} />
                                                    <div><span className="text-xs block mb-0.5" style={{ color: 'var(--admin-text-sub)' }}>등급</span><span className="text-sm font-bold" style={{ color: 'var(--theme-primary)' }}>{partners.find(p => p.id === selectedPartnerId)?.grade || 'A'}등급</span></div>
                                                    <div className="w-px h-8" style={{ background: 'var(--admin-border)' }} />
                                                    <div><span className="text-xs block mb-0.5" style={{ color: 'var(--admin-text-sub)' }}>거래잔액</span><span className="text-sm font-bold" style={{ color: 'var(--admin-text)' }}>{(15400000).toLocaleString()}원</span></div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-center gap-2 py-3 rounded-xl" style={{ color: 'var(--admin-text-sub)', background: 'var(--admin-bg)', border: '1px dashed var(--admin-border)' }}>
                                                    <AlertCircle size={16} /> <span className="text-sm">거래처를 선택해주세요.</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Row 2: Basic Shipping Info */}
                                    <div ref={shippingInfoRef}>
                                        <h3 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--admin-text-sub)' }}><Calendar size={16} /> 기본 배송 정보</h3>
                                        <div className="grid grid-cols-12 gap-4">
                                            <div className="col-span-3">
                                                <label className="text-xs font-bold mb-1 block" style={{ color: 'var(--admin-text-sub)' }}>출고 요청일</label>
                                                <PremiumDatePicker
                                                    value={itemForm.shipDate}
                                                    onChange={(val) => setItemForm(prev => ({ ...prev, shipDate: val }))}
                                                    className="flex-1"
                                                />
                                            </div>
                                            <div className="col-span-4">
                                                <label className="text-xs font-bold mb-1 block" style={{ color: 'var(--admin-text-sub)' }}>도착지 주소</label>
                                                <input type="text" value={itemForm.destination} onChange={(e) => setItemForm(prev => ({ ...prev, destination: e.target.value }))} onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--theme-primary)'; }} onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--admin-border)'; }} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }} placeholder="기본 주소지" />
                                            </div>
                                            <div className="col-span-5">
                                                <label className="text-xs font-bold mb-1 block" style={{ color: 'var(--admin-text-sub)' }}>비고 (공통 메모)</label>
                                                <input type="text" value={itemForm.note} onChange={(e) => setItemForm(prev => ({ ...prev, note: e.target.value }))} onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--theme-primary)'; }} onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--admin-border)'; }} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }} placeholder="배송 요청사항 등" />
                                            </div>
                                        </div>
                                    </div>

                                </div>
                                {/* SECTION 2: Product Entry Form — 슬라이드 오버레이 효과 */}
                                <div
                                    className="rounded-2xl shadow-sm relative z-30"
                                    onClick={() => setPartnerSectionCollapsed(true)}
                                    style={{
                                        background: 'var(--admin-surface)',
                                        border: '1px solid var(--admin-border)',
                                        transition: 'margin-top 0.5s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.5s ease',
                                        marginTop: partnerSectionCollapsed ? `${-(shippingInfoHeight + 56)}px` : '0px',
                                        boxShadow: partnerSectionCollapsed ? '0 -8px 30px rgba(0,0,0,0.12)' : undefined,
                                    }}>
                                    <div className="px-6 py-3 flex justify-between items-center rounded-t-2xl" style={{ background: 'var(--admin-bg)', borderBottom: '1px solid var(--admin-border)' }}>
                                        <div className="flex items-center gap-3">
                                            <h3 className="font-bold flex items-center gap-2" style={{ color: 'var(--admin-text)' }}><Package size={18} /> 주문 상품 입력</h3>
                                            {/* 원단/제품 스위치 */}
                                            <div className="flex p-0.5 rounded-lg ml-2" style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}>
                                                <button
                                                    onClick={() => { setOrderInputMode('FABRIC'); resetItemForm(); setPartnerSectionCollapsed(true); }}
                                                    className="px-3 py-1.5 text-xs font-bold rounded-md transition-all"
                                                    style={orderInputMode === 'FABRIC' ? { background: 'var(--theme-primary)', color: '#ffffff', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' } : { color: 'var(--admin-text-sub)' }}
                                                >
                                                    원단
                                                </button>
                                                <button
                                                    onClick={() => { setOrderInputMode('PRODUCT'); resetItemForm(); setPartnerSectionCollapsed(true); }}
                                                    className="px-3 py-1.5 text-xs font-bold rounded-md transition-all"
                                                    style={orderInputMode === 'PRODUCT' ? { background: 'var(--theme-primary)', color: '#ffffff', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' } : { color: 'var(--admin-text-sub)' }}
                                                >
                                                    제품
                                                </button>
                                            </div>
                                        </div>
                                        <button onClick={() => resetItemForm()} className="text-xs flex items-center gap-1" style={{ color: 'var(--admin-text-sub)' }} onMouseEnter={e => (e.currentTarget.style.color = 'var(--theme-primary)')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--admin-text-sub)')}><RefreshCw size={12} /> 초기화</button>
                                    </div>
                                    <div className={`p-6 space-y-4 ${showMeasurePanel ? 'pt-1' : ''}`} style={{ transition: 'padding-top 0.4s ease' }}>

                                        {/* ============ 원단 모드 ============ */}
                                        {orderInputMode === 'FABRIC' && (
                                            <>
                                                {/* Row 1: Product Selection */}
                                                <div className="grid grid-cols-12 gap-4">
                                                    {/* Product Search */}
                                                    <div className="col-span-5">
                                                        <label className="text-xs font-bold mb-1 block" style={{ color: 'var(--admin-text-sub)' }}>상품 검색</label>
                                                        <div className="relative">
                                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={14} style={{ color: 'var(--admin-text-sub)' }} />
                                                            <input
                                                                type="text"
                                                                value={productSearch}
                                                                onChange={(e) => {
                                                                    setProductSearch(e.target.value);
                                                                    setShowProductResults(true);
                                                                }}
                                                                onFocus={(e) => { setShowProductResults(true); setPartnerSectionCollapsed(true); e.currentTarget.style.borderColor = 'var(--theme-primary)'; }}
                                                                onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--admin-border)'; }}
                                                                placeholder="상품명 검색..."
                                                                className="w-full pl-9 pr-3 py-2 rounded-lg text-sm outline-none transition-all"
                                                                style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}
                                                            />
                                                            {/* Product Dropdown */}
                                                            {showProductResults && (
                                                                <div className="absolute top-full left-0 right-0 mt-1 rounded-xl shadow-xl overflow-hidden z-50" style={{ background: 'var(--admin-surface)', border: '1px solid var(--theme-primary)', maxHeight: '240px', overflowY: 'auto' }}>
                                                                    {availableProducts
                                                                        .filter((n: any) => n.displayLabel.toLowerCase().includes(productSearch.toLowerCase()))
                                                                        .map((node: any) => {
                                                                            const isSelected = itemForm.productId === node.id;
                                                                            return (
                                                                                <div
                                                                                    key={node.id}
                                                                                    onClick={() => handleSelectProduct({ id: node.id, label: node.label, node })}
                                                                                    className="px-4 py-2.5 cursor-pointer text-sm font-medium flex items-center justify-between transition-colors"
                                                                                    style={{
                                                                                        background: isSelected ? 'var(--theme-primary-bg)' : 'transparent',
                                                                                        color: isSelected ? 'var(--theme-primary)' : 'var(--admin-text)',
                                                                                        fontWeight: isSelected ? 700 : 500,
                                                                                        borderBottom: '1px solid var(--admin-border)',
                                                                                    }}
                                                                                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--admin-list-hover)'; }}
                                                                                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                                                                                >
                                                                                    <span>{node.displayLabel}</span>
                                                                                    {isSelected && <span style={{ color: 'var(--theme-primary)', fontSize: '10px', fontWeight: 700 }}>✓</span>}
                                                                                </div>
                                                                            );
                                                                        })}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="col-span-3">
                                                        <label className="text-xs font-bold mb-1 block" style={{ color: 'var(--admin-text-sub)' }}>색상</label>
                                                        <div className="relative">
                                                            <button
                                                                onClick={() => setShowColorDropdown(!showColorDropdown)}
                                                                className="w-full px-3 py-2 rounded-lg text-sm text-left flex justify-between items-center transition-all outline-none"
                                                                style={{
                                                                    background: 'var(--admin-input-bg)',
                                                                    border: `1px solid ${showColorDropdown ? 'var(--theme-primary)' : 'var(--admin-border)'}`,
                                                                    color: 'var(--admin-text)',
                                                                    boxShadow: showColorDropdown ? '0 0 0 2px var(--theme-primary-bg)' : 'none',
                                                                }}
                                                            >
                                                                <span style={{ color: itemForm.colorName ? 'var(--admin-text)' : 'var(--admin-text-sub)' }}>{itemForm.colorName || '색상 선택'}</span>
                                                                <ChevronDown size={14} style={{ color: 'var(--admin-text-sub)', transform: showColorDropdown ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                                                            </button>
                                                            {showColorDropdown && itemForm.productId && (
                                                                <div className="absolute top-full left-0 right-0 mt-1 rounded-xl shadow-xl overflow-hidden z-50" style={{ background: 'var(--admin-surface)', border: '1px solid var(--theme-primary)', maxHeight: '240px', overflowY: 'auto' }}>
                                                                    {availableColors.map((colorItem: any) => {
                                                                        const isSelected = itemForm.colorId === colorItem.id;
                                                                        return (
                                                                            <div
                                                                                key={colorItem.id}
                                                                                onClick={() => handleSelectColor(colorItem)}
                                                                                className="px-4 py-2.5 cursor-pointer text-sm font-medium flex items-center justify-between transition-colors"
                                                                                style={{
                                                                                    background: isSelected ? 'var(--theme-primary-bg)' : 'transparent',
                                                                                    color: isSelected ? 'var(--theme-primary)' : 'var(--admin-text)',
                                                                                    fontWeight: isSelected ? 700 : 500,
                                                                                    borderBottom: '1px solid var(--admin-border)',
                                                                                }}
                                                                                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--admin-list-hover)'; }}
                                                                                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                                                                            >
                                                                                <span>{colorItem.label}</span>
                                                                                {isSelected && <span style={{ color: 'var(--theme-primary)', fontSize: '10px', fontWeight: 700 }}>✓</span>}
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Width */}
                                                    <div className="col-span-4">
                                                        <label className="text-xs font-bold mb-1 block" style={{ color: 'var(--admin-text-sub)' }}>규격 (폭)</label>
                                                        <div className="relative">
                                                            <button
                                                                onClick={() => setShowWidthDropdown(!showWidthDropdown)}
                                                                className="w-full px-3 py-2 rounded-lg text-sm text-left flex justify-between items-center transition-all outline-none"
                                                                style={{
                                                                    background: 'var(--admin-input-bg)',
                                                                    border: `1px solid ${showWidthDropdown ? 'var(--theme-primary)' : 'var(--admin-border)'}`,
                                                                    color: 'var(--admin-text)',
                                                                    boxShadow: showWidthDropdown ? '0 0 0 2px var(--theme-primary-bg)' : 'none',
                                                                }}
                                                            >
                                                                <span style={{ color: itemForm.width ? 'var(--admin-text)' : 'var(--admin-text-sub)' }}>{itemForm.width || '규격 선택'}</span>
                                                                <ChevronDown size={14} style={{ color: 'var(--admin-text-sub)', transform: showWidthDropdown ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                                                            </button>
                                                            {showWidthDropdown && itemForm.colorId && itemForm.productId && (
                                                                <div className="absolute top-full left-0 right-0 mt-1 rounded-xl shadow-xl overflow-hidden z-50" style={{ background: 'var(--admin-surface)', border: '1px solid var(--theme-primary)', maxHeight: '240px', overflowY: 'auto' }}>
                                                                    {(() => {
                                                                        if (availableWidths.length === 0) {
                                                                            return <div className="p-3 text-center text-xs" style={{ color: 'var(--admin-text-sub)' }}>규격 정보 없음</div>;
                                                                        }
                                                                        return availableWidths.map((w: any) => {
                                                                            const isSelected = itemForm.width === w.width;
                                                                            return (
                                                                                <div
                                                                                    key={w.id}
                                                                                    onClick={() => handleSelectWidth(w)}
                                                                                    className="px-4 py-2.5 cursor-pointer text-sm font-medium flex items-center justify-between transition-colors"
                                                                                    style={{
                                                                                        background: isSelected ? 'var(--theme-primary-bg)' : 'transparent',
                                                                                        color: isSelected ? 'var(--theme-primary)' : 'var(--admin-text)',
                                                                                        fontWeight: isSelected ? 700 : 500,
                                                                                        borderBottom: '1px solid var(--admin-border)',
                                                                                    }}
                                                                                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--admin-list-hover)'; }}
                                                                                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = isSelected ? 'var(--theme-primary-bg)' : 'transparent'; }}
                                                                                >
                                                                                    <span className="font-mono">{w.width}</span>
                                                                                    {isSelected && <span style={{ color: 'var(--theme-primary)', fontSize: '10px', fontWeight: 700 }}>✓</span>}
                                                                                </div>
                                                                            );
                                                                        });
                                                                    })()}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Row 2: Quantity & Price */}
                                                <div className="grid grid-cols-12 gap-4 items-end p-4 rounded-xl" style={{ background: 'var(--admin-bg)', border: '1px solid var(--admin-border)' }}>
                                                    {/* Unit Switch */}
                                                    <div className="col-span-2">
                                                        <label className="text-xs font-bold mb-1 block" style={{ color: 'var(--admin-text-sub)' }}>단위</label>
                                                        <div className="flex p-1 rounded-lg" style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}>
                                                            {itemForm.unitType === 'SLAT' ? (
                                                                <div className="w-full py-1.5 text-center text-xs font-bold rounded-md" style={{ background: 'var(--theme-primary-bg)', color: 'var(--theme-primary)' }}>
                                                                    슬랫개당
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    <button
                                                                        onClick={() => setItemForm(prev => ({ ...prev, unitType: 'ROLL' }))}
                                                                        className="flex-1 py-1.5 text-xs font-bold rounded-md transition-all"
                                                                        style={itemForm.unitType === 'ROLL' ? { background: 'var(--theme-primary)', color: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' } : { color: 'var(--admin-text-sub)' }}
                                                                    >
                                                                        Roll
                                                                    </button>
                                                                    <button
                                                                        onClick={() => setItemForm(prev => ({ ...prev, unitType: 'CUT' }))}
                                                                        className="flex-1 py-1.5 text-xs font-bold rounded-md transition-all"
                                                                        style={itemForm.unitType === 'CUT' ? { background: 'var(--theme-primary)', color: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' } : { color: 'var(--admin-text-sub)' }}
                                                                    >
                                                                        m
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Quantity */}
                                                    <div className="col-span-1">
                                                        <label className="text-xs font-bold mb-1 block" style={{ color: 'var(--admin-text-sub)' }}>수량</label>
                                                        {itemForm.unitType === 'ROLL' && stockLots.length > 0 ? (
                                                            <div className="relative">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setShowLotDropdown(true)}
                                                                    className="w-full px-2 py-2 rounded-lg text-sm font-bold text-right cursor-pointer flex items-center justify-between transition-colors"
                                                                    style={{ background: 'var(--admin-input-bg)', border: '2px solid var(--theme-primary)', color: 'var(--admin-text)' }}
                                                                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--theme-primary-bg)')}
                                                                    onMouseLeave={e => (e.currentTarget.style.background = 'var(--admin-input-bg)')}
                                                                >
                                                                    <span className="text-[9px]" style={{ color: 'var(--theme-primary)' }}>📦</span>
                                                                    <span style={{ color: itemForm.quantity ? 'var(--admin-text)' : 'var(--admin-text-sub)' }}>{itemForm.quantity || '0'}</span>
                                                                </button>
                                                                {selectedLotIds.size > 0 && (
                                                                    <div className="absolute -top-5 left-0 right-0 text-center text-[9px] font-bold" style={{ color: 'var(--theme-primary)' }}>
                                                                        {stockLots.filter(l => selectedLotIds.has(l.id)).reduce((s, l) => s + l.length, 0)}m
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <input type="number" value={itemForm.quantity} onChange={(e) => setItemForm(prev => ({ ...prev, quantity: e.target.value }))} onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--theme-primary)'; }} onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--admin-border)'; }} className="w-full px-2 py-2 rounded-lg text-sm font-bold text-right outline-none" style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }} placeholder="0" />
                                                        )}
                                                    </div>

                                                    {/* Unit Price */}
                                                    <div className={`${itemForm.unitType === 'CUT' ? 'col-span-3' : 'col-span-5'}`}>
                                                        <label className="text-xs font-bold mb-1 block" style={{ color: 'var(--admin-text-sub)' }}>
                                                            {itemForm.unitType === 'SLAT' ? '슬랫단가' : '단가'}
                                                        </label>
                                                        <div className="relative">
                                                            {/* Stock & Price Display */}
                                                            {currentStock && itemForm.unitType === 'ROLL' && stockLots.length > 0 ? (
                                                                <div className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-medium flex items-center gap-0.5 pointer-events-none z-10 whitespace-nowrap">
                                                                    <span className="font-bold" style={{ color: 'var(--theme-primary)' }}>{selectedLotIds.size}Roll</span>
                                                                    <span style={{ color: 'var(--admin-text-sub)' }}>/</span>
                                                                    <span className="font-bold" style={{ color: 'var(--theme-primary)' }}>{stockLots.filter(l => selectedLotIds.has(l.id)).reduce((s, l) => s + l.length, 0)}m</span>
                                                                    <span className="mx-0.5" style={{ color: 'var(--admin-border)' }}>|</span>
                                                                    <span style={{ color: 'var(--admin-text-sub)' }}>{currentStock.qty}Roll</span>
                                                                    <span style={{ color: 'var(--admin-border)' }}>/</span>
                                                                    <span style={{ color: 'var(--admin-text-sub)' }}>{currentStock.length}m</span>
                                                                </div>
                                                            ) : currentStock && (
                                                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-medium flex items-center gap-1 pointer-events-none z-10" style={{ color: 'var(--theme-primary)', opacity: 0.75 }}>
                                                                    <span style={{ opacity: 0.7 }}>재고:</span>
                                                                    {itemForm.unitType === 'ROLL' ? (
                                                                        <>
                                                                            <span>{currentStock.qty}</span><span className="text-[9px]">Roll</span>
                                                                            <span className="text-gray-300 mx-0.5">/</span>
                                                                            <span>{currentStock.length}</span><span className="text-[9px]">m</span>
                                                                        </>
                                                                    ) : itemForm.unitType === 'SLAT' ? (
                                                                        <>
                                                                            <span>{currentStock.qty}</span><span className="text-[9px]">개</span>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <span>{currentStock.length}</span><span className="text-[9px]">m</span>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            )}

                                                            {/* Price Diff Badge */}
                                                            {itemForm.unitPrice !== itemForm.originalUnitPrice && itemForm.originalUnitPrice > 0 && (
                                                                <div className="absolute top-[-18px] right-0 flex items-center gap-1 text-[10px] font-bold animate-pulse">
                                                                    <span className={itemForm.unitPrice > itemForm.originalUnitPrice ? 'text-red-500' : 'text-blue-500'}>
                                                                        {itemForm.unitPrice > itemForm.originalUnitPrice ? '+' : ''}{(itemForm.unitPrice - itemForm.originalUnitPrice).toLocaleString()}
                                                                    </span>
                                                                </div>
                                                            )}

                                                            <input
                                                                type="text"
                                                                value={itemForm.unitPrice.toLocaleString()}
                                                                onChange={(e) => {
                                                                    const val = Number(e.target.value.replace(/,/g, ''));
                                                                    if (!isNaN(val)) setItemForm(prev => ({ ...prev, unitPrice: val }));
                                                                }}
                                                                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--theme-primary)'; }}
                                                                onBlur={(e) => {
                                                                    e.currentTarget.style.borderColor = 'var(--admin-border)';
                                                                    setItemForm(prev => {
                                                                        if (prev.unitPrice === 0 && prev.originalUnitPrice > 0) {
                                                                            const restored = prev.originalUnitPrice;
                                                                            const qty = parseFloat(prev.quantity) || 1;
                                                                            const cuttingTotal = restored * qty;
                                                                            const optionTotal = calcOptionTotal(prev.selectedOptions);
                                                                            const rawTotal = cuttingTotal + optionTotal;
                                                                            const roundedTotal = Math.round(rawTotal / 10) * 10;
                                                                            return { ...prev, unitPrice: restored, price: String(roundedTotal) };
                                                                        }
                                                                        return prev;
                                                                    });
                                                                }}
                                                                className={`w-full ${itemForm.unitType === 'ROLL' && stockLots.length > 0 ? 'pl-[230px]' : 'pl-20'} pr-14 py-2 rounded-lg text-sm text-right font-mono outline-none transition-colors ${itemForm.unitPrice !== itemForm.originalUnitPrice ? 'text-red-600 font-bold' : ''}`}
                                                                style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: itemForm.unitPrice !== itemForm.originalUnitPrice ? undefined : 'var(--admin-text)' }}
                                                            />
                                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px]" style={{ color: 'var(--admin-text-sub)' }}>{itemForm.unitType === 'ROLL' && stockLots.length > 0 ? '/ m 원' : '원'}</span>
                                                        </div>
                                                    </div>

                                                    {/* Cutting Fee (Conditional) */}
                                                    {itemForm.unitType === 'CUT' && (
                                                        <div className="col-span-2">
                                                            <label className="text-xs font-bold mb-1 block" style={{ color: 'var(--admin-text-sub)' }}>절단비</label>
                                                            <div className="w-full px-2 py-2 rounded-lg text-sm text-right font-mono flex items-center justify-end gap-1" style={{ background: 'var(--admin-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}>
                                                                {itemForm.cuttingFee}<span className="text-[10px] font-normal" style={{ color: 'var(--admin-text-sub)' }}>원</span>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Total Amount */}
                                                    <div className="col-span-2">
                                                        <label className="text-xs font-bold mb-1 block" style={{ color: 'var(--admin-text-sub)' }}>총 금액</label>
                                                        <div className="w-full px-2 py-2 rounded-lg text-sm text-right font-bold font-mono flex items-center justify-end gap-1" style={{ background: 'var(--admin-bg)', border: '1px solid var(--admin-border)', color: 'var(--theme-primary)' }}>
                                                            {(() => {
                                                                if (itemForm.unitType === 'ROLL' && stockLots.length > 0 && selectedLotIds.size > 0) {
                                                                    const totalLength = stockLots.filter(l => selectedLotIds.has(l.id)).reduce((s, l) => s + l.length, 0);
                                                                    return Math.round(totalLength * (itemForm.unitPrice || 0) / 10) * 10;
                                                                } else {
                                                                    return Number(itemForm.quantity || 0) * (itemForm.unitPrice || 0) + (itemForm.unitType === 'CUT' ? Number(String(itemForm.cuttingFee).replace(/,/g, '') || 0) : 0);
                                                                }
                                                            })().toLocaleString()}<span className="text-[10px] font-normal" style={{ color: 'var(--admin-text-sub)' }}>원</span>
                                                        </div>
                                                    </div>

                                                    {/* LOT 선택 팝업 모달 */}
                                                    {showLotDropdown && itemForm.unitType === 'ROLL' && stockLots.length > 0 && (
                                                        <div className="col-span-12">
                                                            <div className="fixed inset-0 z-[200] flex items-center justify-center">
                                                                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowLotDropdown(false)} />
                                                                <div className="rounded-2xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden" style={{ background: 'var(--admin-modal-bg)', border: '1px solid var(--admin-border)' }}>
                                                                    {/* 헤더 */}
                                                                    <div className="px-5 py-4 flex items-center justify-between" style={{ background: 'var(--theme-primary)', color: '#fff' }}>
                                                                        <div>
                                                                            <h3 className="font-bold text-base flex items-center gap-2">📦 재고 LOT 선택</h3>
                                                                            <p className="text-xs mt-1" style={{ opacity: 0.8 }}>{itemForm.width} · {currentStock?.qty || 0}Roll / {currentStock?.length || 0}m 보유</p>
                                                                        </div>
                                                                    </div>

                                                                    {/* 수량 입력 + 선택 재고 표시 */}
                                                                    <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--admin-border)', background: 'var(--admin-bg)' }}>
                                                                        <div className="flex items-center gap-4">
                                                                            <div className="flex-1">
                                                                                <label className="text-[10px] font-bold uppercase block mb-1" style={{ color: 'var(--admin-text-sub)' }}>출고 수량 (Roll)</label>
                                                                                <input
                                                                                    type="number"
                                                                                    value={selectedLotIds.size}
                                                                                    readOnly
                                                                                    className="w-full px-3 py-2 rounded-lg text-lg font-bold text-center outline-none"
                                                                                    style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}
                                                                                />
                                                                            </div>
                                                                            <div className="flex-1">
                                                                                <label className="text-[10px] font-bold uppercase block mb-1" style={{ color: 'var(--admin-text-sub)' }}>선택 재고 합계</label>
                                                                                <div className="w-full px-3 py-2 rounded-lg text-lg font-bold text-center font-mono" style={{ background: 'var(--theme-primary-bg)', border: '1px solid var(--admin-border)', color: 'var(--theme-primary)' }}>
                                                                                    {stockLots.filter(l => selectedLotIds.has(l.id)).reduce((s, l) => s + l.length, 0)}<span className="text-sm ml-1" style={{ opacity: 0.7 }}>m</span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    {/* LOT 리스트 */}
                                                                    <div className="max-h-[300px] overflow-y-auto">
                                                                        {stockLots.map((lot, idx) => {
                                                                            const isSelected = selectedLotIds.has(lot.id);
                                                                            return (
                                                                                <div
                                                                                    key={lot.id}
                                                                                    onClick={() => {
                                                                                        const newSet = new Set(selectedLotIds);
                                                                                        if (isSelected) newSet.delete(lot.id);
                                                                                        else newSet.add(lot.id);
                                                                                        setSelectedLotIds(newSet);
                                                                                    }}
                                                                                    className="flex items-center justify-between px-5 py-3 cursor-pointer border-b transition-all"
                                                                                    style={{
                                                                                        borderColor: 'var(--admin-border)',
                                                                                        background: isSelected ? 'var(--theme-primary-bg)' : 'transparent',
                                                                                    }}
                                                                                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--admin-list-hover)'; }}
                                                                                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                                                                                >
                                                                                    <div className="flex items-center gap-3">
                                                                                        <div className="w-5 h-5 rounded-md border-2 flex items-center justify-center text-xs transition-all"
                                                                                            style={isSelected
                                                                                                ? { background: 'var(--theme-primary)', borderColor: 'var(--theme-primary)', color: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }
                                                                                                : { borderColor: 'var(--admin-border)', background: 'var(--admin-input-bg)' }
                                                                                            }>
                                                                                            {isSelected && '✓'}
                                                                                        </div>
                                                                                        <div>
                                                                                            <span className="text-sm font-mono font-bold" style={{ color: 'var(--admin-text)' }}>{lot.lotNo || `LOT-${String(idx + 1).padStart(3, '0')}`}</span>
                                                                                        </div>
                                                                                    </div>
                                                                                    <span className="text-base font-bold font-mono" style={{ color: isSelected ? 'var(--theme-primary)' : 'var(--admin-text-sub)' }}>
                                                                                        {lot.length}<span className="text-xs ml-0.5">m</span>
                                                                                    </span>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                        {stockLots.length === 0 && (
                                                                            <div className="py-8 text-center text-sm" style={{ color: 'var(--admin-text-sub)' }}>재고 LOT가 없습니다.</div>
                                                                        )}
                                                                    </div>

                                                                    {/* 전체선택 / 해제 */}
                                                                    <div className="px-5 py-2 border-t flex gap-3" style={{ borderColor: 'var(--admin-border)', background: 'var(--admin-bg)' }}>
                                                                        <button
                                                                            onClick={() => setSelectedLotIds(new Set(stockLots.map(l => l.id)))}
                                                                            className="text-xs font-bold"
                                                                            style={{ color: 'var(--theme-primary)' }}
                                                                            onMouseEnter={e => (e.currentTarget.style.opacity = '0.7')}
                                                                            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                                                                        >전체선택</button>
                                                                        <button
                                                                            onClick={() => setSelectedLotIds(new Set())}
                                                                            className="text-xs font-bold"
                                                                            style={{ color: 'var(--admin-text-sub)' }}
                                                                            onMouseEnter={e => (e.currentTarget.style.opacity = '0.7')}
                                                                            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                                                                        >선택해제</button>
                                                                    </div>

                                                                    {/* 하단 버튼 */}
                                                                    <div className="px-5 py-4 border-t flex gap-3" style={{ borderColor: 'var(--admin-border)', background: 'var(--admin-surface)' }}>
                                                                        <button
                                                                            onClick={() => {
                                                                                setSelectedLotIds(new Set());
                                                                                setShowLotDropdown(false);
                                                                                setItemForm(prev => ({ ...prev, quantity: '', price: '0' }));
                                                                            }}
                                                                            className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors"
                                                                            style={{ background: 'var(--admin-bg)', color: 'var(--admin-text-sub)', border: '1px solid var(--admin-border)' }}
                                                                            onMouseEnter={e => (e.currentTarget.style.color = 'var(--admin-text)')}
                                                                            onMouseLeave={e => (e.currentTarget.style.color = 'var(--admin-text-sub)')}
                                                                        >취소</button>
                                                                        <button
                                                                            onClick={() => {
                                                                                const totalLength = stockLots.filter(l => selectedLotIds.has(l.id)).reduce((s, l) => s + l.length, 0);
                                                                                const totalQty = selectedLotIds.size;
                                                                                setItemForm(prev => ({
                                                                                    ...prev,
                                                                                    quantity: String(totalQty),
                                                                                    price: String(Math.round(totalLength * prev.unitPrice / 10) * 10)
                                                                                }));
                                                                                setShowLotDropdown(false);
                                                                            }}
                                                                            className="flex-[2] py-2.5 rounded-xl text-sm font-bold shadow-md transition-opacity text-white"
                                                                            style={{ background: 'var(--theme-primary)' }}
                                                                            onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                                                                            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                                                                        >
                                                                            완료 ({selectedLotIds.size}Roll / {stockLots.filter(l => selectedLotIds.has(l.id)).reduce((s, l) => s + l.length, 0)}m)
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Add Button */}
                                                    <div className="col-span-2">
                                                        <button
                                                            onClick={handleAddItem}
                                                            className="w-full py-2 text-white rounded-lg text-sm font-bold shadow-sm h-[38px] transition-opacity"
                                                            style={{ background: 'var(--theme-primary)' }}
                                                            onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                                                            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                                                        >
                                                            {isEditingItem ? '수정' : '추가'}
                                                        </button>
                                                    </div>
                                                </div>
                                            </>
                                        )}

                                        {/* ============ 제품 모드 ============ */}
                                        {orderInputMode === 'PRODUCT' && (
                                            <>
                                                {/* 제품 입력 Row wrapper — 실사 패널 열리면 접힘 */}
                                                <div
                                                    className="space-y-4"
                                                    ref={productInputRowsRef}
                                                    style={{
                                                        overflow: (showMeasurePanel && itemForm.productId && isMeasureAllowed) ? 'hidden' : 'visible',
                                                        transition: 'max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease, margin-bottom 0.4s ease',
                                                        maxHeight: (showMeasurePanel && itemForm.productId && isMeasureAllowed) ? '0px' : `${productInputRowsHeight}px`,
                                                        opacity: (showMeasurePanel && itemForm.productId && isMeasureAllowed) ? 0 : 1,
                                                        marginBottom: (showMeasurePanel && itemForm.productId && isMeasureAllowed) ? '0px' : undefined,
                                                    }}
                                                >
                                                    {/* Row 1: 제품 검색 + 단위 + 칼라 */}
                                                    <div className="grid grid-cols-12 gap-4">
                                                        <div className="col-span-5">
                                                            <label className="text-xs font-bold mb-1 block" style={{ color: 'var(--admin-text-sub)' }}>제품명</label>
                                                            <div className="relative">
                                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={14} style={{ color: 'var(--admin-text-sub)' }} />
                                                                <input
                                                                    type="text"
                                                                    value={productSearch}
                                                                    onChange={(e) => {
                                                                        setProductSearch(e.target.value);
                                                                        setShowProductResults(true);
                                                                    }}
                                                                    onFocus={(e) => { setShowProductResults(true); e.currentTarget.style.borderColor = 'var(--theme-primary)'; }}
                                                                    onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--admin-border)'; }}
                                                                    placeholder="상품원가에 등록된 상품 검색..."
                                                                    className="w-full pl-9 pr-3 py-2 rounded-lg text-sm outline-none transition-all"
                                                                    style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}
                                                                />
                                                                {showProductResults && (
                                                                    <div className="absolute top-full left-0 right-0 mt-1 rounded-xl shadow-xl overflow-hidden z-50" style={{ background: 'var(--admin-surface)', border: '1px solid var(--theme-primary)', maxHeight: '240px', overflowY: 'auto' }}>
                                                                        {availableProducts
                                                                            .filter((n: any) => n.displayLabel.toLowerCase().includes(productSearch.toLowerCase()))
                                                                            .map((node: any) => {
                                                                                const isSelected = itemForm.productId === node.id;
                                                                                return (
                                                                                    <div
                                                                                        key={node.id}
                                                                                        onClick={() => handleSelectProduct({ id: node.id, label: node.label, node })}
                                                                                        className="px-4 py-2.5 cursor-pointer text-sm font-medium flex items-center justify-between transition-colors"
                                                                                        style={{
                                                                                            background: isSelected ? 'var(--theme-primary-bg)' : 'transparent',
                                                                                            color: isSelected ? 'var(--theme-primary)' : 'var(--admin-text)',
                                                                                            fontWeight: isSelected ? 700 : 500,
                                                                                            borderBottom: '1px solid var(--admin-border)',
                                                                                        }}
                                                                                        onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--admin-list-hover)'; }}
                                                                                        onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                                                                                    >
                                                                                        <span>{node.displayLabel}</span>
                                                                                        {isSelected && <span style={{ color: 'var(--theme-primary)', fontSize: '10px', fontWeight: 700 }}>✓</span>}
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="col-span-2">
                                                            <label className="text-xs font-bold mb-1 block" style={{ color: 'var(--admin-text-sub)' }}>단위</label>
                                                            <div className="w-full px-3 py-2 rounded-lg text-sm font-bold" style={{ background: 'var(--admin-bg)', border: '1px solid var(--admin-border)', color: 'var(--theme-primary)' }}>
                                                                {itemForm.prodCuttingUnit === 'SQM' ? '㎡ (제곱미터)' : itemForm.prodCuttingUnit === 'WIDTH' ? '폭 기준' : '상품을 선택하세요'}
                                                            </div>
                                                        </div>

                                                        {/* Color (제품도 칼라 선택) */}
                                                        <div className="col-span-3">
                                                            <label className="text-xs font-bold mb-1 block" style={{ color: 'var(--admin-text-sub)' }}>색상</label>
                                                            <div className="relative">
                                                                <button
                                                                    onClick={() => setShowColorDropdown(!showColorDropdown)}
                                                                    className="w-full px-3 py-2 rounded-lg text-sm text-left flex justify-between items-center transition-all outline-none"
                                                                    style={{
                                                                        background: 'var(--admin-input-bg)',
                                                                        border: `1px solid ${showColorDropdown ? 'var(--theme-primary)' : 'var(--admin-border)'}`,
                                                                        color: 'var(--admin-text)',
                                                                        boxShadow: showColorDropdown ? '0 0 0 2px var(--theme-primary-bg)' : 'none',
                                                                    }}
                                                                >
                                                                    <span style={{ color: itemForm.colorName ? 'var(--admin-text)' : 'var(--admin-text-sub)' }}>{itemForm.colorName || '색상 선택'}</span>
                                                                    <span className="flex items-center gap-1">
                                                                        {itemForm.colorId && (() => {
                                                                            let tq = 0, tl = 0;
                                                                            try { const s = JSON.parse(nodes[itemForm.colorId]?.attributes?.stockData || '{}'); Object.values(s).forEach((v: any) => { tq += (v.qty || 0); tl += (v.length || 0); }); } catch { }
                                                                            return <span className="text-[10px] font-bold mr-1" style={{ color: tq > 0 ? 'var(--theme-primary)' : '#ef4444' }}>{tq > 0 ? `재고 ${tq}${tl > 0 ? `/${tl}m` : '개'}` : '재고없음'}</span>;
                                                                        })()}
                                                                        <ChevronDown size={14} style={{ color: 'var(--admin-text-sub)', transform: showColorDropdown ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                                                                    </span>
                                                                </button>
                                                                {showColorDropdown && itemForm.productId && (
                                                                    <div className="absolute top-full left-0 right-0 mt-1 rounded-xl shadow-xl overflow-hidden z-50" style={{ background: 'var(--admin-surface)', border: '1px solid var(--theme-primary)', maxHeight: '240px', overflowY: 'auto' }}>
                                                                        {nodes[itemForm.productId]?.childrenIds?.map((childId: string) => {
                                                                            const colorNode = nodes[childId];
                                                                            if (!colorNode) return null;
                                                                            let totalQty = 0;
                                                                            let totalLen = 0;
                                                                            try {
                                                                                const sd = JSON.parse(colorNode.attributes?.stockData || '{}');
                                                                                Object.values(sd).forEach((v: any) => { totalQty += (v.qty || 0); totalLen += (v.length || 0); });
                                                                            } catch { }
                                                                            const isSelected = itemForm.colorId === colorNode.id;
                                                                            return (
                                                                                <div
                                                                                    key={colorNode.id}
                                                                                    onClick={() => { setItemForm(prev => ({ ...prev, colorId: colorNode.id, colorName: colorNode.label })); setShowColorDropdown(false); }}
                                                                                    className="px-4 py-2.5 cursor-pointer text-sm font-medium flex justify-between items-center transition-colors"
                                                                                    style={{
                                                                                        background: isSelected ? 'var(--theme-primary-bg)' : 'transparent',
                                                                                        color: isSelected ? 'var(--theme-primary)' : 'var(--admin-text)',
                                                                                        fontWeight: isSelected ? 700 : 500,
                                                                                        borderBottom: '1px solid var(--admin-border)',
                                                                                    }}
                                                                                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--admin-list-hover)'; }}
                                                                                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = isSelected ? 'var(--theme-primary-bg)' : 'transparent'; }}
                                                                                >
                                                                                    <span>{colorNode.label}</span>
                                                                                    <span className="flex items-center gap-2">
                                                                                        <span className="text-[10px] font-bold" style={{ color: totalQty > 0 ? 'var(--theme-primary)' : '#ef4444' }}>
                                                                                            {totalQty > 0 ? `${totalQty}${totalLen > 0 ? ` / ${totalLen}m` : '개'}` : '재고없음'}
                                                                                        </span>
                                                                                        {isSelected && <span style={{ color: 'var(--theme-primary)', fontSize: '10px', fontWeight: 700 }}>✓</span>}
                                                                                    </span>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* 설치위치 */}
                                                        <div className="col-span-2">
                                                            <label className="text-xs font-bold mb-1 block" style={{ color: 'var(--admin-text-sub)' }}>설치위치</label>
                                                            <input
                                                                type="text"
                                                                value={itemForm.installLocation}
                                                                onChange={(e) => setItemForm(prev => ({ ...prev, installLocation: e.target.value }))}
                                                                onFocus={(e) => { e.target.select(); e.currentTarget.style.borderColor = 'var(--theme-primary)'; }}
                                                                onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--admin-border)'; }}
                                                                placeholder="예: 거실, 안방"
                                                                className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all"
                                                                style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Row 2: 가로/세로 입력 + 면적 + 수량 + 단가 + 총금액 + 추가 */}
                                                    <div className="grid grid-cols-10 gap-4 items-start p-4 rounded-xl" style={{ background: 'var(--admin-bg)', border: '1px solid var(--admin-border)' }}>
                                                        {/* 가로 */}
                                                        <div className="col-span-1">
                                                            <label className="text-xs font-bold mb-1 block" style={{ color: 'var(--admin-text-sub)' }}>가로 (cm)</label>
                                                            <input
                                                                id="input-prod-width"
                                                                type="text"
                                                                inputMode="decimal"
                                                                value={itemForm.prodWidth}
                                                                onChange={(e) => handleProdSizeChange('prodWidth', e.target.value)}
                                                                onFocus={(e) => { e.target.select(); e.currentTarget.style.borderColor = 'var(--theme-primary)'; }}
                                                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); document.getElementById('input-prod-height')?.focus(); } }}
                                                                onBlur={(e) => {
                                                                    e.currentTarget.style.borderColor = itemForm.sizeError && itemForm.sizeError.includes('가로') ? '#ef4444' : 'var(--admin-border)';
                                                                    const v = parseFloat(e.target.value);
                                                                    if (!isNaN(v) && v > 0) {
                                                                        setItemForm(prev => ({ ...prev, prodWidth: v.toFixed(1) }));
                                                                    }
                                                                }}
                                                                className="w-full px-2 py-2 rounded-lg text-sm font-bold text-right outline-none transition-colors"
                                                                style={{
                                                                    background: itemForm.sizeError && itemForm.sizeError.includes('가로') ? '#fef2f2' : 'var(--admin-input-bg)',
                                                                    border: `1px solid ${itemForm.sizeError && itemForm.sizeError.includes('가로') ? '#ef4444' : 'var(--admin-border)'}`,
                                                                    color: 'var(--admin-text)',
                                                                }}
                                                                placeholder="0"
                                                                disabled={!itemForm.productId}
                                                            />
                                                        </div>

                                                        {/* 세로 */}
                                                        <div className="col-span-1">
                                                            <label className="text-xs font-bold mb-1 block" style={{ color: 'var(--admin-text-sub)' }}>세로 (cm)</label>
                                                            <input
                                                                id="input-prod-height"
                                                                type="text"
                                                                inputMode="decimal"
                                                                value={itemForm.prodHeight}
                                                                onChange={(e) => handleProdSizeChange('prodHeight', e.target.value)}
                                                                onFocus={(e) => { e.target.select(); e.currentTarget.style.borderColor = 'var(--theme-primary)'; }}
                                                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); document.getElementById('input-prod-qty')?.focus(); } }}
                                                                onBlur={(e) => {
                                                                    e.currentTarget.style.borderColor = itemForm.sizeError && itemForm.sizeError.includes('세로') ? '#ef4444' : 'var(--admin-border)';
                                                                    const v = parseFloat(e.target.value);
                                                                    if (!isNaN(v) && v > 0) {
                                                                        setItemForm(prev => ({ ...prev, prodHeight: v.toFixed(1) }));
                                                                    }
                                                                }}
                                                                className="w-full px-2 py-2 rounded-lg text-sm font-bold text-right outline-none transition-colors"
                                                                style={{
                                                                    background: itemForm.sizeError && itemForm.sizeError.includes('세로') ? '#fef2f2' : 'var(--admin-input-bg)',
                                                                    color: 'var(--admin-text)',
                                                                    border: `1px solid ${itemForm.sizeError && itemForm.sizeError.includes('세로') ? '#ef4444' : 'var(--admin-border)'}`,
                                                                }}
                                                                placeholder="0"
                                                                disabled={!itemForm.productId}
                                                            />
                                                            {productCuttingData && (productCuttingData.minHeight > 0 || productCuttingData.maxHeight > 0) && (
                                                                <div className="text-[10px] mt-1" style={{ color: 'var(--admin-text-sub)' }}>
                                                                    범위 {productCuttingData.minHeight > 0 ? productCuttingData.minHeight : ''}{productCuttingData.maxHeight > 0 ? ` ~ ${productCuttingData.maxHeight}` : ' ~'}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* 면적 */}
                                                        <div className="col-span-1">
                                                            <label className="text-xs font-bold mb-1 block" style={{ color: 'var(--admin-text-sub)' }}>면적 (㎡)</label>
                                                            <div className="w-full px-2 py-2 rounded-lg text-sm text-right font-mono font-bold" style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: itemForm.prodArea > 0 && itemForm.prodAppliedArea > 0 && itemForm.prodArea < itemForm.prodAppliedArea ? '#ef4444' : 'var(--admin-text)' }}>
                                                                {itemForm.prodAppliedArea > 0 ? itemForm.prodAppliedArea.toFixed(1) : (itemForm.prodArea > 0 ? itemForm.prodArea.toFixed(1) : '-')}
                                                            </div>
                                                            {productCuttingData && productCuttingData.basicArea > 0 && (
                                                                <div className="text-[10px] mt-1" style={{ color: 'var(--admin-text-sub)' }}>
                                                                    기본:{productCuttingData.basicArea}㎡
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* 수량 */}
                                                        <div className="col-span-1">
                                                            <label className="text-xs font-bold mb-1 block" style={{ color: 'var(--admin-text-sub)' }}>수량</label>
                                                            <input
                                                                id="input-prod-qty"
                                                                type="text"
                                                                inputMode="numeric"
                                                                value={itemForm.quantity}
                                                                onChange={(e) => handleProdQuantityChange(e.target.value)}
                                                                onFocus={(e) => { e.target.select(); e.currentTarget.style.borderColor = 'var(--theme-primary)'; }}
                                                                onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--admin-border)'; }}
                                                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); document.getElementById('input-prod-price')?.focus(); } }}
                                                                className="w-full px-2 py-2 rounded-lg text-sm font-bold text-right outline-none"
                                                                style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}
                                                                placeholder="1"
                                                            />
                                                        </div>

                                                        {/* 단가 (편집 가능) */}
                                                        <div className="col-span-2">
                                                            <label className="text-xs font-bold mb-1 block" style={{ color: 'var(--admin-text-sub)' }}>단가</label>
                                                            <div className="relative">
                                                                <input
                                                                    id="input-prod-price"
                                                                    type="text"
                                                                    inputMode="numeric"
                                                                    value={itemForm.unitPrice > 0 ? itemForm.unitPrice.toLocaleString() : ''}
                                                                    onChange={(e) => handleProdUnitPriceChange(e.target.value)}
                                                                    onFocus={(e) => e.target.select()}
                                                                    onBlur={() => {
                                                                        setItemForm(prev => {
                                                                            if (prev.unitPrice === 0 && prev.originalUnitPrice > 0) {
                                                                                const restored = prev.originalUnitPrice;
                                                                                const qty = parseFloat(prev.quantity) || 1;
                                                                                const cuttingTotal = restored * qty;
                                                                                const measureTotal = calcMeasurePrice(prev.measureCategory, prev.prodAppliedArea, restored, qty);
                                                                                const optionTotal = calcOptionTotal(prev.selectedOptions);
                                                                                const rawTotal = cuttingTotal + measureTotal + optionTotal;
                                                                                const roundedTotal = Math.round(rawTotal / 10) * 10;
                                                                                return { ...prev, unitPrice: restored, price: String(roundedTotal) };
                                                                            }
                                                                            return prev;
                                                                        });
                                                                    }}
                                                                    className="w-full px-2 py-2 pr-6 rounded-lg text-sm font-bold text-right font-mono outline-none"
                                                                    style={{
                                                                        background: 'var(--admin-input-bg)',
                                                                        border: `1px solid ${itemForm.unitPrice !== itemForm.originalUnitPrice ? '#ef4444' : 'var(--admin-border)'}`,
                                                                        color: itemForm.unitPrice !== itemForm.originalUnitPrice ? '#ef4444' : 'var(--admin-text)',
                                                                    }}
                                                                    placeholder="0"
                                                                    disabled={!itemForm.productId}
                                                                />
                                                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px]" style={{ color: 'var(--admin-text-sub)' }}>원</span>
                                                            </div>
                                                            {itemForm.unitPrice !== itemForm.originalUnitPrice && itemForm.originalUnitPrice > 0 && (
                                                                <div className="text-[10px] text-red-500 font-bold mt-1">
                                                                    기본 {itemForm.originalUnitPrice.toLocaleString()}원 ({itemForm.unitPrice > itemForm.originalUnitPrice ? '+' : ''}{(itemForm.unitPrice - itemForm.originalUnitPrice).toLocaleString()})
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* 총금액 */}
                                                        <div className="col-span-2">
                                                            <label className="text-xs font-bold mb-1 block" style={{ color: 'var(--admin-text-sub)' }}>총 금액</label>
                                                            {(() => {
                                                                const grandTotal = Number(itemForm.price || 0);
                                                                // 상품 금액: 단가 × (면적 또는 1) × 수량
                                                                const qty = parseFloat(itemForm.quantity) || 1;
                                                                const productAmt = itemForm.prodAppliedArea > 0
                                                                    ? Math.round(itemForm.unitPrice * itemForm.prodAppliedArea * qty)
                                                                    : Math.round(itemForm.unitPrice * qty);
                                                                // 시스템(옵션) 합계 + 드릴다운(국산/솜피) 가격 포함
                                                                const systemAmt = calcOptionTotal(itemForm.selectedOptions) + drillSystemPrice;
                                                                // 실사 금액
                                                                const measureAmt = itemForm.measureUnitPrice > 0 ? itemForm.measureUnitPrice : 0;
                                                                const showBreakdown = itemForm.productId && (systemAmt > 0 || measureAmt > 0);
                                                                return (
                                                                    <>
                                                                        <div className="w-full px-2 py-2 rounded-lg text-sm text-right font-bold font-mono flex items-center justify-end gap-1" style={{ background: 'var(--admin-bg)', border: '1px solid var(--admin-border)', color: 'var(--theme-primary)' }}>
                                                                            {grandTotal.toLocaleString()}<span className="text-[10px] font-normal" style={{ color: 'var(--admin-text-sub)' }}>원</span>
                                                                        </div>
                                                                        {showBreakdown && (
                                                                            <div className="flex items-center gap-1 mt-1 flex-wrap" style={{ color: 'var(--admin-text-sub)' }}>
                                                                                <span className="text-[10px]">상품</span>
                                                                                <span className="text-[10px] font-bold font-mono" style={{ color: 'var(--admin-text)' }}>{productAmt.toLocaleString()}</span>
                                                                                {systemAmt > 0 && (
                                                                                    <>
                                                                                        <span className="text-[10px]">+</span>
                                                                                        <span className="text-[10px]">시스템</span>
                                                                                        <span className="text-[10px] font-bold font-mono" style={{ color: 'var(--admin-text)' }}>{systemAmt.toLocaleString()}</span>
                                                                                    </>
                                                                                )}
                                                                                {measureAmt > 0 && (
                                                                                    <>
                                                                                        <span className="text-[10px]">+</span>
                                                                                        <span className="text-[10px]">실사</span>
                                                                                        <span className="text-[10px] font-bold font-mono" style={{ color: 'var(--theme-primary)' }}>{measureAmt.toLocaleString()}</span>
                                                                                    </>
                                                                                )}
                                                                            </div>
                                                                        )}
                                                                    </>
                                                                );
                                                            })()}
                                                        </div>

                                                        {isMeasureAllowed && (
                                                            <div className="col-span-1">
                                                                <label className="text-xs font-bold text-transparent mb-1 block">.</label>
                                                                {itemForm.measureImageId && itemForm.measureCategory ? (
                                                                    <div className="flex items-center gap-0.5 h-[38px]">
                                                                        <button
                                                                            onClick={() => setShowMeasurePanel(prev => !prev)}
                                                                            className="flex-1 py-1.5 rounded-l-lg text-[10px] font-bold shadow-sm h-full transition-all flex items-center justify-center gap-0.5 bg-purple-600 text-white hover:bg-purple-700"
                                                                            title="실사 수정"
                                                                        >
                                                                            <ImageIcon size={12} />
                                                                            <span>수정</span>
                                                                        </button>
                                                                        <button
                                                                            onClick={() => {
                                                                                setItemForm(prev => ({
                                                                                    ...prev,
                                                                                    measureImageId: '', measureImageName: '', measureImageUrl: '',
                                                                                    measureCategory: '', measureUnitPrice: 0,
                                                                                }));
                                                                                setShowMeasurePanel(false);
                                                                            }}
                                                                            className="flex-1 py-1.5 rounded-r-lg text-[10px] font-bold shadow-sm h-full transition-all flex items-center justify-center bg-red-100 text-red-600 border border-red-200 hover:bg-red-200"
                                                                            title="실사 취소"
                                                                        >
                                                                            <span>취소</span>
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <button
                                                                        onClick={() => setShowMeasurePanel(prev => !prev)}
                                                                        className={`w-full py-2 rounded-lg text-sm font-bold shadow-sm h-[38px] transition-all flex items-center justify-center gap-1 ${showMeasurePanel
                                                                            ? 'bg-purple-600 text-white shadow-purple-200 hover:bg-purple-700'
                                                                            : 'bg-purple-100 text-purple-600 border border-purple-200 hover:bg-purple-200'
                                                                            }`}
                                                                        title="실사선택"
                                                                    >
                                                                        <ImageIcon size={16} />
                                                                        <span className="text-[10px] font-bold">실사</span>
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )}

                                                        {/* 추가 버튼 */}
                                                        <div className="col-span-1">
                                                            <label className="text-xs font-bold text-transparent mb-1 block">.</label>
                                                            <button
                                                                onClick={handleAddItem}
                                                                disabled={!!itemForm.sizeError || !itemForm.productId || itemForm.unitPrice === 0}
                                                                className="w-full py-2 rounded-lg text-sm font-bold shadow-sm h-[38px] transition-all text-white"
                                                                style={{
                                                                    background: (itemForm.sizeError || !itemForm.productId || itemForm.unitPrice === 0) ? 'var(--admin-text-sub)' : 'var(--theme-primary)',
                                                                    opacity: (itemForm.sizeError || !itemForm.productId || itemForm.unitPrice === 0) ? 0.5 : 1,
                                                                    cursor: (itemForm.sizeError || !itemForm.productId || itemForm.unitPrice === 0) ? 'not-allowed' : 'pointer',
                                                                }}
                                                            >
                                                                {isEditingItem ? '수정' : '추가'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                                {/* /제품 입력 Row wrapper 끝 */}

                                                {/* === 실사 이미지 선택 영역 === */}
                                                {orderInputMode === 'PRODUCT' && itemForm.productId && isMeasureAllowed && showMeasurePanel && (
                                                    <div className="mt-4 space-y-3">
                                                        {/* 실사 검색 + 실사 단가정보 (검색박스 안 우측정렬) */}
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
                                                                {/* 실사 상세정보: 검색어 없고 실사 선택 시 검색박스 안 우측정렬 */}
                                                                {itemForm.measureImageId && (() => {
                                                                    const pw = parseFloat(itemForm.prodWidth) || 100;
                                                                    const ph = parseFloat(itemForm.prodHeight) || 100;
                                                                    const catLabel = measurePositionOption || '-';
                                                                    const POSITION_TO_CATEGORY: Record<string, string> = {
                                                                        '여백실사': 'MARGIN_MEASURE',
                                                                        '꽉찬실사': 'FULL_MEASURE',
                                                                        '여백로고': 'MARGIN_LOGO',
                                                                        '고정로고': 'FIXED_LOGO',
                                                                    };
                                                                    const effectiveCategory = POSITION_TO_CATEGORY[measurePositionOption] || itemForm.measureCategory || '';
                                                                    let sizeW = pw, sizeH = ph;
                                                                    let mL = 0, mT = 0, mR = 0, mB = 0;
                                                                    let posInfo = '';
                                                                    if (measurePositionOption === '여백실사') {
                                                                        const iL = measureImgPos.x; const iT = measureImgPos.y;
                                                                        const iW = measureImgSize.w; const iH = measureImgSize.h;
                                                                        const sc = measureScale / 100;
                                                                        // element 크기 (cm, scale 전)
                                                                        const elemW = pw * iW / 100;
                                                                        const elemH = ph * iH / 100;
                                                                        // object-contain 패딩 (cm, scale 전)
                                                                        const elemR = elemW / elemH;
                                                                        const imgR = measureImgNaturalRatio || elemR;
                                                                        let hPad = 0, vPad = 0;
                                                                        if (imgR < elemR) { hPad = (elemW - elemH * imgR) / 2; }
                                                                        else { vPad = (elemH - elemW / imgR) / 2; }
                                                                        // element 중심 (cm)
                                                                        const cx = pw * iL / 100 + elemW / 2;
                                                                        const cy = ph * iT / 100 + elemH / 2;
                                                                        // 실제 보이는 이미지 가장자리 (cm)
                                                                        mL = Math.round((cx - (elemW / 2 - hPad) * sc) * 10) / 10;
                                                                        mT = Math.round((cy - (elemH / 2 - vPad) * sc) * 10) / 10;
                                                                        mR = Math.round((pw - cx - (elemW / 2 - hPad) * sc) * 10) / 10;
                                                                        mB = Math.round((ph - cy - (elemH / 2 - vPad) * sc) * 10) / 10;
                                                                        sizeW = Math.round((elemW - 2 * hPad) * sc * 10) / 10;
                                                                        sizeH = Math.round((elemH - 2 * vPad) * sc * 10) / 10;
                                                                        posInfo = `좌${mL} 상${mT} 우${mR} 하${mB}`;
                                                                    } else if (measurePositionOption === '꽉찬실사') {
                                                                        sizeW = pw; sizeH = ph;
                                                                        const productRatio = pw / ph;
                                                                        const imgRatio = measureImgNaturalRatio;
                                                                        if (imgRatio > productRatio) {
                                                                            const scaledImgW = ph * imgRatio;
                                                                            const overflow = scaledImgW - pw;
                                                                            mL = Math.round(overflow * (measureFullOffset.x / 100) * 10) / 10;
                                                                            mR = Math.round(overflow * (1 - measureFullOffset.x / 100) * 10) / 10;
                                                                            mT = 0; mB = 0;
                                                                        } else {
                                                                            const scaledImgH = pw / imgRatio;
                                                                            const overflow = scaledImgH - ph;
                                                                            mT = Math.round(overflow * (measureFullOffset.y / 100) * 10) / 10;
                                                                            mB = Math.round(overflow * (1 - measureFullOffset.y / 100) * 10) / 10;
                                                                            mL = 0; mR = 0;
                                                                        }
                                                                        posInfo = `좌${mL ? '-' + mL : 0} 상${mT ? '-' + mT : 0} 우${mR ? '-' + mR : 0} 하${mB ? '-' + mB : 0}`;
                                                                    } else if (measurePositionOption === '여백로고') {
                                                                        const sc = logoScale / 30;
                                                                        const elemW = pw * logoSize.w / 100;
                                                                        const elemH = ph * logoSize.h / 100;
                                                                        const elemR = elemW / elemH;
                                                                        const imgR = measureImgNaturalRatio || elemR;
                                                                        let hPad = 0, vPad = 0;
                                                                        if (imgR < elemR) { hPad = (elemW - elemH * imgR) / 2; }
                                                                        else { vPad = (elemH - elemW / imgR) / 2; }
                                                                        const cx = pw * logoPos.x / 100 + elemW / 2;
                                                                        const cy = ph * logoPos.y / 100 + elemH / 2;
                                                                        mL = Math.round((cx - (elemW / 2 - hPad) * sc) * 10) / 10;
                                                                        mT = Math.round((cy - (elemH / 2 - vPad) * sc) * 10) / 10;
                                                                        mR = Math.round((pw - cx - (elemW / 2 - hPad) * sc) * 10) / 10;
                                                                        mB = Math.round((ph - cy - (elemH / 2 - vPad) * sc) * 10) / 10;
                                                                        sizeW = Math.round((elemW - 2 * hPad) * sc * 10) / 10;
                                                                        sizeH = Math.round((elemH - 2 * vPad) * sc * 10) / 10;
                                                                        posInfo = `좌${mL} 상${mT} 우${mR} 하${mB}`;
                                                                    } else if (measurePositionOption === '고정로고') {
                                                                        sizeW = Math.round(pw * fixedLogoScale / 100 * 10) / 10;
                                                                        sizeH = Math.round(ph * fixedLogoScale / 100 * 10) / 10;
                                                                        mL = fixedLogoPos.x;
                                                                        mT = fixedLogoPos.y;
                                                                        mR = Math.round((pw - fixedLogoPos.x - sizeW) * 10) / 10;
                                                                        mB = Math.round((ph - fixedLogoPos.y - sizeH) * 10) / 10;
                                                                        posInfo = `좌${mL} 상${mT} 우${mR} 하${mB}`;
                                                                    }
                                                                    const effectiveArea = (sizeW * sizeH) / 10000;
                                                                    const measureTotal = calcMeasurePrice(effectiveCategory, effectiveArea, itemForm.unitPrice, Number(itemForm.quantity || 1));
                                                                    return (
                                                                        <div
                                                                            className="absolute inset-0 flex items-center pointer-events-none overflow-hidden rounded-lg"
                                                                            style={{ paddingLeft: '2rem', paddingRight: '0.5rem' }}
                                                                        >
                                                                            <div className="flex-1" />
                                                                            <span
                                                                                className="text-xs font-mono font-bold text-purple-600 whitespace-nowrap"
                                                                                style={{ direction: 'rtl', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 'calc(100% - 2rem)' }}
                                                                            >
                                                                                {itemForm.measureImageName} · {catLabel} · {sizeW}×{sizeH} · {posInfo} · {measureTotal.toLocaleString()}원
                                                                            </span>
                                                                        </div>
                                                                    );
                                                                })()}
                                                            </div>
                                                        </div>

                                                        {/* 실사위치 설정 카드 + 썸네일 그리드 */}
                                                        <div className="space-y-2">
                                                            <div style={{ aspectRatio: '2.5' }}>
                                                                <div className="grid grid-cols-5 gap-2 h-full">
                                                                    {/* 좌측: 실사위치 설정 카드 (2×2 썸네일 크기) */}
                                                                    <div className="col-span-2 row-span-2 rounded-lg border-2 border-purple-300 bg-white shadow-lg p-2 flex flex-col gap-1 overflow-hidden">
                                                                        {/* 상단: 위치설정 완료 + 위치/사이즈 정보 + X 버튼 */}
                                                                        <div className="flex items-center gap-1">
                                                                            <button
                                                                                onClick={() => {
                                                                                    const POSITION_TO_CAT: Record<string, string> = {
                                                                                        '여백실사': 'MARGIN_MEASURE',
                                                                                        '꽉찬실사': 'FULL_MEASURE',
                                                                                        '여백로고': 'MARGIN_LOGO',
                                                                                        '고정로고': 'FIXED_LOGO',
                                                                                    };
                                                                                    const cat = POSITION_TO_CAT[measurePositionOption] || '';
                                                                                    setItemForm(prev => ({ ...prev, measureCategory: cat }));
                                                                                    setShowMeasurePanel(false);
                                                                                }}
                                                                                className="px-3 py-1.5 rounded-md border border-gray-300 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all whitespace-nowrap"
                                                                            >
                                                                                완료
                                                                            </button>
                                                                            {itemForm.measureImageUrl && (() => {
                                                                                const pw = parseFloat(itemForm.prodWidth) || 100;
                                                                                const ph = parseFloat(itemForm.prodHeight) || 100;
                                                                                if (measurePositionOption === '여백실사') {
                                                                                    const iL = measureImgPos.x; const iT = measureImgPos.y;
                                                                                    const iW = measureImgSize.w; const iH = measureImgSize.h;
                                                                                    const sc = measureScale / 100;
                                                                                    const elemW = pw * iW / 100;
                                                                                    const elemH = ph * iH / 100;
                                                                                    const elemR = elemW / elemH;
                                                                                    const imgR = measureImgNaturalRatio || elemR;
                                                                                    let hPad = 0, vPad = 0;
                                                                                    if (imgR < elemR) { hPad = (elemW - elemH * imgR) / 2; }
                                                                                    else { vPad = (elemH - elemW / imgR) / 2; }
                                                                                    const cx = pw * iL / 100 + elemW / 2;
                                                                                    const cy = ph * iT / 100 + elemH / 2;
                                                                                    const mL = Math.round((cx - (elemW / 2 - hPad) * sc) * 10) / 10;
                                                                                    const mT = Math.round((cy - (elemH / 2 - vPad) * sc) * 10) / 10;
                                                                                    const mR = Math.round((pw - cx - (elemW / 2 - hPad) * sc) * 10) / 10;
                                                                                    const mB = Math.round((ph - cy - (elemH / 2 - vPad) * sc) * 10) / 10;
                                                                                    const rW = Math.round((elemW - 2 * hPad) * sc * 10) / 10;
                                                                                    const rH = Math.round((elemH - 2 * vPad) * sc * 10) / 10;
                                                                                    return (
                                                                                        <span className="flex-1 text-xs font-mono text-gray-700 leading-snug truncate">
                                                                                            ↑{mT} ↓{mB} ←{mL} →{mR} | {rW}×{rH}cm
                                                                                        </span>
                                                                                    );
                                                                                }
                                                                                if (measurePositionOption === '꽉찬실사') {
                                                                                    const productRatio = pw / ph;
                                                                                    const imgRatio = measureImgNaturalRatio;
                                                                                    let fmL = 0, fmT = 0, fmR = 0, fmB = 0;
                                                                                    if (imgRatio > productRatio) {
                                                                                        const scaledImgW = ph * imgRatio;
                                                                                        const overflow = scaledImgW - pw;
                                                                                        fmL = Math.round(overflow * (measureFullOffset.x / 100) * 10) / 10;
                                                                                        fmR = Math.round(overflow * (1 - measureFullOffset.x / 100) * 10) / 10;
                                                                                    } else {
                                                                                        const scaledImgH = pw / imgRatio;
                                                                                        const overflow = scaledImgH - ph;
                                                                                        fmT = Math.round(overflow * (measureFullOffset.y / 100) * 10) / 10;
                                                                                        fmB = Math.round(overflow * (1 - measureFullOffset.y / 100) * 10) / 10;
                                                                                    }
                                                                                    return (
                                                                                        <span className="flex-1 text-xs font-mono text-gray-700 leading-snug truncate">
                                                                                            ↑{fmT ? '-' + fmT : 0} ↓{fmB ? '-' + fmB : 0} ←{fmL ? '-' + fmL : 0} →{fmR ? '-' + fmR : 0} | {pw}×{ph}cm
                                                                                        </span>
                                                                                    );
                                                                                }
                                                                                if (measurePositionOption === '여백로고') {
                                                                                    const sc = logoScale / 30;
                                                                                    const elemW = pw * logoSize.w / 100;
                                                                                    const elemH = ph * logoSize.h / 100;
                                                                                    const elemR = elemW / elemH;
                                                                                    const imgR = measureImgNaturalRatio || elemR;
                                                                                    let hPad = 0, vPad = 0;
                                                                                    if (imgR < elemR) { hPad = (elemW - elemH * imgR) / 2; }
                                                                                    else { vPad = (elemH - elemW / imgR) / 2; }
                                                                                    const cx = pw * logoPos.x / 100 + elemW / 2;
                                                                                    const cy = ph * logoPos.y / 100 + elemH / 2;
                                                                                    const lL = Math.round((cx - (elemW / 2 - hPad) * sc) * 10) / 10;
                                                                                    const lT = Math.round((cy - (elemH / 2 - vPad) * sc) * 10) / 10;
                                                                                    const lR = Math.round((pw - cx - (elemW / 2 - hPad) * sc) * 10) / 10;
                                                                                    const lB = Math.round((ph - cy - (elemH / 2 - vPad) * sc) * 10) / 10;
                                                                                    const lW = Math.round((elemW - 2 * hPad) * sc * 10) / 10;
                                                                                    const lH = Math.round((elemH - 2 * vPad) * sc * 10) / 10;
                                                                                    return (
                                                                                        <span className="flex-1 text-xs font-mono text-gray-700 leading-snug truncate">
                                                                                            ↑{lT} ↓{lB} ←{lL} →{lR} | {lW}×{lH}cm ({logoScale}%)
                                                                                        </span>
                                                                                    );
                                                                                }
                                                                                if (measurePositionOption === '고정로고') {
                                                                                    const aW = Math.round(pw * fixedLogoScale / 100 * 10) / 10;
                                                                                    const aH = Math.round(ph * fixedLogoScale / 100 * 10) / 10;
                                                                                    const rR = Math.round((pw - fixedLogoPos.x - aW) * 10) / 10;
                                                                                    const rB = Math.round((ph - fixedLogoPos.y - aH) * 10) / 10;
                                                                                    return (
                                                                                        <span className="flex-1 text-xs font-mono text-gray-700 leading-snug truncate">
                                                                                            ↑{fixedLogoPos.y} ↓{rB} ←{fixedLogoPos.x} →{rR} | {aW}×{aH}cm ({fixedLogoScale}%)
                                                                                        </span>
                                                                                    );
                                                                                }
                                                                                return null;
                                                                            })()}
                                                                            <button
                                                                                onClick={() => {
                                                                                    const POSITION_TO_CAT: Record<string, string> = {
                                                                                        '여백실사': 'MARGIN_MEASURE',
                                                                                        '꽉찬실사': 'FULL_MEASURE',
                                                                                        '여백로고': 'MARGIN_LOGO',
                                                                                        '고정로고': 'FIXED_LOGO',
                                                                                    };
                                                                                    const cat = POSITION_TO_CAT[measurePositionOption] || '';
                                                                                    setItemForm(prev => ({ ...prev, measureCategory: cat }));
                                                                                    setShowMeasurePanel(false);
                                                                                }}
                                                                                className="w-5 h-5 flex items-center justify-center rounded transition-all"
                                                                                style={{ color: 'var(--admin-text-sub)' }}
                                                                                onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = '#fef2f2'; }}
                                                                                onMouseLeave={e => { e.currentTarget.style.color = 'var(--admin-text-sub)'; e.currentTarget.style.background = 'transparent'; }}
                                                                            >
                                                                                <X size={12} />
                                                                            </button>
                                                                        </div>
                                                                        {/* 제품 사이즈 + 실사 옵션 */}
                                                                        <div className="flex items-center gap-2 flex-wrap">
                                                                            <span className="px-2 py-1 rounded text-[12px] font-bold font-mono whitespace-nowrap" style={{ background: 'var(--admin-bg)', color: 'var(--admin-text-sub)', border: '1px solid var(--admin-border)' }}>
                                                                                {itemForm.prodWidth || '0'} x {itemForm.prodHeight || '0'}
                                                                            </span>
                                                                            {['여백실사', '꽉찬실사', '여백로고', '고정로고'].map(opt => (
                                                                                <button
                                                                                    key={opt}
                                                                                    onClick={() => setMeasurePositionOption(opt)}
                                                                                    className={`px-2 py-1 rounded text-[12px] font-bold transition-all border`}
                                                                                    style={measurePositionOption === opt
                                                                                        ? { background: 'var(--theme-primary-bg)', color: 'var(--theme-primary)', borderColor: 'var(--theme-primary)' }
                                                                                        : { background: 'var(--admin-surface)', color: 'var(--admin-text-sub)', borderColor: 'var(--admin-border)' }}
                                                                                >
                                                                                    {opt}
                                                                                </button>
                                                                            ))}
                                                                        </div>
                                                                        {/* 캔버스: 실사 위치 미리보기 */}
                                                                        <div className="flex-1 relative rounded-lg border-2 border-dashed border-purple-200 bg-purple-50/50 flex items-center justify-center mb-0 overflow-hidden">
                                                                            {(() => {
                                                                                const prodW = parseFloat(itemForm.prodWidth) || 100;
                                                                                const prodH = parseFloat(itemForm.prodHeight) || 100;
                                                                                const maxPct = 91;
                                                                                const ratio = prodW / prodH;
                                                                                let boxW: number, boxH: number;
                                                                                if (ratio >= 1) {
                                                                                    boxW = maxPct;
                                                                                    boxH = maxPct / ratio;
                                                                                } else {
                                                                                    boxH = maxPct;
                                                                                    boxW = maxPct * ratio;
                                                                                }
                                                                                const imgLeft = measureImgPos.x;
                                                                                const imgTop = measureImgPos.y;
                                                                                const imgW = measureImgSize.w;
                                                                                const imgH = measureImgSize.h;
                                                                                const sc = measureScale / 100;
                                                                                // element 크기 (cm)
                                                                                const elemW = prodW * imgW / 100;
                                                                                const elemH = prodH * imgH / 100;
                                                                                // object-contain 패딩 (cm)
                                                                                const elemR = elemW / elemH;
                                                                                const imgR = measureImgNaturalRatio || elemR;
                                                                                let hPad = 0, vPad = 0;
                                                                                if (imgR < elemR) { hPad = (elemW - elemH * imgR) / 2; }
                                                                                else { vPad = (elemH - elemW / imgR) / 2; }
                                                                                const cx = prodW * imgLeft / 100 + elemW / 2;
                                                                                const cy = prodH * imgTop / 100 + elemH / 2;
                                                                                const marginLeft = Math.round((cx - (elemW / 2 - hPad) * sc) * 10) / 10;
                                                                                const marginTop = Math.round((cy - (elemH / 2 - vPad) * sc) * 10) / 10;
                                                                                const marginRight = Math.round((prodW - cx - (elemW / 2 - hPad) * sc) * 10) / 10;
                                                                                const marginBottom = Math.round((prodH - cy - (elemH / 2 - vPad) * sc) * 10) / 10;
                                                                                const realImgW = Math.round((elemW - 2 * hPad) * sc * 10) / 10;
                                                                                const realImgH = Math.round((elemH - 2 * vPad) * sc * 10) / 10;

                                                                                const handleMouseDown = (e: React.MouseEvent, mode: 'move' | 'nw' | 'ne' | 'sw' | 'se') => {
                                                                                    e.preventDefault();
                                                                                    e.stopPropagation();
                                                                                    const boxEl = (e.currentTarget as HTMLElement).closest('[data-prodbox]') as HTMLElement;
                                                                                    if (!boxEl) return;
                                                                                    const rect = boxEl.getBoundingClientRect();
                                                                                    const startX = e.clientX;
                                                                                    const startY = e.clientY;
                                                                                    const startPos = { ...measureImgPos };
                                                                                    const startSize = { ...measureImgSize };

                                                                                    const snapPx = 5; // 스냅 임계값 (px)
                                                                                    const snapPctX = (snapPx / rect.width) * 100;
                                                                                    const snapPctY = (snapPx / rect.height) * 100;
                                                                                    const snapEdge = (val: number, edges: number[], threshold: number) => {
                                                                                        for (const edge of edges) {
                                                                                            if (Math.abs(val - edge) < threshold) return edge;
                                                                                        }
                                                                                        return val;
                                                                                    };
                                                                                    const onMove = (ev: MouseEvent) => {
                                                                                        const dx = ((ev.clientX - startX) / rect.width) * 100;
                                                                                        const dy = ((ev.clientY - startY) / rect.height) * 100;
                                                                                        if (mode === 'move') {
                                                                                            let nx = startPos.x + dx;
                                                                                            let ny = startPos.y + dy;
                                                                                            // object-contain 패딩을 반영한 시각적 가장자리 스냅
                                                                                            // element 크기 (% 단위)
                                                                                            const eW = startSize.w;
                                                                                            const eH = startSize.h;
                                                                                            // object-contain 패딩 (% 단위)
                                                                                            const eWcm = prodW * eW / 100;
                                                                                            const eHcm = prodH * eH / 100;
                                                                                            const eR = eWcm / eHcm;
                                                                                            const iR = measureImgNaturalRatio || eR;
                                                                                            let hPadPct = 0, vPadPct = 0;
                                                                                            if (iR < eR) {
                                                                                                // pillarboxed: 가로 패딩 (cm → %)
                                                                                                const hPadCm = (eWcm - eHcm * iR) / 2;
                                                                                                hPadPct = hPadCm / prodW * 100;
                                                                                            } else {
                                                                                                // letterboxed: 세로 패딩
                                                                                                const vPadCm = (eHcm - eWcm / iR) / 2;
                                                                                                vPadPct = vPadCm / prodH * 100;
                                                                                            }
                                                                                            // 시각적 content 반폭/반높이 (% 단위, scale 적용 후)
                                                                                            const contentHalfW = (eW / 2 - hPadPct) * sc;
                                                                                            const contentHalfH = (eH / 2 - vPadPct) * sc;
                                                                                            // element 중심 위치 (%)
                                                                                            const cxPct = nx + eW / 2;
                                                                                            const cyPct = ny + eH / 2;
                                                                                            // 시각적 가장자리 (%)
                                                                                            const visLeft = cxPct - contentHalfW;
                                                                                            const visTop = cyPct - contentHalfH;
                                                                                            const visRight = cxPct + contentHalfW;
                                                                                            const visBottom = cyPct + contentHalfH;
                                                                                            // 좌/상 스냅: 시각적 가장자리 → 0%
                                                                                            if (Math.abs(visLeft) < snapPctX) nx = nx - visLeft;
                                                                                            if (Math.abs(visTop) < snapPctY) ny = ny - visTop;
                                                                                            // 우/하 스냅: 시각적 가장자리 → 100%
                                                                                            const visRight2 = (nx + eW / 2) + contentHalfW;
                                                                                            const visBottom2 = (ny + eH / 2) + contentHalfH;
                                                                                            if (Math.abs(visRight2 - 100) < snapPctX) nx = nx - (visRight2 - 100);
                                                                                            if (Math.abs(visBottom2 - 100) < snapPctY) ny = ny - (visBottom2 - 100);
                                                                                            setMeasureImgPos({ x: nx, y: ny });
                                                                                        } else if (mode === 'se') {
                                                                                            setMeasureImgSize({
                                                                                                w: startSize.w + dx,
                                                                                                h: startSize.h + dy,
                                                                                            });
                                                                                        } else if (mode === 'nw') {
                                                                                            const newX = startPos.x + dx;
                                                                                            const newY = startPos.y + dy;
                                                                                            setMeasureImgPos({ x: newX, y: newY });
                                                                                            setMeasureImgSize({
                                                                                                w: Math.max(10, startPos.x + startSize.w - newX),
                                                                                                h: Math.max(10, startPos.y + startSize.h - newY),
                                                                                            });
                                                                                        } else if (mode === 'ne') {
                                                                                            const newY = startPos.y + dy;
                                                                                            setMeasureImgPos(p => ({ ...p, y: newY }));
                                                                                            setMeasureImgSize({
                                                                                                w: Math.max(10, startSize.w + dx),
                                                                                                h: Math.max(10, startPos.y + startSize.h - newY),
                                                                                            });
                                                                                        } else if (mode === 'sw') {
                                                                                            const newX = startPos.x + dx;
                                                                                            setMeasureImgPos(p => ({ ...p, x: newX }));
                                                                                            setMeasureImgSize({
                                                                                                w: Math.max(10, startPos.x + startSize.w - newX),
                                                                                                h: Math.max(10, startSize.h + dy),
                                                                                            });
                                                                                        }
                                                                                    };
                                                                                    const onUp = () => {
                                                                                        window.removeEventListener('mousemove', onMove);
                                                                                        window.removeEventListener('mouseup', onUp);
                                                                                    };
                                                                                    window.addEventListener('mousemove', onMove);
                                                                                    window.addEventListener('mouseup', onUp);
                                                                                };

                                                                                return (
                                                                                    <div
                                                                                        data-prodbox
                                                                                        className={`rounded bg-cyan-100 border border-cyan-200 relative ${measurePositionOption === '꽉찬실사' ? 'overflow-hidden' : 'overflow-visible'}`}
                                                                                        style={{ width: `${boxW}%`, height: `${boxH}%` }}
                                                                                    >
                                                                                        {measurePositionOption === '여백실사' && itemForm.measureImageUrl && (
                                                                                            <>
                                                                                                <img
                                                                                                    src={itemForm.measureImageUrl}
                                                                                                    alt=""
                                                                                                    className="absolute object-contain cursor-move select-none"
                                                                                                    style={{
                                                                                                        left: `${imgLeft}%`, top: `${imgTop}%`,
                                                                                                        width: `${imgW}%`, height: `${imgH}%`,
                                                                                                        opacity: 0.15,
                                                                                                        transform: `scale(${measureScale / 100})`,
                                                                                                        transformOrigin: 'center center',
                                                                                                    }}
                                                                                                    draggable={false}
                                                                                                    onMouseDown={(e) => handleMouseDown(e, 'move')}
                                                                                                    onDoubleClick={() => {
                                                                                                        setMeasureImgPos({ x: 10, y: 10 });
                                                                                                        setMeasureImgSize({ w: 80, h: 80 });
                                                                                                        setMeasureScale(100);
                                                                                                    }}
                                                                                                />
                                                                                                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                                                                                                    <img
                                                                                                        src={itemForm.measureImageUrl}
                                                                                                        alt=""
                                                                                                        className="absolute object-contain select-none"
                                                                                                        style={{
                                                                                                            left: `${imgLeft}%`, top: `${imgTop}%`,
                                                                                                            width: `${imgW}%`, height: `${imgH}%`,
                                                                                                            transform: `scale(${measureScale / 100})`,
                                                                                                            transformOrigin: 'center center',
                                                                                                        }}
                                                                                                        draggable={false}
                                                                                                    />
                                                                                                </div>
                                                                                            </>
                                                                                        )}
                                                                                        {measurePositionOption === '여백로고' && itemForm.measureImageUrl && (() => {
                                                                                            const lx = logoPos.x;
                                                                                            const ly = logoPos.y;
                                                                                            const lw = logoSize.w;
                                                                                            const lh = logoSize.h;
                                                                                            const handleLogoDrag = (e: React.MouseEvent) => {
                                                                                                e.preventDefault();
                                                                                                e.stopPropagation();
                                                                                                const boxEl = (e.currentTarget as HTMLElement).closest('[data-prodbox]') as HTMLElement;
                                                                                                if (!boxEl) return;
                                                                                                const rect = boxEl.getBoundingClientRect();
                                                                                                const startX = e.clientX;
                                                                                                const startY = e.clientY;
                                                                                                const startPos = { ...logoPos };
                                                                                                const snapPx = 5;
                                                                                                const snapPctX = (snapPx / rect.width) * 100;
                                                                                                const snapPctY = (snapPx / rect.height) * 100;
                                                                                                const onMove = (ev: MouseEvent) => {
                                                                                                    const dx = ((ev.clientX - startX) / rect.width) * 100;
                                                                                                    const dy = ((ev.clientY - startY) / rect.height) * 100;
                                                                                                    let nx = startPos.x + dx;
                                                                                                    let ny = startPos.y + dy;
                                                                                                    // 좌/상 가장자리 스냅
                                                                                                    if (Math.abs(nx) < snapPctX) nx = 0;
                                                                                                    if (Math.abs(ny) < snapPctY) ny = 0;
                                                                                                    // 우/하 가장자리 스냅
                                                                                                    const curScale = logoScale / 30;
                                                                                                    const imgWPct = lw * curScale;
                                                                                                    const imgHPct = lh * curScale;
                                                                                                    if (Math.abs((nx + imgWPct) - 100) < snapPctX) nx = 100 - imgWPct;
                                                                                                    if (Math.abs((ny + imgHPct) - 100) < snapPctY) ny = 100 - imgHPct;
                                                                                                    setLogoPos({ x: nx, y: ny });
                                                                                                };
                                                                                                const onUp = () => {
                                                                                                    window.removeEventListener('mousemove', onMove);
                                                                                                    window.removeEventListener('mouseup', onUp);
                                                                                                };
                                                                                                window.addEventListener('mousemove', onMove);
                                                                                                window.addEventListener('mouseup', onUp);
                                                                                            };
                                                                                            const handleLogoResize = (e: React.MouseEvent) => {
                                                                                                e.preventDefault();
                                                                                                e.stopPropagation();
                                                                                                const boxEl = (e.currentTarget as HTMLElement).closest('[data-prodbox]') as HTMLElement;
                                                                                                if (!boxEl) return;
                                                                                                const rect = boxEl.getBoundingClientRect();
                                                                                                const startX = e.clientX;
                                                                                                const startY = e.clientY;
                                                                                                const startSize = { ...logoSize };
                                                                                                const onMove = (ev: MouseEvent) => {
                                                                                                    const dx = ((ev.clientX - startX) / rect.width) * 100;
                                                                                                    const dy = ((ev.clientY - startY) / rect.height) * 100;
                                                                                                    setLogoSize({
                                                                                                        w: Math.max(5, Math.min(40, startSize.w + dx)),
                                                                                                        h: Math.max(5, Math.min(40, startSize.h + dy)),
                                                                                                    });
                                                                                                };
                                                                                                const onUp = () => {
                                                                                                    window.removeEventListener('mousemove', onMove);
                                                                                                    window.removeEventListener('mouseup', onUp);
                                                                                                };
                                                                                                window.addEventListener('mousemove', onMove);
                                                                                                window.addEventListener('mouseup', onUp);
                                                                                            };
                                                                                            return (
                                                                                                <>
                                                                                                    <img
                                                                                                        src={itemForm.measureImageUrl}
                                                                                                        alt=""
                                                                                                        className="absolute object-contain cursor-move select-none"
                                                                                                        style={{
                                                                                                            left: `${lx}%`, top: `${ly}%`,
                                                                                                            width: `${lw}%`, height: `${lh}%`,
                                                                                                            opacity: 0.15,
                                                                                                            transform: `scale(${logoScale / 30})`,
                                                                                                            transformOrigin: 'center center',
                                                                                                        }}
                                                                                                        draggable={false}
                                                                                                        onMouseDown={handleLogoDrag}
                                                                                                        onDoubleClick={() => {
                                                                                                            setLogoPos({ x: 35, y: 35 });
                                                                                                            setLogoSize({ w: 30, h: 30 });
                                                                                                            setLogoScale(30);
                                                                                                        }}
                                                                                                    />
                                                                                                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                                                                                                        <img
                                                                                                            src={itemForm.measureImageUrl}
                                                                                                            alt=""
                                                                                                            className="absolute object-contain select-none"
                                                                                                            style={{
                                                                                                                left: `${lx}%`, top: `${ly}%`,
                                                                                                                width: `${lw}%`, height: `${lh}%`,
                                                                                                                transform: `scale(${logoScale / 30})`,
                                                                                                                transformOrigin: 'center center',
                                                                                                            }}
                                                                                                            draggable={false}
                                                                                                        />
                                                                                                    </div>
                                                                                                </>
                                                                                            );
                                                                                        })()}
                                                                                        {/* 고정로고: 제품박스 내 미리보기 (좌측상단 기준) */}
                                                                                        {measurePositionOption === '고정로고' && itemForm.measureImageUrl && (() => {
                                                                                            const prodW = parseFloat(itemForm.prodWidth) || 100;
                                                                                            const prodH = parseFloat(itemForm.prodHeight) || 100;
                                                                                            const fLeftPct = (fixedLogoPos.x / prodW) * 100;
                                                                                            const fTopPct = (fixedLogoPos.y / prodH) * 100;
                                                                                            const fSizePct = fixedLogoScale;
                                                                                            const handleFixedLogoDrag = (e: React.MouseEvent) => {
                                                                                                e.preventDefault();
                                                                                                e.stopPropagation();
                                                                                                const imgEl = e.currentTarget as HTMLElement;
                                                                                                const boxEl = imgEl.closest('[data-prodbox]') as HTMLElement;
                                                                                                if (!boxEl) return;
                                                                                                const rect = boxEl.getBoundingClientRect();
                                                                                                const imgRect = imgEl.getBoundingClientRect();
                                                                                                const imgWCm = (imgRect.width / rect.width) * prodW;
                                                                                                const imgHCm = (imgRect.height / rect.height) * prodH;
                                                                                                const maxX = Math.max(0, prodW - imgWCm);
                                                                                                const maxY = Math.max(0, prodH - imgHCm);
                                                                                                const startX = e.clientX;
                                                                                                const startY = e.clientY;
                                                                                                const startPos = { ...fixedLogoPos };
                                                                                                const snapPx = 5;
                                                                                                const snapCmX = (snapPx / rect.width) * prodW;
                                                                                                const snapCmY = (snapPx / rect.height) * prodH;
                                                                                                const onMove = (ev: MouseEvent) => {
                                                                                                    const dxCm = ((ev.clientX - startX) / rect.width) * prodW;
                                                                                                    const dyCm = ((ev.clientY - startY) / rect.height) * prodH;
                                                                                                    let nx = Math.min(maxX, Math.max(0, startPos.x + dxCm));
                                                                                                    let ny = Math.min(maxY, Math.max(0, startPos.y + dyCm));
                                                                                                    // 좌/상 가장자리 스냅 (0cm)
                                                                                                    if (Math.abs(nx) < snapCmX) nx = 0;
                                                                                                    if (Math.abs(ny) < snapCmY) ny = 0;
                                                                                                    // 우/하 가장자리 스냅 (maxCm)
                                                                                                    if (Math.abs(nx - maxX) < snapCmX) nx = maxX;
                                                                                                    if (Math.abs(ny - maxY) < snapCmY) ny = maxY;
                                                                                                    setFixedLogoPos({
                                                                                                        x: +nx.toFixed(1),
                                                                                                        y: +ny.toFixed(1),
                                                                                                    });
                                                                                                };
                                                                                                const onUp = () => {
                                                                                                    window.removeEventListener('mousemove', onMove);
                                                                                                    window.removeEventListener('mouseup', onUp);
                                                                                                };
                                                                                                window.addEventListener('mousemove', onMove);
                                                                                                window.addEventListener('mouseup', onUp);
                                                                                            };
                                                                                            return (
                                                                                                <>
                                                                                                    <img
                                                                                                        src={itemForm.measureImageUrl}
                                                                                                        alt=""
                                                                                                        className="absolute select-none cursor-move"
                                                                                                        style={{
                                                                                                            left: `${fLeftPct}%`, top: `${fTopPct}%`,
                                                                                                            width: `${fSizePct}%`, height: 'auto',
                                                                                                            opacity: 0.15,
                                                                                                        }}
                                                                                                        draggable={false}
                                                                                                        onMouseDown={handleFixedLogoDrag}
                                                                                                    />
                                                                                                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                                                                                                        <img
                                                                                                            src={itemForm.measureImageUrl}
                                                                                                            alt=""
                                                                                                            className="absolute select-none"
                                                                                                            style={{
                                                                                                                left: `${fLeftPct}%`, top: `${fTopPct}%`,
                                                                                                                width: `${fSizePct}%`, height: 'auto',
                                                                                                            }}
                                                                                                            draggable={false}
                                                                                                        />
                                                                                                    </div>
                                                                                                </>
                                                                                            );
                                                                                        })()}
                                                                                        {measurePositionOption === '꽉찬실사' && itemForm.measureImageUrl && (() => {
                                                                                            const handleFullDrag = (e: React.MouseEvent) => {
                                                                                                e.preventDefault();
                                                                                                e.stopPropagation();
                                                                                                const boxEl = (e.currentTarget as HTMLElement).closest('[data-prodbox]') as HTMLElement;
                                                                                                if (!boxEl) return;
                                                                                                const rect = boxEl.getBoundingClientRect();
                                                                                                const startX = e.clientX;
                                                                                                const startY = e.clientY;
                                                                                                const startOff = { ...measureFullOffset };
                                                                                                const onMove = (ev: MouseEvent) => {
                                                                                                    const dx = ((ev.clientX - startX) / rect.width) * 100;
                                                                                                    const dy = ((ev.clientY - startY) / rect.height) * 100;
                                                                                                    setMeasureFullOffset({
                                                                                                        x: Math.max(0, Math.min(100, startOff.x - dx)),
                                                                                                        y: Math.max(0, Math.min(100, startOff.y - dy)),
                                                                                                    });
                                                                                                };
                                                                                                const onUp = () => {
                                                                                                    window.removeEventListener('mousemove', onMove);
                                                                                                    window.removeEventListener('mouseup', onUp);
                                                                                                };
                                                                                                window.addEventListener('mousemove', onMove);
                                                                                                window.addEventListener('mouseup', onUp);
                                                                                            };
                                                                                            return (
                                                                                                <img
                                                                                                    src={itemForm.measureImageUrl}
                                                                                                    alt=""
                                                                                                    className="absolute inset-0 w-full h-full object-cover cursor-move select-none"
                                                                                                    style={{ objectPosition: `${measureFullOffset.x}% ${measureFullOffset.y}%` }}
                                                                                                    draggable={false}
                                                                                                    onMouseDown={handleFullDrag}
                                                                                                    onLoad={(e) => {
                                                                                                        const img = e.currentTarget;
                                                                                                        if (img.naturalWidth && img.naturalHeight) {
                                                                                                            setMeasureImgNaturalRatio(img.naturalWidth / img.naturalHeight);
                                                                                                        }
                                                                                                    }}
                                                                                                />
                                                                                            );
                                                                                        })()}
                                                                                    </div>
                                                                                );
                                                                            })()}
                                                                            {/* 꽉찬실사: 오버플로우 블러 배경 */}
                                                                            {measurePositionOption === '꽉찬실사' && itemForm.measureImageUrl && (
                                                                                <img
                                                                                    src={itemForm.measureImageUrl}
                                                                                    alt=""
                                                                                    className="absolute inset-0 w-full h-full object-cover -z-10"
                                                                                    style={{ filter: 'blur(6px) opacity(0.35)', objectPosition: `${measureFullOffset.x}% ${measureFullOffset.y}%` }}
                                                                                    draggable={false}
                                                                                />
                                                                            )}
                                                                        </div>
                                                                        {/* 사이즈 슬라이더 (여백실사 / 여백로고) */}
                                                                        {(measurePositionOption === '여백실사' || measurePositionOption === '여백로고') && itemForm.measureImageUrl && (
                                                                            <div className="relative flex items-center border border-purple-300 rounded bg-white px-2 py-0.5 mt-0.5">
                                                                                <input
                                                                                    type="range"
                                                                                    min={measurePositionOption === '여백로고' ? 5 : 10}
                                                                                    max={measurePositionOption === '여백로고' ? 30 : 200}
                                                                                    value={measurePositionOption === '여백실사' ? measureScale : logoScale}
                                                                                    onChange={(e) => {
                                                                                        const v = Number(e.target.value);
                                                                                        if (measurePositionOption === '여백실사') {
                                                                                            setMeasureScale(v);
                                                                                        } else {
                                                                                            setLogoScale(v);
                                                                                        }
                                                                                    }}
                                                                                    className="flex-1 h-1.5 accent-purple-500 cursor-pointer"
                                                                                />
                                                                                <span className="ml-2 text-[10px] font-mono font-bold text-purple-600 whitespace-nowrap">
                                                                                    {measurePositionOption === '여백실사' ? measureScale : logoScale}%
                                                                                </span>
                                                                            </div>
                                                                        )}
                                                                        {/* 고정로고: 좌/상 위치 + 슬라이더 + 사이즈 표시 */}
                                                                        {measurePositionOption === '고정로고' && itemForm.measureImageUrl && (() => {
                                                                            const prodW = parseFloat(itemForm.prodWidth) || 100;
                                                                            const prodH = parseFloat(itemForm.prodHeight) || 100;
                                                                            const actualW = (prodW * fixedLogoScale / 100);
                                                                            const actualH = (prodH * fixedLogoScale / 100);
                                                                            return (
                                                                                <div className="flex items-end gap-1 mt-0.5">
                                                                                    <div className="flex flex-col items-center">
                                                                                        <label className="text-[7px] text-gray-400 font-bold">좌(cm)</label>
                                                                                        <input
                                                                                            type="number"
                                                                                            step="0.1"
                                                                                            value={fixedLogoPos.x}
                                                                                            onChange={(e) => setFixedLogoPos(p => ({ ...p, x: parseFloat(e.target.value) || 0 }))}
                                                                                            className="w-14 text-center text-[10px] font-mono border border-purple-200 rounded px-1 py-0.5 focus:outline-none focus:border-purple-400"
                                                                                        />
                                                                                    </div>
                                                                                    <div className="flex flex-col items-center">
                                                                                        <label className="text-[7px] text-gray-400 font-bold">상(cm)</label>
                                                                                        <input
                                                                                            type="number"
                                                                                            step="0.1"
                                                                                            value={fixedLogoPos.y}
                                                                                            onChange={(e) => setFixedLogoPos(p => ({ ...p, y: parseFloat(e.target.value) || 0 }))}
                                                                                            className="w-14 text-center text-[10px] font-mono border border-purple-200 rounded px-1 py-0.5 focus:outline-none focus:border-purple-400"
                                                                                        />
                                                                                    </div>
                                                                                    <div className="flex-1 flex items-center border border-purple-300 rounded bg-white px-2 py-0.5">
                                                                                        <input
                                                                                            type="range"
                                                                                            min={5}
                                                                                            max={30}
                                                                                            value={fixedLogoScale}
                                                                                            onChange={(e) => setFixedLogoScale(Math.max(1, Math.min(30, Number(e.target.value))))}
                                                                                            className="flex-1 h-1.5 accent-purple-500 cursor-pointer"
                                                                                        />
                                                                                        <span className="ml-2 text-[10px] font-mono font-bold text-purple-600 whitespace-nowrap">
                                                                                            {fixedLogoScale}%
                                                                                        </span>
                                                                                    </div>
                                                                                    <div className="flex items-center px-1.5 py-0.5 rounded bg-purple-50 border border-purple-200">
                                                                                        <span className="text-[10px] font-mono font-bold text-purple-700 whitespace-nowrap">
                                                                                            {actualW.toFixed(1)} × {actualH.toFixed(1)} cm
                                                                                        </span>
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        })()}
                                                                    </div>

                                                                    {/* 우측: 실사 썸네일 리스트 (스크롤, col-span-3) */}
                                                                    <div className="col-span-3 row-span-2 overflow-y-auto">
                                                                        <div className="grid grid-cols-3 gap-2">
                                                                            {MOCK_MEASURE_IMAGES.slice(0, 20)
                                                                                .filter(img => !measureSearchText || img.tags.some(t => t.toLowerCase().includes(measureSearchText.toLowerCase())))
                                                                                .map(img => (
                                                                                    <button
                                                                                        key={img.id}
                                                                                        onClick={() => handleSelectMeasureImage(img)}
                                                                                        className={`relative rounded-lg overflow-hidden border-2 transition-all aspect-square ${itemForm.measureImageId === String(img.id)
                                                                                            ? 'border-purple-500 shadow-lg ring-2 ring-purple-200'
                                                                                            : 'border-gray-200 hover:border-purple-300'
                                                                                            }`}
                                                                                    >
                                                                                        <img
                                                                                            src={img.imageUrl}
                                                                                            alt={img.tags[0]}
                                                                                            className="w-full h-full object-cover"
                                                                                            loading="lazy"
                                                                                        />
                                                                                        {itemForm.measureImageId === String(img.id) && (
                                                                                            <div className="absolute inset-0 bg-purple-500/20 flex items-center justify-center">
                                                                                                <CheckCircle2 size={20} className="text-white drop-shadow" />
                                                                                            </div>
                                                                                        )}
                                                                                    </button>
                                                                                ))}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>


                                                        </div>
                                                    </div>
                                                )}

                                                {/* === 시스템/옵션 선택 영역 === */}
                                                {orderInputMode === 'PRODUCT' && itemForm.productId && productSystemNodes.length > 0 && (
                                                    <div className="mt-4 space-y-3">
                                                        {/* 시스템 버튼 + 드릴다운(국산/솜피/외산) 같은 행 */}
                                                        <div className="flex items-center gap-3">
                                                            <label className="text-xs font-bold whitespace-nowrap w-16" style={{ color: 'var(--admin-text-sub)' }}>시스템</label>
                                                            <div className="flex flex-wrap gap-2 flex-1 items-center">
                                                                {productSystemNodes.map(sys => (
                                                                    <button
                                                                        key={sys.id}
                                                                        onClick={() => handleSelectSystem(sys.id, sys.label)}
                                                                        className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all outline-none"
                                                                        style={{
                                                                            background: itemForm.selectedSystemId === sys.id ? 'var(--theme-primary)' : 'var(--admin-input-bg)',
                                                                            color: itemForm.selectedSystemId === sys.id ? 'var(--theme-btn-label, #ffffff)' : 'var(--admin-text-sub)',
                                                                            border: `1px solid ${itemForm.selectedSystemId === sys.id ? 'var(--theme-primary)' : 'var(--admin-border)'}`,
                                                                            boxShadow: itemForm.selectedSystemId === sys.id ? '0 2px 8px rgba(0,0,0,0.18)' : 'none',
                                                                        }}
                                                                    >
                                                                        {sys.label}
                                                                    </button>
                                                                ))}
                                                                {/* 드릴다운 스위치 — 시스템 버튼 옆에 배치 */}
                                                                {drillSwitchLevels.length > 0 && drillSwitchLevels[0]?.nodes.map(sub => (
                                                                    <button
                                                                        key={sub.id}
                                                                        onClick={() => handleDrillDown(0, sub.id, sub.label)}
                                                                        className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all outline-none"
                                                                        style={{
                                                                            background: drillSwitchLevels[0]?.selectedId === sub.id ? 'var(--theme-primary)' : 'var(--admin-input-bg)',
                                                                            color: drillSwitchLevels[0]?.selectedId === sub.id ? 'var(--theme-btn-label, #ffffff)' : 'var(--admin-text-sub)',
                                                                            border: `1px solid ${drillSwitchLevels[0]?.selectedId === sub.id ? 'var(--theme-primary)' : 'var(--admin-border)'}`,
                                                                            boxShadow: drillSwitchLevels[0]?.selectedId === sub.id ? '0 2px 8px rgba(0,0,0,0.18)' : 'none',
                                                                        }}
                                                                    >
                                                                        {sub.label}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        {/* 옵션 — 요약 라인 + 카드 리스트 */}
                                                        {itemForm.selectedSystemId && itemForm.selectedOptions.length > 0 && (() => {
                                                            // 옵션 합계 + 드릴다운 가격 합산
                                                            const optionsOnly = calcOptionTotal(itemForm.selectedOptions);
                                                            // 드릴다운 가격 합산 (국산/솜피/외산 등)
                                                            let drillTotal = 0;
                                                            (itemForm.systemDrillPath || []).forEach(dp => {
                                                                const dpNode = nodes[dp.id] as any;
                                                                const dpLookupIds = [dp.id];
                                                                if (dpNode?.attributes?.originalSourceId) dpLookupIds.push(dpNode.attributes.originalSourceId);
                                                                if (dpNode?.sourceIds && Array.isArray(dpNode.sourceIds)) dpLookupIds.push(...dpNode.sourceIds);
                                                                // 전체 노드에서 sales_price_assembly 수집
                                                                const allN = Object.values(nodes) as any[];
                                                                let spMap: Record<string, any> = {};
                                                                for (const n of allN) {
                                                                    if (n.attributes?.sales_price_assembly) {
                                                                        try { Object.assign(spMap, JSON.parse(n.attributes.sales_price_assembly)); } catch (e) { }
                                                                    }
                                                                }
                                                                let dpPrice = 0;
                                                                for (const lid of dpLookupIds) {
                                                                    const spData = spMap[lid];
                                                                    if (spData) {
                                                                        const pPrice = spData[selectedPartnerId!]?.price || spData['ALL']?.price;
                                                                        if (pPrice) { dpPrice = parseFloat(String(pPrice).replace(/,/g, '')) || 0; break; }
                                                                    }
                                                                }
                                                                // label fallback
                                                                if (dpPrice <= 0) {
                                                                    const dpLabel = dp.name.trim();
                                                                    for (const [key, spData] of Object.entries(spMap)) {
                                                                        const kNode = nodes[key] as any;
                                                                        if (kNode && kNode.label?.trim() === dpLabel) {
                                                                            const pPrice = (spData as any)[selectedPartnerId!]?.price || (spData as any)['ALL']?.price;
                                                                            if (pPrice) { dpPrice = parseFloat(String(pPrice).replace(/,/g, '')) || 0; break; }
                                                                        }
                                                                    }
                                                                }
                                                                drillTotal += dpPrice;
                                                            });
                                                            const optTotal = optionsOnly + drillTotal;
                                                            return (
                                                                <div className="space-y-3">
                                                                    {/* 요약 브레드크럼 라인 */}
                                                                    <div className="flex items-center gap-0 rounded-lg px-3 py-2 overflow-x-auto" style={{ background: 'var(--admin-bg)', border: '1px solid var(--admin-border)' }}>
                                                                        <span className="text-xs font-bold whitespace-nowrap shrink-0" style={{ color: 'var(--theme-primary)' }}>
                                                                            {itemForm.selectedSystemName}
                                                                        </span>
                                                                        {/* 드릴다운 경로 (국산/솜피/외산 등) */}
                                                                        {(itemForm.systemDrillPath || []).map(dp => {
                                                                            // 부모 시스템 노드(전동)에서 조상까지 올라가며 cost_assembly_list 수집
                                                                            const collectCostMap = (startId: string) => {
                                                                                const costMap: Record<string, { price: string; unit: string }> = {};
                                                                                let cur: any = nodes[startId];
                                                                                let limit = 10;
                                                                                while (cur && limit > 0) {
                                                                                    limit--;
                                                                                    // 노드 자체
                                                                                    if (cur.attributes?.cost_assembly_list) {
                                                                                        try { Object.assign(costMap, JSON.parse(cur.attributes.cost_assembly_list)); } catch (e) { }
                                                                                    }
                                                                                    // originalSourceId
                                                                                    if (cur.attributes?.originalSourceId) {
                                                                                        const src = nodes[cur.attributes.originalSourceId] as any;
                                                                                        if (src?.attributes?.cost_assembly_list) {
                                                                                            try { Object.assign(costMap, JSON.parse(src.attributes.cost_assembly_list)); } catch (e) { }
                                                                                        }
                                                                                    }
                                                                                    // sourceIds
                                                                                    if (cur.sourceIds && Array.isArray(cur.sourceIds)) {
                                                                                        for (const srcId of cur.sourceIds) {
                                                                                            const srcN = nodes[srcId] as any;
                                                                                            if (srcN?.attributes?.cost_assembly_list) {
                                                                                                try { Object.assign(costMap, JSON.parse(srcN.attributes.cost_assembly_list)); } catch (e) { }
                                                                                            }
                                                                                        }
                                                                                    }
                                                                                    cur = cur.parentId ? nodes[cur.parentId] : null;
                                                                                    if (!cur || cur.type === 'ROOT') break;
                                                                                }
                                                                                return costMap;
                                                                            };
                                                                            const parentCostMap = collectCostMap(itemForm.selectedSystemId);
                                                                            const dpNode = nodes[dp.id] as any;
                                                                            // 조회할 ID 후보들: 본인 ID, originalSourceId, sourceIds
                                                                            const lookupIds = [dp.id];
                                                                            if (dpNode?.attributes?.originalSourceId) lookupIds.push(dpNode.attributes.originalSourceId);
                                                                            if (dpNode?.sourceIds && Array.isArray(dpNode.sourceIds)) lookupIds.push(...dpNode.sourceIds);
                                                                            // cost_assembly_list에서 가격 조회 (ID 기반)
                                                                            let dpPrice = 0;
                                                                            for (const lid of lookupIds) {
                                                                                const dpCost = parentCostMap[lid];
                                                                                if (dpCost) {
                                                                                    dpPrice = parseFloat(String(dpCost.price).replace(/,/g, '')) || 0;
                                                                                    if (dpPrice > 0) break;
                                                                                }
                                                                            }
                                                                            // ID 매칭 안 되면 label 매칭 fallback
                                                                            if (dpPrice <= 0) {
                                                                                const dpLabel = dp.name.trim();
                                                                                for (const [nid, data] of Object.entries(parentCostMap)) {
                                                                                    const n = nodes[nid] as any;
                                                                                    if (n && n.label?.trim() === dpLabel) {
                                                                                        dpPrice = parseFloat(String(data.price).replace(/,/g, '')) || 0;
                                                                                        break;
                                                                                    }
                                                                                }
                                                                            }
                                                                            // sales_price_assembly에서 판매가 확인 — 전체 노드에서 수집 (systemOptions와 동일)
                                                                            if (dpNode) {
                                                                                const allN = Object.values(nodes) as any[];
                                                                                let salesPMap: Record<string, any> = {};
                                                                                for (const n of allN) {
                                                                                    if (n.attributes?.sales_price_assembly) {
                                                                                        try { Object.assign(salesPMap, JSON.parse(n.attributes.sales_price_assembly)); } catch (e) { }
                                                                                    }
                                                                                }
                                                                                // lookupIds로 조회
                                                                                for (const lid of lookupIds) {
                                                                                    const spData = salesPMap[lid];
                                                                                    if (spData) {
                                                                                        const pPrice = spData[selectedPartnerId!]?.price || spData['ALL']?.price;
                                                                                        if (pPrice) {
                                                                                            dpPrice = parseFloat(String(pPrice).replace(/,/g, '')) || dpPrice;
                                                                                            break;
                                                                                        }
                                                                                    }
                                                                                }
                                                                                // label fallback for salesPMap
                                                                                if (dpPrice <= 0) {
                                                                                    const dpLabel = dp.name.trim();
                                                                                    for (const [key, spData] of Object.entries(salesPMap)) {
                                                                                        const kNode = nodes[key] as any;
                                                                                        if (kNode && kNode.label?.trim() === dpLabel) {
                                                                                            const pPrice = (spData as any)[selectedPartnerId!]?.price || (spData as any)['ALL']?.price;
                                                                                            if (pPrice) {
                                                                                                dpPrice = parseFloat(String(pPrice).replace(/,/g, '')) || 0;
                                                                                                break;
                                                                                            }
                                                                                        }
                                                                                    }
                                                                                }
                                                                            }
                                                                            return (
                                                                                <React.Fragment key={dp.id}>
                                                                                    <span className="text-xs mx-1 shrink-0" style={{ color: 'var(--admin-border)' }}>&gt;</span>
                                                                                    <span className="text-xs whitespace-nowrap shrink-0">
                                                                                        <span className="font-bold" style={{ color: 'var(--theme-primary)' }}>{dp.name}</span>
                                                                                        {dpPrice > 0 && (<span className="font-mono ml-1" style={{ color: 'var(--theme-primary)' }}>{Math.round(dpPrice).toLocaleString()}원</span>)}
                                                                                    </span>
                                                                                </React.Fragment>
                                                                            );
                                                                        })}
                                                                        {itemForm.selectedOptions.filter(o => o.checked).map(opt => {
                                                                            let display = '';
                                                                            let price = 0;
                                                                            const rawQty = parseFloat(String(opt.quantity)) || 0;
                                                                            if (opt.type === 'group' && opt.children) {
                                                                                const sel = opt.children.find(c => c.id === opt.selectedChildId);
                                                                                display = sel ? `${sel.name}${rawQty > 1 ? ' ×' + rawQty : ''}` : '';
                                                                                const effectiveQty = sel?.unit === 'm' ? rawQty / 100 : rawQty;
                                                                                price = sel ? Math.round(sel.unitPrice * effectiveQty) : 0;
                                                                            } else {
                                                                                display = String(opt.quantity);
                                                                                const effectiveQty = opt.unit === 'm' ? rawQty / 100 : rawQty;
                                                                                price = Math.round(opt.unitPrice * effectiveQty);
                                                                            }
                                                                            return (
                                                                                <React.Fragment key={opt.id}>
                                                                                    <span className="text-xs mx-1 shrink-0" style={{ color: 'var(--admin-border)' }}>&gt;</span>
                                                                                    <span className="text-xs whitespace-nowrap shrink-0" style={{ color: 'var(--admin-text)' }}>
                                                                                        <span className="font-bold">{opt.name}</span>
                                                                                        <span style={{ color: 'var(--admin-text-sub)' }} className="mx-0.5">:</span>
                                                                                        <span className="font-bold">{display}</span>
                                                                                        {price > 0 && (<span className="font-mono ml-1" style={{ color: 'var(--theme-primary)' }}>{price.toLocaleString()}원</span>)}
                                                                                    </span>
                                                                                </React.Fragment>
                                                                            );
                                                                        })}
                                                                        <span className="text-xs mx-1 shrink-0" style={{ color: 'var(--admin-border)' }}>&gt;</span>
                                                                        <span className="text-xs font-bold whitespace-nowrap shrink-0 ml-auto" style={{ color: 'var(--theme-primary)' }}>
                                                                            총합 : ₩{optTotal.toLocaleString()}
                                                                        </span>
                                                                    </div>

                                                                    {/* 옵션 카드 리스트 */}
                                                                    <div className="flex gap-3 flex-wrap">
                                                                        {itemForm.selectedOptions.map(opt => (
                                                                            <div key={opt.id} className="rounded-xl shadow-sm min-w-[140px] flex-1 max-w-[220px]" style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}>
                                                                                {/* 카드 타이틀 + 수량 입력 (같은 라인) */}
                                                                                {(() => {
                                                                                    // 수량 입력 가능 단위: '개','ea' (정수) 또는 'm' (소수)
                                                                                    const integerUnits = ['ea', '개'];
                                                                                    const decimalUnits = ['m', 'cm'];
                                                                                    const childUnit = opt.children?.[0]?.unit || '';
                                                                                    const rawUnit = (opt.type === 'group' && childUnit) ? childUnit : opt.unit;
                                                                                    const effectiveUnit = rawUnit === 'm' ? 'cm' : rawUnit;
                                                                                    const isInteger = integerUnits.includes(effectiveUnit);
                                                                                    const isDecimal = decimalUnits.includes(effectiveUnit);
                                                                                    const showInput = isInteger || isDecimal;
                                                                                    return (
                                                                                        <div className="px-3 py-2 rounded-t-xl flex items-center justify-between gap-2" style={{ borderBottom: '1px solid var(--admin-border)', background: 'var(--admin-bg)' }}>
                                                                                            <span className="text-xs font-bold" style={{ color: 'var(--admin-text)' }}>{opt.name}</span>
                                                                                            {showInput && (
                                                                                                <div className="flex items-center gap-1 shrink-0">
                                                                                                    <input
                                                                                                        type="text"
                                                                                                        inputMode={isInteger ? 'numeric' : 'decimal'}
                                                                                                        value={opt.quantity}
                                                                                                        onChange={(e) => {
                                                                                                            const v = e.target.value;
                                                                                                            if (isInteger) {
                                                                                                                if (v === '' || /^[1-9]\d*$/.test(v)) {
                                                                                                                    handleOptionChange(opt.id, 'quantity', v || '1');
                                                                                                                }
                                                                                                            } else {
                                                                                                                if (v === '' || /^\d*\.?\d{0,1}$/.test(v)) {
                                                                                                                    handleOptionChange(opt.id, 'quantity', v || '0');
                                                                                                                }
                                                                                                            }
                                                                                                        }}
                                                                                                        onFocus={(e) => e.target.select()}
                                                                                                        className="w-12 px-1 py-0.5 rounded text-center text-xs font-bold outline-none" style={{ border: '1px solid var(--admin-border)', color: 'var(--admin-text)', background: 'var(--admin-input-bg)' }}
                                                                                                    />
                                                                                                    <span className="text-[10px]" style={{ color: 'var(--admin-text-sub)' }}>{effectiveUnit}</span>
                                                                                                </div>
                                                                                            )}
                                                                                        </div>
                                                                                    );
                                                                                })()}
                                                                                {/* 카드 내용 */}
                                                                                <div className="px-3 py-2.5">
                                                                                    {opt.type === 'group' && opt.children ? (
                                                                                        /* 그룹 옵션: 스위치 + 금액 */
                                                                                        <div className="space-y-2">
                                                                                            <div className="flex flex-col gap-1.5">
                                                                                                {opt.children.map(child => {
                                                                                                    const isSelected = opt.selectedChildId === child.id;
                                                                                                    return (
                                                                                                        <button
                                                                                                            key={child.id}
                                                                                                            onClick={() => handleSelectOptionChild(opt.id, child.id)}
                                                                                                            className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-between outline-none"
                                                                                                            style={{
                                                                                                                background: isSelected ? 'var(--theme-primary-bg)' : 'var(--admin-input-bg)',
                                                                                                                color: isSelected ? 'var(--theme-primary)' : 'var(--admin-text-sub)',
                                                                                                                border: `1px solid ${isSelected ? 'var(--theme-primary)' : 'var(--admin-border)'}`,
                                                                                                            }}
                                                                                                        >
                                                                                                            <span className="flex items-center gap-1">
                                                                                                                {child.name}
                                                                                                                {(() => {
                                                                                                                    try {
                                                                                                                        // child.id, originalSourceId, sourceIds 확인 (라벨 매칭은 오매칭 방지를 위해 제외)
                                                                                                                        const node = nodes[child.id] as any;
                                                                                                                        const idsToCheck = [child.id];
                                                                                                                        if (node?.attributes?.originalSourceId) idsToCheck.push(node.attributes.originalSourceId);
                                                                                                                        if (node?.sourceIds) idsToCheck.push(...node.sourceIds);
                                                                                                                        // sourceIds의 originalSourceId도 추적
                                                                                                                        for (const sid of [...idsToCheck]) {
                                                                                                                            const sn = nodes[sid] as any;
                                                                                                                            if (sn?.attributes?.originalSourceId && !idsToCheck.includes(sn.attributes.originalSourceId)) {
                                                                                                                                idsToCheck.push(sn.attributes.originalSourceId);
                                                                                                                            }
                                                                                                                            if (sn?.sourceIds) {
                                                                                                                                for (const ssid of sn.sourceIds) {
                                                                                                                                    if (!idsToCheck.includes(ssid)) idsToCheck.push(ssid);
                                                                                                                                }
                                                                                                                            }
                                                                                                                        }
                                                                                                                        for (const checkId of idsToCheck) {
                                                                                                                            const saved = localStorage.getItem(`content_media_${checkId}`);
                                                                                                                            if (saved) {
                                                                                                                                const arr = JSON.parse(saved);
                                                                                                                                if (Array.isArray(arr) && arr.length > 0) {
                                                                                                                                    return (
                                                                                                                                        <span
                                                                                                                                            onClick={(ev) => { ev.stopPropagation(); setContentPreview({ nodeId: checkId, name: child.name, contents: arr }); }}
                                                                                                                                            className="text-purple-500 hover:text-purple-700 cursor-pointer ml-0.5"
                                                                                                                                            title="컨텐츠 보기"
                                                                                                                                        >
                                                                                                                                            📷
                                                                                                                                        </span>
                                                                                                                                    );
                                                                                                                                }
                                                                                                                            }
                                                                                                                        }
                                                                                                                    } catch { }
                                                                                                                    return null;
                                                                                                                })()}
                                                                                                            </span>
                                                                                                            {child.unitPrice > 0 && (
                                                                                                                <span className="font-mono text-[11px]" style={{ color: isSelected ? 'var(--theme-primary)' : 'var(--admin-text-sub)' }}>
                                                                                                                    ₩{child.unitPrice.toLocaleString()}
                                                                                                                </span>
                                                                                                            )}
                                                                                                        </button>
                                                                                                    );
                                                                                                })}
                                                                                            </div>
                                                                                            {/* 금액 표시: '항' 단위면 단가만, 그 외는 수량*단가 */}
                                                                                            {(() => {
                                                                                                const sel = opt.children?.find(c => c.id === opt.selectedChildId);
                                                                                                let qty = parseFloat(String(opt.quantity)) || 0;
                                                                                                if (sel?.unit === 'm') qty = qty / 100;
                                                                                                if (!sel || sel.unitPrice <= 0) return null;
                                                                                                const isItemUnit = sel.unit === '항' || sel.unit === '건';
                                                                                                const total = Math.round(sel.unitPrice * qty);
                                                                                                return (
                                                                                                    <div className="pt-1.5" style={{ borderTop: '1px solid var(--admin-border)' }}>
                                                                                                        {isItemUnit ? (
                                                                                                            <div className="text-xs font-bold font-mono" style={{ color: 'var(--theme-primary)' }}>
                                                                                                                {sel.unitPrice.toLocaleString()}원
                                                                                                            </div>
                                                                                                        ) : (
                                                                                                            <>
                                                                                                                <div className="text-xs font-mono" style={{ color: 'var(--admin-text-sub)' }}>
                                                                                                                    단가 {sel.unitPrice.toLocaleString()}원 × {qty}
                                                                                                                </div>
                                                                                                                <div className="text-xs font-bold font-mono" style={{ color: 'var(--theme-primary)' }}>
                                                                                                                    = {total.toLocaleString()}원
                                                                                                                </div>
                                                                                                            </>
                                                                                                        )}
                                                                                                    </div>
                                                                                                );

                                                                                            })()}
                                                                                        </div>
                                                                                    ) : (
                                                                                        /* 싱글 옵션: 단가/금액 표시 */
                                                                                        <div className="space-y-1">
                                                                                            {/* 싱글 옵션 컨텐츠 아이콘 */}
                                                                                            {(() => {
                                                                                                try {
                                                                                                    const node = nodes[opt.id] as any;
                                                                                                    const idsToCheck = [opt.id];
                                                                                                    if (node?.attributes?.originalSourceId) idsToCheck.push(node.attributes.originalSourceId);
                                                                                                    if (node?.sourceIds) idsToCheck.push(...node.sourceIds);
                                                                                                    for (const sid of [...idsToCheck]) {
                                                                                                        const sn = nodes[sid] as any;
                                                                                                        if (sn?.attributes?.originalSourceId && !idsToCheck.includes(sn.attributes.originalSourceId)) idsToCheck.push(sn.attributes.originalSourceId);
                                                                                                        if (sn?.sourceIds) { for (const ssid of sn.sourceIds) { if (!idsToCheck.includes(ssid)) idsToCheck.push(ssid); } }
                                                                                                    }
                                                                                                    for (const checkId of idsToCheck) {
                                                                                                        const saved = localStorage.getItem(`content_media_${checkId}`);
                                                                                                        if (saved) {
                                                                                                            const arr = JSON.parse(saved);
                                                                                                            if (Array.isArray(arr) && arr.length > 0) {
                                                                                                                return (
                                                                                                                    <span
                                                                                                                        onClick={(ev) => { ev.stopPropagation(); setContentPreview({ nodeId: checkId, name: opt.name, contents: arr }); }}
                                                                                                                        className="text-purple-500 hover:text-purple-700 cursor-pointer text-base"
                                                                                                                        title="컨텐츠 보기"
                                                                                                                    >
                                                                                                                        📷
                                                                                                                    </span>
                                                                                                                );
                                                                                                            }
                                                                                                        }
                                                                                                    }
                                                                                                } catch { }
                                                                                                return null;
                                                                                            })()}
                                                                                            {opt.unitPrice > 0 && (
                                                                                                <div className="text-xs font-mono" style={{ color: 'var(--admin-text-sub)' }}>
                                                                                                    단가 ₩{opt.unitPrice.toLocaleString()} / {opt.unit === 'm' ? 'cm' : opt.unit}
                                                                                                </div>
                                                                                            )}
                                                                                            <div className="text-xs font-bold font-mono" style={{ color: 'var(--theme-primary)' }}>
                                                                                                = ₩{Math.round(opt.unitPrice * ((parseFloat(String(opt.quantity)) || 0) * (opt.unit === 'm' ? 0.01 : 1))).toLocaleString()}
                                                                                            </div>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                        {/* 실사 정보 카드: 선택된 실사 이미지가 있을 때 옵션 카드 우측에 동일 크기로 표시 */}
                                                                        {itemForm.measureImageUrl && (
                                                                            <div
                                                                                className="rounded-xl shadow-sm min-w-[140px] flex-1 max-w-[220px] overflow-hidden"
                                                                                style={{ background: 'var(--admin-surface)', border: '1px solid var(--theme-primary)' }}
                                                                            >
                                                                                {/* 카드 헤더 */}
                                                                                <div className="px-3 py-2 flex items-center justify-between" style={{ background: 'var(--theme-primary-bg)', borderBottom: '1px solid var(--theme-primary)' }}>
                                                                                    <span className="text-[10px] font-bold" style={{ color: 'var(--theme-primary)' }}>실사</span>
                                                                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: 'var(--theme-primary)', color: 'white' }}>
                                                                                        {MEASURE_CATEGORY_LABELS[itemForm.measureCategory] || itemForm.measureCategory}
                                                                                    </span>
                                                                                </div>
                                                                                {/* 실사 이미지 미리보기 */}
                                                                                <div className="relative w-full aspect-square overflow-hidden">
                                                                                    <img
                                                                                        src={itemForm.measureImageUrl}
                                                                                        alt={itemForm.measureImageName}
                                                                                        className="w-full h-full object-cover"
                                                                                    />
                                                                                    {/* 이름 + 금액 오버레이 */}
                                                                                    <div className="absolute bottom-0 left-0 right-0 px-2 py-1 flex items-center justify-between gap-1" style={{ background: 'rgba(0,0,0,0.60)' }}>
                                                                                        <span className="text-[10px] text-white font-bold truncate">{itemForm.measureImageName}</span>
                                                                                        {itemForm.measureUnitPrice > 0 && (
                                                                                            <span className="text-[10px] font-bold font-mono whitespace-nowrap" style={{ color: '#c4b5fd' }}>
                                                                                                ₩{itemForm.measureUnitPrice.toLocaleString()}
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                </div>

                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })()}
                                                    </div>
                                                )}

                                                {/* 사이즈 에러 메시지 */}
                                                {itemForm.sizeError && (
                                                    <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-bold mt-3">
                                                        <AlertCircle size={16} /> {itemForm.sizeError}
                                                    </div>
                                                )}
                                            </>
                                        )}

                                    </div>
                                </div>

                                {/* SECTION 3: Temporary Grid */}
                                <div className="rounded-2xl shadow-sm overflow-hidden min-h-[200px] flex flex-col" style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}>
                                    <div className="px-6 py-3 border-b flex justify-between items-center" style={{ background: 'var(--admin-bg)', borderColor: 'var(--admin-border)' }}>
                                        <h3 className="font-bold text-sm" style={{ color: 'var(--admin-text)' }}>등록 예정 리스트 ({newOrderItems.length})</h3>
                                    </div>
                                    <div className="flex-1 overflow-auto">
                                        <table className="w-full text-sm text-left whitespace-nowrap">
                                            <thead className="font-bold text-xs uppercase sticky top-0" style={{ background: 'var(--admin-bg)', color: 'var(--admin-text-sub)' }}>
                                                <tr>
                                                    <th className="px-6 py-3">NO</th>
                                                    <th className="px-6 py-3">상품명</th>
                                                    <th className="px-6 py-3">색상</th>
                                                    <th className="px-6 py-3">규격</th>
                                                    <th className="px-6 py-3 text-right">수량</th>
                                                    <th className="px-6 py-3 text-right">금액</th>
                                                    <th className="px-6 py-3 text-center">관리</th>
                                                </tr>
                                            </thead>
                                            <tbody style={{ borderColor: 'var(--admin-border)' }} className="divide-y">
                                                {newOrderItems.map((item, idx) => {
                                                    const isRoll = item.orderMode === 'FABRIC' && item.unitType === 'ROLL';
                                                    const isExpanded = expandedItemIds.has(item.id);
                                                    return (
                                                        <React.Fragment key={item.id}>
                                                            <tr
                                                                className={`group ${isRoll ? 'cursor-pointer' : ''}`}
                                                                style={{ transition: 'background 0.15s' }}
                                                                onMouseEnter={e => (e.currentTarget.style.background = 'var(--theme-primary-bg)')}
                                                                onMouseLeave={e => (e.currentTarget.style.background = '')}
                                                                onClick={() => {
                                                                    if (isRoll && item.selectedLots?.length > 0) {
                                                                        setExpandedItemIds(prev => {
                                                                            const next = new Set(prev);
                                                                            if (next.has(item.id)) next.delete(item.id);
                                                                            else next.add(item.id);
                                                                            return next;
                                                                        });
                                                                    }
                                                                }}
                                                            >
                                                                <td className="px-6 py-3" style={{ color: 'var(--admin-text-sub)' }}>
                                                                    {isRoll && item.selectedLots?.length > 0 && (
                                                                        <span className="text-[10px] mr-1" style={{ color: 'var(--admin-border)' }}>{isExpanded ? '▼' : '▶'}</span>
                                                                    )}
                                                                    {idx + 1}
                                                                </td>
                                                                <td className="px-6 py-3 font-bold" style={{ color: 'var(--admin-text)' }}>
                                                                    <span
                                                                        className="inline-block px-1.5 py-0.5 text-[10px] font-bold rounded mr-1.5"
                                                                        style={item.orderMode === 'PRODUCT'
                                                                            ? { background: 'var(--theme-primary-bg)', color: 'var(--theme-primary)' }
                                                                            : { background: 'rgba(var(--theme-primary-rgb,99,60,201),0.12)', color: 'var(--theme-primary)' }}
                                                                    >
                                                                        {item.orderMode === 'PRODUCT' ? '제품' : '원단'}
                                                                    </span>
                                                                    {item.productName}
                                                                    {item.installLocation && (
                                                                        <span className="font-normal ml-1" style={{ color: 'var(--admin-text-sub)' }}>: {item.installLocation}</span>
                                                                    )}
                                                                </td>
                                                                <td className="px-6 py-3" style={{ color: 'var(--admin-text)' }}>{item.colorName || '-'}</td>
                                                                <td className="px-6 py-3" style={{ color: 'var(--admin-text-sub)' }}>
                                                                    {item.orderMode === 'PRODUCT'
                                                                        ? `${parseFloat(item.prodWidth || '0').toFixed(1)}×${parseFloat(item.prodHeight || '0').toFixed(1)}cm`
                                                                        : item.width}
                                                                </td>
                                                                <td className="px-6 py-3 text-right font-bold" style={{ color: 'var(--admin-text)' }}>
                                                                    {item.orderMode === 'FABRIC' && item.unitType === 'ROLL' ? (
                                                                        <>
                                                                            {item.quantity}
                                                                            <span className="text-xs font-normal ml-1" style={{ color: 'var(--admin-text-sub)' }}>Roll</span>
                                                                            {item.totalLength > 0 && (
                                                                                <span className="text-xs font-normal ml-1" style={{ color: 'var(--admin-text-sub)' }}>
                                                                                    - {item.totalLength} m
                                                                                </span>
                                                                            )}
                                                                        </>
                                                                    ) : item.orderMode === 'FABRIC' && item.unitType === 'CUT' ? (
                                                                        <>
                                                                            {item.quantity}
                                                                            <span className="text-xs font-normal ml-1" style={{ color: 'var(--admin-text-sub)' }}>m</span>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            {item.quantity}
                                                                            <span className="text-xs font-normal ml-1" style={{ color: 'var(--admin-text-sub)' }}>
                                                                                {item.orderMode === 'PRODUCT' ? '개' : item.unitType === 'SLAT' ? '개' : 'm'}
                                                                            </span>
                                                                        </>
                                                                    )}
                                                                </td>
                                                                <td className="px-6 py-3 text-right">
                                                                    {(() => {
                                                                        const priceNum = Number(item.price?.replace?.(/,/g, '')) || 0;
                                                                        const isEdited = item.unitPrice !== item.originalUnitPrice;
                                                                        if (item.orderMode === 'FABRIC' && item.unitType === 'ROLL') {
                                                                            return (
                                                                                <div className="flex flex-col items-end gap-0.5">
                                                                                    <span className="font-mono font-bold" style={{ color: isEdited ? 'var(--color-danger, #dc2626)' : 'var(--admin-text)' }}>{priceNum.toLocaleString()}원</span>
                                                                                    <span className="text-[10px]" style={{ color: 'var(--admin-text-sub)' }}>
                                                                                        {item.totalLength || 0}×{(item.unitPrice || 0).toLocaleString()}
                                                                                    </span>
                                                                                </div>
                                                                            );
                                                                        }
                                                                        if (item.orderMode === 'FABRIC' && item.unitType === 'CUT') {
                                                                            return (
                                                                                <div className="flex flex-col items-end gap-0.5">
                                                                                    <span className="font-mono font-bold" style={{ color: isEdited ? 'var(--color-danger, #dc2626)' : 'var(--admin-text)' }}>{priceNum.toLocaleString()}원</span>
                                                                                    <span className="text-[10px]" style={{ color: 'var(--admin-text-sub)' }}>
                                                                                        {item.quantity}×{(item.unitPrice || 0).toLocaleString()} + 절단 {(Number(String(item.cuttingFee || '0').replace(/,/g, '')) || 0).toLocaleString()}
                                                                                    </span>
                                                                                </div>
                                                                            );
                                                                        }
                                                                        return <span className="font-mono" style={{ color: isEdited ? 'var(--color-danger, #dc2626)' : 'var(--admin-text)', fontWeight: isEdited ? 700 : 400 }}>{priceNum.toLocaleString()}원</span>;
                                                                    })()}
                                                                </td>
                                                                <td className="px-6 py-3 text-center" onClick={e => e.stopPropagation()}>
                                                                    <div className="flex justify-center gap-2">
                                                                        <button
                                                                            onClick={() => handleEditItem(item)}
                                                                            className="p-1.5 rounded transition-colors"
                                                                            style={{ color: 'var(--theme-primary)' }}
                                                                            onMouseEnter={e => { e.currentTarget.style.background = 'var(--theme-primary-bg)'; }}
                                                                            onMouseLeave={e => { e.currentTarget.style.background = ''; }}
                                                                        ><Edit size={14} /></button>
                                                                        <button
                                                                            onClick={() => handleDeleteItem(item.id)}
                                                                            className="p-1.5 rounded transition-colors"
                                                                            style={{ color: 'var(--color-danger, #dc2626)' }}
                                                                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(220,38,38,0.08)'; }}
                                                                            onMouseLeave={e => { e.currentTarget.style.background = ''; }}
                                                                        ><Trash2 size={14} /></button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                            {isRoll && isExpanded && item.selectedLots?.length > 0 && (
                                                                <tr style={{ background: 'var(--theme-primary-bg)' }}>
                                                                    <td colSpan={7} className="px-6 py-2">
                                                                        <div className="flex flex-wrap gap-2 justify-end">
                                                                            {item.selectedLots.map((lot, li) => (
                                                                                <span key={li} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs" style={{ background: 'var(--admin-surface)', border: '1px solid var(--theme-primary)', color: 'var(--admin-text)' }}>
                                                                                    <span className="font-bold" style={{ color: 'var(--theme-primary)' }}>{lot.lotNo}</span>
                                                                                    <span style={{ color: 'var(--admin-border)' }}>|</span>
                                                                                    <span className="font-mono" style={{ color: 'var(--admin-text-sub)' }}>{lot.length} m</span>
                                                                                </span>
                                                                            ))}
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </React.Fragment>
                                                    );
                                                })}
                                                {newOrderItems.length === 0 && (
                                                    <tr><td colSpan={7} className="py-10 text-center" style={{ color: 'var(--admin-text-sub)' }}>등록된 상품이 없습니다.</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                            </div >




                            {/* Footer Actions */}
                            <div className="px-8 py-5 border-t flex justify-end gap-3 sticky bottom-0 z-20" style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)' }}>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-6 py-3 rounded-xl text-sm font-bold transition-colors"
                                    style={{ background: 'var(--admin-bg)', color: 'var(--admin-text-sub)', border: '1px solid var(--admin-border)' }}
                                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--admin-border)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'var(--admin-bg)'; }}
                                >취소</button>
                                <button
                                    onClick={handleRegisterOrder}
                                    className="px-8 py-3 rounded-xl text-sm font-bold transition-transform active:scale-95 flex items-center gap-2"
                                    style={{ background: 'var(--theme-primary)', color: 'white', boxShadow: '0 4px 14px rgba(var(--theme-primary-rgb,99,60,201),0.35)' }}
                                    onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(1.1)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.filter = ''; }}
                                >
                                    <CheckCircle2 size={18} /> 주문 등록 완료
                                </button>
                            </div >
                        </div >
                    </div >
                )
            }

            {/* 5. ORDER DETAIL / EDIT MODAL (New) */}
            {/* ========================================================================================= */}
            {
                selectedDetailOrder && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedDetailOrder(null)} />
                        <div className="w-full max-w-2xl rounded-3xl shadow-2xl relative z-10 flex flex-col max-h-[90vh] overflow-hidden" style={{ background: 'var(--admin-surface)' }}>

                            {/* Header */}
                            <div className="px-8 py-5 border-b flex items-center justify-between" style={{ borderColor: 'var(--admin-border)', background: 'var(--admin-surface)' }}>
                                <div className="flex flex-col">
                                    <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--admin-text)' }}>
                                        <Edit style={{ color: 'var(--theme-primary)' }} size={20} /> 주문 상세 및 수정
                                    </h2>
                                    <p className="text-xs mt-1" style={{ color: 'var(--admin-text-sub)' }}>주문 ID: {selectedDetailOrder.id}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleDetailDelete}
                                        className="p-2 rounded-full transition-colors"
                                        style={{ color: 'var(--admin-text-sub)' }}
                                        onMouseEnter={e => { e.currentTarget.style.color = '#dc2626'; e.currentTarget.style.background = '#fef2f2'; }}
                                        onMouseLeave={e => { e.currentTarget.style.color = 'var(--admin-text-sub)'; e.currentTarget.style.background = 'transparent'; }}
                                    ><Trash2 size={20} /></button>
                                    <button
                                        onClick={() => setSelectedDetailOrder(null)}
                                        className="p-2 rounded-full transition-colors"
                                        style={{ color: 'var(--admin-text-sub)' }}
                                        onMouseEnter={e => { e.currentTarget.style.color = 'var(--admin-text)'; e.currentTarget.style.background = 'var(--admin-list-hover)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.color = 'var(--admin-text-sub)'; e.currentTarget.style.background = 'transparent'; }}
                                    ><X size={24} /></button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 space-y-6" style={{ background: 'var(--admin-bg)' }}>

                                {/* Info Card */}
                                <div className="p-6 rounded-2xl shadow-sm" style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}>
                                    <h4 className="text-sm font-bold uppercase mb-4" style={{ color: 'var(--admin-text-sub)' }}>기본 정보 (수정불가)</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div><label className="text-[10px] block" style={{ color: 'var(--admin-text-sub)' }}>거래처</label><div className="font-bold" style={{ color: 'var(--admin-text)' }}>{selectedDetailOrder.partnerName}</div></div>
                                        <div><label className="text-[10px] block" style={{ color: 'var(--admin-text-sub)' }}>대표자</label><div className="font-bold" style={{ color: 'var(--admin-text)' }}>{selectedDetailOrder.ceoName}</div></div>
                                        <div><label className="text-[10px] block" style={{ color: 'var(--admin-text-sub)' }}>연락처</label><div className="font-mono" style={{ color: 'var(--admin-text)' }}>{selectedDetailOrder.phone}</div></div>
                                        <div><label className="text-[10px] block" style={{ color: 'var(--admin-text-sub)' }}>입력시간</label><div className="font-mono" style={{ color: 'var(--admin-text)' }}>{selectedDetailOrder.inputTime}</div></div>
                                        <div className="col-span-2 p-3 rounded-xl" style={{ background: 'var(--theme-primary-bg)', border: '1px solid var(--theme-primary)' }}>
                                            <label className="text-[10px] block font-bold mb-1" style={{ color: 'var(--theme-primary)' }}>주문 상품</label>
                                            <div className="font-bold" style={{ color: 'var(--theme-primary)' }}>{selectedDetailOrder.productName}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Edit Form */}
                                <div className="p-6 rounded-2xl shadow-sm" style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}>
                                    <h4 className="text-sm font-bold uppercase mb-4 flex items-center gap-2" style={{ color: 'var(--admin-text-sub)' }}><Scissors size={14} /> 주문 정보 수정</h4>
                                    <div className="grid grid-cols-2 gap-5">
                                        <div>
                                            <label className="text-[11px] font-bold block mb-1" style={{ color: 'var(--admin-text-sub)' }}>주문 수량 ({selectedDetailOrder.unit})</label>
                                            <input
                                                type="number"
                                                value={selectedDetailOrder.quantity}
                                                onChange={(e) => handleDetailChange('quantity', e.target.value)}
                                                className="w-full px-3 py-2 rounded-lg font-bold text-right outline-none transition-all"
                                                style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}
                                                onFocus={e => { e.currentTarget.style.borderColor = 'var(--theme-primary)'; }}
                                                onBlur={e => { e.currentTarget.style.borderColor = 'var(--admin-border)'; }}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-bold block mb-1" style={{ color: 'var(--admin-text-sub)' }}>금액 (자동계산)</label>
                                            <div className="w-full px-3 py-2 rounded-lg text-right font-mono cursor-not-allowed" style={{ background: 'var(--admin-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text-sub)' }}>
                                                {selectedDetailOrder.amount.toLocaleString()} 원
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-bold block mb-1" style={{ color: 'var(--admin-text-sub)' }}>출고 요청일</label>
                                            <PremiumDatePicker
                                                value={selectedDetailOrder.shippingDate}
                                                onChange={(val) => handleDetailChange('shippingDate', val)}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-bold block mb-1" style={{ color: 'var(--admin-text-sub)' }}>현재 재고</label>
                                            <div className="w-full px-3 py-2 rounded-lg text-right font-mono cursor-not-allowed" style={{ background: 'var(--admin-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text-sub)' }}>
                                                {selectedDetailOrder.inventory.toLocaleString()}
                                            </div>
                                        </div>
                                        <div className="col-span-2">
                                            <label className="text-[11px] font-bold block mb-1" style={{ color: 'var(--admin-text-sub)' }}>도착지 주소</label>
                                            <div className="flex gap-2">
                                                <div className="p-2 rounded-lg flex items-center" style={{ background: 'var(--admin-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text-sub)' }}><MapPin size={18} /></div>
                                                <input
                                                    type="text"
                                                    value={selectedDetailOrder.destination}
                                                    onChange={(e) => handleDetailChange('destination', e.target.value)}
                                                    className="flex-1 px-3 py-2 rounded-lg text-sm outline-none transition-all"
                                                    style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}
                                                    onFocus={e => { e.currentTarget.style.borderColor = 'var(--theme-primary)'; }}
                                                    onBlur={e => { e.currentTarget.style.borderColor = 'var(--admin-border)'; }}
                                                />
                                            </div>
                                        </div>
                                        <div className="col-span-2">
                                            <label className="text-[11px] font-bold block mb-1" style={{ color: 'var(--admin-text-sub)' }}>비고 (메모)</label>
                                            <input
                                                type="text"
                                                value={selectedDetailOrder.note}
                                                onChange={(e) => handleDetailChange('note', e.target.value)}
                                                className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all"
                                                style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}
                                                onFocus={e => { e.currentTarget.style.borderColor = 'var(--theme-primary)'; }}
                                                onBlur={e => { e.currentTarget.style.borderColor = 'var(--admin-border)'; }}
                                            />
                                        </div>
                                    </div>
                                </div>

                            </div>

                            {/* Footer */}
                            <div className="px-8 py-5 border-t flex justify-end gap-3" style={{ borderColor: 'var(--admin-border)', background: 'var(--admin-surface)' }}>
                                <button
                                    onClick={() => setSelectedDetailOrder(null)}
                                    className="px-6 py-3 rounded-xl text-sm font-bold transition-colors"
                                    style={{ background: 'var(--admin-bg)', color: 'var(--admin-text-sub)', border: '1px solid var(--admin-border)' }}
                                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--admin-list-hover)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'var(--admin-bg)'; }}
                                >취소</button>
                                <button
                                    onClick={handleDetailSave}
                                    className="px-8 py-3 rounded-xl text-sm font-bold transition-transform active:scale-95 flex items-center gap-2"
                                    style={{ background: 'var(--theme-primary)', color: 'white', boxShadow: '0 4px 14px rgba(0,0,0,0.2)' }}
                                    onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(1.1)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.filter = ''; }}
                                >
                                    <CheckCircle2 size={18} /> 수정 완료
                                </button>
                            </div>

                        </div>
                    </div>
                )
            }

            {/* 컨텐츠 미리보기 팝업 */}
            {contentPreview && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4" onClick={() => setContentPreview(null)}>
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-lg max-h-[70vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center px-5 py-3 border-b border-gray-100 bg-gray-50/50">
                            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                                📷 <span>{contentPreview.name}</span> 컨텐츠
                            </h3>
                            <button onClick={() => setContentPreview(null)} className="text-gray-400 hover:text-gray-600 p-1">✕</button>
                        </div>
                        <div className="flex-1 overflow-auto p-4">
                            <div className="grid grid-cols-2 gap-3">
                                {contentPreview.contents.map(c => (
                                    <div key={c.id} className="rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                                        {c.type === 'IMAGE' && c.url ? (
                                            <img src={c.url} alt={c.name} className="w-full h-40 object-cover" />
                                        ) : c.type === 'VIDEO' ? (
                                            <div className="w-full h-40 bg-gray-100 flex items-center justify-center text-gray-400 text-xs">🎬 {c.name}</div>
                                        ) : (
                                            <div className="w-full h-40 bg-gray-100 flex items-center justify-center text-gray-300">📷</div>
                                        )}
                                        <div className="px-2 py-1.5 text-[10px] text-gray-500 truncate border-t border-gray-100">{c.name}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div >
    );
};

export default OrderReception;
