export const CHECKOUT_COUNTRIES = [
  { code: 'KE', label: 'Kenya' },
  { code: 'US', label: 'United States' },
  { code: 'GB', label: 'United Kingdom' },
  { code: 'IE', label: 'Ireland' },
  { code: 'DE', label: 'Germany' },
  { code: 'FR', label: 'France' },
  { code: 'IT', label: 'Italy' },
  { code: 'ES', label: 'Spain' },
  { code: 'NL', label: 'Netherlands' },
  { code: 'BE', label: 'Belgium' },
  { code: 'PT', label: 'Portugal' },
  { code: 'AT', label: 'Austria' },
  { code: 'CH', label: 'Switzerland' },
  { code: 'SE', label: 'Sweden' },
  { code: 'NO', label: 'Norway' },
  { code: 'DK', label: 'Denmark' },
  { code: 'FI', label: 'Finland' },
  { code: 'PL', label: 'Poland' },
  { code: 'CZ', label: 'Czech Republic' },
  { code: 'SK', label: 'Slovakia' },
  { code: 'HU', label: 'Hungary' },
  { code: 'RO', label: 'Romania' },
  { code: 'BG', label: 'Bulgaria' },
  { code: 'HR', label: 'Croatia' },
  { code: 'SI', label: 'Slovenia' },
  { code: 'EE', label: 'Estonia' },
  { code: 'LV', label: 'Latvia' },
  { code: 'LT', label: 'Lithuania' },
  { code: 'LU', label: 'Luxembourg' },
  { code: 'MT', label: 'Malta' },
  { code: 'CY', label: 'Cyprus' },
  { code: 'GR', label: 'Greece' },
  { code: 'CA', label: 'Canada' },
  { code: 'AU', label: 'Australia' },
  { code: 'NZ', label: 'New Zealand' },
  { code: 'AE', label: 'United Arab Emirates' },
  { code: 'ZA', label: 'South Africa' },
] as const;

export type CheckoutCountryCode = (typeof CHECKOUT_COUNTRIES)[number]['code'];

const COUNTRY_LABELS = new Map<string, string>(
  CHECKOUT_COUNTRIES.map((country) => [country.code, country.label])
);

const STATE_REQUIRED_COUNTRIES = new Set<CheckoutCountryCode>(['US', 'CA', 'AU']);

export function getCheckoutCountryLabel(countryCode?: string | null) {
  if (!countryCode) return 'Unknown country';
  return COUNTRY_LABELS.get(countryCode) ?? countryCode;
}

export function isStateRequiredForCheckout(countryCode?: string | null) {
  if (!countryCode) return false;
  return STATE_REQUIRED_COUNTRIES.has(countryCode as CheckoutCountryCode);
}
