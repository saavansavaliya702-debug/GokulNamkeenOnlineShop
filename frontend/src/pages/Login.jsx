// src/components/Login.jsx
import { useState } from "react";
import axios from "axios";
import { Link, useLocation } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { useAuth } from "../pages/AuthContext";
import { API_URL } from "../config/api";
import "../Css/login.css";

const API = `${API_URL}/auth`;

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [otp, setOtp] = useState("");
  const [stage, setStage] = useState("login"); // "login" | "otp"
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const location = useLocation();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError("");
  };

  const goAfterLogin = (userData) => {
    if (userData?.is_admin) {
      window.location.href = "/dashboard";
    } else {
      window.location.href = location.state?.from?.pathname || "/";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data } = await axios.post(`${API}/login`, formData);
      login(data.token, data.user);
      toast.success("Welcome back!");
      goAfterLogin(data.user);
    } catch (err) {
      const res = err.response?.data;

      if (res?.requiresOtp) {
        toast.success("We've emailed you a 6-digit code. Check your inbox.", {
          icon: "📧",
          duration: 6000,
        });
        setStage("otp");
        return;
      }

      const msg = res?.message || "Login failed. Please try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data } = await axios.post(`${API}/verify-otp`, {
        email: formData.email,
        otp,
      });

      login(data.token, data.user);
      toast.success("Verified! Logging you in...");
      setTimeout(() => goAfterLogin(data.user), 600);
    } catch (err) {
      const msg = err.response?.data?.message || "Invalid OTP";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      const { data } = await axios.post(`${API}/resend-otp`, {
        email: formData.email,
      });
      toast.success(data.message || "A new code has been emailed to you.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not resend OTP");
    }
  };

  /* ─── OTP screen ─── */
  if (stage === "otp") {
    return (
      <div className="auth-page">
        <video autoPlay loop muted playsInline className="auth-bg-video">
          <source src="/background.mp4" type="video/mp4" />
        </video>
        <div className="auth-overlay" />

        <Toaster position="top-right" toastOptions={{ duration: 4000 }} />

        <div className="auth-card">
          <div className="auth-brand">
            <img src="/images.jpg" alt="Gokul Namkeen" />
            <div>
              <h1>Gokul Namkeen</h1>
              <span>Authentic since 2003</span>
            </div>
          </div>

          <div className="auth-header">
            <h2>Verify OTP</h2>
            <p>
              We sent a 6-digit code to <strong>{formData.email}</strong>
            </p>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleVerify} className="auth-form">
            <div className="auth-field">
              <label htmlFor="otp">One-Time Password</label>
              <input
                type="text"
                id="otp"
                name="otp"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                maxLength={6}
                required
                placeholder="• • • • • •"
                className="otp-input"
                autoComplete="one-time-code"
              />
            </div>

            <button
              type="submit"
              className="auth-btn"
              disabled={loading || otp.length !== 6}
            >
              {loading ? (
                <>
                  <span className="auth-spinner" />
                  Verifying...
                </>
              ) : (
                "Verify OTP"
              )}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              Didn’t get the code?{" "}
              <button type="button" className="auth-link-btn" onClick={handleResend}>
                Resend OTP
              </button>
            </p>
            <button
              type="button"
              className="auth-link-btn"
              onClick={() => {
                setStage("login");
                setOtp("");
                setError("");
              }}
            >
              ← Back to login
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ─── Login screen ─── */
  return (
    <div className="auth-page">
      <video autoPlay loop muted playsInline className="auth-bg-video">
        <source src="/background.mp4" type="video/mp4" />
      </video>
      <div className="auth-overlay" />

      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />

      <div className="auth-card">
        <div className="auth-brand">
          <img src="/images.jpg" alt="Gokul Namkeen" />
          <div>
            <h1>Gokul Namkeen</h1>
            <span>Authentic since 2003</span>
          </div>
        </div>

        <div className="auth-header">
          <h2>Welcome back</h2>
          <p>Sign in to continue to your account</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>

          <div className="auth-field">
            <label htmlFor="password">Password</label>
            <div className="password-wrap">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Enter your password"
                autoComplete="current-password"
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
              >
                {showPassword ? "🙈" : "👁"}
              </button>
            </div>
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? (
              <>
                <span className="auth-spinner" />
                Logging in...
              </>
            ) : (
              "Login"
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Don’t have an account?{" "}
            <Link to="/register">Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
