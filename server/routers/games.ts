import { z } from "zod";
import { router, protectedProcedure, advertiserProcedure, adminProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { Prisma } from "@prisma/client";
import prisma from "../prisma";

const gameInclude = {
  gameCities: { select: { cityId: true } },
  advertiser: { select: { id: true, name: true } },
} as const;

const mapGame = (g: any) => ({
  ...g,
  cities: g.gameCities.map((gc: any) => gc.cityId),
  gameCities: undefined,
});

export const gamesRouter = router({

  // List active games — paginated
  listActive: protectedProcedure
    .input(z.object({
      cityId: z.number().optional(),
      limit:  z.number().min(1).max(50).default(20),
      cursor: z.number().optional(), // last game id for cursor pagination
    }))
    .query(async ({ input }) => {
      const games = await prisma.game.findMany({
        where: {
          status: "active",
          endDate: { gte: new Date() },
          ...(input.cityId ? { gameCities: { some: { cityId: input.cityId } } } : {}),
        },
        include: gameInclude,
        take: input.limit + 1,
        ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
        orderBy: { createdAt: "desc" },
      });
      const hasMore = games.length > input.limit;
      const items = hasMore ? games.slice(0, -1) : games;
      return {
        items: items.map(mapGame),
        nextCursor: hasMore ? items[items.length - 1].id : undefined,
      };
    }),

  // Games by advertiser — paginated
  listByAdvertiser: advertiserProcedure
    .input(z.object({ limit: z.number().min(1).max(50).default(20), cursor: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const games = await prisma.game.findMany({
        where: { advertiserId: ctx.user.id },
        include: gameInclude,
        take: input.limit + 1,
        ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
        orderBy: { createdAt: "desc" },
      });
      const hasMore = games.length > input.limit;
      const items = hasMore ? games.slice(0, -1) : games;
      return { items: items.map(mapGame), nextCursor: hasMore ? items[items.length - 1].id : undefined };
    }),

  // Get single game
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const g = await prisma.game.findUnique({ where: { id: input.id }, include: gameInclude });
      if (!g) throw new TRPCError({ code: "NOT_FOUND", message: "Jeu introuvable" });
      return mapGame(g);
    }),

  // Create game
  create: advertiserProcedure
    .input(z.object({
      title: z.string().min(3),
      description: z.string(),
      type: z.enum(["qr_code","quiz","lucky_draw","treasure_hunt","advent","wheel","scratch","memory","vote","photo"]),
      startDate: z.date(),
      endDate: z.date(),
      maxParticipations: z.number().min(1),
      participationFrequency: z.enum(["once","daily","unlimited"]),
      winCondition: z.enum(["random","first","score"]),
      lots: z.array(z.object({ name: z.string(), quantity: z.number(), description: z.string() })),
      associatedAdId: z.number().optional(),
      cities: z.array(z.number()),
      displayFrequency: z.string(),
      wheelConfig: z.any().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { cities, lots, ...rest } = input;
      const g = await prisma.game.create({
        data: {
          ...rest,
          advertiserId: ctx.user.id,
          lots: lots as any,
          status: "pending",
          totalParticipations: 0,
          gameCities: { create: cities.map(cityId => ({ cityId })) },
        },
        include: gameInclude,
      });
      return mapGame(g);
    }),

  // Update game
  update: advertiserProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().optional(),
      description: z.string().optional(),
      status: z.enum(["draft","active","ended"]).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const existing = await prisma.game.findFirst({ where: { id: input.id, advertiserId: ctx.user.id } });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
      const { id, ...data } = input;
      const g = await prisma.game.update({ where: { id }, data, include: gameInclude });
      return mapGame(g);
    }),

  // Admin: list pending — paginated
  listPending: adminProcedure
    .input(z.object({ limit: z.number().default(20), cursor: z.number().optional() }))
    .query(async ({ input }) => {
      const games = await prisma.game.findMany({
        where: { status: "pending" },
        include: gameInclude,
        take: input.limit + 1,
        ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
        orderBy: { createdAt: "desc" },
      });
      const hasMore = games.length > input.limit;
      const items = hasMore ? games.slice(0, -1) : games;
      return { items: items.map(mapGame), nextCursor: hasMore ? items[items.length - 1].id : undefined };
    }),

  // Admin: approve / reject
  approve: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const g = await prisma.game.update({ where: { id: input.id }, data: { status: "active" }, include: gameInclude });
      return mapGame(g);
    }),

  reject: adminProcedure
    .input(z.object({ id: z.number(), reason: z.string().optional() }))
    .mutation(async ({ input }) => {
      const g = await prisma.game.update({ where: { id: input.id }, data: { status: "rejected", rejectionReason: input.reason ?? null }, include: gameInclude });
      return mapGame(g);
    }),

  // ── Participate ────────────────────────────────────────────────
  // Race condition fix: rely on the DB unique constraint @@unique([userId, gameId])
  // instead of a check-then-insert pattern.
  participate: protectedProcedure
    .input(z.object({
      gameId: z.number(),
      name:   z.string(),
      email:  z.string().email(),
      phone:  z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const game = await prisma.game.findFirst({
        where: { id: input.gameId, status: "active", endDate: { gte: new Date() } },
      });
      if (!game) throw new TRPCError({ code: "NOT_FOUND", message: "Jeu introuvable ou inactif" });

      // For "daily" frequency, check if user already participated today
      if (game.participationFrequency === "daily") {
        const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
        const existing = await prisma.participation.findFirst({
          where: { userId: ctx.user.id, gameId: input.gameId, createdAt: { gte: todayStart } },
        });
        if (existing) throw new TRPCError({ code: "CONFLICT", message: "Vous avez déjà participé aujourd'hui" });
      }

      const participationNumber = `ADG-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

      try {
        const [participation] = await prisma.$transaction([
          prisma.participation.create({
            data: { userId: ctx.user.id, gameId: input.gameId, status: "pending", participationNumber },
          }),
          prisma.game.update({ where: { id: input.gameId }, data: { totalParticipations: { increment: 1 } } }),
        ]);

        // Notification is outside the transaction — non-critical
        prisma.notification.create({
          data: {
            userId: ctx.user.id,
            title: "Participation enregistrée !",
            message: `Votre participation au jeu "${game.title}" a bien été enregistrée. N° ${participationNumber}`,
            type: "game",
          },
        }).catch(() => {}); // fire-and-forget

        return { ...participation, game: { title: game.title }, drawDate: game.endDate };

      } catch (err: unknown) {
        // Catch unique constraint violation = "once" frequency double-participation
        if (
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === "P2002" &&
          (err.meta?.target as string[])?.includes("unique_user_game_once")
        ) {
          throw new TRPCError({ code: "CONFLICT", message: "Vous avez déjà participé à ce jeu" });
        }
        throw err;
      }
    }),

  // My participations — paginated
  myParticipations: protectedProcedure
    .input(z.object({ limit: z.number().default(20), cursor: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const items = await prisma.participation.findMany({
        where: { userId: ctx.user.id },
        include: { game: { include: gameInclude } },
        take: input.limit + 1,
        ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
        orderBy: { createdAt: "desc" },
      });
      const hasMore = items.length > input.limit;
      return { items: hasMore ? items.slice(0, -1) : items, nextCursor: hasMore ? items[items.length - 2]?.id : undefined };
    }),
});
