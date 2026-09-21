import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAdminDashboard } from "../services/adminService";
import "../styles/export.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

function ViewExcel() {
    const navigate = useNavigate();

    const [attendance, setAttendance] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        loadAttendance();
    }, []);

    const loadAttendance = async () => {
        try {
            setLoading(true);
            setError("");

            const data = await getAdminDashboard();

            if (!data.success) {
                throw new Error(
                    data.message || "Failed to load attendance data"
                );
            }

            setAttendance(data.allAttendance || data.attendance || []);
        } catch (err) {
            console.error("Attendance loading error:", err);
            setError(
                err.message || "Failed to load attendance data"
            );
        } finally {
            setLoading(false);
        }
    };

    const filteredAttendance = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();

        if (!query) {
            return attendance;
        }

        return attendance.filter((record) => {
            const username =
                String(record.username || "").toLowerCase();

            const position =
                String(record.position || "").toLowerCase();

            return (
                username.includes(query) ||
                position.includes(query)
            );
        });
    }, [attendance, searchQuery]);

    const presentCount = useMemo(() => {
        return filteredAttendance.filter(
            (record) =>
                String(record.attendance_status || "")
                    .toLowerCase() === "present"
        ).length;
    }, [filteredAttendance]);

    const absentCount = useMemo(() => {
        return filteredAttendance.filter(
            (record) =>
                String(record.attendance_status || "")
                    .toLowerCase() === "absent"
        ).length;
    }, [filteredAttendance]);

    const formatDateTime = (value) => {
        if (!value) {
            return "—";
        }

        try {
            const date = new Date(value);

            if (Number.isNaN(date.getTime())) {
                return String(value);
            }

            return date.toLocaleString();
        } catch {
            return String(value);
        }
    };

    const formatLocation = (latitude, longitude) => {
        if (
            latitude === null ||
            latitude === undefined ||
            longitude === null ||
            longitude === undefined
        ) {
            return "—";
        }

        return `${latitude}, ${longitude}`;
    };

    const handleDownload = () => {
        window.location.href = `${API_BASE_URL}/admin/export`;
    };

    return (
        <div className="view-excel-page">

            <div className="view-excel-wrapper">

                {/* Top Bar */}
                <div className="ve-topbar">

                    <div className="ve-topbar-left">

                        <button
                            type="button"
                            className="back-btn"
                            onClick={() => navigate("/admin/export")}
                        >
                            <i className="fas fa-arrow-left"></i>
                            Export
                        </button>

                        <div className="ve-page-title">

                            <div className="ve-icon">
                                <i className="fas fa-table"></i>
                            </div>

                            <div>
                                <h1>Attendance Data</h1>
                                <span>
                                    All employee records
                                </span>
                            </div>

                        </div>
                    </div>

                    <div className="ve-topbar-actions">

                        {/* Search */}
                        <div className="ve-search-wrap">
                            <input
                                type="text"
                                className="ve-search-input"
                                placeholder="Filter by name…"
                                value={searchQuery}
                                onChange={(e) =>
                                    setSearchQuery(e.target.value)
                                }
                            />
                        </div>

                        {/* Download */}
                        <button
                            type="button"
                            className="ve-dl-btn"
                            onClick={handleDownload}
                        >
                            <i className="fas fa-download"></i>
                            Download Excel
                        </button>

                    </div>
                </div>

                {/* Summary */}
                <div className="ve-summary-strip">

                    <div className="ve-chip">
                        <span
                            className="chip-dot"
                            style={{
                                background: "#2563eb"
                            }}
                        ></span>

                        Total Records

                        <span className="chip-val">
                            {filteredAttendance.length}
                        </span>
                    </div>

                    <div className="ve-chip">
                        <span
                            className="chip-dot"
                            style={{
                                background: "#059669"
                            }}
                        ></span>

                        Present

                        <span className="chip-val">
                            {presentCount}
                        </span>
                    </div>

                    <div className="ve-chip">
                        <span
                            className="chip-dot"
                            style={{
                                background: "#dc2626"
                            }}
                        ></span>

                        Absent

                        <span className="chip-val">
                            {absentCount}
                        </span>
                    </div>

                </div>

                {/* Table Card */}
                <div className="ve-table-card">

                    <div className="ve-table-scroll">

                        {loading ? (
                            <div className="ve-empty-state">
                                <i className="fas fa-spinner fa-spin"></i>

                                <p className="empty-title">
                                    Loading attendance data...
                                </p>
                            </div>
                        ) : error ? (
                            <div className="ve-empty-state">
                                <i className="fas fa-exclamation-circle"></i>

                                <p className="empty-title">
                                    Failed to load attendance data
                                </p>

                                <p className="empty-sub">
                                    {error}
                                </p>

                                <button
                                    type="button"
                                    onClick={loadAttendance}
                                    className="ve-dl-btn"
                                    style={{
                                        marginTop: "15px"
                                    }}
                                >
                                    <i className="fas fa-refresh"></i>
                                    Retry
                                </button>
                            </div>
                        ) : filteredAttendance.length === 0 ? (
                            <div className="ve-empty-state">

                                <i className="fas fa-calendar-times"></i>

                                <p className="empty-title">
                                    No attendance records found
                                </p>

                                <p className="empty-sub">
                                    Records will appear here once
                                    employees start logging in.
                                </p>

                            </div>
                        ) : (
                            <table>
                                <thead>
                                    <tr>
                                        <th>Employee</th>
                                        <th>Position</th>
                                        <th>Login Time</th>
                                        <th>Logout Time</th>
                                        <th>Login Location</th>
                                        <th>Logout Location</th>
                                        <th>Daily Status</th>
                                        <th>Attendance</th>
                                        <th>Hours Worked</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {filteredAttendance.map(
                                        (record, index) => {

                                            const status =
                                                String(
                                                    record.attendance_status || ""
                                                ).toLowerCase();

                                            const hoursWorked =
                                                record.hours_worked ||
                                                "N/A";

                                            return (
                                                <tr
                                                    key={
                                                        record.attendance_id ||
                                                        record.user_id ||
                                                        index
                                                    }
                                                >

                                                    <td>
                                                        {record.username ||
                                                            "—"}
                                                    </td>

                                                    <td>
                                                        {record.position ||
                                                            "—"}
                                                    </td>

                                                    <td>
                                                        {formatDateTime(
                                                            record.login_time
                                                        )}
                                                    </td>

                                                    <td>
                                                        {formatDateTime(
                                                            record.logout_time
                                                        )}
                                                    </td>

                                                    <td>
                                                        {formatLocation(
                                                            record.login_latitude,
                                                            record.login_longitude
                                                        )}
                                                    </td>

                                                    <td>
                                                        {formatLocation(
                                                            record.logout_latitude,
                                                            record.logout_longitude
                                                        )}
                                                    </td>

                                                    <td>
                                                        {record.daily_status_submitted ? (
                                                            <span className="bool-yes">
                                                                <i className="fas fa-check"></i>
                                                                Yes
                                                            </span>
                                                        ) : (
                                                            <span className="bool-no">
                                                                —
                                                            </span>
                                                        )}
                                                    </td>

                                                    <td>
                                                        {status === "present" ? (
                                                            <span className="badge-present">
                                                                <i className="fas fa-check-circle"></i>
                                                                Present
                                                            </span>
                                                        ) : status === "absent" ? (
                                                            <span className="badge-absent">
                                                                <i className="fas fa-times-circle"></i>
                                                                Absent
                                                            </span>
                                                        ) : (
                                                            <span>
                                                                {record.attendance_status ||
                                                                    "—"}
                                                            </span>
                                                        )}
                                                    </td>

                                                    <td>
                                                        {hoursWorked ===
                                                        "N/A" ? (
                                                            <span className="hours-na">
                                                                —
                                                            </span>
                                                        ) : (
                                                            <span
                                                                className={
                                                                    record.color ===
                                                                        "green" ||
                                                                    String(
                                                                        hoursWorked
                                                                    ).startsWith(
                                                                        "09:"
                                                                    )
                                                                        ? "hours-green"
                                                                        : "hours-red"
                                                                }
                                                            >
                                                                {
                                                                    hoursWorked
                                                                }
                                                            </span>
                                                        )}
                                                    </td>

                                                </tr>
                                            );
                                        }
                                    )}
                                </tbody>
                            </table>
                        )}

                    </div>

                    {!loading && !error && (
                        <div className="ve-row-count">
                            Showing{" "}
                            {filteredAttendance.length}{" "}
                            record
                            {filteredAttendance.length !== 1
                                ? "s"
                                : ""}
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}

export default ViewExcel;