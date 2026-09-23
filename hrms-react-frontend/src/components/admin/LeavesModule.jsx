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

  useEffect(() => {
    setLeaves(
      leavesData || []
    );
  }, [leavesData]);

  const filteredLeaves =
    useMemo(() => {
      const search =
        leaveSearch
          .toLowerCase()
          .trim();

      return leaves.filter(
        (leave) => {
          const matchesStatus =
            leaveStatus ===
              "all" ||
            leave.status ===
              leaveStatus;

          const matchesType =
            leaveType === "all" ||
            leave.leave_type ===
              leaveType;

          const matchesSearch =
            !search ||
            String(
              leave.username ||
                ""
            )
              .toLowerCase()
              .includes(search) ||
            String(
              leave.email || ""
            )
              .toLowerCase()
              .includes(search);

          return (
            matchesStatus &&
            matchesType &&
            matchesSearch
          );
        }
      );
    }, [
      leaves,
      leaveStatus,
      leaveType,
      leaveSearch,
    ]);

  const leaveStats = {
    total: leaves.length,

    pending: leaves.filter(
      (leave) =>
        leave.status ===
        "Pending"
    ).length,

    approved: leaves.filter(
      (leave) =>
        leave.status ===
        "Approved"
    ).length,

    rejected: leaves.filter(
      (leave) =>
        leave.status ===
        "Rejected"
    ).length,
  };

  const openLeaveConfirmation = (
    leave,
    status
  ) => {
    setSelectedLeave({
      ...leave,
      newStatus: status,
      remarks:
        leave.remarks || "",
    });

    setShowConfirm(true);
  };

  const closeConfirm = () => {
    setShowConfirm(false);
    setSelectedLeave(null);
  };

  const handleRemarksChange =
    (remarks) => {
      setSelectedLeave(
        (prev) => {
          if (!prev) {
            return null;
          }

          return {
            ...prev,
            remarks,
          };
        }
      );
    };

  const confirmLeaveAction =
    async () => {
      if (!selectedLeave) {
        return;
      }

      try {
        const result =
          await updateLeaveStatus(
            selectedLeave.id,
            selectedLeave.newStatus,
            selectedLeave.remarks ||
              ""
          );

        if (!result.success) {
          throw new Error(
            result.message ||
              "Failed to update leave status"
          );
        }

        setLeaves((prev) =>
          prev.map((leave) =>
            leave.id ===
            selectedLeave.id
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

        closeConfirm();

        alert(
          `Leave ${status.toLowerCase()} successfully.`
        );
      } catch (error) {
        console.error(
          "Leave update error:",
          error
        );

        alert(
          error.message ||
            "Failed to update leave."
        );
      }
    };

  const exportEmployeeLeaves = (
  username,
  email
) => {
  const employeeLeaves = leaves.filter(
    (leave) =>
      leave.username === username &&
      leave.email === email
  );

  if (employeeLeaves.length === 0) {
    alert("No leave records found for this employee.");
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
    "Remarks",
  ];

  const rows = employeeLeaves.map((leave) => [
    leave.username || "",
    leave.email || "",
    leave.leave_type || "",
    leave.start_date || "",
    leave.end_date || "",
    leave.total_days || "",
    leave.status || "",
    leave.remarks || "",
  ]);

  const escapeCSV = (value) => {
    const text = String(value ?? "");

    if (
      text.includes(",") ||
      text.includes('"') ||
      text.includes("\n")
    ) {
      return `"${text.replace(/"/g, '""')}"`;
    }

    return text;
  };

  const csvContent = [
    headers.map(escapeCSV).join(","),
    ...rows.map((row) =>
      row.map(escapeCSV).join(",")
    ),
  ].join("\n");

  const blob = new Blob(
    [csvContent],
    {
      type: "text/csv;charset=utf-8;",
    }
  );

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `${username}_leave_records.csv`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};

  return (
    <section
      className="content-section active"
      id="manage-leaves"
    >
      <div className="lv-body">

        <div className="stats-row">

          <div className="stat-card total">
            <div className="stat-icon">
              <i className="fas fa-layer-group" />
            </div>

            <div className="stat-label">
              TOTAL REQUESTS
            </div>

            <div className="stat-value">
              {leaveStats.total}
            </div>
          </div>

          <div className="stat-card pending">
            <div className="stat-icon">
              <i className="fas fa-hourglass-half" />
            </div>

            <div className="stat-label">
              PENDING
            </div>

            <div className="stat-value">
              {leaveStats.pending}
            </div>
          </div>

          <div className="stat-card approved">
            <div className="stat-icon">
              <i className="fas fa-check-circle" />
            </div>

            <div className="stat-label">
              APPROVED
            </div>

            <div className="stat-value">
              {leaveStats.approved}
            </div>
          </div>

          <div className="stat-card rejected">
            <div className="stat-icon">
              <i className="fas fa-times-circle" />
            </div>

            <div className="stat-label">
              REJECTED
            </div>

            <div className="stat-value">
              {leaveStats.rejected}
            </div>
          </div>

        </div>

        <div className="filter-bar">

          <i className="fas fa-sliders-h filter-icon" />

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

          <input
            type="text"
            className="filter-input"
            placeholder="Search employee..."
            value={leaveSearch}
            onChange={(e) =>
              setLeaveSearch(
                e.target.value
              )
            }
          />

          <span className="row-count">
            {
              filteredLeaves.length
            }{" "}
            records
          </span>

        </div>

        <div className="table-card">

          {filteredLeaves.length >
          0 ? (
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

                  {filteredLeaves.map(
                    (leave, index) => (
                      <tr
                        key={
                          leave.id ||
                          index
                        }
                      >

                        <td>
                          {index + 1}
                        </td>

                        <td>
                          <div className="employee-cell">

                            <div className="avatar">
                              {String(
                                leave.username ||
                                  "U"
                              )
                                .charAt(0)
                                .toUpperCase()}
                            </div>

                            <div>

                              <div className="emp-name">
                                {
                                  leave.username
                                }
                              </div>

                              <div className="emp-email">
                                {
                                  leave.email
                                }
                              </div>

                            </div>

                          </div>
                        </td>

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
                            {
                              leave.leave_type
                            }
                          </span>
                        </td>

                        <td>
                          {
                            leave.start_date
                          }
                        </td>

                        <td>
                          {
                            leave.end_date
                          }
                        </td>

                        <td className="val-days">
                          {
                            leave.total_days ||
                            "—"
                          }
                        </td>

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
                            {
                              leave.status
                            }
                          </span>
                        </td>

                        <td className="leave-remarks">
                          {
                            leave.remarks ||
                            "—"
                          }
                        </td>

                        <td>

                          <div className="actions-cell">

                            {leave.status ===
                            "Pending" ? (
                              <>
                                <button
                                  type="button"
                                  className="btn-approve leave-action-btn"
                                  onClick={() =>
                                    openLeaveConfirmation(
                                      leave,
                                      "Approved"
                                    )
                                  }
                                >
                                  <i className="fas fa-check" />{" "}
                                  Approve
                                </button>

                                <button
                                  type="button"
                                  className="btn-reject leave-action-btn"
                                  onClick={() =>
                                    openLeaveConfirmation(
                                      leave,
                                      "Rejected"
                                    )
                                  }
                                >
                                  <i className="fas fa-times" />{" "}
                                  Reject
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
                                  leave.email
                                )
                              }
                            >
                              <i className="fas fa-download" />{" "}
                              CSV
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

              <i className="fas fa-inbox" />

              <p>
                No leave requests
                found.
              </p>

            </div>
          )}

        </div>

      </div>

      <ConfirmLeaveModal
        show={showConfirm}
        selectedLeave={
          selectedLeave
        }
        onCancel={closeConfirm}
        onConfirm={
          confirmLeaveAction
        }
        onRemarksChange={
          handleRemarksChange
        }
      />

    </section>
  );
}

export default LeavesModule;