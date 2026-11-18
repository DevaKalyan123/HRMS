
from flask import Blueprint
from app.controllers.biometric_controller import BiometricController


biometric_bp = Blueprint(
    "biometric",
    __name__
)


@biometric_bp.route("/health", methods=["GET"])
def biometric_health():
    return BiometricController.health()


@biometric_bp.route("/punches", methods=["POST"])
def receive_biometric_punch():
    return BiometricController.receive_punch()
