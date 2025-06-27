import { FreelancerInfo, Client, Invoice } from '../types';

const STORAGE_KEYS = {
  FREELANCER: 'invoice_app_freelancer',
  CLIENTS: 'invoice_app_clients',
  INVOICES: 'invoice_app_invoices',
  INVOICE_COUNTER: 'invoice_app_counter',
} as const;

class StorageService {
  // Freelancer
  getFreelancer(): FreelancerInfo | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FREELANCER);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error loading freelancer data:', error);
      return null;
    }
  }

  saveFreelancer(freelancer: FreelancerInfo): void {
    try {
      localStorage.setItem(STORAGE_KEYS.FREELANCER, JSON.stringify(freelancer));
    } catch (error) {
      console.error('Error saving freelancer data:', error);
    }
  }

  // Clients
  getClients(): Client[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CLIENTS);
      if (!data) return [];
      
      const clients = JSON.parse(data);
      return clients.map((client: any) => ({
        ...client,
        createdAt: new Date(client.createdAt),
      }));
    } catch (error) {
      console.error('Error loading clients:', error);
      return [];
    }
  }

  saveClients(clients: Client[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
    } catch (error) {
      console.error('Error saving clients:', error);
    }
  }

  // Invoices
  getInvoices(): Invoice[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.INVOICES);
      if (!data) return [];
      
      const invoices = JSON.parse(data);
      return invoices.map((invoice: any) => ({
        ...invoice,
        dateIssued: new Date(invoice.dateIssued),
        dueDate: new Date(invoice.dueDate),
        createdAt: new Date(invoice.createdAt),
        updatedAt: new Date(invoice.updatedAt),
      }));
    } catch (error) {
      console.error('Error loading invoices:', error);
      return [];
    }
  }

  saveInvoices(invoices: Invoice[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
    } catch (error) {
      console.error('Error saving invoices:', error);
    }
  }

  // Invoice Counter
  getInvoiceCounter(): number {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.INVOICE_COUNTER);
      return data ? parseInt(data, 10) : 1;
    } catch (error) {
      console.error('Error loading invoice counter:', error);
      return 1;
    }
  }

  saveInvoiceCounter(counter: number): void {
    try {
      localStorage.setItem(STORAGE_KEYS.INVOICE_COUNTER, counter.toString());
    } catch (error) {
      console.error('Error saving invoice counter:', error);
    }
  }

  // Utility methods
  clearAll(): void {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }

  exportData(): string {
    const data = {
      freelancer: this.getFreelancer(),
      clients: this.getClients(),
      invoices: this.getInvoices(),
      counter: this.getInvoiceCounter(),
    };
    return JSON.stringify(data, null, 2);
  }

  importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.freelancer) this.saveFreelancer(data.freelancer);
      if (data.clients) this.saveClients(data.clients);
      if (data.invoices) this.saveInvoices(data.invoices);
      if (data.counter) this.saveInvoiceCounter(data.counter);
      
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }
}

export const storageService = new StorageService();