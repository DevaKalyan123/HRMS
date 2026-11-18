
import { useEffect, useState } from "react";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

import { getEvents } from "../../services/adminService";

import "../../styles/admin/event-calendar.css";

function EventCalendar() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getEvents();

      if (!data?.success) {
        throw new Error(data?.message || "Unable to load events");
      }

      const calendarEvents = (data.events || []).map((event) => {
        const status = event.booking_status || "Booked";

        return {
          id: String(event.id),
          title: event.event_name,
          start: `${String(event.event_date).slice(0, 10)}T${String(
            event.start_time
          ).slice(0, 8)}`,
          end: `${String(event.event_date).slice(0, 10)}T${String(
            event.end_time
          ).slice(0, 8)}`,
          backgroundColor:
            status === "Cancelled" ? "#dc3545" : "#198754",
          borderColor:
            status === "Cancelled" ? "#dc3545" : "#198754",
          textColor: "#ffffff",
          extendedProps: {
            eventName: event.event_name,
            eventType: event.event_type,
            eventDate: String(event.event_date).slice(0, 10),
            startTime: String(event.start_time).slice(0, 5),
            endTime: String(event.end_time).slice(0, 5),
            guestsCount: event.guests_count,
            description: event.description,
            bookingStatus: status,
            isBlocked: Boolean(Number(event.is_blocked)),
          },
        };
      });

      setEvents(calendarEvents);
    } catch (err) {
      setError(err.message || "Unable to load calendar events");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const handleEventClick = (info) => {
    setSelectedEvent({
      ...info.event.extendedProps,
    });
  };

  const closeDetails = () => {
    setSelectedEvent(null);
  };

  return (
    <div className="event-calendar-page">
      <div className="event-calendar-heading">
        <div>
          <h2>Event Calendar</h2>
          <p>View all restaurant events by date and time.</p>
        </div>

        <button
          type="button"
          className="event-calendar-refresh"
          onClick={loadEvents}
          disabled={loading}
        >
          Refresh Events
        </button>
      </div>

      <div className="event-calendar-legend">
        <span>
          <i className="legend-dot booked-dot"></i>
          Booked
        </span>

        <span>
          <i className="legend-dot cancelled-dot"></i>
          Cancelled
        </span>
      </div>

      {loading ? (
        <p className="event-calendar-status">Loading calendar events...</p>
      ) : error ? (
        <div className="event-calendar-error">{error}</div>
      ) : (
        <div className="event-calendar-card">
          <FullCalendar
            plugins={[
              dayGridPlugin,
              timeGridPlugin,
              interactionPlugin,
            ]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay",
            }}
            buttonText={{
              today: "Today",
              month: "Month",
              week: "Week",
              day: "Day",
            }}
            events={events}
            eventClick={handleEventClick}
            height="auto"
            dayMaxEvents={3}
            nowIndicator={true}
            slotMinTime="06:00:00"
            slotMaxTime="23:00:00"
            eventTimeFormat={{
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            }}
          />
        </div>
      )}

      {selectedEvent && (
        <div
          className="event-calendar-modal-overlay"
          onClick={closeDetails}
        >
          <div
            className="event-calendar-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="event-calendar-modal-header">
              <h3>Event Details</h3>

              <button type="button" onClick={closeDetails}>
                &times;
              </button>
            </div>

            <div className="event-calendar-details">
              <p>
                <strong>Event Name:</strong>{" "}
                {selectedEvent.eventName}
              </p>

              <p>
                <strong>Event Type:</strong>{" "}
                {selectedEvent.eventType || "-"}
              </p>

              <p>
                <strong>Date:</strong>{" "}
                {selectedEvent.eventDate}
              </p>

              <p>
                <strong>Time:</strong>{" "}
                {selectedEvent.startTime} - {selectedEvent.endTime}
              </p>

              <p>
                <strong>Guests:</strong>{" "}
                {selectedEvent.guestsCount ?? 0}
              </p>

              <p>
                <strong>Status:</strong>{" "}
                {selectedEvent.bookingStatus}
              </p>

              <p>
                <strong>Customer Booking Blocked:</strong>{" "}
                {selectedEvent.isBlocked ? "Yes" : "No"}
              </p>

              <p>
                <strong>Description:</strong>{" "}
                {selectedEvent.description || "No description"}
              </p>
            </div>

            <button
              type="button"
              className="event-calendar-close"
              onClick={closeDetails}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default EventCalendar;
