
import React, { useState, useMemo, useRef, useEffect, useCallback, memo } from 'react';
import { useProductContext } from './ProductContext';
import { usePartnerContext } from '../PartnerContext';
import { useAdminTheme } from './theme/AdminThemeContext';
import { NodeData, NodeType } from '../types';
import {
    ChevronRight, ChevronDown, Plus, Trash2, Edit3, ChevronLeft,
    Folder, FileText, Box, Layers, MoreHorizontal, X,
    Search, Download, Upload, Database, Layout,
    Tags, Package, Palette, Settings, Sliders, Calendar, MapPin, Users,
    Star, Circle, Hexagon, Triangle, Heart, Globe, Cloud, Zap, Anchor,
    Briefcase, Flag, Bookmark, Tag, Smile, Link2, Grid, Network, List, Minus, Square, Copy, LayoutGrid,
    Unlink, RefreshCw, AlertTriangle, RotateCcw, History, Check, ArrowDownRight, FileJson,
    Building2, Phone, User, Files
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Icons & Types Configuration ---
const ICON_MAP: Record<string, React.ElementType> = {
    Box, Folder, Tags, Package, Palette, Settings, Sliders, Calendar, MapPin, Users,
    Star, Circle, Hexagon, Triangle, Heart, Globe, Cloud, Zap, Anchor,
    Briefcase, Flag, Bookmark, Tag, Smile, FileText, Layers, Grid, Network, List
};

const DEFAULT_NODE_TYPES = [
    { id: 'root', label: '루트', icon: 'Network', color: 'text-gray-900 bg-gray-100 border-gray-600' },
    { id: 'category', label: '분류', icon: 'Folder', color: 'text-blue-600 bg-blue-50 border-blue-200' },
    { id: 'species', label: '상품종', icon: 'Tags', color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
    { id: 'product', label: '상품', icon: 'Package', color: 'text-green-600 bg-green-50 border-green-200' },
    { id: 'color', label: '상품칼라', icon: 'Palette', color: 'text-pink-600 bg-pink-50 border-pink-200' },
    { id: 'system', label: '시스템', icon: 'Settings', color: 'text-gray-600 bg-gray-50 border-gray-200' },
    { id: 'item', label: '항목', icon: 'List', color: 'text-lime-600 bg-lime-50 border-lime-200' },
    { id: 'option', label: '옵션', icon: 'Sliders', color: 'text-orange-600 bg-orange-50 border-orange-200' },
    { id: 'date', label: '년월일시', icon: 'Calendar', color: 'text-cyan-600 bg-cyan-50 border-cyan-200' },
    { id: 'address', label: '주소', icon: 'MapPin', color: 'text-red-600 bg-red-50 border-red-200' },
];

interface CustomNodeType {
    id: string;
    label: string;
    icon: string;
    color: string;
}

interface BoxState {
    x: number;
    y: number;
    width: number;
    height: number;
    zIndex: number;
    pan: { x: number; y: number };
    lastLayout: { width: number; height: number; pan: { x: number; y: number } };
    isMinimized: boolean;
}

interface MindMapSystemProps {
    isInspectorActive?: boolean;
    forcedRootId?: string;
}

// --- Helpers ---

// Helper to identify all children that should be considered for copying/viewing
const gatherAllVisibleChildren = (node: NodeData, currentNodes: Record<string, NodeData>, includeVirtual = true): string[] => {
    if (!node) return [];

    const visibleIds: string[] = [];

    // 1. Real content
    if (node.childrenIds) visibleIds.push(...node.childrenIds);

    // 2. Grafted (Virtual Child Map)
    if (node.attributes?.virtualChildMap) {
        try {
            const vMap = typeof node.attributes.virtualChildMap === 'string'
                ? JSON.parse(node.attributes.virtualChildMap)
                : node.attributes.virtualChildMap;
            if (vMap[node.id]) visibleIds.push(...vMap[node.id]);
        } catch (e) { }
    }

    // 3. From Sources (Reference Expansion) - Only if we want to "Materialize" or see what's inside
    if (includeVirtual && node.sourceIds) {
        node.sourceIds.forEach(sid => {
            const sNode = currentNodes[sid];
            if (sNode) {
                // Recursively gather from source? 
                // Or just the source's children?
                // Typically we just want the source's children to appear as children of this node
                if (sNode.childrenIds) visibleIds.push(...sNode.childrenIds);
            }
        });
    }

    // Filter excluded
    let excludedIds: string[] = [];
    try {
        if (node.attributes?.excludedIds) {
            excludedIds = typeof node.attributes.excludedIds === 'string'
                ? JSON.parse(node.attributes.excludedIds)
                : node.attributes.excludedIds;
        }
    } catch (e) { }

    return [...new Set(visibleIds)].filter(id => !excludedIds.includes(id));
};

// Enhanced Deep Copy: Supports "Materialization" or "Clone As-Is"
// - preserveReferences: If true, keeps sourceIds (Links) and DOES NOT materialize their content.
//                       If false, clears sourceIds and Copies content (Snapshot).
// Enhanced Deep Copy: Supports "Materialization" or "Clone As-Is"
// - preserveReferences: If true, keeps sourceIds (Links) and DOES NOT materialize their content.
//                       If false, clears sourceIds and Copies content (Snapshot).
const deepCopyNode = (
    sourceId: string,
    newParentId: string | null,
    currentNodes: Record<string, NodeData>,
    newNodesMap: Record<string, NodeData>,
    preserveReferences: boolean = false,
    labelOverride?: string,
    globalExclusions: string[] = [],
    sourceVirtualChildMap: Record<string, string[]> = {}
): string | null => {
    const original = currentNodes[sourceId];
    if (!original) return null;

    // Helper to recursively gather children from reference chains (For Materialization)
    // Now respects exclusions at each level to ensure WYSIWYG
    const gatherChildrenFromSource = (node: NodeData, visited: Set<string>): string[] => {
        if (visited.has(node.id)) return [];
        visited.add(node.id);

        let nodeExclusions: string[] = [];
        try {
            if (node.attributes?.excludedIds) {
                const parsed = typeof node.attributes.excludedIds === 'string'
                    ? JSON.parse(node.attributes.excludedIds)
                    : node.attributes.excludedIds;
                nodeExclusions.push(...parsed);
            }
            if (node.attributes?.disconnectedIds) {
                const parsed = typeof node.attributes.disconnectedIds === 'string'
                    ? JSON.parse(node.attributes.disconnectedIds)
                    : node.attributes.disconnectedIds;
                nodeExclusions.push(...parsed);
            }
        } catch (e) { }

        const ids: string[] = [];

        // A. Real Children of Source
        if (node.childrenIds) {
            ids.push(...node.childrenIds.filter(id => !nodeExclusions.includes(id)));
        }

        // B. Grafted Children of Source (Virtual Child Map)
        if (node.attributes?.virtualChildMap) {
            try {
                const vMap = typeof node.attributes.virtualChildMap === 'string'
                    ? JSON.parse(node.attributes.virtualChildMap)
                    : node.attributes.virtualChildMap;
                if (vMap[node.id]) {
                    ids.push(...vMap[node.id].filter(id => !nodeExclusions.includes(id)));
                }
            } catch (e) { }
        }

        // C. Recursive Sources (Reference of Reference)
        if (node.sourceIds) {
            node.sourceIds.forEach(sId => {
                const sNode = currentNodes[sId];
                if (sNode) {
                    ids.push(...gatherChildrenFromSource(sNode, visited));
                }
            });
        }
        return ids;
    };

    // 1. Determine local exclusions for 'original'
    let originalExcludedIds: string[] = [];
    try {
        if (original.attributes?.excludedIds) {
            const parsed = typeof original.attributes.excludedIds === 'string'
                ? JSON.parse(original.attributes.excludedIds)
                : original.attributes.excludedIds;
            originalExcludedIds.push(...parsed);
        }
        if (original.attributes?.disconnectedIds) {
            const parsed = typeof original.attributes.disconnectedIds === 'string'
                ? JSON.parse(original.attributes.disconnectedIds)
                : original.attributes.disconnectedIds;
            originalExcludedIds.push(...parsed);
        }
    } catch (e) { }

    // 2. Determine what children to copy
    const childrenIdsToCopy: string[] = [];

    // A. Real Children of Original (Filtered)
    if (original.childrenIds) {
        childrenIdsToCopy.push(...original.childrenIds.filter(id => !originalExcludedIds.includes(id)));
    }

    // B. Virtual Children (References)
    if (!preserveReferences && original.sourceIds && original.sourceIds.length > 0) {
        const visitedSources = new Set<string>();
        original.sourceIds.forEach(srcId => {
            const srcNode = currentNodes[srcId];
            if (srcNode) {
                childrenIdsToCopy.push(...gatherChildrenFromSource(srcNode, visitedSources));
            }
        });
    }

    // C. Grafted Children (Virtual Child Map) of Original (Context-Aware)
    // 1. Check passed map (from Source Root)
    if (sourceVirtualChildMap[original.id]) {
        childrenIdsToCopy.push(...sourceVirtualChildMap[original.id].filter(id => !originalExcludedIds.includes(id)));
    }
    // 2. Check node's own map (if it is a Root-like node or we are copying a Root)
    if (original.attributes?.virtualChildMap) {
        try {
            const vMap = typeof original.attributes.virtualChildMap === 'string'
                ? JSON.parse(original.attributes.virtualChildMap)
                : original.attributes.virtualChildMap;
            // Only add if not already added (though Set handles duplicates, order might matter)
            if (vMap[original.id]) {
                childrenIdsToCopy.push(...vMap[original.id].filter(id => !originalExcludedIds.includes(id)));
            }
        } catch (e) { }
    }

    const newId = `copy-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    // 3. Clean attributes
    const newAttributes = { ...(original.attributes || {}) };
    newAttributes.excludedIds = '[]';

    // Only reset virtual maps if NOT preserving references (e.g., standard product copy)
    // For System Root copies, we need virtualChildMap to correctly map categories to system options!
    if (!preserveReferences) {
        newAttributes.virtualChildMap = '{}';
        newAttributes.virtualLabelOverrides = '{}';
        delete newAttributes.originalSourceId;
        delete newAttributes.sourceId;
    } else {
        // If preserving references (System Root), keep the virtual mappings!
        // This ensures StandardCost can traverse the tree correctly (stopping at categories)
        // because the node IDs are preserved via sourceIds.
    }

    // 4. Determine Type
    let newType = original.type;
    if (newType === 'ROOT') {
        if (newParentId !== null) {
            newType = 'CATEGORY';
            if ((newAttributes as any).nodeType === 'root') {
                (newAttributes as any).nodeType = 'category';
            }
        }
    } else {
        if (!preserveReferences && original.sourceIds && original.sourceIds.length > 0) {
            newType = 'CATEGORY';
        }
    }

    // 5. Create the New Node
    const newNode: NodeData = {
        ...original,
        id: newId,
        label: labelOverride || original.label,
        type: newType,
        parentId: newParentId,
        childrenIds: [], // Will be filled
        sourceIds: preserveReferences ? [...(original.sourceIds || [])] : [],
        attributes: newAttributes
    };

    newNodesMap[newId] = newNode;

    // 6. Filter & Recursively Copy Children
    const uniqueChildren = [...new Set(childrenIdsToCopy)];

    let overrides: Record<string, string> = {};
    if (original.attributes?.virtualLabelOverrides) {
        try { overrides = JSON.parse(original.attributes.virtualLabelOverrides); } catch (e) { }
    }

    uniqueChildren.forEach(childId => {
        // Exclusions handled during gathering phase (specifically for references).
        // For direct children, we filter again to be safe.
        // Check Exclusions: Local AND Global
        if (!originalExcludedIds.includes(childId) && !globalExclusions.includes(childId)) {
            const childOverride = overrides[childId];
            const copiedChildId = deepCopyNode(childId, newId, currentNodes, newNodesMap, preserveReferences, childOverride, globalExclusions, sourceVirtualChildMap);
            if (copiedChildId) {
                newNode.childrenIds.push(copiedChildId);
            }
        }
    });

    return newId;
};

// --- Interfaces for Components ---

interface TreeHandlers {
    onToggleExpand: (pathId: string) => void;
    onContextMenu: (e: React.MouseEvent, nodeId: string, isVirtual: boolean, path: string[], virtualParentId?: string) => void;
    onDragStart: (e: React.DragEvent, id: string) => void;
    onDragOver: (e: React.DragEvent, nodeId: string) => void;
    onDrop: (e: React.DragEvent, targetId: string) => void;
    onDragEnd: () => void;
    onEdit: (node: NodeData, isVirtual: boolean, hostNodeId?: string, labelOverride?: string) => void;
    onOpenLinkManager: (e: React.MouseEvent, nodeId: string, hostNodeId: string) => void;
    onUnlink: (nodeId: string, parentId: string) => void;
    onRestoreName: (nodeId: string, hostNodeId: string) => void;
}

interface TreeNodeProps {
    nodeId: string;
    path: string[];
    level: number;
    isVirtual: boolean;
    virtualParentId?: string;
    nodes: Record<string, NodeData>;
    expandedPaths: Set<string>;
    handlers: TreeHandlers;
    searchText: string;
    customNodeTypes: CustomNodeType[];
    draggingId: string | null;
    menuActivePath: string | null;
    isInspectorActive?: boolean;
}

interface SelectorContext {
    excludedIds: string[];
    virtualChildMap: Record<string, string[]>;
}

interface NodeSelectorItemProps {
    node: NodeData;
    nodes: Record<string, NodeData>;
    onSelect: (id: string) => void;
    selectedId: string | null;
    level?: number;
    context?: SelectorContext;
}

const TreeNode = memo(({
    nodeId, path, level, isVirtual, virtualParentId,
    nodes, expandedPaths, handlers, searchText, customNodeTypes, draggingId, menuActivePath, isInspectorActive
}: TreeNodeProps) => {
    const node = nodes[nodeId];
    if (!node) return null;

    const pathId = path.join('/');
    const isCycle = path.slice(0, -1).includes(nodeId);
    const isMatch = searchText && node.label.toLowerCase().includes(searchText.toLowerCase());
    const isDimmed = searchText && !isMatch;

    const hostNodeId = isVirtual ? virtualParentId : nodeId;
    const hostNode = hostNodeId ? nodes[hostNodeId] : null;

    let allExcludedIds: string[] = [];
    let labelOverrides: Record<string, string> = {};
    let virtualChildMap: Record<string, string[]> = {};

    try {
        if (hostNode?.attributes?.excludedIds) {
            const parsed = typeof hostNode.attributes.excludedIds === 'string' ? JSON.parse(hostNode.attributes.excludedIds) : hostNode.attributes.excludedIds;
            allExcludedIds.push(...parsed);
        }
        if (hostNode?.attributes?.disconnectedIds) {
            const parsed = typeof hostNode.attributes.disconnectedIds === 'string' ? JSON.parse(hostNode.attributes.disconnectedIds) : hostNode.attributes.disconnectedIds;
            allExcludedIds.push(...parsed);
        }
        if (hostNode?.attributes?.virtualLabelOverrides) labelOverrides = JSON.parse(hostNode.attributes.virtualLabelOverrides);
        if (hostNode?.attributes?.virtualChildMap) virtualChildMap = JSON.parse(hostNode.attributes.virtualChildMap);
    } catch (e) { }

    const graftedChildIds = virtualChildMap[nodeId] || [];
    const effectiveLabel = (isVirtual && labelOverrides[nodeId]) ? labelOverrides[nodeId] : node.label;
    const isRenamed = isVirtual && !!labelOverrides[nodeId];

    const connectedChildren = (node.sourceIds || [])
        .flatMap(sourceId => {
            const sourceNode = nodes[sourceId];
            return sourceNode ? sourceNode.childrenIds : [];
        })
        .filter(childId => !allExcludedIds.includes(childId));

    const hasRealChildren = node.childrenIds && node.childrenIds.length > 0;
    const hasVirtualChildren = connectedChildren.length > 0;
    const hasGraftedChildren = graftedChildIds.length > 0;
    const hasChildren = hasRealChildren || hasVirtualChildren || hasGraftedChildren;

    const excludedRealChildren = (node.childrenIds || []).filter(id => allExcludedIds.includes(id));
    const potentialVirtualChildren = (node.sourceIds || []).flatMap(sourceId => nodes[sourceId]?.childrenIds || []);
    const excludedVirtualChildren = potentialVirtualChildren.filter(id => allExcludedIds.includes(id));
    const disconnectedChildrenIds = [...excludedRealChildren, ...excludedVirtualChildren];
    const activeSourceCount = node.sourceIds?.length || 0;
    const hasConnections = activeSourceCount > 0 || disconnectedChildrenIds.length > 0;

    const isExpanded = expandedPaths.has(pathId);

    const getNodeTypeInfo = (n: NodeData) => {
        if (n.type === 'ROOT') {
            const rootStyle = customNodeTypes.find(t => t.id === 'root') || DEFAULT_NODE_TYPES[0];
            return rootStyle;
        }
        let typeDef = n.attributes?.nodeType ? customNodeTypes.find(t => t.id === n.attributes!.nodeType) : undefined;
        if (!typeDef) {
            if (n.type === 'CATEGORY') typeDef = customNodeTypes.find(t => t.id === 'category') || DEFAULT_NODE_TYPES[1];
            else if (n.type === 'DATA') typeDef = customNodeTypes.find(t => t.id === 'product') || DEFAULT_NODE_TYPES[3];
            else typeDef = DEFAULT_NODE_TYPES[3];
        }
        return typeDef;
    };

    const typeInfo = getNodeTypeInfo(node);
    const IconComp = ICON_MAP[typeInfo.icon] || Box;
    const isDragging = draggingId === nodeId;
    const isMenuOpen = menuActivePath === pathId;

    const handleContextMenu = (e: React.MouseEvent) => {
        if (isInspectorActive) return;
        e.preventDefault();
        e.stopPropagation();
        handlers.onContextMenu(e, nodeId, isVirtual, path, virtualParentId);
    };

    return (
        <div id={`node-${nodeId}`} className="relative select-none">
            <div
                className={`flex items-center gap-2 py-1.5 px-2 rounded-lg transition-colors group/node 
                    ${isMenuOpen ? 'bg-gray-100' : 'hover:bg-white/50'}
                    ${isMatch ? 'bg-yellow-100 ring-1 ring-yellow-300' : ''}
                    ${isDimmed ? 'opacity-30' : 'opacity-100'}
                    ${isDragging ? 'opacity-50 border-blue-300 border-dashed border' : ''}
                    ${isVirtual ? 'text-gray-500 italic' : 'text-gray-700'}
                `}
                style={{ marginLeft: level * 24 }}
                onMouseDown={(e) => e.stopPropagation()}
                onContextMenu={handleContextMenu}
            >
                <button
                    onClick={(e) => { e.stopPropagation(); handlers.onToggleExpand(pathId); }}
                    className={`p-0.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors ${!hasChildren || isCycle ? 'invisible' : ''} ${isVirtual ? 'text-violet-500' : ''}`}
                >
                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>

                <div
                    draggable={!isVirtual && !isInspectorActive}
                    onDragStart={(e) => !isInspectorActive && handlers.onDragStart(e, nodeId)}
                    onDragOver={(e) => !isInspectorActive && handlers.onDragOver(e, nodeId)}
                    onDrop={(e) => !isInspectorActive && handlers.onDrop(e, nodeId)}
                    onDragEnd={handlers.onDragEnd}
                    onClick={(e) => {
                        if (isInspectorActive) return;
                        if (hasConnections) {
                            e.stopPropagation();
                            handlers.onOpenLinkManager(e, nodeId, hostNodeId || nodeId);
                        }
                    }}
                    className={`p-1 rounded-md border 
                        ${hasConnections ? 'bg-violet-100 text-violet-700 border-violet-400 ring-1 ring-violet-300' : typeInfo.color} 
                        ${!isVirtual && !isInspectorActive ? 'cursor-grab active:cursor-grabbing' : 'cursor-default opacity-80 border-dashed border-violet-300'} 
                        ${hasConnections && !isInspectorActive ? 'cursor-pointer hover:bg-violet-200' : 'hover:scale-110'}
                        transition-transform
                    `}
                    title={hasConnections ? `연결 관리 (연결: ${activeSourceCount}, 숨김: ${disconnectedChildrenIds.length})` : ''}
                >
                    <IconComp size={14} />
                </div>

                <span
                    className="text-sm font-medium cursor-pointer truncate max-w-[200px]"
                    onDoubleClick={() => !isInspectorActive && handlers.onEdit(node, isVirtual, hostNodeId, effectiveLabel)}
                    title={effectiveLabel}
                >
                    {effectiveLabel}
                    {isRenamed && <span className="text-[10px] text-blue-400 ml-1 font-normal">(수정됨)</span>}
                </span>

                <div className="ml-auto flex items-center gap-1 opacity-0 group-hover/node:opacity-100 transition-opacity">
                    {!isInspectorActive && (
                        <button
                            onClick={handleContextMenu}
                            className={`p-1 rounded transition-all text-gray-400 hover:text-gray-600 hover:bg-gray-200 ${isMenuOpen ? 'opacity-100 bg-gray-200' : ''}`}
                            title="설정"
                        >
                            <MoreHorizontal size={14} />
                        </button>
                    )}
                </div>
            </div>

            <AnimatePresence>
                {isExpanded && hasChildren && !isCycle && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden pl-0"
                    >
                        {node.childrenIds
                            .filter(childId => !isVirtual || !allExcludedIds.includes(childId))
                            .map(childId => (
                                <TreeNode
                                    key={`${pathId}/${childId}`}
                                    nodeId={childId}
                                    path={[...path, childId]}
                                    level={level + 1}
                                    isVirtual={isVirtual}
                                    virtualParentId={virtualParentId}
                                    nodes={nodes}
                                    expandedPaths={expandedPaths}
                                    handlers={handlers}
                                    searchText={searchText}
                                    customNodeTypes={customNodeTypes}
                                    draggingId={draggingId}
                                    menuActivePath={menuActivePath}
                                    isInspectorActive={isInspectorActive}
                                />
                            ))
                        }
                        {connectedChildren.map((childId, idx) => (
                            <TreeNode
                                key={`${pathId}/v-${childId}-${idx}`}
                                nodeId={childId}
                                path={[...path, childId]}
                                level={level + 1}
                                isVirtual={true}
                                virtualParentId={isVirtual ? virtualParentId : nodeId}
                                nodes={nodes}
                                expandedPaths={expandedPaths}
                                handlers={handlers}
                                searchText={searchText}
                                customNodeTypes={customNodeTypes}
                                draggingId={draggingId}
                                menuActivePath={menuActivePath}
                                isInspectorActive={isInspectorActive}
                            />
                        ))}
                        {graftedChildIds.map((childId, idx) => (
                            <TreeNode
                                key={`${pathId}/g-${childId}-${idx}`}
                                nodeId={childId}
                                path={[...path, childId]}
                                level={level + 1}
                                isVirtual={false}
                                virtualParentId={undefined}
                                nodes={nodes}
                                expandedPaths={expandedPaths}
                                handlers={handlers}
                                searchText={searchText}
                                customNodeTypes={customNodeTypes}
                                draggingId={draggingId}
                                menuActivePath={menuActivePath}
                                isInspectorActive={isInspectorActive}
                            />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
});

// Selector Item
const NodeSelectorItem = memo(({ node, nodes, onSelect, selectedId, level = 0, context }: NodeSelectorItemProps) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const derivedContext = useMemo(() => {
        if (level === 0) {
            const attr = node.attributes || {};
            let excluded: string[] = [];
            let vMap: Record<string, string[]> = {};
            if (attr.excludedIds) {
                try {
                    const parsed = typeof attr.excludedIds === 'string' ? JSON.parse(attr.excludedIds) : attr.excludedIds;
                    excluded.push(...parsed);
                } catch (e) { }
            }
            if (attr.disconnectedIds) {
                try {
                    const parsed = typeof attr.disconnectedIds === 'string' ? JSON.parse(attr.disconnectedIds) : attr.disconnectedIds;
                    excluded.push(...parsed);
                } catch (e) { }
            }
            if (attr.virtualChildMap) {
                try { vMap = typeof attr.virtualChildMap === 'string' ? JSON.parse(attr.virtualChildMap) : attr.virtualChildMap; } catch (e) { }
            }
            return { excludedIds: excluded, virtualChildMap: vMap };
        }
        return context || { excludedIds: [], virtualChildMap: {} };
    }, [node, level, context]);

    const displayChildrenIds = useMemo(() => {
        const { excludedIds, virtualChildMap } = derivedContext;
        const direct = (node.childrenIds || []).filter(id => !excludedIds.includes(id));
        const virtual = (node.sourceIds || []).flatMap(srcId => {
            const srcNode = nodes[srcId];
            if (!srcNode) return [];
            return (srcNode.childrenIds || []).filter(id => !excludedIds.includes(id));
        });
        const graftedIds = virtualChildMap[node.id] || [];
        const grafted = graftedIds.filter(id => !excludedIds.includes(id));
        return [...direct, ...virtual, ...grafted];
    }, [node, nodes, derivedContext]);

    const hasChildren = displayChildrenIds.length > 0;

    return (
        <div>
            <div
                className={`flex items-center gap-1 py-1.5 px-2 rounded cursor-pointer text-sm transition-colors ${selectedId === node.id ? 'bg-blue-100 text-blue-700 font-bold' : 'hover:bg-gray-50 text-gray-700'}`}
                style={{ paddingLeft: level * 16 + 8 }}
                onClick={() => onSelect(node.id)}
            >
                {hasChildren ? (
                    <button
                        onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
                        className="p-0.5 rounded hover:bg-gray-200 text-gray-400"
                    >
                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>
                ) : <span className="w-[18px]" />}
                <span className="truncate">{node.label}</span>
            </div>
            {isExpanded && hasChildren && (
                <div>
                    {displayChildrenIds.map((childId, idx) => {
                        const childNode = nodes[childId];
                        if (!childNode) return null;
                        return (
                            <NodeSelectorItem
                                key={`${childId}-${idx}`}
                                node={childNode}
                                nodes={nodes}
                                onSelect={onSelect}
                                selectedId={selectedId}
                                level={level + 1}
                                context={derivedContext}
                            />
                        );
                    })}
                </div>
            )}
        </div>
    );
});

const MindMapSystem: React.FC<MindMapSystemProps> = ({ isInspectorActive, forcedRootId }) => {
    const { nodes, setNodes } = useProductContext();
    const { partners } = usePartnerContext();
    const { theme } = useAdminTheme(); // 테마 변경 시 즉시 리렌더링

    const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
    const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
    const [visibleRootIds, setVisibleRootIds] = useState<Set<string>>(new Set());
    const [boxStates, setBoxStates] = useState<Record<string, BoxState>>({});

    // UI States
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, nodeId: string, isVirtual: boolean, path: string[], virtualParentId?: string } | null>(null);
    const [linkManagerPopup, setLinkManagerPopup] = useState<{ x: number, y: number, nodeId: string, hostNodeId: string, activeTab: 'LINKED' | 'BROKEN' } | null>(null);
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [searchText, setSearchText] = useState('');
    const [customNodeTypes, setCustomNodeTypes] = useState(DEFAULT_NODE_TYPES);
    const [showAttrManager, setShowAttrManager] = useState(false);
    const [newTypeLabel, setNewTypeLabel] = useState('');
    const [partnerSearch, setPartnerSearch] = useState('');
    const [lastSelectedTypeId, setLastSelectedTypeId] = useState<string>('product');
    const [history, setHistory] = useState<{ id: string; timestamp: string; action: string; snapshot: string; rootId?: string }[]>([]);

    const containerRef = useRef<HTMLDivElement>(null);
    const activeOp = useRef<{ type: 'RESIZE' | 'PAN' | 'MOVE', rootId: string, startX: number, startY: number, startState: BoxState } | null>(null);
    const isCanvasDragging = useRef(false);
    const canvasDragStart = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });
    const maxZIndex = useRef(1);
    const headerScrollRef = useRef<HTMLDivElement>(null);
    const isHeaderDragging = useRef(false);
    const headerDragStartX = useRef(0);
    const headerScrollLeftStart = useRef(0);
    const wasHeaderDragged = useRef(false);

    const fileInputRefs = useRef<HTMLInputElement>(null);

    const [addModal, setAddModal] = useState<{ isOpen: boolean; parentId: string | null; typeDef: any | null; inputValue: string; isParentVirtual?: boolean; hostNodeId?: string }>({ isOpen: false, parentId: null, typeDef: null, inputValue: '', isParentVirtual: false });
    const [editModal, setEditModal] = useState<{ isOpen: boolean; nodeId: string | null; label: string; typeId: string; isVirtual: boolean; hostNodeId?: string }>({ isOpen: false, nodeId: null, label: '', typeId: '', isVirtual: false });
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; nodeId: string | null; nodeLabel: string; isVirtual: boolean; parentId?: string }>({ isOpen: false, nodeId: null, nodeLabel: '', isVirtual: false });

    const [nodePickerModal, setNodePickerModal] = useState<{
        isOpen: boolean;
        targetParentId: string | null;
        selectedSourceId: string | null;
        mode: 'CONNECT' | 'COPY';
        isTargetVirtual?: boolean;
        targetHostId?: string;
    }>({ isOpen: false, targetParentId: null, selectedSourceId: null, mode: 'CONNECT' });

    // --- Computed Roots based on Selection ---
    const rootNodes = useMemo(() => {
        if (!nodes || typeof nodes !== 'object') return [];

        if (forcedRootId) {
            const forced = nodes[forcedRootId];
            return forced ? [forced] : [];
        }

        const allRoots = (Object.values(nodes) as NodeData[]).filter(n => n.type === 'ROOT');

        const partnerRoots = allRoots.filter(r => r.attributes?.partnerId);
        const templateRoots = allRoots.filter(r => !r.attributes?.partnerId);

        if (selectedPartnerId) {
            return partnerRoots.filter(r => r.attributes?.partnerId === selectedPartnerId);
        } else {
            return templateRoots.sort((a, b) => a.id === 'root' ? -1 : 1);
        }
    }, [nodes, selectedPartnerId, forcedRootId]);

    // Forced Root Visibility
    useEffect(() => {
        if (forcedRootId) {
            setVisibleRootIds(new Set([forcedRootId]));
            setExpandedPaths(prev => new Set([...prev, forcedRootId]));

            // Auto layout
            setBoxStates(prev => {
                if (prev[forcedRootId]) return prev;
                return {
                    ...prev,
                    [forcedRootId]: { x: 20, y: 20, width: 800, height: 600, zIndex: 1, pan: { x: 0, y: 0 }, isMinimized: false, lastLayout: { width: 800, height: 600, pan: { x: 0, y: 0 } } }
                };
            });
        }
    }, [forcedRootId]);

    // Ensure Partner Roots exist and are Synced (ONLY LABEL SYNC)
    // Now that basic_tree.json data is correct, this should work properly
    useEffect(() => {
        if (selectedPartnerId) {
            const templateRoots = (Object.values(nodes) as NodeData[]).filter(n =>
                n.type === 'ROOT' && !n.attributes?.partnerId
            );

            let hasChanges = false;
            const nextNodes = { ...nodes };
            const newNodesMap: Record<string, NodeData> = {};

            templateRoots.forEach(template => {
                const partnerRootId = `${template.id}-partner-${selectedPartnerId}`;
                const existingPartnerRoot = nextNodes[partnerRootId];

                if (!existingPartnerRoot) {
                    // Create if missing: DEEP COPY
                    // For system roots, preserve references (sourceIds) to maintain connection to global tree
                    const isSystemRoot = template.label === '시스템';
                    const preserveRefs = isSystemRoot; // Preserve sourceIds for system roots

                    console.log(`[MindMapSystem] Creating partner root: ${partnerRootId} from template: ${template.id} (preserveReferences: ${preserveRefs})`);

                    // 디버깅: 템플릿의 sourceIds 확인
                    if (preserveRefs && (!template.sourceIds || template.sourceIds.length === 0)) {
                        console.warn(`[MindMapSystem] WARNING: Template ${template.id} has no sourceIds despite being a system root!`);
                        // Force sourceIds if missing for system root (referencing global system root)
                        if (isSystemRoot) {
                            console.log(`[MindMapSystem] Forcing sourceIds for system root: ['root-1770804399939']`);
                            template.sourceIds = ['root-1770804399939'];
                        }
                    }

                    console.log(`[MindMapSystem] Template sourceIds:`, template.sourceIds);
                    console.log(`[MindMapSystem] Template from nextNodes:`, nextNodes[template.id]?.sourceIds);
                    const newRootId = deepCopyNode(template.id, null, nextNodes, newNodesMap, preserveRefs);

                    if (newRootId && newNodesMap[newRootId]) {
                        const generatedRoot = newNodesMap[newRootId];
                        delete newNodesMap[newRootId];

                        generatedRoot.id = partnerRootId;
                        generatedRoot.childrenIds.forEach(childId => {
                            if (newNodesMap[childId]) newNodesMap[childId].parentId = partnerRootId;
                        });

                        generatedRoot.attributes = {
                            ...generatedRoot.attributes,
                            partnerId: selectedPartnerId,
                            originalRootId: template.id,
                            nodeType: 'root'
                        };

                        generatedRoot.type = 'ROOT';

                        newNodesMap[partnerRootId] = generatedRoot;
                        hasChanges = true;
                        console.log(`[MindMapSystem] Created partner root with ${generatedRoot.childrenIds.length} children, sourceIds: ${generatedRoot.sourceIds?.length || 0}`);
                    }
                } else {
                    // Sync Label Only - Root node name is connected
                    if (existingPartnerRoot.label !== template.label) {
                        nextNodes[partnerRootId] = {
                            ...existingPartnerRoot,
                            label: template.label
                        };
                        hasChanges = true;
                    }
                }
            });

            if (hasChanges) {
                setNodes(prev => ({ ...prev, ...nextNodes, ...newNodesMap }));
            }
        }
    }, [selectedPartnerId, setNodes]); // FIXED: Removed 'nodes' to prevent infinite loop

    // ... (Initial Layout) ...
    useEffect(() => {
        setBoxStates(prev => {
            const next = { ...prev };
            let hasChanges = false;
            rootNodes.forEach((root, idx) => {
                if (!next[root.id]) {
                    next[root.id] = {
                        x: 50 + (idx * 40), y: 50 + (idx * 40), width: 260, height: 400, zIndex: 1,
                        pan: { x: 0, y: 0 }, lastLayout: { width: 600, height: 500, pan: { x: 0, y: 0 } },
                        isMinimized: false
                    };
                    hasChanges = true;
                }
            });
            return hasChanges ? next : prev;
        });

        setVisibleRootIds(prev => {
            const next = new Set(prev);
            rootNodes.forEach(r => {
                if (!next.has(r.id)) next.add(r.id);
            });
            return next;
        });

        setExpandedPaths(prev => {
            const next = new Set(prev);
            rootNodes.forEach(r => next.add(r.id));
            return next;
        });
    }, [rootNodes]);

    const filteredPartners = useMemo(() => {
        if (!partnerSearch) return partners;
        return partners.filter(p => p.partnerName.toLowerCase().includes(partnerSearch.toLowerCase()));
    }, [partners, partnerSearch]);

    const findRootId = (startId: string, currentNodes: Record<string, NodeData>): string | undefined => {
        if (!currentNodes) return undefined;
        let curr = currentNodes[startId];
        let safety = 0;
        while (curr && safety < 100) {
            if (curr.type === 'ROOT') return curr.id;
            if (!curr.parentId) return undefined;
            curr = currentNodes[curr.parentId];
            safety++;
        }
        return undefined;
    };

    const saveHistory = useCallback((action: string, contextNodeId?: string) => {
        const rootId = contextNodeId ? findRootId(contextNodeId, nodes) : undefined;
        setHistory(prev => {
            const newEntry = {
                id: `hist-${Date.now()}-${Math.random()}`,
                timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                action,
                snapshot: JSON.stringify(nodes),
                rootId
            };
            return [newEntry, ...prev].slice(0, 50);
        });
    }, [nodes]);

    const handleReorderLayout = () => {
        setBoxStates(prev => {
            const next = { ...prev };
            const PADDING = 50, GAP = 30, W = 260, H = 400;
            const containerW = containerRef.current?.clientWidth || 1200;
            const cols = Math.max(1, Math.floor((containerW - PADDING * 2) / (W + GAP)));

            rootNodes.forEach((r, i) => {
                const col = i % cols;
                const row = Math.floor(i / cols);
                const current = prev[r.id] || { width: W, height: H, pan: { x: 0, y: 0 }, x: 0, y: 0, zIndex: 1, lastLayout: { width: W, height: H, pan: { x: 0, y: 0 } }, isMinimized: false };
                next[r.id] = { ...current, x: PADDING + col * (W + GAP), y: PADDING + row * (H + GAP), width: W, height: H, isMinimized: false, zIndex: 1 };
            });
            return next;
        });
    };

    const handleExport = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(nodes, null, 2));
        const anchor = document.createElement('a');
        anchor.setAttribute("href", dataStr);
        anchor.setAttribute("download", `mindmap_backup_${new Date().toISOString().slice(0, 10)}.json`);
        document.body.appendChild(anchor); anchor.click(); anchor.remove();
    };


    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target?.result as string);
                if (json && typeof json === 'object') {
                    const currentNodeCount = Object.keys(nodes).length;
                    const newNodeCount = Object.keys(json).length;
                    const message = `파일의 노드 개수: ${newNodeCount}개\n현재 노드 개수: ${currentNodeCount}개\n\n현재 트리를 덮어쓰고 파일의 데이터로 복구하시겠습니까?\n(이 작업은 되돌릴 수 없습니다.)`;

                    if (confirm(message)) {
                        setNodes(json);
                        alert(`데이터를 성공적으로 불러왔습니다.\n${newNodeCount}개의 노드가 로드되었습니다.`);
                    }
                } else {
                    alert("잘못된 파일 형식입니다.");
                }
            } catch (err) {
                console.error(err);
                alert("파일을 읽는 중 오류가 발생했습니다.");
            }
        };
        reader.readAsText(file);
        e.target.value = ''; // Reset input
    };

    const handleCreateRoot = () => {
        saveHistory('새 루트 생성');
        const newId = `root-${Date.now()}`;
        const newRoot: NodeData = {
            id: newId, parentId: null, type: 'ROOT', label: '새 루트', isExpanded: false, childrenIds: [],
            attributes: { nodeType: 'root' }
        };
        if (selectedPartnerId) {
            newRoot.attributes = { ...newRoot.attributes, partnerId: selectedPartnerId };
        }
        setNodes(prev => ({ ...prev, [newId]: newRoot }));
        setVisibleRootIds(prev => new Set(prev).add(newId));
        setExpandedPaths(prev => new Set(prev).add(newId));
    };

    const confirmAddNode = () => {
        if (!addModal.parentId || !addModal.typeDef) return;
        const finalLabel = addModal.inputValue.trim() || addModal.typeDef.label;
        const newId = `node-${Date.now()}`;
        setLastSelectedTypeId(addModal.typeDef.id);
        const rootContextId = addModal.isParentVirtual ? addModal.hostNodeId : addModal.parentId;
        saveHistory(addModal.isParentVirtual ? '가상 노드 하위 추가' : '노드 추가', rootContextId!);

        if (addModal.isParentVirtual && addModal.hostNodeId) {
            const newNode: NodeData = { id: newId, parentId: addModal.parentId, type: addModal.typeDef.id === 'category' ? 'CATEGORY' : 'DATA', label: finalLabel, isExpanded: true, childrenIds: [], attributes: { nodeType: addModal.typeDef.id } };
            setNodes(prev => {
                const next = { ...prev, [newId]: newNode };
                const hostNode = next[addModal.hostNodeId!];
                if (hostNode) {
                    let map = {};
                    try { map = JSON.parse(hostNode.attributes?.virtualChildMap || '{}'); } catch (e) { }
                    if (!map[addModal.parentId!]) map[addModal.parentId!] = [];
                    map[addModal.parentId!].push(newId);
                    next[addModal.hostNodeId!] = { ...hostNode, attributes: { ...hostNode.attributes, virtualChildMap: JSON.stringify(map) } };
                }
                return next;
            });
        } else {
            const newNode: NodeData = { id: newId, parentId: addModal.parentId, type: addModal.typeDef.id === 'category' ? 'CATEGORY' : 'DATA', label: finalLabel, isExpanded: true, childrenIds: [], attributes: { nodeType: addModal.typeDef.id } };
            setNodes(prev => {
                const parent = prev[addModal.parentId!];
                if (!parent) return prev;
                return { ...prev, [addModal.parentId!]: { ...parent, childrenIds: [...parent.childrenIds, newId], isExpanded: true }, [newId]: newNode };
            });
            setExpandedPaths(prev => new Set(prev).add(addModal.parentId!));
        }
        setAddModal(prev => ({ ...prev, isOpen: false }));
    };

    // --- Reset Partner Tree to Template Function ---
    // Moved up to be accessible by executeDeleteNode
    const handleResetToTemplate = (targetRootId: string) => {
        const targetRoot = nodes[targetRootId];
        if (!targetRoot) return;

        // 1. Find Source (Template)
        let sourceRootId = targetRoot.attributes?.originalRootId;
        if (!sourceRootId) {
            const template = (Object.values(nodes) as NodeData[]).find(n =>
                n.type === 'ROOT' &&
                !n.attributes?.partnerId &&
                n.label === targetRoot.label
            );
            if (template) sourceRootId = template.id;
        }

        if (!sourceRootId || !nodes[sourceRootId]) {
            alert("원본 기본설정 트리를 찾을 수 없습니다.");
            return;
        }

        // Trigger History Save
        saveHistory('트리 초기화 (기본설정 복구)', targetRootId);

        // 3. Execution - Clean Mirror Copy (Preserving References for Live Sync)
        setNodes(prev => {
            const next = { ...prev };
            const currentTarget = next[targetRootId];
            if (!currentTarget) return prev;

            const sourceRoot = next[sourceRootId!];
            const newNodesMap: Record<string, NodeData> = {};

            // A. Collect existing children and grafted nodes of Target to delete
            const idsToDelete = new Set<string>();
            const collectIdsToDelete = (nodeId: string) => {
                if (idsToDelete.has(nodeId)) return;
                const node = next[nodeId];
                if (!node) return;
                idsToDelete.add(nodeId);

                // Real children
                if (node.childrenIds) {
                    node.childrenIds.forEach(collectIdsToDelete);
                }

                // Virtual/Grafted children (These are often partner-specific real nodes)
                try {
                    const vMap = JSON.parse(node.attributes?.virtualChildMap || '{}');
                    const grafted = vMap[nodeId] || [];
                    grafted.forEach(collectIdsToDelete);
                } catch (e) { }
            };

            // Delete existing children (but not the root itself)
            if (currentTarget.childrenIds) {
                currentTarget.childrenIds.forEach(collectIdsToDelete);
            }
            try {
                const rootVMap = JSON.parse(currentTarget.attributes?.virtualChildMap || '{}');
                const rootGrafted = rootVMap[targetRootId] || [];
                rootGrafted.forEach(collectIdsToDelete);
            } catch (e) { }

            idsToDelete.forEach(id => {
                if (id !== targetRootId) delete next[id];
            });

            // B. Perform Mirror Copy (Using preserveReferences=true for unified data flow)
            let rootOverrides: Record<string, string> = {};
            try { rootOverrides = JSON.parse(sourceRoot.attributes?.virtualLabelOverrides || '{}'); } catch (e) { }

            let rootExclusions: string[] = [];
            try { rootExclusions = JSON.parse(sourceRoot.attributes?.excludedIds || '[]'); } catch (e) { }

            let rootVirtualMap: Record<string, string[]> = {};
            try { rootVirtualMap = JSON.parse(sourceRoot.attributes?.virtualChildMap || '{}'); } catch (e) { }

            // Gather all visible children (Direct + Virtual) from the source
            const childrenIdsToCopy = gatherAllVisibleChildren(sourceRoot, next, true);
            const newChildrenIds: string[] = [];

            childrenIdsToCopy.forEach(childId => {
                const childOverride = rootOverrides[childId];
                // Switch to true to maintain consistency with the template's reference structure
                const newChildId = deepCopyNode(childId, targetRootId, next, newNodesMap, true, childOverride, rootExclusions, rootVirtualMap);
                if (newChildId) newChildrenIds.push(newChildId);
            });

            // C. Update Target Root to match Source exactly (except identity)
            const cleanSourceAttributes = { ...sourceRoot.attributes };

            // Re-apply essential partner metadata
            cleanSourceAttributes.partnerId = currentTarget.attributes?.partnerId;
            cleanSourceAttributes.originalRootId = sourceRootId;

            // Explicitly reset partner-side customizations to match base
            cleanSourceAttributes.virtualChildMap = '{}';
            cleanSourceAttributes.excludedIds = '[]';
            cleanSourceAttributes.virtualLabelOverrides = '{}';
            cleanSourceAttributes.nodeType = 'root';

            next[targetRootId] = {
                ...sourceRoot,
                id: targetRootId,
                parentId: null,
                childrenIds: newChildrenIds,
                sourceIds: [...(sourceRoot.sourceIds || [])],
                attributes: cleanSourceAttributes
            };

            return { ...next, ...newNodesMap };
        });
    };

    const executeDeleteNode = () => {
        const { nodeId, isVirtual, parentId } = deleteModal;
        if (!nodeId) return;

        const nodeToDelete = nodes[nodeId];

        // SPECIAL LOGIC: Deleting a Partner Root -> Reset to Template (Copy Original)
        // Only if it has an original root ID AND that original root still exists.
        if (!isVirtual && nodeToDelete && nodeToDelete.type === 'ROOT' &&
            nodeToDelete.attributes?.partnerId &&
            nodeToDelete.attributes?.originalRootId &&
            nodes[nodeToDelete.attributes.originalRootId]) {
            handleResetToTemplate(nodeId);
            setDeleteModal({ isOpen: false, nodeId: null, nodeLabel: '', isVirtual: false });
            return;
        }

        saveHistory(deleteModal.isVirtual ? '노드 숨김' : '노드 삭제', parentId || nodeId);

        if (isVirtual && parentId) {
            setNodes(prev => {
                const next = { ...prev };
                const parent = next[parentId];
                if (!parent) return prev;
                let excludedIds = [];
                try { excludedIds = JSON.parse(parent.attributes?.excludedIds || '[]'); } catch (e) { excludedIds = []; }
                if (!excludedIds.includes(nodeId)) {
                    excludedIds.push(nodeId);
                    next[parentId] = { ...parent, attributes: { ...parent.attributes, excludedIds: JSON.stringify(excludedIds) } };
                }
                return next;
            });
        } else if (!isVirtual) {
            // Recursive Delete for Real Nodes
            setNodes(prev => {
                const next = { ...prev };
                const idsToDelete = new Set<string>();

                const collectIds = (id: string) => {
                    idsToDelete.add(id);
                    const n = next[id];
                    if (n && n.childrenIds) {
                        n.childrenIds.forEach(collectIds);
                    }
                };
                collectIds(nodeId);

                // Remove from parent's children list
                const target = next[nodeId];
                if (target && target.parentId && next[target.parentId]) {
                    const p = next[target.parentId];
                    next[target.parentId] = {
                        ...p,
                        childrenIds: p.childrenIds.filter(id => id !== nodeId)
                    };
                }

                // Delete all collected nodes
                idsToDelete.forEach(id => {
                    delete next[id];
                });

                // Also clean up boxStates if it was a root
                if (target && target.type === 'ROOT') {
                    setBoxStates(prevBox => {
                        const nextBox = { ...prevBox };
                        delete nextBox[nodeId];
                        return nextBox;
                    });
                    setVisibleRootIds(prevVisible => {
                        const nextVisible = new Set(prevVisible);
                        nextVisible.delete(nodeId);
                        return nextVisible;
                    });
                }

                return next;
            });
        }
        setDeleteModal({ isOpen: false, nodeId: null, nodeLabel: '', isVirtual: false });
    };

    const onHeaderMouseDown = (e: React.MouseEvent) => {
        isHeaderDragging.current = true;
        wasHeaderDragged.current = false;
        headerDragStartX.current = e.pageX - (headerScrollRef.current?.offsetLeft || 0);
        headerScrollLeftStart.current = headerScrollRef.current?.scrollLeft || 0;
    };
    const onHeaderMouseMove = (e: React.MouseEvent) => {
        if (!isHeaderDragging.current) return;
        e.preventDefault();
        const x = e.pageX - (headerScrollRef.current?.offsetLeft || 0);
        if (Math.abs(x - headerDragStartX.current) > 5) wasHeaderDragged.current = true;
        if (headerScrollRef.current) headerScrollRef.current.scrollLeft = headerScrollLeftStart.current - (x - headerDragStartX.current) * 1.5;
    };
    const handleRootClick = (rootId: string) => { if (wasHeaderDragged.current) return; setVisibleRootIds(prev => { const next = new Set(prev); if (next.has(rootId)) next.delete(rootId); else next.add(rootId); return next; }); };

    useEffect(() => { const onMove = (e: MouseEvent) => { if (!activeOp.current) return; const { type, rootId, startX, startY, startState } = activeOp.current; const deltaX = e.clientX - startX; const deltaY = e.clientY - startY; setBoxStates(prev => { const curr = prev[rootId]; if (!curr) return prev; if (type === 'MOVE') { return { ...prev, [rootId]: { ...curr, x: startState.x + deltaX, y: startState.y + deltaY } }; } else if (type === 'RESIZE') { return { ...prev, [rootId]: { ...curr, width: Math.max(200, startState.width + deltaX), height: Math.max(80, startState.height + deltaY) } }; } else if (type === 'PAN') { return { ...prev, [rootId]: { ...curr, pan: { x: startState.pan.x + deltaX, y: startState.pan.y + deltaY } } }; } return prev; }); }; const onUp = () => { activeOp.current = null; document.body.style.cursor = 'default'; document.body.style.userSelect = 'auto'; }; window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp); return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); }; }, []);
    const startOp = (e: React.MouseEvent, type: 'MOVE' | 'RESIZE' | 'PAN', rootId: string) => {
        if (isInspectorActive) return;
        if (type === 'PAN' && (e.target as HTMLElement).closest('button, .node-box-controls')) return;
        e.preventDefault(); e.stopPropagation();
        const state = boxStates[rootId]; if (!state) return;
        if (type === 'MOVE') { maxZIndex.current++; setBoxStates(prev => ({ ...prev, [rootId]: { ...state, zIndex: maxZIndex.current } })); }
        activeOp.current = { type, rootId, startX: e.clientX, startY: e.clientY, startState: { ...state } };
        document.body.style.cursor = type === 'MOVE' ? 'move' : type === 'RESIZE' ? 'nwse-resize' : 'grabbing';
    };

    const handleEdit = useCallback((node: NodeData, isVirtual: boolean, hostNodeId?: string, labelOverride?: string) => {
        const currentType = node.attributes?.nodeType || 'product';
        setEditModal({ isOpen: true, nodeId: node.id, label: labelOverride || node.label, typeId: currentType, isVirtual, hostNodeId });
        setContextMenu(null);
    }, []);
    const handleUnlink = useCallback((nodeId: string, parentId: string) => {
        const node = nodes[nodeId];
        setDeleteModal({ isOpen: true, nodeId, nodeLabel: node?.label || 'Link', isVirtual: true, parentId });
        setContextMenu(null);
    }, [nodes]);
    const handleRestoreName = (nodeId: string, hostNodeId: string) => {
        saveHistory('노드 이름 복구', hostNodeId);
        setNodes(prev => {
            const next = { ...prev };
            const host = next[hostNodeId];
            if (host) {
                let overrides = {};
                try { overrides = JSON.parse(host.attributes?.virtualLabelOverrides || '{}'); } catch (e) { }
                if (overrides[nodeId]) {
                    delete overrides[nodeId];
                    next[hostNodeId] = { ...host, attributes: { ...host.attributes, virtualLabelOverrides: JSON.stringify(overrides) } };
                }
            }
            return next;
        });
        setContextMenu(null);
    };

    const handleMoveNode = (dragId: string, targetId: string) => {
        if (dragId === targetId) return;

        // Cycle check
        const isDescendant = (parentId: string, childId: string): boolean => {
            if (parentId === childId) return true;
            const node = nodes[parentId];
            if (!node || !node.childrenIds) return false;
            return node.childrenIds.some(id => isDescendant(id, childId));
        };

        if (isDescendant(dragId, targetId)) {
            alert("상위 노드를 하위 노드로 이동할 수 없습니다.");
            return;
        }

        saveHistory('노드 이동', dragId);

        setNodes(prev => {
            const next = { ...prev };
            const dragNode = next[dragId];
            if (!dragNode) return prev;

            const oldParentId = dragNode.parentId;

            // Remove from old parent
            if (oldParentId && next[oldParentId]) {
                const oldParent = next[oldParentId];
                next[oldParentId] = {
                    ...oldParent,
                    childrenIds: oldParent.childrenIds.filter(id => id !== dragId)
                };
            }

            // Add to new parent
            const newParent = next[targetId];
            if (newParent) {
                next[targetId] = {
                    ...newParent,
                    childrenIds: [...(newParent.childrenIds || []), dragId],
                    isExpanded: true
                };
            }

            // Update node parent pointer
            next[dragId] = {
                ...dragNode,
                parentId: targetId
            };

            return next;
        });
    };

    const treeHandlers: TreeHandlers = useMemo(() => ({
        onToggleExpand: (pathId: string) => {
            setExpandedPaths(prev => {
                const next = new Set(prev);
                if (next.has(pathId)) next.delete(pathId);
                else next.add(pathId);
                return next;
            });
        },
        onContextMenu: (e: React.MouseEvent, nodeId: string, isVirtual: boolean, path: string[], virtualParentId?: string) => {
            setContextMenu({ x: e.clientX, y: e.clientY, nodeId, isVirtual, path, virtualParentId });
        },
        onDragStart: (e: React.DragEvent, id: string) => {
            e.stopPropagation();
            setDraggingId(id);
            e.dataTransfer.effectAllowed = 'move';
        },
        onDragOver: (e: React.DragEvent, nodeId: string) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
        },
        onDrop: (e: React.DragEvent, targetId: string) => {
            e.preventDefault();
            e.stopPropagation();
            if (draggingId && draggingId !== targetId) {
                handleMoveNode(draggingId, targetId);
            }
            setDraggingId(null);
        },
        onDragEnd: () => {
            setDraggingId(null);
        },
        onEdit: (node: NodeData, isVirtual: boolean, hostNodeId?: string, labelOverride?: string) => {
            handleEdit(node, isVirtual, hostNodeId, labelOverride);
        },
        onOpenLinkManager: (e: React.MouseEvent, nodeId: string, hostNodeId: string) => {
            setLinkManagerPopup({ x: e.clientX, y: e.clientY, nodeId, hostNodeId, activeTab: 'LINKED' });
        },
        onUnlink: (nodeId: string, parentId: string) => {
            handleUnlink(nodeId, parentId);
        },
        onRestoreName: (nodeId: string, hostNodeId: string) => {
            handleRestoreName(nodeId, hostNodeId);
        }
    }), [nodes, draggingId, handleEdit, handleUnlink]);

    return (
        <div id="mindmap-container" className="flex h-full w-full overflow-hidden" style={{ background: 'var(--admin-bg)' }} onClick={() => { setContextMenu(null); setLinkManagerPopup(null); }}>

            {/* 1. LEFT SIDEBAR: Partner List */}
            {
                !forcedRootId && (
                    <div className="w-72 border-r flex flex-col z-20 shadow-sm flex-shrink-0" style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)' }}>
                        <div className="h-[72px] px-4 border-b flex items-center shrink-0" style={{ background: 'var(--admin-bg)', borderColor: 'var(--admin-border)' }}>
                            <div className="relative w-full">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                                <input
                                    type="text"
                                    placeholder="거래처 검색..."
                                    value={partnerSearch}
                                    onChange={(e) => setPartnerSearch(e.target.value)}
                                    className="w-full pl-8 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:border-blue-500 outline-none transition-all shadow-sm"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto scrollbar-hide">
                            {/* Default Option: Basic Settings Tree */}
                            <button
                                onClick={() => setSelectedPartnerId(null)}
                                className="w-full text-left px-4 py-3 border-b transition-colors group relative"
                                style={selectedPartnerId === null
                                    ? { background: 'var(--theme-primary-bg)', borderLeft: `4px solid var(--theme-primary)`, borderBottomColor: 'var(--admin-border)' }
                                    : { borderLeft: '4px solid transparent', borderBottomColor: 'var(--admin-border)' }}
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <div className={`p-1.5 rounded-lg ${selectedPartnerId === null ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                                        <Network size={16} />
                                    </div>
                                    <span className={`text-sm font-bold ${selectedPartnerId === null ? 'text-blue-700' : 'text-gray-700'}`}>기본설정 트리</span>
                                </div>
                                <p className="text-[10px] text-gray-400 pl-9">표준상품 및 구조 관리</p>
                            </button>

                            {/* Partner List */}
                            {filteredPartners.map(partner => (
                                <button
                                    key={partner.id}
                                    onClick={() => setSelectedPartnerId(selectedPartnerId === partner.id ? null : partner.id)}
                                    className="w-full text-left px-4 py-3 border-b transition-colors group relative"
                                    style={selectedPartnerId === partner.id
                                        ? { background: 'var(--theme-primary-bg)', borderLeft: `4px solid var(--theme-primary)`, borderBottomColor: 'var(--admin-border)' }
                                        : { borderLeft: '4px solid transparent', borderBottomColor: 'var(--admin-border)' }}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="font-bold text-sm truncate pr-2"
                                            style={{ color: selectedPartnerId === partner.id ? 'var(--theme-primary)' : 'var(--admin-text)' }}>
                                            {partner.partnerName}
                                        </div>
                                        {selectedPartnerId === partner.id && <div className="w-2 h-2 rounded-full mt-1.5" style={{ background: 'var(--theme-primary)' }}></div>}
                                    </div>
                                    <div className="flex flex-col gap-0.5 pl-0.5">
                                        <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--admin-text-sub)' }}>
                                            <User size={10} /> {partner.ceoName}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs font-mono" style={{ color: 'var(--admin-text-sub)', opacity: 0.7 }}>
                                            <Phone size={10} /> {partner.companyPhone}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )
            }

            {/* 2. MAIN CANVAS AREA */}
            <div className="flex-1 flex flex-col overflow-hidden relative">
                {/* ... (Header) ... */}
                {!forcedRootId && (
                    <div id="mindmap-header" className="h-[72px] px-6 border-b flex items-center justify-between gap-4 shrink-0 relative z-50 pointer-events-auto" style={{ background: 'var(--admin-bg)', borderColor: 'var(--admin-border)' }}>

                        {/* Left: Create Root & Tabs */}
                        {/* Left: Create Root & Tabs */}
                        <div className="flex items-center gap-3 flex-1 h-full min-w-0 pr-4">
                            <button onClick={handleCreateRoot} className="bg-white hover:bg-blue-50 text-blue-600 border border-blue-200 shadow-sm p-2 rounded-lg transition-colors flex-shrink-0" title="루트 생성"><Plus size={18} /></button>

                            {/* Scrollable Tabs Wrapper */}
                            <div className="flex-1 flex items-center gap-1 min-w-0 relative group/tabs">
                                {/* Scroll Left Button */}
                                <button
                                    onClick={() => headerScrollRef.current?.scrollBy({ left: -200, behavior: 'smooth' })}
                                    className="w-6 h-6 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-400 hover:text-blue-600 hover:border-blue-300 shrink-0 z-10"
                                >
                                    <ChevronLeft size={14} />
                                </button>

                                <div
                                    ref={headerScrollRef}
                                    className="flex-1 flex items-center gap-2 overflow-x-auto scrollbar-hide cursor-grab active:cursor-grabbing select-none h-10 px-1"
                                    onMouseDown={onHeaderMouseDown} onMouseMove={onHeaderMouseMove} onMouseUp={() => isHeaderDragging.current = false} onMouseLeave={() => isHeaderDragging.current = false}
                                >
                                    {rootNodes.map(root => {
                                        const isActive = visibleRootIds.has(root.id);
                                        return (
                                            <button
                                                key={root.id}
                                                id={`tab-root-${root.id}`}
                                                onClick={() => handleRootClick(root.id)}
                                                className="flex items-center gap-2 px-3 py-1.5 rounded-full shadow-sm text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 border"
                                                style={isActive
                                                    ? { background: 'var(--theme-primary)', color: '#ffffff', borderColor: 'var(--theme-primary)' }
                                                    : { background: 'var(--admin-surface)', color: 'var(--admin-text-sub)', borderColor: 'var(--admin-border)' }}
                                            >
                                                <Network size={12} className={isActive ? "text-white" : "text-gray-400"} />
                                                {root.label}
                                            </button>
                                        );
                                    })}
                                    {rootNodes.length === 0 && <span className="text-xs text-gray-400 italic whitespace-nowrap">표시할 트리가 없습니다.</span>}
                                </div>

                                {/* Scroll Right Button */}
                                <button
                                    onClick={() => headerScrollRef.current?.scrollBy({ left: 200, behavior: 'smooth' })}
                                    className="w-6 h-6 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-400 hover:text-blue-600 hover:border-blue-300 shrink-0 z-10"
                                >
                                    <ChevronRight size={14} />
                                </button>
                            </div>
                        </div>

                        {/* Search Bar (Fixed Right) */}
                        <div className="border shadow-sm px-3 py-2 rounded-lg flex items-center gap-2 min-w-[200px] flex-shrink-0 z-20" style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)' }}>
                            <Search size={16} className="text-gray-400" />
                            <input className="outline-none text-xs w-full bg-transparent" placeholder="트리 검색..." value={searchText} onChange={e => setSearchText(e.target.value)} />
                        </div>

                        {/* Right side buttons: Tools & Export only */}
                        <div className="flex items-center gap-2 relative z-50 pointer-events-auto">

                            {/* Import (Load) Button */}
                            <input
                                type="file"
                                ref={fileInputRefs}
                                onChange={handleImport}
                                className="hidden"
                                accept=".json"
                            />
                            <button
                                onClick={() => fileInputRefs.current?.click()}
                                onMouseDown={(e) => e.stopPropagation()}
                                className="flex items-center justify-center bg-white text-gray-600 border border-gray-200 shadow-sm p-2 rounded-lg hover:bg-gray-50 hover:text-blue-600 transition-colors cursor-pointer"
                                title="불러오기"
                            >
                                <Upload size={18} />
                            </button>

                            {/* Export (Save) Button */}
                            <button
                                onClick={handleExport}
                                onMouseDown={(e) => e.stopPropagation()}
                                className="flex items-center justify-center bg-white text-gray-600 border border-gray-200 shadow-sm p-2 rounded-lg hover:bg-gray-50 hover:text-blue-600 transition-colors cursor-pointer"
                                title="전체 저장"
                            >
                                <Download size={18} />
                            </button>

                            <div className="w-px h-6 mx-1" style={{ background: 'var(--admin-border)' }} />

                            {/* Tools */}
                            <button onClick={handleReorderLayout} className="cursor-pointer border shadow-sm p-2 rounded-lg transition-colors" style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)', color: 'var(--admin-text-sub)' }} title="자동 정렬"><LayoutGrid size={18} className="pointer-events-none" /></button>
                            <button onClick={() => setShowAttrManager(true)} className="cursor-pointer border shadow-sm p-2 rounded-lg transition-colors" style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)', color: 'var(--admin-text-sub)' }} title="속성 관리"><Database size={18} className="pointer-events-none" /></button>
                        </div>
                    </div>
                )}

                {/* Canvas */}
                <div
                    ref={containerRef}
                    id="mindmap-canvas"
                    className="flex-1 overflow-auto relative cursor-default"
                    style={{ background: 'var(--admin-bg)' }}
                    onMouseDown={(e) => { if (isInspectorActive) return; if ((e.target as HTMLElement).closest('.node-box')) return; isCanvasDragging.current = true; if (containerRef.current) { canvasDragStart.current = { x: e.clientX, y: e.clientY, scrollLeft: containerRef.current.scrollLeft, scrollTop: containerRef.current.scrollTop }; containerRef.current.style.cursor = 'grabbing'; } }}
                    onMouseMove={(e) => { if (!isCanvasDragging.current || !containerRef.current) return; e.preventDefault(); const dx = e.clientX - canvasDragStart.current.x; const dy = e.clientY - canvasDragStart.current.y; containerRef.current.scrollLeft = canvasDragStart.current.scrollLeft - dx; containerRef.current.scrollTop = canvasDragStart.current.scrollTop - dy; }}
                    onMouseUp={() => { isCanvasDragging.current = false; if (containerRef.current) containerRef.current.style.cursor = 'default'; }}
                    onMouseLeave={() => { isCanvasDragging.current = false; if (containerRef.current) containerRef.current.style.cursor = 'default'; }}
                >
                    {rootNodes.filter(r => visibleRootIds.has(r.id)).map(root => {
                        const state = boxStates[root.id] || { x: 50, y: 50, width: 260, height: 400, zIndex: 1, pan: { x: 0, y: 0 }, isMinimized: false };
                        const isPartnerTree = !!root.attributes?.partnerId;

                        return (
                            <div
                                key={root.id}
                                id={`window-${root.id}`}
                                className="node-box absolute border shadow-xl rounded-xl flex flex-col overflow-hidden"
                                style={{ left: state.x, top: state.y, width: state.width, height: state.height, zIndex: state.zIndex, background: 'var(--admin-surface)', borderColor: 'var(--admin-border)' }}
                            >
                                <div
                                    className={`absolute top-0 right-0 left-0 h-10 flex items-center justify-between px-3 z-20 node-box-controls backdrop-blur-sm pointer-events-auto border-b select-none ${isInspectorActive ? 'cursor-default' : 'cursor-move'}`}
                                    style={{ background: 'var(--theme-primary-bg)', borderBottomColor: 'var(--admin-border)' }}
                                    onMouseDown={(e) => { if ((e.target as HTMLElement).closest('button')) return; startOp(e, 'MOVE', root.id); }}
                                >
                                    <div className="font-bold text-sm text-gray-700 truncate flex-1 mr-2 flex items-center gap-2">
                                        <Network size={14} className={selectedPartnerId ? "text-blue-600" : "text-gray-500"} />
                                        {root.label}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {/* Copy Button: Only show for Partner Trees with Template Source */}
                                        {isPartnerTree && (
                                            (root.attributes?.originalRootId && nodes[root.attributes.originalRootId]) ||
                                            (Object.values(nodes) as NodeData[]).some(n => n.type === 'ROOT' && !n.attributes?.partnerId && n.label === root.label)
                                        ) && (
                                                <button
                                                    onMouseDown={(e) => e.stopPropagation()}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (confirm("기본설정 트리에서 내용을 복사하여 초기화하시겠습니까? (현재 구조가 삭제되고 기본설정대로 복사됩니다)")) {
                                                            handleResetToTemplate(root.id);
                                                        }
                                                    }}
                                                    className="p-1 text-gray-400 hover:text-blue-600 hover:bg-gray-200 rounded"
                                                    title="기본설정 트리 그대로 복사 (초기화)"
                                                >
                                                    <RefreshCw size={14} />
                                                </button>
                                            )}
                                        <button onMouseDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); setBoxStates(prev => ({ ...prev, [root.id]: { ...prev[root.id], isMinimized: !prev[root.id].isMinimized, height: prev[root.id].isMinimized ? prev[root.id].lastLayout.height : 45 } })); }} className="p-1 text-gray-400 hover:text-blue-600 hover:bg-gray-200 rounded">{state.isMinimized ? <Square size={14} className="rotate-180 scale-75" /> : <Minus size={14} />}</button>
                                        {!state.isMinimized && <button onMouseDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); setBoxStates(prev => ({ ...prev, [root.id]: { ...prev[root.id], width: 800, height: 600, lastLayout: { ...prev[root.id].lastLayout, height: prev[root.id].height }, zIndex: maxZIndex.current + 1 } })); maxZIndex.current++; }} className="p-1 text-gray-400 hover:text-blue-600 hover:bg-gray-200 rounded"><Square size={12} /></button>}
                                    </div>
                                </div>
                                {!state.isMinimized && (
                                    <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide relative cursor-auto bg-white mt-10" onWheel={(e) => e.stopPropagation()}>
                                        <div className="p-4 min-w-full">
                                            <TreeNode
                                                nodeId={root.id}
                                                path={[root.id]}
                                                level={0}
                                                isVirtual={false}
                                                nodes={nodes}
                                                expandedPaths={expandedPaths}
                                                handlers={treeHandlers}
                                                searchText={searchText}
                                                customNodeTypes={customNodeTypes}
                                                draggingId={draggingId}
                                                menuActivePath={contextMenu?.path ? contextMenu.path.join('/') : null}
                                                isInspectorActive={isInspectorActive}
                                            />
                                        </div>
                                    </div>
                                )}
                                {!state.isMinimized && (
                                    <div className="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize z-20 flex items-center justify-center text-gray-400" onMouseDown={(e) => startOp(e, 'RESIZE', root.id)}>
                                        <svg width="10" height="10" viewBox="0 0 10 10"><path d="M10 0L0 10M10 4L4 10M10 8L8 10" stroke="currentColor" strokeWidth="1" /></svg>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Context Menu (Corrected and Enhanced) */}
            {
                contextMenu && (
                    <div className="fixed z-[100] bg-white rounded-lg shadow-xl border border-gray-100 py-1 min-w-[200px] flex flex-col overflow-hidden text-sm animate-in fade-in zoom-in-95 duration-100" style={{ top: contextMenu.y, left: contextMenu.x }}>
                        <div className="px-3 py-2 border-b border-gray-50 text-xs font-bold text-gray-400 bg-gray-50/50 truncate max-w-[220px]">
                            {nodes[contextMenu.nodeId]?.label} {contextMenu.isVirtual ? '(가상)' : ''}
                        </div>

                        <button onClick={() => {
                            const defaultType = customNodeTypes.find(t => t.id === lastSelectedTypeId) || customNodeTypes[3];
                            setAddModal({ isOpen: true, parentId: contextMenu.nodeId, typeDef: defaultType, inputValue: '', isParentVirtual: contextMenu.isVirtual, hostNodeId: contextMenu.isVirtual ? (contextMenu.virtualParentId || contextMenu.path[contextMenu.path.length - 2]) : undefined });
                            setContextMenu(null);
                        }} className="w-full text-left px-4 py-2 hover:bg-blue-50 text-gray-700 flex items-center gap-2">
                            <Plus size={14} className="text-blue-500" /> 하위 항목 추가
                        </button>

                        {!contextMenu.isVirtual ? (
                            <>
                                <button onClick={() => { handleEdit(nodes[contextMenu.nodeId], false, undefined, undefined); setContextMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700 flex items-center gap-2">
                                    <Edit3 size={14} /> 속성 및 이름 변경
                                </button>

                                <div className="border-t border-gray-100 my-1" />

                                <div className="px-2 text-[10px] text-gray-400 font-bold uppercase py-1">복사 및 연결</div>
                                {/* Renamed "Copy From" to "Copy Node" and enabled for everyone */}
                                <button onClick={() => { setNodePickerModal({ isOpen: true, targetParentId: contextMenu.nodeId, selectedSourceId: null, mode: 'COPY', isTargetVirtual: false }); setContextMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700 flex items-center gap-2">
                                    <Copy size={14} /> 노드 복사
                                </button>
                                <button onClick={() => { setNodePickerModal({ isOpen: true, targetParentId: contextMenu.nodeId, selectedSourceId: null, mode: 'CONNECT', isTargetVirtual: false }); setContextMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700 flex items-center gap-2">
                                    <Link2 size={14} /> 참조 연결 (Link)
                                </button>

                                <div className="border-t border-gray-100 my-1" />

                                {(nodes[contextMenu.nodeId].type !== 'ROOT' || !nodes[contextMenu.nodeId].attributes?.originalRootId || !nodes[nodes[contextMenu.nodeId].attributes.originalRootId]) && (
                                    <button onClick={() => { setDeleteModal({ isOpen: true, nodeId: contextMenu.nodeId, nodeLabel: nodes[contextMenu.nodeId].label, isVirtual: false }); setContextMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2">
                                        <Trash2 size={14} /> 삭제
                                    </button>
                                )}
                            </>
                        ) : (
                            <>
                                <button onClick={() => { handleEdit(nodes[contextMenu.nodeId], true, contextMenu.virtualParentId || contextMenu.path[contextMenu.path.length - 2], nodes[contextMenu.nodeId].label); setContextMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700 flex items-center gap-2">
                                    <Edit3 size={14} /> 이름 변경 (뷰 전용)
                                </button>
                                <button onClick={() => { handleRestoreName(contextMenu.nodeId, contextMenu.virtualParentId || contextMenu.path[contextMenu.path.length - 2]); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700 flex items-center gap-2">
                                    <RotateCcw size={14} /> 이름 복구
                                </button>

                                <div className="border-t border-gray-100 my-1" />

                                {/* Added Copy for Virtual Nodes */}
                                <button onClick={() => { setNodePickerModal({ isOpen: true, targetParentId: contextMenu.nodeId, selectedSourceId: null, mode: 'COPY', isTargetVirtual: true, targetHostId: contextMenu.virtualParentId || contextMenu.path[contextMenu.path.length - 2] }); setContextMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700 flex items-center gap-2">
                                    <Copy size={14} /> 노드 복사
                                </button>

                                <button onClick={() => { setNodePickerModal({ isOpen: true, targetParentId: contextMenu.nodeId, selectedSourceId: null, mode: 'CONNECT', isTargetVirtual: true, targetHostId: contextMenu.virtualParentId || contextMenu.path[contextMenu.path.length - 2] }); setContextMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700 flex items-center gap-2">
                                    <Link2 size={14} /> 참조 연결
                                </button>

                                <div className="border-t border-gray-100 my-1" />

                                <button onClick={() => { handleUnlink(contextMenu.nodeId, contextMenu.virtualParentId || contextMenu.path[contextMenu.path.length - 2]); setContextMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2">
                                    <Unlink size={14} /> 연결 해제 (숨김)
                                </button>
                            </>
                        )}
                    </div>
                )
            }

            {/* ... (Other Modals) ... */}
            {/* Include all original modals like LinkManager, Add, Edit, Delete, NodePicker here - keeping them as is for brevity since they are unchanged */}
            {linkManagerPopup && (<div className="fixed z-[110] bg-white rounded-lg shadow-xl border border-gray-100 flex flex-col min-w-[240px] max-w-[300px] overflow-hidden" style={{ top: linkManagerPopup.y, left: linkManagerPopup.x }} onClick={(e) => e.stopPropagation()}><div className="flex border-b border-gray-100 bg-gray-50"><button onClick={() => setLinkManagerPopup(prev => ({ ...prev!, activeTab: 'LINKED' }))} className={`flex-1 py-2 text-xs font-bold ${linkManagerPopup.activeTab === 'LINKED' ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}>연결된 소스 ({nodes[linkManagerPopup.nodeId]?.sourceIds?.length || 0})</button><button onClick={() => setLinkManagerPopup(prev => ({ ...prev!, activeTab: 'BROKEN' }))} className={`flex-1 py-2 text-xs font-bold ${linkManagerPopup.activeTab === 'BROKEN' ? 'bg-white text-red-600 border-b-2 border-red-600' : 'text-gray-500 hover:bg-gray-100'}`}>숨겨진 노드</button></div><div className="max-h-[200px] overflow-y-auto scrollbar-hide p-1">{linkManagerPopup.activeTab === 'LINKED' ? (<div className="space-y-1">{nodes[linkManagerPopup.nodeId]?.sourceIds?.map(sid => (<div key={sid} className="flex justify-between items-center text-xs p-2 hover:bg-blue-50 rounded cursor-default group"><div className="flex items-center gap-2 overflow-hidden"><div className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" /><span className="truncate">{nodes[sid]?.label || 'Unknown'}</span></div><button onClick={() => { saveHistory('참조 소스 연결 해제', linkManagerPopup.nodeId); setNodes(prev => { const next = { ...prev }; const n = next[linkManagerPopup.nodeId]; if (n) next[n.id] = { ...n, sourceIds: n.sourceIds?.filter(id => id !== sid) }; return next; }); }} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"><Unlink size={12} /></button></div>))}{(!nodes[linkManagerPopup.nodeId]?.sourceIds || nodes[linkManagerPopup.nodeId]?.sourceIds?.length === 0) && (<div className="text-xs text-gray-400 p-4 text-center">연결된 소스가 없습니다.</div>)}</div>) : (<div className="space-y-1">{(() => { const hostNode = nodes[linkManagerPopup.hostNodeId]; const allExcludedIds = hostNode?.attributes?.excludedIds ? JSON.parse(hostNode.attributes.excludedIds) : []; const node = nodes[linkManagerPopup.nodeId]; const potentialVirtualChildren = (node?.sourceIds || []).flatMap(sid => nodes[sid]?.childrenIds || []); const potentialDirectChildren = node?.childrenIds || []; const allPotential = [...potentialDirectChildren, ...potentialVirtualChildren]; const disconnected = allPotential.filter(id => allExcludedIds.includes(id)); if (disconnected.length === 0) { return <div className="text-xs text-gray-400 p-4 text-center">숨겨진(끊어진) 노드가 없습니다.</div>; } return disconnected.map(did => (<div key={did} className="flex justify-between items-center text-xs p-2 hover:bg-red-50 rounded cursor-default group"><div className="flex items-center gap-2 overflow-hidden"><div className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" /><span className="truncate text-gray-600 line-through decoration-red-300">{nodes[did]?.label || 'Unknown'}</span></div><button onClick={() => { saveHistory('노드 연결 복구', linkManagerPopup.hostNodeId); setNodes(prev => { const next = { ...prev }; const host = next[linkManagerPopup.hostNodeId]; if (host) { let excluded = JSON.parse(host.attributes?.excludedIds || '[]'); excluded = excluded.filter((id: string) => id !== did); next[linkManagerPopup.hostNodeId] = { ...host, attributes: { ...host.attributes, excludedIds: JSON.stringify(excluded) } }; } return next; }); }} className="text-gray-300 hover:text-green-600 opacity-0 group-hover:opacity-100 transition-opacity p-1" title="복구"><RefreshCw size={12} /></button></div>)); })()}</div>)}</div></div>)}

            {/* Modals Containers */}
            <AnimatePresence>
                {addModal.isOpen && (<div className="fixed inset-0 z-[120] flex items-center justify-center p-4"><div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setAddModal(prev => ({ ...prev, isOpen: false }))} /><motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm relative z-10"><h3 className="font-bold text-lg mb-4">새 항목 추가</h3><div className="mb-4"><label className="text-[10px] font-bold text-gray-400 uppercase block mb-1.5">속성 선택</label><div className="grid grid-cols-4 gap-2">{customNodeTypes.filter(t => t.id !== 'root').map(type => { const IconComp = ICON_MAP[type.icon] || Box; const isSelected = addModal.typeDef?.id === type.id; return (<button key={type.id} onClick={() => setAddModal(prev => ({ ...prev, typeDef: type }))} className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all ${isSelected ? 'bg-blue-50 border-blue-500 text-blue-600 ring-1 ring-blue-500' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}><IconComp size={16} className="mb-1" /><span className="text-[10px] truncate w-full text-center">{type.label}</span></button>); })}</div></div><input autoFocus type="text" className="w-full border rounded-lg px-3 py-2 mb-4 outline-none focus:border-blue-500 bg-white text-gray-900" placeholder="이름 입력" value={addModal.inputValue} onChange={e => setAddModal(prev => ({ ...prev, inputValue: e.target.value }))} onKeyDown={e => e.key === 'Enter' && confirmAddNode()} /><div className="flex justify-end gap-2"><button onClick={() => setAddModal(prev => ({ ...prev, isOpen: false }))} className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-lg">취소</button><button onClick={confirmAddNode} className="px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-lg">추가</button></div></motion.div></div>)}
                {deleteModal.isOpen && (<div className="fixed inset-0 z-[120] flex items-center justify-center p-4"><div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setDeleteModal(prev => ({ ...prev, isOpen: false }))} /><motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm relative z-10 text-center"><div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4"><AlertTriangle size={24} /></div><h3 className="font-bold text-lg mb-2">{(nodes[deleteModal.nodeId!]?.type === 'ROOT' && nodes[deleteModal.nodeId!]?.attributes?.partnerId) ? '트리 초기화' : (deleteModal.isVirtual ? '연결 해제' : '항목 삭제')}</h3><p className="text-gray-500 text-sm mb-6">{(nodes[deleteModal.nodeId!]?.type === 'ROOT' && nodes[deleteModal.nodeId!]?.attributes?.partnerId) ? '기본설정 트리에서 내용을 복사하여 초기화하시겠습니까?' : (deleteModal.isVirtual ? '이 항목을 현재 뷰에서 숨기시겠습니까?' : '정말 삭제하시겠습니까? 하위 항목도 모두 삭제됩니다.')}</p><div className="flex gap-3"><button onClick={() => setDeleteModal(prev => ({ ...prev, isOpen: false }))} className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-bold text-gray-600">취소</button><button onClick={executeDeleteNode} className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold">{(nodes[deleteModal.nodeId!]?.type === 'ROOT' && nodes[deleteModal.nodeId!]?.attributes?.partnerId) ? '초기화' : (deleteModal.isVirtual ? '해제' : '삭제')}</button></div></motion.div></div>)}
                {editModal.isOpen && (<div className="fixed inset-0 z-[120] flex items-center justify-center p-4"><div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setEditModal(prev => ({ ...prev, isOpen: false }))} /><motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm relative z-10"><h3 className="font-bold text-lg mb-4">{editModal.isVirtual ? '이름 변경 (뷰 전용)' : '속성 및 이름 변경'}</h3>{!editModal.isVirtual && (<div className="mb-4"><label className="text-[10px] font-bold text-gray-400 uppercase block mb-1.5">속성 변경</label><div className="grid grid-cols-4 gap-2">{customNodeTypes.filter(t => t.id !== 'root').map(type => { const IconComp = ICON_MAP[type.icon] || Box; const isSelected = editModal.typeId === type.id; return (<button key={type.id} onClick={() => setEditModal(prev => ({ ...prev, typeId: type.id }))} className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all ${isSelected ? 'bg-blue-50 border-blue-500 text-blue-600 ring-1 ring-blue-500' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}><IconComp size={16} className="mb-1" /><span className="text-[10px] truncate w-full text-center">{type.label}</span></button>); })}</div></div>)}<input autoFocus type="text" className="w-full border rounded-lg px-3 py-2 mb-4 outline-none focus:border-blue-500 bg-white text-gray-900" value={editModal.label} onChange={e => setEditModal(prev => ({ ...prev, label: e.target.value }))} onKeyDown={e => e.key === 'Enter' && (() => { if (!editModal.nodeId) return; saveHistory(editModal.isVirtual ? '가상 노드 이름 수정' : '노드 수정', editModal.hostNodeId || editModal.nodeId); if (editModal.isVirtual && editModal.hostNodeId) { setNodes(prev => { const next = { ...prev }; const hostNode = next[editModal.hostNodeId!]; if (!hostNode) return prev; const overrides = hostNode.attributes?.virtualLabelOverrides ? JSON.parse(hostNode.attributes.virtualLabelOverrides) : {}; overrides[editModal.nodeId!] = editModal.label; next[editModal.hostNodeId!] = { ...hostNode, attributes: { ...hostNode.attributes, virtualLabelOverrides: JSON.stringify(overrides) } }; return next; }); } else { setNodes(prev => ({ ...prev, [editModal.nodeId!]: { ...prev[editModal.nodeId!], label: editModal.label, attributes: { ...prev[editModal.nodeId!].attributes, nodeType: editModal.typeId } } })); } setEditModal({ isOpen: false, nodeId: null, label: '', typeId: '', isVirtual: false }); })()} /><div className="flex justify-end gap-2"><button onClick={() => setEditModal(prev => ({ ...prev, isOpen: false }))} className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-lg">취소</button><button onClick={() => { if (!editModal.nodeId) return; saveHistory(editModal.isVirtual ? '가상 노드 이름 수정' : '노드 수정', editModal.hostNodeId || editModal.nodeId); if (editModal.isVirtual && editModal.hostNodeId) { setNodes(prev => { const next = { ...prev }; const hostNode = next[editModal.hostNodeId!]; if (!hostNode) return prev; const overrides = hostNode.attributes?.virtualLabelOverrides ? JSON.parse(hostNode.attributes.virtualLabelOverrides) : {}; overrides[editModal.nodeId!] = editModal.label; next[editModal.hostNodeId!] = { ...hostNode, attributes: { ...hostNode.attributes, virtualLabelOverrides: JSON.stringify(overrides) } }; return next; }); } else { setNodes(prev => ({ ...prev, [editModal.nodeId!]: { ...prev[editModal.nodeId!], label: editModal.label, attributes: { ...prev[editModal.nodeId!].attributes, nodeType: editModal.typeId } } })); } setEditModal({ isOpen: false, nodeId: null, label: '', typeId: '', isVirtual: false }); }} className="px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-lg">저장</button></div></motion.div></div>)}
                {showAttrManager && (<div className="fixed inset-0 z-[100] flex items-center justify-center p-4"><motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowAttrManager(false)} /><motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative z-10 flex flex-col max-h-[80vh]"><div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50"><div className="flex items-center gap-2"><Database size={18} className="text-blue-600" /><h3 className="font-bold text-gray-800 text-sm">노드 속성(종류) 관리</h3></div><button onClick={() => setShowAttrManager(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button></div><div className="p-5 flex-1 overflow-y-auto"><div className="space-y-3">{customNodeTypes.map(type => { const IconComp = ICON_MAP[type.icon] || Box; return (<div key={type.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 group hover:border-blue-200 transition-colors"><div className="flex items-center gap-3"><div className={`p-2 rounded-lg border ${type.color}`}><IconComp size={16} /></div><div><p className="text-sm font-bold text-gray-700">{type.label}</p><p className="text-[10px] text-gray-400">ID: {type.id}</p></div></div><div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">{type.id !== 'root' && (<button onClick={() => { if (confirm("삭제하시겠습니까?")) setCustomNodeTypes(prev => prev.filter(t => t.id !== type.id)); }} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>)}</div></div>); })}</div></div><div className="p-4 border-t border-gray-100 bg-gray-50/30"><div className="flex gap-2"><input type="text" value={newTypeLabel} onChange={(e) => setNewTypeLabel(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && newTypeLabel.trim()) { setCustomNodeTypes(prev => [...prev, { id: `type-${Date.now()}`, label: newTypeLabel, icon: 'Box', color: 'text-gray-600 bg-gray-50 border-gray-200' }]); setNewTypeLabel(''); } }} placeholder="새 속성 이름" className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:border-blue-500 transition-all" /><button onClick={() => { if (newTypeLabel.trim()) { setCustomNodeTypes(prev => [...prev, { id: `type-${Date.now()}`, label: newTypeLabel, icon: 'Box', color: 'text-gray-600 bg-gray-50 border-gray-200' }]); setNewTypeLabel(''); } }} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-blue-200 transition-transform active:scale-95 flex-shrink-0">추가</button></div></div></motion.div></div>)}
                {nodePickerModal.isOpen && (<div className="fixed inset-0 z-[120] flex items-center justify-center p-4"><div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setNodePickerModal(prev => ({ ...prev, isOpen: false }))} /><div className="bg-white rounded-xl shadow-2xl w-full max-w-md relative z-10 flex flex-col max-h-[80vh]"><div className="p-4 border-b border-gray-100 flex justify-between items-center"><h3 className="font-bold text-gray-800">{nodePickerModal.mode === 'COPY' ? '복사할 원본 노드 선택' : '참조할 원본 노드 선택'}</h3><button onClick={() => setNodePickerModal(prev => ({ ...prev, isOpen: false }))}><X size={20} /></button></div>{nodePickerModal.mode === 'COPY' && (<div className="p-3 bg-blue-50 border-b border-blue-100 text-xs text-gray-600"><div className="flex flex-col gap-1"><div className="flex items-center gap-2"><span className="text-gray-500 w-16">타겟(부모):</span><span className="font-bold text-blue-600 bg-white px-2 py-0.5 rounded border border-blue-200">{nodes[nodePickerModal.targetParentId || '']?.label}</span></div><div className="flex items-center gap-2"><span className="text-gray-500 w-16">복사할 원본:</span><span className={`font-bold px-2 py-0.5 rounded border ${nodePickerModal.selectedSourceId ? 'text-green-600 bg-white border-green-200' : 'text-gray-400 bg-gray-100 border-gray-200'}`}>{nodePickerModal.selectedSourceId ? nodes[nodePickerModal.selectedSourceId]?.label : '(선택되지 않음)'}</span></div><div className="mt-2 text-[10px] text-blue-500">* 선택한 원본 노드를 현재 위치(타겟)의 하위로 복사합니다.</div></div></div>)}<div className="flex-1 overflow-y-auto p-4"><div className="space-y-1">{rootNodes.map(root => (<NodeSelectorItem key={root.id} node={root} nodes={nodes} onSelect={(id: string) => setNodePickerModal(prev => ({ ...prev, selectedSourceId: id }))} selectedId={nodePickerModal.selectedSourceId} />))}</div></div><div className="p-4 border-t border-gray-100 flex justify-end gap-2"><button onClick={() => setNodePickerModal(prev => ({ ...prev, isOpen: false }))} className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-200">취소</button><button onClick={() => { const { targetParentId, selectedSourceId, mode, isTargetVirtual, targetHostId } = nodePickerModal; if (targetParentId && selectedSourceId) { if (targetParentId === selectedSourceId) { alert("자기 자신을 선택할 수 없습니다."); return; } if (mode === 'COPY') { saveHistory('노드 복제', targetParentId); setNodes(prev => { const next = { ...prev }; const newNodesMap: Record<string, NodeData> = {}; const newRootId = deepCopyNode(selectedSourceId, targetParentId, next, newNodesMap, true); if (!newRootId) { alert("복사 중 오류가 발생했습니다."); return prev; } if (isTargetVirtual && targetHostId) { const hostNode = next[targetHostId]; if (hostNode) { let map = {}; try { map = JSON.parse(hostNode.attributes?.virtualChildMap || '{}'); } catch (e) { } if (!map[targetParentId]) map[targetParentId] = []; map[targetParentId].push(newRootId); next[targetHostId] = { ...hostNode, attributes: { ...hostNode.attributes, virtualChildMap: JSON.stringify(map) } }; } return { ...next, ...newNodesMap }; } else { const target = next[targetParentId]; if (target) { next[targetParentId] = { ...target, childrenIds: [...(target.childrenIds || []), newRootId], isExpanded: true }; return { ...next, ...newNodesMap }; } } return prev; }); alert(`[${nodes[selectedSourceId]?.label}]을(를) [${nodes[targetParentId]?.label}] 하위로 복제했습니다.`); } else { saveHistory('참조 연결', targetParentId); setNodes(prev => { const next = { ...prev }; const host = next[targetParentId]; if (host) { const sources = host.sourceIds ? [...host.sourceIds] : []; if (!sources.includes(selectedSourceId)) { sources.push(selectedSourceId); next[targetParentId] = { ...host, sourceIds: sources }; } } return next; }); } } setNodePickerModal(prev => ({ ...prev, isOpen: false })); }} disabled={!nodePickerModal.selectedSourceId} className={`px-4 py-2 text-white rounded-lg text-sm font-bold disabled:bg-gray-300 disabled:cursor-not-allowed ${nodePickerModal.mode === 'COPY' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'}`}>{nodePickerModal.mode === 'COPY' ? '복제하기' : '연결하기'}</button></div></div></div>)}
            </AnimatePresence>

        </div >
    );
};

export default MindMapSystem;
