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
  
  
  
    const COUNTRY_ENGINE = USA_ENGINE;

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

            function checkAdminMode() {
                // 🔑 Admin conditions (any one can enable admin)
                const isAdminByURL = new URLSearchParams(window.location.search).get("admin") === "true";
                const isAdminByStorage = localStorage.getItem("hts_admin") === "true";

                const isAdmin = isAdminByURL || isAdminByStorage;

                const adminSection = document.getElementById("adminSection");

                if (isAdmin && adminSection) {
                    adminSection.style.display = "block";
                    console.log("✅ Admin mode enabled");
                } else {
                    if (adminSection) adminSection.style.display = "none";
                    console.log("ℹ️ Admin mode disabled");
                }
            }

            function closeLockedInfoTooltip() {
                if (appState.lockedInfoIcon) {
                    appState.lockedInfoIcon.classList.remove("open", "active");
                    appState.lockedInfoIcon = null;
                    appState.openInfoIcon = null;
                }
            }
        

            const categoryTrigger = document.querySelector(".category-trigger");
            const categoryMenu = document.getElementById("categoryMenu");
            
            categoryTrigger.addEventListener("click", e => {
                e.stopPropagation();
            
                // 🔑 CLOSE ALL FILTER MENUS FIRST
                document.querySelectorAll(".filter-menu.show").forEach(menu => {
                    menu.classList.remove("show");
                });
                appState.openFilterMenu = null;
            
                // Toggle category
                if (appState.categoryMenuOpen) {
                    closeAllCategoryMenus();
                    return;
                }
            
                categoryMenu.style.display = "block";
                appState.categoryMenuOpen = true;
            });
            
            

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

            function enforceMaterialNeutralUI(category) {
                const materialSelect = document.getElementById("materialFilter");
                const materialTrigger = document.getElementById('materialTrigger');
                const materialMenu = document.getElementById('materialMenu');
                const materialNote = document.getElementById("materialNote");

                const isNeutral = MATERIAL_NEUTRAL_CATEGORIES.has(normalizeText(category));

                if (!category) {
                    // No category selected: restore UI to current selection
                    if (materialSelect) {
                        try { materialSelect.disabled = false; } catch(e){}
                    }
                    if (materialTrigger) {
                        materialTrigger.textContent = getFilterLabel('material', selectedFilters.material) + ' ▾';
                    }
                    if (materialMenu) {
                        materialMenu.querySelectorAll('.filter-menu-item.disabled').forEach(i => i.classList.remove('disabled'));
                    }
                    if (materialNote) materialNote.classList.remove('show');
                    return;
                }

                if (isNeutral) {
                    // Force material to All when category is material-neutral
                    selectedFilters.material = 'All';
                    if (materialSelect) {
                        try { materialSelect.value = 'All'; materialSelect.disabled = true; } catch(e){}
                    }
                    if (materialTrigger) materialTrigger.textContent = getFilterLabel('material', selectedFilters.material) + ' ▾';
                    if (materialMenu) {
                        materialMenu.querySelectorAll('.filter-menu-item').forEach(item => {
                            if (!/All/i.test(item.textContent)) item.classList.add('disabled');
                        });
                    }
                    if (materialNote) {
                        materialNote.innerHTML = 'Classified mainly by article type & fiber content, regardless of knit/woven construction';
                        materialNote.classList.add('show');
                    }
                } else {
                    // Not neutral: restore material selection (do not overwrite user's choice)
                    if (materialSelect) {
                        try { materialSelect.disabled = false; } catch(e){}
                    }
                    if (materialTrigger) materialTrigger.textContent = getFilterLabel('material', selectedFilters.material) + ' ▾';
                    if (materialMenu) {
                        materialMenu.querySelectorAll('.filter-menu-item.disabled').forEach(i => i.classList.remove('disabled'));
                    }
                    if (materialNote) materialNote.classList.remove('show');
                }
        }

            function toggleHighlight() {

                if (appState.isResetting) return;
                if (!selectedFilters.category || !selectedFilters.exportingCountry) return;

                appState.highlightEnabled = !appState.highlightEnabled;

                const btn = document.getElementById("toggleHighlightBtn");

                btn.classList.toggle("active", appState.highlightEnabled);
                btn.setAttribute("aria-pressed", appState.highlightEnabled);
                btn.setAttribute(
                    "aria-label",
                    appState.highlightEnabled ? "Disable highlight" : "Enable highlight"
                );

                btn.dataset.tooltip = appState.highlightEnabled
                    ? "Highlight ON"
                    : "Highlight OFF";

                searchHTSByFilters();
                }

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

                function resetDropdownSelection(menuSelector, defaultValue = "All") {
                    const menu = document.querySelector(menuSelector);
                    if (!menu) return;
                
                    const items = menu.children; // 🔑 key fix
                
                    Array.from(items).forEach(item => {
                        item.classList.remove("selected", "active", "checked");
                
                        const value =
                            item.dataset?.value ||
                            item.textContent.trim();
                
                        if (value === defaultValue) {
                            item.classList.add("selected");
                        }
                    });
                }
            
                function resetAllFilters() {
                    appState.isResetting = true; // 🔒 lock everything

                    // 🔄 Reset state
                    selectedFilters.uiMainCategory = '';
                    selectedFilters.category = '';
                    selectedFilters.gender = 'All';
                    selectedFilters.fabric = 'All';
                    selectedFilters.material = 'All';
                    selectedFilters.country = '';
                    selectedFilters.exportingCountry = '';
                    selectedFilters.feature = 'All';

                    // 🔽 Reset filter menu triggers
                    document.getElementById('genderTrigger').textContent = 'All ▾';
                    document.getElementById('fabricTrigger').textContent = 'All ▾';
                    document.getElementById('materialTrigger').textContent = 'All ▾';
                    document.getElementById('featureTrigger').textContent = 'All ▾';
                    document.getElementById('countryTrigger').textContent = 'Select Country ▾';

                    closeAllCategoryMenus();

                    // 🧹 RESET CATEGORY + SUBCATEGORY UI STATES
                    document.querySelectorAll('.category-item')
                        .forEach(item => {
                            item.classList.remove('selected', 'active');
                        });

                    document.querySelectorAll('.submenu-item')
                        .forEach(item => {
                            item.classList.remove('selected');
                        });


                    // ❌ Hide notes
                    document.getElementById("genderNote").style.display = "none";
                    document.getElementById("materialNote").classList.remove("show");

                    // 🔽 Reset category UI
                    document.querySelector('.category-trigger').textContent = 'Select Category ▾';


                    // 🔆 RESET HIGHLIGHT (✅ correct way)
                    appState.highlightEnabled = false;

                    const highlightBtn = document.getElementById("toggleHighlightBtn");
                    highlightBtn.classList.remove("active");
                    highlightBtn.setAttribute("aria-pressed", "false");
                    highlightBtn.setAttribute("aria-label", "Enable highlight");
                    highlightBtn.dataset.tooltip = "Highlight OFF";


                    // ✅ RESET DROPDOWN MENU CHECKS
                    // ✅ RESET DROPDOWN MENU CHECKS
                    resetDropdownSelection("#genderMenu", "All");
                    resetDropdownSelection("#materialMenu", "All");
                    resetDropdownSelection("#fabricMenu", "All");
                    resetDropdownSelection("#featureMenu", "All");
                    resetDropdownSelection("#countryMenu", ""); // 🔥 fixed ID



                    // ❌ Hide category description
                    const infoIcon = document.getElementById("categoryInfoIcon");
                    const tooltip = document.getElementById("categoryInfoTooltip");

                    infoIcon.classList.remove("active");
                    infoIcon.classList.add("disabled");

                    tooltip.innerHTML = "Select a category to see its definition.";

                    document.querySelectorAll(".fabric-search").forEach(input => {
                        input.value = "";
                    });

                    // 🌍 CLEAR COUNTRY DROPDOWN SEARCH (the missing part)
                    const countrySearchInput = document.querySelector("#countryMenu input[type='text']");
                    if (countrySearchInput) {
                        countrySearchInput.value = "";
                        
                        // 🔄 trigger input event so full list shows again
                        countrySearchInput.dispatchEvent(new Event("input"));
                    }


                    // 🔄 RESET FILTERED FABRIC LIST
                    document.querySelectorAll("#fabricInfoTooltip li").forEach(li => {
                        li.style.display = "";
                    });

                    // 🔓 unlock category menu after reset
                    buildCategoryMenu();

                    // 🧹 Clear results
                    clearResults();

                    // 🔓 unlock
                    setTimeout(() => {
                        appState.isResetting = false;
                    }, 0);

                    }


                async function loadFlatFile() {
                    try {
                        const res = await fetch("data/master.json");
                        const data = await res.json();
                        appState.masterData = data;
                        document.getElementById("totalResults").innerText = appState.masterData.length;
                        showStatus(`Master file loaded: ${appState.masterData.length} records`);
                        console.log("HTS Master file loaded:", data.length);
                    } catch (e) {
                        console.warn("No master.json file found");
                        showStatus("No master.json found. Please import JSON files manually.", true);
                    }
                }

                function initializeCountries() {
                    // 🌍 All countries from ISO map (real world list)
                    const countries = Object.keys(COUNTRY_CODE_MAP);
                
                    appState.allCountries = countries
                        .sort((a, b) => a.localeCompare(b))
                        .map(name => ({ name }));
                
                    buildCountriesFilter();
                }

                function showStatus(message, isError = false) {
                    const statusDiv = document.getElementById('statusMessage');
                    statusDiv.textContent = message;
                    statusDiv.className = 'status-message ' + (isError ? 'status-error' : 'status-success');
                    statusDiv.style.display = 'block';
                    setTimeout(() => {
                        statusDiv.style.display = 'none';
                    }, 3000);
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

                function enforceGenderNeutralUI(category) {
                    const genderSelect = document.getElementById("genderFilter");
                    const genderTrigger = document.getElementById('genderTrigger');
                    const genderMenu = document.getElementById('genderMenu');
                    const genderNote = document.getElementById("genderNote");

                    const safeEnableAllLegacy = () => {
                        if (genderSelect && genderSelect.options) {
                            try { Array.from(genderSelect.options).forEach(o => o.disabled = false); } catch (e) {}
                        }
                    };

                    if (!category) {
                        // 🔄 RESET STATE
                        safeEnableAllLegacy();
                        if (genderTrigger) genderTrigger.textContent = getFilterLabel('gender', selectedFilters.gender) + ' ▾';
                        if (genderMenu) genderMenu.querySelectorAll('.filter-menu-item.disabled').forEach(i => i.classList.remove('disabled'));
                        if (genderNote) genderNote.style.display = "none";
                        return;
                    }

                    const isNeutral = GENDER_NEUTRAL_CATEGORIES.has(normalizeText(category));

                    if (!isNeutral) {
                        if (selectedFilters.uiMainCategory !== "Accessories") {
                            safeEnableAllLegacy();
                            if (genderMenu) genderMenu.querySelectorAll('.filter-menu-item.disabled').forEach(i => i.classList.remove('disabled'));
                            if (genderNote) genderNote.style.display = "none";
                        }
                        return;
                    }

                    // For neutral categories, force All
                    selectedFilters.gender = "All";
                    if (genderSelect) {
                        try { genderSelect.value = 'All'; } catch(e) {}
                    }
                    if (genderTrigger) genderTrigger.textContent = getFilterLabel('gender', selectedFilters.gender) + ' ▾';

                    if (genderSelect && genderSelect.options) {
                        try { Array.from(genderSelect.options).forEach(o => { o.disabled = o.value !== 'All'; }); } catch(e) {}
                    }

                    if (genderMenu) {
                        genderMenu.querySelectorAll('.filter-menu-item').forEach(item => {
                            if (!/All/i.test(item.textContent)) item.classList.add('disabled');
                        });
                    }

                    if (genderNote) {
                        genderNote.innerHTML = "Women foundation garments / gender-neutral support accessories";
                        genderNote.style.display = "block";
                    }
                }

                function handleAccessoriesGenderRule(mainCategory) {
                    const genderSelect = document.getElementById('genderFilter');
                    const genderTrigger = document.getElementById('genderTrigger');
                    const genderMenu = document.getElementById('genderMenu');
                    const genderNote = document.getElementById('genderNote');

                    if (mainCategory === "Accessories") {
                        // 🔒 Force gender = All
                        selectedFilters.gender = 'All';

                        // If legacy <select> exists, update it
                        if (genderSelect) {
                            try {
                                genderSelect.value = 'All';
                                Array.from(genderSelect.options).forEach(opt => {
                                    opt.disabled = opt.value !== 'All';
                                });
                            } catch (e) {
                                console.warn('Could not update legacy gender select', e);
                            }
                        }

                        // If new custom trigger exists, update its text
                        if (genderTrigger) {
                            genderTrigger.textContent = getFilterLabel('gender', selectedFilters.gender) + ' ▾';
                        }

                        // Optionally mark non-All items in custom menu as disabled (visual only)
                        if (genderMenu) {
                            genderMenu.querySelectorAll('.filter-menu-item').forEach(item => {
                                if (!/All/i.test(item.textContent)) item.classList.add('disabled');
                            });
                        }

                        if (genderNote) {
                            genderNote.innerHTML = 'Gender filter is disabled for <b>Accessories (HTS-unisex category)</b>';
                            genderNote.style.display = 'block';
                        }

                    } else {
                        // 🔓 Restore normal behavior
                        if (genderSelect) {
                            try {
                                Array.from(genderSelect.options).forEach(opt => {
                                    opt.disabled = false;
                                });
                            } catch (e) {
                                console.warn('Could not restore legacy gender select', e);
                            }
                        }

                        if (genderMenu) {
                            genderMenu.querySelectorAll('.filter-menu-item.disabled').forEach(item => {
                                item.classList.remove('disabled');
                            });
                        }

                        // ❌ Hide note for other categories
                        if (genderNote) {
                            genderNote.style.display = 'none';
                            genderNote.innerHTML = '';
                        }
                    }
                }

        
                    function clearResults() {
                        document.getElementById('resultsContainer').innerHTML =
                            '<div class="no-results">Filters reset. Please select category and country.</div>';
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

document.querySelectorAll(".filter-trigger").forEach(trigger => {
    trigger.addEventListener("click", e => {
        e.stopPropagation();

        // ✅ CLOSE locked info tooltip when filters open
        closeLockedInfoTooltip();

        // 🔑 FORCE close category when opening any filter
        if (appState.categoryMenuOpen) {
            closeAllCategoryMenus();
        }

        toggleFilterMenu(trigger);
    });
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

                
                // 🔥 GLOBAL CAPTURE CLICK HANDLER (runs before stopPropagation)
document.addEventListener("click", (e) => {

    const clickedFilter = e.target.closest(".filter-trigger, .filter-menu");
    const clickedCategory = e.target.closest(".category-trigger, .category-menu");
    const clickedInfo = e.target.closest(".info-icon");

    // ✅ ALWAYS close locked tooltip when clicking ANYTHING except the icon
    if (!clickedInfo && appState.lockedInfoIcon) {
        appState.lockedInfoIcon.classList.remove("open", "active");
        appState.lockedInfoIcon = null;
        appState.openInfoIcon = null;
    }

    // Close filter menus
    if (!clickedFilter && appState.openFilterMenu) {
        appState.openFilterMenu.classList.remove("show");
        appState.openFilterMenu = null;
    }

    // Close category menus
    if (!clickedCategory && appState.categoryMenuOpen) {
        closeAllCategoryMenus();
    }

}, true); // ⭐⭐⭐ THIS TRUE IS THE MAGIC (capture phase)


                
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

    initializeCountries();
    buildCategoryMenu();
    initializeFilterMenus();
    loadFlatFile();
    checkAdminMode();

