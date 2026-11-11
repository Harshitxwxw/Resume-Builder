import React, { createContext, useContext, useState, useEffect } from 'react'

const THEME_STORAGE_KEY = 'career_ai_theme'

const ThemeContext = createContext({
  theme: 'light',
  isDark: false,
  toggleTheme: () => { },
  setTheme: () => { },
})

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY)
      if (saved === 'dark' || saved === 'light') return saved
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark'
      }
      return 'light'
    } catch {
      return 'light'
    }
  })

  useEffect(() => {
    try {
      document.documentElement.setAttribute('data-theme', theme)
      document.body.setAttribute('data-theme', theme)
      if (theme === 'dark') {
        document.documentElement.classList.add('dark-theme')
        document.body.classList.add('dark-theme')
      } else {
        document.documentElement.classList.remove('dark-theme')
        document.body.classList.remove('dark-theme')
      }
      localStorage.setItem(THEME_STORAGE_KEY, theme)
      window.dispatchEvent(new CustomEvent('career_theme_changed', { detail: { theme } }))
    } catch (e) {
      console.warn('Error applying theme:', e)
    }
  }, [theme])

  // Synchronize across tabs or custom theme change events
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === THEME_STORAGE_KEY && (e.newValue === 'dark' || e.newValue === 'light')) {
        setThemeState(e.newValue)
      }
    }
    const handleCustomChange = (e) => {
      if (e.detail?.theme && (e.detail.theme === 'dark' || e.detail.theme === 'light')) {
        setThemeState(e.detail.theme)
      }
    }
    window.addEventListener('storage', handleStorage)
    window.addEventListener('career_theme_changed', handleCustomChange)
    return () => {
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener('career_theme_changed', handleCustomChange)
    }
  }, [])

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }

  const setTheme = (newTheme) => {
    if (newTheme === 'dark' || newTheme === 'light') {
      setThemeState(newTheme)
    }
  }

  const value = {
    theme,
    isDark: theme === 'dark',
    toggleTheme,
    setTheme,
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export const useTheme = () => useContext(ThemeContext)
export default ThemeContext

