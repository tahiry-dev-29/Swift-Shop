// Pricing Models - shared types for SpecificPrice, Country, TaxRule

export interface CountryModel {
  id: string;
  isoCode: string;
  name: string;
  taxRate: number;
  active: boolean;
}

export interface TaxRuleModel {
  id: string;
  countryId: string;
  name: string;
  rate: number;
  active: boolean;
}

export interface SpecificPriceModel {
  id: string;
  productId?: string;
  combinationId?: string;
  customerId?: string;
  customerGroupId?: string;
  countryId?: string;
  fromQuantity: number;
  reductionType: 'percentage' | 'amount';
  reduction: number;
  dateFrom?: Date;
  dateTo?: Date;
  priority: number;
  active: boolean;
}

// Price calculation result
export interface PriceResult {
  basePrice: number;
  combinationImpact: number;
  customerGroupReduction: number;
  specificPriceReduction: number;
  priceHT: number;
  taxRate: number;
  taxAmount: number;
  priceTTC: number;
  currencyId?: string;
  exchangeRate?: number;
}

// Price calculation input params
export interface CalculatePriceParams {
  productId: string;
  combinationId?: string;
  customerId?: string;
  countryId: string;
  currencyId?: string;
  quantity?: number;
}
