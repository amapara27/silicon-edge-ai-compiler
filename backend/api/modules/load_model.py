from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from typing import Optional
import sys
from pathlib import Path

# add services
sys.path.insert(0, str(Path(__file__).parent.parent.parent))
from services.load_model import (
    verify_onnx_with_data, 
    extract_model_info,
    ModelInfo,
)

router = APIRouter(prefix="/load-model", tags=["load-model"])


class UploadResponse(BaseModel):
    valid: bool
    error: Optional[str] = None
    model_info: Optional[dict] = None


class NodePosition(BaseModel):
    x: float
    y: float


class ReactFlowNode(BaseModel):
    id: str
    type: str
    position: NodePosition
    label: str
    op_type: str


class ReactFlowEdge(BaseModel):
    id: str
    source: str
    target: str
    animated: bool = True


class ImportResponse(BaseModel):
    valid: bool
    error: Optional[str] = None
    nodes: Optional[list[ReactFlowNode]] = None
    edges: Optional[list[ReactFlowEdge]] = None
    model_info: Optional[dict] = None


OP_DISPLAY_NAMES = {
    'Gemm': 'Dense', 
    'MatMul': 'Dense', 
    'Conv': 'Conv2D',
    'Relu': 'ReLU', 
    'Sigmoid': 'Sigmoid',
    'Tanh': 'Tanh', 
    'Softmax': 'Softmax',
    'BatchNormalization': 'BatchNorm', 
    'MaxPool': 'MaxPool', 
    'AveragePool': 'AvgPool',
    'GlobalAveragePool': 'GlobalAvgPool', 
    'Flatten': 'Flatten', 
    'Dropout': 'Dropout',
    'Add': 'Add', 
    'Concat': 'Concat', 
    'Reshape': 'Reshape',
}

async def _validate_and_load(file: UploadFile, data_file: Optional[UploadFile]):
    if not file.filename or not file.filename.endswith('.onnx'):
        raise HTTPException(status_code=400, detail="Model file must be .onnx")
    
    if data_file and data_file.filename and not data_file.filename.endswith('.data'):
        raise HTTPException(status_code=400, detail="Data file must be .data")
    
    try:
        onnx_bytes = await file.read()
        data_bytes = await data_file.read() if data_file else None
        data_filename = data_file.filename if data_file else None
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read files: {e}")
    
    if not data_bytes:
        return False, None, "Data file is required for models with external data"
    
    # validate uploaded model
    is_valid, model, error = verify_onnx_with_data(onnx_bytes, data_bytes, data_filename)
    if not is_valid:
        return False, None, error
    
    # extract model info
    return True, extract_model_info(model), None

# map model info to dict
def _model_info_to_dict(info: ModelInfo):
    return {
        "inputs": info.inputs,
        "outputs": info.outputs,
        "operators": info.operators,
        "layers": [{"name": l.name, "op_type": l.op_type, "inputs": l.inputs, "outputs": l.outputs} for l in info.layers],
        "weights": [{"name": w.name, "shape": w.shape, "dtype": w.dtype, "size": w.size} for w in info.weights],
        "ir_version": info.ir_version,
        "producer_name": info.producer_name,
        "model_version": info.model_version,
        "total_parameters": info.total_parameters
    }

# build react flow graph
def _build_react_flow_graph(info: ModelInfo) -> tuple[list[ReactFlowNode], list[ReactFlowEdge]]:
    nodes, edges = [], []
    spacing = 250
    
    # input node
    if info.inputs:
        nodes.append(ReactFlowNode(id="input-0", type="inputNode", position=NodePosition(x=100, y=200), label="Input", op_type="Input"))
    
    # layer nodes
    for i, layer in enumerate(info.layers):
        nodes.append(ReactFlowNode(
            id=f"layer-{i}",
            type="outputNode" if layer.op_type == "Softmax" else "layerNode",
            position=NodePosition(x=100 + spacing * (i + 1), y=200 + (25 if i % 2 == 0 else -25)),
            label=OP_DISPLAY_NAMES.get(layer.op_type, layer.op_type),
            op_type=layer.op_type
        ))
    
    # output node
    if info.outputs:
        nodes.append(ReactFlowNode(id="output-0", type="outputNode", position=NodePosition(x=100 + spacing * (len(info.layers) + 1), y=200), label="Output", op_type="Output"))
    
    # sequential edges
    for i in range(len(nodes) - 1):
        edges.append(ReactFlowEdge(id=f"e-{nodes[i].id}-{nodes[i+1].id}", source=nodes[i].id, target=nodes[i+1].id))
    
    return nodes, edges

@router.post("/upload", response_model=ImportResponse)
async def upload_onnx(file: UploadFile = File(...), data_file: Optional[UploadFile] = File(None)):
    valid, info, error = await _validate_and_load(file, data_file)
    if not valid:
        return ImportResponse(valid=False, error=error)
    
    # Generate graph data
    nodes, edges = _build_react_flow_graph(info)
    
    # Return everything
    return ImportResponse(
        valid=True, 
        nodes=nodes, 
        edges=edges, 
        model_info=_model_info_to_dict(info)
    )

