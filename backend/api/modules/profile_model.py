from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from typing import Optional
import sys
from pathlib import Path
import onnx

# add services
sys.path.insert(0, str(Path(__file__).parent.parent.parent))
from services.profile_model import (
    profile_model as service_profile_model,
    profile_to_dict,
)
from services.load_model import verify_onnx_with_data

router = APIRouter(prefix="/profile-model", tags=["profile-model"])

class ProfileResponse(BaseModel):
    valid: bool
    error: Optional[str] = None
    model_info: Optional[dict] = None

# posts profiling
@router.post("/profile", response_model=ProfileResponse)
async def profile_onnx_model(
    file: UploadFile = File(...), 
    data_file: Optional[UploadFile] = File(None),
    board_name: str = "STM32F401", #hardcoded for now
    quantized: bool = False
):
    try:
        # Read file contents
        onnx_bytes = await file.read()
        data_bytes = await data_file.read() if data_file else b''
        data_filename = data_file.filename if data_file else ""

        # Verify and load model
        valid, model, error = verify_onnx_with_data(onnx_bytes, data_bytes, data_filename)
        
        if not valid or model is None:
            return ProfileResponse(valid=False, error=error or "Failed to load model")
        
        # Profile the model
        profile = service_profile_model(model, board_name=board_name, quantized=quantized)
        
        # Return profile info as ProfileResponse object
        return ProfileResponse(
            valid=True, 
            model_info=profile_to_dict(profile)
        )
    except Exception as e:
        return ProfileResponse(valid=False, error=str(e))
