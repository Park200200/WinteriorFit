
import React, { useState, useMemo, useEffect } from 'react';
import {
    Search, BookOpen, Calendar, ChevronRight,
    ArrowUpRight, ArrowDownRight, CreditCard, Banknote,
    Coins, Wallet, TrendingUp, AlertCircle, CheckCircle2,
    Filter, Download, Printer
} from 'lucide-react';
import { usePartnerContext } from '../PartnerContext';
import { useProductContext } from './ProductContext';
import { useAdminTheme } from './theme/AdminThemeContext';

// --- Types ---
type TransactionType = 'SALES' | 'DEPOSIT';
type DepositType = 'CASH' | 'CARD' | 'TRANSFER' | 'DC' | 'ETC';

interface LedgerItem {
    id: string;
    date: string; // YYYY-MM-DD
    type: TransactionType;
    partnerId: string;
    partnerName: string;
    // Sales specific
    productName?: string;
    colorName?: string;
    width?: string;
    quantityRoll?: number;
    quantityMeter?: number;
    unitPrice?: number;
    cuttingFee?: number;
    // Deposit specific
    depositType?: DepositType;
    // Common
    amount: number;
    memo?: string;
}

// --- Mock Data Generator ---
const generateMockLedger = (partners: any[], productList: any[]): LedgerItem[] => {
    const data: LedgerItem[] = [];
    const today = new Date();

    partners.forEach(partner => {
        for (let i = 0; i < 20; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - Math.floor(Math.random() * 150));
            const dateStr = date.toISOString().split('T')[0];

            const isSales = Math.random() > 0.3;

            if (isSales) {
                const randomProd = productList.length > 0
                    ? productList[Math.floor(Math.random() * productList.length)]
                    : { productName: '콤비 > 비너스', colorName: '화이트', width: '2800mm', category: 'ROLL' };

                const qtyRoll = Math.floor(Math.random() * 10) + 1;
                const qtyMeter = Math.floor(Math.random() * 50);
                const unitPrice = 150000;
                const cutFee = Math.random() > 0.5 ? 5000 : 0;
                const amount = (qtyRoll * unitPrice) + cutFee;

                data.push({
                    id: `led-${partner.id}-${i}`,
                    date: dateStr,
                    type: 'SALES',
                    partnerId: partner.id,
                    partnerName: partner.partnerName,
                    productName: randomProd.productName,
                    colorName: randomProd.colorName,
                    width: randomProd.width,
                    quantityRoll: qtyRoll,
                    quantityMeter: qtyMeter,
                    unitPrice: unitPrice,
                    cuttingFee: cutFee,
                    amount: amount,
                    memo: ''
                });
            } else {
                const types: DepositType[] = ['CASH', 'CARD', 'TRANSFER', 'DC', 'ETC'];
                const dType = types[Math.floor(Math.random() * types.length)];

                data.push({
                    id: `led-${partner.id}-${i}`,
                    date: dateStr,
                    type: 'DEPOSIT',
                    partnerId: partner.id,
                    partnerName: partner.partnerName,
                    amount: Math.floor(Math.random() * 100) * 10000,
                    depositType: dType,
                    memo: '정기 결제'
                });
            }
        }
    });

    return data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

