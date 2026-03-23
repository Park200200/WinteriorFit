# 안전한 트리 리팩토링 계획

## 원칙

1. **기존 기능 유지** - 모든 탭이 현재처럼 정상 작동해야 함
2. **점진적 개선** - 한 번에 하나씩, 테스트하면서 진행
3. **하위 호환성** - 기존 데이터 구조 유지 (당분간)
4. **확장성 확보** - 새로운 기능 추가 시 쉽게 확장 가능

## 현재 기능 분석

### 작동하는 기능들

#### 1. 원단 탭 (FABRIC)
- ✅ 표준상품 트리 표시
- ✅ 파트너별 필터링
- ✅ sourceIds를 통한 가상 자식 표시
- ✅ 원단 비용 입력/수정

#### 2. 절단 탭 (CUTTING)
- ✅ 표준상품 트리 표시
- ✅ 절단 비용 입력/수정

#### 3. 조립 탭 (ASSEMBLY)
- ❌ 시스템 트리를 표시해야 하는데 표준상품 트리 표시 (현재 문제)
- ✅ 조립 비용 입력/수정

#### 4. 채수 탭 (MEASURE)
- ✅ 표준상품 트리 표시
- ✅ 채수 비용 입력/수정

### 현재 문제점

1. **ASSEMBLY 탭**: 어디선가 sourceIds를 따라가서 표준상품 트리 표시
2. **복잡한 로직**: traverse 함수, categories useMemo, gridData useMemo에서 각각 sourceIds 처리
3. **디버깅 어려움**: 데이터 흐름 추적 어려움

## 리팩토링 계획 (3단계)

### Stage 1: 추상화 레이어 추가 (기존 코드 유지)

**목표**: 기존 로직을 건드리지 않고, 새로운 Helper 함수 추가

#### 1.1 TreeHelper 클래스 생성

```typescript
// components/StandardCost.helpers.ts

/**
 * 트리 조회를 위한 Helper 클래스
 * 기존 로직을 래핑하여 사용하기 쉽게 만듦
 */
class TreeHelper {
  constructor(
    private nodes: Record<string, NodeData>,
    private config: TreeConfig
  ) {}
  
  /**
   * 노드의 자식을 가져옵니다
   * 기존 로직을 그대로 사용하되, 옵션으로 제어 가능하게 함
   */
  getChildren(nodeId: string): NodeData[] {
    const node = this.nodes[nodeId];
    if (!node) return [];
    
    // 실제 자식
    let children = (node.childrenIds || [])
      .map(id => this.nodes[id])
      .filter(Boolean);
    
    // sourceIds 처리 (기존 로직 유지)
    if (this.config.includeSourceIds && node.sourceIds) {
      const virtualChildren = node.sourceIds.flatMap(srcId => {
        const src = this.nodes[srcId];
        return (src?.childrenIds || [])
          .map(id => this.nodes[id])
          .filter(Boolean);
      });
      children = [...children, ...virtualChildren];
    }
    
    return children;
  }
  
  /**
   * 노드의 경로를 가져옵니다
   */
  getPath(nodeId: string, options?: { maxDepth?: number }): string {
    const path: string[] = [];
    let current = this.nodes[nodeId];
    let depth = 0;
    
    while (current && (!options?.maxDepth || depth < options.maxDepth)) {
      if (current.type !== 'ROOT') {
        path.unshift(current.label);
      }
      current = current.parentId ? this.nodes[current.parentId] : null;
      depth++;
    }
    
    return path.join(' > ');
  }
  
  /**
   * 트리를 순회하며 노드를 수집합니다
   */
  traverse(
    startNodeIds: string[],
    callback: (node: NodeData, path: string) => void
  ): void {
    const visited = new Set<string>();
    
    const visit = (nodeId: string, pathStr: string) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);
      
      const node = this.nodes[nodeId];
      if (!node) return;
      
      const currentPath = pathStr ? `${pathStr} > ${node.label}` : node.label;
      callback(node, currentPath);
      
      // 자식 순회
      const children = this.getChildren(nodeId);
      children.forEach(child => visit(child.id, currentPath));
    };
    
    startNodeIds.forEach(id => visit(id, ''));
  }
}

/**
 * 트리 설정
 */
interface TreeConfig {
  // sourceIds를 따라갈지 여부
  includeSourceIds: boolean;
  
  // virtualChildMap을 사용할지 여부
  includeVirtualChildMap: boolean;
  
  // originalSourceId를 따라갈지 여부
  followOriginalSource: boolean;
}

/**
 * 탭별 트리 설정
 */
const TAB_TREE_CONFIG: Record<CostTab, TreeConfig> = {
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
    includeSourceIds: false,      // 명시적으로 false
    includeVirtualChildMap: false, // 명시적으로 false
    followOriginalSource: true     // 복사된 노드의 원본은 따라감
  },
  MEASURE: {
    includeSourceIds: true,
    includeVirtualChildMap: true,
    followOriginalSource: true
  }
};

/**
 * TreeHelper 인스턴스를 생성하는 Hook
 */
function useTreeHelper(
  nodes: Record<string, NodeData>,
  activeTab: CostTab
): TreeHelper {
  return useMemo(() => {
    const config = TAB_TREE_CONFIG[activeTab];
    return new TreeHelper(nodes, config);
  }, [nodes, activeTab]);
}
```

