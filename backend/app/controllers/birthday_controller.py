from app.services import birthday_service

class BirthdayController:
    @staticmethod
    def trigger_birthday_emails():
        return birthday_service.trigger_birthday_emails()

