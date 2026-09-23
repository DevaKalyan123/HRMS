import { useEffect, useMemo, useState } from "react";

import { approveTask, rejectTask } from "../../services/adminService";

function TasksModule({ tasks: tasksData = [] }) {
  const [tasks, setTasks] = useState(tasksData);

  const [taskSearch, setTaskSearch] = useState("");

  const [projectFilter, setProjectFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    setTasks(tasksData || []);
  }, [tasksData]);

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

      const matchesStatus =
        statusFilter === "all" || task.status === statusFilter;

      return matchesSearch && matchesProject && matchesStatus;
    });
  }, [tasks, taskSearch, projectFilter, statusFilter]);
  const taskStats = {
    total: tasks.length,

    approved: tasks.filter((task) => task.status === "Approved").length,

    pending: tasks.filter((task) => task.status === "Pending").length,

    rejected: tasks.filter((task) => task.status === "Rejected").length,
  };

  const handleApproveTask = async (task) => {
    if (!window.confirm("Approve this task?")) {
      return;
    }

    try {
      await approveTask(task.id);

      setTasks((prev) =>
        prev.map((item) =>
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

  const handleRejectTask = async (task) => {
    if (
      !window.confirm(
        "Reject this task? The employee will be marked Absent and an email will be sent.",
      )
    ) {
      return;
    }

    try {
      await rejectTask(task.id);

      setTasks((prev) =>
        prev.map((item) =>
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

  return (
    <section className="content-section active" id="tasks">
      <div className="card">
        <div className="admin-tasks-wrapper">
          <div className="admin-tasks-header">
            <div className="admin-tasks-title">
              <i className="fas fa-tasks" />
              <span>Employee Task Management</span>
            </div>

            <div className="admin-task-stats">
              <div
                className={`admin-task-stat ${
                  statusFilter === "all" ? "active" : ""
                }`}
                onClick={() => setStatusFilter("all")}
                style={{ cursor: "pointer" }}
              >
                <span className="admin-task-stat-val">{taskStats.total}</span>

                <span className="admin-task-stat-label">Total</span>
              </div>

              <div
                className={`admin-task-stat at-approved ${
                  statusFilter === "Approved" ? "active" : ""
                }`}
                onClick={() => setStatusFilter("Approved")}
                style={{ cursor: "pointer" }}
              >
                <span className="admin-task-stat-val">
                  {taskStats.approved}
                </span>

                <span className="admin-task-stat-label">Approved</span>
              </div>

              <div
                className={`admin-task-stat at-pending ${
                  statusFilter === "Pending" ? "active" : ""
                }`}
                onClick={() => setStatusFilter("Pending")}
                style={{ cursor: "pointer" }}
              >
                <span className="admin-task-stat-val">{taskStats.pending}</span>

                <span className="admin-task-stat-label">Pending</span>
              </div>

              <div
                className={`admin-task-stat at-rejected ${
                  statusFilter === "Rejected" ? "active" : ""
                }`}
                onClick={() => setStatusFilter("Rejected")}
                style={{ cursor: "pointer" }}
              >
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
                        <div className="at-emp-name">{task.employee_name}</div>

                        <div className="at-emp-id">
                          Employee ID: {task.employee_id}
                        </div>
                      </td>

                      <td>
                        <span className="at-project-tag">
                          <i className="fas fa-folder" /> {task.project_name}
                        </span>
                      </td>

                      <td>
                        <span className="at-task-name" title={task.task_name}>
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
  );
}

export default TasksModule;
