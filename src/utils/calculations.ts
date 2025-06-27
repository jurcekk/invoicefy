import { InvoiceItem } from '../types';

export const calculateItemAmount = (quantity: number, rate: number): number => {
  return Math.round((quantity * rate) * 100) / 100;
};

export const calculateSubtotal = (items: InvoiceItem[]): number => {
  return Math.round(items.reduce((sum, item) => sum + item.amount, 0) * 100) / 100;
};

export const calculateTaxAmount = (subtotal: number, taxRate: number): number => {
  return Math.round((subtotal * (taxRate / 100)) * 100) / 100;
};

export const calculateTotal = (subtotal: number, taxAmount: number): number => {
  return Math.round((subtotal + taxAmount) * 100) / 100;
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

export const generateInvoiceNumber = (counter: number): string => {
  return `INV-${counter.toString().padStart(4, '0')}`;
};