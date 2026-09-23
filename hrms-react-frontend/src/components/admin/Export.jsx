import React from "react";
import "../../styles/export.css";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "";

function Export({
  onSectionChange = () => {},
}) {

  // ============================================================
  // DOWNLOAD ATTENDANCE EXCEL
  // ============================================================

  const handleDownload = () => {
    const btn =
      document.getElementById("downloadBtn");

    if (btn) {
      btn.classList.add("loading");

      setTimeout(() => {
        btn.classList.remove("loading");
      }, 3000);
    }

    // Flask backend export endpoint
    window.location.href =
      `${API_BASE_URL}/admin/export`;
  };


  // ============================================================
  // PREVIEW ATTENDANCE
  // ============================================================

  const handlePreview = () => {
    onSectionChange("view-excel");
  };


  return (
    <section
      className="content-section active"
      id="export"
    >

      <div className="export-page">

        <div className="export-orb"></div>


        {/* ======================================================
            BACK TO ADMIN DASHBOARD
        ======================================================= */}

        <button
          type="button"
          className="back-btn back-btn-fixed"
          onClick={() =>
            onSectionChange("attendance")
          }
        >
          <i className="fas fa-arrow-left"></i>

          Admin Dashboard
        </button>


        {/* ======================================================
            EXPORT CARD
        ======================================================= */}

        <div className="export-card">


          {/* ====================================================
              HEADER
          ===================================================== */}

          <div className="export-header">

            <div className="header-icon">
              <i className="fas fa-file-export"></i>
            </div>


            <div className="header-text">

              <h1>
                Export Attendance
              </h1>

              <p>
                Download or preview employee attendance records
              </p>

            </div>

          </div>


          {/* ====================================================
              STATISTICS
          ===================================================== */}

          <div className="stats-row">


            {/* Excel Format */}

            <div className="stat-pill">

              <span className="stat-val">
                XLS
              </span>

              <span className="stat-lbl">
                Excel Format
              </span>

            </div>


            {/* Employees */}

            <div className="stat-pill">

              <span className="stat-val">

                <i
                  className="fas fa-users"
                  style={{
                    fontSize: "1rem",
                    color: "#059669",
                  }}
                ></i>

              </span>

              <span className="stat-lbl">
                All Employees
              </span>

            </div>


            {/* History */}

            <div className="stat-pill">

              <span className="stat-val">

                <i
                  className="fas fa-database"
                  style={{
                    fontSize: "1rem",
                    color: "#d97706",
                  }}
                ></i>

              </span>

              <span className="stat-lbl">
                Full History
              </span>

            </div>

          </div>


          {/* ====================================================
              ACTIONS
          ===================================================== */}

          <div className="export-actions">


            {/* ==================================================
                DOWNLOAD EXCEL
            ================================================== */}

            <button
              type="button"
              className="action-btn action-primary"
              id="downloadBtn"
              onClick={handleDownload}
            >

              <div className="btn-icon">

                <i className="fas fa-download dl-icon-static"></i>

                <div className="dl-spinner"></div>

              </div>


              <div className="btn-text">

                <div className="btn-title">
                  Download Attendance Excel
                </div>

                <div className="btn-sub">
                  Exports full attendance data as .xlsx file
                </div>

              </div>


              <i className="fas fa-chevron-right btn-arrow"></i>

            </button>


            {/* Divider */}

            <div className="export-divider">
              or
            </div>


            {/* ==================================================
                PREVIEW
            ================================================== */}

            <button
              type="button"
              className="action-btn action-success"
              onClick={handlePreview}
            >

              <div className="btn-icon">

                <i className="fas fa-table"></i>

              </div>


              <div className="btn-text">

                <div className="btn-title">
                  Preview in Browser
                </div>

                <div className="btn-sub">
                  View attendance data as a formatted table
                </div>

              </div>


              <i className="fas fa-chevron-right btn-arrow"></i>

            </button>

          </div>

        </div>

      </div>

    </section>
  );
}

export default Export;