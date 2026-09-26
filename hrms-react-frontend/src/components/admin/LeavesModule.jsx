import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  updateLeaveStatus,
} from "../../services/adminService";

import ConfirmLeaveModal from "./ConfirmLeaveModal";

function LeavesModule({
  leaves: leavesData = [],
}) {
  // ============================================================
  // STATE
  // ============================================================

  const [leaves, setLeaves] =
    useState(leavesData);

  const [leaveStatus, setLeaveStatus] =
    useState("all");

  const [leaveType, setLeaveType] =
    useState("all");

  const [leaveSearch, setLeaveSearch] =
    useState("");

  const [selectedLeave, setSelectedLeave] =
    useState(null);

  const [showConfirm, setShowConfirm] =
    useState(false);

  // Loading state for Approve / Reject
  const [isUpdatingLeave, setIsUpdatingLeave] =
    useState(false);

  // ============================================================
  // LOAD LEAVES
  // ============================================================

  useEffect(() => {
    setLeaves(leavesData || []);
  }, [leavesData]);

  // ============================================================
  // FILTER LEAVES
  // ============================================================

  const filteredLeaves = useMemo(() => {
    const search =
      leaveSearch.toLowerCase().trim();

    return leaves.filter((leave) => {
      const matchesStatus =
        leaveStatus === "all" ||
        leave.status === leaveStatus;

      const matchesType =
        leaveType === "all" ||
        leave.leave_type === leaveType;

      const matchesSearch =
        !search ||
        String(leave.username || "")
          .toLowerCase()
          .includes(search) ||
        String(leave.email || "")
          .toLowerCase()
          .includes(search);

      return (
        matchesStatus &&
        matchesType &&
        matchesSearch
      );
    });
  }, [
    leaves,
    leaveStatus,
    leaveType,
    leaveSearch,
  ]);

  // ============================================================
  // STATISTICS
  // ============================================================

  const leaveStats = {
    total: leaves.length,

    pending: leaves.filter(
      (leave) =>
        leave.status === "Pending"
    ).length,

    approved: leaves.filter(
      (leave) =>
        leave.status === "Approved"
    ).length,

    rejected: leaves.filter(
      (leave) =>
        leave.status === "Rejected"
    ).length,
  };

  // ============================================================
  // OPEN CONFIRMATION MODAL
  // ============================================================

  const openLeaveConfirmation = (
    leave,
    status
  ) => {
    // Don't open another action while
    // current action is processing
    if (isUpdatingLeave) {
      return;
    }

    setSelectedLeave({
      ...leave,

      newStatus: status,

      remarks:
        leave.remarks || "",
    });

    setShowConfirm(true);
  };

  // ============================================================
  // CLOSE CONFIRMATION MODAL
  // ============================================================

  const closeConfirm = () => {
    // Don't close while API request
    // is processing
    if (isUpdatingLeave) {
      return;
    }

    setShowConfirm(false);

    setSelectedLeave(null);
  };

  // ============================================================
  // REMARKS CHANGE
  // ============================================================

  const handleRemarksChange =
    (remarks) => {
      setSelectedLeave((prev) => {
        if (!prev) {
          return null;
        }

        return {
          ...prev,
          remarks,
        };
      });
    };

  // ============================================================
  // CONFIRM APPROVE / REJECT
  // ============================================================

  const confirmLeaveAction =
    async () => {
      // Prevent duplicate clicks
      if (
        !selectedLeave ||
        isUpdatingLeave
      ) {
        return;
      }

      // Start loading
      setIsUpdatingLeave(true);

      try {
        console.log(
          "Updating leave:",
          selectedLeave
        );

        const result =
          await updateLeaveStatus(
            selectedLeave.id,
            selectedLeave.newStatus,
            selectedLeave.remarks || ""
          );

        console.log(
          "Leave update response:",
          result
        );

        if (!result?.success) {
          throw new Error(
            result?.message ||
              "Failed to update leave status"
          );
        }

        // ======================================================
        // UPDATE TABLE IMMEDIATELY
        // ======================================================

        setLeaves((prev) =>
          prev.map((leave) =>
            leave.id === selectedLeave.id
              ? {
                  ...leave,

                  status:
                    selectedLeave.newStatus,

                  remarks:
                    selectedLeave.remarks ||
                    "",
                }
              : leave
          )
        );

        const status =
          selectedLeave.newStatus;

        // Close modal
        setShowConfirm(false);

        setSelectedLeave(null);

        // Stop loading
        setIsUpdatingLeave(false);

        alert(
          `Leave ${status.toLowerCase()} successfully.`
        );

      } catch (error) {
        console.error(
          "Leave update error:",
          error
        );

        // Stop loading
        setIsUpdatingLeave(false);

        alert(
          error?.message ||
            "Failed to update leave."
        );
      }
    };

  // ============================================================
  // EXPORT EMPLOYEE LEAVES
  // ============================================================

  const exportEmployeeLeaves = (
    username,
    email
  ) => {
    const employeeLeaves =
      leaves.filter(
        (leave) =>
          leave.username === username &&
          leave.email === email
      );

    if (
      employeeLeaves.length === 0
    ) {
      alert(
        "No leave records found for this employee."
      );

      return;
    }

    const headers = [
      "Employee",
      "Email",
      "Leave Type",
      "From Date",
      "To Date",
      "Total Days",
      "Status",
      "Reason",
      "Admin Remarks",
    ];

    const rows =
      employeeLeaves.map(
        (leave) => [
          leave.username || "",
          leave.email || "",
          leave.leave_type || "",
          leave.start_date || "",
          leave.end_date || "",
          leave.total_days || "",
          leave.status || "",
          leave.reason || "",
          leave.remarks || "",
        ]
      );

    const escapeCSV = (value) => {
      const text =
        String(value ?? "");

      if (
        text.includes(",") ||
        text.includes('"') ||
        text.includes("\n")
      ) {
        return `"${text.replace(
          /"/g,
          '""'
        )}"`;
      }

      return text;
    };

    const csvContent = [
      headers
        .map(escapeCSV)
        .join(","),

      ...rows.map((row) =>
        row
          .map(escapeCSV)
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob(
      [csvContent],
      {
        type:
          "text/csv;charset=utf-8;",
      }
    );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;

    link.download =
      `${username}_leave_records.csv`;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  // ============================================================
  // GET EMPLOYEE INITIAL
  // ============================================================

  const getInitial = (username) => {
    return String(username || "U")
      .charAt(0)
      .toUpperCase();
  };

  // ============================================================
  // RETURN
  // ============================================================

  return (
    <section
      className="content-section active"
      id="manage-leaves"
    >

      <div className="lv-body">

        {/* ====================================================
            PAGE HEADING
        ==================================================== */}

        <div className="leave-page-heading">

          <div>

            <h2>
              Manage Leaves
            </h2>

            <p>
              Review and manage employee
              leave requests
            </p>

          </div>

        </div>


        {/* ====================================================
            STATISTICS
        ==================================================== */}

        <div className="stats-row">

          {/* TOTAL */}

          <button
            type="button"
            className={`stat-card total ${
              leaveStatus === "all"
                ? "stat-card-active"
                : ""
            }`}
            onClick={() =>
              setLeaveStatus("all")
            }
          >

            <div className="stat-icon">
              <i className="fas fa-layer-group" />
            </div>

            <div className="stat-content">

              <div className="stat-label">
                TOTAL REQUESTS
              </div>

              <div className="stat-value">
                {leaveStats.total}
              </div>

            </div>

          </button>


          {/* PENDING */}

          <button
            type="button"
            className={`stat-card pending ${
              leaveStatus === "Pending"
                ? "stat-card-active"
                : ""
            }`}
            onClick={() =>
              setLeaveStatus("Pending")
            }
          >

            <div className="stat-icon">
              <i className="fas fa-hourglass-half" />
            </div>

            <div className="stat-content">

              <div className="stat-label">
                PENDING
              </div>

              <div className="stat-value">
                {leaveStats.pending}
              </div>

            </div>

          </button>


          {/* APPROVED */}

          <button
            type="button"
            className={`stat-card approved ${
              leaveStatus === "Approved"
                ? "stat-card-active"
                : ""
            }`}
            onClick={() =>
              setLeaveStatus("Approved")
            }
          >

            <div className="stat-icon">
              <i className="fas fa-check-circle" />
            </div>

            <div className="stat-content">

              <div className="stat-label">
                APPROVED
              </div>

              <div className="stat-value">
                {leaveStats.approved}
              </div>

            </div>

          </button>


          {/* REJECTED */}

          <button
            type="button"
            className={`stat-card rejected ${
              leaveStatus === "Rejected"
                ? "stat-card-active"
                : ""
            }`}
            onClick={() =>
              setLeaveStatus("Rejected")
            }
          >

            <div className="stat-icon">
              <i className="fas fa-times-circle" />
            </div>

            <div className="stat-content">

              <div className="stat-label">
                REJECTED
              </div>

              <div className="stat-value">
                {leaveStats.rejected}
              </div>

            </div>

          </button>

        </div>


        {/* ====================================================
            FILTER BAR
        ==================================================== */}

        <div className="filter-bar">

          <div className="filter-left">

            {/* STATUS */}

            <div className="filter-control">

              <i className="fas fa-filter" />

              <select
                className="filter-select"
                value={leaveStatus}
                onChange={(e) =>
                  setLeaveStatus(
                    e.target.value
                  )
                }
              >

                <option value="all">
                  All Statuses
                </option>

                <option value="Pending">
                  Pending
                </option>

                <option value="Approved">
                  Approved
                </option>

                <option value="Rejected">
                  Rejected
                </option>

              </select>

            </div>


            {/* LEAVE TYPE */}

            <div className="filter-control">

              <i className="fas fa-calendar-check" />

              <select
                className="filter-select"
                value={leaveType}
                onChange={(e) =>
                  setLeaveType(
                    e.target.value
                  )
                }
              >

                <option value="all">
                  All Leave Types
                </option>

                <option value="Paid Leave">
                  Paid Leave
                </option>

                <option value="Sick Leave">
                  Sick Leave
                </option>

                <option value="Emergency Leave">
                  Emergency Leave
                </option>

              </select>

            </div>


            {/* SEARCH */}

            <div className="leave-search-box">

              <i className="fas fa-search" />

              <input
                type="text"
                placeholder="Search employee name or email..."
                value={leaveSearch}
                onChange={(e) =>
                  setLeaveSearch(
                    e.target.value
                  )
                }
              />

              {leaveSearch && (
                <button
                  type="button"
                  className="clear-search"
                  onClick={() =>
                    setLeaveSearch("")
                  }
                >
                  <i className="fas fa-times" />
                </button>
              )}

            </div>

          </div>


          <div className="row-count">
            {filteredLeaves.length} records
          </div>

        </div>


        {/* ====================================================
            TABLE
        ==================================================== */}

        <div className="table-card">

          {filteredLeaves.length > 0 ? (

            <div className="table-responsive">

              <table id="leavesTable">

                <colgroup>

                  <col className="col-number" />

                  <col className="col-employee" />

                  <col className="col-type" />

                  <col className="col-date" />

                  <col className="col-date" />

                  <col className="col-days" />

                  <col className="col-status" />

                  <col className="col-reason" />

                  <col className="col-remarks" />

                  <col className="col-actions" />

                </colgroup>


                <thead>

                  <tr>

                    <th>
                      #
                    </th>

                    <th>
                      Employee
                    </th>

                    <th>
                      Leave Type
                    </th>

                    <th>
                      From
                    </th>

                    <th>
                      To
                    </th>

                    <th>
                      Days
                    </th>

                    <th>
                      Status
                    </th>

                    <th>
                      Reason
                    </th>

                    <th>
                      Remarks
                    </th>

                    <th>
                      Actions
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {filteredLeaves.map(
                    (leave, index) => (

                      <tr
                        key={
                          leave.id ||
                          index
                        }
                      >

                        {/* NUMBER */}

                        <td className="number-cell">
                          {index + 1}
                        </td>


                        {/* EMPLOYEE */}

                        <td>

                          <div className="employee-cell">

                            <div className="employee-avatar">
                              {getInitial(
                                leave.username
                              )}
                            </div>

                            <div className="employee-info">

                              <div className="emp-name">
                                {leave.username ||
                                  "—"}
                              </div>

                              <div className="emp-email">
                                {leave.email ||
                                  "—"}
                              </div>

                            </div>

                          </div>

                        </td>


                        {/* LEAVE TYPE */}

                        <td>

                          <span
                            className={`lt-pill ${
                              leave.leave_type ===
                              "Sick Leave"
                                ? "lt-sick"
                                : leave.leave_type ===
                                  "Paid Leave"
                                ? "lt-paid"
                                : "lt-emergency"
                            }`}
                          >
                            {leave.leave_type ||
                              "—"}
                          </span>

                        </td>


                        {/* FROM */}

                        <td className="date-cell">
                          {leave.start_date ||
                            "—"}
                        </td>


                        {/* TO */}

                        <td className="date-cell">
                          {leave.end_date ||
                            "—"}
                        </td>


                        {/* DAYS */}

                        <td className="days-cell">
                          {leave.total_days ||
                            "—"}
                        </td>


                        {/* STATUS */}

                        <td>

                          <span
                            className={`badge-status ${
                              leave.status ===
                              "Approved"
                                ? "badge-approved"
                                : leave.status ===
                                  "Rejected"
                                ? "badge-rejected"
                                : "badge-pending"
                            }`}
                          >
                            {leave.status ||
                              "Pending"}
                          </span>

                        </td>


                        {/* EMPLOYEE REASON */}

                        <td className="leave-reason">

                          {leave.reason ? (

                            <div
                              className="reason-preview"
                              title={
                                leave.reason
                              }
                            >
                              {leave.reason}
                            </div>

                          ) : (

                            <span className="reason-empty">
                              —
                            </span>

                          )}

                        </td>


                        {/* ADMIN REMARKS */}

                        <td className="leave-remarks">

                          {leave.remarks ? (

                            <div
                              className="remarks-preview"
                              title={
                                leave.remarks
                              }
                            >
                              {leave.remarks}
                            </div>

                          ) : (

                            <span className="remarks-empty">
                              —
                            </span>

                          )}

                        </td>


                        {/* ACTIONS */}

                        <td className="leave-actions-column">

                          <div className="actions-cell">

                            {leave.status ===
                            "Pending" ? (

                              <div className="leave-action-buttons">

                                <button
                                  type="button"
                                  className="leave-action-btn approve-btn"
                                  onClick={() =>
                                    openLeaveConfirmation(
                                      leave,
                                      "Approved"
                                    )
                                  }
                                  disabled={
                                    isUpdatingLeave
                                  }
                                >
                                  <i className="fas fa-check" />

                                  <span>
                                    Approve
                                  </span>

                                </button>


                                <button
                                  type="button"
                                  className="leave-action-btn reject-btn"
                                  onClick={() =>
                                    openLeaveConfirmation(
                                      leave,
                                      "Rejected"
                                    )
                                  }
                                  disabled={
                                    isUpdatingLeave
                                  }
                                >
                                  <i className="fas fa-times" />

                                  <span>
                                    Reject
                                  </span>

                                </button>

                              </div>

                            ) : (

                              <div className="no-action-text">
                                No action
                              </div>

                            )}


                            {/* CSV */}

                            <button
                              type="button"
                              className="employee-csv-btn"
                              onClick={() =>
                                exportEmployeeLeaves(
                                  leave.username,
                                  leave.email
                                )
                              }
                            >

                              <i className="fas fa-download" />

                              <span>
                                Download CSV
                              </span>

                            </button>

                          </div>

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          ) : (

            <div className="empty-state">

              <div className="empty-icon">
                <i className="fas fa-inbox" />
              </div>

              <h4>
                No leave requests found
              </h4>

              <p>
                Try changing your filters or search.
              </p>

            </div>

          )}

        </div>

      </div>


      {/* ======================================================
          CONFIRM LEAVE MODAL
      ======================================================= */}

      <ConfirmLeaveModal
        show={showConfirm}
        selectedLeave={selectedLeave}
        onCancel={closeConfirm}
        onConfirm={confirmLeaveAction}
        onRemarksChange={
          handleRemarksChange
        }
        isUpdating={
          isUpdatingLeave
        }
      />

    </section>
  );
}

export default LeavesModule;