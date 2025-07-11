import SignIn from './pages/auth/signin';
import SignUp from './pages/auth/signup';
import { Routes, Route,Navigate } from 'react-router';
import { 
  AuthRoute, 
  PublicRoute, 
  PrivateRoute,
  UserRoute,
  GovernmentRoute,
  VolunteerRoute,
  FirstResponderRoute
} from './components/auth/ProtectedRoute';
import Unauthorized from './pages/auth/Unauthorized';
import UserProfilePage from './pages/private/userProfile';
import UserDashboard from './pages/user/userDashbord';
import Home from './pages/public/Home';
import { DisasterDetailsUserPage } from './pages/user/disasterDetails';
import { GovernmentDashboard } from './pages/gov/govDashboard';
import AddResourceComponent from './pages/gov/addResource';
import { DisasterDetailsGovPage } from './pages/gov/disasterDetails';
import AIMetricsPage from './pages/gov/aiMetrics';
import { ReportDetailsPage } from './pages/gov/ReportDetailsPage';
import CommunicationHub from './pages/communication/communicationHub';
import { VolunteerDashboard } from './pages/vol/voldashboard';
import { DisasterDetailsVol } from './pages/vol/disasterDetailsvol';
import { FirstRespondersDashboard } from './pages/fr/frdashboard';
import { DisasterDetailsFr } from './pages/fr/disasterDetailsfr';
import Navbar from './components/auth/Navbar';
import Footer from './components/public/Footer';
import AnalyticsPage from './pages/gov/analytics';
import Documentation from './pages/public/Documentation';

function App() {
  
  return (
    <>
    <Navbar />
<Routes>
     {/* Public Routes */}
      <Route path="/public/" element={
        <PublicRoute>
          <Home />
        </PublicRoute>
      } />

      <Route path="/public/documentation" element={
        <PublicRoute>
          <Documentation />
        </PublicRoute>
      } />

       {/* Private Routes */}
      <Route path="/private/user-profile" element={
        <PrivateRoute>
          <UserProfilePage />
        </PrivateRoute>
      } />

<Route path="/private/disaster/:disasterId/communicationhub" element={
        <PrivateRoute>
          <CommunicationHub />
        </PrivateRoute>
      } />

      {/* User Routes */}
      <Route path="/user/" element={
        <UserRoute>
          <UserDashboard />
        </UserRoute>
      } />

      {/* User Disaster Details Routes */}
      <Route path="/user/disaster/:disasterId" element={
        <UserRoute>
          <DisasterDetailsUserPage />
        </UserRoute>
      } />

      {/* Government Routes */}
      <Route path="/gov/" element={
        <GovernmentRoute>
          <GovernmentDashboard />
        </GovernmentRoute>
      } />

      {/* Government Analytics Route */}
      <Route path="/gov/analytics" element={
        <GovernmentRoute>
          <AnalyticsPage />
        </GovernmentRoute>
      } />

      {/* Government Disaster Details Routes */}
      <Route path="/gov/disaster/:disasterId" element={
        <GovernmentRoute>
          <DisasterDetailsGovPage />
        </GovernmentRoute>
      } />

      {/* Government Add Resource Routes */}
      <Route path="/gov/disaster/:disasterId/addResource" element={
        <GovernmentRoute>
          <AddResourceComponent />
        </GovernmentRoute>
      } />

            {/* Government AI Metrics Routes */}
            <Route path="/gov/disaster/:disasterId/aimetric" element={
        <GovernmentRoute>
          <AIMetricsPage />
        </GovernmentRoute>
      } />

       {/* Government AI Metrics Routes */}
       <Route path="/gov/disaster/:disasterId/report" element={
        <GovernmentRoute>
          <ReportDetailsPage />
        </GovernmentRoute>
      } />

      {/* Volunteer Routes */}
      <Route path="/vol/" element={
        <VolunteerRoute>
          <VolunteerDashboard />
        </VolunteerRoute>
      } />

      {/* Volunteer Disaster Details Routes */}
      <Route path="/vol/disaster/:disasterId" element={
        <VolunteerRoute>
          <DisasterDetailsVol />
        </VolunteerRoute>
      } />

      {/* First Responder Routes */}
      <Route path="/fr/" element={
        <FirstResponderRoute>
          <FirstRespondersDashboard />
        </FirstResponderRoute>
      } />

      {/* First Responder Disaster Details Routes */}
      <Route path="/fr/disaster/:disasterId" element={
        <FirstResponderRoute>
          <DisasterDetailsFr />
        </FirstResponderRoute>
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
      {/* Add Footer at the bottom */}
      <Footer />
    </>
  )
}

export default App
