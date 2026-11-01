import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import {App} from './App.jsx'
import { AuthProvider } from './conetxt/AuthContext.jsx'
import { ThemeProvider } from './conetxt/ThemeContext.jsx'

createRoot(document.getElementById('root')).render(
  <ThemeProvider>
    <AuthProvider >
      <App />
    </AuthProvider>
  </ThemeProvider>,
)
