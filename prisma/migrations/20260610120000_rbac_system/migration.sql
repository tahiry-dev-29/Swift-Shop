-- AlterTable
ALTER TABLE "Role" ADD COLUMN "slug" TEXT;
ALTER TABLE "Role" ADD COLUMN "dateAdd" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Role" ADD COLUMN "dateUpd" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Role" ADD COLUMN "deletedAt" TIMESTAMP(3);

UPDATE "Role"
SET "slug" = lower(regexp_replace("name", '([a-z0-9])([A-Z])', '\1_\2', 'g'));

UPDATE "Role" SET "slug" = 'super_admin' WHERE "name" = 'SUPER_ADMIN';

ALTER TABLE "Role" ALTER COLUMN "slug" SET NOT NULL;

-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "dateAdd" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "dateAdd" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("roleId","permissionId")
);

-- CreateTable
CREATE TABLE "EmployeeRole" (
    "employeeId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "dateAdd" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmployeeRole_pkey" PRIMARY KEY ("employeeId","roleId")
);

INSERT INTO "EmployeeRole" ("employeeId", "roleId")
SELECT "id", "roleId" FROM "Employee"
ON CONFLICT DO NOTHING;

-- CreateIndex
CREATE UNIQUE INDEX "Role_slug_key" ON "Role"("slug");
CREATE UNIQUE INDEX "Permission_slug_key" ON "Permission"("slug");
CREATE UNIQUE INDEX "Permission_resource_action_key" ON "Permission"("resource","action");
CREATE INDEX "Permission_resource_idx" ON "Permission"("resource");
CREATE INDEX "RolePermission_permissionId_idx" ON "RolePermission"("permissionId");
CREATE INDEX "EmployeeRole_roleId_idx" ON "EmployeeRole"("roleId");

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmployeeRole" ADD CONSTRAINT "EmployeeRole_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmployeeRole" ADD CONSTRAINT "EmployeeRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;
