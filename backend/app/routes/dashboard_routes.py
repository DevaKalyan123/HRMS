from flask import Blueprint
from app.controllers.dashboard_controller import DashboardController

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/dashboard', methods=['GET'])
def dashboard():
    return DashboardController.dashboard()

@dashboard_bp.route('/check_admin', methods=['GET'])
def check_admin():
    return DashboardController.check_admin()

@dashboard_bp.route('/add-task', methods=['POST'])
def add_task():
    return DashboardController.add_task()

@dashboard_bp.route('/api/dashboard', methods=['GET'])
def api_dashboard():
    return DashboardController.api_dashboard()

