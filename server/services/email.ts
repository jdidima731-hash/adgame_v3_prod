// ============================================================
// Email Service — AdGame Pro
// Supports: Resend (recommended), SendGrid, Nodemailer (SMTP)
// Configure via .env — see .env.example
// ============================================================

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// ── Resend ─────────────────────────────────────────────────────
async function sendViaResend(params: SendEmailParams): Promise<void> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || "AdGame Pro <noreply@adgame.tn>",
      to: [params.to],
      subject: params.subject,
      html: params.html,
      text: params.text,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend error (${res.status}): ${err}`);
  }
}

// ── SendGrid ───────────────────────────────────────────────────
async function sendViaSendGrid(params: SendEmailParams): Promise<void> {
  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: params.to }] }],
      from: { email: process.env.EMAIL_FROM || "noreply@adgame.tn" },
      subject: params.subject,
      content: [
        { type: "text/html", value: params.html },
        ...(params.text ? [{ type: "text/plain", value: params.text }] : []),
      ],
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`SendGrid error (${res.status}): ${err}`);
  }
}

// ── Nodemailer (SMTP) ─────────────────────────────────────────
async function sendViaNodemailer(params: SendEmailParams): Promise<void> {
  // Lazy import so nodemailer is only required when SMTP is configured
  const nodemailer = await import("nodemailer");
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || "noreply@adgame.tn",
    to: params.to,
    subject: params.subject,
    html: params.html,
    text: params.text,
  });
}

// ── Dev fallback ───────────────────────────────────────────────
function logEmailDev(params: SendEmailParams): void {
  console.log("\n╔══════════════════════════════════════════════╗");
  console.log("║  📧  EMAIL (DEV MODE — not actually sent)    ║");
  console.log("╠══════════════════════════════════════════════╣");
  console.log(`║  To:      ${params.to}`);
  console.log(`║  Subject: ${params.subject}`);
  console.log("╠══════════════════════════════════════════════╣");
  // Print text version of HTML (strip tags)
  const text = params.text || params.html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  console.log(`║  ${text.slice(0, 200)}${text.length > 200 ? "..." : ""}`);
  console.log("╚══════════════════════════════════════════════╝\n");
}

// ── Public API ─────────────────────────────────────────────────
export async function sendEmail(params: SendEmailParams): Promise<void> {
  try {
    if (process.env.RESEND_API_KEY) {
      await sendViaResend(params);
    } else if (process.env.SENDGRID_API_KEY) {
      await sendViaSendGrid(params);
    } else if (process.env.SMTP_HOST) {
      await sendViaNodemailer(params);
    } else {
      logEmailDev(params);
    }
  } catch (err) {
    // Never let email failure crash the main request
    console.error("❌ Email send failed:", err);
  }
}

// ── Email templates ────────────────────────────────────────────

export function passwordResetEmail(resetUrl: string, userName: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="font-family:Arial,sans-serif;background:#f4f4f4;margin:0;padding:20px">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">
    <div style="background:#6d28d9;padding:28px 32px;text-align:center">
      <h1 style="color:#fff;margin:0;font-size:22px">🎮 AdGame Pro</h1>
    </div>
    <div style="padding:32px">
      <h2 style="margin-top:0;color:#1f2937">Réinitialisation de mot de passe</h2>
      <p style="color:#4b5563;line-height:1.6">Bonjour ${userName},</p>
      <p style="color:#4b5563;line-height:1.6">Nous avons reçu une demande de réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>
      <div style="text-align:center;margin:28px 0">
        <a href="${resetUrl}" style="display:inline-block;background:#6d28d9;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:bold;font-size:16px">Réinitialiser mon mot de passe</a>
      </div>
      <p style="color:#9ca3af;font-size:13px;line-height:1.6">Ce lien expire dans <strong>1 heure</strong>. Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email.</p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
      <p style="color:#9ca3af;font-size:12px;margin:0">AdGame Pro · Tunis, Tunisie</p>
    </div>
  </div>
</body>
</html>`;
}

