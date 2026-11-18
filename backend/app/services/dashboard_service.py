from flask import Blueprint, render_template, session, redirect, request
from utils import get_db_connection
import base64
from datetime import datetime, timedelta
import pytz
from app.services.leave_service import sync_monthly_carryforward
import re   
import os
from werkzeug.utils import secure_filename


def dashboard():
    if 'user_id' not in session:
        return redirect('/auth/login')

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    # USER
    cursor.execute("SELECT * FROM users WHERE id=%s", (session['user_id'],))
    user = cursor.fetchone()

    user_face_image_base64 = None
    if user and user.get('face_image'):
        user_face_image_base64 = base64.b64encode(user['face_image']).decode('utf-8')

    # ATTENDANCE
    india = pytz.timezone('Asia/Kolkata')
    today = datetime.now(india).date()

    cursor.execute("""
        SELECT * FROM attendance
        WHERE user_id=%s AND DATE(login_time)=%s
        ORDER BY id DESC LIMIT 1
    """, (session['user_id'], today))

    attendance = cursor.fetchone()

    last_login = None
    last_logout = None
    daily_status_submitted = False
    logout_done = False
    can_login = False

    if not attendance:
        can_login = True
    else:
        last_login = attendance.get('login_time')
        last_logout = attendance.get('logout_time')
        daily_status_submitted = attendance.get('daily_status_submitted') == 1
        logout_done = last_logout is not None

    # CALENDAR
    cursor.execute("""
        SELECT DATE(login_time) as date, attendance_status
        FROM attendance
        WHERE user_id=%s
    """, (session['user_id'],))

    records = cursor.fetchall()
    calendar_data = {}
    # Get holiday dates
    cursor.execute("SELECT holiday_date FROM holidays")
    holiday_rows = cursor.fetchall()

    holiday_dates = []

    for h in holiday_rows:
        holiday_dates.append(str(h['holiday_date']))

    start_date = today.replace(day=1)
    next_month = today.replace(month=today.month % 12 + 1, day=1)
    end_date = next_month - timedelta(days=1)

    current = start_date
    # while current <= end_date:
    #     calendar_data[str(current)] = False
    #     current += timedelta(days=1)
    while current <= end_date:

    # Future dates should stay empty
        if current > today:
            calendar_data[str(current)] = "future"
        else:
            calendar_data[str(current)] = "absent"

        current += timedelta(days=1)

    for r in records:
        if r['date'] and r['attendance_status']:
             calendar_data[str(r['date'])] = r['attendance_status'].lower()

    # LEAVES
    balance = sync_monthly_carryforward(conn, session['user_id'])

    cursor.execute("""
        SELECT leave_type, start_date, end_date, total_days,
               used_paid_days, used_unpaid_days, status, created_at
        FROM leaves
        WHERE user_id=%s
        ORDER BY created_at DESC
    """, (session['user_id'],))

    user_leaves = cursor.fetchall()

    # ROTA image
    cursor.execute("SELECT rota_image FROM rota ORDER BY id DESC LIMIT 1")
    rota_row = cursor.fetchone()
    rota_image_base64 = None
    if rota_row and rota_row.get('rota_image'):
        rota_image_base64 = base64.b64encode(rota_row['rota_image']).decode('utf-8')

    # HOLIDAY TABLE
    # HOLIDAY TABLE
    cursor.execute("SELECT holiday_table FROM rota ORDER BY id DESC LIMIT 1")
    holiday_row = cursor.fetchone()
    
    if holiday_row and holiday_row.get('holiday_table'):
        holiday_table = holiday_row['holiday_table']
    else:
        holiday_table = ""   # safe fallback
    
    def fix_date(match):
        date_part = match.group().split(" ")[0]
        y, m, d = date_part.split("-")
        return f"{d}-{m}-{y}"
    
    holiday_table = re.sub(
        r"\d{4}-\d{2}-\d{2}(?:\s\d{2}:\d{2}:\d{2})?",
        fix_date,
        holiday_table
) 

    # NOTIFICATIONS
    cursor.execute("""
        SELECT id, message, created_at, is_read
        FROM notifications
        WHERE user_id=%s
        ORDER BY created_at DESC
        LIMIT 20
    """, (session['user_id'],))
    notifications = cursor.fetchall()

    paid_leave_balance = balance.get('paid_leaves', 0) if balance else 0
    compensation_leaves = balance.get('compensation_leaves', 0) if balance else 0

    cursor.execute("""
        SELECT email, position, created_at
        FROM users WHERE id=%s
    """, (session['user_id'],))
    extra = cursor.fetchone()
    user_email = extra['email'] if extra else ''
    user_position = extra['position'] if extra else ''
    created_at = extra['created_at'] if extra else None

    # DAILY TASK HISTORY
    cursor.execute("""
        SELECT *
        FROM daily_tasks
        WHERE employee_id = %s
        ORDER BY created_at DESC
    """, (session['user_id'],))
    
    tasks = cursor.fetchall()



    # LATEST UPCOMING HOLIDAY
    cursor.execute("""
        SELECT holiday_name, holiday_date
        FROM holidays
        WHERE holiday_date >= CURDATE()
        ORDER BY holiday_date ASC
        LIMIT 1
    """)
    
    latest_holiday = cursor.fetchone()

    cursor.close()
    conn.close()


    # ✅ Read flag and immediately delete it — False on every refresh after first load
    show_modal = session.pop('show_admin_modal', False)

    return render_template(
        'dashboard.html',
        tasks=tasks,
        show_modal=show_modal,
        user=user,
        created_at=created_at,
        user_email=user_email,
        user_position=user_position,
        user_face_image_base64=user_face_image_base64,
        calendar_data=calendar_data,
        last_login=last_login,
        last_logout=last_logout,
        daily_status_submitted=daily_status_submitted,
        logout_done=logout_done,
        can_login=can_login,
        user_leaves=user_leaves,
        rota_image_base64=rota_image_base64,
        holiday_table=holiday_table,
        notifications=notifications,
        paid_leave_balance=paid_leave_balance,
        compensation_leaves=compensation_leaves,
        holiday_dates=holiday_dates,
        latest_holiday=latest_holiday
    )


