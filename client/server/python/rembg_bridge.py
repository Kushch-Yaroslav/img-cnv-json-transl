#!/usr/bin/env python3
import os, sys, argparse
from rembg import remove, new_session  # <- важно: импортируем new_session

def pick_providers(session_env: str | None):
    # выбираем провайдеры для ORT
    # REMBG_SESSION=onnxruntime -> CUDA (и fallback CPU)
    # REMBG_SESSION=cpu         -> только CPU
    # иначе None -> авто (как настроит ORT)
    if not session_env:
        return None
    s = session_env.strip().lower()
    if s in ("onnxruntime", "cuda", "gpu"):
        return ["CUDAExecutionProvider", "CPUExecutionProvider"]
    if s in ("cpu",):
        return ["CPUExecutionProvider"]
    return None

def main():
    ap = argparse.ArgumentParser(add_help=False)
    ap.add_argument("-m", "--model", default=None)  # 'u2net' | 'u2netp' | 'isnet-general' | ...
    ap.add_argument("cmd", nargs="?", default="i")
    ap.add_argument("inp", nargs="?", default="-")
    ap.add_argument("out", nargs="?", default="-")
    args, _ = ap.parse_known_args()

    if not (args.cmd == "i" and args.inp == "-" and args.out == "-"):
        print("Only 'i - -' is supported", file=sys.stderr)
        sys.exit(2)

    data = sys.stdin.buffer.read()
    session_env = os.getenv("REMBG_SESSION")  # 'onnxruntime' | 'cpu' | None
    providers = pick_providers(session_env)

    # выбираем модель: из аргумента или из REMBG_MODEL или по умолчанию
    model = args.model or os.getenv("REMBG_MODEL") or "u2net"

    # создаём объект сессии rembg
    sess = new_session(model, providers=providers)

    out = remove(data, session=sess)
    sys.stdout.buffer.write(out)

if __name__ == "__main__":
    main()
