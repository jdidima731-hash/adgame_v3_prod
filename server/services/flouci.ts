// ============================================================
// Flouci Payment Gateway — AdGame Pro
// https://developer.flouci.com
//
// Flouci is a Tunisian payment gateway supporting TND payments.
// Flow:
//   1. generate()  → creates a payment link, returns pay_url + payment_id
//   2. User pays on Flouci checkout page
//   3. Flouci calls POST /api/payments/flouci/webhook (success/fail)
//   4. verify()    → called in webhook to confirm payment authenticity
// ============================================================

const FLOUCI_API = "https://developers.flouci.com/api";

export interface FlouciPaymentResult {
  success: boolean;
  paymentId: string;   // flouci payment_id — save to DB
  payUrl: string;      // redirect URL for the user
}

export interface FlouciVerifyResult {
  success: boolean;
  receiptId?: string;
  amount?: number;     // in millimes (÷ 1000 = DT)
  status?: "paid" | "failed" | "pending";
  rawResponse?: unknown;
}

/**
 * Generate a Flouci payment.
 * amount is in DT (e.g. 350 for 350 DT).
 * Flouci expects millimes (DT × 1000).
 */
export async function generateFlouciPayment(params: {
  amount: number;         // DT
  orderId: string;        // our internal transaction ID as string
  description: string;
  successUrl: string;
  failUrl: string;
}): Promise<FlouciPaymentResult> {
  const appToken = process.env.FLOUCI_APP_TOKEN;
  const appSecret = process.env.FLOUCI_APP_SECRET;

  if (!appToken || !appSecret) {
    throw new Error("FLOUCI_APP_TOKEN and FLOUCI_APP_SECRET must be set in environment variables");
  }

  const body = {
    app_token: appToken,
    app_secret: appSecret,
    amount: Math.round(params.amount * 1000), // DT → millimes
    accept_card: true,
    session_timeout_secs: 1200,               // 20 min to complete payment
    success_link: params.successUrl,
    fail_link: params.failUrl,
    developer_tracking_id: params.orderId,
  };

  const res = await fetch(`${FLOUCI_API}/payment/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Flouci generate failed (${res.status}): ${text}`);
  }

  const data = await res.json() as {
    result: { success: boolean; link: string; payment_id: string };
  };

  if (!data.result?.success) {
    throw new Error("Flouci did not return success=true on generate");
  }

  return {
    success: true,
    paymentId: data.result.payment_id,
    payUrl: data.result.link,
  };
}

/**
 * Verify a Flouci payment after webhook notification or redirect.
 * Call this server-side — never trust the client.
 */
export async function verifyFlouciPayment(
  paymentId: string
): Promise<FlouciVerifyResult> {
  const appToken = process.env.FLOUCI_APP_TOKEN;
  const appSecret = process.env.FLOUCI_APP_SECRET;

  if (!appToken || !appSecret) {
    throw new Error("FLOUCI credentials not configured");
  }

  const res = await fetch(`${FLOUCI_API}/payment/verify/${paymentId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      apppublic: appToken,
      appsecret: appSecret,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Flouci verify failed (${res.status}): ${text}`);
  }

  const data = await res.json() as {
    result: {
      status: string;
      receipt_id?: string;
      amount?: number;     // millimes
      developer_tracking_id?: string;
    };
  };

  const raw = data.result;
  const paid = raw?.status === "SUCCESS";

  return {
    success: paid,
    receiptId: raw?.receipt_id,
    amount: raw?.amount ? raw.amount / 1000 : undefined,
    status: paid ? "paid" : raw?.status === "PENDING" ? "pending" : "failed",
    rawResponse: raw,
  };
}
