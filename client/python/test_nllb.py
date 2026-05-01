from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
import torch
from pathlib import Path

repo = "/media/yaroslav/DATA/nllb-3.3B"

tok = AutoTokenizer.from_pretrained(repo, use_fast=True)
mdl = AutoModelForSeq2SeqLM.from_pretrained(repo).to("cuda").eval()


def get_lang_id(tokenizer, code: str) -> int:
    """
    Возвращает id токена для языка (eng_Latn / ita_Latn и т.д.).
    1) Пытается взять tokenizer.lang_code_to_id
    2) Ищет токен в vocab по подстроке code
    """
    mapping = getattr(tokenizer, "lang_code_to_id", None)
    if isinstance(mapping, dict) and code in mapping:
        return int(mapping[code])

    vocab = tokenizer.get_vocab()

    # кандидаты, где встречается code
    candidates = [tok for tok in vocab.keys() if code in tok]

    # сначала попробуем самые типичные формы
    preferred = [
        f"__{code}__",
        f"<2{code}>",
        code,
    ]
    for p in preferred:
        if p in vocab:
            return int(vocab[p])

    if not candidates:
        raise RuntimeError(f"Не смог найти токен в vocab для языка {code!r}")

    # если несколько — берём самый короткий (обычно это как раз спец-токен языка)
    best = sorted(candidates, key=len)[0]
    print(f"[debug] picked language token: {best!r} -> {vocab[best]}")
    return int(vocab[best])


src_code = "eng_Latn"
tgt_code = "ita_Latn"

if hasattr(tok, "src_lang"):
    tok.src_lang = src_code

forced_bos_id = get_lang_id(tok, tgt_code)

text = "Hello, how are you today?"
enc = tok(text, return_tensors="pt").to("cuda")

with torch.inference_mode():
    gen = mdl.generate(
        **enc,
        max_new_tokens=64,
        do_sample=False,
        num_beams=1,
        forced_bos_token_id=forced_bos_id,
    )

print(tok.batch_decode(gen, skip_special_tokens=True))
