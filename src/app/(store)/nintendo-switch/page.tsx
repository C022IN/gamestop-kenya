import RouteContentPage from '@/components/RouteContentPage';
import { nintendoSwitchPageContent } from '@/data/route-page-content';
import { getMergedHardwareShowcaseCards } from '@/lib/storefront-media';

export const revalidate = 300;

export default async function NintendoSwitchPage() {
  const showcaseCards = await getMergedHardwareShowcaseCards(
    [
      'nintendo-switch-oled-console',
      'switch-pro-controller',
      'razer-blackshark-v2-pro-2023',
      'logitech-g923-racing-wheel',
    ],
    (product) => (product.department === 'console' ? `/consoles#${product.id}` : `/accessories#${product.id}`)
  );

  return <RouteContentPage content={{ ...nintendoSwitchPageContent, showcaseCards }} />;
}
