from flask import Blueprint
from app.controllers.auth_controller import AuthController

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    return AuthController.login()

@auth_bp.route('/register', methods=['GET', 'POST'])
def register():
    return AuthController.register()

@auth_bp.route('/logout', methods=['GET'])
def logout():
    return AuthController.logout()

@auth_bp.route('/forgot_password', methods=['POST'])
def forgot_password():
    return AuthController.forgot_password()

@auth_bp.route('/verify_otp', methods=['POST'])
def verify_otp():
    return AuthController.verify_otp()

@auth_bp.route('/reset_password', methods=['POST'])
def reset_password():
    return AuthController.reset_password()

