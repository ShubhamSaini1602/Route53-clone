from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime

# --- Hosted Zone Schemas ---
class HostedZoneBase(BaseModel):
    name: str = Field(..., json_schema_extra={"example": "example.com"})
    comment: Optional[str] = Field(None, json_schema_extra={"example": "Main production domain"})
    zone_type: str = Field("Public", json_schema_extra={"example": "Public"})

class HostedZoneCreate(HostedZoneBase):
    pass

class HostedZoneUpdate(BaseModel):
    comment: Optional[str] = None

class HostedZoneResponse(HostedZoneBase):
    id: str
    record_count: int
    created_at: datetime

    # Pydantic V2 syntax for ORM parsing
    model_config = ConfigDict(from_attributes=True)


# --- DNS Record Schemas ---
class DNSRecordBase(BaseModel):
    name: str = Field(..., json_schema_extra={"example": "api.example.com"})
    type: str = Field(..., json_schema_extra={"example": "A"})
    ttl: int = Field(300, json_schema_extra={"example": 300})
    value: str = Field(..., json_schema_extra={"example": "192.0.2.1"})
    routing_policy: str = Field("Simple", json_schema_extra={"example": "Simple"})

class DNSRecordCreate(DNSRecordBase):
    pass

class DNSRecordUpdate(BaseModel):
    ttl: Optional[int] = None
    value: Optional[str] = None

class DNSRecordResponse(DNSRecordBase):
    id: str
    zone_id: str
    is_system_record: int
    created_at: datetime

    # Pydantic V2 syntax for ORM parsing
    model_config = ConfigDict(from_attributes=True)


class BulkDeleteRequest(BaseModel):
    record_ids: List[str]