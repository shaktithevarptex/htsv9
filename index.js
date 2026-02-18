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
import {showCopied,fallbackCopy,closeModal,registerModalBackdropClose} from "./ui/helpers.js";
import { initTooltips, bindInfoIconClicks, toggleInfo, showInfoOnHover, hideInfoOnHover } from "./ui/tooltips.js";

import { initMiscUI } from "./ui/miscUi.js";


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

      initTooltips(getActiveCategoryAlert);
      initDOMEvents({
        closeLockedInfoTooltip,
        toggleInfo   // ⭐ give domEvents access to tooltip click handler
    });
    

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
window.showDetails = showDetails;


selectedFilters.importingCountry = COUNTRY_ENGINE.getImportingCountry();
  
    setupCategoryTrigger();
    setupFilterTriggers();
    setupGlobalClickCloser();
    bindInfoIconClicks();   // ⭐ THIS IS THE FIX

  
    initializeCountries();
    buildCategoryMenu();
    initializeFilterMenus();
    loadFlatFile();
    checkAdminMode();
    registerModalBackdropClose();


