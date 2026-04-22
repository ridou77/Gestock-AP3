import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import Login from "../pages/Auth/Login";
import Register from "../pages/Auth/Register";
import ResetPassword from "../pages/Auth/ResetPassword";
import Dashboard from "../pages/Dashboard";
import Profile from "../pages/Dashboard/Profile";
import Products from "../pages/Products";
import Orders from "../pages/Orders";
import OrderCreate from "../pages/Orders/Create";
import OrderTrack from "../pages/Orders/Track";
import Stock from "../pages/Stock";
import AdminDashboard from "../pages/Admin";
import AdminUsers from "../pages/Admin/Users";
import AdminProducts from "../pages/Admin/Products";
import AdminStockEntry from "../pages/Admin/StockEntry";
import AdminMovements from "../pages/Admin/Movements";
import AdminOrders from "../pages/Admin/Orders";
import AdminAudit from "../pages/Admin/Audit";
import ProtectedRoute from "../components/common/ProtectedRoute";
import AdminRoute from "../components/common/AdminRoute";

export default function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" replace /> : <Register />} />
      <Route path="/reset" element={user ? <Navigate to="/dashboard" replace /> : <ResetPassword />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/products"
        element={
          <ProtectedRoute>
            <Products />
          </ProtectedRoute>
        }
      />
      <Route
        path="/orders"
        element={
          <ProtectedRoute>
            <Orders />
          </ProtectedRoute>
        }
      />
      <Route
        path="/orders/create"
        element={
          <ProtectedRoute>
            <OrderCreate />
          </ProtectedRoute>
        }
      />
      <Route
        path="/orders/track"
        element={
          <ProtectedRoute>
            <OrderTrack />
          </ProtectedRoute>
        }
      />
      <Route
        path="/stock"
        element={
          <ProtectedRoute>
            <Stock />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <AdminUsers />
            </AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/products"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <AdminProducts />
            </AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/stock-entry"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <AdminStockEntry />
            </AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/movements"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <AdminMovements />
            </AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/orders"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <AdminOrders />
            </AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/audit"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <AdminAudit />
            </AdminRoute>
          </ProtectedRoute>
        }
      />

      <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
