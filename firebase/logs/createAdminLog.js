import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

const normalizeValue = (value) => {
  if (value === undefined || value === null) return undefined;
  if (typeof value === "string") return value.trim();
  return value;
};

const compactObject = (value) => {
  if (!value || typeof value !== "object") return undefined;
  const entries = Object.entries(value)
    .map(([key, val]) => [key, normalizeValue(val)])
    .filter(([, val]) => val !== undefined && val !== "");
  return entries.length ? Object.fromEntries(entries) : undefined;
};

export const createAdminLog = async ({
  event,
  severity = "info",
  source = "client",
  message,
  context,
} = {}) => {
  const normalizedEvent = normalizeValue(event);
  if (!normalizedEvent) return;

  try {
    await addDoc(collection(db, "adminLogs"), {
      event: normalizedEvent,
      severity: normalizeValue(severity) || "info",
      source: normalizeValue(source) || "client",
      message: normalizeValue(message) || "",
      context: compactObject(context),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Failed to write admin log", error);
  }
};
