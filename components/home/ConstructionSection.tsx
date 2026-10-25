'use client';
import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MessageSquare, ChevronDown, Mail, MapPin, UserRound, ShieldCheck } from 'lucide-react';
import { waHref } from '@/lib/whatsapp';
import { useT } from '@/lib/i18n/LocaleProvider';
import type { ContentMap } from '@/lib/content/get';

gsap.registerPlugin(ScrollTrigger);

interface ConstructionSectionProps {
  isLoaded: boolean;
  onProgress: (progress: number) => void;
  preloadedImages?: React.RefObject<HTMLImageElement[]>;
  isDesktop?: boolean;
  canvasRef?: React.RefObject<HTMLCanvasElement | null>;
  formRef?: React.RefObject<HTMLDivElement | null>;
  /** Number of frames in the active sequence (mobile uses 90, desktop 150). */
  frameCount?: number;
  /** Hide the built-in Configure-Your-Court WhatsApp form (e.g. when embedding
   *  this purely as a build-animation elsewhere, with a separate configurator). */
  hideForm?: boolean;
  /** Site Content map (construct page). Optional — legacy mounts (homepage
   *  StoryConstructionWrapper) omit it and every field falls back to its
   *  original hardcoded copy. */
  content?: ContentMap;
}

export default function ConstructionSection({
  isLoaded,
  onProgress,
  preloadedImages,
  isDesktop = false,
  canvasRef: externalCanvasRef,
  formRef: externalFormRef,
  frameCount = 150,
  hideForm = false,
  content
}: ConstructionSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const internalCanvasRef = useRef<HTMLCanvasElement>(null);
  const internalFormRef = useRef<HTMLDivElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  
  const canvasRef = externalCanvasRef || internalCanvasRef;
  const formRef = externalFormRef || internalFormRef;

  const t = useT();
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [location, setLocation] = useState('Dubai');
  const handleWhatsAppSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !contact.trim()) return;
    const message = `Hello Court Hub, I'd like to discuss padel court construction.

- Name: ${name.trim()}
- Contact Details: ${contact.trim()}
- Court Location: ${location}`;
    window.open(waHref(message), '_blank', 'noopener,noreferrer');
  };

  // 1. Preload construction frames
  useEffect(() => {
    if (preloadedImages) {
      if (preloadedImages.current) {
        imagesRef.current = preloadedImages.current;
      }
      return;
    }
    // Standalone fallback only — in the homepage the wrapper always supplies
    // preloadedImages, so this branch never runs there. Uses the prop frameCount
    // so a standalone mount stays consistent with whatever set it's pointed at.
    let active = true;
    const folderPath = '/construction-frames-hd';
    let loadedCount = 0;
    const images: HTMLImageElement[] = [];

    for (let i = 1; i <= frameCount; i++) {
      const img = new Image();
      const frameNum = String(i).padStart(3, '0');

      const handleLoad = () => {
        if (!active) return;
        loadedCount++;
        const progress = Math.round((loadedCount / frameCount) * 100);
        onProgress(progress);
      };

      img.onload = () => {
        if ('decode' in img) {
          img.decode().then(() => {
            if (active) handleLoad();
          }).catch(() => {
            if (active) handleLoad();
          });
        } else {
          handleLoad();
        }
      };

      img.onerror = () => {
        if (!active) return; // don't spam the console after unmount/cleanup
        console.error(`Failed to load construction frame: ${frameNum}`);
        handleLoad();
      };

      img.src = `${folderPath}/ezgif-frame-${frameNum}.webp`;
      images.push(img);
    }
    imagesRef.current = images;

    return () => {
      active = false;
    };
  }, [preloadedImages, frameCount, onProgress]);

  // 2. Setup GSAP ScrollTrigger Sequence
  useEffect(() => {
    if (!isLoaded || !canvasRef.current || !containerRef.current) return;
    if (isDesktop) return; // Skip mobile ScrollTrigger sequence on desktop

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;

    const lastFrame = frameCount - 1;
    const frames = () => (preloadedImages?.current ?? imagesRef.current);

    // Size the canvas backing store to the actual frame dimensions (mobile frames
    // are portrait 540x960, not the desktop 1920x1080) so drawImage is 1:1 and the
    // CSS object-cover crops cleanly to the viewport without distortion.
    const sizeCanvas = () => {
      const first = frames().find((im) => im && im.complete && im.naturalWidth !== 0);
      canvas.width = first ? first.naturalWidth : 540;
      canvas.height = first ? first.naturalHeight : 960;
    };
    sizeCanvas();

    const drawFrame = (index: number) => {
      const roundedIndex = Math.round(index);
      const img = frames()[roundedIndex];
      if (img && img.complete && img.naturalWidth !== 0) {
        // First valid frame may arrive after initial sizing — keep canvas matched.
        if (canvas.width !== img.naturalWidth || canvas.height !== img.naturalHeight) {
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
        }
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(img, 0, 0, canvas.width, canvas.height);
      }
    };

    // Draw first frame initially
    drawFrame(0);

    const ctx = gsap.context(() => {
      const playhead = { frame: 0 };
      const isMobile = window.innerWidth < 768;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top top',
          end: 'bottom bottom',
          scrub: isMobile ? 0.3 : 0.8,
          invalidateOnRefresh: true,
        }
      });

      // Frame scrubbing animation
      tl.to(playhead, {
        frame: lastFrame,
        snap: { frame: 1 },
        ease: 'none',
        duration: 3,
        onUpdate: () => {
          drawFrame(playhead.frame);
        }
      }, 0);

      // Form fade-in animation during the final reserve phase (skipped when the
      // form is hidden — e.g. when this is embedded purely as a build animation).
      if (!hideForm) {
        tl.fromTo(formRef.current,
          // GSAP owns the transform, including desktop vertical centering;
          // otherwise its y tween clears Tailwind's -translate-y-1/2 and
          // pushes the fields/button below the visible animation frame.
          { opacity: 0, y: 60, yPercent: () => window.innerWidth < 768 ? 0 : -50, pointerEvents: 'none' },
          { opacity: 1, y: 0, yPercent: () => window.innerWidth < 768 ? 0 : -50, pointerEvents: 'auto', duration: 1.0, ease: 'power2.out' },
          3.2
        );
      }

      // Final reserve phase for visual completion
      tl.to({}, { duration: 1.5 }, 3.0);

    }, containerRef);

    return () => ctx.revert();
  }, [isLoaded, isDesktop, preloadedImages, frameCount, hideForm]);

  return (
    <div className="relative w-full h-full">

      {/* 2. Main Scroll Container */}
      <section 
        ref={containerRef}
        id="construction"
        // Runway trimmed 400vh → 220–240vh (client: "too much white space", Oct 2026).
        // pb-24 keeps the sticky frame's resting position 192px above the
        // section end, so the bottom sand fade (h-32, absolute at bottom-0) washes
        // over empty sand only — never the form card or its WhatsApp button
        // (client request via Atif, Jul 2026).
        className={`relative w-full bg-sand ${isDesktop ? 'h-screen' : 'h-[240vh] md:h-[220vh] pb-24'}`}
      >
        {/* Bottom Gradient Transition to FAQ Section (Transparent to Sand) */}
        {!isDesktop && (
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-sand to-transparent z-10 pointer-events-none" />
        )}

        {/* Sticky Viewport Frame Wrapper */}
        <div className={isDesktop ? "relative w-full h-full overflow-hidden flex items-center justify-center" : "sticky top-0 left-0 w-full h-screen overflow-hidden flex items-center justify-center"}>
          
          {/* Background Canvas Sequence */}
          <canvas 
            ref={canvasRef} 
            className="absolute inset-0 w-full h-full object-cover z-0"
          />

          {/* WhatsApp Request Panel Overlay (Appears on the right side once court finishes building) */}
          <div
            ref={formRef}
            className={`${hideForm ? 'hidden ' : ''}absolute top-auto bottom-6 start-4 end-4 mx-auto md:mx-0 flex flex-col md:block md:bottom-auto md:start-auto md:end-16 lg:end-24 md:top-1/2 md:-translate-y-1/2 max-w-sm md:max-w-md lg:max-w-[480px] w-auto md:w-full bg-ink border border-white/10 rounded-[20px] md:rounded-[40px] p-5 md:p-8 space-y-4 md:space-y-5 z-20 opacity-0 shadow-[0_0_50px_rgba(30,90,232,0.18)] hover:shadow-[0_0_60px_rgba(30,90,232,0.25)] transition-shadow duration-500 pointer-events-auto`}
          >
            {/* System telemetry header - Hidden on mobile to save space */}
            <div className="hidden md:flex items-center justify-between border-b border-white/5 pb-2 md:pb-3">
              <div className="flex items-center gap-1.5 md:gap-2">
                <span className="relative flex h-1.5 w-1.5 md:h-2 md:w-2">
                  <span className="radar-pulse-effect absolute inline-flex h-full w-full rounded-full bg-green opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 md:h-2 md:w-2 bg-green"></span>
                </span>
                <span className="font-mono text-[8px] md:text-[9px] tracking-wider text-green uppercase font-semibold">
                  {content?.['construct.build_form.status_badge'] ?? 'Live Proposal System // Online'}
                </span>
              </div>
              <span className="font-mono text-[8px] md:text-[9px] text-white/30 uppercase tracking-widest">
                {content?.['construct.build_form.version_badge'] ?? 'CH-v2.0'}
              </span>
            </div>

            <div className="space-y-0.5 md:space-y-1">
              <span className="font-mono text-[8px] md:text-[10px] tracking-[0.2em] text-lime uppercase font-bold">{content?.['construct.build_form.eyebrow'] ?? '/// Court Construction Enquiry ///'}</span>
              <h3 className="text-xl md:text-3xl font-display font-black text-white uppercase italic leading-none">{content?.['construct.build_form.heading'] ?? 'Let’s Build Your Court'}</h3>
              <p className="hidden md:block text-[10px] md:text-xs text-white/50 leading-relaxed">
                {content?.['construct.build_form.desc'] ?? 'Add your name, contact details and court location, then chat with our team on WhatsApp.'}
              </p>
            </div>

            <form onSubmit={handleWhatsAppSubmit} className="space-y-3 md:space-y-4">
              
              <div className="space-y-1">
                <label htmlFor="construction-name" className="text-[10px] font-mono text-white/40 uppercase tracking-widest font-bold block">
                  {t.pages.buildStep1}
                </label>
                <div className="relative flex items-center">
                  <UserRound className="absolute start-3 w-3 h-3 md:w-4 md:h-4 text-white/30 pointer-events-none" />
                  <input
                    id="construction-name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    required
                    maxLength={120}
                    pattern=".*\S.*"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t.pages.namePlaceholder}
                    className="w-full bg-white/5 border border-white/10 rounded-lg md:rounded-2xl ps-9 pe-3 py-2 text-base md:text-sm text-white placeholder:text-white/20 focus:border-lime focus:ring-1 focus:ring-lime focus:bg-white/[0.07] outline-none transition-all"
                  />
                </div>
              </div>

              {/* Input for contact details */}
              <div className="space-y-1">
                <label htmlFor="construction-contact" className="text-[10px] font-mono text-white/40 uppercase tracking-widest font-bold block">{t.pages.buildStep2}</label>
                <div className="relative flex items-center">
                  <div className="absolute start-3 text-white/30 pointer-events-none">
                    <Mail className="w-3 h-3 md:w-4 md:h-4" />
                  </div>
                  <input
                    id="construction-contact"
                    name="contact"
                    type="text"
                    required
                    maxLength={254}
                    pattern=".*\S.*"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder={t.pages.contactPlaceholder}
                    className="ltr-island w-full bg-white/5 border border-white/10 rounded-lg md:rounded-2xl ps-9 pe-3 py-2 text-base md:text-sm text-white placeholder:text-white/20 focus:border-lime focus:ring-1 focus:ring-lime focus:bg-white/[0.07] outline-none transition-all"
                  />
                </div>
              </div>

              {/* Input for location select */}
              <div className="space-y-1">
                <label htmlFor="construction-location" className="text-[10px] font-mono text-white/40 uppercase tracking-widest font-bold block">{t.pages.buildStep3}</label>
                <div className="relative flex items-center">
                  <div className="absolute start-3 text-white/30 pointer-events-none">
                    <MapPin className="w-3 h-3 md:w-4 md:h-4" />
                  </div>
                  <select
                    id="construction-location"
                    name="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg md:rounded-2xl ps-9 pe-8 py-2 text-base md:text-sm text-white appearance-none focus:border-lime focus:ring-1 focus:ring-lime focus:bg-white/[0.07] outline-none transition-all cursor-pointer"
                  >
                    <option value="Dubai" className="bg-ink text-white">{t.pages.cityDubai}</option>
                    <option value="Abu Dhabi" className="bg-ink text-white">{t.pages.cityAbuDhabi}</option>
                    <option value="Sharjah" className="bg-ink text-white">{t.pages.citySharjah}</option>
                    <option value="Ras Al Khaimah" className="bg-ink text-white">{t.pages.cityRak}</option>
                    <option value="Fujairah" className="bg-ink text-white">{t.pages.cityFujairah}</option>
                    <option value="Ajman" className="bg-ink text-white">{t.pages.cityAjman}</option>
                    <option value="Umm Al Quwain" className="bg-ink text-white">{t.pages.cityUaq}</option>
                  </select>
                  <ChevronDown className="absolute end-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 md:w-4 md:h-4 text-white/40 pointer-events-none" />
                </div>
              </div>

              {/* WhatsApp submit CTA */}
              <div className="pt-1 space-y-1.5">
                <button 
                  type="submit"
                  className="w-full py-2.5 bg-lime text-ink rounded-lg md:rounded-2xl font-display font-extrabold uppercase tracking-widest text-[11px] md:text-xs flex items-center justify-center gap-1.5 md:gap-2 hover:bg-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 button-glow-effect cursor-pointer"
                >
                  <MessageSquare className="w-3 h-3 fill-ink" />
                  {content?.['construct.build_form.cta'] ?? 'Chat on WhatsApp'}
                </button>
                
                <div className="hidden md:flex items-center justify-center gap-1 md:gap-1.5 text-[8px] md:text-[9px] font-mono text-white/40 uppercase tracking-wider">
                  <ShieldCheck className="w-3 md:w-3.5 h-3 md:h-3.5 text-lime" />
                  <span>{content?.['construct.build_form.security_caption'] ?? 'CONTINUE YOUR ENQUIRY ON WHATSAPP'}</span>
                </div>
              </div>

            </form>
          </div>

        </div>
      </section>
    </div>
  );
}
