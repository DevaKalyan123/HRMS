# HRMS Backend MVC Refactor

## Request flow
`app/routes/` -> `app/controllers/` -> `app/services/` -> database access via existing `utils.py`.

- Routes contain only Flask URL/method declarations and controller calls.
- Controllers use explicit function signatures and delegate to service methods. No generic `*args, **kwargs` forwarding wrappers.
- Services retain the original HRMS endpoint business logic to minimize behavior changes. Existing SQL and transaction flow are intentionally preserved in these services in this compatibility-first pass; moving every inline query into dedicated model methods should be done endpoint-by-endpoint with integration tests to avoid changing behavior.
- `app/models/database.py` is the shared database adapter.
- Original legacy import paths are kept as compatibility shims.
- Legal blueprint remains unregistered, matching the original app behavior.

## Run
From this backend directory: `python run.py`

Configure DB and SMTP environment variables as before. No `.env` or credentials are bundled.
