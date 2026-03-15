// ============================================================
// Payment Router — AdGame Pro (Flouci)
// ============================================================
import { z } from "zod";
import { router, protectedProcedure, advertiserProcedure, adminProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import prisma from "../prisma";
import { generateFlouciPayment, verifyFlouciPayment } from "../services/flouci";
import { sendEmail, paymentSuccessEmail, paymentFailedEmail } from "../services/email";

const PLANS = [
  { id: "starter",    name: "Starter",    price: 350,  includedCities: 3,  features: ["3 villes", "Jeux illimités", "Studio pub"] },
  { id: "pro",        name: "Pro",         price: 600,  includedCities: 6,  features: ["6 villes", "Social Manager", "Analytics avancés"] },
  { id: "enterprise", name: "Enterprise", price: 1200, includedCities: -1, features: ["Villes illimitées", "Support dédié", "API access"] },
];

export { PLANS };

export const paymentRouter = router({

  // ── Get available plans ───────────────────────────────────────
  getPlans: protectedProcedure.query(() => PLANS),

  // ── Get current subscription ──────────────────────────────────
  getMyCurrent: protectedProcedure.query(async ({ ctx }) => {
    const sub = await prisma.subscription.findUnique({
      where: { userId: ctx.user.id },
      include: { transactions: { orderBy: { createdAt: "desc" }, take: 5 } },
    });
    if (!sub) return null;
    const plan = PLANS.find(p => p.id === sub.planId);
    return { ...sub, plan };
  }),

  // ── Initiate payment — returns Flouci checkout URL ────────────
  initiate: advertiserProcedure
    .input(z.object({ planId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const plan = PLANS.find(p => p.id === input.planId);
      if (!plan) throw new TRPCError({ code: "NOT_FOUND", message: "Plan introuvable" });

      const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

      // Create a pending transaction record first
      const tx = await prisma.paymentTransaction.create({
        data: {
          userId: ctx.user.id,
          planId: plan.id,
          amount: plan.price,
          status: "pending",
        },
      });

      try {
        const flouci = await generateFlouciPayment({
          amount: plan.price,
          orderId: String(tx.id),
          description: `AdGame Pro — Plan ${plan.name}`,
          successUrl: `${clientUrl}/payment/success?txId=${tx.id}`,
          failUrl:    `${clientUrl}/payment/failed?txId=${tx.id}`,
        });

        // Save Flouci payment_id for later verification
        await prisma.paymentTransaction.update({
          where: { id: tx.id },
          data: { flouciPaymentId: flouci.paymentId, flouciPayUrl: flouci.payUrl },
        });

        return {
          payUrl:        flouci.payUrl,
          transactionId: tx.id,
          paymentId:     flouci.paymentId,
        };
      } catch (err: unknown) {
        // Mark transaction as failed if Flouci API call itself fails
        await prisma.paymentTransaction.update({
          where: { id: tx.id },
          data: { status: "failed", failureReason: String(err) },
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Impossible de créer le paiement Flouci. Réessayez ou contactez le support.",
        });
      }
    }),

  // ── Verify payment (called after Flouci redirect) ─────────────
  // The client calls this after being redirected to /payment/success?txId=...
  verifyAfterRedirect: protectedProcedure
    .input(z.object({ transactionId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const tx = await prisma.paymentTransaction.findFirst({
        where: { id: input.transactionId, userId: ctx.user.id },
      });
      if (!tx) throw new TRPCError({ code: "NOT_FOUND", message: "Transaction introuvable" });

      // Already processed — idempotent
      if (tx.status === "paid") {
        const sub = await prisma.subscription.findUnique({ where: { userId: ctx.user.id } });
        return { success: true, alreadyProcessed: true, subscription: sub };
      }

      if (!tx.flouciPaymentId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Aucun paiement Flouci associé" });
      }

      const verification = await verifyFlouciPayment(tx.flouciPaymentId);

      if (!verification.success || verification.status !== "paid") {
        await prisma.paymentTransaction.update({
          where: { id: tx.id },
          data: { status: "failed", failureReason: `Flouci status: ${verification.status}` },
        });
        return { success: false, status: verification.status };
      }

      // Payment confirmed — activate subscription
      const plan = PLANS.find(p => p.id === tx.planId)!;
      const nextBillingDate = new Date(Date.now() + 30 * 24 * 3600 * 1000);

      const [, sub, user] = await prisma.$transaction([
        // Update transaction
        prisma.paymentTransaction.update({
          where: { id: tx.id },
          data: {
            status: "paid",
            flouciReceiptId: verification.receiptId,
            paidAt: new Date(),
          },
        }),
        // Upsert subscription
        prisma.subscription.upsert({
          where: { userId: ctx.user.id },
          create: {
            userId:         ctx.user.id,
            planId:         plan.id,
            planName:       plan.name,
            amount:         plan.price,
            status:         "active",
            nextBillingDate,
            paidAt:         new Date(),
            transactions:   { connect: { id: tx.id } },
          },
          update: {
            planId:         plan.id,
            planName:       plan.name,
            amount:         plan.price,
            status:         "active",
            nextBillingDate,
            paidAt:         new Date(),
            transactions:   { connect: { id: tx.id } },
          },
        }),
        // Get user for email
        prisma.user.findUniqueOrThrow({ where: { id: ctx.user.id } }),
      ]);

      // Send confirmation email (non-blocking)
      sendEmail({
        to: user.email,
        subject: `✅ Paiement confirmé — Plan ${plan.name}`,
        html: paymentSuccessEmail({
          userName:       user.name,
          planName:       plan.name,
          amount:         plan.price,
          receiptId:      verification.receiptId || "—",
          nextBillingDate: nextBillingDate.toLocaleDateString("fr-TN"),
        }),
      });

      return { success: true, subscription: sub, plan };
    }),

  // ── My payment history ────────────────────────────────────────
  myTransactions: protectedProcedure.query(({ ctx }) =>
    prisma.paymentTransaction.findMany({
      where: { userId: ctx.user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    })
  ),

  // ── Admin: all transactions ───────────────────────────────────
  adminList: adminProcedure
    .input(z.object({ status: z.enum(["pending","paid","failed","refunded"]).optional() }))
    .query(({ input }) =>
      prisma.paymentTransaction.findMany({
        where: { status: input.status },
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "desc" },
        take: 100,
      })
    ),
});
