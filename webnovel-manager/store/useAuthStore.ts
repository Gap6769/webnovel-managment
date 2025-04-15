import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { AuthState, User } from "@/types"
import { STORAGE_KEYS } from "@/constants"

interface AuthStore extends AuthState {
  login: (user: User, token: string) => void
  logout: () => void
  setLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      login: (user: User, token: string) => {
        localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token)
        set({ user, isAuthenticated: true, error: null })
      },
      logout: () => {
        localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN)
        set({ user: null, isAuthenticated: false })
      },
      setLoading: (isLoading: boolean) => set({ isLoading }),
      setError: (error: string | null) => set({ error }),
    }),
    {
      name: STORAGE_KEYS.USER,
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    },
  ),
)
