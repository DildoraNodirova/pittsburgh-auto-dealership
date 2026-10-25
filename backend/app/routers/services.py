from fastapi import APIRouter

from ..services_data import SERVICES

router = APIRouter(prefix="/api/services", tags=["services"])


@router.get("")
def list_services():
    return [{"id": key, **value} for key, value in SERVICES.items()]
