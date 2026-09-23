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

  return (
    <div className="modal-overlay">

      <div className="modal-dialog">

        <div className="modal-content">

          {/* HEADER */}

          <div className="modal-header">

            <h5 className="modal-title">
              Edit Admin Profile
            </h5>

            <button
              type="button"
              className="btn-close"
              onClick={onClose}
            >
              ×
            </button>

          </div>

          {/* BODY */}

          <div className="modal-body">

            <div className="mb-3">

              <label className="form-label">
                Email
              </label>

              <input
                type="email"
                className="form-control"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                placeholder="Enter admin email"
              />

            </div>

            <div className="mb-3">

              <label className="form-label">
                Profile Image
              </label>

              <input
                type="file"
                className="form-control"
                accept="image/*"
                onChange={(e) =>
                  setFaceImage(
                    e.target.files?.[0] || null
                  )
                }
              />

              {faceImage && (
                <small className="text-muted">
                  Selected: {faceImage.name}
                </small>
              )}

            </div>

          </div>

          {/* FOOTER */}

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