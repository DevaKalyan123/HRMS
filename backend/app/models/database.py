"""Database connection model shared by HRMS services."""
from utils import get_db_connection

class Database:
    @staticmethod
    def get_connection():
        return get_db_connection()
