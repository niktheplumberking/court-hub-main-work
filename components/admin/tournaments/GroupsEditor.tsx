import { createGroup, deleteGroup, deleteGroupTeam, saveGroupTeam } from '@/lib/actions/tournaments';
import type { GroupData } from '@/lib/tournaments/admin-types';
import { AdminSubmit, ConfirmButton } from './bits';

const inputCls =
  'w-full bg-ink border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder:text-white/25 focus:border-lime outline-none text-sm';
const miniCls =
  'w-full bg-ink border border-white/10 rounded-lg px-2 py-2 text-white text-center placeholder:text-white/25 focus:border-lime outline-none text-xs';
const labelCls = 'block text-white/40 text-[10px] uppercase tracking-wider mb-1.5';

function TeamRow({
  slug,
  groupId,
  team,
}: {
  slug: string;
  groupId: string;
  team?: GroupData['teams'][number];
}) {
  return (
    <form action={saveGroupTeam} className="grid grid-cols-2 md:grid-cols-[1.4fr_1fr_1fr_64px_repeat(6,52px)_56px_auto_auto] gap-2 items-end border-b border-white/5 pb-3">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="group_id" value={groupId} />
      {team && <input type="hidden" name="id" value={team.id} />}
      <div className="col-span-2 md:col-span-1">
        <label className={labelCls}>Pair name</label>
        <input name="pair_name" required defaultValue={team?.pairName} placeholder="Moreno / Ruiz" className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>Player 1</label>
        <input name="p1" defaultValue={team?.p1} className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>Player 2</label>
        <input name="p2" defaultValue={team?.p2} className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>Nat</label>
        <input name="nat" defaultValue={team?.nat} placeholder="UAE" className={miniCls} />
      </div>
      {(['P', 'W', 'L', 'SF', 'SA', 'PTS'] as const).map((k) => (
        <div key={k}>
          <label className={labelCls}>{k}</label>
          <input name={k} type="number" defaultValue={team ? team[k] : 0} className={miniCls} />
        </div>
      ))}
      <div>
        <label className={labelCls}>Sort</label>
        <input name="sort" type="number" defaultValue={team?.sort ?? 0} className={miniCls} />
      </div>
      <label className="flex items-center gap-1.5 text-white/60 text-xs pb-2.5">
        <input type="checkbox" name="q" defaultChecked={team?.q} className="w-4 h-4 accent-[#C8FF3D]" />
        Q
      </label>
      <div className="flex items-center gap-2 pb-0.5">
        <AdminSubmit label={team ? 'Save' : 'Add'} className="px-4 py-2 rounded-full bg-lime text-ink font-bold text-xs disabled:opacity-50" />
        {team && (
          <ConfirmButton
            action={deleteGroupTeam.bind(null, slug, groupId, team.id)}
            message={`Remove ${team.pairName} from this group?`}
            label="Remove team"
            icon
          />
        )}
      </div>
    </form>
  );
}

/** Groups + standings editor: create groups, edit each team's standings row. */
export default function GroupsEditor({ slug, groups }: { slug: string; groups: GroupData[] }) {
  return (
    <div className="bg-ink-2 rounded-[20px] border border-white/5 p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-white font-display font-bold text-lg">Groups &amp; Standings</h3>
          <p className="text-white/40 text-xs mt-1">Feeds the Teams and Standings tabs. Q = qualified for the knockout.</p>
        </div>
        <form action={createGroup} className="flex items-end gap-2">
          <input type="hidden" name="slug" value={slug} />
          <div>
            <label className={labelCls}>New group label</label>
            <input name="label" required placeholder="A" maxLength={3} className={`${inputCls} w-24`} />
          </div>
          <AdminSubmit label="Add group" className="px-4 py-2.5 rounded-full bg-court-blue text-white font-bold text-xs disabled:opacity-50" />
        </form>
      </div>

      {groups.length === 0 && <p className="text-white/30 text-sm">No groups yet. Add group A to publish the draw.</p>}

      {groups.map((g) => (
        <div key={g.id} className="border border-white/10 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-display font-bold text-white">Group {g.label}</span>
            <ConfirmButton
              action={deleteGroup.bind(null, slug, g.id)}
              message={`Delete group ${g.label} and all its teams?`}
              label={`Delete group ${g.label}`}
            />
          </div>
          <div className="space-y-3">
            {g.teams.map((tm) => (
              <TeamRow key={tm.id} slug={slug} groupId={g.id} team={tm} />
            ))}
            <TeamRow slug={slug} groupId={g.id} />
          </div>
        </div>
      ))}
    </div>
  );
}
