import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage.jsx';
import HomePage from './pages/HomePage.jsx';
import ProtectedRoute from './auth/ProtectedRoute.jsx';
import FeedPage from './pages/FeedPage.jsx';
import PublicProfilePage from './pages/PublicProfilePage.jsx';
import MyProfilePage from './pages/MyProfilePage.jsx';
import UploadBeat from './components/UploadBeat.jsx';
import CheckoutPage from './pages/CheckoutPage.jsx';
import Navbar from './components/Navbar/Navbar.jsx';
import LikedTracks from './pages/LikedTracks.jsx';
// import './styles/overlays.css';
import Messages from './pages/Messages.jsx';
import TracksNewPage from './pages/TracksNewPage/TracksNewPage.jsx';
import StudioLayout from './layouts/StudioLayout.jsx';
import FileStoragePage from './pages/FileStoragePage/FileStoragePage.jsx';
import ExploreTracksPage from './pages/ExploreTracks/ExploreTracksPage.jsx';
import './styles/global.css'; // Import global styles

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        {/* <Route path="/" element={<FeedPage />} /> */}
        <Route path="/" element={<ExploreTracksPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/users/:uid" element={<PublicProfilePage />} />
        <Route path="/@:handle" element={<PublicProfilePage />} />
        <Route path="/checkout" element={<CheckoutPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/me" element={<MyProfilePage />} />
          {/* <Route path="/upload" element={<UploadBeat />} /> */}
          <Route path="/likes" element={<LikedTracks />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/files/upload" element={<StudioLayout><FileStoragePage /></StudioLayout>} />
          <Route path="/tracks/new" element={<StudioLayout><TracksNewPage /></StudioLayout>} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}