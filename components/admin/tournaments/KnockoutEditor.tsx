import { saveMatch } from '@/lib/actions/tournaments';
import { MATCH_SLOTS, type MatchData, type MatchSlot } from '@/lib/tournaments/admin-types';
import { AdminSubmit } from './bits';

const inputCls =
  'w-full bg-ink border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder:text-white/25 focus:border-lime outline-none text-sm';
const labelCls = 'block text-white/40 text-[10px] uppercase tracking-wider mb-1.5';

function MatchCard({ slug, slot, label, match }: { slug: string; slot: MatchSlot; label: string; match?: MatchData }) {
  return (
    <form action={saveMatch} className="border border-white/10 rounded-2xl p-4 space-y-3">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="slot" value={slot} />
      <div className="flex items-center justify-between gap-3">
        <span className="font-display font-bold text-white">{label}</span>
        <select name="status" defaultValue={match?.status ?? 'soon'} className="bg-ink border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:border-lime outline-none">
          <option value="soon">Upcoming</option>
          <option value="live">Live</option>
          <option value="done">Done</option>
        </select>
      </div>
      <input type="hidden" name="label" value={label} />
      <div className="grid grid-cols-[1fr_70px_90px] gap-2 items-end">
        <div>
          <label className={labelCls}>Pair A</label>
          <input name="a_name" defaultValue={match?.aName} placeholder="Moreno / Ruiz" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Nat</label>
          <input name="a_nat" defaultValue={match?.aNat} placeholder="ESP" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Sets A</label>
          <input name="sa" defaultValue={match?.sa.join(', ')} placeholder="6, 3" className={inputCls} />
        </div>
      </div>
      <div className="grid grid-cols-[1fr_70px_90px] gap-2 items-end">
        <div>
          <label className={labelCls}>Pair B</label>
          <input name="b_name" defaultValue={match?.bName} placeholder="Herrera / Navarro" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Nat</label>
          <input name="b_nat" defaultValue={match?.bNat} placeholder="ESP" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Sets B</label>
          <input name="sb" defaultValue={match?.sb.join(', ')} placeholder="4, 3" className={inputCls} />
        </div>
      </div>
      <div className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end">
        <div>
          <label className={labelCls}>Court</label>
          <input name="court" defaultValue={match?.court} placeholder="Centre Court" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Time label</label>
          <input name="time" defaultValue={match?.time} placeholder="Sat 18:00" className={inputCls} />
        </div>
        <AdminSubmit label="Save" className="px-5 py-2.5 rounded-full bg-lime text-ink font-bold text-xs disabled:opacity-50" />
      </div>
      <p className="text-white/25 text-[11px]">Set scores as comma lists, one number per set (both pairs need the same count). The last set turns lime for the winner.</p>
    </form>
  );
}

/** Knockout editor: the four fixed slots that drive the public bracket. */
export default function KnockoutEditor({
  slug,
  matches,
}: {
  slug: string;
  matches: Partial<Record<MatchSlot, MatchData>>;
}) {
  return (
    <div className="bg-ink-2 rounded-[20px] border border-white/5 p-6 space-y-4">
      <div>
        <h3 className="text-white font-display font-bold text-lg">Knockout Bracket</h3>
        <p className="text-white/40 text-xs mt-1">
          Drives the public bracket and the live hub banner (a live Final shows there). Saving any slot publishes the bracket; unsaved slots show as TBD.
        </p>
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        {MATCH_SLOTS.map(({ slot, label }) => (
          <MatchCard key={slot} slug={slug} slot={slot} label={label} match={matches[slot]} />
        ))}
      </div>
    </div>
  );
}
