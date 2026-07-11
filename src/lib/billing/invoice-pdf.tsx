import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

import { invoiceProfile } from "@/src/lib/config/business";

export type CustomerInvoicePdf = {
  invoiceNumber: string;
  issuedAt: Date | null;
  customerName: string;
  customerAddress: string;
  items: Array<{ description: string; quantity: number; unitPrice: number; lineTotal: number }>;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
};

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, color: "#14213d", fontFamily: "Helvetica" },
  header: { flexDirection: "row", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: "#1d4ed8", paddingBottom: 16 },
  brand: { fontSize: 22, fontFamily: "Helvetica-Bold", color: "#1d4ed8" },
  tagline: { marginTop: 3, color: "#475569" },
  meta: { textAlign: "right", color: "#475569", lineHeight: 1.5 },
  billTo: { marginTop: 24, lineHeight: 1.45 },
  label: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#64748b", letterSpacing: 0.6 },
  customer: { marginTop: 5, fontFamily: "Helvetica-Bold" },
  table: { marginTop: 26, borderWidth: 1, borderColor: "#cbd5e1" },
  row: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#e2e8f0", paddingVertical: 8, paddingHorizontal: 8 },
  headerRow: { backgroundColor: "#eff6ff", fontFamily: "Helvetica-Bold", color: "#1e3a8a" },
  description: { width: "55%" }, qty: { width: "15%", textAlign: "right" }, price: { width: "15%", textAlign: "right" }, amount: { width: "15%", textAlign: "right" },
  totals: { alignSelf: "flex-end", width: 220, marginTop: 16 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  total: { borderTopWidth: 1, borderTopColor: "#1e3a8a", paddingTop: 7, marginTop: 3, fontFamily: "Helvetica-Bold", fontSize: 12 },
  terms: { marginTop: 34, borderTopWidth: 1, borderTopColor: "#cbd5e1", paddingTop: 14 },
  term: { marginTop: 4, color: "#475569", lineHeight: 1.35 },
});

const money = (value: number) => `RM ${value.toFixed(2)}`;

export function InvoicePdf({ invoice }: { invoice: CustomerInvoicePdf }) {
  return <Document title={`${invoiceProfile.companyName} invoice ${invoice.invoiceNumber}`} author={invoiceProfile.companyName}><Page size="A4" style={styles.page}>
    <View style={styles.header}><View><Text style={styles.brand}>{invoiceProfile.companyName}</Text><Text style={styles.tagline}>{invoiceProfile.tagline}</Text>{invoiceProfile.addressLines.map((line) => <Text key={line} style={styles.tagline}>{line}</Text>)}<Text style={styles.tagline}>Tel: {invoiceProfile.phone}</Text></View><View style={styles.meta}><Text>INVOICE</Text><Text>Invoice No: {invoice.invoiceNumber}</Text><Text>Invoice Date: {invoice.issuedAt?.toLocaleDateString("en-MY") ?? "Pending"}</Text></View></View>
    <View style={styles.billTo}><Text style={styles.label}>BILL TO</Text><Text style={styles.customer}>{invoice.customerName}</Text><Text>{invoice.customerAddress}</Text></View>
    <View style={styles.table}><View style={[styles.row, styles.headerRow]}><Text style={styles.description}>DESCRIPTION</Text><Text style={styles.qty}>QTY</Text><Text style={styles.price}>UNIT PRICE</Text><Text style={styles.amount}>AMOUNT</Text></View>{invoice.items.map((item) => <View key={`${item.description}-${item.lineTotal}`} style={styles.row}><Text style={styles.description}>{item.description}</Text><Text style={styles.qty}>{item.quantity}</Text><Text style={styles.price}>{money(item.unitPrice)}</Text><Text style={styles.amount}>{money(item.lineTotal)}</Text></View>)}</View>
    <View style={styles.totals}><View style={styles.totalRow}><Text>Subtotal</Text><Text>{money(invoice.subtotal)}</Text></View>{invoice.discount > 0 ? <View style={styles.totalRow}><Text>Discount</Text><Text>-{money(invoice.discount)}</Text></View> : null}{invoice.tax > 0 ? <View style={styles.totalRow}><Text>Tax</Text><Text>{money(invoice.tax)}</Text></View> : null}<View style={[styles.totalRow, styles.total]}><Text>TOTAL</Text><Text>{money(invoice.total)}</Text></View></View>
    <View style={styles.terms}><Text style={styles.label}>TERMS & CONDITIONS</Text>{invoiceProfile.terms.map((term) => <Text key={term} style={styles.term}>• {term}</Text>)}</View>
  </Page></Document>;
}
