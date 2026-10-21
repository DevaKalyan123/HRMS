from flask import Blueprint
from app.controllers.legal_controller import LegalController

legal_bp = Blueprint('legal', __name__)

@legal_bp.route('/check', methods=['GET'])
def check():
    return LegalController.check()

