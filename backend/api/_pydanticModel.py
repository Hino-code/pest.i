from pydantic import BaseModel


class FilterAll(BaseModel):
    start: str
    end: str
    season: str
    field_stage: str

class FilterByDate(BaseModel):
    start: str
    end: str
