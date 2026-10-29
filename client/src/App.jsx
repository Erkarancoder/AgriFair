import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AppRoutes from './routes';
import AgriFairAssistant from './components/assistant/AgriFairAssistant';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <AgriFairAssistant />
      </AuthProvider>
    </BrowserRouter>
  );
}

