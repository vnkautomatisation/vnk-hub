export type TrackingStatus = "PENDING" | "IN_TRANSIT" | "DELAYED" | "BLOCKED" | "DELIVERED";

export type TrackingResult = {
  trackingNumber: string;
  status: TrackingStatus;
  carrier: string;
  events: { status: string; location: string; occurredAt: string }[];
};

// Mock implementation — replace with real 17Track API calls once SEVENTEEN_TRACK_API_KEY is set.
export async function getTracking(trackingNumber: string): Promise<TrackingResult> {
  return {
    trackingNumber,
    status: "IN_TRANSIT",
    carrier: "China Post",
    events: [
      { status: "Order picked up", location: "Shenzhen, CN", occurredAt: new Date(Date.now() - 86400000 * 3).toISOString() },
      { status: "Departed origin facility", location: "Shenzhen, CN", occurredAt: new Date(Date.now() - 86400000 * 2).toISOString() },
      { status: "In transit", location: "Los Angeles, US", occurredAt: new Date(Date.now() - 86400000).toISOString() },
    ],
  };
}
