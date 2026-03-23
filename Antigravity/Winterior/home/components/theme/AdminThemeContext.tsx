import React, { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';

// 정의된 테마 타입
export interface AdminThemeConfig {
    primaryColor: string;
    borderRadius: string;
    fontSizeBase: string;
    darkMode: boolean;
}

const DEFAULT_THEME: AdminThemeConfig = {
    primaryColor: 'violet',
    borderRadius: '0.5rem',
    fontSizeBase: '14px',
    darkMode: false,
};

// CSS Variables로 주입될 실제 HEX/RGB 매핑 간소화 (SaaS 테마용)
const COLOR_MAP: Record<string, {
    base: string; hover: string; text: string; bg: string;
    gridHeaderLight: string; gridHeaderDark: string;
}> = {
    violet:  { base: '#7c3aed', hover: '#6d28d9', text: '#5b21b6', bg: '#ede9fe', gridHeaderLight: '#ede9fe', gridHeaderDark: '#2e1065' },
    blue:    { base: '#3b82f6', hover: '#2563eb', text: '#1e40af', bg: '#dbeafe', gridHeaderLight: '#dbeafe', gridHeaderDark: '#1e3a5f' },
    emerald: { base: '#10b981', hover: '#059669', text: '#065f46', bg: '#d1fae5', gridHeaderLight: '#d1fae5', gridHeaderDark: '#064e3b' },
    gray:    { base: '#4b5563', hover: '#374151', text: '#1f2937', bg: '#f3f4f6', gridHeaderLight: '#e5e7eb', gridHeaderDark: '#1f2937' },
    rose:    { base: '#e11d48', hover: '#be123c', text: '#9f1239', bg: '#ffe4e6', gridHeaderLight: '#ffe4e6', gridHeaderDark: '#4c0519' },
    amber:   { base: '#f59e0b', hover: '#d97706', text: '#92400e', bg: '#fef3c7', gridHeaderLight: '#fef3c7', gridHeaderDark: '#451a03' },
};

// 역할별 localStorage 키 생성 헬퍼
const getStorageKey = (roleKey: string) => `ui_theme_${roleKey}`;

// CSS 변수를 document에 적용하는 순수 함수
export const applyThemeToDOM = (theme: AdminThemeConfig) => {
    const root = document.documentElement;
    const color = COLOR_MAP[theme.primaryColor] || COLOR_MAP.violet;

    root.style.setProperty('--theme-primary', color.base);
    root.style.setProperty('--theme-primary-hover', color.hover);
    root.style.setProperty('--theme-primary-text', color.text);
    root.style.setProperty('--theme-primary-bg', color.bg);
    root.style.setProperty('--theme-btn-label', '#ffffff');
    root.style.setProperty('--theme-radius', theme.borderRadius);
    root.style.setProperty('--theme-font-base', theme.fontSizeBase);

    if (theme.darkMode) {
        root.setAttribute('data-admin-theme', 'dark');
        root.style.setProperty('--admin-bg', '#0f172a');
        root.style.setProperty('--admin-surface', '#1e293b');
        root.style.setProperty('--admin-card', '#1e293b');
        root.style.setProperty('--admin-border', '#334155');
        root.style.setProperty('--admin-text', '#f1f5f9');
        root.style.setProperty('--admin-text-sub', '#94a3b8');
        root.style.setProperty('--admin-input-bg', '#0f172a');
        root.style.setProperty('--admin-grid-header', color.gridHeaderDark);
        root.style.setProperty('--admin-list-bg', '#1e293b');
        root.style.setProperty('--admin-list-alt', '#172033');
        root.style.setProperty('--admin-list-hover', '#334155');
        root.style.setProperty('--admin-sidebar-bg', '#1e293b');
        root.style.setProperty('--admin-modal-bg', '#1e293b');
        // 상태 색상 (다크)
        root.style.setProperty('--color-success', '#4ade80');
        root.style.setProperty('--color-success-bg', '#14532d');
        root.style.setProperty('--color-warning', '#fbbf24');
        root.style.setProperty('--color-warning-bg', '#451a03');
        root.style.setProperty('--color-danger', '#f87171');
        root.style.setProperty('--color-danger-bg', '#450a0a');
        root.style.setProperty('--color-info', '#60a5fa');
        root.style.setProperty('--color-info-bg', '#1e3a5f');
    } else {
        root.setAttribute('data-admin-theme', 'light');
        root.style.setProperty('--admin-bg', '#f9fafb');
        root.style.setProperty('--admin-surface', '#ffffff');
        root.style.setProperty('--admin-card', '#ffffff');
        root.style.setProperty('--admin-border', '#e5e7eb');
        root.style.setProperty('--admin-text', '#111827');
        root.style.setProperty('--admin-text-sub', '#6b7280');
        root.style.setProperty('--admin-input-bg', '#f8fafc');
        root.style.setProperty('--admin-grid-header', color.gridHeaderLight);
        root.style.setProperty('--admin-list-bg', '#ffffff');
        root.style.setProperty('--admin-list-alt', '#f9fafb');
        root.style.setProperty('--admin-list-hover', '#f3f4f6');
        root.style.setProperty('--admin-sidebar-bg', '#ffffff');
        root.style.setProperty('--admin-modal-bg', '#ffffff');
        // 상태 색상 (라이트)
        root.style.setProperty('--color-success', '#16a34a');
        root.style.setProperty('--color-success-bg', '#dcfce7');
        root.style.setProperty('--color-warning', '#ca8a04');
        root.style.setProperty('--color-warning-bg', '#fef9c3');
        root.style.setProperty('--color-danger', '#dc2626');
        root.style.setProperty('--color-danger-bg', '#fee2e2');
        root.style.setProperty('--color-info', '#2563eb');
        root.style.setProperty('--color-info-bg', '#dbeafe');
    }
};

interface AdminThemeContextType {
    theme: AdminThemeConfig;
    setTheme: React.Dispatch<React.SetStateAction<AdminThemeConfig>>;
    resetTheme: () => void;
    toggleDarkMode: () => void;
    roleKey: string;
}

const AdminThemeContext = createContext<AdminThemeContextType | undefined>(undefined);

// roleKey prop을 받아 역할별로 독립적인 테마를 관리
export const AdminThemeProvider: React.FC<{ children: ReactNode; roleKey?: string }> = ({ children, roleKey = 'ADMIN' }) => {
    const prevRoleKeyRef = useRef<string>(roleKey);

    const loadTheme = (key: string): AdminThemeConfig => {
        try {
            const saved = localStorage.getItem(getStorageKey(key));
            if (saved) return { ...DEFAULT_THEME, ...JSON.parse(saved) };
        } catch {}
        return DEFAULT_THEME;
    };

    const [theme, setTheme] = useState<AdminThemeConfig>(() => loadTheme(roleKey));

    // 역할이 바뀌면 해당 역할의 저장된 테마로 갱신
    useEffect(() => {
        if (prevRoleKeyRef.current !== roleKey) {
            prevRoleKeyRef.current = roleKey;
            const loaded = loadTheme(roleKey);
            setTheme(loaded);
        }
    }, [roleKey]);

    // 테마가 바뀌면 CSS 변수 주입 + localStorage 저장
    useEffect(() => {
        applyThemeToDOM(theme);
        try {
            localStorage.setItem(getStorageKey(roleKey), JSON.stringify(theme));
            // 하위 호환성: ADMIN 역할일 때 기존 키도 병행 저장
            if (roleKey === 'ADMIN') {
                localStorage.setItem('admin_ui_theme', JSON.stringify(theme));
            }
        } catch (e) {
            console.warn('[AdminThemeContext] 테마 저장 실패', e);
        }
    }, [theme, roleKey]);

    const resetTheme = () => setTheme(DEFAULT_THEME);
    const toggleDarkMode = () => setTheme(prev => ({ ...prev, darkMode: !prev.darkMode }));

    return (
        <AdminThemeContext.Provider value={{ theme, setTheme, resetTheme, toggleDarkMode, roleKey }}>
            {children}
        </AdminThemeContext.Provider>
    );
};

export const useAdminTheme = () => {
    const context = useContext(AdminThemeContext);
    if (context === undefined) {
        throw new Error('useAdminTheme must be used within an AdminThemeProvider');
    }
    return context;
};
