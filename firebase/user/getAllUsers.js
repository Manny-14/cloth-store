import { collection, getDocs, query } from "firebase/firestore";
import { db } from "../firebase";

// returns all users in the database in a 2D array
// each element of the array is an array of two elements: the doc id and the doc object of each user
export async function getAllUsers() {
   try {
        const q = query(collection(db, "users"));
        const querySnapshot = await getDocs(q);
        // collect admin users and general users seperately to concatenate them together
        const adminUsers = [];
        const generalUsers = [];
        querySnapshot.forEach((doc) => {
            // collect user data as an object instead of as a list
            const userData = { id: doc.id, ...doc.data()};
            if (userData.role === "ADMIN") {
                adminUsers.push(userData);
            } else {
                generalUsers.push(userData);
            }
        });

        const allUsers = [...adminUsers, ...generalUsers]
        return allUsers
   } catch (error) {
    console.log("Error retrieving users from database", error.code, error.message)
   }
}