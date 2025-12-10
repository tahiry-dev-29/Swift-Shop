// Employee Models - shared types for Employee, Role

export interface RoleModel {
  id: string;
  name: string;
  description?: string;
  isSystem: boolean;
}

export interface EmployeeModel {
  id: string;
  email: string;
  firstname: string;
  lastname: string;
  active: boolean;
  roleId: string;
  lastConnectionDate?: Date;
}
