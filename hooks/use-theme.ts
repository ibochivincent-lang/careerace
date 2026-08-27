'use client'

import { useState, useEffect } from 'react'

type Theme = 'light' | 'dark'

export function useTheme() {
  const [theme, setTheme] = useState<Theme>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem('examace_theme') as Theme | null
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const initial: Theme = stored ?? (prefersDark ? 'dark' : 'light')
    setTheme(initial)
    document.documentElement.classList.toggle('dark', initial === 'dark')
  }, [])

  const toggleTheme = () => {
    const next: Theme = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    localStorage.setItem('examace_theme', next)
    document.documentElement.classList.toggle('dark', next === 'dark')
  }

  const setExplicit = (t: Theme) => {
    setTheme(t)
    localStorage.setItem('examace_theme', t)
    document.documentElement.classList.toggle('dark', t === 'dark')
  }

  return { theme, toggleTheme, setTheme: setExplicit, mounted }
}
