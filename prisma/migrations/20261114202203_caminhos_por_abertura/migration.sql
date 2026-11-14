-- CreateEnum
CREATE TYPE "OpeningStyle" AS ENUM ('POSITIONAL', 'BALANCED', 'TACTICAL');

-- AlterTable
ALTER TABLE "Opening" ADD COLUMN     "family" TEXT,
ADD COLUMN     "style" "OpeningStyle";

-- CreateTable
CREATE TABLE "UserOpeningChoice" (
    "userId" TEXT NOT NULL,
    "family" TEXT NOT NULL,
    "style" "OpeningStyle" NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserOpeningChoice_pkey" PRIMARY KEY ("userId","family")
);

-- CreateIndex
CREATE UNIQUE INDEX "Opening_family_style_key" ON "Opening"("family", "style");

-- AddForeignKey
ALTER TABLE "UserOpeningChoice" ADD CONSTRAINT "UserOpeningChoice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

