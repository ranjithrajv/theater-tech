class FilterManager {
    constructor() {
        this.filters = {
            city: [],
            plf_format: [],
            projection_type: [],
            sound_format: [],
            seating_min: null,
            seating_max: null,
            search: ''
        };

        this.allScreens = [];
        this.filteredScreens = [];
        this.listeners = [];
        this.container = null;
        this.boundOnChange = this.onFilterChange.bind(this);
    }

    init(containerSelector = '#filter-bar') {
        this.container = document.querySelector(containerSelector);
        if (!this.container) {
            console.warn('Filter bar container not found');
            return;
        }
        this.render();
    }

    setData(screens) {
        this.allScreens = screens || [];
        this.applyFilters();
    }

    onFilterChange() {
        this.collectFilterValues();
        this.applyFilters();
    }

    collectFilterValues() {
        if (!this.container) return;

        const cityEls = this.container.querySelectorAll('input[name="city"]:checked');
        this.filters.city = Array.from(cityEls).map(el => el.value);

        const plfEls = this.container.querySelectorAll('input[name="plf_format"]:checked');
        this.filters.plf_format = Array.from(plfEls).map(el => el.value);

        const projEls = this.container.querySelectorAll('input[name="projection_type"]:checked');
        this.filters.projection_type = Array.from(projEls).map(el => el.value);

        const soundEls = this.container.querySelectorAll('input[name="sound_format"]:checked');
        this.filters.sound_format = Array.from(soundEls).map(el => el.value);

        const seatingMin = this.container.querySelector('#filter-seating-min');
        this.filters.seating_min = seatingMin ? (parseInt(seatingMin.value) || null) : null;

        const seatingMax = this.container.querySelector('#filter-seating-max');
        this.filters.seating_max = seatingMax ? (parseInt(seatingMax.value) || null) : null;

        const search = this.container.querySelector('#filter-search');
        this.filters.search = search ? search.value.toLowerCase().trim() : '';
    }

    applyFilters() {
        this.filteredScreens = this.allScreens.filter(screen => {
            if (this.filters.city.length > 0 &&
                !this.filters.city.includes(screen.city)) return false;

            if (this.filters.plf_format.length > 0 &&
                !this.filters.plf_format.includes(screen.plf_format)) return false;

            const projType = screen.projection?.type;
            if (this.filters.projection_type.length > 0 &&
                !this.filters.projection_type.includes(projType)) return false;

            const soundFmt = screen.sound_system?.format;
            if (this.filters.sound_format.length > 0 &&
                !this.filters.sound_format.includes(soundFmt)) return false;

            if (this.filters.seating_min !== null &&
                (screen.seating_capacity < this.filters.seating_min)) return false;

            if (this.filters.seating_max !== null &&
                (screen.seating_capacity > this.filters.seating_max)) return false;

            if (this.filters.search) {
                const q = this.filters.search;
                const name = (screen.name || '').toLowerCase();
                const chain = (screen.chain || '').toLowerCase();
                const location = (screen.location || '').toLowerCase();
                const city = (screen.city || '').toLowerCase();
                const theater = (screen.theater_name || '').toLowerCase();
                if (!name.includes(q) && !chain.includes(q) && !location.includes(q) && !city.includes(q) && !theater.includes(q)) return false;
            }

            return true;
        });

        this.updateCount();
        this.notifyListeners();
    }

    updateCount() {
        const countEl = this.container?.querySelector('#filter-count');
        if (countEl) {
            countEl.textContent = `${this.filteredScreens.length} of ${this.allScreens.length} screens`;
        }
    }

    getFilteredData() {
        return this.filteredScreens;
    }

    onChange(callback) {
        this.listeners.push(callback);
    }

    notifyListeners() {
        const data = this.getFilteredData();
        this.listeners.forEach(cb => cb(data));
    }

    reset() {
        if (!this.container) return;
        this.container.querySelectorAll('input[type="checkbox"]').forEach(el => el.checked = false);
        this.container.querySelectorAll('input[type="number"]').forEach(el => el.value = '');
        const search = this.container.querySelector('#filter-search');
        if (search) search.value = '';
        this.onFilterChange();
    }

    getUniqueValues(field) {
        return [...new Set(this.allScreens.map(s => {
            if (field === 'projection_type') return s.projection?.type;
            if (field === 'sound_format') return s.sound_system?.format;
            return s[field];
        }).filter(Boolean))].sort();
    }

    render() {
        if (!this.container) return;

        const cities = this.getUniqueValues('city');
        const plfFormats = this.getUniqueValues('plf_format');
        const projTypes = this.getUniqueValues('projection_type');
        const soundFormats = this.getUniqueValues('sound_format');

        this.container.innerHTML = `
            <div class="filter-bar">
                <div class="filter-row">
                    <div class="filter-group">
                        <label class="filter-group-label">City</label>
                        <div class="filter-checkboxes">
                            ${cities.map(f => `
                                <label class="filter-checkbox">
                                    <input type="checkbox" name="city" value="${f}" />
                                    <span>${f}</span>
                                </label>
                            `).join('')}
                        </div>
                    </div>
                    <div class="filter-group">
                        <label class="filter-group-label">Search</label>
                        <input type="text" id="filter-search" class="filter-input" placeholder="Search theaters..." />
                    </div>
                    <div class="filter-group">
                        <label class="filter-group-label">PLF Format</label>
                        <div class="filter-checkboxes">
                            ${plfFormats.map(f => `
                                <label class="filter-checkbox">
                                    <input type="checkbox" name="plf_format" value="${f}" />
                                    <span>${f}</span>
                                </label>
                            `).join('')}
                        </div>
                    </div>
                    <div class="filter-group">
                        <label class="filter-group-label">Projection</label>
                        <div class="filter-checkboxes">
                            ${projTypes.map(f => `
                                <label class="filter-checkbox">
                                    <input type="checkbox" name="projection_type" value="${f}" />
                                    <span>${f}</span>
                                </label>
                            `).join('')}
                        </div>
                    </div>
                    <div class="filter-group">
                        <label class="filter-group-label">Sound</label>
                        <div class="filter-checkboxes">
                            ${soundFormats.map(f => `
                                <label class="filter-checkbox">
                                    <input type="checkbox" name="sound_format" value="${f}" />
                                    <span>${f}</span>
                                </label>
                            `).join('')}
                        </div>
                    </div>
                    <div class="filter-group">
                        <label class="filter-group-label">Seating</label>
                        <div class="filter-range">
                            <input type="number" id="filter-seating-min" class="filter-input filter-input-sm" placeholder="Min" min="0" />
                            <span class="filter-range-sep">—</span>
                            <input type="number" id="filter-seating-max" class="filter-input filter-input-sm" placeholder="Max" min="0" />
                        </div>
                    </div>
                </div>
                <div class="filter-footer">
                    <span id="filter-count" class="filter-count"></span>
                    <button type="button" class="filter-clear-btn" id="filter-clear">Clear Filters</button>
                </div>
            </div>
        `;

        this.container.querySelectorAll('input').forEach(el => {
            el.addEventListener('change', this.boundOnChange);
            el.addEventListener('input', this.boundOnChange);
        });

        const clearBtn = this.container.querySelector('#filter-clear');
        if (clearBtn) clearBtn.addEventListener('click', () => this.reset());

        this.applyFilters();
    }

    destroy() {
        this.listeners = [];
        if (this.container) {
            this.container.querySelectorAll('input').forEach(el => {
                el.removeEventListener('change', this.boundOnChange);
                el.removeEventListener('input', this.boundOnChange);
            });
        }
    }
}

const Filters = new FilterManager();

if (typeof window !== 'undefined') {
    window.Filters = Filters;
}

export { FilterManager, Filters };
