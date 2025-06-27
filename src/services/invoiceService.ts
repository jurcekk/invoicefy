import { supabase } from '../lib/supabaseClient';
import type { Database } from '../lib/database.types';

// Type definitions for better TypeScript support
type InvoiceRow = Database['public']['Tables']['invoices']['Row'];
type InvoiceInsert = Database['public']['Tables']['invoices']['Insert'];
type InvoiceItemRow = Database['public']['Tables']['invoice_items']['Row'];
type InvoiceItemInsert = Database['public']['Tables']['invoice_items']['Insert'];

// Service response types
export interface ServiceResponse<T> {
  data: T | null;
  error: string | null;
}

// Extended types for complex queries
export interface InvoiceWithItems extends InvoiceRow {
  items: InvoiceItemRow[];
}

export interface InvoiceWithRelations extends InvoiceRow {
  items: InvoiceItemRow[];
  client: Database['public']['Tables']['clients']['Row'];
  freelancer: Database['public']['Tables']['freelancers']['Row'];
}

// Input validation types
export interface CreateInvoiceInput {
  freelancer_id: string;
  client_id: string;
  invoice_number?: string; // Now optional - will be auto-generated if not provided
  date_issued: string; // YYYY-MM-DD format
  due_date: string; // YYYY-MM-DD format
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  status?: 'draft' | 'sent' | 'paid' | 'overdue';
  notes?: string;
}

export interface CreateInvoiceItemInput {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

/**
 * Gets the next invoice number for a freelancer
 * @param freelancer_id - The UUID of the freelancer
 * @returns Promise with formatted invoice number and error
 */
export async function getNextInvoiceNumber(freelancer_id: string): Promise<ServiceResponse<string>> {
  try {
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(freelancer_id)) {
      return {
        data: null,
        error: 'Invalid freelancer ID format'
      };
    }

    // Get count of existing invoices for this freelancer
    const { count, error } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('freelancer_id', freelancer_id);

    if (error) {
      console.error('Error counting invoices:', error);
      return {
        data: null,
        error: error.message || 'Failed to count existing invoices'
      };
    }

    // Generate next invoice number (count + 1, padded to 3 digits)
    const nextNumber = (count || 0) + 1;
    const invoiceNumber = `INV-${nextNumber.toString().padStart(3, '0')}`;

    return {
      data: invoiceNumber,
      error: null
    };
  } catch (err) {
    console.error('Unexpected error generating invoice number:', err);
    return {
      data: null,
      error: 'An unexpected error occurred while generating invoice number'
    };
  }
}

/**
 * Creates a new invoice with associated items in a transaction
 * @param invoice - Invoice data (invoice_number is optional and will be auto-generated)
 * @param items - Array of invoice items
 * @returns Promise with created invoice and error
 */
