export type UserRole = "user" | "advertiser" | "partner" | "admin";

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  createdAt: Date;
}

export interface Game {
  id: number;
  title: string;
  description: string;
  type: "qr_code" | "quiz" | "lucky_draw" | "treasure_hunt" | "advent" | "wheel" | "scratch" | "memory" | "vote" | "photo";
  status: "draft" | "pending" | "active" | "ended";
  advertiserId: number;
  startDate: Date;
  endDate: Date;
  maxParticipations: number;
  participationFrequency: "once" | "daily" | "unlimited";
  winCondition: "random" | "first" | "score";
  lots: Lot[];
  associatedAdId?: number;
  cities: number[];
  displayFrequency: "10min" | "30min" | "1h";
  totalParticipations: number;
  createdAt: Date;
}

export interface Lot {
  id: number;
  gameId: number;
  name: string;
  quantity: number;
  description: string;
  showToParticipants: boolean;
}

export interface Ad {
  id: number;
  title: string;
  description: string;
  advertiserId: number;
  status: "draft" | "pending" | "approved" | "rejected";
  type: "ai" | "template" | "upload";
  videoUrl?: string;
  thumbnailUrl?: string;
  duration: number;
  style?: string;
  aiScore?: number;
  createdAt: Date;
}

export interface Participation {
  id: number;
  userId: number;
  gameId: number;
  status: "pending" | "won" | "lost";
  participationNumber: string;
  createdAt: Date;
  lotWon?: string;
}

export interface PromoOffer {
  id: number;
  advertiserId: number;
  title: string;
  type: "percentage" | "fixed" | "buy_one_get_one" | "gift";
  discount: number;
  promoCode: string;
  startDate: Date;
  endDate: Date;
  usageCount: number;
  isActive: boolean;
}

export interface Partner {
  id: number;
  userId: number;
  businessName: string;
  address: string;
  city: string;
  lat: number;
  lng: number;
  category: string;
  phone: string;
  openingHours: Record<string, string>;
  rating: number;
  reviewCount: number;
  isActive: boolean;
}

export interface AndroidBox {
  id: number;
  partnerId: number;
  name: string;
  ipAddress?: string;
  cityId?: number;
  isOnline: boolean;
  status: "active" | "offline" | "maintenance";
  lastSeen?: Date;
}

export interface Message {
  id: number;
  fromUserId: number;
  toUserId: number;
  content: string;
  isRead: boolean;
  createdAt: Date;
}

export interface Reservation {
  id: number;
  userId: number;
  partnerId: number;
  service: string;
  price: number;
  duration: number;
  date: Date;
  status: "pending" | "confirmed" | "cancelled";
}

export interface City {
  id: number;
  name: string;
  country: string;
  isForeignCity: boolean;
}
