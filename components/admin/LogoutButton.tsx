import { signOut } from '@/lib/actions/auth';

// Server-side sign-out: clears the httpOnly session cookies, then redirects.
export default function LogoutButton() {
  return (
    <form action={signOut}>
      <button
        type="submit"
        className="px-4 py-1.5 rounded-full border border-white/15 text-white/40 text-sm hover:border-fire hover:text-fire transition-colors cursor-pointer"
      >
        Sign out
      </button>
    </form>
  );
}
