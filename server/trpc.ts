import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { Request, Response } from "express";
import { UNAUTHED_ERR_MSG } from "../../shared/const";
import prisma from "./prisma";

export type Context = {
  req: Request;
  res: Response;
  user?: {
    id: number;
    email: string;
    name: string;
    role: "user" | "advertiser" | "partner" | "admin";
    phone: string | null;
    isBlocked: boolean;
    isValidated: boolean;
  };
};

export async function createContext({ req, res }: { req: Request; res: Response }): Promise<Context> {
  const sessionId = req.cookies?.adgame_session;
  if (sessionId) {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { user: true },
    });
    if (session && session.expiresAt > new Date()) {
      const u = session.user;
      return {
        req, res,
        user: {
          id: u.id, email: u.email, name: u.name,
          role: u.role as Context["user"]["role"],
          phone: u.phone, isBlocked: u.isBlocked, isValidated: u.isValidated,
        },
      };
    }
    // Expired — clean up silently
    if (session) await prisma.session.delete({ where: { id: sessionId } }).catch(() => {});
  }
  return { req, res };
}

const t = initTRPC.context<Context>().create({ transformer: superjson });

export const router        = t.router;
export const publicProcedure = t.procedure;

// Protected: logged in + not blocked
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  if (ctx.user.isBlocked) throw new TRPCError({ code: "FORBIDDEN", message: "Votre compte a été suspendu. Contactez l'administration." });
  return next({ ctx: { ...ctx, user: ctx.user } });
});

// Admin only
export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Accès administrateur requis" });
  return next({ ctx });
});

// Advertiser: role check + profile validated
export const advertiserProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user.role !== "advertiser" && ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Accès annonceur requis" });
  }
  if (ctx.user.role === "advertiser") {
    const profile = await prisma.advertiserProfile.findUnique({ where: { userId: ctx.user.id } });
    if (!profile || profile.validationStatus === "pending") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Votre compte annonceur est en attente de validation par l'administration." });
    }
    if (profile.validationStatus === "rejected") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Votre compte annonceur a été refusé. Contactez l'administration." });
    }
  }
  return next({ ctx });
});

// Partner
export const partnerProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "partner" && ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Accès partenaire requis" });
  }
  return next({ ctx });
});
