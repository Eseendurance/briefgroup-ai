"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, Pause, Play } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

const slides = [
  { src: "/images/field-operations.png", alt: "Brief Group field operations" },
  { src: "/images/farm-analytics.png", alt: "Brief Group farm analytics" },
  { src: "/images/solar-inspection.png", alt: "Brief Group solar inspection" },
  {
    src: "/images/briefgroup-field-team.png",
    alt: "A Brief Group team member working in the field",
  },
  { src: "/images/drone-survey.png", alt: "Brief Group drone field survey" },
  { src: "/images/site-operations.png", alt: "Brief Group site operations" },
  { src: "/images/team-analytics.png", alt: "Brief Group team analytics" },
];

export function FieldCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const showNext = useCallback(() => {
    setActiveIndex((index) => (index + 1) % slides.length);
  }, []);

  const showPrevious = useCallback(() => {
    setActiveIndex((index) => (index - 1 + slides.length) % slides.length);
  }, []);

  useEffect(() => {
    if (isPaused || prefersReducedMotion) return;

    const timer = window.setInterval(showNext, 6000);
    return () => window.clearInterval(timer);
  }, [isPaused, prefersReducedMotion, showNext]);

  return (
    <div
      aria-roledescription="carousel"
      aria-label="Brief Group work in the field"
      className="relative mx-auto w-full max-w-2xl"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setIsPaused(false);
        }
      }}
      onKeyDown={(event) => {
        if (event.key === "ArrowRight") showNext();
        if (event.key === "ArrowLeft") showPrevious();
      }}
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-[1.75rem] bg-slate-100 shadow-2xl shadow-slate-300/50 sm:aspect-[5/4]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeIndex}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.12}
            onDragEnd={(_, info) => {
              if (info.offset.x < -60) showNext();
              if (info.offset.x > 60) showPrevious();
            }}
            initial={{ opacity: 0, x: 14 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -14 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.32 }}
            className="absolute inset-0 cursor-grab active:cursor-grabbing"
            role="group"
            aria-roledescription="slide"
            aria-label={`${activeIndex + 1} of ${slides.length}`}
          >
            <Image
              src={slides[activeIndex].src}
              alt={slides[activeIndex].alt}
              fill
              priority={activeIndex === 0}
              sizes="(max-width: 1024px) 100vw, 55vw"
              className="pointer-events-none select-none object-cover"
              draggable={false}
            />
          </motion.div>
        </AnimatePresence>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-slate-950/45 to-transparent" />
        <p
          aria-live="polite"
          className="pointer-events-none absolute bottom-5 left-5 text-sm font-medium text-white drop-shadow"
        >
          Real places. Real people. Better ways to work.
        </p>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <div
          className="flex items-center gap-1.5"
          role="group"
          aria-label="Choose a photo"
        >
          {slides.map((slide, index) => (
            <button
              key={slide.src}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`Show photo ${index + 1} of ${slides.length}`}
              aria-current={activeIndex === index ? "true" : undefined}
              className={`h-2.5 rounded-full transition-all ${
                activeIndex === index
                  ? "w-7 bg-emerald-700"
                  : "w-2.5 bg-slate-300 hover:bg-slate-400"
              }`}
            />
          ))}
        </div>
        <div className="flex items-center gap-2">
          {!prefersReducedMotion && (
            <button
              type="button"
              onClick={() => setIsPaused((paused) => !paused)}
              aria-label={isPaused ? "Play photo carousel" : "Pause photo carousel"}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:border-emerald-200 hover:text-emerald-800"
            >
              {isPaused ? (
                <Play className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Pause className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          )}
          <button
            type="button"
            onClick={showPrevious}
            aria-label="Previous photo"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:border-emerald-200 hover:text-emerald-800"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={showNext}
            aria-label="Next photo"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:border-emerald-200 hover:text-emerald-800"
          >
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
      <p className="sr-only" aria-live="polite">
        Showing photo {activeIndex + 1} of {slides.length}
      </p>
    </div>
  );
}
