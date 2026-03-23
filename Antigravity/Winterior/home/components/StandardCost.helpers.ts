import React from 'react';
import { NodeData } from '../types';
import { CostTab, CostCategory, LengthUnit, MeasureUnit, MeasureCategory } from './StandardCost.types';
import { Scroll, Layers, Grid, ScanLine, Maximize, Stamp, Pin, RefreshCw, BoxSelect } from 'lucide-react';

/**
 * 트리 설정 인터페이스
 */
export interface TreeConfig {
    // sourceIds를 따라갈지 여부
    includeSourceIds: boolean;

    // virtualChildMap을 사용할지 여부
    includeVirtualChildMap: boolean;

    // originalSourceId를 따라갈지 여부
    followOriginalSource: boolean;
}

/**
 * 트리 컨텍스트
 */
export interface TreeContext {
    activeTab: ResultCostTab;
    partnerId?: string;
    currentRootId: string;
    globalExcludedIds?: string[];
    systemVirtualMap?: Record<string, string[]>;
}

// Re-export CostTab to avoid circular dependency if possible, or just use the one from types
// But here we imported from .types.
type ResultCostTab = CostTab;

// --- Utility Functions ---

/**
 * Format number with commas
 */
export const formatNumber = (value: string) => {
    if (!value) return '';
    const clean = value.replace(/,/g, '');
    const sanitized = clean.replace(/[^0-9.]/g, '');
    const parts = sanitized.split('.');
    if (parts.length > 2) {
        const int = parts.shift();
        const dec = parts.join('');
        return `${int?.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}.${dec}`;
    }
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join('.');
};

export const parseNumber = (value: string) => {
    return parseFloat(value.replace(/,/g, '')) || 0;
};

export const roundToHundreds = (num: number) => {
    return Math.round(num / 100) * 100;
};

/**
 * 트리 조회를 위한 Helper 클래스
 */
export class TreeHelper {
    constructor(
        private nodes: Record<string, NodeData>,
        private config: TreeConfig,
        private context: TreeContext
    ) { }

    /**
     * 노드의 자식을 가져옵니다
     */
    getChildren(nodeId: string): NodeData[] {
        const node = this.nodes[nodeId];
        if (!node) return [];

        const excluded = this.context.globalExcludedIds || [];

        // 실제 자식 ID 가져오기
        let childrenIds = Array.isArray(node.childrenIds) ? node.childrenIds : [];
        childrenIds = childrenIds.filter(id => !excluded.includes(id));

        let hasDirectChildren = childrenIds.length > 0;

        /**
         * [특수 로직: ASSEMBLY 탭 중복 방지]
         * ASSEMBLY 탭에서 시스템 트리를 보여줄 때,
         * 이미 파트너 트리가 복사되어 존재한다면(자식이 있다면),
         * 원본(Source/Original)을 따라가서 중복으로 보여주지 않도록 합니다.
         */
        const isAssemblyCleanup = this.context.activeTab === 'ASSEMBLY' && hasDirectChildren;

        // originalSourceId 따라가기 (childrenIds가 없을 때)
        if (this.config.followOriginalSource &&
            !isAssemblyCleanup && // Cleanup 시에는 스킵
            childrenIds.length === 0 &&
            node.attributes?.originalSourceId) {
            const src = this.nodes[node.attributes.originalSourceId];
            if (src && Array.isArray(src.childrenIds)) {
                childrenIds = src.childrenIds.filter(id => !excluded.includes(id));
            }
        }

        // 실제 자식 노드들
        const realChildren = childrenIds
            .map(id => this.nodes[id])
            .filter(Boolean);

        // sourceIds 처리 (가상 자식)
        let virtualChildren: NodeData[] = [];
        if (this.config.includeSourceIds &&
            !isAssemblyCleanup && // Cleanup 시에는 스킵
            node.sourceIds && Array.isArray(node.sourceIds)) {
            virtualChildren = node.sourceIds.flatMap(srcId => {
                const src = this.nodes[srcId];
                if (!src || !Array.isArray(src.childrenIds)) return [];
                return src.childrenIds
                    .filter(id => !excluded.includes(id))
                    .map(id => this.nodes[id])
                    .filter(Boolean);
            });
        }

        // virtualChildMap 처리
        let virtualMapChildren: NodeData[] = [];
        if (this.config.includeVirtualChildMap) {
            const virtualIds: string[] = [];
            // 1. From root context
            if (this.context.systemVirtualMap && this.context.systemVirtualMap[nodeId]) {
                virtualIds.push(...this.context.systemVirtualMap[nodeId]);
            }
            // 2. From node itself
            if (node.attributes?.virtualChildMap) {
                try {
                    const localMap = typeof node.attributes.virtualChildMap === 'string'
                        ? JSON.parse(node.attributes.virtualChildMap)
                        : node.attributes.virtualChildMap;
                    if (localMap[nodeId]) {
                        virtualIds.push(...localMap[nodeId]);
                    }
                } catch (e) { }
            }

            if (virtualIds.length > 0) {
                virtualMapChildren = virtualIds
                    .filter(id => !excluded.includes(id))
                    .map(id => this.nodes[id])
                    .filter(Boolean);
            }
        }

        // 모든 자식 합치기 (중복 제거)
        const allChildren = [...realChildren, ...virtualChildren, ...virtualMapChildren];
        const uniqueChildren = Array.from(
            new Map(allChildren.map(child => [child.id, child])).values()
        );

        return uniqueChildren;
    }

