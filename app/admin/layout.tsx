import Link from 'next/link';
import LogoutButton from '@/components/admin/LogoutButton';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-ink">
      <nav className="sticky top-0 z-50 flex items-center justify-between px-6 md:px-10 py-4 bg-ink/90 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center gap-8">
          <Link href="/admin" className="font-display font-bold tracking-[0.25em] text-white text-sm">
            COURT <span className="text-lime">HUB</span> <span className="text-white/30 font-sans tracking-normal font-normal ml-2">Admin</span>
          </Link>
          <div className="hidden md:flex gap-6 text-sm">
            <Link href="/admin/products" className="text-white/60 hover:text-lime">Products</Link>
            <Link href="/admin/orders" className="text-white/60 hover:text-lime">Orders</Link>
            <Link href="/admin/content" className="text-white/60 hover:text-lime">Site Content</Link>
            <Link href="/shop" className="text-white/60 hover:text-lime">View Shop ↗</Link>
          </div>
        </div>
        <LogoutButton />
      </nav>
      <div className="px-6 md:px-10 py-8 max-w-6xl mx-auto">{children}</div>
    </div>
  );
}
