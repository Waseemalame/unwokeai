import ReactDOM from 'react-dom/client';
import './index.css';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './auth/AuthProvider.jsx';
import { ChatProvider } from './realtime/ChatProvider.jsx';
import { ChatDockProvider } from './components/ChatDock.jsx';
import { CartProvider } from './components/cart/CartProvider.jsx';

ReactDOM.createRoot(document.querySelector('#root')).render(
  <BrowserRouter>
    <AuthProvider>
      <ChatProvider>
        <CartProvider>
          <ChatDockProvider>
            <App />
          </ChatDockProvider>
        </CartProvider>
      </ChatProvider>
    </AuthProvider>
  </BrowserRouter>
);