#### 1.2 기존 코드에 적용 (점진적)

```typescript
// StandardCost.tsx

function StandardCost({ rootId, systemRootId, role }: StandardCostProps) {
  const { nodes } = useProductContext();
  const [activeTab, setActiveTab] = useState<CostTab>('FABRIC');
  
  // 새로운 Helper 사용
  const treeHelper = useTreeHelper(nodes, activeTab);
  
  // 기존 categories useMemo를 Helper로 대체 (선택적)
  const categories = useMemo(() => {
    const rootNode = nodes[currentRootId];
    if (!rootNode) return [];
    
    // 새로운 방식 (간단함!)
    return treeHelper.getChildren(currentRootId);
    
    // 기존 방식 (복잡함, 주석 처리)
    // let childrenIds = Array.isArray(rootNode.childrenIds) ? rootNode.childrenIds : [];
    // ... 복잡한 로직 ...
  }, [nodes, currentRootId, treeHelper]);
  
  // gridData도 Helper 사용 가능
  const gridData = useMemo(() => {
    const rows: { id: string; path: string; node: NodeData }[] = [];
    
    // 시작 노드 결정
    const startNodeIds = getStartNodeIds(); // 기존 로직 유지
    
    // 새로운 방식으로 순회
    treeHelper.traverse(startNodeIds, (node, path) => {
      rows.push({ id: node.id, path, node });
    });
    
    return rows;
  }, [treeHelper, /* 기타 dependencies */]);
}
```

#### 1.3 장점

✅ **기존 코드 유지**: 기존 로직을 주석 처리만 하고 새 코드 추가
✅ **점진적 마이그레이션**: 한 번에 하나씩 교체 가능
✅ **롤백 가능**: 문제 발생 시 주석 해제하면 원복
✅ **테스트 용이**: 새 방식과 기존 방식 비교 가능

### Stage 2: 로직 단순화 (기존 기능 유지)

**목표**: Helper를 사용하여 복잡한 로직 제거

#### 2.1 categories 단순화

