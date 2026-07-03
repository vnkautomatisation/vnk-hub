-- Order: cancellationReason, expectedDeliveryAt
ALTER TABLE "Order" ADD COLUMN "cancellationReason" TEXT;
ALTER TABLE "Order" ADD COLUMN "expectedDeliveryAt" TIMESTAMP(3);

-- OrderNote: make userId nullable (system notes from 17track webhooks)
ALTER TABLE "OrderNote" ALTER COLUMN "userId" DROP NOT NULL;

-- OrderStatusHistory: new table
CREATE TABLE "OrderStatusHistory" (
    "id"         TEXT NOT NULL,
    "orderId"    TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus"   TEXT NOT NULL,
    "userId"     TEXT,
    "note"       TEXT,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OrderStatusHistory_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "OrderStatusHistory" ADD CONSTRAINT "OrderStatusHistory_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AppSettings: slaHours
ALTER TABLE "AppSettings" ADD COLUMN "slaHours" INTEGER NOT NULL DEFAULT 48;
