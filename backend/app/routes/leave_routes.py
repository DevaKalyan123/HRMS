from flask import Blueprint
from app.controllers.leave_controller import LeaveController

leave_bp = Blueprint('leave', __name__)

@leave_bp.route('/apply_leave', methods=['POST'])
def apply_leave():
    return LeaveController.apply_leave()

@leave_bp.route('/leave_history', methods=['GET'])
def leave_history():
    return LeaveController.leave_history()

@leave_bp.route('/admin/update_leave_status/<int:leave_id>', methods=['POST'])
def update_leave_status(leave_id):
    return LeaveController.update_leave_status(leave_id)

