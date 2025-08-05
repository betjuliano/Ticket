/*
  Warnings:

  - You are about to drop the `knowledge_articles` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `knowledge_categories` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropIndex
DROP INDEX "knowledge_categories_name_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "knowledge_articles";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "knowledge_categories";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "docs_categories" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "docs_articles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "docs_articles_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "docs_categories" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "docs_articles_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_article_ratings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "articleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "article_ratings_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "docs_articles" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "article_ratings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_article_ratings" ("articleId", "comment", "createdAt", "id", "rating", "userId") SELECT "articleId", "comment", "createdAt", "id", "rating", "userId" FROM "article_ratings";
DROP TABLE "article_ratings";
ALTER TABLE "new_article_ratings" RENAME TO "article_ratings";
CREATE UNIQUE INDEX "article_ratings_articleId_userId_key" ON "article_ratings"("articleId", "userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "docs_categories_name_key" ON "docs_categories"("name");