```typescript
// 기존 (30줄)
const categories = useMemo(() => {
  const rootNode = nodes[currentRootId];
  if (!rootNode) return [];
  
  let childrenIds = Array.isArray(rootNode.childrenIds) ? rootNode.childrenIds : [];
  
  if (childrenIds.length === 0 && rootNode.attributes?.originalSourceId) {
    const src = nodes[rootNode.attributes.originalSourceId];
    if (src && Array.isArray(src.childrenIds)) childrenIds = src.childrenIds;
  }
  
  const realChildren = childrenIds.map(id => nodes[id]).filter(Boolean);
  
  const virtualChildren = activeTab === 'ASSEMBLY' ? [] : (rootNode.sourceIds || []).flatMap(srcId => {
    const src = nodes[srcId];
    return (src && Array.isArray(src.childrenIds)) ? src.childrenIds.map(id => nodes[id]).filter(Boolean) : [];
  });
  
  const result = [...realChildren, ...virtualChildren];
  console.log('[StandardCost categories] result:', result);
  return result;
}, [nodes, currentRootId, activeTab]);

// 새로운 (3줄)
const categories = useMemo(() => {
  return treeHelper.getChildren(currentRootId);
}, [treeHelper, currentRootId]);
```

#### 2.2 gridData 단순화

```typescript
// 기존 traverse 함수 (200줄+)
const traverse = (nodeId: string, pathStr: string) => {
  // 복잡한 로직...
  if (activeTab !== 'ASSEMBLY' && node.sourceIds && Array.isArray(node.sourceIds)) {
    // ...
  }
  // ...
};

// 새로운 (10줄)
const gridData = useMemo(() => {
  const rows: { id: string; path: string; node: NodeData }[] = [];
  const startNodeIds = getStartNodeIds();
  
  treeHelper.traverse(startNodeIds, (node, path) => {
    if (!searchQuery || path.toLowerCase().includes(searchQuery.toLowerCase())) {
      rows.push({ id: node.id, path, node });
    }
  });
  
  return rows;
}, [treeHelper, searchQuery, /* ... */]);
```

#### 2.3 디버그 로그 정리

```typescript
// 개발 모드에서만 작동하는 로거
const logger = {
  categories: (data: NodeData[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.group(`[StandardCost] Categories (${activeTab})`);
      console.table(data.map(d => ({ id: d.id, label: d.label, type: d.type })));
      console.groupEnd();
    }
  }
};

// 사용
const categories = useMemo(() => {
  const result = treeHelper.getChildren(currentRootId);
  logger.categories(result);
  return result;
}, [treeHelper, currentRootId]);
```

### Stage 3: 확장성 확보

**목표**: 새로운 기능 추가 시 쉽게 확장 가능하도록

#### 3.1 플러그인 시스템

```typescript
/**
 * 트리 플러그인 인터페이스
 */
interface TreePlugin {
  name: string;
  
  // 자식 노드를 필터링
  filterChildren?(children: NodeData[], context: TreeContext): NodeData[];
  
  // 경로를 변환
  transformPath?(path: string, node: NodeData, context: TreeContext): string;
  
  // 노드를 변환
  transformNode?(node: NodeData, context: TreeContext): NodeData;
}

/**
 * 파트너 필터 플러그인
 */
const partnerFilterPlugin: TreePlugin = {
  name: 'partnerFilter',
  
  filterChildren(children, context) {
    if (!context.partnerId) return children;
    
    // 파트너별 필터링 로직
    return children.filter(child => {
      // excludedIds 체크
      // ...
    });
  }
};

/**
 * 시스템 경로 플러그인 (ASSEMBLY 탭 전용)
 */
const systemPathPlugin: TreePlugin = {
  name: 'systemPath',
  
  transformPath(path, node, context) {
    if (context.activeTab !== 'ASSEMBLY') return path;
    
    // 시스템 노드의 부모까지만 표시
    const parts = path.split(' > ');
    if (parts.length > 2) {
      return parts.slice(0, 2).join(' > ');
    }
    return path;
  }
};

/**
 * TreeHelper에 플러그인 추가
 */
class TreeHelper {
  private plugins: TreePlugin[] = [];
  
  use(plugin: TreePlugin): this {
    this.plugins.push(plugin);
    return this;
  }
  
  getChildren(nodeId: string): NodeData[] {
    let children = this.getChildrenInternal(nodeId);
    
    // 플러그인 적용
    for (const plugin of this.plugins) {
      if (plugin.filterChildren) {
        children = plugin.filterChildren(children, this.context);
      }
    }
    
    return children;
  }
}

// 사용
const treeHelper = new TreeHelper(nodes, config)
  .use(partnerFilterPlugin)
  .use(systemPathPlugin);
```

