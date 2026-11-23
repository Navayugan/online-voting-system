import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { OrgProvider } from './context/OrgContext';
import AppRoutes from './routes/AppRoutes';

export default function App() {
  return (
    <AuthProvider>
      <OrgProvider>
        <Router>
          <AppRoutes />
        </Router>
      </OrgProvider>
    </AuthProvider>
  );
}
