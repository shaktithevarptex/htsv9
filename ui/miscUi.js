import { showStatus } from "./appUI.js";
import { appState } from "../state/appState.js";

export function initMiscUI() {

    // ===== COPY HTS CODE =====
    window.copyHTSCode = function (code, btn) {
        navigator.clipboard.writeText(code).then(() => {
            btn.innerHTML = "✔";
            setTimeout(() => {
                btn.innerHTML = "📋";
            }, 1200);
        }).catch(err => {
            console.error("Clipboard copy failed:", err);
        });
    };

    function showCopied(btn) {
        btn.innerHTML = "✔";
        btn.disabled = true;
        setTimeout(() => {
            btn.innerHTML = "📋";
            btn.disabled = false;
        }, 1200);
    }

    function fallbackCopy(text, btn) {
        const ta = document.createElement("textarea");
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        showCopied(btn);
    }

    document.addEventListener("click", e => {
        const btn = e.target.closest(".copy-hts-btn");
        if (!btn) return;

        e.preventDefault();
        e.stopPropagation();

        const code = btn.dataset.hts;

        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(code)
                .then(() => showCopied(btn))
                .catch(() => fallbackCopy(code, btn));
        } else {
            fallbackCopy(code, btn);
        }
    });

    // ===== IMPORT JSON =====
    window.importJSON = function () {
        const fileInput = document.getElementById('jsonFileInput');
        const files = fileInput.files;

        if (files.length === 0) {
            showStatus('Please select at least one JSON file', true);
            return;
        }

        let filesProcessed = 0;
        const newData = [];

        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onload = function (e) {
                try {
                    const jsonData = JSON.parse(e.target.result);
                    newData.push(...jsonData);
                    filesProcessed++;

                    if (filesProcessed === files.length) {
                        appState.masterData = [...appState.masterData, ...newData];
                        document.getElementById("totalResults").innerText = appState.masterData.length;
                        showStatus(`Imported ${files.length} file(s) successfully`);
                        fileInput.value = '';
                    }
                } catch (error) {
                    showStatus('Error parsing JSON file: ' + file.name, true);
                }
            };
            reader.readAsText(file);
        });
    };

    // ===== MODAL CLOSE =====
    window.closeModal = function () {
        document.getElementById('detailModal').style.display = 'none';
    };

    window.onclick = function (event) {
        const modal = document.getElementById('detailModal');
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };

}
