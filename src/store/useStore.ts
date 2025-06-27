import { create } from 'zustand';
import { AppStore, FreelancerInfo, Client, Invoice } from '../types';
import { 
  createFreelancer, 
  getFreelancerById, 
  updateFreelancer,
  getAllFreelancers
} from '../services/freelancerService';
import { 
  createClient, 
  getClientsForFreelancer, 
  updateClient as updateClientService, 
  deleteClient as deleteClientService 
} from '../services/clientService';
import { 
  createInvoice, 
  getInvoicesForFreelancer, 
  updateInvoice as updateInvoiceService, 
  deleteInvoice as deleteInvoiceService,
  getNextInvoiceNumber 
} from '../services/invoiceService';
import { supabase } from '../lib/supabaseClient';

interface AppState extends AppStore {
  // Loading states
  isLoading: boolean;
  isLoadingClients: boolean;
  isLoadingInvoices: boolean;
  
  // Error states
  error: string | null;
  clientError: string | null;
  invoiceError: string | null;
  
  // Initialization
  isInitialized: boolean;
  initializeApp: () => Promise<void>;
  
  // Clear errors
  clearError: () => void;
  clearClientError: () => void;
  clearInvoiceError: () => void;
  
  // Clear all data (for sign out)
  clearAllData: () => void;
}

