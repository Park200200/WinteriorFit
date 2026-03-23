
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useProductContext } from './ProductContext';
import { usePartnerContext } from '../PartnerContext';
import { NodeData, UserRole } from '../types';
import {
    DollarSign, Search, ChevronRight, ChevronDown, Save, RotateCcw,
    Calculator, Box, Scroll, Scissors, Ruler, Users, BarChart3, AlertCircle, Link2,
    List, CheckCircle2, Check, Hammer
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdminTheme } from './theme/AdminThemeContext';

type CostTab = 'FABRIC' | 'CUTTING' | 'MEASURE';

interface SalesPriceManagementProps {
    rootId?: string;
    role?: UserRole;
    defaultTab?: CostTab;
    hidePartnerSelector?: boolean;
    agencyPartnerId?: string;
}

// Data structure for saving sales prices
// Key: itemId -> Grade -> { margin, price, updatedAt }
type SalesPriceData = Record<string, Record<string, { margin: string; price: string; updatedAt: string }>>;

const TABS: { id: CostTab; label: string; icon: React.ElementType }[] = [
    { id: 'FABRIC', label: '원단', icon: Scroll },
    { id: 'CUTTING', label: '제단', icon: Scissors },
    { id: 'MEASURE', label: '실사', icon: Ruler },
];

