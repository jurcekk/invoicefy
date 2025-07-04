import React, { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { Invoice } from '../../types';
import { formatCurrency } from '../../utils/calculations';
import { PDFService } from '../../services/pdfService';
import { FileText, Download, Edit, Trash2, Search, AlertCircle, Loader, Eye } from 'lucide-react';
import dayjs from 'dayjs';

export const InvoiceList: React.FC = () => {
  const { 
    invoices, 
    deleteInvoice, 
    updateInvoice, 
    isLoadingInvoices, 
    invoiceError, 
    clearInvoiceError 
  } = useStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [downloadingInvoice, setDownloadingInvoice] = useState<string | null>(null);

  // Clear errors when component mounts
  useEffect(() => {
    clearInvoiceError();
  }, [clearInvoiceError]);

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = 
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.client.companyName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleDownloadPDF = async (invoice: Invoice) => {
    try {
      setDownloadingInvoice(invoice.id);
      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay for UX
      PDFService.generateInvoicePDF(invoice);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Error downloading PDF. Please try again.');
    } finally {
      setDownloadingInvoice(null);
    }
  };

  const handlePreviewPDF = async (invoice: Invoice) => {
    try {
      PDFService.previewInvoicePDF(invoice);
    } catch (error) {
      console.error('Error previewing PDF:', error);
      alert('Error previewing PDF. Please try again.');
    }
  };

  const handleStatusChange = async (invoiceId: string, newStatus: Invoice['status']) => {
    await updateInvoice(invoiceId, { status: newStatus });
  };

  const handleDelete = async (invoiceId: string) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      await deleteInvoice(invoiceId);
    }
  };

  const getStatusColor = (status: Invoice['status']) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatStatus = (status: Invoice['status']) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  if (isLoadingInvoices) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-900">Invoices</h2>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <Loader className="w-8 h-8 text-blue-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Loading invoices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Invoices</h2>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search invoices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
      </div>

      {/* Error Message */}
      {invoiceError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
            <p className="text-red-800">{invoiceError}</p>
            <button
              onClick={clearInvoiceError}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Invoice Cards */}
      {filteredInvoices.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || statusFilter !== 'all' ? 'No invoices found' : 'No invoices yet'}
          </h3>
          <p className="text-gray-600">
            {searchTerm || statusFilter !== 'all' 
              ? 'Try adjusting your search or filter criteria.'
              : 'Create your first invoice to get started.'
            }
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredInvoices
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .map((invoice) => (
              <div
                key={invoice.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200"
              >
                <div className="p-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {invoice.invoiceNumber}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                          {formatStatus(invoice.status)}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-1">{invoice.client.companyName}</p>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-sm text-gray-500">
                        <span>Issued: {dayjs(invoice.dateIssued).format('MMM DD, YYYY')}</span>
                        <span>Due: {dayjs(invoice.dueDate).format('MMM DD, YYYY')}</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">
                          {formatCurrency(invoice.total)}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <select
                          value={invoice.status}
                          onChange={(e) => handleStatusChange(invoice.id, e.target.value as Invoice['status'])}
                          disabled={isLoadingInvoices}
                          className="px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:opacity-50"
                        >
                          <option value="draft">Draft</option>
                          <option value="sent">Sent</option>
                          <option value="paid">Paid</option>
                          <option value="overdue">Overdue</option>
                        </select>
                        
                        <button
                          onClick={() => handlePreviewPDF(invoice)}
                          className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                          title="Preview PDF"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => handleDownloadPDF(invoice)}
                          disabled={downloadingInvoice === invoice.id}
                          className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors duration-200 disabled:opacity-50"
                          title="Download PDF"
                        >
                          {downloadingInvoice === invoice.id ? (
                            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <Download className="w-4 h-4" />
                          )}
                        </button>
                        
                        <button
                          onClick={() => handleDelete(invoice.id)}
                          disabled={isLoadingInvoices}
                          className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors duration-200 disabled:opacity-50"
                          title="Delete Invoice"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {invoice.notes && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">{invoice.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Summary Stats */}
      {filteredInvoices.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          {(['draft', 'sent', 'paid', 'overdue'] as const).map((status) => {
            const statusInvoices = filteredInvoices.filter(inv => inv.status === status);
            const total = statusInvoices.reduce((sum, inv) => sum + inv.total, 0);
            
            return (
              <div key={status} className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 capitalize">
                      {status}
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {statusInvoices.length}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Total</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatCurrency(total)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};