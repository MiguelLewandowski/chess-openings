-- CreateEnum
CREATE TYPE "CardKind" AS ENUM ('CRITICAL', 'TRAP');

-- AlterTable
ALTER TABLE "Exercise" ADD COLUMN     "cardKind" "CardKind";
