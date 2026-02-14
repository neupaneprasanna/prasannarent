'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import Link from 'next/link';

export const AdminBreadcrumbs: React.FC = () => {
    const pathname = usePathname();
    const paths = pathname.split('/').filter(p => p);

    return (
        <div className="flex items-center gap-2 text-sm">
            <Link
                href="/admin"
                className="text-[var(--admin-text-tertiary)] hover:text-[var(--admin-accent)] transition-colors flex items-center gap-1"
            >
                <Home size={14} />
            </Link>

            {paths.map((path, idx) => {
                const isLast = idx === paths.length - 1;
                const href = `/${paths.slice(0, idx + 1).join('/')}`;

                // Skip 'admin' since we have the home icon
                if (path === 'admin') return null;

                return (
                    <React.Fragment key={path}>
                        <ChevronRight size={12} className="text-[var(--admin-text-muted)]" />
                        {isLast ? (
                            <span className="font-semibold text-[var(--admin-text-primary)] capitalize">
                                {path}
                            </span>
                        ) : (
                            <Link
                                href={href}
                                className="text-[var(--admin-text-tertiary)] hover:text-[var(--admin-text-primary)] transition-colors capitalize"
                            >
                                {path}
                            </Link>
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
};
