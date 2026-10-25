from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import config
from .database import Base, engine, ensure_columns
from .routers import bookings, services
from . import payments

Base.metadata.create_all(bind=engine)
ensure_columns()

app = FastAPI(title="Pittsburgh Auto - Booking API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=sorted({"http://localhost:5173", "http://127.0.0.1:5173", config.FRONTEND_URL}),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(bookings.router)
app.include_router(services.router)
app.include_router(payments.router)


@app.get("/")
def root():
    return {"success": True, "service": "Pittsburgh Auto Booking API", "status": "running"}
