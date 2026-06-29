import type { Product, Store } from "@prisma/client";

export type StoreWithProducts = Store & { products: Product[] };

export type EmailTemplates = {
  confirmationFr: string;
  confirmationEn: string;
  shippingFr: string;
  shippingEn: string;
  deliveredFr: string;
  deliveredEn: string;
};

export const defaultEmailTemplates: EmailTemplates = {
  confirmationFr: "Bonjour {{customerName}}, votre commande {{orderNumber}} chez {{storeName}} est confirmée.",
  confirmationEn: "Hello {{customerName}}, your order {{orderNumber}} at {{storeName}} is confirmed.",
  shippingFr: "Votre commande {{orderNumber}} a été expédiée. Suivi: {{trackingNumber}}.",
  shippingEn: "Your order {{orderNumber}} has shipped. Tracking: {{trackingNumber}}.",
  deliveredFr: "Votre commande {{orderNumber}} a été livrée. Merci de votre achat chez {{storeName}}!",
  deliveredEn: "Your order {{orderNumber}} has been delivered. Thank you for shopping at {{storeName}}!",
};
