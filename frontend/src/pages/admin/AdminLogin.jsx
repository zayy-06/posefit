import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { setAdminToken, setAdminUser } from "../../lib/admin-auth";
import { IconEye, IconEyeOff, IconAlertTriangle } from "../../components/admin/Icons";

const REMEMBER_EMAIL_KEY = "posefit_remember_email";
const REMEMBER_PASS_KEY = "posefit_remember_pass";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);

  // Pre-fill credentials if Remember Me was saved previously
  useEffect(() => {
    const savedEmail = localStorage.getItem(REMEMBER_EMAIL_KEY);
    const savedPass = localStorage.getItem(REMEMBER_PASS_KEY);
    if (savedEmail) {
      setForm({
        email: savedEmail,
        password: savedPass || "",
      });
      setRememberMe(true);
    }
  }, []);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError("Both fields are required.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/auth/login`,
        { email: form.email, password: form.password }
      );
      const { token, user } = res.data;
      if (user?.role !== "ADMIN") {
        setError("Access denied. Administrator accounts only.");
        return;
      }

      // Handle Remember Me persistence
      if (rememberMe) {
        localStorage.setItem(REMEMBER_EMAIL_KEY, form.email);
        localStorage.setItem(REMEMBER_PASS_KEY, form.password);
      } else {
        localStorage.removeItem(REMEMBER_EMAIL_KEY);
        localStorage.removeItem(REMEMBER_PASS_KEY);
      }

      setAdminToken(token);
      setAdminUser(user);
      navigate("/admin/dashboard");
    } catch (err) {
      setError(err?.response?.data?.message || "Login failed. Please verify credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #f0fdf4 0%, #f8fafc 40%, #e0f2fe 100%)",
      }}
    >
      {/* Decorative Pastel Ambient Blurs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-40 blur-3xl"
          style={{ background: "#bbf7d0" }}
        />
        <div
          className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full opacity-40 blur-3xl"
          style={{ background: "#bae6fd" }}
        />
      </div>

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-3xl p-9 shadow-xl border border-stone-200/80 relative">
          {/* Brand Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-black text-stone-800 tracking-tight">PoseFit Admin</h1>
            <p className="text-stone-500 text-xs font-semibold mt-1">Sign in to your administrator control panel</p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold text-center flex items-center justify-center gap-2">
              <IconAlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-stone-600 text-xs font-bold mb-1.5 uppercase tracking-wider">
                Admin Email Address
              </label>
              <input
                id="admin-email"
                name="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={handleChange}
                placeholder="admin@posefit.com"
                className="w-full px-4 py-3 rounded-2xl border border-stone-200 text-stone-800 placeholder-stone-400 text-sm outline-none transition-all focus:ring-2 focus:ring-emerald-300 font-medium bg-stone-50/50"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-stone-600 text-xs font-bold mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <input
                  id="admin-password"
                  name="password"
                  type={showPass ? "text" : "password"}
                  autoComplete="current-password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-12 rounded-2xl border border-stone-200 text-stone-800 placeholder-stone-400 text-sm outline-none transition-all focus:ring-2 focus:ring-emerald-300 font-medium bg-stone-50/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((p) => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors"
                >
                  {showPass ? <IconEyeOff className="w-4 h-4" /> : <IconEye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-stone-300 text-emerald-600 focus:ring-emerald-400 cursor-pointer accent-emerald-600"
                />
                <span className="text-xs font-bold text-stone-600">Remember Me</span>
              </label>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                Autofill Enabled
              </span>
            </div>

            {/* Submit */}
            <button
              id="admin-login-btn"
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl font-black text-white text-sm transition-all duration-200 hover:opacity-95 active:scale-98 mt-2 shadow-xs disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Authenticating…
                </span>
              ) : (
                "Sign In to Control Panel"
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-stone-400 text-xs font-semibold mt-6">
          PoseFit Admin Panel • Authorized Personnel Only
        </p>
      </div>
    </div>
  );
}
