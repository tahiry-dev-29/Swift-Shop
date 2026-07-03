-- CreateTable
CREATE TABLE "ProductViewEvent" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "customerId" TEXT,
    "sessionId" TEXT,
    "source" TEXT,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "dateAdd" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductViewEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailySalesSnapshot" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "ordersCount" INTEGER NOT NULL DEFAULT 0,
    "itemsSold" INTEGER NOT NULL DEFAULT 0,
    "grossSales" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "netSales" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "taxTotal" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "averageOrder" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "dateAdd" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateUpd" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailySalesSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductViewEvent_productId_dateAdd_idx" ON "ProductViewEvent"("productId", "dateAdd");

-- CreateIndex
CREATE INDEX "ProductViewEvent_customerId_dateAdd_idx" ON "ProductViewEvent"("customerId", "dateAdd");

-- CreateIndex
CREATE INDEX "ProductViewEvent_dateAdd_idx" ON "ProductViewEvent"("dateAdd");

-- CreateIndex
CREATE UNIQUE INDEX "DailySalesSnapshot_date_key" ON "DailySalesSnapshot"("date");

-- CreateIndex
CREATE INDEX "DailySalesSnapshot_date_idx" ON "DailySalesSnapshot"("date");

-- AddForeignKey
ALTER TABLE "ProductViewEvent" ADD CONSTRAINT "ProductViewEvent_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductViewEvent" ADD CONSTRAINT "ProductViewEvent_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
