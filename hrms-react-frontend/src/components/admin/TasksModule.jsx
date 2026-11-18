
import { useEffect, useMemo, useState } from "react";

import {
    approveTask,
    rejectTask,
    assignTask,
    viewTaskDocument
} from "../../services/adminService";
function TasksModule({ tasks: tasksData = [], users = [] }) {
  const [assignForm, setAssignForm] = useState({
    employee_id: "",
    project_name: "",
    task_name: "",
    from_date: "",
    to_date: "",
  });

  const [assigning, setAssigning] = useState(false);
  const [tasks, setTasks] = useState(tasksData);
  const [taskSearch, setTaskSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    setTasks(tasksData || []);
  }, [tasksData]);

  const projectOptions = useMemo(() => {
    return [
      ...new Set(tasks.map((task) => task.project_name).filter(Boolean)),
    ];
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    const search = taskSearch.toLowerCase().trim();

    return tasks.filter((task) => {
      const matchesSearch =
        !search ||
        String(task.employee_name || "").toLowerCase().includes(search) ||
        String(task.project_name || "").toLowerCase().includes(search) ||
        String(task.task_name || "").toLowerCase().includes(search);

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

  const updateAssignForm = (field, value) => {
    setAssignForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAssignTask = async (e) => {
    e.preventDefault();

    if (
      !assignForm.employee_id ||
      !assignForm.project_name.trim() ||
      !assignForm.task_name.trim() ||
      !assignForm.from_date ||
      !assignForm.to_date
    ) {
      alert("Please fill in all task details.");
      return;
    }

    if (assignForm.to_date < assignForm.from_date) {
      alert("To Date cannot be earlier than From Date.");
      return;
    }

    try {
      setAssigning(true);

      const result = await assignTask(assignForm);

      alert(result.message || "Task assigned successfully.");

      setAssignForm({
        employee_id: "",
        project_name: "",
        task_name: "",
        from_date: "",
        to_date: "",
      });

      window.location.reload();
    } catch (error) {
      console.error("Assign task error:", error);
      alert(error.message || "Failed to assign task.");
    } finally {
      setAssigning(false);
    }
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
            ? { ...item, status: "Approved" }
            : item
        )
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
        "Reject this task? The employee will be marked Absent and an email will be sent."
      )
    ) {
      return;
    }

    try {
      await rejectTask(task.id);

      setTasks((prev) =>
        prev.map((item) =>
          item.id === task.id
            ? { ...item, status: "Rejected" }
            : item
        )
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
          {/* Header and statistics */}
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
                <span className="admin-task-stat-val">
                  {taskStats.total}
                </span>
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
                <span className="admin-task-stat-val">
                  {taskStats.pending}
                </span>
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

          {/* Assign new task form */}
          <form
            onSubmit={handleAssignTask}
            className="assign-task-form"
          >
            <h3>Assign New Task</h3>

            <div className="assign-task-field">
              <label htmlFor="assign-employee">Employee</label>
              <select
                id="assign-employee"
                value={assignForm.employee_id}
                onChange={(e) =>
                  updateAssignForm("employee_id", e.target.value)
                }
                required
              >
                <option value="">Select Employee</option>
                {users.map((user) => (
  <option key={user.id} value={user.id}>
    {user.username} (ID: {user.id})
  </option>
))}
              </select>
            </div>

            <div className="assign-task-field">
              <label htmlFor="assign-project">Project Name</label>
              <input
                id="assign-project"
                type="text"
                value={assignForm.project_name}
                onChange={(e) =>
                  updateAssignForm("project_name", e.target.value)
                }
                placeholder="Enter project name"
                required
              />
            </div>

            <div className="assign-task-field">
              <label htmlFor="assign-task">Task Name</label>
              <input
                id="assign-task"
                type="text"
                value={assignForm.task_name}
                onChange={(e) =>
                  updateAssignForm("task_name", e.target.value)
                }
                placeholder="Enter task name"
                required
              />
            </div>

            <div className="assign-task-field">
              <label htmlFor="assign-from-date">From Date</label>
              <input
                id="assign-from-date"
                type="date"
                value={assignForm.from_date}
                onChange={(e) =>
                  updateAssignForm("from_date", e.target.value)
                }
                required
              />
            </div>

            <div className="assign-task-field">
              <label htmlFor="assign-to-date">To Date</label>
              <input
                id="assign-to-date"
                type="date"
                min={assignForm.from_date || undefined}
                value={assignForm.to_date}
                onChange={(e) =>
                  updateAssignForm("to_date", e.target.value)
                }
                required
              />
            </div>

            <div className="assign-task-field assign-task-submit">
              <label>&nbsp;</label>
              <button type="submit" disabled={assigning}>
                {assigning ? "Assigning..." : "Assign Task"}
              </button>
            </div>
          </form>

          {/* Search and project filter */}
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

          {/* Tasks table */}
          <div className="admin-tasks-table-wrap">
            <div className="table-responsive">
              <table className="admin-tasks-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Employee</th>
                    <th>Project</th>
                   <th>Task</th>
<th>Completion Description</th>
<th>Time Period</th>
<th>Submitted</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredTasks.length === 0 ? (
                    <tr>
                      <td colSpan="9" style={{ textAlign: "center" }}>
                        No tasks found.
                      </td>
                    </tr>
                  ) : (
                    filteredTasks.map((task, index) => (
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
    <div className="at-completion-description">
        {task.completion_description
            ? task.completion_description
            : "Not submitted yet"}
    </div>
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
    <div className="at-action-btns">

        {/* View uploaded document */}
        {task.document_path && (
            <button
    type="button"
    className="at-btn-view-document"
    onClick={() => viewTaskDocument(task.id)}
>
    <i className="fas fa-file-alt"></i>
    View Document
</button>
        )}

        {/* Approve and Reject */}
        {task.status === "Pending" ? (
            <>
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
            </>
        ) : (
            <span className="at-done-text">Done</span>
        )}

    </div>
</td>
                      </tr>
                    ))
                  )}
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
