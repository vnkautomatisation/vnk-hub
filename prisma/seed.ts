import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("Admin123!", 10);

  await prisma.user.upsert({
    where: { email: "admin@vnk.local" },
    update: {},
    create: {
      email: "admin@vnk.local",
      name: "Admin",
      password,
      role: "SUPER_ADMIN",
    },
  });

  const suppliers = ["CJ_DROPSHIPPING", "ALIEXPRESS", "ZENDROP", "PRINTFUL"] as const;
  for (const supplier of suppliers) {
    await prisma.supplierConnection.upsert({
      where: { supplier },
      update: {},
      create: { supplier, connected: false },
    });
  }

  const settingsCount = await prisma.appSettings.count();
  if (settingsCount === 0) {
    await prisma.appSettings.create({ data: {} });
  }

  const store = await prisma.store.upsert({
    where: { slug: "demo-store" },
    update: {},
    create: {
      name: "Demo Store",
      slug: "demo-store",
      niche: "Électronique",
    },
  });

  const product = await prisma.product.upsert({
    where: { id: "demo-product-1" },
    update: {},
    create: {
      id: "demo-product-1",
      storeId: store.id,
      name: "Wireless Earbuds",
      nameFr: "Écouteurs sans fil",
      description: "Bluetooth 5.0 wireless earbuds",
      descriptionFr: "Écouteurs sans fil Bluetooth 5.0",
      price: 24.99,
      cost: 8.5,
      images: ["https://placehold.co/400x400?text=Demo"],
      supplier: "CJ_DROPSHIPPING",
      supplierSku: "CJ-001",
    },
  });

  const existingOrder = await prisma.order.findUnique({ where: { orderNumber: "DEMO-1001" } });
  if (!existingOrder) {
    await prisma.order.create({
      data: {
        orderNumber: "DEMO-1001",
        storeId: store.id,
        status: "PENDING",
        customerName: "Jean Tremblay",
        customerEmail: "jean.tremblay@example.com",
        shippingAddress: { city: "Montréal", country: "CA" },
        totalAmount: 24.99,
        currency: "CAD",
        items: {
          create: [{ productId: product.id, quantity: 1, price: 24.99 }],
        },
      },
    });
  }

  const existingOrder2 = await prisma.order.findUnique({ where: { orderNumber: "DEMO-1002" } });
  if (!existingOrder2) {
    await prisma.order.create({
      data: {
        orderNumber: "DEMO-1002",
        storeId: store.id,
        status: "IN_TRANSIT",
        customerName: "Marie Gagnon",
        customerEmail: "marie.gagnon@example.com",
        shippingAddress: { city: "Québec", country: "CA" },
        totalAmount: 49.98,
        currency: "CAD",
        trackingNumber: "CN1234567890",
        items: {
          create: [{ productId: product.id, quantity: 2, price: 24.99 }],
        },
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
