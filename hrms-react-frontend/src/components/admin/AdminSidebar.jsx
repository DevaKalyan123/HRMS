import { useEffect, useState } from "react";

import { updateAdminProfile } from "../../services/adminService";

import EditAdminProfileModal from "./EditAdminProfileModal";


function AdminSidebar({
  activeSection = "attendance",
  onSectionChange = () => {},
  showSidebar = false,
  setShowSidebar = () => {},
  adminProfile: adminProfileProp,
  profileImage = "",
  onEditProfile,
  onNewUser,
  onLogout,
}) {

  // ============================================================
  // STATE
  // ============================================================

  const [
    localAdminProfile,
    setLocalAdminProfile,
  ] = useState(null);


  const [
    showEditProfile,
    setShowEditProfile,
  ] = useState(false);


  const [
    adminEmail,
    setAdminEmail,
  ] = useState("");


  const [
    adminFaceImage,
    setAdminFaceImage,
  ] = useState(null);


  // ============================================================
  // UPDATE PROFILE FROM PARENT
  // ============================================================

  useEffect(() => {

    if (adminProfileProp) {

      setLocalAdminProfile(
        adminProfileProp
      );

    }

  }, [adminProfileProp]);


  // ============================================================
  // SAFE ADMIN PROFILE
  // ============================================================

  const adminProfile =
    adminProfileProp ||
    localAdminProfile ||
    {};


  // ============================================================
  // NAVIGATION
  // ============================================================

  const handleNavigation = (section) => {

    onSectionChange(section);

    if (
      typeof setShowSidebar === "function"
    ) {

      setShowSidebar(false);

    }

  };


  // ============================================================
  // EDIT PROFILE
  // ============================================================

  const openEditProfile = () => {

    if (
      typeof onEditProfile === "function"
    ) {

      onEditProfile();

      return;

    }


    setAdminEmail(
      adminProfile?.email || ""
    );


    setAdminFaceImage(null);


    setShowEditProfile(true);

  };


  const closeEditProfile = () => {

    setShowEditProfile(false);

    setAdminFaceImage(null);

  };


  // ============================================================
  // SAVE ADMIN PROFILE
  // ============================================================

  const handleUpdateAdminProfile = async () => {

    try {

      const result =
        await updateAdminProfile(
          adminEmail.trim(),
          adminFaceImage
        );


      if (!result?.success) {

        throw new Error(
          result?.message ||
          "Failed to update admin profile"
        );

      }


      setLocalAdminProfile(
        (prev) => ({
          ...(prev || {}),
          ...(result?.adminProfile || {}),
          email:
            result?.adminProfile?.email ||
            adminEmail.trim(),
          face_image_base64:
            result?.adminProfile
              ?.face_image_base64 ||
            prev?.face_image_base64 ||
            null,
        })
      );


      closeEditProfile();


      alert(
        "Admin profile updated successfully."
      );

    } catch (error) {

      console.error(
        "Admin profile update error:",
        error
      );


      alert(
        error.message ||
        "Failed to update admin profile."
      );

    }

  };


  // ============================================================
  // PROFILE IMAGE
  // ============================================================

  const getProfileImage = () => {

    if (profileImage) {

      return profileImage;

    }


    if (
      adminProfile?.face_image_base64
    ) {

      return `data:image/jpeg;base64,${adminProfile.face_image_base64}`;

    }


    return "/default_profile.jpg";

  };


  // ============================================================
  // NEW USER
  // ============================================================

  const handleNewUserClick = () => {

    if (
      typeof onNewUser === "function"
    ) {

      onNewUser();

      return;

    }


    window.location.href = "/register";

  };


  // ============================================================
  // LOGOUT
  // ============================================================

  const handleLogoutClick = () => {

    if (
      typeof onLogout === "function"
    ) {

      onLogout();

      return;

    }


    window.location.href = "/logout";

  };


  // ============================================================
  // RENDER
  // ============================================================

  return (

    <>

      {/* ======================================================
          MOBILE OVERLAY
      ======================================================= */}

      {showSidebar && (

        <div
          className="sidebar-overlay"
          onClick={() =>
            setShowSidebar(false)
          }
        />

      )}


      {/* ======================================================
          SIDEBAR
      ======================================================= */}

      <nav
        className={`sidebar-pc ${
          showSidebar ? "show" : ""
        }`}
        id="sidebar"
      >

        {/* ====================================================
            HEADER
        ===================================================== */}

        <div className="offcanvas-header">

          <h2
            className="offcanvas-title"
            id="sidebarLabel"
          >
            Admin
            <br />
            Dashboard
          </h2>


          <button
            type="button"
            className="btn-close btn-close-white"
            aria-label="Close"
            onClick={() =>
              setShowSidebar(false)
            }
          >
            ×
          </button>

        </div>


        {/* ====================================================
            BODY
        ===================================================== */}

        <div className="offcanvas-body">


          {/* ==================================================
              PROFILE
          =================================================== */}

          <div className="profile-section">

            <div className="profile-circle">

              <img
                id="admin-profile-pic"
                src={getProfileImage()}
                alt="Admin Profile"
                onError={(event) => {
                  event.currentTarget.src =
                    "/default_profile.jpg";
                }}
              />

            </div>


            <div className="profile-info">

              <p>
                <strong>Admin:</strong>{" "}
                {adminProfile?.username || ""}
              </p>


              <p>

                <strong>Email:</strong>{" "}

                <span id="admin-email-display">

                  {adminProfile?.email || ""}

                </span>

              </p>


              <button
                id="admin-edit-profile-btn"
                type="button"
                onClick={openEditProfile}
              >
                Edit Profile
              </button>

            </div>

          </div>


          {/* ==================================================
              NAVIGATION
          =================================================== */}

          <ul className="sidebar-nav">


            {/* ATTENDANCE */}

            <li
              className={
                activeSection === "attendance"
                  ? "active"
                  : ""
              }
            >

              <button
                type="button"
                className="sidebar-link-button"
                onClick={() =>
                  handleNavigation(
                    "attendance"
                  )
                }
              >

                <i className="fas fa-calendar-check" />

                <span>
                  Attendance
                </span>

              </button>

            </li>


            {/* TASKS */}

            <li
              className={
                activeSection === "tasks"
                  ? "active"
                  : ""
              }
            >

              <button
                type="button"
                className="sidebar-link-button"
                onClick={() =>
                  handleNavigation(
                    "tasks"
                  )
                }
              >

                <i className="fas fa-tasks" />

                <span>
                  Manage Tasks
                </span>

              </button>

            </li>


            {/* USERS */}

            <li
              className={
                activeSection === "users"
                  ? "active"
                  : ""
              }
            >

              <button
                type="button"
                className="sidebar-link-button"
                onClick={() =>
                  handleNavigation(
                    "users"
                  )
                }
              >

                <i className="fas fa-users" />

                <span>
                  Manage Users
                </span>

              </button>

            </li>


            {/* ROTA */}

            <li
              className={
                activeSection === "rota"
                  ? "active"
                  : ""
              }
            >

              <button
                type="button"
                className="sidebar-link-button"
                onClick={() =>
                  handleNavigation(
                    "rota"
                  )
                }
              >

                <i className="fas fa-calendar-alt" />

                <span>
                  Upload Rota
                </span>

              </button>

            </li>


            {/* HOLIDAY */}

            <li
              className={
                activeSection === "holiday"
                  ? "active"
                  : ""
              }
            >

              <button
                type="button"
                className="sidebar-link-button"
                onClick={() =>
                  handleNavigation(
                    "holiday"
                  )
                }
              >

                <i className="fas fa-umbrella-beach" />

                <span>
                  Upload Holiday
                </span>

              </button>

            </li>


            {/* LEAVES */}

            <li
              className={
                activeSection === "manage-leaves"
                  ? "active"
                  : ""
              }
            >

              <button
                type="button"
                className="sidebar-link-button"
                onClick={() =>
                  handleNavigation(
                    "manage-leaves"
                  )
                }
              >

                <i className="fas fa-plane-departure" />

                <span>
                  Manage Leaves
                </span>

              </button>

            </li>


            {/* NOTIFICATIONS */}

            <li
              className={
                activeSection === "notifications"
                  ? "active"
                  : ""
              }
            >

              <button
                type="button"
                className="sidebar-link-button"
                onClick={() =>
                  handleNavigation(
                    "notifications"
                  )
                }
              >

                <i className="fas fa-bell" />

                <span>
                  Notifications
                </span>

              </button>

            </li>


            {/* NEW USER */}

            <li>

              <button
                type="button"
                className="sidebar-link-button"
                onClick={
                  handleNewUserClick
                }
              >

                <i className="fas fa-user-plus" />

                <span>
                  New User
                </span>

              </button>

            </li>


            {/* EXPORT DATA */}

            <li
              className={
                activeSection === "export"
                  ? "active"
                  : ""
              }
            >

              <button
                type="button"
                className="sidebar-link-button"
                onClick={() =>
                  handleNavigation(
                    "export"
                  )
                }
              >

                <i className="fas fa-file-export" />

                <span>
                  Export Data
                </span>

              </button>

            </li>


            {/* LOGOUT */}

            <li>

              <button
                type="button"
                className="sidebar-link-button"
                onClick={
                  handleLogoutClick
                }
              >

                <i className="fas fa-sign-out-alt" />

                <span>
                  Logout
                </span>

              </button>

            </li>

          </ul>

        </div>

      </nav>


      {/* ======================================================
          EDIT ADMIN PROFILE MODAL
      ======================================================= */}

      <EditAdminProfileModal
        show={showEditProfile}
        email={adminEmail}
        faceImage={adminFaceImage}
        setEmail={setAdminEmail}
        setFaceImage={setAdminFaceImage}
        onClose={closeEditProfile}
        onSave={handleUpdateAdminProfile}
      />

    </>

  );

}


export default AdminSidebar;