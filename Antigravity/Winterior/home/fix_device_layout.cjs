const fs = require('fs');
const p = './components/AdminDeviceManagement.tsx';
let t = fs.readFileSync(p, 'utf8');

// CRLF → LF 통일
t = t.replace(/\r\n/g, '\n');

// ─── 교체: line 510~674 전체 블록을 새 레이아웃으로 대체 ───
// 교체 시작 마커: `                                                <div className="flex gap-6 h-full">`
// 교체 끝 마커: `                                                </div>` (마지막 flex gap-6 닫는 태그 = line 674)

const START = `                                                <div className="flex gap-6 h-full">
                                                    {/* 좌측: 업체 정보 & 단말기 정보 */}
                                                    <div className="flex-1 flex flex-col gap-4">`;

const END_MARKER = `                                                </div>`;
// END_MARKER가 여러개이므로 START부터 END까지를 찾아야 함

// 새 레이아웃
const NEW_LAYOUT = `                                                <div className="flex gap-6">
                                                    {/* 좌측: 업체 기본정보 + 단말기정보/출력스케줄 */}
                                                    <div className="flex-1 flex flex-col gap-4 min-w-0">
                                                        {/* 1. 업체 기본정보 */}
                                                        {displayPartner && (
                                                            <AdminCard elevated>
                                                                <AdminCardContent className="p-5">
                                                                    <div className="flex items-center justify-between mb-4">
                                                                        <h3 className="font-black text-gray-800 flex items-center gap-1.5"><Building2 size={16} className="text-violet-500" /> 업체 기본정보</h3>
                                                                        <AdminBadge variant="outline" className="text-[10px]">{displayPartner.partnerCode || '-'}</AdminBadge>
                                                                    </div>
                                                                    <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                                                                        <div className="flex items-center justify-between"><span className="text-xs font-bold text-gray-500 w-16">업체명</span><span className="text-sm font-black text-gray-800">{displayPartner.partnerName || '-'}</span></div>
                                                                        <div className="flex items-center justify-between"><span className="text-xs font-bold text-gray-500 w-16">대표자</span><span className="text-sm font-bold text-gray-800">{displayPartner.ceoName || '-'}</span></div>
                                                                        <div className="flex items-center justify-between"><span className="text-xs font-bold text-gray-500 w-16">전화</span><span className="text-sm font-bold text-gray-800">{formatPhone(displayPartner.companyPhone || '')}</span></div>
                                                                        <div className="flex justify-between gap-2 border-t border-gray-200 pt-3 mt-1">
                                                                            <span className="text-xs font-bold text-gray-500 w-16 flex-shrink-0">주소</span>
                                                                            <span className="text-xs text-gray-600 text-right leading-relaxed">{displayPartner.addresses?.[0]?.address || '주소 정보 없음'}</span>
                                                                        </div>
                                                                    </div>
                                                                </AdminCardContent>
                                                            </AdminCard>
                                                        )}

                                                        {/* 2. 단말기 정보 + 출력 스케줄 (나란히, 업체기본정보 가로범위 안) */}
                                                        <div className="flex gap-4">
                                                            {/* 단말기 정보 카드 */}
                                                            <AdminCard elevated className="flex-1 flex flex-col overflow-hidden min-w-0">
                                                                <AdminCardContent className="p-4 flex flex-col h-full">
                                                                    <div className="flex items-start justify-between mb-3">
                                                                        <div>
                                                                            <h3 className="font-black text-gray-800 flex items-center gap-1.5 mb-1"><Monitor size={15} className="text-violet-500" /> 단말기 정보</h3>
                                                                            <p className="text-[10px] text-gray-400 font-medium">ID: {selectedDevice.id}</p>
                                                                        </div>
                                                                        <AdminBadge variant={selectedDevice.status === 'playing' ? 'success' : selectedDevice.status === 'error' ? 'danger' : selectedDevice.status === 'disconnected' ? 'warning' : 'secondary'} dot>
                                                                            {cfg.label}
                                                                        </AdminBadge>
                                                                    </div>
                                                                    <div className="flex-1 bg-gray-50 rounded-xl p-3 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
                                                                        <div className="space-y-2">
                                                                            <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                                                                                <span className="text-xs font-bold text-gray-500 w-12">기기명</span>
                                                                                <span className="text-sm font-black text-gray-800 truncate ml-1">{selectedDevice.name || '-'}</span>
                                                                            </div>
                                                                            <div className="grid grid-cols-2 gap-x-2 gap-y-2">
                                                                                <div className="flex flex-col gap-0.5"><span className="text-[10px] font-bold text-gray-400">설치일</span><span className="text-xs font-bold text-gray-700">{selectedDevice.installedAt || '-'}</span></div>
                                                                                <div className="flex flex-col gap-0.5"><span className="text-[10px] font-bold text-gray-400">규격</span><span className="text-xs font-bold text-gray-700">{selectedDevice.spec || '-'}</span></div>
                                                                                <div className="flex flex-col gap-0.5"><span className="text-[10px] font-bold text-gray-400">해상도</span><span className="text-xs font-bold text-gray-700">{selectedDevice.resolution || '-'}</span></div>
                                                                                <div className="flex flex-col gap-0.5"><span className="text-[10px] font-bold text-gray-400">방향</span><AdminBadge variant="outline" className="text-[10px] self-start py-0 px-1.5">{selectedDevice.orientation === 'landscape' ? '가로' : '세로'}</AdminBadge></div>
                                                                            </div>
                                                                            <div className="border-t border-gray-200 pt-2 mt-1 space-y-1.5">
                                                                                <div className="flex items-center justify-between"><span className="text-xs font-bold text-gray-500">담당자</span><span className="text-xs font-bold text-gray-700">{selectedDevice.contactName || '-'}</span></div>
                                                                                <div className="flex items-center justify-between"><span className="text-xs font-bold text-gray-500">연락처</span><span className="text-xs font-bold text-gray-700">{formatPhone(selectedDevice.contactPhone || '')}</span></div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="mt-3 flex gap-2">
                                                                        <AdminButton variant="outline" size="sm" className="flex-1" icon={Pencil} onClick={() => { setActiveTab('register'); handleEditDevice(selectedDevice); }}>수정</AdminButton>
                                                                        <AdminButton variant="danger" size="sm" className="flex-shrink-0" icon={Trash2} onClick={() => { if (window.confirm('정말 삭제하시겠습니까?')) { setRegisteredDevices(prev => prev.filter(d => d.id !== selectedDevice.id)); setSelectedDeviceId(null); } }}>삭제</AdminButton>
                                                                    </div>
                                                                </AdminCardContent>
                                                            </AdminCard>

                                                            {/* 출력 스케줄 카드 */}
                                                            <AdminCard elevated className="flex-1 flex flex-col overflow-hidden min-w-0">
                                                                <AdminCardContent className="p-4 flex flex-col h-full">
                                                                    <div className="flex items-center justify-between mb-3 flex-shrink-0">
                                                                        <h3 className="font-black text-gray-800 flex items-center gap-1.5"><Play size={14} className="text-violet-500" /> 출력 스케줄</h3>
                                                                    </div>
                                                                    <div className="flex-1 overflow-y-auto space-y-2" style={{ scrollbarWidth: 'thin' }}>
                                                                        {[
                                                                            { t: '09:00 - 12:00', n: '오전 프로모션' },
                                                                            { t: '12:00 - 18:00', n: '메인 홍보영상' },
                                                                            { t: '18:00 - 22:00', n: '저녁 프로모션' },
                                                                        ].map((s, i) => (
                                                                            <div key={i} className="bg-gray-50 rounded-xl p-2.5 flex flex-col gap-1 border-l-2 border-violet-400">
                                                                                <span className="text-[10px] font-black text-violet-600">{s.t}</span>
                                                                                <span className="text-xs font-bold text-gray-700 truncate">{s.n}</span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </AdminCardContent>
                                                            </AdminCard>
                                                        </div>
                                                    </div>

                                                    {/* 우측: 현재 출력 화면 — 업체기본정보와 나란히 세로 전체 */}
                                                    <div className="w-[260px] flex-shrink-0" style={{ minHeight: '100%' }}>
                                                        <AdminCard elevated className="flex flex-col overflow-hidden" style={{ height: '100%' }}>
                                                            <AdminCardContent className="p-4 flex flex-col h-full">
                                                                <div className="flex items-center justify-between mb-3 flex-shrink-0">
                                                                    <h3 className="font-black text-gray-800 flex items-center gap-1.5"><Monitor size={14} className="text-emerald-500" /> 현재 출력 화면</h3>
                                                                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> 송출중</span>
                                                                </div>
                                                                <div className="flex-1 bg-gray-900 rounded-xl overflow-hidden relative flex flex-col items-center justify-center group shadow-inner">
                                                                    {selectedDevice?.status === 'playing' ? (
                                                                        <>
                                                                            <div className="absolute inset-0 bg-gradient-to-br from-pink-500/20 to-violet-600/20 mix-blend-overlay" />
                                                                            <ImageIcon size={32} className="text-white/20 mb-3" />
                                                                            <span className="text-sm font-black text-white mix-blend-overlay break-all px-4 text-center">{selectedDevice?.currentContent || '재생 정보 없음'}</span>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <Square size={32} className="text-gray-700 mb-3" />
                                                                            <span className="text-xs font-bold text-gray-500">대기 중 화면</span>
                                                                        </>
                                                                    )}
                                                                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 pt-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                        <div className="flex items-center justify-between text-white">
                                                                            <span className="text-[10px] font-bold opacity-80">{selectedDevice?.resolution || '-'} / {selectedDevice?.orientation === 'landscape' ? '가로모드' : '세로모드'}</span>
                                                                            <div className="flex items-center gap-1"><Volume2 size={10} className="opacity-80" /><span className="text-[10px] font-bold">{selectedDevice?.volume || 0}%</span></div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </AdminCardContent>
                                                        </AdminCard>
                                                    </div>
                                                </div>`;

// 교체할 범위 찾기: line 510 시작 ~ line 674 끝
const lines = t.split('\n');
console.log('Total lines:', lines.length);

// line 510 = index 509 (0-based)
// line 674 = index 673
// 해당 범위를 새 레이아웃으로 교체
const before = lines.slice(0, 509).join('\n');
const after = lines.slice(673).join('\n');

const newContent = before + '\n' + NEW_LAYOUT + '\n' + after;
fs.writeFileSync(p, newContent, 'utf8');
console.log('Done. New lines:', newContent.split('\n').length);
