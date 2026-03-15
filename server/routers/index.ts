import { router } from "../trpc";
import { authRouter } from "./auth";
import { gamesRouter } from "./games";
import { adsRouter } from "./ads";
import { adminRouter } from "./admin";
import { paymentRouter } from "./payments";
import {
  offersRouter, partnersRouter, messagesRouter, notificationsRouter,
  reservationsRouter, boxesRouter, broadcastRouter, citiesRouter,
  subscriptionRouter, socialAddonRouter, advertiserProfileRouter,
} from "./misc";

export const appRouter = router({
  auth:               authRouter,
  games:              gamesRouter,
  ads:                adsRouter,
  offers:             offersRouter,
  partners:           partnersRouter,
  messages:           messagesRouter,
  notifications:      notificationsRouter,
  reservations:       reservationsRouter,
  boxes:              boxesRouter,
  broadcast:          broadcastRouter,
  cities:             citiesRouter,
  subscriptions:      subscriptionRouter,
  payment:            paymentRouter,           // NEW — real Flouci payment
  socialAddon:        socialAddonRouter,
  admin:              adminRouter,
  advertiserProfile:  advertiserProfileRouter,
  // Backward-compat aliases for client pages that import old names
  subscriptionManager: subscriptionRouter,
  subscriptionAdmin:   subscriptionRouter,
  gameContracts:       gamesRouter,
});

export type AppRouter = typeof appRouter;

