function ConfirmLeaveModal({
  show,
  selectedLeave,
  onCancel,
  onConfirm,
  onRemarksChange,
}) {
  if (!show || !selectedLeave) {
    return null;
  }

  const isApproved =
    selectedLeave.newStatus === "Approved";

  return (
    <div className="modal-overlay">

      <div className="confirm-box">

        {/* TITLE */}

        <div className="confirm-title">
          {isApproved
            ? "Approve Leave?"
            : "Reject Leave?"}
        </div>

        {/* MESSAGE */}

        <p className="confirm-body">
          Are you sure you want to{" "}
          {isApproved
            ? "approve"
            : "reject"}{" "}
          this leave request?
        </p>

        {/* EMPLOYEE DETAILS */}

        <div className="leave-confirm-details">

          <div>
            <strong>Employee:</strong>{" "}
            {selectedLeave.username || "—"}
          </div>

          <div>
            <strong>Leave Type:</strong>{" "}
            {selectedLeave.leave_type || "—"}
          </div>

          <div>
            <strong>From:</strong>{" "}
            {selectedLeave.start_date || "—"}
          </div>

          <div>
            <strong>To:</strong>{" "}
            {selectedLeave.end_date || "—"}
          </div>

        </div>

        {/* REMARKS */}

        <div className="remarks-field">

          <label htmlFor="leaveRemarks">
            Remarks
          </label>

          <textarea
            id="leaveRemarks"
            className="remarks-input"
            rows="4"
            placeholder={
              isApproved
                ? "Enter approval remarks..."
                : "Enter rejection remarks..."
            }
            value={
              selectedLeave.remarks || ""
            }
            onChange={(e) =>
              onRemarksChange(
                e.target.value
              )
            }
          />

        </div>

        {/* ACTION BUTTONS */}

        <div className="confirm-actions">

          <button
            type="button"
            className="modal-btn modal-btn-cancel"
            onClick={onCancel}
          >
            <i className="fas fa-times" />{" "}
            Cancel
          </button>

          <button
            type="button"
            className="modal-btn modal-btn-approve"
            onClick={onConfirm}
          >
            {isApproved ? (
              <>
                <i className="fas fa-check" />{" "}
                Approve
              </>
            ) : (
              <>
                <i className="fas fa-times" />{" "}
                Reject
              </>
            )}
          </button>

        </div>

      </div>

    </div>
  );
}

export default ConfirmLeaveModal;