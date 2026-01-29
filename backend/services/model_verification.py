import onnx

model = "../test_models/fakemodel.onnx"

def verify_onnx_model(model):
    try:
        onnx.checker.check_model(model)
        print("Valid Model")

        return True

    except Exception as e:
        print(f"Invalid model: {e}")

        return False

def main():
    verify_onnx_model(model)

if __name__ == "__main__":
    main()