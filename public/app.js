const form = document.getElementById("form");
const drop = document.getElementById("drop");
const fileInput = document.getElementById("fileInput");
const preview = document.getElementById("preview");
const outputFormat = document.getElementById("outputFormat");

const resizeChk = document.getElementById("resizeChk");
const maxWidth = document.getElementById("maxWidth");
const maxHeight = document.getElementById("maxHeight");
const lossless = document.getElementById("lossless");
const quality = document.getElementById("quality");
const qVal = document.getElementById("qVal");
const targetChk = document.getElementById("targetChk");
const targetKb = document.getElementById("targetKb");
const strip = document.getElementById("strip");
const minSize = document.getElementById("minSize");
const smartSubsample = document.getElementById("smartSubsample");
const btn = document.getElementById("btn");
const statusEl = document.getElementById("status");
const summaryEl = document.getElementById("summary");

qVal.textContent = quality.value;

quality.addEventListener("input", () => {
    qVal.textContent = quality.value;
});

resizeChk.addEventListener("change", () => {
    const en = resizeChk.checked;
    maxWidth.disabled = !en;
    maxHeight.disabled = !en;
});

targetChk.addEventListener("change", () => {
    targetKb.disabled = !targetChk.checked;
});

;["dragenter", "dragover"].forEach(ev =>
    drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add("hover"); })
);
;["dragleave", "drop"].forEach(ev =>
    drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove("hover"); })
);
drop.addEventListener("drop", e => {
    if (e.dataTransfer?.files?.length) {
        fileInput.files = e.dataTransfer.files;
        renderPreview();
    }
});

fileInput.addEventListener("change", renderPreview);

function fmtBytes(b) {
    if (b < 1024) return `${b} B`;
    if (b < 1024*1024) return `${(b/1024).toFixed(1)} KB`;
    return `${(b/1024/1024).toFixed(2)} MB`;
}

async function getImageSize(file) {
    return new Promise((resolve) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            resolve({ w: img.naturalWidth, h: img.naturalHeight });
            URL.revokeObjectURL(url);
        };
        img.onerror = () => {
            resolve({ w: "-", h: "-" });
            URL.revokeObjectURL(url);
        };
        img.src = url;
    });
}

async function renderPreview() {
    const files = Array.from(fileInput.files || []);
    preview.innerHTML = "";
    if (!files.length) { preview.hidden = true; summaryEl.textContent = ""; return; }
    preview.hidden = false;

    let total = 0;
    for (const f of files) {
        total += f.size;
        const { w, h } = await getImageSize(f);
        const url = URL.createObjectURL(f);
        const card = document.createElement("div");
        card.className = "thumb";
        card.innerHTML = `
      <img src="${url}" alt="">
      <div class="meta">
        <div class="name" title="${f.name}">${f.name}</div>
        <div class="dim">${w}×${h}</div>
        <div class="size">${fmtBytes(f.size)}</div>
      </div>
    `;
        preview.appendChild(card);
    }

    summaryEl.textContent = `Файлов: ${files.length} • Суммарно: ${fmtBytes(total)}`;
}

form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!fileInput.files?.length) {
        alert("Выбери хотя бы один файл");
        return;
    }

    btn.disabled = true;
    statusEl.textContent = "Обработка...";

    const fd = new FormData();
    for (const f of fileInput.files) fd.append("files", f);

    fd.append("outputFormat", outputFormat.value);
    fd.append("lossless", lossless.checked);
    fd.append("quality", quality.value);
    fd.append("stripMetadata", strip.checked);
    fd.append("minSize", minSize.checked);
    fd.append("smartSubsample", smartSubsample.checked);

    if (resizeChk.checked) {
        if (maxWidth.value) fd.append("maxWidth", maxWidth.value);
        if (maxHeight.value) fd.append("maxHeight", maxHeight.value);
    }
    if (targetChk.checked && targetKb.value) {
        fd.append("targetKb", targetKb.value);
    }

    try {
        const resp = await fetch("/convert", { method: "POST", body: fd });
        if (!resp.ok) throw new Error("Server error");
        const blob = await resp.blob();

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "converted_images.zip";
        a.click();
        URL.revokeObjectURL(url);
        statusEl.textContent = "Готово ✔";
    } catch (err) {
        console.error(err);
        statusEl.textContent = "Ошибка :(";
    } finally {
        btn.disabled = false;
    }
});
