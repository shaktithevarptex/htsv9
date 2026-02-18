import { appState, selectedFilters } from "../state/appState.js";
import { MAIN_CATEGORY_MAP, categoryDescriptions } from "../constants/categories.js";
import { CBP_APPAREL_PDF } from "../constants/config.js";

let callbacks = {};

export function initCategoryMenu(cb = {}) {
  callbacks = cb;
}


export function getVisibleMainCategories() {

                    // If Babies selected → only show Babies category
                    if (selectedFilters.gender === "Babies") {
                        return {
                            "Babies & Infant Wear": MAIN_CATEGORY_MAP["Babies & Infant Wear"]
                        };
                    }

                    // Otherwise show everything
                    return MAIN_CATEGORY_MAP;
                }

export function closeAllCategoryMenus() {
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
                appState.openFilterMenu = null;

                appState.categoryMenuOpen = false; // 🔑 REQUIRED

                // Temporarily suppress hover handlers to avoid immediate submenu reopen
                appState.suppressCategoryHover = true;
                setTimeout(() => { appState.suppressCategoryHover = false; }, 250);
            }

export function hideAllSubmenus() {
    document.querySelectorAll(".submenu").forEach(sm => {
        sm.style.display = "none";
    });
}

export function buildCategoryMenu() {
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
                            if (appState.suppressCategoryHover) return;
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

 export function handleCategorySelection(mainCategory, productCategory) {
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
                            const key = callbacks.normalizeText?.(productCategory);


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
                        callbacks.handleAccessoriesGenderRule?.(mainCategory);

                        callbacks.enforceGenderNeutralUI?.(productCategory);
                        callbacks.enforceMaterialNeutralUI?.(productCategory);

                        // Rebuild affected filter menus so UI reflects forced 'All' or restored state
                        try { callbacks.buildFilterMenu?.('gender'); } catch (e) {}
                        try { callbacks.buildFilterMenu?.('material'); } catch (e) {}

                        // Trigger search
                        callbacks.searchHTSByFilters?.();
                    } catch (err) {
                        console.error('Error handling category selection:', err);
                    } finally {
                        // Always close menus and reset state
                        try { closeAllCategoryMenus(); } catch (closeErr) { console.error('Error closing category menus:', closeErr); }
                    }
                }

                  