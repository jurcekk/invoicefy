export interface FreelancerInfo {
  id: string;
  name: string;
  email: string;
  address: string;
  phone?: string;
  website?: string;
}

export interface Client {
  id: string;
  companyName: string;
  contactName?: string;
  email: string;
  address?: string;
  phone?: string;
  createdAt: Date;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  dateIssued: Date;
  dueDate: Date;
  freelancer: FreelancerInfo;
  client: Client;
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceForm {
  invoiceNumber: string;
  dateIssued: string;
  dueDate: string;
  clientId: string;
  items: Omit<InvoiceItem, 'id' | 'amount'>[];
  taxRate: number;
  notes?: string;
}

export interface AppStore {
  // Freelancer
  freelancer: FreelancerInfo | null;
  setFreelancer: (freelancer: FreelancerInfo) => void;
  
  // Clients
  clients: Client[];
  addClient: (client: Omit<Client, 'id' | 'createdAt'>) => void;
  updateClient: (id: string, client: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  getClient: (id: string) => Client | undefined;
  
  // Invoices
  invoices: Invoice[];
  addInvoice: (invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateInvoice: (id: string, invoice: Partial<Invoice>) => void;
  deleteInvoice: (id: string) => void;
  getInvoice: (id: string) => Invoice | undefined;
  
  // Invoice counter
  invoiceCounter: number;
  incrementInvoiceCounter: () => void;
  
  // UI State
  activeTab: 'invoices' | 'clients' | 'settings';
  setActiveTab: (tab: 'invoices' | 'clients' | 'settings') => void;
}