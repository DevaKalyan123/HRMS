import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import UserDashboard from "./pages/UserDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Payslips from "./pages/Payslips";
import Export from "./pages/Export";
import ViewExcel from "./pages/ViewExcel";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Login */}
        <Route path="/" element={<Login />} />

        <Route path="/login" element={<Login />} />

        {/* Authentication pages */}
        <Route path="/register" element={<Register />} />

        <Route path="/forgot-password" element={<ForgotPassword />} />

        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Dashboards */}
        <Route path="/dashboard" element={<UserDashboard />} />

        <Route path="/admin" element={<AdminDashboard />} />

        {/* Unknown URL */}
        <Route path="*" element={<Navigate to="/" replace />} />
        <Route path="/payslips" element={<Payslips />} />
        <Route path="/admin/export" element={<Export />} />
        <Route path="/admin/view-excel" element={<ViewExcel />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
