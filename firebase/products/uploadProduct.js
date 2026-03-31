import { collection, doc, setDoc } from "firebase/firestore"; 
import { auth, db } from "../firebase";
import { ensureStripePriceForProduct } from "../../src/helper/stripe";

export async function uploadProduct(productData) {
    try {
        // New document reference with auto ID in 'products' collection
        const newProductRef = doc(collection(db, "products"));

        // Add timestamp field
        const productWithTimestamp = {
            ...productData,
            timestamp: new Date().toISOString(),
        };

        const stripeSync = await ensureStripePriceForProduct({
            productData: productWithTimestamp,
            authToken: await auth.currentUser?.getIdToken(),
        });

        const productWithStripe = {
            ...productWithTimestamp,
            stripeProductId: stripeSync?.stripeProductId || "",
            stripePriceId: stripeSync?.stripePriceId || "",
            stripeCurrency: stripeSync?.currency || "usd",
            stripeUnitAmount: stripeSync?.unitAmount || 0,
        };

        await setDoc(newProductRef, productWithStripe);

        await ensureStripePriceForProduct({
            productId: newProductRef.id,
            productData: productWithStripe,
            authToken: await auth.currentUser?.getIdToken(),
        });

        return newProductRef.id;
    } catch (error) {
        console.error("Error uploading product:", error);
        throw error;
    }
}