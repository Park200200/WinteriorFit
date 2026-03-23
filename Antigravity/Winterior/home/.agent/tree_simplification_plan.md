# 트리 구조 단순화 계획

## 현재 트리 구조 분석

### 1. 트리 종류

현재 시스템에는 여러 종류의 트리가 존재합니다:

#### 1.1 표준상품 트리 (Standard Product Tree)
- **Root ID**: `root` (총괄관리사)
- **Partner Root ID**: `root-partner-{partnerId}` (파트너별)
- **용도**: 원단, 절단, 채수 탭에서 사용
- **특징**: 
  - 실제 상품 카테고리 (블라인드 > 우드 > 25mm > 소나무 > 블랙)
  - `sourceIds`를 통해 다른 트리 참조 가능

#### 1.2 시스템 트리 (System Tree)
- **Root ID**: `root-{timestamp}` (기본설정)
- **Partner Root ID**: `root-{timestamp}-partner-{partnerId}` (파트너별)
- **용도**: 조립 탭에서 사용
- **특징**:
  - 시스템 구성 요소 (블라인드(원단) > 우드)
  - 표준상품 트리와 매핑됨

### 2. 트리 참조 메커니즘

#### 2.1 sourceIds
```typescript
{
  "id": "node-1",
  "childrenIds": ["child-1"],
  "sourceIds": ["source-node-1"]  // 다른 노드의 자식을 가상으로 포함
}
```

**문제점:**
- 언제 `sourceIds`를 따라가야 하는지 불명확
- ASSEMBLY 탭에서는 무시해야 하는데, 여러 곳에서 처리 필요
- 디버깅 어려움

#### 2.2 originalSourceId
```typescript
{
  "id": "copy-123",
  "type": "REFERENCE",
  "attributes": {
    "originalSourceId": "original-node"  // 원본 노드 참조
  }
}
```

**문제점:**
- `sourceIds`와 혼동됨
- 언제 따라가야 하는지 규칙이 불명확

#### 2.3 virtualChildMap
```typescript
{
  "attributes": {
    "virtualChildMap": "{\"parent-id\": [\"child-1\", \"child-2\"]}"
  }
}
```

**문제점:**
- JSON 문자열로 저장되어 파싱 필요
- 다른 참조 메커니즘과 중복

### 3. 현재 문제점 요약

#### 3.1 중복된 참조 메커니즘
- `sourceIds` - 가상 자식 참조
- `originalSourceId` - 원본 노드 참조
- `virtualChildMap` - 가상 자식 매핑
- **→ 3가지 방법이 혼재되어 있음**

#### 3.2 불명확한 사용 규칙
- 언제 `sourceIds`를 따라가야 하는가?
- 언제 `originalSourceId`를 따라가야 하는가?
- 언제 `virtualChildMap`을 사용해야 하는가?
- **→ 탭마다, 함수마다 다르게 처리됨**

#### 3.3 복잡한 트리 복사
- 파트너별로 트리를 복사할 때 `copy-{timestamp}-{random}` ID 생성
- 원본과의 연결이 `originalSourceId`로만 유지됨
- **→ 데이터 추적 어려움**

## 단순화 계획

### Phase 1: 트리 참조 메커니즘 통일

#### 목표
3가지 참조 메커니즘을 1가지로 통일

#### 제안: `references` 속성 사용
```typescript
interface NodeData {
  id: string;
  parentId: string | null;
  type: 'ROOT' | 'CATEGORY' | 'PRODUCT' | 'SYSTEM';
  label: string;
  childrenIds: string[];  // 실제 자식만
  
  // 새로운 통일된 참조 메커니즘
  references?: {
    // 원본 노드 (복사된 노드인 경우)
    source?: string;
    
    // 가상 자식 (다른 노드의 자식을 포함하고 싶을 때)
    virtualChildren?: string[];
    
    // 매핑 정보 (시스템 트리 ↔ 표준상품 트리)
    mappedTo?: string;
  };
  
  attributes: Record<string, any>;
}
```

#### 마이그레이션
```typescript
// 기존
{
  "sourceIds": ["node-1", "node-2"],
  "attributes": {
    "originalSourceId": "original-123",
    "virtualChildMap": "{\"parent\": [\"child-1\"]}"
  }
}

// 새로운 구조
{
  "references": {
    "source": "original-123",
    "virtualChildren": ["node-1", "node-2"],
    "mappedTo": "system-node-456"
  }
}
```

### Phase 2: 트리 종류 명확화

#### 목표
각 트리의 역할을 명확히 하고, 불필요한 트리 제거

