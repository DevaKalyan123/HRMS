import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import {
  Chart,
  ArcElement,
  BarElement,
  BarController,
  DoughnutController,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import Payslips from "./Payslips";
import "../styles/dashboard.css";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Register Chart.js components once
Chart.register(
  ArcElement,
  BarElement,
  BarController,
  DoughnutController,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
);

// ---------------------------------------------------------------------------
// MediaPipe liveness constants
// ---------------------------------------------------------------------------
const RIGHT_EYE = [33, 160, 158, 133, 153, 144];
const LEFT_EYE = [362, 385, 387, 263, 373, 380];
const EAR_THRESHOLD = 0.22;
const BLINK_CONSEC = 2;
const BLINKS_NEEDED = 2;
const FACE_OVAL = [
  10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378,
  400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21,
  54, 103, 67, 109,
];

function euclidean(p1, p2) {
  return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
}

function eyeAspectRatio(lm, idx) {
  const [p1, p2, p3, p4, p5, p6] = idx.map((i) => lm[i]);
  return (euclidean(p2, p6) + euclidean(p3, p5)) / (2.0 * euclidean(p1, p4));
}

function isFaceAcceptable(lm) {
  const xs = FACE_OVAL.map((i) => lm[i].x);
  const faceWidth = Math.max(...xs) - Math.min(...xs);
  if (faceWidth < 0.15) return false;
  const centerX = (Math.max(...xs) + Math.min(...xs)) / 2;
  if (centerX < 0.2 || centerX > 0.8) return false;
  return true;
}

// ---------------------------------------------------------------------------
// Toast helper
// ---------------------------------------------------------------------------
function showToast(msg, type = "success") {
  const existing = document.getElementById("leave-toast");
  if (existing) existing.remove();
  const t = document.createElement("div");
  t.id = "leave-toast";
  Object.assign(t.style, {
    position: "fixed",
    bottom: "28px",
    right: "28px",
    padding: "13px 20px",
    borderRadius: "12px",
    background: type === "success" ? "#10b981" : "#ef4444",
    color: "#fff",
    fontSize: "0.9rem",
    fontWeight: "600",
    zIndex: "99999",
    boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
    maxWidth: "340px",
    lineHeight: "1.4",
  });
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => {
    t.style.opacity = "0";
    t.style.transition = "opacity 0.3s";
    setTimeout(() => t.remove(), 300);
  }, 4000);
}

// ---------------------------------------------------------------------------
// Sidebar items
// ---------------------------------------------------------------------------
const SIDEBAR_ITEMS = [
  { id: "attendance", icon: "fas fa-clock", label: "Attendance" },
  { id: "daily-tasks", icon: "fas fa-tasks", label: "Daily Tasks" },
  { id: "weekly-rota", icon: "fas fa-calendar-week", label: "Weekly Rota" },
  { id: "holidays", icon: "fas fa-calendar-alt", label: "Holidays" },
  { id: "policies", icon: "fas fa-file-alt", label: "Policies" },
  { id: "mailbox", icon: "fas fa-envelope", label: "My Mailbox" },
  { id: "leaves", icon: "fas fa-umbrella-beach", label: "Leaves" },
  { id: "payslips", icon: "fas fa-file-pdf", label: "My Payslips" },
  { id: "notifications", icon: "fas fa-bell", label: "Notifications" },
];