const SalesPriceManagement: React.FC<SalesPriceManagementProps> = ({ rootId = 'root', role, defaultTab, hidePartnerSelector, agencyPartnerId }) => {
    const { nodes, setNodes } = useProductContext();
    const { partners } = usePartnerContext();
    const { theme } = useAdminTheme();

    const isSupplier = role === UserRole.FABRIC_SUPPLIER;
    const isManufacturer = role === UserRole.MANUFACTURER;
    const isDistributor = role === UserRole.DISTRIBUTOR;
    const isAgency = role === UserRole.AGENCY;
    const hasAssemblySupport = isManufacturer || isDistributor || isAgency;

    // --- Sidebar Mode State (for MANUFACTURER) ---
    const [sidebarMode, setSidebarMode] = useState<'PRODUCT' | 'ASSEMBLY'>('PRODUCT');

    console.log('SalesPriceManagement rendered:', { rootId, role, isSupplier, nodesCount: Object.keys(nodes).length, partnersCount: partners.length });

    // 1. Identify Supplier & Grade Settings (Mock 'f1' for Fabric Supplier context)
    const supplierId = 'f1';
    const supplierData = useMemo(() => partners.find(p => p.id === supplierId), [partners]);

    // Grade Settings from Headquarters Info
    const gradeMargins = useMemo(() => {
        return supplierData?.gradeMargins || [
            { id: 'def-a', grade: 'A', margin: '15' },
            { id: 'def-b', grade: 'B', margin: '20' },
            { id: 'def-c', grade: 'C', margin: '25' },
            { id: 'def-d', grade: 'D', margin: '30' },
        ];
    }, [supplierData]);

    // Count partners per grade
    const partnerCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        partners.forEach(p => {
            if (p.grade) {
                counts[p.grade] = (counts[p.grade] || 0) + 1;
            }
        });
        return counts;
    }, [partners]);

    // --- State ---
    const [activeTab, setActiveTab] = useState<CostTab>(defaultTab || 'FABRIC');
    const [selectedGrade, setSelectedGrade] = useState<string>('A');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

    // -- Supplier Mode State (Categories) --
    const [activeCategoryId, setActiveCategoryId] = useState<string>('');
    const [selectedSubIds, setSelectedSubIds] = useState<string[]>([]);

    // Editing State: Map of ItemID -> Margin String
    const [editingMargins, setEditingMargins] = useState<Record<string, string>>({});

    // Partner search and grade expansion state
    const [partnerSearchQuery, setPartnerSearchQuery] = useState('');
    const [expandedGrades, setExpandedGrades] = useState<Set<string>>(new Set());
    const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
    const [activeCostType, setActiveCostType] = useState<'FABRIC' | 'CUTTING' | 'ASSEMBLY' | 'MEASURE'>('FABRIC');

    // --- Bulk Selection State ---
    const [checkedTargets, setCheckedTargets] = useState<Set<string>>(new Set());
    const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
    const [bulkMargin, setBulkMargin] = useState('');

    // Group partners by grade and filter by search
    const partnersByGrade = useMemo(() => {
        const grouped: Record<string, typeof partners> = {};
        const searchLower = partnerSearchQuery.toLowerCase();

        partners.forEach(p => {
            // 거래처관리에 등록된 거래처만 표시 (PartnerManagement와 동일 로직)
            if (p.creatorId !== supplierId && p.id !== supplierId && p.id !== `partner-${supplierId}`) return;

            if (searchLower && !p.partnerName.toLowerCase().includes(searchLower) && !p.partnerCode.toLowerCase().includes(searchLower)) {
                return; // Skip if doesn't match search
            }

            const grade = p.grade || 'NONE';
            if (!grouped[grade]) {
                grouped[grade] = [];
            }
            grouped[grade].push(p);
        });

        return grouped;
    }, [partners, partnerSearchQuery, supplierId]);

    // --- Helper: Price Calculation (Round at 10s place -> nearest 100) ---
    // Formula: Sales Price = Cost / (1 - Margin%)
    const calculatePrice = useCallback((standardCost: number, marginStr: string) => {
        const margin = parseFloat(marginStr) || 0;
        if (standardCost <= 0) return 0;

        // Avoid division by zero or negative prices if margin is >= 100
        if (margin >= 100) return 0;

        // Gross Margin Formula
        const rawPrice = standardCost / (1 - (margin / 100));

        // 10의 자리에서 반올림 => 100원 단위 (e.g. 1250 -> 1300, 1240 -> 1200)
        return Math.round(rawPrice / 100) * 100;
    }, []);

    // --- Helper: Identify category-like nodes ---
    const isCategoryLike = useCallback((n: NodeData | undefined) => {
        if (!n) return false;
        return n.type === 'CATEGORY' || n.type === 'REFERENCE' || n.attributes?.nodeType === 'category';
    }, []);

    // --- Supplier Mode Categories Logic ---
    const categories = useMemo(() => {
        if (!isSupplier) return [];
        const rootNode = nodes[rootId];
        if (!rootNode) return [];

        // Real Children
        const realChildren = rootNode.childrenIds.map(id => nodes[id]).filter(Boolean);

        // Virtual Children
        const virtualChildren = (rootNode.sourceIds || []).flatMap(srcId => {
            const src = nodes[srcId];
            return src ? src.childrenIds.map(id => nodes[id]).filter(Boolean) : [];
        });

        return [...realChildren, ...virtualChildren];
    }, [nodes, rootId, isSupplier]);

    const subCategories = useMemo(() => {
        if (!isSupplier || !activeCategoryId) return [];
        const node = nodes[activeCategoryId];
        if (!node) return [];

        const realSubs = node.childrenIds.map(id => nodes[id]).filter(isCategoryLike);

        const virtualSubs = (node.sourceIds || []).flatMap(srcId => {
            const src = nodes[srcId];
            return src ? src.childrenIds.map(id => nodes[id]).filter(isCategoryLike) : [];
        });

        return [...realSubs, ...virtualSubs];
    }, [nodes, activeCategoryId, isCategoryLike, isSupplier]);

    // Init Defaults for Supplier Mode
    useEffect(() => {
        if (isSupplier) {
            setActiveTab('FABRIC'); // Lock to Fabric
            if (!activeCategoryId && categories.length > 0) {
                setActiveCategoryId(categories[0].id);
            }
        }
    }, [isSupplier, categories, activeCategoryId]);

    // Auto-select all sub-categories
    useEffect(() => {
        if (isSupplier && activeCategoryId && subCategories.length > 0) {
            setSelectedSubIds(subCategories.map(sub => sub.id));
        } else {
            setSelectedSubIds([]);
        }
    }, [isSupplier, activeCategoryId, subCategories]);

    // --- 2. Center Column: Flatten Product List (Updated for Supplier) ---
    const gridData = useMemo(() => {
        const rows: { id: string; path: string; node: NodeData }[] = [];

        // Logic from ProductConfiguration / StandardCost to match exact list
        const traverse = (nodeId: string, pathStr: string) => {
            const node = nodes[nodeId];
            if (!node) return;

            const currentPath = pathStr ? `${pathStr} > ${node.label}` : node.label;
            const attributes = node.attributes || {};
            const nodeType = attributes.nodeType;

            let isProductRow = false;

            // 1. Explicit Product
            if (nodeType === 'product') {
                isProductRow = true;
            }
            // 2. Explicit Low-level Item (Color/Option) -> Ignore
            else if (nodeType === 'color' || attributes.color || nodeType === 'option') {
                return;
            }
            // 3. Explicit Container -> Traverse deeper
            else if (
                node.type === 'CATEGORY' ||
                node.type === 'ROOT' ||
                nodeType === 'category' ||
                nodeType === 'species' ||
                nodeType === 'item' ||
                node.type === 'REFERENCE'
            ) {
                // Just continue traversal
            }
            // 4. Implicit Product Logic
            else {
                const children = node.childrenIds.map(id => nodes[id]).filter(Boolean);
                const hasColorChildren = children.some(c => c.attributes?.nodeType === 'color' || c.attributes?.color);
                if (hasColorChildren || children.length === 0) {
                    isProductRow = true;
                }
            }

            if (isProductRow) {
                // 원가가 설정된 상품만 표시
                let hasCost = false;
                try {
                    const costKeys = ['cost_fabric_list', 'cost_cutting_list', 'cost_measure_list'];
                    for (const key of costKeys) {
                        if (node.attributes?.[key]) {
                            const list = JSON.parse(node.attributes[key]);
                            if (Array.isArray(list) && list.length > 0) {
                                hasCost = true;
                                break;
                            }
                        }
                    }
                } catch (e) { }

                if (hasCost && (!searchQuery || currentPath.toLowerCase().includes(searchQuery.toLowerCase()))) {
                    rows.push({ id: node.id, path: currentPath, node });
                }
                return; // Stop traversing children (colors) of a product
            }

            // Recursion
            if (node.childrenIds.length > 0) {
                node.childrenIds.forEach(childId => traverse(childId, currentPath));
            }
            // Virtual Children (SourceIds)
            if (node.sourceIds && node.sourceIds.length > 0) {
                node.sourceIds.forEach(srcId => {
                    const src = nodes[srcId];
                    if (src && src.childrenIds) {
                        src.childrenIds.forEach(childId => traverse(childId, currentPath));
                    }
                });
            }
        };

        // Admin Legacy Logic (Optional, kept for backward compat if role != Supplier)
        const traverseAdmin = (nodeId: string, pathStr: string) => {
            const node = nodes[nodeId];
            if (!node) return;
            const currentPath = pathStr ? `${pathStr} > ${node.label}` : node.label;

            // 모든 원가 타입 확인 (현재 노드 + sourceIds + originalSourceId)
            const checkHasCost = (n: any, costKey: string): boolean => {
                try {
                    if (n?.attributes?.[costKey]) {
                        const list = JSON.parse(n.attributes[costKey]);
                        if (Array.isArray(list) && list.length > 0) return true;
                    }
                } catch (e) { }
                return false;
            };

            const costKey = activeTab === 'FABRIC' ? 'cost_fabric_list' : activeTab === 'CUTTING' ? 'cost_cutting_list' : 'cost_measure_list';

            let hasCost = checkHasCost(node, costKey);
            // sourceIds에서도 확인
            if (!hasCost && node.sourceIds && Array.isArray(node.sourceIds)) {
                for (const srcId of node.sourceIds) {
                    if (checkHasCost(nodes[srcId], costKey)) { hasCost = true; break; }
                }
            }
            // originalSourceId에서도 확인
            if (!hasCost && node.attributes?.originalSourceId) {
                hasCost = checkHasCost(nodes[node.attributes.originalSourceId], costKey);
            }

            // 가맹대리점: 판매가(sales_price_*) 데이터가 있는 상품도 표시
            if (!hasCost && isAgency) {
                const salesKeys = ['sales_price_fabric', 'sales_price_cutting', 'sales_price_measure'];
                const checkNode = (n: any) => {
                    if (!n?.attributes) return false;
                    for (const sk of salesKeys) {
                        try {
                            if (n.attributes[sk]) {
                                const sp = JSON.parse(n.attributes[sk]);
                                if (Object.keys(sp).length > 0) return true;
                            }
                        } catch { }
                    }
                    return false;
                };
                hasCost = checkNode(node);
                if (!hasCost && node.sourceIds && Array.isArray(node.sourceIds)) {
                    for (const srcId of node.sourceIds) {
                        if (checkNode(nodes[srcId])) { hasCost = true; break; }
                    }
                }
                if (!hasCost && node.attributes?.originalSourceId) {
                    hasCost = checkNode(nodes[node.attributes.originalSourceId]);
                }
            }

            if (hasCost) {
                if (!searchQuery || currentPath.toLowerCase().includes(searchQuery.toLowerCase())) {
                    rows.push({ id: node.id, path: currentPath, node: node });
                }
            }
            if (node.childrenIds.length > 0) node.childrenIds.forEach(childId => traverseAdmin(childId, currentPath));
            if (node.sourceIds && node.sourceIds.length > 0) {
                node.sourceIds.forEach(srcId => {
                    const src = nodes[srcId];
                    if (src && src.childrenIds) src.childrenIds.forEach(childId => traverseAdmin(childId, currentPath));
                });
            }
        };

        if (isSupplier) {
            let targetIds: string[] = [];
            if (subCategories.length > 0) {
                targetIds = selectedSubIds;
            } else {
                const activeNode = nodes[activeCategoryId];
                if (activeNode) {
                    targetIds = activeNode.childrenIds || [];
                    if (activeNode.sourceIds) {
                        const virtualTargets = activeNode.sourceIds.flatMap(srcId => nodes[srcId]?.childrenIds || []);
                        targetIds = [...targetIds, ...virtualTargets];
                    }
                }
            }
            targetIds.forEach(childId => traverse(childId, ''));
        } else {
            const startNodeId = nodes[`root-${supplierId}`] ? `root-${supplierId}` : rootId;
            const startNode = nodes[startNodeId];
            if (startNode) {
                startNode.childrenIds.forEach(childId => traverseAdmin(childId, ''));
            }
        }

        return rows;
    }, [nodes, searchQuery, activeTab, rootId, supplierId, isSupplier, activeCategoryId, selectedSubIds, subCategories]);

    // --- Assembly System Grid Data (for roles with assembly support) ---
    const assemblyGridData = useMemo(() => {
        if (!hasAssemblySupport) return [];
        const rows: { id: string; path: string; node: NodeData }[] = [];
        const uniqueIds = new Set<string>();

        // Find system root - aligned with StandardCost.hooks.ts logic
        const allNodes = Object.values(nodes) as NodeData[];
        let systemRootId = '';

        // PRIORITY 1: Look for Partner System Tree
        let potentialPartnerId = '';
        if (rootId && rootId.startsWith('root-partner-')) {
            potentialPartnerId = rootId.replace('root-partner-', '');
        } else if (isDistributor) potentialPartnerId = 'd1';
        else if (isManufacturer) potentialPartnerId = 'm1';

        if (potentialPartnerId) {
            const partnerSystemRootId = `root-1770804399939-partner-${potentialPartnerId}`;
            if (nodes[partnerSystemRootId]) {
                systemRootId = partnerSystemRootId;
            }
        }

        // PRIORITY 2: Global system tree
        if (!systemRootId) {
            const globalSystemRoots = allNodes.filter(n =>
                n.type === 'ROOT' &&
                n.label === '시스템' &&
                !n.attributes?.partnerId
            );
            if (globalSystemRoots.length > 0) {
                const sortedRoots = globalSystemRoots.sort((a, b) =>
                    (b.childrenIds?.length || 0) - (a.childrenIds?.length || 0)
                );
                const globalRoot = sortedRoots[0];
                if (globalRoot && globalRoot.childrenIds && globalRoot.childrenIds.length > 0) {
                    systemRootId = globalRoot.id;
                }
            }
        }

        // PRIORITY 3: Fallback - any system tree
        if (!systemRootId) {
            const anySystem = allNodes.find(n =>
                n.type === 'ROOT' &&
                (n.attributes?.treeType === 'system' || n.label.includes('시스템') || n.label.includes('System'))
            );
            if (anySystem) systemRootId = anySystem.id;
        }

        if (!systemRootId || !nodes[systemRootId]) return rows;

        // Helper for system tree grid: only follow childrenIds + originalSourceId (NOT sourceIds)
        // This matches StandardCost's treeHelper.getChildren behavior for system trees
        const getSystemChildren = (nodeId: string): NodeData[] => {
            const n = nodes[nodeId];
            if (!n) return [];
            let childIds = Array.isArray(n.childrenIds) ? [...n.childrenIds] : [];
            // Follow originalSourceId if no direct children
            if (childIds.length === 0 && n.attributes?.originalSourceId) {
                const src = nodes[n.attributes.originalSourceId];
                if (src && Array.isArray(src.childrenIds)) childIds = [...src.childrenIds];
            }
            return [...new Set(childIds)].map(id => nodes[id]).filter(Boolean);
        };

        const traverseSystem = (nodeId: string, pathParts: string[]) => {
            const node = nodes[nodeId];
            if (!node) return;
            if (nodeId === systemRootId) {
                const children = getSystemChildren(nodeId);
                children.forEach(child => traverseSystem(child.id, []));
                return;
            }
            const currentPath = [...pathParts, node.label];
            const children = getSystemChildren(nodeId);
            const hasContainerChildren = children.some(child => {
                const ct = child.type;
                const nt = child.attributes?.nodeType;
                return ct === 'CATEGORY' || ct === 'REFERENCE' || nt === 'category' || nt === 'species' || nt === 'item';
            });
            if (children.length === 0 || !hasContainerChildren) {
                if (!uniqueIds.has(node.id)) {
                    uniqueIds.add(node.id);
                    rows.push({ id: node.id, path: currentPath.join(' > '), node });
                }
            } else {
                children.forEach(child => traverseSystem(child.id, currentPath));
            }
        };

        traverseSystem(systemRootId, []);
        return rows;
    }, [nodes, hasAssemblySupport, rootId]);

    // Active grid data based on sidebar mode
    const activeGridData = useMemo(() => {
        if (hasAssemblySupport && sidebarMode === 'ASSEMBLY') return assemblyGridData;
        return gridData;
    }, [hasAssemblySupport, sidebarMode, assemblyGridData, gridData]);

    // Auto-select first item when switching to assembly mode
    useEffect(() => {
        if (hasAssemblySupport && sidebarMode === 'ASSEMBLY' && assemblyGridData.length > 0) {
            if (!selectedNodeId || !assemblyGridData.some(g => g.id === selectedNodeId)) {
                setSelectedNodeId(assemblyGridData[0].id);
            }
        }
    }, [sidebarMode, assemblyGridData]);

    // --- Assembly Items: Get children of selected system node ---
    const assemblyItems = useMemo(() => {
        if (!hasAssemblySupport || sidebarMode !== 'ASSEMBLY' || !selectedNodeId) return [];
        const node = nodes[selectedNodeId];
        if (!node) return [];

        // Parse cost_assembly_list from the system node to get assembly costs
        let assemblyCostMap: Record<string, { price: string; unit: string }> = {};
        try {
            const saved = node.attributes?.cost_assembly_list;
            if (saved) {
                const parsed = JSON.parse(saved);
                if (typeof parsed === 'object' && parsed !== null) assemblyCostMap = parsed;
            }
        } catch (e) { /* ignore parse error */ }

        const items: { id: string; label: string; standardCost: number; unit: string; parentLabel: string; groupLabel: string }[] = [];

        // Get children of selected system node (assembly options)
        const getChildren = (nid: string): NodeData[] => {
            const n = nodes[nid];
            if (!n) return [];
            let childIds = Array.isArray(n.childrenIds) ? [...n.childrenIds] : [];
            if (childIds.length === 0 && n.attributes?.originalSourceId) {
                const src = nodes[n.attributes.originalSourceId];
                if (src && Array.isArray(src.childrenIds)) childIds = [...src.childrenIds];
            }
            if (n.sourceIds && Array.isArray(n.sourceIds)) {
                for (const srcId of n.sourceIds) {
                    const src = nodes[srcId];
                    if (src && Array.isArray(src.childrenIds)) childIds.push(...src.childrenIds);
                }
            }
            return [...new Set(childIds)].map(id => nodes[id]).filter(Boolean);
        };

        // Resolve originalSourceId for cost lookup
        const getCostForNode = (nid: string): { price: number; unit: string } | null => {
            // Try direct ID first
            const direct = assemblyCostMap[nid];
            if (direct && direct.price) {
                return { price: parseFloat(direct.price.replace(/,/g, '') || '0'), unit: direct.unit || '건' };
            }
            // Try originalSourceId
            const n = nodes[nid];
            if (n?.attributes?.originalSourceId) {
                const src = assemblyCostMap[n.attributes.originalSourceId];
                if (src && src.price) {
                    return { price: parseFloat(src.price.replace(/,/g, '') || '0'), unit: src.unit || '건' };
                }
            }
            return null;
        };

        // Traverse children recursively to find leaf assembly items
        const traverse = (nid: string, parentLabel: string, groupLabel: string) => {
            const children = getChildren(nid);
            if (children.length === 0) {
                // Leaf node - this is an assembly item
                const n = nodes[nid];
                if (!n || nid === selectedNodeId) return;
                const costInfo = getCostForNode(nid);
                if (!costInfo || costInfo.price <= 0) return; // Skip items without cost
                items.push({ id: n.id, label: n.label, standardCost: costInfo.price, unit: costInfo.unit, parentLabel, groupLabel });
            } else {
                // Non-leaf: check if this node itself has a cost entry (intermediate nodes can have costs too)
                const n = nodes[nid];
                if (n && nid !== selectedNodeId) {
                    const costInfo = getCostForNode(nid);
                    if (costInfo && costInfo.price > 0) {
                        items.push({ id: n.id, label: n.label, standardCost: costInfo.price, unit: costInfo.unit, parentLabel, groupLabel });
                    }
                }
                children.forEach(child => traverse(child.id, parentLabel ? `${parentLabel} > ${nodes[nid]?.label || ''}` : (nodes[nid]?.label || ''), groupLabel));
            }
        };

        // Start from selected system node's immediate children (these become group labels)
        const directChildren = getChildren(selectedNodeId);
        directChildren.forEach(child => {
            const grandChildren = getChildren(child.id);
            if (grandChildren.length === 0) {
                // Direct child is a leaf
                const costInfo = getCostForNode(child.id);
                if (!costInfo || costInfo.price <= 0) return; // Skip items without cost
                items.push({ id: child.id, label: child.label, standardCost: costInfo.price, unit: costInfo.unit, parentLabel: node.label, groupLabel: child.label });
            } else {
                // Check if this intermediate child itself has a cost
                const costInfo = getCostForNode(child.id);
                if (costInfo && costInfo.price > 0) {
                    items.push({ id: child.id, label: child.label, standardCost: costInfo.price, unit: costInfo.unit, parentLabel: node.label, groupLabel: child.label });
                }
                traverse(child.id, node.label, child.label);
            }
        });

        return items;
    }, [hasAssemblySupport, sidebarMode, selectedNodeId, nodes]);

    // Assembly groups: group items by groupLabel
    const assemblyGroups = useMemo(() => {
        const groups: { label: string; items: typeof assemblyItems }[] = [];
        const groupMap = new Map<string, typeof assemblyItems>();
        assemblyItems.forEach(item => {
            const existing = groupMap.get(item.groupLabel);
            if (existing) existing.push(item);
            else groupMap.set(item.groupLabel, [item]);
        });
        groupMap.forEach((items, label) => groups.push({ label, items }));
        return groups;
    }, [assemblyItems]);

    // Expanded groups state (default all expanded)
    const [expandedAssemblyGroups, setExpandedAssemblyGroups] = useState<Set<string>>(new Set());

    // Auto-expand all groups when assemblyGroups change
    useEffect(() => {
        setExpandedAssemblyGroups(new Set(assemblyGroups.map(g => g.label)));
    }, [assemblyGroups]);

    // Assembly editing margins state
    const [assemblyEditingMargins, setAssemblyEditingMargins] = useState<Record<string, string>>({});

    const handleAssemblyMarginChange = useCallback((itemId: string, value: string) => {
        setAssemblyEditingMargins(prev => ({ ...prev, [itemId]: value }));
    }, []);

    // Initialize assembly margins when items change
    useEffect(() => {
        if (assemblyItems.length > 0) {
            const gradeDef = gradeMargins.find(g => g.grade === selectedGrade);
            const defaultMargin = gradeDef?.margin || '0';
            const initial: Record<string, string> = {};
            assemblyItems.forEach(item => {
                if (assemblyEditingMargins[item.id] === undefined) {
                    initial[item.id] = defaultMargin;
                }
            });
            if (Object.keys(initial).length > 0) {
                setAssemblyEditingMargins(prev => ({ ...initial, ...prev }));
            }
        }
    }, [assemblyItems, selectedGrade, gradeMargins]);

    // --- 3. Right Column: Load Data ---
    const standardCostItems = useMemo(() => {
        if (!selectedNodeId) return { FABRIC: [], CUTTING: [], MEASURE: [] };
        const node = nodes[selectedNodeId];

        const loadCosts = (type: CostTab) => {
            const costKey = type === 'FABRIC' ? 'cost_fabric_list'
                : type === 'CUTTING' ? 'cost_cutting_list'
                    : 'cost_measure_list';
            try {
                return node.attributes?.[costKey] ? JSON.parse(node.attributes[costKey]) : [];
            } catch (e) { return []; }
        };

        const fabricItems = loadCosts('FABRIC');
        const cuttingItems = loadCosts('CUTTING');
        let measureItems = loadCosts('MEASURE');

        // CUTTING_LINK 처리: standardPrice가 제단원가 대비 퍼센트(%)이므로 실제 금액으로 변환
        // StandardCostContent.tsx와 동일한 공식: Math.round(referenceCuttingPrice * (percentage / 100))
        if (measureItems.length > 0 && cuttingItems.length > 0) {
            const referenceCuttingPrice = Math.max(...cuttingItems.map((c: any) =>
                parseFloat(String(c.standardPrice || '0').replace(/,/g, '')) || 0
            ));
            measureItems = measureItems.map((item: any) => {
                if (item.unit === 'CUTTING_LINK') {
                    const percentage = parseFloat(String(item.standardPrice || '0').replace(/,/g, '')) || 0;
                    const calcPrice = Math.round(referenceCuttingPrice * (percentage / 100));
                    return { ...item, standardPrice: calcPrice.toLocaleString(), _originalPercentage: percentage };
                }
                return item;
            });
        }

        return {
            FABRIC: fabricItems,
            CUTTING: cuttingItems,
            MEASURE: measureItems
        };
    }, [selectedNodeId, nodes]);

    // --- Agency Override: Replace standard costs with distributor's sales prices ---
    const agencyOverriddenCostItems = useMemo(() => {
        if (!isAgency || !agencyPartnerId || !selectedNodeId) return standardCostItems;
        const node = nodes[selectedNodeId];
        if (!node) return standardCostItems;

        // Find agency partner's grade and its default margin from distributor
        const agencyPartner = partners.find(p => p.id === agencyPartnerId);
        const agencyGrade = agencyPartner?.grade || 'A';
        const gradeDefaultMargin = gradeMargins.find(g => g.grade === agencyGrade)?.margin || '15';


        const loadSalesPrices = (type: CostTab) => {
            const priceKey = type === 'FABRIC' ? 'sales_price_fabric'
                : type === 'CUTTING' ? 'sales_price_cutting'
                    : 'sales_price_measure';
            try {
                return node.attributes?.[priceKey] ? JSON.parse(node.attributes[priceKey]) : {};
            } catch (e) { return {}; }
        };

        const overrideItems = (items: any[], type: CostTab) => {
            const salesPrices = loadSalesPrices(type);

            return items.map((item: any) => {
                const itemSales = salesPrices[item.id];

                // Priority: 1. Saved partner price → 2. Saved grade price → 3. Calculate from grade margin
                const priceData = itemSales?.[agencyPartnerId] || itemSales?.[agencyGrade];
                if (priceData?.price) {
                    const priceVal = priceData.price;

                    if (type === 'FABRIC') {
                        return {
                            ...item,
                            meterPrice: priceVal,
                            rollPrice: priceData.rollSalesPrice || item.rollPrice,
                            cuttingPrice: priceData.cutSalesPrice || item.cuttingPrice
                        };
                    } else {
                        return { ...item, standardPrice: priceVal };
                    }
                }

                // Fallback: Calculate sales price using grade default margin
                if (type === 'FABRIC') {
                    const isSlat = item.category === 'SLAT';
                    const meterCost = parseFloat((isSlat ? item.rollPrice : item.meterPrice)?.replace(/,/g, '') || '0');
                    const rollCost = parseFloat(item.rollPrice?.replace(/,/g, '') || '0');
                    const cutCost = parseFloat(item.cuttingPrice?.replace(/,/g, '') || '0');
                    return {
                        ...item,
                        meterPrice: calculatePrice(meterCost, gradeDefaultMargin).toLocaleString(),
                        rollPrice: calculatePrice(rollCost, gradeDefaultMargin).toLocaleString(),
                        cuttingPrice: calculatePrice(cutCost, gradeDefaultMargin).toLocaleString()
                    };
                } else {
                    const stdCost = parseFloat(item.standardPrice?.replace(/,/g, '') || '0');

                    return { ...item, standardPrice: calculatePrice(stdCost, gradeDefaultMargin).toLocaleString() };
                }
            });
        };

        return {
            FABRIC: overrideItems(standardCostItems.FABRIC, 'FABRIC'),
            CUTTING: overrideItems(standardCostItems.CUTTING, 'CUTTING'),
            MEASURE: overrideItems(standardCostItems.MEASURE, 'MEASURE')
        };
    }, [isAgency, agencyPartnerId, selectedNodeId, nodes, standardCostItems, partners, gradeMargins, calculatePrice]);

    // Effective cost items: use agency-overridden prices or standard costs
    const effectiveCostItems = isAgency ? agencyOverriddenCostItems : standardCostItems;

    // Helper to get ALL cost items across types
    const allCostItems = useMemo(() => {
        return [
            ...effectiveCostItems.FABRIC,
            ...effectiveCostItems.CUTTING,
            ...effectiveCostItems.MEASURE
        ];
    }, [effectiveCostItems]);


    const savedSalesPrices: SalesPriceData = useMemo(() => {
        if (!selectedNodeId) return {};
        const node = nodes[selectedNodeId];

        // Load for all types and merge? Or just load one type?
        // We need to load all types to display them simultaneously.
        // But SalesPriceData structure is by ItemID. ItemIDs are unique across types usually?
        // Yes, ItemIDs are unique. So we can just merge all saved prices.

        const loadPrices = (type: CostTab) => {
            const priceKey = type === 'FABRIC' ? 'sales_price_fabric'
                : type === 'CUTTING' ? 'sales_price_cutting'
                    : 'sales_price_measure';
            try {
                return node.attributes?.[priceKey] ? JSON.parse(node.attributes[priceKey]) : {};
            } catch (e) { return {}; }
        };

        return {
            ...loadPrices('FABRIC'),
            ...loadPrices('CUTTING'),
            ...loadPrices('MEASURE')
        };
    }, [selectedNodeId, nodes]);

    // Initialize Edit State
    useEffect(() => {
        if (!selectedNodeId) {
            setEditingMargins({});
            return;
        }

        // Logic updated: If 'ALL', loading default logic might be complex as everyone has diff prices.
        // For simplicity: If ALL, we show BLANK or default margin of A?
        // Actually, if editing as 'ALL', we probably want to set a new value, not view existing Mixed values.
        // But if 'Grade A', we can show Grade A's default/saved values.

        let referenceGrade = selectedGrade === 'ALL' ? 'A' : selectedGrade; // Default to A for reference if ALL

        const gradeDef = gradeMargins.find(g => g.grade === referenceGrade);
        // Agency default margin: 50%, others: grade-based margin
        const defaultMargin = isAgency ? '50' : (gradeDef?.margin || '0');

        const nextMargins: Record<string, string> = {};

        allCostItems.forEach((item: any) => {
            const savedItem = savedSalesPrices[item.id];
            const savedGradeData = savedItem ? savedItem[referenceGrade] : null;

            // 등급별 초기 설정값을 기본으로 표시
            // 저장된 마진이 아닌 등급의 기본 마진을 디폴트로 사용
            nextMargins[item.id] = defaultMargin;
        });

        setEditingMargins(nextMargins);
    }, [selectedNodeId, selectedGrade, allCostItems, savedSalesPrices, gradeMargins]);

    // --- Handlers ---
    const handleMarginChange = (itemId: string, value: string) => {
        setEditingMargins(prev => ({ ...prev, [itemId]: value }));
    };

    const handleBatchReset = () => {
        if (selectedGrade === 'ALL') return;
        const gradeDef = gradeMargins.find(g => g.grade === selectedGrade);
        if (!gradeDef) return;

        const defaultMargin = gradeDef.margin;
        const nextMargins: Record<string, string> = {};
        allCostItems.forEach((item: any) => {
            // Respect checked items if any?
            if (checkedItems.size > 0 && !checkedItems.has(item.id)) {
                // Keep existing
                if (editingMargins[item.id]) nextMargins[item.id] = editingMargins[item.id];
                return;
            }
            nextMargins[item.id] = defaultMargin;
        });

        setEditingMargins(prev => ({ ...prev, ...nextMargins }));
    };

    // Bulk Handlers (Only for Partners now)
    const handleTargetToggle = (id: string, isGrade: boolean) => {
        // Updated: Only handling Partner IDs now, as Grade toggle is via Radio
        setCheckedTargets(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleSelectAllTargets = (isChecked: boolean) => {
        // Deprecated/Removed in UI, keeping empty to avoid errors if passed
    };

    const handleItemToggle = (itemId: string) => {
        setCheckedItems(prev => {
            const next = new Set(prev);
            if (next.has(itemId)) next.delete(itemId);
            else next.add(itemId);
            return next;
        });
    };

    const handleSelectAllItems = (isChecked: boolean) => {
        if (!isChecked) {
            setCheckedItems(new Set());
            return;
        }
        const allIds = new Set<string>();
        effectiveCostItems.FABRIC.forEach((item: any) => allIds.add(item.id));
        effectiveCostItems.CUTTING.forEach((item: any) => allIds.add(item.id));
        effectiveCostItems.MEASURE.forEach((item: any) => allIds.add(item.id));
        setCheckedItems(allIds);
    };

    const handleBulkApply = () => {
        if (!bulkMargin) return;
        if (checkedItems.size === 0) return;

        const nextMargins = { ...editingMargins };
        checkedItems.forEach(itemId => {
            nextMargins[itemId] = bulkMargin;
        });
        setEditingMargins(nextMargins);
        alert(`${checkedItems.size}개 항목에 마진 ${bulkMargin}%가 일괄 적용되었습니다.`);
    };

    const handleSave = () => {
        if (!selectedNodeId) return;

        let targetsToSave: string[] = [];

        if (selectedGrade === 'ALL') {
            // ALL Partners
            targetsToSave = partners.map(p => p.id);
        } else {
            // Specific Grade
            if (checkedTargets.size > 0) {
                // Apply to checked partners only
                targetsToSave = Array.from(checkedTargets);
            } else {
                // Apply to Grade Default (No partners checked)
                // This means we save to the 'Grade' key (e.g., 'A'), not specific partners
                targetsToSave = [selectedGrade];
            }
        }

        if (targetsToSave.length === 0) {
            alert('적용할 대상이 없습니다.');
            return;
        }

        const node = nodes[selectedNodeId];

        // We need to update saved data for ALL types (Fabric, Cutting, Measure)
        // Load current full data for each type
        const getFullData = (type: CostTab) => {
            const priceKey = type === 'FABRIC' ? 'sales_price_fabric'
                : type === 'CUTTING' ? 'sales_price_cutting'
                    : 'sales_price_measure';
            try {
                return node.attributes?.[priceKey] ? JSON.parse(node.attributes[priceKey]) : {};
            } catch (e) { return {}; }
        };

        const types: CostTab[] = ['FABRIC', 'CUTTING', 'MEASURE'];
        const fullDataByType: Record<CostTab, SalesPriceData> = {
            FABRIC: getFullData('FABRIC'),
            CUTTING: getFullData('CUTTING'),
            MEASURE: getFullData('MEASURE')
        };

        // Iterate over Items and Update relevant type data
        allCostItems.forEach((item: any) => {
            // Find which type this item belongs to
            let type: CostTab | null = null;
            if (effectiveCostItems.FABRIC.some((i: any) => i.id === item.id)) type = 'FABRIC';
            else if (effectiveCostItems.CUTTING.some((i: any) => i.id === item.id)) type = 'CUTTING';
            else if (effectiveCostItems.MEASURE.some((i: any) => i.id === item.id)) type = 'MEASURE';

            if (!type) return;

            if (!fullDataByType[type][item.id]) fullDataByType[type][item.id] = {};

            const margin = editingMargins[item.id];
            if (margin === undefined) return;

            let stdPrice = 0;
            if (type === 'FABRIC') {
                // Robust check: Slat if category is 'SLAT' OR if it has height/rollPrice structure
                const isSlat = item.category === 'SLAT' || (!!item.height && !!item.rollPrice && !!item.rollLength);
                stdPrice = parseFloat((isSlat ? item.rollPrice : item.meterPrice)?.replace(/,/g, '') || '0');
                console.log(`[Save] Item ${item.id} (${item.category}) -> isSlat: ${isSlat}, StdPrice: ${stdPrice}`);
            }
            else if (type === 'CUTTING') stdPrice = parseFloat(item.standardPrice?.replace(/,/g, '') || '0');
            else if (type === 'MEASURE') stdPrice = parseFloat(item.standardPrice?.replace(/,/g, '') || '0');

            const finalPrice = calculatePrice(stdPrice, margin);

            // FABRIC: rollPrice, cuttingPrice 판매단가도 함께 저장
            let rollSalesPrice = 0;
            let cutSalesPrice = 0;
            let cutMeterSalesPrice = 0;
            if (type === 'FABRIC') {
                const rollCost = parseFloat(item.rollPrice?.replace(/,/g, '') || '0');
                const cutCost = parseFloat(item.cuttingPrice?.replace(/,/g, '') || '0');
                const cutMeterCost = parseFloat(item.cuttingMeterPrice?.replace(/,/g, '') || '0');
                rollSalesPrice = calculatePrice(rollCost, margin);
                cutSalesPrice = calculatePrice(cutCost, margin);
                cutMeterSalesPrice = calculatePrice(cutMeterCost, margin);
            }

            // Apply to all targets
            targetsToSave.forEach(targetId => {
                fullDataByType[type!][item.id][targetId] = {
                    margin: margin,
                    price: finalPrice.toString(),
                    ...(type === 'FABRIC' ? {
                        rollSalesPrice: rollSalesPrice.toString(),
                        cutSalesPrice: cutSalesPrice.toString(),
                        cutMeterSalesPrice: cutMeterSalesPrice.toString()
                    } : {}),
                    updatedAt: new Date().toISOString()
                };
            });
        });

        console.log('[SalesPriceManagement] handleSave executing:', {
            selectedNodeId,
            nodeLabel: nodes[selectedNodeId]?.label,
            fabricDataKeys: Object.keys(fullDataByType.FABRIC),
            fabricDataSample: Object.values(fullDataByType.FABRIC)[0],
            allCostItemsCount: allCostItems.length
        });

        // Save back to node attributes
        setNodes(prev => ({
            ...prev,
            [selectedNodeId]: {
                ...prev[selectedNodeId],
                attributes: {
                    ...prev[selectedNodeId].attributes,
                    sales_price_fabric: JSON.stringify(fullDataByType.FABRIC),
                    sales_price_cutting: JSON.stringify(fullDataByType.CUTTING),
                    sales_price_measure: JSON.stringify(fullDataByType.MEASURE)
                }
            }
        }));

        const targetDesc = selectedGrade === 'ALL' ? '전체 거래처' :
            (checkedTargets.size > 0 ? `${checkedTargets.size}개 거래처` : `${selectedGrade} 등급 기본`);
        alert(`${targetDesc}에 판매단가가 저장되었습니다.`);
    };

    return (
        <div className="flex flex-col h-full w-full bg-gray-50 overflow-hidden font-sans">

            {/* 1. HEADER */}
            <div className="flex-shrink-0 bg-white border-b border-gray-200 px-8 py-4 shadow-sm z-20 flex items-center justify-between gap-4 h-20">
                {/* Left: Title & Count */}
                <div className="flex items-center gap-3 min-w-fit">
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <DollarSign className="text-blue-600" /> 판매단가 관리
                    </h1>
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100 shadow-sm">
                        총 {gridData.length}개 상품
                    </span>
                </div>

                {/* Center: Search */}
                <div className="flex-1 max-w-lg mx-auto">
                    <div className="relative w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="상품명 검색..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-2.5 bg-gray-100 border-transparent focus:bg-white focus:border-blue-500 border rounded-xl text-sm font-medium outline-none transition-all shadow-inner focus:shadow-md"
                        />
                    </div>
                </div>

                {/* Right: Navigation (Conditional) */}
                {isSupplier ? (
                    // SUPPLIER VIEW: Category Tabs (No Cost Type Tabs)
                    <div className="flex items-center gap-3 justify-end min-w-0">
                        {/* Main Categories */}
                        <div className="flex bg-white p-1 rounded-full shadow-sm border border-gray-200 flex-shrink-0 gap-1 ring-1 ring-black/[0.03]">
                            {categories.map((cat) => {
                                const isActive = activeCategoryId === cat.id;
                                return (
                                    <button key={cat.id} onClick={() => { setActiveCategoryId(cat.id); setSelectedNodeId(null); }}
                                        className={`relative px-5 py-2 text-xs font-bold rounded-full transition-all whitespace-nowrap z-10 flex items-center gap-1.5 ${isActive ? 'text-white bg-[#7C3AED] shadow-[0_2px_8px_rgba(124,58,237,0.3)]' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'}`}
                                    >
                                        {cat.sourceIds && cat.sourceIds.length > 0 && <Link2 size={12} className={isActive ? "text-white/70" : "opacity-40"} />}
                                        {cat.label}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="w-1.5 h-1.5 rounded-full bg-gray-300 flex-shrink-0" />

                        {/* Sub Categories */}
                        <div className="flex bg-white p-1 rounded-full border border-gray-200 shadow-sm overflow-x-auto scrollbar-hide max-w-[300px] flex-shrink-0 gap-1.5 ring-1 ring-black/[0.03]">
                            {subCategories.length > 0 ? subCategories.map((sub) => {
                                const isSelected = selectedSubIds.includes(sub.id);
                                return (
                                    <button key={sub.id} onClick={() => {
                                        setSelectedSubIds(prev => prev.includes(sub.id) ? prev.filter(id => id !== sub.id) : [...prev, sub.id]);
                                        setSelectedNodeId(null);
                                    }}
                                        className={`relative px-4 py-2 text-xs font-bold rounded-full transition-all whitespace-nowrap z-10 flex-shrink-0 flex items-center gap-1.5 ${isSelected ? 'text-[#7C3AED] bg-[#F5F3FF] border border-[#DDD6FE] shadow-sm' : 'text-gray-500 hover:text-gray-600 border border-transparent'}`}
                                    >
                                        {sub.sourceIds && sub.sourceIds.length > 0 && <Link2 size={10} className={isSelected ? "text-[#7C3AED]/50" : "opacity-40"} />}
                                        {sub.label}
                                    </button>
                                );
                            }) : (
                                <div className="px-4 py-2 text-xs font-bold text-gray-300 italic">하위 카테고리 없음</div>
                            )}
                        </div>
                    </div>
                ) : null}
            </div>

            {/* 2. MAIN LAYOUT */}
            <div className="flex-1 flex overflow-hidden">
                {/* LEFT: Partner Selection - Updated Logic */}
                {!hidePartnerSelector && (
                    <div className="w-64 bg-white border-r border-gray-200 flex flex-col z-10 shadow-lg flex-shrink-0">
                        <div className="px-5 py-3 bg-gray-50/80 border-b border-gray-200 flex items-center justify-between gap-2 backdrop-blur-sm h-[42px]">
                            <div className="flex items-center gap-2">
                                <Users size={16} className="text-gray-400" />
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">거래처 선택</h3>
                            </div>
                        </div>

                        <div className="p-3 border-b border-gray-100">
                            <div className="relative">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="거래처명 또는 코드 검색..."
                                    className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:border-blue-500 focus:bg-white transition-all"
                                    value={partnerSearchQuery}
                                    onChange={(e) => setPartnerSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-3 space-y-2">
                            {/* 1. All Partners Card (Radio Style) */}
                            <div
                                onClick={() => {
                                    setSelectedGrade('ALL');
                                    setCheckedTargets(new Set()); // Clear individual selections
                                    setExpandedGrades(new Set()); // Collapse all grades
                                }}
                                className="w-full px-4 py-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all shadow-sm group"
                                style={{
                                    background: selectedGrade === 'ALL' ? 'var(--theme-primary-bg)' : 'white',
                                    borderColor: selectedGrade === 'ALL' ? 'var(--theme-primary)' : '#e5e7eb',
                                    boxShadow: selectedGrade === 'ALL' ? '0 0 0 1px var(--theme-primary)' : undefined,
                                }}
                            >
                                {/* 라디오 버튼 */}
                                <div
                                    className="w-4 h-4 rounded-full border flex-shrink-0 flex items-center justify-center transition-colors"
                                    style={{
                                        borderColor: selectedGrade === 'ALL' ? 'var(--theme-primary)' : '#d1d5db',
                                        background: selectedGrade === 'ALL' ? 'var(--theme-primary)' : 'white',
                                    }}
                                >
                                    {selectedGrade === 'ALL' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                </div>
                                <div>
                                    <span className="text-sm font-bold block" style={{ color: selectedGrade === 'ALL' ? 'var(--theme-primary)' : '#374151' }}>전체 거래처</span>
                                    <span className="text-[10px] text-gray-400 font-medium">모든 거래처에 일괄 적용</span>
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="h-px bg-gray-100 my-2" />

                            {/* 2. Grade List (Radio Style for Grades) */}
                            {gradeMargins.map((grade) => {
                                const isSelected = selectedGrade === grade.grade;
                                const gradePartners = partnersByGrade[grade.grade] || [];
                                const hasPartners = gradePartners.length > 0;

                                return (
                                    <div key={grade.id}
                                        className="border rounded-xl overflow-hidden transition-all duration-300"
                                        style={{
                                            borderColor: isSelected ? 'var(--theme-primary)' : '#e5e7eb',
                                            background: 'white',
                                            boxShadow: isSelected ? '0 0 0 1px var(--theme-primary)' : undefined,
                                        }}
                                    >
                                        {/* Grade Header (Radio) */}
                                        <div
                                            className="w-full p-3 flex items-center gap-3 cursor-pointer transition-colors"
                                            style={{ background: isSelected ? 'var(--theme-primary-bg)' : 'transparent' }}
                                            onClick={() => {
                                                if (selectedGrade !== grade.grade) {
                                                    setSelectedGrade(grade.grade);
                                                    setExpandedGrades(new Set([grade.grade]));
                                                    const newChecked = new Set<string>();
                                                    gradePartners.forEach(p => newChecked.add(p.id));
                                                    setCheckedTargets(newChecked);
                                                } else {
                                                    const allSelected = gradePartners.every(p => checkedTargets.has(p.id));
                                                    if (allSelected) {
                                                        setCheckedTargets(new Set());
                                                    } else {
                                                        const newChecked = new Set<string>();
                                                        gradePartners.forEach(p => newChecked.add(p.id));
                                                        setCheckedTargets(newChecked);
                                                    }
                                                }
                                            }}
                                        >
                                            {/* 라디오 버튼 */}
                                            <div
                                                className="w-4 h-4 rounded-full border flex-shrink-0 flex items-center justify-center transition-colors"
                                                style={{
                                                    borderColor: isSelected ? 'var(--theme-primary)' : '#d1d5db',
                                                    background: 'white',
                                                }}
                                            >
                                                {isSelected && <div className="w-2 h-2 rounded-full" style={{ background: 'var(--theme-primary)' }} />}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-bold" style={{ color: isSelected ? 'var(--theme-primary)' : '#374151' }}>{grade.grade} 등급</span>
                                                        <div className="flex items-center gap-1 bg-gray-100 px-1.5 py-0.5 rounded text-[10px] text-gray-500 font-bold">
                                                            <Users size={10} /> {gradePartners.length}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
                                                        <DollarSign size={10} /> {grade.margin}%
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Partner List (Checkboxes) - Only visible if Grade is Selected */}
                                        <AnimatePresence>
                                            {isSelected && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="border-t border-gray-100 bg-gray-50/30 overflow-hidden"
                                                >
                                                    {hasPartners ? (
                                                        <div className="max-h-60 overflow-y-auto">
                                                            {gradePartners.map((partner) => {
                                                                const isChecked = checkedTargets.has(partner.id);
                                                                return (
                                                                    <div
                                                                        key={partner.id}
                                                                        className="flex items-center gap-3 px-4 py-2.5 transition-colors border-b border-gray-50 last:border-b-0 cursor-pointer"
                                                                        style={{ background: isChecked ? 'var(--theme-primary-bg)' : 'transparent' }}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleTargetToggle(partner.id, false);
                                                                        }}
                                                                    >
                                                                        {/* 체크박스 */}
                                                                        <div
                                                                            className="w-4 h-4 rounded border flex items-center justify-center transition-colors flex-shrink-0"
                                                                            style={{
                                                                                background: isChecked ? 'var(--theme-primary)' : 'white',
                                                                                borderColor: isChecked ? 'var(--theme-primary)' : '#d1d5db',
                                                                                color: 'white',
                                                                            }}
                                                                        >
                                                                            {isChecked && <Check size={12} strokeWidth={3} />}
                                                                        </div>
                                                                        <div className="flex-1">
                                                                            <div className="text-xs font-bold leading-tight" style={{ color: isChecked ? 'var(--theme-primary)' : '#4b5563' }}>{partner.partnerName}</div>
                                                                            <div className="text-[10px] text-gray-400 font-mono mt-0.5">{partner.partnerCode}</div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    ) : (
                                                        <div className="px-4 py-3 text-center text-xs text-gray-400">
                                                            해당 등급의 거래처가 없습니다
                                                        </div>
                                                    )}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* CENTER: Product List */}
                <div className="w-[450px] flex flex-col border-r border-gray-200 bg-white shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10 flex-shrink-0">
                    {/* Sidebar Mode Tabs (Manufacturer only) */}
                    {hasAssemblySupport && (
                        <div className="px-4 pt-4 pb-2 bg-white border-b border-gray-100">
                            <div className="bg-gray-100 p-1 rounded-xl flex gap-1">
                                <button
                                    onClick={() => setSidebarMode('PRODUCT')}
                                    className="flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                                    style={{
                                        background: sidebarMode === 'PRODUCT' ? 'white' : 'transparent',
                                        color: sidebarMode === 'PRODUCT' ? 'var(--theme-primary)' : '#9ca3af',
                                        boxShadow: sidebarMode === 'PRODUCT' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                                    }}
                                >
                                    <Box size={14} />
                                    상품
                                </button>
                                <button
                                    onClick={() => setSidebarMode('ASSEMBLY')}
                                    className="flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                                    style={{
                                        background: sidebarMode === 'ASSEMBLY' ? 'white' : 'transparent',
                                        color: sidebarMode === 'ASSEMBLY' ? 'var(--theme-primary)' : '#9ca3af',
                                        boxShadow: sidebarMode === 'ASSEMBLY' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                                    }}
                                >
                                    <Hammer size={14} />
                                    조립
                                </button>
                            </div>
                        </div>
                    )}
                    <div className="px-5 py-3 bg-gray-50/80 border-b border-gray-200 flex text-xs font-bold text-gray-500 uppercase tracking-wider backdrop-blur-sm sticky top-0 h-[42px] items-center">
                        <div className="w-10 text-center">No.</div>
                        <div className="flex-1 pl-4">
                            {hasAssemblySupport && sidebarMode === 'ASSEMBLY' ? '시스템 카테고리' : '상품리스트'}
                        </div>
                        <div className="w-8"></div>
                    </div>
                    <div className="flex-1 overflow-y-auto scrollbar-hide">
                        {activeGridData.length === 0 ? (
                            <div className="h-60 flex flex-col items-center justify-center text-gray-400 gap-3">
                                <Box size={32} className="opacity-20" />
                                <p className="text-xs">해당되는 상품이 없습니다.</p>
                            </div>
                        ) : (
                            activeGridData.map((row, idx) => {
                                const isSelected = selectedNodeId === row.id;
                                return (
                                    <div
                                        key={row.id}
                                        onClick={() => setSelectedNodeId(row.id)}
                                        className="flex items-center px-4 py-3.5 border-b cursor-pointer transition-all duration-200"
                                        style={{
                                            background: isSelected ? 'var(--theme-primary-bg)' : 'transparent',
                                            borderLeft: isSelected ? '3px solid var(--theme-primary)' : '3px solid transparent',
                                            borderBottomColor: isSelected ? 'var(--theme-primary-bg)' : '#f9fafb',
                                        }}
                                    >
                                        <div className="w-10 text-center text-xs font-bold" style={{ color: isSelected ? 'var(--theme-primary)' : '#9ca3af' }}>{idx + 1}</div>
                                        <div className="flex-1 pl-3 min-w-0">
                                            <div className="text-sm font-medium truncate" style={{ color: isSelected ? 'var(--theme-primary)' : '#374151', fontWeight: isSelected ? 700 : 500 }}>{row.path}</div>
                                        </div>
                                        <div className="w-8 flex justify-center">
                                            {isSelected && <ChevronRight size={16} style={{ color: 'var(--theme-primary)' }} />}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* RIGHT Column: Cost Management */}
                <div className="flex-1 bg-white flex flex-col min-w-0">
                    {/* Column Header - aligned */}
                    <div className="bg-gray-50/80 border-b border-gray-200 flex items-center px-5 h-[42px]">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                            {hasAssemblySupport && sidebarMode === 'ASSEMBLY' ? '조립비 판매단가 설정' : '원가 기반 판매단가 설정'}
                        </span>
                    </div>

                    {hasAssemblySupport && sidebarMode === 'ASSEMBLY' ? (
                        /* ========= ASSEMBLY MODE RIGHT PANEL ========= */
                        <>
                            {/* Bulk Action Bar */}
                            <div className="bg-gray-50 border-b border-gray-200 p-4">
                                <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
                                    <span className="text-xs font-bold text-gray-500 pl-2">일괄 적용:</span>
                                    <input
                                        type="number"
                                        placeholder="마진(%)"
                                        className="w-20 px-2 py-1.5 bg-gray-50 border border-gray-200 rounded text-xs font-bold text-center outline-none focus:border-blue-500 transition-colors"
                                        value={bulkMargin}
                                        onChange={(e) => setBulkMargin(e.target.value)}
                                    />
                                    <span className="text-xs text-gray-400">%</span>
                                    <button
                                        onClick={() => {
                                            if (!bulkMargin) return;
                                            const newMargins: Record<string, string> = {};
                                            assemblyItems.forEach(item => { newMargins[item.id] = bulkMargin; });
                                            setAssemblyEditingMargins(prev => ({ ...prev, ...newMargins }));
                                        }}
                                        disabled={assemblyItems.length === 0 || !bulkMargin}
                                        className="ml-auto px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-xs font-bold rounded flex items-center gap-1 transition-all"
                                    >
                                        <CheckCircle2 size={12} /> 적용
                                    </button>
                                    <div className="ml-auto flex gap-2">
                                        <button
                                            onClick={() => {
                                                const gradeDef = gradeMargins.find(g => g.grade === selectedGrade);
                                                const defaultMargin = gradeDef?.margin || '0';
                                                const reset: Record<string, string> = {};
                                                assemblyItems.forEach(item => { reset[item.id] = defaultMargin; });
                                                setAssemblyEditingMargins(reset);
                                            }}
                                            className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded text-xs font-bold transition-colors"
                                        >
                                            <RotateCcw size={14} /> 초기화
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (!selectedNodeId) return;
                                                // Save assembly sales prices
                                                const assemblyPriceData: Record<string, any> = {};
                                                const targetsToSave = selectedGrade === 'ALL' ? ['ALL'] : (checkedTargets.size > 0 ? Array.from(checkedTargets) : [selectedGrade]);
                                                assemblyItems.forEach(item => {
                                                    const margin = assemblyEditingMargins[item.id] || '0';
                                                    const price = calculatePrice(item.standardCost, margin);
                                                    assemblyPriceData[item.id] = {};
                                                    targetsToSave.forEach(targetId => {
                                                        assemblyPriceData[item.id][targetId] = {
                                                            margin, price: price.toString(), updatedAt: new Date().toISOString()
                                                        };
                                                    });
                                                });
                                                setNodes(prev => ({
                                                    ...prev,
                                                    [selectedNodeId]: {
                                                        ...prev[selectedNodeId],
                                                        attributes: {
                                                            ...prev[selectedNodeId].attributes,
                                                            sales_price_assembly: JSON.stringify(assemblyPriceData)
                                                        }
                                                    }
                                                }));
                                                alert('조립비 판매단가가 저장되었습니다.');
                                            }}
                                            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold shadow-md transition-all"
                                        >
                                            <Save size={14} /> 저장
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Assembly Items - 시스템 트리 박스 형태 */}
                            <div className="flex-1 overflow-y-auto p-5 scrollbar-hide">
                                {!selectedNodeId ? (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-4">
                                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                                            <Hammer size={32} className="opacity-30" />
                                        </div>
                                        <p className="font-medium text-sm text-center">좌측 목록에서<br />시스템을 선택해주세요.</p>
                                    </div>
                                ) : (() => {
                                    // 선택된 노드의 시스템 트리를 박스 형태로 렌더링
                                    const getSysChildren = (nid: string): NodeData[] => {
                                        const n = nodes[nid]; if (!n) return [];
                                        let cids = Array.isArray(n.childrenIds) ? [...n.childrenIds] : [];
                                        if (cids.length === 0 && n.attributes?.originalSourceId) {
                                            const s = nodes[n.attributes.originalSourceId];
                                            if (s?.childrenIds) cids = [...s.childrenIds];
                                        }
                                        if (n.sourceIds && Array.isArray(n.sourceIds)) {
                                            for (const srcId of n.sourceIds) {
                                                const src = nodes[srcId];
                                                if (src?.childrenIds) cids.push(...src.childrenIds);
                                            }
                                        }
                                        return [...new Set(cids)].map(id => nodes[id]).filter(Boolean);
                                    };

                                    // 원가 맵 파싱
                                    const selNode = nodes[selectedNodeId];
                                    let costMap: Record<string, { price: string; unit: string }> = {};
                                    try {
                                        const saved = selNode?.attributes?.cost_assembly_list;
                                        if (saved) { const p = JSON.parse(saved); if (typeof p === 'object' && p) costMap = p; }
                                    } catch { }

                                    const getCost = (nid: string): { price: number; unit: string } | null => {
                                        const d = costMap[nid];
                                        if (d?.price) return { price: parseFloat(d.price.replace(/,/g, '') || '0'), unit: d.unit || '건' };
                                        const n = nodes[nid];
                                        if (n?.attributes?.originalSourceId) {
                                            const s = costMap[n.attributes.originalSourceId];
                                            if (s?.price) return { price: parseFloat(s.price.replace(/,/g, '') || '0'), unit: s.unit || '건' };
                                        }
                                        return null;
                                    };

                                    const gradeDef = gradeMargins.find(g => g.grade === selectedGrade);
                                    const defaultMargin = gradeDef?.margin || '0';

                                    // 시스템별 카드 박스로 렌더링
                                    const renderSystemBox = (systemNodeId: string): React.ReactNode => {
                                        const sysNode = nodes[systemNodeId]; if (!sysNode) return null;
                                        const sysChildren = getSysChildren(systemNodeId);

                                        // 중간 카테고리 + 리프 렌더링
                                        const renderItem = (nodeId: string, depth: number): React.ReactNode => {
                                            const node = nodes[nodeId]; if (!node) return null;
                                            const children = getSysChildren(nodeId);
                                            const hasChildren = children.length > 0;
                                            const costInfo = getCost(nodeId);
                                            const cost = costInfo?.price || 0;
                                            const currentMargin = assemblyEditingMargins[nodeId] || defaultMargin;
                                            const salesPrice = calculatePrice(cost, currentMargin);
                                            const isModified = currentMargin !== defaultMargin;
                                            const indent = depth * 24;

                                            if (hasChildren) {
                                                // 중간 그룹 (방향, 손잡이, 라단바 등)
                                                return (
                                                    <div key={nodeId}>
                                                        <div className="flex items-center py-2 px-3 bg-gray-50/80 border-b border-gray-100">
                                                            <div style={{ width: indent }} className="flex-shrink-0" />
                                                            <div className="w-2.5 h-2.5 rounded-full bg-purple-400 mr-2 flex-shrink-0" />
                                                            <span className="text-xs font-bold text-gray-700 flex-1">{node.label}</span>
                                                            <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{children.length}</span>
                                                            {cost > 0 && (
                                                                <>
                                                                    <span className="text-[10px] font-mono text-gray-500 w-16 text-right">{cost.toLocaleString()}</span>
                                                                    <input type="number" value={currentMargin} onChange={(e) => handleAssemblyMarginChange(nodeId, e.target.value)}
                                                                        className={`w-14 ml-2 border rounded px-1 py-0.5 text-right text-[10px] font-bold outline-none focus:border-blue-500 ${isModified ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-white text-gray-800 border-gray-200'}`}
                                                                    />
                                                                    <span className="text-[10px] text-gray-400 ml-0.5">%</span>
                                                                    <span className="text-[10px] font-bold text-blue-600 w-16 text-right font-mono ml-2">{salesPrice.toLocaleString()}</span>
                                                                </>
                                                            )}
                                                        </div>
                                                        {children.map(c => renderItem(c.id, depth + 1))}
                                                    </div>
                                                );
                                            }

                                            // 리프 노드 (좌, 우, 우드, 크리스탈 등)
                                            return (
                                                <div key={nodeId} className={`flex items-center py-2 px-3 border-b border-gray-50 transition-all ${isModified ? 'bg-blue-50/40' : cost > 0 ? 'hover:bg-gray-50/50' : 'bg-gray-50/30'}`}>
                                                    <div style={{ width: indent }} className="flex-shrink-0" />
                                                    <div className={`w-2 h-2 rounded-full mr-2 flex-shrink-0 ${cost > 0 ? 'bg-blue-400' : 'bg-gray-300'}`} />
                                                    <span className={`text-xs flex-1 truncate ${cost > 0 ? 'text-gray-700' : 'text-gray-400'}`}>{node.label}</span>
                                                    <span className={`text-[10px] font-mono w-16 text-right ${cost > 0 ? 'text-gray-600' : 'text-gray-300'}`}>{cost > 0 ? cost.toLocaleString() : '-'}</span>
                                                    {cost > 0 ? (
                                                        <>
                                                            <input type="number" value={currentMargin} onChange={(e) => handleAssemblyMarginChange(nodeId, e.target.value)}
                                                                className={`w-14 ml-2 border rounded px-1 py-0.5 text-right text-[10px] font-bold outline-none focus:border-blue-500 ${isModified ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-white text-gray-800 border-gray-200'}`}
                                                            />
                                                            <span className="text-[10px] text-gray-400 ml-0.5">%</span>
                                                            <span className="text-[10px] font-bold w-16 text-right font-mono ml-2 text-blue-600">{salesPrice.toLocaleString()}</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <span className="w-14 ml-2 text-center text-[10px] text-gray-300">-</span>
                                                            <span className="text-[10px] text-gray-300 ml-0.5"> </span>
                                                            <span className="text-[10px] text-gray-300 w-16 text-right ml-2">-</span>
                                                        </>
                                                    )}
                                                </div>
                                            );
                                        };

                                        return (
                                            <div key={systemNodeId} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm mb-4">
                                                {/* 시스템 박스 헤더 */}
                                                {(() => {
                                                    const sysCostInfo = getCost(systemNodeId);
                                                    const sysCost = sysCostInfo?.price || 0;
                                                    const sysMargin = assemblyEditingMargins[systemNodeId] || defaultMargin;
                                                    const sysSalesPrice = calculatePrice(sysCost, sysMargin);
                                                    const sysIsModified = sysMargin !== defaultMargin;
                                                    return (
                                                        <div className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-50 to-white border-b border-purple-100">
                                                            <ChevronDown size={16} className="text-purple-500" />
                                                            <span className="text-sm font-bold text-purple-700">{sysNode.label}</span>
                                                            <span className="text-[10px] text-purple-400 bg-purple-100 px-1.5 py-0.5 rounded-full font-bold">{sysChildren.length}</span>
                                                            <div className="flex-1" />
                                                            {/* 컬럼 헤더 or 시스템 자체 원가/마진/판매가 */}
                                                            {sysCost > 0 ? (
                                                                <>
                                                                    <span className="text-[10px] font-mono text-purple-500 w-16 text-right font-bold">{sysCost.toLocaleString()}</span>
                                                                    <input type="number" value={sysMargin} onChange={(e) => handleAssemblyMarginChange(systemNodeId, e.target.value)}
                                                                        className={`w-14 ml-2 border rounded px-1 py-0.5 text-right text-[10px] font-bold outline-none focus:border-purple-500 ${sysIsModified ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-white text-gray-800 border-gray-200'}`}
                                                                    />
                                                                    <span className="text-[10px] text-purple-400 ml-0.5">%</span>
                                                                    <span className="text-[10px] font-bold text-purple-600 w-16 text-right font-mono ml-2">{sysSalesPrice.toLocaleString()}</span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <span className="text-[9px] font-bold text-gray-400 uppercase w-16 text-right">원가</span>
                                                                    <span className="text-[9px] font-bold text-gray-400 uppercase w-[70px] text-center">마진</span>
                                                                    <span className="text-[9px] font-bold text-gray-400 uppercase w-16 text-right">판매가</span>
                                                                </>
                                                            )}
                                                        </div>
                                                    );
                                                })()}
                                                {/* 시스템 내용 */}
                                                <div>
                                                    {sysChildren.map(c => renderItem(c.id, 0))}
                                                </div>
                                            </div>
                                        );
                                    };

                                    // 선택된 노드에서 시스템 트리 시작
                                    const topChildren = getSysChildren(selectedNodeId);
                                    if (topChildren.length === 0) {
                                        return (
                                            <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-4">
                                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                                                    <Hammer size={32} className="opacity-30" />
                                                </div>
                                                <p className="font-medium text-sm text-center">해당 시스템에<br />조립 항목이 없습니다.</p>
                                            </div>
                                        );
                                    }

                                    // 시스템 레벨 구분
                                    const hasSystemLevelChildren = topChildren.some(c => getSysChildren(c.id).length > 0);

                                    return (
                                        <div>
                                            <div className="flex items-center gap-2 mb-4 px-1">
                                                <Hammer size={16} className="text-purple-500" />
                                                <span className="text-sm font-bold text-gray-700">시스템 별 조립 옵션 리스트</span>
                                                <span className="text-xs text-purple-500 bg-purple-50 px-2 py-0.5 rounded-full font-bold">{nodes[selectedNodeId]?.label || ''}</span>
                                            </div>
                                            {hasSystemLevelChildren ? (
                                                topChildren.map(c => renderSystemBox(c.id))
                                            ) : (
                                                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                                    <div className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-50 to-white border-b border-purple-100">
                                                        <span className="text-sm font-bold text-purple-700">{nodes[selectedNodeId]?.label}</span>
                                                        <div className="flex-1" />
                                                        <span className="text-[9px] font-bold text-gray-400 uppercase w-16 text-right">원가</span>
                                                        <span className="text-[9px] font-bold text-gray-400 uppercase w-[70px] text-center">마진</span>
                                                        <span className="text-[9px] font-bold text-gray-400 uppercase w-16 text-right">판매가</span>
                                                    </div>
                                                    {topChildren.map(c => {
                                                        const renderLeafItem = (nodeId: string, depth: number): React.ReactNode => {
                                                            const node = nodes[nodeId]; if (!node) return null;
                                                            const children = getSysChildren(nodeId);
                                                            const costInfo = getCost(nodeId);
                                                            const cost = costInfo?.price || 0;
                                                            const margin = assemblyEditingMargins[nodeId] || defaultMargin;
                                                            const price = calculatePrice(cost, margin);
                                                            const mod = margin !== defaultMargin;
                                                            const indent = depth * 24;
                                                            if (children.length > 0) {
                                                                return (
                                                                    <div key={nodeId}>
                                                                        <div className="flex items-center py-2 px-3 bg-gray-50/80 border-b border-gray-100">
                                                                            <div style={{ width: indent }} className="flex-shrink-0" />
                                                                            <div className="w-2.5 h-2.5 rounded-full bg-purple-400 mr-2 flex-shrink-0" />
                                                                            <span className="text-xs font-bold text-gray-700 flex-1">{node.label}</span>
                                                                        </div>
                                                                        {children.map(ch => renderLeafItem(ch.id, depth + 1))}
                                                                    </div>
                                                                );
                                                            }
                                                            return (
                                                                <div key={nodeId} className={`flex items-center py-2 px-3 border-b border-gray-50 ${mod ? 'bg-blue-50/30' : 'hover:bg-gray-50/50'}`}>
                                                                    <div style={{ width: indent }} className="flex-shrink-0" />
                                                                    <div className={`w-2 h-2 rounded-full mr-2 flex-shrink-0 ${cost > 0 ? 'bg-blue-400' : 'bg-gray-300'}`} />
                                                                    <span className="text-xs text-gray-700 flex-1 truncate">{node.label}</span>
                                                                    <span className={`text-[10px] font-mono w-16 text-right ${cost > 0 ? 'text-gray-600' : 'text-gray-300'}`}>{cost > 0 ? cost.toLocaleString() : '-'}</span>
                                                                    <input type="number" value={margin} onChange={(e) => handleAssemblyMarginChange(nodeId, e.target.value)}
                                                                        className={`w-14 ml-2 border rounded px-1 py-0.5 text-right text-[10px] font-bold outline-none focus:border-blue-500 ${mod ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-white text-gray-800 border-gray-200'}`}
                                                                    />
                                                                    <span className="text-[10px] text-gray-400 ml-0.5">%</span>
                                                                    <span className={`text-[10px] font-bold w-16 text-right font-mono ml-2 ${price > 0 ? 'text-blue-600' : 'text-gray-300'}`}>{price > 0 ? price.toLocaleString() : '-'}</span>
                                                                </div>
                                                            );
                                                        };
                                                        return renderLeafItem(c.id, 0);
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}
                            </div>
                        </>
                    ) : (
                        /* ========= PRODUCT MODE RIGHT PANEL (existing) ========= */
                        <>
                            {/* Cost List Header & Bulk Actions */}
                            <div className="bg-gray-50 border-b border-gray-200 p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-4 h-4 rounded border flex items-center justify-center cursor-pointer flex-shrink-0"
                                            style={{
                                                background: (allCostItems.length > 0 && checkedItems.size === allCostItems.length) ? 'var(--theme-primary)' : 'white',
                                                borderColor: (allCostItems.length > 0 && checkedItems.size === allCostItems.length) ? 'var(--theme-primary)' : '#d1d5db',
                                                color: 'white',
                                            }}
                                            onClick={() => handleSelectAllItems(!(allCostItems.length > 0 && checkedItems.size === allCostItems.length))}
                                        >
                                            {(allCostItems.length > 0 && checkedItems.size === allCostItems.length) && <Check size={11} strokeWidth={3} />}
                                        </div>
                                        <span className="text-xs font-bold text-gray-600">전체 선택 ({allCostItems.length})</span>
                                    </div>
                                    <div className="text-xs text-gray-400">
                                        선택됨: <span className="font-bold" style={{ color: 'var(--theme-primary)' }}>{checkedItems.size}</span>
                                    </div>
                                </div>

                                {/* Bulk Action Bar */}
                                <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
                                    <span className="text-xs font-bold text-gray-500 pl-2">일괄 적용:</span>
                                    <input
                                        type="number"
                                        placeholder="마진(%)"
                                        className="w-20 px-2 py-1.5 bg-gray-50 border border-gray-200 rounded text-xs font-bold text-center outline-none focus:border-blue-500 transition-colors"
                                        value={bulkMargin}
                                        onChange={(e) => setBulkMargin(e.target.value)}
                                    />
                                    <span className="text-xs text-gray-400">%</span>
                                    <button
                                        onClick={handleBulkApply}
                                        disabled={checkedItems.size === 0 || !bulkMargin}
                                        className="ml-auto px-3 py-1.5 text-white text-xs font-bold rounded flex items-center gap-1 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                        style={{ background: 'var(--theme-primary)' }}
                                        onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                                        onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                                    >
                                        <CheckCircle2 size={12} /> 적용
                                    </button>
                                    <div className="ml-auto flex gap-2">
                                        <button
                                            onClick={handleBatchReset}
                                            className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded text-xs font-bold transition-colors"
                                        >
                                            <RotateCcw size={14} /> 초기화
                                        </button>
                                        <button
                                            onClick={handleSave}
                                            className="flex items-center gap-1 px-3 py-1.5 text-white rounded text-xs font-bold shadow-md transition-all"
                                            style={{ background: 'var(--theme-primary)' }}
                                            onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                                            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                                        >
                                            <Save size={14} /> 저장
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Cost List - Unified */}
                            <div className="flex-1 overflow-y-auto p-6 scrollbar-hide space-y-8">
                                {allCostItems.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-4">
                                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                                            {selectedGrade === 'ALL' ? <BarChart3 size={32} className="opacity-30" /> : <Box size={32} className="opacity-30" />}
                                        </div>
                                        <p className="font-medium text-sm text-center">
                                            {selectedGrade === 'ALL'
                                                ? <>등급을 선택하여<br />단가를 설정하세요.</>
                                                : <>좌측 목록에서<br />상품을 선택해주세요.</>}
                                        </p>
                                    </div>
                                ) : (
                                    TABS.map(tab => {
                                        const items = effectiveCostItems[tab.id as keyof typeof effectiveCostItems] || [];
                                        if (items.length === 0) return null;

                                        return (
                                            <div key={tab.id} className="space-y-4">
                                                <div className="flex items-center gap-2 pb-2 border-b border-gray-200 sticky top-0 bg-white z-10 pt-2">
                                                    <div className="p-1.5 rounded-lg" style={{ background: 'var(--theme-primary-bg)', color: 'var(--theme-primary)' }}>
                                                        <tab.icon size={16} />
                                                    </div>
                                                    <h3 className="font-bold text-gray-700">{tab.label} 표준원가</h3>
                                                    <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{items.length}</span>
                                                </div>

                                                <div className="grid gap-3">
                                                    {items.map((item: any, idx: number) => {
                                                        // Item Rendering Logic
                                                        let stdPrice = 0;
                                                        let rollCost = 0;
                                                        let cutCost = 0;
                                                        let cutMeterCost = 0;
                                                        let specLabel = '';

                                                        if (tab.id === 'FABRIC') {
                                                            const isSlat = item.category === 'SLAT';
                                                            // If SLAT, use rollPrice as Standard Price
                                                            stdPrice = parseFloat((isSlat ? item.rollPrice : item.meterPrice)?.replace(/,/g, '') || '0');

                                                            rollCost = parseFloat(item.rollPrice?.replace(/,/g, '') || '0');
                                                            cutCost = parseFloat(item.cuttingPrice?.replace(/,/g, '') || '0');
                                                            cutMeterCost = parseFloat(item.cuttingMeterPrice?.replace(/,/g, '') || '0');
                                                            specLabel = item.category === 'SLAT' ? `${item.width} | ${item.height}` : `${item.width}cm`;
                                                        } else {
                                                            stdPrice = parseFloat(item.standardPrice?.replace(/,/g, '') || '0');
                                                            specLabel = item.category ? item.category : `${item.minWidth}~${item.maxWidth}`;
                                                        }

                                                        const gradeDef = gradeMargins.find(g => g.grade === selectedGrade);
                                                        const defaultMargin = gradeDef?.margin || '0';
                                                        const currentMargin = editingMargins[item.id] || defaultMargin;

                                                        const salesPrice = calculatePrice(stdPrice, currentMargin);
                                                        const salesRoll = calculatePrice(rollCost, currentMargin);
                                                        const salesCut = calculatePrice(cutCost, currentMargin);
                                                        const salesCutMeter = calculatePrice(cutMeterCost, currentMargin);

                                                        const isModified = currentMargin !== defaultMargin;
                                                        const isChecked = checkedItems.has(item.id);

                                                        return (
                                                            <div
                                                                className="bg-white rounded-xl p-4 border transition-all relative"
                                                                style={{
                                                                    borderColor: isModified ? 'var(--theme-primary)' : '#e5e7eb',
                                                                    boxShadow: isModified ? '0 0 0 1px var(--theme-primary-bg)' : 'none',
                                                                }}
                                                            >
                                                                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                                                                    <div
                                                                        className="w-4 h-4 rounded border flex items-center justify-center cursor-pointer flex-shrink-0"
                                                                        style={{
                                                                            background: isChecked ? 'var(--theme-primary)' : 'white',
                                                                            borderColor: isChecked ? 'var(--theme-primary)' : '#d1d5db',
                                                                            color: 'white',
                                                                        }}
                                                                        onClick={() => handleItemToggle(item.id)}
                                                                    >
                                                                        {isChecked && <Check size={11} strokeWidth={3} />}
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-6 pl-8">
                                                                    {/* Spec Info */}
                                                                    <div className="w-32">
                                                                        <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Specification</span>
                                                                        <span className="text-sm font-bold text-gray-700 truncate block" title={specLabel}>{specLabel}</span>
                                                                        {item.category === 'ROLL' && tab.id === 'FABRIC' && (
                                                                            <span className="text-[10px] text-gray-400 block mt-1">m 단가</span>
                                                                        )}
                                                                    </div>

                                                                    {/* Standard Cost */}
                                                                    <div className="flex-1 text-right border-r border-gray-100 pr-6">
                                                                        <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">표준원가 (Cost)</span>
                                                                        <div className="flex flex-col gap-1 items-end">
                                                                            <span className="text-sm font-medium text-gray-600 font-mono">{stdPrice.toLocaleString()}원</span>
                                                                            {tab.id === 'FABRIC' && item.category === 'ROLL' && (
                                                                                <>
                                                                                    <div className="flex justify-end items-center gap-1 text-[10px] text-gray-400">
                                                                                        <span>절단:</span>
                                                                                        <span className="font-mono">{cutCost.toLocaleString()}</span>
                                                                                    </div>
                                                                                    {cutMeterCost > 0 && (
                                                                                        <div className="flex justify-end items-center gap-1 text-[10px] text-gray-400">
                                                                                            <span>절단m:</span>
                                                                                            <span className="font-mono">{cutMeterCost.toLocaleString()}</span>
                                                                                        </div>
                                                                                    )}
                                                                                </>
                                                                            )}
                                                                        </div>
                                                                    </div>

                                                                    {/* Margin Input */}
                                                                    <div className="w-32">
                                                                        <div className="flex justify-between items-baseline mb-1">
                                                                            <label className="text-[10px] font-bold uppercase" style={{ color: 'var(--theme-primary)' }}>마진율</label>
                                                                            {isModified && (
                                                                                <span className="text-[9px] text-gray-400">
                                                                                    (기본 {defaultMargin}%)
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <div className="relative">
                                                                            <input
                                                                                type="number"
                                                                                value={currentMargin}
                                                                                onChange={(e) => handleMarginChange(item.id, e.target.value)}
                                                                                className="w-full border rounded-lg pl-3 pr-8 py-1.5 text-right font-bold outline-none transition-colors"
                                                                                style={{
                                                                                    background: isModified ? 'var(--theme-primary-bg)' : 'white',
                                                                                    color: isModified ? 'var(--theme-primary)' : '#1f2937',
                                                                                    borderColor: isModified ? 'var(--theme-primary)' : '#e5e7eb',
                                                                                }}
                                                                                onFocus={e => e.currentTarget.style.borderColor = 'var(--theme-primary)'}
                                                                                onBlur={e => e.currentTarget.style.borderColor = isModified ? 'var(--theme-primary)' : '#e5e7eb'}
                                                                            />
                                                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none font-bold">%</span>
                                                                        </div>
                                                                    </div>

                                                                    {/* Arrow */}
                                                                    <div className="text-gray-300">
                                                                        <ChevronRight size={16} />
                                                                    </div>

                                                                    {/* Sales Price */}
                                                                    <div className="w-40 text-right pl-2">
                                                                        <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">판매단가 (Price)</span>
                                                                        <div className="flex flex-col items-end gap-1">
                                                                            <div className="flex items-end justify-end gap-1">
                                                                                <span className="text-lg font-bold font-mono" style={{ color: 'var(--theme-primary)' }}>{salesPrice.toLocaleString()}</span>
                                                                                <span className="text-xs text-gray-400 mb-1">원</span>
                                                                            </div>
                                                                            {tab.id === 'FABRIC' && item.category === 'ROLL' && (
                                                                                <>
                                                                                    <div className="flex justify-end items-center gap-1 text-[10px]" style={{ color: 'var(--theme-primary)', opacity: 0.7 }}>
                                                                                        <span>절단:</span>
                                                                                        <span className="font-mono font-bold">{salesCut.toLocaleString()}</span>
                                                                                    </div>
                                                                                    {cutMeterCost > 0 && (
                                                                                        <div className="flex justify-end items-center gap-1 text-[10px]" style={{ color: 'var(--theme-primary)', opacity: 0.7 }}>
                                                                                            <span>절단m:</span>
                                                                                            <span className="font-mono font-bold">{salesCutMeter.toLocaleString()}</span>
                                                                                        </div>
                                                                                    )}
                                                                                </>
                                                                            )}
                                                                        </div>
                                                                        {!(tab.id === 'FABRIC' && item.category === 'ROLL') && (
                                                                            <span className="text-[9px] text-gray-300 block mt-0.5">100원 단위 반올림</span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SalesPriceManagement;
