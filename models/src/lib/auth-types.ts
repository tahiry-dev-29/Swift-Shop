// Auth JWT Payload - decoded token contains user info
export interface JwtPayload {
  sub: number;
  email: string;
  type: 'customer' | 'employee';
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

// Customer types
export interface CustomerInfo {
  id: number;
  email: string;
  firstname: string;
  lastname: string;
  company?: string;
  active: boolean;
  groupId: number;
}

// Employee types
export interface EmployeeInfo {
  id: number;
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
