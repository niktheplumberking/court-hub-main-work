import { deleteLeaderboardRow, saveLeaderboardRow } from '@/lib/actions/tournaments';
import type { LeaderboardEntry } from '@/lib/tournaments/admin-types';
import { AdminSubmit, ConfirmButton } from './bits';

const inputCls =
  'w-full bg-ink border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder:text-white/25 focus:border-lime outline-none text-sm';
const labelCls = 'block text-white/40 text-[10px] uppercase tracking-wider mb-1.5';

function Row({ row }: { row?: LeaderboardEntry }) {
  return (
    <form action={saveLeaderboardRow} className="grid grid-cols-2 md:grid-cols-[1.5fr_70px_110px_repeat(4,64px)_64px_auto] gap-2 items-end border-b border-white/5 pb-3">
      {row && <input type="hidden" name="id" value={row.id} />}
      <div className="col-span-2 md:col-span-1">
        <label className={labelCls}>Pair</label>
        <input name="name" required defaultValue={row?.name} placeholder="Moreno / Ruiz" className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>Nat</label>
        <input name="nat" defaultValue={row?.nat} placeholder="ESP" className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>Division</label>
        <select name="div" defaultValue={row?.div ?? 'Men'} className={inputCls}>
          <option>Men</option>
          <option>Women</option>
          <option>Mixed</option>
        </select>
      </div>
      <div>
        <label className={labelCls}>Events</label>
        <input name="ev" type="number" defaultValue={row?.ev ?? 0} className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>Titles</label>
        <input name="titles" type="number" defaultValue={row?.titles ?? 0} className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>Points</label>
        <input name="pts" type="number" defaultValue={row?.pts ?? 0} className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>Move</label>
        <input name="mv" type="number" defaultValue={row?.mv ?? 0} className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>Sort</label>
        <input name="sort" type="number" defaultValue={row?.sort ?? 0} className={inputCls} />
      </div>
      <div className="flex items-center gap-2 pb-0.5">
        <AdminSubmit label={row ? 'Save' : 'Add'} className="px-4 py-2 rounded-full bg-lime text-ink font-bold text-xs disabled:opacity-50" />
        {row && (
          <ConfirmButton
            action={deleteLeaderboardRow.bind(null, row.id)}
            message={`Remove ${row.name} from the leaderboard?`}
            label="Remove pair"
            icon
          />
        )}
      </div>
    </form>
  );
}

/** Season leaderboard editor. Move: positive = up arrow, negative = down. */
export default function LeaderboardEditor({ rows }: { rows: LeaderboardEntry[] }) {
  return (
    <div className="bg-ink-2 rounded-[20px] border border-white/5 p-6 space-y-4">
      <p className="text-white/40 text-xs">
        The public page sorts by points and recomputes ranks per division filter. Move renders the up/down arrow next to the rank.
      </p>
      <div className="space-y-3">
        {rows.map((r) => (
          <Row key={r.id} row={r} />
        ))}
        <Row />
      </div>
    </div>
  );
}
