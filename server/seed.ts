/**
 * AdGame Pro — Seed PostgreSQL
 * Run: npx tsx server/seed.ts
 *
 * Inserts all demo accounts and sample data into the DB.
 */
import { PrismaClient, UserRole, GameStatus, AdStatus, ValidationStatus, BoxStatus, SubscriptionStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱  Seeding AdGame database…\n");

  // ── Clean existing data (order respects FK constraints) ─────────────
  await prisma.broadcastFluxGame.deleteMany();
  await prisma.broadcastFluxAd.deleteMany();
  await prisma.broadcastFluxCity.deleteMany();
  await prisma.broadcastFlux.deleteMany();
  await prisma.message.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.participation.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.offer.deleteMany();
  await prisma.gameCity.deleteMany();
  await prisma.game.deleteMany();
  await prisma.ad.deleteMany();
  await prisma.box.deleteMany();
  await prisma.partner.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.advertiserProfile.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
  await prisma.city.deleteMany();
  console.log("  ✓ Cleaned existing data");

  // ── Cities ───────────────────────────────────────────────────────────
  const cities = await Promise.all([
    prisma.city.create({ data: { id: 1, name: "Tunis",   country: "TN" } }),
    prisma.city.create({ data: { id: 2, name: "Sfax",    country: "TN" } }),
    prisma.city.create({ data: { id: 3, name: "Sousse",  country: "TN" } }),
    prisma.city.create({ data: { id: 4, name: "Bizerte", country: "TN" } }),
    prisma.city.create({ data: { id: 5, name: "Gabès",   country: "TN" } }),
    prisma.city.create({ data: { id: 6, name: "Paris",   country: "FR", isForeignCity: true } }),
    prisma.city.create({ data: { id: 7, name: "Lyon",    country: "FR", isForeignCity: true } }),
  ]);
  console.log(`  ✓ ${cities.length} cities`);

  // ── Users ────────────────────────────────────────────────────────────
  const hash = (p: string) => bcrypt.hashSync(p, 10);

  const admin = await prisma.user.create({ data: {
    name: "Admin AdGame", email: "admin@adgame.com",
    passwordHash: hash("Admin123!"), role: UserRole.admin,
    isValidated: true, isBlocked: false,
    createdAt: new Date("2026-01-01"),
  }});

  const advertiser = await prisma.user.create({ data: {
    name: "Restaurant Délice", email: "advertiser@adgame.com",
    passwordHash: hash("Advertiser123!"), role: UserRole.advertiser,
    phone: "+216 71 123 456", isValidated: true, isBlocked: false,
    createdAt: new Date("2026-01-15"),
  }});

  const userDemo = await prisma.user.create({ data: {
    name: "Ahmed Ben Salem", email: "user@adgame.com",
    passwordHash: hash("User123!"), role: UserRole.user,
    phone: "+216 99 999 999", isValidated: true, isBlocked: false,
    createdAt: new Date("2026-03-01"),
  }});

  const partner = await prisma.user.create({ data: {
    name: "Coiffure Linda", email: "partner@adgame.com",
    passwordHash: hash("Partner123!"), role: UserRole.partner,
    phone: "+216 71 456 789", isValidated: true, isBlocked: false,
    createdAt: new Date("2026-01-20"),
  }});

  const leila = await prisma.user.create({ data: {
    name: "Leïla Mansour", email: "leila@example.com",
    passwordHash: hash("User123!"), role: UserRole.user,
    phone: "+216 55 111 222", isValidated: true, isBlocked: false,
    createdAt: new Date("2026-02-10"),
  }});

  const ecole = await prisma.user.create({ data: {
    name: "École Elite", email: "ecole@example.com",
    passwordHash: hash("Advertiser123!"), role: UserRole.advertiser,
    phone: "+216 71 789 000", isValidated: false, isBlocked: false,
    createdAt: new Date("2026-03-10"),
  }});
  console.log("  ✓ 6 users");

  // ── Advertiser profiles ──────────────────────────────────────────────
  const advProfile = await prisma.advertiserProfile.create({ data: {
    userId: advertiser.id,
    businessName: "Restaurant Délice",
    businessType: "Restaurant",
    address: "71 Avenue Bourguiba, Tunis",
    city: "Tunis",
    lat: 36.8008, lng: 10.1800,
    phone: "+216 71 123 456",
    facebook: "restaurant.delice.tn",
    instagram: "delice_officiel",
    openingHours: JSON.stringify({ lun:"11h-22h", mar:"11h-22h", mer:"11h-22h", jeu:"11h-22h", ven:"11h-23h", sam:"12h-23h", dim:"Fermé" }),
    priceRange: "€€",
    description: "Restaurant traditionnel tunisien au cœur de Tunis. Spécialités couscous, tajine et grillades.",
    photos: [],
    validationStatus: ValidationStatus.approved,
    validatedById: admin.id,
    validatedAt: new Date("2026-01-16"),
  }});

  await prisma.advertiserProfile.create({ data: {
    userId: ecole.id,
    businessName: "École Elite",
    businessType: "Éducation",
    address: "15 Rue de l'École, Sfax",
    city: "Sfax",
    phone: "+216 71 789 000",
    photos: [],
    validationStatus: ValidationStatus.pending,
  }});
  console.log("  ✓ 2 advertiser profiles");

  // ── Partner profiles ─────────────────────────────────────────────────
  const partnerRecord = await prisma.partner.create({ data: {
    userId: partner.id,
    businessName: "Coiffure Linda",
    address: "15 Avenue Habib Bourguiba, Tunis",
    city: "Tunis",
    lat: 36.8190, lng: 10.1658,
    category: "Coiffeur",
    phone: "+216 71 456 789",
    rating: 4.8, reviewCount: 124,
    isActive: true, isOpen: true,
  }});

  const advPartner = await prisma.partner.create({ data: {
    userId: advertiser.id,
    businessName: "Restaurant Délice",
    address: "71 Avenue Bourguiba, Tunis",
    city: "Tunis",
    lat: 36.8008, lng: 10.1800,
    category: "Restaurant",
    phone: "+216 71 123 456",
    rating: 4.5, reviewCount: 89,
    isActive: true, isOpen: true,
  }});
  console.log("  ✓ 2 partners");

  // ── Ads ──────────────────────────────────────────────────────────────
  const ad1 = await prisma.ad.create({ data: {
    title: "Promo Ramadan",
    description: "Restaurant Le Délice, -20% sur plats à emporter",
    advertiserId: advertiser.id,
    status: AdStatus.approved,
    type: "ai",
    duration: 30,
    aiScore: 98,
    createdAt: new Date("2026-02-20"),
  }});

  const ad2 = await prisma.ad.create({ data: {
    title: "Menu soir",
    description: "Découvrez notre menu du soir",
    advertiserId: advertiser.id,
    status: AdStatus.approved,
    type: "template",
    duration: 30,
    createdAt: new Date("2026-03-05"),
  }});

  const ad3 = await prisma.ad.create({ data: {
    title: "Consultation offerte",
    description: "Clinique Santé - 1ère consultation offerte",
    advertiserId: advertiser.id,
    status: AdStatus.pending,
    type: "upload",
    duration: 45,
    createdAt: new Date("2026-03-13"),
  }});
  console.log("  ✓ 3 ads");

  // ── Games ─────────────────────────────────────────────────────────────
  const game1 = await prisma.game.create({ data: {
    title: "iPhone 15 à gagner",
    description: "Tentez de gagner un iPhone 15 en scannant le QR code",
    type: "qr_code",
    status: GameStatus.active,
    advertiserId: advertiser.id,
    startDate: new Date("2026-03-01"),
    endDate: new Date("2026-04-30"),
    maxParticipations: 2000,
    participationFrequency: "once",
    winCondition: "random",
    lots: [{ id:1, name:"iPhone 15", quantity:1, description:"Dernier modèle" }, { id:2, name:"Bon d'achat 100 DT", quantity:5, description:"Valable sur tout" }],
    associatedAdId: ad1.id,
    displayFrequency: "10min",
    totalParticipations: 1247,
    qrCodeUrl: "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://adgame.tn/wheel/1",
    gameCities: { create: [{ cityId: 1 }, { cityId: 2 }] },
    createdAt: new Date("2026-02-28"),
  }});

  const game2 = await prisma.game.create({ data: {
    title: "Bons d'achat 100 DT",
    description: "Participez et gagnez des bons d'achat",
    type: "lucky_draw",
    status: GameStatus.active,
    advertiserId: advertiser.id,
    startDate: new Date("2026-03-10"),
    endDate: new Date("2026-05-20"),
    maxParticipations: 1000,
    participationFrequency: "once",
    winCondition: "random",
    lots: [{ id:3, name:"Bon d'achat 100 DT", quantity:10, description:"Chez Coiffure Linda" }],
    displayFrequency: "30min",
    totalParticipations: 847,
    gameCities: { create: [{ cityId: 1 }] },
    createdAt: new Date("2026-03-09"),
  }});

  await prisma.game.create({ data: {
    title: "Réduction 20%",
    description: "Gagnez une réduction de 20%",
    type: "wheel",
    status: GameStatus.pending,
    advertiserId: advertiser.id,
    startDate: new Date("2026-04-01"),
    endDate: new Date("2026-06-15"),
    maxParticipations: 500,
    participationFrequency: "once",
    winCondition: "random",
    lots: [{ id:4, name:"Réduction 20%", quantity:50, description:"Sur présentation du code" }],
    displayFrequency: "1h",
    totalParticipations: 0,
    wheelConfig: { segments:["20%","Perdu","10%","Perdu","50 DT","Perdu","30%","Perdu"], colors:["#7c3aed","#e5e7eb","#2563eb","#e5e7eb","#059669","#e5e7eb","#d97706","#e5e7eb"] },
    gameCities: { create: [{ cityId: 1 }] },
    createdAt: new Date("2026-03-14"),
  }});
  console.log("  ✓ 3 games");

  // ── Participations ────────────────────────────────────────────────────
  await prisma.participation.createMany({ data: [
    { userId: userDemo.id, gameId: game1.id, status: "pending", participationNumber: "ADG-8472", createdAt: new Date("2026-03-14") },
    { userId: userDemo.id, gameId: game2.id, status: "won", participationNumber: "ADG-8201", lotWon: "Bon d'achat 100 DT", createdAt: new Date("2026-03-12") },
  ]});
  console.log("  ✓ 2 participations");

  // ── Offers ────────────────────────────────────────────────────────────
  await prisma.offer.createMany({ data: [
    {
      advertiserId: advertiser.id,
      title: "-20% sur plats à emporter",
      description: "Réduction valable sur tous les plats à emporter",
      conditions: "Non cumulable avec d'autres offres. Valable du lundi au vendredi.",
      type: "percentage",
      discount: 20,
      promoCode: "DELICE20",
      badgeText: "-20%",
      startDate: new Date("2026-03-01"),
      endDate: new Date("2026-04-30"),
      usageCount: 124,
      isActive: true,
    },
    {
      advertiserId: advertiser.id,
      title: "1 coupe offerte pour 2 achetées",
      description: "Offre valable sur toutes les coupes",
      conditions: "Sur présentation du code. 1 fois par client.",
      type: "buy_one_get_one",
      discount: 0,
      promoCode: "COUPE2",
      badgeText: "2+1",
      startDate: new Date("2026-03-01"),
      endDate: new Date("2026-05-15"),
      usageCount: 87,
      isActive: true,
    },
  ]});
  console.log("  ✓ 2 offers");

  // ── Broadcast Fluxes ──────────────────────────────────────────────────
  const flux1 = await prisma.broadcastFlux.create({ data: {
    name: "Flux Tunis Principal",
    description: "Flux principal pour la ville de Tunis",
    isActive: true,
    streamUrl: "https://stream.adgame.tn/tunis/playlist.m3u8",
    createdAt: new Date("2026-01-01"),
    fluxCities: { create: [{ cityId: 1 }] },
    fluxAds:    { create: [{ adId: ad1.id, order: 1 }, { adId: ad2.id, order: 2 }] },
    fluxGames:  { create: [{ gameId: game1.id }, { gameId: game2.id }] },
  }});

  const flux2 = await prisma.broadcastFlux.create({ data: {
    name: "Flux Sfax",
    description: "Flux pour Sfax et région",
    isActive: false,
    createdAt: new Date("2026-02-01"),
    fluxCities: { create: [{ cityId: 2 }] },
    fluxAds:    { create: [{ adId: ad1.id, order: 1 }] },
    fluxGames:  { create: [{ gameId: game1.id }] },
  }});
  console.log("  ✓ 2 broadcast fluxes");

  // ── Boxes ─────────────────────────────────────────────────────────────
  await prisma.box.createMany({ data: [
    { name: "Box Linda 01",    ipAddress: "192.168.1.100", cityId: 1, partnerId: partnerRecord.id, isOnline: true,  status: BoxStatus.active,  assignedFluxId: flux1.id, lastSeen: new Date() },
    { name: "Box Linda 02",    ipAddress: "192.168.1.101", cityId: 1, partnerId: partnerRecord.id, isOnline: false, status: BoxStatus.offline, lastSeen: new Date(Date.now() - 3600000) },
    { name: "Box Délice 01",   ipAddress: "192.168.2.100", cityId: 1, partnerId: advPartner.id,    isOnline: true,  status: BoxStatus.active,  assignedFluxId: flux1.id, lastSeen: new Date() },
    { name: "Box Sfax Centre", ipAddress: "192.168.3.10",  cityId: 2, isOnline: false, status: BoxStatus.maintenance, lastSeen: new Date(Date.now() - 86400000), notes: "Mise à jour firmware" },
  ]});
  console.log("  ✓ 4 boxes");

  // ── Messages ─────────────────────────────────────────────────────────
  await prisma.message.createMany({ data: [
    { fromUserId: userDemo.id, toUserId: advertiser.id, content: "Bonjour, je suis intéressé par votre offre Ramadan", isRead: false, createdAt: new Date(Date.now() - 300000) },
    { fromUserId: leila.id,    toUserId: advertiser.id, content: "Puis-je réserver pour samedi ?", isRead: false, createdAt: new Date(Date.now() - 7200000) },
    { fromUserId: partner.id,  toUserId: advertiser.id, content: "L'écran fonctionne parfaitement, merci !", isRead: true, createdAt: new Date(Date.now() - 86400000) },
  ]});
  console.log("  ✓ 3 messages");

  // ── Reservations ──────────────────────────────────────────────────────
  await prisma.reservation.createMany({ data: [
    { userId: userDemo.id, partnerId: partnerRecord.id, service: "Coupe homme", price: 35, duration: 30, date: new Date("2026-03-20T10:30:00"), status: "confirmed" },
    { userId: leila.id,    partnerId: partnerRecord.id, service: "Coupe femme", price: 45, duration: 45, date: new Date("2026-03-20T14:00:00"), status: "confirmed" },
  ]});
  console.log("  ✓ 2 reservations");

  // ── Notifications ─────────────────────────────────────────────────────
  await prisma.notification.createMany({ data: [
    { userId: userDemo.id, title: "Participation enregistrée", message: "Votre participation au jeu iPhone 15 a été enregistrée !", type: "game", isRead: false, createdAt: new Date(Date.now() - 600000) },
    { userId: userDemo.id, title: "🎉 Félicitations !", message: "Vous avez gagné un bon d'achat 100 DT chez Coiffure Linda !", type: "game", isRead: true, createdAt: new Date("2026-03-12") },
    { userId: userDemo.id, title: "Nouvelle offre", message: "-20% sur vos plats à emporter chez Restaurant Délice", type: "offer", isRead: false, createdAt: new Date(Date.now() - 3600000) },
    { userId: admin.id,    title: "Nouvel annonceur inscrit", message: "École Elite (ecole@example.com) a créé un compte annonceur en attente de validation.", type: "validation", isRead: false, createdAt: new Date("2026-03-10") },
  ]});
  console.log("  ✓ 4 notifications");

  // ── Subscriptions ─────────────────────────────────────────────────────
  await prisma.subscription.createMany({ data: [
    { userId: advertiser.id, planId: "pro",     planName: "Pro",     amount: 600, status: SubscriptionStatus.active,    startDate: new Date("2026-01-01"), nextBillingDate: new Date("2026-04-01"), paidAt: new Date("2026-01-01") },
    { userId: ecole.id,      planId: "starter", planName: "Starter", amount: 350, status: SubscriptionStatus.suspended, startDate: new Date("2026-03-10"), nextBillingDate: new Date("2026-04-10") },
  ]});
  console.log("  ✓ 2 subscriptions");

  console.log("\n✅  Seed complete!\n");
  console.log("  Demo accounts:");
  console.log("  ├─ admin@adgame.com      / Admin123!        → /admin");
  console.log("  ├─ advertiser@adgame.com / Advertiser123!   → /advertiser/dashboard");
  console.log("  ├─ partner@adgame.com    / Partner123!      → /partner/dashboard");
  console.log("  └─ user@adgame.com       / User123!         → /dashboard");
}

main()
  .catch((e) => { console.error("❌ Seed error:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
