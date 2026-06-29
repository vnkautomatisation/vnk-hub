import type { SupplierProduct } from "@/types/supplier";

// Mock implementation — replace with real CJ Dropshipping API calls once CJ_API_KEY is set.
export async function searchProducts(query: string): Promise<SupplierProduct[]> {
  return [
    {
      sku: "CJ-001",
      name: `${query} - Wireless Earbuds`,
      nameFr: `${query} - Écouteurs sans fil`,
      description: "Bluetooth 5.0 wireless earbuds with charging case",
      descriptionFr: "Écouteurs sans fil Bluetooth 5.0 avec étui de charge",
      cost: 8.5,
      suggestedPrice: 24.99,
      images: ["https://placehold.co/400x400?text=CJ+Product"],
      stock: 1240,
    },
    {
      sku: "CJ-002",
      name: `${query} - LED Strip Light`,
      nameFr: `${query} - Bande LED`,
      description: "RGB LED strip light with remote control, 5m",
      descriptionFr: "Bande LED RGB avec télécommande, 5m",
      cost: 4.2,
      suggestedPrice: 16.99,
      images: ["https://placehold.co/400x400?text=CJ+Product"],
      stock: 3500,
    },
  ];
}

export async function createOrder(payload: {
  sku: string;
  quantity: number;
  shippingAddress: Record<string, unknown>;
}): Promise<{ supplierOrderId: string }> {
  return { supplierOrderId: `CJ-ORD-${Date.now()}` };
}

export async function getConnectionStatus(): Promise<{ connected: boolean }> {
  return { connected: false };
}
