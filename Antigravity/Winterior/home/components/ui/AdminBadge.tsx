import React from 'react';

// === 인터페이스 정의 ===
export interface AdminBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'outline';
    dot?: boolean; // 작은 점(Indicator)을 앞에 표시할지 여부
    icon?: React.ReactNode;
}

// 상태 라벨이나 카운트 등을 보여주는 공통 뱃지 컴포넌트
export const AdminBadge: React.FC<AdminBadgeProps> = ({
    className = '',
    variant = 'primary',
    dot = false,
    icon,
    children,
    ...props
}) => {
    // 베이스 클래스 (둥글기는 인라인 style로 주입)
    const baseClass = "inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-bold border";

    // 상태별 스타일 매핑 (Tailwind Color)
    const variantStyles = {
        primary: "bg-[var(--theme-primary)] text-white border-transparent",
        secondary: "bg-gray-100 text-gray-700 border-transparent",
        success: "bg-emerald-50 text-emerald-700 border-emerald-200",
        danger: "bg-red-50 text-red-700 border-red-200",
        warning: "bg-amber-50 text-amber-700 border-amber-200",
        info: "bg-blue-50 text-blue-700 border-blue-200",
        outline: "bg-transparent text-gray-600 border-gray-300",
    };

    const dotColors = {
        primary: "bg-white",
        secondary: "bg-gray-400",
        success: "bg-emerald-500",
        danger: "bg-red-500",
        warning: "bg-amber-500",
        info: "bg-blue-500",
        outline: "bg-gray-400",
    };

    return (
        <span
            className={`${baseClass} ${variantStyles[variant]} ${className}`}
            style={{ borderRadius: 'var(--theme-radius)' }}
            {...props}
        >
            {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]} flex-shrink-0`} />}
            {icon && <span className="flex-shrink-0">{icon}</span>}
            {children}
        </span>
    );
};
