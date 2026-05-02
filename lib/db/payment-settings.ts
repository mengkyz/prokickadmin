import { getSupabaseClient } from "@/lib/supabase";

export interface PaymentSettings {
  id: string;
  bankName: string | null;
  bankCode: string | null;
  accountNumber: string | null;
  accountName: string | null;
  qrCodeBase64: string | null;
  updatedAt: string | null;
}

interface Row {
  id: string;
  bank_name: string | null;
  bank_code: string | null;
  account_number: string | null;
  account_name: string | null;
  qr_code_base64: string | null;
  updated_at: string | null;
}

export async function fetchPaymentSettings(): Promise<PaymentSettings | null> {
  const { data, error } = await getSupabaseClient()
    .from("payment_settings")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const row = data as Row;
  return {
    id: row.id,
    bankName: row.bank_name,
    bankCode: row.bank_code,
    accountNumber: row.account_number,
    accountName: row.account_name,
    qrCodeBase64: row.qr_code_base64,
    updatedAt: row.updated_at,
  };
}

export async function savePaymentSettings(
  settings: {
    bankName: string;
    bankCode: string | null;
    accountNumber: string;
    accountName: string;
    qrCodeBase64: string | null;
  },
  updatedBy: string
): Promise<void> {
  const supabase = getSupabaseClient();

  const { data: existing } = await supabase
    .from("payment_settings")
    .select("id")
    .limit(1)
    .maybeSingle();

  const payload = {
    bank_name:      settings.bankName,
    bank_code:      settings.bankCode,
    account_number: settings.accountNumber,
    account_name:   settings.accountName,
    qr_code_base64: settings.qrCodeBase64,
    updated_at:     new Date().toISOString(),
    updated_by:     updatedBy,
  };

  if (existing?.id) {
    const { error } = await supabase
      .from("payment_settings")
      .update(payload)
      .eq("id", existing.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase
      .from("payment_settings")
      .insert(payload);
    if (error) throw new Error(error.message);
  }
}
