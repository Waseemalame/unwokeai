import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage.jsx';
import HomePage from './pages/HomePage.jsx';
import ProtectedRoute from './auth/ProtectedRoute.jsx';
import FeedPage from './pages/FeedPage.jsx';
import PublicProfilePage from './pages/PublicProfilePage.jsx';
import MyProfilePage from './pages/MyProfilePage.jsx';
import UploadBeat from './components/UploadBeat.jsx';
import CheckoutPage from './pages/CheckoutPage.jsx';
import './styles/overlays.css';
import Navbar from './components/Navbar.jsx';

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<FeedPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/u/:uid" element={<PublicProfilePage />} />
        <Route path="/checkout" element={<CheckoutPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/me" element={<MyProfilePage />} />
          <Route path="/upload" element={<UploadBeat />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}