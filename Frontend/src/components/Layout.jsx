import React from 'react'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import { useTheme } from '../context/ThemeContext'
import './layout.scss'

const Layout = ({ children }) => {
  const { theme, isDark } = useTheme()

  return (
    <div className={`app-layout ${isDark ? 'theme-dark' : 'theme-light'}`} data-theme={theme}>
      <Sidebar />
      <div className="app-layout__main">
        <TopBar />
        <div className="app-layout__content">
          {children}
        </div>
      </div>
    </div>
  )
}

export default Layout
