#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import sys
import json
import argparse
from typing import Any, Dict, List, Tuple, Optional
from pathlib import Path

# ── Глушим проблемные переменные окружения и включаем offline режим HF ─────────
for k in (
        "HF_HUB_HEADERS",
        "HUGGINGFACE_HEADERS",
        "HUGGINGFACEHUB_HEADERS",
        "HF_TOKEN",
        "HUGGINGFACE_TOKEN",
):
    if os.environ.get(k):
        print(f"[warn] ignoring env {k}", flush=True)
        os.environ.pop(k, None)

os.environ["HF_HUB_OFFLINE"] = "1"
os.environ["TRANSFORMERS_OFFLINE"] = "1"
os.environ.setdefault("PYTORCH_CUDA_ALLOC_CONF", "expandable_segments:True")

from tqdm import tqdm
from rapidfuzz import fuzz
import regex as rx
import torch
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM

# ===== (опционально) автоопределение языка =====
try:
    from fasttext_langdetect import detect as fast_detect
except Exception:
    fast_detect = None

# --- частые языки -> коды NLLB ---
LANG2NLLB = {
    "en": "eng_Latn", "de": "deu_Latn", "fr": "fra_Latn", "it": "ita_Latn",
    "es": "spa_Latn", "pt": "por_Latn", "pl": "pol_Latn", "tr": "tur_Latn",
    "uk": "ukr_Cyrl", "ru": "rus_Cyrl",
    "nl": "nld_Latn", "sv": "swe_Latn", "no": "nob_Latn", "fi": "fin_Latn",
    "ro": "ron_Latn", "cs": "ces_Latn", "sk": "slk_Latn", "hu": "hun_Latn",
    "zh": "zho_Hans", "ja": "jpn_Jpan", "ko": "kor_Hang",
    "ar": "arb_Arab", "he": "heb_Hebr",
}

# --- защита плейсхолдеров, URL и т.п. ---
PATTERNS = {
    "curlies": rx.compile(r"(\{\{.*?\}\}|\{[^\s{}]+\})"),
    "printf":  rx.compile(r"(%[\d\$\.\-\+\*]*[sdfoxecu])"),
    "url":     rx.compile(r"(https?://[^\s]+)"),
    "email":   rx.compile(r"[\w\.\-]+@[\w\.\-]+\.\w+"),
    "hex":     rx.compile(r"\b0x[0-9a-fA-F]+\b"),
    "num":     rx.compile(r"\b\d[\d\s\.,]*\b"),
}

def protect_tokens(s: str) -> Tuple[str, List[str]]:
    tokens = []
    def repl(m):
        tokens.append(m.group(0))
        return f"[[T{len(tokens)-1}]]"
    for pat in PATTERNS.values():
        s = pat.sub(repl, s)
    return s, tokens

def restore_tokens(s: str, tokens: List[str]) -> str:
    for i, val in enumerate(tokens):
        s = s.replace(f"[[T{i}]]", val)
    return s

def normalize_whitespace(src: str, dst: str) -> str:
    lead = rx.match(r"^\s*", src).group(0)
    tail = rx.search(r"\s*$", src).group(0)
    core = dst.strip()
    return f"{lead}{core}{tail}"

def collect_strings(obj: Any, bucket: List[str]):
    if isinstance(obj, dict):
        for v in obj.values():
            collect_strings(v, bucket)
    elif isinstance(obj, list):
        for v in obj:
            collect_strings(v, bucket)
    elif isinstance(obj, str):
        bucket.append(obj)

