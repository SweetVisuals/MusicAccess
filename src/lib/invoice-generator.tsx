import React from 'react';
import { pdf } from '@react-pdf/renderer';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

interface OrderItem {
  id: string;
  title: string;
  price: number;
  type?: string;
}

interface Order {
  id: string;
  date: string;
  status: 'completed' | 'pending' | 'failed' | 'processing';
  total: number;
  items: OrderItem[];
  processingFee: number;
  tax: number;
  customerName?: string;
  customerEmail?: string;
}

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 30,
  },
  header: {
    marginBottom: 20,
    borderBottom: '2 solid #000000',
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  companyInfo: {
    fontSize: 12,
    marginBottom: 5,
  },
  orderInfo: {
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  label: {
    fontSize: 12,
    fontWeight: 'bold',
    width: 120,
  },
  value: {
    fontSize: 12,
  },
  itemsTable: {
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottom: '1 solid #000000',
    paddingBottom: 5,
    marginBottom: 5,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    borderBottom: '1 solid #cccccc',
  },
  itemColumn: {
    flex: 2,
    fontSize: 11,
  },
  typeColumn: {
    flex: 1,
    fontSize: 11,
  },
  priceColumn: {
    flex: 1,
    fontSize: 11,
    textAlign: 'right',
  },
  totals: {
    marginTop: 20,
    alignSelf: 'flex-end',
    width: 200,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 12,
  },
  grandTotal: {
    borderTop: '2 solid #000000',
    paddingTop: 5,
    marginTop: 5,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 10,
    color: '#666666',
  },
});

const InvoiceDocument: React.FC<{ order: Order }> = ({ order }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>INVOICE</Text>
        <Text style={styles.companyInfo}>TuneFlow Music Platform</Text>
        <Text style={styles.companyInfo}>Digital Music Distribution</Text>
      </View>

      {/* Order Information */}
      <View style={styles.orderInfo}>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Invoice Number:</Text>
          <Text style={styles.value}>{order.id}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Date:</Text>
          <Text style={styles.value}>{new Date(order.date).toLocaleDateString()}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Status:</Text>
          <Text style={styles.value}>{order.status.charAt(0).toUpperCase() + order.status.slice(1)}</Text>
        </View>
        {order.customerName && (
          <View style={styles.infoRow}>
            <Text style={styles.label}>Customer:</Text>
            <Text style={styles.value}>{order.customerName}</Text>
          </View>
        )}
        {order.customerEmail && (
          <View style={styles.infoRow}>
            <Text style={styles.label}>Email:</Text>
            <Text style={styles.value}>{order.customerEmail}</Text>
          </View>
        )}
      </View>

      {/* Items Table */}
      <View style={styles.itemsTable}>
        <View style={styles.tableHeader}>
          <Text style={styles.itemColumn}>Item</Text>
          <Text style={styles.typeColumn}>Type</Text>
          <Text style={styles.priceColumn}>Price</Text>
        </View>

        {order.items.map((item) => (
          <View key={item.id} style={styles.tableRow}>
            <Text style={styles.itemColumn}>{item.title}</Text>
            <Text style={styles.typeColumn}>{item.type || 'Beat'}</Text>
            <Text style={styles.priceColumn}>${(item.price || 0).toFixed(2)}</Text>
          </View>
        ))}
      </View>

      {/* Totals */}
      <View style={styles.totals}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Subtotal:</Text>
          <Text style={styles.totalValue}>
            ${(order.total - (order.processingFee || 0) - (order.tax || 0)).toFixed(2)}
          </Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Processing Fee:</Text>
          <Text style={styles.totalValue}>${(order.processingFee || 0).toFixed(2)}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Tax:</Text>
          <Text style={styles.totalValue}>${(order.tax || 0).toFixed(2)}</Text>
        </View>
        <View style={[styles.totalRow, styles.grandTotal]}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalValue}>${order.total.toFixed(2)}</Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text>Thank you for your business!</Text>
        <Text>Generated on {new Date().toLocaleDateString()}</Text>
      </View>
    </Page>
  </Document>
);

export const generateInvoicePDF = async (order: Order): Promise<Blob> => {
  const blob = await pdf(<InvoiceDocument order={order} />).toBlob();
  return blob;
};

export const downloadInvoice = async (order: Order) => {
  try {
    const blob = await generateInvoicePDF(order);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `invoice-${order.id}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error generating invoice:', error);
    throw error;
  }
};

export const downloadFile = async (fileUrl: string, fileName: string) => {
  try {
    // For Supabase storage URLs, we need to fetch the file first
    const response = await fetch(fileUrl);
    const blob = await response.blob();

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading file:', error);
    throw error;
  }
};