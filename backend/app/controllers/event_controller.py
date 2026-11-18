
from app.services import event_service


class EventController:

    @staticmethod
    def get_events():
        return event_service.get_events()

    @staticmethod
    def create_event():
        return event_service.create_event()

    @staticmethod
    def update_event(event_id):
        return event_service.update_event(event_id)

    @staticmethod
    def delete_event(event_id):
        return event_service.delete_event(event_id)

    @staticmethod
    def check_availability():
        return event_service.check_availability()
