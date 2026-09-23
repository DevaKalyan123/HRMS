import {
  useEffect,
  useState,
} from "react";

import {
  uploadRota,
} from "../../services/adminService";

function RotaModule({
  rotaImage: rotaImageData = "",
}) {
  const [rotaImage, setRotaImage] =
    useState(
      rotaImageData
    );

  useEffect(() => {
    setRotaImage(
      rotaImageData || ""
    );
  }, [rotaImageData]);

  const handleRotaUpload =
    async (event) => {
      event.preventDefault();

      const file =
        event.currentTarget.elements
          .rotaImage.files[0];

      if (!file) {
        alert(
          "Please select a rota image."
        );
        return;
      }

      try {
        const result =
          await uploadRota(file);

        if (!result.success) {
          throw new Error(
            result.message ||
              "Failed to upload rota"
          );
        }

        if (
          result.rota_image_base64
        ) {
          setRotaImage(
            `data:image/jpeg;base64,${result.rota_image_base64}`
          );
        }

        alert(
          "Rota uploaded successfully."
        );
      } catch (error) {
        console.error(
          "Rota upload error:",
          error
        );

        alert(
          error.message ||
            "Failed to upload rota."
        );
      }
    };

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

          <form
            onSubmit={
              handleRotaUpload
            }
          >

            <input
              type="file"
              name="rotaImage"
              accept="image/*"
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

          {rotaImage ? (
            <div className="mt-3">

              <h5>
                Current Rota
              </h5>

              <img
                src={rotaImage}
                alt="Current Rota"
                className="rota-image"
              />

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