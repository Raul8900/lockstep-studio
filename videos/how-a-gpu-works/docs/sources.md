# Sources — "How Does a Modern GPU Actually Work Internally?"

Research was done before the narration was written. Vendor documentation was prioritised; third-party
material is used only for product specifications and platform safe areas, and is marked as such.

How to read this file: each claim made in the video is listed with the source that supports it and a
note on whether the concept is **architecture-general** or **vendor-specific**.

---

## 1. Why CPUs and GPUs are built differently

| Claim in the video | Support | Scope |
|---|---|---|
| A CPU spends its transistors on caching and control flow so one task finishes fast; a GPU spends them on data processing. | NVIDIA CUDA Programming Guide, §1.1 Introduction: GPUs are specialised for highly parallel computation and devote more transistors to data processing, while CPUs dedicate more to data caching and flow control. | General |
| A GPU gives much higher instruction throughput and memory bandwidth for the same price/power, at the cost of single-thread speed. | Same section. | General |

- NVIDIA, *CUDA Programming Guide — 1.1 Introduction*: https://docs.nvidia.com/cuda/cuda-programming-guide/01-introduction/introduction.html

## 2. How the CPU hands work to the GPU

| Claim | Support | Scope |
|---|---|---|
| The application keeps running on the CPU; a driver turns API calls into GPU commands. | Linux kernel AMDGPU docs (command processor, ring buffer, indirect buffers); AMD GPUOpen graphics-pipeline deck. | General |
| Data (meshes, textures, tensors) is copied across PCIe into the GPU's own memory before the work runs. | Same, plus the PCIe figures below. | General |
| The CPU sends a small function (kernel / shader) that is launched across a very large number of threads. | CUDA Programming Guide, §1.2 Programming Model (kernels, grids, thread blocks). | General (CUDA wording) |

- Linux kernel docs, *drm/amdgpu — Graphics and Compute (GC)*: https://docs.kernel.org/gpu/amdgpu/gc/index.html
- AMD GPUOpen, *AMD Graphics Pipeline (GIC 2020)*: https://gpuopen.com/download/AMD_Graphics_pipeline_GIC2020.pdf
- NVIDIA, *CUDA Programming Guide — 1.2 Programming Model*: https://docs.nvidia.com/cuda/cuda-programming-guide/01-introduction/programming-model.html

## 3. The repeated compute block, and what each vendor calls it

| Vendor | Name of the repeated block | Name of the lock-step thread group |
|---|---|---|
| NVIDIA | Streaming Multiprocessor (SM) | Warp (32 threads) |
| AMD | Compute Unit (CU); "dual CU" / workgroup processor on RDNA | Wavefront (32 on RDNA natively, 64 via dual-issue; 64 on GCN/CDNA) |
| Intel | Xe-core (formerly "subslice") built from Xe Vector Engines (formerly "EUs") plus XMX matrix engines | Compiler-chosen SIMD width: SIMD-8 / 16 / 32 |
| Vendor-neutral APIs | — | OpenCL/SYCL/Vulkan: work-item (thread), work-group (block), sub-group (warp/wavefront) |

- NVIDIA, *CUDA Programming Guide — 3.2 Advanced Kernel Programming* (SMs, warps, warp schedulers, hardware multithreading): https://docs.nvidia.com/cuda/cuda-programming-guide/03-advanced/advanced-kernel-programming.html
- AMD ROCm, *HIP — Hardware implementation*: https://rocm.docs.amd.com/projects/HIP/en/latest/understand/hardware_implementation.html
- AMD ROCm, *Workgroup processor (WGP)*: https://rocm.docs.amd.com/projects/rocprofiler-compute/en/latest/conceptual/rdna/wgp.html
- AMD GPUOpen, *RDNA Architecture* (wave32 native, wave64 via dual-issue, dual compute unit): https://gpuopen.com/download/RDNA_Architecture_public.pdf
- Intel, *oneAPI GPU Optimization Guide — Intel Xe GPU Architecture* (Xe-core = 16 vector + 16 matrix engines on Xe-HPG; EU → XVE, subslice → Xe-core): https://www.intel.com/content/www/us/en/docs/oneapi/optimization-guide-gpu/2025-0/intel-xe-gpu-architecture.html
- Intel, *oneAPI GPU Optimization Guide — Execution Model Overview* (SIMD width is a compiler heuristic: SIMD-8/16/32): https://www.intel.com/content/www/us/en/docs/oneapi/optimization-guide-gpu/2025-0/execution-model-overview.html

