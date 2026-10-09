from typing import Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from . import models, schemas, validators

# --- Hosted Zone CRUD ---

def get_hosted_zones(db: Session, search: Optional[str] = None, skip: int = 0, limit: int = 100):
    query = db.query(models.HostedZone)
    if search:
        query = query.filter(models.HostedZone.name.ilike(f"%{search}%"))
    return query.order_by(models.HostedZone.created_at.desc()).offset(skip).limit(limit).all()

def get_hosted_zone_by_id(db: Session, zone_id: str):
    """Fetch a single Hosted Zone by ID."""
    zone = db.query(models.HostedZone).filter(models.HostedZone.id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Hosted Zone not found.")
    return zone

def create_hosted_zone(db: Session, zone: schemas.HostedZoneCreate):
    norm_name = validators.normalize_domain_name(zone.name)
    
    # Check if Hosted Zone already exists
    existing = db.query(models.HostedZone).filter(models.HostedZone.name == norm_name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail=f"Hosted Zone '{norm_name}' already exists."
        )

    db_zone = models.HostedZone(
        name=norm_name,
        comment=zone.comment,
        zone_type=zone.zone_type,
        record_count=2  # Will automatically have 2 default system records (NS + SOA)
    )
    db.add(db_zone)
    db.commit()
    db.refresh(db_zone)

    # Auto-generate Route 53 Name Server (NS) default record
    ns_values = (
        f"ns-1024.awsdns-00.org.\n"
        f"ns-512.awsdns-00.com.\n"
        f"ns-0.awsdns-00.net.\n"
        f"ns-1536.awsdns-00.co.uk."
    )
    ns_record = models.DNSRecord(
        zone_id=db_zone.id,
        name=norm_name,
        type="NS",
        ttl=172800,
        value=ns_values,
        is_system_record=1
    )

    # Auto-generate Route 53 Start of Authority (SOA) default record
    soa_value = f"ns-1024.awsdns-00.org. awsdns-hostmaster.amazon.com. 1 7200 900 1209600 86400"
    soa_record = models.DNSRecord(
        zone_id=db_zone.id,
        name=norm_name,
        type="SOA",
        ttl=900,
        value=soa_value,
        is_system_record=1
    )

    db.add(ns_record)
    db.add(soa_record)
    db.commit()

    return db_zone

def update_hosted_zone(db: Session, zone_id: str, zone_update: schemas.HostedZoneUpdate):
    """Updates a Hosted Zone (e.g., modifying the comment)."""
    zone = get_hosted_zone_by_id(db, zone_id)
    if zone_update.comment is not None:
        zone.comment = zone_update.comment
    db.commit()
    db.refresh(zone)
    return zone

def delete_hosted_zone(db: Session, zone_id: str):
    zone = db.query(models.HostedZone).filter(models.HostedZone.id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Hosted Zone not found.")
    db.delete(zone)
    db.commit()
    return True

# --- DNS Record CRUD ---

def get_records(db: Session, zone_id: str, search: Optional[str] = None, record_type: Optional[str] = None, skip: int = 0, limit: int = 100):
    query = db.query(models.DNSRecord).filter(models.DNSRecord.zone_id == zone_id)
    if search:
        query = query.filter(models.DNSRecord.name.ilike(f"%{search}%"))
    if record_type:
        query = query.filter(models.DNSRecord.type == record_type)
    return query.order_by(models.DNSRecord.created_at.desc()).offset(skip).limit(limit).all()

def create_dns_record(db: Session, zone_id: str, record: schemas.DNSRecordCreate):
    zone = db.query(models.HostedZone).filter(models.HostedZone.id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Hosted Zone not found.")

    # Explicitly cast to string so Pylance recognizes primitive str type
    zone_domain = str(zone.name)
    
    # Use the new validator logic to handle "@", empty strings, and subdomains properly
    norm_record_name = validators.normalize_record_name(record.name, zone_domain)

    # Perform syntax & edge case validation
    validators.validate_record_value(record.type, record.value, norm_record_name, zone_domain)

    # Duplicate check: (zone_id, name, type) combination must be unique
    existing = db.query(models.DNSRecord).filter(
        models.DNSRecord.zone_id == zone_id,
        models.DNSRecord.name == norm_record_name,
        models.DNSRecord.type == record.type
    ).first()

    if existing:
        raise HTTPException(
            status_code=400, 
            detail=f"Record set with Name '{norm_record_name}' and Type '{record.type}' already exists in this zone."
        )

    db_record = models.DNSRecord(
        zone_id=zone_id,
        name=norm_record_name,
        type=record.type,
        ttl=record.ttl,
        value=record.value.strip(),
        routing_policy=record.routing_policy,
        is_system_record=0
    )

    # Safely increment integer attribute
    zone.record_count = models.HostedZone.record_count + 1
    db.add(db_record)
    db.commit()
    db.refresh(db_record)
    return db_record

def update_dns_record(db: Session, zone_id: str, record_id: str, record_update: schemas.DNSRecordUpdate):
    """Updates an existing DNS record's TTL or value."""
    db_record = db.query(models.DNSRecord).filter(
        models.DNSRecord.id == record_id,
        models.DNSRecord.zone_id == zone_id
    ).first()
    if not db_record:
        raise HTTPException(status_code=404, detail="DNS Record not found.")
    
    # Prevent editing default Route53 system records
    if int(db_record.is_system_record) == 1:
        raise HTTPException(status_code=400, detail="Cannot edit system-generated SOA or NS records.")

    if record_update.value is not None:
        # Re-validate the new value before saving
        validators.validate_record_value(
            db_record.type, 
            record_update.value, 
            db_record.name, 
            str(db_record.zone.name)
        )
        db_record.value = record_update.value.strip()

    if record_update.ttl is not None:
        db_record.ttl = record_update.ttl

    db.commit()
    db.refresh(db_record)
    return db_record

def delete_single_dns_record(db: Session, zone_id: str, record_id: str):
    """Deletes a single DNS record and decrements the zone's record count."""
    db_record = db.query(models.DNSRecord).filter(
        models.DNSRecord.id == record_id,
        models.DNSRecord.zone_id == zone_id
    ).first()
    if not db_record:
        raise HTTPException(status_code=404, detail="DNS Record not found.")

    if int(db_record.is_system_record) == 1:
        raise HTTPException(status_code=400, detail="Cannot delete system-generated SOA or NS records.")

    zone = db_record.zone
    db.delete(db_record)
    zone.record_count = models.HostedZone.record_count - 1
    db.commit()
    return True

def bulk_delete_records(db: Session, zone_id: str, record_ids: list[str]):
    """Atomic multi-record deletion with transaction rollback safety."""
    zone = db.query(models.HostedZone).filter(models.HostedZone.id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Hosted Zone not found.")

    records = db.query(models.DNSRecord).filter(
        models.DNSRecord.zone_id == zone_id,
        models.DNSRecord.id.in_(record_ids)
    ).all()

    for r in records:
        if int(r.is_system_record) == 1:
            raise HTTPException(
                status_code=400, 
                detail=f"Cannot delete system-generated record '{r.type}' for domain '{r.name}'."
            )

    deleted_count = len(records)
    for r in records:
        db.delete(r)

    current_count = int(zone.record_count or 0)
    zone.record_count = max(0, current_count - deleted_count)
    db.commit()
    return {"deleted_count": deleted_count}