import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Initialize theme before React boots to avoid flash
const savedTheme = localStorage.getItem('css-theme');
if (savedTheme === 'light') {
  document.documentElement.classList.add('light');
  document.documentElement.classList.remove('dark');
  document.documentElement.setAttribute('data-theme', 'light');
} else {
  document.documentElement.classList.add('dark');
  document.documentElement.classList.remove('light');
  document.documentElement.setAttribute('data-theme', 'dark');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
