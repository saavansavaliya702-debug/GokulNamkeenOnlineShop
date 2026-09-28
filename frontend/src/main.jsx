import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from "./pages/AuthContext.jsx"
// import { CartProvider } from "./pages/ContactPage.jsx"

createRoot(document.getElementById('root')).render(
  <StrictMode>
     <AuthProvider>          {/* ⬅️ MUST be here */}
        {/* <CartProvider> */}
          <App />
        {/* </CartProvider> */}
      </AuthProvider>
  </StrictMode>,
)
