-- CreateEnum
CREATE TYPE "RentalMode" AS ENUM ('MONTHLY', 'DAILY');

-- AlterTable
ALTER TABLE "Property" ADD COLUMN "rentalMode" "RentalMode";

-- Backfill existing location properties as monthly
UPDATE "Property"
SET "rentalMode" = 'MONTHLY'
WHERE "purpose" = 'LOCATION' AND "rentalMode" IS NULL;
