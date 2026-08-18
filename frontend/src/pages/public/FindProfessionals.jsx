import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { httpClient } from "../../lib/http";
import StatusBadge from "../../components/admin/StatusBadge";
import {
  IconSearch,
  IconStar,
  IconCheckCircle,
  IconDollarSign,
  IconCalendar,
  IconChevronRight,
} from "../../components/admin/Icons";

const TABS = ["All", "Trainer", "Nutritionist"];

export default function FindProfessionals() {
  const navigate = useNavigate();
  const [professionals, setProfessionals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("All");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchPublicProfessionals = useCallback(async () => {
    try {
      setLoading(true);
      const res = await httpClient.get("/auth/public-professionals");
      setProfessionals(res.data?.professionals || []);
    } catch {
      showToast("Failed to load certified professionals", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPublicProfessionals();
  }, [fetchPublicProfessionals]);

  const filtered = professionals.filter((p) => {
    const matchType =
      activeTab === "All" ||
      p.professionalType?.toLowerCase() === activeTab.toLowerCase();
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      p.firstName?.toLowerCase().includes(q) ||
      p.lastName?.toLowerCase().includes(q) ||
      p.specialization?.toLowerCase().includes(q);
    return matchType && matchSearch;
  });

  return (
    <div className="min-h-screen pb-20" style={{ background: "#f5f7f2" }}>
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-2xl shadow-xl text-white text-sm font-bold border transition-all ${
            toast.type === "error" ? "bg-rose-500 border-rose-600" : "bg-emerald-600 border-emerald-700"
          }`}
          style={{ animation: "modalIn 0.2s ease" }}
        >
          {toast.msg}
        </div>
      )}

      {/* Top Navbar */}
      <header className="bg-white border-b border-stone-200/80 px-8 py-4 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl font-black text-white shadow-xs"
              style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}
            >
              P
            </div>
            <div>
              <p className="font-black text-lg tracking-tight leading-none text-stone-800">PoseFit</p>
              <p className="text-xs font-bold mt-0.5 text-emerald-600">Find Certified Professionals</p>
            </div>
          </div>

          <button
            onClick={() => navigate("/admin/login")}
            className="px-4 py-2 rounded-xl text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 transition-colors"
          >
            Portal Login
          </button>
        </div>
      </header>

      {/* Hero Header */}
      <div className="bg-white border-b border-stone-200/60 px-8 py-10">
        <div className="max-w-7xl mx-auto text-center max-w-3xl">
          <span className="text-xs font-extrabold uppercase tracking-widest px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
            Verified Experts
          </span>
          <h1 className="text-4xl font-black text-stone-900 tracking-tight mt-3">
            Book 1-on-1 Fitness Trainers & Nutritionists
          </h1>
          <p className="text-stone-500 font-medium text-base mt-2">
            Work directly with certified professionals to achieve your personal health and fitness goals.
          </p>

          {/* Search & Tabs Bar */}
          <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
            {/* Category Tabs */}
            <div className="flex items-center gap-1 bg-stone-100 p-1.5 rounded-2xl border border-stone-200">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
                    activeTab === tab
                      ? "bg-emerald-700 text-white shadow-xs"
                      : "text-stone-600 hover:text-stone-900"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-80">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400">
                <IconSearch className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Search by name, specialization..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-stone-200 bg-white text-sm outline-none focus:ring-2 focus:ring-emerald-300 text-stone-700 font-medium shadow-xs"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Directory Grid */}
      <div className="max-w-7xl mx-auto px-8 mt-10">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-3xl border border-stone-200 p-16 text-center shadow-xs">
            <p className="text-xl font-extrabold text-stone-800 mb-1">No Professionals Found</p>
            <p className="text-stone-400 font-medium text-sm">
              {search ? "No approved professionals match your search criteria." : "No certified professionals currently available."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((pro) => (
              <div
                key={pro._id}
                className="bg-white rounded-3xl border border-stone-200 p-6 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  {/* Avatar & Badge */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    {pro.profilePhoto ? (
                      <img
                        src={pro.profilePhoto}
                        alt={pro.firstName}
                        className="w-16 h-16 rounded-2xl object-cover border border-stone-200 shadow-xs"
                      />
                    ) : (
                      <div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-xs"
                        style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}
                      >
                        {pro.firstName?.[0]?.toUpperCase()}
                      </div>
                    )}
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                      <IconCheckCircle className="w-3.5 h-3.5" /> Verified
                    </span>
                  </div>

                  {/* Name & Role */}
                  <h3 className="text-lg font-black text-stone-800 leading-tight">
                    {pro.firstName} {pro.lastName}
                  </h3>
                  <p className="text-xs font-bold text-stone-500 mt-1">
                    {pro.professionalType || "Trainer"} • {pro.specialization || "General Fitness"}
                  </p>

                  {/* Bio */}
                  {pro.bio && (
                    <p className="text-xs text-stone-600 font-medium mt-3 line-clamp-2 leading-relaxed">
                      {pro.bio}
                    </p>
                  )}

                  {/* Rating & Fee */}
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-stone-100">
                    <div>
                      <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Rating</p>
                      <p className="text-sm font-extrabold text-stone-800 mt-0.5">
                        {pro.rating?.count > 0 ? (
                          <span>⭐ {pro.rating.average.toFixed(1)} ({pro.rating.count})</span>
                        ) : (
                          <span className="text-amber-700">New</span>
                        )}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Session Fee</p>
                      <p className="text-lg font-black text-emerald-800">
                        ${pro.sessionFee ? Number(pro.sessionFee).toFixed(2) : "0.00"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-6 pt-2">
                  <Link
                    to={`/professionals/${pro._id}`}
                    className="flex-1 py-2.5 rounded-xl border border-stone-200 text-xs font-bold text-stone-700 bg-stone-50 hover:bg-stone-100 text-center transition-colors"
                  >
                    View Profile
                  </Link>
                  <Link
                    to={`/professionals/${pro._id}`}
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white text-center shadow-xs hover:opacity-90 transition-all"
                    style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}
                  >
                    Book Now
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
