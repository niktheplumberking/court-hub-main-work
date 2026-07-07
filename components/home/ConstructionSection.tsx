'use client';
import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, ChevronDown, Mail, MapPin, Check, ShieldCheck, Sparkles } from 'lucide-react';
import { waHref } from '@/lib/whatsapp';

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
}

export default function ConstructionSection({
  isLoaded,
  onProgress,
  preloadedImages,
  isDesktop = false,
  canvasRef: externalCanvasRef,
  formRef: externalFormRef,
  frameCount = 150,
  hideForm = false
}: ConstructionSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const internalCanvasRef = useRef<HTMLCanvasElement>(null);
  const internalFormRef = useRef<HTMLDivElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  
  const canvasRef = externalCanvasRef || internalCanvasRef;
  const formRef = externalFormRef || internalFormRef;

  const [contact, setContact] = useState('');
  const [location, setLocation] = useState('Dubai');
  const [courtModel, setCourtModel] = useState<'classic' | 'panoramic' | 'super'>('panoramic');

  const COURT_CONFIGS = {
    classic: {
      name: 'Classic Model',
      specs: [
        '10mm tempered safety glass panels',
        'Standard textured monofilament turf',
        '4x 200W high-efficiency LED lights',
        'Hot-dip galvanized steel structure'
      ]
    },
    panoramic: {
      name: 'Panoramic Pro',
      specs: [
        '12mm panoramic tempered safety glass',
        'WPT-grade textured monofilament turf',
        '8x 200W professional LED floodlights',
        'Seamless reinforced structure frame'
      ]
    },
    super: {
      name: 'Super Panoramic',
      specs: [
        '12mm ultimate safety glass panels',
        'Premium WPT textured turf',
        '8x 240W elite smart LED floodlights',
        'Championship double-reinforced structure'
      ]
    }
  };

  const handleWhatsAppSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const modelName = COURT_CONFIGS[courtModel].name;
    const message = `Hello Court Hub, I'd like to request a proposal for padel court construction.

Configuration Details:
- Court Model: ${modelName}
- Court Location: ${location}
- Contact Details: ${contact}`;
    window.open(waHref(message), '_blank');
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
          { opacity: 0, y: 60, pointerEvents: 'none' },
          { opacity: 1, y: 0, pointerEvents: 'auto', duration: 1.0, ease: 'power2.out' },
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
        className={`relative w-full bg-sand ${isDesktop ? 'h-screen' : 'h-[400vh]'}`}
      >
        {/* Bottom Gradient Transition to FAQ Section (Transparent to Sand) */}
        {!isDesktop && (
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-sand to-transparent z-10 pointer-events-none" />
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
            className={`${hideForm ? 'hidden ' : ''}absolute top-[46vh] bottom-2 left-4 right-4 mx-auto md:mx-0 flex flex-col md:block md:bottom-auto md:left-auto md:right-16 lg:right-24 md:top-1/2 md:-translate-y-1/2 max-w-sm md:max-w-md lg:max-w-[480px] w-auto md:w-full bg-ink border border-white/10 rounded-[20px] md:rounded-[40px] p-5 md:p-8 space-y-4 md:space-y-5 z-20 opacity-0 shadow-[0_0_50px_rgba(30,90,232,0.18)] hover:shadow-[0_0_60px_rgba(30,90,232,0.25)] transition-shadow duration-500 pointer-events-auto`}
          >
            {/* System telemetry header - Hidden on mobile to save space */}
            <div className="hidden md:flex items-center justify-between border-b border-white/5 pb-2 md:pb-3">
              <div className="flex items-center gap-1.5 md:gap-2">
                <span className="relative flex h-1.5 w-1.5 md:h-2 md:w-2">
                  <span className="radar-pulse-effect absolute inline-flex h-full w-full rounded-full bg-green opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 md:h-2 md:w-2 bg-green"></span>
                </span>
                <span className="font-mono text-[8px] md:text-[9px] tracking-wider text-green uppercase font-semibold">
                  Live Proposal System // Online
                </span>
              </div>
              <span className="font-mono text-[8px] md:text-[9px] text-white/30 uppercase tracking-widest">
                CH-v2.0
              </span>
            </div>

            <div className="space-y-0.5 md:space-y-1">
              <span className="font-mono text-[8px] md:text-[10px] tracking-[0.2em] text-lime uppercase font-bold">/// Builder Configurator ///</span>
              <h3 className="text-base md:text-3xl font-display font-black text-white uppercase italic leading-none">Configure Your Court</h3>
              <p className="hidden md:block text-[10px] md:text-xs text-white/50 leading-relaxed">
                Select a court model specs, check key features in real-time, and get a customized instant quote on WhatsApp.
              </p>
            </div>

            <form onSubmit={handleWhatsAppSubmit} className="flex flex-1 flex-col justify-between space-y-3 md:block md:flex-none md:space-y-4">
              
              {/* Interactive Tabs for Court Model */}
              <div className="space-y-1">
                <label className="text-[8px] md:text-[10px] font-mono text-white/40 uppercase tracking-widest font-bold block">
                  1. Select Court Model <span className="md:hidden text-lime">({COURT_CONFIGS[courtModel].name})</span>
                </label>
                <div className="grid grid-cols-3 gap-1.5 md:gap-2">
                  {[
                    { id: 'classic', label: 'Classic' },
                    { id: 'panoramic', label: 'Panoramic' },
                    { id: 'super', label: 'Super Pro' }
                  ].map((model) => {
                    const isActive = courtModel === model.id;
                    return (
                      <button
                        key={model.id}
                        type="button"
                        onClick={() => setCourtModel(model.id as any)}
                        className={`py-1.5 md:py-2 px-1 rounded-lg md:rounded-xl text-[9px] md:text-xs font-display font-bold uppercase tracking-wider transition-all duration-300 border text-center cursor-pointer ${
                          isActive
                            ? 'bg-lime text-ink border-lime shadow-[0_0_15px_rgba(200,255,61,0.25)] font-extrabold'
                            : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {model.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic specs details box - Hidden on mobile to save space */}
              <div className="hidden md:block bg-white/[0.03] border border-white/5 rounded-xl md:rounded-2xl p-2.5 md:p-4 space-y-1.5 md:space-y-2.5">
                <div className="flex items-center justify-between border-b border-white/5 pb-1 md:pb-1.5">
                  <span className="font-mono text-[8px] md:text-[9px] text-white/40 uppercase tracking-widest">
                    Specifications Details
                  </span>
                  <span className="font-mono text-[8px] md:text-[9px] text-lime uppercase tracking-widest font-bold flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5 md:w-3 md:h-3" />
                    {COURT_CONFIGS[courtModel].name}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-1 md:gap-2">
                  {COURT_CONFIGS[courtModel].specs.map((spec, i) => (
                    <div key={i} className="flex items-start gap-1.5 md:gap-2.5 text-[9px] md:text-[11px] text-white/80">
                      <Check className="w-3 h-3 md:w-3.5 md:h-3.5 text-lime shrink-0 mt-0.5" />
                      <span className="leading-snug">{spec}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Input for contact details */}
              <div className="space-y-1">
                <label className="text-[8px] md:text-[10px] font-mono text-white/40 uppercase tracking-widest font-bold block">2. Contact Info</label>
                <div className="relative flex items-center">
                  <div className="absolute left-3 text-white/30 pointer-events-none">
                    <Mail className="w-3 h-3 md:w-4 md:h-4" />
                  </div>
                  <input 
                    type="text" 
                    required
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder="Email or Phone Number"
                    className="w-full bg-white/5 border border-white/10 rounded-lg md:rounded-2xl pl-9 pr-3 py-2 text-[10px] md:text-sm text-white placeholder:text-white/20 focus:border-lime focus:ring-1 focus:ring-lime focus:bg-white/[0.07] outline-none transition-all"
                  />
                </div>
              </div>

              {/* Input for location select */}
              <div className="space-y-1">
                <label className="text-[8px] md:text-[10px] font-mono text-white/40 uppercase tracking-widest font-bold block">3. Court Location</label>
                <div className="relative flex items-center">
                  <div className="absolute left-3 text-white/30 pointer-events-none">
                    <MapPin className="w-3 h-3 md:w-4 md:h-4" />
                  </div>
                  <select 
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg md:rounded-2xl pl-9 pr-8 py-2 text-[10px] md:text-sm text-white appearance-none focus:border-lime focus:ring-1 focus:ring-lime focus:bg-white/[0.07] outline-none transition-all cursor-pointer"
                  >
                    <option value="Dubai" className="bg-ink text-white">Dubai</option>
                    <option value="Abu Dhabi" className="bg-ink text-white">Abu Dhabi</option>
                    <option value="Sharjah" className="bg-ink text-white">Sharjah</option>
                    <option value="Ras Al Khaimah" className="bg-ink text-white">Ras Al Khaimah</option>
                    <option value="Fujairah" className="bg-ink text-white">Fujairah</option>
                    <option value="Ajman" className="bg-ink text-white">Ajman</option>
                    <option value="Umm Al Quwain" className="bg-ink text-white">Umm Al Quwain</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 md:w-4 md:h-4 text-white/40 pointer-events-none" />
                </div>
              </div>

              {/* WhatsApp submit CTA */}
              <div className="pt-1 space-y-1.5">
                <button 
                  type="submit"
                  className="w-full py-2.5 bg-lime text-ink rounded-lg md:rounded-2xl font-display font-extrabold uppercase tracking-widest text-[9px] md:text-xs flex items-center justify-center gap-1.5 md:gap-2 hover:bg-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 button-glow-effect cursor-pointer"
                >
                  <MessageSquare className="w-3 h-3 fill-ink" />
                  Chat on WhatsApp
                </button>
                
                <div className="hidden md:flex items-center justify-center gap-1 md:gap-1.5 text-[8px] md:text-[9px] font-mono text-white/40 uppercase tracking-wider">
                  <ShieldCheck className="w-3 md:w-3.5 h-3 md:h-3.5 text-lime" />
                  <span>PROPOSAL DELIVERED SECURELY IN SECONDS</span>
                </div>
              </div>

            </form>
          </div>

        </div>
      </section>
    </div>
  );
}
