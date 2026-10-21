from app.services import legal_service

class LegalController:
    @staticmethod
    def check():
        return legal_service.check()

