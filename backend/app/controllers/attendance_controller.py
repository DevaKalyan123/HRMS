from app.services import attendance_service

class AttendanceController:
    @staticmethod
    def diagnose_face():
        return attendance_service.diagnose_face()

    @staticmethod
    def mark_login():
        return attendance_service.mark_login()

    @staticmethod
    def mark_logout():
        return attendance_service.mark_logout()

    @staticmethod
    def submit_daily_status():
        return attendance_service.submit_daily_status()

