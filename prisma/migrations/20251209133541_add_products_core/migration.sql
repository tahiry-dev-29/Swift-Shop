-- CreateTable
CREATE TABLE "Product" (
    "id" SERIAL NOT NULL,
    "reference" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "descriptionShort" TEXT,
    "price" DECIMAL(65,30) NOT NULL DEFAULT 0.00,
    "wholesalePrice" DECIMAL(65,30) NOT NULL DEFAULT 0.00,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "availableForOrder" BOOLEAN NOT NULL DEFAULT true,
    "showPrice" BOOLEAN NOT NULL DEFAULT true,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "linkRewrite" TEXT,
    "weight" DECIMAL(65,30) NOT NULL DEFAULT 0.00,
    "width" DECIMAL(65,30),
    "height" DECIMAL(65,30),
    "depth" DECIMAL(65,30),
    "categoryId" INTEGER,
    "dateAdd" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateUpd" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductImage" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "cover" BOOLEAN NOT NULL DEFAULT false,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "alt" TEXT,
    "dateAdd" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductCombination" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "reference" TEXT,
    "priceImpact" DECIMAL(65,30) NOT NULL DEFAULT 0.00,
    "weightImpact" DECIMAL(65,30) NOT NULL DEFAULT 0.00,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ProductCombination_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductCombinationAttribute" (
    "id" SERIAL NOT NULL,
    "combinationId" INTEGER NOT NULL,
    "attributeValueId" INTEGER NOT NULL,

    CONSTRAINT "ProductCombinationAttribute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Stock" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER,
    "combinationId" INTEGER,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "minQuantity" INTEGER NOT NULL DEFAULT 1,
    "outOfStockBehavior" TEXT NOT NULL DEFAULT 'deny',

    CONSTRAINT "Stock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Product_reference_key" ON "Product"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "ProductCombinationAttribute_combinationId_attributeValueId_key" ON "ProductCombinationAttribute"("combinationId", "attributeValueId");

-- CreateIndex
CREATE UNIQUE INDEX "Stock_productId_key" ON "Stock"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "Stock_combinationId_key" ON "Stock"("combinationId");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductImage" ADD CONSTRAINT "ProductImage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductCombination" ADD CONSTRAINT "ProductCombination_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductCombinationAttribute" ADD CONSTRAINT "ProductCombinationAttribute_combinationId_fkey" FOREIGN KEY ("combinationId") REFERENCES "ProductCombination"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductCombinationAttribute" ADD CONSTRAINT "ProductCombinationAttribute_attributeValueId_fkey" FOREIGN KEY ("attributeValueId") REFERENCES "AttributeValue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stock" ADD CONSTRAINT "Stock_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stock" ADD CONSTRAINT "Stock_combinationId_fkey" FOREIGN KEY ("combinationId") REFERENCES "ProductCombination"("id") ON DELETE CASCADE ON UPDATE CASCADE;
