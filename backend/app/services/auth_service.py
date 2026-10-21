import re

from flask import Blueprint, request, render_template, session, redirect, url_for, flash, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from utils import get_db_connection
import random
from utils import send_email

import logging


logging.basicConfig(level=logging.INFO)

def check_face(image_bytes):
    import cv2
    import numpy as np

    np_arr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    face_cascade = cv2.CascadeClassifier(
        cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
    )

    faces = face_cascade.detectMultiScale(gray, 1.1, 6)

    if len(faces) == 0:
        return "No face ❌"

    if len(faces) > 1:
        return "Multiple faces ❌"

    (x, y, w, h) = faces[0]
    img_h, img_w = gray.shape

    face_size = w * h
    image_size = img_w * img_h

    if face_size / image_size < 0.4:
        return "Face too small ❌ (Group photo not allowed)"

    return "OK"


# LOGIN
def login():
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')

        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT * FROM users WHERE email=%s", (email,))
        user = cursor.fetchone()

        if user and check_password_hash(user['password'], password):
            session['user_id'] = user['id']
            session['username'] = user['username']
            session['is_admin'] = user['is_admin']
            session['email'] = user['email']
            session['position'] = user['position']

            # ✅ Set modal flag only once on fresh login
            if user['is_admin'] == 1:
                session['show_admin_modal'] = True

            return jsonify({
    "success": True,
    "message": "Login successful",
    "is_admin": bool(user['is_admin'])
})
        else:
            return jsonify({
                "success": False,
                "message": "Invalid credentials"
            })

    return jsonify({
    "success": True,
    "message": "Login API is available"
})


def validate_password(password):
    if len(password) < 8:
        return "Password must be at least 8 characters"

    if not any(c.isupper() for c in password):
        return "Add at least 1 uppercase letter"

    if not any(c.islower() for c in password):
        return "Add at least 1 lowercase letter"

    if not any(c.isdigit() for c in password):
        return "Add at least 1 number"

    if not any(c in "@#$%^&+=!" for c in password):
        return "Add at least 1 special character"

    return "OK"


# REGISTER
def register():

    # Only admin can access register page
    if 'user_id' not in session or not session.get('is_admin'):
        return jsonify({
            "success": False,
            "message": "Admin access required"
        }), 403

    if request.method == 'POST':

        try:
            username = request.form.get('username', '').strip()
            email = request.form.get('email', '').strip()
            raw_password = request.form.get('password', '')
            file = request.files.get('face_image')

            # Username validation
            if not re.match(r"^[A-Za-z]+( [A-Za-z]+)*$", username):
                return jsonify({
                    "success": False,
                    "message": "Invalid username format"
                }), 400

            # Password validation
            check = validate_password(raw_password)

            if check != "OK":
                return jsonify({
                    "success": False,
                    "message": check
                }), 400

            # Face image validation
            if not file or file.filename == "":
                return jsonify({
                    "success": False,
                    "message": "Please upload a face image"
                }), 400

            allowed_types = [
                'image/jpeg',
                'image/png',
                'image/jpg'
            ]

            if file.content_type not in allowed_types:
                return jsonify({
                    "success": False,
                    "message": "Only JPG and PNG images are allowed"
                }), 400

            # Read image
            image_data = file.read()

            # Check face
            result = check_face(image_data)

            if result == "No face ❌":
                return jsonify({
                    "success": False,
                    "message": "No face detected. Upload a clear face image"
                }), 400

            if result == "Multiple faces ❌":
                return jsonify({
                    "success": False,
                    "message": "Group photo not allowed. Only one person"
                }), 400

            if result.startswith("Face too small"):
                return jsonify({
                    "success": False,
                    "message": result
                }), 400

            # Database connection
            conn = get_db_connection()

            if not conn:
                return jsonify({
                    "success": False,
                    "message": "Database connection failed"
                }), 500

            cursor = conn.cursor()

            # Check existing email
            cursor.execute(
                "SELECT id FROM users WHERE email = %s",
                (email,)
            )

            existing_user = cursor.fetchone()

            if existing_user:
                cursor.close()
                conn.close()

                return jsonify({
                    "success": False,
                    "message": "Email already exists"
                }), 400

            # Hash password
            password = generate_password_hash(raw_password)

            # Insert user
            cursor.execute(
                """
                INSERT INTO users
                (username, email, password, face_image)
                VALUES (%s, %s, %s, %s)
                """,
                (
                    username,
                    email,
                    password,
                    image_data
                )
            )

            # IMPORTANT: save to database
            conn.commit()

            logging.info(
                f"User registered successfully: {username} ({email})"
            )

            cursor.close()
            conn.close()

            return jsonify({
                "success": True,
                "message": "Registered successfully"
            }), 200

        except Exception as e:

            logging.exception(
                "Registration database error"
            )

            try:
                conn.rollback()
                cursor.close()
                conn.close()
            except:
                pass

            return jsonify({
                "success": False,
                "message": f"Registration failed: {str(e)}"
            }), 500

    # GET request
    return jsonify({
        "success": True,
        "message": "Registration API is available"
    })

