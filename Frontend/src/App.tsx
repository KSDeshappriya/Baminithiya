import SignIn from './pages/auth/signin';
import SignUp from './pages/auth/signup';
import { Routes, Route,Navigate } from 'react-router';
import { 
  AuthRoute, 
  PublicRoute, 

} from './components/ProtectedRoute';
import Unauthorized from './pages/auth/Unauthorized';

function App() {
  
  return (
    <>
<Routes>
     {/* Public Routes */}
      <Route path="/" element={
        <PublicRoute>
          <h1>Public Content</h1>
        </PublicRoute>
      } />

      {/* Auth Routes */}
      <Route path="/auth/signin" element={
        <AuthRoute>
          <SignIn />
        </AuthRoute>
      } />
      <Route path="/auth/signup" element={
        <AuthRoute>
          <SignUp />
        </AuthRoute>
      } />
            <Route path="/unauthorized" element={<Unauthorized />} />
                  <Route path="/" element={<Navigate to="/public" replace />} />
      <Route path="*" element={<Navigate to="/public" replace />} />
</Routes>   
    </>
  )
}

export default App
