
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  Search, Plus, Trash2, Save, User, MapPin,
  RefreshCw, Check, LayoutList, Truck, X, Eye, EyeOff, Activity, Loader2, AlertCircle,
  Briefcase, Mail, Phone, Lock, Calendar, ToggleRight, List
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Address, UserRole } from '../types';
import { MOCK_PARTNERS, getMenusForRole } from '../constants';
import { useAdminTheme } from './theme/AdminThemeContext';

// --- Types ---
interface UserData {
  id: string;
  name: string;
  username: string;
  password: string;
  dob: string;
  phone: string;
  email: string;
  gender: 'M' | 'F';
  addresses: Address[];
  distributor: string;
  joinDate: string;
  status: 'ACTIVE' | 'INACTIVE';
}

interface StaffData {
  id: string;
  department: string;
  jobTitle: string;
  name: string;
  username: string;
  password: string;
  email: string;
  phone: string;
  status: 'ACTIVE' | 'INACTIVE' | 'LOCKED';
  lastLogin: string;
  permissions: string[];
}

interface UserManagementProps {
  role?: UserRole;
}

declare global {
  interface Window { daum: any; }
}

const MOCK_USERS: UserData[] = [
  {
    id: 'u1', name: '홍길동', username: 'hong123', password: 'password123',
    dob: '1990-01-01', phone: '010-1234-5678', email: 'hong@test.com', gender: 'M',
    addresses: [{ id: 'a1', address: '(06234) 서울시 강남구 테헤란로 123 101호' }], distributor: '(주)서울중앙물류', joinDate: '2023-01-15', status: 'ACTIVE'
  },
  {
    id: 'u2', name: '김미소', username: 'smile_kim', password: 'securePass!',
    dob: '1995-05-20', phone: '010-9876-5432', email: 'kim@test.com', gender: 'F',
    addresses: [{ id: 'a2', address: '(13529) 경기도 성남시 분당구 판교로 55 A동' }, { id: 'a3', address: '(48092) 부산시 해운대구 우동 100' }], distributor: '', joinDate: '2023-03-10', status: 'ACTIVE'
  },
];

const MOCK_STAFF: StaffData[] = [
  {
    id: 's1', department: '영업부', jobTitle: '과장', name: '김영업', username: 'sales_kim', password: 'password1',
    email: 'sales@dist.com', phone: '010-1111-2222', status: 'ACTIVE', lastLogin: '2024-05-20 09:00',
    permissions: ['dashboard', 'order_proc', 'sales_mgmt']
  },
  {
    id: 's2', department: '물류팀', jobTitle: '대리', name: '이물류', username: 'logis_lee', password: 'password2',
    email: 'logis@dist.com', phone: '010-3333-4444', status: 'ACTIVE', lastLogin: '2024-05-19 18:30',
    permissions: ['dashboard', 'order_proc', 'status_by_store']
  },
  {
    id: 's3', department: '관리팀', jobTitle: '사원', name: '박관리', username: 'admin_park', password: 'password3',
    email: 'admin@dist.com', phone: '010-5555-6666', status: 'LOCKED', lastLogin: '2024-04-01 10:00',
    permissions: ['dashboard']
  }
];

