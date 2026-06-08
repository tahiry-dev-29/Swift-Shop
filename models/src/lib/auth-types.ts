// Auth JWT Payload - decoded token contains user info
export interface JwtPayload {
  sub: string;
  email: string;
  type: 'customer' | 'employee';
  purpose?: 'access' | 'customer_magic_link' | 'employee_password_reset';
  firstname: string;
  lastname: string;
  // Customer specific
  groupName?: string;
  groupReduction?: number;
  // Employee specific
  role?: string;
  // JWT standard claims
  iat?: number;
  exp?: number;
}

// Authenticated user from JWT decorator
export interface AuthUser {
  id: string;
  email: string;
  type: 'customer' | 'employee';
  firstname: string;
  lastname: string;
  role?: string;
  groupName?: string;
  groupReduction?: number;
}

// Customer types
export interface CustomerInfo {
  id: string;
  email: string;
  firstname: string;
  lastname: string;
  company?: string;
  active: boolean;
  groupId: string;
}

// Employee types
export interface EmployeeInfo {
  id: string;
  email: string;
  firstname: string;
  lastname: string;
  active: boolean;
  role: string;
}

// Auth response from login/register
export interface AuthResponse {
  accessToken: string;
}
