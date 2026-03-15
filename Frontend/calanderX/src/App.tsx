import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastContainer } from "react-toastify";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import Login from "./pages/Login";
import { Register } from "./pages/Register";
import { Dashboard } from "./pages/Dashboard";
import { Calendars } from "./pages/Calendars";
import { Boards } from "./pages/Boards";
import { CreateBoard } from "./pages/CreateBoard";
import { BoardView } from "./pages/BoardView";
import { BoardEdit } from "./pages/BoardEdit";
import { PublicBoard } from "./pages/PublicBoard";
import { SharedLinks } from "./pages/SharedLinks";
import { Diagnostic } from "./pages/Diagnostic";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="App">
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/shared/:token" element={<PublicBoard />} />

              {/* Protected routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/calendars"
                element={
                  <ProtectedRoute>
                    <Calendars />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/boards"
                element={
                  <ProtectedRoute>
                    <Boards />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/boards/new"
                element={
                  <ProtectedRoute>
                    <CreateBoard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/boards/:boardId/edit"
                element={
                  <ProtectedRoute>
                    <BoardEdit />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/boards/:boardId"
                element={
                  <ProtectedRoute>
                    <BoardView />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/shared"
                element={
                  <ProtectedRoute>
                    <SharedLinks />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/diagnostic"
                element={
                  <ProtectedRoute>
                    <Diagnostic />
                  </ProtectedRoute>
                }
              />

              {/* Default redirect */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>

            {/* Toast notifications */}
            <ToastContainer
              position="top-right"
              autoClose={5000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
            />
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
