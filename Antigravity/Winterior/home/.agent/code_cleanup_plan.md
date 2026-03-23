# StandardCost.tsx 코드 정리 계획

## 현재 문제점

### 1. 복잡한 데이터 흐름
- `sourceIds` 로직이 여러 곳에 산재되어 있음
- `traverse` 함수, `categories` useMemo, `gridData` useMemo 등에서 각각 처리
- ASSEMBLY 탭에서 어디선가 여전히 표준상품 트리를 참조하고 있음

### 2. 디버깅 어려움
- 로그가 너무 많아서 추적이 어려움
- 데이터가 어디서 오는지 파악하기 어려움
- localStorage와 JSON 파일의 데이터 불일치

### 3. 중복 코드
- `sourceIds` 처리 로직이 여러 곳에 중복됨
- 트리 순회 로직이 여러 버전으로 존재

## 정리 계획

### Phase 1: 데이터 흐름 단순화

#### 1.1 Helper 함수 추출
```typescript
// 노드의 실제 자식을 가져오는 함수 (sourceIds 포함 여부를 명시적으로 제어)
function getNodeChildren(
  nodeId: string, 
  nodes: Record<string, NodeData>,
  options: {
    includeSourceIds: boolean;
    includeVirtualChildren: boolean;
  }
): string[]
```

#### 1.2 탭별 설정 객체
```typescript
const TAB_CONFIG = {
  FABRIC: {
    includeSourceIds: true,
    includeVirtualChildren: true,
    useSystemTree: false
  },
  CUTTING: {
    includeSourceIds: true,
    includeVirtualChildren: true,
    useSystemTree: false
  },
  ASSEMBLY: {
    includeSourceIds: false,  // 명시적으로 false
    includeVirtualChildren: false,
    useSystemTree: true
  },
  MEASURE: {
    includeSourceIds: true,
    includeVirtualChildren: true,
    useSystemTree: false
  }
};
```

### Phase 2: 코드 구조 개선

#### 2.1 파일 분리
현재 `StandardCost.tsx`는 2300+ 라인으로 너무 큽니다.

**분리 제안:**
- `StandardCost.tsx` - 메인 컴포넌트 (200-300 라인)
- `StandardCost.helpers.ts` - Helper 함수들
- `StandardCost.hooks.ts` - Custom hooks (useMemo, useEffect 로직)
- `StandardCost.types.ts` - 타입 정의
- `StandardCost.constants.ts` - 상수 정의
- `components/FabricCostForm.tsx` - 원단 비용 폼
- `components/CuttingCostForm.tsx` - 절단 비용 폼
- `components/AssemblyCostForm.tsx` - 조립 비용 폼
- `components/MeasureCostForm.tsx` - 채수 비용 폼

#### 2.2 로직 단순화

**현재:**
```typescript
// categories useMemo
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
  return result;
}, [nodes, currentRootId, activeTab]);
```

**개선안:**
```typescript
const categories = useMemo(() => {
  const config = TAB_CONFIG[activeTab];
  const rootNode = nodes[currentRootId];
  if (!rootNode) return [];
  
  const childrenIds = getNodeChildren(currentRootId, nodes, {
    includeSourceIds: config.includeSourceIds,
    includeVirtualChildren: config.includeVirtualChildren
  });
  
  return childrenIds.map(id => nodes[id]).filter(Boolean);
}, [nodes, currentRootId, activeTab]);
```

### Phase 3: 디버깅 개선

#### 3.1 구조화된 로깅
```typescript
// 개발 모드에서만 작동하는 로거
const logger = {
  categories: (data: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.group('[StandardCost] Categories');
      console.log('Active Tab:', activeTab);
      console.log('Current Root:', currentRootId);
      console.log('Result:', data);
      console.groupEnd();
    }
  },
  gridData: (data: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.group('[StandardCost] Grid Data');
      console.log('Active Tab:', activeTab);
      console.log('Active Category:', activeCategoryId);
      console.log('Row Count:', data.length);
      console.groupEnd();
    }
  }
};
```

#### 3.2 타입 안전성 강화
```typescript
// 현재: string으로 처리
const activeTab = 'ASSEMBLY';

// 개선: 타입 안전
type CostTab = 'FABRIC' | 'CUTTING' | 'ASSEMBLY' | 'MEASURE';
const activeTab: CostTab = 'ASSEMBLY';
```

### Phase 4: 테스트 추가

#### 4.1 Helper 함수 단위 테스트
```typescript
describe('getNodeChildren', () => {
  it('should return only real children when includeSourceIds is false', () => {
    const nodes = {
      'root': {
        id: 'root',
        childrenIds: ['child1'],
        sourceIds: ['source1']
      },
      'child1': { id: 'child1', label: 'Child 1' },
      'source1': { id: 'source1', childrenIds: ['source-child1'] }
    };
    
    const result = getNodeChildren('root', nodes, {
      includeSourceIds: false,
      includeVirtualChildren: false
    });
    
    expect(result).toEqual(['child1']);
  });
});
```

### Phase 5: 성능 최적화

#### 5.1 불필요한 재계산 방지
```typescript
// 현재: activeTab이 바뀔 때마다 모든 데이터 재계산
const gridData = useMemo(() => {
  // 복잡한 로직...
}, [nodes, searchQuery, activeTab, currentRootId, activeCategoryId, selectedSubIds, subCategories, categories, isCategoryLike, systemVirtualMap]);

// 개선: 탭별로 분리
const fabricGridData = useMemo(() => {
  if (activeTab !== 'FABRIC') return [];
  // FABRIC 전용 로직
}, [activeTab, nodes, ...]);

const assemblyGridData = useMemo(() => {
  if (activeTab !== 'ASSEMBLY') return [];
  // ASSEMBLY 전용 로직
}, [activeTab, nodes, ...]);

const gridData = activeTab === 'FABRIC' ? fabricGridData : 
                 activeTab === 'ASSEMBLY' ? assemblyGridData : 
                 // ...
```

## 실행 순서

1. **Phase 1** (우선순위: 높음)
   - Helper 함수 추출
   - 탭별 설정 객체 생성
   - 예상 시간: 2-3시간

2. **Phase 2** (우선순위: 중간)
   - 파일 분리
   - 로직 단순화
   - 예상 시간: 4-6시간

3. **Phase 3** (우선순위: 높음)
   - 구조화된 로깅
   - 타입 안전성 강화
   - 예상 시간: 1-2시간

4. **Phase 4** (우선순위: 낮음)
   - 테스트 추가
   - 예상 시간: 3-4시간

5. **Phase 5** (우선순위: 낮음)
   - 성능 최적화
   - 예상 시간: 2-3시간

## 즉시 해결 가능한 문제

### 디버그 로그 제거
현재 코드에 남아있는 디버그 로그들을 제거하거나 개발 모드에서만 작동하도록 수정

```typescript
// 제거할 로그들
console.log('[StandardCost] Component mounted with props...');
console.log('[StandardCost] 🔍 currentRootId:...');
console.log('[StandardCost categories] currentRootId:...');
```

### 사용하지 않는 코드 제거
- 주석 처리된 코드
- 사용하지 않는 import
- 중복된 함수

## 다음 단계

어떤 Phase부터 시작하시겠습니까?

1. **Phase 1 먼저** - Helper 함수 추출로 로직 단순화
2. **디버그 로그 정리 먼저** - 현재 코드 정리
3. **ASSEMBLY 탭 문제 해결 먼저** - 현재 이슈 집중 해결
