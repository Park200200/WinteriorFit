const fs = require('fs');
const parser = require('@babel/parser');
const p = './components/PartnerManagement.tsx';
const t = fs.readFileSync(p, 'utf8');
const lines = t.split('\n');

// 670번 줄의 71번 컬럼 바이트 분석
const l = lines[669];
console.log('L670 length:', l.length);
// 65-80 컬럼 바이트 출력
const chars = [];
for (let i = 60; i < 80 && i < l.length; i++) {
    chars.push(i + ':' + l.charCodeAt(i) + '(' + l[i] + ')');
}
console.log('chars 60-80:', chars.join(' '));

// 실제 Babel 오류가 말하는 L670:71
// 71번 컬럼에서 예상치 못한 토큰이 있는 것
// 이 파일의 670번 줄을 확인해보니 label이 잘 닫혀 있음
// 하지만 Babel은 다른 무언가를 가리킬 수 있음
// 예: TSX 파일에서 <label className="...">지점</label> 에서 ?가 JSX 문자와 섞인 경우

// 정확한 줄 내용 출력
console.log('Full L670:', JSON.stringify(l));
