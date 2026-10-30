import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AppRoutes from './routes';
import AgriFairAssistant from './components/assistant/AgriFairAssistant';
import VoiceGuideHUD from './components/assistant/VoiceGuideHUD';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <VoiceGuideHUD />
        <AgriFairAssistant />
      </AuthProvider>
    </BrowserRouter>
  );
}

