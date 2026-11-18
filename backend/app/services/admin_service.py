# admin.py
import email
import email
from fileinput import filename

from flask import Blueprint, request, render_template, jsonify, session, flash, redirect, url_for, send_file
import mysql.connector
from mysql.connector import Error
import os
import pandas as pd
from docx import Document
from io import BytesIO
from datetime import datetime, timedelta
import base64
import logging
import hashlib
from dotenv import load_dotenv
import json
from utils import send_email

load_dotenv()

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

db_config = {
    "host": os.environ.get("DB_HOST", "localhost"),
    "user": os.environ.get("DB_USER", "root"),
    "password": os.environ.get("DB_PASSWORD", "0103"),
    "database": os.environ.get("DB_NAME", "gps_face_db"),
    "port": int(os.environ.get("DB_PORT", 3308))
}


def get_db_connection():
    try:
        conn = mysql.connector.connect(**db_config)
        if conn.is_connected():
            return conn
        return None
    except Error as err:
        logging.error(f"Database connection failed: {err}")
        return None




def admin():
    logging.info(f"Accessing admin route with session: {dict(session)}")
    if 'user_id' not in session or not session.get('is_admin'):
        flash("Please login as admin", "error")
        return redirect(url_for('auth.login'))

    view = request.args.get('view', 'daily')
    search_query = request.args.get('search', '')

    conn = get_db_connection()
    if not conn:
        flash("Database connection failed", "error")
        return render_template('admin.html', data=[], view=view, admin_profile=None,
                               users=[], all_attendance=[], rota_image_base64=None,
                               holiday_table=None)

    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("SELECT * FROM users WHERE id = %s", (session['user_id'],))
        admin_profile = cursor.fetchone()
        admin_profile['face_image_base64'] = base64.b64encode(admin_profile['face_image']).decode('utf-8') \
            if admin_profile and admin_profile['face_image'] else None

        cursor.execute("SELECT id, username, email, position, face_image FROM users WHERE is_admin = 0")
        users_raw = cursor.fetchall()
        users = []
        for user in users_raw:
            user['face_image_base64'] = base64.b64encode(user['face_image']).decode('utf-8') \
                if user['face_image'] else None
            users.append(user)

        view_filters = {
            'daily': "DATE(a.login_time) = CURDATE()",
            'weekly': "WEEK(a.login_time) = WEEK(CURDATE())",
            'monthly': "MONTH(a.login_time) = MONTH(CURDATE())",
            'yearly': "YEAR(a.login_time) = YEAR(CURDATE())",
        }
        where_clause = view_filters.get(view, "DATE(a.login_time) = CURDATE()")

        query = f"""
            SELECT u.username, u.position, a.id as attendance_id, a.user_id, a.login_time, a.logout_time,
                   a.login_latitude, a.login_longitude, a.logout_latitude, a.logout_longitude,
                   a.daily_status_submitted, a.attendance_status,
                   TIMESTAMPDIFF(SECOND, a.login_time, COALESCE(a.logout_time, NOW())) as seconds_worked
            FROM users u LEFT JOIN attendance a ON u.id = a.user_id
            WHERE {where_clause}
            ORDER BY a.login_time DESC
        """

        def process_records(records):
            for record in records:
                if record['seconds_worked']:
                    h = record['seconds_worked'] // 3600
                    m = (record['seconds_worked'] % 3600) // 60
                    s = record['seconds_worked'] % 60
                    record['hours_worked'] = f"{h:02d}:{m:02d}:{s:02d}"
                    record['color'] = 'red' if h < 9 else 'green'
                else:
                    record['hours_worked'] = "N/A"
                    record['color'] = 'black'

        if search_query:
            cursor.execute("""
                SELECT u.username, u.position,
                       a.id as attendance_id, a.user_id,
                       a.login_time, a.logout_time,
                       a.daily_status_submitted, a.attendance_status,
                       TIMESTAMPDIFF(SECOND, a.login_time, COALESCE(a.logout_time, NOW())) as seconds_worked
                FROM users u
                INNER JOIN attendance a ON u.id = a.user_id
                WHERE u.username LIKE %s
                ORDER BY a.login_time DESC
            """, (f"%{search_query}%",))
        else:
            cursor.execute(query)

        data = cursor.fetchall()
        process_records(data)
        all_attendance = data

        
        # ── Rota File ─────────────────────────────────────────────

        cursor.execute("""
            SELECT
                rota_image,
                rota_filename,
                rota_mime_type
            FROM rota
            ORDER BY id DESC
            LIMIT 1
        """)

        rota_row = cursor.fetchone()

        rota_image_base64 = None
        rota_filename = None
        rota_mime_type = None

        if rota_row:
        
            rota_filename = rota_row.get("rota_filename")

            rota_mime_type = rota_row.get("rota_mime_type")

            if rota_row.get("rota_image"):
                rota_image_base64 = base64.b64encode(
                    rota_row["rota_image"]
                ).decode("utf-8")

        # ── Holiday table (HTML string) ───────────────────────────────────
        cursor.execute("SELECT holiday_table FROM rota ORDER BY id DESC LIMIT 1")
        holiday_row = cursor.fetchone()
        holiday_table = None
        if holiday_row and holiday_row.get('holiday_table'):
            holiday_table = holiday_row['holiday_table']

        # ── Read notifications ────────────────────────────────────────────
        cursor.execute("""
            SELECT n.id, n.message, n.created_at, n.read_at, u.username
            FROM notifications n
            JOIN users u ON n.user_id = u.id
            WHERE n.is_read = 1
            ORDER BY n.read_at DESC
        """)
        read_notifications = cursor.fetchall()

        # ── Tasks ─────────────────────────────────────────────────────────
        cursor.execute("""
            SELECT dt.*, u.username as employee_name
            FROM daily_tasks dt
            LEFT JOIN users u ON u.id = dt.employee_id
            ORDER BY dt.created_at DESC
        """)
        tasks = cursor.fetchall()

        # MANAGE LEAVES
        cursor.execute("""
            SELECT l.*, u.username
            FROM leaves l
            JOIN users u ON l.user_id = u.id
            ORDER BY l.created_at DESC
        """)

        leaves = cursor.fetchall()

        return render_template(
            'admin.html',
            data=data,
            view=view,
            admin_profile=admin_profile,
            users=users,
            all_attendance=all_attendance,
            tasks=tasks,
            search_query=search_query,
            rota_image_base64=rota_image_base64,
            rota_filename=rota_filename,
            rota_mime_type=rota_mime_type,
            holiday_table=holiday_table,
            read_notifications=read_notifications,
            leaves=leaves
        )

    except Exception as e:
        logging.error(f"Admin route error: {str(e)}")
        flash(f"Error loading admin page: {str(e)}", "error")
        return render_template('admin.html', data=[], view=view, admin_profile=None,
                               users=[], all_attendance=[], rota_image_base64=None,
                               holiday_table=None)
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()


