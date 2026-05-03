import React, { useContext, useEffect, useState } from "react";
import PropTypes from "prop-types";
import { auth } from "../../firebase/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { getUserRole } from "../../firebase/user/getUserRole";
import { ensureUserProfileDocument } from "../../firebase/auth";

const AuthContext = React.createContext();
const ADMIN_SESSION_TIMEOUT_MS = 30 * 60 * 1000;

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider ({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isResolvingRole, setIsResolvingRole] = useState(false);
    const userLoggedIn = !!currentUser;

    // Fetch user role and set it in the currentUser object
    // isMounted variable to prevent memory leak if getUserRole is called after component is unmounted
    useEffect(() => {
        let isMounted = true;
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                if (isMounted) setIsResolvingRole(true);
                try {
                    await ensureUserProfileDocument(user);
                    const userRole = await getUserRole(user.uid);
                    if (isMounted) {
                        const normalizedRole = String(userRole || "GENERAL").toUpperCase();
                        Object.defineProperty(user, "role", {
                            value: normalizedRole,
                            writable: true,
                            configurable: true,
                            enumerable: true,
                        });
                        setCurrentUser(user);
                    }
                } catch (error) {
                    console.error("Error fetching user role:", error);
                    if (isMounted) {
                        setCurrentUser(user);
                    }
                } finally {
                    if (isMounted) setIsResolvingRole(false);
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

    useEffect(() => {
        const isAdmin = String(currentUser?.role || "").toUpperCase() === "ADMIN";
        if (!isAdmin) {
            return undefined;
        }

        let timeoutId;
        const events = ["mousedown", "mousemove", "keydown", "scroll", "touchstart"];

        const resetAdminTimeout = () => {
            if (timeoutId) {
                window.clearTimeout(timeoutId);
            }

            timeoutId = window.setTimeout(async () => {
                try {
                    await signOut(auth);
                } catch (error) {
                    console.error("Failed to expire admin session", error);
                }
            }, ADMIN_SESSION_TIMEOUT_MS);
        };

        events.forEach((eventName) => window.addEventListener(eventName, resetAdminTimeout, { passive: true }));
        resetAdminTimeout();

        return () => {
            if (timeoutId) {
                window.clearTimeout(timeoutId);
            }
            events.forEach((eventName) => window.removeEventListener(eventName, resetAdminTimeout));
        };
    }, [currentUser]);

    const value = {
        currentUser,
        userLoggedIn,
        loading,
        isResolvingRole
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}

AuthProvider.propTypes = {
    children: PropTypes.node.isRequired,
};
