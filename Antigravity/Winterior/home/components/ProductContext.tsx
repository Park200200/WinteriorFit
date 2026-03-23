
import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import { NodeData } from './types';
// Import data from TS files
import { nodesPart1 } from './ProductDataPart1';
import { nodesPart2 } from './ProductDataPart2';
import { nodesPart3 } from './ProductDataPart3';
// Import JSONs - ALL static imports (bundled at build time)
// import roots from './data/roots.json'; // File doesn't exist, using empty object
const roots = {};
import partnerTrees from './data/partner_trees.json';
import systemTree from './data/system_tree.json';
import basicTree from './data/basic_tree.json'; // RESTORED - using static import
import attributesData from './data/attributes.json';
import snapshotData from './data/snapshot_data.json';

interface ProductContextType {
  nodes: Record<string, NodeData>;
  setNodes: React.Dispatch<React.SetStateAction<Record<string, NodeData>>>;
  resetNodes: () => void;
  refreshFromSource: () => void;
  isLoading: boolean;
  loadingMessage: string;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

// CRITICAL FIX: Bumped to v23 to force reload with clean basic_tree.json data
export const STORAGE_KEY = 'winterior_product_data_master_save_v23';

// Helper: Random Colors for auto-population
const RANDOM_COLORS = [
  { label: '화이트', color: '#FFFFFF' },
  { label: '블랙', color: '#000000' },
  { label: '그레이', color: '#808080' },
  { label: '아이보리', color: '#FFFFF0' },
  { label: '베이지', color: '#F5F5DC' },
  { label: '차콜', color: '#36454F' },
  { label: '네이비', color: '#000080' },
  { label: '브라운', color: '#A52A2A' },
  { label: '피치', color: '#FFDAB9' },
  { label: '민트', color: '#98FF98' },
  { label: '스카이블루', color: '#87CEEB' },
  { label: '라벤더', color: '#E6E6FA' },
  { label: '핑크', color: '#FFC0CB' },
  { label: '올리브', color: '#808000' },
  { label: '버건디', color: '#800020' }
];

// Helper to safe load default export or direct
const safeLoad = (mod: any) => (mod && mod.default) ? mod.default : mod;

// Merge all data sources into one initial state
const getRawNodes = (): Record<string, NodeData> => {
  // 1. Load all sources
  const sourceRoots = safeLoad(roots);
  const sourcePartner = safeLoad(partnerTrees);
  const sourceSystem = safeLoad(systemTree);
  const sourceBasic = safeLoad(basicTree); // Using static import
  const sourceAttr = safeLoad(attributesData);
  const sourceSnapshot = safeLoad(snapshotData);

  // Debug: Log source sizes
  console.log('[ProductContext getRawNodes] Source sizes:');
  console.log('  - sourceSnapshot:', Object.keys(sourceSnapshot || {}).length);
  console.log('  - nodesPart1:', Object.keys(nodesPart1 || {}).length);
  console.log('  - nodesPart2:', Object.keys(nodesPart2 || {}).length);
  console.log('  - nodesPart3:', Object.keys(nodesPart3 || {}).length);
  console.log('  - sourceRoots:', Object.keys(sourceRoots || {}).length);
  console.log('  - sourceSystem:', Object.keys(sourceSystem || {}).length);
  console.log('  - sourcePartner:', Object.keys(sourcePartner || {}).length);
  console.log('  - sourceAttr:', Object.keys(sourceAttr || {}).length);
  console.log('  - sourceBasic (basic_tree.json - STATIC IMPORT):', Object.keys(sourceBasic || {}).length);

  // CRITICAL: Use ONLY basic_tree.json data
  // Ignore all other sources to ensure clean data
  console.log('[ProductContext] 🎯 Using ONLY basic_tree.json data');
  let combined: Record<string, NodeData> = {
    ...JSON.parse(JSON.stringify(sourceBasic)), // ONLY basic_tree.json
  };

  // CRITICAL: Remove partner roots and their descendants to force fresh creation
  // Partner roots will be auto-created by MindMapSystem from template roots
  console.log('[ProductContext] 🧹 Removing partner roots to force fresh creation...');
  const partnerRootIds = Object.keys(combined).filter(id =>
    combined[id].type === 'ROOT' && combined[id].attributes?.partnerId
  );

  console.log('[ProductContext] Found partner roots to remove:', partnerRootIds);

  // Remove partner roots and all their descendants
  const nodesToRemove = new Set<string>();
  const collectDescendants = (nodeId: string) => {
    nodesToRemove.add(nodeId);
    const node = combined[nodeId];
    if (node?.childrenIds) {
      node.childrenIds.forEach(childId => collectDescendants(childId));
    }
  };

  partnerRootIds.forEach(rootId => collectDescendants(rootId));

  console.log('[ProductContext] Total nodes to remove:', nodesToRemove.size);
  nodesToRemove.forEach(id => delete combined[id]);
  console.log('[ProductContext] Nodes after cleanup:', Object.keys(combined).length);

  // DISABLED: TREE HEALING (Reverse Lookup)
  // This was adding incorrect nodes to parent childrenIds
  // For example, nodes with parentId="sub-wood" but not in sub-wood's childrenIds were being added
  /*
  Object.keys(combined).forEach(childId => {
    const childNode = combined[childId];
    if (childNode.parentId) {
      const parentNode = combined[childNode.parentId];
      if (parentNode) {
        if (!parentNode.childrenIds) {
          parentNode.childrenIds = [];
        }
        // Add child to parent if not already present
        if (!parentNode.childrenIds.includes(childId)) {
          parentNode.childrenIds.push(childId);
        }
      }
    }
  });
  */

  // 4. Failsafe for specific root if missing (Part 3 Root)
  // REMOVED: Forced injection of 'root-1768364888562' (시스템test)
  // This was overwriting the clean data from basic_tree.json
  // Now using only the data from basic_tree.json

  // 5. REQUIREMENT: Hardcode 5 random colors to products without children
  Object.keys(combined).forEach(key => {
    const node = combined[key];

    const isProduct = node.attributes?.nodeType === 'product';
    const hasNoChildren = !node.childrenIds || node.childrenIds.length === 0;

    if (isProduct && hasNoChildren) {
      const shuffled = [...RANDOM_COLORS].sort(() => 0.5 - Math.random());
      const selectedColors = shuffled.slice(0, 5);

      const newChildrenIds: string[] = [];

      selectedColors.forEach((color, idx) => {
        const newColorId = `${node.id}-auto-col-${idx}`;
        combined[newColorId] = {
          id: newColorId,
          parentId: node.id,
          type: 'DATA',
          label: color.label,
          isExpanded: false,
          childrenIds: [],
          attributes: {
            nodeType: 'color',
            color: color.color
          }
        };
        newChildrenIds.push(newColorId);
      });

      // Update Parent
      combined[key] = {
        ...node,
        childrenIds: newChildrenIds,
        isExpanded: true
      };
    }
  });

  // Debug: Check if root-f1 exists
  console.log('[ProductContext buildInitialData] root-f1 exists:', !!combined['root-f1']);
  console.log('[ProductContext buildInitialData] root-f1 node:', combined['root-f1']);
  console.log('[ProductContext buildInitialData] Total nodes:', Object.keys(combined).length);

  return combined;
};

// REMOVED: INITIAL_NODES constant - now calling getRawNodes() directly in useState

export const ProductProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('basic_tree.json 적용 중...');
  const [nodes, setNodes] = useState<Record<string, NodeData>>({});

