import React, {
  useMemo,
  useState,
} from "react";

import "../../styles/export.css";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "";

function ViewExcel({
  attendance = [],
  onSectionChange = () => {},
}) {

  const [
    searchQuery,
    setSearchQuery,
  ] = useState("");


  // ============================================================
  // FILTER ATTENDANCE
  // ============================================================

  const filteredAttendance =
    useMemo(() => {

      const query =
        searchQuery
          .trim()
          .toLowerCase();


      if (!query) {
        return attendance;
      }


      return attendance.filter(
        (record) => {

          const username =
            String(
              record.username || ""
            ).toLowerCase();


          const position =
            String(
              record.position || ""
            ).toLowerCase();


          return (
            username.includes(query) ||
            position.includes(query)
          );
        }
      );

    }, [
      attendance,
      searchQuery,
    ]);


  // ============================================================
  // PRESENT COUNT
  // ============================================================

  const presentCount =
    useMemo(() => {

      return filteredAttendance.filter(
        (record) =>
          String(
            record.attendance_status || ""
          ).toLowerCase() ===
          "present"
      ).length;

    }, [
      filteredAttendance,
    ]);


  // ============================================================
  // ABSENT COUNT
  // ============================================================

  const absentCount =
    useMemo(() => {

      return filteredAttendance.filter(
        (record) =>
          String(
            record.attendance_status || ""
          ).toLowerCase() ===
          "absent"
      ).length;

    }, [
      filteredAttendance,
    ]);


  // ============================================================
  // FORMAT DATE / TIME
  // ============================================================

  const formatDateTime = (value) => {

    if (!value) {
      return "—";
    }


    try {

      const date =
        new Date(value);


      if (
        Number.isNaN(
          date.getTime()
        )
      ) {
        return String(value);
      }


      return date.toLocaleString();

    } catch {

      return String(value);

    }
  };


  // ============================================================
  // FORMAT LOCATION
  // ============================================================

  const formatLocation = (
    latitude,
    longitude
  ) => {

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


  // ============================================================
  // DOWNLOAD EXCEL
  // ============================================================

  const handleDownload = () => {

    window.location.href =
      `${API_BASE_URL}/admin/export`;

  };


  return (
    <section
      className="content-section active"
      id="view-excel"
    >

      <div className="view-excel-page">

        <div className="view-excel-wrapper">


          {/* ==================================================
              TOP BAR
          ================================================== */}

          <div className="ve-topbar">


            {/* LEFT SIDE */}

            <div className="ve-topbar-left">


              {/* Back to Export */}

              <button
                type="button"
                className="back-btn"
                onClick={() =>
                  onSectionChange("export")
                }
              >

                <i className="fas fa-arrow-left"></i>

                Export

              </button>


              {/* Page Title */}

              <div className="ve-page-title">

                <div className="ve-icon">

                  <i className="fas fa-table"></i>

                </div>


                <div>

                  <h1>
                    Attendance Data
                  </h1>

                  <span>
                    All employee records
                  </span>

                </div>

              </div>

            </div>


            {/* RIGHT SIDE */}

            <div className="ve-topbar-actions">


              {/* Search */}

              <div className="ve-search-wrap">

                <input
                  type="text"
                  className="ve-search-input"
                  placeholder="Filter by name…"
                  value={searchQuery}
                  onChange={(event) =>
                    setSearchQuery(
                      event.target.value
                    )
                  }
                />

              </div>


              {/* Download */}

              <button
                type="button"
                className="ve-dl-btn"
                onClick={
                  handleDownload
                }
              >

                <i className="fas fa-download"></i>

                Download Excel

              </button>

            </div>

          </div>


          {/* ==================================================
              SUMMARY
          ================================================== */}

          <div className="ve-summary-strip">


            {/* TOTAL RECORDS */}

            <div className="ve-chip">

              <span
                className="chip-dot"
                style={{
                  background:
                    "#2563eb",
                }}
              ></span>

              Total Records

              <span className="chip-val">
                {
                  filteredAttendance.length
                }
              </span>

            </div>


            {/* PRESENT */}

            <div className="ve-chip">

              <span
                className="chip-dot"
                style={{
                  background:
                    "#059669",
                }}
              ></span>

              Present

              <span className="chip-val">
                {presentCount}
              </span>

            </div>


            {/* ABSENT */}

            <div className="ve-chip">

              <span
                className="chip-dot"
                style={{
                  background:
                    "#dc2626",
                }}
              ></span>

              Absent

              <span className="chip-val">
                {absentCount}
              </span>

            </div>

          </div>


          {/* ==================================================
              TABLE CARD
          ================================================== */}

          <div className="ve-table-card">

            <div className="ve-table-scroll">


              {/* NO DATA */}

              {filteredAttendance.length ===
              0 ? (

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

                      <th>
                        Employee
                      </th>

                      <th>
                        Position
                      </th>

                      <th>
                        Login Time
                      </th>

                      <th>
                        Logout Time
                      </th>

                      <th>
                        Login Location
                      </th>

                      <th>
                        Logout Location
                      </th>

                      <th>
                        Daily Status
                      </th>

                      <th>
                        Attendance
                      </th>

                      <th>
                        Hours Worked
                      </th>

                    </tr>

                  </thead>


                  <tbody>

                    {filteredAttendance.map(
                      (
                        record,
                        index
                      ) => {

                        const status =
                          String(
                            record.attendance_status ||
                            ""
                          ).toLowerCase();


                        const hoursWorked =
                          record.hours_worked ||
                          "N/A";


                        return (

                          <tr
                            key={
                              record.attendance_id ||
                              record.id ||
                              record.user_id ||
                              index
                            }
                          >


                            {/* EMPLOYEE */}

                            <td>
                              {
                                record.username ||
                                "—"
                              }
                            </td>


                            {/* POSITION */}

                            <td>
                              {
                                record.position ||
                                "—"
                              }
                            </td>


                            {/* LOGIN TIME */}

                            <td>
                              {formatDateTime(
                                record.login_time
                              )}
                            </td>


                            {/* LOGOUT TIME */}

                            <td>
                              {formatDateTime(
                                record.logout_time
                              )}
                            </td>


                            {/* LOGIN LOCATION */}

                            <td>
                              {formatLocation(
                                record.login_latitude,
                                record.login_longitude
                              )}
                            </td>


                            {/* LOGOUT LOCATION */}

                            <td>
                              {formatLocation(
                                record.logout_latitude,
                                record.logout_longitude
                              )}
                            </td>


                            {/* DAILY STATUS */}

                            <td>

                              {
                                record.daily_status_submitted
                              ? (

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


                            {/* ATTENDANCE */}

                            <td>

                              {
                                status ===
                                "present"
                              ? (

                                <span className="badge-present">

                                  <i className="fas fa-check-circle"></i>

                                  Present

                                </span>

                              ) : status ===
                                "absent"
                              ? (

                                <span className="badge-absent">

                                  <i className="fas fa-times-circle"></i>

                                  Absent

                                </span>

                              ) : (

                                <span>
                                  {
                                    record.attendance_status ||
                                    "—"
                                  }
                                </span>

                              )}

                            </td>


                            {/* HOURS WORKED */}

                            <td>

                              {
                                hoursWorked ===
                                "N/A"
                              ? (

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


            {/* =================================================
                ROW COUNT
            ================================================== */}

            <div className="ve-row-count">

              Showing{" "}

              {
                filteredAttendance.length
              }{" "}

              record
              {
                filteredAttendance.length !==
                1
                  ? "s"
                  : ""
              }

            </div>

          </div>

        </div>

      </div>

    </section>
  );
}

export default ViewExcel;