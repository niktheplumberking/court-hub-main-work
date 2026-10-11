import { redirect } from 'next/navigation';

// The old public "demo admin" preview was unprotected. Tournament management
// lives only in the login-protected console now.
export default function Page() {
  redirect('/admin/tournaments');
}
