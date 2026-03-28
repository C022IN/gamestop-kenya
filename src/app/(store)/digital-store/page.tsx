import RouteContentPage from '@/components/RouteContentPage';
import { digitalStorePageContent } from '@/data/route-page-content';
import { getMergedGiftCardShowcaseCards } from '@/lib/storefront-media';

export const revalidate = 300;

export default async function DigitalStorePage() {
  const showcaseCards = await getMergedGiftCardShowcaseCards([
    'gift-gamestop-1000-digital',
    'gift-gamestop-2500-physical',
    'gift-psn-1500',
    'gift-psn-3000',
  ]);

  return <RouteContentPage content={{ ...digitalStorePageContent, showcaseCards }} />;
}
