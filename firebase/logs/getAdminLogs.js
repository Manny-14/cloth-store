import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";
import { db } from "../firebase";

export const getAdminLogs = async ({ max = 100 } = {}) => {
  try {
    const logsRef = collection(db, "adminLogs");
    const logsQuery = query(logsRef, orderBy("createdAt", "desc"), limit(max));
    const snapshot = await getDocs(logsQuery);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Failed to fetch admin logs", error);
    throw error;
  }
};
