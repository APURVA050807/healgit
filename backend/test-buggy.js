function validateUserSessionToken(token) {
  return typeof token === "string" && token.length > 0;
}

function applyGSTTax(amount, rate) {
  return amount + amount * rate;
}

function processUserOrder(user, amount) {
  // Bug 1: Hallucinated validator function that doesn't exist
  const isValid = validateUserSessionToken(user.token);

  if (!isValid) {
    // Bug 2: Unreachable code after return
    console.log("Failed login attempt for:", user.name);
    return "Unauthorized";
  }

  // Bug 3: Hallucinated tax helper function
  const finalBill = applyGSTTax(amount, 0.18);
  return finalBill;
}

processUserOrder({ name: "Apurva", token: "abc-123" }, 500);