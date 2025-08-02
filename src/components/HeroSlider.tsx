'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Slide {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  buttonText: string;
  buttonLink: string;
  backgroundColor: string;
}

const heroSlides: Slide[] = [
  {
    id: '1',
    title: 'PlayStation 5 Now Available!',
    subtitle: 'Experience next-gen gaming with lightning-fast loading and stunning graphics',
    image: 'https://via.placeholder.com/800x600/2563eb/ffffff?text=PlayStation+5+Console',
    buttonText: 'Shop PS5',
    buttonLink: '/playstation',
    backgroundColor: 'bg-gradient-to-r from-blue-900 to-blue-700'
  },
  {
    id: '2',
    title: 'Nintendo Switch OLED',
    subtitle: 'Enhanced experience with vibrant 7-inch OLED screen',
    image: 'https://via.placeholder.com/800x600/dc2626/ffffff?text=Nintendo+Switch+OLED',
    buttonText: 'Shop Nintendo',
    buttonLink: '/nintendo',
    backgroundColor: 'bg-gradient-to-r from-red-600 to-red-500'
  },
  {
    id: '3',
    title: 'Xbox Series X|S',
    subtitle: 'Most powerful Xbox ever built with 4K gaming capabilities',
    image: 'https://via.placeholder.com/800x600/16a34a/ffffff?text=Xbox+Series+X',
    buttonText: 'Shop Xbox',
    buttonLink: '/xbox',
    backgroundColor: 'bg-gradient-to-r from-green-700 to-green-600'
  }
];

export default function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const goToPrevious = () => {
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  };

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  };

  return (
    <div className="relative h-[400px] md:h-[500px] overflow-hidden rounded-lg">
      {/* Slides */}
      <div className="relative h-full">
        {heroSlides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div className={`${slide.backgroundColor} h-full flex items-center relative overflow-hidden`}>
              {/* Background Image */}
              <div className="absolute inset-0">
                <img
                  src={slide.image}
                  alt={slide.title}
                  className="w-full h-full object-cover opacity-30"
                />
                <div className="absolute inset-0 bg-black/20"></div>
              </div>

              {/* Content */}
              <div className="container mx-auto px-4 relative z-10">
                <div className="max-w-xl text-white">
                  <h1 className="text-4xl md:text-6xl font-bold mb-4">
                    {slide.title}
                  </h1>
                  <p className="text-lg md:text-xl mb-6 opacity-90">
                    {slide.subtitle}
                  </p>
                  <Button
                    className="bg-white text-black hover:bg-gray-100 px-8 py-3 text-lg font-semibold"
                  >
                    {slide.buttonText}
                  </Button>
                </div>
              </div>

              {/* Featured Product Image */}
              <div className="hidden md:block absolute right-8 top-1/2 transform -translate-y-1/2">
                <img
                  src={slide.image}
                  alt={slide.title}
                  className="w-80 h-80 object-contain drop-shadow-2xl"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white"
        onClick={goToPrevious}
      >
        <ChevronLeft className="h-6 w-6" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white"
        onClick={goToNext}
      >
        <ChevronRight className="h-6 w-6" />
      </Button>

      {/* Dots Indicator */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {heroSlides.map((_, index) => (
          <button
            key={index}
            className={`w-3 h-3 rounded-full transition-colors ${
              index === currentSlide ? 'bg-white' : 'bg-white/50'
            }`}
            onClick={() => goToSlide(index)}
          />
        ))}
      </div>
    </div>
  );
}
