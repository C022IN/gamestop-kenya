import RouteContentPage from '@/domains/storefront/components/RouteContentPage';
import { pcGamingPageContent } from '@/data/route-page-content';
import { getMergedHardwareShowcaseCards } from '@/lib/storefront-media';

export const revalidate = 300;

export default async function PcGamingPage() {
  const showcaseCards = await getMergedHardwareShowcaseCards(
    [
      'asus-dual-geforce-rtx-4060-oc-8gb',
      'asus-proart-geforce-rtx-5070-ti-16gb',
      'asus-prime-radeon-rx-9070-xt-16gb',
      'razer-blackshark-v2-pro-2023',
    ],
    (product) => `/accessories#${product.id}`
  );

  return <RouteContentPage content={{ ...pcGamingPageContent, showcaseCards }} />;
}
