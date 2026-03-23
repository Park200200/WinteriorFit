
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useProductContext } from './ProductContext';
import { usePartnerContext } from '../PartnerContext';
import { NodeData, UserRole, PartnerData } from '../types';
import { useAdminTheme } from './theme/AdminThemeContext';
import {
    LayoutGrid, ChevronRight, Image as ImageIcon, Video,
    Type, Plus, Trash2, Save, FileText, CheckCircle2, Upload, X, GripVertical, FolderPlus, Palette, PlusCircle, Folder, ArrowRight, CornerDownRight, Box, MoreHorizontal, Edit3, PlusSquare, Link2, Home, ChevronDown, Check,
    Search, Building2, Settings, Equal, Tag, Calculator, TrendingUp, TrendingDown,
    Scroll, Scissors, Hammer, Ruler, Camera
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ... (Interfaces remain the same) ...
interface SpecCard {
    id: string;
    title: string;
    content: string;
}

interface StyleCard {
    id: string;
    name: string;
    imagePrompt: string;
    videoPrompt: string;
}

type ModalStep = 'PATH' | 'DETAILS';

interface ProductConfigurationProps {
    rootId?: string;
    role?: UserRole;
    hidePartnerSelector?: boolean;
}

const ProductConfiguration: React.FC<ProductConfigurationProps> = ({ rootId = 'root', role, hidePartnerSelector = false }) => {
    const { theme } = useAdminTheme();
    const { nodes, setNodes } = useProductContext();

    const isCategoryLike = useCallback((n: NodeData | undefined) => {
        if (!n) return false;
        return n.type === 'CATEGORY' || n.type === 'REFERENCE' || n.attributes?.nodeType === 'category';
    }, []);

    const [activeCategoryId, setActiveCategoryId] = useState<string>('');
    const [selectedSubIds, setSelectedSubIds] = useState<string[]>([]);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [partnerSearchQuery, setPartnerSearchQuery] = useState('');
    const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
    const [isPartnerDropdownOpen, setIsPartnerDropdownOpen] = useState(false);
    const { partners } = usePartnerContext();

    const [activePurchaseTab, setActivePurchaseTab] = useState<'FABRIC' | 'CUTTING' | 'ASSEMBLY' | 'MEASURE'>('FABRIC');

    const systemVirtualMap = useMemo(() => {
        let merged: Record<string, string[]> = {};
        (Object.values(nodes) as NodeData[]).forEach((n) => {
            if (n.attributes?.virtualChildMap) {
                try {
                    const map = JSON.parse(n.attributes.virtualChildMap);
                    merged = { ...merged, ...map };
                } catch (e) { }
            }
        });
        return merged;
    }, [nodes]);

    const currentRootId = useMemo(() => {
        const allNodes = Object.values(nodes) as NodeData[];
        if (activePurchaseTab === 'ASSEMBLY') {
            const systemRoots = allNodes.filter(n =>
                n.type === 'ROOT' &&
                (n.label.includes('시스템') || n.label.includes('System') || n.label.includes('경동물류') || n.label.includes('기본설정') || n.label.includes('test'))
            );
            // In Total Manager role, prefer base system roots
            if (role === 'TOTAL_MANAGER') {
                const baseRoots = systemRoots.filter(r => !r.id.includes('partner') && !r.label.includes('경동'));
                if (baseRoots.length > 0) return baseRoots[0].id;
            }
            // Fallback for partner role or if no base found
            const partnerSystemRoot = systemRoots.find(r => r.id.includes('partner') && (r.label.includes('기본설정') || r.label.includes('시스템')));
            return partnerSystemRoot?.id || systemRoots[0]?.id || rootId;
        }
        return rootId;
    }, [activePurchaseTab, nodes, rootId, role]);

    const categories = useMemo(() => {
        const rootNode = nodes[currentRootId];
        if (!rootNode) return [];
        const realChildren = (rootNode.childrenIds || []).map(id => nodes[id]).filter(Boolean);
        const virtualChildren = (rootNode.sourceIds || []).flatMap(srcId => {
            const src = nodes[srcId];
            return src ? (src.childrenIds || []).map(id => nodes[id]).filter(Boolean) : [];
        });
        return [...realChildren, ...virtualChildren];
    }, [nodes, currentRootId]);

    // Auto-select first category when root changes
    useEffect(() => {
        if (categories.length > 0) {
            // If current category is not in the new list, or we just switched roots
            const isInList = categories.some(cat => cat.id === activeCategoryId);
            if (!isInList) {
                setActiveCategoryId(categories[0].id);
            }
        } else {
            setActiveCategoryId('');
        }
    }, [categories, currentRootId, activeCategoryId]);

    const filteredPartners = useMemo(() => {
        if (!partnerSearchQuery.trim()) return partners;
        return partners.filter(p =>
            p.partnerName.toLowerCase().includes(partnerSearchQuery.toLowerCase()) ||
            p.partnerCode?.toLowerCase().includes(partnerSearchQuery.toLowerCase())
        );
    }, [partners, partnerSearchQuery]);

    const selectedPartner = useMemo(() =>
        partners.find(p => p.id === selectedPartnerId),
        [partners, selectedPartnerId]);
    const [styleCards, setStyleCards] = useState<StyleCard[]>([]);
    const [baseImageUrl, setBaseImageUrl] = useState<string>(''); // Added baseImageUrl
    const [specCards, setSpecCards] = useState<SpecCard[]>([]);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [modalStep, setModalStep] = useState<ModalStep>('PATH');
    const [editingProductId, setEditingProductId] = useState<string | null>(null);
    const [pathStack, setPathStack] = useState<NodeData[]>([]);
    const [newFolderName, setNewFolderName] = useState('');
    const [newProductName, setNewProductName] = useState('');
    const [partnerProductName, setPartnerProductName] = useState('');
    const [measurementAllowed, setMeasurementAllowed] = useState(true); // 실사 가능 여부
    const [newColors, setNewColors] = useState<{ id?: string; name: string; code: string; alias?: string }[]>([]);
    const [tempColorName, setTempColorName] = useState('');
    const [tempColorCode, setTempColorCode] = useState('#000000');
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
    const [purchasePrices, setPurchasePrices] = useState<Record<string, string>>({});
    const [sidebarWidth, setSidebarWidth] = useState(450);
    const [isResizing, setIsResizing] = useState(false);
    const sidebarRef = useRef<HTMLDivElement>(null);
    const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
    const lastLoadedIdRef = useRef<string | null>(null); // Track last loaded detail node
    const lastLoadedParentIdRef = useRef<string | null>(null); // Track last loaded parent node
    const [activePathDropdown, setActivePathDropdown] = useState<number | null>(null);
    const [isCreatingCategory, setIsCreatingCategory] = useState(false);
    const [newCategoryNameGrid, setNewCategoryNameGrid] = useState('');
    const [expandedAssemblyNodes, setExpandedAssemblyNodes] = useState<Set<string>>(new Set());
    const categoryInputRef = useRef<HTMLInputElement>(null);

    const isTerminalProduct = useCallback((nid: string) => {
        const n = nodes[nid];
        if (!n) return false;
        const attr = n.attributes || {};
        const nType = attr.nodeType;
        if (nType === 'product') return true;
        if (nType === 'color' || attr.color || nType === 'option') return false;
        if (n.type === 'CATEGORY' || n.type === 'ROOT' || ['category', 'species', 'item'].includes(nType || '') || n.type === 'REFERENCE') {
            return false;
        }
        const children = (n.childrenIds || []).map(id => nodes[id]).filter(Boolean);
        const hasColorChildren = children.some(c => c.attributes?.nodeType === 'color' || c.attributes?.color);
        return hasColorChildren || children.length === 0;
    }, [nodes]);

    // --- Product List Management State ---
    const [isProductListModalOpen, setIsProductListModalOpen] = useState(false);
    const [productList, setProductList] = useState<{ id: string; name: string; isNew?: boolean }[]>([]);
    const [editingParentId, setEditingParentId] = useState<string | null>(null);
    const [editingParentName, setEditingParentName] = useState('');
    const [tempProductName, setTempProductName] = useState('');
    const [activePromptTabs, setActivePromptTabs] = useState<Record<string, 'IMAGE' | 'VIDEO'>>({});
    const [isUrlFocused, setIsUrlFocused] = useState(false);

    // Helper: Check if this is a partner tree (distributor or manufacturer)
    const isPartnerTree = rootId === 'root-partner-d1' || rootId === 'root-partner-m1';


    const productAncestors = useMemo(() => {
        if (!selectedNodeId) return [];
        let list: NodeData[] = [];
        let curr = nodes[selectedNodeId];
        while (curr) {
            list.unshift(curr);
            curr = curr.parentId ? nodes[curr.parentId] : undefined;
            if (!curr || curr.type === 'ROOT') break;
        }
        return list;
    }, [selectedNodeId, nodes]);

    const linkedSystemCategory = useMemo(() => {
        if (!selectedNodeId) return null;
        const node = nodes[selectedNodeId];
        if (!node) return null;

        let curr: NodeData | undefined = node;
        let limit = 20;
        let mappedNode: NodeData | null = null;

        // Traverse up to find the closest ancestor that has a mapping in systemVirtualMap
        while (curr && limit > 0) {
            limit--;
            const idToMatch = curr.id;
            const originalId = curr.attributes?.originalSourceId;
            if (systemVirtualMap[idToMatch] || (originalId && systemVirtualMap[originalId])) {
                mappedNode = curr;
                break; // Found the mapping
            }
            if (!curr.parentId) break;
            curr = nodes[curr.parentId];
        }

        if (mappedNode) return mappedNode;

        // Fallback: top-level category
        curr = node;
        limit = 20;
        while (curr && limit > 0) {
            limit--;
            const parent = curr.parentId ? nodes[curr.parentId] : null;
            if (parent && parent.type === 'ROOT' && parent.label !== '시스템' && parent.label !== '시스템test') return curr;
            if (!curr.parentId || curr.parentId === 'root') break;
            curr = parent || undefined;
        }
        return null;
    }, [selectedNodeId, nodes, systemVirtualMap]);

    const assemblyRootIds = useMemo(() => {
        if (activePurchaseTab !== 'ASSEMBLY' || !selectedNodeId) return [];

        const ancestorLabels = productAncestors.map(a => a.label.trim());
        let results: string[] = [];

        // 1. Try mapping via linkedSystemCategory and virtual map
        if (linkedSystemCategory) {
            const mappedIds = systemVirtualMap[linkedSystemCategory.id] ||
                (linkedSystemCategory.attributes?.originalSourceId ? systemVirtualMap[linkedSystemCategory.attributes.originalSourceId] : []);

            const allCandidates = Array.isArray(mappedIds) ? mappedIds : (mappedIds ? [mappedIds] : []);

            if (allCandidates.length > 0) {
                // Find system node matching our current category path (e.g. Roll)
                const filteredMatched = allCandidates.filter(id => {
                    const sysNode = nodes[id];
                    return sysNode && ancestorLabels.includes(sysNode.label.trim());
                });

                if (filteredMatched.length > 0) results = filteredMatched;
                else results = allCandidates;
            }
        }

        // 2. Direct Search Fallback: Matches product category name with system node name
        if (results.length === 0) {
            const allNodes = Object.values(nodes) as NodeData[];
            const sysNodes = allNodes.filter(n =>
                n.attributes?.nodeType === 'system' ||
                n.attributes?.nodeType === 'category' ||
                n.attributes?.nodeType === 'item'
            );

            // Search labels from the bottom up (e.g. '롤' -> '블라인드')
            for (let i = ancestorLabels.length - 1; i >= 0; i--) {
                const label = ancestorLabels[i];
                if (label === '블라인드' || label === '커튼' || label === 'root') continue;

                const match = sysNodes.find(n => n.label.trim() === label);
                if (match) {
                    results = [match.id];
                    break;
                }
            }
        }

        return results;
    }, [activePurchaseTab, selectedNodeId, nodes, systemVirtualMap, linkedSystemCategory, productAncestors]);

    const linkedSystemPath = useMemo(() => {
        // Use meaningful categories from product hierarchy (e.g. Blind > Roll)
        const categories = productAncestors.filter(a => a.type === 'CATEGORY' || a.attributes?.nodeType === 'category');
        if (categories.length === 0) return '미지정';

        // Return top 2 levels as requested (e.g. Blind > Roll)
        const pathText = categories.slice(0, 2).map(c => c.label).join(' > ');

        // If we matched a specific system root that isn't already in the path, append it?
        // But usually "Roll" is already in the category path.
        return pathText;
    }, [productAncestors]);

    const toggleAssemblyNode = (nodeId: string) => {
        setExpandedAssemblyNodes(prev => {
            const next = new Set(prev);
            if (next.has(nodeId)) next.delete(nodeId);
            else next.add(nodeId);
            return next;
        });
    };

    useEffect(() => {
        if (isCreatingCategory && categoryInputRef.current) {
            categoryInputRef.current.focus();
        }
    }, [isCreatingCategory]);

    useEffect(() => {
        if (!activeCategoryId && categories.length > 0) {
            setActiveCategoryId(categories[0].id);
        } else if (categories.length === 0) {
            setActiveCategoryId('');
        }
    }, [categories, activeCategoryId]);

    const subCategories = useMemo(() => {
        if (!activeCategoryId) return [];
        const node = nodes[activeCategoryId];
        if (!node) return [];
        const realSubs = node.childrenIds.map(id => nodes[id]).filter(isCategoryLike);
        const virtualSubs = (node.sourceIds || []).flatMap(srcId => {
            const src = nodes[srcId];
            return src ? src.childrenIds.map(id => nodes[id]).filter(isCategoryLike) : [];
        });
        return [...realSubs, ...virtualSubs];
    }, [nodes, activeCategoryId, isCategoryLike]);

    useEffect(() => {
        if (activeCategoryId && subCategories.length > 0) {
            setSelectedSubIds(subCategories.map(sub => sub.id));
        } else {
            setSelectedSubIds([]);
        }
    }, [activeCategoryId, subCategories]);

    useEffect(() => {
        if (isAddModalOpen && !editingProductId) {
            setModalStep('PATH');
            if (activeCategoryId && nodes[activeCategoryId]) {
                setPathStack([nodes[activeCategoryId]]);
            } else {
                setPathStack([]);
            }
            setNewFolderName('');
            setNewProductName('');
            setNewColors([]);
            setTempColorName('');
            setTempColorCode('#000000');
            setActivePathDropdown(null);
            setIsCreatingCategory(false);
            setNewCategoryNameGrid('');
        }
    }, [isAddModalOpen, activeCategoryId, nodes, editingProductId]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (!(e.target as HTMLElement).closest('.path-dropdown-container')) {
                setActivePathDropdown(null);
            }
        };
        if (isAddModalOpen) {
            window.addEventListener('click', handleClickOutside);
        }
        return () => window.removeEventListener('click', handleClickOutside);
    }, [isAddModalOpen]);

    const gridData = useMemo(() => {
        const effectiveActiveId = activeCategoryId || (categories[0]?.id || '');
        if (!effectiveActiveId) return [];
        const rows: { id: string; path: string; node: NodeData }[] = [];
        const visitedIds = new Set<string>();

        if (activePurchaseTab === 'ASSEMBLY') {
            const traverseAssembly = (nodeId: string, pathStr: string) => {
                if (visitedIds.has(nodeId)) return;
                visitedIds.add(nodeId);

                const node = nodes[nodeId];
                if (!node) return;

                const currentPath = pathStr ? `${pathStr} > ${node.label}` : node.label;
                const attributes = node.attributes || {};
                let nodeType = attributes.nodeType;

                // Resolve real type for references
                if ((node.type === 'REFERENCE' || !nodeType || nodeType === 'reference') && attributes.originalSourceId) {
                    const src = nodes[attributes.originalSourceId];
                    if (src) nodeType = src.attributes?.nodeType || nodeType;
                }

                // If this is a terminal "system" node, add to list and stop traversing this path
                if (nodeType === 'system') {
                    // Verify it belongs to the active category if one is selected
                    let matchesCategory = !activeCategoryId;
                    if (activeCategoryId) {
                        let temp: NodeData | null = node;
                        let safety = 10;
                        while (temp && safety > 0) {
                            safety--;
                            if (temp.id === activeCategoryId || temp.attributes?.originalSourceId === activeCategoryId) {
                                matchesCategory = true;
                                break;
                            }
                            temp = temp.parentId ? nodes[temp.parentId] : null;
                        }
                    }

                    if (matchesCategory) {
                        if (!searchQuery || currentPath.toLowerCase().includes(searchQuery.toLowerCase())) {
                            rows.push({ id: node.id, path: currentPath, node });
                        }
                    }
                    return; // Found a system node, don't go deeper in this branch
                }

                // Determine children to follow
                const combinedChildrenIds = Array.from(new Set([
                    ...(node.childrenIds || []),
                    ...(node.attributes?.originalSourceId ? nodes[node.attributes.originalSourceId]?.childrenIds || [] : []),
                    ...(systemVirtualMap[nodeId] || [])
                ])).filter(id => !!nodes[id]);

                combinedChildrenIds.forEach(cid => traverseAssembly(cid, currentPath));
            };

            // Start traversal from categories (top-level children like "Blind", "Curtain")
            categories.forEach(cat => {
                if (activeCategoryId && cat.id !== activeCategoryId) return;
                traverseAssembly(cat.id, "");
            });

            return rows;
        }

        // isTerminalProduct is now defined in component scope
        // const isTerminalProduct = ... (removed from here)

        const traverse = (nodeId: string, pathStr: string) => {
            if (visitedIds.has(nodeId)) return;
            visitedIds.add(nodeId);

            const node = nodes[nodeId];
            if (!node) return;
            const currentPath = pathStr ? `${pathStr} > ${node.label}` : node.label;

            const isProduct = isTerminalProduct(nodeId);

            if (activePurchaseTab === 'MEASURE') {
                // For MEASURE tab, we stop at the parent of products
                if (isProduct) return;

                const hasProductChild = (node.childrenIds || []).some(cid => isTerminalProduct(cid));
                if (hasProductChild) {
                    if (!searchQuery || currentPath.toLowerCase().includes(searchQuery.toLowerCase())) {
                        rows.push({ id: node.id, path: currentPath, node });
                    }
                    // We continue traversing because this category might have sub-categories with more products
                }
            } else {
                // Standard logic for FABRIC, CUTTING, etc.
                if (isProduct) {
                    if (!searchQuery || currentPath.toLowerCase().includes(searchQuery.toLowerCase())) {
                        rows.push({ id: node.id, path: currentPath, node });
                    }
                    return;
                }
            }

            // Continue traversal
            if (node.childrenIds && node.childrenIds.length > 0) {
                node.childrenIds.forEach(childId => traverse(childId, currentPath));
            }
            if (node.sourceIds && node.sourceIds.length > 0) {
                node.sourceIds.forEach(sourceId => {
                    const src = nodes[sourceId];
                    if (src && src.childrenIds) {
                        src.childrenIds.forEach(childId => traverse(childId, currentPath));
                    }
                });
            }
        };
        let targetIds: string[] = [];
        if (subCategories.length > 0) {
            targetIds = selectedSubIds;
        } else {
            targetIds = nodes[effectiveActiveId]?.childrenIds || [];
            const activeNode = nodes[effectiveActiveId];
            if (activeNode && activeNode.sourceIds) {
                const virtualTargets = activeNode.sourceIds.flatMap(srcId => nodes[srcId]?.childrenIds || []);
                targetIds = [...targetIds, ...virtualTargets];
            }
        }
        targetIds.forEach(childId => {
            const cat = nodes[effectiveActiveId];
            const startStr = (cat && cat.type !== 'ROOT' && cat.label !== '제품') ? cat.label : '';
            traverse(childId, startStr);
        });
        return rows;
    }, [nodes, activeCategoryId, selectedSubIds, subCategories, searchQuery, activePurchaseTab, systemVirtualMap, role, categories]);

    useEffect(() => {
        if (gridData.length > 0) {
            const isSelectedValid = gridData.some(item => item.id === selectedNodeId);
            // In Assembly mode, don't clear selectedNodeId just because it's not in the grid,
            // as the user might be switching between tabs.
            if (!isSelectedValid && activePurchaseTab !== 'ASSEMBLY') {
                setSelectedNodeId(gridData[0].id);
            }
        } else {
            if (activePurchaseTab !== 'ASSEMBLY') {
                setSelectedNodeId(null);
            }
        }
    }, [gridData, selectedNodeId, activePurchaseTab]);

    useEffect(() => {
        if (selectedNodeId && nodes[selectedNodeId]) {
            const node = nodes[selectedNodeId];

            // 1. Load Drafts first
            const draftKey = `draft_detail_${selectedNodeId}`;
            const savedDraft = localStorage.getItem(draftKey);

            if (savedDraft) {
                try {
                    const parsed = JSON.parse(savedDraft);
                    if (parsed.specCards) setSpecCards(parsed.specCards);
                    else setSpecCards([]);

                    if (parsed.styleCards) setStyleCards(parsed.styleCards);
                    else setStyleCards([]);

                    if (parsed.baseImageUrl !== undefined) setBaseImageUrl(parsed.baseImageUrl);
                    else setBaseImageUrl('');

                    console.log(`[ProductConfiguration] 🧩 Draft recovered for node: ${selectedNodeId}`);
                } catch (e) {
                    console.error("Draft recovery failed", e);
                }
            } else {
                // 2. Fallback to Node Attributes
                try {
                    const loadedSpecs = node.attributes?.['spec_cards'] ? JSON.parse(node.attributes['spec_cards']) : [];
                    setSpecCards(loadedSpecs);
                } catch (e) { setSpecCards([]); }
                try {
                    const loadedStyles = node.attributes?.['style_cards'] ? JSON.parse(node.attributes['style_cards']) : [];
                    setStyleCards(loadedStyles);
                } catch (e) { setStyleCards([]); }
                setBaseImageUrl(node.attributes?.['base_image_url'] || '');
            }

            lastLoadedIdRef.current = selectedNodeId;

            // Load purchase prices if in distributor mode
            if (rootId === 'root-partner-d1' && selectedPartnerId) {
                try {
                    const priceAttr = node.attributes?.[`purchase_price_${selectedPartnerId}`];
                    setPurchasePrices(priceAttr ? JSON.parse(priceAttr) : {});
                } catch (e) { setPurchasePrices({}); }
            }
        } else {
            setSpecCards([]); setStyleCards([]); setPurchasePrices({});
        }
    }, [selectedNodeId, nodes, rootId, selectedPartnerId]);

    // --- Detail Cards Draft Auto-Save ---
    useEffect(() => {
        if (!selectedNodeId || lastLoadedIdRef.current !== selectedNodeId) return;

        const draftKey = `draft_detail_${selectedNodeId}`;
        const draftData = { specCards, styleCards, baseImageUrl };

        try {
            localStorage.setItem(draftKey, JSON.stringify(draftData));
        } catch (e) {
            console.error("Failed to save draft to localStorage. Storage might be full.", e);
            // Optionally alert user or clear old drafts
            if (e instanceof Error && e.name === 'QuotaExceededError') {
                console.warn("localStorage quota exceeded! Clearing old drafts...");
            }
        }
    }, [specCards, styleCards, baseImageUrl, selectedNodeId]);

    const startResizing = useCallback(() => setIsResizing(true), []);
    const stopResizing = useCallback(() => setIsResizing(false), []);
    const resize = useCallback((mouseMoveEvent: MouseEvent) => {
        if (isResizing && sidebarRef.current) {
            const newWidth = mouseMoveEvent.clientX - sidebarRef.current.getBoundingClientRect().left;
            if (newWidth > 300 && newWidth < 800) setSidebarWidth(newWidth);
        }
    }, [isResizing]);

    useEffect(() => {
        if (isResizing) {
            window.addEventListener("mousemove", resize);
            window.addEventListener("mouseup", stopResizing);
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        } else {
            document.body.style.cursor = 'default';
            document.body.style.userSelect = 'auto';
        }
        return () => {
            window.removeEventListener("mousemove", resize);
            window.removeEventListener("mouseup", stopResizing);
            document.body.style.cursor = 'default';
            document.body.style.userSelect = 'auto';
        };
    }, [isResizing, resize, stopResizing]);

    // Helper: Resize Image to prevent localStorage QuotaExceededError
    const resizeImage = (base64Str: string, maxWidth = 1000, maxHeight = 1000): Promise<string> => {
        return new Promise((resolve) => {
            const img = new Image();
            img.src = base64Str;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width *= maxHeight / height;
                        height = maxHeight;
                    }
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.8));
            };
        });
    };

    const addSpecCard = () => setSpecCards(prev => [...prev, { id: `spec-${Date.now()}`, title: '', content: '' }]);
    const removeSpecCard = (id: string) => setSpecCards(prev => prev.filter(c => c.id !== id));
    const updateSpecCard = (id: string, field: keyof SpecCard, value: string) => setSpecCards(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
    const handlePasteSpecs = (e: React.ClipboardEvent, startIndex: number, field: 'title' | 'content') => {
        const clipboardData = e.clipboardData.getData('text');
        const rows = clipboardData.split(/\r\n|\n|\r/).filter(r => r.trim() !== '');
        if (rows.length > 1) {
            e.preventDefault();
            setSpecCards(prev => {
                const newCards = [...prev];
                rows.forEach((line, i) => {
                    const currentIndex = startIndex + i;
                    if (currentIndex < newCards.length) newCards[currentIndex] = { ...newCards[currentIndex], [field]: line };
                    else newCards.push({ id: `spec-${Date.now()}-${i}`, title: field === 'title' ? line : '', content: field === 'content' ? line : '' });
                });
                return newCards;
            });
        }
    };
    const addStyleCard = () => setStyleCards(prev => [...prev, { id: `style-${Date.now()}`, name: '', imagePrompt: '', videoPrompt: '' }]);
    const removeStyleCard = (id: string) => setStyleCards(prev => prev.filter(c => c.id !== id));
    const updateStyleCard = (id: string, field: keyof StyleCard, value: string) => setStyleCards(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
    const triggerFileInput = (id: string) => fileInputRefs.current[id]?.click();
    const getCurrentParent = () => pathStack.length > 0 ? pathStack[pathStack.length - 1] : null;
    const handleAddColorToState = () => { if (tempColorName.trim()) { setNewColors([...newColors, { name: tempColorName, code: tempColorCode }]); setTempColorName(''); setTempColorCode('#000000'); } };
    const handleRemoveColorFromState = (index: number) => setNewColors(newColors.filter((_, i) => i !== index));

    const getSiblingsForLevel = (index: number) => {
        const parent = index === 0 ? nodes[rootId] : pathStack[index - 1];
        if (!parent) return [];
        const realChildren = parent.childrenIds.map(id => nodes[id]).filter(isCategoryLike);
        const virtualChildren = (parent.sourceIds || []).flatMap(srcId => {
            const src = nodes[srcId];
            return src ? src.childrenIds.map(id => nodes[id]).filter(isCategoryLike) : [];
        });
        return [...realChildren, ...virtualChildren];
    };

    const handleAddCategoryGrid = () => { setIsCreatingCategory(true); setNewCategoryNameGrid(''); };
    const handleConfirmAddCategoryGrid = () => {
        const name = newCategoryNameGrid.trim();
        if (!name) { setIsCreatingCategory(false); return; }
        const currentParent = pathStack.length > 0 ? pathStack[pathStack.length - 1] : nodes[rootId];
        if (!currentParent) return;
        const newId = `cat-${Date.now()}`;
        const newCategory: NodeData = { id: newId, parentId: currentParent.id, type: 'CATEGORY', label: name, isExpanded: true, childrenIds: [], attributes: { nodeType: 'category' } };
        setNodes(prev => {
            const parent = prev[currentParent.id];
            if (!parent) return prev;
            return { ...prev, [currentParent.id]: { ...parent, childrenIds: [...parent.childrenIds, newId] }, [newId]: newCategory };
        });
        setIsCreatingCategory(false); setNewCategoryNameGrid('');
    };

    const handleModalSubmit = () => {
        if (!newProductName.trim()) { alert('상품명을 입력해주세요.'); return; }
        if (editingProductId) {
            setNodes(prev => {
                const next = { ...prev };
                const productNode = next[editingProductId];
                if (!productNode) return prev;

                // Update original label
                next[editingProductId] = { ...productNode, label: newProductName };

                // Save measurement allowed status (for manufacturers)
                if (role === UserRole.MANUFACTURER) {
                    next[editingProductId].attributes = {
                        ...(next[editingProductId].attributes || {}),
                        measurementAllowed: measurementAllowed
                    };
                }

                // Save partner specific alias if in distributor mode
                if (isPartnerTree && selectedPartnerId) {
                    const aliasKey = `alias_${selectedPartnerId}`;
                    next[editingProductId].attributes = {
                        ...(next[editingProductId].attributes || {}),
                        [aliasKey]: partnerProductName
                    };
                }

                const oldColorIds = productNode.childrenIds.filter(cid => { const c = next[cid]; return c && (c.attributes?.nodeType === 'color' || c.attributes?.color); });

                if (rootId !== 'root-partner-d1') {
                    // Standard mode: Replace colors
                    oldColorIds.forEach(cid => { delete next[cid]; });
                    const newColorIds: string[] = [];
                    newColors.forEach((color, idx) => {
                        const colorId = `${editingProductId}-col-${Date.now()}-${idx}`;
                        newColorIds.push(colorId);
                        next[colorId] = { id: colorId, parentId: editingProductId, type: 'DATA', label: color.name, isExpanded: false, childrenIds: [], attributes: { nodeType: 'color', color: color.code } };
                    });
                    const nonColorChildrenIds = productNode.childrenIds.filter(cid => !oldColorIds.includes(cid));
                    next[editingProductId].childrenIds = [...nonColorChildrenIds, ...newColorIds];
                } else if (selectedPartnerId) {
                    // Partner mode: Update aliases on existing color nodes
                    newColors.forEach(color => {
                        if (color.id && next[color.id]) {
                            const aliasKey = `alias_${selectedPartnerId}`;
                            next[color.id] = {
                                ...next[color.id],
                                attributes: {
                                    ...(next[color.id].attributes || {}),
                                    [aliasKey]: color.alias
                                }
                            };
                        }
                    });
                }

                return next;
            });
            setIsAddModalOpen(false); setEditingProductId(null);
        } else {
            const currentParent = getCurrentParent() || nodes[rootId];
            if (!currentParent) { alert('상위 경로가 선택되지 않았습니다.'); return; }
            const newProductId = `node-${Date.now()}`;
            const colorNodes: Record<string, NodeData> = {};
            const colorChildrenIds: string[] = [];
            newColors.forEach((color, idx) => {
                const colorId = `node-${Date.now()}-${idx}`;
                colorNodes[colorId] = { id: colorId, parentId: newProductId, type: 'DATA', label: color.name, isExpanded: false, childrenIds: [], attributes: { nodeType: 'color', color: color.code } };
                colorChildrenIds.push(colorId);
            });
            const newProductNode: NodeData = {
                id: newProductId,
                parentId: currentParent.id,
                type: 'DATA',
                label: newProductName,
                isExpanded: true,
                childrenIds: colorChildrenIds,
                attributes: {
                    nodeType: 'product',
                    ...(role === UserRole.MANUFACTURER ? { measurementAllowed: measurementAllowed } : {})
                }
            };
            setNodes(prev => {
                const parent = prev[currentParent.id];
                if (!parent) return prev;
                return { ...prev, [currentParent.id]: { ...parent, childrenIds: [...parent.childrenIds, newProductId] }, [newProductId]: newProductNode, ...colorNodes };
            });
            setIsAddModalOpen(false);
            if (pathStack.length > 0 && pathStack[0].id !== activeCategoryId) { setActiveCategoryId(pathStack[0].id); }
            setSelectedNodeId(newProductId);
        }
    };

    const handleEditProduct = (nodeId: string) => {
        const node = nodes[nodeId];
        if (!node) return;

        const aliasKey = selectedPartnerId ? `alias_${selectedPartnerId}` : null;
        const pName = aliasKey ? (node.attributes?.[aliasKey] || node.label) : node.label;

        const existingColors = node.childrenIds.map(id => {
            const n = nodes[id];
            if (!n || !(n.attributes?.nodeType === 'color' || n.attributes?.color)) return null;
            const cAlias = aliasKey ? (n.attributes?.[aliasKey] || n.label) : n.label;
            return {
                id: n.id,
                name: n.label,
                code: n.attributes?.color || '#000000',
                alias: cAlias
            };
        }).filter(Boolean) as { id: string; name: string; code: string; alias: string }[];

        const path: NodeData[] = [];
        let curr = node.parentId;
        while (curr && curr !== rootId) { const n = nodes[curr]; if (n) { path.unshift(n); curr = n.parentId; } else break; }

        setNewProductName(node.label);
        setPartnerProductName(pName);
        setNewColors(existingColors);
        setPathStack(path);
        setEditingProductId(nodeId);
        setModalStep('DETAILS');
        setIsAddModalOpen(true);
        setActiveMenuId(null);

        // Load measurement allowed status
        if (role === UserRole.MANUFACTURER && node.attributes?.measurementAllowed !== undefined) {
            setMeasurementAllowed(node.attributes.measurementAllowed);
        } else {
            setMeasurementAllowed(true); // Default to true
        }
    };

    const handleDeleteProduct = (nodeId: string) => {
        if (!confirm('정말 삭제하시겠습니까? 하위 칼라도 모두 삭제됩니다.')) return;
        setNodes(prev => {
            const next = { ...prev };
            const nodeToDelete = next[nodeId];
            if (nodeToDelete && nodeToDelete.parentId) { const parent = next[nodeToDelete.parentId]; if (parent) { next[nodeToDelete.parentId] = { ...parent, childrenIds: parent.childrenIds.filter(id => id !== nodeId) }; } }
            delete next[nodeId];
            return next;
        });
        setActiveMenuId(null);
        if (selectedNodeId === nodeId) setSelectedNodeId(null);
    };

    // --- Product List Management Handlers ---
    const handleOpenProductManagement = (nodeId: string) => {
        const node = nodes[nodeId];
        if (!node || !node.parentId) return;
        const parent = nodes[node.parentId];
        if (!parent) return;

        // Construct Path Name
        let titlePath = parent.label;
        if (parent.parentId) {
            const grandParent = nodes[parent.parentId];
            if (grandParent && grandParent.id !== 'root' && grandParent.type !== 'ROOT') {
                titlePath = `${grandParent.label} > ${parent.label}`;
            }
        }

        // 1. Check for Draft first
        const draftKey = `draft_product_list_${parent.id}`;
        const savedDraft = localStorage.getItem(draftKey);

        if (savedDraft) {
            try {
                const parsed = JSON.parse(savedDraft);
                setProductList(parsed);
                console.log(`[ProductConfiguration] 🧩 Product list draft recovered for: ${parent.id}`);
            } catch (e) {
                console.error("Product list draft recovery failed", e);
            }
        } else {
            // 2. Get Sibling Products (Default)
            const refinedSiblings = parent.childrenIds
                .map(id => nodes[id])
                .filter(n => n &&
                    n.type !== 'CATEGORY' &&
                    n.attributes?.nodeType !== 'category' &&
                    n.attributes?.nodeType !== 'color' &&
                    (n.attributes?.nodeType === 'product' || isTerminalProduct(n.id))
                )
                .map(n => ({
                    id: n.id,
                    name: n.label,
                    isNew: false
                }));
            setProductList(refinedSiblings);
        }

        lastLoadedParentIdRef.current = parent.id;
        setEditingParentId(parent.id);
        setEditingParentName(titlePath);
        setTempProductName('');
        setIsProductListModalOpen(true);
        setActiveMenuId(null);
    };

    // --- Product List Draft Auto-Save ---
    useEffect(() => {
        if (!editingParentId || !isProductListModalOpen || lastLoadedParentIdRef.current !== editingParentId) return;

        const draftKey = `draft_product_list_${editingParentId}`;
        try {
            localStorage.setItem(draftKey, JSON.stringify(productList));
        } catch (e) {
            console.error("Failed to save product list draft", e);
        }
    }, [productList, editingParentId, isProductListModalOpen]);

    const handleAddProductToState = () => {
        if (tempProductName.trim()) {
            setProductList([...productList, { id: `new-prod-${Date.now()}`, name: tempProductName, isNew: true }]);
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

    const handleSaveProducts = () => {
        if (!editingParentId) return;

        setNodes(prev => {
            const next = { ...prev };
            const parentNode = next[editingParentId];
            if (!parentNode) return prev;

            const originalChildrenIds = parentNode.childrenIds || [];
            const finalProductIds: string[] = [];

            // 1. Process List
            productList.forEach((item, idx) => {
                if (item.isNew) {
                    const newId = `node-prod-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 5)}`;
                    next[newId] = {
                        id: newId,
                        parentId: editingParentId,
                        type: 'DATA',
                        label: item.name,
                        isExpanded: false,
                        childrenIds: [],
                        attributes: {
                            nodeType: 'product',
                            createdAt: new Date().toISOString()
                        }
                    };
                    finalProductIds.push(newId);
                } else {
                    if (next[item.id]) {
                        next[item.id] = { ...next[item.id], label: item.name };
                        finalProductIds.push(item.id);
                    }
                }
            });

            const finalProductIdSet = new Set(finalProductIds);

            // 2. Cleanup Deleted Products
            originalChildrenIds.forEach(id => {
                const n = next[id];
                // Check if it was a product and is now missing
                // We need a robust way to identify products. 
                // If it's not in final set, but WAS a product (based on nodeType or logic), delete it.
                // Ideally check if it matches criteria used in handleOpenProductManagement
                const isProd = n?.attributes?.nodeType === 'product' || (n && isTerminalProduct(n.id));

                if (isProd && !finalProductIdSet.has(id)) {
                    delete next[id];
                }
            });

            // 3. Keep other children (categories, folders)
            const otherChildrenIds = originalChildrenIds.filter(id => {
                if (finalProductIdSet.has(id)) return false;
                const n = next[id];
                if (!n) return false;
                const isProd = n?.attributes?.nodeType === 'product' || isTerminalProduct(id);
                return !isProd; // Keep if NOT a product
            });

            // 4. Update Parent
            next[editingParentId] = {
                ...parentNode,
                childrenIds: [...otherChildrenIds, ...finalProductIds]
            };

            return next;
        });

        setIsProductListModalOpen(false);

        // Clear Draft on successful save
        if (editingParentId) {
            localStorage.removeItem(`draft_product_list_${editingParentId}`);
        }

        setEditingParentId(null);
    };

    const handleSaveData = () => {
        if (!selectedNodeId) return;
        const updatedAttributes = {
            ...(nodes[selectedNodeId].attributes || {}),
            'spec_cards': JSON.stringify(specCards),
            'style_cards': JSON.stringify(styleCards),
            'base_image_url': baseImageUrl
        };

        if (rootId === 'root-partner-d1' && selectedPartnerId) {
            updatedAttributes[`purchase_price_${selectedPartnerId}`] = JSON.stringify(purchasePrices);
        }

        setNodes(prev => ({ ...prev, [selectedNodeId]: { ...prev[selectedNodeId], attributes: updatedAttributes } }));

        // Clear Draft on successful save
        localStorage.removeItem(`draft_detail_${selectedNodeId}`);

        alert('성공적으로 저장되었습니다.');
    };

    return (
        <div
            id="product-config-container"
            className="flex-1 w-full flex flex-col h-full overflow-hidden"
            style={{ background: 'var(--admin-bg)' }}
            onClick={() => setActiveMenuId(null)}
        >
            <div id="product-config-header" className="flex-shrink-0 border-b px-8 h-20 shadow-sm z-20 flex items-center justify-between relative gap-4" style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)' }}>
                <div className="flex items-center gap-4 relative z-30 min-w-fit">
                    <Box style={{ color: 'var(--theme-primary)' }} className="shrink-0" size={28} />

                    {isPartnerTree && !hidePartnerSelector && (
                        <div className="relative">
                            <div
                                className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-100 transition-all min-w-[180px]"
                                onClick={() => setIsPartnerDropdownOpen(!isPartnerDropdownOpen)}
                            >
                                <Building2 size={16} className="text-gray-400" />
                                <span className="text-sm font-bold text-gray-700">
                                    {selectedPartner ? selectedPartner.partnerName : '거래처 선택'}
                                </span>
                                <ChevronDown size={14} className={`text-gray-400 transition-transform ${isPartnerDropdownOpen ? 'rotate-180' : ''}`} />
                            </div>

                            <AnimatePresence>
                                {isPartnerDropdownOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        className="absolute top-full left-0 mt-2 w-72 bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col"
                                    >
                                        <div className="p-3 border-b border-gray-100 bg-gray-50/50">
                                            <div className="relative">
                                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                                <input
                                                    type="text"
                                                    placeholder="거래처명 또는 코드 검색..."
                                                    className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:border-blue-500 transition-all"
                                                    value={partnerSearchQuery}
                                                    onChange={(e) => setPartnerSearchQuery(e.target.value)}
                                                    onClick={(e) => e.stopPropagation()}
                                                    autoFocus
                                                />
                                            </div>
                                        </div>
                                        <div className="max-h-64 overflow-y-auto p-1 scrollbar-hide">
                                            {filteredPartners.length === 0 ? (
                                                <div className="py-8 text-center text-xs text-gray-400">검색 결과가 없습니다.</div>
                                            ) : (
                                                filteredPartners.map(p => (
                                                    <div
                                                        key={p.id}
                                                        className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${selectedPartnerId === p.id ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50 text-gray-700'}`}
                                                        onClick={() => {
                                                            setSelectedPartnerId(p.id);
                                                            setIsPartnerDropdownOpen(false);
                                                        }}
                                                    >
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-bold">{p.partnerName}</span>
                                                            <span className="text-[10px] opacity-60">{p.partnerCode} | {p.ceoName}</span>
                                                        </div>
                                                        {selectedPartnerId === p.id && <Check size={16} />}
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}

                    <h1 className="text-2xl font-bold whitespace-nowrap" style={{ color: 'var(--admin-text)' }}>
                        {rootId === 'root' ? '상품스팩 설정' : (
                            isPartnerTree ? (
                                selectedPartner?.type === 'DISTRIBUTOR' ? '유통상품관리' : '매입상품관리'
                            ) : '상품관리'
                        )}
                    </h1>

                    {rootId !== 'root-partner-d1' && (
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full border shadow-sm" style={{ color: 'var(--theme-primary)', background: 'var(--theme-primary-bg)', borderColor: 'var(--theme-primary)' }}>
                            총 {gridData.length}개
                        </span>
                    )}
                </div>
                <div className="flex-1 max-w-xl mx-auto">
                    <div className="relative w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder={isPartnerTree ? `총 ${gridData.length}개 상품명 검색...` : "상품명 검색..."}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-2.5 bg-gray-100 border-transparent focus:bg-white border rounded-xl text-sm font-medium outline-none transition-all shadow-inner focus:shadow-md"
                            onFocus={e => e.currentTarget.style.borderColor = 'var(--theme-primary)'}
                            onBlur={e => e.currentTarget.style.borderColor = 'transparent'}
                        />
                    </div>
                </div>
                <div className="flex items-center gap-4 justify-end min-w-0">
                    <div className="flex items-center gap-3 justify-end min-w-0">
                        <div className="flex bg-white p-1 rounded-full shadow-sm border border-gray-200 flex-shrink-0 gap-1 ring-1 ring-black/[0.03]">
                            {categories.map((cat) => (
                                <button
                                    key={cat.id}
                                    id={`tab-category-${cat.id}`}
                                    onClick={() => setActiveCategoryId(cat.id)}
                                    className={`relative px-5 py-1.5 text-xs font-bold rounded-full transition-all whitespace-nowrap z-10 flex items-center gap-1.5 ${activeCategoryId === cat.id
                                        ? 'text-white shadow-md'
                                        : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'}`}
                                    style={activeCategoryId === cat.id ? { background: 'var(--theme-primary)' } : {}}
                                >
                                    {cat.sourceIds && cat.sourceIds.length > 0 && <Link2 size={12} className={activeCategoryId === cat.id ? "text-white/70" : "opacity-40"} />}
                                    {cat.label}
                                </button>
                            ))}
                        </div>

                        <div className="w-1.5 h-1.5 rounded-full bg-gray-300 flex-shrink-0" />

                        <div className="flex bg-white p-1 rounded-full border border-gray-200 shadow-sm overflow-x-auto scrollbar-hide max-w-[300px] xl:max-w-[500px] flex-shrink-0 gap-1.5 ring-1 ring-black/[0.03]">
                            {subCategories.length > 0 ? subCategories.map((sub) => {
                                const isSelected = selectedSubIds.includes(sub.id);
                                return (
                                    <button
                                        key={sub.id}
                                        id={`tab-subcategory-${sub.id}`}
                                        onClick={() => setSelectedSubIds(prev => prev.includes(sub.id) ? prev.filter(id => id !== sub.id) : [...prev, sub.id])}
                                        className={`relative px-4 py-1.5 text-xs font-bold rounded-full transition-all whitespace-nowrap z-10 flex-shrink-0 flex items-center gap-1.5 ${isSelected
                                            ? 'border shadow-sm'
                                            : 'text-gray-500 hover:text-gray-800 border border-transparent'}`}
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

            <div className="flex-1 flex overflow-hidden relative">
                <div id="product-list-sidebar" ref={sidebarRef} style={{ width: sidebarWidth, background: 'var(--admin-surface)', borderColor: 'var(--admin-border)' }} className="flex flex-col border-r shadow-sm z-10 flex-shrink-0">
                    <div className="px-4 py-3 border-b flex items-center justify-between" style={{ background: 'var(--admin-bg)', borderColor: 'var(--admin-border)' }}>
                        <h2 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--admin-text-sub)' }}>
                            {activePurchaseTab === 'ASSEMBLY' ? '시스템 카테고리 리스트' : (isPartnerTree ? '본사상품 리스트' : '상품 리스트')}
                        </h2>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'var(--admin-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text-sub)' }}>{gridData.length}요</span>
                            {activePurchaseTab !== 'ASSEMBLY' && (
                                <button id="btn-add-product-modal" onClick={() => { setIsAddModalOpen(true); setEditingProductId(null); setMeasurementAllowed(true); }}
                                    className="p-1 rounded-full transition-colors"
                                    style={{ color: 'var(--theme-primary)', background: 'var(--theme-primary-bg)', border: '1px solid var(--theme-primary)' }}
                                    title="새 상품 추가"><Plus size={14} strokeWidth={3} /></button>
                            )}
                        </div>
                    </div>
                    <div id="product-list-content" className="flex-1 overflow-y-auto scrollbar-hide">
                        {gridData.length === 0 ? (
                            <div className="p-8 text-center text-sm flex flex-col items-center gap-2" style={{ color: 'var(--admin-text-muted)' }}>
                                <Box size={32} className="opacity-20" />
                                <p>{activePurchaseTab === 'ASSEMBLY' ? '해당 카테고리에 정의된 항목이 없습니다.' : '등록된 상품이 없습니다.'}</p>
                            </div>
                        ) : gridData.map((row, idx) => {
                            const isSelected = selectedNodeId === row.id;
                            const isMenuOpen = activeMenuId === row.id;
                            // row.path에서 마지막 항목을 타이틀로, 앞 경로를 서브텍스트로 분리
                            const parts = row.path.split(' > ');
                            const rowTitle = parts[parts.length - 1];
                            const rowSub = parts.length > 1 ? parts.slice(0, -1).join(' > ') : '';
                            return (
                                <button
                                    key={row.id}
                                    id={`product-row-${row.id}`}
                                    onClick={() => setSelectedNodeId(row.id)}
                                    className="w-full text-left px-4 py-3 border-b transition-colors relative group"
                                    style={isSelected
                                        ? { background: 'var(--theme-primary-bg)', borderLeft: '4px solid var(--theme-primary)', borderBottomColor: 'var(--admin-border)' }
                                        : { borderLeft: '4px solid transparent', borderBottomColor: 'var(--admin-border)', background: 'var(--admin-surface)' }}
                                >
                                    <div className="flex justify-between items-start mb-0.5 pr-6">
                                        <span className="font-bold text-sm truncate pr-2" style={{ color: isSelected ? 'var(--theme-primary)' : 'var(--admin-text)' }}>
                                            {rowTitle}
                                        </span>
                                        {isSelected && <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: 'var(--theme-primary)' }} />}
                                    </div>
                                    {rowSub && (
                                        <p className="text-[10px] truncate" style={{ color: 'var(--admin-text-sub)' }}>
                                            {rowSub}
                                        </p>
                                    )}
                                    {/* 파트너 alias 배지 */}
                                    {activePurchaseTab !== 'ASSEMBLY' && isPartnerTree && selectedPartner && (
                                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded italic`}
                                            style={row.node.attributes?.[`alias_${selectedPartnerId}`]
                                                ? { color: 'var(--theme-primary)', background: 'var(--theme-primary-bg)' }
                                                : { color: 'var(--admin-text-muted)', background: 'var(--admin-bg)' }}>
                                            {row.node.attributes?.[`alias_${selectedPartnerId}`] || 'NO'}
                                        </span>
                                    )}
                                    {/* 설정 버튼 */}
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="relative">
                                            <button
                                                id={`btn-row-edit-${row.id}`}
                                                onClick={(e) => { e.stopPropagation(); setActiveMenuId(isMenuOpen ? null : row.id); }}
                                                className="p-1.5 rounded-md transition-colors"
                                                style={{ color: 'var(--theme-primary)', background: (isMenuOpen || isSelected) ? 'var(--theme-primary-bg)' : 'transparent' }}
                                            >
                                                <Settings size={13} />
                                            </button>
                                            {isMenuOpen && (
                                                <div className="absolute right-0 top-8 rounded-xl shadow-xl z-50 min-w-[140px] overflow-hidden flex flex-col py-1 ring-1 ring-black/5 animate-in fade-in zoom-in duration-200" style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)' }}>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleOpenProductManagement(row.id); }}
                                                        className="px-4 py-2 text-left text-xs font-bold flex items-center gap-2 transition-colors"
                                                        style={{ color: 'var(--admin-text)' }}
                                                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--theme-primary-bg)'; e.currentTarget.style.color = 'var(--theme-primary)'; }}
                                                        onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'var(--admin-text)'; }}
                                                    >
                                                        <Folder size={14} /> 상품관리
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleEditProduct(row.id); }}
                                                        className="px-4 py-2 text-left text-xs font-bold flex items-center gap-2 transition-colors"
                                                        style={{ color: 'var(--admin-text)' }}
                                                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--theme-primary-bg)'; e.currentTarget.style.color = 'var(--theme-primary)'; }}
                                                        onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'var(--admin-text)'; }}
                                                    >
                                                        <Palette size={14} /> 칼라관리
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
                <div onMouseDown={startResizing} className="w-1 cursor-col-resize z-20 flex-shrink-0 transition-colors"
                    style={{ background: 'transparent' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--theme-primary)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                />
                <div id="product-detail-panel" className="flex-1 flex flex-col h-full overflow-hidden min-w-[300px]" style={{ background: 'var(--admin-bg)' }}>
                    {selectedNodeId ? (
                        <div className="flex flex-col h-full overflow-y-auto scrollbar-hide p-8">
                            <div id="product-detail-header" className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <h2 className="text-2xl font-black text-gray-800 tracking-tight">상품 상세정보 설정</h2>
                                    <div className="h-6 w-px bg-gray-200 mx-2" />
                                    <span className="text-sm font-medium text-gray-400">카테고리 및 스펙 관리</span>
                                </div>
                                <button id="btn-save-detail" onClick={handleSaveData} className="flex items-center gap-2 text-white px-6 py-3 rounded-xl shadow-lg transition-all active:scale-95 font-bold text-sm" style={{ background: 'var(--theme-primary)' }}>
                                    <Save size={18} /> 설정 저장하기
                                </button>
                            </div>
                            <div className="space-y-8 pb-10">
                                {isPartnerTree && selectedPartner && (
                                    <div id="section-purchase-price" className="bg-white/90 backdrop-blur-md rounded-2xl p-7 shadow-sm border border-gray-200 border-t-4 border-t-blue-500">
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                                    <Calculator size={22} />
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-bold text-gray-800">{selectedPartner.partnerName} 매입단가 설정</h3>
                                                    <p className="text-xs text-gray-400 font-medium">항목별 매입 단가를 관리하고 표준단가 대비 변동률을 확인합니다.</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Purchase Tab Navigation */}
                                        <div className="flex bg-gray-100/50 p-1.5 rounded-xl mb-6 border border-gray-200/50">
                                            {[
                                                { id: 'FABRIC', label: '원단', icon: Scroll },
                                                { id: 'CUTTING', label: '제단', icon: Scissors },
                                                { id: 'ASSEMBLY', label: '조립', icon: Hammer },
                                                { id: 'MEASURE', label: '실사', icon: Ruler },
                                            ].map((tab) => {
                                                const isActive = activePurchaseTab === tab.id;
                                                const Icon = tab.icon;
                                                return (
                                                    <button
                                                        key={tab.id}
                                                        onClick={() => setActivePurchaseTab(tab.id as any)}
                                                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${isActive
                                                            ? 'bg-white text-blue-700 shadow-sm border border-blue-100'
                                                            : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
                                                            }`}
                                                    >
                                                        <Icon size={14} className={isActive ? 'text-blue-600' : 'text-gray-400'} />
                                                        {tab.label}
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        {activePurchaseTab === 'ASSEMBLY' && (
                                            <div className="flex items-center gap-2 mb-4 px-4 py-2 bg-blue-50/50 rounded-xl border border-blue-100/50">
                                                <Hammer size={14} className="text-blue-500" />
                                                <span className="text-xs font-black text-gray-700">
                                                    {(gridData.find(r => r.id === selectedNodeId)?.path || linkedSystemPath)} : 시스템 옵션 리스트
                                                </span>
                                            </div>
                                        )}

                                        <div className="overflow-hidden border border-gray-100 rounded-xl">
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr className="bg-gray-50/50">
                                                        <th className="px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-tighter">항목 정보</th>
                                                        <th className="px-4 py-3 text-[11px] font-bold text-gray-400 uppercase text-right tracking-tighter">표준단가</th>
                                                        <th className="px-4 py-3 text-[11px] font-bold text-blue-600 uppercase text-center w-32 tracking-tighter">매입단가</th>
                                                        <th className="px-4 py-3 text-[11px] font-bold text-gray-400 uppercase text-right tracking-tighter">차액 / 변동률</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-50">
                                                    {(() => {
                                                        let list: any[] = [];
                                                        const nodeAttr = nodes[selectedNodeId]?.attributes || {};

                                                        if (activePurchaseTab === 'FABRIC') {
                                                            list = nodeAttr['cost_fabric_list'] ? JSON.parse(nodeAttr['cost_fabric_list']) : [];
                                                        } else if (activePurchaseTab === 'CUTTING') {
                                                            list = nodeAttr['cost_cutting_list'] ? JSON.parse(nodeAttr['cost_cutting_list']) : [];
                                                        } else if (activePurchaseTab === 'MEASURE') {
                                                            list = nodeAttr['cost_measure_list'] ? JSON.parse(nodeAttr['cost_measure_list']) : [];
                                                        }

                                                        if (activePurchaseTab === 'ASSEMBLY') {
                                                            const standardAssemblyCosts: Record<string, { price: string; unit: string }> = {};

                                                            // NEW ROBUST FETCHING: Matches StandardCost.tsx logic
                                                            const identifyStandardCosts = () => {
                                                                const allNodes = Object.values(nodes) as NodeData[];
                                                                const sysNodes = allNodes.filter(n =>
                                                                    n.attributes?.nodeType === 'system' ||
                                                                    n.attributes?.nodeType === 'category' ||
                                                                    n.attributes?.nodeType === 'item' ||
                                                                    n.attributes?.nodeType === 'item_category'
                                                                );

                                                                assemblyRootIds.forEach(bid => {
                                                                    let currId: string | undefined = bid;
                                                                    let limit = 10;

                                                                    // Check current node and ancestors for cost_assembly_list
                                                                    while (currId && limit > 0) {
                                                                        limit--;
                                                                        const bnode = nodes[currId];
                                                                        if (!bnode) break;

                                                                        // 1. Try originalSourceId first
                                                                        let sourceId = bnode.attributes?.originalSourceId;
                                                                        let sourceNode = sourceId ? nodes[sourceId] : undefined;

                                                                        // 2. Fallback: Label match in standard system tree
                                                                        if (!sourceNode || !sourceNode.attributes?.['cost_assembly_list']) {
                                                                            sourceNode = sysNodes.find(n => n.label.trim() === bnode.label.trim() && !n.id.includes('partner'));
                                                                        }

                                                                        // Use whichever has the attributes
                                                                        const effectiveNode = (sourceNode?.attributes?.['cost_assembly_list']) ? sourceNode : (bnode.attributes?.['cost_assembly_list'] ? bnode : sourceNode);

                                                                        if (effectiveNode?.attributes?.['cost_assembly_list']) {
                                                                            try {
                                                                                const parsed = JSON.parse(effectiveNode.attributes['cost_assembly_list']);
                                                                                // Merge into standardAssemblyCosts
                                                                                Object.assign(standardAssemblyCosts, parsed);
                                                                            } catch (e) { }
                                                                        }

                                                                        currId = bnode.parentId || undefined;
                                                                        if (currId && nodes[currId]?.type === 'ROOT') break;
                                                                    }
                                                                });
                                                            };
                                                            identifyStandardCosts();

                                                            const renderedNids = new Set<string>();

                                                            const getSystemChildren = (nid: string) => {
                                                                const node = nodes[nid];
                                                                if (!node) return [];

                                                                // Prioritize Virtual Map
                                                                let virtualIds: string[] = [];
                                                                const systemRoots = (Object.values(nodes) as NodeData[]).filter(n =>
                                                                    n.type === 'ROOT' &&
                                                                    (n.label.includes('시스템') || n.label.includes('System') || n.label.includes('경동물류') || n.label.includes('기본설정') || n.label.includes('test'))
                                                                );

                                                                systemRoots.forEach(r => {
                                                                    if (r.attributes?.virtualChildMap) {
                                                                        try {
                                                                            const vMap = JSON.parse(r.attributes.virtualChildMap);
                                                                            if (vMap && vMap[nid]) {
                                                                                const mapped = vMap[nid];
                                                                                virtualIds = [...virtualIds, ...(Array.isArray(mapped) ? mapped : [mapped])];
                                                                            }
                                                                        } catch (e) { }
                                                                    }
                                                                });

                                                                if (virtualIds.length > 0) return virtualIds.filter(id => !!nodes[id]);

                                                                // Fallback to standard children resolution
                                                                const systemNode = node.attributes?.originalSourceId ? nodes[node.attributes.originalSourceId] || node : node;
                                                                return (systemNode.childrenIds || []).filter(id => !!nodes[id]);
                                                            };

                                                            const renderAssemblyTree = (nid: string, depth: number, isLastChild: boolean = false): React.ReactNode => {
                                                                if (renderedNids.has(nid)) return null;
                                                                renderedNids.add(nid);
                                                                const node = nodes[nid];
                                                                if (!node) return null;

                                                                const isExpanded = expandedAssemblyNodes.has(nid) || depth === 0;
                                                                const childrenIds = getSystemChildren(nid);
                                                                const isLeaf = childrenIds.length === 0;

                                                                const lookupId = node.attributes?.originalSourceId || nid;
                                                                const stdData = standardAssemblyCosts[lookupId] || { price: '0', unit: '개' };
                                                                const stdPriceNum = parseInt(stdData.price.toString().replace(/,/g, '')) || 0;
                                                                const purPriceStr = purchasePrices[nid] || '';
                                                                const purPriceNum = parseInt(purPriceStr.replace(/,/g, '')) || 0;
                                                                const diff = purPriceNum ? purPriceNum - stdPriceNum : 0;
                                                                const percent = (purPriceNum && stdPriceNum) ? ((diff / stdPriceNum) * 100).toFixed(1) : '0.0';

                                                                return (
                                                                    <React.Fragment key={nid}>
                                                                        <tr className="group transition-colors relative">
                                                                            <td className="px-4 py-2.5 relative">
                                                                                <div className="flex items-center gap-3" style={{ marginLeft: `${depth * 28}px` }}>
                                                                                    {/* Indentation Lines */}
                                                                                    {depth > 0 && (
                                                                                        <div className="absolute left-[14px]" style={{ left: `${(depth - 1) * 28 + 24}px` }}>
                                                                                            <div className="absolute h-[52px] w-px bg-gray-200 -top-[26px]" />
                                                                                            {isLastChild && <div className="absolute h-[26px] w-[12px] border-l border-b border-gray-200 rounded-bl-lg -top-[2px]" />}
                                                                                        </div>
                                                                                    )}

                                                                                    <div className="relative flex items-center">
                                                                                        {!isLeaf ? (
                                                                                            <button
                                                                                                onClick={() => toggleAssemblyNode(nid)}
                                                                                                className={`z-10 w-6 h-6 flex items-center justify-center rounded-lg transition-all shadow-sm ${isExpanded ? 'bg-blue-600 text-white ring-2 ring-blue-100' : 'bg-blue-50 text-blue-500 hover:bg-blue-100 border border-blue-200'}`}
                                                                                            >
                                                                                                <ChevronRight size={14} className={`transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`} strokeWidth={3} />
                                                                                            </button>
                                                                                        ) : (
                                                                                            <div className={`z-10 w-6 h-6 flex items-center justify-center ${depth > 0 ? 'bg-transparent' : 'bg-blue-50/50 rounded-lg border border-blue-100/50'}`}>
                                                                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                                                                                            </div>
                                                                                        )}
                                                                                    </div>

                                                                                    <div className={`flex flex-col py-1.5 px-3 rounded-2xl transition-all ${isLeaf ? 'bg-gray-50/80 group-hover:bg-blue-50/50' : 'bg-transparent'}`}>
                                                                                        <span className={`${isLeaf ? 'text-xs font-black text-gray-800' : 'text-sm font-bold text-gray-600'} tracking-tight`}>
                                                                                            {node.label}
                                                                                        </span>
                                                                                    </div>
                                                                                </div>
                                                                            </td>
                                                                            <td className="px-4 py-3 text-right">
                                                                                <div className="flex flex-col items-end gap-0.5">
                                                                                    <div className="flex items-center gap-0.5">
                                                                                        <span className="text-xs font-mono font-bold text-gray-400 tracking-tighter">{stdPriceNum.toLocaleString()}</span>
                                                                                        <span className="text-[10px] text-gray-400 font-black">원</span>
                                                                                        <span className="text-[9px] text-gray-300 font-black opacity-60">/{stdData.unit}</span>
                                                                                    </div>
                                                                                    <span className="text-[9px] uppercase font-bold text-gray-300 tracking-widest leading-none">Standard</span>
                                                                                </div>
                                                                            </td>
                                                                            <td className="px-4 py-3">
                                                                                <div className="relative group/input max-w-[120px] ml-auto">
                                                                                    <input
                                                                                        type="text"
                                                                                        value={purPriceStr}
                                                                                        onChange={(e) => {
                                                                                            const val = e.target.value.replace(/[^0-9]/g, '');
                                                                                            const formatted = val.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                                                                                            setPurchasePrices(prev => ({ ...prev, [nid]: formatted }));
                                                                                        }}
                                                                                        placeholder="0"
                                                                                        className="w-full bg-white border-2 border-gray-100 rounded-xl px-3 py-2 text-sm font-black text-blue-700 text-right focus:border-blue-500 focus:ring-4 focus:ring-blue-50 shadow-sm outline-none transition-all"
                                                                                    />
                                                                                    <div className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] font-black text-gray-300 uppercase opacity-0 group-focus-within/input:opacity-100 transition-opacity">Purchase</div>
                                                                                </div>
                                                                            </td>
                                                                            <td className="px-4 py-3 text-right">
                                                                                {purPriceNum > 0 && (
                                                                                    <div className={`flex flex-col items-end p-2 rounded-xl border border-transparent transition-all ${diff > 0 ? 'bg-red-50/30' : diff < 0 ? 'bg-blue-50/30' : ''}`}>
                                                                                        <div className={`flex items-center gap-1 text-[11px] font-bold font-mono ${diff > 0 ? 'text-red-500' : diff < 0 ? 'text-blue-600' : 'text-gray-400'}`}>
                                                                                            {diff > 0 ? <TrendingUp size={10} strokeWidth={3} /> : diff < 0 ? <TrendingDown size={10} strokeWidth={3} /> : null}
                                                                                            {diff > 0 ? '+' : ''}{diff.toLocaleString()}
                                                                                        </div>
                                                                                        <span className={`text-[9px] font-black italic ${diff > 0 ? 'text-red-400' : diff < 0 ? 'text-blue-400' : 'text-gray-300'}`}>
                                                                                            {diff > 0 ? '+' : ''}{percent}%
                                                                                        </span>
                                                                                    </div>
                                                                                )}
                                                                            </td>
                                                                        </tr>
                                                                        {isExpanded && childrenIds.map((childId, idx) =>
                                                                            renderAssemblyTree(childId, depth + 1, idx === childrenIds.length - 1)
                                                                        )}
                                                                    </React.Fragment>
                                                                );
                                                            };

                                                            // Start from the identified system roots themselves to show the tree
                                                            const startingNodes = assemblyRootIds;

                                                            const finalRendered = startingNodes.map(id => renderAssemblyTree(id, 0)).filter(Boolean);

                                                            if (finalRendered.length === 0) {
                                                                return <tr><td colSpan={4} className="px-4 py-16 text-center text-gray-400 text-sm italic">해당 상품 카테고리(시스템)에 설정된 항목이 없습니다.</td></tr>;
                                                            }
                                                            return finalRendered;
                                                        }

                                                        if (list.length === 0) {
                                                            return <tr><td colSpan={4} className="px-4 py-16 text-center text-gray-400 text-sm italic">해당 탭에 설정된 표준단가 정보가 없습니다.</td></tr>;
                                                        }

                                                        return list.map((item: any) => {
                                                            const stdPriceNum = parseInt((item.meterPrice || item.standardPrice || '0').toString().replace(/,/g, '')) || 0;
                                                            const purPriceStr = purchasePrices[item.id] || '';
                                                            const purPriceNum = parseInt(purPriceStr.replace(/,/g, '')) || 0;
                                                            const diff = purPriceNum ? purPriceNum - stdPriceNum : 0;
                                                            const percent = (purPriceNum && stdPriceNum) ? ((diff / stdPriceNum) * 100).toFixed(1) : '0.0';
                                                            const hasPrice = !!purPriceNum;

                                                            let label = '';
                                                            let subLabel = '';
                                                            if (activePurchaseTab === 'FABRIC') {
                                                                label = `${item.width}${item.category === 'SLAT' ? 'mm' : '폭'}`;
                                                                subLabel = `${item.category} / ${item.lengthUnit}당`;
                                                            } else if (activePurchaseTab === 'CUTTING') {
                                                                label = `가로 ${item.minWidth}~${item.maxWidth} / 세로 ${item.minHeight}~${item.maxHeight}`;
                                                                subLabel = `${item.basicArea} basic area`;
                                                            } else if (activePurchaseTab === 'MEASURE') {
                                                                label = `${item.category}`;
                                                                subLabel = `${item.unit}`;
                                                            }

                                                            return (
                                                                <tr key={item.id} className="hover:bg-gray-50/30 transition-colors">
                                                                    <td className="px-4 py-4">
                                                                        <div className="flex flex-col">
                                                                            <span className="text-sm font-bold text-gray-700">{label}</span>
                                                                            <span className="text-[10px] text-gray-400 font-medium">{subLabel}</span>
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-4 py-4 text-right">
                                                                        <span className="text-sm font-mono text-gray-500 tracking-tight">{(stdPriceNum).toLocaleString()}원</span>
                                                                    </td>
                                                                    <td className="px-4 py-4">
                                                                        <input
                                                                            type="text"
                                                                            value={purPriceStr}
                                                                            onChange={(e) => {
                                                                                const val = e.target.value.replace(/[^0-9]/g, '');
                                                                                const formatted = val.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                                                                                setPurchasePrices(prev => ({ ...prev, [item.id]: formatted }));
                                                                            }}
                                                                            placeholder="0"
                                                                            className="w-full bg-blue-50/50 border border-blue-100 rounded-lg px-3 py-2 text-sm font-black text-blue-700 text-right focus:bg-white focus:border-blue-500 outline-none transition-all shadow-inner"
                                                                        />
                                                                    </td>
                                                                    <td className="px-4 py-4 text-right">
                                                                        {hasPrice && (
                                                                            <div className={`flex flex-col items-end ${diff > 0 ? 'text-red-500' : diff < 0 ? 'text-blue-600' : 'text-gray-400'}`}>
                                                                                <div className="flex items-center gap-1 text-xs font-bold font-mono">
                                                                                    {diff > 0 ? <TrendingUp size={12} /> : diff < 0 ? <TrendingDown size={12} /> : null}
                                                                                    {diff > 0 ? '+' : ''}{diff.toLocaleString()}원
                                                                                </div>
                                                                                <span className="text-[10px] font-black italic">{diff > 0 ? '+' : ''}{percent}%</span>
                                                                            </div>
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            );
                                                        });
                                                    })()}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                <div id="section-spec-list" className="rounded-2xl p-7 shadow-sm border" style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)' }}>
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-2 font-bold">
                                            <FileText size={22} style={{ color: 'var(--admin-text-muted)' }} />
                                            <h3 className="text-lg font-bold" style={{ color: 'var(--admin-text)' }}>스펙 리스트 관리 + <span style={{ color: 'var(--theme-primary)' }}>{nodes[selectedNodeId]?.label}</span></h3>
                                        </div>
                                    </div>
                                    <div className="rounded-xl overflow-hidden flex flex-col shadow-sm border" style={{ borderColor: 'var(--theme-primary)', opacity: 0.9 }}>
                                        <div className="flex border-b" style={{ background: 'var(--theme-primary-bg)', borderColor: 'var(--admin-border)' }}>
                                            <div className="w-1/3 px-4 py-3 text-xs font-bold uppercase tracking-wide border-r" style={{ color: 'var(--theme-primary)', borderColor: 'var(--admin-border)' }}>타이틀</div>
                                            <div className="w-2/3 px-4 py-3 text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--theme-primary)' }}>내용</div>
                                        </div>
                                        <div className="max-h-[320px] overflow-y-auto scrollbar-hide">
                                            <AnimatePresence initial={false}>{specCards.map((card, idx) => (
                                                <motion.div key={card.id} id={`spec-card-${card.id}`} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex border-b last:border-0 group relative transition-colors" style={{ borderColor: 'var(--admin-border)' }}
                                                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--theme-primary-bg)')}
                                                    onMouseLeave={e => (e.currentTarget.style.background = '')}>
                                                    <div className="w-1/3 border-r" style={{ borderColor: 'var(--admin-border)', background: 'var(--admin-bg)' }}><input id={`input-spec-title-${card.id}`} type="text" value={card.title} onChange={(e) => updateSpecCard(card.id, 'title', e.target.value)} onPaste={(e) => handlePasteSpecs(e, idx, 'title')} className="w-full h-full px-4 py-3 bg-transparent text-sm font-bold outline-none" style={{ color: 'var(--admin-text)' }} /></div>
                                                    <div className="w-2/3" style={{ background: 'var(--admin-surface)' }}><textarea id={`input-spec-content-${card.id}`} rows={1} value={card.content} onChange={(e) => updateSpecCard(card.id, 'content', e.target.value)} onPaste={(e) => handlePasteSpecs(e, idx, 'content')} className="w-full h-full px-4 py-3 bg-transparent text-sm outline-none resize-none min-h-[44px]" style={{ color: 'var(--admin-text)', fieldSizing: 'content' } as React.CSSProperties} /></div>
                                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => removeSpecCard(card.id)} className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><X size={16} /></button></div>
                                                </motion.div>
                                            ))}</AnimatePresence>
                                            <button id="btn-add-spec" onClick={addSpecCard}
                                                className="w-full py-3 flex items-center justify-center gap-2 text-sm font-bold border-t border-dashed transition-colors"
                                                style={{ color: 'var(--admin-text-muted)', borderColor: 'var(--admin-border)' }}
                                                onMouseEnter={e => { e.currentTarget.style.color = 'var(--theme-primary)'; e.currentTarget.style.background = 'var(--theme-primary-bg)'; }}
                                                onMouseLeave={e => { e.currentTarget.style.color = 'var(--admin-text-muted)'; e.currentTarget.style.background = ''; }}
                                            ><Plus size={16} /><span>항목 추가하기</span></button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                            <CheckCircle2 size={48} className="mb-4 opacity-30" />
                            <p className="text-lg font-medium">좌측 목록에서 상품을 선택해주세요.</p>
                        </div>
                    )}
                </div>
            </div>

            <AnimatePresence>
                {isAddModalOpen && (
                    <div id="modal-product-config" className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)} />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden relative z-10 flex flex-col max-h-[85vh]">
                            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                                <div className="flex items-center gap-2">
                                    {editingProductId ? <Settings size={18} className="text-blue-600" /> : <FolderPlus size={18} className="text-blue-600" />}
                                    <h3 className="font-bold text-gray-800 text-sm">
                                        {editingProductId ? (isPartnerTree && selectedPartner ? `${selectedPartner.partnerName} 상품설정` : '상품 수정') : (modalStep === 'PATH' ? '상품의 분류 선택 및 생성' : '2단계: 상품 및 색상 등록')}
                                    </h3>
                                </div>
                                <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                            </div>
                            <div className="flex-1 overflow-hidden flex flex-col">
                                {modalStep === 'PATH' && !editingProductId && (
                                    <div id="step-path-selection" className="flex-1 flex flex-col p-6 overflow-hidden">
                                        <div id="path-breadcrumb-container" className="bg-[#F0F0F0] rounded-xl p-3 mb-6 flex items-center gap-2"><div className="flex flex-wrap items-center gap-2">{pathStack.length === 0 ? (<div className="relative path-dropdown-container"><button onClick={() => setActivePathDropdown(activePathDropdown === -1 ? null : -1)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors">{nodes[rootId]?.label || 'Root'}<ChevronDown size={14} className={`transition-transform ${activePathDropdown === -1 ? 'rotate-180' : ''}`} /></button><AnimatePresence>{activePathDropdown === -1 && (<motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }} className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50 py-1"><div className="px-4 py-2 text-xs text-gray-400">최상위 루트입니다</div></motion.div>)}</AnimatePresence></div>) : (pathStack.map((node, index) => { const isOpen = activePathDropdown === index; const siblings = getSiblingsForLevel(index); return (<div key={node.id} className="relative flex items-center path-dropdown-container">{index > 0 && <ChevronRight size={16} className="text-gray-400 mx-1" />}<button onClick={(e) => { e.stopPropagation(); setActivePathDropdown(isOpen ? null : index); }} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors bg-blue-100 text-blue-700 hover:bg-blue-200`}>{node.label}<ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} /></button><AnimatePresence>{isOpen && (<motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }} className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50 py-1">{siblings.map(sibling => (<button key={sibling.id} onClick={() => { setPathStack(prev => [...prev.slice(0, index), sibling]); setActivePathDropdown(null); }} className={`w-full text-left px-4 py-2 text-sm font-bold flex items-center justify-between hover:bg-gray-50 ${sibling.id === node.id ? 'text-blue-600 bg-blue-50' : 'text-gray-600'}`}>{sibling.label}{sibling.id === node.id && <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />}</button>))}</motion.div>)}</AnimatePresence></div>) }))}</div></div>
                                        <div id="path-category-grid" className="flex-1 overflow-y-auto mb-6 p-1"><div className="grid grid-cols-2 md:grid-cols-4 gap-4">{isCreatingCategory ? (<div className="aspect-[4/3] rounded-xl border-2 border-blue-500 bg-white shadow-md flex flex-col items-center justify-center p-3 gap-2"><input ref={categoryInputRef} type="text" value={newCategoryNameGrid} onChange={(e) => setNewCategoryNameGrid(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleConfirmAddCategoryGrid(); if (e.key === 'Escape') setIsCreatingCategory(false); }} placeholder="분류명 입력" className="w-full text-sm font-bold text-center border-b border-gray-200 focus:border-blue-500 outline-none pb-1 bg-transparent" /><div className="flex gap-2 w-full mt-1"><button onClick={() => setIsCreatingCategory(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-lg text-xs py-2 font-bold transition-colors">취소</button><button onClick={handleConfirmAddCategoryGrid} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs py-2 font-bold transition-colors shadow-sm">추가</button></div></div>) : (<button id="btn-add-cat-grid" onClick={handleAddCategoryGrid} className="aspect-[4/3] rounded-xl border border-gray-200 bg-white hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all flex flex-col items-center justify-center gap-2 group"><span className="text-sm font-bold text-gray-400 group-hover:text-blue-500">새분류 추가 +</span></button>)}{(() => { const currentParent = pathStack.length > 0 ? pathStack[pathStack.length - 1] : nodes[rootId]; if (!currentParent) return null; const childrenList: NodeData[] = []; if (currentParent.childrenIds) childrenList.push(...currentParent.childrenIds.map(id => nodes[id]).filter(Boolean)); if (currentParent.sourceIds) { currentParent.sourceIds.forEach(srcId => { const src = nodes[srcId]; if (src?.childrenIds) childrenList.push(...src.childrenIds.map(id => nodes[id]).filter(Boolean)); }); } const visibleChildren = childrenList.filter(node => node.type === 'CATEGORY' || (node.attributes?.nodeType !== 'product' && node.attributes?.nodeType !== 'color')); return visibleChildren.map(child => (<button key={child.id} id={`btn-cat-grid-${child.id}`} onClick={() => setPathStack(prev => [...prev, child])} className="aspect-[4/3] rounded-xl border border-gray-200 bg-white hover:border-gray-300 hover:shadow-md transition-all flex flex-col items-center justify-center p-4"><span className="text-sm font-bold text-gray-700 break-keep text-center">{child.label}</span>{child.attributes?.nodeType === 'category' && <span className="text-[10px] text-gray-400 mt-1">폴더</span>}</button>)); })()}</div></div>
                                        <div className="mt-auto space-y-4"><div className="relative flex items-center w-full bg-white border border-blue-200 rounded-xl px-4 py-1 shadow-sm focus-within:ring-2 focus-within:ring-blue-100 transition-all"><span className="text-gray-500 text-sm font-medium whitespace-nowrap mr-2 select-none">{pathStack.length > 0 ? pathStack[pathStack.length - 1].label : nodes[rootId]?.label} :</span><input id="input-quick-product-name" type="text" value={newProductName} onChange={(e) => setNewProductName(e.target.value)} placeholder="추가할 상품명을 입력하세요" className="flex-1 py-3 text-sm font-bold text-gray-800 outline-none bg-transparent placeholder-gray-300 min-w-0" onKeyDown={(e) => e.key === 'Enter' && newProductName.trim() && setModalStep('DETAILS')} /></div><button id="btn-quick-add-submit" onClick={() => newProductName.trim() ? setModalStep('DETAILS') : alert('상품명을 입력해주세요.')} className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-4 font-bold text-base shadow-lg shadow-blue-200 transition-transform active:scale-95 flex items-center justify-center gap-2">이 위치에 상품 등록하기 <ArrowRight size={20} /></button></div>
                                    </div>
                                )}
                                {modalStep === 'DETAILS' && (
                                    <div id="step-product-details" className="flex-1 flex flex-col p-6 gap-6 overflow-hidden">
                                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-center justify-between"><div className="flex items-center gap-2 text-sm text-blue-800 overflow-hidden"><Folder size={16} className="text-blue-500 flex-shrink-0" /><div className="flex items-center gap-1 truncate">{pathStack.filter(n => n.attributes?.nodeType !== 'product').map((n, i, arr) => (<React.Fragment key={n.id}><span className="font-bold">{n.label}</span>{i < arr.length - 1 && <ChevronRight size={12} className="text-blue-300" />}</React.Fragment>))}</div></div>{!editingProductId && (<button onClick={() => setModalStep('PATH')} className="text-xs font-bold text-blue-500 hover:text-blue-700 underline flex-shrink-0 ml-2">위치 변경</button>)}</div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-[11px] font-bold text-gray-400 uppercase block mb-1.5">본사 상품명 (ORIGINAL)</label>
                                                <input id="input-detail-product-name" type="text" value={newProductName} readOnly={isPartnerTree} className={`w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold outline-none transition-shadow shadow-sm ${isPartnerTree ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white focus:border-blue-500'}`} />
                                            </div>
                                            {isPartnerTree && (
                                                <div>
                                                    <label className="text-[11px] font-bold text-blue-600 uppercase block mb-1.5">거래처 상품명 (ALIAS)</label>
                                                    <input
                                                        type="text"
                                                        value={partnerProductName}
                                                        onChange={(e) => setPartnerProductName(e.target.value)}
                                                        placeholder="예: [선샤인] 콤비 스탠다드"
                                                        className="w-full bg-white border border-blue-200 rounded-xl px-4 py-3 text-sm font-bold focus:border-blue-500 outline-none transition-shadow shadow-md ring-2 ring-blue-50"
                                                        autoFocus
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        {/* 실사 가능 여부 스위치 (제조공급사만 표시) */}
                                        {role === UserRole.MANUFACTURER && (
                                            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <Camera size={18} className="text-purple-600" />
                                                        <div>
                                                            <label className="text-sm font-bold text-gray-800 block">실사 가능 여부</label>
                                                            <p className="text-xs text-gray-500 mt-0.5">이 상품의 실사 출력 가능 여부를 설정합니다</p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => setMeasurementAllowed(!measurementAllowed)}
                                                        className={`relative w-16 h-8 rounded-full transition-all duration-300 shadow-inner ${measurementAllowed
                                                            ? 'bg-gradient-to-r from-green-400 to-green-500'
                                                            : 'bg-gradient-to-r from-gray-300 to-gray-400'
                                                            }`}
                                                    >
                                                        <span
                                                            className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 flex items-center justify-center ${measurementAllowed ? 'translate-x-8' : 'translate-x-0'
                                                                }`}
                                                        >
                                                            {measurementAllowed ? (
                                                                <Check size={14} className="text-green-600" />
                                                            ) : (
                                                                <X size={14} className="text-gray-600" />
                                                            )}
                                                        </span>
                                                    </button>
                                                </div>
                                                <div className="mt-3 flex items-center justify-center gap-4">
                                                    <span className={`text-xs font-bold ${measurementAllowed ? 'text-gray-400' : 'text-gray-700'}`}>
                                                        실사 NO
                                                    </span>
                                                    <div className="w-px h-4 bg-gray-300" />
                                                    <span className={`text-xs font-bold ${measurementAllowed ? 'text-green-600' : 'text-gray-400'}`}>
                                                        실사 OK
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        <div className="h-px bg-gray-100" />

                                        <div className="flex-1 flex flex-col min-h-0">
                                            <div className="flex items-center justify-between mb-3">
                                                <label className="text-[11px] font-bold text-gray-400 uppercase flex items-center gap-1"><Palette size={12} /> 칼라 매핑 설정</label>
                                                <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{newColors.length}개 칼라</span>
                                            </div>

                                            <div className="flex gap-2 mb-3">
                                                <div className="flex-1 relative">
                                                    <input
                                                        type="text"
                                                        value={tempColorName}
                                                        onChange={(e) => setTempColorName(e.target.value)}
                                                        placeholder="칼라명 (예: 화이트)"
                                                        className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-3 pr-3 py-2 text-sm focus:border-blue-500 outline-none"
                                                        onKeyDown={(e) => e.key === 'Enter' && handleAddColorToState()}
                                                    />
                                                </div>
                                                <button
                                                    onClick={handleAddColorToState}
                                                    disabled={!tempColorName.trim()}
                                                    className="bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg px-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <PlusCircle size={18} />
                                                </button>
                                            </div>

                                            <div id="list-new-colors" className="flex-1 bg-gray-50 rounded-xl border border-gray-100 p-2 overflow-y-auto scrollbar-hide space-y-2">
                                                {newColors.length === 0 ? (
                                                    <div className="h-full flex items-center justify-center text-xs text-gray-400">등록된 칼라가 없습니다.</div>
                                                ) : (
                                                    newColors.map((color, idx) => (
                                                        <div key={idx} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm transition-all hover:border-blue-200">
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div className="flex items-center gap-3">
                                                                    <Palette size={16} className="text-gray-400 flex-shrink-0" />
                                                                    <div className="flex flex-col min-w-0">
                                                                        <span className="text-[10px] font-bold text-gray-400 uppercase leading-none mb-1">본사 칼라명</span>
                                                                        <span className="text-sm font-medium text-gray-500 truncate">{color.name}</span>
                                                                    </div>
                                                                </div>
                                                                {isPartnerTree ? (
                                                                    <div className="flex flex-col">
                                                                        <span className="text-[10px] font-bold text-blue-600 uppercase leading-none mb-1">거래처 칼라명</span>
                                                                        <div className="flex items-center gap-1">
                                                                            <button
                                                                                onClick={() => {
                                                                                    const updated = [...newColors];
                                                                                    updated[idx].alias = color.name;
                                                                                    setNewColors(updated);
                                                                                }}
                                                                                className="p-1.5 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                                                                                title="본사 명칭과 동일하게 설정"
                                                                            >
                                                                                <Equal size={14} />
                                                                            </button>
                                                                            <input
                                                                                type="text"
                                                                                value={color.alias || ''}
                                                                                onChange={(e) => {
                                                                                    const updated = [...newColors];
                                                                                    updated[idx].alias = e.target.value;
                                                                                    setNewColors(updated);
                                                                                }}
                                                                                placeholder="거래처 칼라명 입력"
                                                                                className="w-full bg-blue-50/30 border border-blue-100 rounded-lg px-2 py-1.5 text-xs font-bold focus:border-blue-500 outline-none"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex items-center justify-end gap-2 text-gray-400">
                                                                        <button onClick={() => handleRemoveColorFromState(idx)} className="p-1 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"><X size={14} /></button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                        <button id="btn-submit-final" onClick={handleModalSubmit} className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-200 transition-transform active:scale-95 flex items-center justify-center gap-2 mt-auto">
                                            {editingProductId ? <Save size={18} /> : <Plus size={18} />}
                                            {editingProductId ? '설정 저장' : '등록 완료'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            {/* PRODUCT MANAGEMENT MODAL (SIBLINGS) */}
            <AnimatePresence>
                {
                    isProductListModalOpen && (
                        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsProductListModalOpen(false)} />
                            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden relative z-10 flex flex-col max-h-[85vh]">
                                {/* Header */}
                                <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                                    <div className="flex items-center gap-2">
                                        <Folder size={18} className="text-blue-600" />
                                        <h3 className="font-bold text-gray-800 text-sm">{editingParentName}의 상품관리</h3>
                                    </div>
                                    <button onClick={() => setIsProductListModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                        <X size={20} />
                                    </button>
                                </div>

                                {/* Content */}
                                <div className="flex-1 flex flex-col p-6 overflow-hidden">
                                    <div className="flex-1 flex flex-col min-h-0">
                                        <div className="flex items-center justify-between mb-3">
                                            <label className="text-[11px] font-bold text-gray-400 uppercase flex items-center gap-1">
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
                                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-3 pr-3 py-2 text-sm focus:border-blue-500 outline-none"
                                                    onKeyDown={(e) => e.key === 'Enter' && handleAddProductToState()}
                                                    autoFocus
                                                />
                                            </div>
                                            <button
                                                onClick={handleAddProductToState}
                                                disabled={!tempProductName.trim()}
                                                className="bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg px-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <Plus size={18} />
                                            </button>
                                        </div>

                                        {/* Product List (Tag Box Style) */}
                                        <div className="flex-1 bg-gray-50 rounded-xl border border-gray-100 p-2 overflow-y-auto scrollbar-hide space-y-1">
                                            {productList.length === 0 ? (
                                                <div className="h-full flex items-center justify-center text-xs text-gray-400">
                                                    등록된 상품이 없습니다.
                                                </div>
                                            ) : (
                                                productList.map((prod, idx) => (
                                                    <div key={idx} className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-gray-100 shadow-sm text-sm group hover:border-blue-200 transition-colors">
                                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                                            <Box size={14} className="text-blue-500 flex-shrink-0" />
                                                            <input
                                                                type="text"
                                                                value={prod.name}
                                                                onChange={(e) => handleUpdateProductNameInState(idx, e.target.value)}
                                                                className="flex-1 bg-transparent outline-none font-medium text-gray-700 min-w-0 focus:text-blue-700 transition-colors cursor-text"
                                                            />
                                                            {prod.isNew && <span className="text-[10px] text-blue-500 font-bold bg-blue-50 px-1.5 py-0.5 rounded-md">NEW</span>}
                                                        </div>
                                                        <button onClick={() => handleRemoveProductFromState(idx)} className="text-gray-300 hover:text-red-500 transition-colors opacity-100 p-1">
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleSaveProducts}
                                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-200 transition-transform active:scale-95 flex items-center justify-center gap-2 mt-6"
                                    >
                                        <Save size={18} /> 설정 저장완료
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )
                }
            </AnimatePresence >
        </div>
    );
};

export default ProductConfiguration;
