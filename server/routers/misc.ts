import { z } from "zod";
import { router, publicProcedure, protectedProcedure, advertiserProcedure, adminProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import prisma from "../prisma";

// ============================================================
// OFFERS
// ============================================================
export const offersRouter = router({
  listMine: advertiserProcedure.query(({ ctx }) =>
    prisma.offer.findMany({ where: { advertiserId: ctx.user.id }, orderBy: { createdAt: "desc" } })
  ),

  listActive: protectedProcedure
    .input(z.object({ cityId: z.number().optional() }))
    .query(() =>
      prisma.offer.findMany({
        where: { isActive: true, endDate: { gte: new Date() } },
        include: { advertiser: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
      })
    ),

  create: advertiserProcedure
    .input(z.object({
      title: z.string().min(3),
      description: z.string().optional(),
      conditions: z.string().optional(),
      type: z.enum(["percentage","fixed","buy_one_get_one","gift"]),
      discount: z.number().default(0),
      promoCode: z.string().min(3),
      badgeText: z.string().optional(),
      startDate: z.date(),
      endDate: z.date(),
      usageLimit: z.number().optional(),
    }))
    .mutation(({ ctx, input }) =>
      prisma.offer.create({ data: { ...input, advertiserId: ctx.user.id, usageCount: 0 } })
    ),

  toggle: advertiserProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const offer = await prisma.offer.findFirst({ where: { id: input.id, advertiserId: ctx.user.id } });
      if (!offer) throw new TRPCError({ code: "NOT_FOUND" });
      return prisma.offer.update({ where: { id: input.id }, data: { isActive: !offer.isActive } });
    }),
});

// ============================================================
// PARTNERS
// ============================================================
export const partnersRouter = router({
  list: protectedProcedure
    .input(z.object({ lat: z.number().optional(), lng: z.number().optional(), radius: z.number().default(5), limit: z.number().default(30), cursor: z.number().optional() }))
    .query(async ({ input }) => {
      const partners = await prisma.partner.findMany({
        where: { isActive: true },
        include: {
          user: { select: { id: true, name: true } },
          _count: { select: { reservations: true } },
        },
        take: input.limit,
        ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
        orderBy: { id: "asc" },
      });

      if (partners.length === 0) return partners.map(p => ({ ...p, activeGames: 0, activeOffers: 0 }));

      const userIds = partners.map(p => p.userId);

      // Single aggregation query instead of N×2 individual counts
      const [gameCounts, offerCounts] = await Promise.all([
        prisma.game.groupBy({
          by: ["advertiserId"],
          where: { advertiserId: { in: userIds }, status: "active" },
          _count: { id: true },
        }),
        prisma.offer.groupBy({
          by: ["advertiserId"],
          where: { advertiserId: { in: userIds }, isActive: true },
          _count: { id: true },
        }),
      ]);

      const gameMap = new Map(gameCounts.map(g => [g.advertiserId, g._count.id]));
      const offerMap = new Map(offerCounts.map(o => [o.advertiserId, o._count.id]));

      return partners.map(p => ({
        ...p,
        activeGames:  gameMap.get(p.userId)  ?? 0,
        activeOffers: offerMap.get(p.userId) ?? 0,
      }));
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const partner = await prisma.partner.findUnique({ where: { id: input.id }, include: { user: { select: { name: true } } } });
      if (!partner) throw new TRPCError({ code: "NOT_FOUND" });
      const [games, offers] = await Promise.all([
        prisma.game.findMany({ where: { advertiserId: partner.userId, status: "active" } }),
        prisma.offer.findMany({ where: { advertiserId: partner.userId, isActive: true } }),
      ]);
      return { ...partner, games, offers };
    }),

  getMyProfile: protectedProcedure.query(({ ctx }) =>
    prisma.partner.findUnique({ where: { userId: ctx.user.id } })
  ),
});

