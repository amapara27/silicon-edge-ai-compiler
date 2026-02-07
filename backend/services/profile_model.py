from dataclasses import dataclass
from typing import Optional
import onnx

from services.load_model import extract_model_info, ModelInfo, LayerInfo


@dataclass
class LayerProfile:
    """Profile information for a single layer."""
    name: str
    op_type: str
    shape: str
    param_count: int
    memory_bytes: int
    flops: int


@dataclass
class ModelProfile:
    """Complete profiling results for a model."""
    ram_used: int        
    ram_total: int        
    flash_used: int       
    flash_total: int       
    total_flops: int
    layers: list[LayerProfile]
    board_name: str


# Hardcoded board constraints for now - replaced by agent connection to MCP
BOARD_CONSTRAINTS = {
    'STM32F401': {
        'ram_total': 96 * 1024,       # 96KB SRAM
        'flash_total': 512 * 1024,    # 512KB Flash
    },
    'ESP32': {
        'ram_total': 320 * 1024,      # 320KB SRAM
        'flash_total': 4 * 1024 * 1024,  # 4MB Flash
    },
}

# Byte width per data type
DTYPE_BYTES = {
    'float32': 4,
    'float16': 2,
    'int32': 4,
    'int16': 2,
    'int8': 1,
    'uint8': 1,
    'bool': 1,
}


# get the byte width for a data type
def get_dtype_bytes(dtype: str) -> int:
    return DTYPE_BYTES.get(dtype, 4)

# calculate flash memory usage for storing model weights
def calculate_flash_memory(model_info: ModelInfo, quantized: bool = False) -> int:
    bytes_per_param = 1 if quantized else 4
    
    total_flash = 0
    for weight in model_info.weights:
        weight_bytes = get_dtype_bytes(weight.dtype)
        # Use actual dtype if not quantized, otherwise use quantized size
        if quantized:
            total_flash += weight.size * 1  # int8
        else:
            total_flash += weight.size * weight_bytes
    
    return total_flash

# get the output shape for a layer
def _get_output_shape_for_layer(layer: LayerInfo, model_info: ModelInfo) -> Optional[list]:
    return None

# calculate ram memory usage for inference
def calculate_ram_usage(
    model_info: ModelInfo,
    input_shape: Optional[list[int]] = None,
    quantized: bool = False,
    batch_size: int = 1 # batch size var accounts for dynamic shapes
) -> int:
    """
    Calculate RAM (arena) memory usage for inference.
    
    RAM = max(input_buffer_size, output_buffer_size) + intermediate_activations
    
    For a simplified estimation:
    RAM ≈ input_size + output_size + largest_intermediate_activation
    
    Args:
        model_info: Extracted model information from load_model
        input_shape: Optional input shape override, else uses model input
        quantized: If True, use int8 (1 byte), else float32 (4 bytes)
    
    Returns:
        Estimated RAM usage in bytes
    """
    # Calculate input buffer size
    input_size = 0
    if model_info.inputs:
        for inp in model_info.inputs:
            shape = input_shape or inp.get('shape', [])
            dtype = inp.get('dtype', 'float32')
            bytes_per_element = 1 if quantized else get_dtype_bytes(dtype)
            # Replace dynamic dimensions (strings or -1) with batch_size
            numeric_shape = [batch_size if not isinstance(d, int) or d <= 0 else d for d in shape]
            if numeric_shape:
                import numpy as np
                input_size += int(np.prod(numeric_shape)) * bytes_per_element
    
    # Calculate output buffer size
    output_size = 0
    if model_info.outputs:
        for out in model_info.outputs:
            shape = out.get('shape', [])
            dtype = out.get('dtype', 'float32')
            bytes_per_element = 1 if quantized else get_dtype_bytes(dtype)
            # Replace dynamic dimensions (strings or -1) with batch_size
            numeric_shape = [batch_size if not isinstance(d, int) or d <= 0 else d for d in shape]
            if numeric_shape:
                import numpy as np
                output_size += int(np.prod(numeric_shape)) * bytes_per_element
    
    # Estimate intermediate activations (heuristic: 2x largest of input/output)
    # In practice, TFLite Micro uses a tensor arena that holds all intermediate tensors
    max_buffer = max(input_size, output_size)
    intermediate_estimate = max_buffer * 2
    
    # Total arena size: input + output + intermediates
    # This is a conservative estimate
    total_ram = input_size + output_size + intermediate_estimate
    
    return total_ram


