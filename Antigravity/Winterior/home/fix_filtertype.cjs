const fs = require('fs');
const p = './components/PartnerManagement.tsx';
let t = fs.readFileSync(p, 'utf8');

// filterType 잔여 참조 수정
// 1. useMemo deps
t = t.replace('[partners, filterType, filterGrade', '[partners, filterTypes, filterGrade');

// 2. handleNew에서 filterType !== 'ALL' ? filterType as PartnerType
t = t.replace(
    "let defaultType: PartnerType = !isSupplierMode && filterType !== 'ALL' ? filterType as PartnerType : 'DISTRIBUTOR';",
    "let defaultType: PartnerType = !isSupplierMode && filterTypes.length === 1 ? filterTypes[0] : 'DISTRIBUTOR';"
);

// 3. 혹시 남은 setFilterType 참조
t = t.replace(/\bsetFilterType\b/g, 'setFilterTypes');

// 4. 남은 filterType (배열 아닌) 참조 확인
const remaining = (t.match(/\bfilterType\b(?!s)/g) || []);
console.log('Remaining filterType refs:', remaining.length);

fs.writeFileSync(p, t, 'utf8');
console.log('Done.');