def admin_leaves():
    if 'user_id' not in session or not session.get('is_admin'):
        flash("Please login as admin", "error")
        return redirect(url_for('auth.login'))

    conn = get_db_connection()
    if not conn:
        flash("Database connection failed", "error")
        return render_template('admin_leaves.html', leaves=[])

    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT l.id, l.leave_type, l.start_date, l.end_date, l.reason,
                   l.status, l.created_at, l.total_days, l.holiday_days,
                   l.used_paid_days, l.used_unpaid_days, l.used_comp_days,
                   u.username, u.email
            FROM leaves l
            JOIN users u ON l.user_id = u.id
            ORDER BY l.created_at DESC
        """)
        leaves = cursor.fetchall()
        return render_template('admin_leaves.html', leaves=leaves)
    except Exception as e:
        logging.error(f"Admin leaves error: {str(e)}")
        flash(f"Error loading leaves: {str(e)}", "error")
        return render_template('admin_leaves.html', leaves=[])
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()


def update_leave_status(leave_id):

    if not session.get('is_admin'):
        return jsonify({
            "success": False,
            "message": "Access denied"
        }), 403

    status = request.form.get('status', '').strip()
    remarks = request.form.get('remarks', '').strip()

    if status not in ['Approved', 'Rejected']:
        return jsonify({
            "success": False,
            "message": "Invalid status"
        }), 400

    conn = get_db_connection()

    if not conn:
        return jsonify({
            "success": False,
            "message": "Database connection failed"
        }), 500

    cursor = conn.cursor(dictionary=True)

    try:

        # Get leave details
        cursor.execute("""
            SELECT l.*, u.email, u.username
            FROM leaves l
            JOIN users u ON l.user_id = u.id
            WHERE l.id = %s
        """, (leave_id,))

        leave = cursor.fetchone()

        if not leave:
            return jsonify({
                "success": False,
                "message": "Leave not found"
            }), 404

        # Only Pending leaves can be changed
        if leave['status'] != 'Pending':
            return jsonify({
                "success": False,
                "message": f"Leave is already {leave['status']}"
            }), 400

        # -----------------------------------
        # APPROVE
        # -----------------------------------
        if status == 'Approved':

            paid_to_deduct = leave.get('used_paid_days', 0) or 0
            comp_to_deduct = leave.get('used_comp_days', 0) or 0

            # Deduct leave balance
            cursor.execute("""
                UPDATE leave_balance
                SET
                    paid_leaves = GREATEST(paid_leaves - %s, 0),
                    compensation_leaves =
                        GREATEST(compensation_leaves - %s, 0)
                WHERE user_id = %s
            """, (
                paid_to_deduct,
                comp_to_deduct,
                leave['user_id']
            ))

        # -----------------------------------
        # UPDATE LEAVE STATUS + REMARKS
        # -----------------------------------

        cursor.execute("""
            UPDATE leaves
            SET
                status = %s,
                remarks = %s,
                updated_at = NOW()
            WHERE id = %s
        """, (
            status,
            remarks,
            leave_id
        ))

        # Check that the row was actually updated
        if cursor.rowcount != 1:
            conn.rollback()

            return jsonify({
                "success": False,
                "message": "Leave record was not updated"
            }), 500

        # Save changes
        conn.commit()

        # -----------------------------------
        # EMAIL
        # -----------------------------------

        if status == 'Approved':

            email_subject = (
                f"✅ Leave Request Approved – "
                f"{leave['leave_type']}"
            )

            email_body = f"""
Dear {leave['username']},

Your leave request has been APPROVED by the administration.

Leave Details:
━━━━━━━━━━━━━━━━━━━━━━━━━━━
Leave Type : {leave['leave_type']}
From Date  : {leave['start_date']}
To Date    : {leave['end_date']}
Total Days : {leave['total_days']}
Status     : APPROVED

