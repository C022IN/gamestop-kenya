import RouteContentPage from '@/domains/storefront/components/RouteContentPage';
import { playstationPageContent } from '@/data/route-page-content';
import { getMergedHardwareShowcaseCards } from '@/lib/storefront-media';

export const revalidate = 300;

export default async function PlayStationPage() {
  const showcaseCards = await getMergedHardwareShowcaseCards(
    [
      'ps5-console-slim',
      'dualsense-wireless-controller',
      'razer-blackshark-v2-pro-2023',
      'logitech-g923-racing-wheel',
    ],
    (product) => (product.department === 'console' ? `/consoles#${product.id}` : `/accessories#${product.id}`)
  );

  return <RouteContentPage content={{ ...playstationPageContent, showcaseCards }} />;
}