  useEffect(() => {
    const loadData = async () => {
      try {
        // 1. Try to load from LocalStorage first
        const savedData = localStorage.getItem(STORAGE_KEY);

        if (savedData) {
          try {
            const parsedNodes = JSON.parse(savedData);
            console.log('[ProductContext] ✅ Loaded data from LocalStorage:', Object.keys(parsedNodes).length, 'nodes');
            setNodes(parsedNodes);
            setLoadingMessage('저장된 데이터 로드 완료');
            setIsLoading(false);
            return;
          } catch (e) {
            console.error('[ProductContext] Failed to parse LocalStorage data, falling back to clean load', e);
          }
        }

        // 2. If no data or error, load from basic_tree.json
        console.log("[ProductContext] Calling getRawNodes() to load fresh data...");
        setLoadingMessage('기본 데이터(basic_tree.json) 로딩 중...');

        await new Promise(resolve => setTimeout(resolve, 300)); // 300ms delay for UI

        const freshNodes = getRawNodes();

        // Use initial nodes with basic_tree.json
        console.log("[ProductContext] Loading data with basic_tree.json");
        console.log("[ProductContext] Total nodes loaded:", Object.keys(freshNodes).length);

        setNodes(freshNodes);
        const nodeCount = Object.keys(freshNodes).length;
        setLoadingMessage(`기본 데이터 적용 완료! (${nodeCount}개 노드 로드됨)`);

        await new Promise(resolve => setTimeout(resolve, 500)); // 0.5초 후 로딩 완료
        setIsLoading(false);
      } catch (error) {
        console.error('[ProductContext] Error loading data:', error);
        setLoadingMessage('데이터 로딩 실패!');
      }
    };

    loadData();
  }, []);