Admin Remarks:
{remarks or 'No remarks provided'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━

Regards,
HR Administration Team
"""

        else:

            email_subject = (
                f"❌ Leave Request Rejected – "
                f"{leave['leave_type']}"
            )

            email_body = f"""
Dear {leave['username']},

Your leave request has been REJECTED by the administration.

Leave Details:
━━━━━━━━━━━━━━━━━━━━━━━━━━━
Leave Type : {leave['leave_type']}
From Date  : {leave['start_date']}
To Date    : {leave['end_date']}
Total Days : {leave['total_days']}
Status     : REJECTED

Admin Remarks:
{remarks or 'No remarks provided'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━

Regards,
HR Administration Team
"""

        try:
            send_email(
                leave['email'],
                email_subject,
                email_body
            )
        except Exception as mail_err:
            logging.warning(
                f"Leave email failed: {mail_err}"
            )

        # -----------------------------------
        # NOTIFICATION
        # -----------------------------------

        cursor.execute("""
            INSERT INTO notifications
                (message, user_id)
            VALUES
                (%s, %s)
        """, (
            f"Your leave request "
            f"({leave['leave_type']}) has been "
            f"{status.lower()}.",
            leave['user_id']
        ))

        conn.commit()

        # -----------------------------------
        # RETURN UPDATED DATA
        # -----------------------------------

        return jsonify({
            "success": True,
            "message": f"Leave {status.lower()} successfully",
            "status": status,
            "remarks": remarks
        })

    except Exception as e:

        conn.rollback()

        logging.error(
            f"Update leave status error: {e}"
        )

        return jsonify({
            "success": False,
            "message": f"Error: {str(e)}"
        }), 500

    finally:

        if conn and conn.is_connected():
            cursor.close()
            conn.close()

def approve_leave(leave_id):
    conn = get_db_connection()
    if not conn:
        return jsonify(success=False, message="Database error")

    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT l.*, u.email, u.username
            FROM leaves l JOIN users u ON l.user_id = u.id
            WHERE l.id = %s
        """, (leave_id,))
        leave = cursor.fetchone()
        if not leave:
            return jsonify(success=False, message="Leave not found")

        paid_to_deduct = leave['used_paid_days'] or 0
        comp_to_deduct = leave.get('used_comp_days', 0) or 0

        cursor.execute("""
            UPDATE leave_balance
            SET
                paid_leaves = GREATEST(paid_leaves - %s, 0),
                compensation_leaves = GREATEST(compensation_leaves - %s, 0)
            WHERE user_id = %s
        """, (paid_to_deduct, comp_to_deduct, leave['user_id']))

        cursor.execute("UPDATE leaves SET status = 'Approved', updated_at = NOW() WHERE id = %s", (leave_id,))
        conn.commit()

        email_body = f"""
Dear {leave['username']},

Your leave request has been APPROVED.

  • Leave Type : {leave['leave_type']}
  • From       : {leave['start_date']}  To: {leave['end_date']}
  • Days       : {leave['total_days']}  ({paid_to_deduct} paid / {leave.get('used_comp_days', 0)} comp / {leave['used_unpaid_days']} unpaid)

Warm regards,
HR Administration Team
        """
        try:
            send_email(leave['email'], f"✅ Leave Approved – {leave['leave_type']}", email_body)
        except Exception as me:
            logging.warning(f"Email failed: {me}")

        cursor.execute("INSERT INTO notifications (message, user_id) VALUES (%s, %s)",
                       (f"Your {leave['leave_type']} has been approved.", leave['user_id']))
        conn.commit()

        return jsonify(success=True, message="Leave approved")
    except Exception as e:
        logging.error(f"Approve leave error: {e}")
        return jsonify(success=False, message=str(e))
    finally:
        cursor.close()
        conn.close()


def reject_leave(leave_id):
    conn = get_db_connection()
    if not conn:
        return jsonify(success=False, message="Database error")

    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT l.*, u.email, u.username
            FROM leaves l JOIN users u ON l.user_id = u.id
            WHERE l.id = %s
        """, (leave_id,))
        leave = cursor.fetchone()
        if not leave:
            return jsonify(success=False, message="Leave not found")

        cursor.execute("UPDATE leaves SET status = 'Rejected', updated_at = NOW() WHERE id = %s", (leave_id,))
        conn.commit()

        email_body = f"""
Dear {leave['username']},

Unfortunately, your leave request has been REJECTED.

  • Leave Type : {leave['leave_type']}
  • From       : {leave['start_date']}  To: {leave['end_date']}

Your leave balance remains unchanged.

Regards,
HR Administration Team
        """
        try:
            send_email(leave['email'], f"❌ Leave Rejected – {leave['leave_type']}", email_body)
        except Exception as me:
            logging.warning(f"Email failed: {me}")

        cursor.execute("INSERT INTO notifications (message, user_id) VALUES (%s, %s)",
                       (f"Your {leave['leave_type']} has been rejected.", leave['user_id']))
        conn.commit()

        return jsonify(success=True, message="Leave rejected")
    except Exception as e:
        logging.error(f"Reject leave error: {e}")
        return jsonify(success=False, message=str(e))
    finally:
        cursor.close()
        conn.close()


def admin_update_user(user_id):
    if not session.get('is_admin'):
        return jsonify({"success": False, "message": "Access denied"})

    username = request.form.get('username', '').strip()
    email = request.form.get('email', '').strip().lower()
    position = request.form.get('position', '').strip()
    face_image = request.files.get('face_image')

    if not username and not email and not position and not face_image:
        return jsonify({
            "success": False,
            "message": "No changes provided"
        })
# =====================================================
# EMAIL VALIDATION
# Allow only Jhaishna company email or Gmail
# =====================================================
    if email:
        if not (
            email.endswith('@jhaishna.com') or
            email.endswith('@gmail.com')
        ):
            return jsonify({
                "success": False,
                "message": "Please use a valid Jhaishna company email (@jhaishna.com) or Gmail address (@gmail.com)"
            }), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({"success": False, "message": "Database error"})

    cursor = conn.cursor()
    try:
        updates = []
        params = []
        if username:
            updates.append("username = %s")
            params.append(username)
        if email:
            updates.append("email = %s")
            params.append(email)
        if position is not None:
            if position.strip() == "":
                return jsonify({"success": False, "message": "Position is required"})
            updates.append("position = %s")
            params.append(position)
        if face_image and face_image.filename:
            filename = face_image.filename.strip()
            extension = os.path.splitext(filename)[1].lower()
        
            allowed_extensions = {
                ".jpg",
                ".jpeg",
                ".png",
                ".pdf",
                
            }
        
            if extension not in allowed_extensions:
                return jsonify({
                    "success": False,
                    "message": "Invalid file type. Only JPG, JPEG, PNG, PDF, files are allowed."
                }), 400
        
            face_image_data = face_image.read()
        
            if not face_image_data:
                return jsonify({
                    "success": False,
                    "message": "Uploaded file is empty."
                }), 400
        
            updates.append("face_image = %s")
            params.append(face_image_data)
        
        params.append(user_id)
        query = f"UPDATE users SET {', '.join(updates)} WHERE id = %s"
        cursor.execute(query, tuple(params))
        conn.commit()
        return jsonify({"success": True, "message": "User updated"})
    except mysql.connector.IntegrityError:
        return jsonify({"success": False, "message": "Username or email already exists"})
    except Exception as e:
        return jsonify({"success": False, "message": f"Error: {str(e)}"})
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()


def upload_rota():

    if not session.get('is_admin'):
        return jsonify({
            "success": False,
            "message": "Access denied"
        }), 403

    file = request.files.get('rota_image')

    if not file or not file.filename:
        return jsonify({
            "success": False,
            "message": "No rota file uploaded"
        }), 400

    filename = file.filename.strip()
    extension = os.path.splitext(filename)[1].lower()

    allowed_extensions = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".pdf": "application/pdf",
      ".doc": "application/msword",
      ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ".xls": "application/vnd.ms-excel",
      ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ".csv": "text/csv"
    }
    
    if extension not in allowed_extensions:
        return jsonify({
            "success": False,
            "message": (
                "Invalid rota file. "
                "Allowed formats: JPG, JPEG, PNG, PDF, DOC, DOCX, XLS, XLSX and CSV."
            )
        }), 400

    

    file_data = file.read()

    if not file_data:
        return jsonify({
            "success": False,
            "message": "Uploaded rota file is empty"
        }), 400

    # Create unique hash for duplicate detection
    file_hash = hashlib.sha256(file_data).hexdigest()

    conn = get_db_connection()

    if not conn:
        return jsonify({
            "success": False,
            "message": "Database connection failed"
        }), 500

    cursor = conn.cursor(dictionary=True)

    try:

        # ---------------------------------------------
        # DUPLICATE CHECK
        # ---------------------------------------------

        cursor.execute(
            """
            SELECT id
            FROM rota
            WHERE rota_hash = %s
            LIMIT 1
            """,
            (file_hash,)
        )

        duplicate = cursor.fetchone()

        if duplicate:
            return jsonify({
                "success": False,
                "message": "This rota file has already been uploaded."
            }), 409

        # ---------------------------------------------
        # MIME TYPE
        # ---------------------------------------------

        mime_map = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",

    ".pdf": "application/pdf",

    ".doc": "application/msword",

    ".docx": (
        "application/vnd.openxmlformats-officedocument."
        "wordprocessingml.document"
    ),

    ".xls": "application/vnd.ms-excel",

    ".xlsx": (
        "application/vnd.openxmlformats-officedocument."
        "spreadsheetml.sheet"
    ),

    ".csv": "text/csv",
}
        
        mime_type = mime_map.get(
            extension,
            "application/octet-stream"
        )

        # ---------------------------------------------
        # SAVE
        # ---------------------------------------------

        cursor.execute(
            """
            INSERT INTO rota
            (
                rota_image,
                rota_filename,
                rota_mime_type,
                rota_hash
            )
            VALUES (%s, %s, %s, %s)
            """,
            (
                file_data,
                filename,
                mime_type,
                file_hash
            )
        )
# ---------------------------------------------
# SEND ROTA UPLOAD NOTIFICATION TO ALL EMPLOYEES
# ---------------------------------------------

        cursor.execute("SELECT id FROM users WHERE is_admin = 0")
        users = cursor.fetchall()

        for user in users:
            cursor.execute("""
                INSERT INTO notifications (message, user_id)
                VALUES (%s, %s)
            """, (
                f"New Rota Schedule uploaded by Admin: {filename}",
                user['id']
            ))

        # Save rota and notifications together
        conn.commit()

        # Return current file immediately
        encoded = base64.b64encode(
            file_data
        ).decode("utf-8")

        return jsonify({
            "success": True,
            "message": "Rota uploaded successfully",
            "rota_image_base64": encoded,
            "rota_filename": filename,
            "rota_mime_type": mime_type
        })

    except Exception as e:

        conn.rollback()

        logging.exception(
            "Rota upload error"
        )

        return jsonify({
            "success": False,
            "message": f"Error uploading rota: {str(e)}"
        }), 500

    finally:

        cursor.close()
        conn.close()

def upload_holiday():
    if not session.get('is_admin'):
        return jsonify({
            "success": False,
            "message": "Access denied"
        }), 403

    file = request.files.get('holiday_image')

    if not file:
        return jsonify({
            "success": False,
            "message": "No file uploaded"
        }), 400

    filename = file.filename.lower().strip()
    file_ext = os.path.splitext(filename)[1]

    allowed_extensions = [
        '.doc',
        '.docx',
        '.xls',
        '.xlsx',
        '.csv'
    ]

    if file_ext not in allowed_extensions:
        return jsonify({
            "success": False,
            "message": "Only Word, Excel or CSV files are allowed"
        }), 400

    try:
        # =====================================================
        # WORD DOCUMENT
        # =====================================================
        if file_ext == '.docx':

            document = Document(file)

            rows = []

            # Read tables from Word document
            for table in document.tables:
                for row in table.rows:
                    rows.append([
                        cell.text.strip()
                        for cell in row.cells
                    ])

            if not rows:
                return jsonify({
                    "success": False,
                    "message": "No table data found in the Word document"
                }), 400

            # First row = header
            headers = rows[0]
            data_rows = rows[1:]

            df = pd.DataFrame(
                data_rows,
                columns=headers
            )

        # =====================================================
        # CSV
        # =====================================================
        elif file_ext == '.csv':

            df = pd.read_csv(file)

        # =====================================================
        # EXCEL
        # =====================================================
        elif file_ext in ['.xls', '.xlsx']:

            df = pd.read_excel(file)

        # =====================================================
        # CLEAN DATA
        # =====================================================

        df.dropna(how='all', inplace=True)
        df.fillna('', inplace=True)

        table_html = df.to_html(
            classes='holiday-data-table',
            index=False,
            border=0,
            escape=True
        )

        # =====================================================
        # SAVE TO DATABASE
        # =====================================================

        conn = get_db_connection()

        if not conn:
            return jsonify({
                "success": False,
                "message": "Database connection failed"
            }), 500

        cursor = conn.cursor()


        # Check whether rota row already exists
        cursor.execute(
            "SELECT id FROM rota ORDER BY id DESC LIMIT 1"
        )

        existing_row = cursor.fetchone()

        if existing_row:
            # Update existing holiday list
            cursor.execute("""
                UPDATE rota
                SET holiday_table = %s
                WHERE id = %s
            """, (
                table_html,
                existing_row[0]
            ))
        else:
            # Insert new holiday list
            cursor.execute("""
                INSERT INTO rota (holiday_table)
                VALUES (%s)
            """, (table_html,))

        # ---------------------------------------------
        # SEND HOLIDAY NOTIFICATION TO ALL EMPLOYEES
        # ---------------------------------------------

        cursor.execute("""
            SELECT id FROM users WHERE is_admin = 0
        """)

        users = cursor.fetchall()

        for user in users:
            cursor.execute("""
                INSERT INTO notifications (message, user_id)
                VALUES (%s, %s)
            """, (
                f"New Holiday List uploaded by Admin: {filename}",
                user[0]
            ))

        # Save holiday list and notifications together
        conn.commit()

        cursor.close()
        conn.close()

        logging.info(
            f"Holiday list uploaded successfully: {filename}"
        )

        return jsonify({
            "success": True,
            "message": "Holiday list uploaded successfully!",
            "holiday_table": table_html
        }), 200

    except Exception as e:

        logging.exception(
            "upload_holiday error"
        )

        return jsonify({
            "success": False,
            "message": f"Failed to process file: {str(e)}"
        }), 500

def send_notification():
    if not session.get('is_admin'):
        return jsonify({"success": False, "message": "Access denied"})

    message = request.form.get('message')
    if not message:
        return jsonify({"success": False, "message": "No message provided"})

    conn = get_db_connection()
    if not conn:
        return jsonify({"success": False, "message": "Database error"})

    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT id FROM users WHERE is_admin = 0")
        users = cursor.fetchall()
        if not users:
            return jsonify({"success": False, "message": "No non-admin users found"})

        for user in users:
            cursor.execute("INSERT INTO notifications (message, user_id) VALUES (%s, %s)", (message, user['id']))
        conn.commit()
        return jsonify({"success": True, "message": "Notification sent to all users"})
    except Exception as e:
        return jsonify({"success": False, "message": f"Error: {str(e)}"})
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()


def update_attendance_status(attendance_id):
    if not session.get('is_admin'):
        return jsonify({"success": False, "message": "Access denied"})

    status = request.form.get('status')
    if status not in ['Present', 'Absent']:
        return jsonify({"success": False, "message": "Invalid status"})

    conn = get_db_connection()
    if not conn:
        return jsonify({"success": False, "message": "Database error"})

    cursor = conn.cursor()
    try:
        cursor.execute("UPDATE attendance SET attendance_status = %s WHERE id = %s", (status, attendance_id))
        conn.commit()
        return jsonify({"success": True, "message": "Attendance status updated"})
    except Exception as e:
        return jsonify({"success": False, "message": f"Error: {str(e)}"})
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()


def view_excel():
    if not session.get('is_admin'):
        flash("Please login as admin", "error")
        return redirect(url_for('auth.login'))

    conn = get_db_connection()
    if not conn:
        flash("Database connection failed", "error")
        return render_template('view_excel.html', table="")

    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT u.username, a.login_time, a.logout_time, a.daily_status_submitted, a.attendance_status,
                   TIMESTAMPDIFF(SECOND, a.login_time, COALESCE(a.logout_time, NOW())) as seconds_worked
            FROM users u LEFT JOIN attendance a ON u.id = a.user_id
        """)
        data = cursor.fetchall()
        if not data:
            flash("No attendance data available", "warning")
            return render_template('view_excel.html', table="")

        for record in data:
            if record['seconds_worked']:
                h = record['seconds_worked'] // 3600
                m = (record['seconds_worked'] % 3600) // 60
                s = record['seconds_worked'] % 60
                record['hours_worked'] = f"{h:02d}:{m:02d}:{s:02d}"
            else:
                record['hours_worked'] = "N/A"

        df = pd.DataFrame(data)[['username', 'login_time', 'logout_time',
                                  'daily_status_submitted', 'attendance_status', 'hours_worked']]
        html_table = df.to_html(index=False, classes='table table-striped')
        return render_template('view_excel.html', table=html_table)
    except Exception as e:
        flash(f"Error: {str(e)}", "error")
        return render_template('view_excel.html', table="")
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()


