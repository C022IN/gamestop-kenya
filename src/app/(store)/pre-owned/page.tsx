import RouteContentPage from '@/components/RouteContentPage';
import { preOwnedPageContent } from '@/data/route-page-content';
import { getMergedGameShowcaseCards } from '@/lib/storefront-media';

export const revalidate = 300;

export default async function PreOwnedPage() {
  const showcaseCards = await getMergedGameShowcaseCards([
    'cyberpunk-2077-pre-owned-ps5',
    'forza-horizon-5-pre-owned-xbox',
    'resident-evil-4-ps5',
    'ea-fc-25-ps5',
  ]);

  return <RouteContentPage content={{ ...preOwnedPageContent, showcaseCards }} />;
}
