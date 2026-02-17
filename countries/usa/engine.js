import { USA_TRADE_CONFIG } from "./config.js";
import { COUNTRY_CODE_MAP } from "./countryCodes.js";
import { USA_PROGRAM_COUNTRIES } from "./programCountries.js";


export const USA_ENGINE = {
    name: "USA",

    getImportingCountry() {
        return "USA";
    },

    getTradeConfig() {
        return USA_TRADE_CONFIG;
    },

    getRateColumn(countryName, item, findParentWithRateFn) {

        if (!item) return "general";
    
        const trade = this.getTradeConfig();
    
        // 1️⃣ Column 2 sanctions (highest priority)
        if (trade.column2Countries.includes(countryName)) {
            return "other";
        }
    
        // ISO code (AF, JO, AU etc)
        const iso = COUNTRY_CODE_MAP[countryName];
        if (!iso) return "general";
    
        // 2️⃣ Get SPECIAL column text (inherit if empty)
        let specialText = item.special || "";
    
        if (!specialText || specialText === "N/A") {
            const parent = findParentWithRateFn?.(item, "special");
            if (parent?.special) specialText = parent.special;
        }
    
        if (!specialText) return "general";
    
        specialText = specialText.toUpperCase();
    
        // 3️⃣ Direct FTA match (JO, AU, SG, S, P etc)
        const isoRegex = new RegExp(`\\b${iso}\\b`, "i");
        if (isoRegex.test(specialText)) {
            return "special";
        }
    
        // 4️⃣ Program match (loop through USA_PROGRAM_COUNTRIES)
        for (const [programCode, countries] of Object.entries(USA_PROGRAM_COUNTRIES)) {
    
            // is this country part of this program?
            if (!countries.includes(countryName)) continue;
    
            // does the HS row allow this program?
            const progRegex = new RegExp(`\\b${programCode}\\b`, "i");
            if (progRegex.test(specialText)) {
                return "special";
            }
        }
    
        // 5️⃣ fallback → General column
        return "general";
    },
    

    // ⭐ PRIVATE — inherit rate from parent nodes
    inheritRate(item, rateField, findParentWithRateFn) {
        const parent = findParentWithRateFn(item, rateField);

        if (!parent) return null;

        return parent[rateField] || null;
    },

    // ⭐ MAIN ENGINE FUNCTION (UI will call ONLY this)
    getDutyRate(item, exportingCountry, findParentWithRateFn) {

        // 🛡️ SAFETY GUARD (VERY IMPORTANT)
        if (!item) {
            return {
                value: "N/A",
                inherited: false,
                column: "general"
            };
        }
    
        const rateField = this.getRateColumn(exportingCountry, item, findParentWithRateFn);
    
        let rate = item[rateField];
    
        if (!rate || rate === "" || rate === "N/A") {
            const inheritedRate = this.inheritRate(item, rateField, findParentWithRateFn);
    
            if (inheritedRate) {
                return {
                    value: inheritedRate,
                    inherited: true,
                    column: rateField
                };
            }
    
            return {
                value: "N/A",
                inherited: false,
                column: rateField
            };
        }
    
        return {
            value: rate,
            inherited: false,
            column: rateField
        };
    }
};