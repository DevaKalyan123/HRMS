from app.services import payslip_service

class PayslipController:
    @staticmethod
    def upload_payslip():
        return payslip_service.upload_payslip()

    @staticmethod
    def list_payslips():
        return payslip_service.list_payslips()

    @staticmethod
    def download_payslip(payslip_id):
        return payslip_service.download_payslip(payslip_id)

    @staticmethod
    def view_payslip(payslip_id):
        return payslip_service.view_payslip(payslip_id)

