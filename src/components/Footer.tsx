import Link from 'next/link';
import {
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  MessageCircle,
  Mail,
  Phone,
  MapPin,
  Clock,
  Shield,
  Truck,
  RotateCcw,
  Headphones,
} from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-950 text-white">
      {/* Trust bar */}
      <div className="border-b border-gray-800">
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-2 gap-6 text-center md:grid-cols-4">
            {[
              { icon: Truck, title: 'Free Delivery', sub: 'Orders above KSh 5,000' },
              { icon: Shield, title: 'Secure Payments', sub: 'M-Pesa & Cards accepted' },
              { icon: RotateCcw, title: '7-Day Returns', sub: 'Hassle-free return policy' },
              { icon: Headphones, title: '24/7 Support', sub: 'Always here to help' },
            ].map(({ icon: Icon, title, sub }) => (
              <div key={title} className="flex flex-col items-center gap-2">
                <Icon className="h-6 w-6 text-red-500" />
                <div>
                  <div className="text-sm font-semibold">{title}</div>
                  <div className="text-xs text-gray-400">{sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand column */}
          <div>
            <div className="mb-4 flex items-center space-x-2">
              <div className="text-2xl font-bold">
                <span className="text-white">Game</span>
                <span className="text-red-500">Stop</span>
              </div>
              <span className="rounded bg-green-600 px-2 py-1 text-xs font-semibold text-white">KENYA</span>
            </div>
            <p className="mb-6 text-sm leading-relaxed text-gray-400">
              Kenya&apos;s #1 gaming destination since 2019. We bring you the latest consoles, games, accessories,
              and digital content - delivered fast, with local support you can trust.
            </p>
            <div className="flex space-x-3">
              {[
                { Icon: Facebook, href: 'https://facebook.com/gamestopkenya', label: 'Facebook', color: 'hover:text-blue-500' },
                { Icon: Twitter, href: 'https://x.com/gamestopkenya', label: 'Twitter', color: 'hover:text-sky-400' },
                { Icon: Instagram, href: 'https://instagram.com/gamestopkenya', label: 'Instagram', color: 'hover:text-pink-500' },
                { Icon: Youtube, href: 'https://youtube.com/@gamestopkenya', label: 'YouTube', color: 'hover:text-red-500' },
                { Icon: MessageCircle, href: 'https://wa.me/254717402034', label: 'WhatsApp', color: 'hover:text-green-400' },
              ].map(({ Icon, href, label, color }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`text-gray-400 transition-colors ${color}`}
                >
                  <Icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="mb-5 text-sm font-bold uppercase tracking-wider text-gray-200">Quick Links</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              {[
                { label: 'About Us', href: '/about' },
                { label: 'Track My Order', href: '/orders' },
                { label: 'Return Policy', href: '/return-policy' },
                { label: 'Warranty Info', href: '/warranty' },
                { label: 'Careers', href: '/careers' },
                { label: 'Blog & News', href: '/blog' },
                { label: 'Contact Us', href: '/contact' },
                { label: 'Privacy Policy', href: '/privacy-policy' },
                { label: 'Terms of Service', href: '/terms-of-service' },
              ].map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} className="transition-colors hover:text-white">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Shop by */}
          <div>
            <h4 className="mb-5 text-sm font-bold uppercase tracking-wider text-gray-200">Shop By</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              {[
                { label: 'PlayStation 5', href: '/playstation' },
                { label: 'Xbox Series X|S', href: '/xbox' },
                { label: 'Nintendo Switch', href: '/nintendo-switch' },
                { label: 'PC Gaming', href: '/pc-gaming' },
                { label: 'Gaming Accessories', href: '/accessories' },
                { label: 'Digital Codes', href: '/digital-store' },
                { label: 'Trading Cards', href: '/trading-cards' },
                { label: 'Pre-Owned Games', href: '/pre-owned' },
                { label: 'Premium IPTV', href: '/iptv' },
              ].map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} className="transition-colors hover:text-white">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="mb-5 text-sm font-bold uppercase tracking-wider text-gray-200">Contact Us</h4>
            <ul className="space-y-4 text-sm text-gray-400">
              <li className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                <div>
                  <a href="tel:0717402034" className="font-medium text-white transition-colors hover:text-red-400">
                    0717402034
                  </a>
                  <div className="text-xs">Call or WhatsApp</div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                <div>
                  <a href="mailto:support@gamestop.co.ke" className="font-medium text-white transition-colors hover:text-red-400">
                    support@gamestop.co.ke
                  </a>
                  <div className="text-xs">We respond within 2 hours</div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                <div>
                  <a
                    href="https://maps.google.com/?q=ABC+Place,+Westlands,+Nairobi"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-white transition-colors hover:text-red-400"
                  >
                    Westlands, Nairobi
                  </a>
                  <div className="text-xs">ABC Place, 2nd Floor</div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                <div>
                  <div className="font-medium text-white">Mon - Sat: 9 AM - 8 PM</div>
                  <div className="text-xs">Sun: 11 AM - 6 PM</div>
                </div>
              </li>
            </ul>

            <div className="mt-6">
              <div className="mb-3 text-xs uppercase tracking-wider text-gray-500">We Accept</div>
              <div className="flex flex-wrap gap-2">
                {['M-Pesa', 'Visa', 'Mastercard', 'Airtel'].map((method) => (
                  <span
                    key={method}
                    className="rounded border border-gray-700 bg-gray-800 px-3 py-1.5 text-xs font-medium text-gray-300"
                  >
                    {method}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gray-800">
        <div className="container mx-auto px-4 py-5">
          <div className="flex flex-col items-center justify-between gap-3 text-sm text-gray-500 md:flex-row">
            <p>&copy; {new Date().getFullYear()} GameStop Kenya. All rights reserved. Operated under Kenyan law.</p>
            <div className="flex items-center gap-2">
              <span className="rounded bg-gray-800 px-2 py-0.5 text-[10px] font-semibold text-gray-300">KE</span>
              <span>Proudly Kenyan</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
