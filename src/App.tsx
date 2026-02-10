import { BrowserRouter } from "react-router-dom";
import Navbar from "./components/layout/Navbar";
import { useAuth } from "./hooks/useAuth";
import AppRoutes from "./routes";

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

function AppContent() {
  const { user } = useAuth();

  return (
    <div className="app-shell">
      {user && <Navbar />}
      <main className="app-main">
        <AppRoutes />
      </main>
    </div>
  );
}

export default App;
