import SignIn from './pages/auth/signin';
import SignUp from './pages/auth/signup';
import { Routes, Route,Navigate } from 'react-router';
import { 
  AuthRoute, 
  PublicRoute, 
  PrivateRoute,
  UserRoute
} from './components/auth/ProtectedRoute';
import Unauthorized from './pages/auth/Unauthorized';
import { UserProfileComponent } from './pages/private/userProfile';
import UserDashboard from './pages/user/userDashbord';
import Home from './pages/public/Home';
import { DisasterDetailsPage } from './pages/user/disasterDetails';

function App() {
  
  return (
    <>
<Routes>
     {/* Public Routes */}
      <Route path="/public/" element={
        <PublicRoute>
          <Home />
        </PublicRoute>
      } />

       {/* Private Routes */}
      <Route path="/private/user-profile" element={
        <PrivateRoute>
          <UserProfileComponent />
        </PrivateRoute>
      } />

      {/* Private Routes */}
      <Route path="/user/" element={
        <UserRoute>
          <UserDashboard />
        </UserRoute>
      } />

      <Route path="/user/disaster/:disasterId" element={
        <UserRoute>
          <DisasterDetailsPage />
        </UserRoute>
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