  // Save to LocalStorage whenever nodes change
  useEffect(() => {
    // Avoid saving if still loading (prevent overwrite with empty state)
    if (isLoading) return;

    const saveNodes = (data: Record<string, NodeData>) => {
      try {
        const serialized = JSON.stringify(data);
        localStorage.setItem(STORAGE_KEY, serialized);
        console.log('[ProductContext] ✅ Saved to LocalStorage:', Object.keys(data).length, 'nodes', `(${Math.round(serialized.length / 1024)}KB)`);
      } catch (e: any) {
        // QuotaExceededError 발생 시 이미지 제외하고 재저장
        if (e?.name === 'QuotaExceededError' || e?.code === 22) {
          console.warn('[ProductContext] ⚠ localStorage 용량 초과 - 이미지 데이터 제외 후 재저장 시도...');
          try {
            // 이미지 데이터(Base64) 제외한 복사본 저장
            const stripped: Record<string, NodeData> = {};
            Object.entries(data).forEach(([id, node]) => {
              const attrs = { ...(node.attributes || {}) };
              // Base64 이미지나 대용량 데이터 키 제거
              Object.keys(attrs).forEach(key => {
                if (typeof attrs[key] === 'string' && attrs[key].length > 50000) {
                  delete attrs[key]; // 50KB 이상 단일 속성 제거
                }
              });
              stripped[id] = { ...node, attributes: attrs };
            });
            const strippedSerialized = JSON.stringify(stripped);
            localStorage.setItem(STORAGE_KEY, strippedSerialized);
            console.log('[ProductContext] ✅ 이미지 제외 저장 성공:', `(${Math.round(strippedSerialized.length / 1024)}KB)`);
          } catch (e2) {
            console.error('[ProductContext] ❌ 이미지 제외 후에도 저장 실패:', e2);
          }
        } else {
          console.error('[ProductContext] ❌ 저장 실패:', e);
        }
      }
    };

    saveNodes(nodes);
  }, [nodes, isLoading]);

  // Force Reset: Clear storage and Reload
  const resetNodes = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  }, []);

  const refreshFromSource = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  }, []);

  return (
    <ProductContext.Provider value={{ nodes, setNodes, resetNodes, refreshFromSource, isLoading, loadingMessage }}>
      {isLoading ? (
        <div className="flex items-center justify-center h-screen w-screen bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="text-center">
            <div className="mb-8">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">데이터 로딩 중</h2>
            <p className="text-lg text-gray-600">{loadingMessage}</p>
          </div>
        </div>
      ) : (
        children
      )}
    </ProductContext.Provider>
  );
};

export const useProductContext = () => {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useProductContext must be used within a ProductProvider');
  }
  return context;
};
