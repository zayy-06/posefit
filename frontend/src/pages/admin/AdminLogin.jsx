import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  setToken,
  setUser,
} from "../../lib/local-storage";
import { httpClient } from "../../lib/http";
import {
  IconAlertTriangle,
} from "../../components/admin/Icons";

const REMEMBER_EMAIL_KEY = "posefit_remember_email";
const REMEMBER_PASS_KEY = "posefit_remember_password";

export default function AdminLogin() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Load remembered credentials
  useEffect(() => {
    const savedEmail = localStorage.getItem(REMEMBER_EMAIL_KEY);
    const savedPass = localStorage.getItem(REMEMBER_PASS_KEY);

    if (savedEmail && savedPass) {
      setForm({
        email: savedEmail,
        password: savedPass,
      });

      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.email || !form.password) {
      setError("Email and password are required.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await httpClient.post("/auth/login", {
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });

      const { token, user } = res.data;

      if (!token || !user) {
        setError("Invalid response from server.");
        return;
      }

      // Only ADMIN and PROFESSIONAL can access this portal
      if (
        user.role !== "ADMIN" &&
        user.role !== "PROFESSIONAL"
      ) {
        setError(
          "Access denied. Authorized accounts only."
        );
        return;
      }

      // Remember Me
      if (rememberMe) {
        localStorage.setItem(
          REMEMBER_EMAIL_KEY,
          form.email.trim().toLowerCase()
        );

        localStorage.setItem(
          REMEMBER_PASS_KEY,
          form.password
        );
      } else {
        localStorage.removeItem(
          REMEMBER_EMAIL_KEY
        );

        localStorage.removeItem(
          REMEMBER_PASS_KEY
        );
      }

      // Save authentication data
      setToken(token);
      setUser(user);

      // Redirect according to role
      if (user.role === "ADMIN") {
        navigate("/admin/dashboard");
      } else if (user.role === "PROFESSIONAL") {
        navigate("/professional/dashboard");
      }
    } catch (err) {
      console.error("Login error:", err);

      setError(
        err?.response?.data?.message ||
          "Login failed. Please verify credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, #f0fdf4 0%, #f8fafc 40%, #e0f2fe 100%)",
      }}
    >
      {/* Decorative Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-40 blur-3xl"
          style={{
            background: "#bbf7d0",
          }}
        />

        <div
          className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full opacity-40 blur-3xl"
          style={{
            background: "#bae6fd",
          }}
        />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 border border-stone-200/80 shadow-xl">

          {/* Header */}
          <div className="text-center mb-8">
            <div
              className="w-16 h-16 rounded-3xl mx-auto flex items-center justify-center text-white font-black text-2xl shadow-sm mb-4"
              style={{
                background:
                  "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              }}
            >
              P
            </div>

            <h1 className="text-2xl font-black text-stone-800 tracking-tight">
              PoseFit Portal
            </h1>

            <p className="text-xs text-stone-500 font-medium mt-1">
              Sign in to your Admin or Professional Portal
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2.5">
              <IconAlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            {/* Email */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-2">
                Email Address
              </label>

              <input
                type="email"
                required
                placeholder="admin@posefit.com or pro@posefit.com"
                value={form.email}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    email: e.target.value,
                  }))
                }
                className="w-full px-4 py-3 rounded-2xl border border-stone-200 text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-300 text-stone-800 transition-all bg-stone-50/50 focus:bg-white"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-2">
                Password
              </label>

              <input
                type="password"
                required
                placeholder="••••••••"
                value={form.password}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    password: e.target.value,
                  }))
                }
                className="w-full px-4 py-3 rounded-2xl border border-stone-200 text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-300 text-stone-800 transition-all bg-stone-50/50 focus:bg-white"
              />
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-stone-600 font-bold select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) =>
                    setRememberMe(e.target.checked)
                  }
                  className="w-4 h-4 rounded-md border-stone-300 accent-emerald-600 cursor-pointer"
                />

                <span>Remember me</span>
              </label>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl font-bold text-white text-sm shadow-md hover:opacity-95 active:scale-95 disabled:opacity-60 transition-all duration-200 flex items-center justify-center gap-2"
              style={{
                background:
                  "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              }}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign In to Portal</span>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center text-xs text-stone-400 font-medium">
            Protected by PoseFit Portal Security
          </div>
        </div>
      </div>
    </div>
  );
}