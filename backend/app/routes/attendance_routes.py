from flask import Blueprint
from app.controllers.attendance_controller import AttendanceController

attendance_bp = Blueprint('attendance', __name__)

@attendance_bp.route('/diagnose_face', methods=['GET'])
def diagnose_face():
    return AttendanceController.diagnose_face()

@attendance_bp.route('/mark_login', methods=['POST'])
def mark_login():
    return AttendanceController.mark_login()

@attendance_bp.route('/mark_logout', methods=['POST'])
def mark_logout():
    return AttendanceController.mark_logout()

@attendance_bp.route('/submit_daily_status', methods=['POST'])
def submit_daily_status():
    return AttendanceController.submit_daily_status()

