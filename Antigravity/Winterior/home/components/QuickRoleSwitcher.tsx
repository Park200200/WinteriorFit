
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserRole } from '../types';
import { User, Building2, Truck, Factory, ShieldCheck, Globe, X, Menu, Scroll } from 'lucide-react';

interface QuickRoleSwitcherProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
}

const QuickRoleSwitcher: React.FC<QuickRoleSwitcherProps> = ({ currentRole, onRoleChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const roles = [
    { role: UserRole.GUEST, icon: Globe, label: '홍보사이트', desc: '비로그인/일반' },
    { role: UserRole.USER, icon: User, label: '로그인유저', desc: '마이페이지/주문' },
    { role: UserRole.AGENCY, icon: Building2, label: '가맹대리점', desc: '가맹점 관리' },
    { role: UserRole.DISTRIBUTOR, icon: Truck, label: '유통관리사', desc: '물류/발주' },
    { role: UserRole.MANUFACTURER, icon: Factory, label: '제조공급사', desc: '생산/공정' },
    { role: UserRole.FABRIC_SUPPLIER, icon: Scroll, label: '원단공급사', desc: '원단/재고' },
    { role: UserRole.ADMIN, icon: ShieldCheck, label: '총괄관리사', desc: '시스템 설정' },
  ];

  return (
    <>
      {/* Trigger Button */}
      <div className="fixed right-0 top-1/2 transform -translate-y-1/2 z-[60]">
        {!isOpen && (
            <motion.button 
                id="btn-quick-access-open"
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                onClick={() => setIsOpen(true)}
                className="bg-white shadow-lg border border-gray-200 rounded-l-xl p-3 hover:bg-blue-50 transition-colors group cursor-pointer"
            >
                <Menu className="text-gray-500 group-hover:text-blue-600" size={20} />
            </motion.button>
        )}
      </div>

      {/* Sliding Drawer Overlay */}
      <AnimatePresence>
        {isOpen && (
            <>
                {/* Backdrop */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.3 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsOpen(false)}
                    className="fixed inset-0 bg-black z-[60]"
                />
                
                {/* Drawer */}
                <motion.div
                    id="quick-access-drawer"
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="fixed right-0 top-0 h-full w-[280px] bg-white shadow-2xl z-[70] flex flex-col border-l border-gray-100"
                >
                    <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                        <div className="flex flex-col">
                            <h2 className="font-bold text-lg text-gray-800">Quick Access</h2>
                            <p className="text-xs text-gray-400 mt-1">Role Switcher</p>
                        </div>
                        <button id="btn-close-drawer" onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {roles.map((item) => (
                        <button
                            key={item.role}
                            id={`role-btn-${item.role}`}
                            onClick={() => {
                                onRoleChange(item.role);
                                setIsOpen(false);
                            }}
                            className={`w-full flex items-start gap-4 p-4 rounded-xl transition-all duration-200 border text-left
                            ${currentRole === item.role 
                                ? 'bg-blue-50 border-blue-200 shadow-sm' 
                                : 'bg-white border-transparent hover:border-gray-100 hover:shadow-sm'
                            }`}
                        >
                            <div className={`p-2 rounded-lg shrink-0 ${currentRole === item.role ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                                <item.icon size={20} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className={`font-bold text-sm ${currentRole === item.role ? 'text-blue-700' : 'text-gray-700'}`}>
                                    {item.label}
                                </div>
                                <div className="text-xs text-gray-400 mt-0.5 truncate">{item.desc}</div>
                            </div>
                        </button>
                        ))}
                    </div>

                    <div className="p-6 border-t border-gray-100 text-center">
                        <p className="text-xs text-gray-300">WinteriorFit System v1.2</p>
                    </div>
                </motion.div>
            </>
        )}
      </AnimatePresence>
    </>
  );
};

export default QuickRoleSwitcher;
