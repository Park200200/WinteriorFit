import React, { forwardRef } from 'react';

// === 인터페이스 정의 ===
export interface AdminCardProps extends React.HTMLAttributes<HTMLDivElement> {
    elevated?: boolean;
}

// 1. AdminCard 컨테이너
export const AdminCard = forwardRef<HTMLDivElement, AdminCardProps>(
    ({ className = '', elevated = false, children, style, ...props }, ref) => {
        const elevateClass = elevated ? "shadow-md" : "shadow-sm";

        return (
            <div
                ref={ref}
                className={`border overflow-hidden ${elevateClass} ${className}`}
                style={{
                    borderRadius: 'var(--theme-radius)',
                    background: 'var(--admin-surface)',
                    borderColor: 'var(--admin-border)',
                    ...style,
                }}
                {...props}
            >
                {children}
            </div>
        );
    }
);
AdminCard.displayName = 'AdminCard';

// 2. AdminCardHeader (섹션 패딩)
export const AdminCardHeader = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className = '', children, style, ...props }, ref) => {
        return (
            <div ref={ref}
                className={`px-6 py-4 border-b flex flex-col space-y-1.5 ${className}`}
                style={{ borderColor: 'var(--admin-border)', ...style }}
                {...props}>
                {children}
            </div>
        );
    }
);
AdminCardHeader.displayName = 'AdminCardHeader';

// 3. AdminCardTitle (강조 텍스트)
export const AdminCardTitle = forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
    ({ className = '', children, ...props }, ref) => {
        return (
            <h3 ref={ref} className={`text-lg font-black leading-none tracking-tight text-gray-900 ${className}`} {...props}>
                {children}
            </h3>
        );
    }
);
AdminCardTitle.displayName = 'AdminCardTitle';

// 4. AdminCardContent (내용 패딩 영역)
export const AdminCardContent = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className = '', children, ...props }, ref) => {
        return (
            <div ref={ref} className={`p-6 pt-4 ${className}`} {...props}>
                {children}
            </div>
        );
    }
);
AdminCardContent.displayName = 'AdminCardContent';
