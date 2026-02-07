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

# caching for most recent compilation
cached_compiled_model: Optional[CompiledModel] = None
cached_model_name: Optional[str] = None
cached_target_chip: Optional[str] = None

# clears compilation cache (call when a new model is uploaded)
def invalidate_cache():
    global cached_compiled_model, cached_model_name, cached_target_chip
    cached_compiled_model = None
    cached_model_name = None
    cached_target_chip = None

# model information validation
class CompileRequest(BaseModel):
    model_name: str = "model"
    target_chip: str = "STM32F401" # placeholder target chip for now

# model compilation validation
class CompileResponse(BaseModel):
    success: bool
    error: Optional[str] = None
    source_code: Optional[str] = None
    header_code: Optional[str] = None
    model_name: Optional[str] = None

# gets the cached model or compiles a new one
def _get_or_compile(request: CompileRequest):
    global cached_compiled_model, cached_model_name, cached_target_chip
    
    if cached_compiled_model and cached_model_name == request.model_name and cached_target_chip == request.target_chip:
        return cached_compiled_model
    else:
        compiled = compile_model(
            model=get_loaded_model(),
            model_info=get_loaded_model_info(),
            model_name=request.model_name,
            target_chip=request.target_chip
        )
        cached_compiled_model = compiled
        cached_model_name = request.model_name
        cached_target_chip = request.target_chip
        return compiled


# posts generated C files -  compiles modle to C code, ensures request is valid and model is loaded
@router.post("/compile", response_model=CompileResponse)
async def compile_to_c(request: CompileRequest):
    model = get_loaded_model()
    model_info = get_loaded_model_info()
    
    # conditionals to verify model is loaded and formatted correctly
    if model is None or model_info is None:
        return CompileResponse(
            success=False,
            error="No model loaded. Please upload an ONNX model first."
        )
    
    # compiles the model to C code
    try:
        compiled = _get_or_compile(request)
        
        # returns a valid CompileResponse Object
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

# posts zip files for download
@router.post("/download")
async def download_c_files(request: CompileRequest):
    model = get_loaded_model()
    model_info = get_loaded_model_info()
    
    if model is None or model_info is None:
        raise HTTPException(
            status_code=400,
            detail="No model loaded. Please upload an ONNX model first."
        )
    
    try:
        compiled = _get_or_compile(request)
        
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
