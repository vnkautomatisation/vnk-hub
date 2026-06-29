-- CreateTable
CREATE TABLE "SupplierConnection" (
    "id" TEXT NOT NULL,
    "supplier" "Supplier" NOT NULL,
    "apiKey" TEXT,
    "apiSecret" TEXT,
    "connected" BOOLEAN NOT NULL DEFAULT false,
    "lastSyncAt" TIMESTAMP(3),
    "lastError" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupplierConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrackingEvent" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "location" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrackingEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppSettings" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL DEFAULT 'VNK Automatisation',
    "defaultLanguage" TEXT NOT NULL DEFAULT 'fr',
    "resendApiKey" TEXT,
    "fromEmail" TEXT,
    "stripeSecretKey" TEXT,
    "seventeenTrackKey" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SupplierConnection_supplier_key" ON "SupplierConnection"("supplier");

-- AddForeignKey
ALTER TABLE "TrackingEvent" ADD CONSTRAINT "TrackingEvent_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
