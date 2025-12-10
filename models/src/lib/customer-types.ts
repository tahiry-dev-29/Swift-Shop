// Customer Models - shared types for Customer, CustomerGroup, Address

export interface CustomerModel {
  id: string;
  email: string;
  firstname: string;
  lastname: string;
  company?: string;
  active: boolean;
  birthday?: Date;
  groupId: string;
}

export interface CustomerGroupModel {
  id: string;
  name: string;
  reduction: number;
  showPrices: boolean;
}

export interface AddressModel {
  id: string;
  customerId?: string;
  alias: string;
  company?: string;
  lastname: string;
  firstname: string;
  address1: string;
  address2?: string;
  postcode: string;
  city: string;
  countryId: string;
  phone?: string;
  phoneMobile?: string;
  vatNumber?: string;
  active: boolean;
  deleted: boolean;
}
