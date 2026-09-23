import {
  useEffect,
  useState,
} from "react";

import {
  uploadHoliday,
} from "../../services/adminService";

function HolidayModule({
  holidayTable: holidayTableData = "",
}) {
  const [holidayTable, setHolidayTable] =
    useState(
      holidayTableData
    );

  useEffect(() => {
    setHolidayTable(
      holidayTableData || ""
    );
  }, [holidayTableData]);

  const handleHolidayUpload =
    async (event) => {
      event.preventDefault();

      const file =
        event.currentTarget.elements
          .holiday_image.files[0];

      if (!file) {
        alert(
          "Please select a holiday file."
        );
        return;
      }

      try {
        const result =
          await uploadHoliday(file);

        if (!result.success) {
          throw new Error(
            result.message ||
              "Failed to upload holiday list"
          );
        }

        if (
          result.holiday_table
        ) {
          setHolidayTable(
            result.holiday_table
          );
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
          error.message ||
            "Failed to upload holiday list."
        );
      }
    };

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
            onSubmit={
              handleHolidayUpload
            }
          >

            <div className="mb-3">

              <label className="form-label fw-semibold">
                <i className="fas fa-file-excel me-1" />
                Select Excel / CSV / Word File
              </label>

              <input
                type="file"
                name="holiday_image"
                accept=".doc,.docx,.xls,.xlsx,.csv"
                className="form-control"
                required
              />

              <div className="form-text">
                Supported formats:
                .doc, .docx, .xls,
                .xlsx, .csv
              </div>

            </div>

            <button
              type="submit"
              className="btn btn-primary"
            >
              <i className="fas fa-upload me-1" />
              Upload Holiday List
            </button>

          </form>

          {holidayTable ? (
            <div className="mt-4">

              <h5>
                Current Holiday List
              </h5>

              <div
                className="table-responsive holiday-preview-wrap"
                dangerouslySetInnerHTML={{
                  __html:
                    holidayTable,
                }}
              />

            </div>
          ) : (
            <p className="mt-3 text-muted">
              No holiday list
              uploaded yet.
            </p>
          )}

        </div>
      </div>
    </section>
  );
}

export default HolidayModule;