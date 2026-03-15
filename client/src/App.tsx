import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import ErrorBoundary from "./components/ErrorBoundary";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleRedirect from "./components/RoleRedirect";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";

// Public pages
import Home from "./pages/Home";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentFailed from "./pages/PaymentFailed";

// User pages
import Dashboard from "./pages/Dashboard";
import Promotions from "./pages/Promotions";
import WheelGame from "./pages/WheelGame";
import Quiz from "./pages/Quiz";
import Profile from "./pages/Profile";
import History from "./pages/History";
import Messages from "./pages/Messages";
import Notifications from "./pages/Notifications";
import QrScanner from "./pages/QrScanner";
import ScratchGame from "./pages/ScratchGame";
import MemoryGame from "./pages/MemoryGame";
import VoteGame from "./pages/VoteGame";
import PhotoContest from "./pages/PhotoContest";
import Partners from "./pages/Partners";
import Reservations from "./pages/Reservations";
import BroadcastViewer from "./pages/BroadcastViewer";
import PartnerPublicPage from "./pages/PartnerPublicPage";
import PartnerDashboard from "./pages/PartnerDashboard";

// Advertiser pages
import AdvertiserDashboard from "./pages/AdvertiserDashboard";
import AdvertiserProfile from "./pages/AdvertiserProfile";
import Ads from "./pages/Ads";
import GameWizard from "./pages/GameWizard";
import GameContracts from "./pages/GameContracts";
import SocialMediaManager from "./pages/SocialMediaManager";
import BroadcastManager from "./pages/BroadcastManager";
import SubscriptionManager from "./pages/SubscriptionManager";
import CoverageSelector from "./pages/CoverageSelector";

// Admin pages
import AdminPanel from "./pages/AdminPanel";
import SubscriptionAdmin from "./pages/SubscriptionAdmin";

import { Route, Switch } from "wouter";

