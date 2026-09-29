function EditAdminProfileModal({
  show,
  email,
  faceImage,
  setEmail,
  setFaceImage,
  onClose,
  onSave,
}) {
  if (!show) {
    return null;
  }

  // =====================================================
  // FILE VALIDATION
  // =====================================================
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) {
      setFaceImage(null);
      return;
    }

    // Allowed file extensions
    const allowedExtensions = [
      ".jpg",
      ".jpeg",
      ".png",
      ".pdf",
      
    ];

    const fileName = file.name.toLowerCase();

    const extension = fileName.includes(".")
      ? fileName.substring(fileName.lastIndexOf("."))
      : "";

    // Check extension
    if (!allowedExtensions.includes(extension)) {
      alert(
        "Invalid file type.\n\nOnly JPG, JPEG, PNG, PDF files are allowed."
      );

      // Clear selected file
      e.target.value = "";

      setFaceImage(null);

      return;
    }

    // File is valid
    setFaceImage(file);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-dialog">
        <div className="modal-content">

          {/* =====================================================
              HEADER
          ===================================================== */}
          <div className="modal-header">
            <h5 className="modal-title">
              Edit Admin Profile
            </h5>

            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              aria-label="Close"
            >
              ×
            </button>
          </div>

          {/* =====================================================
              BODY
          ===================================================== */}
          <div className="modal-body">

            {/* EMAIL */}
            <div className="mb-3">
              <label
                htmlFor="admin-email"
                className="form-label"
              >
                Email
              </label>

              <input
                id="admin-email"
                type="email"
                className="form-control"
                value={email || ""}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter admin email"
              />
            </div>

            {/* FILE */}
            <div className="mb-3">
              <label
                htmlFor="admin-profile-file"
                className="form-label"
              >
                Profile Image / Document
              </label>

              <input
                id="admin-profile-file"
                type="file"
                className="form-control"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={handleFileChange}
              />

              {/* SELECTED FILE */}
              {faceImage && (
                <div className="mt-2">
                  <small className="text-muted">
                    Selected file:
                  </small>

                  <div className="fw-semibold">
                    {faceImage.name}
                  </div>
                </div>
              )}

            </div>

          </div>

          {/* =====================================================
              FOOTER
          ===================================================== */}
          <div className="modal-footer">

            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              type="button"
              className="btn btn-primary"
              onClick={onSave}
            >
              Save Changes
            </button>

          </div>

        </div>
      </div>
    </div>
  );
}

export default EditAdminProfileModal;