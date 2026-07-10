import type { GroupStanding } from '@/lib/tournaments/data';

// Group standings table. Top two (q = qualified) are highlighted; their
// position chip turns court-blue.
export default function GroupTable({ rows }: { rows: GroupStanding[] }) {
  return (
    <div className="overflow-hidden rounded-[22px] border border-ink/10 bg-sand-card">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="border-b border-ink/10 py-[13px] pl-4 text-left font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-ink/45">Pair</th>
            {['P', 'W', 'L', 'Sets', 'Pts'].map((h) => (
              <th key={h} className="border-b border-ink/10 px-2 py-[13px] text-center font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-ink/45">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const b = i === rows.length - 1 ? '' : 'border-b border-ink/10';
            return (
              <tr key={r.t.id} className={r.q ? 'bg-court-blue/5' : ''}>
                <td className={`${b} py-[13px] pl-4 text-left`}>
                  <span
                    className={`mr-2.5 inline-flex h-[22px] w-[22px] items-center justify-center rounded-md font-display text-[12px] font-extrabold ${
                      r.q ? 'bg-court-blue text-white' : 'bg-sand-2 text-ink'
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span className="font-display text-[13.5px] font-bold text-ink">{r.t.name}</span>
                  <span className="ml-[7px] font-mono text-[10px] text-ink/40">{r.t.nat}</span>
                </td>
                <td className={`${b} px-2 py-[13px] text-center text-[13px] font-semibold text-ink`}>{r.P}</td>
                <td className={`${b} px-2 py-[13px] text-center text-[13px] font-semibold text-ink`}>{r.W}</td>
                <td className={`${b} px-2 py-[13px] text-center text-[13px] font-semibold text-ink`}>{r.L}</td>
                <td className={`${b} px-2 py-[13px] text-center text-[13px] font-semibold text-ink`}>{r.SF}-{r.SA}</td>
                <td className={`${b} px-2 py-[13px] text-center font-display text-[15px] font-extrabold text-court-blue`}>{r.PTS}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
