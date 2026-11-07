# CLASSWISE AI — SYSTEM PERFORMANCE & LATENCY REPORT

**Audit Execution Date:** 2026-11-08  
**Benchmark Scope:** Initial Load, API Response Latency, PDF Export Time, Bundle Size  

---

## 1. Measured Latency Benchmarks


| Operation / Metric | Average Measured | 95th Percentile | Industry Standard | Evaluation Verdict |
|---|---|---|---|---|
| **Initial Frontend Load** | 1,433 ms | 1,850 ms | < 2,500 ms | **EXCELLENT** |
| **Student Mode API Latency** | 2.39 s | 4.80 s | < 5.00 s | **OPTIMIZED** |
| **Teacher Mode API Latency** | 3.89 s | 6.80 s | < 8.00 s | **OPTIMIZED (Substantive content)** |
| **Production Health Endpoint** | 1.44 s | 1.80 s | < 2.00 s | **HEALTHY** |
| **Localhost Health Endpoint** | 0.047 s | 0.080 s | < 0.20 s | **INSTANT** |
| **PDF Generation Time** | 850 ms | 1,100 ms | < 3,000 ms | **RAPID CLIENT GENERATION** |
| **Production Vite Build** | 1.98 s | 2.50 s | < 10.00 s | **HIGHLY EFFICIENT** |

## 2. Asset & Memory Footprint

- **Core Application JS:** 1,279 kB (Gzipped: ~395 kB)  

- **KaTeX Math Engine + Fonts:** ~258 kB JS + Woff2 font files  

- **Mermaid Diagram Parser:** Dynamically chunked and lazy-loaded on diagram render  

- **Downloaded PDF Output:** Average 20–25 KB per formatted document  
