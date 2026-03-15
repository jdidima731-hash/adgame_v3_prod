import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "./routers";
import { createContext } from "./trpc";
import prisma from "./prisma";
import path from "path";

const app = express();
const PORT = Number(process.env.PORT) || 3001;
const isProd = process.env.NODE_ENV === "production";

// ── Security headers ──────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: isProd ? undefined : false, // allow Vite HMR in dev
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

// ── Rate limiting ─────────────────────────────────────────────

// Global: 300 requests / 15 min per IP
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Trop de requêtes. Réessayez dans quelques minutes." },
}));

// Auth routes: strict limit — 10 attempts / 15 min
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Trop de tentatives de connexion. Réessayez dans 15 minutes." },
  skipSuccessfulRequests: true,
});

// Participation: 30 / 10 min (prevents bots)
const participationLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 30,
  message: { error: "Trop de participations. Réessayez dans 10 minutes." },
});

// Apply specific limiters on tRPC routes that match auth/participate paths
app.use("/api/trpc/auth.login",         authLimiter);
app.use("/api/trpc/auth.forgotPassword", authLimiter);
app.use("/api/trpc/auth.register",      authLimiter);
app.use("/api/trpc/games.participate",  participationLimiter);

// ── Middleware ─────────────────────────────────────────────────
app.use(express.json({ limit: "10mb" })); // reduced from 50mb — use S3 for large files
app.use(cookieParser(process.env.SESSION_SECRET || "adgame-dev-secret-change-in-production"));
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true,
}));

// ── tRPC API ───────────────────────────────────────────────────
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
    onError: ({ path, error }) => {
      if (error.code !== "UNAUTHORIZED" && error.code !== "FORBIDDEN") {
        console.error(`❌ tRPC [${path}]:`, error.message);
      }
    },
  })
);

// ── Flouci webhook (raw body required for signature check) ─────
// Called by Flouci servers after a payment completes
app.post("/api/payments/flouci/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  try {
    const body = JSON.parse(req.body.toString());
    const paymentId: string = body?.payload?.payment_id || body?.payment_id;
    if (!paymentId) return res.status(400).json({ error: "Missing payment_id" });

    const { verifyFlouciPayment } = await import("./services/flouci");
    const verification = await verifyFlouciPayment(paymentId);

    if (verification.success && verification.status === "paid") {
      const tx = await prisma.paymentTransaction.findUnique({ where: { flouciPaymentId: paymentId } });
      if (!tx || tx.status === "paid") return res.json({ received: true });

      const { PLANS } = await import("./routers/payments");
      const plan = PLANS.find(p => p.id === tx.planId);
      if (!plan) return res.status(404).json({ error: "Plan not found" });

      const nextBillingDate = new Date(Date.now() + 30 * 24 * 3600 * 1000);
      const user = await prisma.user.findUnique({ where: { id: tx.userId } });

      await prisma.$transaction([
        prisma.paymentTransaction.update({
          where: { id: tx.id },
          data: { status: "paid", flouciReceiptId: verification.receiptId, paidAt: new Date() },
        }),
        prisma.subscription.upsert({
          where: { userId: tx.userId },
          create: {
            userId: tx.userId, planId: plan.id, planName: plan.name,
            amount: plan.price, status: "active", nextBillingDate, paidAt: new Date(),
            transactions: { connect: { id: tx.id } },
          },
          update: {
            planId: plan.id, planName: plan.name, amount: plan.price,
            status: "active", nextBillingDate, paidAt: new Date(),
            transactions: { connect: { id: tx.id } },
          },
        }),
      ]);

      if (user) {
        const { sendEmail, paymentSuccessEmail } = await import("./services/email");
        sendEmail({
          to: user.email,
          subject: `✅ Paiement confirmé — Plan ${plan.name}`,
          html: paymentSuccessEmail({
            userName: user.name, planName: plan.name, amount: plan.price,
            receiptId: verification.receiptId || "—",
            nextBillingDate: nextBillingDate.toLocaleDateString("fr-TN"),
          }),
        });
      }
    }

    res.json({ received: true });
  } catch (err) {
    console.error("Flouci webhook error:", err);
    res.status(500).json({ error: "Webhook processing failed" });
  }
});

// ── Health check ───────────────────────────────────────────────
app.get("/api/health", async (_, res) => {
  try {
    const [users, games, boxes] = await Promise.all([
      prisma.user.count(),
      prisma.game.count({ where: { status: "active" } }),
      prisma.box.count({ where: { isOnline: true } }),
    ]);
    res.json({ status: "ok", timestamp: new Date().toISOString(), db: "postgresql", stats: { users, activeGames: games, onlineBoxes: boxes } });
  } catch (e) {
    res.status(503).json({ status: "error", message: "Database unreachable" });
  }
});

// ── Password reset redirect (dev + production) ─────────────────
app.get("/api/reset-link/:token", async (req, res) => {
  const { token } = req.params;
  const record = await prisma.passwordResetToken.findUnique({ where: { id: token } });
  if (!record || record.expiresAt < new Date()) return res.status(404).send("Token invalide ou expiré");
  res.redirect(`${process.env.CLIENT_URL || "http://localhost:5173"}/reset-password?token=${token}`);
});

// ── Clean expired sessions (every hour) ───────────────────────
setInterval(async () => {
  const deleted = await prisma.session.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  if (deleted.count > 0) console.log(`🧹 Cleaned ${deleted.count} expired sessions`);
}, 3600 * 1000);

// ── Static files (production) ──────────────────────────────────
if (isProd) {
  const clientDist = path.join(__dirname, "../client/dist");
  app.use(express.static(clientDist));
  app.get("*", (_, res) => res.sendFile(path.join(clientDist, "index.html")));
}

// ── Start ──────────────────────────────────────────────────────
app.listen(PORT, async () => {
  try {
    await prisma.$connect();
    console.log("\n╔════════════════════════════════════════════╗");
    console.log("║         🎮 AdGame Pro — Serveur            ║");
    console.log("╚════════════════════════════════════════════╝");
    console.log(`\n  🌐 http://localhost:${PORT}`);
    console.log(`  📡 tRPC: http://localhost:${PORT}/api/trpc`);
    console.log(`  💊 Health: http://localhost:${PORT}/api/health`);
    console.log(`  💳 Flouci webhook: POST /api/payments/flouci/webhook`);
    console.log(`  🗄️  Database: PostgreSQL (Prisma)\n`);
    if (!isProd) {
      console.log("  ⚠️  DEV MODE — emails logged to console, cookies not secure");
      console.log("  📧  Set RESEND_API_KEY or SMTP_* in .env for real emails\n");
    }
  } catch (e) {
    console.error("❌ Cannot connect to PostgreSQL. Set DATABASE_URL in .env");
  }
});

export default app;

