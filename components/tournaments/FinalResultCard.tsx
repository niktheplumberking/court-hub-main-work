import Link from 'next/link';
import type { TournamentResult } from '@/lib/tournaments/data';

function Mini({ label, name, nat }: { label: string; name: string; nat: string }) {
  return (
    <div className="rounded-2xl border border-ink/10 bg-sand-card p-[18px_20px]">
      <div className="font-mono text-[9.5px] font-bold uppercase tracking-[0.14em] text-ink/45">{label}</div>
      <div className="mt-[5px] font-display text-[17px] font-extrabold tracking-[-0.01em] text-ink">{name}</div>
      <div className="mt-0.5 font-mono text-[10px] text-ink/40">{nat}</div>
    </div>
  );
}

export default function FinalResultCard({ result }: { result: TournamentResult }) {
  return (
    <div className="ch-fadein">
      <p className="mb-4 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-ink/45">Final Result</p>
      <div className="flex max-w-[640px] flex-col gap-3.5">
        {/* Champions — gold banner */}
        <div className="relative overflow-hidden rounded-[22px] bg-[linear-gradient(135deg,#b8933e,#e8c766)] p-[26px_28px] text-ink">
          <div className="absolute right-6 top-[18px] text-[42px] opacity-50">🏆</div>
          <div className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] opacity-70">Champions</div>
          <div className="mt-1.5 font-display text-[30px] font-black tracking-[-0.02em]">{result.champion.name}</div>
          <div className="mt-1 font-mono text-[11px] font-bold tracking-[0.1em] opacity-80">{result.champion.nat}</div>
        </div>
        {/* Final score */}
        <div className="flex items-center justify-between rounded-2xl bg-ink p-[16px_22px] text-white">
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/50">Final Score</span>
          <span className="font-display text-[18px] font-extrabold text-lime">{result.score}</span>
        </div>
        {/* Runner-up + third */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Mini label="Runner-up" name={result.runnerUp.name} nat={result.runnerUp.nat} />
          <Mini label="Third place" name={result.third.name} nat={result.third.nat} />
        </div>
        <div className="mt-2">
          <Link href="/leaderboards" className="font-display text-[13.5px] font-bold text-court-blue hover:underline">
            See season leaderboard →
          </Link>
        </div>
      </div>
    </div>
  );
}
