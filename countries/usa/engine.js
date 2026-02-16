import { USA_TRADE_CONFIG } from "./config.js";
import { COUNTRY_CODE_MAP } from "./countryCodes.js";
import { USA_SPECIAL_CODES } from "./specialCountries.js";



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
    
        // 1️⃣ Column 2 always wins (sanctions)
        if (trade.column2Countries.includes(countryName)) {
            return "other";
        }
    
                // Get ISO code once
        const code = COUNTRY_CODE_MAP[countryName];
        if (!code) return "general";

        // 2️⃣ GLOBAL SPECIAL COUNTRIES (ISO based) 🔥
        if (USA_SPECIAL_CODES.includes(code)) {
            return "special";
        }

        // 3️⃣ Existing SPECIAL column text logic (per-HS code)

    
        let specialText = item.special || "";
    
        if (!specialText || specialText === "N/A") {
            const parent = findParentWithRateFn?.(item, "special");
            if (parent && parent.special) {
                specialText = parent.special;
            }
        }
    
        if (!specialText) return "general";
    
        const regex = new RegExp(`\\b${code}\\b`, "i");
    
        if (regex.test(specialText)) {
            return "special";
        }
    
        // 4️⃣ fallback
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