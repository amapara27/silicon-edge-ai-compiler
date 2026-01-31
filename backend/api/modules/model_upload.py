from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from typing import Optional
import sys
from pathlib import Path

# add services
sys.path.insert(0, str(Path(__file__).parent.parent.parent))
from services.model_verification import (
    verify_onnx_with_data, 
    extract_model_info,
)

# routing
router = APIRouter(prefix="/model", tags=["model"])


class WeightResponse(BaseModel):
    name: str
    shape: list[int]
    dtype: str
    size: int


class UploadResponse(BaseModel):
    valid: bool
    error: Optional[str] = None
    model_info: Optional[dict] = None


@router.post("/upload", response_model=UploadResponse)
async def upload_onnx(
    file: UploadFile = File(...),
    data_file: Optional[UploadFile] = File(None)
):

    # onnx filename validation
    if not file.filename or not file.filename.endswith('.onnx'):
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. The model file must be .onnx"
        )
    
    # data filename validation
    if data_file and data_file.filename and not data_file.filename.endswith('.data'):
        raise HTTPException(
            status_code=400,
            detail="Invalid data file type. The data file must be .data"
        )
    
    # read file contents
    try:
        onnx_contents = await file.read()
        data_contents = await data_file.read() if data_file else None
        data_filename = data_file.filename if data_file else None
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read files: {e}")
    
    # validate model
    if data_contents:
        is_valid, model, error = verify_onnx_with_data(
            onnx_contents, 
            data_contents, 
            data_filename
        )
    else:
        is_valid = False
        error = "Data file is required for models with external data"
    
    if not is_valid:
        return UploadResponse(
            valid=False,
            error=error
        )
    
    # extract model info including weights
    info = extract_model_info(model)
    
    # convert weights to serializable format
    weights_data = [
        {
            "name": w.name,
            "shape": w.shape,
            "dtype": w.dtype,
            "size": w.size
        }
        for w in info.weights
    ]
    
    # convert layers to serializable format
    layers_data = [
        {
            "name": l.name,
            "op_type": l.op_type,
            "inputs": l.inputs,
            "outputs": l.outputs
        }
        for l in info.layers
    ]
    
    return UploadResponse(
        valid=True,
        model_info={
            "inputs": info.inputs,
            "outputs": info.outputs,
            "operators": info.operators,
            "layers": layers_data,
            "ir_version": info.ir_version,
            "producer_name": info.producer_name,
            "model_version": info.model_version,
            "weights": weights_data,
            "total_parameters": info.total_parameters
        }
    )
