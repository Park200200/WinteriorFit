const fs = require('fs');
const parser = require('@babel/parser');
const p = './components/PartnerManagement.tsx';
let lines = fs.readFileSync(p, 'utf8').split('\n');

// 638번 줄(index 637): 우편번호 검색 버튼 + 주소 그리드 섹션
// 원래 내용: <div class="col-span-1 xl:col-span-2...>
//   <input addrZone readOnly />
//   <button onClick postcode>우편번호 검색</button>  <- 이 부분이 손상됨
//   <div grid><input addrMain/><input addrDetail/></div>
// </div>

// 현재 638번 줄 (idx=637): 손상된 "검??/button>" 이 있음
// 390번 컬럼: ? ? / b u t t o n >
// 이것을 < / b u t t o n > 로 교체해야 함

// 직접 문자열 수정: 위치 390-392를 </ 로 교체
const l = lines[637];
// 390번 위치의 ??/ 를 </로 교체
const fixed = l.substring(0, 390) + '</' + l.substring(392);
lines[637] = fixed;
console.log('Fixed 638 at col 390:', JSON.stringify(fixed.substring(385, 410)));

// 639번 줄(index 638): </div>iv className 패턴 수정
const l639 = lines[638];
if (l639.includes('</div>iv className')) {
    lines[638] = l639.replace('</div>iv className', '</div>\n                                <div className');
    console.log('Fixed 639 </div>iv pattern');
} else if (l639.startsWith('</div>iv')) {
    const indent = '                                ';
    lines[638] = '</div>';
    lines.splice(639, 0, indent + 'iv className' + l639.substring(9));
    console.log('Split 639');
}

fs.writeFileSync(p, lines.join('\n'), 'utf8');

// 파싱 확인
try {
    parser.parse(lines.join('\n'), { sourceType: 'module', plugins: ['typescript', 'jsx'] });
    console.log('PARSE OK!');
} catch (e) {
    if (e.loc) {
        const n = e.loc.line;
        console.log('Next error: L' + n + ': ' + e.message.substring(0, 80));
        for (let i = Math.max(0, n - 2); i < Math.min(lines.length, n + 1); i++) {
            console.log((i + 1) + ': ' + lines[i].substring(0, 120));
        }
    }
}
