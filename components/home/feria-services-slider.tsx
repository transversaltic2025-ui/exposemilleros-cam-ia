"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  FlaskConical,
  Info,
  Lightbulb,
  Rocket,
  Sprout,
  type LucideIcon,
} from "lucide-react";

const AUTOPLAY_DELAY = 5500;

type FeriaSlide = {
  title: string;
  description: string;
  image: string;
  icon: LucideIcon;
  gradient: string;
};

const slides: FeriaSlide[] = [
  {
    title: "Oferta institucional",
    description:
      "Conozca la oferta de servicios del Centro Agroindustrial del Meta.",
    image: "/images/feria/oferta-institucional.png",
    icon: Info,
    gradient: "from-violet-950 via-violet-800 to-fuchsia-600",
  },
  {
    title: "Mecanización y agricultura de precisión",
    description:
      "Conozca servicios, tecnologías y experiencias aplicadas al sector agropecuario.",
    image: "/images/feria/Mecanización-y-agricultura-de-precisión.png",
    icon: Lightbulb,
    gradient: "from-emerald-950 via-emerald-800 to-lime-600",
  },
  {
    title: "Mariposario",
    description:
      "Explore espacios demostrativos de biodiversidad, ambiente y aprendizaje.",
    image: "/images/feria/mariposario.jpg",
    icon: Sprout,
    gradient: "from-indigo-950 via-indigo-800 to-sky-500",
  },
  {
    title: "Mapa Expoferia",
    description:
      "Ubique los espacios, servicios y recorridos disponibles durante la feria.",
    image: "/images/feria/Mapa_Expoferia.jpg",
    icon: Info,
    gradient: "from-slate-950 via-purple-900 to-violet-600",
  },
  {
    title: "CampeSENA",
    description:
      "Iniciativas campesinas y jóvenes emprendedores del territorio.",
    image: "/images/feria/CampeSENA.png",
    icon: Sprout,
    gradient: "from-cyan-950 via-cyan-800 to-emerald-500",
  },
  {
    title: "Domo geodésico",
    description:
      "Proyectos innovadores, experiencias tecnológicas y soluciones aplicadas.",
    image: "/images/feria/Domo-geodésico.png",
    icon: Lightbulb,
    gradient: "from-stone-950 via-orange-900 to-amber-500",
  },
  {
    title: "Agricultura",
    description:
      "Experiencias, saberes y soluciones para el desarrollo sostenible del campo.",
    image: "/images/feria/Agricultura.png",
    icon: Sprout,
    gradient: "from-green-950 via-green-800 to-emerald-500",
  },
  {
    title: "Proyectos de investigación",
    description:
      "Conozca las propuestas de aprendices, instructores e investigadores en modalidad póster.",
    image: "/images/feria/proyectos-investigacion.png",
    icon: FlaskConical,
    gradient: "from-violet-950 via-violet-800 to-fuchsia-600",
  },
  {
    title: "SENA CAM Hachón",
    description:
      "Conozca el Centro Agroindustrial del Meta y los espacios que reciben la feria.",
    image: "/images/feria/SENA-CAM-Hachón.png",
    icon: Rocket,
    gradient: "from-slate-950 via-slate-800 to-green-600",
  },
];