export async function createInvoice(
  invoice: CreateInvoiceInput,
  items: CreateInvoiceItemInput[]
): Promise<ServiceResponse<InvoiceWithItems>> {
  try {
    // Auto-generate invoice number if not provided
    let invoiceNumber = invoice.invoice_number;
    if (!invoiceNumber) {
      const { data: generatedNumber, error: numberError } = await getNextInvoiceNumber(invoice.freelancer_id);
      if (numberError || !generatedNumber) {
        return {
          data: null,
          error: numberError || 'Failed to generate invoice number'
        };
      }
      invoiceNumber = generatedNumber;
    }

    // Create invoice object with generated number
    const invoiceWithNumber = {
      ...invoice,
      invoice_number: invoiceNumber
    };

    // Validate input shapes
    const validationError = validateInvoiceInput(invoiceWithNumber, items);
    if (validationError) {
      return {
        data: null,
        error: validationError
      };
    }

    // Verify relationships exist
    const relationshipError = await validateInvoiceRelationships(invoiceWithNumber);
    if (relationshipError) {
      return {
        data: null,
        error: relationshipError
      };
    }

    // Start transaction by creating the invoice first
    const { data: createdInvoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        freelancer_id: invoiceWithNumber.freelancer_id,
        client_id: invoiceWithNumber.client_id,
        invoice_number: invoiceWithNumber.invoice_number,
        date_issued: invoiceWithNumber.date_issued,
        due_date: invoiceWithNumber.due_date,
        subtotal: invoiceWithNumber.subtotal,
        tax_rate: invoiceWithNumber.tax_rate,
        tax_amount: invoiceWithNumber.tax_amount,
        total: invoiceWithNumber.total,
        status: invoiceWithNumber.status || 'draft',
        notes: invoiceWithNumber.notes || null,
      })
      .select()
      .single();

    if (invoiceError) {
      console.error('Error creating invoice:', invoiceError);
      
      // Handle specific error cases
      if (invoiceError.code === '23503') {
        return {
          data: null,
          error: 'Invalid freelancer or client ID - referenced record does not exist'
        };
      }
      
      if (invoiceError.code === '23505') {
        return {
          data: null,
          error: 'Invoice number already exists'
        };
      }
      
      return {
        data: null,
        error: invoiceError.message || 'Failed to create invoice'
      };
    }

    // Batch insert invoice items
    const itemsToInsert = items.map(item => ({
      invoice_id: createdInvoice.id,
      description: item.description.trim(),
      quantity: item.quantity,
      rate: item.rate,
      amount: item.amount,
    }));

    const { data: createdItems, error: itemsError } = await supabase
      .from('invoice_items')
      .insert(itemsToInsert)
      .select();

    if (itemsError) {
      console.error('Error creating invoice items:', itemsError);
      
      // Rollback: delete the created invoice
      await supabase
        .from('invoices')
        .delete()
        .eq('id', createdInvoice.id);
      
      return {
        data: null,
        error: itemsError.message || 'Failed to create invoice items'
      };
    }

    // Return the complete invoice with items
    const result: InvoiceWithItems = {
      ...createdInvoice,
      items: createdItems || []
    };

    return {
      data: result,
      error: null
    };
  } catch (err) {
    console.error('Unexpected error creating invoice:', err);
    return {
      data: null,
      error: 'An unexpected error occurred while creating the invoice'
    };
  }
}

/**
 * Retrieves all invoices for a specific freelancer with optional joins
 * @param freelancer_id - The UUID of the freelancer
 * @param includeRelations - Whether to include client and freelancer data
 * @returns Promise with array of invoices and error
 */
export async function getInvoicesForFreelancer(
  freelancer_id: string,
  includeRelations: boolean = false
): Promise<ServiceResponse<InvoiceRow[] | InvoiceWithRelations[]>> {
  try {
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(freelancer_id)) {
      return {
        data: null,
        error: 'Invalid freelancer ID format'
      };
    }

    let query = supabase
      .from('invoices')
      .select(includeRelations ? `
        *,
        client:clients(*),
        freelancer:freelancers(*),
        items:invoice_items(*)
      ` : '*')
      .eq('freelancer_id', freelancer_id)
      .order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching invoices:', error);
      return {
        data: null,
        error: error.message || 'Failed to fetch invoices'
      };
    }

    return {
      data: data || [],
      error: null
    };
  } catch (err) {
    console.error('Unexpected error fetching invoices:', err);
    return {
      data: null,
      error: 'An unexpected error occurred while fetching invoices'
    };
  }
}

/**
 * Retrieves a single invoice with all its items and related data
 * @param invoice_id - The UUID of the invoice
 * @returns Promise with invoice data including items and error
 */
