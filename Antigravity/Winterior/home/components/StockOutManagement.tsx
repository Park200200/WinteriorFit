import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
    Search, Truck, ChevronLeft, ChevronRight,
    Package, CheckCircle2, Clock, Filter, Download,
    Printer, Box, X, ScanLine, Plus, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdminTheme } from './theme/AdminThemeContext';
import { usePartnerContext } from '../PartnerContext';

// --- Types ---
interface StockOutItem {
    id: string;
    date: string;
    partnerName: string;
    productName: string;
    colorName: string;
    width: string;
    quantity: number;
    unit: string;
    address: string;
    status: 'PENDING' | 'COMPLETED';
    courier?: string;
    trackingNumber?: string;
    isProduct?: boolean;
    productWidth?: string;
}

interface StockLotItem {
    id: string;
    lotNo: string;
    location: string;
    quantity: number;
    meters: number;
    originalMeters: number;
    parentId?: string;
    isProduct?: boolean;
    productWidth?: string;
    isCut?: boolean;
    isPacked?: boolean;
    isSelected: boolean;
}

interface PackingCard {
    id: string;
    packingNo: string;
    partnerName: string;
    itemCount: number;
    items: StockLotItem[];
    createdAt: string;
    confirmerName: string;
    confirmerPhone: string;
    trackingNo?: string;
}

// --- Mock Data Generators ---
const FABRIC_POOL = [
    { path: '원단:롤>일반>시드니', baseWidth: '280 cm', colors: ['아이보리', '그레이', '화이트'] },
    { path: '원단:롤>일반>방콕', baseWidth: '210 cm', colors: ['베이지', '브라운', '블랙'] },
    { path: '원단:블라인드>콤비>파리풍경', baseWidth: '280 cm', colors: ['화이트', '블랙', '그레이'] },
    { path: '원단:블라인드>콤비>사다나이', baseWidth: '280 cm', colors: ['그레이', '아이보리'] },
    { path: '원단:커튼>속커튼>쉬폰', baseWidth: '300 cm', colors: ['화이트'] },
    { path: '원단:25mm>대나무>블랙', baseWidth: '280 cm', colors: ['블랙', '내추럴'] },
];

const PRODUCT_POOL = [
    { path: '제품:롤>일반>파리', baseSpec: '150.0 X 200.0', colors: ['그레이', '화이트'] },
    { path: '제품:블라인드>콤비>시드니', baseSpec: '180.0 X 150.0', colors: ['아이보리', '베이지'] },
    { path: '제품:55mm>우드>오동나무', baseSpec: '120.0 X 180.0', colors: ['내추럴', '브라운'] },
    { path: '제품:허니콤>일반>듀엣', baseSpec: '150.0 X 120.0', colors: ['피치', '민트'] },
    { path: '제품:커튼>속커튼>쉬폰', baseSpec: '200.0 X 240.0', colors: ['화이트'] },
];

const ADDRESSES = [
    '서울특별시 강남구 테헤란로 123',
    '경기도 성남시 분당구 판교로 456',
    '부산광역시 해운대구 센텀로 789',
    '서울특별시 강동구 천호동 101-1',
    '인천광역시 연수구 송도동 222',
    '대구광역시 수성구 범어동 333',
    '광주광역시 북구 용봉동 444',
    '대전광역시 서구 둔산동 555',
    '경기도 화성시 동탄대로 1',
    '경기도 평택시 비전동 1',
];

const generateStockOutSamples = (partners: any[]): StockOutItem[] => {
    const samples: StockOutItem[] = [];
    const partnerNames = partners.length > 0
        ? partners.map(p => p.partnerName)
        : ['(주)경동물류', '삼성데코', '한샘인테리어', 'LG하우시스', '현대리바트'];

    for (let i = 1; i <= 30; i++) {
        const isProduct = i % 2 === 0;
        const partner = partnerNames[i % partnerNames.length];
        const address = ADDRESSES[i % ADDRESSES.length];

        if (isProduct) {
            const base = PRODUCT_POOL[i % PRODUCT_POOL.length];
            const color = base.colors[i % base.colors.length];
            const qty = [1.5, 2.0, 3.0][i % 3];
            samples.push({
                id: `out-sample-${i}`,
                date: new Date().toISOString().split('T')[0],
                partnerName: partner,
                productName: base.path,
                colorName: color,
                width: base.baseSpec,
                unit: '㎡',
                quantity: qty,
                status: i % 3 === 0 ? 'COMPLETED' : 'PENDING',
                isProduct: true,
                productWidth: base.baseSpec,
                address,
            });
        } else {
            const base = FABRIC_POOL[i % FABRIC_POOL.length];
            const color = base.colors[i % base.colors.length];
            const unit = i % 3 === 0 ? 'm' : 'Roll';
            const qty = unit === 'Roll' ? (i % 3) + 1 : [9, 12, 15][i % 3];
            samples.push({
                id: `out-sample-${i}`,
                date: new Date().toISOString().split('T')[0],
                partnerName: partner,
                productName: base.path,
                colorName: color,
                width: base.baseWidth,
                unit,
                quantity: qty,
                status: i % 4 === 0 ? 'COMPLETED' : 'PENDING',
                isProduct: false,
                productWidth: base.baseWidth,
                address,
            });
        }
    }
    return samples;
};

