export const SUPPORT_EMAIL = "dressitup1000@gmail.com";

export const createSupportMailto = ({ subject, body }) => {
  const encodedSubject = encodeURIComponent(subject);
  const encodedBody = encodeURIComponent(body);

  return `mailto:${SUPPORT_EMAIL}?subject=${encodedSubject}&body=${encodedBody}`;
};

export const supportTemplates = {
  general: () =>
    createSupportMailto({
      subject: "Dress-It-Up support request",
      body: [
        "Hi Dress-It-Up,",
        "",
        "I need help with:",
        "",
        "Order number, if any:",
        "Product name, if any:",
        "",
        "What happened:",
        "",
        "Best way to reply:",
      ].join("\n"),
    }),
  checkout: () =>
    createSupportMailto({
      subject: "Dress-It-Up checkout help",
      body: [
        "Hi Dress-It-Up,",
        "",
        "I had trouble checking out.",
        "",
        "Order number, if any:",
        "Items in my cart:",
        "Error message I saw:",
        "",
        "What I was trying to do:",
      ].join("\n"),
    }),
  orderFinalization: () =>
    createSupportMailto({
      subject: "Dress-It-Up order finalization help",
      body: [
        "Hi Dress-It-Up,",
        "",
        "My payment may have gone through, but the order did not finish correctly.",
        "",
        "Order number, if shown:",
        "Stripe/payment email:",
        "Approximate time of payment:",
        "",
        "What I saw on the screen:",
      ].join("\n"),
    }),
  product: ({ productName = "", productId = "" } = {}) =>
    createSupportMailto({
      subject: "Dress-It-Up product help",
      body: [
        "Hi Dress-It-Up,",
        "",
        "I need help with a product.",
        "",
        `Product name: ${productName}`,
        `Product ID/link: ${productId}`,
        "",
        "Question or issue:",
      ].join("\n"),
    }),
  account: () =>
    createSupportMailto({
      subject: "Dress-It-Up account help",
      body: [
        "Hi Dress-It-Up,",
        "",
        "I need help with my account.",
        "",
        "Account email:",
        "What I was trying to do:",
        "Error message I saw:",
      ].join("\n"),
    }),
};
