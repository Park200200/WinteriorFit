const fs = require('fs');
const parser = require('@babel/parser');
const p = './components/PartnerManagement.tsx';
let lines = fs.readFileSync(p, 'utf8').split('\n');

// 638번 줄(index 637): 이미 <//button>이 됐음
// <//button> -> </button> 으로 수정
const l = lines[637];
if (l.includes('<//button>')) {
    lines[637] = l.replace('<//button>', '</button>');
    console.log('Fixed <//button> -> </button>');
}

// 639번 줄 (index 638): </div> 만 있는 줄
console.log('L639:', lines[638].substring(0, 80));
console.log('L640:', lines[639] ? lines[639].substring(0, 80) : 'undefined');

fs.writeFileSync(p, lines.join('\n'), 'utf8');

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
