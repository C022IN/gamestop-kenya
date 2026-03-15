import Link from 'next/link';
import BrandLogo from '@/components/BrandLogo';
import {
  Facebook,
  Instagram,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  RotateCcw,
  Shield,
  Truck,
  Youtube,
} from 'lucide-react';

const trustItems = [
  { icon: Truck, title: 'Free Delivery', sub: 'Above KSh 5,000' },
  { icon: Shield, title: 'Secure Payments', sub: 'M-Pesa and cards' },
  { icon: RotateCcw, title: '7-Day Returns', sub: 'On eligible items' },
] as const;

const socialLinks = [
  { Icon: Facebook, href: 'https://facebook.com/gamestopkenya', label: 'Facebook', color: 'hover:text-blue-500' },
  { Icon: Instagram, href: 'https://instagram.com/gamestopkenya', label: 'Instagram', color: 'hover:text-pink-500' },
  { Icon: Youtube, href: 'https://youtube.com/@gamestopkenya', label: 'YouTube', color: 'hover:text-red-500' },
  { Icon: MessageCircle, href: 'https://wa.me/254717402034', label: 'WhatsApp', color: 'hover:text-green-400' },
] as const;

const quickLinks = [
  { label: 'About', href: '/about' },
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
