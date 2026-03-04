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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { icon: Truck, title: 'Free Delivery', sub: 'Orders above KSh 5,000' },
              { icon: Shield, title: 'Secure Payments', sub: 'M-Pesa & Cards accepted' },
              { icon: RotateCcw, title: '7-Day Returns', sub: 'Hassle-free return policy' },
              { icon: Headphones, title: '24/7 Support', sub: 'Always here to help' },
            ].map(({ icon: Icon, title, sub }) => (
              <div key={title} className="flex flex-col items-center gap-2">
                <Icon className="h-6 w-6 text-red-500" />
                <div>
                  <div className="font-semibold text-sm">{title}</div>
                  <div className="text-xs text-gray-400">{sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand column */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="text-2xl font-bold">
                <span className="text-white">Game</span>
                <span className="text-red-500">Stop</span>
              </div>
              <span className="text-xs text-white bg-green-600 px-2 py-1 rounded font-semibold">KENYA</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              Kenya's #1 gaming destination since 2019. We bring you the latest consoles, games, accessories,
              and digital content — delivered fast, with local support you can trust.
            </p>
            {/* Social links */}
            <div className="flex space-x-3">
              {[
                { Icon: Facebook, href: '#', label: 'Facebook', color: 'hover:text-blue-500' },
                { Icon: Twitter, href: '#', label: 'Twitter', color: 'hover:text-sky-400' },
                { Icon: Instagram, href: '#', label: 'Instagram', color: 'hover:text-pink-500' },
                { Icon: Youtube, href: '#', label: 'YouTube', color: 'hover:text-red-500' },
                { Icon: MessageCircle, href: 'https://wa.me/254700123456', label: 'WhatsApp', color: 'hover:text-green-400' },
              ].map(({ Icon, href, label, color }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  target={href.startsWith('http') ? '_blank' : undefined}
                  rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  className={`text-gray-400 ${color} transition-colors`}
                >
                  <Icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="font-bold text-sm uppercase tracking-wider mb-5 text-gray-200">Quick Links</h4>
            <ul className="space-y-3 text-gray-400 text-sm">
              {[
                { label: 'About Us', href: '#' },
                { label: 'Track My Order', href: '/orders' },
                { label: 'Return Policy', href: '#' },
                { label: 'Warranty Info', href: '#' },
                { label: 'Careers', href: '#' },
                { label: 'Blog & News', href: '/blog' },
                { label: 'Contact Us', href: '#' },
                { label: 'Privacy Policy', href: '#' },
                { label: 'Terms of Service', href: '#' },
              ].map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} className="hover:text-white transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Shop by */}
          <div>
            <h4 className="font-bold text-sm uppercase tracking-wider mb-5 text-gray-200">Shop By</h4>
            <ul className="space-y-3 text-gray-400 text-sm">
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
                  <Link href={href} className="hover:text-white transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold text-sm uppercase tracking-wider mb-5 text-gray-200">Contact Us</h4>
            <ul className="space-y-4 text-gray-400 text-sm">
              <li className="flex items-start gap-3">
                <Phone className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                <div>
                  <div className="text-white font-medium">+254 700 123 456</div>
                  <div className="text-xs">Call or WhatsApp</div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                <div>
                  <div className="text-white font-medium">support@gamestop.co.ke</div>
                  <div className="text-xs">We respond within 2 hours</div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                <div>
                  <div className="text-white font-medium">Westlands, Nairobi</div>
                  <div className="text-xs">ABC Place, 2nd Floor</div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Clock className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                <div>
                  <div className="text-white font-medium">Mon – Sat: 9 AM – 8 PM</div>
                  <div className="text-xs">Sun: 11 AM – 6 PM</div>
                </div>
              </li>
            </ul>

            {/* Payment methods */}
            <div className="mt-6">
              <div className="text-xs text-gray-500 mb-3 uppercase tracking-wider">We Accept</div>
              <div className="flex flex-wrap gap-2">
                {['M-Pesa', 'Visa', 'Mastercard', 'Airtel'].map((method) => (
                  <span
                    key={method}
                    className="bg-gray-800 border border-gray-700 text-gray-300 text-xs px-3 py-1.5 rounded font-medium"
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
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-gray-500 text-sm">
            <p>&copy; {new Date().getFullYear()} GameStop Kenya. All rights reserved. Operated under Kenyan law.</p>
            <div className="flex items-center gap-2">
              <span className="text-lg">🇰🇪</span>
              <span>Proudly Kenyan</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
