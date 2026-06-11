export const permissionActions = [
  'create',
  'read',
  'update',
  'delete',
  'export',
  'impersonate',
];

export const permissionResources = [
  'products',
  'orders',
  'customers',
  'catalog',
  'pricing',
  'settings',
  'reports',
  'roles',
];

export function slugify(value: string) {
  return value
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();
}

export function permissionSlug(resource: string, action: string) {
  return `${resource}:${action}`;
}

export function mapPermission(permission: {
  id: string;
  slug: string;
  resource: string;
  action: string;
  description: string | null;
}) {
  return {
    ...permission,
    description: permission.description ?? undefined,
  };
}

export function mapRole(role: {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isSystem: boolean;
  dateAdd: Date;
  rolePermissions?: {
    permission: {
      id: string;
      slug: string;
      resource: string;
      action: string;
      description: string | null;
    };
  }[];
}) {
  return {
    id: role.id,
    name: role.name,
    slug: role.slug,
    description: role.description ?? undefined,
    isSystem: role.isSystem,
    dateAdd: role.dateAdd,
    permissions: role.rolePermissions?.map((item) =>
      mapPermission(item.permission),
    ),
  };
}
