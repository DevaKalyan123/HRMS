from flask import Blueprint
from app.controllers.payslip_controller import PayslipController

payslip_bp = Blueprint('payslip', __name__)

@payslip_bp.route('/upload', methods=['POST'])
def upload_payslip():
    return PayslipController.upload_payslip()

@payslip_bp.route('/list', methods=['GET'])
def list_payslips():
    return PayslipController.list_payslips()

@payslip_bp.route('/download/<int:payslip_id>', methods=['GET'])
def download_payslip(payslip_id):
    return PayslipController.download_payslip(payslip_id)

@payslip_bp.route('/view/<int:payslip_id>', methods=['GET'])
def view_payslip(payslip_id):
    return PayslipController.view_payslip(payslip_id)

