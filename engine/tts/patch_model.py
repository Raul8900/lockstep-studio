"""Expose the duration predictor of the Kokoro ONNX graph as a second output.

The published export only returns audio. Caption timing needs to know how many
frames each phoneme received, which the graph already computes internally
(/encoder/Round -> Clip -> Cast). This script adds that tensor as an output so
word timings come from the model itself instead of from an estimate.
"""
import sys
import onnx
from onnx import helper, TensorProto

src, dst = sys.argv[1], sys.argv[2]
model = onnx.load(src)
graph = model.graph
target = "/encoder/Cast_output_0"
assert any(target in n.output for n in graph.node), "duration tensor not found"
graph.output.append(helper.make_tensor_value_info(target, TensorProto.INT64, None))
onnx.save(model, dst)
print("saved", dst)