## 4. Threads, blocks and warps; SIMT

| Claim | Support | Scope |
|---|---|---|
| Work is launched as threads grouped into blocks; a block lands on one compute unit. | CUDA guide: a kernel runs as a grid of equally-shaped thread blocks (up to 1024 threads each); each block can be scheduled on any available multiprocessor. | General idea, CUDA terms |
| The unit splits a block into warps of 32. | CUDA guide §1.2 and §3.2: "threads are organized into groups of 32 threads called warps"; blocks are split into warps, each scheduled by a warp scheduler. | NVIDIA-specific number |
| One instruction, many threads (SIMT): the warp executes the same instruction together, each thread on its own data. | CUDA guide §1.2/§3.2; ROCm HIP hardware-implementation page (each cycle one instruction from a wavefront resident on the CU is issued). | General |
| The "thousands of cores" are execution lanes, not independent CPU-like cores. | Follows from the SIMT model above: fetch/decode/scheduling is done per warp, not per lane. | General |

- NVIDIA, *CUDA Programming Guide — 2.2 Writing CUDA SIMT Kernels*: https://docs.nvidia.com/cuda/cuda-programming-guide/02-basics/writing-cuda-kernels.html
- NVIDIA, *CUDA C++ Programming Guide (archive 12.8)* — thread hierarchy, SIMT architecture, hardware multithreading: https://docs.nvidia.com/cuda/archive/12.8.2/cuda-c-programming-guide/index.html

## 5. Inside a compute unit: scheduling and registers

| Claim | Support | Scope |
|---|---|---|
| A scheduler juggles dozens of warps per unit. | NVIDIA Ada tuning guide: maximum 48 concurrent warps per SM; 64K 32-bit registers per SM. Blackwell microbenchmark study: four execution contexts per SM issue instructions each cycle. | NVIDIA-specific numbers |
| Every thread keeps its own registers on the chip, so switching warps costs nothing. | CUDA guide §3.2 "Hardware Multithreading": the execution context (program counters, registers) of each warp is maintained on-chip for the warp's lifetime, so switching between warps incurs no cost. ROCm HIP page says the same of compute units. | General |
| When a warp waits on memory another one runs (latency hiding). | Same sections. | General |

- NVIDIA, *Tuning CUDA Applications for NVIDIA Ada GPU Architecture*: https://docs.nvidia.com/cuda/ada-tuning-guide/index.html
- Jarmusch et al., *Dissecting the NVIDIA Blackwell Architecture with Microbenchmarks* (arXiv:2507.10789): https://arxiv.org/html/2507.10789v2

## 6. Memory hierarchy and bandwidth

| Claim | Support | Scope |
|---|---|---|
| Registers → per-unit shared memory / L1 → chip-wide L2 → VRAM. | CUDA guide (local, shared, global memory); Ada tuning guide (unified L1 / texture cache / shared memory, 128 KB per SM, up to 100 KB usable as shared memory). | General structure, NVIDIA numbers |
| Shared memory lets threads of the same block exchange results. | CUDA guide: threads within a block cooperate through shared memory and synchronise with a barrier. Intel guide: shared local memory per Xe-core/subslice. AMD: local data share (LDS). | General |
| A flagship card's VRAM feeds the chip at well over 1,000 GB/s. | GeForce RTX 5090: 32 GB GDDR7, 512-bit bus, 28 Gbps → 1,792 GB/s (RTX 4090: 1,008 GB/s). | Product-specific |
| The link from the CPU is far narrower. | PCIe 5.0 x16 ≈ 63–64 GB/s per direction. | General |
| Many workloads are limited by memory bandwidth rather than arithmetic. | Roofline reasoning; inference/decode workloads are bandwidth-bound. | General |

