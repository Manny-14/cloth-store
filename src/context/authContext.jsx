import React, { useContext, useEffect, useState } from "react";
import { auth } from "../../firebase/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { getUserRole } from "../../firebase/user/getUserRole";

const AuthContext = React.createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider ({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const userLoggedIn = !!currentUser;

    // Fetch user role and set it in the currentUser object
    // isMounted variable to prevent memory leak if getUserRole is called after component is unmounted
    useEffect(() => {
        let isMounted = true;
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    const userRole = await getUserRole(user.uid);
                    if (isMounted) {
                        setCurrentUser({
                            ...user,
                            role : userRole
                        });
                    }
                } catch (error) {
                    console.error("Error fetching user role:", error);
                }
            } else {
                setCurrentUser(null);
            }
            setLoading(false);
        });
        return () => {
            isMounted = false;
            unsubscribe();
        };
    }, []);

    const value = {
        currentUser,
        userLoggedIn,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );


}