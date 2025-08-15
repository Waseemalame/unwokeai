import { Navigate, Outlet } from 'react-router-dom';
import { auth } from '../firebase';

/**
 * Renders children if a user is logged in; otherwise redirects to "/".
 * Use by wrapping protected routes in App.jsx.
 */
export default function ProtectedRoute() {
  const isAuthed = !!auth.currentUser;
  return isAuthed ? <Outlet /> : <Navigate to="/" replace />;
}
