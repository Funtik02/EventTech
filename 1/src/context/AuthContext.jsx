import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api, setUnauthorizedHandler, tokenStore } from '../lib/api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(!tokenStore.get())

  const logout = useCallback(() => {
    tokenStore.clear()
    setUser(null)
  }, [])

  useEffect(() => {
    setUnauthorizedHandler(logout)
    if (!tokenStore.get()) return
    api('/auth/me')
      .then(setUser)
      .catch(() => tokenStore.clear())
      .finally(() => setReady(true))
  }, [logout])

  const value = useMemo(() => {
    const authenticate = async (path, body) => {
      const { token, user: nextUser } = await api(path, { method: 'POST', body })
      tokenStore.set(token)
      setUser(nextUser)
    }
    return {
      user,
      ready,
      setUser,
      login: (email, password) => authenticate('/auth/login', { email, password }),
      register: (data) => authenticate('/auth/register', data),
      logout,
    }
  }, [user, ready, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react/only-export-components
export function useAuth() {
  return useContext(AuthContext)
}
