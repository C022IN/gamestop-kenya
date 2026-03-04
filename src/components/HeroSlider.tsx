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
}

const heroSlides: Slide[] = [
  {
    id: '1',
    badge: '🔥 BEST SELLER',
    title: 'PlayStation 5',
    subtitle: 'Next-gen gaming is here. Experience lightning-fast loading, breathtaking 4K visuals, and haptic feedback like never before.',
    highlight: 'From KSh 65,000',
    price: 'KSh 65,000',
    buttonText: 'Shop PS5',
    buttonLink: '/playstation',
    secondaryButtonText: 'View Accessories',
    secondaryButtonLink: '/accessories',
    gradient: 'from-blue-950 via-blue-900 to-blue-800',
    accentColor: 'text-blue-300',
    image: '/images/heroes/ps5.svg',
  },
  {
    id: '2',
    badge: '📺 NEW SERVICE',
    title: 'Premium IPTV',
    subtitle: 'Stream 20,000+ live TV channels, sports, movies & series in Full HD and 4K. No cables. No contracts.',
    highlight: 'From KSh 1,500/month',
    price: 'KSh 1,500/mo',
    buttonText: 'Explore IPTV',
    buttonLink: '/iptv',
    secondaryButtonText: 'Free Trial',
    secondaryButtonLink: 'https://www.ppvarena.com',
    gradient: 'from-purple-950 via-purple-900 to-indigo-900',
    accentColor: 'text-purple-300',
    image: '/images/heroes/iptv.svg',
  },
  {
    id: '3',
    badge: '⚡ FLASH DEAL — 40% OFF',
    title: 'Xbox Series X',
    subtitle: 'The most powerful Xbox ever built. Play thousands of games across generations with 4K gaming and 120 FPS.',
    highlight: 'KSh 56,000',
    price: 'KSh 56,000',
    originalPrice: 'KSh 72,000',
    buttonText: 'Shop Xbox',
    buttonLink: '/xbox',
    secondaryButtonText: 'Xbox Game Pass',
    secondaryButtonLink: '/digital-store',
    gradient: 'from-green-950 via-green-900 to-emerald-900',
    accentColor: 'text-green-300',
    image: '/images/heroes/xbox-series-x.svg',
  },
  {
    id: '4',
    badge: '🎮 FUN FOR EVERYONE',
    title: 'Nintendo Switch OLED',
    subtitle: 'Play at home or on the go with a stunning 7-inch OLED display. The perfect console for the whole family.',
    highlight: 'KSh 45,000',
    price: 'KSh 45,000',
    buttonText: 'Shop Nintendo',
    buttonLink: '/nintendo-switch',
    secondaryButtonText: 'Shop Games',
    secondaryButtonLink: '/nintendo-switch',
    gradient: 'from-red-950 via-red-900 to-rose-900',
    accentColor: 'text-red-300',
    image: '/images/heroes/switch-oled.svg',
  },
  {
    id: '5',
    badge: '💻 BUILD YOUR SETUP',
    title: 'PC Gaming Gear',
    subtitle: 'Mechanical keyboards, high-refresh monitors, gaming mice and more. Build the ultimate gaming rig.',
    highlight: 'Starting KSh 3,500',
    buttonText: 'Shop PC Gaming',
    buttonLink: '/pc-gaming',
    secondaryButtonText: 'Steam Codes',
    secondaryButtonLink: '/digital-store',
    gradient: 'from-gray-950 via-gray-900 to-zinc-800',
    accentColor: 'text-gray-300',
    image: '/images/heroes/pc-gaming.svg',
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

  const goToPrevious = () => setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  const goToNext = () => setCurrentSlide((prev) => (prev + 1) % heroSlides.length);

  return (
    <div
      className="relative h-[420px] md:h-[520px] overflow-hidden rounded-2xl shadow-xl"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {heroSlides.map((slide, index) => {
        const isActive = index === currentSlide;
        return (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-700 ${isActive ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
          >
            <div className={`bg-gradient-to-br ${slide.gradient} h-full flex items-center relative overflow-hidden`}>
              {/* Decorative background circles */}
              <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/3" />
              <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/4" />

              <div className="container mx-auto px-6 md:px-10 relative z-10 flex flex-col md:flex-row items-center gap-8">
                {/* Text content */}
                <div className="md:w-1/2 text-white">
                  {slide.badge && (
                    <span className={`inline-block text-xs font-bold px-3 py-1.5 rounded-full mb-4 bg-white/15 ${slide.accentColor}`}>
                      {slide.badge}
                    </span>
                  )}
                  <h1 className="text-3xl md:text-5xl font-black mb-3 leading-tight">
                    {slide.title}
                  </h1>
                  <p className="text-sm md:text-base text-white/80 mb-5 max-w-md leading-relaxed">
                    {slide.subtitle}
                  </p>
                  {slide.highlight && (
                    <div className="flex items-center gap-3 mb-6">
                      <span className={`text-2xl font-extrabold ${slide.accentColor}`}>
                        {slide.price}
                      </span>
                      {slide.originalPrice && (
                        <span className="text-white/50 line-through text-lg">{slide.originalPrice}</span>
                      )}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-3">
                    <Link href={slide.buttonLink}>
                      <Button className="bg-white text-gray-900 hover:bg-gray-100 font-bold px-6 py-5 rounded-xl">
                        {slide.buttonText}
                      </Button>
                    </Link>
                    {slide.secondaryButtonText && (
                      <Link
                        href={slide.secondaryButtonLink || '#'}
                        target={slide.secondaryButtonLink?.startsWith('http') ? '_blank' : undefined}
                        rel={slide.secondaryButtonLink?.startsWith('http') ? 'noopener noreferrer' : undefined}
                      >
                        <Button
                          variant="outline"
                          className="border-white/40 text-white hover:bg-white/15 font-semibold px-6 py-5 rounded-xl"
                        >
                          {slide.secondaryButtonText}
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>

                {/* Product image */}
                <div className="hidden md:flex md:w-1/2 justify-center">
                  <img
                    src={slide.image}
                    alt={slide.title}
                    className="w-72 h-72 object-contain drop-shadow-2xl"
                  />
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Navigation arrows */}
      <button
        type="button"
        onClick={goToPrevious}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-black/30 hover:bg-black/50 text-white rounded-full p-2 transition-colors"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <button
        type="button"
        onClick={goToNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-black/30 hover:bg-black/50 text-white rounded-full p-2 transition-colors"
        aria-label="Next slide"
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      {/* Slide indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {heroSlides.map((_, index) => (
          <button
            key={index}
            type="button"
            onClick={() => setCurrentSlide(index)}
            aria-label={`Go to slide ${index + 1}`}
            className={`rounded-full transition-all ${index === currentSlide ? 'w-8 h-2 bg-white' : 'w-2 h-2 bg-white/50'}`}
          />
        ))}
      </div>
    </div>
  );
}
