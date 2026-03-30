import RouteContentPage from '@/domains/storefront/components/RouteContentPage';
import { privacyPolicyPageContent } from '@/data/route-page-content';

export default function PrivacyPolicyPage() {
  return <RouteContentPage content={privacyPolicyPageContent} />;
}
