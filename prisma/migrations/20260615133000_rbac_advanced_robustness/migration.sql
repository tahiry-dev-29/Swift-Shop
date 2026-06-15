-- Permission audit trail
CREATE TABLE "PermissionAuditLog" (
  "id" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "actorId" TEXT,
  "employeeId" TEXT,
  "roleId" TEXT,
  "permissionId" TEXT,
  "metadata" JSONB,
  "dateAdd" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "PermissionAuditLog_pkey" PRIMARY KEY ("id")
);

-- Store branch scope primitives for back-office row-level access checks.
CREATE TABLE "StoreBranch" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "description" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "dateAdd" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "dateUpd" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),

  CONSTRAINT "StoreBranch_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EmployeeStoreBranch" (
  "employeeId" TEXT NOT NULL,
  "branchId" TEXT NOT NULL,
  "dateAdd" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "EmployeeStoreBranch_pkey" PRIMARY KEY ("employeeId", "branchId")
);

-- Time-limited extra roles.
CREATE TABLE "TemporaryRoleElevation" (
  "id" TEXT NOT NULL,
  "employeeId" TEXT NOT NULL,
  "roleId" TEXT NOT NULL,
  "actorId" TEXT,
  "reason" TEXT,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "revokedAt" TIMESTAMP(3),
  "dateAdd" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "TemporaryRoleElevation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StoreBranch_code_key" ON "StoreBranch"("code");
CREATE INDEX "PermissionAuditLog_action_dateAdd_idx" ON "PermissionAuditLog"("action", "dateAdd");
CREATE INDEX "PermissionAuditLog_actorId_idx" ON "PermissionAuditLog"("actorId");
CREATE INDEX "PermissionAuditLog_employeeId_idx" ON "PermissionAuditLog"("employeeId");
CREATE INDEX "PermissionAuditLog_roleId_idx" ON "PermissionAuditLog"("roleId");
CREATE INDEX "EmployeeStoreBranch_branchId_idx" ON "EmployeeStoreBranch"("branchId");
CREATE INDEX "TemporaryRoleElevation_employeeId_expiresAt_idx" ON "TemporaryRoleElevation"("employeeId", "expiresAt");
CREATE INDEX "TemporaryRoleElevation_roleId_idx" ON "TemporaryRoleElevation"("roleId");
CREATE INDEX "TemporaryRoleElevation_actorId_idx" ON "TemporaryRoleElevation"("actorId");

ALTER TABLE "EmployeeStoreBranch"
  ADD CONSTRAINT "EmployeeStoreBranch_employeeId_fkey"
  FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EmployeeStoreBranch"
  ADD CONSTRAINT "EmployeeStoreBranch_branchId_fkey"
  FOREIGN KEY ("branchId") REFERENCES "StoreBranch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TemporaryRoleElevation"
  ADD CONSTRAINT "TemporaryRoleElevation_employeeId_fkey"
  FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TemporaryRoleElevation"
  ADD CONSTRAINT "TemporaryRoleElevation_roleId_fkey"
  FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;