def calculate_layer_flops(layer: LayerInfo, model_info: ModelInfo) -> int:
    """
    Calculate FLOPs for a single layer.
    
    Formulas:
    - Dense: 2 * input_features * output_features
    - Conv2D: 2 * Kh * Kw * Cin * Hout * Wout * Cout
    - MaxPool2D, ReLU, Flatten: 0 (no multiply-add operations)
    
    Args:
        layer: Layer information
        model_info: Full model information for weight lookups
    
    Returns:
        FLOPs for this layer
    """
    op_type = layer.op_type.lower()
    
    # Find associated weights for this layer
    layer_weights = []
    for weight in model_info.weights:
        # Check if weight is used by this layer
        if weight.name in layer.inputs:
            layer_weights.append(weight)
    
    if op_type in ['gemm', 'matmul', 'dense', 'fc', 'fullyconnected']:
        # Dense: 2 * I * O (multiply-add = 2 ops)
        for weight in layer_weights:
            if len(weight.shape) == 2:
                input_features, output_features = weight.shape
                return 2 * input_features * output_features
        return 0
    
    elif op_type in ['conv', 'conv2d', 'convolution']:
        # Conv2D: (Kh * Kw * Cin) * (Hout * Wout * Cout)
        # Weight shape is typically [Cout, Cin, Kh, Kw] or [Kh, Kw, Cin, Cout]
        for weight in layer_weights:
            if len(weight.shape) == 4:
                # Assume OIHW format (PyTorch style): [Cout, Cin, Kh, Kw]
                cout, cin, kh, kw = weight.shape
                # Estimate output spatial size (assume same padding, no stride for now)
                # This is a rough estimate - real impl would need input shape tracking
                hout, wout = 28, 28  # Placeholder, would be computed from input shape
                return (kh * kw * cin) * (hout * wout * cout)
        return 0

    # all other cases have don't count as FLOPS - return 0
    else:
        return 0

# calculate total FLOPs for the entire model - iterates through layers
def calculate_total_flops(model_info: ModelInfo) -> tuple[int, list[tuple[str, int]]]:
    total_flops = 0
    layer_flops = []
    
    for layer in model_info.layers:
        flops = calculate_layer_flops(layer, model_info)
        total_flops += flops
        layer_flops.append((layer.name, flops))
    
    return total_flops, layer_flops

# profile model - main function to be called by the agent
def profile_model(
    model: onnx.ModelProto,
    board_name: str = 'STM32F401',
    quantized: bool = False,
    batch_size: int = 1
) -> ModelProfile:
    """
    Generate complete profiling results for a model on a specific board.
    
    This is the main function to be called by the agent.
    
    Args:
        model: ONNX model proto
        board_name: Target board name ('STM32F401' or 'ESP32')
        quantized: Whether to assume int8 quantization
    
    Returns:
        ModelProfile with all profiling metrics
    """
    # Extract model info using existing function
    model_info = extract_model_info(model)
    
    # Get board constraints
    board = BOARD_CONSTRAINTS.get(board_name, BOARD_CONSTRAINTS['STM32F401'])
    
    # Calculate metrics
    flash_used = calculate_flash_memory(model_info, quantized)
    ram_used = calculate_ram_usage(model_info, quantized=quantized, batch_size=batch_size)
    total_flops, layer_flops_list = calculate_total_flops(model_info)
    
    # Build layer profiles
    layers = []
    for layer in model_info.layers:
        # Find weight info for this layer
        param_count = 0
        for weight in model_info.weights:
            if weight.name in layer.inputs:
                param_count += weight.size
        
        # Get layer FLOPs
        layer_flop = next(
            (f for name, f in layer_flops_list if name == layer.name), 
            0
        )
        
        # Estimate memory for this layer's output (simplified)
        bytes_per_elem = 1 if quantized else 4
        memory_bytes = param_count * bytes_per_elem
        
        # Get output shape string
        output_shape = "N/A"
        for weight in model_info.weights:
            if weight.name in layer.inputs and len(weight.shape) >= 2:
                # Use last dimension as output shape hint
                output_shape = "x".join(str(d) for d in weight.shape)
                break
        
        layers.append(LayerProfile(
            name=layer.name,
            op_type=layer.op_type,
            shape=output_shape,
            param_count=param_count,
            memory_bytes=memory_bytes,
            flops=layer_flop
        ))
    
    return ModelProfile(
        ram_used=ram_used,
        ram_total=board['ram_total'],
        flash_used=flash_used,
        flash_total=board['flash_total'],
        total_flops=total_flops,
        layers=layers,
        board_name=board_name
    )


# convert ModelProfile to a dictionary for JSON serialization (FastAPI response)
def profile_to_dict(profile: ModelProfile) -> dict:
    return {
        'ram_used': profile.ram_used,
        'ram_total': profile.ram_total,
        'flash_used': profile.flash_used,
        'flash_total': profile.flash_total,
        'total_flops': profile.total_flops,
        'board_name': profile.board_name,
        'layers': [
            {
                'name': layer.name,
                'type': layer.op_type,
                'shape': layer.shape,
                'param_count': layer.param_count,
                'memory_bytes': layer.memory_bytes,
                'flops': layer.flops
            }
            for layer in profile.layers
        ]
    }


# For testing
if __name__ == "__main__":
    import onnx
    
    model_path = "../test_models/simple_nn-2.onnx"
    try:
        model = onnx.load(model_path)
        
        # Profile for STM32F401
        profile = profile_model(model, board_name='STM32F401')
        result = profile_to_dict(profile)
        
        print(f"Board: {result['board_name']}")
        print(f"RAM: {result['ram_used']:,} / {result['ram_total']:,} bytes")
        print(f"Flash: {result['flash_used']:,} / {result['flash_total']:,} bytes")
        print(f"FLOPs: {result['total_flops']:,}")
        print(f"\nLayers ({len(result['layers'])}):")
        for layer in result['layers']:
            print(f"  {layer['name']}: {layer['type']} | params={layer['param_count']:,}")
    except Exception as e:
        print(f"Error: {e}")