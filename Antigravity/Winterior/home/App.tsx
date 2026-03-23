
import React, { useState } from 'react';
import { UserRole } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import QuickRoleSwitcher from './components/QuickRoleSwitcher';
import UIInspector from './components/UIInspector';
import { ProductProvider } from './components/ProductContext';
import { PartnerProvider } from './PartnerContext';
import { AdminThemeProvider } from './components/theme/AdminThemeContext';

const App: React.FC = () => {
  const [currentRole, setCurrentRole] = useState<UserRole>(UserRole.GUEST);
  // Default path should be 'store' for GUEST role to avoid showing business dashboard
  const [currentPath, setCurrentPath] = useState<string>('store');
  const [isInspectorActive, setIsInspectorActive] = useState(false);

  const handleRoleChange = (newRole: UserRole) => {
    setCurrentRole(newRole);
    // Reset path when role changes for better UX
    setCurrentPath(newRole === UserRole.GUEST ? 'store' : 'dashboard');
  };

  const handleNavigate = (id: string) => {
    setCurrentPath(id);
  };

  const handleLogout = () => {
    if (confirm("로그아웃 하시겠습니까?")) {
      setCurrentRole(UserRole.GUEST);
      setCurrentPath('store');
    }
  };

  return (
    <AdminThemeProvider roleKey={
      currentRole === UserRole.ADMIN ? 'ADMIN' :
      currentRole === UserRole.FABRIC_SUPPLIER ? 'FABRIC_SUPPLIER' :
      currentRole === UserRole.MANUFACTURER ? 'MANUFACTURER' :
      currentRole === UserRole.DISTRIBUTOR ? 'DISTRIBUTOR' :
      currentRole === UserRole.AGENCY ? 'AGENCY' : 'ADMIN'
    }>
      <ProductProvider>
        <PartnerProvider>
          <div className="flex h-screen w-full bg-gray-50 overflow-hidden font-sans text-gray-800">
            {/* Dynamic Sidebar */}
            <Sidebar
              role={currentRole}
              currentPath={currentPath}
              onNavigate={handleNavigate}
              onLogout={handleLogout}
              isInspectorActive={isInspectorActive}
              onToggleInspector={() => setIsInspectorActive(!isInspectorActive)}
            />

            {/* Main Layout */}
            <Dashboard
              role={currentRole}
              currentPath={currentPath}
              onNavigate={handleNavigate}
              isInspectorActive={isInspectorActive}
            />

            {/* Role Switcher (For Demo Purpose) */}
            <QuickRoleSwitcher
              currentRole={currentRole}
              onRoleChange={handleRoleChange}
            />

            {/* Global UI Inspector */}
            <UIInspector isActive={isInspectorActive} />
          </div>
        </PartnerProvider>
      </ProductProvider>
    </AdminThemeProvider>
  );
};

export default App;
