function getPromoDiscount(promoCode) {
  if (promoCode === "SAVE20") return 20;
  return 0;
}

function calculateOrderTotal(subtotal, promoCode) {
  const discount = getPromoDiscount(promoCode);
  const finalAmount = subtotal - discount;

  console.log("Order processed for amount:", finalAmount);
  return finalAmount;
}

calculateOrderTotal(1500, "SAVE20");