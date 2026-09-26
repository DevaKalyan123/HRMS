function ConfirmLeaveModal({
  show,
  selectedLeave,
  onCancel,
  onConfirm,
  onRemarksChange,
  isUpdating = false,
}) {
  // ============================================================
  // DON'T SHOW MODAL
  // ============================================================

  if (
    !show ||
    !selectedLeave
  ) {
    return null;
  }

  // ============================================================
  // APPROVE / REJECT
  // ============================================================

  const isApprove =
    selectedLeave.newStatus ===
    "Approved";

  // ============================================================
  // DATE FORMAT
  // ============================================================

  const formatDate = (
    dateValue
  ) => {
    if (!dateValue) {
      return "—";
    }

    const date =
      new Date(dateValue);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return String(
        dateValue
      );
    }

    return date.toLocaleDateString(
      "en-GB",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  // ============================================================
  // UI
  // ============================================================

  return (
    <div
      className="leave-modal-overlay"
      onMouseDown={(e) => {
        if (
          e.target ===
          e.currentTarget &&
          !isUpdating
        ) {
          onCancel();
        }
      }}
    >

      <div
        className="leave-confirm-modal"
        onMouseDown={(e) =>
          e.stopPropagation()
        }
      >

        {/* ==================================================
            HEADER
        ================================================== */}

        <div className="leave-modal-header">

          <div
            className={`leave-modal-icon ${
              isApprove
                ? "approve-icon"
                : "reject-icon"
            }`}
          >

            <i
              className={
                isApprove
                  ? "fas fa-check"
                  : "fas fa-times"
              }
            />

          </div>


          <div className="leave-modal-title-area">

            <h3>
              {isApprove
                ? "Approve Leave?"
                : "Reject Leave?"}
            </h3>

            <p>
              {isApprove
                ? "Confirm approval of this leave request."
                : "Confirm rejection of this leave request."}
            </p>

          </div>


          {/* CLOSE */}

          <button
            type="button"
            className="leave-modal-close"
            onClick={onCancel}
            disabled={isUpdating}
            aria-label="Close"
          >
            <i className="fas fa-times" />
          </button>

        </div>


        {/* ==================================================
            BODY
        ================================================== */}

        <div className="leave-modal-body">

          <p className="leave-confirm-question">

            Are you sure you want to{" "}

            <strong>
              {isApprove
                ? "approve"
                : "reject"}
            </strong>{" "}

            this leave request?

          </p>


          {/* ==================================================
              DETAILS
          ================================================== */}

          <div className="leave-detail-grid">

            {/* EMPLOYEE */}

            <div className="leave-detail-item">

              <span className="detail-label">
                Employee
              </span>

              <span className="detail-value">
                {selectedLeave.username ||
                  "—"}
              </span>

            </div>


            {/* LEAVE TYPE */}

            <div className="leave-detail-item">

              <span className="detail-label">
                Leave Type
              </span>

              <span className="detail-value">
                {selectedLeave.leave_type ||
                  "—"}
              </span>

            </div>


            {/* FROM */}

            <div className="leave-detail-item">

              <span className="detail-label">
                From
              </span>

              <span className="detail-value">
                {formatDate(
                  selectedLeave.start_date
                )}
              </span>

            </div>


            {/* TO */}

            <div className="leave-detail-item">

              <span className="detail-label">
                To
              </span>

              <span className="detail-value">
                {formatDate(
                  selectedLeave.end_date
                )}
              </span>

            </div>


            {/* TOTAL DAYS */}

            <div className="leave-detail-item">

              <span className="detail-label">
                Total Days
              </span>

              <span className="detail-value">
                {selectedLeave.total_days ||
                  "—"}
              </span>

            </div>

          </div>


          {/* ==================================================
              REMARKS
          ================================================== */}

          <div className="leave-remarks-form">

            <label
              htmlFor="leaveRemarks"
              className="remarks-label"
            >

              Remarks

              <span>
                {" "}(
                Optional
                )
              </span>

            </label>


            <textarea
              id="leaveRemarks"
              className="remarks-textarea"
              rows={4}
              value={
                selectedLeave.remarks ||
                ""
              }
              onChange={(e) =>
                onRemarksChange(
                  e.target.value
                )
              }
              placeholder={
                isApprove
                  ? "Enter approval remarks..."
                  : "Enter rejection remarks..."
              }
              disabled={
                isUpdating
              }
            />


            <div className="remarks-helper">
              Add a remark that will be saved with this leave request.
            </div>

          </div>

        </div>


        {/* ==================================================
            FOOTER
        ================================================== */}

        <div className="leave-modal-footer">

          {/* CANCEL */}

          <button
            type="button"
            className="leave-modal-cancel"
            onClick={onCancel}
            disabled={
              isUpdating
            }
          >

            <i className="fas fa-times" />

            Cancel

          </button>


          {/* APPROVE / REJECT */}

          <button
            type="button"
            className={`leave-modal-confirm ${
              isApprove
                ? "confirm-approve"
                : "confirm-reject"
            }`}
            onClick={onConfirm}
            disabled={
              isUpdating
            }
          >

            {isUpdating ? (

              <>
                <i className="fas fa-spinner fa-spin" />

                {isApprove
                  ? "Approving..."
                  : "Rejecting..."}

              </>

            ) : (

              <>

                <i
                  className={
                    isApprove
                      ? "fas fa-check"
                      : "fas fa-times"
                  }
                />

                {isApprove
                  ? "Approve Leave"
                  : "Reject Leave"}

              </>

            )}

          </button>

        </div>

      </div>

    </div>
  );
}

export default ConfirmLeaveModal;