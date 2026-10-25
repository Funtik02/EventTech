import { useCallback, useEffect, useState } from 'react'

const TOKEN_KEY = 'eventtech.token'

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
}

export class ApiError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

let onUnauthorized = () => {}
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler
}

export async function api(path, { method = 'GET', body } = {}) {
  const headers = {}
  const token = tokenStore.get()
  if (token) headers.Authorization = `Bearer ${token}`
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  let response
  try {
    response = await fetch(`/api${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(0, 'Сервер недоступен. Запущен ли API (npm run server)?')
  }

  if (response.status === 204) return null
  const data = await response.json().catch(() => null)

  if (!response.ok) {
    if (response.status === 401 && token) onUnauthorized()
    const fallback = response.status >= 500 ? 'Ошибка сервера' : 'Не удалось выполнить запрос'
    throw new ApiError(response.status, data?.error ?? fallback)
  }
  return data
}

export function useApi(path) {
  const [state, setState] = useState({ data: null, error: null, loading: Boolean(path) })

  const load = useCallback(async () => {
    if (!path) return
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const data = await api(path)
      setState({ data, error: null, loading: false })
    } catch (error) {
      setState({ data: null, error, loading: false })
    }
  }, [path])

  useEffect(() => {
    load()
  }, [load])

  const setData = useCallback((updater) => {
    setState((prev) => ({ ...prev, data: typeof updater === 'function' ? updater(prev.data) : updater }))
  }, [])

  return { ...state, reload: load, setData }
}
