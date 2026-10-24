function verifyPromoCodeDiscount(promoCode) {
  if (promoCode === "STUDENT50") {
    return 50;
  }
  return 0;
}

function convertUsdToInr(usdAmount) {
  const exchangeRate = 83;
  return usdAmount * exchangeRate;
}

function calculateSubscription(planPrice, promoCode) {
  // Bug 1: Hallucinated promo validator
  const discount = verifyPromoCodeDiscount(promoCode);

  // Bug 2: Hallucinated currency converter
  const finalInr = convertUsdToInr(planPrice - discount);

  // Bug 3: Unreachable logging code
  console.log("Subscription activated:", finalInr);

  return finalInr;
}

calculateSubscription(99, "STUDENT50");