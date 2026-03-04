export interface PaymentResult {
  status: 'success' | 'failed';
  resultCode: string;
  resultDesc: string;
  mpesaReceiptNumber?: string;
  transactionDate?: string;
  phoneNumber?: string;
  amount?: number;
}

/**
 * In-memory payment status store.
 *
 * NOTE: This works within a single server process. In production, replace
 * with a database (e.g. Redis, Postgres, PlanetScale) so multiple
 * serverless instances share state.
 */
export const paymentResults = new Map<string, PaymentResult>();
