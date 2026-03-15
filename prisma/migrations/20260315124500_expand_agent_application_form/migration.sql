-- Expand agent application/profile for verification + public fields

DO $$ BEGIN
  CREATE TYPE "AgentProfileType" AS ENUM ('INDEPENDANT', 'AGENCY', 'DEVELOPER');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "AgentApplication"
  ADD COLUMN "firstName" TEXT,
  ADD COLUMN "lastName" TEXT,
  ADD COLUMN "city" TEXT,
  ADD COLUMN "address" TEXT,
  ADD COLUMN "profilePhotoUrl" TEXT,
  ADD COLUMN "profileType" "AgentProfileType",
  ADD COLUMN "agencyName" TEXT,
  ADD COLUMN "yearsExperience" INTEGER,
  ADD COLUMN "activityZone" TEXT,
  ADD COLUMN "managedPropertiesCount" INTEGER,
  ADD COLUMN "websiteUrl" TEXT,
  ADD COLUMN "facebookUrl" TEXT,
  ADD COLUMN "publicPhone" TEXT,
  ADD COLUMN "languages" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "publicDescription" TEXT,
  ADD COLUMN "idDocumentUrl" TEXT,
  ADD COLUMN "tradeRegisterUrl" TEXT,
  ADD COLUMN "professionalCardUrl" TEXT,
  ADD COLUMN "agencyLogoUrl" TEXT,
  ADD COLUMN "agencyAddress" TEXT,
  ADD COLUMN "agencyPhotoUrl" TEXT,
  ADD COLUMN "acceptedTerms" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "certifiedTrue" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "AgentProfile"
  ADD COLUMN "profileType" "AgentProfileType",
  ADD COLUMN "city" TEXT,
  ADD COLUMN "address" TEXT,
  ADD COLUMN "publicPhone" TEXT,
  ADD COLUMN "languages" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "publicDescription" TEXT,
  ADD COLUMN "websiteUrl" TEXT,
  ADD COLUMN "facebookUrl" TEXT,
  ADD COLUMN "agencyName" TEXT,
  ADD COLUMN "agencyLogoUrl" TEXT,
  ADD COLUMN "agencyAddress" TEXT,
  ADD COLUMN "agencyPhotoUrl" TEXT,
  ADD COLUMN "yearsExperience" INTEGER,
  ADD COLUMN "activityZone" TEXT,
  ADD COLUMN "managedPropertiesCount" INTEGER;

