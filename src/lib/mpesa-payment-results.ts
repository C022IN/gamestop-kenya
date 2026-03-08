import { getSupabaseAdminClient } from '@/lib/supabase/server';

export interface PaymentResult {
  status: 'success' | 'failed';
  resultCode: string;
  resultDesc: string;
  mpesaReceiptNumber?: string;
  transactionDate?: string;
  phoneNumber?: string;
  amount?: number;
}

interface PaymentResultRow {
  checkout_request_id: string;
  result_code: string | null;
  result_desc: string | null;
  status: string;
  mpesa_receipt_number: string | null;
  transaction_date: string | null;
  phone_number: string | null;
  amount_kes: number | null;
}

const paymentResults = new Map<string, PaymentResult>();

function fromRow(row: PaymentResultRow): PaymentResult {
  return {
    status: row.status === 'success' ? 'success' : 'failed',
    resultCode: row.result_code ?? '',
    resultDesc: row.result_desc ?? '',
    mpesaReceiptNumber: row.mpesa_receipt_number ?? undefined,
    transactionDate: row.transaction_date ?? undefined,
    phoneNumber: row.phone_number ?? undefined,
    amount: typeof row.amount_kes === 'number' ? row.amount_kes : undefined,
  };
}

export async function getPaymentResult(checkoutRequestId: string): Promise<PaymentResult | null> {
  const cached = paymentResults.get(checkoutRequestId);
  if (cached) {
    return cached;
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from('mpesa_transactions')
    .select(
      'checkout_request_id, result_code, result_desc, status, mpesa_receipt_number, transaction_date, phone_number, amount_kes'
    )
    .eq('checkout_request_id', checkoutRequestId)
    .in('status', ['success', 'failed'])
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const parsed = fromRow(data as PaymentResultRow);
  paymentResults.set(checkoutRequestId, parsed);
  return parsed;
}

export async function setPaymentResult(
  checkoutRequestId: string,
  result: PaymentResult,
  extras?: {
    merchantRequestId?: string | null;
    orderReference?: string | null;
    payload?: unknown;
  }
) {
  paymentResults.set(checkoutRequestId, result);

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return;
  }

  await supabase.from('mpesa_transactions').upsert(
    {
      checkout_request_id: checkoutRequestId,
      merchant_request_id: extras?.merchantRequestId ?? null,
      order_reference: extras?.orderReference ?? null,
      phone_number: result.phoneNumber ?? null,
      amount_kes: result.amount ?? null,
      status: result.status,
      result_code: result.resultCode,
      result_desc: result.resultDesc,
      mpesa_receipt_number: result.mpesaReceiptNumber ?? null,
      transaction_date: result.transactionDate ?? null,
      payload: extras?.payload ?? {},
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'checkout_request_id' }
  );
}