// ===== Main Component =====
const StockOutManagement: React.FC = () => {
    const { theme } = useAdminTheme();
    const { partners } = usePartnerContext();

    const [currentDate, setCurrentDate] = useState<Date>(new Date());
    const [searchQuery, setSearchQuery] = useState('');
    const [items, setItems] = useState<StockOutItem[]>([]);
    const [sortMode, setSortMode] = useState<'product' | 'partner'>('product');
    const [statusFilter, setStatusFilter] = useState<'all' | 'PENDING' | 'COMPLETED'>('all');

    // Detail modal state
    const [selectedItem, setSelectedItem] = useState<StockOutItem | null>(null);
    const [inventoryList, setInventoryList] = useState<StockLotItem[]>([]);
    const [preparedList, setPreparedList] = useState<StockLotItem[]>([]);
    const [packingCards, setPackingCards] = useState<PackingCard[]>([]);
    const [selectedPackedCardId, setSelectedPackedCardId] = useState<string | null>(null);
    const [stickerModal, setStickerModal] = useState<{
        card: PackingCard; trackingNo: string;
        receiverName: string; receiverPhone: string; receiverAddr: string;
    } | null>(null);
    // 거래처 기준 정렬 모달
    const [selectedPartner, setSelectedPartner] = useState<string | null>(null);

    // Load data
    useEffect(() => {
        try {
            const saved = localStorage.getItem('winterior_orders');
            if (saved) {
                const parsed = JSON.parse(saved);
                const isOldFormat = !Array.isArray(parsed) || parsed.length === 0 ||
                    parsed.some((o: any) => o.productName === '롤스크린' || !o.width) ||
                    (parsed[0]?.id?.startsWith('out-sample-') &&
                        (parsed.some((o: any) => o.isProduct && o.unit === '') ||
                         parsed.every((o: any) => o.status === 'PENDING')));

                // 등록된 거래처 이름과 불일치하면 재생성
                const registeredNames = partners.map((p: any) => p.partnerName);
                const hasUnregisteredPartner = partners.length > 0 &&
                    parsed.some((o: any) => o.partnerName && !registeredNames.includes(o.partnerName));

                if (!isOldFormat && !hasUnregisteredPartner) {
                    setItems(parsed);
                    return;
                }
            }
        } catch { /* ignore */ }
        const ns = generateStockOutSamples(partners);
        setItems(ns);
        localStorage.setItem('winterior_orders', JSON.stringify(ns));
    }, [partners]);

    // Date navigation
    const dateLabel = currentDate.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
    const moveDate = (delta: number) => {
        setCurrentDate(prev => {
            const d = new Date(prev);
            d.setDate(d.getDate() + delta);
            return d;
        });
    };
    const goToday = () => setCurrentDate(new Date());

    // Stats
    const todayStr = new Date().toISOString().split('T')[0];
    const todayItems = items.filter(i => i.date === todayStr);
    const completedToday = todayItems.filter(i => i.status === 'COMPLETED').length;
    const totalToday = todayItems.length;
    const distinctProducts = new Set(todayItems.map(i => i.productName)).size;

    // Filter + sort
    const filteredItems = useMemo(() => {
        let list = [...items];
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            list = list.filter(i =>
                i.productName.toLowerCase().includes(q) ||
                i.partnerName.toLowerCase().includes(q) ||
                i.colorName.toLowerCase().includes(q)
            );
        }
        if (statusFilter !== 'all') list = list.filter(i => i.status === statusFilter);
        if (sortMode === 'partner') list.sort((a, b) => a.partnerName.localeCompare(b.partnerName, 'ko'));
        else list.sort((a, b) => a.productName.localeCompare(b.productName, 'ko'));
        return list;
    }, [items, searchQuery, statusFilter, sortMode]);

    // Open detail modal
    const handleOpenModal = (item: StockOutItem) => {
        setSelectedItem(item);
        // localStorage에서 저장된 상태 복원
        const savedKey = `stockout_state_${item.id}`;
        const saved = localStorage.getItem(savedKey);
        if (saved) {
            try {
                const { inventory, prepared, packing } = JSON.parse(saved);
                setInventoryList(inventory || []);
                setPreparedList(prepared || []);
                setPackingCards(packing || []);
                return;
            } catch {}
        }
        // 저장된 상태 없으면 새로 생성
        const count = Math.ceil(item.quantity) + 2;
        const inv: StockLotItem[] = Array.from({ length: count }).map((_, i) => ({
            id: `lot-${Date.now()}-${i}`,
            lotNo: `LOT-2405-${String(Math.floor(Math.random() * 9000) + 1000)}`,
            location: i % 2 === 0 ? 'A-01-02' : 'B-05-11',
            quantity: 1,
            meters: Math.round((Math.random() * 20 + 5) * 10) / 10,
            originalMeters: 0,
            isSelected: false,
            isPacked: false,
        }));
        setInventoryList(inv);
        setPreparedList([]);
        setPackingCards([]);
    };

    // 모달 닫기 + 현재 상태 저장
    const handleCloseModal = () => {
        try {
            if (selectedItem) {
                const savedKey = `stockout_state_${selectedItem.id}`;
                localStorage.setItem(savedKey, JSON.stringify({
                    inventory: inventoryList,
                    prepared: preparedList,
                    packing: packingCards,
                }));
            }
        } catch {}
        setSelectedItem(null);
    };

    const handleAddToPrepared = (lot: StockLotItem) => {
        // 좌측에서 제거하지 않고 isPacked=true로 비활성화
        setInventoryList(prev => prev.map(l => l.id === lot.id ? { ...l, isPacked: true } : l));
        // selectedItem의 품명/칼라/규격/단위를 lot에 함께 담기
        setPreparedList(prev => [...prev, {
            ...lot,
            isSelected: false,
            productName: selectedItem?.productName || (lot as any).productName || '',
            colorName: selectedItem?.colorName || (lot as any).colorName || '',
            productWidth: selectedItem?.width || (lot as any).productWidth || '',
            unit: selectedItem?.unit || (lot as any).unit || '',
        } as any]);
    };
    const togglePreparedSelect = (id: string) => {
        setPreparedList(prev => prev.map(l => l.id === id ? { ...l, isSelected: !l.isSelected } : l));
    };
    const handlePack = () => {
        const selected = preparedList.filter(s => s.isSelected);
        if (!selected.length) return;
        const card: PackingCard = {
            id: `packing-${Date.now()}`,
            packingNo: `PKG-${String(Date.now()).slice(-6)}`,
            partnerName: selectedItem?.partnerName || '',
            itemCount: selected.length,
            items: selected,
            createdAt: new Date().toLocaleString('ko-KR'),
            confirmerName: '김관리',
            confirmerPhone: '010-1234-5678',
        };
        setPackingCards(prev => [...prev, card]);
        // 패킹된 LOT들을 좌측 재고 리스트에서 주제적으로 제거
        const selectedIds = new Set(selected.map(s => s.id));
        setInventoryList(prev => prev.filter(l => !selectedIds.has(l.id)));
        setPreparedList(prev => prev.filter(s => !s.isSelected));
    };
    const handlePackCancel = (cardId: string) => {
        const card = packingCards.find(c => c.id === cardId);
        if (!card) return;
        // 패킹된 LOT 아이템들을 패킹예정 리스트로 복원 (isSelected 초기화)
        setPreparedList(prev => [
            ...prev,
            ...card.items.map(i => ({ ...i, isSelected: false })),
        ]);
        // 재고 리스트에서 해당 LOT들의 isPacked를 true로 유지 (패킹예정 상태)
        setInventoryList(prev =>
            prev.map(l => card.items.find(ci => ci.id === l.id)
                ? { ...l, isPacked: true }
                : l
            )
        );
        setPackingCards(prev => prev.filter(c => c.id !== cardId));
    };

    const handlePrintSticker = (card: PackingCard) => {
        const p = partners.find((x: any) => x.partnerName === card.partnerName);
        const partnerAddr = (p?.addresses?.[0] as any)?.address || (p as any)?.freightInfo?.address || '-';
        const partnerPhone = (p as any)?.managerPhone || (p as any)?.ceoPhone || (p as any)?.companyPhone || '-';
        const freight = (p as any)?.freightInfo;
        const freightTransporter = freight?.transporter
            ? `${freight.transporter}${freight.branchName ? `-${freight.branchName}` : ''}`
            : `${card.partnerName} 화물`;
        const freightPhone = freight?.phone || partnerPhone;
        const freightAddr = freight?.address || partnerAddr;

        const rowsHtml = card.items.map((item: StockLotItem, idx: number) => `
            <tr style="background:${idx % 2 === 0 ? '#f9fafb' : '#fff'}">
                <td>${item.lotNo}</td>
                <td>${(item as any).productName || '-'}</td>
                <td>${(item as any).colorName || '-'}</td>
                <td>${item.productWidth || '-'}</td>
                <td>${(item as any).unit || '-'}</td>
                <td style="text-align:right">${item.meters || (item as any).quantity || '-'}</td>
            </tr>`).join('');

        const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>패킹 스티커 - ${card.packingNo}</title>
<style>
  @page { size: A4; margin: 15mm; }
  body { font-family: 'Malgun Gothic', sans-serif; font-size: 12px; color: #111; }
  h1 { font-size: 20px; margin: 0 0 4px; }
  .badge { display: inline-block; background: #7c3aed; color: #fff; border-radius: 6px; padding: 2px 10px; font-size: 11px; font-weight: 700; margin-bottom: 12px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px; }
  .box { border: 1px solid #e5e7eb; border-radius: 10px; padding: 12px; }
  .label { font-size: 10px; color: #6b7280; font-weight: 700; margin-bottom: 4px; }
  .name { font-size: 15px; font-weight: 900; }
  .sub { font-size: 11px; color: #6b7280; margin-top: 2px; }
  .freight { border: 2px solid #7c3aed; border-radius: 10px; padding: 12px 16px; margin-bottom: 14px; background: #f5f3ff; }
  .freight-title { font-size: 16px; font-weight: 900; color: #7c3aed; }
  .freight-sub { font-size: 11px; color: #6b7280; margin-top: 2px; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  thead tr { background: #7c3aed; color: #fff; }
  th { padding: 6px 10px; text-align: left; font-weight: 700; }
  td { padding: 5px 10px; border-bottom: 1px solid #e5e7eb; }
  .footer { margin-top: 14px; font-size: 10px; color: #9ca3af; text-align: right; }
</style>
</head><body>
<h1>패킹 스티커</h1>
<div class="badge">${card.packingNo}</div>
<div class="grid">
  <div class="box">
    <div class="label">발신자</div>
    <div class="name">WinteriorFit</div>
    <div class="sub">서울특별시 강남구 테헤란로 123</div>
    <div class="sub">${card.confirmerName} ${card.confirmerPhone}</div>
  </div>
  <div class="box">
    <div class="label">수신자 &nbsp; <span style="background:#f5f3ff;color:#7c3aed;border-radius:4px;padding:1px 7px;">총 ${card.itemCount}건</span></div>
    <div class="name">${card.partnerName}</div>
    <div class="sub">${partnerAddr}</div>
    <div class="sub" style="color:#7c3aed;font-weight:700">${partnerPhone}</div>
  </div>
</div>
<div class="freight">
  <div class="label">도착지 (화물 정보)</div>
  <div class="freight-title">${freightTransporter} (${freightPhone}) &nbsp; 총 ${card.itemCount}개</div>
  <div class="freight-sub">${freightAddr !== '-' ? freightAddr : ''}</div>
</div>
<table>
  <thead><tr><th>코드</th><th>품명</th><th>칼라</th><th>규격</th><th>단위</th><th>수량</th></tr></thead>
  <tbody>${rowsHtml}</tbody>
</table>
<div class="footer">출력일시: ${new Date().toLocaleString('ko-KR')} | ${card.packingNo}</div>
</body></html>`;

        const win = window.open('', '_blank');
        if (win) {
            win.document.write(html);
            win.document.close();
            win.focus();
            setTimeout(() => { win.print(); }, 400);
        }
    };

    const handleOpenStickerModal = (card: PackingCard) => {
        const p = partners.find((x: any) => x.partnerName === card.partnerName);
        setStickerModal({
            card,
            trackingNo: card.packingNo,
            receiverName: (p as any)?.managerName || '',
            receiverPhone: (p as any)?.managerPhone || (p as any)?.ceoPhone || '',
            receiverAddr: (p as any)?.freightInfo?.address || (p?.addresses?.[0] as any)?.address || '',
        });
    };

    // Status update on tracking no entry
    useEffect(() => {
        if (stickerModal && stickerModal.trackingNo.length > 5) {
            const cardItems = stickerModal.card.items;
            setItems(prev => prev.map(item => {
                const match = cardItems.some((lot: any) => lot.productName === item.productName);
                if (match && item.partnerName === stickerModal.card.partnerName) {
                    return { ...item, status: 'COMPLETED' as const, trackingNumber: stickerModal.trackingNo };
                }
                return item;
            }));
        }
    }, [stickerModal?.trackingNo]);

    const selectedPreparedCount = preparedList.filter(l => l.isSelected).length;

    const getStatusBadgeStyle = (status: string) => {
        if (status === 'COMPLETED') return { color: 'var(--theme-primary)', background: 'var(--theme-primary-bg)', label: '출고완료' };
        return { color: '#d97706', background: '#fef3c7', label: '출고준비' };
    };

    return (
        <div className="flex flex-col h-full" style={{ background: 'var(--admin-bg)', color: 'var(--admin-text)' }}>

            {/* ===== 헤더 ===== */}
            <div className="px-6 py-3 flex items-center justify-between border-b"
                style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)' }}>
                <div className="flex items-center gap-3">
                    <Truck size={20} style={{ color: 'var(--theme-primary)' }} />
                    <h1 className="text-xl font-extrabold" style={{ color: 'var(--admin-text)' }}>출고 관리 및 확인</h1>
                </div>
                <div className="flex items-center gap-4">
                    {/* 날짜 네비게이션 */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={goToday}
                            className="text-xs font-bold px-3 py-1.5 rounded-lg border"
                            style={{ background: 'var(--admin-bg)', borderColor: 'var(--admin-border)', color: 'var(--admin-text-sub)' }}
                        >오늘</button>
                        <button onClick={() => moveDate(-1)} className="p-1 rounded-lg hover:opacity-70 transition-opacity">
                            <ChevronLeft size={18} style={{ color: 'var(--theme-primary)' }} />
                        </button>
                        <span className="font-bold text-sm px-2" style={{ color: 'var(--theme-primary)', minWidth: 120, textAlign: 'center' }}>
                            {currentDate.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                        <button onClick={() => moveDate(1)} className="p-1 rounded-lg hover:opacity-70 transition-opacity">
                            <ChevronRight size={18} style={{ color: 'var(--theme-primary)' }} />
                        </button>
                        <button
                            onClick={goToday}
                            className="text-xs font-bold px-3 py-1.5 rounded-lg"
                            style={{ background: 'var(--theme-primary)', color: '#fff' }}
                        >오늘</button>
                    </div>
                    {/* 검색 */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={14} style={{ color: 'var(--admin-text-sub)' }} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="제품명 거래처 검색..."
                            className="pl-9 pr-4 py-1.5 text-sm rounded-xl outline-none"
                            style={{ background: 'var(--admin-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)', width: 200 }}
                        />
                    </div>
                </div>
            </div>

            {/* ===== 통계 카드 3개 ===== */}
            <div className="px-6 py-4 grid grid-cols-3 gap-4" style={{ background: 'var(--admin-bg)' }}>
                {[
                    { icon: <Truck size={22} style={{ color: 'var(--theme-primary)' }} />, label: '오늘 출고 건수', value: `${totalToday} 건` },
                    { icon: <CheckCircle2 size={22} style={{ color: '#10b981' }} />, label: '출고완료', value: `${completedToday} 출고완료` },
                    { icon: <Package size={22} style={{ color: '#8b5cf6' }} />, label: '오늘 출고 품목', value: `${distinctProducts} 건` },
                ].map((card, i) => (
                    <div key={i} className="rounded-2xl p-4 flex items-start justify-between relative overflow-hidden"
                        style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}>
                        <div>
                            <p className="text-xs font-medium mb-1" style={{ color: 'var(--admin-text-sub)' }}>{card.label}</p>
                            <p className="text-2xl font-extrabold" style={{ color: 'var(--admin-text)' }}>{card.value}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            {card.icon}
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                style={{ background: 'var(--theme-primary-bg)', color: 'var(--theme-primary)' }}>Today</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* ===== 출고 리스트 (카드형) ===== */}
            <div className="flex-1 overflow-hidden flex flex-col mx-6 mb-4 rounded-2xl"
                style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}>

                {/* 툴바 */}
                <div className="px-5 py-3 flex items-center justify-between border-b"
                    style={{ borderColor: 'var(--admin-border)' }}>
                    {/* 좌측: 타이틀만 */}
                    <span className="font-bold text-sm" style={{ color: 'var(--admin-text)' }}>출고 리스트</span>
                    {/* 우측: 스위치 + 상태필터 */}
                    <div className="flex items-center gap-2">
                        {/* 정렬 스위치 */}
                        <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: 'var(--admin-border)' }}>
                            {(['product', 'partner'] as const).map(mode => (
                                <button key={mode} onClick={() => setSortMode(mode)}
                                    className="px-3 py-1 text-xs font-bold transition-all"
                                    style={{
                                        background: sortMode === mode ? 'var(--theme-primary)' : 'var(--admin-bg)',
                                        color: sortMode === mode ? '#fff' : 'var(--admin-text-sub)',
                                    }}>
                                    {mode === 'product' ? '제품명' : '거래처'}
                                </button>
                            ))}
                        </div>
                        {/* 상태 필터 */}
                        <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: 'var(--admin-border)' }}>
                            {([['all', '전체'], ['PENDING', '출고준비'], ['COMPLETED', '출고완료']] as const).map(([val, lbl]) => (
                                <button key={val} onClick={() => setStatusFilter(val)}
                                    className="px-3 py-1 text-xs font-bold transition-all"
                                    style={{
                                        background: statusFilter === val ? 'var(--theme-primary)' : 'var(--admin-bg)',
                                        color: statusFilter === val ? '#fff' : 'var(--admin-text-sub)',
                                    }}>
                                    {lbl}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 카드 리스트 바디 */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {filteredItems.map(item => {
                        const badge = getStatusBadgeStyle(item.status);
                        return (
                            <div
                                key={item.id}
                                className="rounded-xl px-5 py-3 flex items-center gap-4 cursor-pointer transition-all"
                                style={{ background: 'var(--admin-bg)', border: '1px solid var(--admin-border)' }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.background = 'var(--theme-primary-bg)';
                                    e.currentTarget.style.borderColor = 'var(--theme-primary)';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.background = 'var(--admin-bg)';
                                    e.currentTarget.style.borderColor = 'var(--admin-border)';
                                }}
                                onClick={() => handleOpenModal(item)}
                            >
                                {/* 좌측: 제품 정보 */}
                                <div className="flex-1 min-w-0">
                                    {/* 1행: 원단/제품 뱃지 + 제품명 + 칼라 */}
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {/* 원단/제품 구분 뱃지 */}
                                        {item.productName.startsWith('원단') ? (
                                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full flex-shrink-0"
                                                style={{ background: '#dbeafe', color: '#1d4ed8', border: '1px solid #93c5fd' }}>
                                                원단
                                            </span>
                                        ) : (
                                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full flex-shrink-0"
                                                style={{ background: 'var(--theme-primary-bg)', color: 'var(--theme-primary)', border: '1px solid var(--theme-primary)' }}>
                                                제품
                                            </span>
                                        )}
                                        <span className="font-extrabold text-sm" style={{ color: 'var(--admin-text)' }}>
                                            {item.productName}
                                        </span>
                                        {item.colorName && (
                                            <span className="text-xs px-2 py-0.5 rounded-full"
                                                style={{ background: 'var(--admin-surface)', color: 'var(--admin-text-sub)', border: '1px solid var(--admin-border)' }}>
                                                {item.colorName}
                                            </span>
                                        )}
                                    </div>
                                    {/* 2행: 거래처 | 규격 | 수량단위 | 날짜 */}
                                    <div className="flex items-center gap-2 mt-1 text-xs" style={{ color: 'var(--admin-text-sub)' }}>
                                        <span className="font-bold" style={{ color: 'var(--admin-text)' }}>{item.partnerName}</span>
                                        <span>|</span>
                                        <span className="font-bold" style={{ color: 'var(--theme-primary)' }}>{item.width}</span>
                                        <span>|</span>
                                        <span>{item.quantity} {item.unit}</span>
                                        <span>|</span>
                                        <span>{item.date}</span>
                                    </div>
                                </div>

                                {/* 우측: 배송지 + 상태뱃지 + 관리버튼 */}
                                <div className="flex items-center gap-3 flex-shrink-0">
                                    {/* 배송지 */}
                                    <span className="text-xs text-right hidden lg:block"
                                        style={{ color: 'var(--admin-text-sub)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {item.address}
                                    </span>
                                    {/* 상태 뱃지 */}
                                    <span className="text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 flex-shrink-0"
                                        style={{ color: badge.color, background: badge.background }}>
                                        {item.status === 'COMPLETED'
                                            ? <CheckCircle2 size={11} />
                                            : <Clock size={11} />}
                                        {badge.label}
                                    </span>
                                    {/* 관리 버튼 */}
                                    <button
                                        className="text-xs font-bold px-3 py-1.5 rounded-lg flex-shrink-0"
                                        style={{ background: 'var(--theme-primary)', color: '#fff' }}
                                        onClick={e => {
                                            e.stopPropagation();
                                            if (sortMode === 'partner') {
                                                setSelectedPartner(item.partnerName);
                                            } else {
                                                handleOpenModal(item);
                                            }
                                        }}
                                    >
                                        관리
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                    {filteredItems.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20"
                            style={{ color: 'var(--admin-text-sub)' }}>
                            <Package size={44} className="mb-3 opacity-20" />
                            <p className="text-sm">출고 항목이 없습니다.</p>
                        </div>
                    )}
                </div>
            </div>



            {/* ===== 관리 모달 (고정 사이즈) ===== */}
            <AnimatePresence>
                {selectedItem && (
                    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4"
                        style={{ background: 'rgba(0,0,0,0.5)' }}
                        onClick={handleCloseModal}>
                        <motion.div
                            initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
                            className="rounded-2xl overflow-hidden flex flex-col"
                            style={{
                                background: 'var(--admin-surface)',
                                boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
                                width: 900,
                                height: 700,
                                flexShrink: 0,
                            }}
                            onClick={e => e.stopPropagation()}>

                            {/* 모달 헤더 */}
                            <div className="px-6 py-4 flex items-center justify-between flex-shrink-0"
                                style={{ background: 'var(--theme-primary)', color: '#fff' }}>
                                <div>
                                    <p className="font-extrabold text-base">{selectedItem.productName} {selectedItem.colorName && `(${selectedItem.colorName})`}</p>
                                    <p className="text-xs opacity-80 mt-0.5">
                                        {selectedItem.partnerName} | {selectedItem.width} | {selectedItem.quantity} {selectedItem.unit}
                                        {/* 출고준비완료 배지 */}
                                        {(() => {
                                            const packedQty = packingCards.reduce((acc, c) => acc + c.items.length, 0);
                                            const prepQty = preparedList.length;
                                            const total = packedQty + prepQty;
                                            const isReady = total > 0 && total >= Number(selectedItem.quantity);
                                            return isReady ? (
                                                <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-extrabold"
                                                    style={{ background: 'rgba(255,255,255,0.25)', color: '#fff', border: '1px solid rgba(255,255,255,0.5)' }}>
                                                    ✓ 출고준비완료
                                                </span>
                                            ) : null;
                                        })()}
                                    </p>
                                </div>
                                <button onClick={handleCloseModal} className="p-1.5 rounded-lg"
                                    style={{ background: 'rgba(255,255,255,0.2)' }}><X size={18} /></button>
                            </div>

                            {/* 모달 바디 (고정 높이) */}
                            <div className="flex flex-col flex-1 overflow-hidden" style={{ background: 'var(--admin-bg)' }}>
                                {/* 상단: 재고리스트 + 패킹예정 – 화면 아래까지 채움 */}
                                <div className="grid grid-cols-2 gap-4 p-4 flex-1 overflow-hidden">

                                    {/* ===== 좌측: 재고 리스트 / 출고예정 제품리스트 ===== */}
                                    <div className="rounded-xl overflow-hidden flex flex-col"
                                        style={{ border: '1px solid var(--admin-border)', height: '100%' }}>
                                        {/* 타이틀 */}
                                        <div className="px-4 flex-shrink-0 text-xs font-bold flex items-center"
                                            style={{ background: 'var(--admin-surface)', borderBottom: '1px solid var(--admin-border)', color: 'var(--admin-text-sub)', height: 40 }}>
                                            {selectedItem.isProduct ? '출고예정 제품리스트' : '재고 리스트'}
                                        </div>

                                        {/* 2-라인 카드 리스트 */}
                                        <div className="flex-1 overflow-y-auto p-2 space-y-1" style={{ minHeight: 0 }}>
                                            {selectedItem.isProduct ? (
                                                inventoryList.map((lot, idx) => (
                                                    <div key={lot.id}
                                                        className="rounded-lg px-3 py-2 flex items-center justify-between"
                                                        style={{ background: idx % 2 === 0 ? 'var(--admin-surface)' : 'var(--admin-bg)', border: '1px solid var(--admin-border)' }}>
                                                        <div className="min-w-0 flex-1">
                                                            {/* 1행: 제품번호 + 상품명 */}
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="font-mono text-xs font-extrabold flex-shrink-0" style={{ color: 'var(--theme-primary)' }}>
                                                                    {`P${String(idx + 1).padStart(4, '0')}`}
                                                                </span>
                                                                <span className="text-xs font-bold truncate" style={{ color: 'var(--admin-text)' }}>
                                                                    {selectedItem.productName}
                                                                </span>
                                                            </div>
                                                            {/* 2행: 사이즈 + 수량 + 시스템 */}
                                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                                <span className="text-[10px] font-bold" style={{ color: 'var(--theme-primary)' }}>{selectedItem.width}</span>
                                                                <span className="text-[9px]" style={{ color: 'var(--admin-text-sub)' }}>| 1개 |</span>
                                                                <span className="text-[9px]" style={{ color: 'var(--admin-text-sub)' }}>{selectedItem.colorName || '-'}</span>
                                                            </div>
                                                        </div>
                                                        {/* 원형 + 버튼 */}
                                                        <button onClick={() => handleAddToPrepared(lot)}
                                                            className="flex-shrink-0 flex items-center justify-center rounded-full"
                                                            style={{ width: 26, height: 26, background: 'var(--theme-primary)', color: '#fff' }}>
                                                            <Plus size={13} />
                                                        </button>
                                                    </div>
                                                ))
                                            ) : (
                                                inventoryList.map((lot, idx) => (
                                                    <div key={lot.id}
                                                        className="rounded-lg px-3 py-2 flex items-center justify-between transition-all"
                                                        style={{
                                                            background: lot.isPacked ? 'var(--admin-bg)' : (idx % 2 === 0 ? 'var(--admin-surface)' : 'var(--admin-bg)'),
                                                            border: `1px solid ${lot.isPacked ? 'var(--admin-border)' : 'var(--admin-border)'}`,
                                                            opacity: lot.isPacked ? 0.45 : 1,
                                                            pointerEvents: lot.isPacked ? 'none' : 'auto',
                                                        }}>
                                                        <div className="min-w-0 flex-1">
                                                            {/* 1행: LOT번호 */}
                                                            <span className="font-mono text-xs font-extrabold" style={{ color: 'var(--theme-primary)' }}>
                                                                {lot.lotNo}
                                                            </span>
                                                            {/* 2행: 위치 + 재고량 */}
                                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                                <span className="text-[9px]" style={{ color: 'var(--admin-text-sub)' }}>{lot.location}</span>
                                                                <span className="text-[9px]" style={{ color: 'var(--admin-text-sub)' }}>|</span>
                                                                <span className="text-[10px] font-bold" style={{ color: 'var(--admin-text)' }}>{lot.meters}m</span>
                                                                {lot.isPacked && (
                                                                    <span className="text-[9px] font-bold ml-1" style={{ color: 'var(--theme-primary)' }}>패킹예정</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {/* 원형 버튼: 비활성화 시 체크 아이콘 */}
                                                        <button
                                                            onClick={() => !lot.isPacked && handleAddToPrepared(lot)}
                                                            disabled={lot.isPacked}
                                                            className="flex-shrink-0 flex items-center justify-center rounded-full"
                                                            style={{ width: 26, height: 26, background: lot.isPacked ? 'var(--admin-border)' : 'var(--theme-primary)', color: '#fff', cursor: lot.isPacked ? 'default' : 'pointer' }}>
                                                            {lot.isPacked ? <Check size={13} /> : <Plus size={13} />}
                                                        </button>
                                                    </div>
                                                )))
                                            }
                                            {inventoryList.length === 0 && (
                                                <p className="text-center py-6 text-xs" style={{ color: 'var(--admin-text-sub)' }}>재고 없음</p>
                                            )}
                                        </div>
                                    </div>


                                    {/* ===== 우측: 패킹 예정 리스트 ===== */}
                                    <div className="rounded-xl overflow-hidden flex flex-col"
                                        style={{ border: '1px solid var(--admin-border)', height: '100%' }}>
                                        {/* 헤더: 패킹 버튼 유무와 무관하게 항상 고정 높이 */}
                                        <div className="px-4 flex items-center justify-between flex-shrink-0"
                                            style={{ background: 'var(--admin-surface)', borderBottom: '1px solid var(--admin-border)', height: 40 }}>
                                            <span className="text-xs font-bold" style={{ color: 'var(--admin-text-sub)' }}>패킹 예정 리스트</span>
                                            <button
                                                onClick={handlePack}
                                                className="text-xs font-bold px-3 py-1 rounded-lg transition-all"
                                                style={{
                                                    background: selectedPreparedCount > 0 ? 'var(--theme-primary)' : 'transparent',
                                                    color: selectedPreparedCount > 0 ? '#fff' : 'transparent',
                                                    border: selectedPreparedCount > 0 ? 'none' : '1px solid transparent',
                                                    pointerEvents: selectedPreparedCount > 0 ? 'auto' : 'none',
                                                    minWidth: 80,
                                                }}>
                                                {selectedPreparedCount > 0 ? `패킹 (${selectedPreparedCount}건)` : '　'}
                                            </button>
                                        </div>

                                        <div className="flex-1 overflow-y-auto p-2 space-y-1" style={{ minHeight: 0 }}>
                                            {preparedList.map((lot) => {
                                                const isFabricM = !selectedItem.isProduct && selectedItem.unit === 'm';
                                                return (
                                                    <div key={lot.id}
                                                        className="rounded-lg px-3 py-2.5 flex items-center gap-3"
                                                        style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', minHeight: 60 }}>

                                                        {/* ── 체크박스: 테마 색상, 크게, 세로 가운데 ── */}
                                                        <input type="checkbox" checked={lot.isSelected}
                                                            onChange={() => togglePreparedSelect(lot.id)}
                                                            className="rounded flex-shrink-0"
                                                            style={{ width: 17, height: 17, accentColor: 'var(--theme-primary)', cursor: 'pointer' }} />

                                                        {/* ── 좌측: LOT + 정보 ── */}
                                                        <div className="flex-1 min-w-0">
                                                            {/* 1행: LOT번호 */}
                                                            <div className="flex items-center">
                                                                <span className="font-mono text-sm font-extrabold flex-1 truncate" style={{ color: 'var(--theme-primary)' }}>
                                                                    {lot.lotNo}
                                                                </span>
                                                            </div>

                                                            {/* 2행: 위치 | 패킹예정량 */}
                                                            <div className="flex items-center gap-1.5 mt-1">
                                                                <span className="text-[9px]" style={{ color: 'var(--admin-text-sub)' }}>{lot.location}</span>
                                                                <span className="text-[9px]" style={{ color: 'var(--admin-text-sub)' }}>|</span>
                                                                <span className="text-[9px] font-bold" style={{ color: 'var(--admin-text)' }}>
                                                                    패킹예정 {isFabricM ? `${lot.meters}m` : `1 ${selectedItem.unit}`}
                                                                </span>
                                                            </div>

                                                        </div>

                                                        {/* ── 우측 버튼 영역 ── */}
                                                        <div className="flex flex-row items-center gap-1.5 flex-shrink-0">
                                                            {isFabricM ? (
                                                                /* m 단위: 절단 여부에 따라 분기 */
                                                                (lot as any)._isCut ? (
                                                                    /* 절단 완료 → 스티커 출력 버튼 */
                                                                    <>
                                                                        <button
                                                                            className="text-[9px] font-bold px-3 rounded flex items-center justify-center gap-1"
                                                                            style={{ background: 'var(--theme-primary)', color: '#fff', height: 30 }}
                                                                            onClick={e => {
                                                                                e.stopPropagation();
                                                                                const tempCard: PackingCard = {
                                                                                    id: `sticker-${Date.now()}`,
                                                                                    packingNo: `PKG-${Date.now().toString().slice(-6)}`,
                                                                                    partnerName: selectedItem.partnerName,
                                                                                    itemCount: 1,
                                                                                    items: [lot],
                                                                                    createdAt: new Date().toLocaleDateString('ko-KR'),
                                                                                    confirmerName: '',
                                                                                    confirmerPhone: '',
                                                                                } as any;
                                                                                handleOpenStickerModal(tempCard);
                                                                            }}>
                                                                            ✂️ <Printer size={9} /> 스티커 출력
                                                                        </button>
                                                                        <button
                                                                            className="text-[9px] font-bold px-3 rounded"
                                                                            style={{ background: 'var(--admin-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text-sub)', height: 30 }}
                                                                            onClick={e => {
                                                                                e.stopPropagation();
                                                                                setInventoryList(prev => [{ ...lot, isSelected: false, isPacked: false }, ...prev]);
                                                                                setPreparedList(prev => prev.filter(l => l.id !== lot.id));
                                                                            }}>
                                                                            취소
                                                                        </button>
                                                                    </>
                                                                ) : (
                                                                    /* 절단 전 → 입력창 + 절단 + 취소 한 줄 */
                                                                    <>
                                                                        <input
                                                                            type="number"
                                                                            min={0.1} step={0.1}
                                                                            defaultValue={selectedItem.quantity}
                                                                            className="w-14 text-xs font-bold text-center rounded px-1 py-0.5 outline-none"
                                                                            style={{ border: '1px solid var(--theme-primary)', background: 'var(--admin-bg)', color: 'var(--admin-text)', height: 30 }}
                                                                            onClick={e => e.stopPropagation()}
                                                                            onChange={e => {
                                                                                const val = parseFloat(e.target.value);
                                                                                if (!isNaN(val)) {
                                                                                    setPreparedList(prev => prev.map(
                                                                                        l => l.id === lot.id ? { ...l, _cutValue: val } as any : l
                                                                                    ));
                                                                                }
                                                                            }}
                                                                        />
                                                                        <span className="text-[9px] flex-shrink-0" style={{ color: 'var(--admin-text-sub)' }}>m</span>
                                                                        <button
                                                                            className="text-[9px] font-bold px-2 rounded flex-shrink-0"
                                                                            style={{ background: '#fef3c7', color: '#b45309', border: '1px solid #fcd34d', height: 30 }}
                                                                            onClick={e => {
                                                                                e.stopPropagation();
                                                                                const cutVal = parseFloat((lot as any)._cutValue ?? selectedItem.quantity);
                                                                                if (isNaN(cutVal) || cutVal <= 0) return;
                                                                                const remain = parseFloat((lot.meters - cutVal).toFixed(2));
                                                                                // 절단된 미터로 업데이트 + _isCut 플래그
                                                                                setPreparedList(prev => prev.map(
                                                                                    l => l.id === lot.id ? { ...l, meters: cutVal, _isCut: true } as any : l
                                                                                ));
                                                                                // 좌측 비활성 로트의 재고량을 잔여량으로 업데이트
                                                                                setInventoryList(prev => prev.map(l =>
                                                                                    l.id === lot.id ? { ...l, meters: remain >= 0 ? remain : 0 } : l
                                                                                ));
                                                                                // 잔여분이 있으면 별도 활성 재고로도 추가 (선택사항)
                                                                                // if (remain > 0) { ... }
                                                                            }}>
                                                                            절단
                                                                        </button>
                                                                        <button
                                                                            className="text-[9px] font-bold px-2 rounded"
                                                                            style={{ background: 'var(--admin-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text-sub)', height: 30 }}
                                                                            onClick={e => {
                                                                                e.stopPropagation();
                                                                                setInventoryList(prev => [{ ...lot, isSelected: false, isPacked: false }, ...prev]);
                                                                                setPreparedList(prev => prev.filter(l => l.id !== lot.id));
                                                                            }}>
                                                                            취소
                                                                        </button>
                                                                    </>
                                                                )
                                                            ) : (
                                                                /* m 단위 아님 → 스티커 출력 + 취소 */
                                                                <>
                                                                    <button
                                                                        className="text-[9px] font-bold px-3 rounded flex items-center justify-center gap-0.5"
                                                                        style={{ background: 'var(--theme-primary)', color: '#fff', height: 30 }}
                                                                        onClick={e => {
                                                                            e.stopPropagation();
                                                                            const tempCard: PackingCard = {
                                                                                id: `sticker-${Date.now()}`,
                                                                                packingNo: `PKG-${Date.now().toString().slice(-6)}`,
                                                                                partnerName: selectedItem.partnerName,
                                                                                itemCount: 1,
                                                                                items: [lot],
                                                                                createdAt: new Date().toLocaleDateString('ko-KR'),
                                                                                confirmerName: '',
                                                                                confirmerPhone: '',
                                                                            } as any;
                                                                            handleOpenStickerModal(tempCard);
                                                                        }}>
                                                                        <Printer size={9} /> 스티커 출력
                                                                    </button>
                                                                    <button
                                                                        className="text-[9px] font-bold px-3 rounded"
                                                                        style={{ background: 'var(--admin-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text-sub)', height: 30 }}
                                                                        onClick={e => {
                                                                            e.stopPropagation();
                                                                            setInventoryList(prev => [{ ...lot, isSelected: false, isPacked: false }, ...prev]);
                                                                            setPreparedList(prev => prev.filter(l => l.id !== lot.id));
                                                                        }}>
                                                                        취소
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            {preparedList.length === 0 && (
                                                <p className="text-center py-6 text-xs" style={{ color: 'var(--admin-text-sub)' }}>재고를 추가하세요</p>
                                            )}
                                        </div>
                                    </div>{/* END 패킹예정 패널 */}

                                </div>{/* END grid grid-cols-2 */}

                                {/* 하단: 패킹완료 리스트 */}

                                {packingCards.length > 0 && (
                                    <div className="px-4 pb-4">
                                        <p className="text-xs font-bold mb-2" style={{ color: 'var(--admin-text-sub)' }}>패킹완료 리스트</p>
                                        <div className="space-y-1.5">
                                        {packingCards.map(card => {
                                            const isExpanded = selectedPackedCardId === card.id;
                                            return (
                                                <div key={card.id}>
                                                    {/* 카드 행: 클릭으로 토글 */}
                                                    <div
                                                        className="rounded-xl px-4 py-2.5 flex items-center justify-between cursor-pointer transition-all"
                                                        style={{
                                                            background: isExpanded ? 'var(--theme-primary-bg)' : 'var(--admin-surface)',
                                                            border: `1px solid ${isExpanded ? 'var(--theme-primary)' : 'var(--admin-border)'}`,
                                                        }}
                                                        onClick={() => setSelectedPackedCardId(prev => prev === card.id ? null : card.id)}>
                                                        <div className="flex items-center gap-2">
                                                            {/* 토글 화살표 */}
                                                            <span className="text-[10px] font-bold"
                                                                style={{ color: 'var(--theme-primary)', display: 'inline-block', transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                                                                ▶
                                                            </span>
                                                            <div>
                                                                {/* 1행: PKG번호 + 운송장번호 (같은 높이, 같은 크기) */}
                                                                <div className="flex items-baseline gap-2">
                                                                    <p className="font-bold text-sm" style={{ color: 'var(--admin-text)' }}>{card.packingNo}</p>
                                                                    {card.trackingNo ? (
                                                                        <span className="flex items-center gap-1">
                                                                            <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded"
                                                                                style={{ background: '#dcfce7', color: '#16a34a', whiteSpace: 'nowrap' }}>
                                                                                운송장번호
                                                                            </span>
                                                                            <span className="font-bold text-sm" style={{ color: '#16a34a' }}>{card.trackingNo}</span>
                                                                        </span>
                                                                    ) : null}
                                                                </div>
                                                                {/* 2행: 건수 | 날짜 + 미입력 안내 */}
                                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                                    <p className="text-[10px]" style={{ color: 'var(--admin-text-sub)' }}>{card.itemCount}건 | {card.createdAt}</p>
                                                                    {!card.trackingNo && (
                                                                        <span className="text-[9px]" style={{ color: 'var(--admin-text-sub)' }}>송장 미입력</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                                                            <button onClick={() => handlePrintSticker(card)}
                                                                className="text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1"
                                                                style={{ background: 'var(--theme-primary)', color: '#fff' }}>
                                                                <Printer size={12} /> 패킹스티커 출력
                                                            </button>
                                                            <button onClick={() => handleOpenStickerModal(card)}
                                                                className="text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1"
                                                                style={{ background: 'var(--admin-bg)', border: '1px solid var(--theme-primary)', color: 'var(--theme-primary)' }}>
                                                                <ScanLine size={12} /> 송장확인
                                                            </button>
                                                            <button onClick={() => handlePackCancel(card.id)}
                                                                className="text-xs font-bold px-3 py-1.5 rounded-lg"
                                                                style={{ background: 'var(--admin-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text-sub)' }}>
                                                                취소
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* 펼쳐진 LOT 목록 */}
                                                    {isExpanded && (
                                                        <div className="mt-1 pl-4 space-y-1">
                                                            {card.items.map(lot => (
                                                                <div key={lot.id}
                                                                    className="rounded-lg px-3 py-2 flex items-center gap-3"
                                                                    style={{ background: 'var(--theme-primary-bg)', border: '1px solid var(--theme-primary)', minHeight: 48 }}>
                                                                    <div className="flex-1 min-w-0">
                                                                        <span className="font-mono text-xs font-extrabold" style={{ color: 'var(--theme-primary)' }}>
                                                                            {lot.lotNo}
                                                                        </span>
                                                                        <div className="flex items-center gap-1.5 mt-0.5">
                                                                            <span className="text-[9px]" style={{ color: 'var(--admin-text-sub)' }}>{lot.location}</span>
                                                                            <span className="text-[9px]" style={{ color: 'var(--admin-text-sub)' }}>|</span>
                                                                            <span className="text-[9px] font-bold" style={{ color: 'var(--admin-text)' }}>
                                                                                {selectedItem && !selectedItem.isProduct && selectedItem.unit === 'm'
                                                                                    ? `${lot.meters}m`
                                                                                    : `1 ${selectedItem?.unit ?? ''}`}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                    <span className="text-[9px] font-bold px-2 py-1 rounded-full flex-shrink-0"
                                                                        style={{ background: 'var(--theme-primary)', color: '#fff' }}>패킹완료</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                         </div>
                                     </div>
                                 )}
                             </div>
                         </motion.div>
                     </div>
                 )}
             </AnimatePresence>

             {/* ===== 거래처 기준 관리 모달 ===== */}
             {selectedPartner && (() => {
                 const partnerItems = items.filter(it => it.partnerName === selectedPartner);
                 const preparedNames = new Set(preparedList.map(l => l.productName).filter(Boolean));
                 return (
                     <div className="fixed inset-0 z-[999] flex items-center justify-center p-4"
                         style={{ background: 'rgba(0,0,0,0.5)' }}
                         onClick={() => setSelectedPartner(null)}>
                         <motion.div
                             initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
                             className="rounded-2xl overflow-hidden flex flex-col"
                             style={{ background: 'var(--admin-surface)', boxShadow: '0 24px 64px rgba(0,0,0,0.3)', width: 860, height: 640, flexShrink: 0 }}
                             onClick={e => e.stopPropagation()}>
                             <div className="px-6 py-4 flex items-center justify-between flex-shrink-0"
                                 style={{ background: 'var(--theme-primary)', color: '#fff' }}>
                                 <div>
                                     <p className="font-extrabold text-base">{selectedPartner}</p>
                                     <p className="text-xs opacity-80 mt-0.5">총 출고 리스트 {partnerItems.length}건</p>
                                 </div>
                                 <button onClick={() => setSelectedPartner(null)}
                                     className="rounded-full p-1.5" style={{ background: 'rgba(255,255,255,0.2)' }}>
                                     <X size={16} />
                                 </button>
                             </div>
                             <div className="grid grid-cols-2" style={{ height: 440, overflow: 'hidden' }}>
                                 <div className="flex flex-col border-r" style={{ borderColor: 'var(--admin-border)', height: '100%' }}>
                                     <div className="px-4 py-2 flex-shrink-0 flex items-center justify-between"
                                         style={{ borderBottom: '1px solid var(--admin-border)', background: 'var(--admin-bg)' }}>
                                         <span className="text-xs font-bold" style={{ color: 'var(--admin-text)' }}>출고예정 리스트</span>
                                         <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                                             style={{ background: 'var(--theme-primary-bg)', color: 'var(--theme-primary)' }}>총 {partnerItems.length}건</span>
                                     </div>
                                     <div className="flex-1 overflow-y-auto p-3 space-y-2">
                                         {partnerItems.map((it) => {
                                             const inPrepared = preparedNames.has(it.productName);
                                             const isProduct = !it.productName.startsWith('원단');
                                             return (
                                                 <div key={it.id}
                                                     className="rounded-2xl border-2 px-4 py-3"
                                                     style={{
                                                         background: inPrepared ? 'var(--admin-bg)' : 'var(--admin-surface)',
                                                         borderColor: inPrepared ? 'var(--admin-border)' : 'var(--theme-primary)',
                                                         opacity: inPrepared ? 0.45 : 1,
                                                     }}>
                                                     <div className="flex items-center gap-2 flex-wrap">
                                                         <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full flex-shrink-0"
                                                             style={isProduct
                                                                 ? { background: 'var(--theme-primary-bg)', color: 'var(--theme-primary)', border: '1px solid var(--theme-primary)' }
                                                                 : { background: '#dbeafe', color: '#1d4ed8', border: '1px solid #93c5fd' }}>
                                                             {isProduct ? '제품' : '원단'}
                                                         </span>
                                                         <span className="font-extrabold text-sm truncate" style={{ color: inPrepared ? 'var(--admin-text-sub)' : 'var(--admin-text)' }}>{it.productName}</span>
                                                         {it.colorName && (
                                                             <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                                                                 style={{ background: 'var(--admin-bg)', color: 'var(--admin-text-sub)', border: '1px solid var(--admin-border)' }}>
                                                                 {it.colorName}
                                                             </span>
                                                         )}
                                                     </div>
                                                     <div className="flex items-center gap-1.5 mt-1.5 text-xs flex-wrap" style={{ color: 'var(--admin-text-sub)' }}>
                                                         <span className="font-bold" style={{ color: 'var(--admin-text)' }}>{it.partnerName}</span>
                                                         <span>|</span>
                                                         <span className="font-bold" style={{ color: 'var(--theme-primary)' }}>{it.width}</span>
                                                         <span>|</span>
                                                         <span>{it.quantity} {it.unit}</span>
                                                         {it.date && <><span>|</span><span>{it.date}</span></>}
                                                         {inPrepared && (
                                                             <span className="ml-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                                                                 style={{ background: 'var(--theme-primary-bg)', color: 'var(--theme-primary)' }}>패킹준비완료</span>
                                                         )}
                                                     </div>
                                                 </div>
                                             );
                                         })}
                                     </div>
                                 </div>
                                 {/* ===== 우측: 패킹예정 리스트 ===== */}
                                 <div className="flex flex-col" style={{ height: '100%' }}>
                                     <div className="px-4 py-2 flex-shrink-0 flex items-center justify-between"
                                         style={{ borderBottom: '1px solid var(--admin-border)', background: 'var(--admin-bg)' }}>
                                         <span className="text-xs font-bold" style={{ color: 'var(--admin-text)' }}>패킹예정 리스트</span>
                                         <div className="flex items-center gap-2">
                                             {preparedList.filter(l => l.isSelected).length > 0 && (
                                                 <button
                                                     onClick={() => {
                                                         const selected = preparedList.filter(l => l.isSelected);
                                                         const card: PackingCard = {
                                                             id: `packing-${Date.now()}`,
                                                             packingNo: `PKG-${String(Date.now()).slice(-6)}`,
                                                             partnerName: selectedPartner || '',
                                                             itemCount: selected.length,
                                                             items: selected,
                                                             createdAt: new Date().toLocaleString('ko-KR'),
                                                             confirmerName: '김관리',
                                                             confirmerPhone: '010-1234-5678',
                                                         };
                                                         setPackingCards(prev => [...prev, card]);
                                                         setPreparedList(prev => prev.filter(l => !l.isSelected));
                                                     }}
                                                     className="text-[10px] font-extrabold px-2.5 py-1 rounded-lg flex items-center gap-1"
                                                     style={{ background: 'var(--theme-primary)', color: '#fff' }}>
                                                     <Package size={10} />패킹 ({preparedList.filter(l => l.isSelected).length})
                                                 </button>
                                             )}
                                             <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                                                 style={{ background: 'var(--theme-primary-bg)', color: 'var(--theme-primary)' }}>{preparedList.length}건</span>
                                         </div>
                                     </div>
                                     <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
                                         {preparedList.length === 0 ? (
                                             <p className="text-center py-10 text-xs" style={{ color: 'var(--admin-text-sub)' }}>패킹 준비된 항목 없음</p>
                                         ) : (
                                             preparedList.map((lot, idx) => (
                                                 <div key={lot.id} className="rounded-lg px-3 py-2.5 flex items-center gap-2"
                                                     style={{ background: lot.isSelected ? 'var(--theme-primary-bg)' : (idx % 2 === 0 ? 'var(--admin-surface)' : 'var(--admin-bg)'), border: `1px solid ${lot.isSelected ? 'var(--theme-primary)' : 'var(--admin-border)'}` }}>
                                                     {/* 선택박스 */}
                                                     <input type="checkbox" checked={!!lot.isSelected}
                                                         onChange={() => togglePreparedSelect(lot.id)}
                                                         className="flex-shrink-0 w-3.5 h-3.5 rounded cursor-pointer"
                                                         style={{ accentColor: 'var(--theme-primary)' }} />
                                                     <div className="min-w-0 flex-1">
                                                         <span className="font-mono text-xs font-extrabold" style={{ color: 'var(--theme-primary)' }}>{lot.lotNo}</span>
                                                         <div className="flex items-center gap-1.5 mt-0.5">
                                                             <span className="text-[9px]" style={{ color: 'var(--admin-text-sub)' }}>{(lot as any).productName || '-'}</span>
                                                             <span className="text-[9px]" style={{ color: 'var(--admin-text-sub)' }}>|</span>
                                                             <span className="text-[10px] font-bold" style={{ color: 'var(--admin-text)' }}>{lot.meters}m</span>
                                                         </div>
                                                     </div>
                                                     <span className="text-[9px] font-bold px-2 py-1 rounded-full flex-shrink-0"
                                                         style={{ background: 'var(--theme-primary-bg)', color: 'var(--theme-primary)' }}>패킹예정</span>
                                                 </div>
                                             ))
                                         )}
                                     </div>
                                 </div>
                             </div>

                             {/* ===== 패킹완료 리스트 (하단) ===== */}
                             {packingCards.filter(c => c.partnerName === selectedPartner).length > 0 && (
                                 <div className="border-t flex-shrink-0 px-4 pb-4 pt-3 overflow-y-auto"
                                     style={{ borderColor: 'var(--admin-border)', background: 'var(--admin-bg)', maxHeight: 240 }}>
                                     <p className="text-xs font-bold mb-2" style={{ color: 'var(--admin-text-sub)' }}>패킹완료 리스트</p>
                                     <div className="space-y-1.5">
                                         {packingCards.filter(c => c.partnerName === selectedPartner).map(card => {
                                             const isExpanded = selectedPackedCardId === card.id;
                                             return (
                                                 <div key={card.id}>
                                                     <div className="rounded-xl px-4 py-2.5 flex items-center justify-between cursor-pointer transition-all"
                                                         style={{
                                                             background: isExpanded ? 'var(--theme-primary-bg)' : 'var(--admin-surface)',
                                                             border: `1px solid ${isExpanded ? 'var(--theme-primary)' : 'var(--admin-border)'}`,
                                                         }}
                                                         onClick={() => setSelectedPackedCardId(prev => prev === card.id ? null : card.id)}>
                                                         <div className="flex items-center gap-2">
                                                             <span className="text-[10px] font-bold"
                                                                 style={{ color: 'var(--theme-primary)', display: 'inline-block', transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
                                                             <div>
                                                                 <div className="flex items-baseline gap-2">
                                                                     <p className="font-bold text-sm" style={{ color: 'var(--admin-text)' }}>{card.packingNo}</p>
                                                                     {card.trackingNo && (
                                                                         <span className="flex items-center gap-1">
                                                                             <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded"
                                                                                 style={{ background: '#dcfce7', color: '#16a34a', whiteSpace: 'nowrap' }}>운송장번호</span>
                                                                             <span className="font-bold text-sm" style={{ color: '#16a34a' }}>{card.trackingNo}</span>
                                                                         </span>
                                                                     )}
                                                                 </div>
                                                                 <div className="flex items-center gap-1.5 mt-0.5">
                                                                     <p className="text-[10px]" style={{ color: 'var(--admin-text-sub)' }}>{card.itemCount}건 | {card.createdAt}</p>
                                                                     {!card.trackingNo && <span className="text-[9px]" style={{ color: 'var(--admin-text-sub)' }}>송장 미입력</span>}
                                                                 </div>
                                                             </div>
                                                         </div>
                                                         <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                                                             <button onClick={() => handlePrintSticker(card)}
                                                                 className="text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1"
                                                                 style={{ background: 'var(--theme-primary)', color: '#fff' }}>
                                                                 <Printer size={12} /> 패킹스티커 출력
                                                             </button>
                                                             <button onClick={() => handleOpenStickerModal(card)}
                                                                 className="text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1"
                                                                 style={{ background: 'var(--admin-bg)', border: '1px solid var(--theme-primary)', color: 'var(--theme-primary)' }}>
                                                                 <ScanLine size={12} /> 송장확인
                                                             </button>
                                                             <button onClick={() => handlePackCancel(card.id)}
                                                                 className="text-xs font-bold px-3 py-1.5 rounded-lg"
                                                                 style={{ background: 'var(--admin-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text-sub)' }}>
                                                                 취소
                                                             </button>
                                                         </div>
                                                     </div>
                                                     {isExpanded && (
                                                         <div className="mt-1 pl-4 space-y-1">
                                                             {card.items.map(lot => (
                                                                 <div key={lot.id} className="rounded-lg px-3 py-2 flex items-center gap-3"
                                                                     style={{ background: 'var(--theme-primary-bg)', border: '1px solid var(--theme-primary)', minHeight: 48 }}>
                                                                     <div className="flex-1 min-w-0">
                                                                         <span className="font-mono text-xs font-extrabold" style={{ color: 'var(--theme-primary)' }}>{lot.lotNo}</span>
                                                                         <div className="flex items-center gap-1.5 mt-0.5">
                                                                             <span className="text-[9px]" style={{ color: 'var(--admin-text-sub)' }}>{(lot as any).productName || lot.location}</span>
                                                                             <span className="text-[9px]" style={{ color: 'var(--admin-text-sub)' }}>|</span>
                                                                             <span className="text-[9px] font-bold" style={{ color: 'var(--admin-text)' }}>{lot.meters}m</span>
                                                                         </div>
                                                                     </div>
                                                                     <span className="text-[9px] font-bold px-2 py-1 rounded-full flex-shrink-0"
                                                                         style={{ background: 'var(--theme-primary)', color: '#fff' }}>패킹완료</span>
                                                                 </div>
                                                             ))}
                                                         </div>
                                                     )}
                                                 </div>
                                             );
                                         })}
                                     </div>
                                 </div>
                             )}
                         </motion.div>
                     </div>
                 );
             })()}

                {stickerModal && (
                    <StickerPopup
                        modal={stickerModal}
                        partners={partners}
                        onClose={() => setStickerModal(null)}
                        onTrackingChange={val => setStickerModal(prev => prev ? { ...prev, trackingNo: val } : null)}
                        onConfirmTracking={(cardId, trackingNo) => {
                            // 패킹카드에 운송장번호 저장
                            const targetCard = packingCards.find(c => c.id === cardId);
                            setPackingCards(prev => prev.map(c =>
                                c.id === cardId ? { ...c, trackingNo } : c
                            ));
                            // 해당 카드의 아이템들을 출고완료(COMPLETED) 상태로 변경
                            if (targetCard) {
                                const packedPartner = targetCard.partnerName;
                                setItems(prev => prev.map(item => {
                                    const isMatch = item.partnerName === packedPartner &&
                                        targetCard.items.some((lot: any) =>
                                            lot.productName === item.productName ||
                                            lot.lotNo === (item as any).lotNo
                                        );
                                    return isMatch ? { ...item, status: 'COMPLETED' as const, trackingNumber: trackingNo } : item;
                                }));
                            }
                            setStickerModal(null);
                        }}
                    />
                )}

        </div>
    );
};


// ===== 패킹 스티커 팝업 컴포넌트 =====
interface StickerPopupProps {
    modal: { card: PackingCard; trackingNo: string; receiverName: string; receiverPhone: string; receiverAddr: string; };
    partners: any[];
    onClose: () => void;
    onTrackingChange: (val: string) => void;
    onConfirmTracking: (cardId: string, trackingNo: string) => void;
}

const StickerPopup: React.FC<StickerPopupProps> = ({ modal, partners, onClose, onTrackingChange, onConfirmTracking }) => {
    const partnerInfo = partners.find((p: any) => p.partnerName === modal.card.partnerName);
    const partnerAddr = (partnerInfo?.addresses?.[0] as any)?.address || modal.receiverAddr || '-';
    const partnerPhone = (partnerInfo as any)?.managerPhone || (partnerInfo as any)?.ceoPhone || (partnerInfo as any)?.companyPhone || '-';
    const freight = (partnerInfo as any)?.freightInfo;
    // 화물정보: 운송사+지점명, 전화, 주소
    const freightTransporter = freight?.transporter
        ? `${freight.transporter}${freight.branchName ? `-${freight.branchName}` : ''}`
        : `${modal.card.partnerName} 화물`;
    const freightPhone = freight?.phone || partnerPhone;
    const freightAddr = freight?.address || partnerAddr;
    const freightLine = `${freightTransporter} (${freightPhone}) 총 ${modal.card.itemCount}개`;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.65)' }} onClick={onClose}>
            <div className="w-full max-w-3xl rounded-2xl overflow-hidden flex flex-col"
                style={{ background: 'var(--admin-surface)', boxShadow: '0 24px 64px rgba(0,0,0,0.35)', maxHeight: '92vh' }}
                onClick={e => e.stopPropagation()}>
                {/* 헤더 */}
                <div className="px-5 py-3 flex items-center gap-3" style={{ background: 'var(--theme-primary)', color: '#fff' }}>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <Printer size={16} />
                        <span className="font-bold text-sm">패킹 스티커 출력</span>
                        <span className="text-[11px] px-2 py-0.5 rounded-full font-bold"
                            style={{ background: 'rgba(255,255,255,0.2)' }}>{modal.card.packingNo}</span>
                    </div>
                    <div className="flex-1 flex items-center gap-2 px-2 py-1 rounded-lg"
                        style={{ background: 'rgba(255,255,255,0.15)' }}>
                        <ScanLine size={14} className="flex-shrink-0 opacity-80" />
                        <input type="text" value={modal.trackingNo} onChange={e => onTrackingChange(e.target.value)}
                            placeholder="송장번호를 입력하세요"
                            className="flex-1 bg-transparent outline-none text-sm font-mono placeholder:opacity-60"
                            style={{ color: '#fff', minWidth: 0 }} />
                    </div>
                    <button
                        onClick={() => {
                            if (modal.trackingNo.trim()) {
                                onConfirmTracking(modal.card.id, modal.trackingNo.trim());
                            }
                        }}
                        className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-bold flex-shrink-0"
                        style={{
                            background: modal.trackingNo.trim() ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.22)',
                            color: modal.trackingNo.trim() ? 'var(--theme-primary)' : '#fff',
                            border: '1px solid rgba(255,255,255,0.4)',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.35)'}
                        onMouseLeave={e => e.currentTarget.style.background = modal.trackingNo.trim() ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.22)'}>
                        <Printer size={13} /> 송장확인
                    </button>
                    <button onClick={onClose} className="p-1 rounded-lg flex-shrink-0"
                        style={{ background: 'rgba(255,255,255,0.15)' }}><X size={16} /></button>
                </div>
                {/* 본문 */}
                <div className="overflow-y-auto flex-1 p-5 flex flex-col gap-4" style={{ background: 'var(--admin-bg)' }}>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="rounded-xl p-4 flex flex-col justify-between"
                            style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}>
                            <p className="text-[10px] font-bold mb-2" style={{ color: 'var(--admin-text-sub)' }}>발신자</p>
                            <div className="flex items-center gap-3">
                                <div className="rounded-xl flex items-center justify-center flex-shrink-0"
                                    style={{ width: 48, height: 48, background: 'var(--theme-primary)', color: '#fff' }}>
                                    <Box size={24} />
                                </div>
                                <div className="min-w-0">
                                    <p className="font-extrabold text-sm" style={{ color: 'var(--admin-text)' }}>WinteriorFit</p>
                                    <p className="text-[10px] mt-0.5" style={{ color: 'var(--admin-text-sub)' }}>서울특별시 강남구 테헤란로 123</p>
                                    <p className="text-[10px] font-bold mt-0.5" style={{ color: 'var(--admin-text)' }}>
                                        {modal.card.confirmerName}
                                        <span className="font-normal ml-1" style={{ color: 'var(--admin-text-sub)' }}>{modal.card.confirmerPhone}</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="rounded-xl p-4" style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}>
                            <div className="flex items-start justify-between mb-1.5">
                                <p className="text-[10px] font-bold" style={{ color: 'var(--admin-text-sub)' }}>수신자</p>
                                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full flex-shrink-0"
                                    style={{ background: 'var(--theme-primary-bg)', color: 'var(--theme-primary)' }}>
                                    총 {modal.card.itemCount}건
                                </span>
                            </div>
                            <p className="font-extrabold text-sm" style={{ color: 'var(--admin-text)' }}>{modal.card.partnerName}</p>
                            <p className="text-[11px] mt-1" style={{ color: 'var(--admin-text-sub)' }}>{partnerAddr}</p>
                            <p className="text-[11px] font-bold mt-0.5" style={{ color: 'var(--theme-primary)' }}>{partnerPhone}</p>
                        </div>
                    </div>
                    <div className="rounded-xl px-5 py-4 flex items-start gap-4"
                        style={{ background: 'var(--theme-primary-bg)', border: '2px solid var(--theme-primary)' }}>
                        <div className="flex-shrink-0 p-2 rounded-lg" style={{ background: 'var(--theme-primary)', color: '#fff' }}>
                            <Truck size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-bold mb-0.5" style={{ color: 'var(--admin-text-sub)' }}>도착지 (화물 정보)</p>
                            <p className="text-lg font-extrabold tracking-tight truncate" style={{ color: 'var(--theme-primary)' }}>{freightLine}</p>
                            {freightAddr && freightAddr !== '-' && (
                                <p className="text-[11px] mt-1" style={{ color: 'var(--admin-text-sub)' }}>{freightAddr}</p>
                            )}
                        </div>
                    </div>
                    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--admin-border)' }}>
                        <div className="px-4 py-2 flex items-center justify-between"
                            style={{ background: 'var(--theme-primary)', color: '#fff' }}>
                            <span className="text-xs font-bold">패킹 리스트</span>
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                                style={{ background: 'rgba(255,255,255,0.2)' }}>총 {modal.card.itemCount}건</span>
                        </div>
                        <table className="w-full text-xs border-collapse">
                            <thead>
                                <tr style={{ background: 'var(--admin-bg)', borderBottom: '1px solid var(--admin-border)' }}>
                                    {['코드', '품명', '칼라', '규격', '단위', '수량', '비고'].map(h => (
                                        <th key={h} className="px-3 py-2 text-left font-bold" style={{ color: 'var(--admin-text-sub)' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {modal.card.items.map((item: StockLotItem, idx: number) => (
                                    <tr key={item.id}
                                        style={{ background: idx % 2 === 0 ? 'var(--admin-surface)' : 'var(--admin-bg)', borderBottom: '1px solid var(--admin-border)' }}>
                                        <td className="px-3 py-2 font-mono font-bold" style={{ color: 'var(--theme-primary)' }}>{item.lotNo}</td>
                                        <td className="px-3 py-2 font-bold" style={{ color: 'var(--admin-text)' }}>{((item as any).productName || '-')}</td>
                                        <td className="px-3 py-2" style={{ color: 'var(--admin-text-sub)' }}>{(item as any).colorName || '-'}</td>
                                        <td className="px-3 py-2 font-bold" style={{ color: 'var(--theme-primary)' }}>{item.productWidth || '-'}</td>
                                        <td className="px-3 py-2" style={{ color: 'var(--admin-text-sub)' }}>{(item as any).unit || '-'}</td>
                                        <td className="px-3 py-2 font-bold text-right" style={{ color: 'var(--admin-text)' }}>{item.meters || item.quantity}</td>
                                        <td className="px-3 py-2" style={{ color: 'var(--admin-text-sub)' }}>-</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StockOutManagement;
