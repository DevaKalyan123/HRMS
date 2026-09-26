import { useEffect, useState } from "react";
import { uploadHoliday } from "../../services/adminService";

function HolidayModule({
  holidayTable: holidayTableData = "",
}) {
  const [holidayTable, setHolidayTable] =
    useState(holidayTableData);

  const [selectedFile, setSelectedFile] =
    useState(null);

  const [uploading, setUploading] =
    useState(false);

  useEffect(() => {
    setHolidayTable(holidayTableData || "");
  }, [holidayTableData]);

  // ============================================================
  // FILE SELECTION
  // ============================================================

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      setSelectedFile(null);
      return;
    }

    const fileName = file.name.toLowerCase();

    const allowedExtensions = [
      ".docx",
      ".xls",
      ".xlsx",
      ".csv",
    ];

    const isAllowed = allowedExtensions.some(
      (extension) => fileName.endsWith(extension)
    );

    if (!isAllowed) {
      alert(
        "Unsupported file format. Please upload a DOCX, XLS, XLSX, or CSV file."
      );

      event.target.value = "";
      setSelectedFile(null);
      return;
    }

    // Explicitly reject PDF
    if (fileName.endsWith(".pdf")) {
      alert(
        "PDF files are not supported for the Holiday List. Please upload a DOCX, XLS, XLSX, or CSV file."
      );

      event.target.value = "";
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  // ============================================================
  // UPLOAD HOLIDAY
  // ============================================================

  const handleHolidayUpload = async (event) => {
    event.preventDefault();

    if (!selectedFile) {
      alert("Please select a holiday list file.");
      return;
    }

    const fileName =
      selectedFile.name.toLowerCase();

    const allowedExtensions = [
      ".docx",
      ".xls",
      ".xlsx",
      ".csv",
    ];

    const isAllowed = allowedExtensions.some(
      (extension) => fileName.endsWith(extension)
    );

    if (!isAllowed) {
      alert(
        "Unsupported file format. Please upload a DOCX, XLS, XLSX, or CSV file."
      );
      return;
    }

    // Extra PDF protection
    if (fileName.endsWith(".pdf")) {
      alert(
        "PDF files are not supported for the Holiday List."
      );
      return;
    }

    try {
      setUploading(true);

      const result =
        await uploadHoliday(selectedFile);

      if (!result?.success) {
        throw new Error(
          result?.message ||
            "Failed to upload holiday list."
        );
      }

      // Update Current Holiday List immediately
      if (result.holiday_table) {
        setHolidayTable(
          result.holiday_table
        );
      }

      // Clear selected file
      setSelectedFile(null);

      const fileInput =
        document.querySelector(
          'input[name="holiday_image"]'
        );

      if (fileInput) {
        fileInput.value = "";
      }

      alert(
        "Holiday list uploaded successfully."
      );
    } catch (error) {
      console.error(
        "Holiday upload error:",
        error
      );

      alert(
        error?.message ||
          "Failed to upload holiday list."
      );
    } finally {
      setUploading(false);
    }
  };

  // ============================================================
  // UI
  // ============================================================

  return (
    <section
      className="content-section active"
      id="holiday"
    >
      <div className="card">

        <h3 className="card-header">
          Upload Holiday List
        </h3>

        <div className="card-body">

          <form
            onSubmit={handleHolidayUpload}
          >

            <div className="mb-3">

              <label
                className="form-label fw-semibold"
                htmlFor="holidayFile"
              >
                <i className="fas fa-file-alt me-1" />
                Select Holiday List
              </label>

              <input
                id="holidayFile"
                type="file"
                name="holiday_image"
                accept=".docx,.xls,.xlsx,.csv"
                className="form-control"
                onChange={handleFileChange}
                required
              />

              <div className="form-text">
                Supported formats:
                {" "}
                .docx, .xls, .xlsx, .csv
              </div>

              {selectedFile && (
                <div className="mt-2">
                  <small className="text-muted">
                    Selected file:{" "}
                    <strong>
                      {selectedFile.name}
                    </strong>
                  </small>
                </div>
              )}

            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <i className="fas fa-spinner fa-spin me-1" />
                  Uploading...
                </>
              ) : (
                <>
                  <i className="fas fa-upload me-1" />
                  Upload Holiday List
                </>
              )}
            </button>

          </form>

          {/* ==================================================
              CURRENT HOLIDAY LIST
          ================================================== */}

          {holidayTable ? (
            <div className="mt-4">

              <h5>
                Current Holiday List
              </h5>

              <div
                className="table-responsive holiday-preview-wrap"
                dangerouslySetInnerHTML={{
                  __html: holidayTable,
                }}
              />

            </div>
          ) : (
            <p className="mt-3 text-muted">
              No holiday list uploaded yet.
            </p>
          )}

        </div>
      </div>
    </section>
  );
}

export default HolidayModule;