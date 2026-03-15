import { z } from "zod";
import { router, protectedProcedure, advertiserProcedure, adminProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import prisma from "../prisma";

export const adsRouter = router({

  list: protectedProcedure
    .input(z.object({ limit: z.number().default(20), offset: z.number().default(0) }))
    .query(async ({ ctx, input }) => {
      return prisma.ad.findMany({
        where: ctx.user.role !== "admin" ? { advertiserId: ctx.user.id } : undefined,
        skip: input.offset,
        take: input.limit,
        orderBy: { createdAt: "desc" },
      });
    }),

  listMine: advertiserProcedure.query(async ({ ctx }) =>
    prisma.ad.findMany({ where: { advertiserId: ctx.user.id }, orderBy: { createdAt: "desc" } })
  ),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const ad = await prisma.ad.findUnique({ where: { id: input.id } });
      if (!ad) throw new TRPCError({ code: "NOT_FOUND" });
      return ad;
    }),

  create: advertiserProcedure
    .input(z.object({
      title: z.string().min(3),
      description: z.string(),
      type: z.enum(["ai","template","upload"]),
      duration: z.number().min(5).max(120),
      videoUrl: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) =>
      prisma.ad.create({
        data: { ...input, advertiserId: ctx.user.id, status: "pending" },
      })
    ),

  listPending: adminProcedure.query(() =>
    prisma.ad.findMany({
      where: { status: "pending" },
      include: { advertiser: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    })
  ),

  approve: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const ad = await prisma.ad.findUnique({ where: { id: input.id } });
      if (!ad) throw new TRPCError({ code: "NOT_FOUND" });
      return prisma.ad.update({ where: { id: input.id }, data: { status: "approved" } });
    }),

  reject: adminProcedure
    .input(z.object({ id: z.number(), reason: z.string().optional() }))
    .mutation(async ({ input }) => {
      const ad = await prisma.ad.findUnique({ where: { id: input.id } });
      if (!ad) throw new TRPCError({ code: "NOT_FOUND" });
      return prisma.ad.update({ where: { id: input.id }, data: { status: "rejected", rejectionReason: input.reason ?? null } });
    }),
});
