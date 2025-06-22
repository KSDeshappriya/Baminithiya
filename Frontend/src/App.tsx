import SignIn from './pages/auth/signin';
import SignUp from './pages/auth/signup';
import { Routes, Route } from 'react-router';
import { 
  AuthRoute, 
  PublicRoute, 

} from './components/ProtectedRoute';

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
</Routes>   
    </>
  )
}

export default App
