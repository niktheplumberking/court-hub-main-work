import type { ContentMap } from '@/lib/content/get';

export default function NumbersStrip({ content }: { content: ContentMap }) {
  const stats = ['players', 'experience'].map((key) => ({
    value: content[`home.numbers.${key}.value`],
    label: content[`home.numbers.${key}.caption`],
  }));

  return (
    <section id="numbers" data-cms="home:numbers" className="border-b border-ink/10 py-[72px]">
      <div className="mx-auto max-w-[1280px] px-6">
        <div className="mb-11 flex flex-wrap items-end justify-between gap-6">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-ink/50">
            {content['home.numbers.heading']}
          </p>
          <p className="max-w-[360px] text-[14.5px] leading-relaxed text-ink/55">
            {content['home.numbers.intro']}
          </p>
        </div>
        <div className="grid grid-cols-1 gap-y-7 min-[480px]:grid-cols-2">
          {stats.map((stat) => (
            <div key={stat.label} className="min-w-0 min-[480px]:border-s min-[480px]:border-ink/[.12] min-[480px]:px-8 first:border-s-0 first:ps-0">
              <p className="text-start font-display text-[clamp(38px,4.6vw,60px)] font-black leading-none tracking-[-0.04em] text-ink">
                <bdi dir="ltr"><span className="text-court-blue">{stat.value.startsWith('+') ? '+' : ''}</span>{stat.value.replace(/^\+/, '')}</bdi>
              </p>
              <p className="mt-2.5 font-mono text-[10px] font-bold uppercase leading-normal tracking-[0.2em] text-ink/50">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
