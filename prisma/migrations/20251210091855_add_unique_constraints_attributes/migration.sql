/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `AttributeGroup` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[attributeGroupId,name]` on the table `AttributeValue` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "AttributeGroup_name_key" ON "AttributeGroup"("name");

-- CreateIndex
CREATE UNIQUE INDEX "AttributeValue_attributeGroupId_name_key" ON "AttributeValue"("attributeGroupId", "name");
