import { appState, selectedFilters } from "../state/appState.js";

let getActiveCategoryAlertFn = null;


let alertTooltip;

function showCategoryAlert(e, message) {
    if (!alertTooltip) {
        alertTooltip = document.createElement("div");
        alertTooltip.className = "category-alert-tooltip";
        document.body.appendChild(alertTooltip);
    }

    alertTooltip.innerHTML = message;
    alertTooltip.style.left = `${e.pageX + 12}px`;
    alertTooltip.style.top = `${e.pageY + 12}px`;

    requestAnimationFrame(() => {
        alertTooltip.classList.add("show");
    });
}

function hideCategoryAlert() {
    if (alertTooltip) {
        alertTooltip.classList.remove("show");
    }
}

function positionInfoTooltip(ic) {
    const tooltip = ic.querySelector('.info-tooltip');
    if (!tooltip) return;

    // temporarily disable pointerEvents while measuring
    tooltip.style.pointerEvents = 'none';

    requestAnimationFrame(() => {
        const iconRect = ic.getBoundingClientRect();
        const tipRect = tooltip.getBoundingClientRect();
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const margin = 8;

        // Desired inline placement: align left edge of tooltip with icon left
        let inlineLeft = Math.round(iconRect.left);
        let inlineTop = Math.round(iconRect.bottom + 6);

        const fitsInlineHoriz = inlineLeft >= margin && (inlineLeft + tipRect.width + margin <= vw);
        const fitsInlineVert = (inlineTop + tipRect.height + margin <= vh);

        let left, top;

        if (fitsInlineHoriz && fitsInlineVert) {
            // Enough space: render adjacent (like before)
            left = inlineLeft;
            top = inlineTop;
        } else {
            // Fallback: prefer placing to the right of the icon
            left = iconRect.right + margin;
            if (left + tipRect.width + margin > vw) {
                // try left side
                if (iconRect.left - margin - tipRect.width > margin) {
                    left = iconRect.left - margin - tipRect.width;
                } else {
                    // center over icon horizontally within viewport
                    left = Math.max(margin, Math.min(vw - tipRect.width - margin, Math.round(iconRect.left + (iconRect.width / 2) - (tipRect.width / 2))));
                }
            }

            // Vertical placement: prefer below
            top = iconRect.bottom + 6;
            if (top + tipRect.height + margin > vh) {
                if (iconRect.top - margin - tipRect.height > margin) {
                    top = iconRect.top - margin - tipRect.height;
                } else {
                    top = Math.max(margin, vh - tipRect.height - margin);
                }
            }
        }

        tooltip.style.position = 'fixed';
        tooltip.style.left = `${Math.round(left)}px`;
        tooltip.style.top = `${Math.round(top)}px`;
        tooltip.style.pointerEvents = '';
    });
}

function toggleInfo(icon) {
    const isLocked = appState.lockedInfoIcon === icon;

    // Close any previously locked info
    if (appState.lockedInfoIcon && appState.lockedInfoIcon !== icon) {
        appState.lockedInfoIcon.classList.remove("open", "active");
    }

    if (isLocked) {
        // Unlock & close
        icon.classList.remove("open", "active");
        appState.lockedInfoIcon = null;
        appState.openInfoIcon = null;
        return;
    }

    // Lock this one
    icon.classList.add("open", "active");
    appState.lockedInfoIcon = icon;
    appState.openInfoIcon = icon;

    positionInfoTooltip(icon);
}

function showInfoOnHover(icon) {
    if (appState.lockedInfoIcon) return; // ❌ don’t interfere with click-locked

    icon.classList.add("open");
    appState.openInfoIcon = icon;
    positionInfoTooltip(icon);
}

function hideInfoOnHover(icon) {
    if (appState.lockedInfoIcon === icon) return; // ❌ keep open if locked

    icon.classList.remove("open");
    appState.openInfoIcon = null;
}

document.addEventListener('mouseover', e => {
    const icon = e.target.closest('.info-icon');
    if (!icon) return;
    const tooltip = icon.querySelector('.info-tooltip');
    if (!tooltip) return;
    // Only reposition when tooltip is visible — either via active class or hover capability
    if (icon.classList.contains('active') || window.matchMedia('(hover: hover)').matches) {
        requestAnimationFrame(() => positionInfoTooltip(icon));
    }
});

// Also reposition on scroll because fixed placement depends on viewport
window.addEventListener("scroll", () => {
    document.querySelectorAll(".info-icon.open").forEach(icon => {
        positionInfoTooltip(icon);
    });
}, { passive: true });



document.addEventListener("mouseover", e => {
    const row = e.target.closest(".hts-row");
    if (!row) return;

    const rule = getActiveCategoryAlertFn();
    if (!rule) return;

    const rowText = row.dataset.description || "";

    const matched = rule.keywords.some(k =>
        new RegExp(`\\b${k}\\b`, "i").test(rowText)
    );

    if (matched) {
        showCategoryAlert(e, rule.message);
    }
});

document.addEventListener("mousemove", e => {
    if (alertTooltip?.classList.contains("show")) {
        alertTooltip.style.left = `${e.pageX + 12}px`;
        alertTooltip.style.top = `${e.pageY + 12}px`;
    }
});

document.addEventListener("mouseout", e => {
    if (e.target.closest(".hts-row")) {
        hideCategoryAlert();
    }
});

export function initTooltips(getActiveCategoryAlert) {
    getActiveCategoryAlertFn = getActiveCategoryAlert;
}

export function bindInfoIconClicks() {
    // Event delegation — works for dynamically injected tooltips (fabric)
    document.addEventListener("click", (e) => {
        const icon = e.target.closest(".info-icon");
        if (!icon) return;

        // Ignore clicks inside tooltip content
        if (e.target.closest(".info-tooltip")) return;

        e.stopPropagation();
        toggleInfo(icon);
    });
}


export { toggleInfo, showInfoOnHover, hideInfoOnHover };

