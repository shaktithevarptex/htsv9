import { appState, selectedFilters } from "../state/appState.js";
import { buildCategoryMenu, closeAllCategoryMenus } from "./categoryMenu.js";
import { searchHTSByFilters } from "../engine/htsEngine.js";
import { getFilterLabel } from "../filters/filterEngine.js";

 export function clearResults() {
    document.getElementById('resultsContainer').innerHTML =
        '<div class="no-results">Filters reset. Please select category and country.</div>';
}

export function toggleHighlight() {

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

                
export function resetDropdownSelection(menuSelector, defaultValue = "All") {
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

export function resetAllFilters() {
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

window.resetAllFilters = resetAllFilters;
window.toggleHighlight = toggleHighlight;
