import type { OrderStatus } from "@prisma/client";

export const orderStatusLabels: Record<OrderStatus, string> = {
  PENDING: "En attente",
  CONFIRMED: "Confirmée",
  DISPATCHED_TO_SUPPLIER: "Envoyée au fournisseur",
  SHIPPED: "Expédiée",
  IN_TRANSIT: "En transit",
  DELIVERED: "Livrée",
  CANCELLED: "Annulée",
  REFUNDED: "Remboursée",
};