function Router() {
  return (
    <Switch>
      {/* Root: auto-redirect by role */}
      <Route path="/"><RoleRedirect /></Route>

      {/* Public */}
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/home" component={Home} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />

      {/* Payment callbacks (public — Flouci redirects here after checkout) */}
      <Route path="/payment/success" component={PaymentSuccess} />
      <Route path="/payment/failed" component={PaymentFailed} />

      {/* User routes */}
      <Route path="/dashboard"><ProtectedRoute><Dashboard /></ProtectedRoute></Route>
      <Route path="/promotions"><ProtectedRoute><Promotions /></ProtectedRoute></Route>
      <Route path="/partners"><ProtectedRoute><Partners /></ProtectedRoute></Route>
      <Route path="/partner/dashboard"><ProtectedRoute allowedRoles={["partner","admin"]}><PartnerDashboard /></ProtectedRoute></Route>
      <Route path="/partner/:userId"><ProtectedRoute><PartnerPublicPage /></ProtectedRoute></Route>
      <Route path="/profile"><ProtectedRoute><Profile /></ProtectedRoute></Route>
      <Route path="/history"><ProtectedRoute><History /></ProtectedRoute></Route>
      <Route path="/messages"><ProtectedRoute><Messages /></ProtectedRoute></Route>
      <Route path="/messages/:conversationId"><ProtectedRoute><Messages /></ProtectedRoute></Route>
      <Route path="/notifications"><ProtectedRoute><Notifications /></ProtectedRoute></Route>
      <Route path="/qr-scan"><ProtectedRoute><QrScanner /></ProtectedRoute></Route>
      <Route path="/reservations"><ProtectedRoute><Reservations /></ProtectedRoute></Route>
      <Route path="/reservations/new"><ProtectedRoute><Reservations /></ProtectedRoute></Route>
      <Route path="/broadcast"><ProtectedRoute><BroadcastViewer /></ProtectedRoute></Route>

      {/* Game routes */}
      <Route path="/wheel"><ProtectedRoute><WheelGame /></ProtectedRoute></Route>
      <Route path="/wheel/:gameId"><ProtectedRoute><WheelGame /></ProtectedRoute></Route>
      <Route path="/quiz"><ProtectedRoute><Quiz /></ProtectedRoute></Route>
      <Route path="/quiz/:gameId"><ProtectedRoute><Quiz /></ProtectedRoute></Route>
      <Route path="/scratch"><ProtectedRoute><ScratchGame /></ProtectedRoute></Route>
      <Route path="/scratch/:gameId"><ProtectedRoute><ScratchGame /></ProtectedRoute></Route>
      <Route path="/memory"><ProtectedRoute><MemoryGame /></ProtectedRoute></Route>
      <Route path="/memory/:gameId"><ProtectedRoute><MemoryGame /></ProtectedRoute></Route>
      <Route path="/vote"><ProtectedRoute><VoteGame /></ProtectedRoute></Route>
      <Route path="/vote/:gameId"><ProtectedRoute><VoteGame /></ProtectedRoute></Route>
      <Route path="/photo"><ProtectedRoute><PhotoContest /></ProtectedRoute></Route>
      <Route path="/photo/:gameId"><ProtectedRoute><PhotoContest /></ProtectedRoute></Route>
      <Route path="/games/:gameId"><ProtectedRoute><WheelGame /></ProtectedRoute></Route>

      {/* Advertiser routes */}
      <Route path="/advertiser/dashboard"><ProtectedRoute allowedRoles={["advertiser","admin"]}><AdvertiserDashboard /></ProtectedRoute></Route>
      <Route path="/advertiser/profile"><ProtectedRoute allowedRoles={["advertiser","admin"]}><AdvertiserProfile /></ProtectedRoute></Route>
      <Route path="/advertiser/games/new"><ProtectedRoute allowedRoles={["advertiser","admin"]}><GameWizard /></ProtectedRoute></Route>
      <Route path="/advertiser/games"><ProtectedRoute allowedRoles={["advertiser","admin"]}><AdvertiserDashboard /></ProtectedRoute></Route>
      <Route path="/advertiser/contracts"><ProtectedRoute allowedRoles={["advertiser","admin"]}><GameContracts /></ProtectedRoute></Route>
      <Route path="/advertiser/social"><ProtectedRoute allowedRoles={["advertiser","admin"]}><SocialMediaManager /></ProtectedRoute></Route>
      <Route path="/advertiser/subscription"><ProtectedRoute allowedRoles={["advertiser","admin"]}><SubscriptionManager /></ProtectedRoute></Route>
      <Route path="/advertiser/subscriptions"><ProtectedRoute allowedRoles={["advertiser","admin"]}><SubscriptionManager /></ProtectedRoute></Route>
      <Route path="/advertiser/coverage"><ProtectedRoute allowedRoles={["advertiser","admin"]}><CoverageSelector /></ProtectedRoute></Route>
      <Route path="/ads"><ProtectedRoute allowedRoles={["advertiser","admin"]}><Ads /></ProtectedRoute></Route>
      <Route path="/advertiser/ads/new"><ProtectedRoute allowedRoles={["advertiser","admin"]}><Ads /></ProtectedRoute></Route>
      <Route path="/advertiser/broadcast"><ProtectedRoute allowedRoles={["advertiser","admin"]}><BroadcastManager /></ProtectedRoute></Route>

      {/* Admin routes */}
      <Route path="/admin"><ProtectedRoute allowedRoles={["admin"]}><AdminPanel /></ProtectedRoute></Route>
      <Route path="/admin/broadcast"><ProtectedRoute allowedRoles={["admin"]}><BroadcastManager /></ProtectedRoute></Route>
      <Route path="/admin/subscriptions"><ProtectedRoute allowedRoles={["admin"]}><SubscriptionAdmin /></ProtectedRoute></Route>

      {/* 404 */}
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ThemeProvider defaultTheme="light" switchable={true}>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;

