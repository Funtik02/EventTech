import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api.js'

const STORAGE_KEY = 'eventtech.currentEvent'
const EventContext = createContext(null)

function readStoredId() {
  try {
    return Number(localStorage.getItem(STORAGE_KEY)) || null
  } catch {
    return null
  }
}

/** Список мероприятий пользователя и «текущее» мероприятие, с которым работают разделы. */
export function EventProvider({ children }) {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentId, setCurrentIdState] = useState(readStoredId)

  const reload = useCallback(async () => {
    try {
      setEvents(await api('/events'))
      setError(null)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  const setCurrentId = useCallback((id) => {
    setCurrentIdState(id)
    try {
      localStorage.setItem(STORAGE_KEY, String(id))
    } catch {
      // localStorage недоступен — просто не запоминаем выбор
    }
  }, [])

  const value = useMemo(() => {
    const active = events.filter((e) => e.status !== 'finished' && e.status !== 'cancelled')
    const current = events.find((e) => e.id === currentId) ?? active[0] ?? events[0] ?? null
    return { events, current, loading, error, reload, setCurrentId }
  }, [events, currentId, loading, error, reload, setCurrentId])

  return <EventContext.Provider value={value}>{children}</EventContext.Provider>
}

// eslint-disable-next-line react/only-export-components
export function useEvents() {
  return useContext(EventContext)
}
