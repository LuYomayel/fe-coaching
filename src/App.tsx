import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { LanguageProvider } from './i18n/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import { UserProvider } from './contexts/UserContext';
import { ConfirmationDialogProvider } from './utils/ConfirmationDialogContext';
import { SpinnerProvider } from './utils/GlobalSpinner';
import Sidebar from './components/Sidebar';
import Unauthorized from './components/Unauthorized';
import PrivateRoute from './auth/PrivateRoute';
import CoachProfileForm from './pages/CoachProfileForm';
import NotSubscribed from './components/NotSubscribed';
import Home from './auth/Home';
import CoachHome from './pages/CoachHome';
import PlansPage from './pages/coach/PlansPage';
import CoachProfile from './pages/CoachProfile';
import ManageStudentsPage from './pages/ManageStudents';
import ClientDashboard from './pages/ClientDashboard';
import { ChatSidebarProvider } from './utils/ChatSideBarContext';
import StudentDetails from './pages/StudentDetails';
import StudentHome from './pages/StudentHome';
import ClientProfile from './pages/ClientProfile';
import TrainingPlanDetails from './pages/TrainingPlanDetails';
import PlanDetail from './components/dialogs/PlanDetails';
import { NotificationProvider } from './utils/NotificationsContext';
import Settings from './pages/Settings';
import StudentCalendar from './pages/StudentCalendar';
import { NewCreatePlan } from './pages/coach/NewCreatePlan';

// PWA Components
import OfflineIndicator from './components/OfflineIndicator';

interface AppContentProps {
  sidebarExpanded: boolean;
  setSidebarExpanded: (expanded: boolean) => void;
  isMobile: boolean;
}

// Componente interno que usa useLocation para detectar cambios de ruta
const AppContent = ({ sidebarExpanded, setSidebarExpanded, isMobile }: AppContentProps) => {
  const location = useLocation();
  const isHomePage = location.pathname === '/' || location.pathname === '/login';

  return (
    <div className="flex">
      {/* PWA Components */}
      <OfflineIndicator />

      <Sidebar onExpandChange={setSidebarExpanded} />
      <div
        id="app-main-scroll"
        className="flex-grow-1"
        style={{
          marginLeft: isMobile ? '0' : isHomePage ? '0' : sidebarExpanded ? '250px' : '70px',
          transition: 'margin-left 0.3s ease',
          height: '100dvh',
          overflow: 'auto',
          paddingTop: isMobile && !isHomePage ? '3rem' : '0'
        }}
      >
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Home />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          <Route path="/coach" element={<PrivateRoute element={CoachHome} requiredType="coach" />} />
          <Route path="/coach/profile" element={<PrivateRoute element={CoachProfile} requiredType="coach" />} />
          <Route path="/coach/plans" element={<PrivateRoute element={PlansPage} requiredType="coach" />} />
          <Route path="/plans/create" element={<PrivateRoute element={NewCreatePlan} requiredType="coach" />} />
          <Route path="/plans/create/:planId" element={<PrivateRoute element={NewCreatePlan} requiredType="coach" />} />
          <Route
            path="/plans/create-and-assign"
            element={<PrivateRoute element={NewCreatePlan} requiredType="coach" isEdit={true} />}
          />
          <Route
            path="/plans/edit-template/:planId"
            element={<PrivateRoute element={NewCreatePlan} requiredType="coach" isEdit={true} />}
          />
          <Route
            path="/plans/edit/:planId"
            element={<PrivateRoute element={NewCreatePlan} requiredType="coach" isEdit={true} />}
          />
          <Route
            path="/plans/:planId/:studentId"
            element={<PrivateRoute element={PlanDetail} requiredType="coach" />}
          />
          <Route
            path="/students/:studentId/details"
            element={<PrivateRoute element={StudentDetails} requiredType="coach" />}
          />
          <Route path="/manage-students" element={<PrivateRoute element={ManageStudentsPage} requiredType="coach" />} />
          <Route
            path="/client-dashboard/:clientId"
            element={<PrivateRoute element={ClientDashboard} requiredType="coach" />}
          />

          <Route path="/student" element={<PrivateRoute element={StudentHome} requiredType="client" />} />
          <Route path="/student/profile" element={<PrivateRoute element={ClientProfile} requiredType="client" />} />
          <Route path="/plans/start-session/:planId" element={<PrivateRoute element={TrainingPlanDetails} />} />
          <Route path="/student/calendar" element={<StudentCalendar />} />

          <Route path="/complete-coach-profile" element={<PrivateRoute element={CoachProfileForm} />} />
          <Route path="/not-subscribed" element={<NotSubscribed />} />

          <Route path="/settings" element={<Settings />} />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </div>
  );
};

const App = () => {
  const [sidebarExpanded, setSidebarExpanded] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth <= 768);

  // Detectar cambios en el tamaño de la pantalla
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <SpinnerProvider>
      <LanguageProvider>
        <ThemeProvider>
          <UserProvider>
            <ToastProvider>
              <NotificationProvider>
                <ChatSidebarProvider>
                  <ConfirmationDialogProvider>
                    {/*<Elements stripe={stripePromise}>*/}
                    <Router>
                      <AppContent
                        sidebarExpanded={sidebarExpanded}
                        setSidebarExpanded={setSidebarExpanded}
                        isMobile={isMobile}
                      />
                    </Router>
                    {/*</Elements>*/}
                  </ConfirmationDialogProvider>
                </ChatSidebarProvider>
              </NotificationProvider>
            </ToastProvider>
          </UserProvider>
        </ThemeProvider>
      </LanguageProvider>
    </SpinnerProvider>
  );
};

export default App;
