import { saveTierPoints } from '@/lib/actions/tournaments';
import type { PointsTable, Tier } from '@/lib/tournaments/data';
import { POINTS_ROWS, TIER_ORDER } from '@/lib/tournaments/points';
import { AdminSubmit } from './bits';

const inputCls =
  'w-24 bg-ink border border-white/10 rounded-lg px-3 py-2 text-right text-lime font-bold text-sm focus:border-lime outline-none';

/** Per-tier placement points editor. Feeds the points tables site-wide. */
export default function TierPointsEditor({ points }: { points: Record<Tier, PointsTable> }) {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      {TIER_ORDER.map((tier) => (
        <form key={tier} action={saveTierPoints} className="bg-ink-2 rounded-[20px] border border-white/5 p-6 space-y-3">
          <input type="hidden" name="tier" value={tier} />
          <h3 className="text-white font-display font-bold text-lg">{tier}</h3>
          <div className="divide-y divide-white/5">
            {POINTS_ROWS.map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between gap-3 py-2.5">
                <label className="text-white/60 text-sm">{label}</label>
                <input name={key} type="number" defaultValue={points[tier][key]} className={inputCls} />
              </div>
            ))}
          </div>
          <AdminSubmit label={`Save ${tier} points`} className="w-full py-3 rounded-full bg-lime text-ink font-bold text-sm disabled:opacity-50" />
        </form>
      ))}
    </div>
  );
}
