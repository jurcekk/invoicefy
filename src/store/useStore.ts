import { create } from 'zustand';
import { AppStore, FreelancerInfo, Client, Invoice } from '../types';
import { storageService } from '../services/storage';

export const useStore = create<AppStore>((set, get) => ({
  // Freelancer
  freelancer: storageService.getFreelancer(),
  setFreelancer: (freelancer: FreelancerInfo) => {
    storageService.saveFreelancer(freelancer);
    set({ freelancer });
  },

  // Clients
  clients: storageService.getClients(),
  addClient: (clientData) => {
    const client: Client = {
      ...clientData,
      id: `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
    };
    const clients = [...get().clients, client];
    storageService.saveClients(clients);
    set({ clients });
  },
  updateClient: (id, updateData) => {
    const clients = get().clients.map(client =>
      client.id === id ? { ...client, ...updateData } : client
    );
    storageService.saveClients(clients);
    set({ clients });
  },
  deleteClient: (id) => {
    const clients = get().clients.filter(client => client.id !== id);
    storageService.saveClients(clients);
    set({ clients });
  },
  getClient: (id) => get().clients.find(client => client.id === id),

  // Invoices
  invoices: storageService.getInvoices(),
  addInvoice: (invoiceData) => {
    const invoice: Invoice = {
      ...invoiceData,
      id: `invoice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const invoices = [...get().invoices, invoice];
    storageService.saveInvoices(invoices);
    set({ invoices });
  },
  updateInvoice: (id, updateData) => {
    const invoices = get().invoices.map(invoice =>
      invoice.id === id ? { ...invoice, ...updateData, updatedAt: new Date() } : invoice
    );
    storageService.saveInvoices(invoices);
    set({ invoices });
  },
  deleteInvoice: (id) => {
    const invoices = get().invoices.filter(invoice => invoice.id !== id);
    storageService.saveInvoices(invoices);
    set({ invoices });
  },
  getInvoice: (id) => get().invoices.find(invoice => invoice.id === id),

  // Invoice counter
  invoiceCounter: storageService.getInvoiceCounter(),
  incrementInvoiceCounter: () => {
    const counter = get().invoiceCounter + 1;
    storageService.saveInvoiceCounter(counter);
    set({ invoiceCounter: counter });
  },

  // UI State
  activeTab: 'invoices',
  setActiveTab: (tab) => set({ activeTab: tab }),
}));