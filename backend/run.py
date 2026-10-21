from app import create_app
from app.services.birthday_service import init_birthday_scheduler

app = create_app()

if __name__ == "__main__":
    print("\n========== FLASK ROUTES ==========")
    for rule in app.url_map.iter_rules():
        print(rule, "->", rule.endpoint)
    print("=================================\n")
    init_birthday_scheduler(app)
    app.run(host="0.0.0.0", port=5000, debug=True)
