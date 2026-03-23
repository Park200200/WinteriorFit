import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { NodeData, UserRole } from '../types';
import { CostTab, FabricCostItem, CuttingCostItem, MeasureCostItem, PartCostItem, BomItem, MeasureUnit } from './StandardCost.types';
import { createTreeHelper, formatNumber, parseNumber, roundToHundreds, CATEGORY_OPTIONS, MEASURE_CATEGORY_OPTIONS, MEASURE_UNIT_OPTIONS } from './StandardCost.helpers';

export const useStandardCostData = (
    nodes: Record<string, NodeData>,
    activeTab: CostTab,
    rootId: string | undefined,
    systemRootId: string | undefined,
    role: UserRole | undefined,
    selectedNodeId: string | null
) => {
    // 1. Determine Effective Root (System vs Product)
    const currentRootId = useMemo(() => {
        console.log('[StandardCost:Hook] Calculating currentRootId', { rootId, systemRootId, activeTab, role });

        const allNodes = Object.values(nodes) as NodeData[];

        // 1. Determine Desired Tree Type
        let desiredType: 'system' | 'standard' | 'measure' | 'laundry' = 'standard';

        // For Fabric/Cutting, we typically use the main Product Tree (Standard)
        if (activeTab === 'ASSEMBLY') {
            desiredType = 'system';

            // PRIORITY 1: Use systemRootId if provided
            if (systemRootId && nodes[systemRootId]) {
                return systemRootId;
            }

            // PRIORITY 1.3: ADMIN – use global system tree (no partnerId)
            if (role === UserRole.ADMIN) {
                // 1순위: 알려진 마스터 시스템 루트 직접 확인
                if (nodes['root-1770804399939']) return 'root-1770804399939';
                // 2순위: label='시스템' 비-파트너 ROOT 중 자식 가장 많은 것
                const adminCandidates = allNodes
                    .filter(n =>
                        n.type === 'ROOT' &&
                        (n.label === '시스템' || n.attributes?.treeType === 'system') &&
                        !n.attributes?.partnerId
                    )
                    .sort((a, b) => (b.childrenIds?.length ?? 0) - (a.childrenIds?.length ?? 0));
                if (adminCandidates.length > 0) return adminCandidates[0].id;
            }

            // PRIORITY 1.5: Look for Partner System Tree
            let potentialPartnerId = '';
            if (rootId && rootId.startsWith('root-partner-')) {
                potentialPartnerId = rootId.replace('root-partner-', '');
            } else if (role === 'DISTRIBUTOR') potentialPartnerId = 'd1';
            else if (role === 'MANUFACTURER') potentialPartnerId = 'm1';

            if (potentialPartnerId) {
                const partnerSystemRootId = `root-1770804399939-partner-${potentialPartnerId}`;
                if (nodes[partnerSystemRootId]) {
                    return partnerSystemRootId;
                }
            }

            // PRIORITY 2: Look for global system tree
            const globalSystemRoots = allNodes.filter(n =>
                n.type === 'ROOT' &&
                n.label === '시스템' &&
                !n.attributes?.partnerId // Global tree has no partnerId
            );

            if (globalSystemRoots.length > 0) {
                const sortedRoots = globalSystemRoots.sort((a, b) =>
                    (b.childrenIds?.length || 0) - (a.childrenIds?.length || 0)
                );
                const globalRoot = sortedRoots[0];
                if (globalRoot && globalRoot.childrenIds && globalRoot.childrenIds.length > 0) {
                    return globalRoot.id;
                }
            }
        }
        else if (activeTab === 'MEASURE') desiredType = 'measure';

        // 2. Direct Validation
        if (rootId && nodes[rootId]) {
            const node = nodes[rootId];
            if (desiredType === 'standard' && (node.type === 'ROOT' || node.attributes?.nodeType === 'root')) {
                return rootId;
            }
            if (node.attributes?.treeType === desiredType) {
                return rootId;
            }
        }

        // 3. Partner ID Extraction & Lookup
        let partnerId: string | undefined = undefined;
        if (rootId && nodes[rootId]) {
            partnerId = nodes[rootId].attributes?.partnerId;
        }
        if (!partnerId && rootId && rootId.startsWith('root-partner-')) {
            partnerId = rootId.replace('root-partner-', '');
        }
        if (!partnerId && rootId && rootId.startsWith('root-')) {
            const parts = rootId.split('-');
            if (parts.length === 2 && parts[1] && !['system', 'measure', 'laundry'].includes(parts[1])) {
                partnerId = parts[1];
            }
            else if (parts.length >= 4 && parts[2] === 'partner') {
                partnerId = parts[3];
            }
        }

        // 4. Look up specific tree for the partner
        if (partnerId) {
            if (activeTab === 'MEASURE') {
                const directMeasureId = `root-${partnerId}-measure`;
                if (nodes[directMeasureId]) {
                    return directMeasureId;
                }
            }
            const partnerTree = allNodes.find(n =>
                n.type === 'ROOT' &&
                n.attributes?.partnerId === partnerId &&
                n.attributes?.treeType === desiredType
            );
            if (partnerTree) {
                return partnerTree.id;
            }
        }

        // 5. Fallbacks
        if (activeTab === 'ASSEMBLY') {
            const hqSystemRoot = allNodes.find(n =>
                n.type === 'ROOT' &&
                (n.attributes?.treeType === 'system' || n.label === '시스템' || n.label === 'System') &&
                !n.attributes?.partnerId
            );
            if (hqSystemRoot) return hqSystemRoot.id;
            const anySystem = allNodes.find(n => n.type === 'ROOT' && (n.label.includes('시스템') || n.label.includes('System')));
            if (anySystem) return anySystem.id;
            return 'root-1768364888562';
        }

        const finalRootId = (rootId && nodes[rootId]) ? rootId : 'root';
        console.log('[StandardCost:Hook] determined currentRootId:', finalRootId);
        return finalRootId;
    }, [activeTab, nodes, rootId, systemRootId, role]);

    const isCategoryLike = useCallback((n: NodeData | undefined) => {
        if (!n) return false;
        return n.type === 'CATEGORY' || n.type === 'REFERENCE' || n.attributes?.nodeType === 'category' || n.attributes?.nodeType === 'species' || n.attributes?.nodeType === 'item';
    }, []);

    const globalSystemContext = useMemo(() => {
        const rootNode = nodes[currentRootId];
        let excludedIds: string[] = [];
        let virtualMap: Record<string, string[]> = {};

        if (rootNode?.attributes) {
            try {
                const excluded = typeof rootNode.attributes.excludedIds === 'string' ? JSON.parse(rootNode.attributes.excludedIds) : rootNode.attributes.excludedIds;
                if (Array.isArray(excluded)) excludedIds.push(...excluded);

                const disconnected = typeof rootNode.attributes.disconnectedIds === 'string' ? JSON.parse(rootNode.attributes.disconnectedIds) : rootNode.attributes.disconnectedIds;
                if (Array.isArray(disconnected)) excludedIds.push(...disconnected);
            } catch (e) { }
            try {
                const vMap = typeof rootNode.attributes.virtualChildMap === 'string' ? JSON.parse(rootNode.attributes.virtualChildMap) : rootNode.attributes.virtualChildMap;
                if (vMap) virtualMap = vMap;
            } catch (e) { }
        }
        return { excludedIds, virtualMap };
    }, [nodes, currentRootId]);

    const treeHelper = useMemo(() => {
        let pid = undefined;
        if (role === UserRole.FABRIC_SUPPLIER) pid = 'f1';
        else if (role === UserRole.DISTRIBUTOR) pid = 'd1';
        else if (role === UserRole.MANUFACTURER) pid = 'm1';

        return createTreeHelper(nodes, activeTab, {
            currentRootId,
            partnerId: pid,
            globalExcludedIds: globalSystemContext.excludedIds,
            systemVirtualMap: globalSystemContext.virtualMap
        });
    }, [nodes, activeTab, currentRootId, role, globalSystemContext]);

    const categories = useMemo(() => {
        return treeHelper.getChildren(currentRootId);
    }, [treeHelper, currentRootId, activeTab]);

    const systemVirtualMap = useMemo(() => {
        const roots = (Object.values(nodes) as NodeData[]).filter(n => n.type === 'ROOT' && n.attributes?.virtualChildMap);
        let merged: Record<string, string[]> = {};
        roots.forEach(r => {
            try {
                const map = JSON.parse(r.attributes!.virtualChildMap!);
                merged = { ...merged, ...map };
            } catch (e) { }
        });
        return merged;
    }, [nodes]);

    // Find the top-level Category (e.g. Wood, Roll) for the selected product
    const linkedSystemCategory = useMemo(() => {
        if (!selectedNodeId) return null;
        console.log('[StandardCost:Hook] Finding linkedSystemCategory for:', selectedNodeId);
        const curr = nodes[selectedNodeId];
        if (!curr) return null;

        // Assembly Tab: Return the selected node directly
        if (activeTab === 'ASSEMBLY') {
            return curr;
        }

        // 1. Try to find via System Map by traversing up
        let temp: NodeData | undefined = curr;
        let limit = 20;
        while (temp && limit > 0) {
            limit--;
            const idToMatch = temp.id;
            const originalId = temp.attributes?.originalSourceId;
            if (systemVirtualMap[idToMatch] || (originalId && systemVirtualMap[originalId])) return temp;
            if (!temp.parentId) break;
            temp = nodes[temp.parentId];
        }

        // 2. Fallback: Find ancestor that is a direct child of a standard ROOT
        temp = curr;
        limit = 20;
        while (temp && limit > 0) {
            limit--;
            const parent = temp.parentId ? nodes[temp.parentId] : null;
            if (parent && parent.type === 'ROOT' && parent.label !== '시스템' && parent.label !== '시스템test') {
                // Found the product category (Blind/Curtain)
                return temp;
            }
            if (temp.parentId === 'cat-blind' || temp.parentId === 'cat-curtain') return temp;
            if (!temp.parentId || temp.parentId === 'root') break;
            temp = nodes[temp.parentId];
        }

        return null;
    }, [selectedNodeId, nodes, systemVirtualMap, activeTab]); // Added activeTab dependency

    // Generate all System Paths for the linked category
    const assemblyPaths = useMemo(() => {
        if (!linkedSystemCategory) return [];

        const startNodeIds = systemVirtualMap[linkedSystemCategory.id] ||
            (linkedSystemCategory.attributes?.originalSourceId ? systemVirtualMap[linkedSystemCategory.attributes.originalSourceId] : []);

        if (!startNodeIds || (Array.isArray(startNodeIds) && startNodeIds.length === 0)) return [];

        const paths: string[] = [];

        const traverseSystem = (nid: string, path: string) => {
            const node = nodes[nid];
            if (!node) return;
            const nextPath = path ? `${path} > ${node.label}` : node.label;

            if (!node.childrenIds || node.childrenIds.length === 0) {
                // Leaf node in system tree
                paths.push(`${linkedSystemCategory.label} : ${nextPath}`);
            } else {
                node.childrenIds.forEach(childId => traverseSystem(childId, nextPath));
            }
        };

        startNodeIds.forEach((id: string) => traverseSystem(id, ''));

        return paths;
    }, [linkedSystemCategory, nodes, systemVirtualMap]);

    // Assembly Tab Helper Functions
    const getAssemblySystemChildren = useCallback((nid: string) => {
        const node = nodes[nid];
        if (!node) return [];

        let virtualIds: string[] = [];
        if (systemVirtualMap[nid]) {
            const mapped = systemVirtualMap[nid];
            virtualIds = [...(Array.isArray(mapped) ? mapped : [mapped])];
        }

        if (virtualIds.length > 0) return virtualIds.map(id => nodes[id]).filter(Boolean);

        const systemNode = node.attributes?.originalSourceId ? nodes[node.attributes.originalSourceId] || node : node;
        return (systemNode.childrenIds || []).map(id => nodes[id]).filter(Boolean);
    }, [nodes, systemVirtualMap]);

    return {
        currentRootId,
        treeHelper,
        categories,
        isCategoryLike,
        systemVirtualMap,
        linkedSystemCategory,
        assemblyPaths,
        getAssemblySystemChildren
    };
};

