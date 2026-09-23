import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

import UserDashboard from "./pages/UserDashboard";
import AdminDashboard from "./pages/AdminDashboard";

import Payslips from "./pages/Payslips";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ==================== AUTHENTICATION ==================== */}

        <Route
          path="/"
          element={<Login />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />

        <Route
          path="/reset-password"
          element={<ResetPassword />}
        />


        {/* ==================== DASHBOARDS ==================== */}

        <Route
          path="/dashboard"
          element={<UserDashboard />}
        />

        <Route
          path="/admin"
          element={<AdminDashboard />}
        />


        {/* ==================== PAYSLIPS ==================== */}

        <Route
          path="/payslips"
          element={<Payslips />}
        />


        {/* ==================== UNKNOWN URL ==================== */}

        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;