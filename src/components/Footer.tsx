import Link from 'next/link';
import BrandLogo from '@/components/BrandLogo';
import { Mail, MapPin, MessageCircle, Phone, RotateCcw, Shield, Truck } from 'lucide-react';

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/>
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
    </svg>
  );
}

function YoutubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  );
}

const trustItems = [
  { icon: Truck, title: 'Free Delivery', sub: 'Above KSh 5,000' },
  { icon: Shield, title: 'Secure Payments', sub: 'M-Pesa and cards' },
  { icon: RotateCcw, title: '7-Day Returns', sub: 'On eligible items' },
] as const;

const socialLinks = [
  { Icon: FacebookIcon, href: 'https://facebook.com/gamestopkenya', label: 'Facebook', color: 'hover:text-blue-500' },
  { Icon: InstagramIcon, href: 'https://instagram.com/gamestopkenya', label: 'Instagram', color: 'hover:text-pink-500' },
  { Icon: YoutubeIcon, href: 'https://youtube.com/@gamestopkenya', label: 'YouTube', color: 'hover:text-red-500' },
  { Icon: MessageCircle, href: 'https://wa.me/254115278516', label: 'WhatsApp', color: 'hover:text-green-400' },
] as const;

const quickLinks = [
  { label: 'About', href: '/about' },
  { label: 'Downloads', href: '/iptv/downloads' },
  { label: 'Track Order', href: '/orders' },
  { label: 'Returns', href: '/return-policy' },
  { label: 'Warranty', href: '/warranty' },
  { label: 'Blog', href: '/blog' },
  { label: 'Contact', href: '/contact' },
] as const;

const shopLinks = [
  { label: 'PlayStation 5', href: '/playstation' },
  { label: 'Xbox', href: '/xbox' },
  { label: 'Nintendo Switch', href: '/nintendo-switch' },
  { label: 'PC Gaming', href: '/pc-gaming' },
  { label: 'Accessories', href: '/accessories' },
  { label: 'Gift Cards', href: '/gift-cards' },
] as const;

export default function Footer() {
  return (
    <footer className="bg-gray-950 text-white">
      <div className="border-b border-gray-800">
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 gap-5 text-center sm:grid-cols-3">
            {trustItems.map(({ icon: Icon, title, sub }) => (
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

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="mb-4">
              <BrandLogo />
            </div>
            <p className="mb-5 max-w-xs text-sm leading-6 text-gray-400">
              Consoles, games, accessories, and digital services with local support.
            </p>
            <div className="flex space-x-3">
              {socialLinks.map(({ Icon, href, label, color }) => (
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

          <div>
            <h4 className="mb-5 text-sm font-bold uppercase tracking-wider text-gray-200">Quick Links</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              {quickLinks.map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} className="transition-colors hover:text-white">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-5 text-sm font-bold uppercase tracking-wider text-gray-200">Shop</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              {shopLinks.map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} className="transition-colors hover:text-white">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-5 text-sm font-bold uppercase tracking-wider text-gray-200">Contact</h4>
            <ul className="space-y-4 text-sm text-gray-400">
              <li className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                <div>
                  <a href="tel:0115278516" className="font-medium text-white transition-colors hover:text-red-400">
                    0115278516
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
                  <div className="text-xs">Support email</div>
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
                    ABC Place, Westlands
                  </a>
                  <div className="text-xs">2nd Floor, Nairobi</div>
                </div>
              </li>
            </ul>

            <div className="mt-6">
              <div className="mb-3 text-xs uppercase tracking-wider text-gray-500">Payments</div>
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

      <div className="border-t border-gray-800">
        <div className="container mx-auto px-4 py-5">
          <div className="flex flex-col items-center justify-between gap-3 text-sm text-gray-500 md:flex-row">
            <p>&copy; {new Date().getFullYear()} GameStop Kenya. All rights reserved.</p>
            <span>Proudly Kenyan</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
