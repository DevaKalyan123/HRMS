import {
  useEffect,
  useState,
} from "react";

import {
  sendNotification,
} from "../../services/adminService";

function NotificationsModule({
  notifications:
    notificationsData = [],
}) {
  const [notifications, setNotifications] =
    useState(
      notificationsData
    );

  const [
    notificationMessage,
    setNotificationMessage,
  ] = useState("");

  useEffect(() => {
    setNotifications(
      notificationsData || []
    );
  }, [notificationsData]);

  const handleSendNotification =
    async (event) => {
      event.preventDefault();

      if (
        !notificationMessage.trim()
      ) {
        alert(
          "Please enter a notification message."
        );
        return;
      }

      try {
        const result =
          await sendNotification(
            notificationMessage.trim()
          );

        if (!result.success) {
          throw new Error(
            result.message ||
              "Failed to send notification"
          );
        }

        setNotificationMessage("");

        alert(
          "Notification sent successfully."
        );
      } catch (error) {
        console.error(
          "Notification error:",
          error
        );

        alert(
          error.message ||
            "Failed to send notification."
        );
      }
    };

  return (
    <section
      className="content-section active"
      id="notifications"
    >

      <div className="card">

        <h3 className="card-header">
          Send Notification
        </h3>

        <div className="card-body">

          <form
            onSubmit={
              handleSendNotification
            }
          >

            <textarea
              className="form-control mb-3"
              placeholder="Enter notification message..."
              value={
                notificationMessage
              }
              onChange={(e) =>
                setNotificationMessage(
                  e.target.value
                )
              }
              required
            />

            <button
              type="submit"
              className="btn btn-primary"
            >
              Send to All Users
            </button>

          </form>

        </div>
      </div>

      <div className="card mt-4">

        <h3 className="card-header">
          Read Notifications
        </h3>

        <div className="card-body">

          {notifications.length >
          0 ? (
            <ul className="list-group">

              {notifications.map(
                (
                  notification,
                  index
                ) => (
                  <li
                    className="list-group-item"
                    key={
                      notification.id ||
                      index
                    }
                  >
                    {
                      notification.message
                    }{" "}
                    - Sent to{" "}
                    {
                      notification.username
                    }
                  </li>
                )
              )}

            </ul>
          ) : (
            <p>
              No read notifications.
            </p>
          )}

        </div>
      </div>

    </section>
  );
}

export default NotificationsModule;