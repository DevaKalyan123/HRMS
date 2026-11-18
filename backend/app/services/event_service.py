
from datetime import datetime
from flask import request, jsonify, session

from app.services.admin_service import get_db_connection


def _admin_required():
    return "user_id" in session and bool(session.get("is_admin"))


def _logged_in():
    return "user_id" in session


def _validate_event(data):
    required = [
        "event_name",
        "event_date",
        "start_time",
        "end_time"
    ]

    for field in required:
        if not data.get(field):
            return f"{field} is required"

    try:
        datetime.strptime(data["event_date"], "%Y-%m-%d")
        start = datetime.strptime(data["start_time"], "%H:%M")
        end = datetime.strptime(data["end_time"], "%H:%M")
    except ValueError:
        return "Invalid date or time format"

    if end <= start:
        return "End time must be later than start time"

    try:
        guests = int(data.get("guests_count", 0))
        if guests < 0:
            return "Guest count cannot be negative"
    except (ValueError, TypeError):
        return "Guest count must be a valid number"

    if data.get("booking_status", "Booked") not in [
        "Booked", "Cancelled"
    ]:
        return "Invalid booking status"

    if str(data.get("is_blocked", 1)) not in ["0", "1", "True", "False", "true", "false"]:
        return "Invalid blocking value"

    return None


def _has_conflict(cursor, event_date, start_time, end_time, exclude_id=None):
    query = """
        SELECT id, event_name, start_time, end_time
        FROM restaurant_events
        WHERE event_date = %s
          AND booking_status = 'Booked'
          AND is_blocked = 1
          AND start_time < %s
          AND end_time > %s
    """

    params = [event_date, end_time, start_time]

    if exclude_id is not None:
        query += " AND id != %s"
        params.append(exclude_id)

    query += " LIMIT 1"

    cursor.execute(query, tuple(params))
    return cursor.fetchone()


def get_events():
    if not _logged_in():
        return jsonify({"success": False, "message": "Login required"}), 401

    conn = get_db_connection()
    if not conn:
        return jsonify({"success": False, "message": "Database connection failed"}), 500

    cursor = conn.cursor(dictionary=True)

    try:
        if session.get("is_admin"):
            cursor.execute("""
                SELECT * FROM restaurant_events
                ORDER BY event_date DESC, start_time ASC
            """)
        else:
            cursor.execute("""
                SELECT id, event_name, event_type, event_date,
                       start_time, end_time, guests_count,
                       description, booking_status, is_blocked
                FROM restaurant_events
                WHERE event_date >= CURDATE()
                  AND booking_status = 'Booked'
                ORDER BY event_date ASC, start_time ASC
            """)

        events = cursor.fetchall()

        for event in events:
            if event.get("event_date"):
                event["event_date"] = event["event_date"].isoformat()
            for key in ("start_time", "end_time"):
                if event.get(key):
                    event[key] = str(event[key])

            for key in ("created_at", "updated_at"):
                if event.get(key):
                    event[key] = event[key].isoformat()

        return jsonify({"success": True, "events": events}), 200

    except Exception:
        conn.rollback()
        return jsonify({"success": False, "message": "Unable to fetch events"}), 500
    finally:
        cursor.close()
        conn.close()