def export_page():
    if not session.get('is_admin'):
        flash("Please login as admin", "error")
        return redirect(url_for('auth.login'))
    return render_template('export.html')


def export():
    if not session.get('is_admin'):
        flash("Access denied", "error")
        return redirect(url_for('admin.admin'))

    conn = get_db_connection()
    if not conn:
        flash("Database connection failed", "error")
        return redirect(url_for('admin.admin'))

    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT u.username, a.login_time, a.logout_time, a.daily_status_submitted, a.attendance_status,
                   TIMESTAMPDIFF(SECOND, a.login_time, COALESCE(a.logout_time, NOW())) as seconds_worked
            FROM users u LEFT JOIN attendance a ON u.id = a.user_id
        """)
        data = cursor.fetchall()
        if not data:
            flash("No attendance data to export", "warning")
            return redirect(url_for('admin.admin'))

        for record in data:
            if record['seconds_worked']:
                h = record['seconds_worked'] // 3600
                m = (record['seconds_worked'] % 3600) // 60
                s = record['seconds_worked'] % 60
                record['hours_worked'] = f"{h:02d}:{m:02d}:{s:02d}"
            else:
                record['hours_worked'] = "N/A"

        df = pd.DataFrame(data)[['username', 'login_time', 'logout_time',
                                  'daily_status_submitted', 'attendance_status', 'hours_worked']]
        output = BytesIO()
        with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
            df.to_excel(writer, sheet_name='Attendance', index=False)
            worksheet = writer.sheets['Attendance']
            for col, width in [('A:A', 20), ('B:C', 20), ('D:D', 30), ('E:E', 15), ('F:F', 15)]:
                worksheet.set_column(col, width)
        output.seek(0)
        return send_file(output, download_name='attendance.xlsx', as_attachment=True)
    except Exception as e:
        flash(f"Error: {str(e)}", "error")
        return redirect(url_for('admin.admin'))
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()


def update_profile():
    if not session.get('user_id'):
        return jsonify({"success": False, "message": "Not logged in"})

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        email = request.form.get('email', '').strip().lower()
        face_image = request.files.get('face_image')

        # Allow only Jhaishna company email or Gmail
        if not (
            email.endswith('@jhaishna.com') or
            email.endswith('@gmail.com')
        ):
            return jsonify({
                "success": False,
                "message": "Please use a valid Jhaishna company email (@jhaishna.com) or Gmail address (@gmail.com)"
            }), 400

        if face_image and face_image.filename != '':
            image_data = face_image.read()
            cursor.execute("""
                UPDATE users SET email=%s, face_image=%s WHERE id=%s
            """, (email, image_data, session['user_id']))
        else:
            cursor.execute("""
                UPDATE users SET email=%s WHERE id=%s
            """, (email, session['user_id']))

        conn.commit()
        return jsonify({"success": True})

    except Exception as e:
        conn.rollback()
        print("ERROR:", e)
        return jsonify({"success": False, "message": "Error updating profile"})

    finally:
        cursor.close()
        conn.close()


def delete_user(user_id):
    if not session.get('is_admin'):
        return jsonify({"success": False, "message": "Access denied"})

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("DELETE FROM leave_balance WHERE user_id = %s", (user_id,))
        cursor.execute("DELETE FROM leaves WHERE user_id = %s", (user_id,))
        cursor.execute("DELETE FROM attendance WHERE user_id = %s", (user_id,))
        cursor.execute("DELETE FROM users WHERE id = %s", (user_id,))
        conn.commit()
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})
    finally:
        cursor.close()
        conn.close()


def assign_task():
    # Only logged-in admins can assign tasks
    if 'user_id' not in session or not session.get('is_admin'):
        return jsonify({
            "success": False,
            "message": "Admin access required"
        }), 403

    employee_id = request.form.get('employee_id', '').strip()
    project_name = request.form.get('project_name', '').strip()
    task_name = request.form.get('task_name', '').strip()
    from_date = request.form.get('from_date', '').strip()
    to_date = request.form.get('to_date', '').strip()

    if not all([employee_id, project_name, task_name, from_date, to_date]):
        return jsonify({
            "success": False,
            "message": "Please fill in all task details"
        }), 400

    try:
        employee_id = int(employee_id)
        start_date = datetime.strptime(from_date, "%Y-%m-%d").date()
        end_date = datetime.strptime(to_date, "%Y-%m-%d").date()
    except (ValueError, TypeError):
        return jsonify({
            "success": False,
            "message": "Invalid employee ID or date format"
        }), 400

    if end_date < start_date:
        return jsonify({
            "success": False,
            "message": "To Date cannot be earlier than From Date"
        }), 400

    conn = get_db_connection()

    if not conn:
        return jsonify({
            "success": False,
            "message": "Database connection failed"
        }), 500

    cursor = conn.cursor(dictionary=True)

    try:
        # Confirm the selected employee exists and is not an admin
        cursor.execute("""
            SELECT id, username
            FROM users
            WHERE id = %s AND is_admin = 0
        """, (employee_id,))

        employee = cursor.fetchone()

        if not employee:
            return jsonify({
                "success": False,
                "message": "Selected employee was not found"
            }), 404

        time_period = (
            f"{start_date.strftime('%Y-%m-%d')} To "
            f"{end_date.strftime('%Y-%m-%d')}"
        )

        cursor.execute("""
            INSERT INTO daily_tasks
                (employee_id, project_name, task_name, time_period, status)
            VALUES (%s, %s, %s, %s, %s)
        """, (
            employee_id,
            project_name,
            task_name,
            time_period,
            'Pending'
        ))

        task_id = cursor.lastrowid

        cursor.execute("""
            INSERT INTO notifications (message, user_id)
            VALUES (%s, %s)
        """, (
            f"New task assigned: '{task_name}' "
            f"for project '{project_name}' ({time_period}).",
            employee_id
        ))

        conn.commit()

        return jsonify({
            "success": True,
            "message": f"Task assigned to {employee['username']} successfully",
            "task_id": task_id
        }), 201

    except Exception as e:
        conn.rollback()
        logging.exception("Task assignment failed")

        return jsonify({
            "success": False,
            "message": "Unable to assign task. Please check the server logs."
        }), 500

    finally:
        cursor.close()
        conn.close()



def approve_task(task_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT dt.*, u.username
            FROM daily_tasks dt
            JOIN users u ON u.id = dt.employee_id
            WHERE dt.id = %s
        """, (task_id,))
        task = cursor.fetchone()

        if task:
            cursor.execute("""
                UPDATE daily_tasks SET status = 'Approved' WHERE id = %s
            """, (task_id,))

            cursor.execute("""
                INSERT INTO notifications (message, user_id)
                VALUES (%s, %s)
            """, (
                f"Your task '{task['task_name']}' for project '{task['project_name']}' has been approved! ✅",
                task['employee_id']
            ))
            conn.commit()

    except Exception as e:
        logging.error(f"approve_task error: {e}")
    finally:
        cursor.close()
        conn.close()

    return jsonify({
    "success": True,
    "message": "Task approved successfully"
})


