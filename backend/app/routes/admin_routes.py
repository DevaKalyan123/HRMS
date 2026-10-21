from flask import Blueprint
from app.controllers.admin_controller import AdminController

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/admin', methods=['GET'])
def admin():
    return AdminController.admin()

@admin_bp.route('/admin_leaves', methods=['GET'])
def admin_leaves():
    return AdminController.admin_leaves()

@admin_bp.route('/update_leave_status/<int:leave_id>', methods=['POST'])
def update_leave_status(leave_id):
    return AdminController.update_leave_status(leave_id)

@admin_bp.route('/approve_leave/<int:leave_id>', methods=['POST'])
def approve_leave(leave_id):
    return AdminController.approve_leave(leave_id)

@admin_bp.route('/reject_leave/<int:leave_id>', methods=['POST'])
def reject_leave(leave_id):
    return AdminController.reject_leave(leave_id)

@admin_bp.route('/admin_update_user/<int:user_id>', methods=['POST'])
def admin_update_user(user_id):
    return AdminController.admin_update_user(user_id)

@admin_bp.route('/upload_rota', methods=['POST'])
def upload_rota():
    return AdminController.upload_rota()

@admin_bp.route('/upload_holiday', methods=['POST'])
def upload_holiday():
    return AdminController.upload_holiday()

@admin_bp.route('/send_notification', methods=['POST'])
def send_notification():
    return AdminController.send_notification()

@admin_bp.route('/update_attendance_status/<int:attendance_id>', methods=['POST'])
def update_attendance_status(attendance_id):
    return AdminController.update_attendance_status(attendance_id)

@admin_bp.route('/view_excel', methods=['GET'])
def view_excel():
    return AdminController.view_excel()

@admin_bp.route('/export_page', methods=['GET'])
def export_page():
    return AdminController.export_page()

@admin_bp.route('/export', methods=['GET'])
def export():
    return AdminController.export()

@admin_bp.route('/update_profile', methods=['POST'])
def update_profile():
    return AdminController.update_profile()

@admin_bp.route('/delete_user/<int:user_id>', methods=['POST'])
def delete_user(user_id):
    return AdminController.delete_user(user_id)

@admin_bp.route('/approve-task/<int:task_id>', methods=['GET'])
def approve_task(task_id):
    return AdminController.approve_task(task_id)

@admin_bp.route('/reject-task/<int:task_id>', methods=['GET'])
def reject_task(task_id):
    return AdminController.reject_task(task_id)

@admin_bp.route('/api-data', methods=['GET'])
def admin_api_data():
    return AdminController.admin_api_data()

