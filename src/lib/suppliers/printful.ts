import type { SupplierProduct } from "@/types/supplier";

// Mock implementation — replace with real Printful API calls once PRINTFUL_API_KEY is set.
export async function searchProducts(query: string): Promise<SupplierProduct[]> {
  return [
    {
      sku: "PF-001",
      name: `${query} - Custom T-Shirt`,
      nameFr: `${query} - T-shirt personnalisé`,
      description: "Print-on-demand cotton t-shirt, multiple colors",
      descriptionFr: "T-shirt en coton imprimé à la demande, plusieurs couleurs",
      cost: 9.0,
      suggestedPrice: 22.99,
      images: ["https://placehold.co/400x400?text=Printful"],
      stock: 9999,
    },
  ];
}

export async function createOrder(payload: {
  sku: string;
  quantity: number;
  shippingAddress: Record<string, unknown>;
}): Promise<{ supplierOrderId: string }> {
  return { supplierOrderId: `PF-ORD-${Date.now()}` };
}

export async function getConnectionStatus(): Promise<{ connected: boolean }> {
  return { connected: false };
}
