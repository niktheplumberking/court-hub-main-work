import { deleteScheduleRow, saveScheduleRow } from '@/lib/actions/tournaments';
import type { ScheduleRowData } from '@/lib/tournaments/admin-types';
import { AdminSubmit, ConfirmButton } from './bits';

const inputCls =
  'w-full bg-ink border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder:text-white/25 focus:border-lime outline-none text-sm';
const labelCls = 'block text-white/40 text-[10px] uppercase tracking-wider mb-1.5';

function Row({ slug, row }: { slug: string; row?: ScheduleRowData }) {
  return (
    <form action={saveScheduleRow} className="grid grid-cols-2 md:grid-cols-[64px_110px_90px_1.4fr_1fr_110px_64px_auto] gap-2 items-end border-b border-white/5 pb-3">
      <input type="hidden" name="slug" value={slug} />
      {row && <input type="hidden" name="id" value={row.id} />}
      <div>
        <label className={labelCls}>Day</label>
        <input name="day" defaultValue={row?.day} placeholder="11" className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>Sub-label</label>
        <input name="dow" defaultValue={row?.dow} placeholder="Jul Thu" className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>Time</label>
        <input name="time" defaultValue={row?.time} placeholder="13:00" className={inputCls} />
      </div>
      <div className="col-span-2 md:col-span-1">
        <label className={labelCls}>Event</label>
        <input name="title" required defaultValue={row?.title} placeholder="Group Stage · Round 1" className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>Court / venue</label>
        <input name="venue" defaultValue={row?.venue} placeholder="Courts 1-4" className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>State</label>
        <select name="state" defaultValue={row?.state ?? 'soon'} className={inputCls}>
          <option value="soon">Upcoming</option>
          <option value="live">Live</option>
          <option value="done">Done</option>
        </select>
      </div>
      <div>
        <label className={labelCls}>Sort</label>
        <input name="sort" type="number" defaultValue={row?.sort ?? 0} className={inputCls} />
      </div>
      <div className="flex items-center gap-2 pb-0.5">
        <AdminSubmit label={row ? 'Save' : 'Add'} className="px-4 py-2 rounded-full bg-lime text-ink font-bold text-xs disabled:opacity-50" />
        {row && (
          <ConfirmButton
            action={deleteScheduleRow.bind(null, slug, row.id)}
            message={`Delete "${row.title}"?`}
            label="Delete event"
            icon
          />
        )}
      </div>
    </form>
  );
}

/** Order-of-play editor. Rows group into day columns on the public site. */
export default function ScheduleEditor({ slug, rows }: { slug: string; rows: ScheduleRowData[] }) {
  return (
    <div className="bg-ink-2 rounded-[20px] border border-white/5 p-6 space-y-4">
      <div>
        <h3 className="text-white font-display font-bold text-lg">Order of Play</h3>
        <p className="text-white/40 text-xs mt-1">
          Day is the big number (e.g. 11), sub-label the month + weekday (e.g. Jul Thu). Rows with the same Day share a column, ordered by Sort.
        </p>
      </div>
      <div className="space-y-3">
        {rows.map((r) => (
          <Row key={r.id} slug={slug} row={r} />
        ))}
        <Row slug={slug} />
      </div>
    </div>
  );
}
