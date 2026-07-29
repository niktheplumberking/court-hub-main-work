import { cookies } from 'next/headers';
import AdminChrome from '@/components/admin/AdminChrome';
import { ADMIN_THEME_COOKIE, type AdminTheme } from '@/components/admin/ThemeToggle';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Server-side theme read: the wrapper ships with the right skin already
  // applied, so light mode never flashes dark on load. This is the ONLY
  // .adm-root on any admin page — pages must not add their own, or nested
  // wrappers would each carry a theme and fight each other.
  const cookieStore = await cookies();
  const theme: AdminTheme = cookieStore.get(ADMIN_THEME_COOKIE)?.value === 'light' ? 'light' : 'dark';

  return (
    <div className="adm-root adm-grid-bg min-h-screen bg-ink" data-admin-theme={theme}>
      <AdminChrome theme={theme} />
      <div className="px-6 md:px-10 py-10 max-w-[1440px] mx-auto">{children}</div>
    </div>
  );
}
