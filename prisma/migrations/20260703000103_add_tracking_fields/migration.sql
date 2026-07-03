-- AlterTable
ALTER TABLE "AppSettings" ADD COLUMN     "trackingWebhookSecret" TEXT;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "trackingCarrier" TEXT;

-- AlterTable
ALTER TABLE "TrackingEvent" ADD COLUMN     "source" TEXT DEFAULT 'manual',
ADD COLUMN     "tag" INTEGER;
