import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles/index.css';

// For the engineers who read source.
console.log(
  '%c○ → ●\n%cYou read source. Say hi: mail2yjkim@gmail.com',
  'font-size: 14px; color: #787878;',
  'color: #787878;',
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
