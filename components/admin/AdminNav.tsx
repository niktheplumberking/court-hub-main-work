'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS: { href: string; label: string; exact?: boolean }[] = [
  { href: '/admin', label: 'Dashboard', exact: true },
  { href: '/admin/products', label: 'Products' },
  { href: '/admin/orders', label: 'Orders' },
  { href: '/admin/content', label: 'Site Content' },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <div className="hidden md:flex items-center gap-6 text-sm">
      {LINKS.map(({ href, label, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`py-1 border-b-2 transition-colors duration-200 ${
              active
                ? 'text-lime border-lime'
                : 'text-white/55 border-transparent hover:text-white hover:border-white/30'
            }`}
          >
            {label}
          </Link>
        );
      })}
      <Link
        href="/"
        target="_blank"
        className="py-1 border-b-2 border-transparent text-white/55 hover:text-white hover:border-white/30 transition-colors duration-200"
      >
        View site ↗
      </Link>
    </div>
  );
}
