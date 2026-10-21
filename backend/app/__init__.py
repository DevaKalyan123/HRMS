import os
from datetime import datetime
from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from app.config import Config
from app.routes.auth_routes import auth_bp
from app.routes.leave_routes import leave_bp
from app.routes.document_routes import document_bp
from app.routes.attendance_routes import attendance_bp
from app.routes.dashboard_routes import dashboard_bp
from app.routes.admin_routes import admin_bp
from app.routes.birthday_routes import birthday_bp
from app.routes.payslip_routes import payslip_bp

def create_app():
    load_dotenv()
    app = Flask(__name__)
    app.config.from_object(Config)
    CORS(app, origins=[
        "https://cbz6k2gf-5173.inc1.devtunnels.ms",
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ], supports_credentials=True)
    app.register_blueprint(auth_bp, url_prefix="/auth")
    app.register_blueprint(leave_bp, url_prefix="/leave")
    app.register_blueprint(document_bp, url_prefix="/document")
    app.register_blueprint(attendance_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(admin_bp, url_prefix="/admin")
    app.register_blueprint(birthday_bp)
    app.register_blueprint(payslip_bp, url_prefix="/payslip")
    @app.route("/")
    def home():
        return jsonify({"message": "HRMS Backend API is running", "status": "success"})
    @app.template_filter("strftime")
    def format_datetime(value, format="%Y-%m-%d"):
        if value is None: return ""
        if isinstance(value, str): return value
        return value.strftime(format)
    return app