export const useStandardCostSelection = (defaultTab?: CostTab) => {
    const [activeTab, setActiveTab] = useState<CostTab>(defaultTab || 'FABRIC');
    const [searchQuery, setSearchQuery] = useState('');
    const [isTreePopupOpen, setIsTreePopupOpen] = useState(false);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [activeCategoryId, setActiveCategoryId] = useState<string>('');
    const [selectedSubIds, setSelectedSubIds] = useState<string[]>([]);
    const [expandedAssemblyNodes, setExpandedAssemblyNodes] = useState<Set<string>>(new Set());

    const toggleAssemblyNode = useCallback((nodeId: string) => {
        setExpandedAssemblyNodes(prev => {
            const next = new Set(prev);
            if (next.has(nodeId)) next.delete(nodeId);
            else next.add(nodeId);
            return next;
        });
    }, []);

    return {
        activeTab, setActiveTab,
        searchQuery, setSearchQuery,
        isTreePopupOpen, setIsTreePopupOpen,
        selectedNodeId, setSelectedNodeId,
        activeCategoryId, setActiveCategoryId,
        selectedSubIds, setSelectedSubIds,
        expandedAssemblyNodes, setExpandedAssemblyNodes,
        toggleAssemblyNode
    };
};

export const useStandardCostCalculations = (
    activeTab: CostTab,
    selectedNodeId: string | null,
    nodes: Record<string, NodeData>,
    setNodes: React.Dispatch<React.SetStateAction<Record<string, NodeData>>>
) => {
    // --- Local State ---
    const [fabricCosts, setFabricCosts] = useState<FabricCostItem[]>([]);
    const [editForm, setEditForm] = useState<FabricCostItem | null>(null);

    const [cuttingCosts, setCuttingCosts] = useState<CuttingCostItem[]>([]);
    const [cuttingEditForm, setCuttingEditForm] = useState<CuttingCostItem | null>(null);

    const [measureCosts, setMeasureCosts] = useState<MeasureCostItem[]>([]);
    const [measureEditForm, setMeasureEditForm] = useState<MeasureCostItem | null>(null);
    const [measureFormUnit, setMeasureFormUnit] = useState<MeasureUnit>('SQM');
    const [measureFormPrices, setMeasureFormPrices] = useState<Record<string, string>>({});

    const [assemblyCosts, setAssemblyCosts] = useState<Record<string, { price: string; unit: string; bomList?: BomItem[] }>>({});

    // --- Parts Local State ---
    const [partsCosts, setPartsCosts] = useState<PartCostItem[]>([]);
    const [partsEditForm, setPartsEditForm] = useState<PartCostItem | null>(null);

    // --- Data Loading Effect ---
    useEffect(() => {
        if (selectedNodeId && nodes[selectedNodeId]) {
            const node = nodes[selectedNodeId];

            // Helper to safely parse and filter list
            const safeParseList = (jsonStr: string | undefined) => {
                if (!jsonStr) return [];
                try {
                    const parsed = JSON.parse(jsonStr);
                    if (!Array.isArray(parsed)) return [];
                    return parsed.filter(item => item && typeof item === 'object');
                } catch (e) { return []; }
            };

            if (activeTab === 'ASSEMBLY') {
                console.log('[StandardCost:Hook] Loading Assembly & Parts Costs for:', selectedNodeId);
                try {
                    const saved = node.attributes?.cost_assembly_list;
                    if (saved) {
                        const parsed = JSON.parse(saved);
                        setAssemblyCosts((typeof parsed === 'object' && parsed !== null) ? parsed : {});
                    } else {
                        setAssemblyCosts({});
                    }
                } catch (e) { setAssemblyCosts({}); }

                // Parts
                setPartsCosts(safeParseList(node.attributes?.cost_parts_list));
                setPartsEditForm(null);
            } else {
                console.log('[StandardCost:Hook] Loading Product Costs for:', selectedNodeId);

                // Fabric
                setFabricCosts(safeParseList(node.attributes?.cost_fabric_list));
                // Cutting
                setCuttingCosts(safeParseList(node.attributes?.cost_cutting_list));
                // Measure
                setMeasureCosts(safeParseList(node.attributes?.cost_measure_list));

                setEditForm(null);
                setCuttingEditForm(null);
                setMeasureEditForm(null);
            }
        } else {
            setAssemblyCosts({});
            setFabricCosts([]);
            setCuttingCosts([]);
            setMeasureCosts([]);
            setPartsCosts([]);
            setEditForm(null);
            setCuttingEditForm(null);
            setMeasureEditForm(null);
            setPartsEditForm(null);
        }
    }, [selectedNodeId, nodes, activeTab]);

    // --- Helpers ---
    const calculateMeterPrice = (rollP: string, rollL: string) => {
        const price = parseFloat(rollP.replace(/,/g, ''));
        const length = parseFloat(rollL.replace(/,/g, ''));
        if (!isNaN(price) && !isNaN(length) && length > 0) {
            return roundToHundreds(price / length).toLocaleString();
        }
        return '';
    };

    const getProductWidths = useCallback((productId: string) => {
        const node = nodes[productId];
        if (!node) return [];
        try {
            const costs = JSON.parse(node.attributes?.cost_fabric_list || '[]');
            return costs.map((c: FabricCostItem) => ({ id: c.id, width: c.width || '기본' }));
        } catch (e) { return []; }
    }, [nodes]);

    // --- Fabric Handlers ---
    const handleFormChange = (field: keyof FabricCostItem, value: string) => {
        let finalValue = value;
        if (['width', 'height', 'rollLength', 'rollPrice', 'meterPrice', 'cuttingPrice'].includes(field) && typeof value === 'string') {
            finalValue = formatNumber(value);
        }
        setEditForm(prev => {
            if (!prev) return null;
            let updated = { ...prev, [field]: finalValue };
            if (field === 'category') {
                if (value === 'SLAT') { updated.lengthUnit = 'mm'; }
                else if (value === 'ROLL') { updated.lengthUnit = 'm'; }
            }
            if (updated.category === 'SLAT') {
                if (['category', 'height', 'rollPrice', 'rollLength'].includes(field)) {
                    const h = parseNumber(updated.height || '0');
                    const l = parseNumber(updated.rollLength || '0');
                    const price = parseNumber(updated.rollPrice || '0');
                    if (h - l > 0) {
                        const calculated = roundToHundreds((price * 1000) / (h - l));
                        updated.meterPrice = calculated.toLocaleString();
                    } else { updated.meterPrice = '0'; }
                }
            } else {
                if (field === 'rollPrice' || field === 'rollLength' || field === 'category') {
                    updated.meterPrice = calculateMeterPrice(updated.rollPrice, updated.rollLength);
                }
            }
            return updated;
        });
    };

    const startNewEntry = () => {
        setEditForm({ id: `cost-${Date.now()}`, category: 'ROLL', lengthUnit: 'm', width: '', height: '', rollLength: '', rollPrice: '', meterPrice: '', cuttingPrice: '', updatedAt: new Date().toISOString().split('T')[0] });
    };

    const saveEntry = () => {
        if (!selectedNodeId || !editForm) return;
        const updatedList = fabricCosts.some(item => item.id === editForm.id) ? fabricCosts.map(item => item.id === editForm.id ? editForm : item) : [...fabricCosts, editForm];
        setFabricCosts(updatedList);
        setNodes(prev => ({ ...prev, [selectedNodeId]: { ...prev[selectedNodeId], attributes: { ...prev[selectedNodeId].attributes, 'cost_fabric_list': JSON.stringify(updatedList) } } }));
        setEditForm(null);
    };

    const deleteEntry = (id: string) => {
        if (!selectedNodeId) return; if (!confirm("해당 원가 정보를 삭제하시겠습니까?")) return;
        const updatedList = fabricCosts.filter(item => item.id !== id);
        setFabricCosts(updatedList);
        setEditForm(prev => (prev?.id === id ? null : prev));
        setNodes(prev => ({ ...prev, [selectedNodeId]: { ...prev[selectedNodeId], attributes: { ...prev[selectedNodeId].attributes, 'cost_fabric_list': JSON.stringify(updatedList) } } }));
    };

    const editEntry = (item: FabricCostItem) => { const lengthUnit = item.category === 'SLAT' ? 'cm' : item.lengthUnit; setEditForm({ ...item, lengthUnit }); };

    // --- Cutting Handlers ---
    const handleCuttingFormChange = (field: keyof CuttingCostItem, value: string) => { let finalValue = value; if (['basicArea', 'minWidth', 'maxWidth', 'minHeight', 'maxHeight', 'standardPrice', 'standardWidth'].includes(field)) { finalValue = formatNumber(value); } setCuttingEditForm(prev => prev ? { ...prev, [field]: finalValue } : null); };
    const startNewCuttingEntry = () => { setCuttingEditForm({ id: `cut-${Date.now()}`, basicArea: '', minWidth: '', maxWidth: '', minHeight: '', maxHeight: '', standardPrice: '', unit: 'WIDTH', standardWidth: '180', updatedAt: new Date().toISOString().split('T')[0] }); };
    const saveCuttingEntry = () => { if (!selectedNodeId || !cuttingEditForm) return; const updatedList = cuttingCosts.some(item => item.id === cuttingEditForm.id) ? cuttingCosts.map(item => item.id === cuttingEditForm.id ? cuttingEditForm : item) : [...cuttingCosts, cuttingEditForm]; setCuttingCosts(updatedList); setNodes(prev => ({ ...prev, [selectedNodeId]: { ...prev[selectedNodeId], attributes: { ...prev[selectedNodeId].attributes, 'cost_cutting_list': JSON.stringify(updatedList) } } })); setCuttingEditForm(null); };
    const deleteCuttingEntry = (id: string) => { if (!selectedNodeId) return; if (!confirm("해당 제단비 정보를 삭제하시겠습니까?")) return; const updatedList = cuttingCosts.filter(item => item.id !== id); setCuttingCosts(updatedList); setNodes(prev => ({ ...prev, [selectedNodeId]: { ...prev[selectedNodeId], attributes: { ...prev[selectedNodeId].attributes, 'cost_cutting_list': JSON.stringify(updatedList) } } })); };
    const editCuttingEntry = (item: CuttingCostItem) => { setCuttingEditForm({ ...item }); };

    // --- Measure Handlers ---
    const loadPricesForUnit = (unit: MeasureUnit) => { const prices: Record<string, string> = {}; MEASURE_CATEGORY_OPTIONS.forEach(cat => { const found = measureCosts.find(c => c.unit === unit && c.category === cat.id); prices[cat.id] = found ? found.standardPrice : ''; }); setMeasureFormPrices(prices); };
    const handleMeasureUnitChange = (unit: MeasureUnit) => { setMeasureFormUnit(unit); loadPricesForUnit(unit); };
    const handleMeasurePriceChange = (category: string, value: string) => { setMeasureFormPrices(prev => ({ ...prev, [category]: formatNumber(value) })); };
    const startNewMeasureEntry = () => { setMeasureFormUnit('SQM'); loadPricesForUnit('SQM'); setMeasureEditForm({ id: 'new', category: 'MARGIN_MEASURE', unit: 'SQM', standardPrice: '', updatedAt: '' }); };
    const saveMeasureEntry = () => {
        if (!selectedNodeId) return; const otherCosts = measureCosts.filter(c => c.unit !== measureFormUnit); const newEntries: MeasureCostItem[] = []; MEASURE_CATEGORY_OPTIONS.forEach(cat => { const price = measureFormPrices[cat.id]; if (price) { newEntries.push({ id: `measure-${measureFormUnit}-${cat.id}-${Date.now()}`, category: cat.id, unit: measureFormUnit, standardPrice: price, updatedAt: new Date().toISOString().split('T')[0] }); } }); const updatedList = [...otherCosts, ...newEntries]; setMeasureCosts(updatedList); const updatedJson = JSON.stringify(updatedList); setNodes(prev => {
            const next = { ...prev, [selectedNodeId]: { ...prev[selectedNodeId], attributes: { ...prev[selectedNodeId].attributes, 'cost_measure_list': updatedJson } } };
            // 부모라벨 + 자기라벨 2단계 매칭으로 동기화
            const normalizeLabel = (label: string): string => label.replace(/\([^)]*\)$/, '').trim();
            const myLabel = normalizeLabel(prev[selectedNodeId]?.label || '');
            const myParent = prev[selectedNodeId]?.parentId ? prev[prev[selectedNodeId].parentId] : null;
            const myParentLabel = myParent ? normalizeLabel(myParent.label) : '';
            if (myLabel && myParentLabel) {
                Object.keys(prev).forEach(nodeId => {
                    if (nodeId === selectedNodeId) return;
                    const n = prev[nodeId];
                    if (!n || normalizeLabel(n.label) !== myLabel) return;
                    const pNode = n.parentId ? prev[n.parentId] : null;
                    if (!pNode || normalizeLabel(pNode.label) !== myParentLabel) return;
                    next[nodeId] = { ...prev[nodeId], attributes: { ...prev[nodeId].attributes, 'cost_measure_list': updatedJson } };
                });
            }
            return next;
        }); setMeasureEditForm(null);
    };
    const deleteMeasureEntry = (id: string) => { if (!selectedNodeId) return; if (!confirm("해당 실사비 정보를 삭제하시겠습니까?")) return; const updatedList = measureCosts.filter(item => item.id !== id); setMeasureCosts(updatedList); setNodes(prev => ({ ...prev, [selectedNodeId]: { ...prev[selectedNodeId], attributes: { ...prev[selectedNodeId].attributes, 'cost_measure_list': JSON.stringify(updatedList) } } })); };
    const editMeasureEntry = (item: MeasureCostItem) => { setMeasureFormUnit(item.unit); loadPricesForUnit(item.unit); setMeasureEditForm(item); };

    // --- Assembly Handlers ---
    const handleAssemblyPriceChange = (nodeId: string, value: string) => {
        setAssemblyCosts(prev => ({
            ...prev,
            [nodeId]: { ...(prev[nodeId] || { unit: '개' }), price: formatNumber(value) }
        }));
    };

    const handleAssemblyUnitChange = (nodeId: string, unit: string) => {
        setAssemblyCosts(prev => ({
            ...prev,
            [nodeId]: { ...(prev[nodeId] || { price: '' }), unit }
        }));
    };

    const handleAssemblyBomChange = (nodeId: string, bomList: BomItem[]) => {
        setAssemblyCosts(prev => ({
            ...prev,
            [nodeId]: { ...(prev[nodeId] || { price: '', unit: '개' }), bomList }
        }));
    };

    const saveAssemblyEntry = () => {
        if (!selectedNodeId) return;
        setNodes(prev => ({
            ...prev,
            [selectedNodeId]: {
                ...prev[selectedNodeId],
                attributes: {
                    ...prev[selectedNodeId].attributes,
                    'cost_assembly_list': JSON.stringify(assemblyCosts)
                }
            }
        }));
        alert('조립비 설정이 저장되었습니다.');
    };

    // --- Parts Handlers ---
    const handlePartsFormChange = (field: keyof PartCostItem, value: string) => {
        let finalValue = value;
        if (field === 'cost') {
            finalValue = formatNumber(value);
        }
        setPartsEditForm(prev => prev ? { ...prev, [field]: finalValue } : null);
    };

    const startNewPartsEntry = () => {
        setPartsEditForm({ id: `part-${Date.now()}`, name: '', spec: '', usageUnit: '개', usageQty: '1', inventoryUnit: '개', cost: '', workOrderType: 'NO', workOrderDesc: '', updatedAt: new Date().toISOString().split('T')[0] });
    };

    const savePartsEntry = () => {
        if (!selectedNodeId || !partsEditForm) return;
        const updatedList = partsCosts.some(item => item.id === partsEditForm.id) ? partsCosts.map(item => item.id === partsEditForm.id ? partsEditForm : item) : [...partsCosts, partsEditForm];
        setPartsCosts(updatedList);
        setNodes(prev => ({ ...prev, [selectedNodeId]: { ...prev[selectedNodeId], attributes: { ...prev[selectedNodeId].attributes, 'cost_parts_list': JSON.stringify(updatedList) } } }));
        setPartsEditForm(null);
    };

    const deletePartsEntry = (id: string) => {
        if (!selectedNodeId) return;
        if (!confirm("해당 부품 정보를 삭제하시겠습니까?")) return;
        const updatedList = partsCosts.filter(item => item.id !== id);
        setPartsCosts(updatedList);
        setNodes(prev => ({ ...prev, [selectedNodeId]: { ...prev[selectedNodeId], attributes: { ...prev[selectedNodeId].attributes, 'cost_parts_list': JSON.stringify(updatedList) } } }));
    };

    const editPartsEntry = (item: PartCostItem) => {
        setPartsEditForm({ ...item });
    };

    return {
        // Fabric
        fabricCosts, setFabricCosts,
        editForm, setEditForm,
        handleFormChange, startNewEntry, saveEntry, deleteEntry, editEntry,

        // Cutting
        cuttingCosts, setCuttingCosts,
        cuttingEditForm, setCuttingEditForm,
        handleCuttingFormChange, startNewCuttingEntry, saveCuttingEntry, deleteCuttingEntry, editCuttingEntry,

        // Measure
        measureCosts, setMeasureCosts,
        measureEditForm, setMeasureEditForm,
        measureFormUnit, setMeasureFormUnit,
        measureFormPrices, setMeasureFormPrices,
        loadPricesForUnit, handleMeasureUnitChange, handleMeasurePriceChange, startNewMeasureEntry, saveMeasureEntry, deleteMeasureEntry, editMeasureEntry,

        // Assembly
        assemblyCosts, setAssemblyCosts,
        handleAssemblyPriceChange, handleAssemblyUnitChange, handleAssemblyBomChange, saveAssemblyEntry,

        // Parts
        partsCosts, setPartsCosts,
        partsEditForm, setPartsEditForm,
        handlePartsFormChange, startNewPartsEntry, savePartsEntry, deletePartsEntry, editPartsEntry,

        // Common
        getProductWidths
    };
};
