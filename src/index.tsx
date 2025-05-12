import ReactDOM from 'react-dom/client';
import App from './components/App';

document.addEventListener('DOMContentLoaded', () => {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    console.error('Root element not found!');
    return;
  }

  const root = ReactDOM.createRoot(rootElement);
  root.render(<App />);
});
