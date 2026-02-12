import { USA_TRADE_CONFIG } from "./config.js";

export const USA_ENGINE = {
    name: "USA",

    getImportingCountry() {
        return "USA";
    },

    getTradeConfig() {
        return USA_TRADE_CONFIG;
    },

    // ⭐ PRIVATE — decide which duty column applies
    getRateColumn(countryName) {
        const trade = this.getTradeConfig();

        if (trade.column2Countries.includes(countryName)) {
            return "other";      // Column 2
        }

        if (trade.specialCountries.some(c => c.name === countryName)) {
            return "special";    // FTA / Preferential
        }

        return "general";        // MFN
    },

    // ⭐ PRIVATE — inherit rate from parent nodes
    inheritRate(item, rateField, findParentWithRateFn) {
        const parent = findParentWithRateFn(item, rateField);

        if (!parent) return null;

        return parent[rateField] || null;
    },

    // ⭐ MAIN ENGINE FUNCTION (UI will call ONLY this)
    getDutyRate(item, exportingCountry, findParentWithRateFn) {

        const rateField = this.getRateColumn(exportingCountry);

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