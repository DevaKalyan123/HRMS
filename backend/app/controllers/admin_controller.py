from app.services import admin_service

class AdminController:
    @staticmethod
    def admin():
        return admin_service.admin()
    @staticmethod
    def assign_task():
        return admin_service.assign_task()
    @staticmethod
    def admin_leaves():
        return admin_service.admin_leaves()

    @staticmethod
    def update_leave_status(leave_id):
        return admin_service.update_leave_status(leave_id)

    @staticmethod
    def approve_leave(leave_id):
        return admin_service.approve_leave(leave_id)

    @staticmethod
    def reject_leave(leave_id):
        return admin_service.reject_leave(leave_id)

    @staticmethod
    def admin_update_user(user_id):
        return admin_service.admin_update_user(user_id)

    @staticmethod
    def upload_rota():
        return admin_service.upload_rota()

    @staticmethod
    def upload_holiday():
        return admin_service.upload_holiday()

    @staticmethod
    def send_notification():
        return admin_service.send_notification()

    @staticmethod
    def update_attendance_status(attendance_id):
        return admin_service.update_attendance_status(attendance_id)

    @staticmethod
    def view_excel():
        return admin_service.view_excel()

    @staticmethod
    def export_page():
        return admin_service.export_page()

    @staticmethod
    def export():
        return admin_service.export()

    @staticmethod
    def update_profile():
        return admin_service.update_profile()

    @staticmethod
    def delete_user(user_id):
        return admin_service.delete_user(user_id)

    @staticmethod
    def approve_task(task_id):
        return admin_service.approve_task(task_id)

    @staticmethod
    def reject_task(task_id):
        return admin_service.reject_task(task_id)

    @staticmethod
    def admin_api_data():
        return admin_service.admin_api_data()
    @staticmethod
    def view_task_document(task_id):
        return admin_service.view_task_document(task_id)

