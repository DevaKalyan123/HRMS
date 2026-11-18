
import os
import hmac

from flask import request, jsonify, session
from app.services import biometric_service


class BiometricController:

    @staticmethod
    def health():
        return jsonify({
            "success": True,
            "service": "Biometric Attendance API",
            "status": "running"
        }), 200

    @staticmethod
    def receive_punch():

        expected_token = os.getenv("BIOMETRIC_DEVICE_TOKEN", "")
        supplied_token = request.headers.get(
            "X-Biometric-Token", ""
        )

        if not expected_token or not hmac.compare_digest(
            expected_token, supplied_token
        ):
            return jsonify({
                "success": False,
                "message": "Unauthorized device"
            }), 401

        data = request.get_json(silent=True)

        if not isinstance(data, dict):
            return jsonify({
                "success": False,
                "message": "Invalid JSON payload"
            }), 400

        try:
            result = biometric_service.receive_punch(data)

            return jsonify(result), (
                200 if result["duplicate"] else 201
            )

        except ValueError as e:
            return jsonify({
                "success": False,
                "message": str(e)
            }), 400

        except RuntimeError:
            return jsonify({
                "success": False,
                "message": "Database unavailable"
            }), 503

        except Exception:
            # Do not expose database or internal error details.
            return jsonify({
                "success": False,
                "message": "Internal server error"
            }), 500

    @staticmethod
    def get_mappings():

        # Allow only logged-in administrators.
        if 'user_id' not in session or not session.get('is_admin'):
            return jsonify({
                "success": False,
                "message": "Access denied"
            }), 403

        try:
            result = biometric_service.get_mapping_data()

            return jsonify({
                "success": True,
                "data": result
            }), 200

        except RuntimeError:
            return jsonify({
                "success": False,
                "message": "Database unavailable"
            }), 503

        except Exception:
            return jsonify({
                "success": False,
                "message": "Internal server error"
            }), 500

    @staticmethod
    def save_mapping():

        # Allow only logged-in administrators.
        if 'user_id' not in session or not session.get('is_admin'):
            return jsonify({
                "success": False,
                "message": "Access denied"
            }), 403

        data = request.get_json(silent=True)

        if not isinstance(data, dict):
            return jsonify({
                "success": False,
                "message": "Invalid JSON payload"
            }), 400

        try:
            result = biometric_service.save_employee_mapping(data)

            return jsonify(result), 200

        except ValueError as e:
            return jsonify({
                "success": False,
                "message": str(e)
            }), 400

        except RuntimeError:
            return jsonify({
                "success": False,
                "message": "Database unavailable"
            }), 503

        except Exception:
            return jsonify({
                "success": False,
                "message": "Internal server error"
            }), 500
