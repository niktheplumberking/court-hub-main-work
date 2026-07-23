import { notFound } from 'next/navigation';
import ContentStudio from '@/components/admin/studio/ContentStudio';

// DEV-ONLY visual harness for the Content Studio (no auth, no DB) so the
// editor UI can be exercised locally without a Supabase session. Returns 404
// in every non-development build.
export default function StudioPreviewDev() {
  if (process.env.NODE_ENV !== 'development') notFound();
  return (
    <div className="adm-grid-bg min-h-screen bg-ink px-6 md:px-10 py-10">
      <div className="max-w-[1440px] mx-auto">
        <ContentStudio overrides={{}} />
      </div>
    </div>
  );
}
