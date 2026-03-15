import { z } from "zod";
import { randomBytes } from "crypto";
import { router, publicProcedure, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import prisma from "../prisma";
import { COOKIE_NAME } from "../../../shared/const";
import { sendEmail, passwordResetEmail, advertiserValidatedEmail } from "../services/email";

// 30 days — reasonable session lifetime
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

// secure flag only in production (requires HTTPS)
const cookieOptions = () => ({
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  maxAge: SESSION_TTL_MS,
});

export { advertiserValidatedEmail };

export const authRouter = router({

  // ── GET current user ──────────────────────────────────────────
  me: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user) return undefined;
    const u = await prisma.user.findUnique({ where: { id: ctx.user.id } });
    if (!u) return undefined;
    return { id: u.id, name: u.name, email: u.email, role: u.role, phone: u.phone, isBlocked: u.isBlocked, isValidated: u.isValidated };
  }),

  // ── POST login ────────────────────────────────────────────────
  login: publicProcedure
    .input(z.object({ email: z.string().email(), password: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const user = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
      if (!user) throw new TRPCError({ code: "UNAUTHORIZED", message: "Email ou mot de passe incorrect" });

      const valid = await bcrypt.compare(input.password, user.passwordHash);
      if (!valid) throw new TRPCError({ code: "UNAUTHORIZED", message: "Email ou mot de passe incorrect" });
      if (user.isBlocked) throw new TRPCError({ code: "FORBIDDEN", message: "Votre compte a été suspendu. Contactez l'administration." });

      const sessionId = randomBytes(32).toString("hex");
      await prisma.session.create({
        data: { id: sessionId, userId: user.id, expiresAt: new Date(Date.now() + SESSION_TTL_MS) },
      });

      ctx.res.cookie(COOKIE_NAME, sessionId, cookieOptions());
      return { user: { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone } };
    }),

  // ── POST register ─────────────────────────────────────────────
  register: publicProcedure
    .input(z.object({
      name:  z.string().min(2, "Nom trop court"),
      email: z.string().email("Email invalide"),
      password: z.string().min(8, "Mot de passe trop court (8 caractères min)"),
      role: z.enum(["user", "advertiser", "partner"]).default("user"),
      phone: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const existing = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
      if (existing) throw new TRPCError({ code: "CONFLICT", message: "Un compte avec cet email existe déjà" });

      const passwordHash = await bcrypt.hash(input.password, 10);
      const newUser = await prisma.user.create({
        data: {
          name: input.name, email: input.email.toLowerCase(),
          passwordHash, role: input.role as any,
          phone: input.phone ?? null, isValidated: true, isBlocked: false,
        },
      });

      // Advertiser: create pending profile + notify admin
      if (input.role === "advertiser") {
        await prisma.advertiserProfile.create({
          data: { userId: newUser.id, businessName: input.name, photos: [], validationStatus: "pending" },
        });
        const adminUser = await prisma.user.findFirst({ where: { role: "admin" } });
        if (adminUser) {
          await prisma.notification.create({
            data: { userId: adminUser.id, title: "Nouvel annonceur inscrit", message: `${input.name} (${input.email}) a créé un compte annonceur en attente de validation.`, type: "validation" },
          });
        }
        return { user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role, phone: newUser.phone } };
      }

      // Auto-login for non-advertisers
      const sessionId = randomBytes(32).toString("hex");
      await prisma.session.create({ data: { id: sessionId, userId: newUser.id, expiresAt: new Date(Date.now() + SESSION_TTL_MS) } });
      ctx.res.cookie(COOKIE_NAME, sessionId, cookieOptions());
      return { user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role, phone: newUser.phone } };
    }),

  // ── PUT update profile ────────────────────────────────────────
  updateProfile: protectedProcedure
    .input(z.object({ name: z.string().min(2).optional(), phone: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const u = await prisma.user.update({
        where: { id: ctx.user.id },
        data: { ...(input.name && { name: input.name }), ...(input.phone !== undefined && { phone: input.phone }) },
      });
      return { id: u.id, name: u.name, email: u.email, role: u.role, phone: u.phone };
    }),

  // ── PUT change password ───────────────────────────────────────
  changePassword: protectedProcedure
    .input(z.object({ currentPassword: z.string().min(1), newPassword: z.string().min(8) }))
    .mutation(async ({ ctx, input }) => {
      const user = await prisma.user.findUnique({ where: { id: ctx.user.id } });
      if (!user) throw new TRPCError({ code: "NOT_FOUND" });
      const valid = await bcrypt.compare(input.currentPassword, user.passwordHash);
      if (!valid) throw new TRPCError({ code: "UNAUTHORIZED", message: "Mot de passe actuel incorrect" });
      await prisma.user.update({ where: { id: ctx.user.id }, data: { passwordHash: await bcrypt.hash(input.newPassword, 10) } });

      // Invalidate ALL sessions (including current) — forces re-login everywhere
      const currentSessionId = ctx.req.cookies?.[COOKIE_NAME];
      await prisma.session.deleteMany({ where: { userId: ctx.user.id } });
      ctx.res.clearCookie(COOKIE_NAME);

      return { success: true };
    }),

  // ── POST forgot password ──────────────────────────────────────
  forgotPassword: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      const user = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
      // Always return success to prevent email enumeration
      if (!user) return { success: true };

      // Delete old tokens
      await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

      const token = randomBytes(32).toString("hex");
      await prisma.passwordResetToken.create({
        data: { id: token, userId: user.id, expiresAt: new Date(Date.now() + 3600000) },
      });

      const resetUrl = `${process.env.CLIENT_URL || "http://localhost:5173"}/reset-password?token=${token}`;

      // Send real email
      await sendEmail({
        to: user.email,
        subject: "Réinitialisation de votre mot de passe — AdGame Pro",
        html: passwordResetEmail(resetUrl, user.name),
        text: `Bonjour ${user.name},\n\nRéinitialisez votre mot de passe : ${resetUrl}\n\nCe lien expire dans 1 heure.`,
      });

      return { success: true };
    }),

  // ── POST reset password ───────────────────────────────────────
  resetPassword: publicProcedure
    .input(z.object({ token: z.string().min(1), newPassword: z.string().min(8) }))
    .mutation(async ({ input }) => {
      const record = await prisma.passwordResetToken.findUnique({ where: { id: input.token } });
      if (!record) throw new TRPCError({ code: "NOT_FOUND", message: "Lien invalide ou expiré" });
      if (record.expiresAt < new Date()) {
        await prisma.passwordResetToken.delete({ where: { id: input.token } }).catch(() => {});
        throw new TRPCError({ code: "FORBIDDEN", message: "Lien expiré. Faites une nouvelle demande." });
      }
      await prisma.user.update({ where: { id: record.userId }, data: { passwordHash: await bcrypt.hash(input.newPassword, 10) } });
      await prisma.passwordResetToken.delete({ where: { id: input.token } });
      // Also invalidate all sessions for this user after password reset
      await prisma.session.deleteMany({ where: { userId: record.userId } });
      return { success: true };
    }),

  // ── POST logout ───────────────────────────────────────────────
  logout: protectedProcedure.mutation(async ({ ctx }) => {
    const sessionId = ctx.req.cookies?.[COOKIE_NAME];
    if (sessionId) await prisma.session.delete({ where: { id: sessionId } }).catch(() => {});
    ctx.res.clearCookie(COOKIE_NAME);
    return { success: true };
  }),
});