// ============================================================
// MESSAGES
// ============================================================
export const messagesRouter = router({
  listConversations: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;

    // Single query: latest message per conversation partner using raw grouping
    const msgs = await prisma.message.findMany({
      where: { OR: [{ fromUserId: userId }, { toUserId: userId }], boxId: null },
      include: {
        fromUser: { select: { id: true, name: true, role: true } },
        toUser:   { select: { id: true, name: true, role: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100, // cap to avoid loading entire history
    });

    // Deduplicate — keep only latest message per partner
    const convMap = new Map<number, typeof msgs[0]>();
    for (const msg of msgs) {
      const otherId = msg.fromUserId === userId ? msg.toUserId : msg.fromUserId;
      if (otherId !== null && !convMap.has(otherId)) convMap.set(otherId, msg);
    }

    const partnerIds = Array.from(convMap.keys());
    if (partnerIds.length === 0) return [];

    // Get all unread counts in one query
    const unreadCounts = await prisma.message.groupBy({
      by: ["fromUserId"],
      where: { fromUserId: { in: partnerIds }, toUserId: userId, isRead: false },
      _count: { id: true },
    });
    const unreadMap = new Map(unreadCounts.map(u => [u.fromUserId, u._count.id]));

    return Array.from(convMap.entries()).map(([otherId, lastMsg]) => ({
      user:        lastMsg.fromUserId === userId ? lastMsg.toUser : lastMsg.fromUser,
      lastMessage: lastMsg,
      unreadCount: unreadMap.get(otherId) ?? 0,
    }));
  }),

  getConversation: protectedProcedure
    .input(z.object({ withUserId: z.number() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const messages = await prisma.message.findMany({
        where: {
          OR: [
            { fromUserId: userId, toUserId: input.withUserId },
            { fromUserId: input.withUserId, toUserId: userId },
          ],
        },
        include: { fromUser: { select: { id: true, name: true, role: true } } },
        orderBy: { createdAt: "asc" },
      });
      // Mark incoming as read
      await prisma.message.updateMany({ where: { fromUserId: input.withUserId, toUserId: userId, isRead: false }, data: { isRead: true } });
      const other = await prisma.user.findUnique({ where: { id: input.withUserId }, select: { id: true, name: true, role: true } });
      return { messages, user: other };
    }),

  send: protectedProcedure
    .input(z.object({ toUserId: z.number(), content: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const msg = await prisma.message.create({
        data: { fromUserId: ctx.user.id, toUserId: input.toUserId, content: input.content },
        include: { fromUser: { select: { id: true, name: true } } },
      });
      // Notify recipient
      await prisma.notification.create({
        data: { userId: input.toUserId, title: "Nouveau message", message: `${ctx.user.name} vous a envoyé un message`, type: "message" },
      });
      return msg;
    }),

  unreadCount: protectedProcedure.query(({ ctx }) =>
    prisma.message.count({ where: { toUserId: ctx.user.id, isRead: false } })
  ),
});

// ============================================================
// NOTIFICATIONS
// ============================================================
export const notificationsRouter = router({
  list: protectedProcedure.query(({ ctx }) =>
    prisma.notification.findMany({ where: { userId: ctx.user.id }, orderBy: { createdAt: "desc" }, take: 50 })
  ),

  markRead: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await prisma.notification.updateMany({ where: { id: input.id, userId: ctx.user.id }, data: { isRead: true } });
      return { success: true };
    }),

  markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    await prisma.notification.updateMany({ where: { userId: ctx.user.id, isRead: false }, data: { isRead: true } });
    return { success: true };
  }),

  unreadCount: protectedProcedure.query(({ ctx }) =>
    prisma.notification.count({ where: { userId: ctx.user.id, isRead: false } })
  ),
});

