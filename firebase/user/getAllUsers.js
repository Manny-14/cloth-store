import { collection, getDocs, query } from "firebase/firestore";
import { db } from "../firebase";

// returns all users in the database in a 2D array
// each element of the array is an array of two elements: the doc id and the doc object of each user
export async function getAllUsers() {
   try {
        const q = query(collection(db, "users"));
        const querySnapshot = await getDocs(q);
        const allUsers = [];
        querySnapshot.forEach((doc) => {
            allUsers.push([doc.id, doc.data()])
        });

        // pushing users that are admin to the top of the list
        const sortedUsers = [...allUsers].sort((a, b) => a[1].role.localeCompare(b[1].role));
        return sortedUsers;
   } catch (error) {
    console.log("Error retrieving users from database", error.code, error.message)
   }
}