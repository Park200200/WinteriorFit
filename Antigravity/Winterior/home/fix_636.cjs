const fs = require('fs');
const parser = require('@babel/parser');
const p = './components/PartnerManagement.tsx';
let lines = fs.readFileSync(p, 'utf8').split('\n');

// 636번 줄 (index 635) - 세금계산서 이메일 label 복원
lines[635] = [
    '                                    <div>',
    '<label className="text-[11px] font-bold text-gray-400 uppercase block mb-1.5">세금계산서 이메일</label>',
    '<div className="relative">',
    '<Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />',
    '<input type="email" value={formData.taxEmail} onChange={(e) => handleInputChange("taxEmail", e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium focus:border-blue-500 outline-none" placeholder="example@company.com" />',
    '</div>',
    '</div>'
].join('');

// 그 다음 오류를 찾기 위해 638번 줄도 확인
const l638 = lines[637];
console.log('638 before:', l638.substring(0, 150));
// 638번: </div>iv className 합쳐진 패턴 수정
if (l638.includes('</div>') && !/^(\s*<\/div>)/.test(l638)) {
    // </div> 이후에 다른 태그가 직접 이어지는 경우
    const closeIdx = l638.lastIndexOf('</div>');
    const before = l638.substring(0, closeIdx + 6);
    const after = l638.substring(closeIdx + 6).trim();
    if (after && !after.startsWith('<\/')) {
        const indent = l638.match(/^\s*/)[0];
        lines[637] = before;
        lines.splice(638, 0, indent + after);
        console.log('638 split:', before.trim(), '|', after.substring(0, 60));
    }
}

// 저장 후 babel 파싱 확인
fs.writeFileSync(p, lines.join('\n'), 'utf8');
try {
    parser.parse(lines.join('\n'), { sourceType: 'module', plugins: ['typescript', 'jsx'] });
    console.log('PARSE OK!');
} catch (e) {
    if (e.loc) {
        console.log('Next error: L' + e.loc.line + ': ' + e.message.substring(0, 100));
        const n = e.loc.line;
        for (let i = Math.max(0, n - 2); i < Math.min(lines.length, n + 1); i++) {
            console.log((i + 1) + ': ' + lines[i].substring(0, 120));
        }
    }
}
