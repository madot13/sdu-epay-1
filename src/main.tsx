import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import {BrowserRouter} from "react-router-dom";
import './i18n';
import { SidebarProvider } from './contexts/SidebarContext.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
      <BrowserRouter>
          <SidebarProvider>
              <App />
          </SidebarProvider>
      </BrowserRouter>
  </StrictMode>,
)
