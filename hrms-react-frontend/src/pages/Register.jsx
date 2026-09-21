import { useState } from "react";
import { Link } from "react-router-dom";

import { API_BASE_URL } from "../services/api";

import logo from "../assets/logo.jpeg";

import "../styles/register.css";

function Register() {
  const [showPassword, setShowPassword] = useState(false);

  const [preview, setPreview] = useState("");

  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState("");

  const previewImage = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      setPreview("");
      return;
    }

    setPreview(URL.createObjectURL(file));
  };

  const handleRegister = async (event) => {
  event.preventDefault();

  setLoading(true);
  setMessage("");

  try {
    const formData = new FormData(event.currentTarget);

    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    const data = await response.json();

    console.log("REGISTER RESPONSE:", data);

    if (response.ok && data.success) {
      setMessage("Registered successfully. Redirecting to login...");

      setTimeout(() => {
        window.location.href = "/login";
      }, 1000);

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
  return (
    <div className="container">
      <div className="form-box">
        <img src={logo} alt="HRMS Logo" />

        <h2>Register</h2>

        {message && (
          <div className="flash-messages">
            <p>{message}</p>
          </div>
        )}

        <form onSubmit={handleRegister} encType="multipart/form-data">
          <div className="input-group">
            <input
              type="text"
              name="username"
              placeholder="Username"
              pattern="[A-Za-z]+"
              title="Only letters allowed"
              required
            />
          </div>

          <div className="input-group">
            <input type="email" name="email" placeholder="Email" required />
          </div>

          <div className="input-group">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              required
            />

            <i
              className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"}`}
              onClick={() => setShowPassword((value) => !value)}
            />
          </div>

          <div className="input-group">
            <input
              type="file"
              name="face_image"
              accept="image/*"
              required
              onChange={previewImage}
            />

            {preview && <img id="imagePreview" src={preview} alt="Preview" />}
          </div>

          <button type="submit" className="btn" disabled={loading}>
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        <p className="redirect">
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
