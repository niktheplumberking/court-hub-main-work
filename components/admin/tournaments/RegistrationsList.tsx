import { deleteRegistration } from '@/lib/actions/tournaments';
import type { Registration } from '@/lib/tournaments/admin-types';
import { ConfirmButton, RegStatusSelect } from './bits';

const fmtAED = (n: number) => `AED ${n.toLocaleString('en-US')}`;
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString('en-AE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

/**
 * Registrations + payments for one tournament. Demo and paid rows count toward
 * capacity; pending and cancelled do not.
 */
export default function RegistrationsList({ registrations }: { registrations: Registration[] }) {
  if (registrations.length === 0) {
    return (
      <p className="text-white/30 text-sm bg-ink-2 rounded-[20px] border border-white/5 p-6">
        No registrations yet. Bookings made through the public site land here with their payment details.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {registrations.map((r) => (
        <div key={r.id} className="bg-ink-2 rounded-[20px] border border-white/5 p-5 flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-white font-display font-bold">
              {r.captain} <span className="text-white/40 font-sans font-normal">&amp;</span> {r.partner}
            </p>
            <p className="text-white/40 text-xs mt-1 truncate">
              {r.email}{r.phone ? ` · ${r.phone}` : ''}{r.nat ? ` · ${r.nat}` : ''}{r.level ? ` · ${r.level}` : ''}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="text-right">
              <p className="text-lime font-display font-bold">{fmtAED(r.amount)}</p>
              <p className="text-white/30 text-[11px] uppercase tracking-wider">{r.method}</p>
            </div>
            <div className="text-right">
              <p className="text-white/80 font-mono text-xs">{r.ref}</p>
              <p className="text-white/30 text-[11px]">{fmtDate(r.createdAt)}</p>
            </div>
            <RegStatusSelect id={r.id} status={r.status} />
            <ConfirmButton
              action={deleteRegistration.bind(null, r.id)}
              message={`Delete the registration for ${r.captain} & ${r.partner}?`}
              label="Delete registration"
              icon
            />
          </div>
        </div>
      ))}
    </div>
  );
}
