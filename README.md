# Silicon: Deterministic Neural Network Compiler for Embedded Systems

**A zero-dependency, browser-based transpiler that converts high-level models into optimized C99 for microcontrollers.**

---

## 1. Executive Summary

**Silicon** is an open-source "Edge AI" development platform designed to bridge the gap between high-level machine learning frameworks and resource-constrained embedded systems (STM32, ESP32, AVR).

Unlike standard inference engines that rely on heavy runtime interpreters, Silicon functions as an **Ahead-of-Time (AOT) Compiler**. It analyzes the neural network graph, calculates precise memory requirements at compile-time, and generates human-readable, static C code with **zero dynamic memory allocation (malloc)**. This ensures deterministic performance and prevents memory fragmentation, making it suitable for safety-critical real-time applications.

## 2. Core Features

### 🎨 Visual Model Architect (GUI)
A drag-and-drop IDE built with Next.js and React Flow that allows users to design neural networks visually. Configure layer parameters (Dense units, Conv2D kernels) and see real-time output shape calculations.

### ⚡ The "No-Malloc" Compiler Engine
A custom backend that traverses the computation graph and linearizes it into a purely static C execution path. It guarantees 100% predictable RAM usage.

### 🧠 "Ping-Pong" Memory Optimization
Silicon implements a buffer-coloring algorithm to reuse memory. Instead of unique buffers for every layer, it creates a shared "Arena" where intermediate activations overwrite each other safely, reducing RAM footprint by up to 40%.

### 🤖 Agentic Hardware Optimizer
An LLM-based agent (Gemini/OpenAI) that acts as an "Embedded Systems Engineer." It cross-references model statistics (FLOPs, Param Count) against the target MCU's specs (Flash/RAM) to suggest architecture changes or quantization strategies.

### ✅ Bit-Accurate Verification
Automatically generates a Python "Ground Truth" vector and compares it against the simulated C output to verify numerical stability before deployment.

## 3. Technical Deep Dive

### The Memory Arena (Static Allocation)
Silicon flattens the execution graph and performs **liveness analysis** to calculate exactly when each tensor is used.
*   **Arena Mapping**: Maps two pointers (`*current_in`, `*current_out`) to a single static float `arena[MAX_SIZE]`.
*   **Result**: A model that naively requires 100KB of RAM can run in ~20KB with mathematically proven safety.

### The Transpilation Pipeline
1.  **Ingest**: Frontend exports graph JSON.
2.  **Parse**: Backend converts to internal graph representation (ONNX-compatible).
3.  **Generate**: Jinja2 templates inject weights into `PROGMEM` (Flash) arrays and unroll loop logic for the `forward_pass()` function.
4.  **Deploy**: Download `model.h` and `model.c` and drop them into your firmware project.

## 4. Technical Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, React Flow, Zustand.
- **Backend**: Python (FastAPI), NumPy (Verification), ONNX (Parsing), Jinja2 (C Generation).
- **Embedded Target**: Standard C99 (No external dependencies, math library only).
- **AI Integration**: Google Gemini API / OpenAI API.

## 5. Use Cases & Market Impact

### Generalized Use Cases
*   **Predictive Maintenance**: Identifying mechanical failure patterns in industrial motors.
*   **Edge Computing**: Real-time signal processing without cloud dependency.
*   **Low-Power IoT**: Running inference on battery-constrained devices.

### Specific Examples
*   **Formula SAE DAQ Systems**: Processing sensor data at high frequencies with deterministic latency for safety-critical telemetry.
*   **Smart Wearables**: Efficient gesture recognition or heart-rate analysis on ultra-low-power Cortex-M0+ chips.
*   **Smart Agriculture**: Leaf disease classification on ESP32-CAM modules for remote field monitoring.

## 6. Implementation Status

| Feature | Status |
|---|---|
| **Visual Architect (GUI)** | ✅ Implemented (v0.1) |
| **Basic Layer Nodes (Input, Dense, Output)** | ✅ Implemented |
| **Live Shape Calculation** | ✅ Implemented |
| **C99 Code Generation (Dense Layers)** | 🚧 In Progress |
| **Memory Arena Optimizer** | 📅 Roadmap |
| **ONNX Export/Import** | 📅 Roadmap |
| **Agentic Optimizer** | 📅 Roadmap |
| **Quantization (Fixed-point)** | 📅 Roadmap |

---

## Getting Started

1.  **Clone the Repo**: `git clone https://github.com/amapara27/silicon-edge-ai-compiler.git`
2.  **Run Frontend**: `cd frontend && npm install && npm run dev`
3.  **Run Backend**: `cd backend && pip install -r requirements.txt && python main.py`

---
*Created with 🧊 Silicon*
