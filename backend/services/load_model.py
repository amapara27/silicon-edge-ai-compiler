import onnx
import numpy as np
from typing import Optional
from dataclasses import dataclass, field
import tempfile
import os

# weight info class
@dataclass
class WeightInfo:
    name: str
    shape: list[int]
    dtype: str
    size: int


# layer info class
@dataclass
class LayerInfo:
    name: str
    op_type: str
    inputs: list[str]
    outputs: list[str]


# model info class
@dataclass
class ModelInfo:
    inputs: list[dict]
    outputs: list[dict]
    operators: list[str]
    layers: list[LayerInfo] = field(default_factory=list)
    ir_version: int = 0
    producer_name: str = 'Unknown'
    model_version: int = 0
    weights: list[WeightInfo] = field(default_factory=list)
    total_parameters: int = 0


ONNX_DTYPE_MAP = {
    1: "float32",
    2: "uint8",
    3: "int8",
    4: "uint16",
    5: "int16",
    6: "int32",
    7: "int64",
    8: "string",
    9: "bool",
    10: "float16",
    11: "float64",
    12: "uint32",
    13: "uint64",
}


def get_tensor_info(tensor):
    shape = []
    if tensor.type.tensor_type.HasField('shape'):
        for dim in tensor.type.tensor_type.shape.dim:
            if dim.HasField('dim_value'):
                shape.append(dim.dim_value)
            elif dim.HasField('dim_param'):
                shape.append(dim.dim_param)
            else:
                shape.append(-1)
    
    return {
        'name': tensor.name,
        'shape': shape,
        'dtype': ONNX_DTYPE_MAP.get(tensor.type.tensor_type.elem_type, 'float32')
    }


# extracts weights from model
def extract_weights(model: onnx.ModelProto) -> tuple[list[WeightInfo], int]:
    weights = []
    total_params = 0
    
    for initializer in model.graph.initializer:
        shape = list(initializer.dims)
        size = int(np.prod(shape)) if shape else 1
        total_params += size
        
        dtype = ONNX_DTYPE_MAP.get(initializer.data_type, f"unknown({initializer.data_type})")
        
        weights.append(WeightInfo(
            name=initializer.name,
            shape=shape,
            dtype=dtype,
            size=size
        ))
    
    return weights, total_params


# extracts layers from model graph
def extract_layers(model: onnx.ModelProto) -> list[LayerInfo]:
    layers = []
    for node in model.graph.node:
        layers.append(LayerInfo(
            name=node.name or f"{node.op_type}_{len(layers)}",
            op_type=node.op_type,
            inputs=list(node.input),
            outputs=list(node.output)
        ))
    return layers


def extract_model_info(model: onnx.ModelProto) -> ModelInfo:
    graph = model.graph
    
    # exclude weights
    initializer_names = {init.name for init in graph.initializer}
    inputs = [get_tensor_info(inp) for inp in graph.input if inp.name not in initializer_names]
    outputs = [get_tensor_info(out) for out in graph.output]
    operators = list(set(node.op_type for node in graph.node))
    
    # extract weights
    weights, total_params = extract_weights(model)
    
    # extract layers
    layers = extract_layers(model)
    
    # returns all the model info as a modelinfo object
    return ModelInfo(
        inputs=inputs,
        outputs=outputs,
        operators=sorted(operators),
        layers=layers,
        ir_version=model.ir_version,
        producer_name=model.producer_name or 'Unknown',
        model_version=model.model_version,
        weights=weights,
        total_parameters=total_params
    )

# verifies onnx model
def verify_onnx_model(model_path: str) -> tuple[bool, Optional[str]]:
    try:
        onnx.checker.check_model(model_path)
        return True, None
    except Exception as e:
        return False, str(e)

# verifies onnx model with .data file
def verify_onnx_with_data(onnx_bytes: bytes, data_bytes: bytes, data_filename: str) -> tuple[bool, Optional[onnx.ModelProto], Optional[str]]:
    try:
        # create temp directory
        with tempfile.TemporaryDirectory() as tmpdir:
            onnx_path = os.path.join(tmpdir, "model.onnx")
            
            with open(onnx_path, 'wb') as f:
                f.write(onnx_bytes)
            
            # first load without external data to find the expected data filename
            model_meta = onnx.load(onnx_path, load_external_data=False)
            
            # find expected data filename from initializers
            expected_data_filename = None
            for init in model_meta.graph.initializer:
                if init.HasField('data_location') and init.data_location == onnx.TensorProto.EXTERNAL:
                    for entry in init.external_data:
                        if entry.key == 'location':
                            expected_data_filename = entry.value
                            break
                if expected_data_filename:
                    break
            
            # save the data file with the expected filename
            if data_bytes:
                actual_filename = expected_data_filename or data_filename
                data_path = os.path.join(tmpdir, actual_filename)
                with open(data_path, 'wb') as f:
                    f.write(data_bytes)
            
            # now load model with external data
            model = onnx.load(onnx_path, load_external_data=True)
            
            if not model.graph:
                return False, None, "Model has no graph"
            
            if not model.graph.node:
                return False, None, "Model graph has no nodes"
            
            return True, model, None
            
    except Exception as e:
        return False, None, str(e)

# test function
def main():
    model_path = "../test_models/model.onnx"
    is_valid, error = verify_onnx_model(model_path)
    
    if is_valid:
        print("Valid ONNX model")
        model = onnx.load(model_path)
        info = extract_model_info(model)
        print(f"Inputs: {info.inputs}")
        print(f"Outputs: {info.outputs}")
        print(f"Operators: {info.operators}")
        print(f"Weights: {len(info.weights)}")
        print(f"Total Parameters: {info.total_parameters:,}")
    else:
        print(f"Invalid model: {error}")


if __name__ == "__main__":
    main()