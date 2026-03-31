export const resolveCheckoutAuthToken = async (currentUser) => {
  if (typeof currentUser?.getIdToken !== "function") {
    throw new Error("Unable to authenticate checkout. Please sign in again.");
  }

  const authToken = await currentUser.getIdToken();
  if (!authToken) {
    throw new Error("Unable to authenticate checkout. Please sign in again.");
  }

  return authToken;
};
