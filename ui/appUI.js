import { appState } from "../state/appState.js";
import { COUNTRY_CODE_MAP } from "../countries/usa/countryCodes.js";
import { buildCountriesFilter } from "./countryMenu.js";

let COUNTRY_ENGINE = null;

export function initAppUI(engine) {
  COUNTRY_ENGINE = engine;
}


export function showStatus(message, isError = false) {
    const statusDiv = document.getElementById('statusMessage');
    statusDiv.textContent = message;
    statusDiv.className = 'status-message ' + (isError ? 'status-error' : 'status-success');
    statusDiv.style.display = 'block';
    setTimeout(() => {
        statusDiv.style.display = 'none';
    }, 3000);
}

export function checkAdminMode() {
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

export function initializeCountries() {
        // 🌍 All countries from ISO map (real world list)
        const countries = Object.keys(COUNTRY_CODE_MAP);
    
        appState.allCountries = countries
            .sort((a, b) => a.localeCompare(b))
            .map(name => ({ name }));
    
        buildCountriesFilter();
    }

export async function loadFlatFile() {
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