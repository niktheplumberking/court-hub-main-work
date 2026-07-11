import { Fragment } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Reveal from './Reveal';
import type { ContentMap } from '@/lib/content/get';

export default function ConstructPanel({ content }: { content: ContentMap }) {
  // The configurator has no model deep-link (ConstructClient reads no search
  // params), so all three type rows land on /construct-your-court.
  const courtTypes = [
    { name: content['home.construct.type1.name'], desc: content['home.construct.type1.desc'] },
    { name: content['home.construct.type2.name'], desc: content['home.construct.type2.desc'] },
    { name: content['home.construct.type3.name'], desc: content['home.construct.type3.desc'] },
  ];

  return (
    <section id="construct" className="py-[88px]">
      <div className="mx-auto max-w-[1280px] px-6">
        <Reveal>
          <div className="ch-on-dark grid min-h-[520px] grid-cols-1 overflow-hidden rounded-[44px] bg-ink min-[901px]:grid-cols-[1.05fr_1fr]">
            <div className="relative min-h-[320px]">
              <Image
                src={content['home.construct.image']}
                alt="Court construction in Dubai"
                fill
                sizes="(max-width: 900px) 100vw, 660px"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_55%,rgba(14,14,12,0.55)_100%)]" />
            </div>

            <div className="flex flex-col justify-center gap-[22px] px-7 py-9 text-white min-[901px]:px-[52px] min-[901px]:py-14">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-lime">
                {content['home.construct.eyebrow']}
              </p>
              <h2 className="font-display text-[clamp(30px,4.4vw,54px)] font-black uppercase leading-[0.95] tracking-[-0.03em]">
                {content['home.construct.heading'].split('\n').map((line, i, arr) => (
                  <Fragment key={i}>
                    {line}
                    {i < arr.length - 1 && <br />}
                  </Fragment>
                ))}
              </h2>
              <p className="max-w-[440px] text-[14.5px] leading-relaxed text-white/70">
                {content['home.construct.paragraph']}
              </p>

              <div className="flex flex-col border-t border-white/[.12]">
                {courtTypes.map((t) => (
                  <Link
                    key={t.name}
                    href="/construct-your-court"
                    className="flex items-center justify-between border-b border-white/[.12] px-1 py-[15px] transition-[padding] duration-200 hover:pl-3"
                  >
                    <span className="font-display text-base font-extrabold uppercase tracking-[0.01em]">
                      {t.name}
                    </span>
                    <span className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-white/50">
                      {t.desc}
                    </span>
                  </Link>
                ))}
              </div>

              <div className="mt-1.5 flex flex-wrap gap-3">
                <Link
                  href="/construct-your-court"
                  className="inline-flex items-center gap-2.5 rounded-full bg-lime px-7 py-[15px] font-display text-sm font-bold text-ink transition-all duration-200 hover:-translate-y-0.5 hover:bg-white"
                >
                  {content['home.construct.cta']}
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-[15px] w-[15px]" aria-hidden>
                    <path d="M7 17L17 7M17 7H8M17 7v9" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
