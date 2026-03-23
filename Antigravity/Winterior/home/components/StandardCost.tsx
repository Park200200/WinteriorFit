import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useProductContext } from './ProductContext';
import { NodeData, UserRole } from '../types';
import { SidebarMode } from './StandardCost.types';
export type { SidebarMode } from './StandardCost.types';
import {
    Search, Scroll, Scissors, Hammer, Ruler,
    ChevronRight, Plus, Trash2, Save, Calculator,
    CheckCircle2, AlertCircle, Edit3, X, LayoutGrid, Layers, Grid,
    ArrowRight, Maximize, RefreshCw, BoxSelect, ScanLine, Stamp, Pin, Tag, Link2, Box,
    Settings, MoreHorizontal, Folder, FolderPlus, Palette, PlusCircle, MinusSquare, PlusSquare, ChevronDown, Check, Camera
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MindMapSystem from './MindMapSystem';
import {
    CostTab, CostCategory, LengthUnit, MeasureUnit, MeasureCategory,
    FabricCostItem, CuttingCostItem, MeasureCostItem
} from './StandardCost.types';
import {
    formatNumber, parseNumber, roundToHundreds, CATEGORY_OPTIONS, MEASURE_CATEGORY_OPTIONS, MEASURE_UNIT_OPTIONS
} from './StandardCost.helpers';
import { useStandardCostData, useStandardCostSelection, useStandardCostCalculations } from './StandardCost.hooks';
import StandardCostSidebar from './StandardCostSidebar';
import StandardCostContent from './StandardCostContent';
import { useAdminTheme } from './theme/AdminThemeContext';

const TABS: { id: CostTab; label: string; icon: React.ElementType }[] = [
    { id: 'FABRIC', label: '원단', icon: Scroll },
    { id: 'CUTTING', label: '제단', icon: Scissors },
    { id: 'ASSEMBLY', label: '조립', icon: Hammer },
    { id: 'MEASURE', label: '실사', icon: Ruler },
];



interface StandardCostProps {
    rootId?: string;
    systemRootId?: string; // For ASSEMBLY tab - different system tree
    role?: UserRole;
    defaultTab?: CostTab;
    customTitle?: string;
}

const StandardCost: React.FC<StandardCostProps> = ({ rootId = 'root', systemRootId, role, defaultTab, customTitle }) => {
    const { theme } = useAdminTheme();
    // console.log('[StandardCost] Component mounted'); // Debug Log Removed
    const { nodes, setNodes } = useProductContext();

    // Cost label based on customTitle
    const costLabel = customTitle || '표준원가';

    // --- State (Refs & Selection) ---
    const {
        activeTab, setActiveTab,
        searchQuery, setSearchQuery,
        isTreePopupOpen, setIsTreePopupOpen,
        selectedNodeId, setSelectedNodeId,
        activeCategoryId, setActiveCategoryId,
        selectedSubIds, setSelectedSubIds,
        expandedAssemblyNodes, setExpandedAssemblyNodes,
        toggleAssemblyNode
    } = useStandardCostSelection(defaultTab);

    // --- Calculations Hook ---
    const calculations = useStandardCostCalculations(activeTab, selectedNodeId, nodes, setNodes);
    const {
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
        handleAssemblyPriceChange, handleAssemblyUnitChange, saveAssemblyEntry,

        // Common
        getProductWidths
    } = calculations;


    // --- Sidebar Mode State (for MANUFACTURER) ---
    const [sidebarMode, setSidebarMode] = useState<SidebarMode>('PRODUCT');

    // --- Sidebar Resize State ---
    const [sidebarWidth, setSidebarWidth] = useState(380);
    const [isResizing, setIsResizing] = useState(false);
    const sidebarRef = useRef<HTMLDivElement>(null);

    const startResizing = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizing(true);
    }, []);

    const stopResizing = useCallback(() => setIsResizing(false), []);

    const resize = useCallback((e: MouseEvent) => {
        if (isResizing && sidebarRef.current) {
            const newWidth = e.clientX - sidebarRef.current.getBoundingClientRect().left;
            if (newWidth > 240 && newWidth < 600) setSidebarWidth(newWidth);
        }
    }, [isResizing]);

    useEffect(() => {
        if (isResizing) {
            window.addEventListener('mousemove', resize);
            window.addEventListener('mouseup', stopResizing);
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        } else {
            document.body.style.cursor = 'default';
            document.body.style.userSelect = 'auto';
        }
        return () => {
            window.removeEventListener('mousemove', resize);
            window.removeEventListener('mouseup', stopResizing);
        };
    }, [isResizing, resize, stopResizing]);

    // Sync sidebarMode with activeTab
    useEffect(() => {
        if (sidebarMode === 'ASSEMBLY') {
            setActiveTab('ASSEMBLY');
        } else if (activeTab === 'ASSEMBLY') {
            setActiveTab('FABRIC');
        }
    }, [sidebarMode]);

    // --- Context Menu & Color Management State ---
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
    const [isColorModalOpen, setIsColorModalOpen] = useState(false);
    const [editingProductId, setEditingProductId] = useState<string | null>(null);
    const [editingProductName, setEditingProductName] = useState(''); // For display/edit
    const [colorList, setColorList] = useState<{ id: string, name: string, code: string, availableWidths: string[] }[]>([]);
    const [tempColorName, setTempColorName] = useState('');
    const [tempColorCode, setTempColorCode] = useState('#000000');

    // --- Product Management Modal State (Siblings) ---
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [productList, setProductList] = useState<{ id: string, name: string, isNew: boolean, isReal: boolean }[]>([]);
    const [editingParentId, setEditingParentId] = useState<string | null>(null);
    const [editingParentName, setEditingParentName] = useState('');
    const [tempProductName, setTempProductName] = useState('');

    // --- Helper: Calculate Average Cutting Price (Reference) ---
    const referenceCuttingPrice = useMemo(() => {
        if (cuttingCosts.length === 0) return 0;
        const sum = cuttingCosts.reduce((acc, curr) => acc + parseNumber(curr.standardPrice), 0);
        return Math.round(sum / cuttingCosts.length);
    }, [cuttingCosts]);

    // --- Restore Missing State for Navigation ---




    // --- Category Logic ---

    // --- Data & Tree Helper ---
    const {
        currentRootId, treeHelper, categories, isCategoryLike, systemVirtualMap,
        linkedSystemCategory, assemblyPaths, getAssemblySystemChildren
    } = useStandardCostData(nodes, activeTab, rootId, systemRootId, role, selectedNodeId);






    // Auto-select first category
    useEffect(() => {
        if (!activeCategoryId && categories.length > 0) {
            setActiveCategoryId(categories[0].id);
        } else if (categories.length === 0) {
            setActiveCategoryId('');
        }
    }, [categories, activeCategoryId]);

    // Sub Categories
    const subCategories = useMemo(() => {
        if (!activeCategoryId) return [];
        const node = nodes[activeCategoryId];
        if (!node) return [];

        let subIds = node.childrenIds || [];
        // If Category is a pointer and has no children local, follow source
        if (subIds.length === 0 && node.attributes?.originalSourceId) {
            const src = nodes[node.attributes.originalSourceId];
            if (src && Array.isArray(src.childrenIds)) subIds = src.childrenIds;
        }

        const realSubs = (subIds || []).map(id => nodes[id]).filter(n => isCategoryLike(n));
        const virtualSubs = (node.sourceIds || []).flatMap(srcId => {
            const src = nodes[srcId];
            return (src && Array.isArray(src.childrenIds)) ? src.childrenIds.map(id => nodes[id]).filter(n => isCategoryLike(n)) : [];
        });

        return [...realSubs, ...virtualSubs];
    }, [nodes, activeCategoryId, isCategoryLike]);

    // Auto-select sub-categories
    useEffect(() => {
        if (activeCategoryId && subCategories.length > 0) {
            setSelectedSubIds(subCategories.map(sub => sub.id));
        } else {
            setSelectedSubIds([]);
        }
    }, [activeCategoryId, subCategories]);

    // --- ASSEMBLY TAB LOGIC: Identify System Map & Ancestor ---


    // --- 1. Flatten Product Data for Left Grid ---


    // 4. Grid Data - TreeHelper 사용 (Major Refactor)
    const gridData = useMemo(() => {
        if (!currentRootId || !nodes[currentRootId]) return [];

        const rows: { id: string; path: string; node: NodeData }[] = [];
        const uniqueIds = new Set<string>();

        // SYSTEM Tree (Assembly Tab) Logic — 시스템 노드 레벨까지만 표시
        if (activeTab === 'ASSEMBLY') {
            // 시스템 트리를 재귀 순회하되, 카테고리/종(species) 계층은 건너뛰고
            // 시스템 노드(실제 설정 항목)까지만 경로를 생성합니다.
            const traverseSystemForGrid = (nodeId: string, pathParts: string[]) => {
                const node = nodes[nodeId];
                if (!node) return;
                if (nodeId === currentRootId) {
                    // 루트 자체는 리스트에서 제외, 자식만 순회
                    const children = treeHelper.getChildren(nodeId);
                    children.forEach(child => traverseSystemForGrid(child.id, []));
                    return;
                }

                const currentPath = [...pathParts, node.label];
                const children = treeHelper.getChildren(nodeId);

                // 자식이 있으면, 자식들이 카테고리/종(species) 타입인지 확인
                const hasContainerChildren = children.some(child => {
                    const ct = child.type;
                    const nt = child.attributes?.nodeType;
                    return ct === 'CATEGORY' || ct === 'REFERENCE' ||
                        nt === 'category' || nt === 'species' || nt === 'item';
                });

                // 자식이 없거나, 자식이 더 이상 카테고리/종이 아니면 → 시스템 노드이므로 리스트에 추가
                if (children.length === 0 || !hasContainerChildren) {
                    if (!uniqueIds.has(node.id)) {
                        uniqueIds.add(node.id);
                        rows.push({
                            id: node.id,
                            path: currentPath.join(' > '),
                            node: node
                        });
                    }
                } else {
                    // 카테고리/종이면 더 깊이 순회
                    children.forEach(child => traverseSystemForGrid(child.id, currentPath));
                }
            };

            traverseSystemForGrid(currentRootId, []);
        }
        // PRODUCT Trees (Fabric, Cutting, Measure) Logic
        else {
            // Logic adapted from SalesPriceManagement.tsx for consistent product listing
            const visited = new Set<string>();
            const traverse = (nodeId: string, pathStr: string) => {
                if (visited.has(nodeId)) return;
                visited.add(nodeId);

                const node = nodes[nodeId];
                if (!node) return;

                const currentPath = pathStr ? `${pathStr} > ${node.label} ` : node.label;
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
                    const children = (node.childrenIds || []).map(id => nodes[id]).filter(Boolean);
                    const hasColorChildren = children.some(c => c.attributes?.nodeType === 'color' || c.attributes?.color);
                    // If it has color children, it is a Product (e.g. 25mm Bamboo)
                    // If it has NO children, it might be a Product?
                    // SalesPrice says: `if (hasColorChildren || children.length === 0)`
                    if (hasColorChildren || children.length === 0) {
                        isProductRow = true;
                    }
                }

                if (isProductRow) {
                    if (!uniqueIds.has(node.id)) {
                        uniqueIds.add(node.id);
                        rows.push({ id: node.id, path: currentPath, node });
                    }
                    return; // Stop traversing children (colors) of a product
                }

                // Recursion
                if (node.childrenIds && node.childrenIds.length > 0) {
                    node.childrenIds.forEach(childId => traverse(childId, currentPath));
                }
                // Virtual Children (SourceIds) - handled by TreeHelper usually, but here manual
                if (node.sourceIds && node.sourceIds.length > 0) {
                    node.sourceIds.forEach(srcId => {
                        const src = nodes[srcId];
                        if (src && src.childrenIds) {
                            src.childrenIds.forEach(childId => traverse(childId, currentPath));
                        }
                    });
                }
            };

            // Start Traversal
            let startNodeIds: string[] = [];
            if (activeCategoryId) {
                startNodeIds = [activeCategoryId];
            } else {
                startNodeIds = categories.map(c => c.id);
            }
            startNodeIds.forEach(id => traverse(id, ''));
        }



        // Apply Search Filter
        let result = rows;
        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase();
            result = result.filter(n => n.node.label.toLowerCase().includes(lowerQuery));
        }

        return result;

    }, [nodes, currentRootId, activeTab, activeCategoryId, categories, searchQuery, treeHelper, rootId]);

    // --- Auto-select first item in ASSEMBLY tab ---
    useEffect(() => {
        if (activeTab === 'ASSEMBLY' && gridData.length > 0) {
            // 선택된 노드가 없거나, 현재 gridData에 포함되지 않으면 첫 번째 항목 자동 선택
            if (!selectedNodeId || !gridData.some(g => g.id === selectedNodeId)) {
                setSelectedNodeId(gridData[0].id);
            }
        }
    }, [activeTab, gridData]);


    // (Legacy linkedSystemCategory logic removed - now in useStandardCostData)

    // --- Auto-expand System Nodes when a Category is selected in Assembly Tab ---
    useEffect(() => {
        if (activeTab === 'ASSEMBLY' && linkedSystemCategory) {
            const newExpanded = new Set<string>();
            const queue = [linkedSystemCategory.id];

            while (queue.length > 0) {
                const nid = queue.shift();
                if (!nid) continue;

                const node = nodes[nid];
                if (node) {
                    const children = [...(node.childrenIds || []), ...(systemVirtualMap[nid] || [])];
                    if (children.length > 0) {
                        newExpanded.add(nid);
                        queue.push(...children);
                    }
                }
            }
            setExpandedAssemblyNodes(newExpanded);
        }
    }, [linkedSystemCategory?.id, activeTab]);

    // (Legacy assemblyPaths logic removed - now in useStandardCostData)

    // --- 3. Assembly Tab Helper Functions ---
    // (Legacy getAssemblySystemChildren logic removed - now in useStandardCostData)

    // Track rendered nodes to prevent infinite recursion
    const renderedAssemblyNids = useMemo(() => new Set<string>(), [activeTab, linkedSystemCategory]);

    const renderAssemblyNode = (nid: string, hierarchy: boolean[] = [], isLast: boolean = false) => {
        // Simple recursion check
        if (hierarchy.length > 20) return null; // Safety break

        const node = nodes[nid];
        if (!node) return null;

        // Get technical system children
        const children = getAssemblySystemChildren(nid);
        const isLeaf = children.length === 0;
        const isExpanded = expandedAssemblyNodes.has(nid);

        // Use the system definition for the label/info
        const systemNode = node.attributes?.originalSourceId ? nodes[node.attributes.originalSourceId] || node : node;

        const depth = hierarchy.length > 0 ? hierarchy.length - 1 : 0;

        return (
            <div key={`${nid} -${hierarchy.join(',')} `} className="flex flex-col relative">
                {/* Node Row */}
                {/* Node Row - Flex Stretch for full height lines */}
                <div className={`flex items - stretch gap - 0 transition - all border - b border - gray - 50 / 50 hover: bg - gray - 50 ${isLeaf ? 'bg-white' : ''} `}>

                    {/* Indentation / Tree Lines */}
                    {hierarchy.length > 0 && (
                        <div className="flex-shrink-0 flex text-gray-300 select-none self-stretch">
                            {hierarchy.map((isLastAncestor, idx) => {
                                // Last element in hierarchy is for the CURRENT node itself
                                const isCurrentNodeLevel = idx === hierarchy.length - 1;

                                if (isCurrentNodeLevel) {
                                    // Current Node Connector
                                    return (
                                        <div key={idx} className="w-6 relative">
                                            {/* Vertical line from top to middle */}
                                            <div className="absolute left-1/2 top-0 bottom-1/2 w-px bg-gray-300 -ml-px" />
                                            {/* If NOT last, vertical line continues down */}
                                            {!isLast && (
                                                <div className="absolute left-1/2 top-1/2 bottom-0 w-px bg-gray-300 -ml-px" />
                                            )}
                                            {/* Horizontal line to right */}
                                            <div className="absolute left-1/2 top-1/2 right-0 h-px bg-gray-300 -mt-px" />
                                        </div>
                                    );
                                } else {
                                    // Ancestor Level
                                    return (
                                        <div key={idx} className="w-6 relative">
                                            {/* If ancestor was NOT last, draw vertical line through */}
                                            {!isLastAncestor && (
                                                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-300 -ml-px" />
                                            )}
                                        </div>
                                    );
                                }
                            })}
                        </div>
                    )}

                    {/* Content Wrapper with Padding */}
                    <div className="flex-1 flex items-center py-2.5 px-2 gap-2 min-w-0">
                        {/* Expand/Collapse */}
                        {!isLeaf ? (
                            <button
                                onClick={() => toggleAssemblyNode(nid)}
                                className={`p - 1 rounded - md transition - colors flex - shrink - 0 z - 10 ${isExpanded ? 'text-gray-400' : 'text-gray-400'} `}
                            >
                                {isExpanded ? <MinusSquare size={14} /> : <PlusSquare size={14} />}
                            </button>
                        ) : (
                            <div className="w-6 flex justify-center flex-shrink-0 z-10">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-300" />
                            </div>
                        )}

                        <div className="flex-1 flex items-center justify-between gap-4 ml-1 min-w-0">
                            <span className={`text - sm ${isLeaf ? 'font-bold text-gray-700' : 'font-semibold text-gray-500'} truncate`}>
                                {systemNode.label}
                            </span>

                            {/* Inputs */}
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <div className="relative group">
                                    <input
                                        type="text"
                                        value={assemblyCosts[nid]?.price || ''}
                                        onChange={(e) => handleAssemblyPriceChange(nid, e.target.value)}
                                        placeholder="0"
                                        className={`w - 28 bg - white border border - gray - 200 rounded - lg px - 3 py - 1.5 pr - 8 text - sm font - mono text - right font - bold outline - none transition - all shadow - sm 
                                            ${assemblyCosts[nid]?.price ? 'text-blue-600 border-blue-200 ring-1 ring-blue-50' : 'text-gray-600 focus:border-blue-400'} `}
                                    />
                                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-medium pointer-events-none">원</span>
                                </div>
                                <div className="relative">
                                    <select
                                        value={assemblyCosts[nid]?.unit || '개'}
                                        onChange={(e) => handleAssemblyUnitChange(nid, e.target.value)}
                                        className="appearance-none bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg pl-3 pr-7 py-1.5 text-xs font-bold text-gray-600 outline-none focus:border-blue-300 transition-colors cursor-pointer"
                                    >
                                        <option value="개">개</option>
                                        <option value="항">항</option>
                                        <option value="cm">cm</option>
                                        <option value="m">m</option>
                                        <option value="가로길이">가로</option>
                                        <option value="세로길이">세로</option>
                                        <option value="㎡">㎡</option>
                                    </select>
                                    <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Children */}
                {/* Recursion */}
                {isExpanded && !isLeaf && (
                    <div className="flex flex-col">
                        {children.map((child, idx) => {
                            const isChildLast = idx === children.length - 1;
                            const newHierarchy = [...hierarchy, isChildLast];
                            return renderAssemblyNode(child.id, newHierarchy, isChildLast);
                        })}
                    </div>
                )}
            </div>
        );
    };


    // --- 2. Sync Selected Node Data ---
    useEffect(() => {
        if (selectedNodeId && nodes[selectedNodeId]) {
            const node = nodes[selectedNodeId];

            if (activeTab === 'FABRIC') {
                setEditForm(null);
            }
            else if (activeTab === 'CUTTING') {
                setCuttingEditForm(null);
            }
            else if (activeTab === 'MEASURE') {
                setMeasureEditForm(null);
            }
            else if (activeTab === 'ASSEMBLY') {
                // Handled by hook
            }
        } else {
            setFabricCosts([]);
            setCuttingCosts([]);
            setMeasureCosts([]);
            setEditForm(null);
            setCuttingEditForm(null);
            setMeasureEditForm(null);
        }
    }, [selectedNodeId, nodes, activeTab]);

    // --- Context Menu Handlers ---
    const handleOpenColorManagement = (nodeId: string) => {
        const node = nodes[nodeId];
        if (!node) return;

        // Extract existing colors
        const colors = node.childrenIds
            .map(id => nodes[id])
            .filter(n => n && (n.attributes?.nodeType === 'color' || n.attributes?.color))
            .map(n => ({
                id: n.id,
                name: n.label,
                code: n.attributes?.color || '#000000',
                availableWidths: n.attributes?.availableWidths ? JSON.parse(n.attributes.availableWidths) : []
            }));

        setEditingProductId(nodeId);
        setEditingProductName(node.label);
        setColorList(colors);
        setTempColorName('');
        setTempColorCode('#000000');
        setIsColorModalOpen(true);
        setActiveMenuId(null);
    };

    const handleAddColorToState = () => {
        if (tempColorName.trim()) {
            setColorList([...colorList, {
                id: `new- ${Date.now()} `,
                name: tempColorName,
                code: tempColorCode,
                availableWidths: []
            }]);
            setTempColorName('');
            setTempColorCode('#000000');
        }
    };

    const handleRemoveColorFromState = (index: number) => {
        setColorList(colorList.filter((_, i) => i !== index));
    };

    const handleUpdateColorNameInState = (index: number, newName: string) => {
        setColorList(prev => prev.map((item, i) => i === index ? { ...item, name: newName } : item));
    };

    const handleToggleColorWidth = (index: number, widthId: string) => {
        setColorList(prev => prev.map((item, i) => {
            if (i !== index) return item;
            const currentWidths = item.availableWidths || [];
            const newWidths = currentWidths.includes(widthId)
                ? currentWidths.filter(id => id !== widthId)
                : [...currentWidths, widthId];
            return { ...item, availableWidths: newWidths };
        }));
    };

    const handleSaveColors = () => {
        if (!editingProductId) return;

        setNodes(prev => {
            const next = { ...prev };
            const productNode = next[editingProductId];
            if (!productNode) return prev;

            const originalChildrenIds = productNode.childrenIds || [];

            // 1. Process the Color List from Modal
            const finalColorIds: string[] = [];
            colorList.forEach((color, idx) => {
                let colorId = color.id;
                const isNew = color.id.startsWith('new-');

                if (isNew) {
                    // NEW COLOR - Generate a unique ID
                    colorId = `node - color - ${Date.now()} -${idx} -${Math.random().toString(36).substr(2, 5)} `;
                }

                // Create or Update node in global map
                next[colorId] = {
                    id: colorId,
                    parentId: editingProductId,
                    type: 'DATA',
                    label: color.name,
                    isExpanded: false,
                    childrenIds: [],
                    attributes: {
                        nodeType: 'color',
                        color: color.code,
                        createdAt: next[colorId]?.attributes?.createdAt || new Date().toISOString(),
                        availableWidths: JSON.stringify(color.availableWidths || [])
                    }
                };
                finalColorIds.push(colorId);
            });

            const finalColorIdSet = new Set(finalColorIds);

            // 2. Cleanup Deletions
            // Identify nodes that WERE colors under this product but are NO LONGER in the list
            originalChildrenIds.forEach(id => {
                const n = next[id];
                // Check if it's a color node
                const isColorNode = n?.attributes?.nodeType === 'color' || !!n?.attributes?.color;
                if (isColorNode && !finalColorIdSet.has(id)) {
                    delete next[id];
                }
            });

            // 3. Identify "Other" Children to keep
            // Important: Exclude any ID that is already in 'finalColorIdSet' to avoid duplication
            const otherChildrenIds = originalChildrenIds.filter(id => {
                // If it's in finalColorIds, we don't include it in "others" (prevents duplication)
                if (finalColorIdSet.has(id)) return false;

                const n = next[id];
                if (!n) return false; // Already deleted
                if (n.attributes?.nodeType === 'color' || !!n.attributes?.color) return false;

                return true; // Keep categories/options/folders
            });

            // 4. Update Parent's Children Array
            // Merge unmanaged children with our updated colors
            next[editingProductId] = {
                ...productNode,
                childrenIds: [...otherChildrenIds, ...finalColorIds]
            };

            return next;
        });

        setIsColorModalOpen(false);
        setEditingProductId(null);
    };

    const handleDeleteProduct = (nodeId: string) => {
        if (!confirm('정말 삭제하시겠습니까? 하위 칼라 및 원가 정보도 모두 삭제될 수 있습니다.')) return;
        setNodes(prev => {
            const next = { ...prev };
            const nodeToDelete = next[nodeId];
            if (nodeToDelete && nodeToDelete.parentId) {
                const parent = next[nodeToDelete.parentId];
                if (parent) {
                    next[nodeToDelete.parentId] = {
                        ...parent,
                        childrenIds: parent.childrenIds.filter(id => id !== nodeId)
                    };
                }
            }
            // Cleanup children? (Recursive delete is safer but simplified here)
            delete next[nodeId];
            return next;
        });
        setActiveMenuId(null);
        if (selectedNodeId === nodeId) setSelectedNodeId(null);
    };

    const handleOpenProductManagement = (nodeId: string) => {
        const node = nodes[nodeId];
        if (!node || !node.parentId) return;
        const parent = nodes[node.parentId];
        if (!parent) return;

        // Path Construction for Title (e.g. Wood > 25mm)
        let titlePath = parent.label;
        if (parent.parentId) {
            const grandParent = nodes[parent.parentId];
            if (grandParent && grandParent.id !== 'root' && grandParent.type !== 'ROOT') {
                titlePath = `${grandParent.label} > ${parent.label} `;
            }
        }

        // Retrieve all sibling products
        const refinedSiblings = parent.childrenIds
            .map(id => nodes[id])
            .filter(n => n && n.type !== 'CATEGORY' && n.attributes?.nodeType !== 'category' && n.attributes?.nodeType !== 'color') // Exclude categories and colors
            .map(n => ({
                id: n.id,
                name: n.label,
                isNew: false,
                isReal: n.attributes?.isReal === 'true'
            }));

        setEditingParentId(parent.id);
        setEditingParentName(titlePath); // Set constructed path here
        setProductList(refinedSiblings);
        setTempProductName('');
        setIsProductModalOpen(true);
        setActiveMenuId(null);
    };

    const handleAddProductToState = () => {
        if (tempProductName.trim()) {
            setProductList([...productList, { id: `new- prod - ${Date.now()} `, name: tempProductName, isNew: true, isReal: false }]);
            setTempProductName('');
        }
    };

    const handleRemoveProductFromState = (index: number) => {
        setProductList(productList.filter((_, i) => i !== index));
    };

    const handleUpdateProductNameInState = (index: number, newName: string) => {
        const newList = [...productList];
        newList[index].name = newName;
        setProductList(newList);
    };

    const handleToggleProductIsReal = (index: number) => {
        const newList = [...productList];
        newList[index].isReal = !newList[index].isReal;
        setProductList(newList);
    };

    const handleSaveProducts = () => {
        if (!editingParentId) return;

        setNodes(prev => {
            const next = { ...prev };
            const parentNode = next[editingParentId];
            if (!parentNode) return prev;

            const originalChildrenIds = parentNode.childrenIds || [];

            // 1. Process the Modal List (Additions & Updates)
            const finalProductIds: string[] = [];
            productList.forEach((item, idx) => {
                if (item.isNew) {
                    // NEW PRODCUT
                    // Generate a unique ID for the new node
                    const newId = `node - prod - ${Date.now()} -${idx} -${Math.random().toString(36).substr(2, 5)} `;
                    next[newId] = {
                        id: newId,
                        parentId: editingParentId,
                        type: 'DATA',
                        label: item.name,
                        isExpanded: false,
                        childrenIds: [],
                        attributes: {
                            nodeType: 'product',
                            createdAt: new Date().toISOString(),
                            isReal: item.isReal ? 'true' : 'false'
                        }
                    };
                    finalProductIds.push(newId);
                } else {
                    // EXISTING PRODUCT - Update label & attributes
                    if (next[item.id]) {
                        next[item.id] = {
                            ...next[item.id],
                            label: item.name,
                            attributes: {
                                ...next[item.id].attributes,
                                isReal: item.isReal ? 'true' : 'false'
                            }
                        };
                        finalProductIds.push(item.id);
                    }
                }
            });

            const finalProductIdSet = new Set(finalProductIds);

            // 2. Identify and Cleanup Deletions
            // Products that WERE there but are NO LONGER in the final list
            originalChildrenIds.forEach(id => {
                const n = next[id];
                const isProductNode = n?.attributes?.nodeType === 'product';
                if (isProductNode && !finalProductIdSet.has(id)) {
                    delete next[id];
                }
            });

            // 3. Identify "Other" Children (Categories, folders, etc.) to keep
            // Important: We MUST exclude any ID that is already in 'finalProductIdSet' to avoid duplication
            const otherChildrenIds = originalChildrenIds.filter(id => {
                // If it's already in the final product list, we've handled it above.
                if (finalProductIdSet.has(id)) return false;

                const n = next[id];
                if (!n) return false; // Already deleted or doesn't exist

                // If it's a product node but wasn't in finalProductIdSet, it's a deletion candidate.
                if (n.attributes?.nodeType === 'product') return false;

                return true; // Keep everything else (categories/folders)
            });

            // 4. Update Parent's Children Array
            // Merge unmanaged categories with managed products
            next[editingParentId] = {
                ...parentNode,
                childrenIds: [...otherChildrenIds, ...finalProductIds]
            };

            return next;
        });

        setIsProductModalOpen(false);
        setEditingParentId(null);
    };


    return (
        <div id="standard-cost-container" className="flex-1 w-full flex flex-col h-full overflow-hidden" style={{ background: 'var(--admin-bg)' }}>

            {/* Header Area */}
            <div id="standard-cost-header" className="flex-shrink-0 border-b px-8 h-20 shadow-sm z-30 flex items-center justify-between relative gap-4" style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)' }}>
                {/* Left: Icon + Title + Count Badge */}
                <div className="flex items-center gap-4 relative z-30 min-w-fit">
                    <Tag style={{ color: 'var(--theme-primary)' }} className="shrink-0" size={28} />
                    <h1 className="text-2xl font-bold whitespace-nowrap" style={{ color: 'var(--admin-text)' }}>
                        {customTitle || '표준원가'}
                    </h1>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full border shadow-sm" style={{ color: 'var(--theme-primary)', background: 'var(--theme-primary-bg)', borderColor: 'var(--theme-primary)' }}>
                        총 {gridData.length}개
                    </span>
                </div>

                {/* Center: Search */}
                <div className="flex-1 max-w-xl mx-auto">
                    <div className="relative w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            id="input-cost-search"
                            type="text"
                            placeholder="상품명 검색..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-2.5 bg-gray-100 border-transparent focus:bg-white border rounded-xl text-sm font-medium outline-none transition-all shadow-inner focus:shadow-md"
                            onFocus={e => e.currentTarget.style.borderColor = 'var(--theme-primary)'}
                            onBlur={e => e.currentTarget.style.borderColor = 'transparent'}
                        />
                    </div>
                </div>

                {/* Right: Category & Sub Tabs */}
                <div className="flex items-center gap-4 justify-end min-w-0">
                    <div className="flex items-center gap-3 justify-end min-w-0">
                        <div className="flex bg-white p-1 rounded-full shadow-sm border border-gray-200 flex-shrink-0 gap-1 ring-1 ring-black/[0.03]">
                            {categories.map((cat) => {
                                const isActive = activeTab === 'ASSEMBLY' || activeCategoryId === cat.id;
                                return (
                                    <button
                                        key={cat.id}
                                        id={`tab-category-${cat.id}`}
                                        onClick={() => {
                                            if (activeTab === 'ASSEMBLY') return;
                                            setActiveCategoryId(cat.id);
                                            setSelectedNodeId(null);
                                        }}
                                        className={`relative px-5 py-1.5 text-xs font-bold rounded-full transition-all whitespace-nowrap z-10 flex items-center gap-1.5 ${isActive
                                            ? 'text-white shadow-md'
                                            : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'} ${activeTab === 'ASSEMBLY' ? 'cursor-default' : ''}`}
                                        style={isActive ? { background: 'var(--theme-primary)' } : {}}
                                    >
                                        {cat.sourceIds && cat.sourceIds.length > 0 && <Link2 size={12} className={isActive ? "text-white/70" : "opacity-40"} />}
                                        {cat.label}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="w-1.5 h-1.5 rounded-full bg-gray-300 flex-shrink-0" />

                        <div className="flex bg-white p-1 rounded-full border border-gray-200 shadow-sm overflow-x-auto scrollbar-hide max-w-[300px] xl:max-w-[500px] flex-shrink-0 gap-1.5 ring-1 ring-black/[0.03]">
                            {subCategories.length > 0 ? subCategories.map((sub) => {
                                const isSelected = activeTab !== 'ASSEMBLY' && selectedSubIds.includes(sub.id);
                                return (
                                    <button
                                        key={sub.id}
                                        id={`tab-subcategory-${sub.id}`}
                                        onClick={() => {
                                            if (activeTab === 'ASSEMBLY') return;
                                            setSelectedSubIds(prev => prev.includes(sub.id) ? prev.filter(id => id !== sub.id) : [...prev, sub.id]);
                                            setSelectedNodeId(null);
                                        }}
                                        className={`relative px-4 py-1.5 text-xs font-bold rounded-full transition-all whitespace-nowrap z-10 flex-shrink-0 flex items-center gap-1.5 ${isSelected
                                            ? 'border shadow-sm'
                                            : 'text-gray-500 hover:text-gray-800 border border-transparent'} ${activeTab === 'ASSEMBLY' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        style={isSelected ? { color: 'var(--theme-primary)', background: 'var(--theme-primary-bg)', borderColor: 'var(--theme-primary)' } : {}}
                                    >
                                        {sub.sourceIds && sub.sourceIds.length > 0 && <Link2 size={10} className={isSelected ? "text-[#7C3AED]/50" : "opacity-40"} />}
                                        {sub.label}
                                    </button>
                                );
                            }) : (
                                <div className="px-4 py-1.5 text-xs font-bold text-gray-300 italic">하위 카테고리 없음</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Split Content */}
            <div className="flex-1 flex overflow-hidden relative" ref={sidebarRef}>
                {/* LEFT: Product Grid (Sidebar) */}
                <StandardCostSidebar
                    activeTab={activeTab}
                    nodes={nodes}
                    currentRootId={currentRootId}
                    gridData={gridData}
                    selectedNodeId={selectedNodeId}
                    setSelectedNodeId={setSelectedNodeId}
                    activeMenuId={activeMenuId}
                    setActiveMenuId={setActiveMenuId}
                    setIsTreePopupOpen={setIsTreePopupOpen}
                    handleOpenProductManagement={handleOpenProductManagement}
                    handleOpenColorManagement={handleOpenColorManagement}
                    role={role}
                    sidebarMode={sidebarMode}
                    setSidebarMode={setSidebarMode}
                    sidebarWidth={sidebarWidth}
                    onResizeStart={startResizing}
                />

                <StandardCostContent
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    selectedNodeId={selectedNodeId}
                    nodes={nodes}
                    costLabel={costLabel}
                    linkedSystemCategory={linkedSystemCategory}
                    assemblyPaths={assemblyPaths}
                    currentRootId={currentRootId}
                    expandedAssemblyNodes={expandedAssemblyNodes}
                    toggleAssemblyNode={toggleAssemblyNode}
                    calculations={calculations}
                    getAssemblySystemChildren={getAssemblySystemChildren}
                    role={role}
                    sidebarMode={sidebarMode}
                    referenceCuttingPrice={referenceCuttingPrice}
                />
            </div>

            {/* PRODUCT MANAGEMENT MODAL (SIBLINGS) */}
            <AnimatePresence>
                {
                    isProductModalOpen && (
                        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsProductModalOpen(false)} />
                            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden relative z-10 flex flex-col max-h-[85vh]" style={{ background: 'var(--admin-surface)' }}>
                                {/* Header */}
                                <div className="p-5 flex items-center justify-between" style={{ borderBottom: '1px solid var(--admin-border)', background: 'var(--admin-bg)' }}>
                                    <div className="flex items-center gap-2">
                                        <Folder size={18} style={{ color: 'var(--theme-primary)' }} />
                                        <h3 className="font-bold text-sm" style={{ color: 'var(--admin-text)' }}>{editingParentName}의 상품관리</h3>
                                    </div>
                                    <button onClick={() => setIsProductModalOpen(false)} className="transition-colors" style={{ color: 'var(--admin-text-sub)' }}
                                        onMouseEnter={e => { e.currentTarget.style.color = 'var(--admin-text)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.color = 'var(--admin-text-sub)'; }}>
                                        <X size={20} />
                                    </button>
                                </div>

                                {/* Content */}
                                <div className="flex-1 flex flex-col p-6 overflow-hidden">
                                    <div className="flex-1 flex flex-col min-h-0">
                                        <div className="flex items-center justify-between mb-3">
                                            <label className="text-[11px] font-bold uppercase flex items-center gap-1" style={{ color: 'var(--admin-text-sub)' }}>
                                                상품 목록 (Total: {productList.length})
                                            </label>
                                        </div>

                                        {/* Add Product Input */}
                                        <div className="flex gap-2 mb-3">
                                            <div className="flex-1 relative">
                                                <input
                                                    type="text"
                                                    value={tempProductName}
                                                    onChange={(e) => setTempProductName(e.target.value)}
                                                    placeholder="추가할 상품명 입력"
                                                    className="w-full rounded-lg pl-3 pr-3 py-2 text-sm outline-none transition-colors"
                                                    style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}
                                                    onFocus={e => { e.currentTarget.style.borderColor = 'var(--theme-primary)'; }}
                                                    onBlur={e => { e.currentTarget.style.borderColor = 'var(--admin-border)'; }}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleAddProductToState()}
                                                    autoFocus
                                                />
                                            </div>
                                            <button
                                                onClick={handleAddProductToState}
                                                disabled={!tempProductName.trim()}
                                                className="rounded-lg px-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                style={{ background: 'var(--theme-primary-bg)', color: 'var(--theme-primary)' }}
                                                onMouseEnter={e => { if (tempProductName.trim()) e.currentTarget.style.opacity = '0.8'; }}
                                                onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
                                            >
                                                <Plus size={18} />
                                            </button>
                                        </div>

                                        {/* Product List */}
                                        <div className="flex-1 rounded-xl p-2 overflow-y-auto scrollbar-hide space-y-1" style={{ background: 'var(--admin-bg)', border: '1px solid var(--admin-border)' }}>
                                            {productList.length === 0 ? (
                                                <div className="h-full flex items-center justify-center text-xs" style={{ color: 'var(--admin-text-sub)' }}>
                                                    등록된 상품이 없습니다.
                                                </div>
                                            ) : (
                                                productList.map((prod, idx) => (
                                                    <div key={idx} className="flex items-center justify-between px-3 py-2 rounded-lg shadow-sm text-sm group transition-colors" style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}
                                                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--theme-primary)'; }}
                                                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--admin-border)'; }}>
                                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                                            <Box size={14} style={{ color: 'var(--theme-primary)' }} className="flex-shrink-0" />
                                                            <input
                                                                type="text"
                                                                value={prod.name}
                                                                onChange={(e) => handleUpdateProductNameInState(idx, e.target.value)}
                                                                className="flex-1 bg-transparent outline-none font-medium min-w-0 transition-colors cursor-text"
                                                                style={{ color: 'var(--admin-text)' }}
                                                                onFocus={e => { e.currentTarget.style.color = 'var(--theme-primary)'; }}
                                                                onBlur={e => { e.currentTarget.style.color = 'var(--admin-text)'; }}
                                                            />
                                                            {prod.isNew && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md" style={{ color: 'var(--theme-primary)', background: 'var(--theme-primary-bg)' }}>NEW</span>}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => handleToggleProductIsReal(idx)}
                                                                className={`relative inline-flex h-7 w-14 flex-shrink-0 cursor-pointer rounded-full transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-1`}
                                                                style={prod.isReal ? { background: 'var(--theme-primary)', boxShadow: '0 2px 8px rgba(var(--theme-primary-rgb,99,60,201),0.3)' } : { background: 'var(--admin-border)' }}
                                                            >
                                                                <span
                                                                    className={`pointer-events-none inline-flex items-center justify-center transform rounded-full bg-white shadow-lg ring-0 transition-all duration-300 ease-in-out mt-[3px] ${prod.isReal ? 'translate-x-[30px]' : 'translate-x-[3px]'}`}
                                                                    style={{ width: '22px', height: '22px' }}
                                                                >
                                                                    {prod.isReal && <Camera size={11} style={{ color: 'var(--theme-primary)' }} strokeWidth={2.5} />}
                                                                </span>
                                                            </button>
                                                            <span className="text-[11px] font-bold w-8 transition-colors duration-200" style={{ color: prod.isReal ? 'var(--theme-primary)' : 'var(--admin-border)' }}>
                                                                {prod.isReal ? '실사' : '해제'}
                                                            </span>
                                                            <button onClick={() => handleRemoveProductFromState(idx)} className="p-1 transition-colors" style={{ color: 'var(--admin-border)' }}
                                                                onMouseEnter={e => { e.currentTarget.style.color = '#dc2626'; }}
                                                                onMouseLeave={e => { e.currentTarget.style.color = 'var(--admin-border)'; }}>
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleSaveProducts}
                                        className="w-full py-3 rounded-xl font-bold text-sm transition-transform active:scale-95 flex items-center justify-center gap-2 mt-6 text-white"
                                        style={{ background: 'var(--theme-primary)', boxShadow: '0 4px 14px rgba(var(--theme-primary-rgb,99,60,201),0.35)' }}
                                        onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(1.1)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.filter = ''; }}
                                    >
                                        <Save size={18} /> 설정 저장완료
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )
                }
            </AnimatePresence >

            {/* COLOR MANAGEMENT MODAL */}
            <AnimatePresence>
                {
                    isColorModalOpen && (
                        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsColorModalOpen(false)} />
                            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden relative z-10 flex flex-col max-h-[85vh]" style={{ background: 'var(--admin-surface)' }}>
                                {/* Header */}
                                <div className="p-5 flex items-center justify-between" style={{ borderBottom: '1px solid var(--admin-border)', background: 'var(--admin-bg)' }}>
                                    <div className="flex items-center gap-2">
                                        <Palette size={18} style={{ color: 'var(--theme-primary)' }} />
                                        <h3 className="font-bold text-sm" style={{ color: 'var(--admin-text)' }}>칼라 관리 : {editingProductName}</h3>
                                    </div>
                                    <button onClick={() => setIsColorModalOpen(false)} className="transition-colors" style={{ color: 'var(--admin-text-sub)' }}
                                        onMouseEnter={e => { e.currentTarget.style.color = 'var(--admin-text)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.color = 'var(--admin-text-sub)'; }}>
                                        <X size={20} />
                                    </button>
                                </div>

                                {/* Content */}
                                <div className="flex-1 flex flex-col p-6 overflow-hidden">
                                    <div className="flex-1 flex flex-col min-h-0">
                                        <div className="flex items-center justify-between mb-3">
                                            <label className="text-[11px] font-bold uppercase flex items-center gap-1" style={{ color: 'var(--admin-text-sub)' }}>
                                                하위 칼라 목록 (Total: {colorList.length})
                                            </label>
                                        </div>

                                        {/* Add Color Input */}
                                        <div className="flex gap-2 mb-3">
                                            <div className="flex-1 relative">
                                                <input
                                                    type="text"
                                                    value={tempColorName}
                                                    onChange={(e) => setTempColorName(e.target.value)}
                                                    placeholder="칼라명 (예: 화이트)"
                                                    className="w-full rounded-lg pl-3 pr-3 py-2 text-sm outline-none transition-colors"
                                                    style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}
                                                    onFocus={e => { e.currentTarget.style.borderColor = 'var(--theme-primary)'; }}
                                                    onBlur={e => { e.currentTarget.style.borderColor = 'var(--admin-border)'; }}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleAddColorToState()}
                                                    autoFocus
                                                />
                                            </div>
                                            <button
                                                onClick={handleAddColorToState}
                                                disabled={!tempColorName.trim()}
                                                className="rounded-lg px-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                style={{ background: 'var(--theme-primary-bg)', color: 'var(--theme-primary)' }}
                                                onMouseEnter={e => { if (tempColorName.trim()) e.currentTarget.style.opacity = '0.8'; }}
                                                onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
                                            >
                                                <PlusCircle size={18} />
                                            </button>
                                        </div>

                                        {/* Color List */}
                                        <div className="flex-1 rounded-xl p-2 overflow-y-auto scrollbar-hide space-y-1" style={{ background: 'var(--admin-bg)', border: '1px solid var(--admin-border)' }}>
                                            {colorList.length === 0 ? (
                                                <div className="h-full flex items-center justify-center text-xs" style={{ color: 'var(--admin-text-sub)' }}>
                                                    등록된 칼라가 없습니다.
                                                </div>
                                            ) : (
                                                colorList.map((color, idx) => (
                                                    <div key={idx} className="flex flex-col px-3 py-2 rounded-lg shadow-sm text-sm group transition-colors" style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}
                                                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--theme-primary)'; }}
                                                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--admin-border)'; }}>
                                                        <div className="flex items-center justify-between mb-2">
                                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                                <Palette size={16} className="flex-shrink-0" style={{ color: 'var(--admin-text-sub)' }} />
                                                                <input
                                                                    type="text"
                                                                    value={color.name}
                                                                    onChange={(e) => handleUpdateColorNameInState(idx, e.target.value)}
                                                                    className="flex-1 bg-transparent outline-none font-medium min-w-0 transition-colors cursor-text"
                                                                    style={{ color: 'var(--admin-text)' }}
                                                                    onFocus={e => { e.currentTarget.style.color = 'var(--theme-primary)'; }}
                                                                    onBlur={e => { e.currentTarget.style.color = 'var(--admin-text)'; }}
                                                                />
                                                            </div>
                                                            <button onClick={() => handleRemoveColorFromState(idx)} className="p-1 transition-colors" style={{ color: 'var(--admin-border)' }}
                                                                onMouseEnter={e => { e.currentTarget.style.color = '#dc2626'; }}
                                                                onMouseLeave={e => { e.currentTarget.style.color = 'var(--admin-border)'; }}>
                                                                <X size={14} />
                                                            </button>
                                                        </div>
                                                        {/* Width Selection Checkboxes */}
                                                        <div className="flex flex-wrap gap-2 pl-7">
                                                            {editingProductId && getProductWidths(editingProductId).map((w: { id: string, width: string }) => (
                                                                <label key={w.id} className="flex items-center gap-1.5 cursor-pointer select-none">
                                                                    <div className="w-3 h-3 rounded-sm border flex items-center justify-center transition-colors"
                                                                        style={color.availableWidths?.includes(w.id)
                                                                            ? { background: 'var(--theme-primary)', borderColor: 'var(--theme-primary)' }
                                                                            : { background: 'var(--admin-surface)', borderColor: 'var(--admin-border)' }}>
                                                                        {color.availableWidths?.includes(w.id) && <Check size={10} className="text-white" strokeWidth={3} />}
                                                                    </div>
                                                                    <input type="checkbox" className="hidden" checked={color.availableWidths?.includes(w.id) || false} onChange={() => handleToggleColorWidth(idx, w.id)} />
                                                                    <span className="text-[10px] font-medium" style={{ color: 'var(--admin-text-sub)' }}>{w.width}</span>
                                                                </label>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleSaveColors}
                                        className="w-full py-3 rounded-xl font-bold text-sm transition-transform active:scale-95 flex items-center justify-center gap-2 mt-6 text-white"
                                        style={{ background: 'var(--theme-primary)', boxShadow: '0 4px 14px rgba(var(--theme-primary-rgb,99,60,201),0.35)' }}
                                        onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(1.1)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.filter = ''; }}
                                    >
                                        <Save size={18} /> 설정 저장완료
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )
                }
            </AnimatePresence >

            {/* Tree View Popup */}
            <AnimatePresence>
                {
                    isTreePopupOpen && (
                        <div className="fixed inset-0 z-[200] flex items-center justify-center p-10">
                            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsTreePopupOpen(false)} />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="rounded-2xl shadow-2xl w-full h-full relative z-10 flex flex-col overflow-hidden max-w-[90vw] max-h-[90vh]"
                                style={{ background: 'var(--admin-surface)' }}
                            >
                                <div className="h-14 px-6 flex items-center justify-between flex-shrink-0" style={{ borderBottom: '1px solid var(--admin-border)', background: 'var(--admin-bg)' }}>
                                    <h3 className="font-bold flex items-center gap-2 text-sm" style={{ color: 'var(--admin-text)' }}>
                                        <LayoutGrid size={18} style={{ color: 'var(--theme-primary)' }} />
                                        {nodes[currentRootId]?.label || '트리 보기'}
                                        <span className="text-xs font-normal ml-2" style={{ color: 'var(--admin-text-sub)' }}>전체 구조를 확인합니다</span>
                                    </h3>
                                    <button onClick={() => setIsTreePopupOpen(false)} className="w-8 h-8 rounded-full flex items-center justify-center transition-colors" style={{ color: 'var(--admin-text-sub)' }}
                                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--admin-border)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = ''; }}>
                                        <X size={20} />
                                    </button>
                                </div>
                                <div className="flex-1 relative overflow-hidden" style={{ background: 'var(--admin-bg)' }}>
                                    <MindMapSystem forcedRootId={currentRootId} isInspectorActive={true} />
                                </div>
                            </motion.div>
                        </div>
                    )
                }
            </AnimatePresence >
        </div >
    );
};

export default StandardCost;
