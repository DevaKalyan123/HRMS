from app.services import document_service

class DocumentController:
    @staticmethod
    def upload():
        return document_service.upload()

