import { USA_ENGINE } from "./countries/usa/engine.js";
import { COUNTRY_CODE_MAP } from "./countries/usa/countryCodes.js";
import {COPY_SVG,CHECK_SVG,ICON_PLUS,ICON_MINUS} from "./constants/icons.js";
import { CBP_APPAREL_PDF } from "./constants/config.js";
import { FABRIC_CLASSIFICATION_HTML } from "./constants/fabricRules.js";
import {MAIN_CATEGORY_MAP,CATEGORY_KEYWORDS,categoryDescriptions} from "./constants/categories.js";
import {GENDER_TERMS,MATERIAL_NEUTRAL_CATEGORIES,GENDER_NEUTRAL_CATEGORIES} from "./constants/genderRules.js";
import { CATEGORY_ALERT_RULES } from "./constants/alerts.js";
import {SINGLE_NODE_STRONG_CATEGORIES,SCOPE_CATEGORIES,CATEGORY_SYNONYMS,CATEGORY_EXCLUSIONS} from "./constants/searchRules.js";
  
    const COUNTRY_ENGINE = USA_ENGINE;

    let isResetting = false;

        let masterData = [];
        let allCountries = [];
        let highlightEnabled = false;
        let categoryMenuOpen = false;
        let suppressCategoryHover = false;
        window.openFilterMenu = null;
        window.lockedInfoIcon = null;
        window.openInfoIcon = null;