#### 제안: 2가지 트리로 단순화

**1. Product Tree (상품 트리)**
- 용도: 원단, 절단, 채수 탭
- 구조: 상품 카테고리 계층
- 예시: 블라인드 > 우드 > 25mm > 소나무 > 블랙

**2. System Tree (시스템 트리)**
- 용도: 조립 탭
- 구조: 시스템 구성 요소 계층
- 예시: 블라인드(원단) > 우드

#### 트리 간 관계
```typescript
// System Tree 노드
{
  "id": "system-blind-wood",
  "label": "블라인드(원단) > 우드",
  "type": "SYSTEM",
  "references": {
    "mappedTo": "product-blind-wood-25mm"  // Product Tree의 해당 카테고리
  }
}

// Product Tree 노드
{
  "id": "product-blind-wood-25mm",
  "label": "25mm",
  "type": "CATEGORY",
  "references": {
    "mappedFrom": "system-blind-wood"  // System Tree에서 참조됨
  }
}
```

### Phase 3: 파트너별 트리 단순화

#### 현재 문제
- 각 파트너마다 전체 트리를 복사
- `copy-{timestamp}-{random}` ID로 추적 어려움
- 데이터 중복

#### 제안: 필터 기반 접근
```typescript
// 파트너별로 트리를 복사하지 않고, 필터만 저장
interface PartnerTreeFilter {
  partnerId: string;
  
  // 표시할 노드 ID 목록 (whitelist)
  visibleNodes?: string[];
  
  // 숨길 노드 ID 목록 (blacklist)
  hiddenNodes?: string[];
  
  // 추가 노드 (파트너가 직접 생성한 노드)
  customNodes?: NodeData[];
}

// 사용 예시
const partnerF1Filter: PartnerTreeFilter = {
  partnerId: 'f1',
  visibleNodes: [
    'cat-blind',      // 블라인드 카테고리만 표시
    'sub-wood',       // 우드 하위 카테고리
    'sub-roll'        // 롤 하위 카테고리
  ],
  hiddenNodes: [
    'sub-combi',      // 콤비는 숨김
    'sub-honeycomb'   // 허니콤은 숨김
  ],
  customNodes: [
    {
      id: 'custom-f1-special',
      label: '특수 원단',
      type: 'CATEGORY',
      parentId: 'cat-blind'
    }
  ]
};
```

#### 장점
- 데이터 중복 제거
- 원본 트리 변경 시 자동 반영
- 파트너별 커스터마이징 가능
- 추적 용이

### Phase 4: 코드 단순화

#### 4.1 트리 조회 Helper 함수

```typescript
/**
 * 노드의 자식을 가져옵니다
 */
function getChildren(
  nodeId: string,
  nodes: Record<string, NodeData>,
  options: {
    // 가상 자식 포함 여부
    includeVirtual?: boolean;
    // 파트너 필터 적용 여부
    applyPartnerFilter?: boolean;
    partnerId?: string;
  } = {}
): NodeData[] {
  const node = nodes[nodeId];
  if (!node) return [];
  
  // 실제 자식
  let children = node.childrenIds
    .map(id => nodes[id])
    .filter(Boolean);
  
  // 가상 자식 추가
  if (options.includeVirtual && node.references?.virtualChildren) {
    const virtualChildren = node.references.virtualChildren
      .map(id => nodes[id])
      .filter(Boolean);
    children = [...children, ...virtualChildren];
  }
  
  // 파트너 필터 적용
  if (options.applyPartnerFilter && options.partnerId) {
    const filter = getPartnerFilter(options.partnerId);
    children = applyFilter(children, filter);
  }
  
  return children;
}

/**
 * 노드의 전체 경로를 가져옵니다
 */
function getNodePath(
  nodeId: string,
  nodes: Record<string, NodeData>,
  options: {
    separator?: string;
    includeRoot?: boolean;
  } = {}
): string {
  const separator = options.separator || ' > ';
  const path: string[] = [];
  
  let current = nodes[nodeId];
  while (current) {
    if (current.type !== 'ROOT' || options.includeRoot) {
      path.unshift(current.label);
    }
    current = current.parentId ? nodes[current.parentId] : null;
  }
  
  return path.join(separator);
}
```

#### 4.2 탭별 트리 사용 규칙

