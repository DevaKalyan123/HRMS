from app.services import auth_service

class AuthController:
    @staticmethod
    def login():
        return auth_service.login()

    @staticmethod
    def register():
        return auth_service.register()

    @staticmethod
    def logout():
        return auth_service.logout()

    @staticmethod
    def forgot_password():
        return auth_service.forgot_password()

    @staticmethod
    def verify_otp():
        return auth_service.verify_otp()

    @staticmethod
    def reset_password():
        return auth_service.reset_password()

