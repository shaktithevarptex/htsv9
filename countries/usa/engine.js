// countries/usa/engine.js

import { USA_TRADE_CONFIG } from "./config.js";

export const USA_ENGINE = {
    name: "USA",

    getImportingCountry() {
        return "USA";
    },

    // ⭐ NEW — give trade rules to app
    getTradeConfig() {
        return USA_TRADE_CONFIG;
    }
};
