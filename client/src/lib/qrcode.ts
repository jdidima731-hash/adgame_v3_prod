/**
 * QR Code generation utilities.
 * Uses QR Server API (free, no key needed).
 * In production with high volume: switch to local 'qrcode' npm package.
 */

const APP_URL = (import.meta as any).env?.VITE_APP_URL ?? "https://adgame.tn";

export function generateQrUrl(data: string, size: number = 200): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}&color=000000&bgcolor=FFFFFF&margin=4`;
}

export function getGameQrUrl(gameId: number): string {
  return generateQrUrl(`${APP_URL}/wheel/${gameId}`);
}

export function getPartnerQrUrl(userId: number): string {
  return generateQrUrl(`${APP_URL}/partner/${userId}`);
}

export function getPromoQrUrl(promoCode: string): string {
  return generateQrUrl(`${APP_URL}/promotions?code=${promoCode}`);
}