# LOGOUT
def logout():
    session.clear()
    return jsonify({
        "success": True,
        "message": "Logged out successfully"
    })


# FORGOT PASSWORD
# FORGOT PASSWORD
def forgot_password():
    email = request.form.get('email', '').strip()

    logging.info(f"Forgot password request for email: {email}")

    if not email:
        return jsonify({
            "success": False,
            "message": "Email is required"
        }), 400

    conn = get_db_connection()

    if not conn:
        logging.error("No database connection for forgot_password")

        return jsonify({
            "success": False,
            "message": "Database connection failed"
        }), 500

    cursor = None

    try:
        cursor = conn.cursor(dictionary=True)

        cursor.execute(
            "SELECT id, username FROM users WHERE email = %s",
            (email,)
        )

        user = cursor.fetchone()

        logging.info(
            f"User lookup for forgot password: "
            f"{'Found' if user else 'Not found'}"
        )

        if not user:
            return jsonify({
                "success": False,
                "message": "Email not found"
            }), 404

        # Generate 6-digit OTP
        otp = ''.join(
            [str(random.randint(0, 9)) for _ in range(6)]
        )

        # Store OTP in session
        session['otp'] = otp
        session['reset_email'] = email
        session['otp_sent'] = True

        logging.info("Generated OTP")

        otp_body = f"""
Dear {user['username']},

You have requested a password reset for your account.

Your OTP is:

{otp}

This OTP is valid for the next 10 minutes.

If you did not request this password reset, please ignore this email.

For security reasons, do not share this OTP with anyone.

Best regards,
HR System Security Team
"""

        if not send_email(
            email,
            "Password Reset OTP - HR System",
            otp_body
        ):
            logging.error("Failed to send OTP email")

            return jsonify({
                "success": False,
                "message": "Failed to send OTP. Please try again."
            }), 500

        logging.info(f"OTP email sent to: {email}")

        # IMPORTANT:
        # Return JSON instead of redirecting to Flask/Jinja page
        return jsonify({
            "success": True,
            "message": "OTP sent successfully."
        }), 200

    except Exception as e:
        logging.exception(
            f"Forgot password error: {str(e)}"
        )

        return jsonify({
            "success": False,
            "message": "Failed to process forgot password request."
        }), 500

    finally:
        if cursor:
            cursor.close()

        if conn and conn.is_connected():
            conn.close()

# VERIFY OTP
def verify_otp():
    otp = request.form.get('otp', '').strip()

    logging.info("Verifying OTP")

    if not otp:
        return jsonify({
            "success": False,
            "message": "OTP is required"
        }), 400

    if otp == session.get('otp'):
        session.pop('otp', None)
        session['otp_verified'] = True

        logging.info("OTP verified successfully")

        return jsonify({
            "success": True,
            "message": "OTP verified successfully."
        }), 200

    logging.error("Invalid OTP provided")

    return jsonify({
        "success": False,
        "message": "Invalid OTP"
    }), 400

# RESET PASSWORD
def reset_password():
    if not session.get('otp_verified'):
        logging.error("OTP not verified")

        return jsonify({
            "success": False,
            "message": "Please verify OTP first"
        }), 401

    new_password = request.form.get('new_password', '').strip()

    if not new_password:
        return jsonify({
            "success": False,
            "message": "New password is required"
        }), 400

    # Validate password
    check = validate_password(new_password)

    if check != "OK":
        return jsonify({
            "success": False,
            "message": check
        }), 400

    reset_email = session.get('reset_email')

    if not reset_email:
        return jsonify({
            "success": False,
            "message": "Password reset session expired. Please try again."
        }), 401

    logging.info(
        f"Resetting password for email: {reset_email}"
    )

    conn = get_db_connection()

    if not conn:
        logging.error("No database connection for reset_password")

        return jsonify({
            "success": False,
            "message": "Database connection failed"
        }), 500

    cursor = None

    try:
        cursor = conn.cursor()

        hashed_password = generate_password_hash(
            new_password
        )

        cursor.execute(
            """
            UPDATE users
            SET password = %s
            WHERE email = %s
            """,
            (
                hashed_password,
                reset_email
            )
        )

        conn.commit()

        # Clear password reset session
        session.pop('reset_email', None)
        session.pop('otp_verified', None)
        session.pop('otp_sent', None)

        logging.info("Password reset successful")

        return jsonify({
            "success": True,
            "message": "Password reset successful. Please login."
        }), 200

    except Exception as e:
        if conn:
            conn.rollback()

        logging.exception(
            f"Reset password error: {str(e)}"
        )

        return jsonify({
            "success": False,
            "message": "Failed to reset password."
        }), 500

    finally:
        if cursor:
            cursor.close()

        if conn and conn.is_connected():
            conn.close()