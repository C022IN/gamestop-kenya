import RouteContentPage from '@/domains/storefront/components/RouteContentPage';
import { dealsPageContent } from '@/data/route-page-content';

export default function DealsPage() {
  return <RouteContentPage content={dealsPageContent} />;
}
