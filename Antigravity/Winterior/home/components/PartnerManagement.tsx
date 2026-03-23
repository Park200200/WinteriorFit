
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
    Search, Plus, Trash2, Save, Building2, User,
    Phone, Mail, FileText, Check, LayoutList, RefreshCw,
    Briefcase, MapPin, X, Hash,
    CreditCard, Link2, StickyNote, Star, GripVertical, Truck, Package,
    Box, Palette, LayoutGrid, Shield, ToggleLeft, ToggleRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PartnerData, PartnerType, UserRole, FreightInfo } from '../types';
import { usePartnerContext } from '../PartnerContext';
import { useProductContext } from './ProductContext';
import ProductConfiguration from './ProductConfiguration';
import ColorConfiguration from './ColorConfiguration';
import PostcodeSearch from './PostcodeSearch';
import { useAdminTheme } from './theme/AdminThemeContext';

// ─── 역할별 할당 가능 메뉴 정의 ───────────────────────────────────────
const ROLE_MENUS: Record<string, { group: string; id: string; label: string }[]> = {
    DISTRIBUTOR: [
        { group: '기본', id: 'dashboard', label: '기본현황' },
        { group: '표준설정', id: 'dist_std_product_config', label: '표준상품' },
        { group: '표준설정', id: 'dist_std_products', label: '상품원가' },
        { group: '표준설정', id: 'dist_std_measure', label: '실사등록' },
        { group: '표준설정', id: 'dist_purchase_products', label: '매입설정' },
        { group: '표준설정', id: 'sales_settings', label: '매출설정' },
        { group: '운영', id: 'order_proc', label: '접수/발주' },
        { group: '운영', id: 'status_by_store', label: '접수처별 상태조회' },
        { group: '운영', id: 'system_view', label: '상품/시스템 보기' },
        { group: '운영', id: 'sales_mgmt', label: '매출/실사/매입' },
        { group: '관리', id: 'partners', label: '거래처관리' },
        { group: '관리', id: 'user_mgmt', label: '사용자관리' },
        { group: '관리', id: 'hq_info', label: '본사정보' },
    ],
    FABRIC_SUPPLIER: [
        { group: '기본', id: 'dashboard', label: '기본현황' },
        { group: '재고', id: 'stock_in_reservation', label: '입고예약' },
        { group: '재고', id: 'stock_in_confirmation', label: '입고확인' },
        { group: '재고', id: 'stock_adjust', label: '재고조정' },
        { group: '운영', id: 'order_reception', label: '주문접수' },
        { group: '운영', id: 'shipping', label: '출고관리' },
        { group: '운영', id: 'ledger', label: '거래원장' },
        { group: '운영', id: 'deposit', label: '입금관리' },
        { group: '관리', id: 'partners', label: '거래처관리' },
        { group: '관리', id: 'user_mgmt', label: '사용자관리' },
        { group: '관리', id: 'hq_info', label: '본사정보' },
    ],
    MANUFACTURER: [
        { group: '기본', id: 'dashboard', label: '기본현황' },
        { group: '설정', id: 'basic_config', label: '기본설정' },
        { group: '설정', id: 'product_config', label: '상품설정' },
        { group: '운영', id: 'production', label: '생산관리' },
        { group: '운영', id: 'mfg_order', label: '제작주문' },
        { group: '관리', id: 'partner_mgmt', label: '거래처관리' },
        { group: '관리', id: 'user_mgmt', label: '사용자관리' },
        { group: '관리', id: 'hq_info', label: '본사정보' },
    ],
    AGENCY: [
        { group: '기본', id: 'dashboard', label: '기본현황' },
        { group: '영업', id: 'ai_catalog', label: 'Ai카다록' },
        { group: '영업', id: 'pricing', label: '단가설정' },
        { group: '영업', id: 'estimate', label: '견적관리' },
        { group: '영업', id: 'mfg_order', label: '제작주문' },
        { group: '영업', id: 'search', label: '조회' },
        { group: '영업', id: 'schedule', label: '스케줄' },
        { group: '영업', id: 'customer', label: '고객관리' },
        { group: '관리', id: 'kiosk', label: '키오스크' },
        { group: '관리', id: 'user_mgmt', label: '사용자관리' },
        { group: '관리', id: 'hq_info', label: '본사정보' },
    ],
};

interface PartnerManagementProps {
    role?: UserRole;
    currentPartnerId?: string; // ?�속 중인 ?�용?�의 ID (Dashboard?�서 ?�달)
}

