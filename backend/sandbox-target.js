function calculateInvoiceTotal(subtotal, regionCode) {
  // Defect 1: Hallucinated tax lookup helper
  const taxRate = fetchRegionalTaxRate(regionCode);
  const grandTotal = subtotal + subtotal * taxRate;

  return grandTotal;

  // Defect 2: Unreachable audit log after return
  console.log("Invoice generated:", grandTotal);
}

calculateInvoiceTotal(1200, "IN-DL");