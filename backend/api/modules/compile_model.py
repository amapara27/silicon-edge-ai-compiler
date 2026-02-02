from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
import sys
from pathlib import Path
import io
import zipfile

# add services
sys.path.insert(0, str(Path(__file__).parent.parent.parent))
from services.compile_model import compile_model, CompiledModel
from api.modules.load_model import get_loaded_model, get_loaded_model_info

router = APIRouter(prefix="/compile-model", tags=["compile-model"])


class CompileRequest(BaseModel):
    model_name: str = "model"
    target_chip: str = "STM32F401"


class CompileResponse(BaseModel):
    success: bool
    error: Optional[str] = None
    source_code: Optional[str] = None
    header_code: Optional[str] = None
    model_name: Optional[str] = None


# posts generated C files
@router.post("/compile", response_model=CompileResponse)
async def compile_to_c(request: CompileRequest):
    model = get_loaded_model()
    model_info = get_loaded_model_info()
    
    if model is None or model_info is None:
        return CompileResponse(
            success=False,
            error="No model loaded. Please upload an ONNX model first."
        )
    
    try:
        compiled = compile_model(
            model=model,
            model_info=model_info,
            model_name=request.model_name,
            target_chip=request.target_chip
        )
        
        return CompileResponse(
            success=True,
            source_code=compiled.source_code,
            header_code=compiled.header_code,
            model_name=compiled.model_name
        )
    except Exception as e:
        return CompileResponse(
            success=False,
            error=f"Compilation failed: {str(e)}"
        )


@router.post("/download")
async def download_c_files(request: CompileRequest):
    """
    Compile and download the C code files as a zip archive.
    """
    model = get_loaded_model()
    model_info = get_loaded_model_info()
    
    if model is None or model_info is None:
        raise HTTPException(
            status_code=400,
            detail="No model loaded. Please upload an ONNX model first."
        )
    
    try:
        compiled = compile_model(
            model=model,
            model_info=model_info,
            model_name=request.model_name,
            target_chip=request.target_chip
        )
        
        # Create zip file in memory
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            zip_file.writestr(f"{compiled.model_name}.c", compiled.source_code)
            zip_file.writestr(f"{compiled.model_name}.h", compiled.header_code)
        
        zip_buffer.seek(0)
        
        return StreamingResponse(
            zip_buffer,
            media_type="application/zip",
            headers={
                "Content-Disposition": f"attachment; filename={compiled.model_name}_c_code.zip"
            }
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate C code: {str(e)}"
        )
