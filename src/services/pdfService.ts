import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { Invoice } from '../types';
import { formatCurrency } from '../utils/calculations';
import dayjs from 'dayjs';


export class PDFService {
  static generateInvoicePDF(invoice: Invoice): void {
    const documentDefinition = {
      content: [
        // Header
        {
          columns: [
            {
              text: 'INVOICE',
              style: 'header',
              width: '*'
            },
            {
              text: [
                { text: 'Invoice #: ', style: 'label' },
                { text: invoice.invoiceNumber, style: 'value' }
              ],
              width: 'auto',
              alignment: 'right' as const
            }
          ],
          margin: [0, 0, 0, 20]
        },

        // Invoice Details
        {
          columns: [
            {
              text: [
                { text: 'Date Issued: ', style: 'label' },
                { text: dayjs(invoice.dateIssued).format('MMM DD, YYYY'), style: 'value' },
                '\n',
                { text: 'Due Date: ', style: 'label' },
                { text: dayjs(invoice.dueDate).format('MMM DD, YYYY'), style: 'value' }
              ],
              width: '*'
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
                { text: invoice.freelancer.name, style: 'address' },
                { text: invoice.freelancer.email, style: 'address' },
                { text: invoice.freelancer.address, style: 'address' }
              ],
              width: '*'
            },
            {
              stack: [
                { text: 'To:', style: 'sectionHeader' },
                { text: invoice.client.companyName, style: 'address' },
                { text: invoice.client.email, style: 'address' },
                ...(invoice.client.address ? [{ text: invoice.client.address, style: 'address' }] : [])
              ],
              width: '*'
            }
          ],
          margin: [0, 0, 0, 30]
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
            hLineWidth: () => 1,
            vLineWidth: () => 1,
            hLineColor: () => '#e5e7eb',
            vLineColor: () => '#e5e7eb',
            paddingLeft: () => 12,
            paddingRight: () => 12,
            paddingTop: () => 8,
            paddingBottom: () => 8
          },
          margin: [0, 0, 0, 20]
        },

        // Totals
        {
          columns: [
            { width: '*', text: '' },
            {
              width: 200,
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
                paddingBottom: () => 8
              }
            }
          ]
        },

        // Notes
        ...(invoice.notes ? [
          { text: 'Notes:', style: 'sectionHeader', margin: [0, 30, 0, 10] },
          { text: invoice.notes, style: 'notes' }
        ] : [])
      ],

      styles: {
        header: {
          fontSize: 28,
          bold: true,
          color: '#1f2937'
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
        address: {
          fontSize: 11,
          color: '#6b7280',
          lineHeight: 1.4
        },
        tableHeader: {
          fontSize: 11,
          bold: true,
          color: '#374151',
          fillColor: '#f9fafb'
        },
        tableCell: {
          fontSize: 11,
          color: '#374151',
          lineHeight: 1.3
        },
        totalLabel: {
          fontSize: 11,
          color: '#6b7280',
          alignment: 'right'
        },
        totalValue: {
          fontSize: 11,
          color: '#374151',
          alignment: 'right'
        },
        totalLabelFinal: {
          fontSize: 12,
          bold: true,
          color: '#374151',
          alignment: 'right'
        },
        totalValueFinal: {
          fontSize: 12,
          bold: true,
          color: '#374151',
          alignment: 'right'
        },
        notes: {
          fontSize: 11,
          color: '#6b7280',
          lineHeight: 1.4
        }
      },

      defaultStyle: {
        font: 'Roboto'
      }
    };

    pdfMake.createPdf(documentDefinition).download(`${invoice.invoiceNumber}.pdf`);
  }
}