const PartnerManagement: React.FC<PartnerManagementProps> = ({ role, currentPartnerId }) => {
    // Use Context
    const { partners, setPartners, standardCosts } = usePartnerContext();
    const { nodes } = useProductContext();
    const { theme } = useAdminTheme();

    const isSupplierMode = role === UserRole.FABRIC_SUPPLIER;

    // --- STATE ---
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Filter States
    const [filterTypes, setFilterTypes] = useState<PartnerType[]>([]); // For Admin (multi-select)
    const [filterGrade, setFilterGrade] = useState<string>('ALL'); // For Supplier

    // Form State
    const initialFormState: PartnerData = {
        id: '', partnerName: '', partnerCode: '', adminId: '', password: '', ceoName: '', addresses: [], companyPhone: '', ceoPhone: '',
        managerName: '', managerPhone: '', businessNo: '', businessType: '',
        businessItem: '', taxEmail: '', type: 'DISTRIBUTOR', parentPartnerId: '',
        costSettings: standardCosts, grade: 'B', note: '',
        freightInfo: { transporter: '', branchName: '', phone: '', address: '' },
        creatorId: currentPartnerId
    };
    const [formData, setFormData] = useState<PartnerData>(initialFormState);
    const [partnerAllowedMenus, setPartnerAllowedMenus] = useState<string[]>([]);

    // Address Input State (Main)
    const [addrZone, setAddrZone] = useState('');
    const [addrMain, setAddrMain] = useState('');
    const [addrDetail, setAddrDetail] = useState('');

    // Address Input State (Freight - Supplier Only)
    const [freightAddrZone, setFreightAddrZone] = useState('');
    const [freightAddrMain, setFreightAddrMain] = useState('');
    const [freightAddrDetail, setFreightAddrDetail] = useState('');

    // Postcode UI State
    const [postcodeTarget, setPostcodeTarget] = useState<'MAIN' | 'FREIGHT' | null>(null);

    // Product Popup State
    const [isProductPopupOpen, setIsProductPopupOpen] = useState(false);
    const [productPopupRootId, setProductPopupRootId] = useState<string | null>(null);
    const [popupViewMode, setPopupViewMode] = useState<'product' | 'color'>('product');

    // Layout State (Resizable)
    const [leftWidth, setLeftWidth] = useState(600);
    const [isResizing, setIsResizing] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // --- DERIVED STATE ---
    const filteredPartners = useMemo(() => {
        let result = partners;

        // 권한�??�이??분리 로직 ?�용
        if (role !== UserRole.ADMIN && currentPartnerId) {
            // ADMIN???�니�??�신???�성??거래처나 ?�신??계정 ?�보�??�시
            result = result.filter(p => p.creatorId === currentPartnerId || p.id === currentPartnerId || p.id === `partner-${currentPartnerId}`);
        }

        // Common Search Logic - 검색어가 있으면 필터 무시하고 전체에서 검색
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(p =>
                p.partnerName.toLowerCase().includes(query) ||
                p.ceoName.toLowerCase().includes(query) ||
                p.adminId.toLowerCase().includes(query) ||
                (p.partnerCode && p.partnerCode.toLowerCase().includes(query)) ||
                p.addresses.some(a => a.address.toLowerCase().includes(query)) ||
                p.managerName.toLowerCase().includes(query) ||
                p.companyPhone.includes(query)
            );
        } else {
            // 검?�어 ?�을 ?�만 ?�체 ?�터 ?�용
            if (isSupplierMode) {
                if (filterGrade !== 'ALL') {
                    result = result.filter(p => p.grade === filterGrade);
                }
            } else {
                if (filterTypes.length > 0) {
                    result = result.filter(p => filterTypes.includes(p.type as PartnerType));
                }
            }
        }

        return result;
    }, [partners, filterTypes, filterGrade, searchQuery, isSupplierMode, role, currentPartnerId]);

    // List of Distributors for selection (Admin Only)
    const distributors = useMemo(() => partners.filter(p => p.type === 'DISTRIBUTOR'), [partners]);

    // Count products in a tree (recursively)
    const countProductsInTree = useCallback((rootId: string): number => {
        const rootNode = nodes[rootId];
        if (!rootNode) return 0;

        let count = 0;
        const traverse = (nodeId: string) => {
            const node = nodes[nodeId];
            if (!node) return;

            // Count if it's a product node
            if (node.attributes?.nodeType === 'product') {
                count++;
            }

            // Traverse children
            if (node.childrenIds && node.childrenIds.length > 0) {
                node.childrenIds.forEach(childId => traverse(childId));
            }
        };

        // Start traversal from root's children
        if (rootNode.childrenIds) {
            rootNode.childrenIds.forEach(childId => traverse(childId));
        }

        return count;
    }, [nodes]);

    // Get product count for selected partner
    const selectedPartnerProductCount = useMemo(() => {
        if (!selectedId) return 0;
        const partner = partners.find(p => p.id === selectedId);
        if (!partner) return 0;

        // Determine root ID based on partner ID
        // Extract partner suffix (e.g., 'd1' from 'partner-123-d1')
        const rootId = `root-partner-${partner.id.split('-').pop()}`;
        return countProductsInTree(rootId);
    }, [selectedId, partners, countProductsInTree]);

    // Handle product popup open
    const handleOpenProductPopup = () => {
        if (!selectedId) return;
        const partner = partners.find(p => p.id === selectedId);
        if (!partner) return;

        const rootId = `root-partner-${partner.id.split('-').pop()}`;
        setProductPopupRootId(rootId);
        setPopupViewMode('product'); // Reset to product view
        setIsProductPopupOpen(true);
    };

    // --- EFFECTS ---

    // Code Generator for Supplier
    const generatePartnerCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 3; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    };

    // Sync Form with Selection
    useEffect(() => {
        if (selectedId) {
            const partner = partners.find(p => p.id === selectedId);
            if (partner) {
                setFormData({
                    ...partner,
                    grade: partner.grade || 'B',
                    note: partner.note || '',
                    costSettings: partner.costSettings || standardCosts,
                    freightInfo: partner.freightInfo || { transporter: '', branchName: '', phone: '', address: '' }
                });

                // Address Sync (Main)
                if (partner.addresses.length > 0) {
                    const fullAddr = partner.addresses[0].address;
                    const zipMatch = fullAddr.match(/^\((\d+)\)\s*(.*)$/);
                    if (zipMatch) {
                        setAddrZone(zipMatch[1]);
                        const addrPart = zipMatch[2];
                        const [main, ...detailParts] = addrPart.split(', ');
                        setAddrMain(main || '');
                        setAddrDetail(detailParts.join(', ') || '');
                    } else {
                        setAddrZone('');
                        const [main, ...detailParts] = fullAddr.split(', ');
                        setAddrMain(main || '');
                        setAddrDetail(detailParts.join(', ') || '');
                    }
                } else {
                    setAddrZone(''); setAddrMain(''); setAddrDetail('');
                }

                // Address Sync (Freight)
                const fAddr = partner.freightInfo?.address || '';
                const fZipMatch = fAddr.match(/^\((\d+)\)\s*(.*)$/);
                if (fZipMatch) {
                    setFreightAddrZone(fZipMatch[1]);
                    const fAddrPart = fZipMatch[2];
                    const [fMain, ...fDetailParts] = fAddrPart.split(', ');
                    setFreightAddrMain(fMain || '');
                    setFreightAddrDetail(fDetailParts.join(', ') || '');
                } else {
                    setFreightAddrZone('');
                    const [fMain, ...fDetailParts] = fAddr.split(', ');
                    setFreightAddrMain(fMain || '');
                    setFreightAddrDetail(fDetailParts.join(', ') || '');
                }

            }
        } else {
            handleNew();
        }
    }, [selectedId, partners, standardCosts]);

    // --- Resizing Logic ---
    const startResizing = useCallback(() => setIsResizing(true), []);
    const stopResizing = useCallback(() => setIsResizing(false), []);
    const resize = useCallback((e: MouseEvent) => {
        if (isResizing && containerRef.current) {
            const newWidth = e.clientX - containerRef.current.getBoundingClientRect().left;
            if (newWidth > 300 && newWidth < containerRef.current.clientWidth - 400) {
                setLeftWidth(newWidth);
            }
        }
    }, [isResizing]);

    useEffect(() => {
        if (isResizing) {
            window.addEventListener('mousemove', resize);
            window.addEventListener('mouseup', stopResizing);
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        } else {
            document.body.style.cursor = 'default';
            document.body.style.userSelect = 'auto';
        }
        return () => {
            window.removeEventListener('mousemove', resize);
            window.removeEventListener('mouseup', stopResizing);
            document.body.style.cursor = 'default';
            document.body.style.userSelect = 'auto';
        };
    }, [isResizing, resize, stopResizing]);

    // --- FORMATTERS ---
    const formatPhone = (value: string) => {
        const numbers = value.replace(/\D/g, '');
        // ?�울 지??��??02)??2?�리, ?�머지(031, 010 ????3?�리
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

    const formatBusinessNo = (value: string) => {
        const numbers = value.replace(/\D/g, '');
        if (numbers.length <= 3) return numbers;
        if (numbers.length <= 5) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
        return `${numbers.slice(0, 3)}-${numbers.slice(3, 5)}-${numbers.slice(5, 10)}`;
    };

    // --- HANDLERS ---
    const handleInputChange = (field: keyof PartnerData, value: any) => {
        let finalValue = value;
        if (['companyPhone', 'ceoPhone', 'managerPhone'].includes(field)) {
            finalValue = formatPhone(value);
        } else if (field === 'businessNo') {
            finalValue = formatBusinessNo(value);
        } else if (field === 'partnerCode' && !isSupplierMode) {
            // Allow manual edit for Admin, restrict/auto for Supplier
            finalValue = value.toUpperCase().slice(0, 3);
        }
        setFormData(prev => ({ ...prev, [field]: finalValue }));
    };

    const handleFreightChange = (field: keyof FreightInfo, value: string) => {
        let finalValue = value;
        if (field === 'phone') finalValue = formatPhone(value);

        setFormData(prev => ({
            ...prev,
            freightInfo: {
                transporter: '',
                branchName: '',
                phone: '',
                address: '',
                ...(prev.freightInfo || {}),
                [field]: finalValue
            }
        }));
    };

    const updateFreightAddressInForm = (zone: string, main: string, detail: string) => {
        const full = zone ? `(${zone}) ${main}, ${detail}`.trim() : `${main}${detail ? ', ' + detail : ''}`.trim();
        setFormData(prev => ({
            ...prev,
            freightInfo: {
                transporter: '',
                branchName: '',
                phone: '',
                ...(prev.freightInfo || {}),
                address: full,
            }
        }));
    };

    const handleFreightDetailChange = (val: string) => {
        setFreightAddrDetail(val);
        updateFreightAddressInForm(freightAddrZone, freightAddrMain, val);
    };

    const handleNew = () => {
        setSelectedId(null);
        let defaultType: PartnerType = !isSupplierMode && filterTypes.length === 1 ? filterTypes[0] : 'DISTRIBUTOR';

        // If Distributor is creating, default to AGENCY and don't allow creating other DISTRIBUTORS
        if (role === UserRole.DISTRIBUTOR && defaultType === 'DISTRIBUTOR') {
            defaultType = 'AGENCY';
        }

        setFormData({
            ...initialFormState,
            id: `partner-${Date.now()}`,
            type: defaultType,
            partnerCode: isSupplierMode ? generatePartnerCode() : '',
            costSettings: standardCosts,
            freightInfo: { transporter: '', branchName: '', phone: '', address: '' },
            creatorId: currentPartnerId
        });
        setAddrZone(''); setAddrMain(''); setAddrDetail('');
        setFreightAddrZone(''); setFreightAddrMain(''); setFreightAddrDetail('');
    };

    const handlePostcode = (target: 'MAIN' | 'FREIGHT') => {
        setPostcodeTarget(target);
    };

    const handleAddAddress = () => {
        if (!addrMain) return;
        const newAddressStr = `(${addrZone}) ${addrMain}, ${addrDetail}`.trim();
        setFormData(prev => ({
            ...prev,
            addresses: [...prev.addresses, { id: `addr-${Date.now()}`, address: newAddressStr }]
        }));
        setAddrZone('');
        setAddrMain('');
        setAddrDetail('');
    };

    const handleRemoveAddress = (id: string) => {
        setFormData(prev => ({
            ...prev,
            addresses: prev.addresses.filter(a => a.id !== id)
        }));
    };

    const handlePostcodeComplete = (data: { zonecode: string; roadAddress: string; jibunAddress: string }) => {
        const zone = data.zonecode;
        const addr = data.roadAddress || data.jibunAddress;

        if (postcodeTarget === 'MAIN') {
            setAddrZone(zone);
            setAddrMain(addr);
            setPostcodeTarget(null);
            setTimeout(() => document.getElementById('input-addr-detail')?.focus(), 100);
        } else if (postcodeTarget === 'FREIGHT') {
            setFreightAddrZone(zone);
            setFreightAddrMain(addr);
            setFreightAddrDetail('');
            updateFreightAddressInForm(zone, addr, '');
            setPostcodeTarget(null);
            setTimeout(() => document.getElementById('input-freight-addr-detail')?.focus(), 100);
        }
    };

    const handleSave = () => {
        if (!formData.partnerName) {
            alert('거래처명은 필수 항목입니다.');
            return;
        }

        // 입력된 주소(addrMain)가 있는 경우 addresses 배열의 첫 번째 항목을 업데이트하거나 추가
        let addressesToSave = [...formData.addresses];
        if (addrMain) {
            const fullAddress = `(${addrZone}) ${addrMain}${addrDetail ? ', ' + addrDetail : ''}`.trim();
            if (addressesToSave.length > 0) {
                addressesToSave[0] = { ...addressesToSave[0], address: fullAddress };
            } else {
                addressesToSave.push({ id: `addr-${Date.now()}`, address: fullAddress });
            }
        }

        // 화물도착 주소도 freightAddrMain이 있으면 조립하여 저장
        let freightInfoToSave = { ...(formData.freightInfo || { transporter: '', branchName: '', phone: '', address: '' }) };
        if (freightAddrMain) {
            freightInfoToSave.address = freightAddrZone
                ? `(${freightAddrZone}) ${freightAddrMain}${freightAddrDetail ? ', ' + freightAddrDetail : ''}`.trim()
                : `${freightAddrMain}${freightAddrDetail ? ', ' + freightAddrDetail : ''}`.trim();
        }

        const dataToSave = { ...formData, addresses: addressesToSave, freightInfo: freightInfoToSave };

        setPartners(prev => {
            const exists = prev.some(p => p.id === formData.id);
            if (exists) {
                return prev.map(p => p.id === formData.id ? dataToSave : p);
            } else {
                return [dataToSave, ...prev];
            }
        });
        alert('저장되었습니다.');
        if (!selectedId) setSelectedId(formData.id);
    };

    const handleDelete = () => {
        if (!selectedId) return;
        if (confirm('정말 삭제하시겠습니까?')) {
            setPartners(prev => prev.filter(p => p.id !== selectedId));
            setSelectedId(null);
        }
    };

    // --- RENDER ---
    if (isSupplierMode) {

        // =====================================================================
        // SUPPLIER VIEW
        // =====================================================================
        return (
            <div id="partner-mgmt-supplier" className="flex flex-col h-full w-full overflow-hidden" style={{ background: 'var(--admin-bg)', color: 'var(--admin-text)' }}>
                {/* Header - 상품스팩 기준 통일 */}
                <div className="flex-shrink-0 border-b px-8 h-20 shadow-sm z-20 flex items-center justify-between gap-4" style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)' }}>
                    <div className="flex items-center gap-4 min-w-fit">
                        <Building2 style={{ color: 'var(--theme-primary)' }} className="shrink-0" size={28} />
                        <h1 className="text-2xl font-bold whitespace-nowrap" style={{ color: 'var(--admin-text)' }}>거래처관리</h1>
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full border shadow-sm" style={{ color: 'var(--theme-primary)', background: 'var(--theme-primary-bg)', borderColor: 'var(--theme-primary)' }}>
                            총 {filteredPartners.length}개
                        </span>
                    </div>
                    {/* 검색창 + Grade 탭 - 오른쪽에 배치 */}
                    <div className="flex items-center gap-3 ml-auto">
                        {/* 검색창 */}
                        <div style={{ width: '280px' }}>
                            <div className="relative w-full">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="거래처명, 대표자, 전화번호 검색..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="w-full pl-11 pr-4 py-2.5 bg-gray-100 border-transparent focus:bg-white border rounded-xl text-sm font-medium outline-none transition-all shadow-inner focus:shadow-md"
                                    onFocus={e => e.currentTarget.style.borderColor = 'var(--theme-primary)'}
                                    onBlur={e => e.currentTarget.style.borderColor = 'transparent'}
                                />
                            </div>
                        </div>
                        {/* Grade 필터 탭 - 판매단가 스타일 */}
                        <div className="flex bg-white p-1 rounded-full shadow-sm border border-gray-200 gap-1 ring-1 ring-black/[0.03]" style={{ borderColor: 'var(--admin-border)', background: 'var(--admin-surface)' }}>
                            {['ALL', 'A', 'B', 'C', 'D'].map(g => (
                                <button key={g} onClick={() => setFilterGrade(g)}
                                    className="px-4 py-1.5 text-xs font-bold rounded-full transition-all whitespace-nowrap"
                                    style={{
                                        background: filterGrade === g ? 'var(--theme-primary)' : 'transparent',
                                        color: filterGrade === g ? '#fff' : 'var(--admin-text-sub)',
                                        boxShadow: filterGrade === g ? '0 2px 8px rgba(0,0,0,0.2)' : 'none'
                                    }}>
                                    {g === 'ALL' ? '전체' : g + '등급'}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Content: Left List + Resize Handle + Right Panel */}
                <div ref={containerRef} className="flex flex-1 overflow-hidden" style={{ background: 'var(--admin-bg)' }}>
                    {/* Left List */}
                    <div className="flex flex-col overflow-hidden flex-shrink-0" style={{ width: leftWidth, background: 'var(--admin-surface)', borderRight: '1px solid var(--admin-border)' }}>
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
                                    style={{ background: selectedId === p.id ? 'var(--theme-primary-bg)' : 'transparent', borderBottom: '1px solid var(--admin-border)' }}>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-sm truncate" style={{ color: selectedId === p.id ? 'var(--theme-primary)' : 'var(--admin-text)' }}>{p.partnerName}</p>
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
                                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--theme-primary)'; (e.currentTarget as HTMLButtonElement).style.background = 'var(--theme-primary-bg)'; }}
                                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--admin-text-sub)'; (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}>
                                    <RefreshCw size={18} />
                                </button>
                                <button onClick={handleDelete} className="p-2 rounded-lg transition-colors"
                                    style={{ color: 'var(--admin-text-sub)' }}
                                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#ef4444'; (e.currentTarget as HTMLButtonElement).style.background = '#fee2e2'; }}
                                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--admin-text-sub)'; (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}>
                                    <Trash2 size={18} />
                                </button>
                                <div className="w-px h-8 mx-1" style={{ background: 'var(--admin-border)' }} />
                                <button onClick={handleSave}
                                    className="flex items-center gap-1.5 text-white px-5 py-2 rounded-lg text-sm font-bold shadow-md active:scale-95 transition-all"
                                    style={{ background: 'var(--theme-primary)' }}
                                    onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                                    onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
                                    <Save size={16} /> 저장
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 scrollbar-hide">
                            <div className="max-w-5xl mx-auto space-y-6 pb-10">
                                {/* 기본 정보 */}
                                <div className="rounded-2xl p-6 shadow-sm" style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}>
                                    <h4 className="text-sm font-bold mb-5 flex items-center gap-2 pb-3" style={{ color: 'var(--admin-text)', borderBottom: '1px solid var(--admin-border)' }}>
                                        <div className="p-1.5 bg-blue-50 rounded-lg"><User size={16} className="text-blue-600" /></div>기본 정보
                                    </h4>
                                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                        <div><label className="text-[11px] font-bold uppercase block mb-1.5" style={{ color: 'var(--admin-text-sub)' }}>거래처명</label><input type="text" value={formData.partnerName} onChange={e => handleInputChange('partnerName', e.target.value)} className="w-full rounded-xl px-4 py-2.5 text-sm font-bold outline-none" style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--theme-primary)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--admin-border)')}
                /></div>
                                        <div><label className="text-[11px] font-bold uppercase block mb-1.5" style={{ color: 'var(--admin-text-sub)' }}>코드 (자동)</label><div className="relative"><input type="text" value={formData.partnerCode || ''} readOnly className="w-full rounded-xl px-4 py-2.5 text-sm font-bold text-center uppercase tracking-widest outline-none cursor-not-allowed" style={{ background: 'var(--theme-primary-bg)', border: '1px solid var(--theme-primary)', color: 'var(--theme-primary)', opacity: 0.8 }} /><Hash size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-300" /></div></div>
                                        <div><label className="text-[11px] font-bold uppercase block mb-1.5" style={{ color: 'var(--admin-text-sub)' }}>관리자 ID</label><input type="text" value={formData.adminId} onChange={e => handleInputChange('adminId', e.target.value)} className="w-full rounded-xl px-4 py-2.5 text-sm font-medium outline-none" style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--theme-primary)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--admin-border)')}
                /></div>
                                        <div><label className="text-[11px] font-bold uppercase block mb-1.5" style={{ color: 'var(--admin-text-sub)' }}>패스워드</label><input type="text" value={formData.password} onChange={e => handleInputChange('password', e.target.value)} className="w-full rounded-xl px-4 py-2.5 text-sm font-medium outline-none" style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--theme-primary)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--admin-border)')}
                /></div>
                                    </div>
                                </div>

                                {/* 연락처 정보 */}
                                <div className="rounded-2xl p-6 shadow-sm" style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}>
                                    <h4 className="text-sm font-bold mb-5 flex items-center gap-2 pb-3" style={{ color: 'var(--admin-text)', borderBottom: '1px solid var(--admin-border)' }}>
                                        <div className="p-1.5 bg-green-50 rounded-lg"><Phone size={16} className="text-green-600" /></div>연락처 정보
                                    </h4>
                                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                        <div><label className="text-[11px] font-bold uppercase block mb-1.5" style={{ color: 'var(--admin-text-sub)' }}>업체 전화</label><input type="text" value={formData.companyPhone} onChange={e => handleInputChange('companyPhone', e.target.value)} className="w-full rounded-xl px-4 py-2.5 text-sm font-medium outline-none" style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--theme-primary)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--admin-border)')}
                /></div>
                                        <div><label className="text-[11px] font-bold uppercase block mb-1.5" style={{ color: 'var(--admin-text-sub)' }}>거래 등급</label><div className="relative"><select value={formData.grade || 'B'} onChange={e => handleInputChange('grade', e.target.value)} className="w-full rounded-xl px-4 py-2.5 text-sm font-bold outline-none appearance-none cursor-pointer" style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--theme-primary)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--admin-border)')}><option value="A">A 등급 (최우수)</option><option value="B">B 등급 (우수)</option><option value="C">C 등급 (일반)</option><option value="D">D 등급 (주의)</option></select><Star size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" /></div></div>
                                        <div><label className="text-[11px] font-bold uppercase block mb-1.5" style={{ color: 'var(--admin-text-sub)' }}>대표자명</label><input type="text" value={formData.ceoName} onChange={e => handleInputChange('ceoName', e.target.value)} className="w-full rounded-xl px-4 py-2.5 text-sm font-medium outline-none" style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--theme-primary)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--admin-border)')}
                /></div>
                                        <div><label className="text-[11px] font-bold uppercase block mb-1.5" style={{ color: 'var(--admin-text-sub)' }}>대표자 전화</label><input type="text" value={formData.ceoPhone} onChange={e => handleInputChange('ceoPhone', e.target.value)} className="w-full rounded-xl px-4 py-2.5 text-sm font-medium outline-none" style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--theme-primary)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--admin-border)')}
                /></div>
                                        <div><label className="text-[11px] font-bold uppercase block mb-1.5" style={{ color: 'var(--admin-text-sub)' }}>담당자명</label><input type="text" value={formData.managerName} onChange={e => handleInputChange('managerName', e.target.value)} className="w-full rounded-xl px-4 py-2.5 text-sm font-medium outline-none" style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--theme-primary)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--admin-border)')}
                /></div>
                                        <div><label className="text-[11px] font-bold uppercase block mb-1.5" style={{ color: 'var(--admin-text-sub)' }}>담당자 전화</label><input type="text" value={formData.managerPhone} onChange={e => handleInputChange('managerPhone', e.target.value)} className="w-full rounded-xl px-4 py-2.5 text-sm font-medium outline-none" placeholder="010-0000-0000" maxLength={13} style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--theme-primary)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--admin-border)')}
                /></div>
                                    </div>
                                </div>

                                {/* 사업자 정보 */}
                                <div className="rounded-2xl p-6 shadow-sm" style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}>
                                    <h4 className="text-sm font-bold mb-5 flex items-center gap-2 pb-3" style={{ color: 'var(--admin-text)', borderBottom: '1px solid var(--admin-border)' }}>
                                        <div className="p-1.5 bg-orange-50 rounded-lg"><Briefcase size={16} className="text-orange-600" /></div>사업자 정보
                                    </h4>
                                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                        <div><label className="text-[11px] font-bold uppercase block mb-1.5" style={{ color: 'var(--admin-text-sub)' }}>사업자번호</label><input type="text" value={formData.businessNo} onChange={e => handleInputChange('businessNo', e.target.value)} className="w-full rounded-xl px-4 py-2.5 text-sm font-medium outline-none" style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--theme-primary)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--admin-border)')}
                /></div>
                                        <div><label className="text-[11px] font-bold uppercase block mb-1.5" style={{ color: 'var(--admin-text-sub)' }}>업태</label><input type="text" value={formData.businessType} onChange={e => handleInputChange('businessType', e.target.value)} className="w-full rounded-xl px-4 py-2.5 text-sm font-medium outline-none" style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--theme-primary)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--admin-border)')}
                /></div>
                                        <div><label className="text-[11px] font-bold uppercase block mb-1.5" style={{ color: 'var(--admin-text-sub)' }}>종목</label><input type="text" value={formData.businessItem} onChange={e => handleInputChange('businessItem', e.target.value)} className="w-full rounded-xl px-4 py-2.5 text-sm font-medium outline-none" style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--theme-primary)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--admin-border)')}
                /></div>
                                        <div><label className="text-[11px] font-bold uppercase block mb-1.5" style={{ color: 'var(--admin-text-sub)' }}>세금계산서 이메일</label><div className="relative"><Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" /><input type="email" value={formData.taxEmail} onChange={e => handleInputChange('taxEmail', e.target.value)} className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium outline-none" style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--theme-primary)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--admin-border)')} placeholder="example@company.com" /></div></div>
                                        <div className="col-span-1 xl:col-span-2 pt-2" style={{ borderTop: '1px solid var(--admin-border)' }}>
                                            <label className="text-[11px] font-bold uppercase block mb-2 flex items-center gap-1" style={{ color: 'var(--admin-text-sub)' }}><MapPin size={12} /> 사업자 주소</label>
                                            <div className="flex gap-2 mb-2">
                                                <input type="text" value={addrZone} readOnly className="w-24 rounded-xl px-3 py-2.5 text-sm outline-none cursor-not-allowed" style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text-sub)', opacity: 0.7 }} />
                                                <button onClick={() => handlePostcode('MAIN')} className="text-white rounded-xl px-4 py-2 text-xs font-bold transition-all" style={{ background: 'var(--theme-primary)' }} onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')} onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>우편번호 검색</button>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <input type="text" value={addrMain} onChange={e => setAddrMain(e.target.value)} className="w-full rounded-xl px-4 py-2.5 text-sm font-medium outline-none" style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}
                                                    onFocus={e => (e.currentTarget.style.borderColor = 'var(--theme-primary)')}
                                                    onBlur={e => (e.currentTarget.style.borderColor = 'var(--admin-border)')} placeholder="기본 주소" />
                                                <input id="input-addr-detail" type="text" value={addrDetail} onChange={e => setAddrDetail(e.target.value)} className="w-full rounded-xl px-4 py-2.5 text-sm font-medium outline-none" style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--theme-primary)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--admin-border)')} placeholder="상세 주소 입력" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 화물도착 정보 (Supplier Only) */}
                                <div className="rounded-2xl p-6 shadow-sm" style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}>
                                    <h4 className="text-sm font-bold mb-5 flex items-center gap-2 pb-3" style={{ color: 'var(--admin-text)', borderBottom: '1px solid var(--admin-border)' }}>
                                        <div className="p-1.5 bg-purple-50 rounded-lg"><Truck size={16} className="text-purple-600" /></div>화물도착 정보
                                    </h4>
                                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                        <div>
                                            <label className="text-[11px] font-bold uppercase block mb-1.5" style={{ color: 'var(--admin-text-sub)' }}>운송사 (택배/화물)</label>
                                            <input type="text" value={formData.freightInfo?.transporter || ''} onChange={e => handleFreightChange('transporter', e.target.value)} className="w-full rounded-xl px-4 py-2.5 text-sm font-medium outline-none" style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--theme-primary)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--admin-border)')} placeholder="예: CJ대한통운" />
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-bold uppercase block mb-1.5" style={{ color: 'var(--admin-text-sub)' }}>지점명</label>
                                            <input type="text" value={formData.freightInfo?.branchName || ''} onChange={e => handleFreightChange('branchName', e.target.value)} className="w-full rounded-xl px-4 py-2.5 text-sm font-medium outline-none" style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--theme-primary)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--admin-border)')} placeholder="예: 강남사업소" />
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-bold uppercase block mb-1.5" style={{ color: 'var(--admin-text-sub)' }}>지점전화번호</label>
                                            <input type="text" value={formData.freightInfo?.phone || ''} onChange={e => handleFreightChange('phone', e.target.value)} className="w-full rounded-xl px-4 py-2.5 text-sm font-medium outline-none" style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--theme-primary)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--admin-border)')}
                />
                                        </div>
                                        <div className="col-span-1 xl:col-span-2 pt-2" style={{ borderTop: '1px solid var(--admin-border)' }}>
                                            <label className="text-[11px] font-bold uppercase block mb-2 flex items-center gap-1" style={{ color: 'var(--admin-text-sub)' }}><MapPin size={12} /> 화물 도착 주소</label>
                                            <div className="flex gap-2 mb-2">
                                                <input type="text" value={freightAddrZone} readOnly className="w-24 rounded-xl px-3 py-2.5 text-sm outline-none cursor-not-allowed" style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text-sub)', opacity: 0.7 }} />
                                                <button onClick={() => handlePostcode('FREIGHT')} className="text-white rounded-xl px-4 py-2 text-xs font-bold transition-all" style={{ background: 'var(--theme-primary)' }} onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')} onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>우편번호 검색</button>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <input type="text" value={freightAddrMain} onChange={e => {
                                                    setFreightAddrMain(e.target.value);
                                                    updateFreightAddressInForm(freightAddrZone, e.target.value, freightAddrDetail);
                                                }} className="w-full rounded-xl px-4 py-2.5 text-sm font-medium outline-none" style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}
                                                    onFocus={e => (e.currentTarget.style.borderColor = 'var(--theme-primary)')}
                                                    onBlur={e => (e.currentTarget.style.borderColor = 'var(--admin-border)')} placeholder="기본 주소" />
                                                <input id="input-freight-addr-detail" type="text" value={freightAddrDetail} onChange={e => handleFreightDetailChange(e.target.value)} className="w-full rounded-xl px-4 py-2.5 text-sm font-medium outline-none" style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--theme-primary)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--admin-border)')} placeholder="상세 주소 입력" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 비고 */}
                                <div className="rounded-2xl p-6 shadow-sm" style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}>
                                    <h4 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--admin-text)' }}><StickyNote size={14} style={{ color: 'var(--admin-text-sub)' }} />비고 (Memo)</h4>
                                    <textarea value={formData.note || ''} onChange={e => handleInputChange('note', e.target.value)} className="w-full rounded-xl px-4 py-3 text-sm font-medium outline-none resize-none" rows={3} style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--theme-primary)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--admin-border)')}
                />
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
                                <div className="flex items-center justify-between p-4" style={{ borderBottom: '1px solid var(--admin-border)' }}>
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
            {/* Header - 상품스팩 기준 통일 */}
            <div className="flex-shrink-0 border-b px-8 h-20 shadow-sm z-20 flex items-center justify-between gap-4" style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)' }}>
                {/* Left: Icon + Title + Badge */}
                <div className="flex items-center gap-4 min-w-fit">
                    <Building2 style={{ color: 'var(--theme-primary)' }} className="shrink-0" size={28} />
                    <h1 className="text-2xl font-bold whitespace-nowrap" style={{ color: 'var(--admin-text)' }}>거래처관리</h1>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full border shadow-sm" style={{ color: 'var(--theme-primary)', background: 'var(--theme-primary-bg)', borderColor: 'var(--theme-primary)' }}>
                        총 {filteredPartners.length}개
                    </span>
                </div>
                {/* Center: Search */}
                <div className="flex-1 max-w-xl mx-auto">
                    <div className="relative w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="거래처명, 대표자, 전화번호 검색..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-2.5 bg-gray-100 border-transparent focus:bg-white border rounded-xl text-sm font-medium outline-none transition-all shadow-inner focus:shadow-md"
                            onFocus={e => e.currentTarget.style.borderColor = 'var(--theme-primary)'}
                            onBlur={e => e.currentTarget.style.borderColor = 'transparent'}
                        />
                    </div>
                </div>
                {/* Right: Multi-toggle filter tabs */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                    {([
                        { key: 'FABRIC_SUPPLIER', label: '원단공급사' },
                        { key: 'MANUFACTURER', label: '제조공급사' },
                        { key: 'DISTRIBUTOR', label: '유통관리사' },
                        { key: 'AGENCY', label: '가맹대리점' },
                    ] as const).map(tab => {
                        const isOn = filterTypes.includes(tab.key as PartnerType);
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setFilterTypes(prev =>
                                    prev.includes(tab.key as PartnerType)
                                        ? prev.filter(x => x !== tab.key)
                                        : [...prev, tab.key as PartnerType]
                                )}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all border"
                                style={{
                                    background: isOn ? 'var(--theme-primary)' : 'var(--admin-input-bg)',
                                    color: isOn ? '#fff' : 'var(--admin-text-sub)',
                                    borderColor: isOn ? 'var(--theme-primary)' : 'var(--admin-border)',
                                }}
                            >
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div ref={containerRef} className="flex flex-1 overflow-hidden">
                {/* Left List */}
                <div className="flex flex-col flex-shrink-0 overflow-hidden" style={{ width: leftWidth, background: 'var(--admin-surface)', borderRight: '1px solid var(--admin-border)' }}>
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
                                style={{ background: selectedId === p.id ? 'var(--theme-primary-bg)' : 'transparent', borderBottom: '1px solid var(--admin-border)' }}>
                                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${TYPE_COLORS[p.type] || 'from-gray-400 to-gray-500'} flex items-center justify-center flex-shrink-0`}>
                                    <Building2 size={14} className="text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-sm truncate" style={{ color: selectedId === p.id ? 'var(--theme-primary)' : 'var(--admin-text)' }}>{p.partnerName}</p>
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
                                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--theme-primary)'; (e.currentTarget as HTMLButtonElement).style.background = 'var(--theme-primary-bg)'; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--admin-text-sub)'; (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}>
                                <RefreshCw size={18} />
                            </button>
                            <button onClick={handleDelete} className="p-2 rounded-lg transition-colors" style={{ color: 'var(--admin-text-sub)' }}
                                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#ef4444'; (e.currentTarget as HTMLButtonElement).style.background = '#fee2e2'; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--admin-text-sub)'; (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}>
                                <Trash2 size={18} />
                            </button>
                            <div className="w-px h-8 mx-1" style={{ background: 'var(--admin-border)' }} />
                            <button onClick={handleSave} className="flex items-center gap-1.5 text-white px-5 py-2 rounded-lg text-sm font-bold shadow-md active:scale-95 transition-all"
                                style={{ background: 'var(--theme-primary)' }}
                                onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
                                <Save size={16} /> 저장 완료
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 scrollbar-hide">
                        <div className="max-w-5xl mx-auto space-y-6 pb-10">
                            {/* 기본 정보 */}
                            <div className="rounded-2xl p-6 shadow-sm" style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}>
                                <h4 className="text-sm font-bold mb-5 flex items-center gap-2 pb-3" style={{ color: 'var(--admin-text)', borderBottom: '1px solid var(--admin-border)' }}>
                                    <div className="p-1.5 bg-blue-50 rounded-lg"><User size={16} className="text-blue-600" /></div>기본 정보
                                </h4>
                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                    <div><label className="text-[11px] font-bold uppercase block mb-1.5" style={{ color: 'var(--admin-text-sub)' }}>거래처명</label><input type="text" value={formData.partnerName} onChange={e => handleInputChange('partnerName', e.target.value)} className="w-full rounded-xl px-4 py-2.5 text-sm font-bold outline-none" style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--theme-primary)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--admin-border)')}
                /></div>
                                    <div><label className="text-[11px] font-bold uppercase block mb-1.5" style={{ color: 'var(--admin-text-sub)' }}>코드 (자동)</label><div className="relative"><input type="text" value={formData.partnerCode || ''} readOnly className="w-full rounded-xl px-4 py-2.5 text-sm font-bold text-center uppercase tracking-widest outline-none cursor-not-allowed" style={{ background: 'var(--theme-primary-bg)', border: '1px solid var(--theme-primary)', color: 'var(--theme-primary)', opacity: 0.8 }} /><Hash size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-300" /></div></div>
                                    <div><label className="text-[11px] font-bold uppercase block mb-1.5" style={{ color: 'var(--admin-text-sub)' }}>관리자 ID</label><input type="text" value={formData.adminId} onChange={e => handleInputChange('adminId', e.target.value)} className="w-full rounded-xl px-4 py-2.5 text-sm font-medium outline-none" style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--theme-primary)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--admin-border)')}
                /></div>
                                    <div><label className="text-[11px] font-bold uppercase block mb-1.5" style={{ color: 'var(--admin-text-sub)' }}>패스워드</label><input type="text" value={formData.password} onChange={e => handleInputChange('password', e.target.value)} className="w-full rounded-xl px-4 py-2.5 text-sm font-medium outline-none" style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--theme-primary)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--admin-border)')}
                /></div>
                                </div>
                            </div>

                            {/* 연락처 정보 */}
                            <div className="rounded-2xl p-6 shadow-sm" style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}>
                                <h4 className="text-sm font-bold mb-5 flex items-center gap-2 pb-3" style={{ color: 'var(--admin-text)', borderBottom: '1px solid var(--admin-border)' }}>
                                    <div className="p-1.5 bg-green-50 rounded-lg"><Phone size={16} className="text-green-600" /></div>연락처 정보
                                </h4>
                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                    <div><label className="text-[11px] font-bold uppercase block mb-1.5" style={{ color: 'var(--admin-text-sub)' }}>업체 전화</label><input type="text" value={formData.companyPhone} onChange={e => handleInputChange('companyPhone', e.target.value)} className="w-full rounded-xl px-4 py-2.5 text-sm font-medium outline-none" style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--theme-primary)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--admin-border)')}
                /></div>
                                    <div><label className="text-[11px] font-bold uppercase block mb-1.5" style={{ color: 'var(--admin-text-sub)' }}>거래 등급</label><div className="relative"><select value={formData.grade || 'B'} onChange={e => handleInputChange('grade', e.target.value)} className="w-full rounded-xl px-4 py-2.5 text-sm font-bold outline-none appearance-none cursor-pointer" style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--theme-primary)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--admin-border)')}><option value="A">A 등급 (최우수)</option><option value="B">B 등급 (우수)</option><option value="C">C 등급 (일반)</option><option value="D">D 등급 (주의)</option></select><Star size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" /></div></div>
                                    <div><label className="text-[11px] font-bold uppercase block mb-1.5" style={{ color: 'var(--admin-text-sub)' }}>대표자명</label><input type="text" value={formData.ceoName} onChange={e => handleInputChange('ceoName', e.target.value)} className="w-full rounded-xl px-4 py-2.5 text-sm font-medium outline-none" style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--theme-primary)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--admin-border)')}
                /></div>
                                    <div><label className="text-[11px] font-bold uppercase block mb-1.5" style={{ color: 'var(--admin-text-sub)' }}>대표자 전화</label><input type="text" value={formData.ceoPhone} onChange={e => handleInputChange('ceoPhone', e.target.value)} className="w-full rounded-xl px-4 py-2.5 text-sm font-medium outline-none" style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--theme-primary)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--admin-border)')}
                /></div>
                                    <div><label className="text-[11px] font-bold uppercase block mb-1.5" style={{ color: 'var(--admin-text-sub)' }}>담당자명</label><input type="text" value={formData.managerName} onChange={e => handleInputChange('managerName', e.target.value)} className="w-full rounded-xl px-4 py-2.5 text-sm font-medium outline-none" style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--theme-primary)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--admin-border)')}
                /></div>
                                    <div><label className="text-[11px] font-bold uppercase block mb-1.5" style={{ color: 'var(--admin-text-sub)' }}>담당자 전화</label><input type="text" value={formData.managerPhone} onChange={e => handleInputChange('managerPhone', e.target.value)} className="w-full rounded-xl px-4 py-2.5 text-sm font-medium outline-none" placeholder="010-0000-0000" maxLength={13} style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--theme-primary)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--admin-border)')}
                /></div>
                                </div>
                            </div>

                            {/* 사업자 정보 */}
                            <div className="rounded-2xl p-6 shadow-sm" style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}>
                                <h4 className="text-sm font-bold mb-5 flex items-center gap-2 pb-3" style={{ color: 'var(--admin-text)', borderBottom: '1px solid var(--admin-border)' }}>
                                    <div className="p-1.5 bg-orange-50 rounded-lg"><Briefcase size={16} className="text-orange-600" /></div>사업자 정보
                                </h4>
                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                    <div><label className="text-[11px] font-bold uppercase block mb-1.5" style={{ color: 'var(--admin-text-sub)' }}>사업자번호</label><input type="text" value={formData.businessNo} onChange={e => handleInputChange('businessNo', e.target.value)} className="w-full rounded-xl px-4 py-2.5 text-sm font-medium outline-none" style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--theme-primary)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--admin-border)')}
                /></div>
                                    <div><label className="text-[11px] font-bold uppercase block mb-1.5" style={{ color: 'var(--admin-text-sub)' }}>업태</label><input type="text" value={formData.businessType} onChange={e => handleInputChange('businessType', e.target.value)} className="w-full rounded-xl px-4 py-2.5 text-sm font-medium outline-none" style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--theme-primary)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--admin-border)')}
                /></div>
                                    <div><label className="text-[11px] font-bold uppercase block mb-1.5" style={{ color: 'var(--admin-text-sub)' }}>종목</label><input type="text" value={formData.businessItem} onChange={e => handleInputChange('businessItem', e.target.value)} className="w-full rounded-xl px-4 py-2.5 text-sm font-medium outline-none" style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--theme-primary)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--admin-border)')}
                /></div>
                                    <div><label className="text-[11px] font-bold uppercase block mb-1.5" style={{ color: 'var(--admin-text-sub)' }}>세금계산서 이메일</label><div className="relative"><Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" /><input type="email" value={formData.taxEmail} onChange={e => handleInputChange('taxEmail', e.target.value)} className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium outline-none" style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--theme-primary)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--admin-border)')} placeholder="example@company.com" /></div></div>
                                    <div className="col-span-1 xl:col-span-2 pt-2" style={{ borderTop: '1px solid var(--admin-border)' }}>
                                        <label className="text-[11px] font-bold uppercase block mb-2 flex items-center gap-1" style={{ color: 'var(--admin-text-sub)' }}><MapPin size={12} /> 사업자 주소</label>
                                        <div className="flex gap-2 mb-2">
                                            <input type="text" value={addrZone} readOnly className="w-24 rounded-xl px-3 py-2.5 text-sm outline-none cursor-not-allowed" style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text-sub)', opacity: 0.7 }} />
                                            <button onClick={() => handlePostcode('MAIN')} className="text-white rounded-xl px-4 py-2 text-xs font-bold transition-all" style={{ background: 'var(--theme-primary)' }} onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')} onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>우편번호 검색</button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <input type="text" value={addrMain} onChange={e => setAddrMain(e.target.value)} className="w-full rounded-xl px-4 py-2.5 text-sm font-medium outline-none" style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}
                                                onFocus={e => (e.currentTarget.style.borderColor = 'var(--theme-primary)')}
                                                onBlur={e => (e.currentTarget.style.borderColor = 'var(--admin-border)')} placeholder="기본 주소" />
                                            <input id="input-addr-detail" type="text" value={addrDetail} onChange={e => setAddrDetail(e.target.value)} className="w-full rounded-xl px-4 py-2.5 text-sm font-medium outline-none" style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--theme-primary)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--admin-border)')} placeholder="상세 주소 입력" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 메뉴 할당 */}
                            <div className="rounded-2xl p-6 shadow-sm" style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}>
                                <div className="h-px" style={{ background: 'var(--admin-border)' }} />
                                <div>
                                    <h4 className="text-sm font-bold text-gray-800 mb-1 flex items-center gap-2">
                                        <Shield size={16} className="text-indigo-500" /> 메뉴 할당 관리
                                    </h4>
                                    <p className="text-[10px] mb-4" style={{ color: 'var(--admin-text-sub)' }}>거래처 <strong>{formData.partnerName || '(신규)'}</strong>의 접근 가능 메뉴를 설정합니다.</p>
                                    <div className="space-y-4">
                                        {groups.map(group => {
                                            const items = menuList.filter(m => m.group === group);
                                            const groupIds = items.map(m => m.id);
                                            const allOn = groupIds.every(id => allowed.includes(id));
                                            return (
                                                <div key={group} className="rounded-xl overflow-hidden" style={{ background: 'var(--theme-primary-bg, rgba(99,102,241,0.06))', border: '1px solid var(--admin-border)' }}>
                                                    <div className="flex items-center justify-between px-4 py-2.5" style={{ background: 'var(--theme-primary-bg)', borderBottom: '1px solid var(--admin-border)' }}>
                                                        <span className="text-xs font-bold" style={{ color: 'var(--theme-primary)' }}>{group}</span>
                                                        <button type="button" onClick={() => toggleAll(groupIds, !allOn)}
                                                            className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all"
                                                            style={{
                                                                background: allOn ? 'var(--theme-primary)' : 'var(--admin-input-bg)',
                                                                color: allOn ? '#fff' : 'var(--theme-primary)',
                                                                border: allOn ? 'none' : '1px solid var(--admin-border)'
                                                            }}>
                                                            {allOn ? <ToggleRight size={12} /> : <ToggleLeft size={12} />}
                                                            {allOn ? '전체해제' : '전체허용'}
                                                        </button>
                                                    </div>
                                                    <div className="p-3 flex flex-wrap gap-2">
                                                        {items.map(item => (
                                                            <button key={item.id} type="button" onClick={() => toggleMenu(item.id)}
                                                                className="text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all"
                                                                style={{
                                                                    background: allowed.includes(item.id) ? 'var(--theme-primary)' : 'var(--admin-input-bg)',
                                                                    color: allowed.includes(item.id) ? '#fff' : 'var(--admin-text-sub)',
                                                                    border: allowed.includes(item.id) ? 'none' : '1px solid var(--admin-border)'
                                                                }}>
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
                            <div className="rounded-2xl p-6 shadow-sm" style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}>
                                <h4 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--admin-text)' }}><StickyNote size={14} className="text-gray-400" />비고 (Memo)</h4>
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
                            <div className="flex items-center justify-between p-4" style={{ borderBottom: '1px solid var(--admin-border)' }}>
                                <h3 className="font-bold flex items-center gap-2" style={{ color: 'var(--admin-text)' }}><MapPin size={18} style={{ color: 'var(--theme-primary)' }} />우편번호 검색</h3>
                                <button onClick={() => setPostcodeTarget(null)} className="p-2 rounded-lg transition-colors" style={{ color: 'var(--admin-text-sub)' }} onMouseEnter={e => (e.currentTarget.style.background = 'var(--admin-input-bg)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}><X size={18} /></button>
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