def create_event():
    if not _admin_required():
        return jsonify({"success": False, "message": "Admin access required"}), 403

    data = request.get_json(silent=True) or {}
    error = _validate_event(data)

    if error:
        return jsonify({"success": False, "message": error}), 400

    is_blocked = 1 if str(data.get("is_blocked", 1)).lower() in ("1", "true") else 0
    status = data.get("booking_status", "Booked")

    conn = get_db_connection()
    if not conn:
        return jsonify({"success": False, "message": "Database connection failed"}), 500

    cursor = conn.cursor(dictionary=True)

    try:
        if status == "Booked" and is_blocked:
            conflict = _has_conflict(
                cursor,
                data["event_date"],
                data["start_time"],
                data["end_time"]
            )

            if conflict:
                return jsonify({
                    "success": False,
                    "message": (
                        f"Time conflict with event: {conflict['event_name']} "
                        f"({conflict['start_time']} - {conflict['end_time']})"
                    )
                }), 409

        cursor.execute("""
            INSERT INTO restaurant_events (
                event_name, event_type, event_date,
                start_time, end_time, guests_count,
                description, booking_status, is_blocked,
                created_by
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            data["event_name"].strip(),
            data.get("event_type"),
            data["event_date"],
            data["start_time"],
            data["end_time"],
            int(data.get("guests_count", 0)),
            data.get("description", ""),
            status,
            is_blocked,
            session["user_id"]
        ))

        event_id = cursor.lastrowid
        conn.commit()

        return jsonify({
            "success": True,
            "message": "Event created successfully",
            "event_id": event_id
        }), 201

    except Exception:
        conn.rollback()
        return jsonify({"success": False, "message": "Unable to create event"}), 500
    finally:
        cursor.close()
        conn.close()


def update_event(event_id):
    if not _admin_required():
        return jsonify({"success": False, "message": "Admin access required"}), 403

    data = request.get_json(silent=True) or {}
    error = _validate_event(data)

    if error:
        return jsonify({"success": False, "message": error}), 400

    is_blocked = 1 if str(data.get("is_blocked", 1)).lower() in ("1", "true") else 0
    status = data.get("booking_status", "Booked")

    conn = get_db_connection()
    if not conn:
        return jsonify({"success": False, "message": "Database connection failed"}), 500

    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute(
            "SELECT id FROM restaurant_events WHERE id = %s",
            (event_id,)
        )
        if not cursor.fetchone():
            return jsonify({"success": False, "message": "Event not found"}), 404

        if status == "Booked" and is_blocked:
            conflict = _has_conflict(
                cursor,
                data["event_date"],
                data["start_time"],
                data["end_time"],
                exclude_id=event_id
            )

            if conflict:
                return jsonify({
                    "success": False,
                    "message": f"Time conflict with event: {conflict['event_name']}"
                }), 409

        cursor.execute("""
            UPDATE restaurant_events
            SET event_name=%s,
                event_type=%s,
                event_date=%s,
                start_time=%s,
                end_time=%s,
                guests_count=%s,
                description=%s,
                booking_status=%s,
                is_blocked=%s
            WHERE id=%s
        """, (
            data["event_name"].strip(),
            data.get("event_type"),
            data["event_date"],
            data["start_time"],
            data["end_time"],
            int(data.get("guests_count", 0)),
            data.get("description", ""),
            status,
            is_blocked,
            event_id
        ))

        conn.commit()
        return jsonify({"success": True, "message": "Event updated successfully"}), 200

    except Exception:
        conn.rollback()
        return jsonify({"success": False, "message": "Unable to update event"}), 500
    finally:
        cursor.close()
        conn.close()


def delete_event(event_id):
    if not _admin_required():
        return jsonify({"success": False, "message": "Admin access required"}), 403

    conn = get_db_connection()
    if not conn:
        return jsonify({"success": False, "message": "Database connection failed"}), 500

    cursor = conn.cursor()

    try:
        cursor.execute(
            "DELETE FROM restaurant_events WHERE id = %s",
            (event_id,)
        )

        if cursor.rowcount == 0:
            return jsonify({"success": False, "message": "Event not found"}), 404

        conn.commit()
        return jsonify({"success": True, "message": "Event deleted successfully"}), 200

    except Exception:
        conn.rollback()
        return jsonify({"success": False, "message": "Unable to delete event"}), 500
    finally:
        cursor.close()
        conn.close()


def check_availability():
    if not _logged_in():
        return jsonify({"success": False, "message": "Login required"}), 401

    data = request.get_json(silent=True) or {}

    event_date = data.get("event_date")
    start_time = data.get("start_time")
    end_time = data.get("end_time")

    try:
        datetime.strptime(event_date, "%Y-%m-%d")
        start = datetime.strptime(start_time, "%H:%M")
        end = datetime.strptime(end_time, "%H:%M")

        if end <= start:
            raise ValueError()
    except (ValueError, TypeError):
        return jsonify({"success": False, "message": "Valid date and time are required"}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({"success": False, "message": "Database connection failed"}), 500

    cursor = conn.cursor(dictionary=True)

    try:
        conflict = _has_conflict(cursor, event_date, start_time, end_time)

        if conflict:
            return jsonify({
                "success": True,
                "available": False,
                "message": f"Time unavailable due to {conflict['event_name']}"
            }), 200

        return jsonify({
            "success": True,
            "available": True,
            "message": "Time is available"
        }), 200

    except Exception:
        return jsonify({"success": False, "message": "Availability check failed"}), 500
    finally:
        cursor.close()
        conn.close()
