import { z } from "zod";
import { router, adminProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import prisma from "../prisma";
import { sendEmail, advertiserValidatedEmail } from "../services/email";

export const adminRouter = router({

  // ── Stats ─────────────────────────────────────────────────────
  getStats: adminProcedure.query(async () => {
    const [advertisers, partners, users, activeGames, pendingAds, pendingGames, pendingProfiles, totalBoxes, onlineBoxes, subs] = await Promise.all([
      prisma.user.count({ where: { role: "advertiser" } }),
      prisma.user.count({ where: { role: "partner" } }),
      prisma.user.count({ where: { role: "user" } }),
      prisma.game.count({ where: { status: "active" } }),
      prisma.ad.count({ where: { status: "pending" } }),
      prisma.game.count({ where: { status: "pending" } }),
      prisma.advertiserProfile.count({ where: { validationStatus: "pending" } }),
      prisma.box.count(),
      prisma.box.count({ where: { isOnline: true } }),
      prisma.subscription.findMany({ where: { status: "active" }, select: { amount: true } }),
    ]);
    return {
      advertisers, partners, users, activeGames,
      pendingAds, pendingGames, pendingAdvertisers: pendingProfiles,
      totalBoxes, onlineBoxes,
      monthlyRevenue: subs.reduce((sum, s) => sum + s.amount, 0),
    };
  }),

  getRecentActivity: adminProcedure.query(async () => {
    const [games, ads, boxes, users] = await Promise.all([
      prisma.game.findMany({ orderBy: { createdAt: "desc" }, take: 2, include: { advertiser: { select: { name: true } } } }),
      prisma.ad.findMany({ orderBy: { createdAt: "desc" }, take: 2, include: { advertiser: { select: { name: true } } } }),
      prisma.box.findMany({ where: { isOnline: false }, orderBy: { updatedAt: "desc" }, take: 1 }),
      prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 1 }),
    ]);
    return [
      ...games.map(g => ({ type: "game", message: `Jeu: ${g.title} (${g.advertiser.name})`, time: g.createdAt })),
      ...ads.map(a => ({ type: "ad", message: `Pub: ${a.title} (${a.status})`, time: a.createdAt })),
      ...boxes.map(b => ({ type: "box", message: `Box hors ligne: ${b.name}`, time: b.updatedAt })),
      ...users.map(u => ({ type: "user", message: `Nouvel inscrit: ${u.name} (${u.role})`, time: u.createdAt })),
    ].sort((a, b) => b.time.getTime() - a.time.getTime()).slice(0, 6);
  }),

  // ── User management ───────────────────────────────────────────
  listUsers: adminProcedure
    .input(z.object({ role: z.enum(["user","advertiser","partner","admin"]).optional() }))
    .query(async ({ input }) => {
      const users = await prisma.user.findMany({
        where: { role: input.role ?? undefined, NOT: { role: "admin" } },
        include: { advertiserProfile: true, subscription: true },
        orderBy: { createdAt: "desc" },
      });
      return users.map(u => ({ ...u, passwordHash: undefined }));
    }),

  blockUser: adminProcedure
    .input(z.object({ userId: z.number(), blocked: z.boolean() }))
    .mutation(async ({ input }) => {
      await prisma.user.update({ where: { id: input.userId }, data: { isBlocked: input.blocked } });
      return { success: true };
    }),

  deleteUser: adminProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input }) => {
      await prisma.user.delete({ where: { id: input.userId } });
      return { success: true };
    }),

  // ── Advertiser validation ─────────────────────────────────────
  listPendingAdvertisers: adminProcedure.query(() =>
    prisma.advertiserProfile.findMany({
      where: { validationStatus: "pending" },
      include: { user: { select: { id: true, name: true, email: true, phone: true } } },
      orderBy: { createdAt: "desc" },
    })
  ),

  validateAdvertiser: adminProcedure
    .input(z.object({ userId: z.number(), approve: z.boolean(), reason: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const profile = await prisma.advertiserProfile.update({
        where: { userId: input.userId },
        data: {
          validationStatus: input.approve ? "approved" : "rejected",
          validatedById: ctx.user.id,
          validatedAt: new Date(),
          ...(input.reason && { rejectionReason: input.reason }),
        },
      });
      await prisma.notification.create({
        data: {
          userId: input.userId,
          title: input.approve ? "✅ Compte validé !" : "❌ Compte rejeté",
          message: input.approve
            ? "Votre compte annonceur a été validé. Vous pouvez maintenant créer des campagnes."
            : `Votre demande a été rejetée. Raison : ${input.reason ?? "Non précisée"}`,
          type: "validation",
        },
      });

      // Send real email notification
      const user = await prisma.user.findUnique({ where: { id: input.userId } });
      if (user) {
        sendEmail({
          to: user.email,
          subject: input.approve ? "✅ Votre compte AdGame Pro est validé !" : "❌ Votre demande AdGame Pro",
          html: advertiserValidatedEmail(user.name, input.approve, input.reason),
        });
      }

      return profile;
    }),

  // ── Ad validation ─────────────────────────────────────────────
  listPendingAds: adminProcedure.query(() =>
    prisma.ad.findMany({
      where: { status: "pending" },
      include: { advertiser: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    })
  ),

  approveAd: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => prisma.ad.update({ where: { id: input.id }, data: { status: "approved" } })),

  rejectAd: adminProcedure
    .input(z.object({ id: z.number(), reason: z.string().optional() }))
    .mutation(async ({ input }) =>
      prisma.ad.update({ where: { id: input.id }, data: { status: "rejected", rejectionReason: input.reason ?? null } })
    ),

  // ── Game validation ───────────────────────────────────────────
  listPendingGames: adminProcedure.query(() =>
    prisma.game.findMany({
      where: { status: "pending" },
      include: { advertiser: { select: { id: true, name: true } }, gameCities: true },
      orderBy: { createdAt: "desc" },
    })
  ),

  approveGame: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => prisma.game.update({ where: { id: input.id }, data: { status: "active" } })),

  rejectGame: adminProcedure
    .input(z.object({ id: z.number(), reason: z.string().optional() }))
    .mutation(async ({ input }) =>
      prisma.game.update({ where: { id: input.id }, data: { status: "rejected", rejectionReason: input.reason ?? null } })
    ),

  // ── Box management ────────────────────────────────────────────
  listBoxes: adminProcedure.query(() =>
    prisma.box.findMany({
      include: { city: true, partner: true, assignedFlux: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    })
  ),

  addBox: adminProcedure
    .input(z.object({ name: z.string().min(2), ipAddress: z.string(), cityId: z.number(), partnerId: z.number().optional(), assignedFluxId: z.number().optional(), notes: z.string().optional() }))
    .mutation(async ({ input }) => prisma.box.create({ data: input })),

  updateBox: adminProcedure
    .input(z.object({ id: z.number(), name: z.string().optional(), assignedFluxId: z.number().optional().nullable(), status: z.enum(["active","offline","maintenance","blocked"]).optional(), notes: z.string().optional() }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      return prisma.box.update({ where: { id }, data: { ...data, assignedFluxId: data.assignedFluxId === null ? null : data.assignedFluxId } });
    }),

  blockBox: adminProcedure
    .input(z.object({ id: z.number(), blocked: z.boolean() }))
    .mutation(async ({ input }) =>
      prisma.box.update({ where: { id: input.id }, data: { status: input.blocked ? "blocked" : "active" } })
    ),

  sendMessageToBox: adminProcedure
    .input(z.object({ boxId: z.number(), content: z.string().min(1) }))
    .mutation(async ({ ctx, input }) =>
      prisma.message.create({ data: { fromUserId: ctx.user.id, boxId: input.boxId, content: input.content, isAdminBroadcast: false } })
    ),

  // ── Broadcast Flux management ─────────────────────────────────
  listFluxes: adminProcedure.query(() =>
    prisma.broadcastFlux.findMany({
      include: {
        fluxCities: { include: { city: true } },
        fluxAds:    { include: { ad: true } },
        fluxGames:  { include: { game: true } },
        _count: { select: { boxes: true } },
      },
      orderBy: { createdAt: "desc" },
    })
  ),

  createFlux: adminProcedure
    .input(z.object({ name: z.string().min(2), description: z.string().optional(), cityIds: z.array(z.number()), adIds: z.array(z.number()).default([]), gameIds: z.array(z.number()).default([]), streamUrl: z.string().optional() }))
    .mutation(async ({ input }) => {
      const { cityIds, adIds, gameIds, ...rest } = input;
      return prisma.broadcastFlux.create({
        data: {
          ...rest,
          fluxCities: { create: cityIds.map(cityId => ({ cityId })) },
          fluxAds:    { create: adIds.map((adId, i) => ({ adId, order: i + 1 })) },
          fluxGames:  { create: gameIds.map(gameId => ({ gameId })) },
        },
      });
    }),

  updateFlux: adminProcedure
    .input(z.object({ id: z.number(), name: z.string().optional(), description: z.string().optional(), cityIds: z.array(z.number()).optional(), adIds: z.array(z.number()).optional(), gameIds: z.array(z.number()).optional(), streamUrl: z.string().optional(), isActive: z.boolean().optional() }))
    .mutation(async ({ input }) => {
      const { id, cityIds, adIds, gameIds, ...rest } = input;
      return prisma.$transaction(async (tx) => {
        if (cityIds) { await tx.broadcastFluxCity.deleteMany({ where: { fluxId: id } }); await tx.broadcastFluxCity.createMany({ data: cityIds.map(cityId => ({ fluxId: id, cityId })) }); }
        if (adIds)   { await tx.broadcastFluxAd.deleteMany({ where: { fluxId: id } });   await tx.broadcastFluxAd.createMany({ data: adIds.map((adId, i) => ({ fluxId: id, adId, order: i + 1 })) }); }
        if (gameIds) { await tx.broadcastFluxGame.deleteMany({ where: { fluxId: id } }); await tx.broadcastFluxGame.createMany({ data: gameIds.map(gameId => ({ fluxId: id, gameId })) }); }
        return tx.broadcastFlux.update({ where: { id }, data: rest });
      });
    }),

  deleteFlux: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await prisma.broadcastFlux.delete({ where: { id: input.id } });
      return { success: true };
    }),

  // ── Admin broadcast message ───────────────────────────────────
  sendBroadcastMessage: adminProcedure
    .input(z.object({ content: z.string().min(1), targetRole: z.enum(["all","advertiser","user","partner"]).default("all") }))
    .mutation(async ({ ctx, input }) => {
      const users = await prisma.user.findMany({
        where: { ...(input.targetRole !== "all" ? { role: input.targetRole as any } : {}), NOT: { role: "admin" } },
        select: { id: true },
      });
      await prisma.notification.createMany({
        data: users.map(u => ({
          userId: u.id,
          title: "📢 Message de l'administration",
          message: input.content,
          type: "system" as const,
        })),
      });
      return { sent: users.length };
    }),

  // ── Subscriptions ─────────────────────────────────────────────
  listSubscriptions: adminProcedure.query(() =>
    prisma.subscription.findMany({
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    })
  ),

  updateSubscriptionStatus: adminProcedure
    .input(z.object({ id: z.number(), status: z.enum(["active","suspended","cancelled"]) }))
    .mutation(async ({ input }) =>
      prisma.subscription.update({ where: { id: input.id }, data: { status: input.status } })
    ),

  // ── Upload video (admin) ──────────────────────────────────────
  uploadVideo: adminProcedure
    .input(z.object({ title: z.string(), base64: z.string(), mimeType: z.string(), assignToFluxId: z.number().optional() }))
    .mutation(async ({ ctx, input }) => {
      // In production: upload to S3/Cloudinary and get real URL
      const videoUrl = `https://cdn.adgame.tn/videos/${Date.now()}-${input.title.replace(/\s+/g, "-")}.mp4`;
      const ad = await prisma.ad.create({
        data: { title: input.title, description: "Vidéo uploadée via admin", advertiserId: ctx.user.id, status: "approved", type: "upload", videoUrl, duration: 30 },
      });
      if (input.assignToFluxId) {
        await prisma.broadcastFluxAd.upsert({
          where: { fluxId_adId: { fluxId: input.assignToFluxId, adId: ad.id } },
          create: { fluxId: input.assignToFluxId, adId: ad.id, order: 99 },
          update: {},
        });
      }
      return { ad, videoUrl };
    }),
});
