import { deleteField, doc, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { ensureStripePriceForProduct } from "../../src/helper/stripe";

// Update a product in Firestore by ID
export const editProduct = async (productId, updatedFields) => {
  try {
    const stripeSync = await ensureStripePriceForProduct({
      productId,
      productData: updatedFields,
      authToken: await auth.currentUser?.getIdToken(),
    });

    const payload = {
      ...updatedFields,
      costPrice: deleteField(),
      sellingPrice: deleteField(),
      stripeProductId: stripeSync?.stripeProductId || updatedFields?.stripeProductId || "",
      stripePriceId: stripeSync?.stripePriceId || updatedFields?.stripePriceId || "",
      stripeCurrency: stripeSync?.currency || updatedFields?.stripeCurrency || "usd",
      stripeUnitAmount: stripeSync?.unitAmount || updatedFields?.stripeUnitAmount || 0,
    };

    const productRef = doc(db, "products", productId);
    await updateDoc(productRef, payload);
    return true;
  } catch (error) {
    console.error("Error updating product:", error);
    throw error;
  }
};
