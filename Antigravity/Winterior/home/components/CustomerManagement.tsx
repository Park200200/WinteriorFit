import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Search, Plus, Edit3, Trash2, X, Check, User, Phone, Mail, Cake, MapPin, StickyNote, ChevronRight, Users, Camera, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Customer {
    id: string;
    name: string;
    phone: string;
    email: string;
    birthday: string;
    address: string;
    memo: string;
    images: string[];
    createdAt: string;
}

const MOCK_CUSTOMERS: Customer[] = [
    { id: 'c1', name: '김영수', phone: '010-1234-5678', email: 'kim@email.com', birthday: '1985-03-15', address: '서울 강남구 테헤란로 123', memo: '단골 고객', images: [], createdAt: '2025-08-10' },
    { id: 'c2', name: '이미정', phone: '010-2345-6789', email: 'lee@email.com', birthday: '1990-07-22', address: '서울 서초구 반포대로 45', memo: '', images: [], createdAt: '2025-09-05' },
    { id: 'c3', name: '박준호', phone: '010-3456-7890', email: 'park@email.com', birthday: '1978-11-30', address: '경기 성남시 분당구 판교로 67', memo: '블라인드 선호', images: [], createdAt: '2025-10-12' },
    { id: 'c4', name: '최수진', phone: '010-4567-8901', email: 'choi@email.com', birthday: '1995-01-08', address: '서울 마포구 월드컵북로 89', memo: '', images: [], createdAt: '2025-11-20' },
    { id: 'c5', name: '정민호', phone: '010-5678-9012', email: 'jung@email.com', birthday: '1982-09-17', address: '서울 송파구 올림픽로 12', memo: '거실+안방 시공 완료', images: [], createdAt: '2025-12-03' },
    { id: 'c6', name: '한소희', phone: '010-6789-0123', email: 'han@email.com', birthday: '1993-04-25', address: '경기 용인시 수지구 성복로 34', memo: '', images: [], createdAt: '2026-01-08' },
    { id: 'c7', name: '임지우', phone: '010-7890-1234', email: 'lim@email.com', birthday: '1988-12-02', address: '서울 강동구 천호대로 56', memo: '커튼 문의 예정', images: [], createdAt: '2026-01-15' },
    { id: 'c8', name: '오세현', phone: '010-8901-2345', email: 'oh@email.com', birthday: '1975-06-14', address: '서울 노원구 동일로 78', memo: '2층 전체 시공', images: [], createdAt: '2026-01-22' },
    { id: 'c9', name: '강다은', phone: '010-9012-3456', email: 'kang@email.com', birthday: '1991-08-09', address: '경기 고양시 일산서구 중앙로 90', memo: '', images: [], createdAt: '2026-02-01' },
    { id: 'c10', name: '윤재혁', phone: '010-0123-4567', email: 'yoon@email.com', birthday: '1987-02-28', address: '서울 관악구 관악로 11', memo: '추가 견적 요청', images: [], createdAt: '2026-02-10' },
];

const emptyCustomer: Omit<Customer, 'id' | 'createdAt'> = {
    name: '', phone: '', email: '', birthday: '', address: '', memo: '', images: []
};