def rebuild(obj: Any, mapping: Dict[str, str]) -> Any:
    if isinstance(obj, dict):
        return {k: rebuild(v, mapping) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [rebuild(v, mapping) for v in obj]
    elif isinstance(obj, str):
        return mapping.get(obj, obj)
    return obj

def autodetect_lang(examples: List[str]) -> str:
    if not fast_detect or not examples:
        return "en"
    sample = [s for s in examples if s and not s.isspace()]
    sample = sample[:100]
    if not sample:
        return "en"
    text = "\n".join(sample)
    try:
        lang = fast_detect(text)
        return lang[:2]
    except Exception:
        return "en"

# ──────────────────────────────
# CUDA QoL
# ──────────────────────────────
torch.backends.cuda.matmul.allow_tf32 = True
try:
    torch.set_grad_enabled(False)
except Exception:
    pass
try:
    torch.set_float32_matmul_precision("high")
except Exception:
    pass

# ──────────────────────────────
# Помощники для локального кэша HF
# ──────────────────────────────
HF_CACHE = Path.home() / ".cache" / "huggingface" / "hub"

SIZE2MODEL = {
    "600M": "facebook--nllb-200-distilled-600M",
    "1.3B": "facebook--nllb-200-1.3B",
    "3.3B": "facebook--nllb-200-3.3B",
}

def _latest_snapshot_dir(model_slug: str) -> Optional[Path]:
    base = HF_CACHE / f"models--{model_slug}" / "snapshots"
    if not base.is_dir():
        return None
    # берём самый свежий хэш (по времени модификации)
    snaps = sorted((p for p in base.iterdir() if p.is_dir()), key=lambda p: p.stat().st_mtime, reverse=True)
    return snaps[0] if snaps else None

def resolve_local_repo(model_size: str) -> Path:
    """
    Возвращает путь к локальной папке модели.
    Приоритет:
      1) ENV (NLLB_600M_DIR / NLLB_13B_DIR / NLLB_33B_DIR), если указаны
      2) HF cache snapshots (как было раньше)
    Также нормализует значение размера (на случай '3.3B,3.3B').
    """
    # Нормализация входа, чтобы '3.3B,3.3B' -> '3.3B'
    ms = (model_size or "").replace(",", " ").split()[0].strip()
    if ms not in SIZE2MODEL:
        ms = "1.3B"

    env_key = {
        "600M": "NLLB_600M_DIR",
        "1.3B": "NLLB_13B_DIR",
        "3.3B": "NLLB_33B_DIR",
    }[ms]

    # 1) Пробуем ENV указатель на директорию со снапшотом
    env_path = os.getenv(env_key)
    if env_path:
        p = Path(env_path)
        if p.is_dir():
            # sanity-check
            for n in ["config.json", "tokenizer.json", "tokenizer_config.json"]:
                if not (p / n).exists():
                    print(f"[err] Missing file in ENV repo ({env_key}): {n}", file=sys.stderr)
                    sys.exit(1)
            return p
        else:
            print(f"[err] {env_key} is set but not a directory: {env_path}", file=sys.stderr)

    # 2) Фоллбек — берём самый свежий снапшот из HF cache
    model_slug = SIZE2MODEL[ms]
    snap = _latest_snapshot_dir(model_slug)
    if not snap:
        print(f"[err] Local snapshot not found for {ms}. Expected under: {HF_CACHE}/models--{model_slug}/snapshots/<hash>", file=sys.stderr)
        print("      Download the model first (one time) or run once without offline to populate cache.", file=sys.stderr)
        sys.exit(1)

    for n in ["config.json", "tokenizer.json", "tokenizer_config.json"]:
        if not (snap / n).exists():
            print(f"[err] Missing file in snapshot: {n}", file=sys.stderr)
            sys.exit(1)

    return snap


# ──────────────────────────────
# Загрузка модели ЦЕЛИКОМ на GPU (без походов в сеть)
# ──────────────────────────────
def load_nllb(model_size: str = "1.3B") -> tuple:
    """
    Загружает NLLB-200 (600M / 1.3B / 3.3B) из локального репо, двигает на CUDA
    и переводит веса в FP16. Поддерживает как *.safetensors, так и шардованные *.bin.
    """
    if not torch.cuda.is_available():
        print("[err] CUDA not available", file=sys.stderr)
        sys.exit(1)

    repo_path = resolve_local_repo(model_size)  # локальная папка с файлами модели
    print(f"[nllb] using local repo: {repo_path}", flush=True)

    # --- Токенайзер ---
    tok = AutoTokenizer.from_pretrained(str(repo_path), use_fast=True)
    if tok.pad_token_id is None and tok.eos_token_id is not None:
        tok.pad_token = tok.eos_token

    # НИКАКИХ проверок lang_code_to_id здесь больше нет — этим занимается get_lang_id

    # --- Определяем, что есть в папке: *.safetensors или *.bin
    from pathlib import Path
    has_safetensors = any(p.suffix == ".safetensors" for p in Path(repo_path).glob("*.safetensors"))

    kwargs = dict(
        low_cpu_mem_usage=False,
        device_map=None,
        trust_remote_code=False,
    )

    if has_safetensors:
        kwargs["use_safetensors"] = True
        print("[nllb] found safetensors — loading with use_safetensors=True", flush=True)
    else:
        from packaging.version import parse as vparse
        if vparse(torch.__version__.split("+")[0]) < vparse("2.6.0"):
            print(
                f"[err] torch >= 2.6 is required to safely load .bin (found {torch.__version__})",
                file=sys.stderr,
            )
            sys.exit(1)
        print("[nllb] no safetensors found — loading .bin shards (torch >= 2.6 detected)", flush=True)

    print("[nllb] loading on CPU (FP32)", flush=True)
    mdl = AutoModelForSeq2SeqLM.from_pretrained(str(repo_path), **kwargs)

    print("[nllb] moving to cuda:0", flush=True)
    mdl.to("cuda:0")

    print("[nllb] converting weights to FP16 on GPU", flush=True)
    try:
        mdl.half()
    except Exception as e:
        print(f"[warn] .half() failed: {e}", file=sys.stderr)

    mdl.eval()
    return tok, mdl


def get_lang_id(tok, code: str) -> int:
    """
    Возвращает id токена для языка (eng_Latn, ita_Latn и т.п.).

    1) Пытается взять tok.lang_code_to_id[code], если есть.
    2) Если нет — ищет токен в vocab по подстроке code
       (поддерживает варианты вида "__ita_Latn__", "<2ita_Latn>", "ita_Latn").
    """
    mapping = getattr(tok, "lang_code_to_id", None)
    if isinstance(mapping, dict) and code in mapping:
        return int(mapping[code])

    vocab = tok.get_vocab()

    # сначала пробуем самые типичные формы
    preferred = [
        f"__{code}__",
        f"<2{code}>",
        code,
    ]
    for p in preferred:
        if p in vocab:
            return int(vocab[p])

    # иначе берём первый подходящий токен, где встречается подстрока кода
    candidates = [t for t in vocab.keys() if code in t]
    if not candidates:
        raise RuntimeError(f"Cannot map language code {code!r} to token id")

    best = sorted(candidates, key=len)[0]
    print(f"[nllb] picked language token for {code}: {best!r} -> {vocab[best]}", file=sys.stderr)
    return int(vocab[best])

# ──────────────────────────────
# Перевод батчами (GPU only)
# ──────────────────────────────
def batch_translate(
        texts: List[str],
        tok,
        mdl,
        src_code: str,
        tgt_code: str,
        batch_size: int = 8,
        max_len: int = 512,
) -> List[str]:
    if not texts:
        return []

    if hasattr(tok, "src_lang"):
        tok.src_lang = src_code

    forced_bos_id = get_lang_id(tok, tgt_code)

    pad_id = tok.pad_token_id if tok.pad_token_id is not None else tok.eos_token_id
    eos_id = tok.eos_token_id
    pad_id = int(pad_id)
    eos_id = int(eos_id)

    results: List[str] = []
    mdl.eval()
    with torch.inference_mode():
        for i in range(0, len(texts), batch_size):
            chunk = texts[i: i + batch_size]
            enc = tok(
                chunk,
                return_tensors="pt",
                padding=True,
                truncation=True,
                max_length=max_len,
            )
            enc = {k: v.to("cuda") for k, v in enc.items()}

            gen = mdl.generate(
                **enc,
                max_new_tokens=max_len,
                do_sample=False,
                num_beams=1,
                forced_bos_token_id=forced_bos_id,
                pad_token_id=pad_id,
                eos_token_id=eos_id,
            )
            out = tok.batch_decode(gen, skip_special_tokens=True)
            results.extend(out)

    return results

# ──────────────────────────────
# main
# ──────────────────────────────
def main():
    ap = argparse.ArgumentParser(description="Translate JSON values with NLLB-200 (GPU-only, local cache).")
    ap.add_argument("--in", dest="inp", required=True, help="input JSON path")
    ap.add_argument("--out", dest="out", required=True, help="output JSON path")
    ap.add_argument("--src", dest="src", default="", help="source lang (empty = autodetect)")
    ap.add_argument("--tgt", dest="tgt", required=True, help="target lang")
    ap.add_argument("--size", dest="size", default="1.3B", help='NLLB size: "600M" | "1.3B" | "3.3B"')
    ap.add_argument("--max-len", dest="max_len", type=int, default=512, help="max tokens per segment")
    ap.add_argument("--batch", dest="batch", type=int, default=16, help="batch size (lower if VRAM tight)")

    args, unknown = ap.parse_known_args()
    if unknown:
        print(f"[warn] unknown args ignored: {unknown}", file=sys.stderr)

    with open(args.inp, "r", encoding="utf-8") as f:
        data = json.load(f)

    strings: List[str] = []
    collect_strings(data, strings)

    src_lang = args.src.strip().lower()
    if not src_lang:
        sample_for_detect = [s for s in strings if s and not s.isspace()][:500]
        src_lang = autodetect_lang(sample_for_detect)
        print(f"[info] autodetected source lang: {src_lang}")

    tgt_lang = args.tgt.strip().lower()

    if src_lang not in LANG2NLLB or tgt_lang not in LANG2NLLB:
        print(f"[err] map language codes first. Supported: {list(LANG2NLLB.keys())}", file=sys.stderr)
        sys.exit(1)
    src_code = LANG2NLLB[src_lang]
    tgt_code = LANG2NLLB[tgt_lang]

    # уникальные строки
    uniq: List[str] = []
    for s in strings:
        if s not in uniq:
            uniq.append(s)

    # защита токенов
    protected_src: List[str] = []
    token_bags: List[List[str]] = []
    for s in uniq:
        ps, bag = protect_tokens(s)
        protected_src.append(ps)
        token_bags.append(bag)

    # грузим модель из локального снапшота
    tok, mdl = load_nllb(args.size)

    # перевод
    translated = batch_translate(
        protected_src, tok, mdl, src_code, tgt_code,
        batch_size=args.batch,
        max_len=args.max_len
    )

    # восстановление токенов и сборка
    mapping: Dict[str, str] = {}
    for orig, tmp, bag, tr in zip(uniq, protected_src, token_bags, translated):
        restored = restore_tokens(tr, bag)
        final = normalize_whitespace(orig, restored)
        mapping[orig] = final

    out_data = rebuild(data, mapping)

    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(out_data, f, ensure_ascii=False, indent=2)

    print(f"[done] written: {args.out}")

if __name__ == "__main__":
    main()