def check_admin():
    user_id = session.get('user_id')

    if not user_id:
        return {"is_admin": 0}

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("SELECT is_admin FROM users WHERE id = %s", (user_id,))
    user = cursor.fetchone()

    cursor.close()
    conn.close()

    if user and user['is_admin'] == 1:
        return {"is_admin": 1}
    else:
        return {"is_admin": 0}
    

def add_task():

    # Check login
    if 'user_id' not in session:
        return {
            "success": False,
            "message": "User not logged in"
        }, 401

    # Get form values
    project_name = (request.form.get('project_name') or '').strip()
    task_name = (request.form.get('task_name') or '').strip()

    from_date = request.form.get('from_date')
    to_date = request.form.get('to_date')

    # Validate required fields
    if not project_name or not task_name or not from_date or not to_date:
        return {
            "success": False,
            "message": "All task fields are required"
        }, 400

    # Validate date order
    try:
        start_date = datetime.strptime(
            from_date,
            "%Y-%m-%d"
        ).date()

        end_date = datetime.strptime(
            to_date,
            "%Y-%m-%d"
        ).date()

        if start_date > end_date:
            return {
                "success": False,
                "message": "To Date cannot be before From Date"
            }, 400

    except ValueError:
        return {
            "success": False,
            "message": "Invalid date format"
        }, 400

    time_period = f"{from_date} To {to_date}"

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:

        # ============================================================
        # CHECK DUPLICATE TASK
        # Same employee + project + task + time period
        # ============================================================

        cursor.execute("""
            SELECT id, status
            FROM daily_tasks
            WHERE employee_id = %s
              AND LOWER(TRIM(project_name)) = LOWER(TRIM(%s))
              AND LOWER(TRIM(task_name)) = LOWER(TRIM(%s))
              AND time_period = %s
            LIMIT 1
        """, (
            session['user_id'],
            project_name,
            task_name,
            time_period
        ))

        existing_task = cursor.fetchone()

        if existing_task:

            current_status = (
                existing_task.get('status')
                or 'Pending'
            )

            return {
                "success": False,
                "duplicate": True,
                "message": (
                    "This task has already been submitted "
                    "for the selected time period. "
                    f"Current status: {current_status}."
                )
            }, 409

        # ============================================================
        # INSERT NEW TASK
        # ============================================================

        cursor.execute("""
            INSERT INTO daily_tasks
            (
                employee_id,
                project_name,
                task_name,
                time_period
            )
            VALUES (%s, %s, %s, %s)
        """, (
            session['user_id'],
            project_name,
            task_name,
            time_period
        ))

        conn.commit()

        return {
            "success": True,
            "message": "Daily task added successfully"
        }, 200

    except Exception as e:

        conn.rollback()

        print("❌ ADD TASK ERROR:", str(e))

        return {
            "success": False,
            "message": "Failed to add daily task"
        }, 500

    finally:

        cursor.close()
        conn.close()