// ===========================================================================
// Main Component
// ===========================================================================
export default function UserDashboard(props) {
  const {
    username: propUsername = "User",
    userEmail: propUserEmail = "",
    userPosition: propUserPosition = "",
    createdAt: propCreatedAt = null,
    userFaceImageBase64: propUserFaceImageBase64 = null,
    lastLogin: propLastLogin = null,
    lastLogout: propLastLogout = null,
    canLogin: propCanLogin = true,
    dailyStatusSubmitted: propDailyStatusSubmitted = false,
    logoutDone: propLogoutDone = false,
    holidayDates: propHolidayDates = [],
    calendarData: propCalendarData = {},
    latestHoliday: propLatestHoliday = null,
    tasks: propTasks = [],
    rotaImageBase64: propRotaImageBase64 = null,
    holidayTableHtml: propHolidayTableHtml = null,
    compensationLeaves: propCompensationLeaves = 0,
    paidLeaveBalance: propPaidLeaveBalance = 0,
    userLeaves: propUserLeaves = [],
    notifications: propNotifications = [],
    showAdminModal: propShowAdminModal = false,
    logoutUrl: propLogoutUrl = null,
    flashMessages: propFlashMessages = [],
  } = props;

  const [dashboardData, setDashboardData] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState("");

  const username = dashboardData?.username ?? propUsername;

  const userEmail = dashboardData?.userEmail ?? propUserEmail;

  const userPosition = dashboardData?.userPosition ?? propUserPosition;

  const createdAt = dashboardData?.createdAt ?? propCreatedAt;

  const userFaceImageBase64 =
    dashboardData?.userFaceImageBase64 ?? propUserFaceImageBase64;

  const lastLogin = dashboardData?.lastLogin ?? propLastLogin;

  const lastLogout = dashboardData?.lastLogout ?? propLastLogout;

  const canLogin = dashboardData?.canLogin ?? propCanLogin;

  const dailyStatusSubmitted =
    dashboardData?.dailyStatusSubmitted ?? propDailyStatusSubmitted;

  const logoutDone = dashboardData?.logoutDone ?? propLogoutDone;

  const holidayDates = dashboardData?.holidayDates ?? propHolidayDates;

  const calendarData = dashboardData?.calendarData ?? propCalendarData;

  const latestHoliday = dashboardData?.latestHoliday ?? propLatestHoliday;

  const tasks = dashboardData?.tasks ?? propTasks;

  const rotaImageBase64 = dashboardData?.rotaImageBase64 ?? propRotaImageBase64;

  const holidayTableHtml =
    dashboardData?.holidayTableHtml ?? propHolidayTableHtml;

  const compensationLeaves =
    dashboardData?.compensationLeaves ?? propCompensationLeaves;

  const paidLeaveBalance =
    dashboardData?.paidLeaveBalance ?? propPaidLeaveBalance;

  const userLeaves = dashboardData?.userLeaves ?? propUserLeaves;

  const notifications = dashboardData?.notifications ?? propNotifications;

  const showAdminModal = dashboardData?.showAdminModal ?? propShowAdminModal;

  const logoutUrl = `${API_BASE_URL}/auth/logout`;

  const flashMessages = propFlashMessages;

  useEffect(() => {
    let cancelled = false;

    async function loadDashboardData() {
      try {
        setDashboardLoading(true);
        setDashboardError("");

        const response = await fetch(`${API_BASE_URL}/api/dashboard`, {
          method: "GET",
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
        });

        const data = await response.json();

        console.log("Dashboard API status:", response.status);
        console.log("Dashboard API response:", data);

        if (!response.ok || !data.success) {
          if (response.status === 401) {
            throw new Error(
              "Your login session was not found. Please login again.",
            );
          }

          throw new Error(data.message || "Failed to load dashboard data.");
        }

        if (!cancelled) {
          setDashboardData(data);
        }
      } catch (error) {
        console.error("Dashboard loading error:", error);

        if (!cancelled) {
          setDashboardError(error.message || "Unable to load dashboard.");
        }
      } finally {
        if (!cancelled) {
          setDashboardLoading(false);
        }
      }
    }

    loadDashboardData();

    return () => {
      cancelled = true;
    };
  }, [API_BASE_URL]);

  // ---- Navigation state ----
  const [activeSection, setActiveSection] = useState(() => {
    if (typeof window !== "undefined") {
      if (window.location.hash === "#daily-tasks") return "daily-tasks";
      const saved = sessionStorage.getItem("openSection");
      if (saved) {
        sessionStorage.removeItem("openSection");
        return saved;
      }
    }
    return "attendance";
  });

  const [adminPopupVisible, setAdminPopupVisible] = useState(showAdminModal);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileModalSrc, setProfileModalSrc] = useState("");

  // Mobile offcanvas (Bootstrap class toggle simplified)
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Daily status
  const [dailyStatusText, setDailyStatusText] = useState("");

  // Leave form
  const [leaveType, setLeaveType] = useState("");
  const [leaveStart, setLeaveStart] = useState("");
  const [leaveEnd, setLeaveEnd] = useState("");
  const [leaveReason, setLeaveReason] = useState("");
  const [leaveSubmitting, setLeaveSubmitting] = useState(false);

  // Leave history modal
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(false);
  const [allLeavesData, setAllLeavesData] = useState([]);
  const historyLoadedRef = useRef(false);
  const pieChartRef = useRef(null);
  const barChartRef = useRef(null);
  const pieCanvasRef = useRef(null);
  const barCanvasRef = useRef(null);

  // Daily tasks filter
  const [taskFilter, setTaskFilter] = useState("all");

  // Calendar
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());

  // Attendance / liveness
  const videoLoginRef = useRef(null);
  const videoLogoutRef = useRef(null);
  const streamRef = useRef(null);
  const animIdRef = useRef(null);
  const [livenessStatusLogin, setLivenessStatusLogin] = useState({
    msg: "",
    type: "info",
  });
  const [livenessStatusLogout, setLivenessStatusLogout] = useState({
    msg: "",
    type: "info",
  });
  const [cameraActiveLogin, setCameraActiveLogin] = useState(false);
  const [cameraActiveLogout, setCameraActiveLogout] = useState(false);
  const [showCaptureLogin, setShowCaptureLogin] = useState(false);
  const [showCaptureLogout, setShowCaptureLogout] = useState(false);
  const captureImageRef = useRef(null);
  const submittingRef = useRef(false);

  // ---- Helpers ----
  const formatDate = (d, fmt = "datetime") => {
    if (!d) return "N/A";
    try {
      const date = typeof d === "string" ? new Date(d) : d;
      if (fmt === "date") return date.toISOString().slice(0, 10);
      return date.toLocaleString();
    } catch {
      return String(d);
    }
  };

  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (animIdRef.current) cancelAnimationFrame(animIdRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, []);

  // ---- Navigation ----
  const switchSection = useCallback((sectionId) => {
    setActiveSection(sectionId);
    window.location.hash = sectionId;
    setSidebarOpen(false);
  }, []);

  // ---- Liveness camera ----
  const stopStream = useCallback(() => {
    if (animIdRef.current) {
      cancelAnimationFrame(animIdRef.current);
      animIdRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const setStatus = (isLogin, msg, type) => {
    if (isLogin) setLivenessStatusLogin({ msg, type });
    else setLivenessStatusLogout({ msg, type });
  };

  const submitCapture = useCallback(
    (imageDataUrl, endpoint, isLogin) => {
      setStatus(
        isLogin,
        "🔍 Verifying your face on server… please wait.",
        "info",
      );

      const doSubmit = (lat, lng) => {
        const payload = { image: imageDataUrl };
        if (lat !== null) {
          payload.latitude = lat;
          payload.longitude = lng;
        }

        fetch(endpoint, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
          .then((res) => {
            if (!res.ok) {
              return res.json().catch(() => ({
                success: false,
                message: `Server error (HTTP ${res.status}). Please try again.`,
              }));
            }
            return res.json();
          })
          .then((data) => {
            if (data.success) {
              stopStream();
              if (isLogin) {
                setCameraActiveLogin(false);
                setShowCaptureLogin(false);
              } else {
                setCameraActiveLogout(false);
                setShowCaptureLogout(false);
              }
              setStatus(
                isLogin,
                "✅ " + (data.message || "Success!"),
                "success",
              );
              setTimeout(() => window.location.reload(), 1800);
            } else {
              setStatus(
                isLogin,
                "❌ " + (data.message || "Face verification failed."),
                "error",
              );
              submittingRef.current = false;
            }
          })
          .catch((err) => {
            console.error("[submitCapture]", err);
            setStatus(
              isLogin,
              "❌ Network error. Check your connection and try again.",
              "error",
            );
            submittingRef.current = false;
          });
      };

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => doSubmit(pos.coords.latitude, pos.coords.longitude),
          () => {
            setStatus(
              isLogin,
              "❌ Location permission is required. Please allow location access and try again.",
              "error",
            );
            submittingRef.current = false;
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
        );
      } else {
        setStatus(
          isLogin,
          "❌ Your browser does not support location.",
          "error",
        );
        submittingRef.current = false;
      }
    },
    [stopStream],
  );

  const startLivenessCamera = useCallback(
    async (isLogin) => {
      const video = isLogin ? videoLoginRef.current : videoLogoutRef.current;
      const endpoint = isLogin
        ? `${API_BASE_URL}/mark_login`
        : `${API_BASE_URL}/mark_logout`;

      if (!video) {
        console.error("Video element not found");
        return;
      }

      if (typeof window.FaceMesh === "undefined") {
        setStatus(
          isLogin,
          "⚠️ MediaPipe not loaded. Check internet connection.",
          "error",
        );
        return;
      }

      stopStream();
      setStatus(isLogin, "📷 Requesting camera access…", "info");
      if (isLogin) {
        setCameraActiveLogin(true);
        setShowCaptureLogin(false);
      } else {
        setCameraActiveLogout(true);
        setShowCaptureLogout(false);
      }

      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: "user",
          },
        });
      } catch (err) {
        console.error("Camera error:", err);
        let msg = `❌ Camera error: ${err.message}`;
        if (err.name === "NotAllowedError") {
          msg =
            "❌ Camera permission denied. Please allow camera access in browser settings.";
        } else if (err.name === "NotFoundError") {
          msg = "❌ No camera found on this device.";
        }
        setStatus(isLogin, msg, "error");
        if (isLogin) setCameraActiveLogin(false);
        else setCameraActiveLogout(false);
        return;
      }

      streamRef.current = stream;
      video.srcObject = stream;
      try {
        await video.play();
      } catch (e) {
        console.warn("video.play()", e);
      }

      setStatus(isLogin, "⏳ Loading face detector…", "info");

      const faceMesh = new window.FaceMesh({
        locateFile: (f) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4/${f}`,
      });
      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.6,
      });

      let blinkCount = 0;
      let closedFrames = 0;
      let eyeWasOpen = true;
      let livenessOk = false;
      let frameCount = 0;

      faceMesh.onResults((results) => {
        if (livenessOk) return;
        frameCount++;

        if (frameCount === 5) {
          setStatus(
            isLogin,
            "👤 Position your face in the centre of the camera…",
            "info",
          );
        }

        const facesFound = results.multiFaceLandmarks
          ? results.multiFaceLandmarks.length
          : 0;

        if (facesFound === 0) {
          if (frameCount > 5) {
            setStatus(
              isLogin,
              "👤 No face detected. Look directly at the camera.",
              "warn",
            );
          }
          return;
        }

        if (facesFound > 1) {
          setStatus(
            isLogin,
            "⚠️ Multiple faces detected! Only YOU should be in frame.",
            "error",
          );
          blinkCount = 0;
          closedFrames = 0;
          eyeWasOpen = true;
          return;
        }

        const lm = results.multiFaceLandmarks[0];
        if (!isFaceAcceptable(lm)) {
          setStatus(
            isLogin,
            "🔍 Move closer to the camera and centre your face.",
            "warn",
          );
          return;
        }

        const avgEAR =
          (eyeAspectRatio(lm, RIGHT_EYE) + eyeAspectRatio(lm, LEFT_EYE)) / 2.0;

        if (avgEAR < EAR_THRESHOLD) {
          closedFrames++;
          eyeWasOpen = false;
        } else {
          if (closedFrames >= BLINK_CONSEC && !eyeWasOpen) {
            blinkCount++;
          }
          closedFrames = 0;
          eyeWasOpen = true;
        }

        const remaining = BLINKS_NEEDED - blinkCount;
        if (remaining > 0) {
          if (frameCount > 5) {
            setStatus(
              isLogin,
              `👁 Blink ${remaining} more time${remaining > 1 ? "s" : ""}… (only your face should be visible)`,
              "info",
            );
          }
          return;
        }

        livenessOk = true;
        if (animIdRef.current) cancelAnimationFrame(animIdRef.current);

        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        canvas.getContext("2d").drawImage(video, 0, 0);
        const imageDataUrl = canvas.toDataURL("image/jpeg", 0.85);
        captureImageRef.current = imageDataUrl;

        setStatus(
          isLogin,
          "✅ Liveness confirmed! Click the button below to submit.",
          "success",
        );
        if (isLogin) setShowCaptureLogin(true);
        else setShowCaptureLogout(true);
      });

      const processFrame = async () => {
        if (!livenessOk && video.readyState >= 2 && !video.paused) {
          try {
            await faceMesh.send({ image: video });
          } catch {
            /* ignore */
          }
        }
        animIdRef.current = requestAnimationFrame(processFrame);
      };
      animIdRef.current = requestAnimationFrame(processFrame);
    },
    [stopStream],
  );

  const handleStopCamera = (isLogin) => {
    stopStream();
    const video = isLogin ? videoLoginRef.current : videoLogoutRef.current;
    if (video) {
      video.srcObject = null;
    }
    if (isLogin) {
      setCameraActiveLogin(false);
      setShowCaptureLogin(false);
      setLivenessStatusLogin({ msg: "", type: "info" });
    } else {
      setCameraActiveLogout(false);
      setShowCaptureLogout(false);
      setLivenessStatusLogout({ msg: "", type: "info" });
    }
    submittingRef.current = false;
  };

  const handleConfirmCapture = (isLogin) => {
    if (submittingRef.current || !captureImageRef.current) return;
    submittingRef.current = true;
    const endpoint = isLogin
      ? `${API_BASE_URL}/mark_login`
      : `${API_BASE_URL}/mark_logout`;
    submitCapture(captureImageRef.current, endpoint, isLogin);
  };

  // ---- Daily status ----
  const handleSubmitDailyStatus = () => {
    if (!dailyStatusText.trim()) {
      alert("Please enter your daily status report.");
      return;
    }
    fetch(`${API_BASE_URL}/submit_daily_status`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `daily_status=${encodeURIComponent(dailyStatusText)}`,
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          alert("Daily status submitted!");
          window.location.reload();
        } else {
          alert(data.message || "Submission failed.");
        }
      })
      .catch((err) => console.error("Status submit error:", err));
  };

  // ---- Leave apply ----
  const handleSubmitLeave = async () => {
    if (!leaveType || !leaveStart || !leaveEnd || !leaveReason) {
      showToast("Please fill in all fields", "error");
      return;
    }
    if (new Date(leaveStart) > new Date(leaveEnd)) {
      showToast("End date cannot be before start date", "error");
      return;
    }
    setLeaveSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("leave_type", leaveType);
      fd.append("start_date", leaveStart);
      fd.append("end_date", leaveEnd);
      fd.append("reason", leaveReason);
      const res = await fetch(`${API_BASE_URL}/leave/apply_leave`, {
        method: "POST",
        credentials: "include",
        body: fd,
      });
      const data = await res.json();
      if (data.success) {
        showToast(
          "✅ " + data.message + " — Confirmation email sent!",
          "success",
        );
        setLeaveType("");
        setLeaveStart("");
        setLeaveEnd("");
        setLeaveReason("");
        sessionStorage.setItem("openSection", "leaves");
        setTimeout(() => window.location.reload(), 1800);
      } else {
        showToast("❌ " + data.message, "error");
      }
    } catch {
      showToast("Network error. Please try again.", "error");
    } finally {
      setLeaveSubmitting(false);
    }
  };

  // ---- Leave history modal ----
  const openLeaveHistoryModal = () => {
    setLeaveModalOpen(true);
    if (historyLoadedRef.current) return;
    setHistoryLoading(true);
    setHistoryError(false);
    fetch(`${API_BASE_URL}/leave/leave_history`, {
      method: "GET",
      credentials: "include",
    })
      .then((r) => r.json())
      .then((data) => {
        if (!data.success) throw new Error(data.message);
        // User Leave History must contain only employee-visible fields.
        // Admin remarks are intentionally excluded from the user-side history.
        const userVisibleLeaves = (data.leaves || []).map((leave) => ({
          id: leave.id,
          leave_type: leave.leave_type,
          start_date: leave.start_date,
          end_date: leave.end_date,
          total_days: leave.total_days,
          holiday_days: leave.holiday_days,
          used_paid_days: leave.used_paid_days,
          used_comp_days: leave.used_comp_days,
          used_unpaid_days: leave.used_unpaid_days,

          // Employee's own reason
          reason: leave.reason,

          // Application date
          created_at: leave.created_at,

          // Admin action/status
          status: leave.status,

          // Date when admin approved/rejected
          updated_at: leave.updated_at,

          // Keep this out of the user UI
          remarks: leave.remarks,
        }));
        setAllLeavesData(userVisibleLeaves);
        historyLoadedRef.current = true;
        setHistoryLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setHistoryLoading(false);
        setHistoryError(true);
      });
  };

  // Render charts when history data is ready
  useEffect(() => {
    if (
      !leaveModalOpen ||
      historyLoading ||
      historyError ||
      !allLeavesData.length
    )
      return;
    if (!pieCanvasRef.current || !barCanvasRef.current) return;

    const approved = allLeavesData.filter((l) => l.status === "Approved");
    const pending = allLeavesData.filter((l) => l.status === "Pending");
    const rejected = allLeavesData.filter((l) => l.status === "Rejected");

    if (pieChartRef.current) pieChartRef.current.destroy();
    pieChartRef.current = new Chart(pieCanvasRef.current, {
      type: "doughnut",
      data: {
        labels: ["Approved", "Pending", "Rejected"],
        datasets: [
          {
            data: [approved.length, pending.length, rejected.length],
            backgroundColor: ["#10b981", "#f59e0b", "#ef4444"],
            borderWidth: 3,
            borderColor: "#fff",
            hoverOffset: 8,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: "bottom",
            labels: { padding: 16, font: { size: 12 }, usePointStyle: true },
          },
        },
        cutout: "65%",
      },
    });

    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const paidM = new Array(12).fill(0);
    const compM = new Array(12).fill(0);
    const unpaidM = new Array(12).fill(0);
    const yr = new Date().getFullYear();
    approved.forEach((l) => {
      const d = new Date(l.start_date);
      if (d.getFullYear() === yr) {
        paidM[d.getMonth()] += l.used_paid_days || 0;
        compM[d.getMonth()] += l.used_comp_days || 0;
        unpaidM[d.getMonth()] += l.used_unpaid_days || 0;
      }
    });

    if (barChartRef.current) barChartRef.current.destroy();
    barChartRef.current = new Chart(barCanvasRef.current, {
      type: "bar",
      data: {
        labels: months,
        datasets: [
          {
            label: "Paid Days",
            data: paidM,
            backgroundColor: "#10b981bb",
            borderRadius: 6,
          },
          {
            label: "Comp Days",
            data: compM,
            backgroundColor: "#e0e7ffbb",
            borderRadius: 6,
          },
          {
            label: "Unpaid Days",
            data: unpaidM,
            backgroundColor: "#ef4444bb",
            borderRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: "bottom",
            labels: { padding: 16, font: { size: 12 }, usePointStyle: true },
          },
        },
        scales: {
          x: { stacked: true, grid: { display: false } },
          y: { stacked: true, beginAtZero: true, ticks: { stepSize: 1 } },
        },
      },
    });

    return () => {
      if (pieChartRef.current) {
        pieChartRef.current.destroy();
        pieChartRef.current = null;
      }
      if (barChartRef.current) {
        barChartRef.current.destroy();
        barChartRef.current = null;
      }
    };
  }, [leaveModalOpen, historyLoading, historyError, allLeavesData]);

  const exportLeaveHistory = () => {
    if (!allLeavesData.length) {
      showToast("No data to export", "error");
      return;
    }
    try {
      const headers = [
        "#",
        "Leave Type",
        "From",
        "To",
        "Total Days",
        "Paid Days",
        "Comp Days",
        "Unpaid Days",
        "Reason",
        "Applied On",
        "Status",
      ];
      const csvRows = [
        headers.join(","),
        ...allLeavesData.map((l, i) =>
          [
            i + 1,
            `"${l.leave_type}"`,
            l.start_date,
            l.end_date,
            l.total_days,
            l.used_paid_days || 0,
            l.used_comp_days || 0,
            l.used_unpaid_days || 0,
            `"${(l.reason || "").replace(/"/g, '""')}"`,
            l.created_at,
            l.status,
          ].join(","),
        ),
      ];
      const blob = new Blob([csvRows.join("\n")], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `leave_history_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast("✅ Exported successfully!", "success");
    } catch {
      showToast("Export failed.", "error");
    }
  };

  // ---- Calendar render data ----
  const calendarRows = useMemo(() => {
    const firstDay = new Date(calYear, calMonth, 1);
    const lastDay = new Date(calYear, calMonth + 1, 0);
    let startDay = firstDay.getDay();
    startDay = startDay === 0 ? 6 : startDay - 1;

    const cells = [];
    for (let i = 0; i < startDay; i++) {
      cells.push({ empty: true, key: `e-${i}` });
    }
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const fullDate = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const currentDate = new Date(calYear, calMonth, day);
      const classes = [];
      if (calendarData[fullDate] === "present") classes.push("present");
      else if (calendarData[fullDate] === "absent") classes.push("absent");
      else if (calendarData[fullDate] === "future") classes.push("future");
      if (currentDate.getDay() === 0) classes.push("sunday-day");
      if (holidayDates.includes(fullDate)) classes.push("holiday-day");
      cells.push({
        day,
        fullDate,
        className: classes.join(" "),
        key: fullDate,
      });
    }
    const rows = [];
    for (let i = 0; i < cells.length; i += 7) {
      rows.push(cells.slice(i, i + 7));
    }
    // pad last row
    if (rows.length && rows[rows.length - 1].length < 7) {
      const last = rows[rows.length - 1];
      while (last.length < 7)
        last.push({ empty: true, key: `pad-${last.length}` });
    }
    return rows;
  }, [calYear, calMonth, calendarData, holidayDates]);

  // ---- Task stats ----
  const taskStats = useMemo(() => {
    let approved = 0;
    let pending = 0;
    let rejected = 0;
    tasks.forEach((t) => {
      if (t.status === "Approved") approved++;
      else if (t.status === "Rejected") rejected++;
      else pending++;
    });
    return { total: tasks.length, approved, pending, rejected };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    if (taskFilter === "all") return tasks;
    return tasks.filter((t) => t.status === taskFilter);
  }, [tasks, taskFilter]);

  const usedLeavesCount = useMemo(() => {
    if (!userLeaves || !userLeaves.length) return 0;
    return userLeaves
      .filter((l) => l.status === "Approved")
      .reduce((s, l) => s + (l.total_days || 0), 0);
  }, [userLeaves]);

  const profileSrc = userFaceImageBase64
    ? `data:image/jpeg;base64,${userFaceImageBase64}`
    : "/static/default_profile.jpg";

  // =========================================================================
  // Render
  // =========================================================================

  // Wait until real dashboard data is loaded
  if (dashboardLoading) {
    return null;
  }

  // Don't show dummy dashboard if API failed
  if (dashboardError || !dashboardData) {
    return null;
  }

  return (
    <div className="container-fluid">
      {/* ========== SIDEBAR ========== */}
      <nav
        className={`sidebar-pc offcanvas offcanvas-start ${sidebarOpen ? "show" : ""}`}
        id="sidebar"
        tabIndex={-1}
        style={sidebarOpen ? { visibility: "visible" } : undefined}
      >
        <div className="offcanvas-header">
          <h2 className="offcanvas-title">User Dashboard</h2>
          <button
            type="button"
            className="btn-close btn-close-white d-lg-none"
            aria-label="Close"
            id="close-btn"
            onClick={() => setSidebarOpen(false)}
          />
        </div>
        <div className="offcanvas-body">
          <div className="profile-section">
            <div className="profile-circle">
              <img
                id="profile-pic"
                src={profileSrc}
                alt="User Profile"
                onClick={() => {
                  setProfileModalSrc(profileSrc);
                  setProfileModalOpen(true);
                }}
              />
            </div>
            <div className="profile-info">
              <p>
                <strong>Name:</strong> {username}
              </p>
              <p>
                <strong>Email:</strong>{" "}
                <span id="email-display">{userEmail}</span>
              </p>
              <p>
                <strong>Position:</strong> {userPosition}
              </p>
              <p>
                <strong>Joined:</strong> {formatDate(createdAt, "date")}
              </p>
            </div>
          </div>
          <ul className="sidebar-nav">
            {SIDEBAR_ITEMS.map((item) => (
              <li
                key={item.id}
                className={activeSection === item.id ? "active" : ""}
                data-section={item.id}
              >
                <a
                  href={`#${item.id}`}
                  className={activeSection === item.id ? "active" : ""}
                  onClick={(e) => {
                    e.preventDefault();
                    switchSection(item.id);
                  }}
                >
                  <i className={item.icon} />
                  <span className="sidebar-text">{item.label}</span>
                </a>
              </li>
            ))}
            <li>
              <a
                href="/login"
                onClick={async (e) => {
                  e.preventDefault();

                  try {
                    await fetch(`${API_BASE_URL}/auth/logout`, {
                      method: "GET",
                      credentials: "include",
                    });
                  } catch (error) {
                    console.error("Logout error:", error);
                  } finally {
                    window.location.href = "/login";
                  }
                }}
              >
                <i className="fas fa-sign-out-alt" />
                <span className="sidebar-text">Logout</span>
              </a>
            </li>
          </ul>
        </div>
      </nav>

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="offcanvas-backdrop fade show"
          onClick={() => setSidebarOpen(false)}
          style={{ zIndex: 9990 }}
        />
      )}

      {/* ========== MAIN ========== */}
      <main
        className="main-content"
        id="mainContent"
        style={{ display: "block" }}
      >
        {activeSection !== "payslips" && (
          <div className="header" id="globalHeader">
            <h1 id="globalWelcome">Welcome, {username}</h1>
            <button
              className="toggle-btn"
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <i className="fas fa-bars" />
            </button>
          </div>
        )}

        {/* Flash messages */}
        {flashMessages.length > 0 && (
          <div className="flash-messages">
            {flashMessages.map((m, i) => (
              <div
                key={i}
                className={`alert alert-${m.category === "error" ? "danger" : "success"} alert-dismissible fade show`}
                role="alert"
              >
                {m.message}
              </div>
            ))}
          </div>
        )}

        {/* ── ATTENDANCE ── */}
        <section
          className={`content-section ${activeSection === "attendance" ? "active" : ""}`}
          id="attendance"
        >
          <div className="card">
            <h3>Attendance</h3>

            {latestHoliday && (
              <div className="holiday-marquee-container">
                <marquee behavior="scroll" direction="left" scrollamount="5">
                  🎉 Upcoming Holiday :{" "}
                  <strong>{latestHoliday.holiday_name}</strong> -{" "}
                  {formatDate(latestHoliday.holiday_date, "date")}
                </marquee>
              </div>
            )}

            <p>
              <strong>Last Login:</strong> {formatDate(lastLogin)}
            </p>
            <p>
              <strong>Last Logout:</strong> {formatDate(lastLogout)}
            </p>

            <div className="attendance-form">
              {/* STEP 1: LOGIN */}
              {canLogin && (
                <>
                  {livenessStatusLogin.msg && (
                    <p
                      id="liveness-status-login"
                      className={`alert alert-${
                        livenessStatusLogin.type === "success"
                          ? "success"
                          : livenessStatusLogin.type === "error"
                            ? "danger"
                            : livenessStatusLogin.type === "warn"
                              ? "warning"
                              : "info"
                      } mt-2`}
                    >
                      {livenessStatusLogin.msg}
                    </p>
                  )}
                  <video
                    ref={videoLoginRef}
                    id="video"
                    autoPlay
                    muted
                    playsInline
                    style={{
                      width: "100%",
                      maxWidth: 420,
                      height: 300,
                      objectFit: "cover",
                      borderRadius: 10,
                      background: "#1a1a2e",
                      display: cameraActiveLogin ? "block" : "none",
                      marginBottom: 12,
                      border: "2px solid #dee2e6",
                    }}
                  />
                  <div className="d-flex gap-2 flex-wrap align-items-center mb-2">
                    {!cameraActiveLogin && (
                      <button
                        id="start-camera-btn"
                        className="btn btn-primary"
                        type="button"
                        onClick={() => startLivenessCamera(true)}
                      >
                        📷 Start Camera
                      </button>
                    )}
                    {cameraActiveLogin && (
                      <button
                        id="stop-camera-btn"
                        className="btn btn-danger"
                        type="button"
                        onClick={() => handleStopCamera(true)}
                      >
                        ■ Stop
                      </button>
                    )}
                    {showCaptureLogin && (
                      <button
                        id="capture-login-btn"
                        className="btn btn-success"
                        type="button"
                        onClick={() => handleConfirmCapture(true)}
                      >
                        ✓ Confirm Login
                      </button>
                    )}
                  </div>
                  <small className="text-muted d-block mt-1">
                    ℹ Please <strong>blink 2 times</strong> when prompted — this
                    confirms you are a real person.
                  </small>
                </>
              )}

              {/* STEP 2: DAILY STATUS */}
              {!canLogin && lastLogin && !dailyStatusSubmitted && (
                <>
                  <textarea
                    id="daily-status"
                    className="form-control mb-2 daily-status-input"
                    rows={4}
                    placeholder="Enter your daily status report..."
                    value={dailyStatusText}
                    onChange={(e) =>
                      setDailyStatusText(
                        e.target.value.replace(/[^A-Za-z .,]/g, ""),
                      )
                    }
                  />
                  <button
                    id="submit-status-btn"
                    className="btn btn-primary"
                    type="button"
                    onClick={handleSubmitDailyStatus}
                  >
                    ✈ Submit Daily Status
                  </button>
                </>
              )}

              {/* STEP 3: LOGOUT */}
              {!canLogin &&
                lastLogin &&
                dailyStatusSubmitted &&
                !logoutDone && (
                  <>
                    <div className="alert alert-info">
                      ▶ Please capture your logout photo
                    </div>
                    {livenessStatusLogout.msg && (
                      <p
                        id="liveness-status-logout"
                        className={`alert alert-${
                          livenessStatusLogout.type === "success"
                            ? "success"
                            : livenessStatusLogout.type === "error"
                              ? "danger"
                              : livenessStatusLogout.type === "warn"
                                ? "warning"
                                : "info"
                        } mt-2`}
                      >
                        {livenessStatusLogout.msg}
                      </p>
                    )}
                    <video
                      ref={videoLogoutRef}
                      id="video-logout"
                      autoPlay
                      muted
                      playsInline
                      style={{
                        width: "100%",
                        maxWidth: 420,
                        height: 300,
                        objectFit: "cover",
                        borderRadius: 10,
                        background: "#1a1a2e",
                        display: cameraActiveLogout ? "block" : "none",
                        marginBottom: 12,
                        border: "2px solid #dee2e6",
                      }}
                    />
                    <div className="d-flex gap-2 flex-wrap align-items-center mb-2">
                      {!cameraActiveLogout && (
                        <button
                          id="start-camera-logout-btn"
                          className="btn btn-primary"
                          type="button"
                          onClick={() => startLivenessCamera(false)}
                        >
                          📷 Start Camera
                        </button>
                      )}
                      {cameraActiveLogout && (
                        <button
                          id="stop-camera-logout-btn"
                          className="btn btn-danger"
                          type="button"
                          onClick={() => handleStopCamera(false)}
                        >
                          ■ Stop
                        </button>
                      )}
                      {showCaptureLogout && (
                        <button
                          id="capture-logout-btn"
                          className="btn btn-success"
                          type="button"
                          onClick={() => handleConfirmCapture(false)}
                        >
                          ✓ Confirm Logout
                        </button>
                      )}
                    </div>
                    <small className="text-muted d-block mt-1">
                      ℹ Please <strong>blink 2 times</strong> when prompted —
                      this confirms you are a real person.
                    </small>
                  </>
                )}

              {/* STEP 4: DONE */}
              {!canLogin &&
                !(lastLogin && !dailyStatusSubmitted) &&
                !(lastLogin && dailyStatusSubmitted && !logoutDone) && (
                  <div className="alert alert-success">
                    ✓ You have completed today&apos;s attendance.
                  </div>
                )}
            </div>

            <h3 className="mt-4">Attendance Calendar</h3>
            <div className="calendar">
              <div className="calendar-header d-flex justify-content-between align-items-center mb-3">
                <button
                  id="prev-month"
                  className="btn btn-outline-primary"
                  type="button"
                  onClick={() => {
                    let m = calMonth - 1;
                    let y = calYear;
                    if (m < 0) {
                      m = 11;
                      y -= 1;
                    }
                    setCalMonth(m);
                    setCalYear(y);
                  }}
                >
                  &lt;
                </button>
                <h4 id="month-year" className="m-0">
                  {new Date(calYear, calMonth).toLocaleString("default", {
                    month: "long",
                    year: "numeric",
                  })}
                </h4>
                <button
                  id="next-month"
                  className="btn btn-outline-primary"
                  type="button"
                  onClick={() => {
                    let m = calMonth + 1;
                    let y = calYear;
                    if (m > 11) {
                      m = 0;
                      y += 1;
                    }
                    setCalMonth(m);
                    setCalYear(y);
                  }}
                >
                  &gt;
                </button>
              </div>
              <table className="table table-bordered">
                <thead>
                  <tr>
                    <th>Mon</th>
                    <th>Tue</th>
                    <th>Wed</th>
                    <th>Thu</th>
                    <th>Fri</th>
                    <th>Sat</th>
                    <th>Sun</th>
                  </tr>
                </thead>
                <tbody id="calendar-body">
                  {calendarRows.map((row, ri) => (
                    <tr key={ri}>
                      {row.map((cell) =>
                        cell.empty ? (
                          <td key={cell.key} className="empty" />
                        ) : (
                          <td
                            key={cell.key}
                            className={cell.className}
                            title={cell.fullDate}
                          >
                            {cell.day}
                          </td>
                        ),
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ── PAYSLIPS ── */}
        <section
          className={`content-section ${
            activeSection === "payslips" ? "active" : ""
          }`}
          id="payslips"
        >
          <Payslips />
        </section>

        {/* ── DAILY TASKS ── */}
        <section
          className={`content-section ${activeSection === "daily-tasks" ? "active" : ""}`}
          id="daily-tasks"
        >
          <div className="dt-wrapper">
            <div className="dt-page-header">
              <div className="dt-page-title">
                <div className="dt-title-icon">
                  <i className="fas fa-tasks" />
                </div>
                <div>
                  <h2>Daily Tasks</h2>
                  <p>Log your work and track progress</p>
                </div>
              </div>
              <div className="dt-stats-mini">
                <div className="dt-mini-stat">
                  <span className="dt-mini-val">{taskStats.total}</span>
                  <span className="dt-mini-label">Total</span>
                </div>
                <div className="dt-mini-stat approved">
                  <span className="dt-mini-val">{taskStats.approved}</span>
                  <span className="dt-mini-label">Approved</span>
                </div>
                <div className="dt-mini-stat pending">
                  <span className="dt-mini-val">{taskStats.pending}</span>
                  <span className="dt-mini-label">Pending</span>
                </div>
                <div className="dt-mini-stat rejected">
                  <span className="dt-mini-val">{taskStats.rejected}</span>
                  <span className="dt-mini-label">Rejected</span>
                </div>
              </div>
            </div>

            <div className="dt-grid">
              <div className="dt-form-col">
                <div className="dt-form-card">
                  <div className="dt-form-header">
                    <i className="fas fa-plus-circle" />
                    <span>Add New Task</span>
                  </div>
                  <form
                    id="dt-add-form"
                    onSubmit={async (e) => {
                      e.preventDefault();

                      const form = e.currentTarget;
                      const formData = new FormData(form);

                      try {
                        const response = await fetch(
                          `${API_BASE_URL}/add-task`,
                          {
                            method: "POST",
                            credentials: "include",
                            body: formData,
                          },
                        );

                        const data = await response.json();

                        if (data.success) {
                          window.location.hash = "daily-tasks";
                          window.location.reload();
                        } else {
                          alert(data.message || "Failed to add task");
                        }
                      } catch (error) {
                        console.error("Add task error:", error);
                        alert("Unable to add daily task");
                      }
                    }}
                  >
                    <div className="dt-field">
                      <label className="dt-label">
                        <i className="fas fa-folder" /> Project Name
                      </label>
                      <input
                        type="text"
                        name="project_name"
                        className="dt-input"
                        placeholder="Please enter project name"
                        required
                        autoComplete="off"
                        pattern="[A-Za-z ]+"
                        title="Only alphabets are allowed"
                        onInput={(e) => {
                          e.target.value = e.target.value.replace(
                            /[^A-Za-z ]/g,
                            "",
                          );
                        }}
                      />
                    </div>
                    <div className="dt-field">
                      <label className="dt-label">
                        <i className="fas fa-clipboard-list" /> Task Name
                      </label>
                      <input
                        type="text"
                        name="task_name"
                        className="dt-input"
                        placeholder="Please enter task name"
                        required
                        autoComplete="off"
                        pattern="[A-Za-z ]+"
                        title="Only alphabets are allowed"
                        onInput={(e) => {
                          e.target.value = e.target.value.replace(
                            /[^A-Za-z ]/g,
                            "",
                          );
                        }}
                      />
                    </div>
                    <div className="dt-field">
                      <label className="dt-label">
                        <i className="fas fa-calendar-alt" /> Time Period
                      </label>
                      <div className="dt-date-row">
                        <div className="dt-date-box">
                          <label className="dt-date-title">From Date</label>
                          <div className="dt-date-wrap">
                            <i className="fas fa-calendar-day dt-date-icon" />
                            <input
                              type="date"
                              name="from_date"
                              className="dt-date-input"
                              min={todayStr}
                              required
                            />
                          </div>
                        </div>
                        <div className="dt-date-box">
                          <label className="dt-date-title">To Date</label>
                          <div className="dt-date-wrap">
                            <i className="fas fa-calendar-check dt-date-icon" />
                            <input
                              type="date"
                              name="to_date"
                              className="dt-date-input"
                              required
                            />
                          </div>
                        </div>
                      </div>
                      <span className="dt-hint">
                        This will be used for attendance tracking if rejected
                      </span>
                    </div>
                    <button type="submit" className="dt-submit-btn">
                      <i className="fas fa-paper-plane" /> Submit Task
                    </button>
                  </form>
                </div>
                <div className="dt-info-card">
                  <i className="fas fa-info-circle" />
                  <div>
                    <strong>Note:</strong> If your task is rejected by admin,
                    the time period you mentioned will be marked as{" "}
                    <strong>Absent</strong> and you&apos;ll receive an email
                    notification.
                  </div>
                </div>
              </div>

              <div className="dt-history-col">
                <div className="dt-history-card">
                  <div className="dt-history-header">
                    <h5>
                      <i className="fas fa-history" /> Task History
                    </h5>
                    <div className="dt-filter-tabs">
                      {["all", "Pending", "Approved", "Rejected"].map((f) => (
                        <button
                          key={f}
                          type="button"
                          className={`dt-filter-btn ${taskFilter === f ? "active" : ""}`}
                          data-filter={f}
                          onClick={() => setTaskFilter(f)}
                        >
                          {f === "all" ? "All" : f}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="dt-task-list" id="dt-task-list">
                    {filteredTasks.length > 0 ? (
                      filteredTasks.map((task, idx) => (
                        <div
                          key={task.id || idx}
                          className="dt-task-item"
                          data-status={task.status}
                        >
                          <div className="dt-task-left">
                            <div
                              className={`dt-task-icon ${
                                task.status === "Approved"
                                  ? "dt-icon-approved"
                                  : task.status === "Rejected"
                                    ? "dt-icon-rejected"
                                    : "dt-icon-pending"
                              }`}
                            >
                              <i
                                className={`fas fa-${
                                  task.status === "Approved"
                                    ? "check"
                                    : task.status === "Rejected"
                                      ? "times"
                                      : "clock"
                                }`}
                              />
                            </div>
                            <div className="dt-task-info">
                              <div className="dt-task-name">
                                {task.task_name}
                              </div>
                              <div className="dt-task-project">
                                <i className="fas fa-folder-open" />{" "}
                                {task.project_name}
                              </div>
                            </div>
                          </div>
                          <div className="dt-task-right">
                            <div className="dt-task-meta">
                              <span className="dt-time-chip">
                                <i className="fas fa-hourglass-half" />{" "}
                                {task.time_period || "N/A"}
                              </span>
                              <span className="dt-task-date">
                                {task.created_at
                                  ? new Date(
                                      task.created_at,
                                    ).toLocaleDateString("en-GB", {
                                      day: "2-digit",
                                      month: "short",
                                      year: "numeric",
                                    })
                                  : ""}
                              </span>
                            </div>
                            <span
                              className={`dt-status-badge ${
                                task.status === "Approved"
                                  ? "dt-badge-approved"
                                  : task.status === "Rejected"
                                    ? "dt-badge-rejected"
                                    : "dt-badge-pending"
                              }`}
                            >
                              {task.status}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="dt-empty">
                        <div className="dt-empty-icon">
                          <i className="fas fa-clipboard" />
                        </div>
                        <p>No tasks submitted yet</p>
                        <span>Add your first task using the form</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── WEEKLY ROTA ── */}
        <section
          className={`content-section ${activeSection === "weekly-rota" ? "active" : ""}`}
          id="weekly-rota"
        >
          <div className="card">
            <h3>Weekly Rota</h3>
            {rotaImageBase64 ? (
              <img
                src={`data:image/jpeg;base64,${rotaImageBase64}`}
                alt="Weekly Rota"
                className="rota-image img-fluid"
              />
            ) : (
              <p className="text-muted">No weekly rota available.</p>
            )}
          </div>
        </section>

        {/* ── HOLIDAYS ── */}
        <section
          className={`content-section ${activeSection === "holidays" ? "active" : ""}`}
          id="holidays"
        >
          <div className="card">
            <h3>
              <i className="fas fa-calendar-alt me-2" />
              Holidays List
            </h3>
            {holidayTableHtml ? (
              <div
                className="holiday-table-wrapper"
                dangerouslySetInnerHTML={{ __html: holidayTableHtml }}
              />
            ) : (
              <div className="holiday-empty">
                <i className="fas fa-calendar-times" />
                <p>No holiday list has been uploaded yet.</p>
                <span>Check back later or contact HR.</span>
              </div>
            )}
          </div>
        </section>

        {/* ── POLICIES ── */}
        <section
          className={`content-section ${activeSection === "policies" ? "active" : ""}`}
          id="policies"
        >
          <div className="card">
            <h3>Company Policies</h3>
            <ul className="list-group list-group-flush">
              <li className="list-group-item">
                <strong>Attendance Policy:</strong> Employees must log in by 10
                AM.
              </li>
              <li className="list-group-item">
                <strong>Daily Standup:</strong> 10 AM - 10:30 AM
              </li>
              <li className="list-group-item">
                <strong>Daily Work Updates:</strong> Send updates via Zoho Mail.
              </li>
              <li className="list-group-item">
                <strong>Leave Policy:</strong> 15 days annual leave allowed.
              </li>
              <li className="list-group-item">
                <strong>Remote Work:</strong> Allowed with prior approval.
              </li>
            </ul>
            <div className="card mt-3 border-warning">
              <div className="card-body">
                <h5 className="card-title">Dress Code Policy</h5>
                <ul className="mb-0">
                  <li>
                    1. Business casual attire is expected in the office at all
                    times.
                  </li>
                  <li>
                    2. No Jeans, T-Shirts, Hoodies, or Shorts are allowed.
                  </li>
                  <li>
                    3. Shoes should be closed-toe in design and appropriate for
                    the office environment.
                  </li>
                  <li>4. No visible tattoos or piercings are allowed.</li>
                  <li>
                    5. English is the mandatory language of communication at our
                    office.
                  </li>
                </ul>
                <div className="alert alert-danger mt-3 mb-0">
                  <strong>
                    **Failure to comply may result in disciplinary action.**
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── MAILBOX ── */}
        <section
          className={`content-section ${activeSection === "mailbox" ? "active" : ""}`}
          id="mailbox"
        >
          <div className="card mailbox-card">
            <h3>
              <i className="fa-solid fa-envelope" /> My Mailbox
            </h3>
            <div className="mailbox-grid">
              <a
                href="https://mail.google.com/"
                target="_blank"
                rel="noreferrer"
                className="mail-item gmail"
                aria-label="Open Gmail"
              >
                <i className="fa-brands fa-google" />
                <span>Open Gmail</span>
              </a>
              <a
                href="https://mail.zoho.com/"
                target="_blank"
                rel="noreferrer"
                className="mail-item zoho"
                aria-label="Open Zoho Mail"
              >
                <i className="fa-solid fa-envelope-open-text" />
                <span>Open Zoho Mail</span>
              </a>
              <a
                href="https://meet.google.com/"
                target="_blank"
                rel="noreferrer"
                className="mail-item meet"
                aria-label="Open Google Meet"
              >
                <i className="fa-solid fa-video" />
                <span>Google Meet</span>
              </a>
            </div>
          </div>
        </section>

        {/* ── LEAVES ── */}
        <section
          className={`content-section ${activeSection === "leaves" ? "active" : ""}`}
          id="leaves"
        >
          <div className="leave-hero">
            <div className="leave-stat-card comp">
              <div className="leave-stat-icon">
                <i className="fas fa-umbrella-beach" />
              </div>
              <div className="leave-stat-body">
                <span className="leave-stat-label">Compensation Leaves</span>
                <span className="leave-stat-value">{compensationLeaves}</span>
              </div>
              <div className="leave-stat-ring" />
            </div>
            <div className="leave-stat-card avail">
              <div className="leave-stat-icon">
                <i className="fas fa-wallet" />
              </div>
              <div className="leave-stat-body">
                <span className="leave-stat-label">Available Paid Leaves</span>
                <span className="leave-stat-value">{paidLeaveBalance}</span>
              </div>
              <div className="leave-stat-ring" />
            </div>
            <div
              className="leave-stat-card used"
              onClick={openLeaveHistoryModal}
              title="View full history"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && openLeaveHistoryModal()}
            >
              <div className="leave-stat-icon">
                <i className="fas fa-chart-line" />
              </div>
              <div className="leave-stat-body">
                <span className="leave-stat-label">Total Used Leaves</span>
                <span className="leave-stat-value">{usedLeavesCount}</span>
              </div>
              <div className="leave-stat-ring" />
              <span className="leave-stat-cta">
                <i className="fas fa-eye" /> View History
              </span>
            </div>
          </div>

          <div className="leave-panel">
            <div className="leave-panel-header">
              <div className="leave-panel-title">
                <i className="fas fa-umbrella-beach" />
                <span>Leave Management</span>
              </div>
              <span className="leave-cycle-badge">
                April – March Cycle &nbsp;·&nbsp; 1 Paid Leave / Month
              </span>
            </div>
            <div className="leave-panel-body">
              <div className="leave-apply-col">
                <div className="leave-form-box">
                  <h5 className="leave-form-title">
                    <i className="fas fa-paper-plane" /> Apply for Leave
                  </h5>
                  <div className="leave-info-bar">
                    <i className="fas fa-info-circle" />
                    <span>
                      Paid: <strong>{paidLeaveBalance}</strong> &nbsp;|&nbsp;
                      Comp: <strong>{compensationLeaves}</strong>
                    </span>
                  </div>
                  <div className="leave-warn-bar">
                    <i className="fas fa-exclamation-triangle" />
                    <span>
                      Max <strong>1 paid leave / month</strong>. Extra days are
                      unpaid.
                    </span>
                  </div>
                  <form
                    id="leave-form"
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSubmitLeave();
                    }}
                  >
                    <div className="lf-group">
                      <label className="lf-label">Leave Type</label>
                      <div className="lf-select-wrap">
                        <select
                          className="lf-select"
                          id="leave-type"
                          required
                          value={leaveType}
                          onChange={(e) => setLeaveType(e.target.value)}
                        >
                          <option value="">Select Type</option>
                          <option value="Paid Leave">Paid Leave</option>
                          <option value="Sick Leave">Sick Leave</option>
                          <option value="Emergency Leave">
                            Emergency Leave
                          </option>
                        </select>
                        <i className="fas fa-chevron-down lf-select-icon" />
                      </div>
                    </div>
                    <div className="lf-row">
                      <div className="lf-group">
                        <label className="lf-label">From Date</label>
                        <div className="lf-date-wrap" id="fromDateWrap">
                          <i className="fas fa-calendar-day lf-date-icon" />
                          <input
                            type="date"
                            className="lf-date-input"
                            id="leave-start"
                            required
                            min={todayStr}
                            value={leaveStart}
                            onChange={(e) => setLeaveStart(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="lf-group">
                        <label className="lf-label">To Date</label>
                        <div className="lf-date-wrap" id="toDateWrap">
                          <i className="fas fa-calendar-check lf-date-icon" />
                          <input
                            type="date"
                            className="lf-date-input"
                            id="leave-end"
                            required
                            min={todayStr}
                            value={leaveEnd}
                            onChange={(e) => setLeaveEnd(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="lf-group">
                      <label className="lf-label">Reason</label>
                      <textarea
                        className="lf-textarea"
                        id="leave-reason"
                        rows={3}
                        placeholder="Briefly describe your reason..."
                        required
                        value={leaveReason}
                        onChange={(e) =>
                          setLeaveReason(
                            e.target.value.replace(/[^A-Za-z .,]/g, ""),
                          )
                        }
                      />
                    </div>
                    <button
                      type="button"
                      id="submit-leave-btn"
                      className="lf-submit-btn"
                      disabled={leaveSubmitting}
                      onClick={handleSubmitLeave}
                    >
                      {leaveSubmitting && (
                        <span
                          className="spinner-border spinner-border-sm"
                          role="status"
                        />
                      )}
                      <i className="fas fa-paper-plane" /> Submit Leave Request
                    </button>
                  </form>
                </div>
              </div>

              <div className="leave-history-col">
                <div className="leave-history-header">
                  <h5 className="leave-history-title">Recent Leave History</h5>
                </div>
                <div className="leave-list">
                  {userLeaves && userLeaves.length > 0 ? (
                    <>
                      {userLeaves.slice(0, 5).map((leave, i) => (
                        <div className="leave-item" key={leave.id || i}>
                          <div className="leave-item-type">
                            <span
                              className={`leave-type-dot ${
                                leave.leave_type === "Paid Leave"
                                  ? "dot-paid"
                                  : leave.leave_type === "Sick Leave"
                                    ? "dot-sick"
                                    : "dot-emergency"
                              }`}
                            />
                            <strong>{leave.leave_type}</strong>
                          </div>
                          <div className="leave-item-dates">
                            <span>
                              <i className="fas fa-calendar-day" />{" "}
                              {leave.start_date}
                            </span>
                            <span className="date-arrow">→</span>
                            <span>{leave.end_date}</span>
                          </div>
                          <div className="leave-item-meta">
                            <span className="meta-chip chip-days">
                              <i className="fas fa-sun" /> {leave.total_days}d
                            </span>
                            <span className="meta-chip chip-holiday">
                              H:{leave.holiday_days || 0}
                            </span>
                            <span className="meta-chip chip-paid">
                              P:{leave.used_paid_days}
                            </span>
                            <span className="meta-chip chip-comp">
                              C:{leave.used_comp_days}
                            </span>
                            <span className="meta-chip chip-unpaid">
                              U:{leave.used_unpaid_days}
                            </span>
                            <span
                              className={`leave-status-badge ${
                                leave.status === "Approved"
                                  ? "badge-approved"
                                  : leave.status === "Rejected"
                                    ? "badge-rejected"
                                    : "badge-pending"
                              }`}
                            >
                              <i
                                className={`fas fa-${
                                  leave.status === "Approved"
                                    ? "check-circle"
                                    : leave.status === "Rejected"
                                      ? "times-circle"
                                      : "clock"
                                }`}
                              />{" "}
                              {leave.status}
                            </span>
                          </div>
                        </div>
                      ))}
                      {userLeaves.length > 5 && (
                        <button
                          type="button"
                          className="leave-more-btn"
                          onClick={openLeaveHistoryModal}
                        >
                          <i className="fas fa-chevron-down" />
                          {userLeaves.length - 5} more records — click Total
                          Used Leaves to view all
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="leave-empty">
                      <div className="leave-empty-icon">
                        <i className="fas fa-umbrella-beach" />
                      </div>
                      <p>No leave history yet</p>
                      <span>Your submitted leaves will appear here</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── LEAVE HISTORY MODAL ── */}
        {leaveModalOpen && (
          <div
            className="modal fade show"
            id="leaveHistoryModal"
            tabIndex={-1}
            style={{ display: "block", background: "rgba(0,0,0,0.5)" }}
            onClick={(e) => {
              if (e.target.id === "leaveHistoryModal") setLeaveModalOpen(false);
            }}
          >
            <div className="modal-dialog modal-xl modal-dialog-scrollable">
              <div className="modal-content lhm-content">
                <div className="modal-header lhm-header">
                  <div className="lhm-title">
                    <i className="fas fa-chart-bar" />
                    <span>Leave History & Analytics</span>
                  </div>
                  <div className="lhm-header-actions">
                    <button
                      type="button"
                      className="lhm-export-btn"
                      id="exportLeaveBtn"
                      onClick={exportLeaveHistory}
                      title="Download as Excel/CSV"
                    >
                      <i className="fas fa-download" /> Export
                    </button>
                    <button
                      type="button"
                      className="lhm-close"
                      onClick={() => setLeaveModalOpen(false)}
                    >
                      <i className="fas fa-times" />
                    </button>
                  </div>
                </div>
                <div className="modal-body lhm-body">
                  {historyLoading && (
                    <div id="historyLoading" className="lhm-loading">
                      <div className="lhm-spinner" />
                      <p>Loading your leave history…</p>
                    </div>
                  )}
                  {historyError && (
                    <div id="historyError" className="lhm-error">
                      <i className="fas fa-exclamation-circle" />
                      <p>Failed to load leave history. Please try again.</p>
                    </div>
                  )}
                  {!historyLoading && !historyError && (
                    <div id="historyContent">
                      <div className="lhm-pills" id="summaryPills">
                        {(() => {
                          const approved = allLeavesData.filter(
                            (l) => l.status === "Approved",
                          );
                          const pending = allLeavesData.filter(
                            (l) => l.status === "Pending",
                          );
                          const rejected = allLeavesData.filter(
                            (l) => l.status === "Rejected",
                          );
                          const totalUsed = approved.reduce(
                            (s, l) => s + (l.total_days || 0),
                            0,
                          );
                          const pills = [
                            {
                              label: "Total Requests",
                              val: allLeavesData.length,
                              color: "#3b82f6",
                            },
                            {
                              label: "Approved",
                              val: approved.length,
                              color: "#10b981",
                            },
                            {
                              label: "Pending",
                              val: pending.length,
                              color: "#f59e0b",
                            },
                            {
                              label: "Rejected",
                              val: rejected.length,
                              color: "#ef4444",
                            },
                            {
                              label: "Days Used",
                              val: `${totalUsed} days`,
                              color: "#6366f1",
                            },
                          ];
                          return pills.map((p) => (
                            <div
                              key={p.label}
                              style={{
                                background: `${p.color}18`,
                                border: `1.5px solid ${p.color}45`,
                                borderRadius: 20,
                                padding: "5px 16px",
                                fontSize: ".83rem",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                              }}
                            >
                              <span style={{ color: p.color, fontWeight: 700 }}>
                                {p.val}
                              </span>
                              <span style={{ color: "#555" }}>{p.label}</span>
                            </div>
                          ));
                        })()}
                      </div>
                      <div className="lhm-charts">
                        <div className="lhm-chart-card">
                          <h6>
                            <i className="fas fa-chart-pie" /> Status Breakdown
                          </h6>
                          <canvas
                            ref={pieCanvasRef}
                            id="statusPieChart"
                            style={{ maxHeight: 220 }}
                          />
                        </div>
                        <div className="lhm-chart-card">
                          <h6>
                            <i className="fas fa-chart-bar" /> Days Used by
                            Month
                          </h6>
                          <canvas
                            ref={barCanvasRef}
                            id="monthlyBarChart"
                            style={{ maxHeight: 220 }}
                          />
                        </div>
                      </div>
                      <div className="lhm-table-wrap">
                        <table className="lhm-table" id="leaveHistoryTable">
                          <thead>
                            <tr>
                              <th>#</th>
                              <th>Type</th>
                              <th>From</th>
                              <th>To</th>
                              <th>Days</th>
                              <th>Holidays</th>
                              <th>Paid</th>
                              <th>Comp</th>
                              <th>Unpaid</th>
                              <th>Reason</th>
                              <th>Applied On</th>
                              <th>Remarks</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody id="fullHistoryBody">
                            {allLeavesData.length === 0 ? (
                              <tr>
                                <td
                                  colSpan={12}
                                  style={{
                                    textAlign: "center",
                                    padding: 40,
                                    color: "#9ca3af",
                                  }}
                                >
                                  No leave history found.
                                </td>
                              </tr>
                            ) : (
                              allLeavesData.map((l, i) => {
                                const sc =
                                  l.status === "Approved"
                                    ? "background:#d1fae5;color:#065f46;"
                                    : l.status === "Rejected"
                                      ? "background:#fee2e2;color:#991b1b;"
                                      : "background:#fef3c7;color:#92400e;";
                                const ic =
                                  l.status === "Approved"
                                    ? "check-circle"
                                    : l.status === "Rejected"
                                      ? "times-circle"
                                      : "clock";
                                return (
                                  <tr key={l.id || i}>
                                    <td style={{ color: "#9ca3af" }}>
                                      {i + 1}
                                    </td>
                                    <td>
                                      <strong>{l.leave_type}</strong>
                                    </td>
                                    <td>{l.start_date}</td>
                                    <td>{l.end_date}</td>
                                    <td>
                                      <strong>{l.total_days}</strong>
                                    </td>
                                    <td>
                                      <span
                                        style={{
                                          background: "#fef3c7",
                                          color: "#92400e",
                                          padding: "3px 8px",
                                          borderRadius: 6,
                                          fontSize: ".8rem",
                                          fontWeight: 600,
                                        }}
                                      >
                                        {l.holiday_days || 0}
                                      </span>
                                    </td>
                                    <td>
                                      <span
                                        style={{
                                          background: "#d1fae5",
                                          color: "#065f46",
                                          padding: "3px 8px",
                                          borderRadius: 6,
                                          fontSize: ".8rem",
                                          fontWeight: 600,
                                        }}
                                      >
                                        {l.used_paid_days || 0}
                                      </span>
                                    </td>
                                    <td>
                                      <span
                                        style={{
                                          background: "#e0e7ff",
                                          color: "#3730a3",
                                          padding: "3px 8px",
                                          borderRadius: 6,
                                          fontSize: ".8rem",
                                          fontWeight: 600,
                                        }}
                                      >
                                        {l.used_comp_days || 0}
                                      </span>
                                    </td>
                                    <td>
                                      <span
                                        style={{
                                          background: "#fee2e2",
                                          color: "#991b1b",
                                          padding: "3px 8px",
                                          borderRadius: 6,
                                          fontSize: ".8rem",
                                          fontWeight: 600,
                                        }}
                                      >
                                        {l.used_unpaid_days || 0}
                                      </span>
                                    </td>
                                    <td
                                      style={{
                                        maxWidth: 180,
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                      }}
                                      title={l.reason || "No reason provided"}
                                    >
                                      {l.reason || "—"}
                                    </td>

                                    <td
                                      style={{
                                        color: "#9ca3af",
                                        fontSize: ".8rem",
                                      }}
                                    >
                                      {l.created_at}
                                    </td>

                                    <td
                                      style={{
                                        maxWidth: 220,
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        color: l.remarks
                                          ? "#374151"
                                          : "#9ca3af",
                                        fontSize: ".85rem",
                                      }}
                                      title={l.remarks || "No admin remarks"}
                                    >
                                      {l.remarks || "—"}
                                    </td>
                                    
                                    <td className="lhm-status-cell">
                                      <span
                                        style={{
                                          ...Object.fromEntries(
                                            sc
                                              .split(";")
                                              .filter(Boolean)
                                              .map((s) => {
                                                const [k, v] = s.split(":");
                                                return [k.trim(), v.trim()];
                                              }),
                                          ),
                                          padding: "4px 12px",
                                          borderRadius: 20,
                                          fontSize: ".78rem",
                                          fontWeight: 700,
                                          display: "inline-flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          gap: 5,
                                        }}
                                      >
                                        <i className={`fas fa-${ic}`} />
                                        {l.status}
                                      </span>

                                      {/* APPROVED / REJECTED DATE */}
                                      {l.status !== "Pending" &&
                                        l.updated_at && (
                                          <div className="lhm-status-date">
                                            {new Date(
                                              l.updated_at,
                                            ).toLocaleDateString("en-GB", {
                                              day: "2-digit",
                                              month: "short",
                                              year: "numeric",
                                            })}
                                          </div>
                                        )}
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── NOTIFICATIONS ── */}
        <section
          className={`content-section ${activeSection === "notifications" ? "active" : ""}`}
          id="notifications"
        >
          <div className="card">
            <h3>Notifications</h3>
            {notifications && notifications.length > 0 ? (
              <ul className="list-group list-group-flush">
                {notifications.map((n, i) => (
                  <li className="list-group-item" key={n.id || i}>
                    {n.message}
                    <small className="text-muted float-end">
                      {formatDate(n.created_at)}
                    </small>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted p-3">No notifications available.</p>
            )}
          </div>
        </section>
      </main>

      {/* Admin popup */}
      {adminPopupVisible && (
        <div
          id="adminPopup"
          className="admin-popup-overlay"
          style={{ display: "flex" }}
        >
          <div className="admin-popup-box">
            <h4 className="admin-popup-title">You are an Admin</h4>
            <p className="admin-popup-text">Select your dashboard:</p>
            <button
              type="button"
              onClick={() => {
                window.location.href = "/admin/admin";
              }}
              className="admin-btn admin-btn-red"
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => setAdminPopupVisible(false)}
              className="admin-btn admin-btn-green"
            >
              User
            </button>
          </div>
        </div>
      )}

      {/* Profile image modal */}
      {profileModalOpen && (
        <div
          id="profileModal"
          className="profile-modal"
          style={{ display: "block" }}
          onClick={(e) => {
            if (e.target.id === "profileModal") setProfileModalOpen(false);
          }}
        >
          <span
            className="profile-close"
            onClick={() => setProfileModalOpen(false)}
          >
            &times;
          </span>
          <img
            className="profile-modal-content"
            id="profileModalImg"
            src={profileModalSrc}
            alt="Profile"
          />
        </div>
      )}
    </div>
  );
}
