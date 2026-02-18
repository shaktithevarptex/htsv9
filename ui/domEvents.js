// DOM Events Module
// Handles ALL event listeners & window bindings

import { appState, selectedFilters } from "../state/appState.js";
import { toggleFilterMenu } from "../filters/filterEngine.js";
import { closeAllCategoryMenus } from "./categoryMenu.js";

let deps = {};

export function initDOMEvents(callbacks) {
  deps = callbacks;
}

export function setupCategoryTrigger() {
    const categoryTrigger = document.querySelector(".category-trigger");
    const categoryMenu = document.getElementById("categoryMenu");

    categoryTrigger.addEventListener("click", e => {
        e.stopPropagation();

        document.querySelectorAll(".filter-menu.show").forEach(menu => {
            menu.classList.remove("show");
        });
        appState.openFilterMenu = null;

        if (appState.categoryMenuOpen) {
            closeAllCategoryMenus();
            return;
        }

        categoryMenu.style.display = "block";
        appState.categoryMenuOpen = true;
    });
}

export function setupFilterTriggers() {
    document.querySelectorAll(".filter-trigger").forEach(trigger => {
        trigger.addEventListener("click", e => {
            e.stopPropagation();

            deps.closeLockedInfoTooltip();

            if (appState.categoryMenuOpen) {
                closeAllCategoryMenus();
            }

            toggleFilterMenu(trigger);
        });
    });
}

export function setupGlobalClickCloser() {
    document.addEventListener("click", (e) => {

        const clickedFilter = e.target.closest(".filter-trigger, .filter-menu");
        const clickedCategory = e.target.closest(".category-trigger, .category-menu");
        const clickedInfo = e.target.closest(".info-icon");

        if (!clickedInfo && appState.lockedInfoIcon) {
            appState.lockedInfoIcon.classList.remove("open", "active");
            appState.lockedInfoIcon = null;
            appState.openInfoIcon = null;
        }

        if (!clickedFilter && appState.openFilterMenu) {
            appState.openFilterMenu.classList.remove("show");
            appState.openFilterMenu = null;
        }

        if (!clickedCategory && appState.categoryMenuOpen) {
            closeAllCategoryMenus();
        }

    }, true);
}
