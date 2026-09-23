import {
  useMemo,
  useState,
} from "react";

import {
  updateAttendanceStatus,
} from "../../services/adminService";

import "../../styles/admin/attendance.css";

function AttendanceModule({
  attendance: attendanceData = [],
}) {
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [attendanceView, setAttendanceView] =
    useState("yearly");

  const [updatingId, setUpdatingId] =
    useState(null);

  // ============================================================
  // DATE HELPERS
  // ============================================================

  const getRecordDate = (record) => {
    const value =
      record.login_time ||
      record.loginTime ||
      record.logout_time ||
      record.logoutTime;

    if (!value) {
      return null;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return null;
    }

    return date;
  };

  // ============================================================
  // FORMAT DATE/TIME
  // ============================================================

  const formatDateTime = (value) => {
    if (!value) {
      return "N/A";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return String(value)
        .replace(" GMT", "")
        .replace(" UTC", "");
    }

    const year = date.getFullYear();

    const month = String(
      date.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
      date.getDate()
    ).padStart(2, "0");

    const hours = String(
      date.getHours()
    ).padStart(2, "0");

    const minutes = String(
      date.getMinutes()
    ).padStart(2, "0");

    const seconds = String(
      date.getSeconds()
    ).padStart(2, "0");

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  // ============================================================
  // SEARCH + VIEW FILTER
  // ============================================================

  const filteredAttendance = useMemo(() => {
    let records = Array.isArray(attendanceData)
      ? [...attendanceData]
      : [];

    // ----------------------------------------------------------
    // SEARCH
    // ----------------------------------------------------------

    const query = searchQuery
      .toLowerCase()
      .trim();

    if (query) {
      records = records.filter((record) => {
        const username = String(
          record.username || ""
        ).toLowerCase();

        const position = String(
          record.position || ""
        ).toLowerCase();

        return (
          username.includes(query) ||
          position.includes(query)
        );
      });
    }

    // ----------------------------------------------------------
    // DATE VIEW
    // ----------------------------------------------------------

    const now = new Date();

    if (attendanceView === "daily") {
      records = records.filter((record) => {
        const date = getRecordDate(record);

        if (!date) {
          return false;
        }

        return (
          date.getFullYear() ===
            now.getFullYear() &&
          date.getMonth() ===
            now.getMonth() &&
          date.getDate() ===
            now.getDate()
        );
      });
    }

    if (attendanceView === "weekly") {
      const startOfWeek = new Date(now);

      const day = startOfWeek.getDay();

      const difference =
        day === 0 ? 6 : day - 1;

      startOfWeek.setDate(
        startOfWeek.getDate() - difference
      );

      startOfWeek.setHours(
        0,
        0,
        0,
        0
      );

      const endOfWeek = new Date(
        startOfWeek
      );

      endOfWeek.setDate(
        endOfWeek.getDate() + 7
      );

      records = records.filter((record) => {
        const date = getRecordDate(record);

        return (
          date &&
          date >= startOfWeek &&
          date < endOfWeek
        );
      });
    }

    if (attendanceView === "monthly") {
      records = records.filter((record) => {
        const date = getRecordDate(record);

        if (!date) {
          return false;
        }

        return (
          date.getFullYear() ===
            now.getFullYear() &&
          date.getMonth() ===
            now.getMonth()
        );
      });
    }

    if (attendanceView === "yearly") {
      records = records.filter((record) => {
        const date = getRecordDate(record);

        if (!date) {
          return false;
        }

        return (
          date.getFullYear() ===
          now.getFullYear()
        );
      });
    }

    return records;
  }, [
    attendanceData,
    searchQuery,
    attendanceView,
  ]);

  // ============================================================
  // SEARCH BUTTON
  // ============================================================

  const handleSearch = () => {
    setSearchQuery(
      searchInput.trim()
    );
  };

  // ============================================================
  // ENTER KEY SEARCH
  // ============================================================

  const handleSearchKeyDown = (event) => {
    if (event.key === "Enter") {
      handleSearch();
    }
  };

  // ============================================================
  // ATTENDANCE STATUS UPDATE
  // ============================================================

  const handleAttendanceStatusChange = async (
    record,
    status
  ) => {
    try {
      const attendanceId =
        record.attendance_id ||
        record.id;

      if (!attendanceId) {
        alert(
          "Attendance ID not found."
        );
        return;
      }

      setUpdatingId(attendanceId);

      const result =
        await updateAttendanceStatus(
          attendanceId,
          status
        );

      if (!result?.success) {
        throw new Error(
          result?.message ||
            "Failed to update attendance status"
        );
      }

      // Update parent-provided records locally
      // without another dashboard request.
      record.attendance_status = status;
      record.status = status;

      // Force the component to reflect the changed object
      setSearchQuery((current) => current);

    } catch (error) {
      console.error(
        "Attendance status update error:",
        error
      );

      alert(
        error.message ||
          "Failed to update attendance status."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <section
      className="content-section active"
      id="attendance"
    >

      <div className="card attendance-card">

        {/* ====================================================
            HEADER
        ==================================================== */}

        <div className="card-header attendance-card-header">

          <h3>
            Attendance Overview
          </h3>

          <select
            id="view-select"
            className="attendance-view-select"
            value={attendanceView}
            onChange={(event) =>
              setAttendanceView(
                event.target.value
              )
            }
          >
            <option value="daily">
              Daily
            </option>

            <option value="weekly">
              Weekly
            </option>

            <option value="monthly">
              Monthly
            </option>

            <option value="yearly">
              Yearly
            </option>
          </select>

        </div>

        {/* ====================================================
            BODY
        ==================================================== */}

        <div className="card-body attendance-card-body">

          {/* SEARCH */}

          <div className="attendance-search-row">

            <input
              type="text"
              className="attendance-search-input"
              placeholder="Search by username..."
              value={searchInput}
              onChange={(event) =>
                setSearchInput(
                  event.target.value
                )
              }
              onKeyDown={
                handleSearchKeyDown
              }
            />

            <button
              type="button"
              className="attendance-search-button"
              onClick={handleSearch}
            >
              <i className="fas fa-search"></i>
              <span>Search</span>
            </button>

          </div>

          {/* TABLE */}

          <div className="attendance-table-wrapper">

            <table
              className="attendance-table"
              id="attendance-table"
            >

              <thead>
                <tr>

                  <th>USERNAME</th>

                  <th>POSITION</th>

                  <th>LOGIN TIME</th>

                  <th>LOGOUT TIME</th>

                  <th>HOURS WORKED</th>

                  <th>STATUS</th>

                  <th>DAILY STATUS</th>

                  <th>ACTIONS</th>

                </tr>
              </thead>

              <tbody>

                {filteredAttendance.map(
                  (record, index) => {

                    const status =
                      record.attendance_status ||
                      record.status ||
                      "N/A";

                    const attendanceId =
                      record.attendance_id ||
                      record.id ||
                      index;

                    return (
                      <tr
                        key={attendanceId}
                      >

                        <td>
                          {record.username ||
                            "N/A"}
                        </td>

                        <td>
                          {record.position ||
                            "N/A"}
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

                        <td className="hours-worked">
                          {record.hours_worked ||
                            "N/A"}
                        </td>

                        <td>

                          <span
                            className={
                              status ===
                              "Present"
                                ? "attendance-status present"
                                : "attendance-status absent"
                            }
                          >
                            {status}
                          </span>

                        </td>

                        <td>
                          {record.daily_status_submitted
                            ? "Yes"
                            : "No"}
                        </td>

                        <td>

                          <select
                            className="attendance-action-select"
                            value={
                              status ===
                              "Absent"
                                ? "Absent"
                                : "Present"
                            }
                            disabled={
                              updatingId ===
                              attendanceId
                            }
                            onChange={(event) =>
                              handleAttendanceStatusChange(
                                record,
                                event.target.value
                              )
                            }
                          >

                            <option value="Present">
                              Present
                            </option>

                            <option value="Absent">
                              Absent
                            </option>

                          </select>

                        </td>

                      </tr>
                    );
                  }
                )}

              </tbody>

            </table>

            {filteredAttendance.length ===
              0 && (
              <div className="attendance-empty">
                No attendance records available.
              </div>
            )}

          </div>

        </div>

      </div>

    </section>
  );
}

export default AttendanceModule;