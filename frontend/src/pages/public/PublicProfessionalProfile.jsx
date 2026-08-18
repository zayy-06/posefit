import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { httpClient } from "../../lib/http";
import {
  IconCheckCircle,
  IconClock,
  IconCalendar,
} from "../../components/admin/Icons";

const DAYS_ORDER = [
  "Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday",
];

function sortAvailability(availability = []) {
  return [...availability].sort(
    (a, b) => DAYS_ORDER.indexOf(a.day) - DAYS_ORDER.indexOf(b.day)
  );
}

export default function PublicProfessionalProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pro, setPro] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Booking modal state
  const [showBooking, setShowBooking] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [notes, setNotes] = useState("");

  // Success / cancel state
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingCancelled, setBookingCancelled] = useState(false);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchPublicProfile = useCallback(async () => {
    try {
      setLoading(true);
      const res = await httpClient.get(`/auth/public-professionals/${id}`);
      setPro(res.data?.professional || null);
    } catch {
      showToast("Failed to load professional profile", "error");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPublicProfile();

    // Handle Stripe return/cancel
    const params = new URLSearchParams(window.location.search);
    if (params.get("booking_success") === "true") {
      setBookingSuccess(true);
      window.history.replaceState({}, "", window.location.pathname);
    }
    if (params.get("booking_cancelled") === "true") {
      setBookingCancelled(true);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [fetchPublicProfile]);

  const openBooking = () => {
    setSelectedDay(null);
    setSelectedSlot(null);
    setNotes("");
    setShowBooking(true);
  };

  const handleConfirmBooking = async () => {
    if (!selectedDay || !selectedSlot) {
      showToast("Please select a day and time slot before continuing.", "error");
      return;
    }

    setBookingLoading(true);
    try {
      const res = await httpClient.post("/payment/create", {
        professionalId: pro._id,
        amount: pro.sessionFee || 50,
        appointmentDay: selectedDay,
        appointmentSlot: selectedSlot,
        notes: notes.trim(),
      });

      if (res.data?.checkoutUrl) {
        window.location.href = res.data.checkoutUrl;
      } else {
        showToast("Booking session created. Redirecting to payment.");
      }
    } catch (err) {
      showToast(
        err?.response?.data?.message || "Failed to initiate booking payment.",
        "error"
      );
    } finally {
      setBookingLoading(false);
    }
  };

  const availability = sortAvailability(pro?.availability || []);
  const daySlots = availability.find((a) => a.day === selectedDay)?.slots || [];

  return (
    <div className="min-h-screen pb-20" style={{ background: "#f5f7f2" }}>
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-2xl shadow-xl text-white text-sm font-bold border transition-all ${
            toast.type === "error" ? "bg-rose-500 border-rose-600" : "bg-emerald-600 border-emerald-700"
          }`}
          style={{ animation: "fadeIn 0.2s ease" }}
        >
          {toast.msg}
        </div>
      )}

      {/* Top Navbar */}
      <header className="bg-white border-b border-stone-200/80 px-8 py-4 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => navigate("/professionals")}
          >
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl font-black text-white shadow-xs"
              style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}
            >
              P
            </div>
            <div>
              <p className="font-black text-lg tracking-tight leading-none text-stone-800">PoseFit</p>
              <p className="text-xs font-bold mt-0.5 text-emerald-600">Professional Profile</p>
            </div>
          </div>
          <button
            onClick={() => navigate("/professionals")}
            className="px-4 py-2 rounded-xl text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 transition-colors"
          >
            ← Back to Directory
          </button>
        </div>
      </header>

      {/* Booking Success Banner */}
      {bookingSuccess && (
        <div className="max-w-5xl mx-auto px-8 mt-6">
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
            <IconCheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold text-emerald-900 text-sm">Booking Confirmed!</p>
              <p className="text-xs text-emerald-700 font-medium mt-0.5">
                Your payment was successful. The professional will be in touch to confirm your session details.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Booking Cancelled Banner */}
      {bookingCancelled && (
        <div className="max-w-5xl mx-auto px-8 mt-6">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
            <span className="text-amber-600 text-lg">⚠</span>
            <p className="font-medium text-amber-900 text-sm">
              Payment was cancelled. You can try booking again anytime.
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
        </div>
      ) : !pro ? (
        <div className="max-w-4xl mx-auto px-8 mt-12 text-center">
          <div className="bg-white rounded-3xl border border-stone-200 p-12 shadow-xs">
            <p className="text-xl font-extrabold text-stone-800 mb-1">Professional Not Found</p>
            <p className="text-stone-400 text-sm font-medium">The requested professional profile is not available.</p>
          </div>
        </div>
      ) : (
        <div className="max-w-5xl mx-auto px-8 mt-10 space-y-6">
          {/* Main Card */}
          <div className="bg-white rounded-3xl border border-stone-200 p-8 shadow-xs">
            <div className="flex items-start justify-between gap-6 flex-wrap">
              <div className="flex items-start gap-5">
                {pro.profilePhoto ? (
                  <img
                    src={pro.profilePhoto}
                    alt={pro.firstName}
                    className="w-24 h-24 rounded-3xl object-cover border border-stone-200 shadow-xs shrink-0"
                  />
                ) : (
                  <div
                    className="w-24 h-24 rounded-3xl flex items-center justify-center text-white font-black text-3xl shadow-xs shrink-0"
                    style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}
                  >
                    {pro.firstName?.[0]?.toUpperCase()}
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-2xl font-black text-stone-900">
                      {pro.firstName} {pro.lastName}
                    </h1>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                      <IconCheckCircle className="w-3.5 h-3.5 text-emerald-600" /> PoseFit Certified
                    </span>
                  </div>

                  <p className="text-sm font-bold text-stone-500 mt-1">
                    {pro.professionalType || "Trainer"} • {pro.specialization || "General Fitness"}
                  </p>

                  <div className="flex items-center gap-3 mt-3 flex-wrap">
                    <div className="bg-stone-50 px-3.5 py-1.5 rounded-xl border border-stone-200 text-xs font-extrabold text-stone-800">
                      {pro.rating?.count > 0 ? (
                        <span>⭐ {pro.rating.average.toFixed(1)} ({pro.rating.count} ratings)</span>
                      ) : (
                        <span className="text-amber-700">⭐ New Professional</span>
                      )}
                    </div>
                    <div className="bg-emerald-50 px-3.5 py-1.5 rounded-xl border border-emerald-200 text-xs font-black text-emerald-800">
                      ${pro.sessionFee ? Number(pro.sessionFee).toFixed(2) : "0.00"} / session
                    </div>
                  </div>
                </div>
              </div>

              {/* Book Now Button */}
              <button
                onClick={openBooking}
                className="px-8 py-3.5 rounded-2xl font-bold text-white text-sm shadow-md hover:opacity-90 transition-all"
                style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}
              >
                Book a Session
              </button>
            </div>

            {/* Bio */}
            {pro.bio && (
              <div className="mt-8 pt-6 border-t border-stone-100">
                <h3 className="text-xs font-extrabold text-stone-400 uppercase tracking-wider mb-2">
                  About & Philosophy
                </h3>
                <p className="text-stone-700 font-medium text-sm leading-relaxed">{pro.bio}</p>
              </div>
            )}
          </div>

          {/* Availability Schedule Card */}
          <div className="bg-white rounded-3xl border border-stone-200 p-8 shadow-xs">
            <h3 className="text-xs font-extrabold text-stone-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <IconCalendar className="w-4 h-4 text-emerald-600" /> Weekly Availability Schedule
            </h3>

            {availability.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {availability.map((item, idx) => (
                  <div key={idx} className="p-4 bg-stone-50 rounded-2xl border border-stone-200">
                    <p className="font-extrabold text-stone-800 text-sm mb-2">{item.day}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {item.slots && item.slots.length > 0 ? (
                        item.slots.map((slot, sIdx) => (
                          <span
                            key={sIdx}
                            className="px-2.5 py-1 rounded-lg bg-white border border-stone-200 text-xs font-bold text-stone-700 flex items-center gap-1"
                          >
                            <IconClock className="w-3 h-3 text-stone-400" />
                            {slot}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-stone-400">No slots</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-stone-400 font-medium">No availability schedule published yet.</p>
            )}
          </div>
        </div>
      )}

      {/* ── BOOKING MODAL ── */}
      {showBooking && pro && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div
            className="bg-white rounded-3xl shadow-2xl border border-stone-200 w-full max-w-lg overflow-y-auto"
            style={{ maxHeight: "92vh", animation: "fadeIn 0.2s ease" }}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-stone-100 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-black text-stone-800">Book a Session</h2>
                <p className="text-xs text-stone-500 font-medium mt-0.5">
                  with <span className="font-bold text-stone-700">{pro.firstName} {pro.lastName}</span>
                  {" "}(${Number(pro.sessionFee || 50).toFixed(2)} per session)
                </p>
              </div>
              <button
                onClick={() => setShowBooking(false)}
                className="text-stone-400 hover:text-stone-700 text-xl font-bold leading-none transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Step 1: Select Day */}
              <div>
                <label className="block text-xs font-extrabold text-stone-500 uppercase tracking-wider mb-2">
                  Step 1: Choose a Day
                </label>
                {availability.length === 0 ? (
                  <p className="text-xs text-stone-400 font-medium">
                    No availability slots configured by this professional yet.
                  </p>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {availability.map((item) => (
                      <button
                        key={item.day}
                        onClick={() => {
                          setSelectedDay(item.day);
                          setSelectedSlot(null);
                        }}
                        className={`py-2.5 px-2 rounded-xl text-xs font-bold border transition-all ${
                          selectedDay === item.day
                            ? "bg-emerald-600 text-white border-emerald-600 shadow-md"
                            : "bg-stone-50 text-stone-700 border-stone-200 hover:border-emerald-300 hover:bg-emerald-50"
                        }`}
                      >
                        {item.day.slice(0, 3)}
                        <span className="block text-[10px] font-medium opacity-70 mt-0.5">
                          {item.slots?.length || 0} slots
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Step 2: Select Time Slot */}
              {selectedDay && (
                <div>
                  <label className="block text-xs font-extrabold text-stone-500 uppercase tracking-wider mb-2">
                    Step 2: Choose a Time Slot for {selectedDay}
                  </label>
                  {daySlots.length === 0 ? (
                    <p className="text-xs text-stone-400 font-medium">
                      No time slots available for {selectedDay}.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {daySlots.map((slot, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedSlot(slot)}
                          className={`py-3 px-4 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 ${
                            selectedSlot === slot
                              ? "bg-emerald-600 text-white border-emerald-600 shadow-md"
                              : "bg-stone-50 text-stone-700 border-stone-200 hover:border-emerald-300 hover:bg-emerald-50"
                          }`}
                        >
                          <IconClock className={`w-4 h-4 shrink-0 ${selectedSlot === slot ? "text-white" : "text-stone-400"}`} />
                          {slot}
                          {selectedSlot === slot && (
                            <IconCheckCircle className="w-4 h-4 ml-auto text-white" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Notes */}
              {selectedSlot && (
                <div>
                  <label className="block text-xs font-extrabold text-stone-500 uppercase tracking-wider mb-2">
                    Step 3: Notes (Optional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Any specific goals, injuries to be aware of, or questions for your professional..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs font-medium text-stone-800 outline-none focus:ring-2 focus:ring-emerald-300 resize-none"
                  />
                </div>
              )}

              {/* Summary Bar */}
              {selectedDay && selectedSlot && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <p className="text-xs font-extrabold text-emerald-800 uppercase tracking-wide">Booking Summary</p>
                    <p className="text-sm font-bold text-stone-800 mt-1">
                      {selectedDay} at {selectedSlot}
                    </p>
                    <p className="text-xs text-stone-500 font-medium mt-0.5">
                      with {pro.firstName} {pro.lastName}
                    </p>
                  </div>
                  <p className="text-xl font-black text-emerald-800">
                    ${Number(pro.sessionFee || 50).toFixed(2)}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => setShowBooking(false)}
                  className="flex-1 py-3 rounded-2xl text-sm font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 border border-stone-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmBooking}
                  disabled={!selectedDay || !selectedSlot || bookingLoading}
                  className="flex-1 py-3 rounded-2xl text-sm font-bold text-white shadow-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}
                >
                  {bookingLoading
                    ? "Redirecting to Payment..."
                    : !selectedDay
                    ? "Select a Day"
                    : !selectedSlot
                    ? "Select a Time Slot"
                    : "Confirm & Pay →"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.97) translateY(4px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
