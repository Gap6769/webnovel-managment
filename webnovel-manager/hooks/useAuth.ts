"use client"

import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { authAPI } from "@/services/api"
import { useAuthStore } from "@/store/useAuthStore"
import type { User } from "@/types"

export function useAuth() {
  const { user, isAuthenticated, isLoading, error, login, logout, setLoading, setError } = useAuthStore()
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [registerUsername, setRegisterUsername] = useState("")
  const [registerEmail, setRegisterEmail] = useState("")
  const [registerPassword, setRegisterPassword] = useState("")

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      setLoading(true)
      setError(null)
      const response = await authAPI.login(email, password)
      if (!response.success) {
        throw new Error(response.error || "Login failed")
      }
      return response.data
    },
    onSuccess: (data) => {
      login(data.user as User, data.token)
      setLoading(false)
      // Reset form
      setLoginEmail("")
      setLoginPassword("")
    },
    onError: (error: Error) => {
      setError(error.message)
      setLoading(false)
    },
  })

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async ({ username, email, password }: { username: string; email: string; password: string }) => {
      setLoading(true)
      setError(null)
      const response = await authAPI.register(username, email, password)
      if (!response.success) {
        throw new Error(response.error || "Registration failed")
      }
      return response.data
    },
    onSuccess: (data) => {
      login(data.user as User, data.token)
      setLoading(false)
      // Reset form
      setRegisterUsername("")
      setRegisterEmail("")
      setRegisterPassword("")
    },
    onError: (error: Error) => {
      setError(error.message)
      setLoading(false)
    },
  })

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      setLoading(true)
      const response = await authAPI.logout()
      if (!response.success) {
        throw new Error(response.error || "Logout failed")
      }
      return response
    },
    onSuccess: () => {
      logout()
      setLoading(false)
    },
    onError: (error: Error) => {
      setError(error.message)
      setLoading(false)
    },
  })

  const handleLogin = () => {
    loginMutation.mutate({ email: loginEmail, password: loginPassword })
  }

  const handleRegister = () => {
    registerMutation.mutate({
      username: registerUsername,
      email: registerEmail,
      password: registerPassword,
    })
  }

  const handleLogout = () => {
    logoutMutation.mutate()
  }

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    loginEmail,
    setLoginEmail,
    loginPassword,
    setLoginPassword,
    registerUsername,
    setRegisterUsername,
    registerEmail,
    setRegisterEmail,
    registerPassword,
    setRegisterPassword,
    handleLogin,
    handleRegister,
    handleLogout,
  }
}
