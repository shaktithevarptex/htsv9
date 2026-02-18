import { appState, selectedFilters } from "../state/appState.js";

let FILTER_DATA = {};
let callbacks = {};


export function getFilterData(COUNTRY_ENGINE, cb = {}) {

    callbacks = cb; 
  
    FILTER_DATA = {
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
        {
          value: COUNTRY_ENGINE.getImportingCountry(),
          label: COUNTRY_ENGINE.getImportingCountry()
        }
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
  
    return FILTER_DATA;
  }
  

export function getFilterLabel(filterType, value) {
    const items = FILTER_DATA && FILTER_DATA[filterType];
    if (!items || !value) return value || 'All';
    const found = items.find(i => i.value === value);
    return found ? found.label : value;
}

export function toggleFilterMenu(eventOrFilter, maybeFilterType) {

                    let event;
                    let filterType;
                
                    if (eventOrFilter instanceof Event) {
                        event = eventOrFilter;
                        filterType = maybeFilterType;
                    } 

                    else {
                        filterType = eventOrFilter;
                        event = window.event;
                    }
                
                    if (event && event.stopPropagation) {
                        event.stopPropagation();
                    }
                
                    const menu = document.getElementById(filterType + 'Menu');
                    if (!menu) return;
                
                    if (appState.openFilterMenu && appState.openFilterMenu !== menu) {
                        appState.openFilterMenu.classList.remove('show');
                    }
                
                    menu.classList.toggle('show');
                    appState.openFilterMenu = menu.classList.contains('show') ? menu : null;
                
                }

export function buildFilterMenu(filterType) {
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

export function selectFilterItem(filterType, value, label) {
                                    callbacks.closeLockedInfoTooltip?.();
                                    selectedFilters[filterType] = value;
                                    
                                    const trigger = document.getElementById(filterType + 'Trigger');
                                    // Don't add arrow if label already has it
                                    trigger.textContent = label.includes('▾') ? label : label + ' ▾';
                                    
                                    // Close menu
                                    const menu = document.getElementById(filterType + 'Menu');
                                    menu.classList.remove('show');
                                    appState.openFilterMenu = null;
                
                                    // Rebuild menu so the selected item is marked when reopened
                                    if (filterType === 'country') {
                                        callbacks.buildCountriesFilter?.();
                                    } else {
                                        buildFilterMenu(filterType);
                                    }
                                    
                                    // Special handling for country filter
                                    if (filterType === 'country') {
                                        selectedFilters.country = value;          // ⭐ MISSING LINE
                                        selectedFilters.exportingCountry = value; // engine value
                                        callbacks.attemptAutoSearch?.();
                                        return;
                                    }
                                    
                                    
                                    // Trigger search if needed
                                    if (filterType === 'material') {
                                        callbacks.enforceMaterialNeutralUI?.(selectedFilters.category);
                                        callbacks.searchHTSByFilters?.();
                                    }else if (filterType === 'gender') {
                
                                        // 🔥 RESET category when gender changes
                                        selectedFilters.uiMainCategory = '';
                                        selectedFilters.category = '';
                
                                        const trigger = document.querySelector(".category-trigger");
                                        if (trigger) trigger.textContent = "Select Category ▾";
                
                                        callbacks.closeAllCategoryMenus?.();   // 🔥 add this
                
                                        // 🔥 REBUILD CATEGORY MENU BASED ON GENDER
                                        callbacks.buildCategoryMenu?.();
                
                                        // run search
                                        callbacks.searchHTSByFilters?.();
                                    } else if (filterType === 'fabric') {
                                        callbacks.searchHTSByFilters?.();
                                    } else if (filterType === 'feature') {
                                        callbacks.searchHTSByFilters?.();
                                    }
                                }

                                
export function initializeFilterMenus() {
    ['material', 'gender', 'importingCountry', 'fabric', 'feature'].forEach(filterType => {
        buildFilterMenu(filterType);
    });
    
    // Build countries filter after countries are loaded
    if (appState.allCountries.length > 0) {
        callbacks.buildCountriesFilter?.();
    }
}

// expose for inline HTML handlers
window.toggleFilterMenu = toggleFilterMenu;
window.selectFilterItem = selectFilterItem;


