from app.services import dashboard_service

class DashboardController:
    @staticmethod
    def dashboard():
        return dashboard_service.dashboard()

    @staticmethod
    def check_admin():
        return dashboard_service.check_admin()

    @staticmethod
    def add_task():
        return dashboard_service.add_task()

    @staticmethod
    def api_dashboard():
        return dashboard_service.api_dashboard()

