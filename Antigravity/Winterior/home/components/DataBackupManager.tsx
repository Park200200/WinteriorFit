import React, { useRef, useState, useEffect } from 'react';
import { useProductContext } from './ProductContext';
import { usePartnerContext } from '../PartnerContext';


import { Download, Upload, Save, AlertCircle, CheckCircle2, FileJson, RefreshCw, Trash2 } from 'lucide-react';
import { NodeData } from '../types';

interface DataBackupManagerProps {
    onClose: () => void;
    initialMode?: 'backup' | 'restore';
}

const DataBackupManager: React.FC<DataBackupManagerProps> = ({ onClose, initialMode }) => {
    const { nodes, setNodes } = useProductContext();
    const { partners } = usePartnerContext();


    const fileInputRef = useRef<HTMLInputElement>(null);
    const smartMigrationRef = useRef<HTMLInputElement>(null);
    const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
    const [shouldClearData, setShouldClearData] = useState(false);

    // initialMode: 'backup' → 자동 백업, 'restore' → 자동 복구 파일선택
    useEffect(() => {
        if (initialMode === 'backup') {
            // 짧은 지연 후 실행 (모달 렌더링 후)
            const t = setTimeout(() => {
                handleExport();
            }, 100);
            return () => clearTimeout(t);
        } else if (initialMode === 'restore') {
            const t = setTimeout(() => {
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                    fileInputRef.current.click();
                }
            }, 100);
            return () => clearTimeout(t);
        }
    }, []);

    // --- Export Data ---
    const handleExport = () => {
        try {
            const dataStr = JSON.stringify(nodes, null, 2);
            const blob = new Blob([dataStr], { type: "application/json" });
            const url = URL.createObjectURL(blob);

            const now = new Date();
            const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
            const timeStr = now.toTimeString().slice(0, 5).replace(':', '');
            const filename = `winterior_backup_${dateStr}_${timeStr}.json`;

            const link = document.createElement("a");
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            setStatus({ type: 'success', message: '데이터 백업 파일이 다운로드되었습니다.' });
        } catch (error) {
            console.error("Export failed:", error);
            setStatus({ type: 'error', message: '데이터 내보내기 중 오류가 발생했습니다.' });
        }
    };

    // --- Import Data ---
    const handleImportClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.value = ''; // Reset
            fileInputRef.current.click();
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                if (!content) throw new Error("File is empty");

                const parsedData = JSON.parse(content);

                // Basic validation: Check if it looks like a nodes object (at least has keys)
                if (typeof parsedData !== 'object' || parsedData === null) {
                    throw new Error("Invalid JSON format");
                }

                // Confirm
                if (window.confirm('현재 데이터를 모두 지우고 백업 파일로 복구하시겠습니까? (복구 후 자동 새로고침됩니다)')) {
                    setNodes(parsedData);
                    setStatus({ type: 'success', message: '데이터가 성공적으로 복구되었습니다.' });

                    // Force reload to ensure state is clean
                    setTimeout(() => {
                        window.location.reload();
                    }, 1000);
                }

            } catch (error) {
                console.error("Import failed:", error);
                setStatus({ type: 'error', message: '올바르지 않은 백업 파일입니다.' });
            }
        };
        reader.readAsText(file);
    };


    // --- Generate Sample Data ---
    const handleGenerateSamples = () => {
        // 1. Confirm Intent
        if (!window.confirm(`원가가 설정된 상품에 대해 임의의 재고 및 주문 데이터를 생성하시겠습니까?${shouldClearData ? '\n(주의: 기존 데이터는 모두 초기화됩니다)' : '\n(기존 데이터에 추가됩니다)'}`)) return;

        // 2. Clear Logic (Based on Checkbox)
        const shouldClear = shouldClearData;

        setNodes(prev => {
            let next = { ...prev };

            // 3. Clear Existing Data if requested
            if (shouldClear) {
                // Clear Orders
                localStorage.setItem('winterior_orders', '[]');

                // Clear Stock Data from Nodes
                Object.keys(next).forEach(key => {
                    const node = next[key];
                    if (node.attributes && (node.attributes.stockData || node.attributes.availableWidths)) {
                        // Reset stockData, keep availableWidths if needed, or maybe reset them too?
                        // Usually we just want to reset Quantities.
                        // But for a "Fresh Start", let's clear stockData.
                        const newAttrs = { ...node.attributes };
                        delete newAttrs.stockData;
                        // delete newAttrs.availableWidths; // Keep widths config if possible, or clear it?
                        // If we clear widths, they are re-inferred from cost, which is fine.

                        next[key] = { ...node, attributes: newAttrs };
                    }
                });
            }

            let updatedCount = 0;
            let orderCount = 0;

            const existingOrdersStr = localStorage.getItem('winterior_orders');
            let existingOrders: any[] = [];
            // Only load existing orders if NOT clearing
            if (!shouldClear) {
                try {
                    if (existingOrdersStr) {
                        const parsed = JSON.parse(existingOrdersStr);
                        if (Array.isArray(parsed)) existingOrders = parsed;
                    }
                } catch (e) { }
            }

            const newOrders: any[] = [];

            // 0. Prepare Exclusion List (Target Only Standard Tree Roots)
            const disconnectedIds = new Set<string>();
            Object.values(next).forEach((node: any) => {
                // Check Global Root or Partner Standard Root (f1/m1/d1)
                // Avoid checking arbitrary partner roots which might hide products unnecessarily
                if (node.type === 'ROOT' && (node.id === 'root' || node.id.includes('root-partner-f1'))) {
                    if (node.attributes?.disconnectedIds) {
                        try {
                            const ids = JSON.parse(node.attributes.disconnectedIds);
                            if (Array.isArray(ids)) ids.forEach(id => disconnectedIds.add(id));
                        } catch (e) { }
                    }
                }
            });

            // 0. Pre-calculate Cost Map (Label -> Cost List) from VALID nodes
            // This allows 'copy' nodes (which might miss cost) to fallback to the 'original' node's cost by Name
            const productCostMap = new Map<string, string>();
            Object.values(next).forEach((node: any) => {
                if ((node.attributes?.nodeType === 'product' || node.id.startsWith('prod-')) && node.attributes?.cost_fabric_list) {
                    // Check if it's a valid cost (has price)
                    try {
                        const items = JSON.parse(node.attributes.cost_fabric_list);
                        const hasPrice = items.some((c: any) => (c.rollPrice !== undefined && c.rollPrice !== '') || (c.meterPrice !== undefined && c.meterPrice !== ''));
                        if (hasPrice) {
                            productCostMap.set(node.label, node.attributes.cost_fabric_list);
                        }
                    } catch (e) { }
                }
            });

            // 1. Collect Valid Products (with Cost & Color & NOT Disconnected)
            const validProducts: NodeData[] = [];
            let totalCandidates = 0;
            let skippedByCost = 0;
            let skippedByDisconnect = 0;
            let skippedNoChildren = 0;

            Object.values(next).forEach((nodeItem) => {
                const node = nodeItem as NodeData;

                if (node.attributes?.nodeType === 'product' || node.id.startsWith('prod-')) {
                    totalCandidates++;
                    // console.log(`[Debug] Checking Product: ${node.label} (${node.id})`);

                    // Check Disconnected
                    if (disconnectedIds.has(node.id)) {
                        // console.log(`[Debug] Skipped ${node.label}: Disconnected`);
                        skippedByDisconnect++;
                        return;
                    }

                    // 1.5 Reachability Check (Prevent Ghost Nodes from detached subtrees)
                    // AND System Tree Check (Prevent Partner Copies from generating stock)
                    let isReachable = false;
                    let isSystemTree = false;
                    let currentId = node.id;
                    let depth = 0;

                    while (currentId && depth < 20) {
                        const currentNode = next[currentId];
                        if (!currentNode) break;

                        // Check if Root
                        if (currentNode.type === 'ROOT') {
                            isReachable = true;
                            // Check if this is a System Root (Heuristic: Label Name)
                            // "기본설정" (Basic Settings) or "대구원단" (Daegu Fabric) are standard system roots.
                            // Partner roots usually have partner names.
                            const rootLabel = currentNode.label || '';
                            if (rootLabel.includes('기본') || rootLabel.includes('대구') || rootLabel.includes('System') || rootLabel.includes('윈테리어')) {
                                isSystemTree = true;
                            }
                            break;
                        }
                        currentId = currentNode.parentId || '';
                        depth++;
                    }

                    if (!isReachable) {
                        // console.log(`[Debug] Skipped ${node.label}: Not Reachable from ROOT`);
                        skippedByDisconnect++;
                        return;
                    }

                    if (!isSystemTree) {
                        // console.log(`[Debug] Skipped ${node.label}: Belongs to Non-System Tree (Partner Copy?)`);
                        skippedByDisconnect++;
                        return;
                    }

                    let costJson = node.attributes?.cost_fabric_list;
                    let usedFallback = false;

                    if (!costJson) {
                        // Fallback: Try matching by Label
                        if (productCostMap.has(node.label)) {
                            costJson = productCostMap.get(node.label);
                            usedFallback = true;
                            // console.log(`[Debug] Recovered Cost for ${node.label} via Name Match`);
                        } else {
                            console.log(`[Debug] Skipped ${node.label} (${node.id}): Missing 'cost_fabric_list' & No Fallback`);
                            skippedByCost++;
                            return;
                        }
                    }

                    // Check Valid Structure (Cost Items must exist)
                    let costItems: any[] = [];
                    try {
                        costItems = JSON.parse(costJson || '[]');
                    } catch (e) { }

                    // Allow 0 price (check for undefined/null/empty string, but allow numeric 0 or string "0")
                    const hasValidCost = Array.isArray(costItems) && costItems.some((c: any) =>
                        (c.rollPrice !== undefined && c.rollPrice !== '') || (c.meterPrice !== undefined && c.meterPrice !== '')
                    );

                    if (!hasValidCost) {
                        console.log(`[Debug] Skipped ${node.label}: No Valid Cost (Even after check). CostItems:`, costItems);
                        skippedByCost++;
                        return;
                    } else {
                        // console.log(`[Debug] Valid Cost Found for ${node.label} (Fallback: ${usedFallback})`);
                    }

                    if (usedFallback) {
                        // Important: Temporarily attach cost to node attributes so generation loop works
                        node.attributes = { ...node.attributes, cost_fabric_list: costJson };
                    }

                    // Check Valid Children (Must have at least one Color node)
                    let hasColorChild = false;
                    if (node.childrenIds && node.childrenIds.length > 0) {
                        hasColorChild = node.childrenIds.some((childId: string) => {
                            const child = next[childId];
                            return child && (child.attributes?.nodeType === 'color' || child.attributes?.color);
                        });
                    }

                    // Relaxed: Don't skip if no color children. Single items are allowed.
                    // if (!hasColorChild) {
                    //    skippedNoChildren++;
                    //    return;
                    // }

                    if (hasValidCost) {
                        // Extract valid widths from cost items
                        // Use either id or width as the key depending on how cost was saved
                        const validWidths = costItems.map((c: any) => c.id || c.width).filter(Boolean);

                        let productModified = false;

                        // Update Children (Colors) with Stock Data
                        if (node.childrenIds && node.childrenIds.length > 0) {
                            node.childrenIds.forEach((childId: string) => {
                                const child = next[childId] as NodeData;
                                if (child && (child.attributes?.nodeType === 'color' || child.attributes?.color)) {
                                    let childModified = false;
                                    let attributes = { ...(child.attributes || {}) };

                                    // 1. Ensure availableWidths exists
                                    let currentWidths: string[] = [];
                                    try { currentWidths = JSON.parse(attributes.availableWidths || '[]'); } catch (e) { }

                                    // If empty, use widths from cost
                                    if (currentWidths.length === 0 && validWidths.length > 0) {
                                        currentWidths = validWidths;
                                        attributes.availableWidths = JSON.stringify(currentWidths);
                                        childModified = true;
                                    }

                                    // 2. Add Stock Data if missing
                                    let stockData: any = {};
                                    try { stockData = JSON.parse(attributes.stockData || '{}'); } catch (e) { }

                                    let stockUpdated = false;
                                    currentWidths.forEach((w: string) => {
                                        if (!stockData[w]) {
                                            stockData[w] = {
                                                qty: Math.floor(Math.random() * 50) + 1,
                                                length: Math.floor(Math.random() * 1000) + 10,
                                                warehouse: 'Main'
                                            };
                                            stockUpdated = true;
                                        }
                                    });

                                    if (stockUpdated) {
                                        attributes.stockData = JSON.stringify(stockData);
                                        childModified = true;
                                    }

                                    if (childModified) {
                                        next[childId] = { ...child, attributes };
                                        productModified = true;
                                    }
                                }
                            });
                        } else {
                            // Single Item Product: Add Stock to Product Node itself
                            let attributes = { ...(node.attributes || {}) };

                            // 1. Ensure availableWidths exists
                            let currentWidths: string[] = [];
                            try { currentWidths = JSON.parse(attributes.availableWidths || '[]'); } catch (e) { }

                            // If empty, use widths from cost
                            if (currentWidths.length === 0 && validWidths.length > 0) {
                                currentWidths = validWidths;
                                attributes.availableWidths = JSON.stringify(currentWidths);
                                productModified = true;
                            }

                            // 2. Add Stock Data if missing
                            let stockData: any = {};
                            try { stockData = JSON.parse(attributes.stockData || '{}'); } catch (e) { }

                            let stockUpdated = false;

                            // If no widths (e.g. general product), use 'default' key
                            const targetWidths = currentWidths.length > 0 ? currentWidths : ['default'];

                            targetWidths.forEach((w: string) => {
                                if (!stockData[w]) {
                                    stockData[w] = {
                                        qty: Math.floor(Math.random() * 50) + 1,
                                        length: Math.floor(Math.random() * 1000) + 10,
                                        warehouse: 'Main'
                                    };
                                    stockUpdated = true;
                                }
                            });

                            if (stockUpdated) {
                                attributes.stockData = JSON.stringify(stockData);
                                productModified = true;
                            }

                            if (productModified) {
                                next[node.id] = { ...node, attributes };
                            }
                        }
                        if (productModified) updatedCount++;

                        // Add to valid list for Order Generation
                        validProducts.push(node);
                    }
                }
            });

            // 2. Generate Sample Orders (STRICT MODE)
            if (validProducts.length > 0 && partners.length > 0) {
                const sampleSize = 10;
                let generatedCount = 0;
                // Try up to sampleSize * 5 times to find valid combinations
                for (let i = 0; i < sampleSize * 5; i++) {
                    if (generatedCount >= sampleSize) break;

                    const product = validProducts[Math.floor(Math.random() * validProducts.length)];
                    const partner = partners[Math.floor(Math.random() * partners.length)];

                    // Find a color (Strict: Must be Color Node)
                    let colorNode: NodeData | null = null;
                    if (product.childrenIds && product.childrenIds.length > 0) {
                        // Filter for color nodes first to avoid wasted attempts
                        const colorChildren = product.childrenIds
                            .map((id: string) => next[id])
                            .filter((c: any) => c && (c.attributes?.nodeType === 'color' || c.attributes?.color));

                        if (colorChildren.length > 0) {
                            colorNode = colorChildren[Math.floor(Math.random() * colorChildren.length)];
                        }
                    }

                    if (product && partner) {
                        // Find a width & Cost (Strict: Must have cost item)
                        let widthStr = '';
                        let unitPrice = 0;
                        let costFound = false;
                        let unitLabel = '';

                        // Define parentLabel in outer scope
                        let parentLabel = '';
                        let parentNode = next[product.parentId || ''];
                        if (!parentNode) {
                            const allNodes = Object.values(next) as NodeData[];
                            parentNode = allNodes.find(n => n.childrenIds?.includes(product.id));
                        }
                        parentLabel = parentNode ? parentNode.label : '';

                        try {
                            const costItems = JSON.parse(product.attributes?.cost_fabric_list || '[]');
                            // Filter items with valid price (Allow 0)
                            const validCostItems = costItems.filter((c: any) =>
                                (c.rollPrice !== undefined && c.rollPrice !== '') || (c.meterPrice !== undefined && c.meterPrice !== '')
                            );

                            if (validCostItems.length > 0) {
                                const costItem = validCostItems[Math.floor(Math.random() * validCostItems.length)];

                                // Always proceed if we have a valid price item (already filtered)
                                widthStr = costItem.width || costItem.id || 'Standard';

                                // Robust Parent Lookup (Moved up for detection)
                                // Already done in outer scope

                                // Determine Unit Type based on price fields AND context
                                // Heuristic: Slat items are usually narrow (e.g. 25mm, 35mm, 50mm)
                                // Rolls are wide (e.g. 2800mm, 300cm)
                                const widthVal = parseInt(widthStr.replace(/[^0-9]/g, ''), 10);
                                const isMmWidth = widthStr.includes('mm');

                                const costItemCategory = (costItem as any).category;
                                const isSlat =
                                    // Primary: Cost Category Config (Safe Access)
                                    (costItemCategory === 'SLAT') ||
                                    // Explicit Label Keywords (Product)
                                    product.label.includes('슬랫') ||
                                    product.label.toLowerCase().includes('slat') ||
                                    product.label.includes('우드') ||
                                    product.label.includes('알루미늄') ||
                                    product.label.includes('대나무') ||
                                    // Parent/Category Context
                                    (parentLabel && parentLabel.includes('블라인드')) ||
                                    (parentLabel && parentLabel.toLowerCase().includes('blind')) ||
                                    (parentLabel && /\d+mm/.test(parentLabel)) ||
                                    // Product Label Context (e.g., "50mm Wood")
                                    /\d+mm/.test(product.label) ||
                                    // Width Heurisitics (if explicit mm width and small)
                                    (isMmWidth && widthVal > 0 && widthVal <= 100);

                                let unitSuffix = '';

                                // Parse Prices Safely
                                const rollPriceNum = Number(String(costItem.rollPrice || '0').replace(/[^0-9.]/g, ''));
                                const meterPriceNum = Number(String(costItem.meterPrice || '0').replace(/[^0-9.]/g, ''));

                                if (isSlat) {
                                    unitSuffix = 'ea';
                                } else if (rollPriceNum > 0) {
                                    unitSuffix = 'Roll';
                                } else if (meterPriceNum > 0) {
                                    unitSuffix = 'm';
                                } else {
                                    // Default fallback if no price or unrecognized
                                    unitSuffix = 'ea';
                                }

                                // User requested NO unit in width string
                                // widthStr += ' ' + unitSuffix; 
                                unitLabel = unitSuffix; // Store for order object field

                                // Clean price string (remove comma)
                                const rawPrice = String(costItem.rollPrice || costItem.meterPrice || '0').replace(/,/g, '');
                                const basePrice = Number(rawPrice);

                                // Allow 0 price if user entered it (converted to string "0" which passes truthy check)
                                if (basePrice >= 0) {
                                    unitPrice = Math.round(basePrice * 1.3 / 100) * 100; // 30% Margin, Round to 100 won
                                    costFound = true;
                                }
                            }
                        } catch (e) { }

                        if (costFound) {
                            // console.log(`[Debug] generating order for ${product.label}`);
                            const qty = Math.floor(Math.random() * 20) + 1;
                            const amount = Math.round(qty * unitPrice / 100) * 100;

                            // Construct Name (Handle missing colorNode)
                            let categoryPath = '';
                            let currentParent = next[product.parentId || ''];

                            // Robust Parent Lookup if disconnected
                            if (!currentParent) {
                                const allNodes = Object.values(next) as NodeData[];
                                currentParent = allNodes.find(n => n.childrenIds?.includes(product.id));
                            }

                            // Build Path up to Root
                            const pathParts: string[] = [];
                            let depth = 0;
                            while (currentParent && currentParent.type !== 'ROOT' && depth < 5) {
                                pathParts.unshift(currentParent.label);
                                currentParent = next[currentParent.parentId || ''];
                                depth++;
                            }
                            categoryPath = pathParts.join(' > ');

                            let fullName = '';
                            if (colorNode) {
                                fullName = categoryPath
                                    ? `${categoryPath} > ${product.label} > ${colorNode.label}`
                                    : `${product.label} > ${colorNode.label}`;
                            } else {
                                fullName = categoryPath
                                    ? `${categoryPath} > ${product.label}`
                                    : `${product.label}`;
                            }

                            const newOrder = {
                                id: `ord-sample-${Date.now()}-${i}`,
                                inputTime: `${Math.floor(Math.random() * 9) + 9}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
                                partnerName: partner.partnerName,
                                ceoName: partner.ceoName,
                                phone: partner.companyPhone,
                                productName: fullName,
                                width: widthStr, // New Field
                                shippingDate: new Date().toISOString().split('T')[0],
                                quantity: qty,
                                unit: unitLabel, // Use exact unit label (ea, Roll, m)
                                amount: amount,
                                balance: 0,
                                inventory: 100,
                                destination: partner.addresses?.[0]?.address || '배송지 미지정',
                                note: '샘플 생성 데이터 (Strict)'
                            };
                            newOrders.push(newOrder);
                            generatedCount++;
                        }
                    }
                }
            }

            if (newOrders.length > 0) {
                localStorage.setItem('winterior_orders', JSON.stringify([...existingOrders, ...newOrders]));
                orderCount = newOrders.length;
            }

            if (updatedCount > 0 || orderCount > 0) {
                if (orderCount === 0 && validProducts.length > 0) {
                    // Case: Stock Updated, but No Orders Generated
                    let reason = `${updatedCount}개 상품의 재고는 생성되었으나, 주문을 생성하지 못했습니다. (제외된 상품: 원가미설정 ${skippedByCost}건, 숨김 ${skippedByDisconnect}건)`;
                    if (partners.length === 0) {
                        reason += ' (등록된 거래처가 없음)';
                    } else {
                        reason += ' (유효한 가격 정보를 찾지 못했습니다. 가격이 0원인지 확인해주세요)';
                    }
                    setStatus({ type: 'warning', message: reason });
                } else {
                    let successMsg = `${updatedCount}개 상품 재고 및 ${orderCount}건의 주문 데이터가 생성되었습니다.`;
                    // Improve: Show info about skipped items even on success
                    if (totalCandidates > validProducts.length) {
                        successMsg += ` (총 ${totalCandidates}개 중 ${validProducts.length}개 대상. 제외됨: 원가미설정 ${skippedByCost}건, 숨김 ${skippedByDisconnect}건)`;
                    }
                    setStatus({ type: 'success', message: successMsg });
                }
                // Notify listeners (OrderReception)
                window.dispatchEvent(new Event('orderDataChanged'));
            } else {
                let reason = '조건에 맞는 데이터가 부족합니다.';
                if (validProducts.length === 0) {
                    reason = `유효한 상품이 없습니다. (총 ${totalCandidates}개 중 원가미설정: ${skippedByCost}건, 숨김: ${skippedByDisconnect}건)`;
                } else if (partners.length === 0) {
                    reason = '등록된 거래처가 없습니다.';
                } else {
                    reason = `조회된 상품 ${validProducts.length}건, 거래처 ${partners.length}개. (주문생성 실패: 가격정보/랜덤확률 확인 필요)`;
                }
                setStatus({ type: 'info', message: reason });
            }
            return next;
        });
    };


    // --- Smart Data Migration (Advanced Recovery) ---
    const handleSmartMigration = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                if (!content) throw new Error("File is empty");
                const sourceNodes = JSON.parse(content) as Record<string, NodeData>;

                if (typeof sourceNodes !== 'object' || sourceNodes === null) {
                    throw new Error("Invalid Format");
                }

                if (!confirm('스마트 마이그레이션을 시작하시겠습니까?\n이 작업은 현재 트리의 구조를 유지하면서, 백업 파일의 "원가 데이터"를 이름(경로)이 일치하는 항목에 덮어씁니다.')) return;

                setNodes((currentNodes: any) => {
                    const nextNodes = { ...currentNodes } as Record<string, NodeData>;
                    let matchedCount = 0;
                    let recoveredCount = 0;

                    // 1. Helper to build Path Signature for a node
                    const buildPathSignature = (nodeId: string, nodeMap: Record<string, NodeData>): string => {
                        const node = nodeMap[nodeId];
                        if (!node) return '';

                        let path = node.label.trim();
                        let parentId = node.parentId;
                        let depth = 0;

                        while (parentId && nodeMap[parentId] && depth < 10) {
                            const parent = nodeMap[parentId];
                            // Stop at Root
                            if (parent.type === 'ROOT') break;
                            path = `${parent.label.trim()} > ${path}`;
                            parentId = parent.parentId;
                            depth++;
                        }
                        return path;
                    };

                    // 2. Index Current Nodes by Path
                    // Map<PathString, NodeId>
                    const currentPathMap = new Map<string, string>();
                    Object.values(nextNodes).forEach(node => {
                        // Only index relevant nodes (Products/Folders)
                        if (node.type !== 'ROOT') {
                            const path = buildPathSignature(node.id, nextNodes);
                            if (path) currentPathMap.set(path, node.id);
                        }
                    });

                    // 3. Traverse Source Nodes and Match
                    Object.values(sourceNodes).forEach(sourceNode => {
                        // Skip if source has no useful data
                        const hasCostData = sourceNode.attributes?.cost_fabric_list ||
                            sourceNode.attributes?.cost_cutting_list ||
                            sourceNode.attributes?.cost_measure_list ||
                            sourceNode.attributes?.cost_assembly_list;

                        if (!hasCostData) return;

                        const sourcePath = buildPathSignature(sourceNode.id, sourceNodes);
                        if (!sourcePath) return;

                        const targetId = currentPathMap.get(sourcePath);
                        if (targetId && nextNodes[targetId]) {
                            // MATCH FOUND!
                            matchedCount++;
                            const targetNode = nextNodes[targetId];
                            let modified = false;
                            const newAttributes = { ...targetNode.attributes };

                            // Copy Cost Lists if target is missing them OR source is newer/better
                            // Strategy: Merge/Overwrite if source has data
                            const costKeys = ['cost_fabric_list', 'cost_cutting_list', 'cost_measure_list', 'cost_assembly_list'];

                            costKeys.forEach(key => {
                                const sourceVal = sourceNode.attributes?.[key];
                                const targetVal = targetNode.attributes?.[key];

                                // Reset logic often wipes attributes, so we overwrite if source has value
                                if (sourceVal && sourceVal !== '[]' && sourceVal !== '{}') {
                                    // Check if actually different
                                    if (sourceVal !== targetVal) {
                                        newAttributes[key] = sourceVal;
                                        modified = true;
                                    }
                                }
                            });

                            if (modified) {
                                nextNodes[targetId] = {
                                    ...targetNode,
                                    attributes: newAttributes
                                };
                                recoveredCount++;
                            }
                        }
                    });

                    setStatus({
                        type: 'success',
                        message: `복구 완료: ${matchedCount}개 매칭, ${recoveredCount}개 항목의 데이터가 복원되었습니다.`
                    });

                    return nextNodes;
                });

            } catch (error) {
                console.error("Migration failed:", error);
                setStatus({ type: 'error', message: '마이그레이션 실패: 파일 형식을 확인해주세요.' });
            }
            // Reset input
            event.target.value = '';
        };
        reader.readAsText(file);
    };

    // --- Integrity Check & Fix (Dead Link Removal) ---
    const handleIntegrityCheck = () => {
        if (!confirm('데이터 무결성 검사를 실행하시겠습니까?\n이 작업은 연결이 끊긴 노드(고아 노드)와 유효하지 않은 참조(Dead Links)를 정리합니다.\n작업 전 백업을 권장합니다.')) return;

        setNodes((currentNodes: any) => {
            const nextNodes = { ...currentNodes } as Record<string, NodeData>;
            let fixedCount = 0;
            let deletedOrphans = 0;

            const nodeIds = new Set(Object.keys(nextNodes));

            Object.values(nextNodes).forEach(node => {
                let modified = false;
                const newAttributes = { ...node.attributes };
                let newChildrenIds = node.childrenIds || [];
                let newSourceIds = node.sourceIds || [];
                let newParentId = node.parentId;

                // 1. Check Children IDs
                const validChildren = newChildrenIds.filter(((id: string) => nodeIds.has(id)));
                if (validChildren.length !== newChildrenIds.length) {
                    newChildrenIds = validChildren;
                    modified = true;
                    fixedCount++;
                }

                // 2. Check Source IDs
                const validSources = newSourceIds.filter(((id: string) => nodeIds.has(id)));
                if (validSources.length !== newSourceIds.length) {
                    newSourceIds = validSources;
                    modified = true;
                    fixedCount++;
                }

                // 3. Check Parent ID (Orphan Check)
                if (newParentId && !nodeIds.has(newParentId)) {
                    // It's an orphan.
                    // If it's not a ROOT, we should probably delete it or move it to a safe root.
                    // For now, let's set parent to null and mark it.
                    // But actually, mind map structure relies on hierarchy. 
                    // If parent is gone, the node is effectively invisible unless it's a ROOT.

                    if (node.type !== 'ROOT') {
                        // Strategy: If orphan, set parent to null (making it floating? No, that breaks UI usually).
                        // Better: Remove it? Or just leave it (Zombie).
                        // Let's just unlink it for now to be safe, prevents crash on lookup.
                        newParentId = null;
                        modified = true;
                        fixedCount++;
                    }
                }

                // 4. Check Virtual Child Map
                if (node.attributes?.virtualChildMap) {
                    try {
                        const vMap = JSON.parse(node.attributes.virtualChildMap);
                        let vMapModified = false;
                        const newVMap: Record<string, string[]> = {};

                        Object.entries(vMap).forEach(([key, val]) => {
                            if (nodeIds.has(key)) {
                                // Check values
                                const validVals = (val as string[]).filter(v => nodeIds.has(v));
                                if (validVals.length !== (val as string[]).length) {
                                    newVMap[key] = validVals;
                                    vMapModified = true;
                                } else {
                                    newVMap[key] = val as string[];
                                }
                            } else {
                                vMapModified = true; // Key node doesn't exist
                            }
                        });

                        if (vMapModified) {
                            newAttributes.virtualChildMap = JSON.stringify(newVMap);
                            modified = true;
                            fixedCount++;
                        }
                    } catch (e) { }
                }

                if (modified) {
                    nextNodes[node.id] = {
                        ...node,
                        attributes: newAttributes,
                        childrenIds: newChildrenIds,
                        sourceIds: newSourceIds,
                        parentId: newParentId
                    };
                }
            });

            // 5. Cleanup Orphans (Optional: Delete nodes that are not ROOT and reachable?)
            // This is expensive (graph traversal). Let's skip for now.

            setStatus({
                type: 'success',
                message: `무결성 검사 완료: ${fixedCount}건의 참조 오류가 수정되었습니다.`
            });

            return nextNodes;
        });
    };

    const handleClearOrders = () => {
        if (confirm("정말로 모든 주문 데이터를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
            // Set empty array instead of removing key to ensure OrderReception picks it up as empty
            localStorage.setItem('winterior_orders', '[]');
            setStatus({ type: 'success', message: '모든 주문 데이터가 초기화되었습니다.' });
            // Notify listeners (OrderReception)
            window.dispatchEvent(new Event('orderDataChanged'));
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-[480px] overflow-hidden transform transition-all scale-100">
                {/* Header */}
                <div className="bg-gray-800 px-6 py-4 flex justify-between items-center">
                    <h3 className="text-white font-bold text-lg flex items-center gap-2">
                        <Save size={20} className="text-blue-400" />
                        데이터 백업/복구 시스템
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        ✕
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    <div className="bg-amber-50 p-4 rounded-lg border border-amber-100 text-sm text-amber-800 flex gap-3">
                        <AlertCircle size={20} className="flex-shrink-0 text-amber-600 mt-0.5" />
                        <div>
                            <p className="font-bold mb-1">시스템 데이터 관리 주의사항</p>
                            복구(Import) 시 현재 시스템의 모든 설정 데이터가 백업 파일 내용으로 덮어씌워집니다. 중요한 작업 전에는 반드시 백업을 먼저 진행해주세요.
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Export Button */}
                        <button
                            onClick={handleExport}
                            className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group"
                        >
                            <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-sm">
                                <Download className="text-blue-600" size={28} />
                            </div>
                            <span className="font-bold text-gray-700 text-lg">데이터 백업</span>
                            <span className="text-xs text-gray-500 mt-1">현재 상태 저장 (JSON)</span>
                        </button>

                        {/* Import Button */}
                        <button
                            onClick={handleImportClick}
                            className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-200 rounded-xl hover:border-red-500 hover:bg-red-50 transition-all group"
                        >
                            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-sm">
                                <Upload className="text-red-600" size={28} />
                            </div>
                            <span className="font-bold text-gray-700 text-lg">데이터 복구</span>
                            <span className="text-xs text-gray-500 mt-1">백업 파일 불러오기</span>
                        </button>
                    </div>

                    {/* Generate Sample Button */}
                    {/* Generate Sample Button */}
                    <div className="space-y-2">
                        <button
                            onClick={handleGenerateSamples}
                            className={`w-full flex items-center justify-center gap-2 p-4 border rounded-xl font-bold transition-all ${shouldClearData
                                ? 'bg-red-50 hover:bg-red-100 border-red-200 text-red-700'
                                : 'bg-green-50 hover:bg-green-100 border-green-200 text-green-700'
                                }`}
                        >
                            <RefreshCw size={18} />
                            <span>주문상품,현재고리스트 샘플생성</span>
                        </button>

                        <label className="flex items-center justify-center gap-2 text-sm text-gray-600 cursor-pointer select-none hover:bg-gray-50 p-2 rounded-lg border border-transparent hover:border-gray-100 transition-colors">
                            <input
                                type="checkbox"
                                checked={shouldClearData}
                                onChange={(e) => setShouldClearData(e.target.checked)}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                            />
                            <span className={shouldClearData ? "font-bold text-red-600" : ""}>
                                생성 전 기존 데이터 초기화 (권장)
                            </span>
                        </label>
                    </div>

                    {/* Clear Data Button (New) */}
                    <button
                        onClick={handleClearOrders}
                        className="w-full flex items-center justify-center gap-2 p-4 bg-gray-50 hover:bg-red-50 border border-gray-200 hover:border-red-200 text-gray-600 hover:text-red-700 rounded-xl font-bold transition-all mt-2"
                    >
                        <Trash2 size={18} />
                        <span>전체 주문 데이터 초기화</span>
                    </button>

                    {/* Smart Migration Section (New) */}
                    <div className="col-span-2 border-t border-gray-100 pt-4 mt-2">
                        <label className="text-sm font-bold text-gray-700 mb-2 block flex items-center gap-2">
                            <RefreshCw size={16} className="text-purple-600" />
                            고급 데이터 복구 (스마트 마이그레이션)
                        </label>
                        <div className="flex items-start gap-2 mb-3 bg-purple-50 p-3 rounded-lg border border-purple-100">
                            <AlertCircle className="flex-shrink-0 text-purple-500 mt-0.5" size={16} />
                            <span className="text-xs text-purple-800 leading-relaxed">
                                <b>경로 기반 복구:</b> 노드 ID가 변경되어 연결이 끊긴 데이터를 <b>'이름과 경로'</b>가 일치하는 항목에 자동으로 연결합니다.
                                <br />트리 초기화 후 원가 데이터가 보이지 않을 때 백업 파일을 선택하여 실행하세요.
                            </span>
                        </div>

                        <button
                            onClick={() => document.getElementById('smart-migration-input')?.click()}
                            className="w-full flex items-center justify-center gap-2 p-4 bg-white hover:bg-purple-50 border-2 border-dashed border-purple-200 hover:border-purple-300 text-purple-600 hover:text-purple-700 rounded-xl font-bold transition-all group shadow-sm hover:shadow-md"
                        >
                            <FileJson size={20} className="group-hover:scale-110 transition-transform" />
                            <span>스마트 데이터 복구 실행 (백업파일 선택)</span>
                        </button>
                        <input
                            id="smart-migration-input"
                            type="file"
                            accept=".json"
                            className="hidden"
                            onChange={(e) => handleSmartMigration(e)}
                        />
                    </div>

                    {/* Integrity Check UI */}
                    <div className="col-span-2 mt-2">
                        <button
                            onClick={handleIntegrityCheck}
                            className="w-full flex items-center justify-center gap-2 p-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-500 hover:text-gray-700 rounded-lg text-xs font-bold transition-all"
                        >
                            <CheckCircle2 size={14} />
                            <span>데이터 무결성 검사 및 정리 (참조 오류 수정)</span>
                        </button>
                    </div>

                    {/* Hidden File Input */}
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept=".json"
                        className="hidden"
                    />

                    {/* Status Message */}
                    {status && (
                        <div className={`flex items-center gap-3 p-4 rounded-lg text-sm font-medium animate-pulse 
                            ${status.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
                            {status.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                            {status.message}
                        </div>
                    )}
                </div>

                <div className="bg-gray-50 px-6 py-4 flex justify-end border-t border-gray-100">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        닫기
                    </button>
                </div>
            </div>
        </div >
    );
};

export default DataBackupManager;