- TechPowerUp, *NVIDIA GeForce RTX 5090 Founders Edition review* (spec table: 170 SMs, 21,760 CUDA cores, 1,792 GB/s): https://www.techpowerup.com/review/nvidia-geforce-rtx-5090-founders-edition/
- Tom's Hardware, *RTX 5090 versus RTX 4090*: https://www.tomshardware.com/pc-components/gpus/nvidia-geforce-rtx-5090-versus-rtx-4090-how-does-the-new-halo-gpu-compare-with-its-predecessor
- TechPowerUp, *RTX 5090 PCI-Express scaling*: https://www.techpowerup.com/review/nvidia-geforce-rtx-5090-pci-express-scaling/
- APXML, *Memory bandwidth and model size*: https://apxml.com/courses/llm-model-sizes-hardware/chapter-3-model-size-hardware-connection/memory-bandwidth

## 7. Rendering and AI

| Claim | Support | Scope |
|---|---|---|
| A 4K frame is about eight million pixels (3840 × 2160 = 8,294,400), each running the same small program on different data. | Arithmetic; Microsoft Direct3D pixel-shader stage documentation. Rasterisers emit fragments in 2×2 quads that are shaded in lock-step. | General |
| A neural network is mostly matrix multiplication, i.e. vast numbers of identical multiply-adds. | NVIDIA tensor-core documentation: dedicated hardware for matrix multiply-accumulate, "the core computation in deep learning". | General (tensor cores are NVIDIA's name; Intel: XMX) |

- Microsoft Learn, *Pixel Shader Stage*: https://learn.microsoft.com/en-us/windows/win32/direct3d11/pixel-shader-stage
- NVIDIA, *Matrix Multiply Accelerators* (cuda-oxide docs): https://nvlabs.github.io/cuda-oxide/advanced/matrix-multiply-accelerators.html
- Markidis et al., *NVIDIA Tensor Core Programmability, Performance & Precision* (arXiv:1803.04014): https://arxiv.org/abs/1803.04014

## 8. Limits to scaling

| Claim | Support | Scope |
|---|---|---|
| When threads in a warp take different branches, each path runs in turn while the other threads are masked off. | CUDA guide §1.2: when threads diverge the others are masked off; utilisation is maximised when a warp follows one control-flow path. ROCm HIP page: results of non-participating threads are masked out and the other branch is executed the same way. | General |
| Threads that must wait for one another leave lanes idle. | CUDA guide: block-level barriers make all threads wait. | General |

## 9. Platform safe areas (layout decisions)

Neither Meta nor Google publishes fixed pixel constants; these are measured values from tooling vendors,
so the layout uses the most conservative union of them.

| Source | Top | Bottom | Right column |
|---|---|---|---|
| Instagram Reels (measured guides) | ~210–250 px | ~310–450 px | ~120–170 px in the lower half |
| YouTube Shorts (measured guides / ad safe-zone tool) | ~120–290 px | ~300–380 px (19.8 %) | ~96–200 px (18.6 %) |
| Cross-platform rule of thumb | 900 × 1400 px centred | | |

Layout rule used in this video: essential content sits inside x 70–1010, y 270–1470; below y 900, numbers
and names stay left of x ≈ 910 (the button column); burned-in captions sit at y 1260–1440, at most 800 px wide.

- reap.video, *Short-form video safe zones*: https://reap.video/blog/short-form-video-safe-zones
- adaptlypost, *Social media safe zones 2026*: https://adaptlypost.com/blog/social-media-safe-zones-2026-complete-guide
- adkit, *YouTube Shorts ad safe zones*: https://adkit.so/tools/safe-zones/youtube

---

### A note on how the research was gathered

The build sandbox could not open vendor sites directly (network policy), so documentation was read
through web search results that quote those pages. Every figure used on screen was confirmed by at
least one vendor document or two independent spec listings. Figures that could not be confirmed
(for example the number of concurrent warps per SM on Blackwell) are not stated as numbers in the
video; the narration says "dozens" instead.