def submit_task(task_id):
    if 'user_id' not in session:
        return {
            "success": False,
            "message": "Please log in first"
        }, 401

    description = (
        request.form.get('completion_description') or ''
    ).strip()
    uploaded_file = request.files.get('document')

    if not description:
        return {
            "success": False,
            "message": "Completion description is required"
        }, 400

    if not uploaded_file or not uploaded_file.filename:
        return {
            "success": False,
        "message": "Please upload a supporting document"
        }, 400

    allowed_extensions = {'pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'xlsx'}
    original_filename = secure_filename(uploaded_file.filename)

    if (
        not original_filename
        or '.' not in original_filename
        or original_filename.rsplit('.', 1)[1].lower()
        not in allowed_extensions
    ):
        return {
            "success": False,
            "message": "Unsupported document type"
        }, 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    saved_path = None

    try:
        cursor.execute("""
            SELECT id, status
            FROM daily_tasks
            WHERE id = %s AND employee_id = %s
        """, (task_id, session['user_id']))

        task = cursor.fetchone()

        if not task:
            return {
                "success": False,
                "message": "Task not found for this employee"
            }, 404

        if (task.get('status') or '').lower() != 'pending':
            return {
                "success": False,
                "message": "Only pending tasks can be submitted"
            }, 400

        upload_folder = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
            'uploads',
            'task_documents'
        )
        os.makedirs(upload_folder, exist_ok=True)

        filename = (
            f"task_{task_id}_user_{session['user_id']}_"
            f"{datetime.now().strftime('%Y%m%d%H%M%S%f')}_"
            f"{original_filename}"
        )
        saved_path = os.path.join(upload_folder, filename)
        uploaded_file.save(saved_path)

        relative_path = os.path.relpath(
            saved_path,
            os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
        ).replace(os.sep, '/')

        cursor.execute("""
            UPDATE daily_tasks
            SET completion_description = %s,
                document_path = %s,
                submitted_at = %s
            WHERE id = %s
              AND employee_id = %s
              AND LOWER(COALESCE(status, 'pending')) = 'pending'
        """, (
            description,
            relative_path,
            datetime.now(),
            task_id,
            session['user_id']
        ))

        if cursor.rowcount != 1:
            conn.rollback()
            if saved_path and os.path.exists(saved_path):
                os.remove(saved_path)
            return {
                "success": False,
                "message": "Task could not be submitted. Please try again."
            }, 409

        cursor.execute("""
            SELECT id
            FROM users
            WHERE is_admin = 1
        """)
        admins = cursor.fetchall()

        for admin in admins:
            cursor.execute("""
                INSERT INTO notifications (message, user_id)
                VALUES (%s, %s)
            """, (
                f"Employee {session['user_id']} submitted task #{task_id} for review.",
                admin['id']
            ))

        conn.commit()

        return {
            "success": True,
            "message": "Task submitted successfully for admin review"
        }, 200

    except Exception as e:
        conn.rollback()

        if saved_path and os.path.exists(saved_path):
            try:
                os.remove(saved_path)
            except OSError:
                pass

        print("SUBMIT TASK ERROR:", str(e))
        return {
            "success": False,
            "message": "Failed to submit task. Please try again."
        }, 500

    finally:
        cursor.close()
        conn.close()

# ============================================================
# REACT DASHBOARD API
# ============================================================

