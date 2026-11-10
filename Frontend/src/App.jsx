import React from 'react'
import { RouterProvider } from "react-router-dom";
import { router } from "./app.routes.jsx"
import { AuthProvider } from "./features/auth/auth.context.jsx"
import { ThemeProvider } from "./context/ThemeContext.jsx"

const App = () => {
  return (
    <AuthProvider>
      <ThemeProvider>
        <RouterProvider router={router}/>
      </ThemeProvider>
    </AuthProvider>
  )
}

export default App