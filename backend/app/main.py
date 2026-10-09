from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from . import models, schemas, crud, database
import os

# Create tables in SQLite on startup
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(
    title="AWS Route 53 Clone API",
    description="Backend API serving Route 53 Hosted Zone and DNS Record management.",
    version="1.0.0"
)

origins = [
    "http://localhost:3000",
    os.getenv("FRONTEND_URL", "*")  # Allows dynamic production origin
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "service": "AWS Route 53 API"}

# --- Hosted Zone Routes ---

@app.get("/api/hosted-zones", response_model=List[schemas.HostedZoneResponse])
def list_hosted_zones(
    search: Optional[str] = Query(None), 
    skip: int = Query(0, ge=0),
    limit: int = Query(100, le=1000),
    db: Session = Depends(database.get_db)
):
    return crud.get_hosted_zones(db, search=search, skip=skip, limit=limit)

@app.get("/api/hosted-zones/{zone_id}", response_model=schemas.HostedZoneResponse)
def get_hosted_zone(zone_id: str, db: Session = Depends(database.get_db)):
    return crud.get_hosted_zone_by_id(db, zone_id)

@app.post("/api/hosted-zones", response_model=schemas.HostedZoneResponse, status_code=201)
def create_hosted_zone(zone: schemas.HostedZoneCreate, db: Session = Depends(database.get_db)):
    return crud.create_hosted_zone(db, zone)

@app.patch("/api/hosted-zones/{zone_id}", response_model=schemas.HostedZoneResponse)
def update_hosted_zone(zone_id: str, body: schemas.HostedZoneUpdate, db: Session = Depends(database.get_db)):
    return crud.update_hosted_zone(db, zone_id, body)

@app.delete("/api/hosted-zones/{zone_id}", status_code=204)
def delete_hosted_zone(zone_id: str, db: Session = Depends(database.get_db)):
    crud.delete_hosted_zone(db, zone_id)
    return None

# --- DNS Record Routes ---

@app.get("/api/hosted-zones/{zone_id}/records", response_model=List[schemas.DNSRecordResponse])
def list_dns_records(
    zone_id: str, 
    search: Optional[str] = Query(None), 
    record_type: Optional[str] = Query(None, alias="type"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, le=1000),
    db: Session = Depends(database.get_db)
):
    return crud.get_records(db, zone_id=zone_id, search=search, record_type=record_type, skip=skip, limit=limit)

@app.post("/api/hosted-zones/{zone_id}/records", response_model=schemas.DNSRecordResponse, status_code=201)
def create_dns_record(zone_id: str, record: schemas.DNSRecordCreate, db: Session = Depends(database.get_db)):
    return crud.create_dns_record(db, zone_id=zone_id, record=record)

@app.put("/api/hosted-zones/{zone_id}/records/{record_id}", response_model=schemas.DNSRecordResponse)
def update_dns_record(zone_id: str, record_id: str, body: schemas.DNSRecordUpdate, db: Session = Depends(database.get_db)):
    return crud.update_dns_record(db, zone_id, record_id, body)

@app.delete("/api/hosted-zones/{zone_id}/records/{record_id}", status_code=204)
def delete_dns_record(zone_id: str, record_id: str, db: Session = Depends(database.get_db)):
    crud.delete_single_dns_record(db, zone_id, record_id)
    return None

@app.post("/api/hosted-zones/{zone_id}/records/bulk-delete")
def bulk_delete_records(zone_id: str, body: schemas.BulkDeleteRequest, db: Session = Depends(database.get_db)):
    return crud.bulk_delete_records(db, zone_id=zone_id, record_ids=body.record_ids)

# Add this schema near the top of main.py or in schemas.py
class MockLogin(BaseModel):
    username: str
    password: str

# Add this route to main.py
@app.post("/api/login")
def login(credentials: MockLogin):
    # Simple mock check: accepts username "admin" and password "password"
    if credentials.username == "admin" and credentials.password == "password":
        return {"token": "mock-session-token-12345", "user": "admin"}
    
    raise HTTPException(
        status_code=401, 
        detail="Authentication failed. Your authentication information is incorrect. Please try again."
    )