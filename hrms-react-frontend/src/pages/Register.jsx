import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { API_BASE_URL } from "../services/api";

import logo from "../assets/logo.jpeg";

import "../styles/register.css";

function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);

  // Admin access checking
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [accessMessage, setAccessMessage] = useState("");

  const [message, setMessage] = useState("");

  // --------------------------------------------------
  // CHECK ADMIN ACCESS
  // --------------------------------------------------
  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/auth/register`,
          {
            method: "GET",
            credentials: "include",
            headers: {
              Accept: "application/json",
            },
          }
        );

        const data = await response.json();

        console.log("REGISTER ACCESS CHECK:", data);

        if (response.ok && data.success) {
          // Admin session is valid
          setIsAdmin(true);
          setAccessMessage("");
        } else {
          // Not logged in or not admin
          setIsAdmin(false);
          setAccessMessage(
            data.message || "Admin access required"
          );
        }
      } catch (error) {
        console.error("Admin access check error:", error);

        setIsAdmin(false);
        setAccessMessage(
          "Unable to verify admin access. Please try again."
        );
      } finally {
        setCheckingAccess(false);
      }
    };

    checkAdminAccess();
  }, []);

  // --------------------------------------------------
  // IMAGE PREVIEW
  // --------------------------------------------------
  const previewImage = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      setPreview("");
      return;
    }

    setPreview(URL.createObjectURL(file));
  };

  // --------------------------------------------------
  // REGISTER USER
  // --------------------------------------------------
  const handleRegister = async (event) => {
    event.preventDefault();

    if (!isAdmin) {
      setMessage("Admin access required.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const formData = new FormData(event.currentTarget);

      const response = await fetch(
        `${API_BASE_URL}/auth/register`,
        {
          method: "POST",
          credentials: "include",
          body: formData,
        }
      );

      const data = await response.json();

      console.log("REGISTER RESPONSE:", data);

      if (response.ok && data.success) {
        setMessage(
          "Registered successfully. Redirecting to login..."
        );

        setTimeout(() => {
          window.location.href = "/login";
        }, 1000);

        return;
      }

      // If backend says admin access is required
      if (response.status === 403) {
        setIsAdmin(false);
        setAccessMessage(
          data.message || "Admin access required"
        );
        return;
      }

      setMessage(data.message || "Registration failed.");
    } catch (error) {
      console.error("Registration error:", error);
      setMessage("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // CHECKING ADMIN ACCESS
  // --------------------------------------------------
  if (checkingAccess) {
    return (
      <div className="container">
        <div className="form-box">
          <img src={logo} alt="HRMS Logo" />

          <h2>Checking Access...</h2>

          <p style={{ textAlign: "center" }}>
            Verifying administrator access.
          </p>
        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // ACCESS DENIED
  // --------------------------------------------------
  if (!isAdmin) {
    return (
      <div className="container">
        <div className="form-box">
          <img src={logo} alt="HRMS Logo" />

          <h2>Admin Access Required</h2>

          <div className="flash-messages">
            <p>
              {accessMessage || "Only administrators can register new users."}
            </p>
          </div>

          <Link
            to="/login"
            className="btn"
            style={{
              display: "block",
              textAlign: "center",
              textDecoration: "none",
              marginTop: "20px",
            }}
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // ADMIN REGISTRATION PAGE
  // --------------------------------------------------
  return (
    <div className="container">
      <div className="form-box">
        <img src={logo} alt="HRMS Logo" />

        <h2>Register</h2>

        <p
          style={{
            textAlign: "center",
            color: "#28a745",
            fontSize: "14px",
            marginBottom: "15px",
          }}
        >
          Administrator access verified
        </p>

        {message && (
          <div className="flash-messages">
            <p>{message}</p>
          </div>
        )}

        <form
          onSubmit={handleRegister}
          encType="multipart/form-data"
        >
          {/* USERNAME */}
          <div className="input-group">
            <input
              type="text"
              name="username"
              placeholder="Username"
              pattern="[A-Za-z]+( [A-Za-z]+)*"
              title="Only letters and spaces allowed"
              required
            />
          </div>

          {/* EMAIL */}
          <div className="input-group">
            <input
              type="email"
              name="email"
              placeholder="Email"
              required
            />
          </div>

          {/* PASSWORD */}
          <div className="input-group">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              required
            />

            <button
              type="button"
              className="password-toggle"
              onClick={() =>
                setShowPassword((value) => !value)
              }
              aria-label={
                showPassword
                  ? "Hide password"
                  : "Show password"
              }
            >
              <i
                className={`fas ${
                  showPassword
                    ? "fa-eye-slash"
                    : "fa-eye"
                }`}
              />
            </button>
          </div>

          {/* FACE IMAGE */}
          <div className="input-group">
            <input
              type="file"
              name="face_image"
              accept="image/jpeg,image/png,image/jpg"
              required
              onChange={previewImage}
            />

            {preview && (
              <img
                id="imagePreview"
                src={preview}
                alt="Preview"
              />
            )}
          </div>

          {/* REGISTER BUTTON */}
          <button
            type="submit"
            className="btn"
            disabled={loading}
          >
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        <p className="redirect">
          Already have an account?{" "}
          <Link to="/login">Login here</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;