from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.tokenizer import tokenize_text


app = FastAPI(title="TokenLens API")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class TextRequest(BaseModel):
    text: str


@app.get("/")
def root():
    return {
        "message": "TokenLens API is running"
    }


@app.post("/tokenize")
def tokenize(request: TextRequest):
    return tokenize_text(request.text)