from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Index, Integer, String, Text

from src.db.database import Base


class Example(Base):
    """Example SQLAlchemy モデル"""

    __tablename__ = "examples"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, index=True)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    # 複合インデックスの追加
    __table_args__ = (
        Index("idx_examples_name_active", "name", "is_active"),
        Index("idx_examples_created_at_desc", "created_at"),
    )