// Inject fabric info into tooltip container when present
        try {
                const fabricTip = document.getElementById('fabricInfoTooltip');
                if (fabricTip) fabricTip.innerHTML = FABRIC_CLASSIFICATION_HTML;
        } catch (e) { /* ignore during load */ }

        function getFilterLabel(filterType, value) {
            const items = FILTER_DATA && FILTER_DATA[filterType];
            if (!items || !value) return value || 'All';
            const found = items.find(i => i.value === value);
            return found ? found.label : value;
        }

            const selectedFilters = {
                uiMainCategory: '',
                category: '',
                gender: 'All',
                material: 'All',
                fabric: 'All',
                country: '',
                exportingCountry: '',
                importingCountry: COUNTRY_ENGINE.getImportingCountry(),
                feature: 'All'
            };

            // ============ FILTER MENU FUNCTIONS ============

            const FILTER_DATA = {
                material: [
                    { value: 'All', label: 'All' },
                    { value: 'Knitted', label: 'Knitted or crocheted' },
                    { value: 'Woven', label: 'Woven or Non-Woven' }
                ],
                gender: [
                    { value: 'All', label: 'All' },
                    { value: 'Babies', label: 'Babies' },
                    { value: 'Boys', label: 'Boys' },
                    { value: 'Girls', label: 'Girls' },
                    { value: 'Men', label: 'Men' },
                    { value: 'Women', label: 'Women' }
                ],
                
                importingCountry: [
                    { value: COUNTRY_ENGINE.getImportingCountry(), label: COUNTRY_ENGINE.getImportingCountry() }
                ],
                fabric: [
                    { value: 'All', label: 'All' },
                    { value: 'Artificial fibers', label: 'Artificial fibers' },
                    { value: 'Cotton', label: 'Cotton' },
                    { value: 'Fine animal hair', label: 'Fine animal hair' },
                    { value: 'Flax fibers', label: 'Flax fibers' },
                    { value: 'Linen (835)', label: 'Linen (835)' },
                    { value: 'Man-made fibers', label: 'Man-made fibers' },
                    { value: 'Other textile materials', label: 'Other textile materials' },
                    { value: 'Silk or silk waste', label: 'Silk or silk waste' },
                    { value: 'Subject to cotton restraints (334)', label: 'Subject to cotton restraints (334)' },
                    { value: 'Subject to man-made fiber restraints (634)', label: 'Subject to man-made fiber restraints (634)' },
                    { value: 'Subject to wool restraints (434)', label: 'Subject to wool restraints (434)' },
                    { value: 'Synthetic fibers', label: 'Synthetic fibers' },
                    { value: 'Vegetable fibers', label: 'Vegetable fibers' },
                    { value: 'wool', label: 'Wool' }
                ],
                feature: [
                    { value: 'All', label: 'All' },
                    { value: 'Knit to Shape', label: 'Knit to Shape' },
                    { value: 'Recreational Performance Outerwear', label: 'Recreational Performance Outerwear' },
                    { value: 'Water resistant', label: 'Water resistant' }
                ]
            };

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
                if (lockedInfoIcon) {
                    lockedInfoIcon.classList.remove("open", "active");
                    lockedInfoIcon = null;
                    openInfoIcon = null;
                }
            }
            
            function closeAllCategoryMenus() {
                const categoryMenu = document.getElementById("categoryMenu");
                if (categoryMenu) {
                    categoryMenu.style.display = "none";
                }

                document.querySelectorAll(".submenu").forEach(sm => {
                    sm.style.display = "none";
                });

                // Also close filter menus
                document.querySelectorAll(".filter-menu.show").forEach(menu => {
                    menu.classList.remove("show");
                });
                openFilterMenu = null;

                categoryMenuOpen = false; // 🔑 REQUIRED

                // Temporarily suppress hover handlers to avoid immediate submenu reopen
                suppressCategoryHover = true;
                setTimeout(() => { suppressCategoryHover = false; }, 250);
            }

            const categoryTrigger = document.querySelector(".category-trigger");
            const categoryMenu = document.getElementById("categoryMenu");
            
            categoryTrigger.addEventListener("click", e => {
                e.stopPropagation();
            
                // 🔑 CLOSE ALL FILTER MENUS FIRST
                document.querySelectorAll(".filter-menu.show").forEach(menu => {
                    menu.classList.remove("show");
                });
                openFilterMenu = null;
            
                // Toggle category
                if (categoryMenuOpen) {
                    closeAllCategoryMenus();
                    return;
                }
            
                categoryMenu.style.display = "block";
                categoryMenuOpen = true;
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

                if (isResetting) return;
                if (!selectedFilters.category || !selectedFilters.exportingCountry) return;

                highlightEnabled = !highlightEnabled;

                const btn = document.getElementById("toggleHighlightBtn");

                btn.classList.toggle("active", highlightEnabled);
                btn.setAttribute("aria-pressed", highlightEnabled);
                btn.setAttribute(
                    "aria-label",
                    highlightEnabled ? "Disable highlight" : "Enable highlight"
                );

                btn.dataset.tooltip = highlightEnabled
                    ? "Highlight ON"
                    : "Highlight OFF";

                searchHTSByFilters();
                }

                function handleCategorySelection(mainCategory, productCategory) {
                    // Ensure the menu always closes even if an error occurs during handling
                    try {
                        selectedFilters.uiMainCategory = mainCategory;
                        selectedFilters.category = productCategory;

                        // Update trigger text
                        const trigger = document.querySelector(".category-trigger");
                        if (trigger) trigger.textContent = `${mainCategory} ▸ ${productCategory}`;

                        // CATEGORY DESCRIPTION / INFO ICON
                        try {
                            const infoIcon = document.getElementById("categoryInfoIcon");
                            const tooltip = document.getElementById("categoryInfoTooltip");
                            const key = normalizeText(productCategory);

                            if (infoIcon && tooltip) {
                                if (categoryDescriptions[key]) {
                                    infoIcon.classList.remove("disabled");
                                    infoIcon.classList.add("active");
                                    infoIcon.classList.remove("open");
                                    tooltip.innerHTML = `\n                                        <b>${productCategory}</b><br>\n                                       ${categoryDescriptions[key]}\n                                       <hr style=\"margin:8px 0\">\n                                        <a href=\"${CBP_APPAREL_PDF}\" target=\"_blank\" rel=\"noopener noreferrer\" style=\"font-size:12px; color:#4a90e2;\" class=\"cbp-pdf-link\"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" class="cbp-pdf-icon" viewBox="0 0 16 16">
                                    <!-- svg paths unchanged -->
                                    <path d="M5.523 12.424q.21-.124.459-.238a8 8 0 0 1-.45.606c-.28.337-.498.516-.635.572l-.035.012a.3.3 0 0 1-.026-.044c-.056-.11-.054-.216.04-.36.106-.165.319-.354.647-.548m2.455-1.647q-.178.037-.356.078a21 21 0 0 0 .5-1.05 12 12 0 0 0 .51.858q-.326.048-.654.114m2.525.939a4 4 0 0 1-.435-.41q.344.007.612.054c.317.057.466.147.518.209a.1.1 0 0 1 .026.064.44.44 0 0 1-.06.2.3.3 0 0 1-.094.124.1.1 0 0 1-.069.015c-.09-.003-.258-.066-.498-.256M8.278 6.97c-.04.244-.108.524-.2.829a5 5 0 0 1-.089-.346c-.076-.353-.087-.63-.046-.822.038-.177.11-.248.196-.283a.5.5 0 0 1 .145-.04c.013.03.028.092.032.198q.008.183-.038.465z"></path>
                                    <path fill-rule="evenodd" d="M4 0h5.293A1 1 0 0 1 10 .293L13.707 4a1 1 0 0 1 .293.707V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2m5.5 1.5v2a1 1 0 0 0 1 1h2zM4.165 13.668c.09.18.23.343.438.419.207.075.412.04.58-.03.318-.13.635-.436.926-.786.333-.401.683-.927 1.021-1.51a11.7 11.7 0 0 1 1.997-.406c.3.383.61.713.91.95.28.22.603.403.934.417a.86.86 0 0 0 .51-.138c.155-.101.27-.247.354-.416.09-.181.145-.37.138-.563a.84.84 0 0 0-.2-.518c-.226-.27-.596-.4-.96-.465a5.8 5.8 0 0 0-1.335-.05 11 11 0 0 1-.98-1.686c.25-.66.437-1.284.52-1.794.036-.218.055-.426.048-.614a1.24 1.24 0 0 0-.127-.538.7.7 0 0 0-.477-.365c-.202-.043-.41 0-.601.077-.377.15-.576.47-.651.823-.073.34-.04.736.046 1.136.088.406.238.848.43 1.295a20 20 0 0 1-1.062 2.227 7.7 7.7 0 0 0-1.482.645c-.37.22-.699.48-.897.787-.21.326-.275.714-.08 1.103"></path>
                                    
                                    </svg> View official CBP Apparel Terminology Guide (PDF)</a>`;
                                } else {
                                    infoIcon.classList.remove("active");
                                    infoIcon.classList.add("disabled");
                                    tooltip.innerHTML = "No description available for this category.";
                                }
                            }
                        } catch (innerErr) {
                            console.error('Category info render error', innerErr);
                        }

                        // Existing logic
                        handleAccessoriesGenderRule(mainCategory);
                        enforceGenderNeutralUI(productCategory);
                        enforceMaterialNeutralUI(productCategory);

                        // Rebuild affected filter menus so UI reflects forced 'All' or restored state
                        try { buildFilterMenu('gender'); } catch (e) {}
                        try { buildFilterMenu('material'); } catch (e) {}

                        // Trigger search
                        searchHTSByFilters();
                    } catch (err) {
                        console.error('Error handling category selection:', err);
                    } finally {
                        // Always close menus and reset state
                        try { closeAllCategoryMenus(); } catch (closeErr) { console.error('Error closing category menus:', closeErr); }
                    }
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

                // 🔒 Category lock based on gender
                function getVisibleMainCategories() {

                    // If Babies selected → only show Babies category
                    if (selectedFilters.gender === "Babies") {
                        return {
                            "Babies & Infant Wear": MAIN_CATEGORY_MAP["Babies & Infant Wear"]
                        };
                    }

                    // Otherwise show everything
                    return MAIN_CATEGORY_MAP;
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
                    isResetting = true; // 🔒 lock everything

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
                    highlightEnabled = false;

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
                        isResetting = false;
                    }, 0);

                    }


                async function loadFlatFile() {
                    try {
                        const res = await fetch("data/master.json");
                        const data = await res.json();
                        masterData = data;
                        document.getElementById("totalResults").innerText = masterData.length;
                        showStatus(`Master file loaded: ${masterData.length} records`);
                        console.log("HTS Master file loaded:", data.length);
                    } catch (e) {
                        console.warn("No master.json file found");
                        showStatus("No master.json found. Please import JSON files manually.", true);
                    }


                }

                function initializeCountries() {
                    // 🌍 All countries from ISO map (real world list)
                    const countries = Object.keys(COUNTRY_CODE_MAP);
                
                    allCountries = countries
                        .sort((a, b) => a.localeCompare(b))
                        .map(name => ({ name }));
                
                    buildCountriesFilter();
                }

                function buildCategoryMenu() {
                    const container = document.getElementById("categoryMenu");
                    container.innerHTML = "";

                    // 🧹 VERY IMPORTANT — remove old floating submenus
                    document.querySelectorAll(".submenu").forEach(el => el.remove());

                    container.addEventListener("click", e => e.stopPropagation());


                const visibleCategories = getVisibleMainCategories();

                Object.entries(visibleCategories)
                .sort((a, b) => a[0].localeCompare(b[0])) // ⭐ sort main categories alphabetically
                .forEach(([mainCat, subCats]) => {

                        const mainDiv = document.createElement("div");
                        mainDiv.className = "category-item";
                        mainDiv.dataset.main = mainCat;
                        mainDiv.textContent = mainCat;


                        // 🔑 ADD THIS LINE
                        mainDiv.addEventListener("click", e => {
                            e.stopPropagation();
                        });

                        const submenu = document.createElement("div");
                        submenu.className = "submenu";
                        submenu.style.display = "none";

                        [...subCats].sort((a, b) => a.localeCompare(b)).forEach(sub => {
                            const subDiv = document.createElement("div");
                            subDiv.className = "submenu-item";
                            subDiv.dataset.main = mainCat;
                            subDiv.dataset.sub = sub;

                            subDiv.innerHTML = `
                                <span class="tick">✔</span>
                                <span class="label">${sub}</span>
                            `;


                            subDiv.addEventListener("click", e => {
                                e.stopPropagation();
                            
                                // 🔥 Clear old selections
                                document.querySelectorAll(".submenu-item.selected")
                                    .forEach(el => el.classList.remove("selected"));
                            
                                document.querySelectorAll(".category-item.active")
                                    .forEach(el => el.classList.remove("active"));
                            
                                // ✅ Select current subcategory
                                subDiv.classList.add("selected");
                            
                                // ✅ Select parent main category
                                const parentMain = document.querySelector(
                                    `.category-item[data-main="${mainCat}"]`
                                );
                                if (parentMain) {
                                    parentMain.classList.add("active");
                                }
                            
                                // ✅ Update trigger
                                document.querySelector(".category-trigger").textContent =
                                    `${mainCat} → ${sub}`;
                            
                                // ✅ Enable info icon
                                document.getElementById("categoryInfoIcon")
                                    .classList.remove("disabled");
                            
                                handleCategorySelection(mainCat, sub);
                                closeAllCategoryMenus();
                            });
                            
                            

                            submenu.appendChild(subDiv);
                        });

                        mainDiv.addEventListener("mouseenter", () => {
                            if (suppressCategoryHover) return;
                            hideAllSubmenus();

                            const rect = mainDiv.getBoundingClientRect();
                            submenu.style.display = "block";
                            submenu.style.top = `${rect.top}px`;
                            submenu.style.left = `${rect.right + 8}px`;

                            const subRect = submenu.getBoundingClientRect();
                            if (subRect.right > window.innerWidth) {
                                submenu.style.left = `${rect.left - subRect.width - 8}px`;
                            }
                            if (subRect.bottom > window.innerHeight) {
                                submenu.style.top =
                                    `${window.innerHeight - subRect.height - 12}px`;
                            }
                        });

                        document.body.appendChild(submenu);
                        container.appendChild(mainDiv);
                    });
                    }
                    

                function hideAllSubmenus() {
                    document.querySelectorAll(".submenu").forEach(sm => {
                        sm.style.display = "none";
                    });
                }

                function findParentWithRate(item, rateField) {
                    const currentIndex = masterData.indexOf(item) == -1 ? masterData.findIndex(InnerItem => InnerItem.htsno === item.htsno && InnerItem.description === item.description) : masterData.indexOf(item);
                    const currentIndent = parseInt(item.indent);

                    for (let i = currentIndex - 1; i >= 0; i--) {
                        const checkItem = masterData[i];
                        const checkIndent = parseInt(checkItem.indent);
                        if (checkIndent < currentIndent) {
                            if (checkItem[rateField] && checkItem[rateField] !== '' && checkItem[rateField] !== 'N/A') {
                                return checkItem;
                            }
                        }
                        if (checkIndent === 0 && i !== currentIndex - 1) break;
                    }
                    return null;
                }

                function matchesWordBoundary(text, searchWord) {
                    const regex = new RegExp(`\\b${searchWord}\\b`, 'i');
                    return regex.test(text);
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
                                    masterData = [...masterData, ...newData];
                                    document.getElementById("totalResults").innerText = masterData.length;
                                    showStatus(`Successfully imported ${files.length} file(s). Total records: ${masterData.length}`);
                                    fileInput.value = '';
                                }
                            } catch (error) {
                                showStatus('Error parsing JSON file: ' + file.name, true);
                            }
                        };
                        reader.readAsText(file);
                    });
                }

                function isExactProductAtLeaf(item, productCategory) {
                    const path = getHierarchyPath(item);

                    if (!path.length) return false;

                    const last = normalizeText(path[path.length - 1].description);
                    const parent =
                        path.length > 1
                            ? normalizeText(path[path.length - 2].description)
                            : '';

                    const normalizedCategory = normalizeText(productCategory);

                    return (
                        last.includes(normalizedCategory) ||
                        parent.includes(normalizedCategory)
                    );
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

                function getHierarchyPath(item) {
                    const hierarchyItems = [];
                    let currentIndent = parseInt(item.indent);
                    let currentIndex = masterData.indexOf(item);

                    for (let i = currentIndex; i >= 0; i--) {
                        const checkItem = masterData[i];
                        const checkIndent = parseInt(checkItem.indent);
                        if (checkIndent < currentIndent || i === currentIndex) {
                            hierarchyItems.unshift(checkItem);
                            currentIndent = checkIndent;
                        }
                        if (currentIndent === 0) break;
                    }
                    return hierarchyItems;
                }
      
                function getFullDescription(item) {
                    let descriptions = [item.description];
                    let currentIndent = parseInt(item.indent);
                    let currentIndex = masterData.indexOf(item);

                    for (let i = currentIndex - 1; i >= 0; i--) {
                        const prevItem = masterData[i];
                        const prevIndent = parseInt(prevItem.indent);

                        if (prevIndent < currentIndent) {
                            descriptions.unshift(prevItem.description);
                            currentIndent = prevIndent;
                        }

                        if (currentIndent === 0) break;
                    }

                    return descriptions.join(' > ');
                }

                function isTenDigitHTS(htsno) {
                        if (!htsno) return false;
                        const digitsOnly = htsno.replace(/\D/g, '');
                        return digitsOnly.length === 10;
                    }

                function getFullHierarchyText(item) {
                        const path = getHierarchyPath(item);
                        return path.map(n => n.description.toLowerCase()).join(' ');
                    }

                function getGenderScope(item) {
                        const path = getHierarchyPath(item);
                        const found = new Set();

                        path.forEach(node => {
                            const text = normalizeText(node.description);

                            for (const [gender, terms] of Object.entries(GENDER_TERMS)) {
                                if (terms.some(t => new RegExp(`\\b${t}\\b`, 'i').test(text))) {
                                    found.add(gender);
                                }
                            }
                        });

                        return found.size ? Array.from(found) : null;
                    }

                function extractGendersFromText(text) {
                    const found = new Set();
                    const normalized = normalizeText(text);

                    for (const [gender, terms] of Object.entries(GENDER_TERMS)) {
                        terms.forEach(term => {
                            const regex = new RegExp(
                                `\\b${term}(?:'s|’s|s)?(?:\\s+or\\s+\\w+)?\\b`,
                                'i'
                            );
                            if (regex.test(normalized)) {
                                found.add(gender);
                            }
                        });
                    }

                    return found.size ? Array.from(found) : null;
                }

                function getGenderFromLeafAndParent(item) {
                    const path = getHierarchyPath(item);
                    if (!path.length) return null;

                    const gendersInLeaf = extractGendersFromText(path[path.length - 1].description) || [];
                    const genders = new Set(gendersInLeaf);

                    // parent node
                    if (path.length > 1) {
                        const parentGenders = extractGendersFromText(path[path.length - 2].description) || [];
                        parentGenders.forEach(g => {
                            if (!gendersInLeaf.includes(g)) genders.add(g); // avoid duplicate
                        });
                    }

                    return genders.size ? Array.from(genders) : null;
                }

                function matchesCategoryHierarchy(item, keywords) {
                    const path = getHierarchyPath(item);

                    if (!path.length) return false;

                    // ✅ Check parent nodes first
                    for (let i = 0; i < path.length - 1; i++) {
                        const node = normalizeText(path[i].description);
                        if (keywords.some(k => matchesWordBoundary(node, k))) return true;
                    }

                    // ✅ Then check leaf node
                    const leaf = normalizeText(path[path.length - 1].description);
                    if (keywords.some(k => matchesWordBoundary(leaf, k))) return true;

                    return false;
                }

                function getCategoryScope(category) {
                    const text = normalizeText(category);

                    if (text.includes("babies") || text.includes("infant")) return "babies";
                    if (text.includes("girls")) return "girls";
                    if (text.includes("boys")) return "boys";
                    if (text.includes("women")) return "women";
                    if (text.includes("men")) return "men";

                    return null;
                }

                function isMatchInParent(item, productCategoryNormalized) {
                    const path = getHierarchyPath(item);
                    for (let i = 0; i < path.length - 1; i++) {
                        if (matchesWordBoundary(normalizeText(path[i].description), productCategoryNormalized)) {
                            return true;
                        }
                    }
                    return false;
                }

                function getCategoryLeaf(category) {
                    if (!category) return "";
                    return normalizeText(category.split(">").pop().trim());
                }

                function hasScopeInHierarchy(item, scope) {
                    const path = getHierarchyPath(item);
                    const scopeRegex = new RegExp(`\\b${scope}\\b`, "i");

                    return path.some(p =>
                        scopeRegex.test(normalizeText(p.description))
                    );
                }

                function isSingleNodeStrongCategory(category) {
                    return SINGLE_NODE_STRONG_CATEGORIES.has(
                        normalizeText(category)
                    );
                }

                function searchHTSByFilters() {

                    if (isResetting) return;
                    if (!selectedFilters.category || !selectedFilters.exportingCountry) {
                        clearResults();
                        return;
                    }
                
                    const productCategory = selectedFilters.category;
                    const gender = selectedFilters.gender;
                    const material = selectedFilters.material;
                    const fabric = selectedFilters.fabric;
                    const exportingCountry = selectedFilters.exportingCountry;
                
                    if (!productCategory || !exportingCountry) {
                        document.getElementById("resultsContainer").innerHTML =
                            "<div class='no-results'>Please select Product Category and Country</div>";
                        return;
                    }
                
                    /* 🔑 STEP 1: derive HTS keywords ONLY from PRODUCT CATEGORY */
                    let keywordList = CATEGORY_KEYWORDS[productCategory] || [];
                
                    // Fallback: sub-item → grouped keyword set
                    if (!keywordList.length) {
                        const normalizedProduct = normalizeText(productCategory);
                        for (const kws of Object.values(CATEGORY_KEYWORDS)) {
                            if (kws.some(kw => normalizeText(kw) === normalizedProduct)) {
                                keywordList = kws;
                                break;
                            }
                        }
                    }
                
                    if (!keywordList.length) return;
                
                    const productCategoryNormalized = normalizeText(productCategory);
                
                    /* 🔑 STEP 2: FILTER masterData */
                    let filtered = masterData
                        .filter(item => {
                
                            if (!item.htsno || !isTenDigitHTS(item.htsno)) return false;
                
                            const chapter = item.htsno.substring(0, 2);
                            const normalizedDesc = normalizeText(getFullHierarchyText(item));
                
                            /* 🚫 CATEGORY-SPECIFIC HARD EXCLUSIONS */
                            const rule = CATEGORY_EXCLUSIONS[productCategory];
                            if (rule) {
                
                                if (
                                    rule.excludeParentKeywords &&
                                    selectedFilters.gender !== "Babies" &&
                                    rule.excludeParentKeywords.some(k =>
                                        new RegExp(`\\b${k}\\b`, "i").test(normalizedDesc)
                                    )
                                ) return false;
                
                                if (
                                    rule.excludeKeywords &&
                                    rule.excludeKeywords.some(kw =>
                                        new RegExp(`\\b${kw}\\b`, "i").test(normalizedDesc)
                                    )
                                ) return false;
                
                                if (
                                    rule.allowedChapters &&
                                    !rule.allowedChapters.includes(chapter)
                                ) return false;
                            }
                
                            /* 🔓 CATEGORY MATCH (old behavior restored) */
                            const derivedScope = getCategoryScope(productCategory);
                            const isScopeCategory = !!derivedScope;
                
                            if (
                                !isScopeCategory &&
                                !matchesCategoryHierarchy(item, keywordList)
                            ) {
                                return false;
                            }
                
                            if (
                                isScopeCategory &&
                                !hasScopeInHierarchy(item, derivedScope)
                            ) {
                                return false;
                            }
                
                            /* ✅ GENDER */
                            if (gender !== "All") {
                                const leafGenders = getGenderFromLeafAndParent(item);
                
                                if (gender === "Babies") {
                                    if (!leafGenders?.includes("Babies")) {
                                        const scope = getGenderScope(item);
                                        if (!scope?.includes("Babies")) return false;
                                    }
                                } else {
                                    if (leafGenders) {
                                        if (!leafGenders.includes(gender)) return false;
                                    } else {
                                        const scope = getGenderScope(item);
                                        if (!scope?.includes(gender)) return false;
                                    }
                                }
                            }
                
                            /* ✅ FABRIC */
                            if (fabric !== "All" &&
                                !normalizedDesc.includes(normalizeText(fabric))) {
                                return false;
                            }
                
                            /* ✅ FEATURE */
                            if (selectedFilters.feature !== "All") {
                                if (!normalizedDesc.includes(
                                    normalizeText(selectedFilters.feature)
                                )) {
                                    return false;
                                }
                            }
                
                            /* ✅ MATERIAL */
                            const isMaterialNeutral =
                                MATERIAL_NEUTRAL_CATEGORIES.has(productCategoryNormalized);
                
                            if (!isMaterialNeutral) {
                                if (material === "Knitted" && chapter !== "61") return false;
                                if (material === "Woven" && chapter !== "62") return false;
                            }
                
                            return true;
                        })
                
                        /* 🔑 STEP 3: SCORE */
                        .map(item => {
                
                            const fullDesc = normalizeText(getFullHierarchyText(item));
                
                            let keywordHits = 0;
                            let uniqueHits = 0;
                
                            keywordList.forEach(kw => {
                                const normalizedKw = normalizeText(kw);
                                const escapedKw = normalizedKw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                                const matches = fullDesc.match(new RegExp(escapedKw, "g"));
                
                                if (matches) {
                                    keywordHits += matches.length;   // old behavior
                                    uniqueHits += 1;
                                }
                            });
                
                            const synonyms = CATEGORY_SYNONYMS[productCategory] || [];
                
                            return {
                                item,
                                keywordHits,
                                uniqueHits,
                
                                isLeaf:
                                    isExactProductAtLeaf(item, productCategoryNormalized) ||
                                    synonyms.some(s =>
                                        isExactProductAtLeaf(item, normalizeText(s))
                                    ),
                
                                isParent: isMatchInParent(item, productCategoryNormalized)
                            };
                        });
                
                    if (!filtered.length) {
                        document.getElementById("resultsContainer").innerHTML =
                            "<div class='no-results'>No matching HTS found</div>";
                        return;
                    }
                
                    /* 🔑 STEP 4: SPLIT RESULTS (old logic) */
                    const primaryResults = [];
                    const relatedResults = [];
                
                    filtered.forEach(r => {
                
                        const derivedScope = getCategoryScope(productCategory);
                
                        const isStrongSingleNodeCategory =
                            isSingleNodeStrongCategory(productCategory) &&
                            (r.isLeaf || r.isParent);
                
                        const isScopeStrong =
                            derivedScope &&
                            hasScopeInHierarchy(r.item, derivedScope);
                
                        if (
                            isScopeStrong ||
                            r.keywordHits >= 2 ||
                            r.uniqueHits >= 2 ||
                            r.isLeaf ||
                            isStrongSingleNodeCategory
                        ) {
                            primaryResults.push(r);
                        } else {
                            relatedResults.push(r);
                        }
                    });
                
                    /* 🔑 STEP 5: SORT (old priority) */
                    primaryResults.sort((a, b) => {
                
                        if (b.keywordHits !== a.keywordHits) {
                            return b.keywordHits - a.keywordHits;
                        }
                
                        if (b.uniqueHits !== a.uniqueHits) {
                            return b.uniqueHits - a.uniqueHits;
                        }
                
                        const rank = r => r.isLeaf ? 1 : r.isParent ? 2 : 3;
                        return rank(a) - rank(b);
                    });
                
                    /* 🔑 STEP 6: DISPLAY */
                    displayResults(
                        primaryResults.map(r => r.item),
                        relatedResults.map(r => r.item),
                        exportingCountry,
                        keywordList
                    );
                }
                
                

                    function clearResults() {
                        document.getElementById('resultsContainer').innerHTML =
                            '<div class="no-results">Filters reset. Please select category and country.</div>';
                    }

                    function highlightText(
                        text,
                        searchWords = [],
                        genderWords = [],
                        fabricWords = [],
                        featureWords = []
                        ) {
                        if (!highlightEnabled) {
                            return text;
                        }
                    
                        let highlighted = text;
                    
                        // helper: match whole words, allow plurals, ignore substrings
                        const wordRegex = (word) =>
                            new RegExp(
                                `(?<![a-zA-Z-])(${escapeRegExp(word)})(s)?(?![a-zA-Z-])`,
                                'gi'
                            );
                    
                        // 🔍 Search keywords
                        searchWords.forEach(word => {
                            highlighted = highlighted.replace(
                                wordRegex(word),
                                '<span class="highlight-search">$1$2</span>'
                            );
                        });
                    
                        // 🚻 Gender
                        genderWords.forEach(word => {
                            const regex = new RegExp(
                                `\\b(${escapeRegExp(word)})(['’]s)?\\b`,
                                'gi'
                            );
                            highlighted = highlighted.replace(
                                regex,
                                '<span class="highlight-gender">$&</span>'
                            );
                        });
                    
                        // 🧵 Fabric
                        fabricWords.forEach(word => {
                            highlighted = highlighted.replace(
                                wordRegex(word),
                                '<span class="highlight-fabric">$1$2</span>'
                            );
                        });
                    
                        // ⭐ Feature
                        featureWords.forEach(word => {
                            highlighted = highlighted.replace(
                                wordRegex(word),
                                '<span class="highlight-feature">$1$2</span>'
                            );
                        });
                    
                        return highlighted;
                    }
                    
                            function getDirectChildren(parentItem) {
                                const parentIndex = masterData.indexOf(parentItem);
                                const parentIndent = parseInt(parentItem.indent);
                                const children = [];

                                for (let i = parentIndex + 1; i < masterData.length; i++) {
                                    const current = masterData[i];
                                    const indent = parseInt(current.indent);

                                    if (indent <= parentIndent) break;   // stop at sibling/ancestor
                                    if (indent === parentIndent + 1) {
                                        children.push(current);
                                    }
                                }
                                return children;
                            }


                            function renderHTSHierarchy(htsCode) {
                                const leaf = masterData.find(e => e.htsno === htsCode);
                                if (!leaf) return;

                                const path = getHierarchyPath(leaf); // array of nodes from root → leaf
                                const container = document.getElementById("htsHierarchyContainer");
                                container.innerHTML = "";

                                path.forEach((node, idx) => {
                                    const hasChildren = getDirectChildren(node).length > 0;

                                    const div = document.createElement("div");
                                    div.className = `hts-node indent-${idx}`;

                                    // check if this node is in the path to the final HTS
                                    const isLeaf = idx === path.length - 1;

                                    div.innerHTML = `
                                        ${hasChildren
                                            ? `<span class="hts-toggle" title="Expand / Collapse">${ICON_PLUS}</span>`
                                            : `<span class="hts-spacer"></span>`}
                                        <span class="hts-code" style="font-weight:${isLeaf ? 'bold' : 'normal'}; color:${isLeaf ? '#4d6dfd' : '#333'}">
                                            ${node.htsno || ""}
                                        </span>
                                        <span class="hts-desc"
                                            style="
                                                font-weight: ${isLeaf ? 'bold' : 'normal'};
                                                color: ${isLeaf ? '#4d6dfd' : '#333'};
                                            "
                                            >
                                            ${node.description}
                                        </span>
                                    `;

                                    if (hasChildren) {
                                        const childContainer = document.createElement("div");
                                        childContainer.className = "hts-children";
                                        childContainer.style.display = "none";
                                        div.appendChild(childContainer);

                                        const toggle = div.querySelector(".hts-toggle");
                                        toggle.addEventListener("click", (e) => {
                                            e.stopPropagation();

                                            const isOpen = childContainer.style.display === "block";
                                            childContainer.style.display = isOpen ? "none" : "block";
                                            toggle.innerHTML = isOpen ? ICON_PLUS : ICON_MINUS;

                                            if (!isOpen && childContainer.dataset.loaded !== "true") {
                                                childContainer.dataset.loaded = "true";

                                                const children = getDirectChildren(node);
                                                children.forEach(c => {
                                                    const childDiv = document.createElement("div");
                                                    childDiv.className = `hts-node indent-${idx + 1}`;

                                                    const isChildLeaf = c.htsno === htsCode; // final leaf?

                                                    childDiv.innerHTML = `
                                                        <div class="hts-row">
                                                            <span class="hts-spacer"></span>
                                                            <span class="hts-code" style="font-weight:${isChildLeaf ? 'normal' : 'normal'}">
                                                                ${c.htsno || ""}
                                                            </span>
                                                            <span class="hts-desc" ${isChildLeaf ? '' : ''}>
                                                                ${c.description}
                                                            </span>
                                                        </div>
                                                    `;
                                                    childContainer.appendChild(childDiv);
                                                });
                                            }
                                        });
                                    }

                                    container.appendChild(div);
                                });
                            }

                    
                    
                    function highlightInheritedParts(fullDescription, itemDescription, searchWords,genderTerms = [],fabricTerms = [],featureTerms = []) {

                        if (!highlightEnabled) {
                            return fullDescription;
                        }
                        const parts = fullDescription.split(' > ');
                        let highlightedParts = [];

                        const itemDescIndex = parts.findIndex(part =>
                            part.trim().toLowerCase() === itemDescription.trim().toLowerCase()
                        );

                        parts.forEach((part, index) => {
                            let highlightedPart = part;

                            // Pass genderTerms along with searchWords
                            highlightedPart = highlightText(
                                highlightedPart,
                                searchWords,
                                genderTerms,
                                fabricTerms,
                                featureTerms
                            );

                            if (index < itemDescIndex && itemDescIndex !== -1) {
                                if (!highlightedPart.includes('highlight-search')) {
                                    highlightedPart = `<span class="highlight-inherited">${highlightedPart}</span>`;
                                } else {
                                    highlightedPart = highlightedPart.replace(
                                        /([^>]+?)(?=<span class="highlight-search">|$)/g,
                                        (match) => match.trim() ? `<span class="highlight-inherited">${match}</span>` : match
                                    );
                                }
                            }
                            highlightedParts.push(highlightedPart);
                        });

                        return highlightedParts.join(' > ');
                    }

                function normalizeText(str) {
                return str
                    .toLowerCase()
                    .replace(/[\(\)\d]/g, '')  // remove parentheses and numbers
                    .replace(/\s+/g, ' ')       // collapse multiple spaces
                    .trim();
                    }

                function escapeRegExp(string) {
                    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                }
                
                function getRateLabel(column){
                    if(column === "other") return "Column 2";
                    if(column === "special") return "Special";
                    return "General";
                }


                function displayResults(primaryResults, secondaryResults, exportingCountry, searchWords){
                        const container = document.getElementById('resultsContainer');
                        const totalResults = primaryResults.length + secondaryResults.length;
                        

                        if (totalResults === 0) {
                            container.innerHTML = '<div class="no-results">No results found for the selected filters</div>';
                            return;
                        }

                        let html = '<div class="results-header">';
                        html += `<div class="count-breakdown">`;
                        html += `<div class="count-item">Total Results: ${totalResults}</div>`;
                        html += `<div class="count-item primary">Match Results: ${primaryResults.length}</div>`;
                        html += `<div class="count-item secondary">Related Results: ${secondaryResults.length}</div>`;
                        html += `</div>`;
                        html += '</div>';

                        // Gender terms to highlight
                        // Correct gender terms from GENDER_TERMS
                        const genderTerms =
                            selectedFilters.gender && selectedFilters.gender !== 'All'
                            ? GENDER_TERMS[selectedFilters.gender]
                            : [];
                        
                        const fabricTerms =
                            selectedFilters.fabric && selectedFilters.fabric !== 'All'
                                ? [normalizeText(selectedFilters.fabric)]
                                : [];
                        const featureTerms =
                            selectedFilters.feature && selectedFilters.feature !== 'All'
                                ? [normalizeText(selectedFilters.feature)]
                                : [];


                        if (primaryResults.length > 0) {
                            html += `
                                <table class="results-table">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>HTS Code</th>
                                            <th>Description</th>
                                            <th>Rate Type</th>
                                            <th>Rate of Duty</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                            `;

                            primaryResults.forEach((item, index) => {
                                const fullDescription = getFullDescription(item);

                                const highlightedDescription = highlightInheritedParts(
                                    fullDescription,
                                    item.description,
                                    searchWords,
                                    genderTerms,
                                    fabricTerms,
                                    featureTerms
                                );


                                const rateInfo = COUNTRY_ENGINE.getDutyRate(
                                    item,
                                    exportingCountry,
                                    findParentWithRate
                                );
                                

                                const leafGenders = getGenderFromLeafAndParent(item);

                                // 1️⃣ Normalize description for gender detection
                                const normalizedDesc = fullDescription
                                    .replace(/\(\d+\)/g, '')   // remove numeric codes like (359)
                                    .replace(/>/g, '')         // remove > symbols
                                    .replace(/[':]/g, '')      // remove quotes and colons
                                    .toLowerCase();            // lowercase for easier matching

                                // 2️⃣ Detect if description already contains any gender
                                const genders = ['men','women','boys','girls'];
                                const descriptionHasGender = genders.some(g => normalizedDesc.includes(g));

                                // 3️⃣ Only add badge if description doesn't already include that gender
                                const uniqueGenders = leafGenders?.filter(g => !normalizedDesc.includes(g.toLowerCase()));
                                const genderBadge = !descriptionHasGender && uniqueGenders && uniqueGenders.length
                                    ? `<span class="gender-badge">${uniqueGenders.join(" / ")}</span>`
                                    : '';

                                html += `
                                    <tr
                                        class="hts-row"
                                        data-description="${normalizeText(fullDescription)}"
                                        onclick='showDetails(${JSON.stringify(item).replace(/'/g, "&apos;")}, "${exportingCountry}")'
                                    >
                                        <td class="row-number">${index + 1}</td>
                                        <td>
                                            <div class="hts-code-wrapper">
                                                <a
                                                    href="https://hts.usitc.gov/search?query=${encodeURIComponent(item.htsno)}"
                                                    target="_blank"
                                                    class="hts-code-link"
                                                    title="View HTS Code Structure on USITC Website"
                                                    onclick="event.stopPropagation()"
                                                >
                                                    ${item.htsno}
                                                </a>

                                                <button
                                                    class="hts-info-btn"
                                                    title="View details"
                                                    onclick='event.stopPropagation(); showDetails(${JSON.stringify(item).replace(/'/g, "&apos;")}, "${exportingCountry}")'
                                                >
                                                    i
                                                </button>
                                            </div>
                                        </td>

                                        <td>
                                            ${highlightedDescription}
                                            ${genderBadge}
                                        </td>
                                        <td>${getRateLabel(rateInfo.column)}</td>
                                        <td>${rateInfo.value}</td>
                                    </tr>
                                `;
                            });


                            html += '</tbody></table>';
                        }

                        if (secondaryResults.length > 0) {
                            html += `
                                <div class="other-results">
                                    <button class="other-results-toggle" onclick="toggleOtherResults()">
                                        <span>Related results (${secondaryResults.length})</span>
                                        <span class="arrow">▼</span>
                                    </button>
                                    <div class="other-results-content" id="otherResultsContent">
                                        <table class="results-table">
                                            <thead>
                                                <tr>
                                                    <th>#</th>
                                                    <th>HTS Code</th>
                                                    <th>Description</th>
                                                    <th>Rate Type</th>
                                                    <th>Rate</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                            `;

                            secondaryResults.forEach((item, index) => {
                                const fullDescription = getFullDescription(item);
                                const highlightedDescription = highlightInheritedParts(fullDescription,item.description,searchWords,genderTerms,fabricTerms,featureTerms);
                                const rateInfo = COUNTRY_ENGINE.getDutyRate(
                                    item,
                                    exportingCountry,
                                    findParentWithRate
                                );

                                const leafGenders = getGenderFromLeafAndParent(item);

                                // 1️⃣ Normalize description for gender detection
                                const normalizedDesc = fullDescription
                                    .replace(/\(\d+\)/g, '')   // remove numeric codes like (359)
                                    .replace(/>/g, '')         // remove > symbols
                                    .replace(/[':]/g, '')      // remove quotes and colons
                                    .toLowerCase();            // lowercase for easier matching

                                // 2️⃣ Detect if description already contains any gender
                                const genders = ['men','women','boys','girls'];
                                const descriptionHasGender = genders.some(g => normalizedDesc.includes(g));

                                // 3️⃣ Only add badge if description doesn't already include that gender
                                const uniqueGenders = leafGenders?.filter(g => !normalizedDesc.includes(g.toLowerCase()));
                                const genderBadge = !descriptionHasGender && uniqueGenders && uniqueGenders.length
                                    ? `<span class="gender-badge">${uniqueGenders.join(" / ")}</span>`
                                    : '';

                                html += `
                                    <tr onclick='event.stopPropagation(); showDetails(${JSON.stringify(item).replace(/'/g, "&apos;")}, "${exportingCountry}")'>
                                        <td class="row-number">${index + 1}</td>
                                        <td>
                                    <div class="hts-code-wrapper">
                                        <a
                                            href="https://hts.usitc.gov/search?query=${encodeURIComponent(item.htsno)}"
                                            target="_blank"
                                            class="hts-code-link"
                                            title="View HTS Code Structure on USITC Website"
                                            onclick="event.stopPropagation()"
                                        >
                                            ${item.htsno}
                                        </a>

                                        <button
                                            class="hts-info-btn"
                                            title="View details"
                                            onclick='event.stopPropagation(); showDetails(${JSON.stringify(item).replace(/'/g, "&apos;")}, "${exportingCountry}")'
                                        >
                                            i
                                        </button>
                                    </div>
                                </td>

                                        <td>${highlightedDescription}</td>
                                        <td>${getRateLabel(rateInfo.column)}</td>
                                        <td>${rateInfo.value}</td>
                                    </tr>
                                `;
                            });

                            html += `
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            `;
                        }

                        container.innerHTML = html;
                    }
  
                    function showDetails(item, exportingCountry) {
                        const modal = document.getElementById('detailModal');
                        const modalBody = document.getElementById('modalBody');
                        const htsCode = item.htsno;

                        const rateInfo = COUNTRY_ENGINE.getDutyRate(
                            item,
                            exportingCountry,
                            findParentWithRate
                        );
                        
                        let rate = rateInfo.value;
                        let rateType = getRateLabel(rateInfo.column);
                        let isInherited = rateInfo.inherited;
                        let inheritedFrom = null;

                        let breakdownHTML = '<div>';
                       

                        // Build hierarchy items
                        const hierarchyItems = [];
                        let currentIndent = parseInt(item.indent);
                        let currentIndex = masterData.indexOf(item);

                        for (let i = currentIndex; i >= 0; i--) {
                            const checkItem = masterData[i];
                            const checkIndent = parseInt(checkItem.indent);

                            // Only add if this item has a smaller indent than the previous
                            if (checkIndent < currentIndent) {
                                hierarchyItems.unshift(checkItem);
                                currentIndent = checkIndent;
                            }

                            // Always include the current item itself once
                            if (i === currentIndex && !hierarchyItems.includes(checkItem)) {
                                hierarchyItems.unshift(checkItem);
                            }

                            if (currentIndent === 0) break;
                        }

                        hierarchyItems.forEach(hierarchyItem => {
                            const indent = parseInt(hierarchyItem.indent);
                            const indentClass = `indent-${indent}`;
                            const isRateSource = inheritedFrom && hierarchyItem.htsno === inheritedFrom.htsno;

                            breakdownHTML += `<div class="hts-breakdown-item ${indentClass} ${isRateSource ? 'highlight-inherited' : ''}">
                                ${hierarchyItem.htsno ? `<strong>${hierarchyItem.htsno}:</strong> ` : ''}
                                ${hierarchyItem.description}
                                ${isRateSource ? ` <span class="rate-inherited">(Rate inherited from here)</span>` : ''}
                            </div>`;
                        });

                        breakdownHTML += '</div>';

                        // Add the expandable hierarchy container **before inserting into modal**
                        breakdownHTML += `
                            <div id="htsHierarchyContainer" style="margin-top:10px;">
                                <!-- Expandable hierarchy will be rendered here -->
                            </div>
                        `;

                        const rateHTML = `
                            <div class="rate-info">
                                <div><strong>Rate Type:</strong> ${rateType}</div>
                                <div><strong>Rate:</strong> ${rate} ${isInherited ? '<span class="rate-inherited">(inherited from parent)</span>' : ''}</div>
                                ${item.units && item.units.length > 0 ? `<div><strong>Units:</strong> ${item.units.join(', ')}</div>` : ''}
                            </div>
                        `;

                        // Insert everything into modalBody **once**
                        modalBody.innerHTML = breakdownHTML + rateHTML;

                        // Render expandable hierarchy inside the container
                        renderHTSHierarchy(htsCode);

                        modal.style.display = 'block';
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
    const isLocked = lockedInfoIcon === icon;

    // Close any previously locked info
    if (lockedInfoIcon && lockedInfoIcon !== icon) {
        lockedInfoIcon.classList.remove("open", "active");
    }

    if (isLocked) {
        // Unlock & close
        icon.classList.remove("open", "active");
        lockedInfoIcon = null;
        openInfoIcon = null;
        return;
    }

    // Lock this one
    icon.classList.add("open", "active");
    lockedInfoIcon = icon;
    openInfoIcon = icon;

    positionInfoTooltip(icon);
}

function showInfoOnHover(icon) {
    if (lockedInfoIcon) return; // ❌ don’t interfere with click-locked

    icon.classList.add("open");
    openInfoIcon = icon;
    positionInfoTooltip(icon);
}

function hideInfoOnHover(icon) {
    if (lockedInfoIcon === icon) return; // ❌ keep open if locked

    icon.classList.remove("open");
    openInfoIcon = null;
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
        if (categoryMenuOpen) {
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
   
                function toggleFilterMenu(eventOrFilter, maybeFilterType) {

                    let event;
                    let filterType;
                
                    // Called from addEventListener
                    if (eventOrFilter instanceof Event) {
                        event = eventOrFilter;
                        filterType = maybeFilterType;
                    } 
                    // Called from inline HTML onclick
                    else {
                        filterType = eventOrFilter;
                        event = window.event;
                    }
                
                    if (event && event.stopPropagation) {
                        event.stopPropagation();
                    }
                
                    const menu = document.getElementById(filterType + 'Menu');
                    if (!menu) return;
                
                    // Close other menus
                    if (openFilterMenu && openFilterMenu !== menu) {
                        openFilterMenu.classList.remove('show');
                    }
                
                    // Toggle current menu
                    menu.classList.toggle('show');
                    openFilterMenu = menu.classList.contains('show') ? menu : null;
                
                }

                function buildFilterMenu(filterType) {
                    const menu = document.getElementById(filterType + 'Menu');
                    if (!menu) return;
                    
                    const items = FILTER_DATA[filterType] || [];
                    const currentValue = selectedFilters[filterType] || 'All';
                    
                    menu.innerHTML = '';
                    
                    items.forEach(item => {
                        const div = document.createElement('div');
                        div.className = 'filter-menu-item';
                        if (item.value === currentValue) {
                            div.classList.add('selected');
                        }
                        div.textContent = item.label;
                        div.onclick = (e) => {
                            e.stopPropagation();
                            if (e.currentTarget.classList.contains('disabled')) return;
                            selectFilterItem(filterType, item.value, item.label);
                        };
                        menu.appendChild(div);
                    });
                }

                function selectFilterItem(filterType, value, label) {
                    closeLockedInfoTooltip();
                    selectedFilters[filterType] = value;
                    
                    const trigger = document.getElementById(filterType + 'Trigger');
                    // Don't add arrow if label already has it
                    trigger.textContent = label.includes('▾') ? label : label + ' ▾';
                    
                    // Close menu
                    const menu = document.getElementById(filterType + 'Menu');
                    menu.classList.remove('show');
                    openFilterMenu = null;

                    // Rebuild menu so the selected item is marked when reopened
                    if (filterType === 'country') {
                        buildCountriesFilter();
                    } else {
                        buildFilterMenu(filterType);
                    }
                    
                    // Special handling for country filter
                    if (filterType === 'country') {
                        selectedFilters.country = value;          // ⭐ MISSING LINE
                        selectedFilters.exportingCountry = value; // engine value
                        attemptAutoSearch();
                        return;
                    }
                    
                    
                    // Trigger search if needed
                    if (filterType === 'material') {
                        enforceMaterialNeutralUI(selectedFilters.category);
                        searchHTSByFilters();
                    }else if (filterType === 'gender') {

                        // 🔥 RESET category when gender changes
                        selectedFilters.uiMainCategory = '';
                        selectedFilters.category = '';

                        const trigger = document.querySelector(".category-trigger");
                        if (trigger) trigger.textContent = "Select Category ▾";

                        closeAllCategoryMenus();   // 🔥 add this

                        // 🔥 REBUILD CATEGORY MENU BASED ON GENDER
                        buildCategoryMenu();

                        // run search
                        searchHTSByFilters();
                    } else if (filterType === 'fabric') {
                        searchHTSByFilters();
                    } else if (filterType === 'feature') {
                        searchHTSByFilters();
                    }
                }

                function initializeFilterMenus() {
                    ['material', 'gender', 'importingCountry', 'fabric', 'feature'].forEach(filterType => {
                        buildFilterMenu(filterType);
                    });
                    
                    // Build countries filter after countries are loaded
                    if (allCountries.length > 0) {
                        buildCountriesFilter();
                    }
                }

                function buildCountriesFilter() {
                    const menu = document.getElementById('countryMenu');
                    const currentValue = selectedFilters.country || 'Select Country';
                
                    // ⭐ Add search box at top
                    menu.innerHTML = `
                        <input 
                            type="text"
                            id="countrySearchInput"
                            class="country-search"
                            placeholder="Type to search country..."
                            oninput="filterCountryMenu(this)"
                        />
                    `;
                
                    // ⭐ Add "Select Country" option
                    const selectOption = document.createElement('div');
                    selectOption.className = 'filter-menu-item country-reset';
                    selectOption.textContent = 'Select Country';
                    selectOption.onclick = () => selectFilterItem('country', '', 'Select Country');
                    menu.appendChild(selectOption);
                
                    // ⭐ Render countries list
                    allCountries.forEach(country => {
                        const div = document.createElement('div');
                        div.className = 'filter-menu-item';
                
                        if (country.name === currentValue) {
                            div.classList.add('selected');
                        }
                
                        div.textContent = country.name;
                        div.onclick = () => selectFilterItem('country', country.name, country.name);
                        menu.appendChild(div);
                    });
                }
                
                // 🔥 GLOBAL CAPTURE CLICK HANDLER (runs before stopPropagation)
document.addEventListener("click", (e) => {

    const clickedFilter = e.target.closest(".filter-trigger, .filter-menu");
    const clickedCategory = e.target.closest(".category-trigger, .category-menu");
    const clickedInfo = e.target.closest(".info-icon");

    // ✅ ALWAYS close locked tooltip when clicking ANYTHING except the icon
    if (!clickedInfo && lockedInfoIcon) {
        lockedInfoIcon.classList.remove("open", "active");
        lockedInfoIcon = null;
        openInfoIcon = null;
    }

    // Close filter menus
    if (!clickedFilter && openFilterMenu) {
        openFilterMenu.classList.remove("show");
        openFilterMenu = null;
    }

    // Close category menus
    if (!clickedCategory && categoryMenuOpen) {
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
                
                window.filterCountryMenu = function (input) {
                    const query = input.value.toLowerCase().trim();
                    const menu = document.getElementById('countryMenu');
                
                    const countries = Array.from(
                        menu.querySelectorAll('.filter-menu-item:not(.country-reset)')
                    );
                
                    // ⭐ If search empty → show all + reset order
                    if (!query) {
                        countries
                            .sort((a, b) => a.textContent.localeCompare(b.textContent))
                            .forEach(el => {
                                el.style.display = '';
                                menu.appendChild(el);
                            });
                        return;
                    }
                
                    // ⭐ Score + filter
                    const matches = [];
                
                    countries.forEach(el => {
                        const name = el.textContent.toLowerCase();
                
                        if (name.startsWith(query)) {
                            el.dataset.score = 2;
                            matches.push(el);
                        } 
                        else if (name.includes(query)) {
                            el.dataset.score = 1;
                            matches.push(el);
                        } 
                        else {
                            el.style.display = 'none'; // ❌ hide non match
                        }
                    });
                
                    // ⭐ Sort matches
                    matches.sort((a, b) => {
                        const scoreDiff = b.dataset.score - a.dataset.score;
                        if (scoreDiff !== 0) return scoreDiff;
                        return a.textContent.localeCompare(b.textContent);
                    });
                
                    // ⭐ Re-render matched list
                    matches.forEach(el => {
                        el.style.display = '';
                        menu.appendChild(el);
                    });
                };

// 🌍 expose UI functions for HTML onclick handlers
window.toggleFilterMenu = toggleFilterMenu;
window.resetAllFilters = resetAllFilters;
window.toggleHighlight = toggleHighlight;
window.toggleInfo = toggleInfo;
window.showInfoOnHover = showInfoOnHover;
window.hideInfoOnHover = hideInfoOnHover;
window.importJSON = importJSON;
window.closeModal = closeModal;
window.showDetails = showDetails;
window.copyHTSCode = copyHTSCode;

    initializeCountries();
    buildCategoryMenu();
    initializeFilterMenus();
    loadFlatFile();
    checkAdminMode();

