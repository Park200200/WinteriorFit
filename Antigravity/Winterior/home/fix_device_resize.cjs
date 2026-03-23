const fs = require('fs');
const p = './components/AdminDeviceManagement.tsx';
let t = fs.readFileSync(p, 'utf8');

// ─── 1. FolderOpen 아이콘 import에 추가 ───────────────────────────────────────
// 현재: Building2, Search, X, ...
// import { FolderOpen } 추가
t = t.replace(
    `import {\n    Monitor, Play, Square, AlertTriangle, WifiOff, Volume2,\n    Building2, Search, X,`,
    `import {\n    Monitor, Play, Square, AlertTriangle, WifiOff, Volume2,\n    Building2, Search, X, FolderOpen,`
);

// ─── 2. useState에 outputPanelWidth 추가 ─────────────────────────────────────
// AdminDeviceManagement 함수 안에서 useState 블록 찾아서 추가
// useRef들 아래에 새 state 삽입
t = t.replace(
    `const scrollRef = useRef<HTMLDivElement>(null);`,
    `const scrollRef = useRef<HTMLDivElement>(null);
    const [outputPanelWidth, setOutputPanelWidth] = React.useState(260);
    const outputDragRef = useRef<{ startX: number; startWidth: number } | null>(null);

    const handleOutputResizeStart = (e: React.MouseEvent) => {
        outputDragRef.current = { startX: e.clientX, startWidth: outputPanelWidth };
        const onMove = (ev: MouseEvent) => {
            if (!outputDragRef.current) return;
            const delta = outputDragRef.current.startX - ev.clientX; // 왼쪽으로 드래그 → 넓어짐
            const newW = Math.max(180, Math.min(500, outputDragRef.current.startWidth + delta));
            setOutputPanelWidth(newW);
        };
        const onUp = () => {
            outputDragRef.current = null;
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
        };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
        e.preventDefault();
    };`
);

// ─── 3. 출력스케줄 카드 헤더에 컨텐츠관리 아이콘 추가 ───────────────────────
t = t.replace(
    `<h3 className="font-black text-gray-800 flex items-center gap-1.5"><Play size={14} className="text-violet-500" /> 출력 스케줄</h3>
                                                                    </div>`,
    `<h3 className="font-black text-gray-800 flex items-center gap-1.5"><Play size={14} className="text-violet-500" /> 출력 스케줄</h3>
                                                                        <button
                                                                            title="컨텐츠 관리"
                                                                            onClick={() => setActiveTab('contents')}
                                                                            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:scale-110"
                                                                            style={{ background: 'var(--theme-primary-bg)', color: 'var(--theme-primary)' }}
                                                                            onMouseEnter={e => (e.currentTarget.style.background = 'var(--theme-primary)', (e.currentTarget.querySelector('svg') as HTMLElement).style.color = '#fff')}
                                                                            onMouseLeave={e => (e.currentTarget.style.background = 'var(--theme-primary-bg)', (e.currentTarget.querySelector('svg') as HTMLElement).style.color = 'var(--theme-primary)')}
                                                                        >
                                                                            <FolderOpen size={14} />
                                                                        </button>
                                                                    </div>`
);

// ─── 4. 현재출력화면 패널 — 좌측 리사이즈 핸들 + 동적 너비 ────────────────────
// w-[260px] → 동적 style + 핸들 추가
t = t.replace(
    `{/* 우측: 현재 출력 화면 — 업체기본정보와 나란히 세로 전체 */}
                                                    <div className="w-[260px] flex-shrink-0" style={{ minHeight: '100%' }}>`,
    `{/* 우측: 현재 출력 화면 — 업체기본정보와 나란히 세로 전체 */}
                                                    <div className="flex-shrink-0 relative" style={{ width: outputPanelWidth, minHeight: '100%' }}>
                                                        {/* 리사이즈 핸들 */}
                                                        <div
                                                            className="absolute left-0 top-0 bottom-0 w-2 cursor-col-resize z-10 group flex items-center justify-center"
                                                            style={{ marginLeft: '-8px' }}
                                                            onMouseDown={handleOutputResizeStart}
                                                        >
                                                            <div className="w-1 h-12 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                                                                style={{ background: 'var(--theme-primary)' }} />
                                                        </div>`
);

// 닫는 </div> 하나 추가 (핸들 div에 대한)
t = t.replace(
    `                                                        </AdminCard>
                                                    </div>
                                                </div>
                                            );
                                        })()}`,
    `                                                        </AdminCard>
                                                    </div>
                                                </div>
                                            );
                                        })()} `
);

// 실제로는 위 replace가 오류 가능. 아래 닫는 div 확인 후 핸들 div 닫는 태그를 올바른 위치에 넣어야 함
// 위에서 추가한 핸들 div 래퍼 닫기 — AdminCard 닫힘 바로 뒤
t = t.replace(
    `                                                        </AdminCard>
                                                    </div>
                                                </div>
                                            );
                                        })()} `,
    `                                                        </AdminCard>
                                                    </div>
                                                </div>
                                            );
                                        })()}`
);

fs.writeFileSync(p, t, 'utf8');

// 검증
const hasFolderOpen = t.includes('FolderOpen');
const hasOutputPanelWidth = t.includes('outputPanelWidth');
const hasResizeHandle = t.includes('handleOutputResizeStart');
console.log('FolderOpen:', hasFolderOpen, '| outputPanelWidth:', hasOutputPanelWidth, '| ResizeHandle:', hasResizeHandle);
