import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { API_BASE_URL } from "../services/api";

import logo from "../assets/logo.jpeg";

import "../styles/forgot_password.css";

function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] =
    useState("");

  const [otp, setOtp] =
    useState("");

  const [otpSent, setOtpSent] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const sendOtp = async (event) => {
    event.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      const formData =
        new URLSearchParams();

      formData.append(
        "email",
        email
      );

      const response =
        await fetch(
          `${API_BASE_URL}/auth/forgot_password`,
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

      if (response.redirected) {
        window.location.href =
          response.url;

        return;
      }

      if (response.ok) {
        setOtpSent(true);

        setMessage(
          "OTP sent successfully."
        );
      } else {
        setMessage(
          "Unable to send OTP."
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

  const verifyOtp = async (event) => {
    event.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      const formData =
        new URLSearchParams();

      formData.append(
        "otp",
        otp
      );

      const response =
        await fetch(
          `${API_BASE_URL}/auth/verify_otp`,
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

      if (response.redirected) {
        window.location.href =
          response.url;

        return;
      }

      const data = await response.json();

if (response.ok && data.success) {
  setMessage(data.message || "OTP verified successfully.");

  navigate("/reset-password");
} else {
  setMessage(data.message || "Invalid OTP.");
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
          Forgot Password
        </h2>

        {message && (
          <div className="flash-messages">
            <p>{message}</p>
          </div>
        )}

        {!otpSent ? (
          <form
            onSubmit={sendOtp}
          >

            <div className="input-group">

              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) =>
                  setEmail(
                    e.target.value
                  )
                }
                required
              />

            </div>

            <button
              type="submit"
              className="btn"
              disabled={loading}
            >
              {loading
                ? "Sending..."
                : "Send OTP"}
            </button>

          </form>
        ) : (
          <form
            onSubmit={verifyOtp}
          >

            <div className="input-group">

              <input
                type="text"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) =>
                  setOtp(
                    e.target.value
                  )
                }
                required
              />

            </div>

            <button
              type="submit"
              className="btn"
              disabled={loading}
            >
              {loading
                ? "Verifying..."
                : "Verify OTP"}
            </button>

          </form>
        )}

        <p className="redirect">

          <Link to="/login">
            Back to Login
          </Link>

        </p>

      </div>

    </div>
  );
}

export default ForgotPassword;