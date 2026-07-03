-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "refundedAt" TIMESTAMP(3);
