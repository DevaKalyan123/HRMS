import {
  updateAdminProfile,
  updateAttendanceStatus,
  updateUser,
  deleteUser,
  uploadRota,
  uploadHoliday,
  sendNotification,
  updateLeaveStatus,
  getExportPageUrl,
  getAdminDashboard,
  approveTask,
  rejectTask,
} from "../services/adminService";

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

import "../styles/admin.css";

function AdminDashboard() {
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState("attendance");

  const [searchQuery, setSearchQuery] = useState("");

  const [attendanceView, setAttendanceView] = useState("daily");

  const [taskSearch, setTaskSearch] = useState("");

  const [projectFilter, setProjectFilter] = useState("all");

  const [leaveStatus, setLeaveStatus] = useState("all");

  const [leaveType, setLeaveType] = useState("all");

  const [leaveSearch, setLeaveSearch] = useState("");

  const [showSidebar, setShowSidebar] = useState(false);

  const [showEditUser, setShowEditUser] = useState(false);

  const [showConfirm, setShowConfirm] = useState(false);

  const [notificationMessage, setNotificationMessage] = useState("");

  const [selectedLeave, setSelectedLeave] = useState(null);

  const [selectedUser, setSelectedUser] = useState(null);

  const [editUsername, setEditUsername] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPosition, setEditPosition] = useState("");
  const [editFaceImage, setEditFaceImage] = useState(null);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminFaceImage, setAdminFaceImage] = useState(null);

  /*
   * These will eventually come from your Flask API.
   * We are keeping the structure ready for that.
   */

  const [adminProfile, setAdminProfile] = useState({
    username: "Admin",
    email: "admin@example.com",
    face_image_base64: null,
  });

  const [attendance, setAttendance] = useState([]);

  const [allAttendance, setAllAttendance] = useState([]);

  const [users, setUsers] = useState([]);

  const [tasks, setTasks] = useState([]);

  const [leaves, setLeaves] = useState([]);

  const [notifications, setNotifications] = useState([]);

  const [rotaImage, setRotaImage] = useState("");

  const [holidayTable, setHolidayTable] = useState("");

  /* ============================================================
   LOAD ADMIN DASHBOARD DATA
   ============================================================ */

  useEffect(() => {
    let cancelled = false;

    async function loadAdminDashboard() {
      try {
        console.log("Loading admin dashboard data...");

        const data = await getAdminDashboard();

        console.log("Admin dashboard API response:", data);

        if (!data.success) {
          throw new Error(data.message || "Failed to load admin dashboard");
        }

        if (cancelled) return;

        setAdminProfile(
          data.adminProfile || {
            username: "Admin",
            email: "admin@example.com",
            face_image_base64: null,
          },
        );

        setUsers(data.users || []);

        setAttendance(data.attendance || []);

        setAllAttendance(data.allAttendance || data.attendance || []);

        setTasks(data.tasks || []);

        setLeaves(data.leaves || []);

        setNotifications(data.notifications || []);

        setRotaImage(data.rotaImage || "");

        setHolidayTable(data.holidayTable || "");

        console.log("Admin dashboard data loaded successfully");
      } catch (error) {
        console.error("Admin dashboard loading error:", error);
      }
    }

    loadAdminDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  /*
   * Sidebar navigation
   */

  const handleSectionChange = (section) => {
    setActiveSection(section);
    setShowSidebar(false);
  };

  /*
   * Attendance filtering
   */

  const filteredAttendance = useMemo(() => {
    if (!searchQuery.trim()) {
      return attendance;
    }

    const query = searchQuery.toLowerCase();

    return attendance.filter((record) =>
      String(record.username || "")
        .toLowerCase()
        .includes(query),
    );
  }, [attendance, searchQuery]);

  /*
   * Task filtering
   */

  const projectOptions = useMemo(() => {
    return [...new Set(tasks.map((task) => task.project_name).filter(Boolean))];
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    const search = taskSearch.toLowerCase().trim();

    return tasks.filter((task) => {
      const matchesSearch =
        !search ||
        String(task.employee_name || "")
          .toLowerCase()
          .includes(search) ||
        String(task.project_name || "")
          .toLowerCase()
          .includes(search) ||
        String(task.task_name || "")
          .toLowerCase()
          .includes(search);

      const matchesProject =
        projectFilter === "all" || task.project_name === projectFilter;

      return matchesSearch && matchesProject;
    });
  }, [tasks, taskSearch, projectFilter]);

  /*
   * Task statistics
   */

  const taskStats = {
    total: tasks.length,

    approved: tasks.filter((task) => task.status === "Approved").length,

    pending: tasks.filter((task) => task.status === "Pending").length,

    rejected: tasks.filter((task) => task.status === "Rejected").length,
  };

  /*
   * Leave filtering
   */

  const filteredLeaves = useMemo(() => {
    const search = leaveSearch.toLowerCase().trim();

    return leaves.filter((leave) => {
      const matchesStatus =
        leaveStatus === "all" || leave.status === leaveStatus;

      const matchesType = leaveType === "all" || leave.leave_type === leaveType;

      const matchesSearch =
        !search ||
        String(leave.username || "")
          .toLowerCase()
          .includes(search) ||
        String(leave.email || "")
          .toLowerCase()
          .includes(search);

      return matchesStatus && matchesType && matchesSearch;
    });
  }, [leaves, leaveStatus, leaveType, leaveSearch]);

  /*
   * Leave statistics
   */

  const leaveStats = {
    total: leaves.length,

    pending: leaves.filter((leave) => leave.status === "Pending").length,

    approved: leaves.filter((leave) => leave.status === "Approved").length,

    rejected: leaves.filter((leave) => leave.status === "Rejected").length,
  };

  /*
   * Logout
   *
   * Keep your existing Flask logout route.
   */

  const handleLogout = () => {
    window.location.href = "/logout";
  };

  /*
   * New user
   */

const handleNewUser = () => {
  navigate("/register");
};
  /*
   * Edit user
   */

  const handleEditUser = (user) => {
    setSelectedUser(user);

    setEditUsername(user.username || "");
    setEditEmail(user.email || "");
    setEditPosition(user.position || "");
    setEditFaceImage(null);

    setShowEditUser(true);
  };
  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    if (!editUsername.trim()) {
      alert("Username is required.");
      return;
    }

    if (!editEmail.trim()) {
      alert("Email is required.");
      return;
    }

    if (!editPosition.trim()) {
      alert("Position is required.");
      return;
    }

    try {
      const result = await updateUser(
        selectedUser.id,
        editUsername.trim(),
        editEmail.trim(),
        editPosition.trim(),
        editFaceImage,
      );

      if (!result.success) {
        throw new Error(result.message || "Failed to update user.");
      }

      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === selectedUser.id
            ? {
                ...user,
                username: editUsername.trim(),
                email: editEmail.trim(),
                position: editPosition.trim(),
                ...(result.user || {}),
              }
            : user,
        ),
      );

      setShowEditUser(false);
      setSelectedUser(null);
      setEditFaceImage(null);

      alert("User updated successfully.");
    } catch (error) {
      console.error("Update user error:", error);
      alert(error.message || "Failed to update user.");
    }
  };

  const handleUpdateAdminProfile = async () => {
    if (!adminEmail.trim()) {
      alert("Email is required.");
      return;
    }

    try {
      const result = await updateAdminProfile(
        adminEmail.trim(),
        adminFaceImage,
      );

      if (!result.success) {
        throw new Error(result.message || "Failed to update admin profile.");
      }

      setAdminProfile((prev) => ({
        ...prev,
        email: adminEmail.trim(),
        ...(result.adminProfile || {}),
        ...(result.user || {}),
      }));

      setShowEditProfile(false);
      setAdminFaceImage(null);

      alert("Admin profile updated successfully!");
    } catch (error) {
      console.error("Admin profile update error:", error);

      alert(error.message || "Failed to update admin profile.");
    }
  };
  /*
   * Delete user
   *
   * Backend endpoint needs to be connected
   * to your existing admin.js API.
   */

  const handleDeleteUser = async (user) => {
    const confirmed = window.confirm(`Delete ${user.username}?`);

    if (!confirmed) {
      return;
    }

    try {
      const result = await deleteUser(user.id);

      if (!result.success) {
        throw new Error(result.message || "Failed to delete user");
      }

      setUsers((prevUsers) => prevUsers.filter((item) => item.id !== user.id));

      alert("User deleted successfully.");
    } catch (error) {
      console.error("Delete user error:", error);

      alert(error.message || "Failed to delete user.");
    }
  };
  /*
   * Approve task
   */

  const handleApproveTask = async (task) => {
    const confirmed = window.confirm("Approve this task?");

    if (!confirmed) {
      return;
    }

    try {
      await approveTask(task.id);

      setTasks((prevTasks) =>
        prevTasks.map((item) =>
          item.id === task.id
            ? {
                ...item,
                status: "Approved",
              }
            : item,
        ),
      );

      alert("Task approved successfully.");
    } catch (error) {
      console.error("Approve task error:", error);

      alert(error.message || "Failed to approve task.");
    }
  };
  /*
   * Reject task
   */

  const handleRejectTask = async (task) => {
    const confirmed = window.confirm(
      "Reject this task? The employee will be marked Absent and an email will be sent.",
    );

    if (!confirmed) {
      return;
    }

    try {
      await rejectTask(task.id);

      setTasks((prevTasks) =>
        prevTasks.map((item) =>
          item.id === task.id
            ? {
                ...item,
                status: "Rejected",
              }
            : item,
        ),
      );

      alert("Task rejected successfully.");
    } catch (error) {
      console.error("Reject task error:", error);

      alert(error.message || "Failed to reject task.");
    }
  };
  /*
   * Leave action
   */

  const openLeaveConfirmation = (leave, status) => {
    setSelectedLeave({
      ...leave,
      newStatus: status,
    });

    setShowConfirm(true);
  };

  const closeConfirm = () => {
    setShowConfirm(false);
    setSelectedLeave(null);
  };

  const confirmLeaveAction = async () => {
    if (!selectedLeave) {
      return;
    }

    try {
      const result = await updateLeaveStatus(
        selectedLeave.id,
        selectedLeave.newStatus,
        selectedLeave.remarks || "",
      );

      if (!result.success) {
        throw new Error(result.message || "Failed to update leave status");
      }

      setLeaves((prevLeaves) =>
        prevLeaves.map((leave) =>
          leave.id === selectedLeave.id
            ? {
                ...leave,
                status: selectedLeave.newStatus,
                remarks: selectedLeave.remarks || "",
              }
            : leave,
        ),
      );

      closeConfirm();

      alert(`Leave ${selectedLeave.newStatus.toLowerCase()} successfully.`);
    } catch (error) {
      console.error("Leave update error:", error);

      alert(error.message || "Failed to update leave.");
    }
  };
  /*
   * Profile image
   */

  const profileImage = adminProfile.face_image_base64
    ? `data:image/jpeg;base64,${adminProfile.face_image_base64}`
    : "/default_profile.jpg";

  /*
   * Attendance status change
   */

  const handleAttendanceStatusChange = async (record, status) => {
    try {
      const attendanceId = record.attendance_id || record.id;

      if (!attendanceId) {
        alert("Attendance ID not found.");
        return;
      }

      const result = await updateAttendanceStatus(attendanceId, status);

      if (!result.success) {
        throw new Error(result.message || "Failed to update attendance status");
      }

      setAttendance((prevAttendance) =>
        prevAttendance.map((item) =>
          (item.attendance_id || item.id) === attendanceId
            ? {
                ...item,
                attendance_status: status,
              }
            : item,
        ),
      );

      setAllAttendance((prevAttendance) =>
        prevAttendance.map((item) =>
          (item.attendance_id || item.id) === attendanceId
            ? {
                ...item,
                attendance_status: status,
              }
            : item,
        ),
      );

      alert("Attendance status updated successfully.");
    } catch (error) {
      console.error("Attendance status update error:", error);

      alert(error.message || "Failed to update attendance status.");
    }
  };
  /*
   * Upload rota
   */

  const handleRotaUpload = async (event) => {
    event.preventDefault();

    const file = event.currentTarget.elements.rotaImage.files[0];

    if (!file) {
      alert("Please select a rota image.");
      return;
    }

    try {
      const result = await uploadRota(file);

      if (!result.success) {
        throw new Error(result.message || "Failed to upload rota");
      }

      if (result.rota_image_base64) {
        setRotaImage(`data:image/jpeg;base64,${result.rota_image_base64}`);
      }

      alert("Rota uploaded successfully.");
    } catch (error) {
      console.error("Rota upload error:", error);

      alert(error.message || "Failed to upload rota.");
    }
  };
  /*
   * Upload holiday
   */

  const handleHolidayUpload = async (event) => {
    event.preventDefault();

    const file = event.currentTarget.elements.holiday_image.files[0];

    if (!file) {
      alert("Please select a holiday file.");
      return;
    }

    try {
      const result = await uploadHoliday(file);

      if (!result.success) {
        throw new Error(result.message || "Failed to upload holiday list");
      }

      if (result.holiday_table) {
        setHolidayTable(result.holiday_table);
      }

      alert("Holiday list uploaded successfully.");
    } catch (error) {
      console.error("Holiday upload error:", error);

      alert(error.message || "Failed to upload holiday list.");
    }
  };
  /*
   * Send notification
   */

  const handleSendNotification = async (event) => {
    event.preventDefault();

    if (!notificationMessage.trim()) {
      alert("Please enter a notification message.");
      return;
    }

    try {
      const result = await sendNotification(notificationMessage.trim());

      if (!result.success) {
        throw new Error(result.message || "Failed to send notification");
      }

      setNotificationMessage("");

      alert("Notification sent successfully.");
    } catch (error) {
      console.error("Notification error:", error);

      alert(error.message || "Failed to send notification.");
    }
  };
  /*
   * Export employee leaves
   */

  const exportEmployeeLeaves = (username, email) => {
    console.log("Export leaves:", username, email);

    /*
     * TODO:
     * Use the existing exportEmployeeLeaves()
     * implementation from admin_leaves.js.
     */
  };

  return (
    <div className="admin-layout">
      {/* =========================
          MOBILE OVERLAY
      ========================== */}

      {showSidebar && (
        <div
          className="sidebar-overlay"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* =========================
          SIDEBAR
      ========================== */}

      <nav
        className={`sidebar-pc ${showSidebar ? "sidebar-open" : ""}`}
        id="sidebar"
      >
        <div className="offcanvas-header">
          <h2 className="offcanvas-title" id="sidebarLabel">
            Admin Dashboard
          </h2>

          <button
            type="button"
            className="btn-close btn-close-white"
            onClick={() => setShowSidebar(false)}
          >
            ×
          </button>
        </div>

        <div className="offcanvas-body">
          {/* Profile */}

          <div className="profile-section">
            <div className="profile-circle">
              <img
                id="admin-profile-pic"
                src={profileImage}
                alt="Admin Profile"
              />
            </div>

            <div className="profile-info">
              <p>
                <strong>Admin:</strong> {adminProfile.username}
              </p>

              <p>
                <strong>Email:</strong> <span>{adminProfile.email}</span>
              </p>

              <button
                id="admin-edit-profile-btn"
                type="button"
                onClick={() => {
                  setAdminEmail(adminProfile.email || "");
                  setAdminFaceImage(null);
                  setShowEditProfile(true);
                }}
              >
                Edit Profile
              </button>
            </div>
          </div>

          {/* Navigation */}

          <ul className="sidebar-nav">
            <li className={activeSection === "attendance" ? "active" : ""}>
              <a
                href="#attendance"
                onClick={() => handleSectionChange("attendance")}
              >
                <i className="fas fa-clock" />
                <span className="sidebar-text">Attendance</span>
              </a>
            </li>

            <li className={activeSection === "users" ? "active" : ""}>
              <a href="#users" onClick={() => handleSectionChange("users")}>
                <i className="fas fa-users" />
                <span className="sidebar-text">Manage Users</span>
              </a>
            </li>

            <li className={activeSection === "tasks" ? "active" : ""}>
              <a href="#tasks" onClick={() => handleSectionChange("tasks")}>
                <i className="fas fa-tasks" />
                <span className="sidebar-text">Manage Tasks</span>
              </a>
            </li>

            <li className={activeSection === "rota" ? "active" : ""}>
              <a href="#rota" onClick={() => handleSectionChange("rota")}>
                <i className="fas fa-calendar-week" />
                <span className="sidebar-text">Upload Rota</span>
              </a>
            </li>

            <li className={activeSection === "holiday" ? "active" : ""}>
              <a href="#holiday" onClick={() => handleSectionChange("holiday")}>
                <i className="fas fa-calendar-alt" />
                <span className="sidebar-text">Upload Holiday</span>
              </a>
            </li>

            <li className={activeSection === "manage-leaves" ? "active" : ""}>
              <a
                href="#manage-leaves"
                onClick={() => handleSectionChange("manage-leaves")}
              >
                <i className="fas fa-umbrella-beach" />
                <span className="sidebar-text">Manage Leaves</span>
              </a>
            </li>

            <li>
              <button
                type="button"
                onClick={handleNewUser}
                className="sidebar-link-button"
              >
                <i className="fas fa-user" />
                New User
              </button>
            </li>

            <li className={activeSection === "notifications" ? "active" : ""}>
              <a
                href="#notifications"
                onClick={() => handleSectionChange("notifications")}
              >
                <i className="fas fa-bell" />
                <span className="sidebar-text">Notifications</span>
              </a>
            </li>

            <li>
              <a href="/admin/export">
                <i className="fas fa-file-export" />
                <span className="sidebar-text">Export Data</span>
              </a>
            </li>

            <li>
              <button
                type="button"
                onClick={handleLogout}
                className="sidebar-link-button"
              >
                <i className="fas fa-sign-out-alt" />
                <span className="sidebar-text">Logout</span>
              </button>
            </li>
          </ul>
        </div>
      </nav>

      {/* =========================
          MAIN CONTENT
      ========================== */}

      <main className="main-content">
        <div className="header">
          <h1>Admin Panel</h1>

          <button
            className="toggle-btn"
            type="button"
            onClick={() => setShowSidebar(true)}
          >
            <i className="fas fa-bars" />
          </button>
        </div>

        {/* =========================
            ATTENDANCE
        ========================== */}

        {activeSection === "attendance" && (
          <section className="content-section active" id="attendance">
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h3>Attendance Overview</h3>

                <select
                  id="view-select"
                  className="form-select"
                  value={attendanceView}
                  onChange={(e) => setAttendanceView(e.target.value)}
                >
                  <option value="daily">Daily</option>

                  <option value="weekly">Weekly</option>

                  <option value="monthly">Monthly</option>

                  <option value="yearly">Yearly</option>
                </select>
              </div>

              <div className="card-body">
                <div className="search-bar mb-3">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search by username..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />

                  <button className="btn btn-primary" type="button">
                    <i className="fas fa-search" /> Search
                  </button>
                </div>

                <div className="table-responsive">
                  <table className="table table-striped" id="attendance-table">
                    <thead>
                      <tr>
                        <th>Username</th>

                        <th>Position</th>

                        <th>Login Time</th>

                        <th>Logout Time</th>

                        <th>Hours Worked</th>

                        <th>Status</th>

                        <th>Daily Status</th>

                        <th>Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredAttendance.map((record, index) => (
                        <tr key={record.id || record.attendance_id || index}>
                          <td>{record.username}</td>

                          <td>{record.position}</td>

                          <td>{record.login_time || "N/A"}</td>

                          <td>{record.logout_time || "N/A"}</td>

                          <td>{record.hours_worked || "N/A"}</td>

                          <td>
                            <span
                              className={`badge ${
                                record.attendance_status === "Present"
                                  ? "bg-success"
                                  : "bg-danger"
                              }`}
                            >
                              {record.attendance_status || "N/A"}
                            </span>
                          </td>

                          <td>
                            {record.daily_status_submitted ? "Yes" : "No"}
                          </td>

                          <td>
                            <select
                              className="status-select form-select form-select-sm"
                              value={record.attendance_status || "Present"}
                              onChange={(e) =>
                                handleAttendanceStatusChange(
                                  record,
                                  e.target.value,
                                )
                              }
                            >
                              <option value="Present">Present</option>

                              <option value="Absent">Absent</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {filteredAttendance.length === 0 && (
                    <p className="text-muted">
                      No attendance records available.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* =========================
            TASKS
        ========================== */}

        {activeSection === "tasks" && (
          <section className="content-section active" id="tasks">
            <div className="card">
              <div className="admin-tasks-wrapper">
                <div className="admin-tasks-header">
                  <div className="admin-tasks-title">
                    <i className="fas fa-tasks" />

                    <span>Employee Task Management</span>
                  </div>

                  <div className="admin-task-stats">
                    <div className="admin-task-stat">
                      <span className="admin-task-stat-val">
                        {taskStats.total}
                      </span>

                      <span className="admin-task-stat-label">Total</span>
                    </div>

                    <div className="admin-task-stat at-approved">
                      <span className="admin-task-stat-val">
                        {taskStats.approved}
                      </span>

                      <span className="admin-task-stat-label">Approved</span>
                    </div>

                    <div className="admin-task-stat at-pending">
                      <span className="admin-task-stat-val">
                        {taskStats.pending}
                      </span>

                      <span className="admin-task-stat-label">Pending</span>
                    </div>

                    <div className="admin-task-stat at-rejected">
                      <span className="admin-task-stat-val">
                        {taskStats.rejected}
                      </span>

                      <span className="admin-task-stat-label">Rejected</span>
                    </div>
                  </div>
                </div>

                <div className="admin-task-filters">
                  <div className="task-search-box">
                    <i className="fas fa-search" />

                    <input
                      type="text"
                      placeholder="Search employee, project, task..."
                      value={taskSearch}
                      onChange={(e) => setTaskSearch(e.target.value)}
                    />
                  </div>

                  <div className="task-filter-box">
                    <i className="fas fa-folder" />

                    <select
                      value={projectFilter}
                      onChange={(e) => setProjectFilter(e.target.value)}
                    >
                      <option value="all">All Projects</option>

                      {projectOptions.map((project) => (
                        <option key={project} value={project}>
                          {project}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="admin-tasks-table-wrap">
                  <div className="table-responsive">
                    <table className="admin-tasks-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Employee</th>
                          <th>Project</th>
                          <th>Task</th>
                          <th>Time Period</th>
                          <th>Submitted</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>

                      <tbody>
                        {filteredTasks.map((task, index) => (
                          <tr key={task.id || index}>
                            <td>#{index + 1}</td>

                            <td>
                              <div className="at-emp-name">
                                {task.employee_name}
                              </div>

                              <div className="at-emp-id">
                                Employee ID: {task.employee_id}
                              </div>
                            </td>

                            <td>
                              <span className="at-project-tag">
                                <i className="fas fa-folder" />{" "}
                                {task.project_name}
                              </span>
                            </td>

                            <td>
                              <span
                                className="at-task-name"
                                title={task.task_name}
                              >
                                {task.task_name}
                              </span>
                            </td>

                            <td>
                              <span className="at-time-chip">
                                <i className="fas fa-hourglass-half" />{" "}
                                {task.time_period || "N/A"}
                              </span>
                            </td>

                            <td>{task.created_at || "—"}</td>

                            <td>
                              <span
                                className={`at-badge ${
                                  task.status === "Approved"
                                    ? "at-badge-approved"
                                    : task.status === "Rejected"
                                      ? "at-badge-rejected"
                                      : "at-badge-pending"
                                }`}
                              >
                                {task.status}
                              </span>
                            </td>

                            <td>
                              {task.status === "Pending" ? (
                                <div className="at-action-btns">
                                  <button
                                    type="button"
                                    className="at-btn-approve"
                                    onClick={() => handleApproveTask(task)}
                                  >
                                    <i className="fas fa-check" /> Approve
                                  </button>

                                  <button
                                    type="button"
                                    className="at-btn-reject"
                                    onClick={() => handleRejectTask(task)}
                                  >
                                    <i className="fas fa-times" /> Reject
                                  </button>
                                </div>
                              ) : (
                                <span className="at-done-text">Done</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* =========================
            USERS
        ========================== */}

        {activeSection === "users" && (
          <section className="content-section active" id="users">
            <div className="card">
              <h3 className="card-header">Manage Users</h3>

              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-striped" id="users-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Username</th>
                        <th>Email</th>
                        <th>Position</th>
                        <th>Profile Image</th>
                        <th>Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id}>
                          <td>{user.id}</td>

                          <td>{user.username}</td>

                          <td>{user.email}</td>

                          <td>{user.position}</td>

                          <td>
                            {user.face_image_base64 ? (
                              <img
                                src={`data:image/jpeg;base64,${user.face_image_base64}`}
                                alt="Profile"
                                className="user-profile-img"
                              />
                            ) : (
                              <span>No Image</span>
                            )}
                          </td>

                          <td>
                            <button
                              type="button"
                              className="btn btn-sm btn-primary"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleEditUser(user);
                              }}
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              className="btn btn-sm btn-danger"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleDeleteUser(user);
                              }}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {users.length === 0 && (
                    <p className="text-muted">No users available.</p>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* =========================
            ROTA
        ========================== */}

        {activeSection === "rota" && (
          <section className="content-section active" id="rota">
            <div className="card">
              <h3 className="card-header">Upload Weekly Rota</h3>

              <div className="card-body">
                <form onSubmit={handleRotaUpload}>
                  <input
                    type="file"
                    name="rotaImage"
                    accept="image/*"
                    className="form-control mb-3"
                    required
                  />

                  <button type="submit" className="btn btn-primary">
                    Upload Rota
                  </button>
                </form>

                {rotaImage ? (
                  <div className="mt-3">
                    <h5>Current Rota</h5>

                    <img
                      src={rotaImage}
                      alt="Current Rota"
                      className="rota-image"
                    />
                  </div>
                ) : (
                  <p className="mt-3">No rota uploaded yet.</p>
                )}
              </div>
            </div>
          </section>
        )}

        {/* =========================
            HOLIDAY
        ========================== */}

        {activeSection === "holiday" && (
          <section className="content-section active" id="holiday">
            <div className="card">
              <h3 className="card-header">Upload Holiday List</h3>

              <div className="card-body">
                <form onSubmit={handleHolidayUpload}>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">
                      <i className="fas fa-file-excel me-1" />
                      Select Excel / CSV File
                    </label>

                    <input
                      type="file"
                      name="holiday_image"
                      accept=".doc,.docx,.xls,.xlsx,.csv"
                      className="form-control"
                      required
                    />

                    <div className="form-text">
                      Supported formats: .doc, .docx, .xls, .xlsx, .csv
                    </div>
                  </div>

                  <button type="submit" className="btn btn-primary">
                    <i className="fas fa-upload me-1" />
                    Upload Holiday List
                  </button>
                </form>

                {holidayTable ? (
                  <div className="mt-4">
                    <h5>Current Holiday List</h5>

                    <div
                      className="table-responsive holiday-preview-wrap"
                      dangerouslySetInnerHTML={{
                        __html: holidayTable,
                      }}
                    />
                  </div>
                ) : (
                  <p className="mt-3 text-muted">
                    No holiday list uploaded yet.
                  </p>
                )}
              </div>
            </div>
          </section>
        )}

        {/* =========================
            LEAVES
        ========================== */}

        {activeSection === "manage-leaves" && (
          <section className="content-section active" id="manage-leaves">
            <div className="lv-body">
              {/* Statistics */}

              <div className="stats-row">
                <div className="stat-card total">
                  <div className="stat-icon">
                    <i className="fas fa-layer-group" />
                  </div>

                  <div className="stat-label">TOTAL REQUESTS</div>

                  <div className="stat-value">{leaveStats.total}</div>
                </div>

                <div className="stat-card pending">
                  <div className="stat-icon">
                    <i className="fas fa-hourglass-half" />
                  </div>

                  <div className="stat-label">PENDING</div>

                  <div className="stat-value">{leaveStats.pending}</div>
                </div>

                <div className="stat-card approved">
                  <div className="stat-icon">
                    <i className="fas fa-check-circle" />
                  </div>

                  <div className="stat-label">APPROVED</div>

                  <div className="stat-value">{leaveStats.approved}</div>
                </div>

                <div className="stat-card rejected">
                  <div className="stat-icon">
                    <i className="fas fa-times-circle" />
                  </div>

                  <div className="stat-label">REJECTED</div>

                  <div className="stat-value">{leaveStats.rejected}</div>
                </div>
              </div>

              {/* Filters */}

              <div className="filter-bar">
                <i className="fas fa-sliders-h filter-icon" />

                <select
                  className="filter-select"
                  value={leaveStatus}
                  onChange={(e) => setLeaveStatus(e.target.value)}
                >
                  <option value="all">All Statuses</option>

                  <option value="Pending">Pending</option>

                  <option value="Approved">Approved</option>

                  <option value="Rejected">Rejected</option>
                </select>

                <select
                  className="filter-select"
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                >
                  <option value="all">All Leave Types</option>

                  <option value="Paid Leave">Paid Leave</option>

                  <option value="Sick Leave">Sick Leave</option>

                  <option value="Emergency Leave">Emergency Leave</option>
                </select>

                <input
                  type="text"
                  className="filter-input"
                  placeholder="Search employee..."
                  value={leaveSearch}
                  onChange={(e) => setLeaveSearch(e.target.value)}
                />

                <span className="row-count">
                  {filteredLeaves.length} records
                </span>
              </div>

              {/* Leave Table */}

              <div className="table-card">
                {filteredLeaves.length > 0 ? (
                  <div className="table-responsive">
                    <table id="leavesTable">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Employee</th>
                          <th>Leave Type</th>
                          <th>From</th>
                          <th>To</th>
                          <th>Days</th>
                          <th>Status</th>
                          <th>Remarks</th>
                          <th>Actions</th>
                        </tr>
                      </thead>

                      <tbody>
                        {filteredLeaves.map((leave, index) => (
                          <tr key={leave.id}>
                            <td>{index + 1}</td>

                            <td>
                              <div className="employee-cell">
                                <div className="avatar">
                                  {String(leave.username || "U")
                                    .charAt(0)
                                    .toUpperCase()}
                                </div>

                                <div>
                                  <div className="emp-name">
                                    {leave.username}
                                  </div>

                                  <div className="emp-email">{leave.email}</div>
                                </div>
                              </div>
                            </td>

                            <td>
                              <span
                                className={`lt-pill ${
                                  leave.leave_type === "Sick Leave"
                                    ? "lt-sick"
                                    : leave.leave_type === "Paid Leave"
                                      ? "lt-paid"
                                      : "lt-emergency"
                                }`}
                              >
                                {leave.leave_type}
                              </span>
                            </td>

                            <td>{leave.start_date}</td>

                            <td>{leave.end_date}</td>

                            <td className="val-days">
                              {leave.total_days || "—"}
                            </td>

                            <td>
                              <span
                                className={`badge-status ${
                                  leave.status === "Approved"
                                    ? "badge-approved"
                                    : leave.status === "Rejected"
                                      ? "badge-rejected"
                                      : "badge-pending"
                                }`}
                              >
                                {leave.status}
                              </span>
                            </td>

                            <td className="leave-remarks">
                              {leave.remarks || "—"}
                            </td>

                            <td>
                              <div className="actions-cell">
                                {leave.status === "Pending" ? (
                                  <>
                                    <button
                                      type="button"
                                      className="btn-approve leave-action-btn"
                                      onClick={() =>
                                        openLeaveConfirmation(leave, "Approved")
                                      }
                                    >
                                      <i className="fas fa-check" /> Approve
                                    </button>

                                    <button
                                      type="button"
                                      className="btn-reject leave-action-btn"
                                      onClick={() =>
                                        openLeaveConfirmation(leave, "Rejected")
                                      }
                                    >
                                      <i className="fas fa-times" /> Reject
                                    </button>
                                  </>
                                ) : (
                                  <span className="no-action-text">
                                    No action
                                  </span>
                                )}

                                <button
                                  type="button"
                                  className="btn-emp-dl"
                                  onClick={() =>
                                    exportEmployeeLeaves(
                                      leave.username,
                                      leave.email,
                                    )
                                  }
                                >
                                  <i className="fas fa-download" /> CSV
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="empty-state">
                    <i className="fas fa-inbox" />

                    <p>No leave requests found.</p>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* =========================
            NOTIFICATIONS
        ========================== */}

        {activeSection === "notifications" && (
          <section className="content-section active" id="notifications">
            <div className="card">
              <h3 className="card-header">Send Notification</h3>

              <div className="card-body">
                <form onSubmit={handleSendNotification}>
                  <textarea
                    className="form-control mb-3"
                    placeholder="Enter notification message..."
                    value={notificationMessage}
                    onChange={(e) => setNotificationMessage(e.target.value)}
                    required
                  />

                  <button type="submit" className="btn btn-primary">
                    Send to All Users
                  </button>
                </form>
              </div>
            </div>

            <div className="card mt-4">
              <h3 className="card-header">Read Notifications</h3>

              <div className="card-body">
                {notifications.length > 0 ? (
                  <ul className="list-group">
                    {notifications.map((notification, index) => (
                      <li
                        className="list-group-item"
                        key={notification.id || index}
                      >
                        {notification.message} - Sent to {notification.username}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No read notifications.</p>
                )}
              </div>
            </div>
          </section>
        )}

        {/* =========================
            EXPORT
        ========================== */}

        {activeSection === "export" && (
          <section className="content-section" id="export">
            <div className="card">
              <h3>Export Attendance Data</h3>

              <p>Redirecting to export page...</p>
            </div>
          </section>
        )}
      </main>

      {/* =========================
          CONFIRM LEAVE MODAL
      ========================== */}

      {showConfirm && (
        <div className="modal-overlay">
          <div className="confirm-box">
            <div className="confirm-title">
              {selectedLeave?.newStatus === "Approved"
                ? "Approve Leave?"
                : "Reject Leave?"}
            </div>

            <p className="confirm-body">
              Are you sure you want to{" "}
              {selectedLeave?.newStatus === "Approved" ? "approve" : "reject"}{" "}
              this leave request?
            </p>

            <div className="confirm-actions">
              <button
                type="button"
                className="modal-btn modal-btn-cancel"
                onClick={closeConfirm}
              >
                <i className="fas fa-times" /> Cancel
              </button>

              <button
                type="button"
                className="modal-btn modal-btn-approve"
                onClick={confirmLeaveAction}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}

{showEditUser && (
    <div className="modal-overlay">

        <div className="modal-dialog">

            <div className="modal-content">

                <div className="modal-header">

                    <h5 className="modal-title">
                        Edit User
                    </h5>

                    <button
                        type="button"
                        className="btn-close"
                        onClick={() => {
                            setShowEditUser(false);
                            setSelectedUser(null);
                            setEditFaceImage(null);
                        }}
                    >
                        ×
                    </button>

                </div>

                <div className="modal-body">

                    <div className="mb-3">
                        <label className="form-label">
                            Username
                        </label>

                        <input
                            type="text"
                            className="form-control"
                            value={editUsername}
                            onChange={(e) =>
                                setEditUsername(e.target.value)
                            }
                        />
                    </div>

                    <div className="mb-3">
                        <label className="form-label">
                            Email
                        </label>

                        <input
                            type="email"
                            className="form-control"
                            value={editEmail}
                            onChange={(e) =>
                                setEditEmail(e.target.value)
                            }
                        />
                    </div>

                    <div className="mb-3">
                        <label className="form-label">
                            Position
                        </label>

                        <input
                            type="text"
                            className="form-control"
                            value={editPosition}
                            onChange={(e) =>
                                setEditPosition(e.target.value)
                            }
                        />
                    </div>

                    <div className="mb-3">
                        <label className="form-label">
                            Profile Image
                        </label>

                        <input
                            type="file"
                            className="form-control"
                            accept="image/*"
                            onChange={(e) =>
                                setEditFaceImage(
                                    e.target.files?.[0] || null
                                )
                            }
                        />
                    </div>

                </div>

                <div className="modal-footer">

                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => {
                            setShowEditUser(false);
                            setSelectedUser(null);
                            setEditFaceImage(null);
                        }}
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={handleUpdateUser}
                    >
                        Save Changes
                    </button>

                </div>

            </div>

        </div>

    </div>
)}
      {/* EDIT ADMIN PROFILE MODAL */}
      {showEditProfile && (
        <div className="modal-overlay">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit Admin Profile</h5>

                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowEditProfile(false);
                    setAdminFaceImage(null);
                  }}
                >
                  ×
                </button>
              </div>

              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Email</label>

                  <input
                    type="email"
                    className="form-control"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="Enter admin email"
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Profile Image</label>

                  <input
                    type="file"
                    className="form-control"
                    accept="image/*"
                    onChange={(e) =>
                      setAdminFaceImage(e.target.files[0] || null)
                    }
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowEditProfile(false);
                    setAdminFaceImage(null);
                  }}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleUpdateAdminProfile}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
