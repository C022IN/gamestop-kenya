import RouteContentPage from '@/components/RouteContentPage';
import { xboxPageContent } from '@/data/route-page-content';
import { getMergedHardwareShowcaseCards } from '@/lib/storefront-media';

export const revalidate = 300;

export default async function XboxPage() {
  const showcaseCards = await getMergedHardwareShowcaseCards(
    [
      'xbox-series-x-console',
      'xbox-wireless-controller',
      'razer-blackshark-v2-pro-2023',
      'logitech-g923-racing-wheel',
    ],
    (product) => (product.department === 'console' ? `/consoles#${product.id}` : `/accessories#${product.id}`)
  );

  return <RouteContentPage content={{ ...xboxPageContent, showcaseCards }} />;
}
