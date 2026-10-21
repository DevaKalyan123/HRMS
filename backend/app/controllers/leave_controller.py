from app.services import leave_service

class LeaveController:
    @staticmethod
    def apply_leave():
        return leave_service.apply_leave()

    @staticmethod
    def leave_history():
        return leave_service.leave_history()

    @staticmethod
    def update_leave_status(leave_id):
        return leave_service.update_leave_status(leave_id)