const CustomerManagement: React.FC = () => {
    const [customers, setCustomers] = useState<Customer[]>(() => {
        try {
            const raw = localStorage.getItem('winterior_customers');
            if (raw) { const parsed = JSON.parse(raw); if (Array.isArray(parsed) && parsed.length > 0) return parsed; }
        } catch { }
        return MOCK_CUSTOMERS;
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [editForm, setEditForm] = useState<Omit<Customer, 'id' | 'createdAt'>>(emptyCustomer);
    const [customerImages, setCustomerImages] = useState<string[]>([]);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);

    // Set initial selection
    useEffect(() => {
        if (customers.length > 0 && !selectedId) {
            setSelectedId(customers[0].id);
        }
    }, []);

    // Persist customers to localStorage
    const persistCustomers = useCallback((custs: Customer[]) => {
        try { localStorage.setItem('winterior_customers', JSON.stringify(custs)); } catch { }
    }, []);

    // Listen for external customer updates (from EstimateManagement)
    useEffect(() => {
        const handler = () => {
            try {
                const raw = localStorage.getItem('winterior_customers');
                if (raw) { const parsed = JSON.parse(raw); if (Array.isArray(parsed)) setCustomers(parsed); }
            } catch { }
        };
        window.addEventListener('winterior_customers_updated', handler);
        return () => window.removeEventListener('winterior_customers_updated', handler);
    }, []);

    const filteredCustomers = useMemo(() => {
        if (!searchQuery.trim()) return customers;
        const q = searchQuery.toLowerCase();
        return customers.filter(c =>
            c.name.toLowerCase().includes(q) ||
            c.phone.includes(q) ||
            c.email.toLowerCase().includes(q) ||
            c.address.toLowerCase().includes(q)
        );
    }, [searchQuery, customers]);

    const selectedCustomer = useMemo(() => {
        return customers.find(c => c.id === selectedId) || null;
    }, [selectedId, customers]);

    const handleSelect = (c: Customer) => {
        setSelectedId(c.id);
        setIsEditing(false);
        setIsAdding(false);
        setCustomerImages(c.images || []);
    };

    const handleStartEdit = () => {
        if (!selectedCustomer) return;
        setEditForm({
            name: selectedCustomer.name,
            phone: selectedCustomer.phone,
            email: selectedCustomer.email,
            birthday: selectedCustomer.birthday,
            address: selectedCustomer.address,
            memo: selectedCustomer.memo,
            images: selectedCustomer.images || [],
        });
        setCustomerImages(selectedCustomer.images || []);
        setIsEditing(true);
        setIsAdding(false);
    };

    const handleStartAdd = () => {
        setEditForm({ ...emptyCustomer });
        setCustomerImages([]);
        setIsAdding(true);
        setIsEditing(false);
        setSelectedId(null);
    };

    const handleSave = () => {
        if (!editForm.name.trim() || !editForm.phone.trim()) return;
        if (isAdding) {
            const newCustomer: Customer = {
                id: `c${Date.now()}`,
                ...editForm,
                images: customerImages,
                createdAt: new Date().toISOString().split('T')[0],
            };
            const updated = [newCustomer, ...customers];
            setCustomers(updated);
            persistCustomers(updated);
            setSelectedId(newCustomer.id);
            setIsAdding(false);
        } else if (isEditing && selectedId) {
            const updated = customers.map(c =>
                c.id === selectedId ? { ...c, ...editForm, images: customerImages } : c
            );
            setCustomers(updated);
            persistCustomers(updated);
            setIsEditing(false);
        }
    };

    const handleDelete = (id: string) => {
        if (!confirm('정말 삭제하시겠습니까?')) return;
        const updated = customers.filter(c => c.id !== id);
        setCustomers(updated);
        persistCustomers(updated);
        if (selectedId === id) {
            setSelectedId(null);
            setIsEditing(false);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        setIsAdding(false);
        if (selectedCustomer) {
            setCustomerImages(selectedCustomer.images || []);
        } else {
            setCustomerImages([]);
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;
        Array.from(files).forEach((file: File) => {
            if (!file.type.startsWith('image/')) return;
            const reader = new FileReader();
            reader.onload = (ev: ProgressEvent<FileReader>) => {
                const img = new window.Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const maxSize = 800;
                    let w = img.width, h = img.height;
                    if (w > maxSize || h > maxSize) {
                        if (w > h) { h = Math.round(h * maxSize / w); w = maxSize; }
                        else { w = Math.round(w * maxSize / h); h = maxSize; }
                    }
                    canvas.width = w;
                    canvas.height = h;
                    canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                    setCustomerImages(prev => [...prev, dataUrl]);
                };
                img.src = ev.target?.result as string;
            };
            reader.readAsDataURL(file);
        });
        e.target.value = '';
    };

    const handleRemoveImage = (idx: number) => {
        setCustomerImages(prev => prev.filter((_, i) => i !== idx));
    };

    const isFormMode = isEditing || isAdding;

    const fields: { key: keyof typeof editForm; label: string; icon: typeof User; type: string; placeholder: string }[] = [
        { key: 'name', label: '고객명', icon: User, type: 'text', placeholder: '고객명을 입력하세요' },
        { key: 'phone', label: '전화번호', icon: Phone, type: 'tel', placeholder: '010-0000-0000' },
        { key: 'email', label: '이메일', icon: Mail, type: 'email', placeholder: 'email@example.com' },
        { key: 'birthday', label: '생일', icon: Cake, type: 'date', placeholder: '' },
        { key: 'address', label: '주소', icon: MapPin, type: 'text', placeholder: '주소를 입력하세요' },
    ];

    return (
        <div className="flex flex-col h-full w-full bg-gray-50 overflow-hidden font-sans">
            {/* TOP: Header */}
            <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4 shadow-sm z-20">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2 min-w-fit">
                        <Users className="text-blue-600" size={22} /> 고객관리
                    </h1>
                    {/* Search */}
                    <div className="flex-1 max-w-lg relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="고객명, 전화번호, 이메일, 주소로 검색..."
                            className="w-full pl-11 pr-10 py-2.5 rounded-xl bg-gray-100 border border-gray-200 text-sm font-medium
                                       focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 focus:bg-white transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-all">
                                <X size={14} />
                            </button>
                        )}
                    </div>
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                        {filteredCustomers.length}명
                    </span>
                    <button
                        onClick={handleStartAdd}
                        className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-sm"
                    >
                        <Plus size={16} /> 신규 고객
                    </button>
                </div>
            </div>

            {/* BOTTOM: Left List + Right Detail */}
            <div className="flex-1 flex min-h-0 overflow-hidden">

                {/* LEFT: Customer List */}
                <div className="w-[400px] bg-white border-r border-gray-200 flex flex-col flex-shrink-0 overflow-hidden">
                    {/* List Header */}
                    <div className="flex items-center bg-gray-50 border-b border-gray-200 text-[10px] font-bold text-gray-400 uppercase tracking-wider px-4 py-2.5 flex-shrink-0">
                        <div className="w-[80px]">고객명</div>
                        <div className="w-[110px]">전화번호</div>
                        <div className="flex-1">주소</div>
                    </div>

                    {/* List Body */}
                    <div className="flex-1 overflow-y-auto">
                        {filteredCustomers.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                                <Users size={40} strokeWidth={1.5} />
                                <p className="text-sm font-medium mt-3">고객이 없습니다</p>
                            </div>
                        ) : (
                            <AnimatePresence>
                                {filteredCustomers.map((cust) => (
                                    <motion.div
                                        key={cust.id}
                                        onClick={() => handleSelect(cust)}
                                        className={`flex items-center px-4 py-3.5 border-b border-gray-100 cursor-pointer transition-all
                                            ${selectedId === cust.id
                                                ? 'bg-blue-50 border-l-[3px] border-l-blue-500'
                                                : 'hover:bg-gray-50 border-l-[3px] border-l-transparent'
                                            }`}
                                        whileHover={{ x: 2 }}
                                        transition={{ duration: 0.15 }}
                                    >
                                        <div className="w-[80px]">
                                            <span className={`text-sm font-bold ${selectedId === cust.id ? 'text-blue-700' : 'text-gray-800'}`}>
                                                {cust.name}
                                            </span>
                                        </div>
                                        <div className="w-[110px]">
                                            <span className="text-xs text-gray-500 font-mono">{cust.phone}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <span className="text-xs text-gray-500 truncate block">{cust.address}</span>
                                        </div>
                                        <ChevronRight size={14} className="text-gray-300 flex-shrink-0" />
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        )}
                    </div>
                </div>

                {/* RIGHT: Detail / Edit */}
                <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                    {!selectedCustomer && !isAdding ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
                            <User size={48} strokeWidth={1.5} />
                            <p className="text-sm font-medium">좌측 목록에서 고객을 선택하세요</p>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto p-6 space-y-5">
                            {/* Header Card */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                                            <User size={24} />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-bold text-gray-800">
                                                {isAdding ? '신규 고객 등록' : selectedCustomer?.name}
                                            </h2>
                                            {!isAdding && selectedCustomer && (
                                                <span className="text-xs text-gray-400">등록일: {selectedCustomer.createdAt}</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {isFormMode ? (
                                            <>
                                                <button
                                                    onClick={handleCancel}
                                                    className="flex items-center gap-1 px-3 py-2 bg-gray-100 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-200 transition-all"
                                                >
                                                    <X size={14} /> 취소
                                                </button>
                                                <button
                                                    onClick={handleSave}
                                                    className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-all shadow-sm"
                                                >
                                                    <Check size={14} /> 저장
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={handleStartEdit}
                                                    className="flex items-center gap-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 transition-all border border-blue-200"
                                                >
                                                    <Edit3 size={14} /> 수정
                                                </button>
                                                {selectedCustomer && (
                                                    <button
                                                        onClick={() => handleDelete(selectedCustomer.id)}
                                                        className="flex items-center gap-1 px-3 py-2 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 transition-all border border-red-200"
                                                    >
                                                        <Trash2 size={14} /> 삭제
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Fields */}
                                <div className="p-6 space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        {fields.map(f => {
                                            const Icon = f.icon;
                                            const isFullWidth = f.key === 'address';
                                            return (
                                                <div key={f.key} className={isFullWidth ? 'col-span-2' : ''}>
                                                    <label className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 uppercase mb-1.5">
                                                        <Icon size={12} /> {f.label}
                                                    </label>
                                                    {isFormMode ? (
                                                        <input
                                                            type={f.type}
                                                            value={editForm[f.key]}
                                                            onChange={(e) => setEditForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                                                            placeholder={f.placeholder}
                                                            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:bg-white transition-all"
                                                        />
                                                    ) : (
                                                        <div className="px-3 py-2.5 rounded-lg bg-gray-50 border border-gray-100 text-sm font-medium text-gray-800 min-h-[40px] flex items-center">
                                                            {selectedCustomer?.[f.key] || <span className="text-gray-300">-</span>}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Memo (full width, textarea) */}
                                    <div>
                                        <label className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 uppercase mb-1.5">
                                            <StickyNote size={12} /> 비고
                                        </label>
                                        {isFormMode ? (
                                            <textarea
                                                value={editForm.memo}
                                                onChange={(e) => setEditForm(prev => ({ ...prev, memo: e.target.value }))}
                                                placeholder="비고 사항을 입력하세요..."
                                                rows={3}
                                                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:bg-white transition-all resize-none"
                                            />
                                        ) : (
                                            <div className="px-3 py-2.5 rounded-lg bg-gray-50 border border-gray-100 text-sm font-medium text-gray-800 min-h-[72px]">
                                                {selectedCustomer?.memo || <span className="text-gray-300">비고 없음</span>}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Images Section */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="px-6 py-3 bg-gradient-to-r from-violet-50 to-purple-50 border-b border-gray-100 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 bg-violet-100 text-violet-600 rounded-lg"><ImageIcon size={16} /></div>
                                        <h3 className="font-bold text-gray-800">이미지</h3>
                                        <span className="text-xs text-gray-400 font-mono">{customerImages.length}장</span>
                                    </div>
                                    {isFormMode && (
                                        <button
                                            onClick={() => imageInputRef.current?.click()}
                                            className="flex items-center gap-1 px-3 py-1.5 bg-violet-600 text-white rounded-lg text-xs font-bold hover:bg-violet-700 transition-all shadow-sm"
                                        >
                                            <Camera size={14} /> 이미지 추가
                                        </button>
                                    )}
                                    <input
                                        ref={imageInputRef}
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        className="hidden"
                                        onChange={handleImageUpload}
                                    />
                                </div>
                                <div className="p-5">
                                    {customerImages.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-8 text-gray-300">
                                            <ImageIcon size={36} strokeWidth={1.5} />
                                            <p className="text-xs font-medium mt-2">등록된 이미지가 없습니다</p>
                                            {isFormMode && <p className="text-[10px] text-gray-400 mt-1">상단의 '이미지 추가' 버튼을 클릭하세요</p>}
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-4 gap-3">
                                            {customerImages.map((img, idx) => (
                                                <div key={idx} className="relative group rounded-xl overflow-hidden border border-gray-200 aspect-square cursor-pointer"
                                                    onClick={() => !isFormMode && setPreviewImage(img)}
                                                >
                                                    <img src={img} alt={`고객 이미지 ${idx + 1}`} className="w-full h-full object-cover" />
                                                    {isFormMode && (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleRemoveImage(idx); }}
                                                            className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                                        >
                                                            <X size={12} />
                                                        </button>
                                                    )}
                                                    {!isFormMode && (
                                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                                                            <Search size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Image Preview Modal */}
            <AnimatePresence>
                {previewImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-8"
                        onClick={() => setPreviewImage(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.8 }}
                            className="relative max-w-4xl max-h-full"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <img src={previewImage} alt="미리보기" className="max-w-full max-h-[80vh] rounded-2xl shadow-2xl object-contain" />
                            <button
                                onClick={() => setPreviewImage(null)}
                                className="absolute -top-3 -right-3 w-8 h-8 bg-white text-gray-700 rounded-full flex items-center justify-center shadow-lg hover:bg-gray-100 transition-all"
                            >
                                <X size={16} />
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CustomerManagement;
