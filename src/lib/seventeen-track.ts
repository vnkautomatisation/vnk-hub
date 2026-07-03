const BASE = "https://api.17track.net/track/v2.2";

export const TRACK_TAGS: Record<number, { label: string; status: string; color: string }> = {
  0:  { label: "Introuvable",       status: "not_found",    color: "#94A3B8" },
  10: { label: "En transit",        status: "in_transit",   color: "#60A5FA" },
  20: { label: "Expiré",            status: "expired",      color: "#FB923C" },
  30: { label: "En livraison",      status: "out_delivery", color: "#A78BFA" },
  35: { label: "Échec livraison",   status: "failed",       color: "#F87171" },
  40: { label: "Livré",             status: "delivered",    color: "#4ADE80" },
  50: { label: "Exception",         status: "exception",    color: "#F87171" },
};

export type SeventeenTrackEvent = {
  time_utc: string;
  description: string;
  location?: string;
  stage?: string;
};

export type SeventeenTrackInfo = {
  number: string;
  carrier: number;
  tag: number;
  track_info: {
    latest_status: { status: string; sub_status?: string };
    latest_event: SeventeenTrackEvent;
    tracking: {
      providers: Array<{
        provider: { key: number; name: string };
        events: SeventeenTrackEvent[];
      }>;
    };
  };
};

export type SeventeenTrackWebhookPayload = {
  event: string;
  data: SeventeenTrackInfo;
};

async function call(apiKey: string, path: string, body: unknown) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "17token": apiKey },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`17track HTTP ${res.status}`);
  return res.json();
}

export async function registerTracking(apiKey: string, trackingNumber: string): Promise<{
  accepted: boolean;
  carrier?: number;
  error?: string;
}> {
  try {
    const json = await call(apiKey, "/register", [{ number: trackingNumber }]);
    if (json.data?.accepted?.length > 0) {
      return { accepted: true, carrier: json.data.accepted[0].carrier };
    }
    if (json.data?.rejected?.length > 0) {
      const err = json.data.rejected[0].error;
      // -18019901 = already registered → treat as success
      if (err?.code === -18019901) return { accepted: true };
      return { accepted: false, error: err?.message ?? "Rejeté par 17track" };
    }
    return { accepted: false, error: "Réponse inattendue" };
  } catch (e) {
    return { accepted: false, error: String(e) };
  }
}

export async function getTrackingInfo(apiKey: string, trackingNumber: string): Promise<SeventeenTrackInfo | null> {
  try {
    const json = await call(apiKey, "/gettrackinfo", [{ number: trackingNumber }]);
    return json.data?.accepted?.[0] ?? null;
  } catch {
    return null;
  }
}

// Map 17track tag → our OrderStatus (only advance, never go backward)
export function tagToOrderStatus(tag: number): string | null {
  switch (tag) {
    case 10: // InTransit
    case 30: // OutForDelivery
      return "IN_TRANSIT";
    case 40: // Delivered
      return "DELIVERED";
    default:
      return null; // tag 0, 20, 35, 50 — don't auto-change status
  }
}

// Whether a tag transition should auto-advance a given current status
export function shouldAutoAdvance(currentStatus: string, tag: number): boolean {
  const target = tagToOrderStatus(tag);
  if (!target) return false;

  const order = ["PENDING", "CONFIRMED", "DISPATCHED_TO_SUPPLIER", "SHIPPED", "IN_TRANSIT", "DELIVERED"];
  const currentIdx = order.indexOf(currentStatus);
  const targetIdx = order.indexOf(target);

  // Only advance, never go backward, and only if order is trackable
  return targetIdx > currentIdx && currentIdx >= 0;
}

// Human-readable note to add on exception/failed/expired events
export function tagToNote(tag: number, latestEvent?: SeventeenTrackEvent): string | null {
  const desc = latestEvent?.description ?? "";
  const loc  = latestEvent?.location ? ` (${latestEvent.location})` : "";
  switch (tag) {
    case 35: return `Échec de livraison${loc}${desc ? ` — ${desc}` : ""}`;
    case 50: return `Exception tracking${loc}${desc ? ` — ${desc}` : ""}`;
    case 20: return `Tracking expiré — colis non retrouvé après délai maximum`;
    default: return null;
  }
}
