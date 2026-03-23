
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Building2, User, CreditCard, FileText, History,
  Save, Upload, Calendar, MapPin, Mail, Phone, Hash,
  Briefcase, CheckCircle2, Image as ImageIcon, X, Loader2, AlertCircle,
  Percent, Plus, Trash2, Monitor, Truck, Package, Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePartnerContext } from '../PartnerContext';
import { useAdminTheme } from './theme/AdminThemeContext';
import { UserRole, GradeMargin } from '../types';

// Extend Window interface for Daum Postcode
declare global {
  interface Window {
    daum: any;
  }
}

interface HistoryLog {
  id: string;
  date: string;
  content: string;
  worker: string;
}

interface HeadquartersInfoProps {
  role: UserRole;
}

const HeadquartersInfo: React.FC<HeadquartersInfoProps> = ({ role }) => {
  const { theme } = useAdminTheme();
  // Use Context to get global partner data and STANDARD COSTS
  const {
    partners,
    updatePartner,
    standardCosts,
    setStandardCosts,
    getSolutionImage,
    setSolutionImage,
  } = usePartnerContext();

  // Determine Target ID and Role Key based on Role
  const targetId = useMemo(() => {
    switch (role) {
      case UserRole.AGENCY: return 'ag1';
      case UserRole.DISTRIBUTOR: return 'd1';
      case UserRole.FABRIC_SUPPLIER: return 'f1';
      case UserRole.MANUFACTURER: return 'm1';
      default: return 'm1';
    }
  }, [role]);

  // 역할별 고유 키 (localStorage 분리용)
  const roleKey = useMemo(() => {
    switch (role) {
      case UserRole.ADMIN: return 'ADMIN';
      case UserRole.AGENCY: return 'AGENCY';
      case UserRole.DISTRIBUTOR: return 'DISTRIBUTOR';
      case UserRole.FABRIC_SUPPLIER: return 'FABRIC_SUPPLIER';
      case UserRole.MANUFACTURER: return 'MANUFACTURER';
      default: return 'ADMIN';
    }
  }, [role]);

  // 역할별 솔루션 이미지 (PartnerContext 맵에서 접근)
  const solutionMainImage = getSolutionImage(roleKey);

  const partnerData = partners.find(p => p.id === targetId);

  // --- Local State for Form ---
  const [basicInfo, setBasicInfo] = useState({
    companyName: '',
    ceoName: '',
    ceoPhone: '',
    companyPhone: '',
    businessNo: '',
    industry: '', // 업태
    sector: '', // 업종
    taxEmail: '',
    companyCode: ''
  });

  // Address State
  const [addrZone, setAddrZone] = useState('');
  const [addrMain, setAddrMain] = useState('');
  const [addrDetail, setAddrDetail] = useState('');

  // Postcode UI State
  const [isPostcodeOpen, setIsPostcodeOpen] = useState(false);
  const [postcodeError, setPostcodeError] = useState<string | null>(null);
  const postcodeRef = useRef<HTMLDivElement>(null);

  const [managerInfo, setManagerInfo] = useState({
    name: '',
    phone: '',
    jobTitle: '담당자', // Default or from context if available
    id: '',
    password: '',
    photoUrl: ''
  });

  const [paymentInfo, setPaymentInfo] = useState({
    paymentDate: '25', // 매월 25일
    baseAmount: '150,000',
    currentUsage: '450', // 건
    prevUsage: '420', // 건
    estimatedAmount: '1,200,000'
  });

  // Local State for Admin Cost (Synced with Global Context)
  const [adminCostInfo, setAdminCostInfo] = useState(standardCosts);

  // Local State for Supplier Grade Margins
  const [gradeMargins, setGradeMargins] = useState<GradeMargin[]>([]);

  // Sync adminCostInfo when standardCosts changes from context (initial load)
  useEffect(() => {
    setAdminCostInfo(standardCosts);
  }, [standardCosts]);

  const [licenseImage, setLicenseImage] = useState<string | null>(null);

  // 수정이력: 역할별 localStorage 키로 독립 관리
  const historyStorageKey = `winterior_hq_history_${roleKey}`;
  const [historyLogs, setHistoryLogs] = useState<HistoryLog[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(`winterior_hq_history_${role}`);
        if (saved) return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      { id: '1', date: '2024-05-20 14:30', content: '담당자 연락처 변경', worker: '시스템' },
      { id: '2', date: '2024-04-01 09:00', content: '사업자 주소지 이전 수정', worker: '관리자' },
      { id: '3', date: '2023-01-15 10:00', content: '최초 등록', worker: '시스템' },
    ];
  });

  // 수정이력 변경될 때마다 역할별 키로 저장
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`winterior_hq_history_${role}`, JSON.stringify(historyLogs));
      } catch (e) {}
    }
  }, [historyLogs, role]);

  // --- Phone Number Auto-Formatting ---
  const formatPhoneNumber = (value: string): string => {
    const digits = value.replace(/\D/g, '');
    if (digits.startsWith('02')) {
      if (digits.length <= 2) return digits;
      if (digits.length <= 5) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
      if (digits.length <= 9) return `${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5)}`;
      return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6, 10)}`;
    } else {
      if (digits.length <= 3) return digits;
      if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
      if (digits.length <= 10) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
      return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
    }
  };

  // --- Delivery Destination State ---
  interface Destination {
    id: string;
    type: 'freight' | 'parcel'; // 화물 / 택배
    carrier: string; // 운송사 (화물)
    branch: string;  // 지점명 (화물)
    phone: string;   // 전화번호 (화물)
    address: string; // 주소
    addressDetail: string; // 상세 주소
  }
  const [destinations, setDestinations] = useState<Destination[]>([
    { id: 'dest-1', type: 'freight', carrier: '대한통운', branch: '강남지점', phone: '02-555-1234', address: '서울시 강남구 테헤란로 123', addressDetail: '' },
    { id: 'dest-2', type: 'parcel', carrier: '', branch: '', phone: '', address: '서울시 서초구 반포대로 45', addressDetail: '201호' },
  ]);

  const handleAddDestination = (type: 'freight' | 'parcel') => {
    setDestinations(prev => [...prev, {
      id: `dest-${Date.now()}`, type, carrier: '', branch: '', phone: '', address: '', addressDetail: ''
    }]);
  };

  const handleDestChange = (id: string, field: keyof Destination, value: string) => {
    setDestinations(prev => prev.map(d => d.id === id ? { ...d, [field]: value } : d));
  };

  const handleDestPhoneChange = (id: string, value: string) => {
    handleDestChange(id, 'phone', formatPhoneNumber(value));
  };

  const handleDestAddressSearch = (destId: string) => {
    if (window.daum && window.daum.Postcode) {
      new window.daum.Postcode({
        oncomplete: function (data: any) {
          const addr = data.roadAddress || data.jibunAddress;
          setDestinations(prev => prev.map(d => d.id === destId ? { ...d, address: addr, addressDetail: '' } : d));
          setTimeout(() => {
            document.getElementById(`dest-addr-detail-${destId}`)?.focus();
          }, 100);
        }
      }).open();
    } else {
      alert('주소 검색 서비스를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
    }
  };

  const handleDeleteDest = (id: string) => {
    if (!confirm('이 도착지를 삭제하시겠습니까?')) return;
    setDestinations(prev => prev.filter(d => d.id !== id));
  };

  const metaInfo = {
    registeredAt: '2023-01-15',
    updatedAt: historyLogs.length > 0 ? historyLogs[0].date.split(' ')[0] : '2024-05-20'
  };

  // --- Sync with Global Context on Mount/Update ---
  useEffect(() => {
    if (partnerData) {
      setBasicInfo({
        companyName: partnerData.partnerName,
        ceoName: partnerData.ceoName,
        ceoPhone: partnerData.ceoPhone,
        companyPhone: partnerData.companyPhone,
        businessNo: partnerData.businessNo,
        industry: partnerData.businessType,
        sector: partnerData.businessItem,
        taxEmail: partnerData.taxEmail,
        companyCode: `CODE-${partnerData.id.toUpperCase()}`
      });

      // Address Parsing
      const fullAddr = partnerData.addresses.length > 0 ? partnerData.addresses[0].address : '';
      const zipMatch = fullAddr.match(/^\((\d+)\)\s*(.*)$/);
      if (zipMatch) {
        setAddrZone(zipMatch[1]);
        setAddrMain(zipMatch[2]);
        setAddrDetail('');
      } else {
        setAddrZone('');
        setAddrMain(fullAddr);
        setAddrDetail('');
      }

      setManagerInfo(prev => ({
        ...prev,
        name: partnerData.managerName,
        phone: partnerData.managerPhone,
        id: partnerData.adminId,
        password: partnerData.password
      }));

      // Sync grade margins
      if (partnerData.gradeMargins && partnerData.gradeMargins.length > 0) {
        setGradeMargins(partnerData.gradeMargins);
      } else {
        // Default initialization if empty
        setGradeMargins([
          { id: 'gm1', grade: 'A', margin: '5' },
          { id: 'gm2', grade: 'B', margin: '10' },
          { id: 'gm3', grade: 'C', margin: '15' },
          { id: 'gm4', grade: 'D', margin: '20' },
        ]);
      }
    }
  }, [partnerData]);

  // --- Static Script Utilization ---
  useEffect(() => {
    if (!isPostcodeOpen) return;

    const initPostcode = () => {
      if (window.daum && window.daum.Postcode) {
        if (postcodeRef.current) {
          postcodeRef.current.innerHTML = ''; // Clean container
          new window.daum.Postcode({
            oncomplete: function (data: any) {
              setAddrZone(data.zonecode);
              setAddrMain(data.roadAddress || data.jibunAddress);
              setAddrDetail('');
              setIsPostcodeOpen(false);

              setTimeout(() => {
                document.getElementById('hqAddrDetail')?.focus();
              }, 100);
            },
            onresize: function (size: any) {
              if (postcodeRef.current) {
                postcodeRef.current.style.height = size.height + 'px';
              }
            },
            width: '100%',
            height: '100%',
          }).embed(postcodeRef.current);
        }
      } else {
        // Retry if script is not fully ready (rare in this setup)
        setPostcodeError("우편번호 스크립트 로딩 중...");
        const timer = setTimeout(initPostcode, 500);
        return () => clearTimeout(timer);
      }
    };

    // Delay slightly to ensure DOM is ready
    const t = setTimeout(initPostcode, 100);
    return () => clearTimeout(t);

  }, [isPostcodeOpen]);

  // --- Handlers ---
  const handleBasicChange = (field: string, value: string) => {
    setBasicInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleManagerChange = (field: string, value: string) => {
    setManagerInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleAdminCostChange = (field: string, value: string) => {
    setAdminCostInfo(prev => {
      const next = { ...prev, [field]: value };
      return next;
    });
  };

  // Grade Margin Handlers
  const handleGradeChange = (id: string, field: keyof GradeMargin, value: string) => {
    setGradeMargins(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleAddGrade = () => {
    const newGrade = { id: `gm-${Date.now()}`, grade: '', margin: '' };
    setGradeMargins(prev => [...prev, newGrade]);
  };

  const handleDeleteGrade = (id: string) => {
    if (confirm('해당 등급 설정을 삭제하시겠습니까?')) {
      setGradeMargins(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleSaveGradeSettings = () => {
    updatePartner(targetId, {
      gradeMargins: gradeMargins
    });
    alert('등급별 판매가가 저장되었습니다.');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'LICENSE' | 'PROFILE' | 'SOLUTION_MAIN') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // SOLUTION_MAIN은 localStorage 용량 절약을 위해 더 강하게 압축
    const MAX_WIDTH = target === 'SOLUTION_MAIN' ? 1200 : 1920;
    const MAX_HEIGHT = target === 'SOLUTION_MAIN' ? 675 : 1080;
    const QUALITY = target === 'SOLUTION_MAIN' ? 0.65 : 0.88;

    const img = new Image();
    const reader = new FileReader();

    reader.onloadend = () => {
      img.onload = () => {
        let { width, height } = img;

        // 리사이징 비율 계산
        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
          const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', QUALITY);

        try {
          if (target === 'LICENSE') setLicenseImage(compressedDataUrl);
          else if (target === 'SOLUTION_MAIN') setSolutionImage(roleKey, compressedDataUrl);
          else handleManagerChange('photoUrl', compressedDataUrl);
        } catch (err) {
          console.error('이미지 저장 실패:', err);
          alert('이미지 용량이 너무 큽니다. 더 작은 이미지를 사용해주세요.');
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);

    // input 초기화 (같은 파일 재선택 가능하도록)
    e.target.value = '';
  };

  const handleSave = () => {
    const fullAddress = `(${addrZone}) ${addrMain} ${addrDetail}`.trim();

    updatePartner(targetId, {
      partnerName: basicInfo.companyName,
      addresses: [{ id: 'addr-update', address: fullAddress }],
      ceoName: basicInfo.ceoName,
      ceoPhone: basicInfo.ceoPhone,
      companyPhone: basicInfo.companyPhone,
      businessNo: basicInfo.businessNo,
      businessType: basicInfo.industry,
      businessItem: basicInfo.sector,
      taxEmail: basicInfo.taxEmail,
      managerName: managerInfo.name,
      managerPhone: managerInfo.phone,
      adminId: managerInfo.id,
      password: managerInfo.password,
      // If Fabric Supplier or Distributor, we also save grade margins here for consistency, though there's a dedicated button
      ...((role === UserRole.FABRIC_SUPPLIER || role === UserRole.DISTRIBUTOR) ? { gradeMargins } : {})
    });

    // If Admin, save global cost settings
    if (role === UserRole.ADMIN) {
      setStandardCosts(adminCostInfo);
    }

    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newLog: HistoryLog = {
      id: `log-${Date.now()}`,
      date: formattedDate,
      content: '본사 정보 및 설정 수정 저장',
      worker: managerInfo.name || '사용자'
    };

    setHistoryLogs(prev => [newLog, ...prev]);

    alert('본사 정보가 저장되었습니다.');
  };

  return (
    <div id="hq-info-container" className="flex flex-col h-full overflow-hidden" style={{ background: 'var(--admin-bg)', color: 'var(--admin-text)' }}>

      {/* 1. Top Header - 상품스팩 스타일 통일 */}
      <div id="hq-header" className="flex-shrink-0 border-b px-8 h-20 shadow-sm z-20 flex items-center justify-between gap-4"
        style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)' }}>
        <div className="flex items-center gap-4 min-w-fit">
          <Building2 style={{ color: 'var(--theme-primary)' }} className="shrink-0" size={28} />
          <h1 className="text-2xl font-bold whitespace-nowrap" style={{ color: 'var(--admin-text)' }}>기본설정</h1>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full border shadow-sm" style={{ color: 'var(--theme-primary)', background: 'var(--theme-primary-bg)', borderColor: 'var(--theme-primary)' }}>
            {partnerData?.partnerName || '본사'}
          </span>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg active:scale-95 text-white flex-shrink-0"
          style={{ background: 'var(--theme-primary)' }}
        >
          <Save size={16} /> 저장하기
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto w-full pb-20 px-8 pt-8 relative">

      <div className="flex flex-col xl:flex-row gap-6">

        {/* LEFT COLUMN (Forms) */}
        <div className="flex-1 flex flex-col gap-6 min-w-0">

          {/* A. Basic Info Card */}
          <div id="card-basic-info" className="rounded-2xl p-6 relative overflow-hidden" style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}>
            <div className="absolute top-0 left-0 w-full h-1" style={{ background: 'var(--theme-primary)' }} />
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--admin-text)' }}>
                <FileText size={20} className="text-gray-400" /> 기본 정보
              </h3>
              <div id="hq-company-code" className="px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1" style={{ background: 'var(--admin-input-bg)', color: 'var(--admin-text-sub)' }}>
                <Hash size={12} /> 코드: {basicInfo.companyCode}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="col-span-2">
                <label className="text-[11px] font-bold uppercase block mb-1.5" style={{ color: 'var(--admin-text-sub)' }}>사업자 이름 (법인명)</label>
                <input
                  id="input-hq-company-name"
                  type="text"
                  value={basicInfo.companyName}
                  onChange={(e) => handleBasicChange('companyName', e.target.value)}
                  className="w-full rounded-xl px-4 py-2.5 text-sm font-bold outline-none" style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--theme-primary)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--admin-border)')}
                />
              </div>

              {/* Address Section */}
              <div className="col-span-2">
                <label className="text-[11px] font-bold uppercase block mb-1.5 flex items-center gap-1" style={{ color: 'var(--admin-text-sub)' }}>
                  <MapPin size={10} /> 주소 (우편번호 검색)
                </label>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <input
                      id="input-hq-zip"
                      type="text"
                      value={addrZone}
                      readOnly
                      placeholder="우편번호"
                      className="w-24 rounded-xl px-3 py-2.5 text-sm outline-none cursor-not-allowed" style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text-sub)', opacity: 0.7 }}
                    />
                    <button
                      id="btn-hq-postcode"
                      onClick={() => setIsPostcodeOpen(true)}
                      className="text-white rounded-xl px-4 py-2 text-xs font-bold transition-all whitespace-nowrap" style={{ background: 'var(--theme-primary)' }} onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')} onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                    >
                      우편번호 검색
                    </button>
                  </div>
                  <input
                    id="input-hq-addr-main"
                    type="text"
                    value={addrMain}
                    readOnly
                    placeholder="기본 주소 (검색 시 자동 입력)"
                    className="w-full rounded-xl px-4 py-2.5 text-sm font-medium outline-none" style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}
                    onFocus={e => (e.currentTarget.style.borderColor = 'var(--theme-primary)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'var(--admin-border)')}
                  />
                  <input
                    id="input-hq-addr-detail"
                    type="text"
                    value={addrDetail}
                    onChange={(e) => setAddrDetail(e.target.value)}
                    placeholder="상세 주소 입력 (예: 101호)"
                    className="w-full rounded-xl px-4 py-2.5 text-sm font-medium outline-none" style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}
                    onFocus={e => (e.currentTarget.style.borderColor = 'var(--theme-primary)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'var(--admin-border)')}
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase block mb-1.5" style={{ color: 'var(--admin-text-sub)' }}>대표자 이름</label>
                <input
                  id="input-hq-ceo-name"
                  type="text"
                  value={basicInfo.ceoName}
                  onChange={(e) => handleBasicChange('ceoName', e.target.value)}
                  className="w-full rounded-xl px-4 py-2.5 text-sm font-medium outline-none" style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--theme-primary)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--admin-border)')}
                />
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase block mb-1.5 flex items-center gap-1" style={{ color: 'var(--admin-text-sub)' }}><Phone size={10} /> 대표자 전화</label>
                <input
                  id="input-hq-ceo-phone"
                  type="text"
                  value={basicInfo.ceoPhone}
                  onChange={(e) => handleBasicChange('ceoPhone', formatPhoneNumber(e.target.value))}
                  className="w-full rounded-xl px-4 py-2.5 text-sm font-medium outline-none" style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--theme-primary)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--admin-border)')}
                />
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase block mb-1.5 flex items-center gap-1" style={{ color: 'var(--admin-text-sub)' }}><Phone size={10} /> 사업자 전화</label>
                <input
                  id="input-hq-company-phone"
                  type="text"
                  value={basicInfo.companyPhone}
                  onChange={(e) => handleBasicChange('companyPhone', formatPhoneNumber(e.target.value))}
                  className="w-full rounded-xl px-4 py-2.5 text-sm font-medium outline-none" style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--theme-primary)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--admin-border)')}
                />
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase block mb-1.5" style={{ color: 'var(--admin-text-sub)' }}>사업자 번호</label>
                <input
                  id="input-hq-biz-no"
                  type="text"
                  value={basicInfo.businessNo}
                  onChange={(e) => handleBasicChange('businessNo', e.target.value)}
                  className="w-full rounded-xl px-4 py-2.5 text-sm font-medium outline-none" style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--theme-primary)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--admin-border)')}
                />
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase block mb-1.5" style={{ color: 'var(--admin-text-sub)' }}>업태</label>
                <input
                  id="input-hq-industry"
                  type="text"
                  value={basicInfo.industry}
                  onChange={(e) => handleBasicChange('industry', e.target.value)}
                  className="w-full rounded-xl px-4 py-2.5 text-sm font-medium outline-none" style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--theme-primary)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--admin-border)')}
                />
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase block mb-1.5" style={{ color: 'var(--admin-text-sub)' }}>종목 (업종)</label>
                <input
                  id="input-hq-sector"
                  type="text"
                  value={basicInfo.sector}
                  onChange={(e) => handleBasicChange('sector', e.target.value)}
                  className="w-full rounded-xl px-4 py-2.5 text-sm font-medium outline-none" style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--theme-primary)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--admin-border)')}
                />
              </div>
              <div className="col-span-2">
                <label className="text-[11px] font-bold uppercase block mb-1.5 flex items-center gap-1" style={{ color: 'var(--admin-text-sub)' }}><Mail size={10} /> 세금계산서 이메일</label>
                <input
                  id="input-hq-tax-email"
                  type="email"
                  value={basicInfo.taxEmail}
                  onChange={(e) => handleBasicChange('taxEmail', e.target.value)}
                  className="w-full rounded-xl px-4 py-2.5 text-sm font-medium outline-none" style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--theme-primary)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--admin-border)')}
                />
              </div>
            </div>
          </div>

          {/* B. Manager Info Card */}
          <div id="card-manager-info" className="rounded-2xl p-6" style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}>
            <h3 className="text-lg font-bold flex items-center gap-2 mb-6" style={{ color: 'var(--admin-text)' }}>
              <User size={20} className="text-gray-400" /> 담당자 정보
            </h3>

            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex flex-col items-center gap-2">
                <div id="manager-profile-pic" className="w-32 h-32 rounded-full flex items-center justify-center overflow-hidden relative group cursor-pointer" style={{ background: 'var(--admin-input-bg)', border: '2px solid var(--admin-border)' }}>
                  {managerInfo.photoUrl ? (
                    <img src={managerInfo.photoUrl} alt="Manager" className="w-full h-full object-cover" />
                  ) : (
                    <User size={48} style={{ color: 'var(--admin-border)' }} />
                  )}
                  <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white text-xs font-bold">
                    <Upload size={16} className="mb-1 mr-1" /> 변경
                    <input id="input-manager-photo" type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'PROFILE')} />
                  </label>
                </div>
                <span className="text-xs font-medium" style={{ color: 'var(--admin-text-sub)' }}>프로필 사진</span>
              </div>

              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="text-[11px] font-bold uppercase block mb-1.5" style={{ color: 'var(--admin-text-sub)' }}>담당자 이름</label>
                  <input
                    id="input-manager-name"
                    type="text"
                    value={managerInfo.name}
                    onChange={(e) => handleManagerChange('name', e.target.value)}
                    className="w-full rounded-xl px-4 py-2.5 text-sm font-bold outline-none" style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}
                    onFocus={e => (e.currentTarget.style.borderColor = 'var(--theme-primary)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'var(--admin-border)')}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase block mb-1.5 flex items-center gap-1" style={{ color: 'var(--admin-text-sub)' }}><Briefcase size={10} /> 직함</label>
                  <input
                    id="input-manager-job"
                    type="text"
                    value={managerInfo.jobTitle}
                    onChange={(e) => handleManagerChange('jobTitle', e.target.value)}
                    className="w-full rounded-xl px-4 py-2.5 text-sm font-medium outline-none" style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}
                    onFocus={e => (e.currentTarget.style.borderColor = 'var(--theme-primary)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'var(--admin-border)')}
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-[11px] font-bold uppercase block mb-1.5 flex items-center gap-1" style={{ color: 'var(--admin-text-sub)' }}><Phone size={10} /> 담당자 휴대폰</label>
                  <input
                    id="input-manager-phone"
                    type="text"
                    value={managerInfo.phone}
                    onChange={(e) => handleManagerChange('phone', formatPhoneNumber(e.target.value))}
                    className="w-full rounded-xl px-4 py-2.5 text-sm font-medium outline-none" style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}
                    onFocus={e => (e.currentTarget.style.borderColor = 'var(--theme-primary)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'var(--admin-border)')}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase block mb-1.5" style={{ color: 'var(--admin-text-sub)' }}>시스템 ID</label>
                  {role === UserRole.ADMIN ? (
                    <input
                      id="input-manager-id"
                      type="text"
                      value={managerInfo.id}
                      onChange={(e) => handleManagerChange('id', e.target.value)}
                      className="w-full rounded-xl px-4 py-2.5 text-sm font-medium outline-none"
                      style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}
                      onFocus={e => (e.currentTarget.style.borderColor = 'var(--theme-primary)')}
                      onBlur={e => (e.currentTarget.style.borderColor = 'var(--admin-border)')}
                    />
                  ) : (
                    <input
                      id="input-manager-id"
                      type="text"
                      value={managerInfo.id}
                      readOnly
                      className="w-full rounded-xl px-4 py-2.5 text-sm font-medium cursor-not-allowed outline-none" style={{ background: 'var(--admin-border)', border: '1px solid var(--admin-border)', color: 'var(--admin-text-sub)' }}
                    />
                  )}
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase block mb-1.5" style={{ color: 'var(--admin-text-sub)' }}>비밀번호</label>
                  <input
                    id="input-manager-pw"
                    type="password"
                    value={managerInfo.password}
                    onChange={(e) => handleManagerChange('password', e.target.value)}
                    className="w-full rounded-xl px-4 py-2.5 text-sm font-medium outline-none" style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}
                    onFocus={e => (e.currentTarget.style.borderColor = 'var(--theme-primary)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'var(--admin-border)')}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* B-2. Product Destination Card - ADMIN에서는 숨김 */}
          {role !== UserRole.ADMIN && (<div id="card-destination" className="rounded-2xl p-6 relative overflow-hidden" style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}>
            <div className="absolute top-0 left-0 w-full h-1" style={{ background: 'var(--theme-primary)' }} />
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--admin-text)' }}>
                <Package size={20} className="text-gray-400" /> 제품도착지
              </h3>
              <div className="flex gap-2">
                <button onClick={() => handleAddDestination('freight')}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all" style={{ background: 'var(--theme-primary-bg)', color: 'var(--theme-primary)', border: '1px solid var(--theme-primary)' }}>
                  <Plus size={14} /> 화물 추가
                </button>
                <button onClick={() => handleAddDestination('parcel')}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all" style={{ background: 'var(--admin-input-bg)', color: 'var(--admin-text-sub)', border: '1px solid var(--admin-border)' }}>
                  <Plus size={14} /> 택배 추가
                </button>
              </div>
            </div>

            {destinations.length === 0 ? (
              <div className="text-center py-12" style={{ color: 'var(--admin-text-sub)' }}>
                <Truck size={40} className="mx-auto mb-3" style={{ color: 'var(--admin-border)' }} />
                <p className="text-sm font-medium">등록된 도착지가 없습니다.</p>
                <p className="text-xs mt-1">위의 버튼으로 화물 또는 택배 도착지를 추가하세요.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {destinations.map((dest) => (
                  <div key={dest.id} className="rounded-xl p-4 relative group transition-all" style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)' }}>

                    <div className="flex items-center justify-between mb-3">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold" style={{ background: 'var(--theme-primary-bg)', color: 'var(--theme-primary)' }}>
                        {dest.type === 'freight' ? <><Truck size={12} /> 화물</> : <><Package size={12} /> 택배</>}
                      </span>
                      <button onClick={() => handleDeleteDest(dest.id)}
                        className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {dest.type === 'freight' ? (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-bold uppercase block mb-1" style={{ color: 'var(--admin-text-sub)' }}>운송사</label>
                          <input type="text" value={dest.carrier}
                            onChange={e => handleDestChange(dest.id, 'carrier', e.target.value)}
                            placeholder="운송사명"
                            className="w-full rounded-lg px-3 py-2 text-sm font-medium outline-none" style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}
                            onFocus={e => (e.currentTarget.style.borderColor = 'var(--theme-primary)')}
                            onBlur={e => (e.currentTarget.style.borderColor = 'var(--admin-border)')} />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold uppercase block mb-1" style={{ color: 'var(--admin-text-sub)' }}>지점명</label>
                          <input type="text" value={dest.branch}
                            onChange={e => handleDestChange(dest.id, 'branch', e.target.value)}
                            placeholder="지점명"
                            className="w-full rounded-lg px-3 py-2 text-sm font-medium outline-none" style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}
                            onFocus={e => (e.currentTarget.style.borderColor = 'var(--theme-primary)')}
                            onBlur={e => (e.currentTarget.style.borderColor = 'var(--admin-border)')} />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold uppercase block mb-1 flex items-center gap-1" style={{ color: 'var(--admin-text-sub)' }}><Phone size={9} /> 전화번호</label>
                          <input type="tel" value={dest.phone}
                            onChange={e => handleDestPhoneChange(dest.id, e.target.value)}
                            placeholder="02-000-0000"
                            className="w-full rounded-lg px-3 py-2 text-sm font-medium outline-none" style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}
                            onFocus={e => (e.currentTarget.style.borderColor = 'var(--theme-primary)')}
                            onBlur={e => (e.currentTarget.style.borderColor = 'var(--admin-border)')} />
                        </div>
                        <div className="col-span-2">
                          <label className="text-[10px] font-bold uppercase block mb-1 flex items-center gap-1" style={{ color: 'var(--admin-text-sub)' }}><MapPin size={9} /> 주소</label>
                          <div className="flex gap-2 mb-2">
                            <input type="text" value={dest.address} readOnly
                              placeholder="주소 검색 버튼을 클릭하세요"
                              className="flex-1 rounded-lg px-3 py-2 text-sm font-medium outline-none cursor-not-allowed" style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text-sub)', opacity: 0.7 }} />
                            <button onClick={() => handleDestAddressSearch(dest.id)}
                              className="flex items-center gap-1 text-white px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap" style={{ background: 'var(--theme-primary)' }} onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')} onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
                              <Search size={12} /> 주소검색
                            </button>
                          </div>
                          <input type="text" id={`dest-addr-detail-${dest.id}`}
                            value={dest.addressDetail}
                            onChange={e => handleDestChange(dest.id, 'addressDetail', e.target.value)}
                            placeholder="상세 주소 입력 (예: 3층 물류센터)"
                            className="w-full rounded-lg px-3 py-2 text-sm font-medium outline-none" style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}
                            onFocus={e => (e.currentTarget.style.borderColor = 'var(--theme-primary)')}
                            onBlur={e => (e.currentTarget.style.borderColor = 'var(--admin-border)')} />
                        </div>
                      </div>
                    ) : (
                      <div>
                        <label className="text-[10px] font-bold uppercase block mb-1 flex items-center gap-1" style={{ color: 'var(--admin-text-sub)' }}><MapPin size={9} /> 배송 주소</label>
                        <div className="flex gap-2 mb-2">
                          <input type="text" value={dest.address} readOnly
                            placeholder="주소 검색 버튼을 클릭하세요"
                            className="flex-1 rounded-lg px-3 py-2 text-sm font-medium outline-none cursor-not-allowed" style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text-sub)', opacity: 0.7 }} />
                          <button onClick={() => handleDestAddressSearch(dest.id)}
                            className="flex items-center gap-1 text-white px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap" style={{ background: 'var(--theme-primary)' }} onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')} onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
                            <Search size={12} /> 주소검색
                          </button>
                        </div>
                        <input type="text" id={`dest-addr-detail-${dest.id}`}
                          value={dest.addressDetail}
                          onChange={e => handleDestChange(dest.id, 'addressDetail', e.target.value)}
                          placeholder="상세 주소 입력 (예: 101호)"
                          className="w-full rounded-lg px-3 py-2 text-sm font-medium outline-none" style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}
                          onFocus={e => (e.currentTarget.style.borderColor = 'var(--theme-primary)')}
                          onBlur={e => (e.currentTarget.style.borderColor = 'var(--admin-border)')} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          )}

          {/* Supplier & Distributor Specific: Grade Price Settings */}
          {(role === UserRole.FABRIC_SUPPLIER || role === UserRole.DISTRIBUTOR) && (
            <div id="card-supplier-grade-settings" className="rounded-2xl p-6 relative overflow-hidden" style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}>
              <div className="absolute top-0 left-0 w-full h-1" style={{ background: 'var(--theme-primary)' }} />
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--admin-text)' }}>
                  <Percent size={20} className="text-gray-400" /> 거래처 등급별 판매가 설정
                </h3>
                <button
                  onClick={handleAddGrade}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all" style={{ background: 'var(--admin-input-bg)', color: 'var(--admin-text-sub)', border: '1px solid var(--admin-border)' }} onMouseEnter={e => { (e.currentTarget).style.color = 'var(--theme-primary)'; (e.currentTarget).style.borderColor = 'var(--theme-primary)'; }} onMouseLeave={e => { (e.currentTarget).style.color = 'var(--admin-text-sub)'; (e.currentTarget).style.borderColor = 'var(--admin-border)'; }}
                >
                  <Plus size={14} /> 등급 추가
                </button>
              </div>

              <div className="overflow-hidden rounded-xl" style={{ border: '1px solid var(--admin-border)' }}>
                <table className="w-full text-sm text-left">
                  <thead className="font-bold uppercase text-[10px]" style={{ background: 'var(--admin-input-bg)', color: 'var(--admin-text-sub)' }}>
                    <tr>
                      <th className="px-4 py-3 w-32">등급 (Grade)</th>
                      <th className="px-4 py-3">마진율 (Margin %)</th>
                      <th className="px-4 py-3 w-20 text-center">관리</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ '--tw-divide-opacity': 1 }}>
                    {gradeMargins.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-4 py-6 text-center text-gray-400 text-xs">설정된 등급이 없습니다.</td>
                      </tr>
                    ) : (
                      gradeMargins.map((item) => (
                        <tr key={item.id} className="group transition-colors" style={{ borderTop: '1px solid var(--admin-border)' }}>
                          <td className="px-4 py-2">
                            <input
                              type="text"
                              value={item.grade}
                              onChange={(e) => handleGradeChange(item.id, 'grade', e.target.value)}
                              className="w-full rounded-lg px-3 py-2 text-sm font-bold outline-none text-center"
                              style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}
                              onFocus={e => (e.currentTarget.style.borderColor = 'var(--theme-primary)')}
                              onBlur={e => (e.currentTarget.style.borderColor = 'var(--admin-border)')}
                              placeholder="A"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <div className="relative">
                              <input
                                type="text"
                                value={item.margin}
                                onChange={(e) => handleGradeChange(item.id, 'margin', e.target.value)}
                                className="w-full rounded-lg pl-3 pr-8 py-2 text-sm font-medium outline-none text-right"
                                style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}
                                onFocus={e => (e.currentTarget.style.borderColor = 'var(--theme-primary)')}
                                onBlur={e => (e.currentTarget.style.borderColor = 'var(--admin-border)')}
                                placeholder="0"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">%</span>
                            </div>
                          </td>
                          <td className="px-4 py-2 text-center">
                            <button
                              onClick={() => handleDeleteGrade(item.id)}
                              className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* FINAL SAVE BUTTON FOR THIS CARD */}
              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleSaveGradeSettings}
                  className="flex items-center gap-1.5 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md active:scale-95 transition-all"
                  style={{ background: 'var(--theme-primary)' }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                >
                  <Save size={16} /> 설정 저장
                </button>
              </div>
            </div>
          )}

          {/* C. Payment Info Card - ADMIN에서는 숨김, 다른 역할에만 표시 */}
          {role !== UserRole.ADMIN && (
          <div id="card-payment-info" className="rounded-2xl p-6 relative overflow-hidden" style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}>
            <div className="absolute top-0 left-0 w-full h-1" style={{ background: 'var(--theme-primary)' }} />

            {role === UserRole.ADMIN ? (
              // ADMIN VIEW: Standard Management Fee Settings
              <>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--admin-text)' }}>
                    <CreditCard size={20} className="text-gray-400" /> 관리비 표준항목설정
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div className="col-span-1">
                    <label className="text-[11px] font-bold uppercase block mb-1.5" style={{ color: 'var(--admin-text-sub)' }}>AI 건당 비용 (원)</label>
                    <input
                      id="input-cost-ai"
                      type="text"
                      value={adminCostInfo.aiCost}
                      onChange={(e) => handleAdminCostChange('aiCost', e.target.value)}
                      className="w-full rounded-xl px-4 py-2.5 text-sm font-bold outline-none text-right"
                      style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}
                      onFocus={e => (e.currentTarget.style.borderColor = 'var(--theme-primary)')}
                      onBlur={e => (e.currentTarget.style.borderColor = 'var(--admin-border)')}
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="text-[11px] font-bold uppercase block mb-1.5" style={{ color: 'var(--admin-text-sub)' }}>DB 관리 비용 (원/월) : 10만건 기준</label>
                    <input
                      id="input-cost-db-mgmt"
                      type="text"
                      value={adminCostInfo.dbManagementCost}
                      onChange={(e) => handleAdminCostChange('dbManagementCost', e.target.value)}
                      className="w-full rounded-xl px-4 py-2.5 text-sm font-bold outline-none text-right"
                      style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}
                      onFocus={e => (e.currentTarget.style.borderColor = 'var(--theme-primary)')}
                      onBlur={e => (e.currentTarget.style.borderColor = 'var(--admin-border)')}
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="text-[11px] font-bold uppercase block mb-1.5" style={{ color: 'var(--admin-text-sub)' }}>DB 사용 비용 (원/월)</label>
                    <input
                      id="input-cost-db-usage"
                      type="text"
                      value={adminCostInfo.dbUsageCost}
                      onChange={(e) => handleAdminCostChange('dbUsageCost', e.target.value)}
                      className="w-full rounded-xl px-4 py-2.5 text-sm font-bold outline-none text-right"
                      style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}
                      onFocus={e => (e.currentTarget.style.borderColor = 'var(--theme-primary)')}
                      onBlur={e => (e.currentTarget.style.borderColor = 'var(--admin-border)')}
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="text-[11px] font-bold uppercase block mb-1.5" style={{ color: 'var(--admin-text-sub)' }}>거래 수수료 (%)</label>
                    <input
                      id="input-cost-fee"
                      type="text"
                      value={adminCostInfo.transactionFee}
                      onChange={(e) => handleAdminCostChange('transactionFee', e.target.value)}
                      className="w-full rounded-xl px-4 py-2.5 text-sm font-bold outline-none text-right"
                      style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}
                      onFocus={e => (e.currentTarget.style.borderColor = 'var(--theme-primary)')}
                      onBlur={e => (e.currentTarget.style.borderColor = 'var(--admin-border)')}
                    />
                  </div>
                </div>
              </>
            ) : (
              // PARTNER VIEW: Updated Payment Info with Breakdown
              <>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--admin-text)' }}>
                    <CreditCard size={20} style={{ color: 'var(--admin-text-sub)' }} /> 결제 정보
                  </h3>
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold" style={{ background: 'var(--theme-primary-bg)', color: 'var(--theme-primary)', border: '1px solid var(--admin-border)' }}>
                    <Calendar size={12} style={{ color: 'var(--theme-primary)' }} />
                    <span>매월 <span style={{ color: 'var(--theme-primary)' }}>{paymentInfo.paymentDate}</span>일 결제</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {/* DB Management Fee */}
                  <div className="flex flex-col p-4 rounded-xl transition-colors" style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)' }}>
                    <span className="text-xs font-bold mb-1" style={{ color: 'var(--admin-text-sub)' }}>DB관리요금</span>
                    <span className="text-lg font-bold truncate" style={{ color: 'var(--admin-text)' }}>200,000 <span className="text-xs font-normal" style={{ color: 'var(--admin-text-sub)' }}>원</span></span>
                    <span className="text-[10px] mt-1" style={{ color: 'var(--admin-text-sub)' }}>123,901 건</span>
                  </div>

                  {/* DB Usage Fee */}
                  <div className="flex flex-col p-4 rounded-xl transition-colors" style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)' }}>
                    <span className="text-xs font-bold mb-1" style={{ color: 'var(--admin-text-sub)' }}>DB사용요금</span>
                    <span className="text-lg font-bold truncate" style={{ color: 'var(--admin-text)' }}>17,500 <span className="text-xs font-normal" style={{ color: 'var(--admin-text-sub)' }}>원</span></span>
                    <span className="text-[10px] mt-1" style={{ color: 'var(--admin-text-sub)' }}>35,001 건</span>
                  </div>

                  {/* AI Usage Fee */}
                  <div className="flex flex-col p-4 rounded-xl transition-colors" style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)' }}>
                    <span className="text-xs font-bold mb-1" style={{ color: 'var(--admin-text-sub)' }}>AI사용요금</span>
                    <span className="text-lg font-bold truncate" style={{ color: 'var(--admin-text)' }}>103,000 <span className="text-xs font-normal" style={{ color: 'var(--admin-text-sub)' }}>원</span></span>
                    <span className="text-[10px] mt-1" style={{ color: 'var(--admin-text-sub)' }}>206 건</span>
                  </div>

                  {/* Commission Fee */}
                  <div className="flex flex-col p-4 rounded-xl transition-colors" style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)' }}>
                    <span className="text-xs font-bold mb-1" style={{ color: 'var(--admin-text-sub)' }}>수수료비용</span>
                    <span className="text-lg font-bold truncate" style={{ color: 'var(--admin-text)' }}>1,930,200 <span className="text-xs font-normal" style={{ color: 'var(--admin-text-sub)' }}>원</span></span>
                    <span className="text-[10px] mt-1" style={{ color: 'var(--admin-text-sub)' }}>7%</span>
                  </div>

                  {/* Total Estimated Amount */}
                  <div className="flex flex-col p-4 rounded-xl col-span-2 md:col-span-1 shadow-sm" style={{ background: 'var(--theme-primary-bg)', border: '1px solid var(--admin-border)' }}>
                    <span className="text-xs font-bold mb-1" style={{ color: 'var(--theme-primary)' }}>결제 예정 금액</span>
                    <span className="text-lg font-bold truncate" style={{ color: 'var(--theme-primary)' }}>2,250,700 <span className="text-xs font-normal">원</span></span>
                    <span className="text-[10px] mt-1" style={{ color: 'var(--theme-primary)', opacity: 0.7 }}>VAT 별도</span>
                  </div>
                </div>
              </>
            )}
          </div>
          )}

        </div>

        {/* RIGHT COLUMN (Sidebar) */}
        <div id="hq-right-sidebar" className="w-full xl:w-[350px] flex flex-col gap-6 flex-shrink-0">


          <div id="card-license" className="rounded-2xl p-6 flex flex-col min-h-[300px]" style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}>
            <h3 className="text-md font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--admin-text)' }}>
              <FileText size={18} style={{ color: 'var(--admin-text-sub)' }} /> 사업자등록증
            </h3>
            <div className="flex-1 rounded-xl border-2 border-dashed flex flex-col items-center justify-center relative overflow-hidden group transition-all" style={{ background: 'var(--admin-input-bg)', borderColor: 'var(--admin-border)' }} onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--theme-primary)')} onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--admin-border)')}>
              {licenseImage ? (
                <img src={licenseImage} alt="License" className="w-full h-full object-contain p-2" />
              ) : (
                <div className="text-center p-4">
                  <ImageIcon size={40} className="mx-auto mb-2" style={{ color: 'var(--admin-border)' }} />
                  <p className="text-xs" style={{ color: 'var(--admin-text-sub)' }}>등록된 이미지가 없습니다.</p>
                </div>
              )}

              <label className="absolute inset-0 bg-black/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <div className="px-4 py-2 rounded-lg shadow-sm text-sm font-bold flex items-center gap-2" style={{ background: 'var(--admin-surface)', color: 'var(--admin-text)' }}>
                  <Upload size={16} /> 업로드
                </div>
                <input id="input-license-file" type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'LICENSE')} />
              </label>
            </div>
          </div>

          <div id="card-solution-main" className="rounded-2xl p-6 flex flex-col min-h-[300px]" style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}>
            <h3 className="text-md font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--admin-text)' }}>
              <Monitor size={18} style={{ color: 'var(--admin-text-sub)' }} /> 솔루션 메인 이미지
            </h3>
            <div className="flex-1 rounded-xl border-2 border-dashed flex flex-col items-center justify-center relative overflow-hidden group transition-all" style={{ background: 'var(--admin-input-bg)', borderColor: 'var(--admin-border)' }} onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--theme-primary)')} onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--admin-border)')}>
              {solutionMainImage ? (
                <img src={solutionMainImage} alt="Solution Main" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center p-4">
                  <ImageIcon size={40} className="text-gray-300 mx-auto mb-2" />
                  <p className="text-xs text-gray-400">등록된 이미지가 없습니다.</p>
                </div>
              )}

              <label className="absolute inset-0 bg-black/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <div className="rounded px-4 py-2 rounded-lg shadow-sm text-sm font-bold text-gray-700 flex items-center gap-2" style={{ background: 'var(--admin-surface)' }}>
                  <Upload size={16} /> 업로드
                </div>
                <input id="input-solution-main-file" type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'SOLUTION_MAIN')} />
              </label>
            </div>
          </div>

          <div id="card-history" className="rounded-2xl p-6 flex-1" style={{ background: 'var(--admin-surface)' }}>
            <h3 className="text-md font-bold text-gray-800 mb-4 flex items-center gap-2">
              <History size={18} className="text-gray-400" /> 수정 이력
            </h3>
            <div className="relative pl-2 space-y-6" style={{ borderLeft: '1px solid var(--admin-border)' }}>
              {historyLogs.map((log) => (
                <div key={log.id} id={`log-item-${log.id}`} className="relative pl-4">
                    <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full border-2"
                      style={{ borderColor: 'var(--theme-primary)', background: 'var(--admin-surface)' }} />
                  <div className="text-[10px] text-gray-400 font-mono mb-0.5">{log.date}</div>
                  <div className="text-sm font-medium text-gray-800">{log.content}</div>
                  <div className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-1">
                    <User size={10} /> {log.worker}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Postcode Modal */}
      <AnimatePresence>
        {isPostcodeOpen && (
          <div id="modal-postcode" className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setIsPostcodeOpen(false)}
            />

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-[500px] h-[600px] flex flex-col overflow-hidden relative z-10"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
                <h3 className="font-bold text-gray-800">우편번호 검색</h3>
                <button
                  id="btn-close-postcode"
                  onClick={() => setIsPostcodeOpen(false)}
                  className="p-1 rounded-full hover:bg-gray-200 text-gray-500 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              {/* Container for Postcode */}
              <div ref={postcodeRef} className="flex-1 w-full h-full rounded relative" style={{ background: 'var(--admin-surface)' }}>
                {/* Loading Indicator */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 gap-2 bg-gray-50">
                  <Loader2 size={32} className="animate-spin text-blue-500" />
                  <span className="text-xs font-medium">우편번호 서비스 로딩중...</span>
                </div>
                {/* Error Message if Script fails */}
                {postcodeError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-red-500 gap-2 bg-white z-20">
                    <AlertCircle size={32} />
                    <span className="text-xs font-medium px-4 text-center">{postcodeError}</span>
                    <button
                      onClick={() => setIsPostcodeOpen(false)}
                      className="mt-2 text-xs bg-red-100 px-3 py-1.5 rounded-lg hover:bg-red-200 transition-colors font-bold"
                    >
                      닫기
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

        </div>
      </div>
    </div>
  );
};

export default HeadquartersInfo;