const TransactionLedger: React.FC = () => {
    const { partners } = usePartnerContext();
    const { nodes } = useProductContext();
    const { theme } = useAdminTheme();

    // --- Derived Product Data (Real) ---
    const validProducts = useMemo(() => {
        const allNodes = Object.values(nodes);
        const items: { productName: string, colorName: string, width: string, category: string }[] = [];

        const products = allNodes.filter((n: any) => n.attributes?.nodeType === 'product');

        products.forEach((prod: any) => {
            const costListRaw = prod.attributes?.cost_fabric_list;
            let costItems: any[] = [];
            if (costListRaw) {
                try {
                    const parsed = JSON.parse(costListRaw);
                    if (Array.isArray(parsed) && parsed.length > 0) costItems = parsed;
                } catch (e) { }
            }
            if (costItems.length === 0) return;

            const parentNode = prod.parentId ? nodes[prod.parentId] : null;
            const displayProductName = parentNode ? `${parentNode.label} > ${prod.label}` : prod.label;

            if (prod.childrenIds && prod.childrenIds.length > 0) {
                prod.childrenIds.forEach((childId: string) => {
                    const colorNode = nodes[childId];
                    if (!colorNode) return;

                    const widthsRaw = colorNode.attributes?.availableWidths;
                    let availableWidthIds: string[] = [];
                    if (widthsRaw) {
                        try {
                            const parsed = JSON.parse(widthsRaw);
                            if (Array.isArray(parsed) && parsed.length > 0) availableWidthIds = parsed;
                        } catch (e) { }
                    }

                    if (availableWidthIds.length > 0) {
                        availableWidthIds.forEach(widthId => {
                            const costItem = costItems.find((c: any) => c.id === widthId);
                            const widthLabel = costItem
                                ? (costItem.category === 'SLAT' ? `${costItem.width} (${costItem.height || '-'})` : costItem.width)
                                : `Size-${widthId}`;
                            const category = costItem?.category === 'SLAT' ? 'SLAT' : 'ROLL';

                            items.push({
                                productName: displayProductName,
                                colorName: colorNode.label,
                                width: widthLabel,
                                category: category
                            });
                        });
                    }
                });
            }
        });
        return items;
    }, [nodes]);

    // --- State ---
    const [ledgerData, setLedgerData] = useState<LedgerItem[]>([]);

    useEffect(() => {
        if (partners.length > 0) {
            setLedgerData(generateMockLedger(partners, validProducts));
        }
    }, [partners, validProducts]);
    const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
    const [partnerSearch, setPartnerSearch] = useState('');

    const [selectedMonths, setSelectedMonths] = useState<string[]>([]);

    const availableMonths = useMemo(() => {
        const months = [];
        const today = new Date();
        for (let i = 0; i < 5; i++) {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            months.push(monthStr);
        }
        return months;
    }, []);

    useMemo(() => {
        if (selectedMonths.length === 0) {
            setSelectedMonths(availableMonths);
        }
    }, [availableMonths]);

    const globalStats = useMemo(() => {
        const today = new Date();
        const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
        const prevDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const prevMonthStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

        let currentSales = 0;
        let prevSales = 0;

        const partnerStatsMap: Record<string, { currentSales: number, balance: number }> = {};

        partners.forEach(p => {
            partnerStatsMap[p.id] = { currentSales: 0, balance: Math.floor(Math.random() * 5000000) };
        });

        ledgerData.forEach(item => {
            const monthStr = item.date.substring(0, 7);
            if (!partnerStatsMap[item.partnerId]) return;

            if (item.type === 'SALES') {
                if (monthStr === currentMonthStr) {
                    currentSales += item.amount;
                    partnerStatsMap[item.partnerId].currentSales += item.amount;
                }
                if (monthStr === prevMonthStr) prevSales += item.amount;
                partnerStatsMap[item.partnerId].balance += item.amount;
            } else {
                partnerStatsMap[item.partnerId].balance -= item.amount;
            }
        });

        const totalReceivables = Object.values(partnerStatsMap).reduce((acc, curr) => acc + curr.balance, 0);

        const topSales = Object.entries(partnerStatsMap)
            .map(([pid, stats]) => ({ name: partners.find(p => p.id === pid)?.partnerName || 'Unknown', value: stats.currentSales }))
            .sort((a, b) => b.value - a.value).slice(0, 3);

        const topReceivables = Object.entries(partnerStatsMap)
            .map(([pid, stats]) => ({ name: partners.find(p => p.id === pid)?.partnerName || 'Unknown', balance: stats.balance }))
            .sort((a, b) => b.balance - a.balance).slice(0, 3);

        return { totalPartners: partners.length, currentSales, prevSales, totalReceivables, topSales, topReceivables, partnerStatsMap };
    }, [partners, ledgerData]);

    const filteredPartners = useMemo(() => {
        if (!partnerSearch) return partners;
        return partners.filter(p => p.partnerName.includes(partnerSearch));
    }, [partners, partnerSearch]);

    const partnerLedger = useMemo(() => {
        if (!selectedPartnerId) return [];
        let items = ledgerData.filter(d => d.partnerId === selectedPartnerId);
        items = items.filter(d => selectedMonths.includes(d.date.substring(0, 7)));
        items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        const initialBalance = globalStats.partnerStatsMap[selectedPartnerId]?.balance || 0;
        const netChange = items.reduce((acc, item) => acc + (item.type === 'SALES' ? item.amount : -item.amount), 0);
        let currentItemBalance = initialBalance - netChange;

        return items.map(item => {
            if (item.type === 'SALES') currentItemBalance += item.amount;
            else currentItemBalance -= item.amount;
            return { ...item, balance: currentItemBalance };
        }).reverse();
    }, [selectedPartnerId, ledgerData, selectedMonths, globalStats]);

    const toggleMonth = (month: string) => {
        setSelectedMonths(prev =>
            prev.includes(month) ? prev.filter(m => m !== month) : [...prev, month]
        );
    };

    // 입금 유형 뱃지 — 디자인 시스템 변수 적용
    const getDepositBadge = (type?: DepositType) => {
        switch (type) {
            case 'CASH':     return <span className="px-2 py-0.5 rounded text-[10px] font-bold" style={{ background: 'var(--color-success-bg)', color: 'var(--color-success)', border: '1px solid var(--color-success)' }}>현금</span>;
            case 'CARD':     return <span className="px-2 py-0.5 rounded text-[10px] font-bold" style={{ background: 'var(--color-info-bg)', color: 'var(--color-info)', border: '1px solid var(--color-info)' }}>카드</span>;
            case 'TRANSFER': return <span className="px-2 py-0.5 rounded text-[10px] font-bold" style={{ background: 'var(--theme-primary-bg)', color: 'var(--theme-primary)', border: '1px solid var(--theme-primary)' }}>계좌</span>;
            case 'DC':       return <span className="px-2 py-0.5 rounded text-[10px] font-bold" style={{ background: 'var(--color-danger-bg)', color: 'var(--color-danger)', border: '1px solid var(--color-danger)' }}>DC</span>;
            default:         return <span className="px-2 py-0.5 rounded text-[10px] font-bold" style={{ background: 'var(--admin-bg)', color: 'var(--admin-text-sub)', border: '1px solid var(--admin-border)' }}>기타</span>;
        }
    };

    return (
        <div className="flex flex-col h-full w-full overflow-hidden font-sans relative" style={{ background: 'var(--admin-bg)', color: 'var(--admin-text)', fontSize: 'var(--theme-font-base)' }}>

            {/* 1. Header */}
            <div className="flex-shrink-0 px-8 py-4 shadow-sm z-20 flex justify-between items-center h-20" style={{ background: 'var(--admin-surface)', borderBottom: '1px solid var(--admin-border)' }}>
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--admin-text)' }}>
                        <BookOpen style={{ color: 'var(--theme-primary)' }} /> 거래원장
                    </h1>
                </div>

                {/* Search */}
                <div className="relative w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={18} style={{ color: 'var(--admin-text-sub)' }} />
                    <input
                        type="text"
                        placeholder="거래처 검색..."
                        value={partnerSearch}
                        onChange={(e) => setPartnerSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-xl text-sm font-medium outline-none transition-all"
                        style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}
                        onFocus={e => { e.currentTarget.style.borderColor = 'var(--theme-primary)'; e.currentTarget.style.background = 'var(--admin-surface)'; }}
                        onBlur={e => { e.currentTarget.style.borderColor = 'var(--admin-border)'; e.currentTarget.style.background = 'var(--admin-input-bg)'; }}
                    />
                </div>
            </div>

            <div className="flex-1 flex flex-col overflow-hidden">

                {/* 2. Dashboard Stats */}
                <div className="flex-shrink-0 px-8 py-5 border-b" style={{ background: 'var(--admin-bg)', borderColor: 'var(--admin-border)' }}>
                    <div className="grid grid-cols-12 gap-4 h-32">

                        {/* 등록 거래처 */}
                        <div className="col-span-2 rounded-2xl p-4 shadow-sm flex flex-col justify-between" style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}>
                            <div className="flex items-center gap-2 text-xs font-bold uppercase" style={{ color: 'var(--admin-text-sub)' }}><CheckCircle2 size={14} /> 등록 거래처</div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-3xl font-extrabold" style={{ color: 'var(--admin-text)' }}>{globalStats.totalPartners}</span>
                                <span className="text-sm" style={{ color: 'var(--admin-text-sub)' }}>개사</span>
                            </div>
                        </div>

                        {/* 매출 현황 */}
                        <div className="col-span-3 rounded-2xl p-4 shadow-sm flex flex-col justify-between" style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}>
                            <div className="flex items-center gap-2 text-xs font-bold uppercase" style={{ color: 'var(--theme-primary)' }}><TrendingUp size={14} /> 매출 현황</div>
                            <div className="space-y-1">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs" style={{ color: 'var(--admin-text-sub)' }}>당월매출</span>
                                    <span className="text-lg font-bold" style={{ color: 'var(--admin-text)' }}>{globalStats.currentSales.toLocaleString()}원</span>
                                </div>
                                <div className="w-full h-px" style={{ background: 'var(--admin-border)' }} />
                                <div className="flex justify-between items-center">
                                    <span className="text-xs" style={{ color: 'var(--admin-text-sub)' }}>전월매출</span>
                                    <span className="text-sm font-medium" style={{ color: 'var(--admin-text-sub)' }}>{globalStats.prevSales.toLocaleString()}원</span>
                                </div>
                            </div>
                        </div>

                        {/* 미수 잔액 */}
                        <div className="col-span-3 rounded-2xl p-4 shadow-sm flex flex-col justify-between" style={{ background: 'var(--admin-surface)', border: `1px solid var(--color-danger)` }}>
                            <div className="flex items-center gap-2 text-xs font-bold uppercase" style={{ color: 'var(--color-danger)' }}><AlertCircle size={14} /> 미수 잔액</div>
                            <div>
                                <div className="flex items-baseline gap-1 justify-end">
                                    <span className="text-3xl font-extrabold" style={{ color: 'var(--color-danger)' }}>{globalStats.totalReceivables.toLocaleString()}</span>
                                    <span className="text-sm" style={{ color: 'var(--color-danger)' }}>원</span>
                                </div>
                                <p className="text-[10px] text-right mt-1" style={{ color: 'var(--admin-text-sub)' }}>전체 거래처 합계</p>
                            </div>
                        </div>

                        {/* 매출 TOP 3 */}
                        <div className="col-span-2 rounded-2xl p-3 shadow-sm overflow-hidden" style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}>
                            <div className="text-[10px] font-bold uppercase mb-2 flex items-center gap-1" style={{ color: 'var(--admin-text-sub)' }}><ArrowUpRight size={12} /> 매출 TOP 3 (당월)</div>
                            <div className="space-y-2">
                                {globalStats.topSales.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center text-xs">
                                        <div className="flex items-center gap-2">
                                            <span className="w-4 h-4 rounded flex items-center justify-center text-[9px] font-bold text-white"
                                                style={{ background: idx === 0 ? '#f59e0b' : idx === 1 ? 'var(--admin-text-sub)' : '#f97316' }}>
                                                {idx + 1}
                                            </span>
                                            <span className="truncate max-w-[70px] font-bold" style={{ color: 'var(--admin-text)' }}>{item.name}</span>
                                        </div>
                                        <span className="font-bold" style={{ color: 'var(--theme-primary)' }}>{Math.round(item.value / 10000).toLocaleString()}만</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 미수 TOP 3 */}
                        <div className="col-span-2 rounded-2xl p-3 shadow-sm overflow-hidden" style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}>
                            <div className="text-[10px] font-bold uppercase mb-2 flex items-center gap-1" style={{ color: 'var(--admin-text-sub)' }}><ArrowDownRight size={12} /> 미수 TOP 3</div>
                            <div className="space-y-2">
                                {globalStats.topReceivables.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center text-xs">
                                        <div className="flex items-center gap-2">
                                            <span className="w-4 h-4 rounded flex items-center justify-center text-[9px] font-bold text-white"
                                                style={{ background: 'var(--color-danger)', opacity: idx === 0 ? 1 : idx === 1 ? 0.75 : 0.5 }}>
                                                {idx + 1}
                                            </span>
                                            <span className="truncate max-w-[70px] font-bold" style={{ color: 'var(--admin-text)' }}>{item.name}</span>
                                        </div>
                                        <span className="font-bold" style={{ color: 'var(--color-danger)' }}>{Math.round(item.balance / 10000).toLocaleString()}만</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>

                {/* 3. Main Split View */}
                <div className="flex-1 flex overflow-hidden">

                    {/* Left: Partner List */}
                    <div className="w-[320px] flex flex-col z-10" style={{ background: 'var(--admin-surface)', borderRight: '1px solid var(--admin-border)' }}>
                        <div className="h-14 px-4 flex justify-between items-center shrink-0" style={{ background: 'var(--admin-grid-header)', borderBottom: '1px solid var(--admin-border)' }}>
                            <span className="text-xs font-bold" style={{ color: 'var(--admin-text-sub)' }}>거래처 목록</span>
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'var(--theme-primary-bg)', color: 'var(--theme-primary)' }}>{filteredPartners.length}개</span>
                        </div>
                        <div className="flex-1 overflow-y-auto scrollbar-hide">
                            {filteredPartners.map(partner => {
                                const stats = globalStats.partnerStatsMap[partner.id] || { currentSales: 0, balance: 0 };
                                const isSelected = selectedPartnerId === partner.id;
                                return (
                                    <button
                                        key={partner.id}
                                        onClick={() => setSelectedPartnerId(partner.id)}
                                        className="w-full text-left px-4 py-4 transition-colors flex justify-between items-center"
                                        style={isSelected
                                            ? { borderLeft: '3px solid var(--theme-primary)', background: 'var(--theme-primary-bg)', borderBottom: '1px solid var(--admin-border)' }
                                            : { borderLeft: '3px solid transparent', borderBottom: '1px solid var(--admin-border)' }}
                                        onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--admin-list-hover)'; }}
                                        onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                                    >
                                        <div className="flex-1 min-w-0 pr-3">
                                            <div className="font-bold text-sm truncate" style={{ color: isSelected ? 'var(--theme-primary)' : 'var(--admin-text)' }}>{partner.partnerName}</div>
                                            <div className="text-[11px] mt-0.5" style={{ color: 'var(--admin-text-sub)' }}>{partner.ceoName} | {partner.companyPhone}</div>
                                        </div>
                                        <div className="text-right flex flex-col items-end min-w-[80px]">
                                            <div className="text-[10px]" style={{ color: 'var(--admin-text-sub)' }}>당월매출</div>
                                            <div className="text-xs font-bold mb-1" style={{ color: 'var(--theme-primary)' }}>{stats.currentSales.toLocaleString()}</div>
                                            <div className="text-[10px]" style={{ color: 'var(--admin-text-sub)' }}>미수잔액</div>
                                            <div className="text-xs font-bold" style={{ color: 'var(--color-danger)' }}>{stats.balance.toLocaleString()}</div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right: Detail Ledger */}
                    <div className="flex-1 flex flex-col overflow-hidden" style={{ background: 'var(--admin-surface)' }}>
                        {selectedPartnerId ? (
                            <>
                                {/* Toolbar */}
                                <div className="h-14 px-6 flex items-center justify-between shrink-0" style={{ borderBottom: '1px solid var(--admin-border)', background: 'var(--admin-grid-header)' }}>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg font-bold" style={{ color: 'var(--admin-text)' }}>{partners.find(p => p.id === selectedPartnerId)?.partnerName}</span>
                                            <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'var(--admin-bg)', color: 'var(--admin-text-sub)', border: '1px solid var(--admin-border)' }}>거래원장</span>
                                        </div>
                                        <div className="h-6 w-px" style={{ background: 'var(--admin-border)' }} />

                                        {/* Month Filter */}
                                        <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}>
                                            {availableMonths.map(month => (
                                                <button
                                                    key={month}
                                                    onClick={() => toggleMonth(month)}
                                                    className="px-3 py-1 text-xs font-bold rounded-md transition-all flex items-center gap-1"
                                                    style={selectedMonths.includes(month)
                                                        ? { background: 'var(--theme-primary-bg)', color: 'var(--theme-primary)', border: '1px solid var(--theme-primary)' }
                                                        : { background: 'transparent', color: 'var(--admin-text-sub)', border: '1px solid transparent' }}
                                                    onMouseEnter={e => { if (!selectedMonths.includes(month)) e.currentTarget.style.background = 'var(--admin-list-hover)'; }}
                                                    onMouseLeave={e => { if (!selectedMonths.includes(month)) e.currentTarget.style.background = 'transparent'; }}
                                                >
                                                    {selectedMonths.includes(month) && <CheckCircle2 size={10} />}
                                                    {month}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                                            style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', color: 'var(--admin-text-sub)' }}
                                            onMouseEnter={e => { e.currentTarget.style.background = 'var(--admin-list-hover)'; }}
                                            onMouseLeave={e => { e.currentTarget.style.background = 'var(--admin-surface)'; }}
                                        ><Filter size={14} /> 필터</button>
                                        <button
                                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                                            style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', color: 'var(--admin-text-sub)' }}
                                            onMouseEnter={e => { e.currentTarget.style.background = 'var(--admin-list-hover)'; }}
                                            onMouseLeave={e => { e.currentTarget.style.background = 'var(--admin-surface)'; }}
                                        ><Printer size={14} /> 인쇄</button>
                                        <button
                                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-white shadow-sm transition-all"
                                            style={{ background: 'var(--color-success)', border: '1px solid var(--color-success)' }}
                                            onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(1.1)'; }}
                                            onMouseLeave={e => { e.currentTarget.style.filter = ''; }}
                                        ><Download size={14} /> 엑셀</button>
                                    </div>
                                </div>

                                {/* Table */}
                                <div className="flex-1 overflow-auto scrollbar-hide">
                                    <table className="w-full text-sm text-left border-collapse">
                                        <thead className="font-bold text-xs uppercase sticky top-0 z-10 shadow-sm" style={{ background: 'var(--admin-grid-header)', color: 'var(--admin-text-sub)' }}>
                                            <tr>
                                                <th className="px-4 py-3 text-center w-28" style={{ borderBottom: '1px solid var(--admin-border)' }}>일자</th>
                                                <th className="px-4 py-3" style={{ borderBottom: '1px solid var(--admin-border)' }}>내역 (상품 / 입금)</th>
                                                <th className="px-4 py-3 text-right w-32" style={{ borderBottom: '1px solid var(--admin-border)' }}>수량</th>
                                                <th className="px-4 py-3 text-right w-28" style={{ borderBottom: '1px solid var(--admin-border)' }}>단가</th>
                                                <th className="px-4 py-3 text-right w-24" style={{ borderBottom: '1px solid var(--admin-border)' }}>추가(절단)</th>
                                                <th className="px-4 py-3 text-right w-32" style={{ borderBottom: '1px solid var(--admin-border)' }}>금액</th>
                                                <th className="px-4 py-3 text-right w-32" style={{ borderBottom: '1px solid var(--admin-border)', background: 'var(--admin-bg)' }}>잔액</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {partnerLedger.length === 0 ? (
                                                <tr><td colSpan={7} className="text-center py-20" style={{ color: 'var(--admin-text-sub)' }}>선택된 기간의 거래 내역이 없습니다.</td></tr>
                                            ) : (
                                                partnerLedger.map((item) => (
                                                    <tr
                                                        key={item.id}
                                                        style={{
                                                            borderBottom: '1px solid var(--admin-border)',
                                                            background: item.type === 'DEPOSIT' ? 'var(--theme-primary-bg)' : 'transparent'
                                                        }}
                                                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--admin-list-hover)'; }}
                                                        onMouseLeave={e => { e.currentTarget.style.background = item.type === 'DEPOSIT' ? 'var(--theme-primary-bg)' : 'transparent'; }}
                                                    >
                                                        <td className="px-4 py-3 text-center font-mono text-xs" style={{ color: 'var(--admin-text-sub)' }}>{item.date}</td>

                                                        {item.type === 'SALES' ? (
                                                            <>
                                                                <td className="px-4 py-3">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="font-bold" style={{ color: 'var(--admin-text)' }}>{item.productName}</span>
                                                                        <span className="px-2 py-0.5 rounded text-xs font-bold" style={{ background: 'var(--admin-bg)', color: 'var(--admin-text-sub)', border: '1px solid var(--admin-border)' }}>{item.colorName}</span>
                                                                        <span className="font-bold text-xs" style={{ color: 'var(--theme-primary)' }}>{item.width}</span>
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-3 text-right">
                                                                    <span className="font-bold" style={{ color: 'var(--admin-text)' }}>{item.quantityRoll} <span className="text-[10px] font-normal" style={{ color: 'var(--admin-text-sub)' }}>Roll</span></span>
                                                                    <span className="mx-2" style={{ color: 'var(--admin-border)' }}>/</span>
                                                                    <span className="font-bold" style={{ color: 'var(--admin-text-sub)' }}>{item.quantityMeter} <span className="text-[10px] font-normal">m</span></span>
                                                                </td>
                                                                <td className="px-4 py-3 text-right font-mono" style={{ color: 'var(--admin-text-sub)' }}>{item.unitPrice?.toLocaleString()}</td>
                                                                <td className="px-4 py-3 text-right font-mono" style={{ color: 'var(--admin-text-sub)' }}>{item.cuttingFee ? item.cuttingFee.toLocaleString() : '-'}</td>
                                                                <td className="px-4 py-3 text-right font-mono font-bold" style={{ color: 'var(--admin-text)' }}>{item.amount.toLocaleString()}</td>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <td className="px-4 py-3" colSpan={4}>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="font-bold" style={{ color: 'var(--theme-primary)' }}>입금</span>
                                                                        {getDepositBadge(item.depositType)}
                                                                        <span className="text-xs" style={{ color: 'var(--admin-text-sub)' }}>({item.memo})</span>
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-3 text-right font-mono font-bold" style={{ color: 'var(--color-danger)' }}>-{item.amount.toLocaleString()}</td>
                                                            </>
                                                        )}

                                                        <td className="px-4 py-3 text-right font-mono font-bold" style={{ color: 'var(--admin-text)', background: 'var(--admin-bg)' }}>{item.balance?.toLocaleString()}</td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center gap-4" style={{ color: 'var(--admin-text-sub)' }}>
                                <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: 'var(--admin-bg)' }}>
                                    <Search size={32} className="opacity-30" />
                                </div>
                                <p className="font-medium text-sm">좌측 목록에서 거래처를 선택해주세요.</p>
                            </div>
                        )}
                    </div>

                </div>

            </div>
        </div>
    );
};

export default TransactionLedger;
