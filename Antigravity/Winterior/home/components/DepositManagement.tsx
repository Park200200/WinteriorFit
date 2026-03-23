
import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Search, Calendar, ChevronLeft, ChevronRight,
  Plus, CreditCard, Wallet, Building2, Banknote,
  Filter, Download, ArrowUpRight, CheckCircle2, MoreHorizontal,
  X, Save, Clock, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePartnerContext } from '../PartnerContext';
import { useAdminTheme } from './theme/AdminThemeContext';

// --- Types ---
type DepositMethod = 'CASH' | 'CARD' | 'TRANSFER' | 'BILL' | 'DC' | 'ETC'; // Updated Types

interface DepositItem {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  partnerId: string;
  partnerName: string;
  method: DepositMethod;
  amount: number;
  balance: number; // 잔액 (Running Balance)
  note: string;
  manager: string; // 담당자
}

// --- Mock Data Generator ---
const generateMockDeposits = (partners: any[]): DepositItem[] => {
    const data: DepositItem[] = [];
    const today = new Date();
    
    // Generate data for current month + previous months
    for (let i = 0; i < 50; i++) {
        const partner = partners[Math.floor(Math.random() * partners.length)];
        if (!partner) continue;

        const date = new Date(today);
        // Random date within last 60 days
        date.setDate(date.getDate() - Math.floor(Math.random() * 60));
        
        const dateStr = date.toISOString().split('T')[0];
        const timeStr = `${String(Math.floor(Math.random() * 9) + 9).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`;
        
        const methods: DepositMethod[] = ['CASH', 'CARD', 'TRANSFER', 'BILL'];
        const method = methods[Math.floor(Math.random() * methods.length)];
        
        // Random amount between 100,000 and 5,000,000
        const amount = Math.floor(Math.random() * 50) * 100000 + 100000;

        data.push({
            id: `dep-${i}`,
            date: dateStr,
            time: timeStr,
            partnerId: partner.id,
            partnerName: partner.partnerName,
            method: method,
            amount: amount,
            balance: 0, // Calculated later
            note: i % 5 === 0 ? '정기 결제' : '',
            manager: partner.managerName || '담당자'
        });
    }
    
    // Sort desc by date
    return data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

const DepositManagement: React.FC = () => {
  const { partners } = usePartnerContext();
  const { theme } = useAdminTheme();

  // --- State ---
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  
  // Data
  const [depositList, setDepositList] = useState<DepositItem[]>(() => generateMockDeposits(partners));

  // --- Modal State ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [partnerSearch, setPartnerSearch] = useState('');
  const [showPartnerResults, setShowPartnerResults] = useState(false);

  // 구분 커스텀 드롭다운 state
  const [isMethodOpen, setIsMethodOpen] = useState(false);
  const [methodHover, setMethodHover] = useState<string | null>(null);

  // 처리날짜 캘린더 state
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [calViewDate, setCalViewDate] = useState(new Date());
  const [tempDate, setTempDate] = useState('');
  const [dateButtonRect, setDateButtonRect] = useState<{ top: number; left: number; width: number } | null>(null);

  const [modalForm, setModalForm] = useState({
      partnerId: '',
      method: 'CASH' as DepositMethod,
      amount: '',
      date: '',
      note: ''
  });

  const METHOD_OPTIONS: { value: DepositMethod; label: string; color: string; bg: string }[] = [
      { value: 'CASH',     label: '현금', color: 'var(--color-success)', bg: 'var(--color-success-bg)' },
      { value: 'CARD',     label: '카드', color: 'var(--color-info)', bg: 'var(--color-info-bg)' },
      { value: 'TRANSFER', label: '계좌이체', color: 'var(--theme-primary)', bg: 'var(--theme-primary-bg)' },
      { value: 'BILL',     label: '어음', color: 'var(--color-warning)', bg: 'var(--color-warning-bg)' },
      { value: 'DC',       label: '할인', color: 'var(--color-danger)', bg: 'var(--color-danger-bg)' },
      { value: 'ETC',      label: '기타', color: 'var(--admin-text-sub)', bg: 'var(--admin-bg)' },
  ];

  // --- Date Helpers ---
  const formattedDateStr = useMemo(() => {
      const y = currentDate.getFullYear();
      const m = String(currentDate.getMonth() + 1).padStart(2, '0');
      const d = String(currentDate.getDate()).padStart(2, '0');
      return `${y}. ${m}. ${d}`;
  }, [currentDate]);

  const relativeDateStr = useMemo(() => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const target = new Date(currentDate);
      target.setHours(0, 0, 0, 0);
      
      const diffTime = target.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      
      if (diffDays === 0) return "오늘";
      return diffDays > 0 ? `오늘 +${diffDays}` : `오늘 ${diffDays}`;
  }, [currentDate]);

  const queryDateStr = useMemo(() => {
      const y = currentDate.getFullYear();
      const m = String(currentDate.getMonth() + 1).padStart(2, '0');
      const d = String(currentDate.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
  }, [currentDate]);

  // --- Derived Stats (Today) ---
  const dailyStats = useMemo(() => {
      const todayDeposits = depositList.filter(d => d.date === queryDateStr);
      
      const count = todayDeposits.length;
      const uniquePartners = new Set(todayDeposits.map(d => d.partnerId)).size;
      const totalAmount = todayDeposits.reduce((sum, d) => sum + d.amount, 0);

      return { count, uniquePartners, totalAmount };
  }, [depositList, queryDateStr]);

  // --- Partner List Logic (Left Sidebar) ---
  const partnerStats = useMemo(() => {
      // Calculate totals for each partner based on *Current Month* of the selected date
      const currentMonthPrefix = queryDateStr.substring(0, 7); // YYYY-MM
      
      const statsMap: Record<string, { monthDeposit: number, balance: number }> = {};
      
      // Init map
      partners.forEach(p => {
          // Mock initial balance + logic would go here
          // For demo, we use a consistent random seed logic or just random based on ID char code
          const seed = p.id.charCodeAt(0) + p.id.charCodeAt(p.id.length-1);
          statsMap[p.id] = { monthDeposit: 0, balance: seed * 100000 }; 
      });

      depositList.forEach(item => {
          if (!statsMap[item.partnerId]) return;
          
          // Monthly Accumulation
          if (item.date.startsWith(currentMonthPrefix)) {
              statsMap[item.partnerId].monthDeposit += item.amount;
          }
          
          // Balance Logic: 
          // Realistically: Previous Balance + Sales - Deposits = Current Balance
          // Here we just reduce the mock initial balance by deposit amount to show some interaction
          statsMap[item.partnerId].balance -= item.amount; 
      });

      // Filter by search query
      let displayPartners = partners;
      if (searchQuery) {
          displayPartners = partners.filter(p => p.partnerName.includes(searchQuery));
      }

      return { displayPartners, statsMap };
  }, [partners, depositList, queryDateStr, searchQuery]);

  // --- Transaction List Logic (Right Table) ---
  const filteredTransactions = useMemo(() => {
      let filtered = depositList;

      // 1. Filter by Partner (Toggle State)
      if (selectedPartnerId) {
          filtered = filtered.filter(d => d.partnerId === selectedPartnerId);
      } 
      
      // Calculate running balance for display
      const sortedAsc = [...filtered].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      // Simplified balance calculation for display
      let runningBalance = selectedPartnerId 
          ? (partnerStats.statsMap[selectedPartnerId]?.balance || 0) + sortedAsc.reduce((sum, i) => sum + i.amount, 0)
          : 0; 

      const result = sortedAsc.map(item => {
          runningBalance -= item.amount; 
          return { ...item, balance: runningBalance }; 
      });

      // Return Descending (Newest first)
      return result.reverse();
  }, [depositList, selectedPartnerId, partnerStats]);


  // --- Modal Helpers ---
  const handleOpenModal = () => {
      const todayStr = new Date().toISOString().split('T')[0];
      const defaultPartner = selectedPartnerId ? partners.find(p => p.id === selectedPartnerId) : null;

      setPartnerSearch(defaultPartner ? defaultPartner.partnerName : '');
      setModalForm({
          partnerId: defaultPartner ? defaultPartner.id : '',
          method: 'CASH',
          amount: '',
          date: todayStr,
          note: ''
      });
      setShowPartnerResults(false);
      setIsMethodOpen(false);
      setIsDatePickerOpen(false);
      setTempDate(todayStr);
      setCalViewDate(new Date());
      setIsModalOpen(true);
  };

  const filteredModalPartners = useMemo(() => {
      if (!partnerSearch.trim()) return partners;
      return partners.filter(p => p.partnerName.toLowerCase().includes(partnerSearch.toLowerCase()));
  }, [partners, partnerSearch]);

  const handleRegisterDeposit = () => {
      if (!modalForm.partnerId || !modalForm.amount) {
          alert("거래처와 금액을 입력해주세요.");
          return;
      }

      const partner = partners.find(p => p.id === modalForm.partnerId);
      if (!partner) return;

      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      const newDeposit: DepositItem = {
          id: `new-${Date.now()}`,
          date: modalForm.date,
          time: timeStr,
          partnerId: partner.id,
          partnerName: partner.partnerName,
          method: modalForm.method,
          amount: parseInt(modalForm.amount.replace(/,/g, ''), 10),
          balance: 0, // Recalculated in useMemo
          note: modalForm.note,
          manager: '관리자' // Current User
      };

      setDepositList(prev => [newDeposit, ...prev]);
      setIsModalOpen(false);
  };

  const modalSelectedPartnerBalance = useMemo(() => {
      if (!modalForm.partnerId) return 0;
      return partnerStats.statsMap[modalForm.partnerId]?.balance || 0;
  }, [modalForm.partnerId, partnerStats]);

  const modalRecentHistory = useMemo(() => {
      if (!modalForm.partnerId) return [];
      return depositList
          .filter(d => d.partnerId === modalForm.partnerId)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 5);
  }, [modalForm.partnerId, depositList]);

  // Handle click outside for dropdown closure
  useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
          if (!(e.target as HTMLElement).closest('.partner-search-container')) {
              setShowPartnerResults(false);
          }
          if (!(e.target as HTMLElement).closest('.method-dropdown-container')) {
              setIsMethodOpen(false);
          }
          if (!(e.target as HTMLElement).closest('.date-picker-container')) {
              setIsDatePickerOpen(false);
          }
      };
      if (isModalOpen) window.addEventListener('click', handleClickOutside);
      return () => window.removeEventListener('click', handleClickOutside);
  }, [isModalOpen]);


  // --- Handlers ---
  const handlePrevDay = () => {
      const newDate = new Date(currentDate);
      newDate.setDate(currentDate.getDate() - 1);
      setCurrentDate(newDate);
  };
  const handleNextDay = () => {
      const newDate = new Date(currentDate);
      newDate.setDate(currentDate.getDate() + 1);
      setCurrentDate(newDate);
  };
  const handleToday = () => setCurrentDate(new Date());

  const handlePartnerClick = (id: string) => {
      if (selectedPartnerId === id) {
          setSelectedPartnerId(null);
      } else {
          setSelectedPartnerId(id);
      }
  };

  const getMethodBadge = (method: DepositMethod) => {
      switch(method) {
          case 'CASH':     return <span className="px-2 py-0.5 rounded text-[10px] font-bold" style={{ background: 'var(--color-success-bg)', color: 'var(--color-success)', border: '1px solid var(--color-success)' }}>현금</span>;
          case 'CARD':     return <span className="px-2 py-0.5 rounded text-[10px] font-bold" style={{ background: 'var(--color-info-bg)', color: 'var(--color-info)', border: '1px solid var(--color-info)' }}>카드</span>;
          case 'TRANSFER': return <span className="px-2 py-0.5 rounded text-[10px] font-bold" style={{ background: 'var(--theme-primary-bg)', color: 'var(--theme-primary)', border: '1px solid var(--theme-primary)' }}>계좌</span>;
          case 'BILL':     return <span className="px-2 py-0.5 rounded text-[10px] font-bold" style={{ background: 'var(--color-warning-bg)', color: 'var(--color-warning)', border: '1px solid var(--color-warning)' }}>어음</span>;
          case 'DC':       return <span className="px-2 py-0.5 rounded text-[10px] font-bold" style={{ background: 'var(--color-danger-bg)', color: 'var(--color-danger)', border: '1px solid var(--color-danger)' }}>DC</span>;
          default:         return <span className="px-2 py-0.5 rounded text-[10px] font-bold" style={{ background: 'var(--admin-bg)', color: 'var(--admin-text-sub)', border: '1px solid var(--admin-border)' }}>기타</span>;
      }
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden font-sans relative" style={{ background: 'var(--admin-bg)', color: 'var(--admin-text)', fontSize: 'var(--theme-font-base)' }}>
      
      {/* 1. Header */}
      <div className="flex-shrink-0 px-8 py-4 shadow-sm z-20 h-20 flex items-center justify-between" style={{ background: 'var(--admin-surface)', borderBottom: '1px solid var(--admin-border)' }}>
          
          {/* Title */}
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--admin-text)' }}>
              <Banknote style={{ color: 'var(--theme-primary)' }} /> 입금관리
            </h1>
          </div>

          {/* Controls */}
          <div className="flex flex-1 md:justify-end gap-3 min-w-0 items-center">
            {/* Date Picker */}
            <div className="flex items-center rounded-xl p-1 shadow-sm h-[40px]" style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}>
                <button
                    onClick={handleToday}
                    className="px-3 h-full rounded-lg text-xs font-bold transition-colors flex items-center"
                    style={{ background: 'var(--admin-bg)', color: 'var(--admin-text-sub)' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--admin-list-hover)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'var(--admin-bg)'; }}
                >오늘</button>
                <div className="w-px h-4 mx-2" style={{ background: 'var(--admin-border)' }} />
                <div className="flex items-center gap-2 px-1">
                    <button onClick={handlePrevDay} className="p-1 rounded-full transition-colors" style={{ color: 'var(--admin-text-sub)' }} onMouseEnter={e => { e.currentTarget.style.background = 'var(--admin-list-hover)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}><ChevronLeft size={18} strokeWidth={2.5} /></button>
                    <div className="flex items-center justify-center gap-2 min-w-[120px]">
                        <span className="text-base font-extrabold leading-none tracking-tight" style={{ color: 'var(--admin-text)' }}>{formattedDateStr}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ color: 'var(--theme-primary)', background: 'var(--theme-primary-bg)' }}>{relativeDateStr}</span>
                    </div>
                    <button onClick={handleNextDay} className="p-1 rounded-full transition-colors" style={{ color: 'var(--admin-text-sub)' }} onMouseEnter={e => { e.currentTarget.style.background = 'var(--admin-list-hover)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}><ChevronRight size={18} strokeWidth={2.5} /></button>
                </div>
            </div>

            {/* Search */}
            <div className="relative w-full max-w-xs h-[40px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={16} style={{ color: 'var(--admin-text-sub)' }} />
              <input
                type="text"
                placeholder="거래처 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-full pl-9 pr-4 rounded-xl text-sm font-medium outline-none transition-all"
                style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}
                onFocus={e => { e.currentTarget.style.borderColor = 'var(--theme-primary)'; e.currentTarget.style.background = 'var(--admin-surface)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = 'var(--admin-border)'; e.currentTarget.style.background = 'var(--admin-input-bg)'; }}
              />
            </div>
          </div>
      </div>

      {/* 2. Stats Cards */}
      <div className="flex-shrink-0 px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          
          {/* Add Button */}
          <button onClick={handleOpenModal} className="text-white rounded-2xl p-5 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all flex flex-col justify-between items-start group text-left h-32 relative overflow-hidden" style={{ background: 'var(--theme-primary)' }}>
            <div className="absolute right-[-20px] top-[-20px] bg-white/10 w-24 h-24 rounded-full blur-xl group-hover:bg-white/20 transition-colors" />
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm"><Plus size={24} className="text-white" strokeWidth={3} /></div>
            <div><span className="text-lg font-bold block">입금등록 +</span><span className="text-xs opacity-80">신규 입금 내역 등록</span></div>
          </button>

          {/* Today Count */}
          <div className="rounded-2xl p-5 shadow-sm flex flex-col justify-between h-32" style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}>
            <div className="flex justify-between items-start">
                <div className="p-2 rounded-lg" style={{ background: 'var(--theme-primary-bg)', color: 'var(--theme-primary)' }}><CheckCircle2 size={20} /></div>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: 'var(--theme-primary-bg)', color: 'var(--theme-primary)' }}>Today</span>
            </div>
            <div>
                <span className="text-xs font-bold block mb-1" style={{ color: 'var(--admin-text-sub)' }}>금일 입금건수</span>
                <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold" style={{ color: 'var(--admin-text)' }}>{dailyStats.count}</span>
                    <span className="text-sm" style={{ color: 'var(--admin-text-sub)' }}>건</span>
                </div>
            </div>
          </div>

          {/* Today Partners */}
          <div className="rounded-2xl p-5 shadow-sm flex flex-col justify-between h-32" style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}>
            <div className="flex justify-between items-start">
                <div className="p-2 rounded-lg" style={{ background: 'var(--theme-primary-bg)', color: 'var(--theme-primary)' }}><Building2 size={20} /></div>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: 'var(--theme-primary-bg)', color: 'var(--theme-primary)' }}>Today</span>
            </div>
            <div>
                <span className="text-xs font-bold block mb-1" style={{ color: 'var(--admin-text-sub)' }}>금일 입금 거래처</span>
                <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold" style={{ color: 'var(--admin-text)' }}>{dailyStats.uniquePartners}</span>
                    <span className="text-sm" style={{ color: 'var(--admin-text-sub)' }}>개사</span>
                </div>
            </div>
          </div>

          {/* Today Amount */}
          <div className="rounded-2xl p-5 shadow-sm flex flex-col justify-between h-32" style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}>
            <div className="flex justify-between items-start">
                <div className="p-2 rounded-lg" style={{ background: 'var(--theme-primary-bg)', color: 'var(--theme-primary)' }}><Wallet size={20} /></div>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: 'var(--theme-primary-bg)', color: 'var(--theme-primary)' }}>Today</span>
            </div>
            <div>
                <span className="text-xs font-bold block mb-1" style={{ color: 'var(--admin-text-sub)' }}>금일 입금액</span>
                <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold" style={{ color: 'var(--theme-primary)' }}>{dailyStats.totalAmount.toLocaleString()}</span>
                    <span className="text-sm" style={{ color: 'var(--admin-text-sub)' }}>원</span>
                </div>
            </div>
          </div>

        </div>
      </div>

      {/* 3. Main Split View */}
      <div className="flex-1 flex overflow-hidden">
          
          {/* LEFT: Partner List (Toggle) */}
          <div className="w-[320px] flex flex-col z-10" style={{ background: 'var(--admin-surface)', borderRight: '1px solid var(--admin-border)' }}>
              <div className="h-14 px-4 flex justify-between items-center shrink-0" style={{ background: 'var(--admin-grid-header)', borderTop: '1px solid var(--admin-border)', borderBottom: '1px solid var(--admin-border)' }}>
                  <span className="text-xs font-bold" style={{ color: 'var(--admin-text-sub)' }}>거래처 목록</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'var(--theme-primary-bg)', color: 'var(--theme-primary)' }}>{partnerStats.displayPartners.length}개</span>
              </div>
              <div className="flex-1 overflow-y-auto scrollbar-hide">
                  {partnerStats.displayPartners.map(partner => {
                      const stats = partnerStats.statsMap[partner.id];
                      const isSelected = selectedPartnerId === partner.id;
                      return (
                          <button
                              key={partner.id}
                              onClick={() => handlePartnerClick(partner.id)}
                              className="w-full text-left px-4 py-4 transition-colors flex justify-between items-center"
                              style={isSelected ? { borderLeft: '3px solid var(--theme-primary)', background: 'var(--theme-primary-bg)', borderBottom: '1px solid var(--admin-border)' } : { borderLeft: '3px solid transparent', borderBottom: '1px solid var(--admin-border)' }}
                              onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--admin-list-hover)'; }}
                              onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                          >
                              <div className="flex-1 min-w-0 pr-3">
                                  <div className="font-bold text-sm truncate" style={{ color: isSelected ? 'var(--theme-primary)' : 'var(--admin-text)' }}>{partner.partnerName}</div>
                                  <div className="text-[11px] mt-0.5" style={{ color: 'var(--admin-text-sub)' }}>{partner.ceoName} | {partner.companyPhone}</div>
                              </div>
                              <div className="text-right flex flex-col items-end min-w-[80px]">
                                  <div className="text-[10px]" style={{ color: 'var(--admin-text-sub)' }}>당월입금</div>
                                  <div className="text-xs font-bold mb-1" style={{ color: 'var(--theme-primary)' }}>{stats?.monthDeposit.toLocaleString()}</div>
                                  <div className="text-[10px]" style={{ color: 'var(--admin-text-sub)' }}>잔액</div>
                                  <div className="text-xs font-bold" style={{ color: 'var(--color-danger)' }}>{stats?.balance.toLocaleString()}</div>
                              </div>
                          </button>
                      );
                  })}
              </div>
          </div>

          {/* RIGHT: Transaction List */}
          <div className="flex-1 flex flex-col overflow-hidden" style={{ background: 'var(--admin-surface)' }}>
              <div className="h-14 px-6 flex items-center justify-between shrink-0" style={{ borderTop: '1px solid var(--admin-border)', borderBottom: '1px solid var(--admin-border)', background: 'var(--admin-grid-header)' }}>
                  <div className="flex items-center gap-2">
                      <span className="text-sm font-bold" style={{ color: 'var(--admin-text)' }}>입금 전표 리스트</span>
                      {selectedPartnerId && (
                          <span className="text-xs px-2 py-0.5 rounded font-bold" style={{ background: 'var(--theme-primary-bg)', color: 'var(--theme-primary)', border: '1px solid var(--theme-primary)' }}>
                              {partners.find(p => p.id === selectedPartnerId)?.partnerName}
                          </span>
                      )}
                      {!selectedPartnerId && <span className="text-xs px-2 py-0.5 rounded font-bold" style={{ background: 'var(--admin-bg)', color: 'var(--admin-text-sub)', border: '1px solid var(--admin-border)' }}>전체</span>}
                  </div>
                  <div className="flex gap-2">
                      <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors" style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', color: 'var(--admin-text-sub)' }} onMouseEnter={e => { e.currentTarget.style.background = 'var(--admin-list-hover)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'var(--admin-surface)'; }}><Filter size={14} /> 필터</button>
                      <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-all" style={{ background: 'var(--color-success)', border: '1px solid var(--color-success)' }} onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(1.1)'; }} onMouseLeave={e => { e.currentTarget.style.filter = ''; }}><Download size={14} /> 엑셀</button>
                  </div>
              </div>

              <div className="flex-1 overflow-auto scrollbar-hide">
                  <table className="w-full text-sm text-left border-collapse">
                      <thead className="font-bold text-xs uppercase sticky top-0 z-10 shadow-sm" style={{ background: 'var(--admin-grid-header)', color: 'var(--admin-text-sub)' }}>
                          <tr>
                              <th className="px-4 py-3 text-center w-12" style={{ borderBottom: '1px solid var(--admin-border)' }}>NO</th>
                              <th className="px-4 py-3 text-center w-28" style={{ borderBottom: '1px solid var(--admin-border)' }}>날짜</th>
                              <th className="px-4 py-3" style={{ borderBottom: '1px solid var(--admin-border)' }}>거래처명</th>
                              <th className="px-4 py-3 text-center w-20" style={{ borderBottom: '1px solid var(--admin-border)' }}>구분</th>
                              <th className="px-4 py-3 text-right w-32" style={{ borderBottom: '1px solid var(--admin-border)' }}>금액</th>
                              <th className="px-4 py-3 text-right w-32" style={{ borderBottom: '1px solid var(--admin-border)', background: 'var(--admin-bg)' }}>잔액</th>
                              <th className="px-4 py-3 text-center w-20" style={{ borderBottom: '1px solid var(--admin-border)' }}>담당자</th>
                              <th className="px-4 py-3" style={{ borderBottom: '1px solid var(--admin-border)' }}>비고</th>
                          </tr>
                      </thead>
                      <tbody>
                          {filteredTransactions.length === 0 ? (
                              <tr><td colSpan={8} className="text-center py-20" style={{ color: 'var(--admin-text-sub)' }}>입금 내역이 없습니다.</td></tr>
                          ) : (
                              filteredTransactions.map((item, idx) => (
                                  <tr
                                      key={item.id}
                                      style={{ borderBottom: '1px solid var(--admin-border)' }}
                                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--admin-list-hover)'; }}
                                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                                  >
                                      <td className="px-4 py-3 text-center font-medium" style={{ color: 'var(--admin-text-sub)' }}>{filteredTransactions.length - idx}</td>
                                      <td className="px-4 py-3 text-center font-mono text-xs" style={{ color: 'var(--admin-text-sub)' }}>
                                          {item.date} <span style={{ color: 'var(--admin-text-sub)', opacity: 0.7 }}>{item.time}</span>
                                      </td>
                                      <td className="px-4 py-3 font-bold" style={{ color: 'var(--admin-text)' }}>{item.partnerName}</td>
                                      <td className="px-4 py-3 text-center">
                                          {getMethodBadge(item.method)}
                                      </td>
                                      <td className="px-4 py-3 text-right font-bold font-mono" style={{ color: 'var(--theme-primary)' }}>
                                          {item.amount.toLocaleString()}
                                      </td>
                                      <td className="px-4 py-3 text-right font-mono" style={{ color: 'var(--admin-text-sub)', background: 'var(--admin-bg)' }}>
                                          {item.balance.toLocaleString()}
                                      </td>
                                      <td className="px-4 py-3 text-center text-xs" style={{ color: 'var(--admin-text-sub)' }}>{item.manager}</td>
                                      <td className="px-4 py-3 text-xs truncate max-w-[150px]" style={{ color: 'var(--admin-text-sub)' }}>{item.note}</td>
                                  </tr>
                              ))
                          )}
                      </tbody>
                  </table>
              </div>
          </div>

      </div>

      {/* --- Deposit Registration Modal --- */}
      <AnimatePresence>
        {isModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden relative z-10" style={{ background: 'var(--admin-modal-bg, var(--admin-surface))', color: 'var(--admin-text)' }}>
                    
                    {/* Header */}
                    <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--admin-border)', background: 'var(--admin-grid-header)' }}>
                        <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--admin-text)' }}>
                            <Plus size={18} style={{ color: 'var(--theme-primary)' }}/> 입금 등록
                        </h2>
                         <button onClick={() => setIsModalOpen(false)} style={{ color: 'var(--admin-text-sub)' }} onMouseEnter={e => { e.currentTarget.style.color = 'var(--admin-text)'; }} onMouseLeave={e => { e.currentTarget.style.color = 'var(--admin-text-sub)'; }}><X size={20}/></button>
                    </div>

                    {/* Form Body */}
                    <div className="p-6 space-y-5">
                        
                        {/* Partner & Balance (Updated with Search) */}
                        <div>
                            <label className="text-xs font-bold block mb-1.5 uppercase" style={{ color: 'var(--admin-text-sub)' }}>거래처 선택 (현재 잔액 자동표시)</label>
                            <div className="flex gap-2">
                                <div className="relative flex-1 partner-search-container">
                                    <input
                                        type="text"
                                        placeholder="거래처명 검색..."
                                        value={partnerSearch}
                                        onChange={(e) => {
                                            setPartnerSearch(e.target.value);
                                            if (modalForm.partnerId && e.target.value !== partners.find(p => p.id === modalForm.partnerId)?.partnerName) {
                                                setModalForm(prev => ({ ...prev, partnerId: '' }));
                                            }
                                            setShowPartnerResults(true);
                                        }}
                                        onFocus={() => setShowPartnerResults(true)}
                                        className="w-full rounded-xl px-3 py-2.5 text-sm font-bold outline-none transition-all"
                                        style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}
                                        onFocusCapture={e => { e.currentTarget.style.borderColor = 'var(--theme-primary)'; }}
                                        onBlurCapture={e => { e.currentTarget.style.borderColor = 'var(--admin-border)'; }}
                                    />
                                    <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--admin-text-sub)' }}/>

                                    {/* Dropdown Results */}
                                    {showPartnerResults && filteredModalPartners.length > 0 && (
                                        <div className="absolute top-full left-0 w-full mt-1 rounded-xl shadow-xl max-h-48 overflow-y-auto z-50" style={{ background: 'var(--admin-surface)', border: '1.5px solid var(--theme-primary)' }}>
                                            {filteredModalPartners.map(p => (
                                                <button
                                                    key={p.id}
                                                    onClick={() => {
                                                        setModalForm(prev => ({ ...prev, partnerId: p.id }));
                                                        setPartnerSearch(p.partnerName);
                                                        setShowPartnerResults(false);
                                                    }}
                                                    className="w-full text-left px-4 py-2.5 text-sm flex justify-between items-center transition-colors"
                                                    style={{ borderBottom: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}
                                                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--admin-list-hover)'; }}
                                                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                                                >
                                                    <span className="font-bold">{p.partnerName}</span>
                                                    <span className="text-xs" style={{ color: 'var(--admin-text-sub)' }}>{p.ceoName}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="rounded-xl px-4 py-2.5 flex flex-col items-end justify-center min-w-[120px]" style={{ background: 'var(--color-danger-bg)', border: '1px solid var(--color-danger)' }}>
                                    <span className="text-[10px] font-bold leading-none mb-0.5" style={{ color: 'var(--color-danger)' }}>현재 미수금</span>
                                    <span className="text-sm font-extrabold leading-none" style={{ color: 'var(--color-danger)' }}>{modalSelectedPartnerBalance.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* 구분 커스텀 드롭다운 */}
                            <div className="relative method-dropdown-container">
                                <label className="text-xs font-bold block mb-1.5 uppercase" style={{ color: 'var(--admin-text-sub)' }}>구분 (Method)</label>
                                <button
                                    type="button"
                                    onClick={() => setIsMethodOpen(prev => !prev)}
                                    className="w-full rounded-xl px-3 py-2.5 text-sm font-medium flex items-center justify-between transition-all"
                                    style={{
                                        background: 'var(--admin-input-bg)',
                                        border: isMethodOpen ? '1.5px solid var(--theme-primary)' : '1px solid var(--admin-border)',
                                        color: 'var(--admin-text)',
                                        borderRadius: isMethodOpen ? '12px 12px 0 0' : '12px'
                                    }}
                                >
                                    <span className="flex items-center gap-2">
                                        {(() => { const o = METHOD_OPTIONS.find(o => o.value === modalForm.method); return o ? <><span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold" style={{ background: o.bg, color: o.color, border: `1px solid ${o.color}` }}>{o.label}</span><span>{o.label}</span></> : <span>선택</span>; })()}
                                    </span>
                                    <ChevronDown size={16} style={{ color: 'var(--theme-primary)', transform: isMethodOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                                </button>

                                 {isMethodOpen && (
                                    <div
                                        className="absolute top-full left-0 w-full z-50 overflow-hidden"
                                        style={{
                                            background: 'var(--admin-surface)',
                                            border: '1.5px solid var(--theme-primary)',
                                            borderTop: 'none',
                                            borderRadius: '0 0 12px 12px',
                                            boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
                                        }}
                                    >
                                        {METHOD_OPTIONS.map((opt, idx) => (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                onClick={() => { setModalForm(prev => ({ ...prev, method: opt.value })); setIsMethodOpen(false); }}
                                                className="w-full text-left px-3 py-2.5 text-sm font-medium transition-colors flex items-center justify-between"
                                                style={{
                                                    background: modalForm.method === opt.value ? opt.bg : methodHover === opt.value ? 'var(--admin-list-hover)' : 'transparent',
                                                    borderBottom: idx < METHOD_OPTIONS.length - 1 ? '1px solid var(--admin-border)' : 'none'
                                                }}
                                                onMouseEnter={() => setMethodHover(opt.value)}
                                                onMouseLeave={() => setMethodHover(null)}
                                            >
                                                <span className="flex items-center gap-2">
                                                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold" style={{ background: opt.bg, color: opt.color, border: `1px solid ${opt.color}` }}>{opt.label}</span>
                                                    <span style={{ color: modalForm.method === opt.value ? opt.color : 'var(--admin-text)' }}>{opt.label}</span>
                                                </span>
                                                {modalForm.method === opt.value && (
                                                    <CheckCircle2 size={14} style={{ color: opt.color }} />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* 처리 날짜 - 캘린더 버튼 */}
                            <div className="relative date-picker-container">
                                <label className="text-xs font-bold block mb-1.5 uppercase flex items-center gap-1" style={{ color: 'var(--admin-text-sub)' }}><Clock size={10}/> 처리 날짜</label>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        setDateButtonRect({ top: rect.top, left: rect.left, width: rect.width });
                                        if (modalForm.date) {
                                            const [y, m, d] = modalForm.date.split('-').map(Number);
                                            setCalViewDate(new Date(y, m - 1, d));
                                            setTempDate(modalForm.date);
                                        } else {
                                            setCalViewDate(new Date());
                                            setTempDate(new Date().toISOString().split('T')[0]);
                                        }
                                        setIsDatePickerOpen(prev => !prev);
                                    }}
                                    className="w-full border rounded-xl px-3 py-2.5 text-sm font-medium text-left flex items-center justify-between transition-colors"
                                    style={{
                                        background: 'var(--admin-input-bg)',
                                        borderColor: isDatePickerOpen ? 'var(--theme-primary)' : 'var(--admin-border)',
                                        color: modalForm.date ? 'var(--admin-text)' : 'var(--admin-text-sub)'
                                    }}
                                >
                                    <span>
                                        {modalForm.date
                                            ? (() => { const [y,m,d] = modalForm.date.split('-'); return `${y}년 ${Number(m)}월 ${Number(d)}일`; })()
                                            : '날짜 선택'}
                                    </span>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--theme-primary)', flexShrink: 0 }}>
                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Amount */}
                        <div>
                            <label className="text-xs font-bold block mb-1.5 uppercase" style={{ color: 'var(--theme-primary)' }}>입금 금액 (Amount)</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={modalForm.amount}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/[^0-9]/g, '');
                                        setModalForm({...modalForm, amount: val ? parseInt(val).toLocaleString() : ''});
                                    }}
                                    className="w-full rounded-xl pl-4 pr-10 py-3 text-lg font-bold outline-none text-right"
                                    style={{ background: 'var(--theme-primary-bg)', border: '1px solid var(--theme-primary)', color: 'var(--theme-primary)' }}
                                    placeholder="0"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold" style={{ color: 'var(--theme-primary)' }}>원</span>
                            </div>
                        </div>

                        {/* Note */}
                        <div>
                            <label className="text-xs font-bold block mb-1.5 uppercase" style={{ color: 'var(--admin-text-sub)' }}>비고 (Note)</label>
                            <input
                                type="text"
                                value={modalForm.note}
                                onChange={(e) => setModalForm({...modalForm, note: e.target.value})}
                                className="w-full rounded-xl px-4 py-2.5 text-sm font-medium outline-none"
                                style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}
                                placeholder="메모 입력..."
                                onFocus={e => { e.currentTarget.style.borderColor = 'var(--theme-primary)'; }}
                                onBlur={e => { e.currentTarget.style.borderColor = 'var(--admin-border)'; }}
                            />
                        </div>

                        {/* Recent History (Mini Table) */}
                        {modalRecentHistory.length > 0 && (
                            <div className="pt-2" style={{ borderTop: '1px dashed var(--admin-border)' }}>
                                <label className="text-[10px] font-bold block mb-2 uppercase flex items-center gap-1" style={{ color: 'var(--admin-text-sub)' }}><HistoryIcon/> 최근 입금 내역 (Last 5)</label>
                                <div className="rounded-xl overflow-hidden" style={{ background: 'var(--admin-bg)', border: '1px solid var(--admin-border)' }}>
                                    <table className="w-full text-xs text-left">
                                        <thead style={{ background: 'var(--admin-grid-header)', color: 'var(--admin-text-sub)', borderBottom: '1px solid var(--admin-border)' }}>
                                            <tr>
                                                <th className="px-3 py-1.5">날짜</th>
                                                <th className="px-3 py-1.5 text-center">구분</th>
                                                <th className="px-3 py-1.5 text-right">금액</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {modalRecentHistory.map(h => (
                                                <tr key={h.id} style={{ borderBottom: '1px solid var(--admin-border)' }}>
                                                    <td className="px-3 py-1.5 font-mono" style={{ color: 'var(--admin-text-sub)' }}>{h.date}</td>
                                                    <td className="px-3 py-1.5 text-center">{getMethodBadge(h.method)}</td>
                                                    <td className="px-3 py-1.5 text-right font-bold" style={{ color: 'var(--admin-text)' }}>{h.amount.toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 flex justify-end gap-3" style={{ background: 'var(--admin-grid-header)', borderTop: '1px solid var(--admin-border)' }}>
                        <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl text-sm font-bold transition-colors" style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}>취소</button>
                        <button onClick={handleRegisterDeposit} className="px-6 py-2.5 text-white rounded-xl text-sm font-bold transition-transform active:scale-95 flex items-center gap-2" style={{ background: 'var(--theme-primary)' }}><Save size={16}/> 등록 완료</button>
                    </div>

                </motion.div>
            </div>
        )}
      </AnimatePresence>

      {/* ---- \ucc98\ub9ac\ub0a0\uc9dc \uce98\ub9b0\ub354 \uc624\ubc84\ub808\uc774 (Fixed, \ubaa8\ub2ec \uc704\uc5d0 \ub728\uc6c0) ---- */}
      {isDatePickerOpen && dateButtonRect && (() => {
        const TODAY = new Date(); TODAY.setHours(0, 0, 0, 0);
        const year = calViewDate.getFullYear();
        const month = calViewDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const prevMonthDays = new Date(year, month, 0).getDate();
        const cells: { date: Date; isCurrentMonth: boolean }[] = [];
        for (let i = firstDay - 1; i >= 0; i--) cells.push({ date: new Date(year, month - 1, prevMonthDays - i), isCurrentMonth: false });
        for (let d = 1; d <= daysInMonth; d++) cells.push({ date: new Date(year, month, d), isCurrentMonth: true });
        const remaining = 42 - cells.length;
        for (let d = 1; d <= remaining; d++) cells.push({ date: new Date(year, month + 1, d), isCurrentMonth: false });
        const toStr = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        const calWidth = 300;
        const calHeight = 420; // 달력 예상 높이
        const calLeft = Math.min(dateButtonRect.left, window.innerWidth - calWidth - 8);
        const spaceBelow = window.innerHeight - (dateButtonRect.top + 40);
        const showAbove = spaceBelow < calHeight;
        const calTop = showAbove
          ? dateButtonRect.top - calHeight - 8
          : dateButtonRect.top + 40 + 8;
        return (
          <>
            {/* 배경 오버레이 - 클릭 시 닫기 */}
            <div className="fixed inset-0 z-[290]" onClick={() => setIsDatePickerOpen(false)} />
            {/* 캘린더 본체 */}
            <div
              className="fixed z-[300] rounded-2xl shadow-2xl date-picker-container"
              style={{
                background: 'var(--admin-modal-bg)',
                border: 'none',
                borderRadius: '16px',
                width: `${calWidth}px`,
                left: `${calLeft}px`,
                top: `${Math.max(8, calTop)}px`,
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* \ud5e4\ub354 */}
              <div className="px-5 pt-5 pb-4 border-b" style={{ borderColor: 'var(--admin-border)', background: 'var(--admin-surface)' }}>
                <p className="text-xs font-bold mb-1" style={{ color: 'var(--admin-text-sub)' }}>처리 날짜 선택</p>
                <p className="text-2xl font-extrabold" style={{ color: 'var(--admin-text)' }}>
                  {tempDate ? (() => { const [y,m,d] = tempDate.split('-'); return `${y}년 ${Number(m)}월 ${Number(d)}일`; })() : '날짜를 선택하세요'}
                </p>
              </div>
              {/* 월 네비게이션 */}
              <div className="flex items-center justify-between px-5 pt-4 pb-2">
                <span className="font-bold text-sm" style={{ color: 'var(--admin-text)' }}>{year}년 {month+1}월</span>
                <div className="flex items-center gap-1">
                  <button onClick={e => { e.stopPropagation(); setCalViewDate(new Date(year, month-1, 1)); }}
                    className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--admin-text-sub)' }}
                    onMouseEnter={e=>e.currentTarget.style.background='var(--admin-list-hover)'}
                    onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
                  </button>
                  <button onClick={e => { e.stopPropagation(); setCalViewDate(new Date(year, month+1, 1)); }}
                    className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--admin-text-sub)' }}
                    onMouseEnter={e=>e.currentTarget.style.background='var(--admin-list-hover)'}
                    onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                  </button>
                </div>
              </div>
              {/* 요일 헤더 */}
              <div className="grid grid-cols-7 px-4 pb-1">
                {['일','월','화','수','목','금','토'].map((d,i) => (
                  <div key={d} className="text-center text-xs font-bold py-1" style={{ color: i===0?'#ef4444':i===6?'#3b82f6':'var(--admin-text-sub)' }}>{d}</div>
                ))}
              </div>
              {/* 날짜 그리드 */}
              <div className="grid grid-cols-7 px-4 pb-3 gap-x-[10px]">
                {cells.map((cell, idx) => {
                  const ds = toStr(cell.date);
                  const isSelected = ds === tempDate;
                  const isToday = cell.date.getTime() === TODAY.getTime();
                  const dow = cell.date.getDay();
                  let textColor = cell.isCurrentMonth ? 'var(--admin-text)' : 'var(--admin-text-sub)';
                  if (cell.isCurrentMonth && dow===0) textColor='#ef4444';
                  if (cell.isCurrentMonth && dow===6) textColor='#3b82f6';
                  if (isSelected) textColor='#ffffff';
                  return (
                    <button key={idx}
                      onClick={e => { e.stopPropagation(); setTempDate(ds); }}
                      onDoubleClick={e => { e.stopPropagation(); setTempDate(ds); setModalForm(prev => ({...prev, date: ds})); setIsDatePickerOpen(false); }}
                      className="flex flex-col items-center justify-center h-[34px] text-sm font-semibold rounded-full transition-all relative"
                      style={{ background: isSelected ? 'var(--theme-primary)' : 'transparent', color: textColor, opacity: cell.isCurrentMonth?1:0.35 }}
                      onMouseEnter={e => { if(!isSelected) e.currentTarget.style.background='var(--theme-primary-bg)'; }}
                      onMouseLeave={e => { if(!isSelected) e.currentTarget.style.background='transparent'; }}
                    >
                      {isToday && !isSelected && <span className="absolute inset-0 rounded-full border-2" style={{ borderColor: 'var(--theme-primary)' }}/>}
                      {cell.date.getDate()}
                    </button>
                  );
                })}
              </div>
              {/* 풋터 버튼 */}
              <div className="flex gap-2 px-4 pb-4">
                <button
                  onClick={e => { e.stopPropagation(); const t = new Date(); setTempDate(toStr(t)); setCalViewDate(t); }}
                  className="text-sm font-bold transition-colors"
                  style={{ background: 'transparent', border: 'none', color: 'var(--theme-primary)', padding: '0', cursor: 'pointer' }}>
                  오늘
                </button>
                <button onClick={() => setIsDatePickerOpen(false)}
                  className="flex-1 py-2 rounded-xl text-sm font-bold transition-colors"
                  style={{ background: 'var(--admin-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text-sub)' }}>
                  취소
                </button>
                <button
                  onClick={() => { setModalForm(prev => ({...prev, date: tempDate})); setIsDatePickerOpen(false); }}
                  className="flex-1 py-2 rounded-xl text-sm font-bold text-white transition-colors"
                  style={{ background: 'var(--theme-primary)' }}
                  onMouseEnter={e => e.currentTarget.style.opacity='0.85'}
                  onMouseLeave={e => e.currentTarget.style.opacity='1'}>
                  적용
                </button>
              </div>
            </div>
          </>
        );
      })()}

    </div>
  );
};

// Helper Icon
const HistoryIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>
);

export default DepositManagement;
