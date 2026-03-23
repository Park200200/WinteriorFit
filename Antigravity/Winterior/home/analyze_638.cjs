const fs = require('fs');
const parser = require('@babel/parser');
const p = './components/PartnerManagement.tsx';
let lines = fs.readFileSync(p, 'utf8').split('\n');

// 638번 줄(index 637)의 상세 분석
const l = lines[637];
console.log('L638 len:', l.length);
// 395-415 문자들 상세 출력
const chars = [];
for (let i = 390; i < 415 && i < l.length; i++) {
    chars.push(i + ':' + l.charCodeAt(i) + '(' + l[i] + ')');
}
console.log('Chars 390-415:', chars.join(' '));

// button>의 위치 찾기
const btnPos = l.indexOf('button>');
console.log('button> first occurrence at:', btnPos);
if (btnPos >= 0) {
    console.log('Before button:', JSON.stringify(l.substring(btnPos - 10, btnPos)));
    console.log('After button>:', JSON.stringify(l.substring(btnPos + 7, btnPos + 20)));
}

// 패턴: JS 문자 코드를 분석하여 </ 가 아닌 방식으로 버튼이 닫히는 경우를 찾음
// button> 앞에 실제로 어떤 문자가 있는지 확인
const allBtnPos = [];
let pos = -1;
while ((pos = l.indexOf('button>', pos + 1)) !== -1) {
    allBtnPos.push(pos);
}
console.log('All button> positions:', allBtnPos);
allBtnPos.forEach(p => {
    const before = l.substring(p - 5, p);
    console.log('  At ' + p + ': ' + JSON.stringify(before) + ' + button>');
});

// 직접 수정: button> 앞의 문자가 / 인지 확인
// </button> 으로 제대로 닫혀있지 않은 경우 수정
for (const pos of allBtnPos) {
    if (pos >= 1 && l[pos - 1] === '/') {
        console.log('  -> Already properly closed at', pos);
    } else {
        console.log('  -> NOT properly closed at', pos, '- prev char:', l.charCodeAt(pos - 1));
        // 이 경우 button> 앞에 </ 를 추가
        // 하지만 맥락에 따라 다름 - 여기는 닫는 태그가 필요함
        // </button> 이어야 함
    }
}
