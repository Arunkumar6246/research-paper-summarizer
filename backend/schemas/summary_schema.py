from pydantic import BaseModel
from datetime import datetime

# Pydantic models
class SummaryBase(BaseModel):
    section_title: str
    summary_text: str
    page: int = 1

class SummaryCreate(SummaryBase):
    paper_id: int

class SummaryResponse(SummaryBase):
    id: int
    paper_id: int
    created_at: datetime

    class Config:
        orm_mode = True