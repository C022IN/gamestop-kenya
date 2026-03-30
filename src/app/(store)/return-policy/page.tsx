import RouteContentPage from '@/domains/storefront/components/RouteContentPage';
import { returnPolicyPageContent } from '@/data/route-page-content';

export default function ReturnPolicyPage() {
  return <RouteContentPage content={returnPolicyPageContent} />;
}
