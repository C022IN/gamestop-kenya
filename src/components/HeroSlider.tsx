'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface Slide {
  id: string;
  badge?: string;
  title: string;
  subtitle: string;
  highlight?: string;
  price?: string;
  originalPrice?: string;
  buttonText: string;
  buttonLink: string;
  secondaryButtonText?: string;
  secondaryButtonLink?: string;
  gradient: string;
  accentColor: string;
  image: string;
  imageFit?: 'cover' | 'contain';
  imagePosition?: string;
}

const commonsFile = (filename: string) =>
  `https://commons.wikimedia.org/wiki/Special:Redirect/file/${encodeURIComponent(filename)}`;

const heroSlides: Slide[] = [
  {
    id: '1',
    badge: 'TOP SELLER',
    title: 'PlayStation 5',
    subtitle:
      'Next-gen performance, haptic feedback, and lightning-fast load times. Fully stocked with local support in Nairobi.',
    highlight: 'From KSh 65,000',
    price: 'KSh 65,000',
    buttonText: 'Shop PS5',
    buttonLink: '/playstation',
    secondaryButtonText: 'View Accessories',
    secondaryButtonLink: '/accessories',
    gradient: 'from-blue-950 via-blue-900 to-blue-800',
    accentColor: 'text-blue-300',
    image: commonsFile('PlayStation 5 and DualSense.jpg'),
    imageFit: 'cover',
    imagePosition: 'center',
  },
  {
    id: '2',
    badge: 'NEW SERVICE',
    title: 'Premium IPTV',
    subtitle:
      'Activate a protected member hub for live TV, movies, series, and sports with M-Pesa and device-friendly playback.',
    highlight: 'From KSh 4,499',
    price: 'KSh 4,499',
    buttonText: 'Explore IPTV',
    buttonLink: '/iptv',
    secondaryButtonText: 'Member Login',
    secondaryButtonLink: '/movies/login',
    gradient: 'from-slate-950 via-sky-950 to-blue-900',
    accentColor: 'text-sky-200',
    image: '/images/heroes/iptv.svg',
    imageFit: 'contain',
  },
  {
    id: '3',
    badge: 'FLASH DEAL - 40% OFF',
    title: 'Xbox Series X',
    subtitle:
      'The most powerful Xbox built for true 4K gaming and high frame rates. Includes same-day delivery options in Nairobi.',
    highlight: 'KSh 56,000',
    price: 'KSh 56,000',
    originalPrice: 'KSh 72,000',
    buttonText: 'Shop Xbox',
    buttonLink: '/xbox',
    secondaryButtonText: 'Xbox Game Pass',
    secondaryButtonLink: '/digital-store',
    gradient: 'from-emerald-950 via-green-900 to-emerald-800',
    accentColor: 'text-emerald-300',
    image: commonsFile('Xbox Series (X).jpg'),
    imageFit: 'cover',
    imagePosition: 'center',
  },
  {
    id: '4',
    badge: 'FAMILY FAVORITE',
    title: 'Nintendo Switch OLED',
    subtitle:
      'Flexible handheld and docked play on a vibrant OLED display. Great for family gaming, parties, and travel.',
    highlight: 'KSh 45,000',
    price: 'KSh 45,000',
    buttonText: 'Shop Nintendo',
    buttonLink: '/nintendo-switch',
    secondaryButtonText: 'Browse Games',
    secondaryButtonLink: '/games',
    gradient: 'from-red-950 via-rose-900 to-red-800',
    accentColor: 'text-red-300',
    image: commonsFile('Nintendo Switch OLED.JPG'),
    imageFit: 'cover',
    imagePosition: 'center',
  },
  {
    id: '5',
    badge: 'SETUP UPGRADE',
    title: 'PC Gaming Gear',
    subtitle:
      'Mechanical keyboards, high-refresh monitors, and precision mice to build a complete premium setup.',
    highlight: 'Starting at KSh 3,500',
    price: 'From KSh 3,500',
    buttonText: 'Shop PC Gaming',
    buttonLink: '/pc-gaming',
    secondaryButtonText: 'Steam Codes',
    secondaryButtonLink: '/digital-store',
    gradient: 'from-slate-950 via-gray-900 to-zinc-800',
    accentColor: 'text-slate-300',
    image: commonsFile('PC-Gehäuse Kolink Observatory RGB Midi-Tower 20201120 DSC6134.jpg'),
    imageFit: 'cover',
    imagePosition: 'center',
  },
];

