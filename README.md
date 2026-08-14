# Ecclesia

Ecclesia is a church-management starter with a FastAPI backend, a React admin portal, and a Flutter mobile client.

## Run locally

Start the API:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload
```

The API is available at `http://localhost:8000`; interactive documentation is at `/docs`.

Start the admin portal in a second terminal:

```powershell
cd admin-portal
npm install
npm run dev
```

For mobile, install Flutter, then run `flutter pub get` and `flutter run` from `mobile`. If platform files are not yet generated, run `flutter create .` once.
