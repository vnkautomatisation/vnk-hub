import type { SupplierProduct } from "@/types/supplier";

// Mock implementation — replace with real AliExpress DS API calls once ALIEXPRESS_APP_KEY is set.
export async function searchProducts(query: string): Promise<SupplierProduct[]> {
  return [
    {
      sku: "AE-001",
      name: `${query} - Smart Watch`,
      nameFr: `${query} - Montre intelligente`,
      description: "Fitness tracker smart watch with heart rate monitor",
      descriptionFr: "Montre intelligente avec moniteur de fréquence cardiaque",
      cost: 11.3,
      suggestedPrice: 34.99,
      images: ["https://placehold.co/400x400?text=AliExpress"],
      stock: 870,
    },
    {
      sku: "AE-002",
      name: `${query} - Phone Case`,
      nameFr: `${query} - Étui de téléphone`,
      description: "Shockproof clear phone case",
      descriptionFr: "Étui de téléphone transparent antichoc",
      cost: 1.8,
      suggestedPrice: 9.99,
      images: ["https://placehold.co/400x400?text=AliExpress"],
      stock: 5200,
    },
  ];
}

export async function createOrder(payload: {
  sku: string;
  quantity: number;
  shippingAddress: Record<string, unknown>;
}): Promise<{ supplierOrderId: string }> {
  return { supplierOrderId: `AE-ORD-${Date.now()}` };
}

export async function getConnectionStatus(): Promise<{ connected: boolean }> {
  return { connected: false };
}
