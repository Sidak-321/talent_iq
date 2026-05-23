import { create } from "zustand";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const useUserStore = create((set) => ({
    user: null,
    loading: true,
    error: null,

    checkAuth: async () => {
        set({ loading: true, error: null });
        try {
            const res = await fetch(`${API_URL}/api/auth/me`, {
                headers: {
                    "Content-Type": "application/json",
                },
                // Send cookies
                credentials: "include"
            });
            const data = await res.json();
            if (data.success) {
                set({ user: data.user, loading: false });
            } else {
                set({ user: null, loading: false });
            }
        } catch (err) {
            set({ user: null, loading: false });
        }
    },

    login: async (email, password) => {
        set({ loading: true, error: null });
        try {
            const res = await fetch(`${API_URL}/api/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, password }),
                credentials: "include"
            });
            const data = await res.json();
            if (data.success) {
                set({ user: data.user, loading: false, error: null });
                return true;
            } else {
                set({ user: null, loading: false, error: data.message });
                return false;
            }
        } catch (err) {
            set({ user: null, loading: false, error: "Network error occurred" });
            return false;
        }
    },

    signup: async (username, email, password) => {
        set({ loading: true, error: null });
        try {
            const res = await fetch(`${API_URL}/api/auth/signup`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username, email, password }),
                credentials: "include"
            });
            const data = await res.json();
            if (data.success) {
                set({ user: data.user, loading: false, error: null });
                return true;
            } else {
                set({ user: null, loading: false, error: data.message });
                return false;
            }
        } catch (err) {
            set({ user: null, loading: false, error: "Network error occurred" });
            return false;
        }
    },

    logout: async () => {
        set({ loading: true });
        try {
            await fetch(`${API_URL}/api/auth/logout`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include"
            });
            set({ user: null, loading: false, error: null });
        } catch (err) {
            set({ loading: false });
        }
    },

    clearError: () => set({ error: null })
}));
