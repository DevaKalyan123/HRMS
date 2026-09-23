import { useEffect, useState } from "react";

import {
  updateUser,
  deleteUser,
} from "../../services/adminService";

function UsersModule({ users: usersData = [] }) {
  const [users, setUsers] = useState(usersData);

  const [showEdit, setShowEdit] = useState(false);

  const [selectedUser, setSelectedUser] = useState(null);

  const [editUsername, setEditUsername] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPosition, setEditPosition] = useState("");
  const [editFaceImage, setEditFaceImage] = useState(null);

  /*
   * Update local users whenever AdminDashboard
   * provides new users data.
   */
  useEffect(() => {
    setUsers(usersData || []);
  }, [usersData]);

  /*
   * Open Edit User modal
   */
  const handleEditUser = (user) => {
    setSelectedUser(user);

    setEditUsername(user.username || "");
    setEditEmail(user.email || "");
    setEditPosition(user.position || "");
    setEditFaceImage(null);

    setShowEdit(true);
  };

  /*
   * Close Edit User modal
   */
  const closeEdit = () => {
    setShowEdit(false);
    setSelectedUser(null);
    setEditFaceImage(null);
  };

  /*
   * Update User
   */
  const handleUpdateUser = async () => {
    if (!selectedUser) {
      return;
    }

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
        editFaceImage
      );

      if (!result.success) {
        throw new Error(
          result.message ||
            "Failed to update user."
        );
      }

      /*
       * Update user in the table immediately
       */
      setUsers((prev) =>
        prev.map((user) =>
          user.id === selectedUser.id
            ? {
                ...user,
                username: editUsername.trim(),
                email: editEmail.trim(),
                position: editPosition.trim(),
                ...(result.user || {}),
              }
            : user
        )
      );

      closeEdit();

      alert("User updated successfully.");
    } catch (error) {
      console.error(
        "Update user error:",
        error
      );

      alert(
        error.message ||
          "Failed to update user."
      );
    }
  };

  /*
   * Delete User
   */
  const handleDeleteUser = async (user) => {
    if (
      !window.confirm(
        `Delete ${user.username}?`
      )
    ) {
      return;
    }

    try {
      const result = await deleteUser(user.id);

      if (!result.success) {
        throw new Error(
          result.message ||
            "Failed to delete user"
        );
      }

      /*
       * Remove user from table immediately
       */
      setUsers((prev) =>
        prev.filter(
          (item) => item.id !== user.id
        )
      );

      alert("User deleted successfully.");
    } catch (error) {
      console.error(
        "Delete user error:",
        error
      );

      alert(
        error.message ||
          "Failed to delete user."
      );
    }
  };

  return (
    <>
      {/* =========================
          USERS SECTION
      ========================== */}
      <section
        className="content-section active"
        id="users"
      >
        <div className="card">

          <h3 className="card-header">
            Manage Users
          </h3>

          <div className="card-body">

            <div className="table-responsive">

              <table
                className="table table-striped"
                id="users-table"
              >

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

                      <td>
                        {user.id}
                      </td>

                      <td>
                        {user.username}
                      </td>

                      <td>
                        {user.email}
                      </td>

                      <td>
                        {user.position}
                      </td>

                      <td>
                        {user.face_image_base64 ? (
                          <img
                            src={`data:image/jpeg;base64,${user.face_image_base64}`}
                            alt="Profile"
                            className="user-profile-img"
                          />
                        ) : (
                          <span>
                            No Image
                          </span>
                        )}
                      </td>

                      <td>

                        <button
                          type="button"
                          className="btn btn-sm btn-primary"
                          onClick={() =>
                            handleEditUser(user)
                          }
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="btn btn-sm btn-danger"
                          onClick={() =>
                            handleDeleteUser(user)
                          }
                        >
                          Delete
                        </button>

                      </td>

                    </tr>
                  ))}
                </tbody>

              </table>

              {users.length === 0 && (
                <p className="text-muted">
                  No users available.
                </p>
              )}

            </div>

          </div>
        </div>
      </section>

      {/* =========================
          EDIT USER MODAL
      ========================== */}
      {showEdit && (
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
                  onClick={closeEdit}
                >
                  ×
                </button>

              </div>

              <div className="modal-body">

                {/* Username */}
                <div className="mb-3">

                  <label className="form-label">
                    Username
                  </label>

                  <input
                    type="text"
                    className="form-control"
                    value={editUsername}
                    onChange={(e) =>
                      setEditUsername(
                        e.target.value
                      )
                    }
                  />

                </div>

                {/* Email */}
                <div className="mb-3">

                  <label className="form-label">
                    Email
                  </label>

                  <input
                    type="email"
                    className="form-control"
                    value={editEmail}
                    onChange={(e) =>
                      setEditEmail(
                        e.target.value
                      )
                    }
                  />

                </div>

                {/* Position */}
                <div className="mb-3">

                  <label className="form-label">
                    Position
                  </label>

                  <input
                    type="text"
                    className="form-control"
                    value={editPosition}
                    onChange={(e) =>
                      setEditPosition(
                        e.target.value
                      )
                    }
                  />

                </div>

                {/* Profile Image */}
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
                        e.target.files?.[0] ||
                          null
                      )
                    }
                  />

                </div>

              </div>

              <div className="modal-footer">

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeEdit}
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
    </>
  );
}

export default UsersModule;