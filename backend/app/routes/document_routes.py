from flask import Blueprint
from app.controllers.document_controller import DocumentController

document_bp = Blueprint('document', __name__)

@document_bp.route('/upload', methods=['POST'])
def upload():
    return DocumentController.upload()