export const useStore = create<AppState>((set, get) => ({
  // Initial state
  freelancer: null,
  clients: [],
  invoices: [],
  invoiceCounter: 1,
  activeTab: 'invoices',
  
  // Loading states
  isLoading: false,
  isLoadingClients: false,
  isLoadingInvoices: false,
  
  // Error states
  error: null,
  clientError: null,
  invoiceError: null,
  
  // Initialization
  isInitialized: false,

  // Clear all data (for sign out)
  clearAllData: () => {
    set({
      freelancer: null,
      clients: [],
      invoices: [],
      invoiceCounter: 1,
      activeTab: 'invoices',
      isLoading: false,
      isLoadingClients: false,
      isLoadingInvoices: false,
      error: null,
      clientError: null,
      invoiceError: null,
      isInitialized: false
    });
  },

  // Initialize app - load freelancer data for current user
  initializeApp: async () => {
    set({ isLoading: true, error: null });
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        set({ error: 'No authenticated user found', isLoading: false, isInitialized: true });
        return;
      }

      // Try to find existing freelancer for this user
      const { data: freelancers, error: freelancersError } = await getAllFreelancers();
      
      if (freelancersError) {
        console.error('Error loading freelancers:', freelancersError);
        set({ error: freelancersError, isLoading: false, isInitialized: true });
        return;
      }
      
      // Find freelancer for current user (check both user_id and id for legacy support)
      const userFreelancer = freelancers?.find(f => f.user_id === user.id || f.id === user.id);
      
      if (userFreelancer) {
        const transformedFreelancer: FreelancerInfo = {
          id: userFreelancer.id,
          name: userFreelancer.name,
          email: userFreelancer.email,
          address: userFreelancer.address,
          phone: userFreelancer.phone || undefined,
          website: userFreelancer.website || undefined
        };
        
        set({ freelancer: transformedFreelancer });
        
        // Load clients and invoices for this freelancer
        await Promise.all([
          get().loadClients(userFreelancer.id),
          get().loadInvoices(userFreelancer.id)
        ]);
      }
      
      set({ isLoading: false, isInitialized: true });
    } catch (err) {
      console.error('Error initializing app:', err);
      set({ 
        error: 'Failed to initialize application', 
        isLoading: false, 
        isInitialized: true 
      });
    }
  },

  // Load clients for current freelancer
  loadClients: async (freelancerId: string) => {
    set({ isLoadingClients: true, clientError: null });
    
    try {
      const { data: clients, error } = await getClientsForFreelancer(freelancerId);
      
      if (error) {
        set({ clientError: error, isLoadingClients: false });
        return;
      }
      
      // Transform database format to app format
      const transformedClients: Client[] = (clients || []).map(client => ({
        id: client.id,
        companyName: client.company_name,
        contactName: client.contact_name || undefined,
        email: client.email,
        address: client.address || undefined,
        phone: client.phone || undefined,
        createdAt: new Date(client.created_at || Date.now())
      }));
      
      set({ clients: transformedClients, isLoadingClients: false });
    } catch (err) {
      console.error('Error loading clients:', err);
      set({ 
        clientError: 'Failed to load clients', 
        isLoadingClients: false 
      });
    }
  },

  // Load invoices for current freelancer
  loadInvoices: async (freelancerId: string) => {
    set({ isLoadingInvoices: true, invoiceError: null });
    
    try {
      const { data: invoices, error } = await getInvoicesForFreelancer(freelancerId, true);
      
      if (error) {
        set({ invoiceError: error, isLoadingInvoices: false });
        return;
      }
      
      // Transform database format to app format
      const transformedInvoices: Invoice[] = (invoices || []).map((invoice: any) => ({
        id: invoice.id,
        invoiceNumber: invoice.invoice_number,
        dateIssued: new Date(invoice.date_issued),
        dueDate: new Date(invoice.due_date),
        freelancer: {
          id: invoice.freelancer.id,
          name: invoice.freelancer.name,
          email: invoice.freelancer.email,
          address: invoice.freelancer.address,
          phone: invoice.freelancer.phone || undefined,
          website: invoice.freelancer.website || undefined
        },
        client: {
          id: invoice.client.id,
          companyName: invoice.client.company_name,
          contactName: invoice.client.contact_name || undefined,
          email: invoice.client.email,
          address: invoice.client.address || undefined,
          phone: invoice.client.phone || undefined,
          createdAt: new Date(invoice.client.created_at || Date.now())
        },
        items: (invoice.items || []).map((item: any) => ({
          id: item.id,
          description: item.description,
          quantity: item.quantity,
          rate: item.rate,
          amount: item.amount
        })),
        subtotal: invoice.subtotal,
        taxRate: invoice.tax_rate,
        taxAmount: invoice.tax_amount,
        total: invoice.total,
        status: invoice.status,
        notes: invoice.notes || undefined,
        createdAt: new Date(invoice.created_at || Date.now()),
        updatedAt: new Date(invoice.updated_at || Date.now())
      }));
      
      set({ invoices: transformedInvoices, isLoadingInvoices: false });
    } catch (err) {
      console.error('Error loading invoices:', err);
      set({ 
        invoiceError: 'Failed to load invoices', 
        isLoadingInvoices: false 
      });
    }
  },

  // Freelancer actions
  setFreelancer: async (freelancerData: FreelancerInfo) => {
    set({ isLoading: true, error: null });
    
    try {
      const currentFreelancer = get().freelancer;
      
      if (currentFreelancer) {
        // Update existing freelancer
        const { data: updatedFreelancer, error } = await updateFreelancer(currentFreelancer.id, {
          name: freelancerData.name,
          email: freelancerData.email,
          address: freelancerData.address,
          phone: freelancerData.phone || null,
          website: freelancerData.website || null
        });
        
        if (error) {
          set({ error, isLoading: false });
          return;
        }
        
        if (updatedFreelancer) {
          const transformedFreelancer: FreelancerInfo = {
            id: updatedFreelancer.id,
            name: updatedFreelancer.name,
            email: updatedFreelancer.email,
            address: updatedFreelancer.address,
            phone: updatedFreelancer.phone || undefined,
            website: updatedFreelancer.website || undefined
          };
          
          set({ freelancer: transformedFreelancer, isLoading: false });
        }
      } else {
        // Create new freelancer
        const { data: newFreelancer, error } = await createFreelancer({
          name: freelancerData.name,
          email: freelancerData.email,
          address: freelancerData.address,
          phone: freelancerData.phone,
          website: freelancerData.website
        });
        
        if (error) {
          set({ error, isLoading: false });
          return;
        }
        
        if (newFreelancer) {
          const transformedFreelancer: FreelancerInfo = {
            id: newFreelancer.id,
            name: newFreelancer.name,
            email: newFreelancer.email,
            address: newFreelancer.address,
            phone: newFreelancer.phone || undefined,
            website: newFreelancer.website || undefined
          };
          
          set({ freelancer: transformedFreelancer, isLoading: false });
        }
      }
    } catch (err) {
      console.error('Error saving freelancer:', err);
      set({ 
        error: 'Failed to save freelancer information', 
        isLoading: false 
      });
    }
  },

  // Client actions
  addClient: async (clientData) => {
    const freelancer = get().freelancer;
    if (!freelancer) {
      set({ clientError: 'No freelancer found. Please set up your profile first.' });
      return;
    }
    
    set({ isLoadingClients: true, clientError: null });
    
    try {
      const { data: newClient, error } = await createClient({
        freelancer_id: freelancer.id,
        company_name: clientData.companyName,
        email: clientData.email,
        contact_name: clientData.contactName,
        address: clientData.address,
        phone: clientData.phone
      });
      
      if (error) {
        set({ clientError: error, isLoadingClients: false });
        return;
      }
      
      if (newClient) {
        const transformedClient: Client = {
          id: newClient.id,
          companyName: newClient.company_name,
          contactName: newClient.contact_name || undefined,
          email: newClient.email,
          address: newClient.address || undefined,
          phone: newClient.phone || undefined,
          createdAt: new Date(newClient.created_at || Date.now())
        };
        
        const clients = [...get().clients, transformedClient];
        set({ clients, isLoadingClients: false });
      }
    } catch (err) {
      console.error('Error adding client:', err);
      set({ 
        clientError: 'Failed to add client', 
        isLoadingClients: false 
      });
    }
  },

  updateClient: async (id, updateData) => {
    set({ isLoadingClients: true, clientError: null });
    
    try {
      const { data: updatedClient, error } = await updateClientService(id, {
        company_name: updateData.companyName,
        contact_name: updateData.contactName,
        email: updateData.email,
        address: updateData.address,
        phone: updateData.phone
      });
      
      if (error) {
        set({ clientError: error, isLoadingClients: false });
        return;
      }
      
      if (updatedClient) {
        const clients = get().clients.map(client =>
          client.id === id ? {
            ...client,
            companyName: updatedClient.company_name,
            contactName: updatedClient.contact_name || undefined,
            email: updatedClient.email,
            address: updatedClient.address || undefined,
            phone: updatedClient.phone || undefined
          } : client
        );
        
        set({ clients, isLoadingClients: false });
      }
    } catch (err) {
      console.error('Error updating client:', err);
      set({ 
        clientError: 'Failed to update client', 
        isLoadingClients: false 
      });
    }
  },

  deleteClient: async (id) => {
    set({ isLoadingClients: true, clientError: null });
    
    try {
      const { error } = await deleteClientService(id);
      
      if (error) {
        set({ clientError: error, isLoadingClients: false });
        return;
      }
      
      const clients = get().clients.filter(client => client.id !== id);
      set({ clients, isLoadingClients: false });
    } catch (err) {
      console.error('Error deleting client:', err);
      set({ 
        clientError: 'Failed to delete client', 
        isLoadingClients: false 
      });
    }
  },

  getClient: (id) => get().clients.find(client => client.id === id),

  // Invoice actions
  addInvoice: async (invoiceData) => {
    const freelancer = get().freelancer;
    if (!freelancer) {
      set({ invoiceError: 'No freelancer found. Please set up your profile first.' });
      return;
    }
    
    set({ isLoadingInvoices: true, invoiceError: null });
    
    try {
      // Prepare invoice data for database
      const dbInvoiceData = {
        freelancer_id: freelancer.id,
        client_id: invoiceData.client.id,
        date_issued: invoiceData.dateIssued.toISOString().split('T')[0],
        due_date: invoiceData.dueDate.toISOString().split('T')[0],
        subtotal: invoiceData.subtotal,
        tax_rate: invoiceData.taxRate,
        tax_amount: invoiceData.taxAmount,
        total: invoiceData.total,
        status: invoiceData.status,
        notes: invoiceData.notes
      };
      
      // Prepare items data
      const dbItemsData = invoiceData.items.map(item => ({
        description: item.description,
        quantity: item.quantity,
        rate: item.rate,
        amount: item.amount
      }));
      
      const { data: newInvoice, error } = await createInvoice(dbInvoiceData, dbItemsData);
      
      if (error) {
        set({ invoiceError: error, isLoadingInvoices: false });
        return;
      }
      
      if (newInvoice) {
        const transformedInvoice: Invoice = {
          id: newInvoice.id,
          invoiceNumber: newInvoice.invoice_number,
          dateIssued: new Date(newInvoice.date_issued),
          dueDate: new Date(newInvoice.due_date),
          freelancer: invoiceData.freelancer,
          client: invoiceData.client,
          items: newInvoice.items.map(item => ({
            id: item.id,
            description: item.description,
            quantity: item.quantity,
            rate: item.rate,
            amount: item.amount
          })),
          subtotal: newInvoice.subtotal,
          taxRate: newInvoice.tax_rate,
          taxAmount: newInvoice.tax_amount,
          total: newInvoice.total,
          status: newInvoice.status,
          notes: newInvoice.notes || undefined,
          createdAt: new Date(newInvoice.created_at || Date.now()),
          updatedAt: new Date(newInvoice.updated_at || Date.now())
        };
        
        const invoices = [...get().invoices, transformedInvoice];
        set({ invoices, isLoadingInvoices: false });
      }
    } catch (err) {
      console.error('Error adding invoice:', err);
      set({ 
        invoiceError: 'Failed to create invoice', 
        isLoadingInvoices: false 
      });
    }
  },

  updateInvoice: async (id, updateData) => {
    set({ isLoadingInvoices: true, invoiceError: null });
    
    try {
      const dbUpdateData: any = {};
      
      if (updateData.status) dbUpdateData.status = updateData.status;
      if (updateData.notes !== undefined) dbUpdateData.notes = updateData.notes;
      if (updateData.dateIssued) dbUpdateData.date_issued = updateData.dateIssued.toISOString().split('T')[0];
      if (updateData.dueDate) dbUpdateData.due_date = updateData.dueDate.toISOString().split('T')[0];
      
      const { data: updatedInvoice, error } = await updateInvoiceService(id, dbUpdateData);
      
      if (error) {
        set({ invoiceError: error, isLoadingInvoices: false });
        return;
      }
      
      if (updatedInvoice) {
        const invoices = get().invoices.map(invoice =>
          invoice.id === id ? {
            ...invoice,
            status: updatedInvoice.status,
            notes: updatedInvoice.notes || undefined,
            dateIssued: new Date(updatedInvoice.date_issued),
            dueDate: new Date(updatedInvoice.due_date),
            updatedAt: new Date(updatedInvoice.updated_at || Date.now())
          } : invoice
        );
        
        set({ invoices, isLoadingInvoices: false });
      }
    } catch (err) {
      console.error('Error updating invoice:', err);
      set({ 
        invoiceError: 'Failed to update invoice', 
        isLoadingInvoices: false 
      });
    }
  },

  deleteInvoice: async (id) => {
    set({ isLoadingInvoices: true, invoiceError: null });
    
    try {
      const { error } = await deleteInvoiceService(id);
      
      if (error) {
        set({ invoiceError: error, isLoadingInvoices: false });
        return;
      }
      
      const invoices = get().invoices.filter(invoice => invoice.id !== id);
      set({ invoices, isLoadingInvoices: false });
    } catch (err) {
      console.error('Error deleting invoice:', err);
      set({ 
        invoiceError: 'Failed to delete invoice', 
        isLoadingInvoices: false 
      });
    }
  },

  getInvoice: (id) => get().invoices.find(invoice => invoice.id === id),

  // Invoice counter (now handled by database)
  invoiceCounter: 1,
  incrementInvoiceCounter: () => {
    // This is now handled automatically by the database service
    // Keep for compatibility but it's not used
  },

  // UI State
  setActiveTab: (tab) => set({ activeTab: tab }),

  // Error clearing
  clearError: () => set({ error: null }),
  clearClientError: () => set({ clientError: null }),
  clearInvoiceError: () => set({ invoiceError: null })
}));