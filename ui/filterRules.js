import { selectedFilters } from "../state/appState.js";
import { getFilterLabel } from "../filters/filterEngine.js";
import {MATERIAL_NEUTRAL_CATEGORIES,GENDER_NEUTRAL_CATEGORIES} from "../constants/genderRules.js";
import { normalizeText } from "../engine/htsEngine.js";

export function enforceMaterialNeutralUI(category) {
    const materialSelect = document.getElementById("materialFilter");
    const materialTrigger = document.getElementById('materialTrigger');
    const materialMenu = document.getElementById('materialMenu');
    const materialNote = document.getElementById("materialNote");

    const isNeutral = MATERIAL_NEUTRAL_CATEGORIES.has(normalizeText(category));

    if (!category) {
        // No category selected: restore UI to current selection
        if (materialSelect) {
            try { materialSelect.disabled = false; } catch(e){}
        }
        if (materialTrigger) {
            materialTrigger.textContent = getFilterLabel('material', selectedFilters.material) + ' ▾';
        }
        if (materialMenu) {
            materialMenu.querySelectorAll('.filter-menu-item.disabled').forEach(i => i.classList.remove('disabled'));
        }
        if (materialNote) materialNote.classList.remove('show');
        return;
    }

    if (isNeutral) {
        // Force material to All when category is material-neutral
        selectedFilters.material = 'All';
        if (materialSelect) {
            try { materialSelect.value = 'All'; materialSelect.disabled = true; } catch(e){}
        }
        if (materialTrigger) materialTrigger.textContent = getFilterLabel('material', selectedFilters.material) + ' ▾';
        if (materialMenu) {
            materialMenu.querySelectorAll('.filter-menu-item').forEach(item => {
                if (!/All/i.test(item.textContent)) item.classList.add('disabled');
            });
        }
        if (materialNote) {
            materialNote.innerHTML = 'Classified mainly by article type & fiber content, regardless of knit/woven construction';
            materialNote.classList.add('show');
        }
    } else {
        // Not neutral: restore material selection (do not overwrite user's choice)
        if (materialSelect) {
            try { materialSelect.disabled = false; } catch(e){}
        }
        if (materialTrigger) materialTrigger.textContent = getFilterLabel('material', selectedFilters.material) + ' ▾';
        if (materialMenu) {
            materialMenu.querySelectorAll('.filter-menu-item.disabled').forEach(i => i.classList.remove('disabled'));
        }
        if (materialNote) materialNote.classList.remove('show');
    }
}


export function enforceGenderNeutralUI(category) {
    const genderSelect = document.getElementById("genderFilter");
    const genderTrigger = document.getElementById('genderTrigger');
    const genderMenu = document.getElementById('genderMenu');
    const genderNote = document.getElementById("genderNote");

    const safeEnableAllLegacy = () => {
        if (genderSelect && genderSelect.options) {
            try { Array.from(genderSelect.options).forEach(o => o.disabled = false); } catch (e) {}
        }
    };

    if (!category) {
        // 🔄 RESET STATE
        safeEnableAllLegacy();
        if (genderTrigger) genderTrigger.textContent = getFilterLabel('gender', selectedFilters.gender) + ' ▾';
        if (genderMenu) genderMenu.querySelectorAll('.filter-menu-item.disabled').forEach(i => i.classList.remove('disabled'));
        if (genderNote) genderNote.style.display = "none";
        return;
    }

    const isNeutral = GENDER_NEUTRAL_CATEGORIES.has(normalizeText(category));

    if (!isNeutral) {
        if (selectedFilters.uiMainCategory !== "Accessories") {
            safeEnableAllLegacy();
            if (genderMenu) genderMenu.querySelectorAll('.filter-menu-item.disabled').forEach(i => i.classList.remove('disabled'));
            if (genderNote) genderNote.style.display = "none";
        }
        return;
    }

    // For neutral categories, force All
    selectedFilters.gender = "All";
    if (genderSelect) {
        try { genderSelect.value = 'All'; } catch(e) {}
    }
    if (genderTrigger) genderTrigger.textContent = getFilterLabel('gender', selectedFilters.gender) + ' ▾';

    if (genderSelect && genderSelect.options) {
        try { Array.from(genderSelect.options).forEach(o => { o.disabled = o.value !== 'All'; }); } catch(e) {}
    }

    if (genderMenu) {
        genderMenu.querySelectorAll('.filter-menu-item').forEach(item => {
            if (!/All/i.test(item.textContent)) item.classList.add('disabled');
        });
    }

    if (genderNote) {
        genderNote.innerHTML = "Women foundation garments / gender-neutral support accessories";
        genderNote.style.display = "block";
    }
}

export function handleAccessoriesGenderRule(mainCategory) {
    const genderSelect = document.getElementById('genderFilter');
    const genderTrigger = document.getElementById('genderTrigger');
    const genderMenu = document.getElementById('genderMenu');
    const genderNote = document.getElementById('genderNote');

    if (mainCategory === "Accessories") {
        // 🔒 Force gender = All
        selectedFilters.gender = 'All';

        // If legacy <select> exists, update it
        if (genderSelect) {
            try {
                genderSelect.value = 'All';
                Array.from(genderSelect.options).forEach(opt => {
                    opt.disabled = opt.value !== 'All';
                });
            } catch (e) {
                console.warn('Could not update legacy gender select', e);
            }
        }

        // If new custom trigger exists, update its text
        if (genderTrigger) {
            genderTrigger.textContent = getFilterLabel('gender', selectedFilters.gender) + ' ▾';
        }

        // Optionally mark non-All items in custom menu as disabled (visual only)
        if (genderMenu) {
            genderMenu.querySelectorAll('.filter-menu-item').forEach(item => {
                if (!/All/i.test(item.textContent)) item.classList.add('disabled');
            });
        }

        if (genderNote) {
            genderNote.innerHTML = 'Gender filter is disabled for <b>Accessories (HTS-unisex category)</b>';
            genderNote.style.display = 'block';
        }

    } else {
        // 🔓 Restore normal behavior
        if (genderSelect) {
            try {
                Array.from(genderSelect.options).forEach(opt => {
                    opt.disabled = false;
                });
            } catch (e) {
                console.warn('Could not restore legacy gender select', e);
            }
        }

        if (genderMenu) {
            genderMenu.querySelectorAll('.filter-menu-item.disabled').forEach(item => {
                item.classList.remove('disabled');
            });
        }

        // ❌ Hide note for other categories
        if (genderNote) {
            genderNote.style.display = 'none';
            genderNote.innerHTML = '';
        }
    }
}
