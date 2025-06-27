import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { Invoice } from '../types';
import { formatCurrency } from '../utils/calculations';
import dayjs from 'dayjs';

// Set up fonts for pdfMake
pdfMake.vfs = pdfFonts.pdfMake.vfs;

export class PDFService {
  static generateInvoicePDF(invoice: Invoice): void {
    const documentDefinition = {
      content: [
        // Header with Invoice Title and Number
        {
          columns: [
            {
              text: 'INVOICE',
              style: 'header',
              width: '*'
            },
            {
              stack: [
                {
                  text: [
                    { text: 'Invoice #: ', style: 'label' },
                    { text: invoice.invoiceNumber, style: 'invoiceNumber' }
                  ],
                  alignment: 'right' as const
                },
                {
                  text: [
                    { text: 'Status: ', style: 'label' },
                    { text: invoice.status.toUpperCase(), style: 'status' }
                  ],
                  alignment: 'right' as const,
                  margin: [0, 5, 0, 0]
                }
              ],
              width: 'auto'
            }
          ],
          margin: [0, 0, 0, 30]
        },

        // Invoice Details
        {
          columns: [
            {
              stack: [
                {
                  text: [
                    { text: 'Date Issued: ', style: 'label' },
                    { text: dayjs(invoice.dateIssued).format('MMM DD, YYYY'), style: 'value' }
                  ]
                },
                {
                  text: [
                    { text: 'Due Date: ', style: 'label' },
                    { text: dayjs(invoice.dueDate).format('MMM DD, YYYY'), style: 'value' }
                  ],
                  margin: [0, 5, 0, 0]
                }
              ],
              width: '*'
            },
            {
              text: '', // Empty column for spacing
              width: 'auto'
            }
          ],
          margin: [0, 0, 0, 30]
        },

        // From/To Section
        {
          columns: [
            {
              stack: [
                { text: 'From:', style: 'sectionHeader' },
                { text: invoice.freelancer.name, style: 'fromToText', bold: true },
                { text: invoice.freelancer.email, style: 'fromToText' },
                { text: invoice.freelancer.address, style: 'fromToText' },
                ...(invoice.freelancer.phone ? [{ text: invoice.freelancer.phone, style: 'fromToText' }] : []),
                ...(invoice.freelancer.website ? [{ text: invoice.freelancer.website, style: 'fromToText', color: '#2563eb' }] : [])
              ],
              width: '*'
            },
            {
              stack: [
                { text: 'To:', style: 'sectionHeader' },
                { text: invoice.client.companyName, style: 'fromToText', bold: true },
                ...(invoice.client.contactName ? [{ text: invoice.client.contactName, style: 'fromToText' }] : []),
                { text: invoice.client.email, style: 'fromToText' },
                ...(invoice.client.address ? [{ text: invoice.client.address, style: 'fromToText' }] : []),
                ...(invoice.client.phone ? [{ text: invoice.client.phone, style: 'fromToText' }] : [])
              ],
              width: '*'
            }
          ],
          margin: [0, 0, 0, 40]
        },

        // Items Table
        {
          table: {
            headerRows: 1,
            widths: ['*', 'auto', 'auto', 'auto'],
            body: [
              [
                { text: 'Description', style: 'tableHeader' },
                { text: 'Qty', style: 'tableHeader', alignment: 'center' },
                { text: 'Rate', style: 'tableHeader', alignment: 'right' },
                { text: 'Amount', style: 'tableHeader', alignment: 'right' }
              ],
              ...invoice.items.map(item => [
                { text: item.description, style: 'tableCell' },
                { text: item.quantity.toString(), style: 'tableCell', alignment: 'center' },
                { text: formatCurrency(item.rate), style: 'tableCell', alignment: 'right' },
                { text: formatCurrency(item.amount), style: 'tableCell', alignment: 'right' }
              ])
            ]
          },
          layout: {
            hLineWidth: (i: number, node: any) => {
              return (i === 0 || i === node.table.body.length) ? 2 : 1;
            },
            vLineWidth: () => 1,
            hLineColor: (i: number, node: any) => {
              return (i === 0 || i === node.table.body.length) ? '#374151' : '#e5e7eb';
            },
            vLineColor: () => '#e5e7eb',
            paddingLeft: () => 12,
            paddingRight: () => 12,
            paddingTop: () => 10,
            paddingBottom: () => 10
          },
          margin: [0, 0, 0, 30]
        },

        // Totals Section
        {
          columns: [
            { width: '*', text: '' },
            {
              width: 220,
              table: {
                body: [
                  [
                    { text: 'Subtotal:', style: 'totalLabel', border: [false, false, false, false] },
                    { text: formatCurrency(invoice.subtotal), style: 'totalValue', border: [false, false, false, false] }
                  ],
                  [
                    { text: `Tax (${invoice.taxRate}%):`, style: 'totalLabel', border: [false, false, false, false] },
                    { text: formatCurrency(invoice.taxAmount), style: 'totalValue', border: [false, false, false, false] }
                  ],
                  [
                    { text: 'Total:', style: 'totalLabelFinal', border: [false, true, false, false] },
                    { text: formatCurrency(invoice.total), style: 'totalValueFinal', border: [false, true, false, false] }
                  ]
                ]
              },
              layout: {
                hLineWidth: (i: number) => i === 2 ? 2 : 0,
                vLineWidth: () => 0,
                hLineColor: () => '#374151',
                paddingTop: () => 8,
                paddingBottom: () => 8,
                paddingLeft: () => 0,
                paddingRight: () => 0
              }
            }
          ],
          margin: [0, 0, 0, 30]
        },

        // Notes Section
        ...(invoice.notes ? [
          { text: 'Notes:', style: 'sectionHeader', margin: [0, 20, 0, 10] },
          { 
            text: invoice.notes, 
            style: 'notes',
            background: '#f9fafb',
            margin: [0, 0, 0, 20]
          }
        ] : []),

        // Footer
        {
          text: `Generated on ${dayjs().format('MMM DD, YYYY')} • InvoicePro`,
          style: 'footer',
          alignment: 'center',
          margin: [0, 30, 0, 0]
        }
      ],

      styles: {
        header: {
          fontSize: 32,
          bold: true,
          color: '#1f2937',
          margin: [0, 0, 0, 10]
        },
        invoiceNumber: {
          fontSize: 14,
          bold: true,
          color: '#2563eb'
        },
        status: {
          fontSize: 12,
          bold: true,
          color: '#059669'
        },
        label: {
          fontSize: 11,
          color: '#6b7280',
          bold: true
        },
        value: {
          fontSize: 11,
          color: '#374151'
        },
        sectionHeader: {
          fontSize: 14,
          bold: true,
          color: '#374151',
          margin: [0, 0, 0, 8]
        },
        fromToText: {
          fontSize: 11,
          color: '#4b5563',
          lineHeight: 1.4,
          margin: [0, 2, 0, 0]
        },
        tableHeader: {
          fontSize: 12,
          bold: true,
          color: '#374151',
          fillColor: '#f3f4f6'
        },
        tableCell: {
          fontSize: 11,
          color: '#374151',
          lineHeight: 1.4
        },
        totalLabel: {
          fontSize: 11,
          color: '#6b7280',
          alignment: 'right',
          margin: [0, 4, 0, 4]
        },
        totalValue: {
          fontSize: 11,
          color: '#374151',
          alignment: 'right',
          margin: [0, 4, 0, 4]
        },
        totalLabelFinal: {
          fontSize: 13,
          bold: true,
          color: '#374151',
          alignment: 'right',
          margin: [0, 8, 0, 8]
        },
        totalValueFinal: {
          fontSize: 13,
          bold: true,
          color: '#2563eb',
          alignment: 'right',
          margin: [0, 8, 0, 8]
        },
        notes: {
          fontSize: 11,
          color: '#4b5563',
          lineHeight: 1.5,
          italics: true
        },
        footer: {
          fontSize: 9,
          color: '#9ca3af',
          italics: true
        }
      },

      defaultStyle: {
        font: 'Helvetica'
      },

      pageMargins: [40, 60, 40, 60],
      
      info: {
        title: `Invoice ${invoice.invoiceNumber}`,
        author: invoice.freelancer.name,
        subject: `Invoice for ${invoice.client.companyName}`,
        creator: 'InvoicePro',
        producer: 'InvoicePro'
      }
    };

    try {
      // Generate and download the PDF
      const pdfDoc = pdfMake.createPdf(documentDefinition);
      pdfDoc.download(`Invoice-${invoice.invoiceNumber}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  }

  static previewInvoicePDF(invoice: Invoice): void {
    const documentDefinition = this.getDocumentDefinition(invoice);
    
    try {
      const pdfDoc = pdfMake.createPdf(documentDefinition);
      pdfDoc.open();
    } catch (error) {
      console.error('Error previewing PDF:', error);
      alert('Error previewing PDF. Please try again.');
    }
  }

  private static getDocumentDefinition(invoice: Invoice) {
    // Same document definition as above - extracted for reuse
    // This would contain the same structure as in generateInvoicePDF
    return {
      // ... same content as above
    };
  }
}