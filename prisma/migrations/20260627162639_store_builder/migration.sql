-- CreateEnum
CREATE TYPE "DomainStatus" AS ENUM ('PENDING', 'ACTIVE', 'ERROR');

-- CreateEnum
CREATE TYPE "StoreLanguage" AS ENUM ('FR', 'EN', 'BILINGUAL');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "featured" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Store" ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'CAD',
ADD COLUMN     "domainStatus" "DomainStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "emailTemplates" JSONB,
ADD COLUMN     "heroImageUrl" TEXT,
ADD COLUMN     "heroSubtitle" TEXT,
ADD COLUMN     "heroTitle" TEXT,
ADD COLUMN     "language" "StoreLanguage" NOT NULL DEFAULT 'FR',
ADD COLUMN     "logoText" TEXT,
ADD COLUMN     "logoUrl" TEXT,
ADD COLUMN     "paymentMethods" TEXT[] DEFAULT ARRAY['card']::TEXT[],
ADD COLUMN     "primaryColor" TEXT NOT NULL DEFAULT '#111827',
ADD COLUMN     "slogan" TEXT,
ADD COLUMN     "useMainStripeKey" BOOLEAN NOT NULL DEFAULT true;
