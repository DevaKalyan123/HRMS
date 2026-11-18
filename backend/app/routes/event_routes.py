
from flask import Blueprint
from app.controllers.event_controller import EventController

event_bp = Blueprint("events", __name__)

@event_bp.route("/", methods=["GET"])
def get_events():
    return EventController.get_events()


@event_bp.route("/", methods=["POST"])
def create_event():
    return EventController.create_event()


@event_bp.route("/<int:event_id>", methods=["PUT"])
def update_event(event_id):
    return EventController.update_event(event_id)


@event_bp.route("/<int:event_id>", methods=["DELETE"])
def delete_event(event_id):
    return EventController.delete_event(event_id)


@event_bp.route("/check-availability", methods=["POST"])
def check_availability():
    return EventController.check_availability()