export async function getInvoiceWithItems(invoice_id: string): Promise<ServiceResponse<InvoiceWithRelations>> {
  try {
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(invoice_id)) {
      return {
        data: null,
        error: 'Invalid invoice ID format'
      };
    }

    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        client:clients(*),
        freelancer:freelancers(*),
        items:invoice_items(*)
      `)
      .eq('id', invoice_id)
      .single();

    if (error) {
      console.error('Error fetching invoice with items:', error);
      
      if (error.code === 'PGRST116') {
        return {
          data: null,
          error: 'Invoice not found'
        };
      }
      
      return {
        data: null,
        error: error.message || 'Failed to fetch invoice'
      };
    }

    return {
      data: data as InvoiceWithRelations,
      error: null
    };
  } catch (err) {
    console.error('Unexpected error fetching invoice with items:', err);
    return {
      data: null,
      error: 'An unexpected error occurred while fetching the invoice'
    };
  }
}

/**
 * Updates an invoice's information (does not update items)
 * @param invoice_id - The UUID of the invoice
 * @param updates - Object containing fields to update
 * @returns Promise with updated invoice data and error
 */
export async function updateInvoice(
  invoice_id: string,
  updates: Partial<Omit<InvoiceInsert, 'id' | 'created_at' | 'updated_at'>>
): Promise<ServiceResponse<InvoiceRow>> {
  try {
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(invoice_id)) {
      return {
        data: null,
        error: 'Invalid invoice ID format'
      };
    }

    // Validate status if provided
    if (updates.status && !['draft', 'sent', 'paid', 'overdue'].includes(updates.status)) {
      return {
        data: null,
        error: 'Invalid status. Must be one of: draft, sent, paid, overdue'
      };
    }

    // Validate date formats if provided
    if (updates.date_issued && !isValidDateString(updates.date_issued)) {
      return {
        data: null,
        error: 'Invalid date_issued format. Use YYYY-MM-DD'
      };
    }

    if (updates.due_date && !isValidDateString(updates.due_date)) {
      return {
        data: null,
        error: 'Invalid due_date format. Use YYYY-MM-DD'
      };
    }

    const { data, error } = await supabase
      .from('invoices')
      .update(updates)
      .eq('id', invoice_id)
      .select()
      .single();

    if (error) {
      console.error('Error updating invoice:', error);
      
      if (error.code === 'PGRST116') {
        return {
          data: null,
          error: 'Invoice not found'
        };
      }
      
      if (error.code === '23505') {
        return {
          data: null,
          error: 'Invoice number already exists'
        };
      }
      
      return {
        data: null,
        error: error.message || 'Failed to update invoice'
      };
    }

    return {
      data,
      error: null
    };
  } catch (err) {
    console.error('Unexpected error updating invoice:', err);
    return {
      data: null,
      error: 'An unexpected error occurred while updating the invoice'
    };
  }
}

/**
 * Deletes an invoice and all its items
 * @param invoice_id - The UUID of the invoice
 * @returns Promise with success status and error
 */
export async function deleteInvoice(invoice_id: string): Promise<ServiceResponse<boolean>> {
  try {
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(invoice_id)) {
      return {
        data: null,
        error: 'Invalid invoice ID format'
      };
    }

    // Delete invoice (items will be deleted automatically due to CASCADE)
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', invoice_id);

    if (error) {
      console.error('Error deleting invoice:', error);
      return {
        data: null,
        error: error.message || 'Failed to delete invoice'
      };
    }

    return {
      data: true,
      error: null
    };
  } catch (err) {
    console.error('Unexpected error deleting invoice:', err);
    return {
      data: null,
      error: 'An unexpected error occurred while deleting the invoice'
    };
  }
}

/**
 * Gets invoice statistics for a freelancer
 * @param freelancer_id - The UUID of the freelancer
 * @returns Promise with statistics and error
 */
export async function getInvoiceStats(freelancer_id: string): Promise<ServiceResponse<{
  total_invoices: number;
  total_amount: number;
  paid_amount: number;
  pending_amount: number;
  overdue_amount: number;
}>> {
  try {
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(freelancer_id)) {
      return {
        data: null,
        error: 'Invalid freelancer ID format'
      };
    }

    const { data, error } = await supabase
      .from('invoices')
      .select('total, status')
      .eq('freelancer_id', freelancer_id);

    if (error) {
      console.error('Error fetching invoice stats:', error);
      return {
        data: null,
        error: error.message || 'Failed to fetch invoice statistics'
      };
    }

    const stats = {
      total_invoices: data.length,
      total_amount: data.reduce((sum, inv) => sum + inv.total, 0),
      paid_amount: data.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.total, 0),
      pending_amount: data.filter(inv => inv.status === 'sent').reduce((sum, inv) => sum + inv.total, 0),
      overdue_amount: data.filter(inv => inv.status === 'overdue').reduce((sum, inv) => sum + inv.total, 0),
    };

    return {
      data: stats,
      error: null
    };
  } catch (err) {
    console.error('Unexpected error fetching invoice stats:', err);
    return {
      data: null,
      error: 'An unexpected error occurred while fetching invoice statistics'
    };
  }
}

// Helper functions for validation

/**
 * Validates invoice input data
 */
function validateInvoiceInput(invoice: CreateInvoiceInput & { invoice_number: string }, items: CreateInvoiceItemInput[]): string | null {
  // Validate required fields
  if (!invoice.freelancer_id || !invoice.client_id || !invoice.invoice_number) {
    return 'Missing required fields: freelancer_id, client_id, or invoice_number';
  }

  // Validate UUID formats
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(invoice.freelancer_id)) {
    return 'Invalid freelancer_id format';
  }
  if (!uuidRegex.test(invoice.client_id)) {
    return 'Invalid client_id format';
  }

  // Validate date formats
  if (!isValidDateString(invoice.date_issued)) {
    return 'Invalid date_issued format. Use YYYY-MM-DD';
  }
  if (!isValidDateString(invoice.due_date)) {
    return 'Invalid due_date format. Use YYYY-MM-DD';
  }

  // Validate numeric fields
  if (invoice.subtotal < 0 || invoice.tax_rate < 0 || invoice.tax_amount < 0 || invoice.total < 0) {
    return 'Numeric fields cannot be negative';
  }

  // Validate status
  if (invoice.status && !['draft', 'sent', 'paid', 'overdue'].includes(invoice.status)) {
    return 'Invalid status. Must be one of: draft, sent, paid, overdue';
  }

  // Validate items
  if (!items || items.length === 0) {
    return 'At least one invoice item is required';
  }

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!item.description.trim()) {
      return `Item ${i + 1}: Description is required`;
    }
    if (item.quantity <= 0) {
      return `Item ${i + 1}: Quantity must be greater than 0`;
    }
    if (item.rate < 0) {
      return `Item ${i + 1}: Rate cannot be negative`;
    }
    if (item.amount < 0) {
      return `Item ${i + 1}: Amount cannot be negative`;
    }
  }

  return null;
}

/**
 * Validates that freelancer and client exist and are related
 */
async function validateInvoiceRelationships(invoice: CreateInvoiceInput & { invoice_number: string }): Promise<string | null> {
  try {
    // Check if freelancer exists
    const { data: freelancer, error: freelancerError } = await supabase
      .from('freelancers')
      .select('id')
      .eq('id', invoice.freelancer_id)
      .single();

    if (freelancerError || !freelancer) {
      return 'Freelancer not found';
    }

    // Check if client exists and belongs to the freelancer
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, freelancer_id')
      .eq('id', invoice.client_id)
      .single();

    if (clientError || !client) {
      return 'Client not found';
    }

    if (client.freelancer_id !== invoice.freelancer_id) {
      return 'Client does not belong to the specified freelancer';
    }

    return null;
  } catch (err) {
    console.error('Error validating relationships:', err);
    return 'Failed to validate invoice relationships';
  }
}

/**
 * Validates date string format (YYYY-MM-DD)
 */
function isValidDateString(dateString: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) {
    return false;
  }
  
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime()) && date.toISOString().slice(0, 10) === dateString;
}