import type { SupplierProduct } from "@/types/supplier";

// Mock implementation — replace with real Zendrop API calls once ZENDROP_API_KEY is set.
export async function searchProducts(query: string): Promise<SupplierProduct[]> {
  return [
    {
      sku: "ZD-001",
      name: `${query} - Yoga Mat`,
      nameFr: `${query} - Tapis de yoga`,
      description: "Non-slip eco-friendly yoga mat, US/Canada fast shipping",
      descriptionFr: "Tapis de yoga antidérapant écologique, livraison rapide USA/Canada",
      cost: 9.4,
      suggestedPrice: 29.99,
      images: ["https://placehold.co/400x400?text=Zendrop"],
      stock: 640,
    },
  ];
}

export async function createOrder(payload: {
  sku: string;
  quantity: number;
  shippingAddress: Record<string, unknown>;
}): Promise<{ supplierOrderId: string }> {
  return { supplierOrderId: `ZD-ORD-${Date.now()}` };
}

export async function getConnectionStatus(): Promise<{ connected: boolean }> {
  return { connected: false };
}