    /**
     * 트리를 순회하며 콜백을 실행합니다.
     */
    traverse(
        startNodeIds: string[],
        callback: (node: NodeData, path: string[]) => void,
        options?: { maxDepth?: number }
    ) {
        const visited = new Set<string>();
        const maxDepth = options?.maxDepth || 50;

        const run = (ids: string[], currentPath: string[], depth: number) => {
            if (depth > maxDepth) return;

            for (const id of ids) {
                // 순환 참조 방지 (DAG 구조 가정)
                if (visited.has(id)) continue;

                const node = this.nodes[id];
                if (!node) continue;

                visited.add(id);

                // 콜백 실행 (현재 노드, 도달 경로)
                callback(node, currentPath);

                // 자식 노드 순회
                const children = this.getChildren(id);
                const nextPath = [...currentPath, node.label];
                run(children.map(c => c.id), nextPath, depth + 1);
            }
        };

        run(startNodeIds, [], 0);
    }
}

/**
 * 탭별 트리 설정
 */
export const TAB_TREE_CONFIG: Record<ResultCostTab, TreeConfig> = {
    FABRIC: {
        includeSourceIds: true,
        includeVirtualChildMap: true,
        followOriginalSource: true
    },
    CUTTING: {
        includeSourceIds: true,
        includeVirtualChildMap: true,
        followOriginalSource: true
    },
    ASSEMBLY: {
        // ASSEMBLY는 중복 방지를 위해 TreeHelper getChildren 내부에서
        // hasDirectChildren 체크를 통해 동적으로 제어되지만,
        // 기본적으로는 시스템 원본을 참조해야 할 수 있으므로 true로 둡니다.
        // 다만 getChildren 내부 로직이 우선함.
        includeSourceIds: true,
        includeVirtualChildMap: true,
        followOriginalSource: true
    },
    MEASURE: {
        includeSourceIds: true,
        includeVirtualChildMap: true,
        followOriginalSource: true
    }
};

export function createTreeHelper(
    nodes: Record<string, NodeData>,
    activeTab: ResultCostTab,
    context: Omit<TreeContext, 'activeTab'>
): TreeHelper {
    const config = TAB_TREE_CONFIG[activeTab];
    return new TreeHelper(nodes, config, { ...context, activeTab });
}

// --- Constants ---

export const CATEGORY_OPTIONS: { id: CostCategory; label: string; icon: React.ElementType }[] = [
    { id: 'ROLL', label: '롤 (Roll)', icon: Scroll },
    { id: 'SLAT', label: '슬랫 (Slat)', icon: Layers },
    { id: 'GRID', label: '규격 (가로세로)', icon: Grid }, // Honeycomb etc.
];

export const MEASURE_CATEGORY_OPTIONS: { id: MeasureCategory; label: string; icon: React.ElementType }[] = [
    { id: 'MARGIN_MEASURE', label: '여백실사', icon: ScanLine },
    { id: 'FULL_MEASURE', label: '꽉찬실사', icon: Maximize },
    { id: 'MARGIN_LOGO', label: '여백로고', icon: Stamp },
    { id: 'FIXED_LOGO', label: '고정로고', icon: Pin },
];

export const MEASURE_UNIT_OPTIONS: { id: MeasureUnit; label: string; icon: React.ElementType }[] = [
    { id: 'SQM', label: '㎡', icon: Grid },
    { id: 'CUTTING_LINK', label: '제단연동', icon: RefreshCw },
    { id: 'PER_PIECE', label: '건당', icon: BoxSelect },
];

