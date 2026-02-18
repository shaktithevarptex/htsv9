export function showCopied(btn) {
    btn.innerHTML = CHECK_SVG;
    btn.disabled = true;

    setTimeout(() => {
        btn.innerHTML = COPY_SVG;
        btn.disabled = false;
    }, 1200);
}

export function fallbackCopy(text, btn) {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    showCopied(btn);
}

export function closeModal() {
    document.getElementById('detailModal').style.display = 'none';
}

export function registerModalBackdropClose() {
    window.onclick = function (event) {
        const modal = document.getElementById('detailModal');
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };
}