export function paymentSuccessEmail(params: {
  userName: string;
  planName: string;
  amount: number;
  receiptId: string;
  nextBillingDate: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;background:#f4f4f4;margin:0;padding:20px">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">
    <div style="background:#059669;padding:28px 32px;text-align:center">
      <h1 style="color:#fff;margin:0;font-size:22px">✅ Paiement confirmé</h1>
    </div>
    <div style="padding:32px">
      <p style="color:#4b5563;line-height:1.6">Bonjour ${params.userName},</p>
      <p style="color:#4b5563;line-height:1.6">Votre paiement a été validé avec succès. Voici le récapitulatif :</p>
      <div style="background:#f9fafb;border-radius:8px;padding:20px;margin:20px 0">
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="color:#6b7280;padding:6px 0">Plan</td><td style="color:#1f2937;font-weight:bold;text-align:right">${params.planName}</td></tr>
          <tr><td style="color:#6b7280;padding:6px 0">Montant</td><td style="color:#1f2937;font-weight:bold;text-align:right">${params.amount} DT TTC</td></tr>
          <tr><td style="color:#6b7280;padding:6px 0">Reçu Flouci</td><td style="color:#1f2937;font-family:monospace;text-align:right">${params.receiptId}</td></tr>
          <tr><td style="color:#6b7280;padding:6px 0">Prochain renouvellement</td><td style="color:#1f2937;font-weight:bold;text-align:right">${params.nextBillingDate}</td></tr>
        </table>
      </div>
      <p style="color:#4b5563;line-height:1.6">Votre abonnement est maintenant actif. Vous pouvez accéder à toutes les fonctionnalités de votre plan.</p>
      <div style="text-align:center;margin:24px 0">
        <a href="${process.env.CLIENT_URL}/advertiser/dashboard" style="display:inline-block;background:#6d28d9;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:bold">Accéder à mon tableau de bord</a>
      </div>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
      <p style="color:#9ca3af;font-size:12px;margin:0">AdGame Pro · Tunis, Tunisie</p>
    </div>
  </div>
</body>
</html>`;
}

export function paymentFailedEmail(userName: string, planName: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;background:#f4f4f4;margin:0;padding:20px">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">
    <div style="background:#dc2626;padding:28px 32px;text-align:center">
      <h1 style="color:#fff;margin:0;font-size:22px">❌ Échec du paiement</h1>
    </div>
    <div style="padding:32px">
      <p style="color:#4b5563;line-height:1.6">Bonjour ${userName},</p>
      <p style="color:#4b5563;line-height:1.6">Le paiement pour le plan <strong>${planName}</strong> n'a pas pu être traité. Veuillez réessayer ou contacter le support.</p>
      <div style="text-align:center;margin:24px 0">
        <a href="${process.env.CLIENT_URL}/advertiser/subscription" style="display:inline-block;background:#dc2626;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:bold">Réessayer</a>
      </div>
      <p style="color:#9ca3af;font-size:12px;margin-top:24px">AdGame Pro · support@adgame.tn</p>
    </div>
  </div>
</body>
</html>`;
}

export function advertiserValidatedEmail(userName: string, approved: boolean, reason?: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;background:#f4f4f4;margin:0;padding:20px">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">
    <div style="background:${approved ? "#059669" : "#dc2626"};padding:28px 32px;text-align:center">
      <h1 style="color:#fff;margin:0;font-size:22px">${approved ? "✅ Compte validé !" : "❌ Compte non validé"}</h1>
    </div>
    <div style="padding:32px">
      <p style="color:#4b5563;line-height:1.6">Bonjour ${userName},</p>
      ${approved
        ? `<p style="color:#4b5563;line-height:1.6">Votre compte annonceur a été <strong>validé</strong> par notre équipe. Vous pouvez maintenant créer vos premières campagnes !</p>
           <div style="text-align:center;margin:24px 0"><a href="${process.env.CLIENT_URL}/advertiser/dashboard" style="display:inline-block;background:#6d28d9;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:bold">Démarrer maintenant</a></div>`
        : `<p style="color:#4b5563;line-height:1.6">Votre demande a été <strong>refusée</strong>.</p>
           ${reason ? `<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;margin:16px 0"><p style="color:#991b1b;margin:0"><strong>Raison :</strong> ${reason}</p></div>` : ""}
           <p style="color:#4b5563;line-height:1.6">Vous pouvez nous contacter à <a href="mailto:support@adgame.tn">support@adgame.tn</a> pour plus d'informations.</p>`
      }
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
      <p style="color:#9ca3af;font-size:12px;margin:0">AdGame Pro · Tunis, Tunisie</p>
    </div>
  </div>
</body>
</html>`;
}
