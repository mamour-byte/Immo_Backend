-- Add WhatsApp contact number for agents
ALTER TABLE "AgentApplication" ADD COLUMN "whatsapp" TEXT;
ALTER TABLE "AgentProfile" ADD COLUMN "whatsapp" TEXT;

