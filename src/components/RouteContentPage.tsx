import Link from 'next/link';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import StorefrontPageShell from '@/components/StorefrontPageShell';
import type { StorefrontShowcaseCard } from '@/lib/storefront-types';

interface ActionLink {
  label: string;
  href: string;
}

interface ContentSection {
  title: string;
  description: string;
  points: string[];
}

interface QuickFact {
  label: string;
  value: string;
}

interface FaqItem {
  question: string;
  answer: string;
}

export interface RoutePageContent {
  eyebrow: string;
  title: string;
  intro: string;
  highlights: string[];
  sections: ContentSection[];
  facts?: QuickFact[];
  faqs?: FaqItem[];
  showcaseCards?: StorefrontShowcaseCard[];
  primaryAction: ActionLink;
  secondaryAction?: ActionLink;
  relatedLinks: ActionLink[];
}

interface RouteContentPageProps {
  content: RoutePageContent;
}

export default function RouteContentPage({ content }: RouteContentPageProps) {
  return (
    <StorefrontPageShell>
      <section className="overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(220,38,38,0.2),_transparent_24%),radial-gradient(circle_at_82%_18%,_rgba(59,130,246,0.14),_transparent_22%),linear-gradient(135deg,_#030712,_#111827_48%,_#1f2937_100%)] py-16 text-white">
        <div className="container mx-auto px-4">
          <div className={`grid gap-10 ${content.showcaseCards?.length ? 'lg:grid-cols-[1.02fr_0.98fr] lg:items-center' : ''}`}>
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-red-400">
                {content.eyebrow}
              </p>
              <h1 className="mb-4 max-w-3xl text-4xl font-black md:text-5xl">
                {content.title}
              </h1>
              <p className="max-w-3xl text-base text-gray-300 md:text-lg">
                {content.intro}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild className="bg-red-600 px-6 font-bold hover:bg-red-700">
                  <Link href={content.primaryAction.href}>
                    {content.primaryAction.label}
                  </Link>
                </Button>
                {content.secondaryAction && (
                  <Button
                    asChild
                    variant="outline"
                    className="border-gray-500 bg-transparent px-6 text-white hover:bg-white/10"
                  >
                    <Link href={content.secondaryAction.href}>
                      {content.secondaryAction.label}
                    </Link>
                  </Button>
                )}
              </div>
            </div>

            {content.showcaseCards && content.showcaseCards.length > 0 && (
              <div className="grid gap-4 md:grid-cols-2">
                {content.showcaseCards.slice(0, 4).map((card, index) => (
                  <Link
                    key={card.id}
                    href={card.href}
                    className={`group overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/5 shadow-[0_22px_60px_rgba(0,0,0,0.28)] backdrop-blur ${
                      index === 0 ? 'md:col-span-2' : ''
                    }`}
                  >
                    <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-zinc-900 p-4">
                      <div className={`mx-auto overflow-hidden rounded-[1.35rem] border border-white/10 bg-black/20 shadow-[0_18px_42px_rgba(0,0,0,0.26)] ${
                        card.imageAspect === 'card' ? 'aspect-[16/10] w-full' : 'aspect-[4/5] w-[72%]'
                      }`}>
                        <img
                          src={card.image}
                          alt={card.title}
                          className={`h-full w-full transition-transform duration-500 group-hover:scale-105 ${
                            card.imageFit === 'contain' ? 'object-contain p-4' : 'object-cover'
                          }`}
                        />
                      </div>
                    </div>
                    <div className="p-5">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-red-300">
                        {card.label}
                      </p>
                      <h2 className="mt-2 text-lg font-black text-white">{card.title}</h2>
                      <p className="mt-2 text-sm leading-6 text-gray-300">{card.blurb}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {content.facts && content.facts.length > 0 && (
        <section className="border-b border-gray-200 bg-white py-10">
          <div className="container mx-auto grid grid-cols-2 gap-4 px-4 md:grid-cols-4">
            {content.facts.map((fact) => (
              <div key={fact.label} className="lux-card rounded-lg p-4 text-center">
                <div className="text-2xl font-extrabold text-gray-900">{fact.value}</div>
                <div className="mt-1 text-xs uppercase tracking-wide text-gray-500">
                  {fact.label}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="py-14">
        <div className="container mx-auto px-4">
          <h2 className="mb-6 text-2xl font-bold text-gray-900">Why This Matters</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {content.highlights.map((item) => (
              <div
                key={item}
                className="lux-card flex items-start gap-3 rounded-xl p-4"
              >
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                <p className="text-sm text-gray-700">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-12">
        <div className="container mx-auto px-4">
          <h3 className="mb-6 text-2xl font-bold text-gray-900">What To Expect</h3>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {content.sections.map((section) => (
              <article
                key={section.title}
                className="lux-card rounded-xl p-5"
              >
                <h4 className="mb-2 text-lg font-bold text-gray-900">{section.title}</h4>
                <p className="mb-4 text-sm leading-relaxed text-gray-600">
                  {section.description}
                </p>
                <ul className="space-y-2 text-sm text-gray-700">
                  {section.points.map((point) => (
                    <li key={point} className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      {content.faqs && content.faqs.length > 0 && (
        <section className="border-t border-gray-200 bg-gray-50 py-12">
          <div className="container mx-auto px-4">
            <h3 className="mb-6 text-2xl font-bold text-gray-900">Frequently Asked Questions</h3>
            <div className="space-y-3">
              {content.faqs.map((faq) => (
                <details key={faq.question} className="lux-card rounded-lg p-4">
                  <summary className="cursor-pointer font-semibold text-gray-900">
                    {faq.question}
                  </summary>
                  <p className="mt-2 text-sm text-gray-600">{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="border-t border-gray-200 bg-white py-12">
        <div className="container mx-auto px-4">
          <h3 className="mb-4 text-xl font-bold text-gray-900">Helpful Links</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {content.relatedLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="lux-card group flex items-center justify-between rounded-lg p-4 text-sm text-gray-700 transition-colors hover:border-red-500 hover:text-red-600"
              >
                <span className="font-medium">{item.label}</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            ))}
          </div>
        </div>
      </section>
    </StorefrontPageShell>
  );
}