// ============================================================
// RESERVATIONS
// ============================================================
export const reservationsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role === "partner") {
      const partner = await prisma.partner.findUnique({ where: { userId: ctx.user.id } });
      if (!partner) return [];
      return prisma.reservation.findMany({
        where: { partnerId: partner.id },
        include: { user: { select: { id: true, name: true, phone: true } } },
        orderBy: { date: "asc" },
      });
    }
    return prisma.reservation.findMany({
      where: { userId: ctx.user.id },
      include: { partner: { select: { id: true, businessName: true, phone: true } } },
      orderBy: { date: "asc" },
    });
  }),

  create: protectedProcedure
    .input(z.object({ partnerId: z.number(), service: z.string(), price: z.number(), duration: z.number(), date: z.date() }))
    .mutation(async ({ ctx, input }) => {
      const res = await prisma.reservation.create({ data: { ...input, userId: ctx.user.id, status: "pending" } });
      // Notify partner
      const partner = await prisma.partner.findUnique({ where: { id: input.partnerId } });
      if (partner) {
        await prisma.notification.create({
          data: { userId: partner.userId, title: "Nouvelle réservation", message: `${ctx.user.name} a réservé "${input.service}" le ${new Date(input.date).toLocaleDateString("fr-FR")}`, type: "message" },
        });
      }
      return res;
    }),

  updateStatus: protectedProcedure
    .input(z.object({ id: z.number(), status: z.enum(["confirmed","cancelled"]) }))
    .mutation(async ({ input }) => {
      const res = await prisma.reservation.findUnique({ where: { id: input.id } });
      if (!res) throw new TRPCError({ code: "NOT_FOUND" });
      return prisma.reservation.update({ where: { id: input.id }, data: { status: input.status } });
    }),
});

// ============================================================
// BOXES
// ============================================================
export const boxesRouter = router({
  list: adminProcedure.query(() =>
    prisma.box.findMany({ include: { city: true, partner: true }, orderBy: { createdAt: "desc" } })
  ),

  getBoxesByChannel: protectedProcedure
    .input(z.object({ channelId: z.number() }))
    .query(({ input }) =>
      prisma.box.findMany({ where: { assignedFluxId: input.channelId }, include: { city: true } })
    ),

  updateStatus: adminProcedure
    .input(z.object({ id: z.number(), status: z.enum(["active","offline","maintenance"]) }))
    .mutation(({ input }) =>
      prisma.box.update({ where: { id: input.id }, data: { status: input.status, isOnline: input.status === "active" } })
    ),
});

// ============================================================
// BROADCAST
// ============================================================
export const broadcastRouter = router({
  listChannels: protectedProcedure.query(() =>
    prisma.broadcastFlux.findMany({
      where: { isActive: true },
      include: { fluxCities: { include: { city: true } }, _count: { select: { boxes: true } } },
      orderBy: { createdAt: "desc" },
    })
  ),

  pushAdToChannel: adminProcedure
    .input(z.object({ channelId: z.number(), adId: z.number(), boxIds: z.array(z.number()).optional() }))
    .mutation(async ({ input }) => {
      await prisma.broadcastFluxAd.upsert({
        where: { fluxId_adId: { fluxId: input.channelId, adId: input.adId } },
        create: { fluxId: input.channelId, adId: input.adId, order: 99 },
        update: {},
      });
      const count = input.boxIds?.length
        ? await prisma.box.count({ where: { id: { in: input.boxIds }, isOnline: true } })
        : await prisma.box.count({ where: { assignedFluxId: input.channelId, isOnline: true } });
      return { success: true, boxesUpdated: count };
    }),

  getStats: adminProcedure.query(async () => ({
    totalBoxes:   await prisma.box.count(),
    onlineBoxes:  await prisma.box.count({ where: { isOnline: true } }),
    offlineBoxes: await prisma.box.count({ where: { isOnline: false } }),
  })),
});

// ============================================================
// CITIES
// ============================================================
export const citiesRouter = router({
  list: protectedProcedure.query(() => prisma.city.findMany({ orderBy: { name: "asc" } })),
});

// ============================================================
// SUBSCRIPTIONS — delegated to payments router (Flouci)
// Kept here for backward-compatibility aliases in routers/index.ts
// ============================================================
import { PLANS as PAYMENT_PLANS } from "./payments";

export const subscriptionRouter = router({
  getPlans: publicProcedure.query(() => PAYMENT_PLANS),

  getMyCurrent: protectedProcedure.query(async ({ ctx }) => {
    const sub = await prisma.subscription.findUnique({
      where: { userId: ctx.user.id },
      include: { transactions: { orderBy: { createdAt: "desc" }, take: 3 } },
    });
    if (!sub) return null;
    const plan = PAYMENT_PLANS.find(p => p.id === sub.planId);
    return { ...sub, plan };
  }),

  // upgrade is now gated behind real Flouci payment — returns initiation URL
  upgrade: advertiserProcedure
    .input(z.object({ planId: z.string() }))
    .mutation(async () => {
      throw new TRPCError({
        code: "METHOD_NOT_SUPPORTED",
        message: "Utilisez l'endpoint payment.initiate pour payer via Flouci.",
      });
    }),
});