#### 3.2 새로운 탭 추가 예시

```typescript
// 새로운 탭: 포장 비용 (PACKAGING)
const TAB_TREE_CONFIG: Record<CostTab, TreeConfig> = {
  // ... 기존 탭들 ...
  
  PACKAGING: {
    includeSourceIds: true,
    includeVirtualChildMap: false,
    followOriginalSource: true
  }
};

// 끝! 다른 코드 수정 불필요
```

#### 3.3 새로운 트리 타입 추가 예시

```typescript
// 새로운 트리: 재고 트리 (Inventory Tree)
interface TreeHelperOptions {
  treeType: 'PRODUCT' | 'SYSTEM' | 'INVENTORY';
  config: TreeConfig;
}

// 사용
const inventoryHelper = new TreeHelper(nodes, {
  treeType: 'INVENTORY',
  config: {
    includeSourceIds: false,
    includeVirtualChildMap: false,
    followOriginalSource: false
  }
});
```

## 실행 계획

### Week 1: Stage 1 구현 및 테스트

**Day 1-2**: TreeHelper 클래스 구현
- [ ] `TreeHelper` 클래스 작성
- [ ] `TAB_TREE_CONFIG` 정의
- [ ] `useTreeHelper` Hook 작성
- [ ] 단위 테스트 작성

**Day 3-4**: categories 마이그레이션
- [ ] 새로운 방식으로 `categories` 구현
- [ ] 기존 방식과 결과 비교 (테스트)
- [ ] 모든 탭에서 정상 작동 확인

**Day 5-7**: gridData 마이그레이션
- [ ] 새로운 방식으로 `gridData` 구현
- [ ] 기존 방식과 결과 비교
- [ ] 모든 탭에서 정상 작동 확인
- [ ] **ASSEMBLY 탭 문제 해결 확인**

### Week 2: Stage 2 구현

**Day 1-3**: 기존 코드 제거
- [ ] 기존 traverse 함수 제거
- [ ] 중복 로직 제거
- [ ] 디버그 로그 정리

**Day 4-5**: 코드 리뷰 및 최적화
- [ ] 성능 테스트
- [ ] 코드 리뷰
- [ ] 문서화

### Week 3: Stage 3 구현

**Day 1-2**: 플러그인 시스템 구현
- [ ] `TreePlugin` 인터페이스 정의
- [ ] 기본 플러그인 구현

**Day 3-5**: 확장성 테스트
- [ ] 새로운 탭 추가 테스트
- [ ] 새로운 필터 추가 테스트
- [ ] 문서화

## 성공 기준

### 기능 유지
- ✅ 모든 탭이 기존과 동일하게 작동
- ✅ 데이터 손실 없음
- ✅ 성능 저하 없음

### 코드 개선
- ✅ 코드 라인 수 50% 감소
- ✅ 복잡도 감소 (Cyclomatic Complexity < 10)
- ✅ 테스트 커버리지 > 80%

### 확장성
- ✅ 새로운 탭 추가 시 < 10줄 코드 수정
- ✅ 새로운 필터 추가 시 플러그인으로 가능
- ✅ 명확한 문서화

## 롤백 계획

각 Stage마다 Git 브랜치 생성:
- `refactor/stage-1-abstraction`
- `refactor/stage-2-simplification`
- `refactor/stage-3-extensibility`

문제 발생 시:
1. 이전 브랜치로 체크아웃
2. 문제 분석
3. 수정 후 재시도

## 다음 단계

**즉시 시작 가능:**
1. TreeHelper 클래스 구현
2. ASSEMBLY 탭 문제 해결

시작하시겠습니까?
