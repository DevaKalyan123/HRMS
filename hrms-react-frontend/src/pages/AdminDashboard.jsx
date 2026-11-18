import { useEffect, useState } from "react";

import AdminSidebar from "../components/admin/AdminSidebar";
import AdminHeader from "../components/admin/AdminHeader";
import EventCalendar from "../components/admin/EventCalendar";


import AttendanceModule from "../components/admin/AttendanceModule";
import TasksModule from "../components/admin/TasksModule";
import UsersModule from "../components/admin/UsersModule";
import RotaModule from "../components/admin/RotaModule";
import HolidayModule from "../components/admin/HolidayModule";
import LeavesModule from "../components/admin/LeavesModule";
import NotificationsModule from "../components/admin/NotificationsModule";

import Export from "../components/admin/Export";
import ViewExcel from "../components/admin/ViewExcel";

import { getAdminDashboard } from "../services/adminService";
import EventManagement from "../components/admin/EventManagement";

import "../styles/admin/admin-layout.css";
import "../styles/admin/admin-sidebar.css";
import "../styles/admin/admin-header.css";
import "../styles/admin/attendance.css";
import "../styles/admin/tasks.css";
import "../styles/admin/users.css";
import "../styles/admin/rota.css";
import "../styles/admin/holiday.css";
import "../styles/admin/leaves.css";
import "../styles/admin/notifications.css";
import "../styles/admin/modals.css";
import "../styles/admin/responsive.css";
import "../styles/admin/event-management.css";
import "../styles/admin/event-calendar.css";
function AdminDashboard() {
  // ============================================================
  // ACTIVE SECTION
  // ============================================================

  const [activeSection, setActiveSection] = useState("attendance");

  // ============================================================
  // MOBILE SIDEBAR
  // ============================================================

  const [showSidebar, setShowSidebar] = useState(false);

  // ============================================================
  // ADMIN PROFILE
  // ============================================================

  const [adminProfile, setAdminProfile] = useState(null);

  // ============================================================
  // DASHBOARD DATA
  // ============================================================

  const [attendance, setAttendance] = useState([]);

  const [allAttendance, setAllAttendance] = useState([]);

  const [tasks, setTasks] = useState([]);

  const [users, setUsers] = useState([]);

  const [leaves, setLeaves] = useState([]);

  const [notifications, setNotifications] = useState([]);

  const [rotaImage, setRotaImage] = useState("");
  const [rotaFilename, setRotaFilename] = useState("");
  const [rotaMimeType, setRotaMimeType] = useState("");

  const [holidayTable, setHolidayTable] = useState("");

  // ============================================================
  // LOAD ADMIN DASHBOARD
  // ============================================================

  useEffect(() => {
    let cancelled = false;

    const loadAdminDashboard = async () => {
      try {
        console.log("Loading admin dashboard...");

        const data = await getAdminDashboard();

        console.log("Admin dashboard response:", data);

        if (!data?.success) {
          throw new Error(data?.message || "Failed to load admin dashboard");
        }

        if (cancelled) {
          return;
        }

        // ======================================================
        // ADMIN PROFILE
        // ======================================================

        setAdminProfile(data.adminProfile || null);

        // ======================================================
        // ATTENDANCE
        // ======================================================

        setAttendance(data.attendance || []);

        // ======================================================
        // ALL ATTENDANCE
        // ======================================================

        setAllAttendance(data.allAttendance || data.attendance || []);

        // ======================================================
        // TASKS
        // ======================================================

        setTasks(data.tasks || []);

        // ======================================================
        // USERS
        // ======================================================

        setUsers(data.users || []);

        // ======================================================
        // LEAVES
        // ======================================================

        setLeaves(data.leaves || []);

        // ======================================================
        // NOTIFICATIONS
        // ======================================================

        setNotifications(data.notifications || []);

        // ======================================================
        // ROTA
        // ======================================================

        setRotaImage(data.rotaImage || "");
        setRotaFilename(data.rotaFilename || "");
        setRotaMimeType(data.rotaMimeType || "");

        // ======================================================
        // HOLIDAY
        // ======================================================

        setHolidayTable(data.holidayTable || "");

        console.log("Admin dashboard data loaded successfully.");
      } catch (err) {
        if (cancelled) {
          return;
        }

        console.error("Admin dashboard loading error:", err);
      }
    };

    loadAdminDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  // ============================================================
  // SECTION CHANGE
  // ============================================================

  const handleSectionChange = (section) => {
    console.log("Admin section:", section);

    setActiveSection(section);

    // Close sidebar on mobile
    setShowSidebar(false);
  };

  // ============================================================
  // MAIN DASHBOARD
  // ============================================================

  return (
    <div className="admin-layout">
      {/* ======================================================
          SIDEBAR
      ======================================================= */}

      <AdminSidebar
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
        showSidebar={showSidebar}
        setShowSidebar={setShowSidebar}
        adminProfile={adminProfile}
      />

      {/* ======================================================
          MAIN CONTENT
      ======================================================= */}

      <main className="main-content">
        {/* ====================================================
            HEADER
        ===================================================== */}

        <AdminHeader onMenuClick={() => setShowSidebar(true)} />

        {/* ====================================================
            ATTENDANCE
        ===================================================== */}

        {activeSection === "attendance" && (
          <AttendanceModule attendance={attendance} />
        )}
        {/* ====================================================
    EVENT CALENDAR
===================================================== */}

{activeSection === "event-calendar" && <EventCalendar />}

{/* ====================================================
    EVENT MANAGEMENT
===================================================== */}

{activeSection === "events" && <EventManagement />}
        {/* ====================================================
            TASKS
        ===================================================== */}

       {activeSection === "tasks" && (
  <TasksModule tasks={tasks} users={users} />
)}

        {/* ====================================================
            USERS
        ===================================================== */}

        {activeSection === "users" && <UsersModule users={users} />}

        {/* ====================================================
            ROTA
        ===================================================== */}

        {activeSection === "rota" && (
          <RotaModule
            rotaImage={rotaImage}
            rotaFilename={rotaFilename}
            rotaMimeType={rotaMimeType}
          />
        )}

        {/* ====================================================
            HOLIDAY
        ===================================================== */}

        {activeSection === "holiday" && (
          <HolidayModule holidayTable={holidayTable} />
        )}

        {/* ====================================================
            LEAVES
        ===================================================== */}

        {activeSection === "manage-leaves" && <LeavesModule leaves={leaves} />}

        {/* ====================================================
            NOTIFICATIONS
        ===================================================== */}

        {activeSection === "notifications" && (
          <NotificationsModule notifications={notifications} />
        )}

        {/* ====================================================
            EXPORT
        ===================================================== */}

        {activeSection === "export" && (
          <Export onSectionChange={handleSectionChange} />
        )}

        {/* ====================================================
            VIEW EXCEL
        ===================================================== */}

        {activeSection === "view-excel" && (
          <ViewExcel
            attendance={allAttendance}
            onSectionChange={handleSectionChange}
          />
        )}
      </main>
    </div>
  );
}

export default AdminDashboard;
