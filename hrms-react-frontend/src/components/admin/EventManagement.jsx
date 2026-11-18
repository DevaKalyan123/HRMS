
import { useEffect, useState } from "react";

import {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
} from "../../services/adminService";

function EventManagement() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState(null);

  const initialForm = {
    event_name: "",
    event_type: "",
    event_date: "",
    start_time: "",
    end_time: "",
    guests_count: "",
    description: "",
    booking_status: "Booked",
    is_blocked: true,
  };

  const [form, setForm] = useState(initialForm);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const data = await getEvents();

if (!data.success) {
  throw new Error(data.message || "Failed to load events");
}

setEvents(data.events || []);
    } catch (error) {
      setMessage(error.message || "Unable to load events");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const eventData = {
        ...form,
        guests_count: Number(form.guests_count),
        is_blocked: form.is_blocked ? 1 : 0,
      };

      if (editingId) {
        await updateEvent(editingId, eventData);
        setMessage("Event updated successfully.");
      } else {
        await createEvent(eventData);
        setMessage("Event created successfully.");
      }

      setForm(initialForm);
      setEditingId(null);
      await loadEvents();
    } catch (error) {
      setMessage(error.message || "Unable to save event");
    }
  };

  const handleEdit = (event) => {
    setEditingId(event.id);

    setForm({
      event_name: event.event_name || "",
      event_type: event.event_type || "",
      event_date: event.event_date?.slice(0, 10) || "",
      start_time: event.start_time?.slice(0, 5) || "",
      end_time: event.end_time?.slice(0, 5) || "",
      guests_count: event.guests_count ?? "",
      description: event.description || "",
      booking_status: event.booking_status || "Booked",
      is_blocked: Boolean(event.is_blocked),
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (eventId) => {
    if (!window.confirm("Are you sure you want to delete this event?")) {
      return;
    }

    try {
      await deleteEvent(eventId);
      setMessage("Event deleted successfully.");
      await loadEvents();
    } catch (error) {
      setMessage(error.message || "Unable to delete event");
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(initialForm);
    setMessage("");
  };

  return (
    <div className="event-management">
      <div className="event-heading">
        <h2>Event Management</h2>
        <p>Create and manage restaurant events.</p>
      </div>

      {message && <div className="event-message">{message}</div>}

      <form className="event-form" onSubmit={handleSubmit}>
        <h3>{editingId ? "Edit Event" : "Create New Event"}</h3>

        <div className="event-form-grid">
          <div>
            <label>Event Name</label>
            <input
              name="event_name"
              value={form.event_name}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label>Event Type</label>
            <input
              name="event_type"
              value={form.event_type}
              onChange={handleChange}
              placeholder="Birthday, Wedding, Corporate..."
              required
            />
          </div>

          <div>
            <label>Event Date</label>
            <input
              type="date"
              name="event_date"
              value={form.event_date}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label>Start Time</label>
            <input
              type="time"
              name="start_time"
              value={form.start_time}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label>End Time</label>
            <input
              type="time"
              name="end_time"
              value={form.end_time}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label>Number of Guests</label>
            <input
              type="number"
              name="guests_count"
              value={form.guests_count}
              onChange={handleChange}
              min="1"
              required
            />
          </div>

          <div>
            <label>Booking Status</label>
            <select
              name="booking_status"
              value={form.booking_status}
              onChange={handleChange}
            >
              <option value="Booked">Booked</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="event-description">
          <label>Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows="3"
          />
        </div>

        <label className="event-block-option">
          <input
            type="checkbox"
            name="is_blocked"
            checked={form.is_blocked}
            onChange={handleChange}
          />
          Block this time slot for customer bookings
        </label>

        <div className="event-actions">
          <button type="submit">
            {editingId ? "Update Event" : "Create Event"}
          </button>

          {editingId && (
            <button type="button" onClick={cancelEdit}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="event-list">
        <h3>Existing Events</h3>

        {loading ? (
          <p>Loading events...</p>
        ) : events.length === 0 ? (
          <p>No events found.</p>
        ) : (
          <div className="event-table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Event Name</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Guests</th>
                  <th>Status</th>
                  <th>Blocked</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {events.map((event) => (
                  <tr key={event.id}>
                    <td>{event.event_name}</td>
                    <td>{String(event.event_date).slice(0, 10)}</td>
                    <td>
                      {String(event.start_time).slice(0, 5)} -{" "}
                      {String(event.end_time).slice(0, 5)}
                    </td>
                    <td>{event.guests_count}</td>
                    <td>{event.booking_status}</td>
                    <td>{event.is_blocked ? "Yes" : "No"}</td>
                    <td>
                      <button
                        type="button"
                        onClick={() => handleEdit(event)}
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(event.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default EventManagement;