export default function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [paused]);

  const goToPrevious = () =>
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  const goToNext = () => setCurrentSlide((prev) => (prev + 1) % heroSlides.length);

  return (
    <div
      className="lux-card lux-grain relative h-[430px] overflow-hidden rounded-3xl border border-white/30 shadow-2xl md:h-[540px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {heroSlides.map((slide, index) => {
        const isActive = index === currentSlide;
        return (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-700 ${
              isActive ? 'z-10 opacity-100' : 'z-0 opacity-0'
            }`}
          >
            <div
              className={`relative flex h-full items-center overflow-hidden bg-gradient-to-br ${slide.gradient}`}
            >
              <div className="absolute right-0 top-0 h-96 w-96 translate-x-1/3 -translate-y-1/2 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute bottom-0 left-0 h-72 w-72 -translate-x-1/4 translate-y-1/3 rounded-full bg-black/30 blur-2xl" />

              <div className="container relative z-10 mx-auto flex flex-col items-center gap-8 px-6 md:flex-row md:px-10">
                <div className="md:w-1/2 text-white">
                  {slide.badge && (
                    <span
                      className={`mb-4 inline-flex rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold tracking-wide ${slide.accentColor}`}
                    >
                      {slide.badge}
                    </span>
                  )}
                  <h1 className="mb-3 text-3xl font-black leading-tight md:text-5xl">{slide.title}</h1>
                  <p className="mb-5 max-w-md text-sm leading-relaxed text-white/85 md:text-base">
                    {slide.subtitle}
                  </p>
                  {slide.highlight && (
                    <div className="mb-6 flex items-center gap-3">
                      <span className={`text-2xl font-extrabold ${slide.accentColor}`}>
                        {slide.price}
                      </span>
                      {slide.originalPrice && (
                        <span className="text-lg text-white/55 line-through">{slide.originalPrice}</span>
                      )}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-3">
                    <Button asChild className="rounded-xl bg-white px-6 py-5 font-bold text-gray-900 hover:bg-gray-100">
                      <Link href={slide.buttonLink}>
                        {slide.buttonText}
                      </Link>
                    </Button>
                    {slide.secondaryButtonText && (
                      <Button
                        asChild
                        variant="outline"
                        className="rounded-xl border-white/40 bg-transparent px-6 py-5 font-semibold text-white hover:bg-white/15"
                      >
                        <Link
                          href={slide.secondaryButtonLink || '/contact'}
                          target={slide.secondaryButtonLink?.startsWith('http') ? '_blank' : undefined}
                          rel={
                            slide.secondaryButtonLink?.startsWith('http')
                              ? 'noopener noreferrer'
                              : undefined
                          }
                        >
                          {slide.secondaryButtonText}
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>

                <div className="hidden justify-center md:flex md:w-1/2">
                  <div className="w-full max-w-[360px] overflow-hidden rounded-3xl border border-white/20 bg-white/10 shadow-2xl">
                    <img
                      src={slide.image}
                      alt={slide.title}
                      style={{ objectPosition: slide.imagePosition ?? 'center' }}
                      className={`h-[300px] w-full drop-shadow-[0_28px_24px_rgba(2,6,23,0.6)] ${
                        slide.imageFit === 'cover' ? 'object-cover' : 'object-contain p-6'
                      }`}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      <button
        type="button"
        onClick={goToPrevious}
        className="absolute left-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/30 p-2 text-white transition-colors hover:bg-black/50"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <button
        type="button"
        onClick={goToNext}
        className="absolute right-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/30 p-2 text-white transition-colors hover:bg-black/50"
        aria-label="Next slide"
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2">
        {heroSlides.map((_, index) => (
          <button
            key={index}
            type="button"
            onClick={() => setCurrentSlide(index)}
            aria-label={`Go to slide ${index + 1}`}
            className={`rounded-full transition-all ${
              index === currentSlide ? 'h-2 w-8 bg-white' : 'h-2 w-2 bg-white/50'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
