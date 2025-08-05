/*
  Warnings:

  - You are about to drop the column `filepath` on the `attachments` table. All the data in the column will be lost.
  - You are about to drop the column `filesize` on the `attachments` table. All the data in the column will be lost.
  - You are about to drop the column `mimetype` on the `attachments` table. All the data in the column will be lost.
  - You are about to drop the column `category` on the `knowledge_articles` table. All the data in the column will be lost.
  - You are about to drop the column `tags` on the `knowledge_articles` table. All the data in the column will be lost.
  - Added the required column `mimeType` to the `attachments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `originalName` to the `attachments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `path` to the `attachments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `size` to the `attachments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `categoryId` to the `knowledge_articles` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "tickets" ADD COLUMN "actualHours" REAL;
ALTER TABLE "tickets" ADD COLUMN "dueDate" DATETIME;
ALTER TABLE "tickets" ADD COLUMN "estimatedHours" REAL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN "lastLoginAt" DATETIME;
ALTER TABLE "users" ADD COLUMN "preferences" TEXT;

-- CreateTable
CREATE TABLE "knowledge_categories" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "article_ratings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "articleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "article_ratings_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "knowledge_articles" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "article_ratings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ticket_metrics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ticketId" TEXT NOT NULL,
    "timeSpent" REAL NOT NULL DEFAULT 0,
    "responseTime" REAL,
    "resolutionTime" REAL,
    "reopenCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ticket_metrics_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "tickets" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_attachments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "path" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "attachments_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "tickets" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "attachments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_attachments" ("createdAt", "filename", "id", "ticketId", "userId") SELECT "createdAt", "filename", "id", "ticketId", "userId" FROM "attachments";
DROP TABLE "attachments";
ALTER TABLE "new_attachments" RENAME TO "attachments";
CREATE TABLE "new_knowledge_articles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "knowledge_articles_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "knowledge_categories" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "knowledge_articles_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_knowledge_articles" ("authorId", "content", "createdAt", "id", "isPublished", "title", "updatedAt") SELECT "authorId", "content", "createdAt", "id", "isPublished", "title", "updatedAt" FROM "knowledge_articles";
DROP TABLE "knowledge_articles";
ALTER TABLE "new_knowledge_articles" RENAME TO "knowledge_articles";
CREATE TABLE "new_ticket_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ticketId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "userId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ticket_logs_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "tickets" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ticket_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ticket_logs" ("action", "createdAt", "details", "id", "ticketId", "userId") SELECT "action", "createdAt", "details", "id", "ticketId", "userId" FROM "ticket_logs";
DROP TABLE "ticket_logs";
ALTER TABLE "new_ticket_logs" RENAME TO "ticket_logs";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "knowledge_categories_name_key" ON "knowledge_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "article_ratings_articleId_userId_key" ON "article_ratings"("articleId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "ticket_metrics_ticketId_key" ON "ticket_metrics"("ticketId");
