from flask import Blueprint
from app.controllers.birthday_controller import BirthdayController

birthday_bp = Blueprint("birthday", __name__)

@birthday_bp.route('/admin/trigger-birthday-emails', methods=['GET'])
def trigger_birthday_emails():
    return BirthdayController.trigger_birthday_emails()

