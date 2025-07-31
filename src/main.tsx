import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './i18n'; // Import the i18n configuration
import { Suspense } from 'react'; // For loading translations

createRoot(document.getElementById("root")!).render(
  // Wrap App with Suspense for lazy loading translations if needed in the future
  // For now, it handles the initial load gracefully.
  <Suspense fallback="Loading...">
    <App />
  </Suspense>
);