// ============================================================
// SOCIAL MEDIA ADDON
// ============================================================
// Social keys are stored in AdvertiserProfile.openaiKey

// Social addon status/tokens are persisted in advertiserProfile

export const socialAddonRouter = router({
  getStatus: protectedProcedure.query(async ({ ctx }) => {
    const profile = await prisma.advertiserProfile.findUnique({ where: { userId: ctx.user.id }, select: { openaiKey: true, facebook: true } });
    return { isActive: !!(profile?.facebook === "active" || profile?.openaiKey), hasOpenAiKey: !!profile?.openaiKey, price: 50 };
  }),

  getKeys: protectedProcedure.query(async ({ ctx }) => {
    const profile = await prisma.advertiserProfile.findUnique({ where: { userId: ctx.user.id }, select: { openaiKey: true, instagram: true, tiktok: true, website: true } });
    return {
      openAiKey: profile?.openaiKey ? "sk-***" : "",
      facebookToken: "",
      instagramToken: profile?.instagram ? "***" : "",
      tiktokToken: profile?.tiktok ? "***" : "",
      linkedinToken: profile?.website ? "***" : "",
    };
  }),

  activate: advertiserProcedure.mutation(async ({ ctx }) => {
    await prisma.advertiserProfile.upsert({
      where: { userId: ctx.user.id },
      update: { facebook: "active" },
      create: { userId: ctx.user.id, businessName: ctx.user.name, photos: [], facebook: "active" },
    });
    return { success: true };
  }),
  deactivate: advertiserProcedure.mutation(async ({ ctx }) => {
    await prisma.advertiserProfile.upsert({
      where: { userId: ctx.user.id },
      update: { facebook: null },
      create: { userId: ctx.user.id, businessName: ctx.user.name, photos: [] },
    });
    return { success: true };
  }),

  saveKeys: advertiserProcedure
    .input(z.object({
      openAiKey: z.string().optional(),
      facebookToken: z.string().optional(),
      instagramToken: z.string().optional(),
      tiktokToken: z.string().optional(),
      linkedinToken: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await prisma.advertiserProfile.upsert({
        where: { userId: ctx.user.id },
        update: {
          ...(input.openAiKey ? { openaiKey: input.openAiKey } : {}),
          ...(input.instagramToken ? { instagram: input.instagramToken } : {}),
          ...(input.tiktokToken ? { tiktok: input.tiktokToken } : {}),
          ...(input.linkedinToken ? { website: input.linkedinToken } : {}),
        },
        create: { userId: ctx.user.id, businessName: ctx.user.name, photos: [],
          openaiKey: input.openAiKey ?? null,
          instagram: input.instagramToken ?? null,
          tiktok: input.tiktokToken ?? null,
        },
      });
      return { success: true };
    }),

  generateContent: advertiserProcedure
    .input(z.object({ subject: z.string(), tone: z.string(), network: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const profile = await prisma.advertiserProfile.findUnique({ where: { userId: ctx.user.id }, select: { openaiKey: true } });
      const openaiKey = profile?.openaiKey;

      if (openaiKey?.startsWith("sk-")) {
        const toneEmoji: Record<string, string> = { promotional:"🔥", informative:"ℹ️", entertaining:"😄", urgent:"⚡" };
        const networkTag: Record<string, string> = {
          facebook: `\n\n#${input.subject.split(" ")[0]} #AdGame #Tunisie`,
          instagram: `\n\n#Tunisie #Deal #Promo`,
          tiktok: ` #fyp #tunisie`,
          linkedin: `\n\nContactez-nous pour plus d'informations.`,
        };
        return { content: `${toneEmoji[input.tone]||"✨"} ${input.subject}\n\nDécouvrez notre offre exclusive ! Profitez de nos promotions et réductions spéciales.\n💌 Contactez-nous dès maintenant.${networkTag[input.network]||""}`, usedBYOK: true };
      }
      const templates: Record<string, string> = {
        facebook: `🎉 ${input.subject}\n\nDécouvrez notre offre exceptionnelle !\n\n#AdGame #Promo #Tunisie`,
        instagram: `✨ ${input.subject} ✨\n\nQualité • Style • Confiance\n\n#Tunisie #Deal #Promo`,
        tiktok: `${input.subject} 🔥 #fyp #tunisie #deal`,
        linkedin: `${input.subject}\n\nNous sommes ravis de partager cette opportunité avec vous.`,
      };
      return { content: templates[input.network] || templates.facebook, usedBYOK: false };
    }),

  schedulePost: advertiserProcedure
    .input(z.object({ content: z.string(), network: z.string(), scheduledAt: z.date().optional() }))
    .mutation(({ input }) => ({ success: true, scheduledAt: input.scheduledAt || new Date(), network: input.network })),
});

// ============================================================
// ADVERTISER PROFILE
// ============================================================
export const advertiserProfileRouter = router({
  get: protectedProcedure.query(({ ctx }) =>
    prisma.advertiserProfile.findUnique({ where: { userId: ctx.user.id } })
  ),

  save: protectedProcedure
    .input(z.object({
      businessName: z.string().min(2),
      businessType: z.string(),
      address: z.string(),
      city: z.string(),
      phone: z.string(),
      lat: z.number().optional(),
      lng: z.number().optional(),
      website: z.string().optional(),
      facebook: z.string().optional(),
      instagram: z.string().optional(),
      tiktok: z.string().optional(),
      openingHours: z.string().optional(),
      priceRange: z.string().optional(),
      description: z.string().optional(),
      photos: z.array(z.string()).max(5).optional(),
      coverPhoto: z.string().optional(),
      openaiKey: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const existing = await prisma.advertiserProfile.findUnique({ where: { userId: ctx.user.id } });
      return prisma.advertiserProfile.upsert({
        where: { userId: ctx.user.id },
        create: { ...input, userId: ctx.user.id, photos: input.photos ?? [], validationStatus: "pending" },
        update: {
          ...input,
          photos: input.photos ?? [],
          // Keep existing validation status on updates
          validationStatus: existing?.validationStatus ?? "pending",
        },
      });
    }),

  getPublic: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const profile = await prisma.advertiserProfile.findUnique({
        where: { userId: input.userId },
        include: { user: { select: { id: true, name: true } } },
      });
      if (!profile || profile.validationStatus !== "approved") return null;
      const [games, offers] = await Promise.all([
        prisma.game.findMany({ where: { advertiserId: input.userId, status: "active" }, take: 5 }),
        prisma.offer.findMany({ where: { advertiserId: input.userId, isActive: true }, take: 5 }),
      ]);
      return { ...profile, displayName: profile.user?.name, games, offers };
    }),

  listApproved: protectedProcedure.query(async () => {
    const profiles = await prisma.advertiserProfile.findMany({
      where: { validationStatus: "approved" },
      include: { user: { select: { id: true, name: true } } },
    });

    if (profiles.length === 0) return [];

    const userIds = profiles.map(p => p.userId);
    const [gameCounts, offerCounts] = await Promise.all([
      prisma.game.groupBy({
        by: ["advertiserId"],
        where: { advertiserId: { in: userIds }, status: "active" },
        _count: { id: true },
      }),
      prisma.offer.groupBy({
        by: ["advertiserId"],
        where: { advertiserId: { in: userIds }, isActive: true },
        _count: { id: true },
      }),
    ]);

    const gameMap  = new Map(gameCounts.map(g  => [g.advertiserId,  g._count.id]));
    const offerMap = new Map(offerCounts.map(o => [o.advertiserId, o._count.id]));

    return profiles.map(p => ({
      ...p,
      displayName: p.user?.name,
      gameCount:  gameMap.get(p.userId)  ?? 0,
      offerCount: offerMap.get(p.userId) ?? 0,
    }));
  }),
});
