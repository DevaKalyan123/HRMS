import os
from dotenv import load_dotenv

load_dotenv()

from flask import Flask, session, redirect, jsonify
from flask_cors import CORS
from utils import get_db_connection
from datetime import datetime

from auth.routes import auth_bp
from leave.routes import leave_bp
from document.routes import document_bp
from attendance.routes import attendance_bp
from dashboard.routes import dashboard_bp
from admin import admin_bp
from birthday_mailer import init_birthday_scheduler, birthday_bp
from payslip.routes import payslip_bp


# ============================================================
# CREATE FLASK APPLICATION
# ============================================================

app = Flask(__name__)


# ============================================================
# SECRET KEY
# ============================================================

app.secret_key = "secret123"

app.config["SESSION_COOKIE_NAME"] = "hrms_session"
app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
app.config["SESSION_COOKIE_SECURE"] = False


# ============================================================
# CORS CONFIGURATION
# React frontend:
# http://localhost:5173
#
# Flask backend:
# http://localhost:5000
# ============================================================

CORS(
    app,
    origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    supports_credentials=True
)


# ============================================================
# MAIL CONFIGURATION
# ============================================================

app.config.update(
    MAIL_SERVER=os.getenv("MAIL_SERVER"),
    MAIL_PORT=int(os.getenv("MAIL_PORT", 587)),
    MAIL_USE_TLS=True,
    MAIL_USERNAME=os.getenv("MAIL_USERNAME"),
    MAIL_PASSWORD=os.getenv("MAIL_PASSWORD"),
)


# ============================================================
# REGISTER BLUEPRINTS
# ============================================================

app.register_blueprint(
    auth_bp,
    url_prefix="/auth"
)

app.register_blueprint(
    leave_bp,
    url_prefix="/leave"
)

app.register_blueprint(
    document_bp,
    url_prefix="/document"
)

app.register_blueprint(
    attendance_bp
)

app.register_blueprint(
    dashboard_bp
)

app.register_blueprint(
    admin_bp,
    url_prefix="/admin"
)

app.register_blueprint(
    birthday_bp
)

app.register_blueprint(
    payslip_bp,
    url_prefix="/payslip"
)


# ============================================================
# BACKEND HOME / HEALTH CHECK
# ============================================================

@app.route("/")
def home():
    return jsonify({
        "message": "HRMS Backend API is running",
        "status": "success"
    })


# ============================================================
# TEMPLATE FILTER
# ============================================================
#
# Kept temporarily because some old backend/template code may
# still reference this filter during the React migration.
#
# It does not make Flask serve React templates.
# ============================================================

@app.template_filter("strftime")
def format_datetime(value, format="%Y-%m-%d"):

    if value is None:
        return ""

    if isinstance(value, str):
        return value

    return value.strftime(format)


# ============================================================
# RUN APPLICATION
# ============================================================

if __name__ == "__main__":
    print("\n========== FLASK ROUTES ==========")
    for rule in app.url_map.iter_rules():
        print(rule, "->", rule.endpoint)
    print("=================================\n")

    init_birthday_scheduler(app)

    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )