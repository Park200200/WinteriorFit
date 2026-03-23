const fs = require('fs');
const p = './components/PartnerManagement.tsx';
const lines = fs.readFileSync(p, 'utf8').split('\n');
// 1~488줄만 유지
const kept = lines.slice(0, 487).join('\n');

const newJsx = `
        // =====================================================================
        // SUPPLIER VIEW
        // =====================================================================
        return (
            <div id="partner-mgmt-supplier" className="flex flex-col h-full w-full overflow-hidden" style={{ background: 'var(--admin-bg)', color: 'var(--admin-text)' }}>
                {/* Header */}
                <div className="flex-shrink-0 px-8 h-20 shadow-sm z-20 flex items-center justify-between" style={{ background: 'var(--admin-surface)', borderBottom: '1px solid var(--admin-border)' }}>
                    <div className="flex items-center gap-3 w-60">
                        <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--admin-text)' }}>
                            <Building2 style={{ color: 'var(--theme-primary)' }} size={28} />
                            거래처관리
                        </h1>
                    </div>
                </div>

                {/* Content: Left List + Resize Handle + Right Panel */}
                <div ref={containerRef} className="flex flex-1 overflow-hidden" style={{ background: 'var(--admin-bg)' }}>
                    {/* Left List */}
                    <div className="flex flex-col overflow-hidden flex-shrink-0" style={{ width: leftWidth, background: 'var(--admin-surface)', borderRight: '1px solid var(--admin-border)' }}>
                        {/* Search */}
                        <div className="p-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--admin-border)' }}>
                            <div className="relative">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--admin-text-sub)' }} />
                                <input
                                    type="text"
                                    placeholder="거래처 검색..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="w-full rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none"
                                    style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}
                                />
                            </div>
                        </div>
                        {/* Grade Filter */}
                        <div className="flex p-2 gap-1 flex-shrink-0" style={{ borderBottom: '1px solid var(--admin-border)' }}>
                            {['ALL','A','B','C','D'].map(g => (
                                <button key={g} onClick={() => setFilterGrade(g)}
                                    className="flex-1 py-1.5 text-xs font-bold rounded-lg transition-all"
                                    style={{ background: filterGrade===g ? 'var(--theme-primary)' : 'transparent', color: filterGrade===g ? '#fff' : 'var(--admin-text-sub)' }}>
                                    {g === 'ALL' ? '전체' : g+'등급'}
                                </button>
                            ))}
                        </div>
                        {/* List */}
                        <div className="flex-1 overflow-y-auto scrollbar-hide">
                            {filteredPartners.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full gap-3" style={{ color: 'var(--admin-text-sub)' }}>
                                    <Building2 size={40} strokeWidth={1} />
                                    <p className="text-sm">검색 결과가 없습니다</p>
                                </div>
                            ) : filteredPartners.map(p => (
                                <div key={p.id} onClick={() => setSelectedId(p.id)}
                                    className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors"
                                    style={{ background: selectedId===p.id ? 'var(--theme-primary-bg)' : 'transparent', borderBottom: '1px solid var(--admin-border)' }}>
                                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                                        style={{ background: selectedId===p.id ? 'var(--theme-primary)' : 'var(--admin-input-bg)' }}>
                                        <Building2 size={16} style={{ color: selectedId===p.id ? '#fff' : 'var(--admin-text-sub)' }} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-sm truncate" style={{ color: selectedId===p.id ? 'var(--theme-primary)' : 'var(--admin-text)' }}>{p.partnerName}</p>
                                        <p className="text-xs truncate" style={{ color: 'var(--admin-text-sub)' }}>{p.partnerCode} · {p.grade}등급</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Resize Handle */}
                    <div
                        className="flex-shrink-0 w-1 cursor-col-resize transition-colors group"
                        style={{ background: 'transparent' }}
                        onMouseDown={startResizing}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--theme-primary)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    />

                    {/* Right Form */}
                    <div className="flex-1 flex flex-col h-full overflow-hidden min-w-[400px]" style={{ background: 'var(--admin-bg)' }}>
                        <div className="px-8 py-4 flex-shrink-0 flex items-center justify-between h-[69px]"
                            style={{ background: 'var(--admin-surface)', borderBottom: '1px solid var(--admin-border)' }}>
                            <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--admin-text)' }}>
                                <LayoutList size={18} style={{ color: 'var(--admin-text-sub)' }} /> 상세 정보
                            </h3>
                            <div className="flex gap-2">
                                <button onClick={handleNew} className="p-2 rounded-lg transition-colors"
                                    style={{ color: 'var(--admin-text-sub)' }}
                                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color='var(--theme-primary)'; (e.currentTarget as HTMLButtonElement).style.background='var(--theme-primary-bg)'; }}
                                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color='var(--admin-text-sub)'; (e.currentTarget as HTMLButtonElement).style.background='transparent'; }}>
                                    <RefreshCw size={18} />
                                </button>
                                <button onClick={handleDelete} className="p-2 rounded-lg transition-colors"
                                    style={{ color: 'var(--admin-text-sub)' }}
                                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color='#ef4444'; (e.currentTarget as HTMLButtonElement).style.background='#fee2e2'; }}
                                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color='var(--admin-text-sub)'; (e.currentTarget as HTMLButtonElement).style.background='transparent'; }}>
                                    <Trash2 size={18} />
                                </button>
                                <div className="w-px h-8 mx-1" style={{ background: 'var(--admin-border)' }} />
                                <button onClick={handleSave}
                                    className="flex items-center gap-1.5 text-white px-5 py-2 rounded-lg text-sm font-bold shadow-md active:scale-95 transition-all"
                                    style={{ background: 'var(--theme-primary)' }}
                                    onMouseEnter={e => (e.currentTarget.style.opacity='0.85')}
                                    onMouseLeave={e => (e.currentTarget.style.opacity='1')}>
                                    <Save size={16} /> 저장
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 scrollbar-hide">
                            <div className="max-w-5xl mx-auto space-y-6 pb-10">
                                {/* 기본 정보 */}
                                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                                    <h4 className="text-sm font-bold text-gray-800 mb-5 flex items-center gap-2 border-b border-gray-100 pb-3">
                                        <div className="p-1.5 bg-blue-50 rounded-lg"><User size={16} className="text-blue-600" /></div>기본 정보
                                    </h4>
                                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                        <div><label className="text-[11px] font-bold text-gray-400 uppercase block mb-1.5">거래처명</label><input type="text" value={formData.partnerName} onChange={e => handleInputChange('partnerName', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:border-blue-500 outline-none" /></div>
                                        <div><label className="text-[11px] font-bold text-gray-400 uppercase block mb-1.5">코드 (자동)</label><div className="relative"><input type="text" value={formData.partnerCode || ''} readOnly className="w-full bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5 text-sm font-bold text-blue-600 text-center uppercase tracking-widest outline-none cursor-not-allowed" /><Hash size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-300" /></div></div>
                                        <div><label className="text-[11px] font-bold text-gray-400 uppercase block mb-1.5">관리자 ID</label><input type="text" value={formData.adminId} onChange={e => handleInputChange('adminId', e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:border-blue-500 outline-none" /></div>
                                        <div><label className="text-[11px] font-bold text-gray-400 uppercase block mb-1.5">패스워드</label><input type="text" value={formData.password} onChange={e => handleInputChange('password', e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:border-blue-500 outline-none" /></div>
                                    </div>
                                </div>

                                {/* 연락처 정보 */}
                                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                                    <h4 className="text-sm font-bold text-gray-800 mb-5 flex items-center gap-2 border-b border-gray-100 pb-3">
                                        <div className="p-1.5 bg-green-50 rounded-lg"><Phone size={16} className="text-green-600" /></div>연락처 정보
                                    </h4>
                                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                        <div><label className="text-[11px] font-bold text-gray-400 uppercase block mb-1.5">업체 전화</label><input type="text" value={formData.companyPhone} onChange={e => handleInputChange('companyPhone', e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:border-blue-500 outline-none" /></div>
                                        <div><label className="text-[11px] font-bold text-gray-400 uppercase block mb-1.5">거래 등급</label><div className="relative"><select value={formData.grade || 'B'} onChange={e => handleInputChange('grade', e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:border-blue-500 outline-none appearance-none cursor-pointer"><option value="A">A 등급 (최우수)</option><option value="B">B 등급 (우수)</option><option value="C">C 등급 (일반)</option><option value="D">D 등급 (주의)</option></select><Star size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" /></div></div>
                                        <div><label className="text-[11px] font-bold text-gray-400 uppercase block mb-1.5">대표자명</label><input type="text" value={formData.ceoName} onChange={e => handleInputChange('ceoName', e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:border-blue-500 outline-none" /></div>
                                        <div><label className="text-[11px] font-bold text-gray-400 uppercase block mb-1.5">대표자 전화</label><input type="text" value={formData.ceoPhone} onChange={e => handleInputChange('ceoPhone', e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:border-blue-500 outline-none" /></div>
                                        <div><label className="text-[11px] font-bold text-gray-400 uppercase block mb-1.5">담당자명</label><input type="text" value={formData.managerName} onChange={e => handleInputChange('managerName', e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:border-blue-500 outline-none" /></div>
                                        <div><label className="text-[11px] font-bold text-gray-400 uppercase block mb-1.5">담당자 전화</label><input type="text" value={formData.managerPhone} onChange={e => handleInputChange('managerPhone', e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:border-blue-500 outline-none" placeholder="010-0000-0000" maxLength={13} /></div>
                                    </div>
                                </div>

                                {/* 사업자 정보 */}
                                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                                    <h4 className="text-sm font-bold text-gray-800 mb-5 flex items-center gap-2 border-b border-gray-100 pb-3">
                                        <div className="p-1.5 bg-orange-50 rounded-lg"><Briefcase size={16} className="text-orange-600" /></div>사업자 정보
                                    </h4>
                                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                        <div><label className="text-[11px] font-bold text-gray-400 uppercase block mb-1.5">사업자번호</label><input type="text" value={formData.businessNo} onChange={e => handleInputChange('businessNo', e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:border-blue-500 outline-none" /></div>
                                        <div><label className="text-[11px] font-bold text-gray-400 uppercase block mb-1.5">업태</label><input type="text" value={formData.businessType} onChange={e => handleInputChange('businessType', e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:border-blue-500 outline-none" /></div>
                                        <div><label className="text-[11px] font-bold text-gray-400 uppercase block mb-1.5">종목</label><input type="text" value={formData.businessItem} onChange={e => handleInputChange('businessItem', e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:border-blue-500 outline-none" /></div>
                                        <div><label className="text-[11px] font-bold text-gray-400 uppercase block mb-1.5">세금계산서 이메일</label><div className="relative"><Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" /><input type="email" value={formData.taxEmail} onChange={e => handleInputChange('taxEmail', e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium focus:border-blue-500 outline-none" placeholder="example@company.com" /></div></div>
                                        <div className="col-span-1 xl:col-span-2 pt-2 border-t border-gray-50">
                                            <label className="text-[11px] font-bold text-gray-400 uppercase block mb-2 flex items-center gap-1"><MapPin size={12} /> 사업자 주소</label>
                                            <div className="flex gap-2 mb-2">
                                                <input type="text" value={addrZone} readOnly className="w-24 bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-600 outline-none" />
                                                <button onClick={() => handlePostcode('MAIN')} className="bg-gray-700 text-white rounded-xl px-4 py-2 text-xs font-bold hover:bg-gray-800 transition-colors">우편번호 검색</button>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <input type="text" value={addrMain} readOnly className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-600 outline-none" />
                                                <input id="input-addr-detail" type="text" value={addrDetail} onChange={e => setAddrDetail(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:border-blue-500 outline-none" placeholder="상세 주소 입력" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 화물도착 정보 (Supplier Only) */}
                                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                                    <h4 className="text-sm font-bold text-gray-800 mb-5 flex items-center gap-2 border-b border-gray-100 pb-3">
                                        <div className="p-1.5 bg-purple-50 rounded-lg"><Truck size={16} className="text-purple-600" /></div>화물도착 정보
                                    </h4>
                                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                        <div>
                                            <label className="text-[11px] font-bold text-gray-400 uppercase block mb-1.5">운송사 (택배/화물)</label>
                                            <input type="text" value={formData.freightInfo?.transporter || ''} onChange={e => handleFreightChange('transporter', e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:border-blue-500 outline-none" placeholder="예: CJ대한통운" />
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-bold text-gray-400 uppercase block mb-1.5">지점명</label>
                                            <input type="text" value={formData.freightInfo?.branchName || ''} onChange={e => handleFreightChange('branchName', e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:border-blue-500 outline-none" placeholder="예: 강남사업소" />
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-bold text-gray-400 uppercase block mb-1.5">지점전화번호</label>
                                            <input type="text" value={formData.freightInfo?.phone || ''} onChange={e => handleFreightChange('phone', e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:border-blue-500 outline-none" />
                                        </div>
                                        <div className="col-span-1 xl:col-span-2 pt-2 border-t border-gray-50">
                                            <label className="text-[11px] font-bold text-gray-400 uppercase block mb-2 flex items-center gap-1"><MapPin size={12} /> 화물 도착 주소</label>
                                            <div className="flex gap-2 mb-2">
                                                <input type="text" value={freightAddrZone} readOnly className="w-24 bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-600 outline-none" />
                                                <button onClick={() => handlePostcode('FREIGHT')} className="bg-gray-700 text-white rounded-xl px-4 py-2 text-xs font-bold hover:bg-gray-800 transition-colors">우편번호 검색</button>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <input type="text" value={freightAddrMain} readOnly className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-600 outline-none" />
                                                <input id="input-freight-addr-detail" type="text" value={freightAddrDetail} onChange={e => handleFreightDetailChange(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:border-blue-500 outline-none" placeholder="상세 주소 입력" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 비고 */}
                                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                                    <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2"><StickyNote size={14} className="text-gray-400" />비고 (Memo)</h4>
                                    <textarea value={formData.note || ''} onChange={e => handleInputChange('note', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:border-blue-500 outline-none resize-none" rows={3} style={{ color: '#374151' }} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Postcode Modal */}
                <AnimatePresence>
                    {postcodeTarget && (
                        <div id="modal-postcode" className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setPostcodeTarget(null)} />
                            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-[500px] h-[650px] flex flex-col overflow-hidden relative z-10">
                                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                                    <h3 className="font-bold text-gray-800 flex items-center gap-2"><MapPin size={18} className="text-blue-500" />우편번호 검색</h3>
                                    <button onClick={() => setPostcodeTarget(null)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><X size={18} className="text-gray-500" /></button>
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <PostcodeSearch onComplete={handlePostcodeComplete} />
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        );
    }

// =================================================================================
// ADMIN VIEW
// =================================================================================
const getTypeLabel = (type: PartnerType) => {
    switch (type) {
        case 'DISTRIBUTOR': return '유통관리사';
        case 'AGENCY': return '가맹대리점';
        case 'MANUFACTURER': return '제조공급사';
        case 'FABRIC_SUPPLIER': return '원단공급사';
        default: return type;
    }
};

const TYPE_COLORS: Record<string, string> = {
    DISTRIBUTOR: 'from-blue-500 to-blue-600',
    AGENCY: 'from-purple-500 to-purple-600',
    MANUFACTURER: 'from-orange-500 to-orange-600',
    FABRIC_SUPPLIER: 'from-green-500 to-green-600',
};

// Menu management for Admin view
const menuList = ROLE_MENUS[formData.type] || [];
const groups = [...new Set(menuList.map(m => m.group))];
const allowed = partnerAllowedMenus;

const toggleMenu = (id: string) => {
    setPartnerAllowedMenus(prev =>
        prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
};
const toggleAll = (ids: string[], on: boolean) => {
    setPartnerAllowedMenus(prev =>
        on ? [...new Set([...prev, ...ids])] : prev.filter(x => !ids.includes(x))
    );
};

return (
    <div id="partner-mgmt-admin" className="flex flex-col h-full" style={{ background: 'var(--admin-bg)', color: 'var(--admin-text)' }}>
        {/* Header */}
        <div className="flex-shrink-0 px-8 h-20 flex items-center justify-between shadow-sm z-20" style={{ background: 'var(--admin-surface)', borderBottom: '1px solid var(--admin-border)' }}>
            <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--admin-text)' }}>
                <Building2 style={{ color: 'var(--theme-primary)' }} size={28} /> 거래처관리
            </h1>
        </div>

        <div ref={containerRef} className="flex flex-1 overflow-hidden">
            {/* Left List */}
            <div className="flex flex-col flex-shrink-0 overflow-hidden" style={{ width: leftWidth, background: 'var(--admin-surface)', borderRight: '1px solid var(--admin-border)' }}>
                {/* Search + Filter */}
                <div className="p-4 flex-shrink-0 space-y-2" style={{ borderBottom: '1px solid var(--admin-border)' }}>
                    <div className="relative">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--admin-text-sub)' }} />
                        <input type="text" placeholder="거래처 검색..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                            className="w-full rounded-xl pl-9 pr-4 py-2 text-sm outline-none"
                            style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }} />
                    </div>
                    <div className="flex gap-1">
                        {(['ALL','DISTRIBUTOR','AGENCY','MANUFACTURER','FABRIC_SUPPLIER'] as const).map(t => (
                            <button key={t} onClick={() => setFilterType(t)}
                                className="flex-1 py-1 text-[10px] font-bold rounded-lg transition-all"
                                style={{ background: filterType===t ? 'var(--theme-primary)' : 'transparent', color: filterType===t ? '#fff' : 'var(--admin-text-sub)' }}>
                                {t==='ALL' ? '전체' : t==='DISTRIBUTOR' ? '총판' : t==='AGENCY' ? '대리점' : t==='MANUFACTURER' ? '제조' : '원단'}
                            </button>
                        ))}
                    </div>
                </div>
                {/* Partner List */}
                <div className="flex-1 overflow-y-auto scrollbar-hide">
                    {filteredPartners.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full gap-2" style={{ color: 'var(--admin-text-sub)' }}>
                            <Building2 size={36} strokeWidth={1} />
                            <p className="text-sm">검색 결과가 없습니다</p>
                        </div>
                    ) : filteredPartners.map(p => (
                        <div key={p.id} onClick={() => setSelectedId(p.id)}
                            className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors"
                            style={{ background: selectedId===p.id ? 'var(--theme-primary-bg)' : 'transparent', borderBottom: '1px solid var(--admin-border)' }}>
                            <div className={\`w-8 h-8 rounded-lg bg-gradient-to-br \${TYPE_COLORS[p.type] || 'from-gray-400 to-gray-500'} flex items-center justify-center flex-shrink-0\`}>
                                <Building2 size={14} className="text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-sm truncate" style={{ color: selectedId===p.id ? 'var(--theme-primary)' : 'var(--admin-text)' }}>{p.partnerName}</p>
                                <p className="text-[11px] truncate" style={{ color: 'var(--admin-text-sub)' }}>{getTypeLabel(p.type)}</p>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="p-3 flex-shrink-0" style={{ borderTop: '1px solid var(--admin-border)' }}>
                    <button onClick={handleNew} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white transition-all active:scale-95"
                        style={{ background: 'var(--theme-primary)' }}>
                        <Plus size={16} /> 새 거래처 추가
                    </button>
                </div>
            </div>

            {/* Resize Handle */}
            <div
                className="flex-shrink-0 w-1 cursor-col-resize"
                style={{ background: 'transparent' }}
                onMouseDown={startResizing}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--theme-primary)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            />

            {/* Right Panel */}
            <div className="flex-1 flex flex-col h-full overflow-hidden min-w-[400px]" style={{ background: 'var(--admin-bg)' }}>
                <div className="px-8 py-4 flex-shrink-0 flex items-center justify-between h-[69px]"
                    style={{ background: 'var(--admin-surface)', borderBottom: '1px solid var(--admin-border)' }}>
                    <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--admin-text)' }}>
                        <LayoutList size={18} style={{ color: 'var(--admin-text-sub)' }} /> 상세 정보 관리
                    </h3>
                    <div className="flex gap-2">
                        <button onClick={handleNew} className="p-2 rounded-lg transition-colors" style={{ color: 'var(--admin-text-sub)' }}
                            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color='var(--theme-primary)'; (e.currentTarget as HTMLButtonElement).style.background='var(--theme-primary-bg)'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color='var(--admin-text-sub)'; (e.currentTarget as HTMLButtonElement).style.background='transparent'; }}>
                            <RefreshCw size={18} />
                        </button>
                        <button onClick={handleDelete} className="p-2 rounded-lg transition-colors" style={{ color: 'var(--admin-text-sub)' }}
                            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color='#ef4444'; (e.currentTarget as HTMLButtonElement).style.background='#fee2e2'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color='var(--admin-text-sub)'; (e.currentTarget as HTMLButtonElement).style.background='transparent'; }}>
                            <Trash2 size={18} />
                        </button>
                        <div className="w-px h-8 mx-1" style={{ background: 'var(--admin-border)' }} />
                        <button onClick={handleSave} className="flex items-center gap-1.5 text-white px-5 py-2 rounded-lg text-sm font-bold shadow-md active:scale-95 transition-all"
                            style={{ background: 'var(--theme-primary)' }}
                            onMouseEnter={e => (e.currentTarget.style.opacity='0.85')}
                            onMouseLeave={e => (e.currentTarget.style.opacity='1')}>
                            <Save size={16} /> 저장 완료
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 scrollbar-hide">
                    <div className="max-w-5xl mx-auto space-y-6 pb-10">
                        {/* 기본 정보 */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                            <h4 className="text-sm font-bold text-gray-800 mb-5 flex items-center gap-2 border-b border-gray-100 pb-3">
                                <div className="p-1.5 bg-blue-50 rounded-lg"><User size={16} className="text-blue-600" /></div>기본 정보
                            </h4>
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                <div><label className="text-[11px] font-bold text-gray-400 uppercase block mb-1.5">거래처명</label><input type="text" value={formData.partnerName} onChange={e => handleInputChange('partnerName', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:border-blue-500 outline-none" /></div>
                                <div><label className="text-[11px] font-bold text-gray-400 uppercase block mb-1.5">코드 (자동)</label><div className="relative"><input type="text" value={formData.partnerCode || ''} readOnly className="w-full bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5 text-sm font-bold text-blue-600 text-center uppercase tracking-widest outline-none cursor-not-allowed" /><Hash size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-300" /></div></div>
                                <div><label className="text-[11px] font-bold text-gray-400 uppercase block mb-1.5">관리자 ID</label><input type="text" value={formData.adminId} onChange={e => handleInputChange('adminId', e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:border-blue-500 outline-none" /></div>
                                <div><label className="text-[11px] font-bold text-gray-400 uppercase block mb-1.5">패스워드</label><input type="text" value={formData.password} onChange={e => handleInputChange('password', e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:border-blue-500 outline-none" /></div>
                            </div>
                        </div>

                        {/* 연락처 정보 */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                            <h4 className="text-sm font-bold text-gray-800 mb-5 flex items-center gap-2 border-b border-gray-100 pb-3">
                                <div className="p-1.5 bg-green-50 rounded-lg"><Phone size={16} className="text-green-600" /></div>연락처 정보
                            </h4>
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                <div><label className="text-[11px] font-bold text-gray-400 uppercase block mb-1.5">업체 전화</label><input type="text" value={formData.companyPhone} onChange={e => handleInputChange('companyPhone', e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:border-blue-500 outline-none" /></div>
                                <div><label className="text-[11px] font-bold text-gray-400 uppercase block mb-1.5">거래 등급</label><div className="relative"><select value={formData.grade || 'B'} onChange={e => handleInputChange('grade', e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:border-blue-500 outline-none appearance-none cursor-pointer"><option value="A">A 등급 (최우수)</option><option value="B">B 등급 (우수)</option><option value="C">C 등급 (일반)</option><option value="D">D 등급 (주의)</option></select><Star size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" /></div></div>
                                <div><label className="text-[11px] font-bold text-gray-400 uppercase block mb-1.5">대표자명</label><input type="text" value={formData.ceoName} onChange={e => handleInputChange('ceoName', e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:border-blue-500 outline-none" /></div>
                                <div><label className="text-[11px] font-bold text-gray-400 uppercase block mb-1.5">대표자 전화</label><input type="text" value={formData.ceoPhone} onChange={e => handleInputChange('ceoPhone', e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:border-blue-500 outline-none" /></div>
                                <div><label className="text-[11px] font-bold text-gray-400 uppercase block mb-1.5">담당자명</label><input type="text" value={formData.managerName} onChange={e => handleInputChange('managerName', e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:border-blue-500 outline-none" /></div>
                                <div><label className="text-[11px] font-bold text-gray-400 uppercase block mb-1.5">담당자 전화</label><input type="text" value={formData.managerPhone} onChange={e => handleInputChange('managerPhone', e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:border-blue-500 outline-none" placeholder="010-0000-0000" maxLength={13} /></div>
                            </div>
                        </div>

                        {/* 사업자 정보 */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                            <h4 className="text-sm font-bold text-gray-800 mb-5 flex items-center gap-2 border-b border-gray-100 pb-3">
                                <div className="p-1.5 bg-orange-50 rounded-lg"><Briefcase size={16} className="text-orange-600" /></div>사업자 정보
                            </h4>
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                <div><label className="text-[11px] font-bold text-gray-400 uppercase block mb-1.5">사업자번호</label><input type="text" value={formData.businessNo} onChange={e => handleInputChange('businessNo', e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:border-blue-500 outline-none" /></div>
                                <div><label className="text-[11px] font-bold text-gray-400 uppercase block mb-1.5">업태</label><input type="text" value={formData.businessType} onChange={e => handleInputChange('businessType', e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:border-blue-500 outline-none" /></div>
                                <div><label className="text-[11px] font-bold text-gray-400 uppercase block mb-1.5">종목</label><input type="text" value={formData.businessItem} onChange={e => handleInputChange('businessItem', e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:border-blue-500 outline-none" /></div>
                                <div><label className="text-[11px] font-bold text-gray-400 uppercase block mb-1.5">세금계산서 이메일</label><div className="relative"><Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" /><input type="email" value={formData.taxEmail} onChange={e => handleInputChange('taxEmail', e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium focus:border-blue-500 outline-none" placeholder="example@company.com" /></div></div>
                                <div className="col-span-1 xl:col-span-2 pt-2 border-t border-gray-50">
                                    <label className="text-[11px] font-bold text-gray-400 uppercase block mb-2 flex items-center gap-1"><MapPin size={12} /> 사업자 주소</label>
                                    <div className="flex gap-2 mb-2">
                                        <input type="text" value={addrZone} readOnly className="w-24 bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-600 outline-none" />
                                        <button onClick={() => handlePostcode('MAIN')} className="bg-gray-700 text-white rounded-xl px-4 py-2 text-xs font-bold hover:bg-gray-800 transition-colors">우편번호 검색</button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <input type="text" value={addrMain} readOnly className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-600 outline-none" />
                                        <input id="input-addr-detail" type="text" value={addrDetail} onChange={e => setAddrDetail(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:border-blue-500 outline-none" placeholder="상세 주소 입력" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 메뉴 할당 */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                            <div className="h-px bg-gray-100" />
                            <div>
                                <h4 className="text-sm font-bold text-gray-800 mb-1 flex items-center gap-2">
                                    <Shield size={16} className="text-indigo-500" /> 메뉴 할당 관리
                                </h4>
                                <p className="text-[10px] text-gray-400 mb-4">거래처 <strong>{formData.partnerName || '(신규)'}</strong>의 접근 가능 메뉴를 설정합니다.</p>
                                <div className="space-y-4">
                                    {groups.map(group => {
                                        const items = menuList.filter(m => m.group === group);
                                        const groupIds = items.map(m => m.id);
                                        const allOn = groupIds.every(id => allowed.includes(id));
                                        return (
                                            <div key={group} className="bg-indigo-50/50 rounded-xl border border-indigo-100 overflow-hidden">
                                                <div className="flex items-center justify-between px-4 py-2.5 bg-indigo-50 border-b border-indigo-100">
                                                    <span className="text-xs font-bold text-indigo-700">{group}</span>
                                                    <button type="button" onClick={() => toggleAll(groupIds, !allOn)}
                                                        className={\`flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all \${allOn ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-500 border border-indigo-200'}\`}>
                                                        {allOn ? <ToggleRight size={12} /> : <ToggleLeft size={12} />}
                                                        {allOn ? '전체해제' : '전체허용'}
                                                    </button>
                                                </div>
                                                <div className="p-3 flex flex-wrap gap-2">
                                                    {items.map(item => (
                                                        <button key={item.id} type="button" onClick={() => toggleMenu(item.id)}
                                                            className={\`text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all \${allowed.includes(item.id) ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-gray-500 border border-gray-200 hover:border-indigo-300'}\`}>
                                                            {item.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* 비고 */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                            <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2"><StickyNote size={14} className="text-gray-400" />비고 (Memo)</h4>
                            <textarea value={formData.note || ''} onChange={e => handleInputChange('note', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:border-blue-500 outline-none resize-none" rows={3} />
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Postcode Modal */}
        <AnimatePresence>
            {postcodeTarget && (
                <div id="modal-postcode-admin" className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setPostcodeTarget(null)} />
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-[500px] h-[650px] flex flex-col overflow-hidden relative z-10">
                        <div className="flex items-center justify-between p-4 border-b border-gray-100">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2"><MapPin size={18} className="text-blue-500" />우편번호 검색</h3>
                            <button onClick={() => setPostcodeTarget(null)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><X size={18} className="text-gray-500" /></button>
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <PostcodeSearch onComplete={handlePostcodeComplete} />
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    </div>
);
};

export default PartnerManagement;
`;

const finalContent = kept + '\n' + newJsx;
fs.writeFileSync(p, finalContent, 'utf8');
console.log('Written. Lines:', finalContent.split('\n').length);
