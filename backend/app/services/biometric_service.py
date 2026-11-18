
import json
import hashlib
from datetime import datetime, timezone

from utils import get_db_connection


def parse_punch_time(value):
    """Convert ISO timestamp into MySQL DATETIME."""

    if not value:
        raise ValueError("punch_time is required")

    dt = datetime.fromisoformat(
        str(value).replace("Z", "+00:00")
    )

    # Store timezone-aware timestamps in UTC.
    if dt.tzinfo is not None:
        dt = dt.astimezone(timezone.utc).replace(tzinfo=None)

    return dt


def receive_punch(data):

    device_code = str(data.get("device_code", "")).strip()
    device_user_id = str(data.get("device_user_id", "")).strip()
    punch_type = str(data.get("punch_type", "Unknown")).strip()

    if not device_code or not device_user_id:
        raise ValueError("device_code and device_user_id are required")

    if len(device_code) > 100 or len(device_user_id) > 100:
        raise ValueError("Device identifiers are too long")

    if len(punch_type) > 30:
        raise ValueError("punch_type must not exceed 30 characters")

    punch_time = parse_punch_time(data.get("punch_time"))

    # Use the device's record ID when available.
    # Otherwise, use normalized punch details.
    event_data = {
        "device_code": device_code,
        "device_user_id": device_user_id,
        "punch_time": punch_time.isoformat(),
        "punch_type": punch_type
    }

    record_id = (
        data.get("record_id")
        or data.get("log_id")
        or data.get("transaction_id")
    )

    if record_id is not None:
        event_data["record_id"] = str(record_id)

    event_hash = hashlib.sha256(
        json.dumps(
            event_data,
            sort_keys=True
        ).encode("utf-8")
    ).hexdigest()

    conn = get_db_connection()

    if conn is None:
        raise RuntimeError("Database connection failed")

    cursor = None

    try:
        cursor = conn.cursor()

        # Check employee mapping
        cursor.execute(
            """
            SELECT user_id
            FROM biometric_employee_mapping
            WHERE device_code = %s
              AND device_user_id = %s
              AND is_active = 1
            """,
            (device_code, device_user_id)
        )

        mapping = cursor.fetchone()

        mapped_user_id = mapping[0] if mapping else None

        raw_payload = json.dumps(data, default=str)

        error_message = (
            None if mapped_user_id
            else "Employee mapping not found"
        )

        # Store raw punch without modifying attendance.
        cursor.execute(
            """
            INSERT IGNORE INTO biometric_punches
            (
                device_code,
                device_user_id,
                mapped_user_id,
                punch_time,
                punch_type,
                event_hash,
                raw_payload,
                processing_status,
                error_message
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                device_code,
                device_user_id,
                mapped_user_id,
                punch_time,
                punch_type,
                event_hash,
                raw_payload,
                "Pending",
                error_message
            )
        )

        inserted = cursor.rowcount == 1

        conn.commit()

        return {
            "success": True,
            "duplicate": not inserted,
            "employee_mapped": mapped_user_id is not None,
            "mapped_user_id": mapped_user_id,
            "attendance_updated": False
        }

    except Exception:
        conn.rollback()
        raise

    finally:
        if cursor:
            cursor.close()

        conn.close()

def get_mapping_data():
    """Fetch HRMS employees and existing biometric mappings."""

    conn = get_db_connection()

    if conn is None:
        raise RuntimeError("Database connection failed")

    cursor = None

    try:
        cursor = conn.cursor()

        cursor.execute("""
            SELECT id, username, email, position
            FROM users
            WHERE is_admin = 0
            ORDER BY username
        """)

        users = [
            {
                "id": row[0],
                "username": row[1],
                "email": row[2],
                "position": row[3]
            }
            for row in cursor.fetchall()
        ]

        cursor.execute("""
            SELECT
                m.id,
                m.device_code,
                m.device_user_id,
                m.user_id,
                u.username,
                m.is_active
            FROM biometric_employee_mapping m
            LEFT JOIN users u ON u.id = m.user_id
            ORDER BY m.id DESC
        """)

        mappings = [
            {
                "id": row[0],
                "device_code": row[1],
                "device_user_id": row[2],
                "user_id": row[3],
                "username": row[4],
                "is_active": row[5]
            }
            for row in cursor.fetchall()
        ]

        return {
            "users": users,
            "mappings": mappings
        }

    finally:
        if cursor:
            cursor.close()
        conn.close()


def save_employee_mapping(data):
    """Create or update an employee-to-device mapping."""

    device_code = str(data.get("device_code", "")).strip()
    device_user_id = str(data.get("device_user_id", "")).strip()

    try:
        user_id = int(data.get("user_id"))
    except (TypeError, ValueError):
        raise ValueError("A valid HRMS user_id is required")

    if not device_code or not device_user_id:
        raise ValueError("Device code and device user ID are required")

    if len(device_code) > 100 or len(device_user_id) > 100:
        raise ValueError("Device identifiers are too long")

    conn = get_db_connection()

    if conn is None:
        raise RuntimeError("Database connection failed")

    cursor = None

    try:
        cursor = conn.cursor()

        # Confirm that the selected employee exists and is not an admin.
        cursor.execute("""
            SELECT id
            FROM users
            WHERE id = %s
              AND is_admin = 0
        """, (user_id,))

        if not cursor.fetchone():
            raise ValueError("Selected HRMS employee was not found")

        # Insert a new mapping or update an existing device mapping.
        cursor.execute("""
            INSERT INTO biometric_employee_mapping
                (device_code, device_user_id, user_id, is_active)
            VALUES (%s, %s, %s, 1)
            ON DUPLICATE KEY UPDATE
                user_id = VALUES(user_id),
                is_active = 1
        """, (device_code, device_user_id, user_id))

        # Also map previously received punches that were pending
        # because this device employee ID was not mapped.
        cursor.execute("""
            UPDATE biometric_punches
            SET mapped_user_id = %s,
                error_message = NULL
            WHERE device_code = %s
              AND device_user_id = %s
              AND mapped_user_id IS NULL
        """, (user_id, device_code, device_user_id))

        conn.commit()

        return {
            "success": True,
            "message": "Employee mapping saved successfully"
        }

    except Exception:
        conn.rollback()
        raise

    finally:
        if cursor:
            cursor.close()
        conn.close()
