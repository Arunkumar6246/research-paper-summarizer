from pydantic import BaseModel
from datetime import datetime

# Pydantic models
class PaperBase(BaseModel):
    filename: str
    file_path: str

class PaperCreate(PaperBase):
    pass

class PaperResponse(PaperBase):
    id: int
    upload_date: datetime

    class Config:
        from_attributes = True