def reject_task(task_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        # Get task + employee details
        cursor.execute("""
            SELECT dt.*, u.email, u.username
            FROM daily_tasks dt
            JOIN users u ON u.id = dt.employee_id
            WHERE dt.id = %s
        """, (task_id,))
        task = cursor.fetchone()

        if not task:
            flash("Task not found", "error")
            return redirect(url_for('admin.admin'))

        # Mark task as Rejected
        cursor.execute("""
            UPDATE daily_tasks SET status = 'Rejected' WHERE id = %s
        """, (task_id,))

        # Mark attendance as Absent for all dates in time_period
        from datetime import datetime, timedelta
        dates = task['time_period'].split(" To ")
        from_date = datetime.strptime(dates[0], "%Y-%m-%d").date()
        to_date = datetime.strptime(dates[1], "%Y-%m-%d").date()

        current_date = from_date
        while current_date <= to_date:
            cursor.execute("""
                UPDATE attendance
                SET attendance_status = 'Absent'
                WHERE user_id = %s
                AND DATE(login_time) = %s
            """, (task['employee_id'], current_date))
            current_date += timedelta(days=1)

        conn.commit()

        # Send email notification
        email_subject = "⚠️ Daily Task Rejected — Attendance Marked Absent"
        email_body = f"""
Dear {task['username']},

We regret to inform you that your daily task has been REJECTED by the admin.

Task Details:
  • Project     : {task['project_name']}
  • Task        : {task['task_name']}
  • Time Period : {task.get('time_period') or 'N/A'}
  • Status      : ❌ REJECTED

Your attendance for all days in this period has been marked as ABSENT.

Regards,
HR Administration Team
        """
        try:
            send_email(task['email'], email_subject, email_body)
        except Exception as mail_err:
            logging.warning(f"Task rejection email failed: {mail_err}")

        # Add in-app notification
        cursor.execute("""
            INSERT INTO notifications (message, user_id)
            VALUES (%s, %s)
        """, (
            f"Your task '{task['task_name']}' for project '{task['project_name']}' has been rejected. Attendance marked Absent.",
            task['employee_id']
        ))
        conn.commit()

    except Exception as e:
        logging.error(f"reject_task error: {e}")
        flash(f"Error: {str(e)}", "error")
    finally:
        cursor.close()
        conn.close()

    return jsonify({
    "success": True,
    "message": "Task rejected successfully"
})

    # =========================================================
# REACT ADMIN DASHBOARD API
# =========================================================

def admin_api_data():

    if 'user_id' not in session or not session.get('is_admin'):
        return jsonify({
            "success": False,
            "message": "Access denied"
        }), 403

    conn = get_db_connection()

    if not conn:
        return jsonify({
            "success": False,
            "message": "Database connection failed"
        }), 500

    cursor = conn.cursor(dictionary=True)

    try:

        # -------------------------------------------------
        # ADMIN PROFILE
        # -------------------------------------------------

        cursor.execute(
            """
            SELECT id, username, email, position, face_image
            FROM users
            WHERE id = %s
            """,
            (session['user_id'],)
        )

        admin_profile = cursor.fetchone()

        if admin_profile:
            admin_profile['face_image_base64'] = (
                base64.b64encode(
                    admin_profile['face_image']
                ).decode('utf-8')
                if admin_profile.get('face_image')
                else None
            )

            admin_profile.pop('face_image', None)


        # -------------------------------------------------
        # USERS
        # -------------------------------------------------

        cursor.execute(
            """
            SELECT id, username, email, position, face_image
            FROM users
            WHERE is_admin = 0
            ORDER BY id DESC
            """
        )

        users = cursor.fetchall()

        for user in users:

            user['face_image_base64'] = (
                base64.b64encode(
                    user['face_image']
                ).decode('utf-8')
                if user.get('face_image')
                else None
            )

            user.pop('face_image', None)


        # -------------------------------------------------
        # ATTENDANCE
        # -------------------------------------------------

        cursor.execute(
            """
            SELECT
                u.username,
                u.position,
                a.id AS attendance_id,
                a.user_id,
                a.login_time,
                a.logout_time,
                a.login_latitude,
                a.login_longitude,
                a.logout_latitude,
                a.logout_longitude,
                a.daily_status_submitted,
                a.attendance_status,

                TIMESTAMPDIFF(
                    SECOND,
                    a.login_time,
                    COALESCE(a.logout_time, NOW())
                ) AS seconds_worked

            FROM users u

            LEFT JOIN attendance a
                ON u.id = a.user_id

            ORDER BY a.login_time DESC
            """
        )

        attendance = cursor.fetchall()

        for record in attendance:

            seconds = record.get('seconds_worked')

            if seconds is not None:

                hours = seconds // 3600
                minutes = (seconds % 3600) // 60
                secs = seconds % 60

                record['hours_worked'] = (
                    f"{hours:02d}:{minutes:02d}:{secs:02d}"
                )

                record['color'] = (
                    'red' if hours < 9 else 'green'
                )

            else:

                record['hours_worked'] = "N/A"
                record['color'] = "black"

            record.pop('seconds_worked', None)


        # -------------------------------------------------
        # TASKS
        # -------------------------------------------------

        cursor.execute(
            """
            SELECT
                dt.*,
                u.username AS employee_name

            FROM daily_tasks dt

            LEFT JOIN users u
                ON u.id = dt.employee_id

            ORDER BY dt.created_at DESC
            """
        )

        tasks = cursor.fetchall()


        # -------------------------------------------------
        # LEAVES
        # -------------------------------------------------

        cursor.execute(
            """
            SELECT
                l.*,
                u.username,
                u.email

            FROM leaves l

            JOIN users u
                ON l.user_id = u.id

            ORDER BY l.created_at DESC
            """
        )

        leaves = cursor.fetchall()


        # -------------------------------------------------
        # NOTIFICATIONS
        # -------------------------------------------------

        cursor.execute(
            """
            SELECT
                n.id,
                n.message,
                n.created_at,
                n.read_at,
                n.is_read,
                u.username

            FROM notifications n

            JOIN users u
                ON n.user_id = u.id

            ORDER BY n.created_at DESC
            """
        )

        notifications = cursor.fetchall()


    # -------------------------------------------------
    # ROTA
    # -------------------------------------------------

        cursor.execute(
            """
            SELECT
                rota_image,
                rota_filename,
                rota_mime_type
            FROM rota
            ORDER BY id DESC
            LIMIT 1
            """
        )

        rota_row = cursor.fetchone()

        rota_image_base64 = None
        rota_filename = None
        rota_mime_type = None

        if rota_row:
        
            rota_filename = rota_row.get(
                "rota_filename"
            )

            rota_mime_type = rota_row.get(
                "rota_mime_type"
            )

            if rota_row.get("rota_image"):
            
                rota_image_base64 = base64.b64encode(
                    rota_row["rota_image"]
                ).decode("utf-8")

        # -------------------------------------------------
        # HOLIDAY TABLE
        # -------------------------------------------------

        cursor.execute(
            """
            SELECT holiday_table
            FROM rota
            ORDER BY id DESC
            LIMIT 1
            """
        )

        holiday_row = cursor.fetchone()

        holiday_table = None

        if holiday_row:
            holiday_table = holiday_row.get(
                'holiday_table'
            )


        # -------------------------------------------------
        # RESPONSE
        # -------------------------------------------------

        return jsonify({

            "success": True,

            "adminProfile": admin_profile,

            "users": users,

            "attendance": attendance,

            "allAttendance": attendance,

            "tasks": tasks,

            "leaves": leaves,

            "notifications": notifications,

            "rotaImage": rota_image_base64,
            "rotaFilename": rota_filename,
            "rotaMimeType": rota_mime_type,

            "holidayTable": holiday_table
        })


    except Exception as e:

        logging.exception(
            "React Admin API error"
        )

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500


    finally:

        if conn and conn.is_connected():
            cursor.close()
            conn.close()
def view_task_document(task_id):

    # Only logged-in Admin can view task documents
    if 'user_id' not in session or not session.get('is_admin'):
        return jsonify({
            "success": False,
            "message": "Admin access required"
        }), 403

    conn = get_db_connection()

    if not conn:
        return jsonify({
            "success": False,
            "message": "Database connection failed"
        }), 500

    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT document_path
            FROM daily_tasks
            WHERE id = %s
        """, (task_id,))

        task = cursor.fetchone()

        if not task or not task.get('document_path'):
            return jsonify({
                "success": False,
                "message": "Document not found"
            }), 404

        # Backend folder path
        backend_folder = os.path.dirname(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        )

        document_path = os.path.abspath(
            os.path.join(backend_folder, task['document_path'])
        )

        # Prevent access outside backend folder
        if os.path.commonpath([
            backend_folder,
            document_path
        ]) != os.path.abspath(backend_folder):
            return jsonify({
                "success": False,
                "message": "Invalid document path"
            }), 403

        if not os.path.isfile(document_path):
            return jsonify({
                "success": False,
                "message": "Uploaded document does not exist"
            }), 404

        return send_file(
            document_path,
            as_attachment=False,
            download_name=os.path.basename(document_path)
        )

    except Exception as e:
        logging.exception("View task document error")

        return jsonify({
            "success": False,
            "message": "Unable to open task document"
        }), 500

    finally:
        cursor.close()
        conn.close()