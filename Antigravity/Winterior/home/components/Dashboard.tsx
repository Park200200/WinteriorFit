
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { UserRole, NodeData } from '../types';
import { ROLE_CONFIGS, MOCK_MEASURE_IMAGES, MOCK_PARTNERS } from '../constants';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, Sparkles, Box, Palette, Plus, Image as ImageIcon,
    FileText, ShoppingCart, Ruler, MessageCircle, X,
    ChevronLeft, Home, ChevronRight, ArrowLeft, Clock, GripHorizontal,
    GitCommit, CheckCircle2, Mic, Store, BarChart3, LayoutTemplate, LayoutDashboard, Calendar,
    TrendingUp, TrendingDown, Users, AlertCircle, Package, ArrowUpRight, ArrowDownRight, RefreshCw, Scan,
    Truck, MapPin, MoreHorizontal
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';
import MindMapSystem from './MindMapSystem';
import ProductConfiguration from './ProductConfiguration';
import ColorConfiguration from './ColorConfiguration';
import MeasureManagement from './MeasureManagement';
import SpaceImageManagement from './SpaceImageManagement';
import StandardCost from './StandardCost';
import SalesPriceManagement from './SalesPriceManagement';
import UserManagement from './UserManagement';
import PartnerManagement from './PartnerManagement';
import HeadquartersInfo from './HeadquartersInfo';
import OrderReception from './OrderReception';
import StockInReservation from './StockInReservation';
import StockInConfirmation from './StockInConfirmation';
import StockOutManagement from './StockOutManagement';
import StockAdjustment from './StockAdjustment';
import TransactionLedger from './TransactionLedger';
import DepositManagement from './DepositManagement'; // Import DepositManagement
import AiContentsManagement from './AiContentsManagement';
import EstimateManagement from './EstimateManagement';
import ScheduleManagement from './ScheduleManagement';
import SearchInquiry from './SearchInquiry';
import CustomerManagement from './CustomerManagement';
import ManufacturingOrder from './ManufacturingOrder';
import ProductionManagement from './ProductionManagement';
import KioskManagement from './KioskManagement';
import AdminDeviceManagement from './AdminDeviceManagement';
import AdminDashboard from './AdminDashboard';
import { AdminThemeSettings } from './AdminThemeSettings';
import { useProductContext } from './ProductContext';
import { usePartnerContext } from '../PartnerContext';
import VirtualKeypad from './VirtualKeypad';
import ChatInterface from './ChatInterface';
import ProductSummary from './ProductSummary';
import TreeNodeLinker from './TreeNodeLinker';

// ─── 상품상세 페이지 (ADMIN 전용) ───
const ProductDetailPage: React.FC<{ role?: UserRole }> = ({ role }) => {
    const { nodes } = useProductContext();
    // 글로벌 시스템 트리 루트 탐색
    const systemRootId = React.useMemo(() => {
        // 1순위: MindMapSystem이 직접 참조하는 마스터 시스템 루트
        if (nodes['root-1770804399939']) return 'root-1770804399939';
        // 2순위: label='시스템' 인 ROOT 중 자식이 가장 많은 것
        const allNodes = Object.values(nodes) as import('../types').NodeData[];
        const candidates = allNodes
            .filter(n =>
                n.type === 'ROOT' &&
                (n.label === '시스템' || n.attributes?.treeType === 'system') &&
                !n.attributes?.partnerId
            )
            .sort((a, b) => (b.childrenIds?.length ?? 0) - (a.childrenIds?.length ?? 0));
        return candidates[0]?.id;
    }, [nodes]);

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden">
            <StandardCost rootId="root" role={role} systemRootId={systemRootId} />
        </div>
    );
};

interface DashboardProps {
    role: UserRole;
    currentPath: string;
    onNavigate?: (path: string) => void;
    isInspectorActive?: boolean;
}

interface TreeNode {
    label: string;
    value: string;
    children?: TreeNode[];
}

// ... (MOCK_DASHBOARD_DATA constant remains same) ...
const MOCK_DASHBOARD_DATA = {
    partnersCount: 128,
    currentMonthSales: 450000000,
    prevMonthSales: 380000000,
    twoMonthsAgoSales: 350000000,
    totalReceivables: 125000000,
    monthlySalesHistory: [
        { month: '1월', sales: 250000000 },
        { month: '2월', sales: 280000000 },
        { month: '3월', sales: 350000000 },
        { month: '4월', sales: 380000000 },
        { month: '5월', sales: 450000000 }, // Current
        { month: '6월', sales: 0 },
        { month: '7월', sales: 0 },
        { month: '8월', sales: 0 },
        { month: '9월', sales: 0 },
        { month: '10월', sales: 0 },
        { month: '11월', sales: 0 },
        { month: '12월', sales: 0 },
    ],
    topSalesProducts: [
        { name: '암막 롤스크린 (화이트)', amount: 45000000, change: 12 },
        { name: '콤비 블라인드 (베이지)', amount: 38000000, change: -5 },
        { name: '우드 블라인드 (오크)', amount: 32000000, change: 8 },
        { name: '허니콤 쉐이드 (그레이)', amount: 28000000, change: 15 },
        { name: '알루미늄 25mm (실버)', amount: 15000000, change: 2 }
    ],
    topInventoryProducts: [
        { name: '쉬폰 커튼 (나비주름)', stock: 5400, unit: 'Roll' },
        { name: '암막 커튼 (네이비)', stock: 3200, unit: 'Roll' },
        { name: '린넨 룩 (화이트)', stock: 2800, unit: 'Roll' },
        { name: '벨벳 (버건디)', stock: 2100, unit: 'Roll' },
        { name: '암막 롤스크린 (차콜)', stock: 1500, unit: 'Roll' }
    ],
    topCumulativePartners: [
        { name: '나이스창', amount: 120000000 },
        { name: '햇살드림', amount: 98000000 },
        { name: '윈도우앤', amount: 85000000 },
        { name: '공간디자인', amount: 72000000 },
        { name: '더블라인드', amount: 65000000 },
        { name: '창문나라', amount: 54000000 },
        { name: '커튼갤러리', amount: 48000000 },
        { name: '바른창', amount: 42000000 },
        { name: '홈스타일링', amount: 38000000 },
        { name: '뷰티풀창', amount: 35000000 }
    ],
    topMonthlyPartners: [
        { name: '햇살드림', amount: 25000000 },
        { name: '나이스창', amount: 22000000 },
        { name: '더블라인드', amount: 18000000 },
        { name: '윈도우앤', amount: 16500000 },
        { name: '공간디자인', amount: 14000000 },
        { name: '바른창', amount: 12500000 },
        { name: '창문나라', amount: 11000000 },
        { name: '커튼갤러리', amount: 9800000 },
        { name: '뷰티풀창', amount: 8500000 },
        { name: '홈스타일링', amount: 7200000 }
    ],
    topReceivablesPartners: [
        { name: '아트블라인드', amount: 15000000, risk: 'HIGH' },
        { name: '빛과창', amount: 12500000, risk: 'MEDIUM' },
        { name: '드림커튼', amount: 9800000, risk: 'MEDIUM' },
        { name: '네이처창', amount: 8500000, risk: 'LOW' },
        { name: '스타일윈도우', amount: 7200000, risk: 'LOW' },
        { name: '행복한창', amount: 6500000, risk: 'LOW' },
        { name: '굿모닝데코', amount: 5800000, risk: 'LOW' },
        { name: '예쁜창', amount: 4500000, risk: 'LOW' },
        { name: '퍼스트창', amount: 3200000, risk: 'LOW' },
        { name: '윈도우앤', amount: 2100000, risk: 'LOW' }
    ]
};

