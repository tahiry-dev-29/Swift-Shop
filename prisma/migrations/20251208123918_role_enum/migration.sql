/*
  Warnings:

  - You are about to drop the column `profileId` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the `Profile` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `dateUpd` to the `Employee` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'SALES', 'WAREHOUSE');

-- DropForeignKey
ALTER TABLE "Employee" DROP CONSTRAINT "Employee_profileId_fkey";

-- AlterTable
ALTER TABLE "Employee" DROP COLUMN "profileId",
ADD COLUMN     "dateAdd" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "dateUpd" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'SALES';

-- DropTable
DROP TABLE "Profile";