```typescript
const TREE_USAGE_RULES = {
  FABRIC: {
    treeType: 'PRODUCT',
    rootIdKey: 'rootId',
    includeVirtualChildren: true,
    applyPartnerFilter: true
  },
  CUTTING: {
    treeType: 'PRODUCT',
    rootIdKey: 'rootId',
    includeVirtualChildren: true,
    applyPartnerFilter: true
  },
  ASSEMBLY: {
    treeType: 'SYSTEM',
    rootIdKey: 'systemRootId',
    includeVirtualChildren: false,  // 명시적으로 false
    applyPartnerFilter: true
  },
  MEASURE: {
    treeType: 'PRODUCT',
    rootIdKey: 'rootId',
    includeVirtualChildren: true,
    applyPartnerFilter: true
  }
} as const;

// 사용
const rule = TREE_USAGE_RULES[activeTab];
const rootId = props[rule.rootIdKey];
const children = getChildren(rootId, nodes, {
  includeVirtual: rule.includeVirtualChildren,
  applyPartnerFilter: rule.applyPartnerFilter,
  partnerId: props.partnerId
});
```

### Phase 5: 데이터 마이그레이션

#### 5.1 기존 데이터 변환 스크립트

```typescript
/**
 * 기존 트리 데이터를 새로운 구조로 변환
 */
function migrateTreeData(oldNodes: Record<string, any>): Record<string, NodeData> {
  const newNodes: Record<string, NodeData> = {};
  
  for (const [id, node] of Object.entries(oldNodes)) {
    // 기본 구조 복사
    const newNode: NodeData = {
      id: node.id,
      parentId: node.parentId,
      type: node.type,
      label: node.label,
      childrenIds: node.childrenIds || [],
      attributes: { ...node.attributes }
    };
    
    // references 생성
    const references: NodeData['references'] = {};
    
    // sourceIds → virtualChildren
    if (node.sourceIds && node.sourceIds.length > 0) {
      references.virtualChildren = node.sourceIds.flatMap(srcId => {
        const src = oldNodes[srcId];
        return src?.childrenIds || [];
      });
    }
    
    // originalSourceId → source
    if (node.attributes?.originalSourceId) {
      references.source = node.attributes.originalSourceId;
      delete newNode.attributes.originalSourceId;
    }
    
    // virtualChildMap → virtualChildren (병합)
    if (node.attributes?.virtualChildMap) {
      try {
        const map = JSON.parse(node.attributes.virtualChildMap);
        const virtualFromMap = Object.values(map).flat() as string[];
        references.virtualChildren = [
          ...(references.virtualChildren || []),
          ...virtualFromMap
        ];
        delete newNode.attributes.virtualChildMap;
      } catch (e) {
        console.error('Failed to parse virtualChildMap:', e);
      }
    }
    
    // references가 비어있지 않으면 추가
    if (Object.keys(references).length > 0) {
      newNode.references = references;
    }
    
    newNodes[id] = newNode;
  }
  
  return newNodes;
}
```

#### 5.2 마이그레이션 실행 계획

1. **백업 생성**
   ```bash
   cp basic_tree.json basic_tree.backup.json
   ```

2. **마이그레이션 스크립트 실행**
   ```typescript
   const oldData = JSON.parse(fs.readFileSync('basic_tree.json', 'utf-8'));
   const newData = migrateTreeData(oldData);
   fs.writeFileSync('basic_tree.v2.json', JSON.stringify(newData, null, 2));
   ```

3. **검증**
   - 모든 노드가 변환되었는지 확인
   - 참조 무결성 확인
   - 기존 기능 테스트

4. **배포**
   - `basic_tree.json` 교체
   - localStorage 클리어 (버전 업)
   - 사용자에게 새로고침 안내

## 실행 순서 및 우선순위

### 우선순위 1: 즉시 실행 (1-2일)
- **Phase 4.2**: 탭별 트리 사용 규칙 정의
- **Phase 4.1**: Helper 함수 구현
- **현재 ASSEMBLY 탭 문제 해결**

### 우선순위 2: 단기 (1주일)
- **Phase 1**: 참조 메커니즘 통일 (코드 레벨)
- **Phase 2**: 트리 종류 명확화 (문서화)

### 우선순위 3: 중기 (2-3주일)
- **Phase 3**: 파트너별 트리 단순화
- **Phase 5**: 데이터 마이그레이션

### 우선순위 4: 장기 (1-2개월)
- **Phase 1**: 데이터 구조 변경 (breaking change)
- 전체 시스템 리팩토링

## 다음 단계

어떤 것부터 시작하시겠습니까?

1. **즉시 실행** - Phase 4.2 (탭별 규칙) + Phase 4.1 (Helper 함수)
2. **ASSEMBLY 탭 문제 집중 해결** - 현재 이슈만 해결
3. **전체 계획 검토** - 계획 수정 및 보완