def api_dashboard():

    print("\n========================================")
    print("API DASHBOARD CALLED")
    print("SESSION DATA:", dict(session))
    print("========================================")

    if 'user_id' not in session:
        print("❌ NO USER_ID IN SESSION")

        return {
            "success": False,
            "message": "User not logged in"
        }, 401

    user_id = session['user_id']

    print("✅ USER ID:", user_id)
    print("✅ USERNAME:", session.get('username'))

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:

        # ====================================================
        # USER
        # ====================================================

        cursor.execute(
            "SELECT * FROM users WHERE id=%s",
            (user_id,)
        )

        user = cursor.fetchone()

        user_face_image_base64 = None

        if user and user.get('face_image'):
            user_face_image_base64 = base64.b64encode(
                user['face_image']
            ).decode('utf-8')

        user_email = user.get('email', '') if user else ''
        user_position = user.get('position', '') if user else ''
        created_at = user.get('created_at') if user else None


        # ====================================================
        # ATTENDANCE
        # ====================================================

        india = pytz.timezone('Asia/Kolkata')
        today = datetime.now(india).date()

        cursor.execute("""
            SELECT *
            FROM attendance
            WHERE user_id=%s
            AND DATE(login_time)=%s
            ORDER BY id DESC
            LIMIT 1
        """, (user_id, today))

        attendance = cursor.fetchone()

        last_login = None
        last_logout = None
        daily_status_submitted = False
        logout_done = False
        can_login = False

        if not attendance:

            can_login = True

        else:

            last_login = attendance.get('login_time')
            last_logout = attendance.get('logout_time')

            daily_status_submitted = (
                attendance.get('daily_status_submitted') == 1
            )

            logout_done = last_logout is not None


        # ====================================================
        # ATTENDANCE CALENDAR
        # ====================================================

        cursor.execute("""
            SELECT DATE(login_time) AS date,
                   attendance_status
            FROM attendance
            WHERE user_id=%s
        """, (user_id,))

        records = cursor.fetchall()

        calendar_data = {}

        start_date = today.replace(day=1)

        if today.month == 12:
            next_month = today.replace(
                year=today.year + 1,
                month=1,
                day=1
            )
        else:
            next_month = today.replace(
                month=today.month + 1,
                day=1
            )

        end_date = next_month - timedelta(days=1)

        current = start_date

        while current <= end_date:

            if current > today:
                calendar_data[str(current)] = "future"
            else:
                calendar_data[str(current)] = "absent"

            current += timedelta(days=1)

        for record in records:

            if record['date'] and record['attendance_status']:

                calendar_data[str(
                    record['date']
                )] = record['attendance_status'].lower()


        # ====================================================
        # HOLIDAY DATES
        # ====================================================

        cursor.execute(
            "SELECT holiday_date FROM holidays"
        )

        holiday_rows = cursor.fetchall()

        holiday_dates = []

        for holiday in holiday_rows:

            holiday_dates.append(
                str(holiday['holiday_date'])
            )


        # ====================================================
        # LEAVES
        # ====================================================

        balance = sync_monthly_carryforward(
            conn,
            user_id
        )

        cursor.execute("""
            SELECT
                leave_type,
                start_date,
                end_date,
                total_days,
                used_paid_days,
                used_unpaid_days,
                status,
                created_at
            FROM leaves
            WHERE user_id=%s
            ORDER BY created_at DESC
        """, (user_id,))

        user_leaves = cursor.fetchall()


        
        # ====================================================
        # ROTA FILE
        # ====================================================

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
        
            rota_filename = rota_row.get('rota_filename')
            rota_mime_type = rota_row.get('rota_mime_type')

            if rota_row.get('rota_image'):
                rota_image_base64 = base64.b64encode(
                    rota_row['rota_image']
                ).decode('utf-8')

        print("========== ROTA DEBUG ==========")
        print("Rota filename:", rota_filename)
        print("Rota MIME type:", rota_mime_type)
        print("Rota file exists:", bool(rota_image_base64))
        print("================================")


        # ====================================================
        # HOLIDAY TABLE
        # ====================================================

        cursor.execute("""
            SELECT holiday_table
            FROM rota
            ORDER BY id DESC
            LIMIT 1
        """)

        holiday_row = cursor.fetchone()

        if holiday_row and holiday_row.get('holiday_table'):

            holiday_table = holiday_row['holiday_table']

        else:

            holiday_table = ""


        def fix_date(match):

            date_part = match.group().split(" ")[0]

            y, m, d = date_part.split("-")

            return f"{d}-{m}-{y}"


        holiday_table = re.sub(
            r"\d{4}-\d{2}-\d{2}(?:\s\d{2}:\d{2}:\d{2})?",
            fix_date,
            holiday_table
        )


        # ====================================================
        # NOTIFICATIONS
        # ====================================================

        cursor.execute("""
            SELECT
                id,
                message,
                created_at,
                is_read
            FROM notifications
            WHERE user_id=%s
            ORDER BY created_at DESC
            LIMIT 20
        """, (user_id,))

        notifications = cursor.fetchall()


        # ====================================================
        # LEAVE BALANCES
        # ====================================================

        paid_leave_balance = (
            balance.get('paid_leaves', 0)
            if balance else 0
        )

        compensation_leaves = (
            balance.get('compensation_leaves', 0)
            if balance else 0
        )


        # ====================================================
        # DAILY TASK HISTORY
        # ====================================================

        cursor.execute("""
            SELECT *
            FROM daily_tasks
            WHERE employee_id=%s
            ORDER BY created_at DESC
        """, (user_id,))

        tasks = cursor.fetchall()


        # ====================================================
        # LATEST UPCOMING HOLIDAY
        # ====================================================

        cursor.execute("""
            SELECT
                holiday_name,
                holiday_date
            FROM holidays
            WHERE holiday_date >= CURDATE()
            ORDER BY holiday_date ASC
            LIMIT 1
        """)

        latest_holiday = cursor.fetchone()


        # ====================================================
        # ADMIN MODAL
        # ====================================================

        show_modal = session.pop(
            'show_admin_modal',
            False
        )


        # ====================================================
        # CONVERT DATETIME / DATE VALUES
        # TO JSON-SAFE STRINGS
        # ====================================================

        if last_login:
            last_login = str(last_login)

        if last_logout:
            last_logout = str(last_logout)

        if created_at:
            created_at = str(created_at)


        for leave in user_leaves:

            if leave.get('start_date'):
                leave['start_date'] = str(
                    leave['start_date']
                )

            if leave.get('end_date'):
                leave['end_date'] = str(
                    leave['end_date']
                )

            if leave.get('created_at'):
                leave['created_at'] = str(
                    leave['created_at']
                )


        for notification in notifications:

            if notification.get('created_at'):
                notification['created_at'] = str(
                    notification['created_at']
                )


        for task in tasks:

            if task.get('created_at'):
                task['created_at'] = str(
                    task['created_at']
                )


        if latest_holiday:

            if latest_holiday.get('holiday_date'):
                latest_holiday['holiday_date'] = str(
                    latest_holiday['holiday_date']
                )


        # ====================================================
        # RESPONSE
        # ====================================================

        return {
            "success": True,

            "username": session.get(
                "username",
                "User"
            ),

            "userEmail": user_email,

            "userPosition": user_position,

            "createdAt": created_at,

            "userFaceImageBase64": user_face_image_base64,

            "lastLogin": last_login,

            "lastLogout": last_logout,

            "canLogin": can_login,

            "dailyStatusSubmitted": daily_status_submitted,

            "logoutDone": logout_done,

            "holidayDates": holiday_dates,

            "calendarData": calendar_data,

            "latestHoliday": latest_holiday,

            "tasks": tasks,

            "rotaImageBase64": rota_image_base64,
            "rotaFilename": rota_filename,
            "rotaMimeType": rota_mime_type,
            
            "holidayTableHtml": holiday_table,

            "compensationLeaves": compensation_leaves,

            "paidLeaveBalance": paid_leave_balance,

            "userLeaves": user_leaves,

            "notifications": notifications,

            "showAdminModal": show_modal
        }

    except Exception as e:

        print("\n❌ DASHBOARD API ERROR:")
        print(str(e))

        return {
            "success": False,
            "message": str(e)
        }, 500

    finally:

        cursor.close()
        conn.close()