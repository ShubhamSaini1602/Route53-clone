import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Integer, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship, Mapped, mapped_column
from .database import Base

def generate_id() -> str:
    return str(uuid.uuid4())

def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class HostedZone(Base):
    __tablename__ = "hosted_zones"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_id)
    name: Mapped[str] = mapped_column(String, index=True, nullable=False)
    comment: Mapped[str | None] = mapped_column(String, nullable=True)
    zone_type: Mapped[str] = mapped_column(String, default="Public")
    record_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)

    records = relationship("DNSRecord", back_populates="zone", cascade="all, delete-orphan")


class DNSRecord(Base):
    __tablename__ = "dns_records"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_id)
    zone_id: Mapped[str] = mapped_column(String, ForeignKey("hosted_zones.id"), nullable=False)
    name: Mapped[str] = mapped_column(String, index=True, nullable=False)
    type: Mapped[str] = mapped_column(String, nullable=False)
    ttl: Mapped[int] = mapped_column(Integer, default=300)
    value: Mapped[str] = mapped_column(Text, nullable=False)
    routing_policy: Mapped[str] = mapped_column(String, default="Simple")
    is_system_record: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)

    zone = relationship("HostedZone", back_populates="records")