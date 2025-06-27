import React, { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { InvoiceForm as InvoiceFormType, InvoiceItem } from '../../types';
import { calculateItemAmount, calculateSubtotal, calculateTaxAmount, calculateTotal, generateInvoiceNumber } from '../../utils/calculations';
import { Plus, Trash2, Save, FileText } from 'lucide-react';
import dayjs from 'dayjs';

interface InvoiceFormProps {
  onSave?: () => void;
}

export const InvoiceForm: React.FC<InvoiceFormProps> = ({ onSave }) => {
  const { 
    clients, 
    freelancer, 
    addInvoice, 
    invoiceCounter, 
    incrementInvoiceCounter 
  } = useStore();

  const [formData, setFormData] = useState<InvoiceFormType>({
    invoiceNumber: generateInvoiceNumber(invoiceCounter),
    dateIssued: dayjs().format('YYYY-MM-DD'),
    dueDate: dayjs().add(30, 'days').format('YYYY-MM-DD'),
    clientId: '',
    items: [{ description: '', quantity: 1, rate: 0 }],
    taxRate: 20,
    notes: '',
  });

  const [calculatedItems, setCalculatedItems] = useState<InvoiceItem[]>([]);
  const [totals, setTotals] = useState({
    subtotal: 0,
    taxAmount: 0,
    total: 0,
  });

  // Recalculate when items change
  useEffect(() => {
    const items: InvoiceItem[] = formData.items.map((item, index) => ({
      id: `item_${index}`,
      ...item,
      amount: calculateItemAmount(item.quantity, item.rate),
    }));

    const subtotal = calculateSubtotal(items);
    const taxAmount = calculateTaxAmount(subtotal, formData.taxRate);
    const total = calculateTotal(subtotal, taxAmount);

    setCalculatedItems(items);
    setTotals({ subtotal, taxAmount, total });
  }, [formData.items, formData.taxRate]);

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: '', quantity: 1, rate: 0 }],
    });
  };

  const handleRemoveItem = (index: number) => {
    if (formData.items.length > 1) {
      setFormData({
        ...formData,
        items: formData.items.filter((_, i) => i !== index),
      });
    }
  };

  const handleItemChange = (index: number, field: keyof typeof formData.items[0], value: string | number) => {
    const updatedItems = formData.items.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    setFormData({ ...formData, items: updatedItems });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!freelancer) {
      alert('Please set up your freelancer information in Settings first.');
      return;
    }

    const selectedClient = clients.find(c => c.id === formData.clientId);
    if (!selectedClient) {
      alert('Please select a client.');
      return;
    }

    const invoice = {
      invoiceNumber: formData.invoiceNumber,
      dateIssued: new Date(formData.dateIssued),
      dueDate: new Date(formData.dueDate),
      freelancer,
      client: selectedClient,
      items: calculatedItems,
      subtotal: totals.subtotal,
      taxRate: formData.taxRate,
      taxAmount: totals.taxAmount,
      total: totals.total,
      status: 'draft' as const,
      notes: formData.notes,
    };

    addInvoice(invoice);
    incrementInvoiceCounter();
    
    // Reset form
    setFormData({
      invoiceNumber: generateInvoiceNumber(invoiceCounter + 1),
      dateIssued: dayjs().format('YYYY-MM-DD'),
      dueDate: dayjs().add(30, 'days').format('YYYY-MM-DD'),
      clientId: '',
      items: [{ description: '', quantity: 1, rate: 0 }],
      taxRate: 20,
      notes: '',
    });

    onSave?.();
  };

  if (!freelancer) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-center py-8">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Set up your profile first</h3>
          <p className="text-gray-600 mb-4">You need to add your freelancer information before creating invoices.</p>
          <button
            onClick={() => useStore.getState().setActiveTab('settings')}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            Go to Settings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Create New Invoice</h2>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Invoice Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Invoice Number
            </label>
            <input
              type="text"
              value={formData.invoiceNumber}
              onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date Issued
            </label>
            <input
              type="date"
              value={formData.dateIssued}
              onChange={(e) => setFormData({ ...formData, dateIssued: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Due Date
            </label>
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              required
            />
          </div>
        </div>

        {/* Client Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Client
          </label>
          <select
            value={formData.clientId}
            onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            required
          >
            <option value="">Select a client</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.companyName}
              </option>
            ))}
          </select>
        </div>

        {/* Items */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-md font-medium text-gray-900">Items</h3>
            <button
              type="button"
              onClick={handleAddItem}
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors duration-200"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Item
            </button>
          </div>

          <div className="space-y-3">
            {formData.items.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-3 items-end p-4 bg-gray-50 rounded-lg">
                <div className="col-span-12 md:col-span-5">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Service description"
                    required
                  />
                </div>
                <div className="col-span-4 md:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    required
                  />
                </div>
                <div className="col-span-4 md:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Rate
                  </label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={item.rate}
                    onChange={(e) => handleItemChange(index, 'rate', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    required
                  />
                </div>
                <div className="col-span-3 md:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Amount
                  </label>
                  <div className="px-3 py-2 text-sm bg-gray-100 border border-gray-300 rounded-lg text-gray-900">
                    ${calculateItemAmount(item.quantity, item.rate).toFixed(2)}
                  </div>
                </div>
                <div className="col-span-1">
                  {formData.items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors duration-200"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tax Rate */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tax Rate (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={formData.taxRate}
              onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>
        </div>

        {/* Totals */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="space-y-2 max-w-xs ml-auto">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium">${totals.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tax ({formData.taxRate}%):</span>
              <span className="font-medium">${totals.taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-semibold border-t border-gray-300 pt-2">
              <span>Total:</span>
              <span>${totals.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes (Optional)
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            placeholder="Additional notes or payment terms..."
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
          >
            <Save className="w-4 h-4 mr-2" />
            Create Invoice
          </button>
        </div>
      </form>
    </div>
  );
};