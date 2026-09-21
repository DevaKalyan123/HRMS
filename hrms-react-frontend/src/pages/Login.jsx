import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { API_BASE_URL } from "../services/api";
import "../styles/Login.css";

import logo from "../assets/logo.jpeg";

function Login() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [showAdminModal, setShowAdminModal] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const [loading, setLoading] = useState(false);

  // ========================================
  // SPLASH SCREEN
  // ========================================
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  // ========================================
  // CHECK ADMIN MODAL QUERY PARAMETER
  // ========================================
  useEffect(() => {
    const showModal = searchParams.get("show_modal");

    if (showModal === "true") {
      setShowAdminModal(true);

      searchParams.delete("show_modal");

      setSearchParams(searchParams, {
        replace: true,
      });
    }
  }, [searchParams, setSearchParams]);

  // ========================================
  // LOGIN
  // ========================================
  const handleSubmit = async (event) => {
    event.preventDefault();

    setMessage("");
    setMessageType("");

    // Validate fields
    if (!email || !password) {
      setMessage("Please fill in all fields.");
      setMessageType("error");
      return;
    }

    setLoading(true);

    try {
      // Flask request.form.get("email")
      // Flask request.form.get("password")
      const formData = new URLSearchParams();

      formData.append("email", email);
      formData.append("password", password);

      console.log("Sending login request...");

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",

        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },

        // Important for Flask session cookie
        credentials: "include",

        body: formData.toString(),
      });

      console.log("Login response status:", response.status);

      // Read JSON response from Flask
      const data = await response.json();

      console.log("Login response:", data);

      // ========================================
      // LOGIN FAILED
      // ========================================
      if (!response.ok || !data.success) {
        setMessage(data.message || "Invalid email or password.");

        setMessageType("error");
        return;
      }

      // ========================================
      // LOGIN SUCCESSFUL
      // ========================================
      setMessage("Login successful.");
      setMessageType("success");
      console.log("Login session should now be active");

      /*
       * Admin user
       *
       * Your Flask backend sends:
       * is_admin: true
       */
      if (data.success) {
        if (data.is_admin) {
          // Show Admin/User selection popup
          setShowAdminModal(true);
        } else {
          // Normal user goes directly to User Dashboard
          navigate("/dashboard");
        }
      }
    } catch (error) {
      console.error("Login error:", error);

      setMessage(
        "Unable to connect to the server. Please check that the backend is running.",
      );

      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  // ========================================
// ADMIN / USER DASHBOARD SELECTION
// ========================================
const chooseDashboard = (role) => {
  setMessage("");
  setMessageType("");

  // Close the popup
  setShowAdminModal(false);

  // Navigate directly using React Router
  if (role === "admin") {
    navigate("/admin");
  } else {
    navigate("/dashboard");
  }
};
  // ========================================
  // SPLASH SCREEN
  // ========================================
  if (showSplash) {
    return (
      <div id="splash-screen">
        <img src={logo} alt="HRMS Logo" />
      </div>
    );
  }

  // ========================================
  // LOGIN PAGE
  // ========================================
  return (
    <>
      <div className="login-container">
        <div className="login-form-box">
          {/* Logo */}
          <img className="login-logo" src={logo} alt="HRMS Logo" />

          {/* Title */}
          <h2>Login</h2>

          {/* Message */}
          {message && (
            <div className={`flash-messages ${messageType}`}>{message}</div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} id="loginForm">
            {/* Email */}
            <div className="input-group">
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div className="input-group password-group">
              <input
                type={showPassword ? "text" : "password"}
                id="loginPassword"
                name="password"
                placeholder="Password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                autoComplete="current-password"
              />

              <button
  type="button"
  className="password-toggle"
  onClick={() => setShowPassword((previous) => !previous)}
  aria-label={showPassword ? "Hide password" : "Show password"}
>
  {showPassword ? (
    // Eye with slash when password is visible
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
      <line x1="3" y1="3" x2="21" y2="21" />
    </svg>
  ) : (
    // Normal eye when password is hidden
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )}
</button>
            </div>

            {/* Login Button */}
            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          {/* Links */}
          <p className="redirect-links">
            <Link to="/forgot-password">Forgot Password?</Link>

            <Link to="/register">Register</Link>
          </p>
        </div>
      </div>

      {/* ========================================
          ADMIN DASHBOARD MODAL
          ======================================== */}
      {showAdminModal && (
        <div className="admin-modal">
          <div className="admin-modal-content">
            <h3>You are an Admin</h3>

            <p>Select your dashboard:</p>

            <div className="modal-buttons">
              {/* Admin */}
              <button
                type="button"
                className="modal-btn admin-btn"
                onClick={() => chooseDashboard("admin")}
              >
                Admin
              </button>

              {/* User */}
              <button
                type="button"
                className="modal-btn user-btn"
                onClick={() => chooseDashboard("user")}
              >
                User
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Login;
