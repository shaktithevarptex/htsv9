import { USA_ENGINE } from "./countries/usa/engine.js";
import { COUNTRY_CODE_MAP } from "./countries/usa/countryCodes.js";
import {COPY_SVG,CHECK_SVG,ICON_PLUS,ICON_MINUS} from "./constants/icons.js";
import { CBP_APPAREL_PDF } from "./constants/config.js";
import { FABRIC_CLASSIFICATION_HTML } from "./constants/fabricRules.js";
import {MAIN_CATEGORY_MAP,CATEGORY_KEYWORDS,categoryDescriptions} from "./constants/categories.js";
import {GENDER_TERMS,MATERIAL_NEUTRAL_CATEGORIES,GENDER_NEUTRAL_CATEGORIES} from "./constants/genderRules.js";
import { CATEGORY_ALERT_RULES } from "./constants/alerts.js";
import {SINGLE_NODE_STRONG_CATEGORIES,SCOPE_CATEGORIES,CATEGORY_SYNONYMS,CATEGORY_EXCLUSIONS} from "./constants/searchRules.js";
import { appState, selectedFilters } from "./state/appState.js";
import {initCategoryMenu,buildCategoryMenu,closeAllCategoryMenus} from "./ui/categoryMenu.js";
import {getFilterData,getFilterLabel,toggleFilterMenu,buildFilterMenu,selectFilterItem,initializeFilterMenus} from "./filters/filterEngine.js";
import { initCountryMenu, buildCountriesFilter } from "./ui/countryMenu.js";
import {initHTSEngine,searchHTSByFilters,normalizeText,getFullDescription,getGenderFromLeafAndParent,findParentWithRate,getRateLabel,escapeRegExp,getHierarchyPath} from "./engine/htsEngine.js";
import {initResultsRenderer,getDirectChildren,highlightText,highlightInheritedParts,renderHTSHierarchy,showDetails,displayResults} from "./engine/resultsRenderer.js";
import {initAppUI,showStatus,checkAdminMode,initializeCountries,loadFlatFile} from "./ui/appUI.js";
import { resetAllFilters, toggleHighlight, clearResults } from "./ui/interactions.js";
import {enforceMaterialNeutralUI,enforceGenderNeutralUI,handleAccessoriesGenderRule} from "./ui/filterRules.js";
import {initDOMEvents,setupCategoryTrigger,setupFilterTriggers,setupGlobalClickCloser} from "./ui/domEvents.js";
    
    const COUNTRY_ENGINE = USA_ENGINE;

    initAppUI(COUNTRY_ENGINE);


    const FILTER_DATA = getFilterData(COUNTRY_ENGINE, {
        closeLockedInfoTooltip,
        attemptAutoSearch,
        searchHTSByFilters,
        enforceMaterialNeutralUI,
        closeAllCategoryMenus,
        buildCategoryMenu,
        buildCountriesFilter
      });

      initCategoryMenu({
        enforceGenderNeutralUI,
        enforceMaterialNeutralUI,
        searchHTSByFilters,
        buildFilterMenu,
        handleAccessoriesGenderRule,
        normalizeText
      });

      initCountryMenu({
        selectFilterItem
      });

      initHTSEngine(COUNTRY_ENGINE, {
        displayResults,
        clearResults
      });

      initResultsRenderer(COUNTRY_ENGINE);

      
    // Inject fabric info into tooltip container when present
        try {
                const fabricTip = document.getElementById('fabricInfoTooltip');
                if (fabricTip) fabricTip.innerHTML = FABRIC_CLASSIFICATION_HTML;
        } catch (e) { /* ignore during load */ }


        // ============ FILTER MENU FUNCTIONS ============

        selectedFilters.gender = 'All';
        selectedFilters.material = 'All';
        selectedFilters.feature = "All";

        function attemptAutoSearch() {
            searchHTSByFilters();
        }

        function getActiveCategoryAlert() {
            if (!selectedFilters.category) return null;

            const normalizedCategory = normalizeText(selectedFilters.category);

            for (const rule of Object.values(CATEGORY_ALERT_RULES)) {
                const hasExactMatch = rule.keywords.some(keyword =>
                    normalizeText(keyword) === normalizedCategory
                );

                if (hasExactMatch) {
                    return rule;
                }
            }
            return null;
        }


            function closeLockedInfoTooltip() {
                if (appState.lockedInfoIcon) {
                    appState.lockedInfoIcon.classList.remove("open", "active");
                    appState.lockedInfoIcon = null;
                    appState.openInfoIcon = null;
                }
            }
        
                window.copyHTSCode = function (code, btn) {
                navigator.clipboard.writeText(code).then(() => {
                    btn.innerHTML = CHECK_SVG;
                    setTimeout(() => {
                        btn.innerHTML = COPY_SVG;
                    }, 1200);
                }).catch(err => {
                    console.error("Clipboard copy failed:", err);
                });
            };

                function showCopied(btn) {
                btn.innerHTML = CHECK_SVG;
                btn.disabled = true;

                setTimeout(() => {
                    btn.innerHTML = COPY_SVG;
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
            

                function importJSON() {
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
                                    showStatus(`Successfully imported ${files.length} file(s). Total records: ${appState.masterData.length}`);
                                    fileInput.value = '';
                                }
                            } catch (error) {
                                showStatus('Error parsing JSON file: ' + file.name, true);
                            }
                        };
                        reader.readAsText(file);
                    });
                }

                function closeModal() {
                    document.getElementById('detailModal').style.display = 'none';
                }

                window.onclick = function (event) {
                    const modal = document.getElementById('detailModal');
                    if (event.target === modal) {
                        modal.style.display = 'none';
                    }
                };

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

// Position an info tooltip intelligently: prefer placing adjacent to the icon
// if there is room, otherwise clamp to viewport (right/left/center).
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

    const rule = getActiveCategoryAlert();
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

                document.querySelectorAll(".info-tooltip").forEach(tip => {
                    tip.addEventListener("click", e => {
                        e.stopPropagation();
                    });
                });

                
                window.filterFabricRules = function (input) {
                    const query = input.value.toLowerCase();
                    const list = input.closest('.fabric-classification')
                                     .querySelectorAll('.fabric-rule-list li');
                
                    list.forEach(li => {
                        const text = li.textContent.toLowerCase();
                        li.style.display = text.includes(query) ? '' : 'none';
                    });
                };
                
                window.toggleOtherResults = function () {
                    const content = document.getElementById('otherResultsContent');
                    const toggle = document.querySelector('.other-results-toggle');
                
                    if (!content || !toggle) return;
                
                    if (content.classList.contains('show')) {
                        content.classList.remove('show');
                        toggle.classList.remove('expanded');
                    } else {
                        content.classList.add('show');
                        toggle.classList.add('expanded');
                    }
                };
            

// 🌍 expose UI functions for HTML onclick handlers
window.resetAllFilters = resetAllFilters;
window.toggleHighlight = toggleHighlight;
window.toggleInfo = toggleInfo;
window.showInfoOnHover = showInfoOnHover;
window.hideInfoOnHover = hideInfoOnHover;
window.importJSON = importJSON;
window.closeModal = closeModal;
window.showDetails = showDetails;


selectedFilters.importingCountry = COUNTRY_ENGINE.getImportingCountry();
initDOMEvents({
    closeLockedInfoTooltip
  });
  
    setupCategoryTrigger();
    setupFilterTriggers();
    setupGlobalClickCloser();
  
    initializeCountries();
    buildCategoryMenu();
    initializeFilterMenus();
    loadFlatFile();
    checkAdminMode();

