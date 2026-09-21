import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { API_BASE_URL } from "../services/api";

import logo from "../assets/logo.jpeg";

import "../styles/reset_password.css";

function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const handleReset = async (
    event
  ) => {
    event.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      const formData =
        new URLSearchParams();

      formData.append(
        "new_password",
        password
      );

      const response =
        await fetch(
          `${API_BASE_URL}/auth/reset_password`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/x-www-form-urlencoded",
            },

            credentials: "include",

            body:
              formData.toString(),

            redirect: "follow",
          }
        );

     

      const data = await response.json();

console.log("Reset password response:", data);

if (response.ok && data.success) {
  setMessage(
    data.message || "Password reset successfully."
  );

  setTimeout(() => {
    navigate("/login");
  }, 1500);
} else {
  setMessage(
    data.message || "Password reset failed."
  );
}
    } catch (error) {
      console.error(error);

      setMessage(
        "Unable to connect to the server."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">

      <div className="form-box">

        <img
          src={logo}
          alt="HRMS Logo"
        />

        <h2>
          Reset Password
        </h2>

        {message && (
          <div className="flash-messages">
            <p>{message}</p>
          </div>
        )}

        <form
          onSubmit={handleReset}
        >

          <div className="input-group">

            <input
              type={
                showPassword
                  ? "text"
                  : "password"
              }
              name="new_password"
              placeholder="Enter new password"
              value={password}
              onChange={(e) =>
                setPassword(
                  e.target.value
                )
              }
              required
            />

            <i
              className={`fas ${
                showPassword
                  ? "fa-eye-slash"
                  : "fa-eye"
              }`}
              onClick={() =>
                setShowPassword(
                  (value) => !value
                )
              }
            />

          </div>

          <button
            type="submit"
            className="btn"
            disabled={loading}
          >
            {loading
              ? "Resetting..."
              : "Reset Password"}
          </button>

        </form>

        <p className="redirect">

          <Link to="/login">
            Back to Login
          </Link>

        </p>

      </div>

    </div>
  );
}

export default ResetPassword;