-- Migration: messaging_models
-- Created at: 2026-06-30
-- Section: Email Messaging System (Inbox & Compose)

-- EmailTemplate: Reusable email templates managed by admin
CREATE TABLE "EmailTemplate" (
  "id"        TEXT NOT NULL,
  "name"      TEXT NOT NULL,
  "subject"   TEXT NOT NULL,
  "bodyHtml"  TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "EmailTemplate_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EmailTemplate_name_key" ON "EmailTemplate"("name");

-- EmailThread: Groups messages into conversations
CREATE TABLE "EmailThread" (
  "id"        TEXT NOT NULL,
  "subject"   TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "EmailThread_pkey" PRIMARY KEY ("id")
);

-- EmailMessage: Individual message within a thread
CREATE TABLE "EmailMessage" (
  "id"          TEXT NOT NULL,
  "threadId"    TEXT NOT NULL,
  "senderId"    TEXT,
  "recipientId" TEXT,
  "body"        TEXT NOT NULL,
  "status"      TEXT NOT NULL DEFAULT 'PENDING',
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "EmailMessage_pkey" PRIMARY KEY ("id")
);

-- EmailAttachment: Files attached to messages
CREATE TABLE "EmailAttachment" (
  "id"        TEXT NOT NULL,
  "messageId" TEXT NOT NULL,
  "fileUrl"   TEXT NOT NULL,
  "fileName"  TEXT NOT NULL,
  "mimeType"  TEXT NOT NULL,
  "size"      INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "EmailAttachment_pkey" PRIMARY KEY ("id")
);

-- Foreign keys
ALTER TABLE "EmailMessage"
  ADD CONSTRAINT "EmailMessage_threadId_fkey"
  FOREIGN KEY ("threadId") REFERENCES "EmailThread"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EmailAttachment"
  ADD CONSTRAINT "EmailAttachment_messageId_fkey"
  FOREIGN KEY ("messageId") REFERENCES "EmailMessage"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Indexes for common queries
CREATE INDEX "EmailMessage_threadId_idx" ON "EmailMessage"("threadId");
CREATE INDEX "EmailMessage_recipientId_idx" ON "EmailMessage"("recipientId");
CREATE INDEX "EmailMessage_status_idx" ON "EmailMessage"("status");
CREATE INDEX "EmailAttachment_messageId_idx" ON "EmailAttachment"("messageId");