const Dashboard: React.FC<DashboardProps> = ({ role, currentPath, onNavigate, isInspectorActive }) => {
    const { nodes, setNodes } = useProductContext();
    const { partners, getSolutionImage } = usePartnerContext();
    const [currentDate, setCurrentDate] = useState<Date>(new Date());

    // 페이지별 역할 키 매핑 (솔루션 이미지 독립 관리용)
    const roleKey = (() => {
      switch (role) {
        case UserRole.ADMIN: return 'ADMIN';
        case UserRole.AGENCY: return 'AGENCY';
        case UserRole.DISTRIBUTOR: return 'DISTRIBUTOR';
        case UserRole.FABRIC_SUPPLIER: return 'FABRIC_SUPPLIER';
        case UserRole.MANUFACTURER: return 'MANUFACTURER';
        default: return 'ADMIN';
      }
    })();
    // 현재 역할의 솔루션 메인 이미지 (역할별 독립)
    const solutionMainImage = getSolutionImage(roleKey);

    // State for Chart Navigation
    const [chartYear, setChartYear] = useState(2024);

    const buildTree = (nodes: Record<string, NodeData>, rootId: string = 'root', filterColors: boolean = false): TreeNode[] => {
        const rootNode = nodes[rootId];
        if (!rootNode) return [];

        const buildRecursive = (id: string): TreeNode | null => {
            const node = nodes[id];
            if (!node) return null;

            // Optional: Filter out color nodes for specific trees (like Kyungdong product view)
            if (filterColors && (node.attributes?.nodeType === 'color' || node.attributes?.color)) {
                return null;
            }

            const treeNode: TreeNode = {
                label: node.label,
                value: node.id,
                children: []
            };

            if (node.childrenIds && node.childrenIds.length > 0) {
                treeNode.children = node.childrenIds
                    .map(childId => buildRecursive(childId))
                    .filter((child): child is TreeNode => child !== null);
            }

            return treeNode;
        };

        return rootNode.childrenIds
            .map(childId => buildRecursive(childId))
            .filter((child): child is TreeNode => child !== null);
    };

    const productTree = useMemo(() => buildTree(nodes), [nodes]);

    // Find First Product & Color Labels for Menu (Deepest First Path)
    const { firstProductLabel, firstColorLabel } = useMemo(() => {
        let pLabel = '상품';
        let cLabel = '칼라';

        const findFirstProductDeep = (treeNodes: TreeNode[]): TreeNode | null => {
            if (!treeNodes || treeNodes.length === 0) return null;

            // Always follow the first child to find the first leaf product in the tree
            const node = treeNodes[0];
            const data = nodes[node.value];

            if (!data) return null;

            // Check if this node is explicitly a product
            if (data.attributes?.nodeType === 'product') {
                return node;
            }

            // Recurse down to the first child
            if (node.children && node.children.length > 0) {
                return findFirstProductDeep(node.children);
            }

            return null;
        };

        const firstProduct = findFirstProductDeep(productTree);

        if (firstProduct) {
            const productData = nodes[firstProduct.value];
            if (productData) {
                pLabel = productData.label;
            }

            // Find the first color child of this specific product
            if (firstProduct.children && firstProduct.children.length > 0) {
                const firstChild = firstProduct.children[0];
                const cData = nodes[firstChild.value];
                if (cData && (cData.attributes?.nodeType === 'color' || cData.attributes?.color)) {
                    cLabel = cData.label;
                }
            }
        }

        return { firstProductLabel: pLabel, firstColorLabel: cLabel };
    }, [productTree, nodes]);

    const [selectedColorLabel, setSelectedColorLabel] = useState<string | null>(null);
    const [activeProductLabel, setActiveProductLabel] = useState<string | null>(null);
    const [selectedMeasureName, setSelectedMeasureName] = useState<string | null>(null);

    const targetId = useMemo(() => {
        switch (role) {
            case UserRole.AGENCY: return 'ag1';
            case UserRole.DISTRIBUTOR: return 'd1';
            case UserRole.FABRIC_SUPPLIER: return 'f1';
            case UserRole.MANUFACTURER: return 'm1';
            default: return 'm1';
        }
    }, [role]);

    const [selectedPath, setSelectedPath] = useState<TreeNode[]>([]);
    const [showMeasurePanel, setShowMeasurePanel] = useState(false);
    const [measureSearchQuery, setMeasureSearchQuery] = useState('');

    const [showPathPanel, setShowPathPanel] = useState(false);
    const [pathSiblings, setPathSiblings] = useState<NodeData[]>([]);
    const [activePathIndex, setActivePathIndex] = useState<number | null>(null);
    const [isPendingUpdate, setIsPendingUpdate] = useState(false);

    const [dashboardBg, setDashboardBg] = useState<string | null>(null);

    const [isKeypadOpen, setIsKeypadOpen] = useState(false);
    const [searchText, setSearchText] = useState('');

    const [menuRotation, setMenuRotation] = useState(0);
    const [menuMode, setMenuMode] = useState<'home' | 'product' | 'color' | 'search' | 'measure'>('home');

    // --- KYUNGDONG HIERARCHICAL NAV STATE ---
    const [kyungdongPath, setKyungdongPath] = useState<TreeNode[]>([]);
    const [kyungdongActiveLevel, setKyungdongActiveLevel] = useState<number | null>(null);

    const kyungdongTree = useMemo(() => {
        const tree = buildTree(nodes, 'root-partner-d1', true);

        // For AGENCY role: filter to only show products with cost data set by distributor
        if (role === UserRole.AGENCY) {
            const hasCostData = (nodeId: string): boolean => {
                const node = nodes[nodeId];
                if (!node) return false;
                const attrs = node.attributes || {};
                return !!(attrs.cost_fabric_list || attrs.cost_cutting_list || attrs.cost_measure_list);
            };

            const filterTree = (treeNodes: TreeNode[]): TreeNode[] => {
                return treeNodes
                    .map(tn => {
                        const nodeData = nodes[tn.value];
                        // Product nodes: keep only if they have cost data
                        if (nodeData?.attributes?.nodeType === 'product') {
                            return hasCostData(tn.value) ? tn : null;
                        }
                        // Category/system nodes: recurse and keep if any children remain
                        const filteredChildren = filterTree(tn.children || []);
                        if (filteredChildren.length === 0 && (!nodeData?.attributes?.nodeType || nodeData.attributes.nodeType !== 'product')) {
                            return null; // Remove empty categories
                        }
                        return { ...tn, children: filteredChildren };
                    })
                    .filter((tn): tn is TreeNode => tn !== null);
            };

            return filterTree(tree);
        }

        return tree;
    }, [nodes, role]);

    // Initialize Kyungdong Path & Default Selection (Root -> First Path)
    useEffect(() => {
        const findFirstLeafPath = (treeNodes: TreeNode[]): TreeNode[] => {
            if (treeNodes.length === 0) return [];
            const first = treeNodes[0];
            const nodeData = nodes[first.value];
            // Stop if it's a product
            if (nodeData?.attributes?.nodeType === 'product' || !first.children || first.children.length === 0) return [first];
            return [first, ...findFirstLeafPath(first.children)];
        };

        const rootNode = nodes['root-partner-d1'];
        if (rootNode) {
            const rootTreeNode: TreeNode = { label: rootNode.label, value: rootNode.id, children: kyungdongTree };
            const defaultPath = [rootTreeNode, ...findFirstLeafPath(kyungdongTree)];
            setKyungdongPath(defaultPath);

            // Default Selection if none exists
            if (!activeProductLabel) {
                const lastNode = defaultPath[defaultPath.length - 1];
                const lastNodeData = nodes[lastNode.value];
                if (lastNodeData && lastNodeData.attributes?.nodeType === 'product') {
                    setSelectedPath(defaultPath);
                    setActiveProductLabel(lastNodeData.label);

                    if (lastNodeData.childrenIds && lastNodeData.childrenIds.length > 0) {
                        const colorNode = nodes[lastNodeData.childrenIds[0]];
                        if (colorNode && (colorNode.attributes?.nodeType === 'color' || colorNode.attributes?.color)) {
                            setSelectedColorLabel(colorNode.label);
                        }
                    }
                }
            }
        }
    }, [kyungdongTree, nodes]);

    const handleKyungdongLevelClick = (e: React.MouseEvent, index: number) => {
        e.stopPropagation();
        setKyungdongActiveLevel(index === kyungdongActiveLevel ? null : index);
    };

    const handleKyungdongSiblingSelect = (sibling: TreeNode, levelIndex: number) => {
        const findFirstLeafPath = (node: TreeNode): TreeNode[] => {
            const nodeData = nodes[node.value];
            // Stop if it's a product
            if (nodeData?.attributes?.nodeType === 'product' || !node.children || node.children.length === 0) return [node];
            return [node, ...findFirstLeafPath(node.children[0])];
        };

        const newPrefix = kyungdongPath.slice(0, levelIndex);
        const newSuffix = findFirstLeafPath(sibling);
        const newPath = [...newPrefix, ...newSuffix];

        setKyungdongPath(newPath);
        setKyungdongActiveLevel(null);

        // ONLY ROTATE HOME IF THE CLICKED SIBLING WAS A PRODUCT
        const clickedSiblingData = nodes[sibling.value];
        if (clickedSiblingData && clickedSiblingData.attributes?.nodeType === 'product') {
            const lastNodeData = clickedSiblingData;
            setSelectedPath(newPath);
            setActiveProductLabel(lastNodeData.label);

            // Auto-select first color
            if (lastNodeData.childrenIds && lastNodeData.childrenIds.length > 0) {
                const colorNode = nodes[lastNodeData.childrenIds[0]];
                if (colorNode && (colorNode.attributes?.nodeType === 'color' || colorNode.attributes?.color)) {
                    setSelectedColorLabel(colorNode.label);
                } else {
                    setSelectedColorLabel(null);
                }
            } else {
                setSelectedColorLabel(null);
            }

            // Return to Home immediately when a product is selected
            rotateToHome();
        }
    };

    const [isSearchMode, setIsSearchMode] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const [isListening, setIsListening] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const colorListRef = useRef<HTMLDivElement>(null);
    const pathListRef = useRef<HTMLDivElement>(null);

    const siblingBarRef = useRef<HTMLDivElement>(null);
    const breadcrumbBarRef = useRef<HTMLDivElement>(null);
    const colorBarRef = useRef<HTMLDivElement>(null);

    // Initial Path Logic
    useEffect(() => {
        const findFirstLeafPath = (nodes: TreeNode[]): TreeNode[] => {
            if (nodes.length === 0) return [];
            const first = nodes[0];
            if (!first.children || first.children.length === 0) return [first];
            return [first, ...findFirstLeafPath(first.children)];
        };

        const defaultPath = findFirstLeafPath(productTree);
        if (defaultPath.length > 0) {
            setSelectedPath(defaultPath);
        }
    }, [productTree]);

    // Auto-focus Search Input
    useEffect(() => {
        if (isSearchMode && searchInputRef.current) {
            setTimeout(() => {
                searchInputRef.current?.focus();
            }, 100);
        }
    }, [isSearchMode]);

    // Ensure Partner Root exists (Auto-create independent tree if missing)
    useEffect(() => {
        // Fabric Supplier & Manufacturer Auto-creation
        if ((role === UserRole.FABRIC_SUPPLIER || role === UserRole.MANUFACTURER) && ['product_mgmt', 'standard_cost', 'sales_price', 'margin', 'product_price', 'standard_product', 'sales_settings'].includes(currentPath)) {
            const partnerRootId = `root-partner-${targetId}`;
            const templateId = `root-${targetId}`;
            const templateNode = nodes[templateId];

            const partner = MOCK_PARTNERS.find(p => p.id === targetId);
            const partnerName = partner ? partner.partnerName : '';
            const desiredLabel = partnerName ? `${partnerName} > 표준상품` : '표준상품';

            // Check if node exists but is missing crucial attributes (e.g. disconnectedIds from template)
            const existingNode = nodes[partnerRootId];

            const labelMismatch = existingNode && existingNode.label !== desiredLabel;
            const needsUpdate = existingNode && (
                (templateNode?.attributes?.disconnectedIds && existingNode.attributes?.disconnectedIds !== templateNode.attributes.disconnectedIds) ||
                labelMismatch
            );

            if (!existingNode || needsUpdate) {
                // Auto-create or Update independent partner root
                setNodes(prev => ({
                    ...prev,
                    [partnerRootId]: {
                        ...(prev[partnerRootId] || {}), // Preserve existing props if updating (like childrenIds if any)
                        id: partnerRootId,
                        parentId: null,
                        type: 'ROOT',
                        label: desiredLabel, // Consistent naming
                        isExpanded: true,
                        // If creating new, start empty. If updating, keep existing children.
                        childrenIds: existingNode ? existingNode.childrenIds : [],
                        sourceIds: [],   // No source -> Not virtually linked
                        attributes: {
                            ...(prev[partnerRootId]?.attributes || {}),
                            nodeType: 'root',
                            partnerId: targetId,
                            originalRootId: 'root',
                            // Inherit disconnectedIds from static template if available
                            disconnectedIds: templateNode?.attributes?.disconnectedIds
                        }
                    }
                }));
            }
        }

        // Distributor Standard Product Tree Logic (Kyungdong Logistics)
        if (role === UserRole.DISTRIBUTOR && (currentPath === 'dist_std_products' || currentPath === 'dist_std_product_config')) {
            const partnerRootId = 'root-partner-d1'; // Kyungdong Logistics Standard Product Tree
            if (!nodes[partnerRootId]) {
                const templateRoot = nodes['root'];
                if (templateRoot) {
                    setNodes(prev => ({
                        ...prev,
                        [partnerRootId]: {
                            id: partnerRootId,
                            parentId: null,
                            type: 'ROOT',
                            label: '(주)경동물류 표준상품',
                            isExpanded: true,
                            childrenIds: templateRoot.childrenIds, // Link to existing structure
                            sourceIds: [],
                            attributes: { nodeType: 'root', partnerId: 'd1', originalRootId: 'root' }
                        }
                    }));
                }
            }
        }

        // --- SPECIAL: System Tree Auto-Creation for DISTRIBUTOR & MANUFACTURER ---
        // Ensure they have a "System Tree" (root-1770804399939-partner-XXX) derived from Base System Tree
        if ((role === UserRole.DISTRIBUTOR || role === UserRole.MANUFACTURER) &&
            (currentPath === 'dist_std_products' || currentPath === 'dist_std_product_config' || currentPath === 'product_price' || currentPath === 'standard_settings' || currentPath === 'margin' || currentPath === 'sales_settings')) {

            const baseSystemRootId = 'root-1770804399939';
            const partnerSystemRootId = `root-1770804399939-partner-${targetId}`;

            // Only create if missing
            if (!nodes[partnerSystemRootId] && nodes[baseSystemRootId]) {
                const baseRoot = nodes[baseSystemRootId];

                // We need to semi-deep copy the structure to allow reference preservation
                // For simplicity/robustness in Dashboard, we'll create the Root and link children.
                // However, for correct "Assembly" tab operation, we often need the CATEGORY structure to exist under this new root.
                // Since this is a "System" mirror, we'll attempt to shallow-copy the immediate children (Categories) 
                // but actually, we should probably just LINK the childrenIds if they are strictly "System Categories".

                // BETTER STRATEGY: Create the Root and copy childrenIds directly from Base System Root.
                // This effectively "mounts" the same system categories under the partner's system root.

                setNodes(prev => ({
                    ...prev,
                    [partnerSystemRootId]: {
                        id: partnerSystemRootId,
                        parentId: null,
                        type: 'ROOT',
                        label: role === UserRole.DISTRIBUTOR ? '시스템(유통)' : '시스템(제조)',
                        isExpanded: true,
                        childrenIds: baseRoot.childrenIds || [], // Direct link to Base System Categories (Blind, Curtain)
                        sourceIds: [baseSystemRootId], // Mark origin
                        attributes: {
                            nodeType: 'root',
                            treeType: 'system',
                            partnerId: targetId,
                            originalSourceId: baseSystemRootId,
                            // Important: Inherit virtual map if exists, though primarily used for leaves
                            virtualChildMap: baseRoot.attributes?.virtualChildMap
                        }
                    }
                }));
            }
        }
    }, [role, currentPath, targetId, nodes, setNodes]);

    const shouldShowDock = () => {
        if (isSearchMode) return false;
        // Specifically allowed for Promo Page (ai_contents)
        if (currentPath === 'ai_contents' || currentPath === 'ai_catalog') return true;
        if (role === UserRole.DISTRIBUTOR || role === UserRole.MANUFACTURER || role === UserRole.ADMIN || role === UserRole.FABRIC_SUPPLIER) return false;
        if (role === UserRole.AGENCY) return currentPath === 'ai_catalog';
        return true;
    };

    const handleBreadcrumbClick = (index: number, e: React.MouseEvent<HTMLElement>) => {
        e.stopPropagation();
        const clickedNode = selectedPath[index];
        const nodeData = nodes[clickedNode.value];
        if (!nodeData || !nodeData.parentId) return;
        const parentNode = nodes[nodeData.parentId];
        if (!parentNode) return;
        const siblings = parentNode.childrenIds.map(id => nodes[id]).filter(Boolean);
        setPathSiblings(siblings);
        setActivePathIndex(index);
        setShowPathPanel(true);
        setShowMeasurePanel(false);
        setIsPendingUpdate(false);
    };

    const handleSiblingSelect = (siblingNode: NodeData) => {
        if (activePathIndex === null) return;
        const newTreeNode: TreeNode = {
            label: siblingNode.label,
            value: siblingNode.id,
            children: []
        };
        const findFirstLeafPath = (nodeId: string): TreeNode[] => {
            const node = nodes[nodeId];
            if (!node) return [];
            const tNode: TreeNode = { label: node.label, value: node.id, children: [] };
            if (!node.childrenIds || node.childrenIds.length === 0) return [tNode];
            const validChildren = node.childrenIds.map(id => nodes[id]).filter(n =>
                n && n.attributes?.nodeType !== 'color' && !n.attributes?.color
            );
            if (validChildren.length === 0) return [tNode];
            return [tNode, ...findFirstLeafPath(validChildren[0].id)];
        };
        const pathPrefix = selectedPath.slice(0, activePathIndex);
        const newSuffix = findFirstLeafPath(siblingNode.id);
        setSelectedPath([...pathPrefix, ...newSuffix]);
        setShowPathPanel(false);
        setIsPendingUpdate(true);
    };

    const handleConfirmUpdate = (e: React.MouseEvent) => {
        e.stopPropagation();
        const lastNode = selectedPath[selectedPath.length - 1];
        if (lastNode) setActiveProductLabel(lastNode.label);
        setIsPendingUpdate(false);
        setTimeout(() => rotateToHome(), 200);
    };

    const toggleMeasurePanel = (e: React.MouseEvent) => {
        e.stopPropagation();
        rotateToMeasure();
    };

    const selectMeasureImage = (img: any) => {
        setDashboardBg(img.imageUrl);
        setSelectedMeasureName(img.tags[0]);
        setShowMeasurePanel(false);
    };

    const handleKeypadInput = (char: string) => setSearchText(prev => prev + char);
    const handleKeypadDelete = () => setSearchText(prev => prev.slice(0, -1));
    const handleKeypadSearch = () => { alert(`'${searchText}' 검색 결과가 없습니다.`); setIsKeypadOpen(false); };

    const handleOpenSearchMode = (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setMenuRotation(90); // All sub-menus at 90
        setMenuMode('search');
        setShowMeasurePanel(false);
        setShowPathPanel(false);
        setTimeout(() => searchInputRef.current?.focus(), 300);
    };

    const handleCloseSearchMode = () => { setIsSearchMode(false); setSearchText(''); };

    const handleVoiceInput = (e: React.MouseEvent) => {
        e.stopPropagation();
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) { alert("이 브라우저는 음성 인식을 지원하지 않습니다."); return; }
        if (isListening) { setIsListening(false); return; }
        setIsListening(true);
        const recognition = new SpeechRecognition();
        recognition.lang = 'ko-KR';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setSearchText(transcript);
            setIsListening(false);
        };
        recognition.onerror = (event: any) => { console.error("Speech Recognition Error", event.error); setIsListening(false); };
        recognition.onend = () => { setIsListening(false); };
        recognition.start();
    };

    const handleFileClick = (e: React.MouseEvent) => { e.stopPropagation(); fileInputRef.current?.click(); };
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file) alert(`파일이 선택되었습니다: ${file.name}`); e.target.value = ''; };
    const handleSearchExecute = () => { if (!searchText.trim()) return; alert(`'${searchText}' 검색을 실행합니다.`); };

    // --- Rotation Constants for Square Prism ---
    const rotateToHome = () => {
        setMenuRotation(0);
        onNavigate?.('dashboard');
        setShowMeasurePanel(false);
        setShowPathPanel(false);
        setIsPendingUpdate(false);
        // Delay resetting the menu mode so the sub-menu UI stays visible during rotation
        setTimeout(() => setMenuMode('home'), 600);
    };
    const rotateToProduct = () => { setMenuRotation(90); setMenuMode('product'); onNavigate?.('ai_catalog'); setShowMeasurePanel(false); setShowPathPanel(false); setIsPendingUpdate(false); };
    const rotateToColor = () => { setMenuRotation(90); setMenuMode('color'); setShowMeasurePanel(false); setShowPathPanel(false); };
    const rotateToSearch = () => { setMenuRotation(90); setMenuMode('search'); setShowMeasurePanel(false); setShowPathPanel(false); setTimeout(() => searchInputRef.current?.focus(), 300); };
    const rotateToMeasure = () => { setMenuRotation(90); setMenuMode('measure'); setShowMeasurePanel(false); setShowPathPanel(false); setMeasureSearchQuery(''); };

    const displayPath = useMemo(() => {
        return selectedPath.filter(node => {
            const data = nodes[node.value];
            if (!data) return true;
            if (data.attributes?.nodeType === 'color' || data.attributes?.color) return false;
            return true;
        });
    }, [selectedPath, nodes]);

    const kyungdongProducts = [];

    const availableColors = useMemo(() => {
        if (displayPath.length === 0) return [];
        const currentProductNode = displayPath[displayPath.length - 1];
        const productData = nodes[currentProductNode.value];
        if (!productData || !productData.childrenIds) return [];
        return productData.childrenIds.map(id => nodes[id]).filter(n => n && (n.attributes?.nodeType === 'color' || n.attributes?.color));
    }, [displayPath, nodes]);

    const toggleColorPicker = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (availableColors.length === 0) { alert("현재 선택된 상품에 등록된 칼라가 없습니다."); return; }
        rotateToColor();
    };

    const handleColorSelect = (color: NodeData) => {
        if (!color) return;
        setSelectedColorLabel(color.label);
        rotateToHome();
    };

    const roleConfig = ROLE_CONFIGS[role];
    const isBusinessRole = role !== UserRole.GUEST && role !== UserRole.USER;

    const filteredMeasureImages = useMemo(() => {
        if (!measureSearchQuery) return MOCK_MEASURE_IMAGES;
        return MOCK_MEASURE_IMAGES.filter(img => img.tags.some(tag => tag.includes(measureSearchQuery)) || img.fileType.includes(measureSearchQuery));
    }, [measureSearchQuery]);

    // --- Dynamic Monthly Sales Data Generator ---
    const getMonthlySalesData = (year: number) => {
        if (year === 2024) return MOCK_DASHBOARD_DATA.monthlySalesHistory; // Default Data

        if (year === 2023) {
            return [
                { month: '1월', sales: 200000000 }, { month: '2월', sales: 220000000 },
                { month: '3월', sales: 280000000 }, { month: '4월', sales: 300000000 },
                { month: '5월', sales: 320000000 }, { month: '6월', sales: 350000000 },
                { month: '7월', sales: 340000000 }, { month: '8월', sales: 310000000 },
                { month: '9월', sales: 380000000 }, { month: '10월', sales: 400000000 },
                { month: '11월', sales: 420000000 }, { month: '12월', sales: 450000000 },
            ];
        }

        // Random generation for other years
        return Array.from({ length: 12 }, (_, i) => ({
            month: `${i + 1}월`,
            sales: year > 2024 ? 0 : Math.round(Math.random() * 400000000 + 100000000)
        }));
    };

    const currentChartData = useMemo(() => getMonthlySalesData(chartYear), [chartYear]);

    // --- RENDER CONTENT SWITCHER ---
    const renderContent = () => {
        // Return null when path is empty to show full background
        if (currentPath === '') return null;

        switch (currentPath) {
            case 'store':
                return (
                    <div className="relative z-10 flex flex-col items-center justify-center h-full bg-white overflow-hidden w-full">
                        {/* Full Screen Gravity (Particle) Effect */}
                        <InteractiveParticleBackground variant="dark" count={100} />

                        <div className="flex flex-col items-center gap-6 p-8 z-10">
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                            >
                                <Store size={100} className="text-blue-600 drop-shadow-xl" strokeWidth={1.2} />
                            </motion.div>

                            <div className="text-center">
                                <motion.h2
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.2, duration: 0.8 }}
                                    className="text-5xl md:text-6xl font-black mb-4 tracking-tighter text-gray-900 px-4"
                                >
                                    WinteriorFit <span className="text-blue-600">Store</span>
                                </motion.h2>
                                <motion.p
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.4, duration: 0.8 }}
                                    className="text-xl md:text-2xl text-gray-500 font-medium max-w-2xl mx-auto leading-relaxed px-6"
                                >
                                    공간의 품격을 더하는 프리미엄 인테리어 네트워크. <br />
                                    최고의 파트너들과 함께 혁신적인 경험을 제공합니다.
                                </motion.p>
                            </div>
                        </div>
                    </div>
                );
            case 'dashboard':
                // Safeguard: Guests shouldn't see business dashboard
                if (role === UserRole.GUEST) return null;

                // --- FABRIC SUPPLIER DASHBOARD ---
                if (role === UserRole.FABRIC_SUPPLIER) {
                    const now = new Date();
                    const formattedDate = `${now.getFullYear()}. ${String(now.getMonth() + 1).padStart(2, '0')}. ${String(now.getDate()).padStart(2, '0')}`;
                    const updateTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

                    const formatCurrency = (val: number) => Math.round(val / 10000).toLocaleString() + '만';

                    return (
                        <div className="flex-1 flex flex-col h-full bg-gray-50 overflow-hidden font-sans">
                            {/* 1. Header */}
                            <div className="flex-shrink-0 bg-white border-b border-gray-200 px-8 py-5 shadow-sm z-20 flex items-center justify-between h-20">
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                                        <LayoutDashboard className="text-blue-600" /> 기본현황
                                    </h1>
                                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-2">
                                        <Calendar size={12} /> {formattedDate}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-full text-xs font-bold text-gray-500">
                                    <RefreshCw size={12} className="animate-spin-slow" />
                                    마지막 업데이트: {updateTime}
                                </div>
                            </div>

                            {/* 2. Main Content */}
                            <div className="flex-1 overflow-y-auto p-8 scrollbar-hide">
                                {/* ... (Keep existing Dashboard Content for Supplier) ... */}
                                {/* KPI Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                                    {/* Card 1: Partners */}
                                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200 flex flex-col justify-between h-36">
                                        <div className="flex justify-between items-start">
                                            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><Users size={24} /></div>
                                            <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">Active</span>
                                        </div>
                                        <div>
                                            <span className="text-xs text-gray-400 font-bold uppercase">현재 거래처 수</span>
                                            <div className="text-3xl font-extrabold text-gray-800 mt-1">{MOCK_DASHBOARD_DATA.partnersCount} <span className="text-sm text-gray-500 font-normal">개사</span></div>
                                        </div>
                                    </div>
                                    {/* ... Other Cards ... */}
                                    {/* Card 2: Current Sales */}
                                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200 flex flex-col justify-between h-36">
                                        <div className="flex justify-between items-start">
                                            <div className="p-2 bg-green-50 text-green-600 rounded-xl"><TrendingUp size={24} /></div>
                                            <div className="flex flex-col items-end">
                                                <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                                    <ArrowUpRight size={10} /> 18.4%
                                                </span>
                                                <span className="text-[10px] text-gray-400 mt-1 font-medium">(전월대비)</span>
                                            </div>
                                        </div>
                                        <div>
                                            <span className="text-xs text-gray-400 font-bold uppercase">당월 매출</span>
                                            <div className="text-3xl font-extrabold text-gray-800 mt-1">{formatCurrency(MOCK_DASHBOARD_DATA.currentMonthSales)}</div>
                                        </div>
                                    </div>
                                    {/* Card 3: Previous Sales */}
                                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200 flex flex-col justify-between h-36">
                                        <div className="flex justify-between items-start">
                                            <div className="p-2 bg-gray-100 text-gray-600 rounded-xl"><Clock size={24} /></div>
                                            <div className="flex flex-col items-end">
                                                <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                                    <ArrowUpRight size={10} /> 8.5%
                                                </span>
                                                <span className="text-[10px] text-gray-400 mt-1 font-medium">(전전월대비)</span>
                                            </div>
                                        </div>
                                        <div>
                                            <span className="text-xs text-gray-400 font-bold uppercase">전월 매출</span>
                                            <div className="text-3xl font-extrabold text-gray-800 mt-1">{formatCurrency(MOCK_DASHBOARD_DATA.prevMonthSales)}</div>
                                        </div>
                                    </div>
                                    {/* Card 4: Receivables */}
                                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200 flex flex-col justify-between h-36">
                                        <div className="flex justify-between items-start">
                                            <div className="p-2 bg-red-50 text-red-600 rounded-xl"><AlertCircle size={24} /></div>
                                            <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">Alert</span>
                                        </div>
                                        <div>
                                            <span className="text-xs text-gray-400 font-bold uppercase">현재 미수 누계</span>
                                            <div className="text-3xl font-extrabold text-red-600 mt-1">{formatCurrency(MOCK_DASHBOARD_DATA.totalReceivables)}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* 3. Chart Section: Monthly Sales */}
                                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 mb-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                                                <BarChart3 size={18} />
                                            </div>
                                            <h3 className="text-base font-bold text-gray-800">월별 매출 누계</h3>
                                        </div>
                                        <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg p-0.5">
                                            <button className="p-1 hover:bg-white hover:shadow-sm rounded transition-all text-gray-400"><ChevronLeft size={14} /></button>
                                            <span className="text-xs font-bold text-gray-600 px-2 tracking-tight">2023년</span>
                                            <button className="p-1 hover:bg-white hover:shadow-sm rounded transition-all text-gray-400"><ChevronRight size={14} /></button>
                                        </div>
                                    </div>
                                    <div className="h-64 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={MOCK_DASHBOARD_DATA.monthlySalesHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                <XAxis
                                                    dataKey="month"
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }}
                                                    dy={10}
                                                />
                                                <YAxis
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }}
                                                    tickFormatter={(val) => (val / 100000000).toFixed(1) === '0.0' ? '0' : (val / 100000000).toFixed(1) + '억'}
                                                />
                                                <RechartsTooltip
                                                    cursor={{ fill: '#f8fafc' }}
                                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '12px', padding: '12px' }}
                                                    formatter={(val: number) => [val.toLocaleString() + '원', '매출액']}
                                                />
                                                <Bar dataKey="sales" radius={[6, 6, 0, 0]} barSize={28}>
                                                    {MOCK_DASHBOARD_DATA.monthlySalesHistory.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.sales > 0 ? '#7c3aed' : '#e2e8f0'} fillOpacity={entry.sales > 0 ? 0.7 : 0.4} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* 4. Rows: Product Rankings */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                                    {/* Sales Ranking */}
                                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                                        <div className="flex items-center gap-2 mb-5">
                                            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                                                <BarChart3 size={18} />
                                            </div>
                                            <h3 className="text-sm font-bold text-gray-800 tracking-tight">매출 상품 순위</h3>
                                        </div>
                                        <div className="space-y-4">
                                            {MOCK_DASHBOARD_DATA.topSalesProducts.map((item, idx) => (
                                                <div key={idx} className="flex items-center justify-between group">
                                                    <div className="flex items-center gap-4">
                                                        <span className="text-xs font-black text-gray-300 w-4">{idx + 1}</span>
                                                        <span className="text-xs font-bold text-gray-600 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{item.name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <span className="text-xs font-extrabold text-blue-700 font-mono tracking-tighter">{item.amount.toLocaleString()}만</span>
                                                        <div className={`flex items-center gap-0.5 text-[10px] font-black px-1.5 py-0.5 rounded ${item.change > 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                                            {item.change > 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                                                            {Math.abs(item.change)}%
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Inventory Ranking */}
                                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                                        <div className="flex items-center gap-2 mb-5">
                                            <div className="p-1.5 bg-purple-50 text-purple-600 rounded-lg">
                                                <Package size={18} />
                                            </div>
                                            <h3 className="text-sm font-bold text-gray-800 tracking-tight">재고 상품 순위 (많은 순)</h3>
                                        </div>
                                        <div className="space-y-4">
                                            {MOCK_DASHBOARD_DATA.topInventoryProducts.map((item, idx) => (
                                                <div key={idx} className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <span className="text-xs font-black text-gray-300 w-4">{idx + 1}</span>
                                                        <span className="text-xs font-bold text-gray-600 uppercase tracking-tight">{item.name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-xs font-extrabold text-purple-700 font-mono tracking-tighter">{item.stock.toLocaleString()} {item.unit}</span>
                                                        <div className="w-12 h-1 bg-gray-100 rounded-full overflow-hidden">
                                                            <div className="h-full bg-purple-500/60 rounded-full" style={{ width: `${100 - (idx * 15)}%` }} />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* 5. Three Columns: Partner Top 10s */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {/* Cumulative Sales Top 10 */}
                                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-orange-100/50">
                                        <div className="flex items-center gap-2 mb-5">
                                            <TrendingUp size={16} className="text-orange-500" />
                                            <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider">누적 매출 Top 10</h3>
                                        </div>
                                        <div className="space-y-4">
                                            {MOCK_DASHBOARD_DATA.topCumulativePartners.map((item, idx) => (
                                                <div key={idx} className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <span className={`w-5 h-5 flex items-center justify-center rounded text-[9px] font-black ${idx < 3 ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                                                            {idx + 1}
                                                        </span>
                                                        <span className="text-[11px] font-bold text-gray-600">{item.name}</span>
                                                    </div>
                                                    <span className="text-[11px] font-extrabold text-orange-600/80 font-mono">{(item.amount / 10000).toLocaleString()}만</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Monthly Sales Top 10 */}
                                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-green-100/50">
                                        <div className="flex items-center gap-2 mb-5">
                                            <Calendar size={16} className="text-green-500" />
                                            <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider">당월 매출 Top 10</h3>
                                        </div>
                                        <div className="space-y-4">
                                            {MOCK_DASHBOARD_DATA.topMonthlyPartners.map((item, idx) => (
                                                <div key={idx} className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <span className={`w-5 h-5 flex items-center justify-center rounded text-[9px] font-black ${idx < 3 ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                                                            {idx + 1}
                                                        </span>
                                                        <span className="text-[11px] font-bold text-gray-600">{item.name}</span>
                                                    </div>
                                                    <span className="text-[11px] font-extrabold text-green-600/80 font-mono">{(item.amount / 10000).toLocaleString()}만</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Receivables Top 10 */}
                                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-red-100/50">
                                        <div className="flex items-center gap-2 mb-5">
                                            <AlertCircle size={16} className="text-red-500" />
                                            <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider">미수 Top 10 거래처</h3>
                                        </div>
                                        <div className="space-y-4">
                                            {MOCK_DASHBOARD_DATA.topReceivablesPartners.map((item, idx) => (
                                                <div key={idx} className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <span className={`w-5 h-5 flex items-center justify-center rounded text-[9px] font-black ${idx < 3 ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                                                            {idx + 1}
                                                        </span>
                                                        <span className="text-[11px] font-bold text-gray-600">{item.name}</span>
                                                    </div>
                                                    <div className="flex items-end">
                                                        <span className="text-[11px] font-extrabold text-red-600/80 font-mono">{(item.amount / 10000).toLocaleString()}만</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                }

                // --- AGENCY DASHBOARD ---
                if (role === UserRole.AGENCY) {
                    const now = new Date();
                    const formattedDate = `${now.getFullYear()}. ${String(now.getMonth() + 1).padStart(2, '0')}. ${String(now.getDate()).padStart(2, '0')}`;

                    const prevMonth = {
                        purchase: 12500000,
                        sales: 18200000,
                        profit: 5700000,
                    };
                    const curMonth = {
                        purchase: 9800000,
                        sales: 14500000,
                        profit: 4700000,
                    };
                    const prevSchedule = { 시공: 24, 배송: 18, 실측: 31, 미팅: 12, 출장: 5, 기타: 8 };
                    const curSchedule = { 시공: 16, 배송: 11, 실측: 22, 미팅: 8, 출장: 3, 기타: 4 };

                    const popularProducts = [
                        { rank: 1, path: '블라인드 > 콤비 > 엘레강스', amount: 13450000 },
                        { rank: 2, path: '블라인드 > 우드 > 오크내추럴', amount: 9800000 },
                        { rank: 3, path: '커튼 > 쉬폰 > 아이보리', amount: 7200000 },
                        { rank: 4, path: '블라인드 > 롤 > 블랙아웃', amount: 5600000 },
                        { rank: 5, path: '쉐이드 > 허니콤 > 베이지', amount: 4300000 },
                    ];

                    const fmt = (v: number) => v.toLocaleString();

                    const scheduleCategories = ['시공', '배송', '실측', '미팅', '출장', '기타'] as const;
                    const scheduleIcons: Record<string, { icon: typeof Truck; color: string; bg: string }> = {
                        '시공': { icon: Truck, color: 'text-blue-600', bg: 'bg-blue-50' },
                        '배송': { icon: Package, color: 'text-orange-600', bg: 'bg-orange-50' },
                        '실측': { icon: Ruler, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                        '미팅': { icon: Users, color: 'text-violet-600', bg: 'bg-violet-50' },
                        '출장': { icon: MapPin, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                        '기타': { icon: MoreHorizontal, color: 'text-gray-600', bg: 'bg-gray-100' },
                    };

                    return (
                        <div className="flex-1 flex flex-col h-full bg-gray-50 overflow-hidden font-sans">
                            {/* Header */}
                            <div className="flex-shrink-0 bg-white border-b border-gray-200 px-8 py-5 shadow-sm z-20 flex items-center justify-between h-20">
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                                        <LayoutDashboard className="text-blue-600" /> 기본현황
                                    </h1>
                                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-2">
                                        <Calendar size={12} /> {formattedDate}
                                    </p>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto p-6 scrollbar-hide space-y-5">

                                {/* ROW 1: 금액 카드 (전월/당월) */}
                                <div className="grid grid-cols-2 gap-5">
                                    {/* 전월 매입/매출/수익 */}
                                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                                        <div className="px-5 py-3 bg-gradient-to-r from-gray-50 to-slate-50 border-b border-gray-100 flex items-center gap-2">
                                            <div className="p-1.5 bg-gray-200 text-gray-600 rounded-lg"><Clock size={14} /></div>
                                            <h3 className="text-sm font-bold text-gray-700">전월</h3>
                                        </div>
                                        <div className="p-5 grid grid-cols-3 gap-4">
                                            <div className="text-center">
                                                <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">매입</span>
                                                <span className="text-lg font-extrabold text-gray-800 font-mono">{fmt(prevMonth.purchase)}</span>
                                            </div>
                                            <div className="text-center border-x border-gray-100">
                                                <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">매출</span>
                                                <span className="text-lg font-extrabold text-blue-700 font-mono">{fmt(prevMonth.sales)}</span>
                                            </div>
                                            <div className="text-center">
                                                <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">수익</span>
                                                <span className="text-lg font-extrabold text-emerald-600 font-mono">{fmt(prevMonth.profit)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 당월 매입/매출/수익 */}
                                    <div className="bg-white rounded-2xl shadow-sm border border-blue-200 overflow-hidden ring-1 ring-blue-100">
                                        <div className="px-5 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 flex items-center gap-2">
                                            <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg"><Calendar size={14} /></div>
                                            <h3 className="text-sm font-bold text-blue-700">당월</h3>
                                        </div>
                                        <div className="p-5 grid grid-cols-3 gap-4">
                                            <div className="text-center">
                                                <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">매입</span>
                                                <span className="text-lg font-extrabold text-gray-800 font-mono">{fmt(curMonth.purchase)}</span>
                                            </div>
                                            <div className="text-center border-x border-gray-100">
                                                <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">매출</span>
                                                <span className="text-lg font-extrabold text-blue-700 font-mono">{fmt(curMonth.sales)}</span>
                                            </div>
                                            <div className="text-center">
                                                <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">수익</span>
                                                <span className="text-lg font-extrabold text-emerald-600 font-mono">{fmt(curMonth.profit)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* ROW 2: 일정 건수 (전월/당월) */}
                                <div className="grid grid-cols-2 gap-5">
                                    {/* 전월 건수 */}
                                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                                        <div className="px-5 py-3 bg-gradient-to-r from-gray-50 to-slate-50 border-b border-gray-100 flex items-center gap-2">
                                            <div className="p-1.5 bg-gray-200 text-gray-600 rounded-lg"><Clock size={14} /></div>
                                            <h3 className="text-sm font-bold text-gray-700">전월 일정</h3>
                                            <span className="text-xs text-gray-400 font-mono ml-auto">
                                                합계 {Object.values(prevSchedule).reduce((a, b) => a + b, 0)}건
                                            </span>
                                        </div>
                                        <div className="p-5 grid grid-cols-6 gap-3">
                                            {scheduleCategories.map(cat => {
                                                const cfg = scheduleIcons[cat];
                                                const Icon = cfg.icon;
                                                return (
                                                    <div key={cat} className={`${cfg.bg} rounded-xl p-3 flex flex-col items-center gap-1.5 border border-white/50`}>
                                                        <Icon size={16} className={cfg.color} />
                                                        <span className="text-[10px] font-bold text-gray-500">{cat}</span>
                                                        <span className={`text-lg font-extrabold ${cfg.color}`}>{prevSchedule[cat]}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* 당월 건수 */}
                                    <div className="bg-white rounded-2xl shadow-sm border border-blue-200 overflow-hidden ring-1 ring-blue-100">
                                        <div className="px-5 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 flex items-center gap-2">
                                            <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg"><Calendar size={14} /></div>
                                            <h3 className="text-sm font-bold text-blue-700">당월 일정</h3>
                                            <span className="text-xs text-blue-400 font-mono ml-auto">
                                                합계 {Object.values(curSchedule).reduce((a, b) => a + b, 0)}건
                                            </span>
                                        </div>
                                        <div className="p-5 grid grid-cols-6 gap-3">
                                            {scheduleCategories.map(cat => {
                                                const cfg = scheduleIcons[cat];
                                                const Icon = cfg.icon;
                                                return (
                                                    <div key={cat} className={`${cfg.bg} rounded-xl p-3 flex flex-col items-center gap-1.5 border border-white/50`}>
                                                        <Icon size={16} className={cfg.color} />
                                                        <span className="text-[10px] font-bold text-gray-500">{cat}</span>
                                                        <span className={`text-lg font-extrabold ${cfg.color}`}>{curSchedule[cat]}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                {/* ROW 3: 인기상품 Top 5 */}
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                                    <div className="px-5 py-3 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-gray-100 flex items-center gap-2">
                                        <div className="p-1.5 bg-amber-100 text-amber-600 rounded-lg"><TrendingUp size={14} /></div>
                                        <h3 className="text-sm font-bold text-gray-700">인기상품 TOP 5</h3>
                                    </div>
                                    <div className="divide-y divide-gray-100">
                                        {popularProducts.map(p => (
                                            <div key={p.rank} className="flex items-center px-5 py-3.5 hover:bg-gray-50 transition-colors">
                                                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold mr-4
                                                    ${p.rank === 1 ? 'bg-amber-100 text-amber-700' : p.rank === 2 ? 'bg-gray-200 text-gray-600' : p.rank === 3 ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-500'}`}>
                                                    {p.rank}
                                                </span>
                                                <span className="text-sm font-bold text-gray-800 flex-1">{p.path}</span>
                                                <span className="text-sm font-extrabold text-blue-700 font-mono">{fmt(p.amount)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                            </div>
                        </div>
                    );
                }

                // --- ADMIN DASHBOARD ---
                if (role === UserRole.ADMIN) {
                    return <AdminDashboard />;
                }

                // --- GENERIC DASHBOARD (Empty State with Solution Image) ---
                return (
                    <div className="flex-1 flex flex-col items-center justify-center relative z-10 overflow-hidden h-full">
                        {solutionMainImage ? (
                            <>
                                <div
                                    className="absolute inset-0 bg-cover bg-center"
                                    style={{ backgroundImage: `url(${solutionMainImage})` }}
                                />
                                <div className="absolute inset-0 bg-black/40" />
                                <div className="relative z-10 text-center text-white px-8">
                                    <h1 className="text-4xl font-black mb-3 drop-shadow-lg">Winterior<span className="text-blue-300">Fit</span></h1>
                                    <p className="text-lg text-white/80 drop-shadow">좌측 메뉴에서 원하는 기능을 선택하세요.</p>
                                </div>
                            </>
                        ) : (
                            <div className="relative z-10 text-center" style={{ color: 'var(--admin-text-sub)' }}>
                                <div className="text-6xl mb-4 opacity-20">W</div>
                                <p className="text-sm">좌측 메뉴에서 원하는 기능을 선택하세요.</p>
                            </div>
                        )}
                    </div>
                );
            case 'basic_config': return (
                <div className="flex-1 flex flex-col h-full overflow-hidden" style={{ background: 'var(--admin-bg)' }}>
                    {/* 기본설정 헤더 - 상품스팩 기준 통일 */}
                    <div id="basic-config-header" className="flex-shrink-0 border-b px-8 h-20 shadow-sm z-20 flex items-center justify-between gap-4"
                        style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)' }}>
                        <div className="flex items-center gap-4 min-w-fit">
                            <GitCommit style={{ color: 'var(--theme-primary)' }} className="shrink-0" size={28} />
                            <h1 className="text-2xl font-bold whitespace-nowrap" style={{ color: 'var(--admin-text)' }}>기본설정</h1>
                            <span className="text-xs font-bold px-2.5 py-1 rounded-full border shadow-sm" style={{ color: 'var(--theme-primary)', background: 'var(--theme-primary-bg)', borderColor: 'var(--theme-primary)' }}>
                                상품 트리 구조
                            </span>
                        </div>
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <MindMapSystem isInspectorActive={isInspectorActive} />
                    </div>
                </div>
            );
            case 'dist_std_product_config': return <ProductConfiguration rootId="root-partner-d1" role={role} />; // 표준설정 > 표준상품
            case 'dist_std_products': return <StandardCost rootId="root-partner-d1" role={role} />; // UPDATED: References Kyungdong Logistics Tree
            case 'dist_std_measure': return <MeasureManagement />;
            case 'product_config': return <ProductConfiguration />;
            case 'product_summary': return <ProductSummary role={role} />;
            case 'dist_purchase_products': return <ProductConfiguration rootId="root-partner-d1" role={role} />; // Mapped to Product Config
            case 'dist_purchase_measure': return <SalesPriceManagement rootId="root-partner-d1" role={role} defaultTab="MEASURE" />;
            case 'dist_purchase_settings': return <SalesPriceManagement rootId="root-partner-d1" role={role} />;
            case 'color_config': return <ColorConfiguration />;
            case 'measure_mgmt': return <MeasureManagement />;
            case 'real_images': return <MeasureManagement />;
            case 'space_images': return <SpaceImageManagement />;

            case 'sales_price': return <SalesPriceManagement rootId={[UserRole.FABRIC_SUPPLIER, UserRole.MANUFACTURER, UserRole.DISTRIBUTOR].includes(role) ? `root-partner-${targetId}` : 'root'} role={role} />;
            case 'products': return <ProductConfiguration />;
            case 'product_detail': return <ProductDetailPage role={role} />;
            case 'user_mgmt': return <UserManagement role={role} />;
            case 'partner_mgmt': return <PartnerManagement role={role} currentPartnerId={targetId} />;
            case 'partners': return <PartnerManagement role={role} currentPartnerId={targetId} />;
            case 'hq_info': return <div className="flex-1 h-full relative flex flex-col overflow-hidden" style={{ background: 'var(--admin-bg)' }}><HeadquartersInfo role={role} /></div>;

            case 'order_reception': return <OrderReception rootId={`root-partner-${targetId}`} />;
            case 'order_proc': return <OrderReception rootId={`root-partner-${targetId}`} />;
            case 'stock_in_reservation': return <StockInReservation rootId={`root-partner-${targetId}`} />;
            case 'stock_in_confirmation': return <StockInConfirmation rootId={`root-partner-${targetId}`} />;
            case 'stock_adjust': return <StockAdjustment rootId={`root-partner-${targetId}`} />;
            case 'shipping': return <StockOutManagement />;
            case 'ledger': return <TransactionLedger />;
            case 'deposit': return <DepositManagement />;
            case 'pricing': return <SalesPriceManagement rootId="root-partner-d1" role={role} hidePartnerSelector agencyPartnerId="ag1" />;
            case 'estimate': return <EstimateManagement />;
            case 'schedule': return <ScheduleManagement />;
            case 'search': return <SearchInquiry />;
            case 'customer': return <CustomerManagement />;
            case 'mfg_order': return <ManufacturingOrder />;
            case 'work_mgmt': return <ProductionManagement />;
            case 'kiosk': return role === UserRole.ADMIN ? <AdminDeviceManagement /> : <KioskManagement />;
            case 'sales_settings': return <SalesPriceManagement rootId={[UserRole.FABRIC_SUPPLIER, UserRole.MANUFACTURER, UserRole.DISTRIBUTOR].includes(role) ? `root-partner-${targetId}` : 'root'} role={role} />;
            case 'admin_settings': return <AdminThemeSettings />;
            case 'margin': return <SalesPriceManagement rootId={[UserRole.FABRIC_SUPPLIER, UserRole.MANUFACTURER, UserRole.DISTRIBUTOR].includes(role) ? `root-partner-${targetId}` : 'root'} role={role} />;
            case 'ai_contents': return <AiContentsManagement />;
            case 'tree_linker': return <TreeNodeLinker />;
            case 'standard_product': return <ProductConfiguration rootId={`root-partner-${targetId}`} role={role} hidePartnerSelector />;
            case 'product_price': return <StandardCost
                rootId={`root-partner-${targetId}`}
                systemRootId={[UserRole.FABRIC_SUPPLIER, UserRole.MANUFACTURER, UserRole.DISTRIBUTOR].includes(role) ? `root-1770804399939-partner-${targetId}` : 'root-1770804399939'}
                role={role}
                customTitle="상품원가"
            />;
            case 'measure_registration': return <MeasureManagement />;
            case 'purchase_settings': return <ProductConfiguration rootId={`root-partner-${targetId}`} role={role} />;
            default:
                return (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-300 font-light text-2xl relative z-10">
                        {!shouldShowDock() && !isSearchMode && (
                            <div className="text-center opacity-50 flex flex-col items-center gap-4 bg-white/50 p-8 rounded-3xl backdrop-blur-sm">
                                <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
                                    <Box size={32} className="text-gray-400" />
                                </div>
                                <p>업무용 대시보드 화면입니다.</p>
                            </div>
                        )}
                    </div>
                );
        }
    };

    const BAR_HEIGHT = 64;
    // 4 Sides -> 90 degrees each
    // Apothem (radius to face) = side / 2 = 64 / 2 = 32
    const BAR_DEPTH = 64;

    // --- GLASSMORPHISM & PARTICLE SYSTEM ---
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePos({ x: e.clientX, y: e.clientY });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    const crystalFaceStyle = "absolute inset-0 flex items-center justify-between px-6 bg-white/10 backdrop-blur-[20px] border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.1)] text-white overflow-hidden transition-all duration-300";
    const crystalEdgeStyle = "absolute inset-0 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.3),inset_0_-1px_0_0_rgba(255,255,255,0.1)] pointer-events-none z-20";
    const capStyle = "absolute top-0 bg-white/20 backdrop-blur-xl border border-white/30 overflow-hidden shadow-[inset_0_0_10px_rgba(255,255,255,0.2)]";
    const innerCoreStyle = "absolute bg-gradient-to-b from-white/5 to-white/10 w-[62px] h-[62px] top-[1px] left-[1px] pointer-events-none";

    // Common Home Button Component for Consistency
    const HomeButton = () => (
        <button onClick={rotateToHome} className="flex flex-col items-center justify-center gap-1 group relative h-full w-14 cursor-pointer pointer-events-auto z-30">
            <div className="w-10 h-10 flex items-center justify-center -translate-y-[2px] transition-transform group-hover:scale-110">
                <Home size={24} strokeWidth={2} className="text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]" />
            </div>
            <span className="text-[10px] font-bold text-white/90 absolute bottom-1.5 pointer-events-none drop-shadow-md">홈</span>
        </button>
    );

    const SubMenuReturnButton = ({ icon: Icon, label }: { icon: any, label: string }) => (
        <button onClick={rotateToHome} className="flex flex-col items-center justify-center gap-1 group relative h-full w-14 cursor-pointer pointer-events-auto z-30">
            <div className="w-10 h-10 flex items-center justify-center -translate-y-[2px] transition-transform group-hover:scale-110">
                <Icon size={24} strokeWidth={2} className="text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]" />
            </div>
            <span className="text-[10px] font-bold text-white/90 absolute bottom-1.5 pointer-events-none drop-shadow-md">{label}</span>
        </button>
    );

    const InteractiveParticleBackground = ({ variant = 'light', count = 15, connectionDistance = 80 }: { variant?: 'light' | 'dark', count?: number, connectionDistance?: number }) => {
        const canvasRef = useRef<HTMLCanvasElement>(null);
        const particlesRef = useRef<any[]>([]);
        const mouseState = useRef({ x: -1000, y: -1000, isClicking: false });

        useEffect(() => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            let animationFrameId: number;

            const initParticles = () => {
                const { width, height } = canvas.getBoundingClientRect();
                canvas.width = width;
                canvas.height = height;

                particlesRef.current = Array.from({ length: count }, () => {
                    const speedScale = Math.random() * 0.5 + 0.5;
                    return {
                        x: Math.random() * width,
                        y: Math.random() * height,
                        vx: (Math.random() - 0.5) * 1.5 * speedScale,
                        vy: (Math.random() - 0.5) * 1.5 * speedScale,
                        size: Math.random() * (variant === 'light' ? 1.5 : 2.5) + 0.5,
                        baseSpeed: speedScale,
                        alpha: Math.random() * 0.3 + 0.1,
                        mass: Math.random() * 0.5 + 0.5
                    };
                });
            };

            const animate = () => {
                if (!ctx || !canvas) return;
                ctx.clearRect(0, 0, canvas.width, canvas.height);

                const { width, height } = canvas;
                const pColor = variant === 'light' ? '255, 255, 255' : '37, 99, 235';

                // Subtle "Wind" effect that shifts over time
                const time = Date.now() * 0.001;
                const windX = Math.sin(time * 0.5) * 0.08;
                const windY = Math.cos(time * 0.3) * 0.08;

                particlesRef.current.forEach((p, i) => {
                    // Apply Wind & Friction
                    p.vx += windX;
                    p.vy += windY;

                    p.x += p.vx;
                    p.y += p.vy;

                    // Mouse Interaction (Attraction + Dispersion Clique)
                    const dx = mouseState.current.x - p.x;
                    const dy = mouseState.current.y - p.y;
                    const d = Math.sqrt(dx * dx + dy * dy);
                    const interactionRadius = 600;

                    if (d < interactionRadius && d > 10) {
                        if (mouseState.current.isClicking) {
                            // DISPERSION (Burst)
                            const force = Math.pow((interactionRadius - d) / interactionRadius, 3);
                            const push = (20 / p.mass) * force;
                            p.vx -= (dx / d) * push;
                            p.vy -= (dy / d) * push;
                        } else {
                            // ATTRACTION (Swarm)
                            const force = Math.pow((interactionRadius - d) / interactionRadius, 2);
                            const pull = (0.5 / p.mass) * force;
                            p.vx += (dx / d) * pull;
                            p.vy += (dy / d) * pull;
                        }
                    }

                    // Lower friction for "gliding" feel
                    p.vx *= 0.98;
                    p.vy *= 0.98;

                    // Maintain minimum "life" in movement
                    const minSpeed = 0.3 * p.baseSpeed;
                    const currSpeed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
                    if (currSpeed < minSpeed) {
                        p.vx += (Math.random() - 0.5) * 0.15;
                        p.vy += (Math.random() - 0.5) * 0.15;
                    }

                    // Wrap around edges
                    if (p.x < -20) p.x = width + 20;
                    if (p.x > width + 20) p.x = -20;
                    if (p.y < -20) p.y = height + 20;
                    if (p.y > height + 20) p.y = -20;

                    // Draw connections
                    if (connectionDistance > 0) {
                        for (let j = i + 1; j < particlesRef.current.length; j++) {
                            const p2 = particlesRef.current[j];
                            const dist = Math.sqrt((p.x - p2.x) ** 2 + (p.y - p2.y) ** 2);
                            if (dist < connectionDistance) {
                                ctx.beginPath();
                                ctx.strokeStyle = `rgba(${pColor}, ${(1 - dist / connectionDistance) * 0.12})`;
                                ctx.lineWidth = 0.4;
                                ctx.moveTo(p.x, p.y);
                                ctx.lineTo(p2.x, p2.y);
                                ctx.stroke();
                            }
                        }
                    }

                    // Draw particle
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(${pColor}, ${p.alpha})`;
                    ctx.fill();
                });

                animationFrameId = requestAnimationFrame(animate);
            };

            const handleResize = () => {
                initParticles();
            };

            const handleMouseMove = (e: MouseEvent) => {
                const rect = canvas.getBoundingClientRect();
                mouseState.current = {
                    ...mouseState.current,
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top
                };
            };

            const handleMouseDown = () => {
                mouseState.current.isClicking = true;
                // Auto reset after a short burst duration
                setTimeout(() => {
                    mouseState.current.isClicking = false;
                }, 150);
            };

            const handleMouseUp = () => {
                mouseState.current.isClicking = false;
            };

            initParticles();
            animate();
            window.addEventListener('resize', handleResize);
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mousedown', handleMouseDown);
            window.addEventListener('mouseup', handleMouseUp);

            return () => {
                cancelAnimationFrame(animationFrameId);
                window.removeEventListener('resize', handleResize);
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('mousedown', handleMouseDown);
                window.removeEventListener('mouseup', handleMouseUp);
            };
        }, [variant, count, connectionDistance]);

        return (
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <canvas ref={canvasRef} className="w-full h-full" />
                {variant === 'light' ? (
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/5 via-transparent to-white/10" />
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-tr from-blue-50/30 via-transparent to-white/30" />
                )}
            </div>
        );
    };

    return (
        <div className="flex-1 h-screen relative flex flex-col overflow-hidden bg-white">

            {/* GLOBAL BACKGROUND LAYER */}
            {solutionMainImage && (
                <div
                    className="fixed inset-0 z-0"
                    style={{
                        backgroundImage: `url(${solutionMainImage})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                    }}
                >
                    <div className="absolute inset-0 bg-black/20" />
                </div>
            )}

            {/* DASHBOARD LOCAL BG OVERLAY (If specific measure image is selected) */}
            {dashboardBg && <div className="absolute inset-0 z-0 bg-cover bg-center transition-all duration-500" style={{ backgroundImage: `url(${dashboardBg})` }}><div className="absolute inset-0 bg-black/20" /></div>}

            {/* HEADER: Hidden globally now, individual pages manage their headers */}
            <AnimatePresence mode="wait">
                {isSearchMode && (
                    <motion.div
                        key="search-header"
                        initial={{ y: -100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -100, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="absolute top-0 left-0 w-full z-50 bg-white px-4 py-3 shadow-sm flex items-center gap-3"
                    >
                        <button onClick={handleCloseSearchMode} className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"><ArrowLeft size={24} /></button>
                        <div className="flex-1 relative">
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                placeholder="상품명, 원단, 컬러를 검색하세요"
                                className="w-full bg-gray-100 text-gray-800 text-base py-2.5 pl-4 pr-10 rounded-2xl outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-blue-100 transition-all"
                            />
                            {searchText && (
                                <button onClick={() => setSearchText('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 bg-gray-300 rounded-full text-white hover:bg-gray-400 transition-colors"><X size={12} strokeWidth={3} /></button>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* CONTENT AREA */}
            <div className="flex-1 relative overflow-hidden flex flex-col"
                onClick={() => {
                    if (!isKeypadOpen) setIsKeypadOpen(false);
                    // Reset to Home (0) if clicking outside while in a sub-mode
                    if (menuRotation !== 0) setMenuRotation(0);
                    if (showMeasurePanel) setShowMeasurePanel(false);
                    if (showPathPanel) setShowPathPanel(false);
                }}
            >
                {renderContent()}
            </div>

            {/* 3D Menu Implementation (Square Prism - 4 Faces with End Caps and Inner Core) */}
            {shouldShowDock() && (
                <div className="fixed bottom-8 left-0 w-full z-[100] flex justify-center perspective-[1000px] px-4 pointer-events-none">
                    {/* 3D Container - Now interactive by default */}
                    <motion.div
                        className="relative pointer-events-auto"
                        style={{ width: '100%', maxWidth: '600px', height: `${BAR_HEIGHT}px`, transformStyle: 'preserve-3d' }}
                        animate={{ rotateX: menuRotation }}
                        transition={{ type: "spring", stiffness: 40, damping: 15, mass: 1 }}
                    >
                        {/* INNER CORE to fill the hollow center */}
                        <div className="absolute inset-0 pointer-events-none" style={{ transformStyle: 'preserve-3d' }}>
                            {/* Core Front */}
                            <div className={innerCoreStyle} style={{ width: '100%', height: '62px', transform: 'translateZ(30px)' }} />
                            {/* Core Back */}
                            <div className={innerCoreStyle} style={{ width: '100%', height: '62px', transform: 'rotateY(180deg) translateZ(30px)' }} />
                            {/* Core Top */}
                            <div className={innerCoreStyle} style={{ width: '100%', height: '62px', transform: 'rotateX(90deg) translateZ(30px)' }} />
                            {/* Core Bottom */}
                            <div className={innerCoreStyle} style={{ width: '100%', height: '62px', transform: 'rotateX(-90deg) translateZ(30px)' }} />
                        </div>

                        {/* FACE 1: Home (0deg) */}
                        <div
                            className={crystalFaceStyle}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                transform: `rotateX(0deg) translateZ(${menuRotation === 0 ? 32.5 : 32}px)`,
                                backfaceVisibility: 'hidden',
                                pointerEvents: menuRotation === 0 ? 'auto' : 'none',
                                opacity: 1, // Stay visible during transition
                                zIndex: menuRotation === 0 ? 20 : 1,
                                display: 'flex'
                            }}
                        >
                            <InteractiveParticleBackground />
                            <div className={crystalEdgeStyle} />

                            {/* Home Button */}
                            <HomeButton />

                            <button onClick={rotateToProduct} className="flex flex-col items-center justify-center gap-1 group relative h-full w-14 cursor-pointer pointer-events-auto z-30">
                                <div className="w-10 h-10 flex items-center justify-center -translate-y-[2px] transition-transform group-hover:scale-110">
                                    <Box size={24} strokeWidth={1.5} className="text-white/80 group-hover:text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]" />
                                </div>
                                <span className="text-[10px] font-medium text-white/80 group-hover:text-white transition-colors absolute bottom-1.5 truncate max-w-full px-1 pointer-events-none drop-shadow-md">{activeProductLabel || "상품선택"}</span>
                            </button>

                            <button onClick={toggleColorPicker} className="flex flex-col items-center justify-center gap-1 group relative h-full w-14 cursor-pointer pointer-events-auto z-30">
                                <div className="w-10 h-10 flex items-center justify-center -translate-y-[2px] transition-transform group-hover:scale-110">
                                    <Palette size={24} strokeWidth={1.5} className="text-white/80 group-hover:text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]" />
                                </div>
                                <span className="text-[10px] font-medium text-white/80 group-hover:text-white transition-colors absolute bottom-1.5 truncate max-w-full px-1 pointer-events-none drop-shadow-md">{(activeProductLabel && selectedColorLabel) ? selectedColorLabel : "칼라선택"}</span>
                            </button>

                            {/* Swapped Measure Button here */}
                            <button onClick={toggleMeasurePanel} className="flex flex-col items-center justify-center gap-1 group relative h-full w-14 cursor-pointer pointer-events-auto z-30">
                                <div className="w-10 h-10 flex items-center justify-center -translate-y-[2px] transition-transform group-hover:scale-110">
                                    <ImageIcon size={24} strokeWidth={1.5} className={`transition-all duration-300 ${selectedMeasureName ? 'text-blue-400' : 'text-white/80 group-hover:text-white'} drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]`} />
                                </div>
                                <span className="text-[10px] font-bold text-white/90 group-hover:text-white transition-colors absolute bottom-1.5 pointer-events-none drop-shadow-md truncate max-w-full px-1">
                                    {selectedMeasureName || "실사선택"}
                                </span>
                            </button>

                            {/* Swapped Search Button here */}
                            <button onClick={handleOpenSearchMode} className="flex flex-col items-center justify-center gap-1 group relative h-full w-14 cursor-pointer pointer-events-auto z-30">
                                <div className="w-10 h-10 flex items-center justify-center -translate-y-[2px] transition-transform group-hover:scale-110">
                                    <Search size={24} strokeWidth={1.5} className="text-white/80 group-hover:text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]" />
                                </div>
                                <span className="text-[10px] font-medium text-white/80 group-hover:text-white transition-colors absolute bottom-1.5 pointer-events-none drop-shadow-md">검색</span>
                            </button>
                        </div>

                        <div
                            className={crystalFaceStyle.replace('overflow-hidden', 'overflow-visible')}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                transform: `rotateX(-90deg) translateZ(${menuMode === 'product' ? 32.5 : 32}px)`,
                                backfaceVisibility: 'hidden',
                                pointerEvents: menuMode === 'product' ? 'auto' : 'none',
                                opacity: menuMode === 'product' ? 1 : 0,
                                zIndex: menuMode === 'product' ? 20 : 1,
                                display: menuMode === 'product' ? 'flex' : 'none'
                            }}
                        >
                            <InteractiveParticleBackground />
                            <div className={crystalEdgeStyle} />
                            <SubMenuReturnButton icon={Box} label="상품" />

                            <AnimatePresence>
                                {kyungdongActiveLevel !== null && (
                                    <motion.div
                                        initial={{ rotateX: -180, opacity: 0 }}
                                        animate={{ rotateX: 0, opacity: 1 }}
                                        exit={{ rotateX: -180, opacity: 0 }}
                                        transition={{ type: "spring", stiffness: 50, damping: 15 }}
                                        style={{
                                            transformOrigin: 'bottom',
                                            perspective: '1000px'
                                        }}
                                        className="absolute bottom-[100%] left-0 right-0 h-[44px] bg-white/10 backdrop-blur-[30px] border-t border-x border-white/20 shadow-[0_-10px_30px_rgba(0,0,0,0.1)] flex items-center gap-2 px-6 z-50 overflow-hidden"
                                    >
                                        <div className="absolute inset-0 pointer-events-none overflow-hidden">
                                            <InteractiveParticleBackground />
                                        </div>

                                        <div className="flex-1 h-full overflow-hidden relative" ref={siblingBarRef}>
                                            <motion.div
                                                drag="x"
                                                dragConstraints={siblingBarRef}
                                                className="flex items-center gap-2 h-full cursor-grab active:cursor-grabbing px-2"
                                                style={{ width: 'max-content' }}
                                            >
                                                {(() => {
                                                    const parent = kyungdongActiveLevel === 0 ? null : kyungdongPath[kyungdongActiveLevel - 1];
                                                    const siblings = parent ? (parent.children || []) : [kyungdongPath[0]];

                                                    return siblings.map((sibling) => (
                                                        <button
                                                            key={sibling.value}
                                                            onClick={() => handleKyungdongSiblingSelect(sibling, kyungdongActiveLevel)}
                                                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap border
                                                                    ${sibling.value === kyungdongPath[kyungdongActiveLevel].value
                                                                    ? 'bg-white text-blue-600 border-white shadow-lg scale-105'
                                                                    : 'bg-white/10 text-white/80 border-white/10 hover:bg-white/20 hover:text-white'}
                                                                `}
                                                        >
                                                            {sibling.label}
                                                        </button>
                                                    ));
                                                })()}
                                            </motion.div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="flex-1 flex items-center min-w-0 z-30">
                                <div className="flex-1 flex flex-col justify-center px-4 outline-none cursor-grab active:cursor-grabbing relative">

                                    {/* Hierarchy Breadcrumbs - Skipping Root (idx 0) */}
                                    <div className="flex-1 overflow-hidden relative" ref={breadcrumbBarRef}>
                                        <motion.div
                                            drag="x"
                                            dragConstraints={breadcrumbBarRef}
                                            className="flex items-center gap-1.5 h-full cursor-grab active:cursor-grabbing"
                                            style={{ width: 'max-content' }}
                                        >
                                            {kyungdongPath.slice(1).map((node, idx) => {
                                                const realIdx = idx + 1; // offset for slice(1)
                                                return (
                                                    <React.Fragment key={node.value}>
                                                        <button
                                                            onClick={(e) => handleKyungdongLevelClick(e, realIdx)}
                                                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap border
                                                                ${kyungdongActiveLevel === realIdx
                                                                    ? 'bg-white text-blue-600 border-white shadow-lg scale-105'
                                                                    : 'bg-white/10 text-white/80 border-white/10 hover:bg-white/20 hover:text-white'}
                                                            `}
                                                        >
                                                            {node.label}
                                                        </button>
                                                        {realIdx < kyungdongPath.length - 1 && <ChevronRight size={10} className="text-white/40 shrink-0" />}
                                                    </React.Fragment>
                                                );
                                            })}
                                        </motion.div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* FACE 3: Color -> Now at 90deg Face, only shown when menuMode is 'color' */}
                        <div
                            className={crystalFaceStyle.replace('overflow-hidden', 'overflow-visible')}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                transform: `rotateX(-90deg) translateZ(${menuMode === 'color' ? 32.5 : 32}px)`,
                                backfaceVisibility: 'hidden',
                                pointerEvents: menuMode === 'color' ? 'auto' : 'none',
                                opacity: menuMode === 'color' ? 1 : 0,
                                zIndex: menuMode === 'color' ? 20 : 1,
                                display: menuMode === 'color' ? 'flex' : 'none'
                            }}
                        >
                            <InteractiveParticleBackground />
                            <div className={crystalEdgeStyle} />
                            <SubMenuReturnButton icon={Palette} label="칼라" />
                            <div className="flex-1 flex items-center min-w-0 z-30 overflow-hidden ml-4">
                                <div className="flex-1 h-full overflow-hidden relative" ref={colorBarRef}>
                                    <motion.div
                                        drag="x"
                                        dragConstraints={colorBarRef}
                                        className="flex items-center gap-2 h-full cursor-grab active:cursor-grabbing"
                                        style={{ width: 'max-content' }}
                                    >
                                        {availableColors.length > 0 ? (
                                            availableColors.map((color) => (
                                                <button
                                                    key={color.id}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleColorSelect(color);
                                                    }}
                                                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap border flex items-center gap-2
                                                        ${selectedColorLabel === color.label
                                                            ? 'bg-white text-blue-600 border-white shadow-lg scale-105'
                                                            : 'bg-white/10 text-white/80 border-white/10 hover:bg-white/20 hover:text-white'}
                                                    `}
                                                >
                                                    {color.attributes?.color && (
                                                        <div
                                                            className="w-3 h-3 rounded-full border border-white/20"
                                                            style={{ backgroundColor: color.attributes.color }}
                                                        />
                                                    )}
                                                    {color.label}
                                                </button>
                                            ))
                                        ) : (
                                            <span className="text-white/40 text-[11px] font-bold">선택 가능한 컬러가 없습니다</span>
                                        )}
                                    </motion.div>
                                </div>
                            </div>
                            <div className="w-6" />
                        </div>

                        {/* FACE 4: Search -> Now at 90deg Face, only shown when menuMode is 'search' */}
                        <div
                            className={crystalFaceStyle}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                transform: `rotateX(-90deg) translateZ(${menuMode === 'search' ? 32.5 : 32}px)`,
                                backfaceVisibility: 'hidden',
                                pointerEvents: menuMode === 'search' ? 'auto' : 'none',
                                opacity: menuMode === 'search' ? 1 : 0,
                                zIndex: menuMode === 'search' ? 20 : 1,
                                display: menuMode === 'search' ? 'flex' : 'none'
                            }}
                        >
                            <InteractiveParticleBackground />
                            <div className={crystalEdgeStyle} />
                            <SubMenuReturnButton icon={Search} label="검색" />
                            <div className="flex-1 flex items-center justify-center gap-3 font-bold text-white drop-shadow-md text-lg tracking-wider z-30">
                                <Search size={20} strokeWidth={2.5} className="text-white" /> 검색 모드 활성화됨
                            </div>
                            <div className="w-14" />
                        </div>

                        {/* FACE 5: Measure (Real Image) Selection -> Now at 90deg Face, only shown when menuMode is 'measure' */}
                        <div
                            className={crystalFaceStyle.replace('overflow-hidden', 'overflow-visible')}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                transform: `rotateX(-90deg) translateZ(${menuMode === 'measure' ? 32.5 : 32}px)`,
                                backfaceVisibility: 'hidden',
                                pointerEvents: menuMode === 'measure' ? 'auto' : 'none',
                                opacity: menuMode === 'measure' ? 1 : 0,
                                zIndex: menuMode === 'measure' ? 20 : 1,
                                display: menuMode === 'measure' ? 'flex' : 'none'
                            }}
                        >
                            <InteractiveParticleBackground />
                            <div className={crystalEdgeStyle} />

                            {/* Left Side: Icon and Name */}
                            <div className="flex items-center h-full shrink-0">
                                <SubMenuReturnButton icon={ImageIcon} label={selectedMeasureName || "실사선택"} />
                            </div>

                            {/* Center/Right: Search Bar */}
                            <div className="flex-1 flex items-center px-4 z-30 ml-2">
                                <div className="relative w-full max-w-sm">
                                    <input
                                        type="text"
                                        value={measureSearchQuery}
                                        onChange={(e) => setMeasureSearchQuery(e.target.value)}
                                        placeholder="실사 이미지를 검색하세요"
                                        className="w-full bg-white/10 text-white text-xs py-1.5 pl-8 pr-3 rounded-full outline-none border border-white/20 placeholder:text-white/40 focus:bg-white/20 transition-all"
                                    />
                                    <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/60" />
                                </div>
                            </div>

                            {/* Floating Thumbnail Grid Above the Bar */}
                            <AnimatePresence>
                                {menuMode === 'measure' && (
                                    <motion.div
                                        initial={{ rotateX: -180, opacity: 0 }}
                                        animate={{ rotateX: 0, opacity: 1 }}
                                        exit={{ rotateX: -180, opacity: 0 }}
                                        transition={{ type: "spring", stiffness: 50, damping: 15 }}
                                        style={{
                                            transformOrigin: 'bottom',
                                            perspective: '1000px'
                                        }}
                                        className="absolute bottom-[100%] left-0 right-0 max-h-[400px] overflow-hidden bg-white/10 backdrop-blur-[30px] border-t border-x border-white/20 shadow-[0_-10px_30px_rgba(0,0,0,0.2)] rounded-t-3xl p-4 z-50 flex flex-col gap-4"
                                    >
                                        <div className="absolute inset-0 pointer-events-none overflow-hidden">
                                            <InteractiveParticleBackground />
                                        </div>

                                        <div className="bg-white/10 px-4 py-1.5 rounded-full self-start flex items-center gap-2 border border-white/20 z-10">
                                            <Sparkles size={14} className="text-blue-300" />
                                            <span className="text-[11px] font-bold text-white uppercase tracking-wider">실사 선택</span>
                                            <span className="text-[10px] text-white/50 ml-1">총 {filteredMeasureImages.length}개</span>
                                        </div>

                                        <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide z-10">
                                            <div className="grid grid-cols-5 gap-3 pb-4">
                                                {filteredMeasureImages.slice(0, 20).map((img) => (
                                                    <motion.div
                                                        key={img.id}
                                                        whileHover={{ scale: 1.05, y: -2 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={() => {
                                                            selectMeasureImage(img);
                                                            rotateToHome();
                                                        }}
                                                        className="aspect-square relative rounded-xl overflow-hidden cursor-pointer group shadow-lg border border-white/10"
                                                    >
                                                        <img
                                                            src={img.imageUrl}
                                                            alt={img.tags[0]}
                                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                        />
                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                                                            <span className="text-[10px] text-white font-medium truncate w-full">{img.tags[0]}</span>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* LEFT SIDE CAP - Precision Positioned */}
                        <div
                            className={capStyle}
                            style={{
                                left: 0,
                                width: '64px',
                                height: '64px',
                                transformOrigin: 'center center',
                                transform: 'translateX(0px) rotateY(-90deg) translateZ(32px)',
                                backfaceVisibility: 'visible'
                            }}
                        >
                            {/* Inner color layer to block light */}
                            <div className="absolute inset-0 bg-blue-500/80" />
                            <InteractiveParticleBackground />
                        </div>

                        {/* RIGHT SIDE CAP - Precision Positioned */}
                        <div
                            className={capStyle}
                            style={{
                                right: 0,
                                width: '64px',
                                height: '64px',
                                transformOrigin: 'center center',
                                transform: 'translateX(0px) rotateY(90deg) translateZ(32px)',
                                backfaceVisibility: 'visible'
                            }}
                        >
                            {/* Inner color layer to block light */}
                            <div className="absolute inset-0 bg-blue-500/80" />
                            <InteractiveParticleBackground />
                        </div>

                    </motion.div>
                </div>
            )}

            {/* Hidden MindMapSystem for Partner Root Auto-creation */}
            {[UserRole.FABRIC_SUPPLIER, UserRole.MANUFACTURER, UserRole.DISTRIBUTOR].includes(role) && (
                <div style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', overflow: 'hidden' }}>
                    <MindMapSystem selectedPartnerId={targetId} isInspectorActive={false} />
                </div>
            )}

            {/* ... (Keypad & Chat) ... */}
        </div>
    );
};

export default Dashboard;