export function FeriaServicesSlider() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [autoplayVersion, setAutoplayVersion] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches);

    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);
    return () => mediaQuery.removeEventListener("change", updatePreference);
  }, []);

  useEffect(() => {
    if (isPaused || prefersReducedMotion) return;

    const timer = window.setTimeout(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, AUTOPLAY_DELAY);

    return () => window.clearTimeout(timer);
  }, [activeIndex, autoplayVersion, isPaused, prefersReducedMotion]);

  const selectSlide = useCallback((index: number) => {
    setActiveIndex(index);
    setAutoplayVersion((version) => version + 1);
  }, []);

  const showPrevious = () =>
    selectSlide((activeIndex - 1 + slides.length) % slides.length);
  const showNext = () => selectSlide((activeIndex + 1) % slides.length);

  return (
    <section
      className="relative left-1/2 mt-14 w-[100dvw] -translate-x-1/2"
      aria-labelledby="feria-services-title"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setIsPaused(false);
      }}
    >
      <div className="mx-auto mb-6 w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="expo-eyebrow">Explore el encuentro</p>
        <h2
          id="feria-services-title"
          className="mt-2 font-heading text-3xl font-black text-[var(--color-text)] sm:text-4xl"
        >
          ¿Qué encontrará en la feria?
        </h2>
        <p className="mt-2 text-sm leading-7 text-[var(--color-muted)] sm:text-base">
          Conozca los espacios, servicios y experiencias disponibles durante el encuentro.
        </p>
      </div>

      <div
        className="relative h-[340px] w-full overflow-hidden bg-slate-950 shadow-[0_24px_65px_rgba(23,19,33,0.22)] sm:h-[380px] lg:h-[480px]"
        aria-roledescription="carrusel"
        aria-label="Servicios y experiencias de la feria"
      >
        {slides.map((slide, index) => {
          const Icon = slide.icon;
          const isActive = index === activeIndex;

          return (
            <article
              key={slide.title}
              className={`absolute inset-0 bg-gradient-to-br ${slide.gradient} transition-opacity duration-700 ${
                isActive ? "z-10 opacity-100" : "pointer-events-none opacity-0"
              }`}
              aria-hidden={!isActive}
              aria-roledescription="diapositiva"
              aria-label={`${index + 1} de ${slides.length}`}
            >
              <Image
                src={slide.image}
                alt={slide.title}
                fill
                sizes="(min-width: 1280px) 1200px, (min-width: 768px) 90vw, 100vw"
                className="absolute inset-0 size-full object-cover"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
              <div
                className="absolute inset-0 opacity-20"
                aria-hidden="true"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 20% 20%, white 0 1px, transparent 1.5px)",
                  backgroundSize: "24px 24px",
                }}
              />
              <Icon
                className="absolute -right-8 top-8 size-56 rotate-[-8deg] text-white/10 sm:right-8 sm:size-72"
                strokeWidth={1}
                aria-hidden="true"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-black/10" />
              <div className="relative mx-auto flex h-full w-full max-w-7xl flex-col justify-end px-6 pb-20 pt-12 sm:px-10 sm:pb-24 lg:px-12">
                <div className="max-w-3xl">
                  <span className="mb-3 block w-fit rounded-full border border-white/30 bg-white/15 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.14em] text-white backdrop-blur-md sm:mb-4">
                    Feria de servicios
                  </span>
                  <h3 className="max-w-2xl text-3xl font-black leading-tight text-white sm:text-5xl">
                    {slide.title}
                  </h3>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-white/90 sm:mt-4 sm:text-lg sm:leading-7">
                    {slide.description}
                  </p>
                </div>
              </div>
            </article>
          );
        })}

        <div className="absolute inset-x-0 bottom-4 z-20 mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-5 sm:bottom-6 sm:px-10 lg:px-12">
          <button
            type="button"
            onClick={showPrevious}
            className="grid size-12 shrink-0 place-items-center rounded-full border border-white/30 bg-black/30 text-white shadow-lg backdrop-blur-md transition hover:bg-white hover:text-slate-950"
            aria-label="Ver servicio anterior"
          >
            <ArrowLeft className="size-5" aria-hidden="true" />
          </button>

          <div className="flex items-center justify-center gap-2" aria-label="Elegir diapositiva">
            {slides.map((slide, index) => (
              <button
                key={slide.title}
                type="button"
                onClick={() => selectSlide(index)}
                className={`h-3 rounded-full border border-white/60 transition-all ${
                  index === activeIndex
                    ? "w-8 bg-white"
                    : "w-3 bg-white/35 hover:bg-white/75"
                }`}
                aria-label={`Ver ${slide.title}`}
                aria-current={index === activeIndex ? "true" : undefined}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={showNext}
            className="grid size-12 shrink-0 place-items-center rounded-full border border-white/30 bg-black/30 text-white shadow-lg backdrop-blur-md transition hover:bg-white hover:text-slate-950"
            aria-label="Ver servicio siguiente"
          >
            <ArrowRight className="size-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}
