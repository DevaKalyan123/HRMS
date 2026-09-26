import { useEffect, useState } from "react";
import { uploadRota } from "../../services/adminService";

function RotaModule({
  rotaImage: rotaImageData = "",
  rotaFilename: rotaFilenameData = "",
  rotaMimeType: rotaMimeTypeData = "",
}) {
  const [rotaImage, setRotaImage] = useState(rotaImageData);
  const [rotaFilename, setRotaFilename] = useState(rotaFilenameData);
  const [rotaMimeType, setRotaMimeType] = useState(rotaMimeTypeData);

  // ============================================================
  // LOAD CURRENT ROTA DATA
  // ============================================================

  useEffect(() => {
    setRotaImage(rotaImageData || "");
    setRotaFilename(rotaFilenameData || "");
    setRotaMimeType(rotaMimeTypeData || "");
  }, [
    rotaImageData,
    rotaFilenameData,
    rotaMimeTypeData,
  ]);

  // ============================================================
  // ALLOWED ROTA FILE TYPES
  // ============================================================

  const allowedExtensions = [
    ".jpg",
    ".jpeg",
    ".png",
    ".pdf",
    ".docx",
    ".csv",
  ];

  const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/csv",
    "application/csv",
    "application/vnd.ms-excel",
  ];

  // ============================================================
  // FILE VALIDATION
  // ============================================================

  const validateRotaFile = (file) => {
    if (!file) {
      return "Please select a rota file.";
    }

    const filename = file.name.toLowerCase().trim();

    const extension =
      filename.includes(".")
        ? filename.substring(filename.lastIndexOf("."))
        : "";

    // Check extension
    if (!allowedExtensions.includes(extension)) {
      return (
        "Invalid rota file. Only JPG, JPEG, PNG, PDF, DOCX and CSV files are allowed."
      );
    }

    // Check MIME type
    // Some browsers may report CSV differently, so CSV is handled
    // separately using the extension.
    if (
      extension !== ".csv" &&
      file.type &&
      !allowedMimeTypes.includes(file.type)
    ) {
      return (
        "Invalid file type. Only JPG, JPEG, PNG, PDF, DOCX and CSV files are allowed."
      );
    }

    return null;
  };

  // ============================================================
  // UPLOAD ROTA
  // ============================================================

  const handleRotaUpload = async (event) => {
    event.preventDefault();

    const fileInput =
      event.currentTarget.elements.rotaImage;

    const file = fileInput?.files?.[0];

    // ----------------------------------------------------------
    // Validate file
    // ----------------------------------------------------------

    const validationError = validateRotaFile(file);

    if (validationError) {
      alert(validationError);

      // Clear invalid file
      if (fileInput) {
        fileInput.value = "";
      }

      return;
    }

    try {
      // --------------------------------------------------------
      // Upload to backend
      // --------------------------------------------------------

      const result = await uploadRota(file);

      console.log("Rota upload response:", result);

      if (!result?.success) {
        throw new Error(
          result?.message || "Failed to upload rota"
        );
      }

      // --------------------------------------------------------
      // Get returned file information
      // --------------------------------------------------------

      const uploadedFilename =
        result.rota_filename || file.name;

      const uploadedMimeType =
        result.rota_mime_type ||
        file.type ||
        "";

      const uploadedBase64 =
        result.rota_image_base64 || "";

      // --------------------------------------------------------
      // Update current rota information
      // --------------------------------------------------------

      setRotaFilename(uploadedFilename);
      setRotaMimeType(uploadedMimeType);

      if (uploadedBase64) {
        setRotaImage(uploadedBase64);
      }

      // --------------------------------------------------------
      // Clear file input
      // --------------------------------------------------------

      if (fileInput) {
        fileInput.value = "";
      }

      alert("Rota uploaded successfully.");
    } catch (error) {
      console.error("Rota upload error:", error);

      alert(
        error?.message ||
          "Failed to upload rota."
      );
    }
  };

  // ============================================================
  // CREATE DATA URL
  // ============================================================

  const getDataUrl = () => {
    if (!rotaImage || !rotaMimeType) {
      return "";
    }

    return `data:${rotaMimeType};base64,${rotaImage}`;
  };

  // ============================================================
  // DETERMINE FILE TYPE
  // ============================================================

  const isImage =
    rotaMimeType === "image/jpeg" ||
    rotaMimeType === "image/png";

  const isPdf =
    rotaMimeType === "application/pdf";

  const isDocx =
    rotaMimeType ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

  const isCsv =
    rotaMimeType === "text/csv" ||
    rotaMimeType === "application/csv" ||
    rotaMimeType === "application/vnd.ms-excel";

  // ============================================================
  // DOWNLOAD CURRENT ROTA
  // ============================================================

  const handleDownloadRota = () => {
    if (!rotaImage || !rotaFilename) {
      return;
    }

    const dataUrl = getDataUrl();

    const link = document.createElement("a");

    link.href = dataUrl;
    link.download = rotaFilename;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <section
      className="content-section active"
      id="rota"
    >
      <div className="card">
        <h3 className="card-header">
          Upload Weekly Rota
        </h3>

        <div className="card-body">
          <form onSubmit={handleRotaUpload}>
            <input
              type="file"
              name="rotaImage"
              accept=".jpg,.jpeg,.png,.pdf,.docx,.csv"
              className="form-control mb-3"
              required
            />

            <button
              type="submit"
              className="btn btn-primary"
            >
              Upload Rota
            </button>
          </form>

          {/* ==================================================
              CURRENT ROTA
          ================================================== */}

          {rotaImage ? (
            <div className="mt-3">
              <h5>Current Rota</h5>

              {/* ==============================================
                  FILE NAME
              ============================================== */}

              {rotaFilename && (
                <p className="mb-2">
                  <strong>File:</strong>{" "}
                  {rotaFilename}
                </p>
              )}

              {/* ==============================================
                  IMAGE ROTA
              ============================================== */}

              {isImage && (
                <div>
                  <img
                    src={getDataUrl()}
                    alt="Current Rota"
                    className="rota-image"
                  />
                </div>
              )}

              {/* ==============================================
                  PDF ROTA
              ============================================== */}

              {isPdf && (
                <div>
                  <iframe
                    src={getDataUrl()}
                    title="Current Rota PDF"
                    style={{
                      width: "100%",
                      height: "700px",
                      border: "1px solid #ddd",
                      borderRadius: "6px",
                    }}
                  />
                </div>
              )}

              {/* ==============================================
                  DOCX ROTA
              ============================================== */}

              {isDocx && (
                <div
                  style={{
                    padding: "20px",
                    border: "1px solid #ddd",
                    borderRadius: "6px",
                    backgroundColor: "#f8f9fa",
                  }}
                >
                  <p className="mb-2">
                    This is a Word document.
                  </p>

                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleDownloadRota}
                  >
                    View / Download DOCX
                  </button>
                </div>
              )}

              {/* ==============================================
                  CSV ROTA
              ============================================== */}

              {isCsv && (
                <div
                  style={{
                    padding: "20px",
                    border: "1px solid #ddd",
                    borderRadius: "6px",
                    backgroundColor: "#f8f9fa",
                  }}
                >
                  <p className="mb-2">
                    This is a CSV rota file.
                  </p>

                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleDownloadRota}
                  >
                    View / Download CSV
                  </button>
                </div>
              )}

              {/* ==============================================
                  DOWNLOAD BUTTON
              ============================================== */}

              {!isDocx && !isCsv && (
                <button
                  type="button"
                  className="btn btn-secondary mt-3"
                  onClick={handleDownloadRota}
                >
                  Download Rota
                </button>
              )}
            </div>
          ) : (
            <p className="mt-3">
              No rota uploaded yet.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

export default RotaModule;