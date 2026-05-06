import { initPersistence } from './store/persistence.ts';
import './components/app/dx-app.ts';

initPersistence();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}
