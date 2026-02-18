import { appState, selectedFilters } from "../state/appState.js";

let callbacks = {};

export function initCountryMenu(cb = {}) {
  callbacks = cb;
}

export function buildCountriesFilter() {
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
                    selectOption.onclick = () =>
                        callbacks.selectFilterItem?.('country', '', 'Select Country');
                    menu.appendChild(selectOption);
                
                    // ⭐ Render countries list
                    appState.allCountries.forEach(country => {
                        const div = document.createElement('div');
                        div.className = 'filter-menu-item';
                
                        if (country.name === currentValue) {
                            div.classList.add('selected');
                        }
                
                        div.textContent = country.name;
                        div.onclick = () =>
                            callbacks.selectFilterItem?.('country', country.name, country.name);
                        menu.appendChild(div);
                    });
                }

export function filterCountryMenu(input) {             
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

    // expose for HTML input handler
window.filterCountryMenu = filterCountryMenu;