const UserManagement: React.FC<UserManagementProps> = ({ role }) => {
  const { theme } = useAdminTheme();
  const isStaffMode = role && role !== UserRole.ADMIN;

  // State
  const [users, setUsers] = useState<UserData[]>(MOCK_USERS);
  const [staffList, setStaffList] = useState<StaffData[]>(MOCK_STAFF);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<string>('ALL');
  const [showPassword, setShowPassword] = useState(false);

  const initialFormState: UserData = {
    id: '', name: '', username: '', password: '', dob: '', phone: '',
    email: '', gender: 'M', addresses: [], distributor: '', joinDate: new Date().toISOString().split('T')[0], status: 'ACTIVE'
  };
  const [formData, setFormData] = useState<UserData>(initialFormState);

  const initialStaffState: StaffData = {
    id: '', department: '', jobTitle: '', name: '', username: '', password: '',
    email: '', phone: '', status: 'ACTIVE', lastLogin: '-', permissions: []
  };
  const [staffFormData, setStaffFormData] = useState<StaffData>(initialStaffState);

  const [addrZone, setAddrZone] = useState('');
  const [addrMain, setAddrMain] = useState('');
  const [addrDetail, setAddrDetail] = useState('');
  const [addrLabel, setAddrLabel] = useState(''); // 주소 이름 (예: 집, 회사)
  const [isPostcodeOpen, setIsPostcodeOpen] = useState(false);
  const [postcodeError, setPostcodeError] = useState<string | null>(null);
  const postcodeRef = useRef<HTMLDivElement>(null);

  // --- Resize Panel State (상품개요 동일 패턴) ---
  const [panelWidth, setPanelWidth] = useState(45); // %
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(45);

  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    startXRef.current = e.clientX;
    startWidthRef.current = panelWidth;
    setIsResizing(true);
  }, [panelWidth]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isResizing || !containerRef.current) return;
      const containerW = containerRef.current.getBoundingClientRect().width;
      const dx = e.clientX - startXRef.current;
      const newPct = startWidthRef.current + (dx / containerW) * 100;
      if (newPct > 25 && newPct < 70) setPanelWidth(newPct);
    };
    const onUp = () => setIsResizing(false);
    if (isResizing) {
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [isResizing]);

  // --- Derived State ---
  const filteredUsers = useMemo(() => {
    let result = users;
    if (viewMode !== 'ALL') result = result.filter(u => u.distributor === viewMode);
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(u =>
        u.name.toLowerCase().includes(query) ||
        u.username.toLowerCase().includes(query) ||
        u.phone.includes(query)
      );
    }
    return result;
  }, [users, viewMode, searchQuery]);

  const filteredStaff = useMemo(() => {
    let result = staffList;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(s =>
        s.name.toLowerCase().includes(query) ||
        s.username.toLowerCase().includes(query) ||
        s.department.toLowerCase().includes(query)
      );
    }
    return result;
  }, [staffList, searchQuery]);

  useEffect(() => {
    if (selectedId) {
      if (isStaffMode) {
        const staff = staffList.find(s => s.id === selectedId);
        if (staff) setStaffFormData({ ...staff });
      } else {
        const user = users.find(u => u.id === selectedId);
        if (user) setFormData({ ...user });
        setAddrZone(''); setAddrMain(''); setAddrDetail('');
      }
    } else {
      if (isStaffMode) setStaffFormData({ ...initialStaffState, id: `staff-${Date.now()}` });
      else setFormData({ ...initialFormState, id: `user-${Date.now()}` });
    }
  }, [selectedId, isStaffMode]);

  // --- Helpers ---
  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.startsWith('02')) {
      if (numbers.length <= 2) return numbers;
      if (numbers.length <= 6) return `${numbers.slice(0, 2)}-${numbers.slice(2)}`;
      if (numbers.length <= 9) return `${numbers.slice(0, 2)}-${numbers.slice(2, 5)}-${numbers.slice(5)}`;
      return `${numbers.slice(0, 2)}-${numbers.slice(2, 6)}-${numbers.slice(6, 10)}`;
    }
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  };

  const availableMenus = useMemo(() => {
    if (!isStaffMode || !role) return [];
    return getMenusForRole(role).filter(m => m.id !== 'logout');
  }, [role, isStaffMode]);

  // --- Handlers (Staff) ---
  const handleStaffChange = (field: keyof StaffData, value: any) => {
    let finalValue = value;
    if (field === 'phone') finalValue = formatPhone(value);
    setStaffFormData(prev => ({ ...prev, [field]: finalValue }));
  };

  const togglePermission = (menuId: string) => {
    setStaffFormData(prev => {
      const current = prev.permissions;
      const exists = current.includes(menuId);
      return { ...prev, permissions: exists ? current.filter(p => p !== menuId) : [...current, menuId] };
    });
  };

  const handleStaffSave = () => {
    if (!staffFormData.name || !staffFormData.username) return alert('필수 항목을 입력해주세요.');
    setStaffList(prev => {
      const exists = prev.some(s => s.id === staffFormData.id);
      return exists ? prev.map(s => s.id === staffFormData.id ? staffFormData : s) : [staffFormData, ...prev];
    });
    alert('저장되었습니다.');
    if (!selectedId) setSelectedId(staffFormData.id);
  };

  const handleStaffDelete = () => {
    if (!selectedId || !confirm('삭제하시겠습니까?')) return;
    setStaffList(prev => prev.filter(s => s.id !== selectedId));
    setSelectedId(null);
  };

  // --- Handlers (Consumer) ---
  const handleInputChange = (field: keyof UserData, value: any) => {
    let finalValue = value;
    if (field === 'phone') finalValue = formatPhone(value);
    setFormData(prev => ({ ...prev, [field]: finalValue }));
  };
  const handlePostcode = () => setIsPostcodeOpen(true);
  const handleAddAddress = () => {
    if (!addrMain) return;
    setFormData(prev => ({
      ...prev,
      addresses: [...prev.addresses, {
        id: `addr-${Date.now()}`,
        label: addrLabel.trim() || undefined,
        address: `(${addrZone}) ${addrMain} ${addrDetail}`.trim()
      }]
    }));
    setAddrZone(''); setAddrMain(''); setAddrDetail(''); setAddrLabel('');
  };
  const handleRemoveAddress = (id: string) => setFormData(prev => ({ ...prev, addresses: prev.addresses.filter(a => a.id !== id) }));
  const handleSave = () => {
    setUsers(prev => { const exists = prev.some(u => u.id === formData.id); return exists ? prev.map(u => u.id === formData.id ? formData : u) : [formData, ...prev]; });
    alert('저장되었습니다.');
  };
  const handleDelete = () => { if (confirm('삭제?')) { setUsers(prev => prev.filter(u => u.id !== selectedId)); setSelectedId(null); } };

  const inputStyle = {
    background: 'var(--admin-input-bg)',
    borderColor: 'var(--admin-border)',
    color: 'var(--admin-text)',
  };
  const focusInput = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    e.currentTarget.style.borderColor = 'var(--theme-primary)';
  };
  const blurInput = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    e.currentTarget.style.borderColor = 'var(--admin-border)';
  };

  // --- Render ---
  return (
    <div id="user-mgmt-container" className="flex flex-col h-full w-full overflow-hidden font-sans relative" style={{ background: 'var(--admin-bg)', color: 'var(--admin-text)' }}>
      {/* Header */}
      <div id="user-mgmt-header" className="flex-shrink-0 px-8 h-20 shadow-sm z-20 flex items-center justify-between gap-4"
        style={{ background: 'var(--admin-surface)', borderBottom: '1px solid var(--admin-border)' }}>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold flex items-center gap-2 whitespace-nowrap" style={{ color: 'var(--admin-text)' }}>
            <User style={{ color: 'var(--theme-primary)' }} /> {isStaffMode ? '사용자관리 (직원)' : '회원관리 (소비자)'}
          </h1>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full shadow-sm"
            style={{ color: 'var(--theme-primary)', background: 'var(--theme-primary-bg)', border: '1px solid var(--theme-primary-bg)' }}>
            총 {isStaffMode ? filteredStaff.length : filteredUsers.length}명
          </span>
        </div>
        <div className="relative w-64 xl:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={16} style={{ color: 'var(--admin-text-sub)' }} />
          <input
            id="input-user-search"
            type="text" placeholder="검색..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border rounded-xl text-sm font-medium outline-none transition-all"
            style={inputStyle}
            onFocus={focusInput} onBlur={blurInput}
          />
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden" ref={containerRef}>
        {/* LEFT LIST */}
        <div className="flex flex-col z-10 flex-shrink-0 relative"
          style={{ width: `${panelWidth}%`, background: 'var(--admin-surface)', borderRight: '1px solid var(--admin-border)' }}>
          <div className="flex items-center px-6 py-3 text-xs font-bold uppercase tracking-wider flex-shrink-0"
            style={{ background: 'var(--admin-grid-header)', borderBottom: '1px solid var(--admin-border)', color: 'var(--admin-text-sub)' }}>
            {isStaffMode ? (
              <>
                <div className="w-20">부서</div>
                <div className="w-20">직책</div>
                <div className="w-24">이름</div>
                <div className="flex-1">아이디</div>
                <div className="w-20 text-center">상태</div>
              </>
            ) : (
              <>
                <div className="w-24">이름</div>
                <div className="w-24">아이디</div>
                <div className="flex-1 text-right">전화번호</div>
              </>
            )}
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-hide">
            {(isStaffMode ? filteredStaff : filteredUsers).length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 gap-2" style={{ color: 'var(--admin-text-sub)' }}>
                <Search size={24} className="opacity-20" /><p className="text-xs">검색 결과가 없습니다.</p>
              </div>
            ) : (
              (isStaffMode ? filteredStaff : filteredUsers).map((item: any, idx) => {
                const isSelected = selectedId === item.id;
                return (
                  <div
                    id={`user-row-${item.id}`}
                    key={item.id}
                    onClick={() => setSelectedId(item.id)}
                    className="flex items-center px-6 py-3.5 cursor-pointer transition-colors"
                    style={{
                      borderBottom: '1px solid var(--admin-border)',
                      borderLeft: isSelected ? '4px solid var(--theme-primary)' : '4px solid transparent',
                      background: isSelected ? 'var(--theme-primary-bg)' : 'var(--admin-surface)',
                    }}
                    onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = 'var(--admin-grid-header)'; }}
                    onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = 'var(--admin-surface)'; }}
                  >
                    {isStaffMode ? (
                      <>
                        <div className="w-20 text-xs truncate" style={{ color: 'var(--admin-text-sub)' }}>{item.department}</div>
                        <div className="w-20 text-xs truncate" style={{ color: 'var(--admin-text-sub)' }}>{item.jobTitle}</div>
                        <div className="w-24 text-sm font-medium truncate" style={{ color: isSelected ? 'var(--theme-primary)' : 'var(--admin-text)', fontWeight: isSelected ? 700 : 500 }}>{item.name}</div>
                        <div className="flex-1 text-xs truncate" style={{ color: 'var(--admin-text-sub)' }}>{item.username}</div>
                        <div className="w-20 text-center">
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                            style={item.status === 'ACTIVE' ? { background: '#dcfce7', color: '#16a34a' } : item.status === 'LOCKED' ? { background: '#fee2e2', color: '#dc2626' } : { background: 'var(--admin-grid-header)', color: 'var(--admin-text-sub)' }}>
                            {item.status === 'ACTIVE' ? '사용' : item.status === 'LOCKED' ? '잠금' : '미사용'}
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-24 text-sm font-medium" style={{ color: isSelected ? 'var(--theme-primary)' : 'var(--admin-text)', fontWeight: isSelected ? 700 : 500 }}>{item.name}</div>
                        <div className="w-24 text-xs" style={{ color: 'var(--admin-text-sub)' }}>{item.username}</div>
                        <div className="flex-1 text-right text-xs font-mono" style={{ color: 'var(--admin-text-sub)' }}>{item.phone}</div>
                      </>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* RESIZE HANDLE (상품개요 동일 스타일: absolute, 투명→호버 테마색) */}
          <div
            onMouseDown={handleResizeMouseDown}
            className="absolute top-0 right-0 w-1 h-full cursor-col-resize z-30 transition-colors"
            style={{ background: 'transparent' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--theme-primary)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          />
        </div>

        {/* RIGHT FORM */}
        <div className="flex-1 flex flex-col h-full overflow-hidden min-w-[320px]" style={{ background: 'var(--admin-bg)' }}>
          <div className="px-8 py-4 flex-shrink-0 flex items-center justify-between h-[69px]"
            style={{ background: 'var(--admin-surface)', borderBottom: '1px solid var(--admin-border)' }}>
            <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--admin-text)' }}>
              <LayoutList size={18} style={{ color: 'var(--admin-text-sub)' }} />상세 정보
            </h3>
            <div className="flex gap-2">
              <button id="btn-user-reset" onClick={() => { setSelectedId(null); if (isStaffMode) setStaffFormData({ ...initialStaffState, id: `staff-${Date.now()}` }); else setFormData({ ...initialFormState, id: `user-${Date.now()}` }); }}
                className="p-2 rounded-lg transition-colors" style={{ color: 'var(--admin-text-sub)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--theme-primary)'; (e.currentTarget as HTMLButtonElement).style.background = 'var(--theme-primary-bg)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--admin-text-sub)'; (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}>
                <RefreshCw size={18} />
              </button>
              <button id="btn-user-delete" onClick={isStaffMode ? handleStaffDelete : handleDelete}
                className="p-2 rounded-lg transition-colors" style={{ color: 'var(--admin-text-sub)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#ef4444'; (e.currentTarget as HTMLButtonElement).style.background = '#fee2e2'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--admin-text-sub)'; (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}>
                <Trash2 size={18} />
              </button>
              <div className="w-px h-8 mx-1" style={{ background: 'var(--admin-border)' }} />
              <button id="btn-user-save" onClick={isStaffMode ? handleStaffSave : handleSave}
                className="flex items-center gap-1.5 text-white px-5 py-2 rounded-lg text-sm font-bold shadow-md active:scale-95 transition-all"
                style={{ background: 'var(--theme-primary)' }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
                <Save size={16} /> 저장
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-8 scrollbar-hide">
            {isStaffMode ? (
              <div className="space-y-6">
                {/* 1. Basic Info */}
                <div className="rounded-2xl p-6 shadow-sm border" style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)' }}>
                  <h4 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--admin-text)' }}>
                    <Briefcase size={16} style={{ color: 'var(--theme-primary)' }} /> 사용자 기본정보
                  </h4>
                  <div className="grid grid-cols-2 gap-5">
                    {[
                      { label: '부서명', field: 'department' as keyof StaffData, id: 'input-staff-dept' },
                      { label: '직책', field: 'jobTitle' as keyof StaffData, id: 'input-staff-job' },
                      { label: '사용자명', field: 'name' as keyof StaffData, id: 'input-staff-name' },
                      { label: '사용자 ID', field: 'username' as keyof StaffData, id: 'input-staff-id' },
                      { label: '이메일', field: 'email' as keyof StaffData, id: 'input-staff-email', type: 'email' },
                      { label: '휴대전화', field: 'phone' as keyof StaffData, id: 'input-staff-phone' },
                    ].map(({ label, field, id, type }) => (
                      <div key={field}>
                        <label className="text-[11px] font-bold uppercase block mb-1.5" style={{ color: 'var(--admin-text-sub)' }}>{label}</label>
                        <input id={id} type={type || 'text'} value={String(staffFormData[field] ?? '')}
                          onChange={(e) => handleStaffChange(field, e.target.value)}
                          className="w-full border rounded-xl px-4 py-2.5 text-sm font-medium outline-none transition-all"
                          style={inputStyle} onFocus={focusInput} onBlur={blurInput} />
                      </div>
                    ))}
                    <div className="relative">
                      <label className="text-[11px] font-bold uppercase block mb-1.5" style={{ color: 'var(--admin-text-sub)' }}>비밀번호</label>
                      <input id="input-staff-pw" type={showPassword ? 'text' : 'password'} value={staffFormData.password}
                        onChange={(e) => handleStaffChange('password', e.target.value)}
                        className="w-full border rounded-xl px-4 py-2.5 text-sm font-medium outline-none pr-10 transition-all"
                        style={inputStyle} onFocus={focusInput} onBlur={blurInput} />
                      <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 bottom-2.5" style={{ color: 'var(--admin-text-sub)' }}>
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <div>
                      <label className="text-[11px] font-bold uppercase block mb-1.5" style={{ color: 'var(--admin-text-sub)' }}>상태</label>
                      <select id="select-staff-status" value={staffFormData.status} onChange={(e) => handleStaffChange('status', e.target.value)}
                        className="w-full border rounded-xl px-4 py-2.5 text-sm font-bold outline-none appearance-none transition-all"
                        style={inputStyle} onFocus={focusInput} onBlur={blurInput}>
                        <option value="ACTIVE">사용 (Active)</option>
                        <option value="INACTIVE">미사용 (Inactive)</option>
                        <option value="LOCKED">잠금 (Locked)</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="text-[11px] font-bold uppercase block mb-1.5" style={{ color: 'var(--admin-text-sub)' }}>마지막 로그인</label>
                      <div className="w-full border rounded-xl px-4 py-2.5 text-sm" style={{ background: 'var(--admin-grid-header)', borderColor: 'var(--admin-border)', color: 'var(--admin-text-sub)' }}>{staffFormData.lastLogin}</div>
                    </div>
                  </div>
                </div>
                {/* 2. Permissions */}
                <div className="rounded-2xl p-6 shadow-sm border" style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)' }}>
                  <h4 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--admin-text)' }}>
                    <Lock size={16} style={{ color: 'var(--theme-primary)' }} /> 권한 정보 (메뉴 접근)
                  </h4>
                  <div className="space-y-2">
                    {availableMenus.map((menu) => {
                      const isEnabled = staffFormData.permissions.includes(menu.id);
                      return (
                        <div id={`perm-row-${menu.id}`} key={menu.id}
                          className="flex items-center justify-between p-3 rounded-xl transition-colors"
                          style={{ border: '1px solid var(--admin-border)' }}
                          onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = 'var(--admin-grid-header)'}
                          onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}>
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg" style={isEnabled ? { background: 'var(--theme-primary-bg)', color: 'var(--theme-primary)' } : { background: 'var(--admin-grid-header)', color: 'var(--admin-text-sub)' }}>
                              <menu.icon size={18} />
                            </div>
                            <span className="text-sm font-medium" style={{ color: isEnabled ? 'var(--admin-text)' : 'var(--admin-text-sub)' }}>{menu.label}</span>
                          </div>
                          <button id={`btn-toggle-perm-${menu.id}`} onClick={() => togglePermission(menu.id)}
                            className="relative w-11 h-6 rounded-full transition-colors"
                            style={{ background: isEnabled ? 'var(--theme-primary)' : 'var(--admin-border)' }}>
                            <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${isEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl p-6 shadow-sm border space-y-6" style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)' }}>
                <div className="grid grid-cols-2 gap-5">
                  {[
                    { label: '이름', field: 'name' as keyof UserData, id: 'input-user-name' },
                    { label: '아이디', field: 'username' as keyof UserData, id: 'input-user-id' },
                    { label: '패스워드', field: 'password' as keyof UserData, id: 'input-user-pw', type: 'password' },
                    { label: '생년월일', field: 'dob' as keyof UserData, id: 'input-user-dob' },
                    { label: '전화번호', field: 'phone' as keyof UserData, id: 'input-user-phone' },
                    { label: '이메일', field: 'email' as keyof UserData, id: 'input-user-email', type: 'email' },
                  ].map(({ label, field, id, type }) => (
                    <div key={field}>
                      <label className="text-[11px] font-bold uppercase block mb-1.5" style={{ color: 'var(--admin-text-sub)' }}>{label}</label>
                      <input id={id} type={type || 'text'} value={String(formData[field] ?? '')}
                        onChange={(e) => handleInputChange(field, e.target.value)}
                        className="w-full border rounded-xl px-4 py-2.5 text-sm font-medium outline-none transition-all"
                        style={inputStyle} onFocus={focusInput} onBlur={blurInput} />
                    </div>
                  ))}
                </div>
                <div className="pt-4" style={{ borderTop: '1px solid var(--admin-border)' }}>
                  <label className="text-[11px] font-bold uppercase block mb-2 flex items-center gap-2" style={{ color: 'var(--admin-text-sub)' }}>
                    <MapPin size={12} /> 주소 관리
                  </label>
                  {/* 주소 입력 영역 */}
                  <div className="rounded-xl border p-3 mb-2 flex flex-col gap-2" style={{ background: 'var(--admin-grid-header)', borderColor: 'var(--admin-border)' }}>
                    {/* 주소 이름 */}
                    <div>
                      <label className="text-[10px] font-bold uppercase block mb-1" style={{ color: 'var(--admin-text-sub)' }}>주소 이름</label>
                      <input
                        id="input-addr-label"
                        type="text"
                        value={addrLabel}
                        onChange={e => setAddrLabel(e.target.value)}
                        placeholder="예: 집, 회사, 부모님 집..."
                        className="w-full border rounded-lg px-3 py-2 text-sm outline-none transition-all"
                        style={inputStyle}
                        onFocus={focusInput}
                        onBlur={blurInput}
                      />
                    </div>
                    {/* 우편번호 */}
                    <div>
                      <label className="text-[10px] font-bold uppercase block mb-1" style={{ color: 'var(--admin-text-sub)' }}>우편번호</label>
                      <div className="flex gap-2">
                        <input
                          id="input-addr-zone"
                          type="text"
                          value={addrZone}
                          readOnly
                          placeholder="우편번호"
                          className="w-28 border rounded-lg px-3 py-2 text-sm outline-none"
                          style={{ ...inputStyle, background: 'var(--admin-surface)', borderColor: 'var(--admin-border)', color: 'var(--admin-text)' }}
                        />
                        <button
                          id="btn-postcode"
                          onClick={handlePostcode}
                          className="text-white rounded-lg px-4 py-2 text-xs font-bold transition-all active:scale-95"
                          style={{ background: 'var(--theme-primary)' }}
                          onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                        >검색</button>
                      </div>
                    </div>
                    {/* 기본 주소 */}
                    <div>
                      <label className="text-[10px] font-bold uppercase block mb-1" style={{ color: 'var(--admin-text-sub)' }}>기본 주소</label>
                      <input
                        id="input-addr-main"
                        type="text"
                        value={addrMain}
                        readOnly
                        placeholder="우편번호 검색 후 자동입력"
                        className="w-full border rounded-lg px-3 py-2 text-sm outline-none"
                        style={{ ...inputStyle, background: 'var(--admin-surface)', borderColor: 'var(--admin-border)', color: 'var(--admin-text)' }}
                      />
                    </div>
                    {/* 상세 주소 + 추가 버튼 */}
                    <div>
                      <label className="text-[10px] font-bold uppercase block mb-1" style={{ color: 'var(--admin-text-sub)' }}>상세 주소</label>
                      <div className="flex gap-2">
                        <input
                          id="input-addr-detail"
                          type="text"
                          value={addrDetail}
                          onChange={e => setAddrDetail(e.target.value)}
                          placeholder="동/호/층 입력"
                          className="flex-1 border rounded-lg px-3 py-2 text-sm outline-none transition-all"
                          style={inputStyle}
                          onFocus={focusInput}
                          onBlur={blurInput}
                        />
                        <button
                          id="btn-add-addr"
                          onClick={handleAddAddress}
                          className="text-white rounded-lg px-4 py-2 transition-all active:scale-95"
                          style={{ background: 'var(--theme-primary)' }}
                          onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                  {/* 등록된 주소 리스트 */}
                  <div className="space-y-1.5">
                    {formData.addresses.map(a => (
                      <div
                        key={a.id}
                        id={`addr-row-${a.id}`}
                        className="flex items-center justify-between border rounded-xl px-3 py-2.5"
                        style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)' }}
                      >
                        <div className="flex flex-col gap-0.5 min-w-0">
                          {a.label && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full w-fit" style={{ background: 'var(--theme-primary-bg)', color: 'var(--theme-primary)' }}>
                              {a.label}
                            </span>
                          )}
                          <span className="text-sm truncate" style={{ color: 'var(--admin-text)' }}>{a.address}</span>
                        </div>
                        <button
                          onClick={() => handleRemoveAddress(a.id)}
                          className="ml-2 p-1 rounded-lg flex-shrink-0 transition-colors"
                          style={{ color: 'var(--admin-text-sub)' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#ef4444'; (e.currentTarget as HTMLButtonElement).style.background = '#fee2e2'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--admin-text-sub)'; (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Postcode Modal */}
      <AnimatePresence>
        {isPostcodeOpen && (
          <div id="modal-postcode" className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsPostcodeOpen(false)} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="rounded-2xl shadow-2xl w-full max-w-[500px] h-[600px] flex flex-col overflow-hidden relative z-10"
              style={{ background: 'var(--admin-surface)' }}>
              <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--admin-border)', background: 'var(--admin-grid-header)' }}>
                <h3 className="font-bold" style={{ color: 'var(--admin-text)' }}>우편번호 검색</h3>
                <button id="btn-close-postcode" onClick={() => setIsPostcodeOpen(false)} style={{ color: 'var(--admin-text-sub)' }}><X size={20} /></button>
              </div>
              <div ref={postcodeRef} className="flex-1 w-full h-full relative">
                <div className="absolute inset-0 flex items-center justify-center gap-2" style={{ color: 'var(--admin-text-sub)' }}>
                  <Loader2 className="animate-spin" /><span className="text-xs">Loading...</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {useEffect(() => {
        if (!isPostcodeOpen) return;
        const init = () => {
          if (window.daum && window.daum.Postcode && postcodeRef.current) {
            postcodeRef.current.innerHTML = '';
            new window.daum.Postcode({
              oncomplete: (data: any) => { setAddrZone(data.zonecode); setAddrMain(data.roadAddress || data.jibunAddress); setIsPostcodeOpen(false); },
              width: '100%', height: '100%'
            }).embed(postcodeRef.current);
          } else setTimeout(init, 100);
        };
        init();
      }, [isPostcodeOpen]) as any}

    </div>
  );
};

export default UserManagement;
