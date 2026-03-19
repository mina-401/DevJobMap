var JobList = {
    activeFilters: ['all'],
    urgentFilterActive: false,
    minSalaryFilter: 0,
    typeFilter: 'all',
    expFilter: 'all',       // 'all' | '신입' | '1-3' | '3+' | '5+'
    searchQuery: '',

    init: function() {
        this.renderGrid();
        this.bindFilters();
    },

    getFiltered: function() {
        var self = this;
        return COMPANY_DATA.filter(function(c) {
            var matchCategory = self.activeFilters.includes('all') || self.activeFilters.includes(c.industry);
            var matchUrgent   = !self.urgentFilterActive || c.deadline === '상시채용';
            var matchSalary   = c.minSalary >= self.minSalaryFilter;
            var matchType     = self.typeFilter === 'all' || c.type === self.typeFilter;

            // 경력 필터
            var matchExp = true;
            if (self.expFilter === '신입')  matchExp = c.expMin === 0;
            else if (self.expFilter === '1-3') matchExp = c.expMin >= 1 && c.expMin < 3;
            else if (self.expFilter === '3+')  matchExp = c.expMin >= 3 && c.expMin < 5;
            else if (self.expFilter === '5+')  matchExp = c.expMin >= 5;

            var q = self.searchQuery.trim().toLowerCase();
            var matchSearch = q === ''
                || c.name.toLowerCase().includes(q)
                || c.position.toLowerCase().includes(q)
                || c.tags.some(function(t) { return t.toLowerCase().includes(q); });

            return matchCategory && matchUrgent && matchSalary && matchType && matchExp && matchSearch;
        });
    },

    renderGrid: function() {
        var grid = document.getElementById('jobs-grid');
        var filtered = this.getFiltered();

        document.getElementById('list-subtitle').textContent = '총 ' + filtered.length + '개의 채용공고가 있습니다';
        grid.innerHTML = '';

        filtered.forEach(function(company) {
            var stars    = '★'.repeat(Math.floor(company.rating)) + '☆'.repeat(5 - Math.floor(company.rating));
            var isUrgent = company.deadline === '상시채용';

            grid.insertAdjacentHTML('beforeend',
                '<div class="job-card">' +
                    '<div class="card-top">' +
                        '<div class="company-logo">' + company.logo + '</div>' +
                        '<div class="card-info">' +
                            '<div class="company-name">' + company.name + ' · ' + company.industry + '</div>' +
                            '<div class="job-title">' + company.position + '</div>' +
                        '</div>' +
                        '<button class="bookmark-btn" onclick="this.classList.toggle(\'active\')">🔖</button>' +
                    '</div>' +
                    '<div class="card-meta">' +
                        '<span class="meta-item">' + company.experience + '</span>' +
                        '<span class="meta-dot"></span>' +
                        '<span class="meta-item">' + company.type + '</span>' +
                        '<span class="meta-dot"></span>' +
                        '<span class="meta-item">' + company.address + '</span>' +
                    '</div>' +
                    '<div class="salary-row">' +
                        '<span class="salary">' + company.salary + '</span>' +
                        '<span class="deadline' + (isUrgent ? ' urgent' : '') + '">' + (isUrgent ? '🔥 상시채용' : '~' + company.deadline) + '</span>' +
                    '</div>' +
                    '<div class="tag-list">' +
                        company.tags.map(function(t, i) {
                            return '<span class="tag' + (i === 0 ? ' highlight' : '') + '">' + t + '</span>';
                        }).join('') +
                    '</div>' +
                    '<div class="rating-row">' +
                        '<span class="stars">' + stars + '</span>' +
                        '<span class="rating-score">' + company.rating + '</span>' +
                    '</div>' +
                    '<a href="job-detail.html?id=' + company.id + '" class="view-detail-btn">상세보기</a>' +
                '</div>'
            );
        });
    },

    bindFilters: function() {
        var self = this;

        // ─── 검색 ───
        var searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', function() {
                self.searchQuery = this.value;
                self.renderGrid();
            });
        }

        // ─── 카테고리 / 상시채용 칩 ───
        document.querySelectorAll('.filter-chip').forEach(function(chip) {
            chip.addEventListener('click', function() {
                var group  = this.dataset.filterGroup;
                var filter = this.dataset.filter;

                if (group === 'category') {
                    this.classList.toggle('active');
                    if (filter === 'all') {
                        if (this.classList.contains('active')) {
                            document.querySelectorAll('.filter-chip[data-filter-group="category"]').forEach(function(c) {
                                if (c.dataset.filter !== 'all') c.classList.remove('active');
                            });
                            self.activeFilters = ['all'];
                        } else {
                            this.classList.add('active');
                            self.activeFilters = ['all'];
                        }
                    } else {
                        document.querySelectorAll('.filter-chip[data-filter-group="category"]').forEach(function(c) {
                            if (c.dataset.filter === 'all') c.classList.remove('active');
                        });
                        self.activeFilters = [];
                        document.querySelectorAll('.filter-chip[data-filter-group="category"].active').forEach(function(c) {
                            self.activeFilters.push(c.dataset.filter);
                        });
                        if (self.activeFilters.length === 0) {
                            document.querySelector('.filter-chip[data-filter="all"]').classList.add('active');
                            self.activeFilters = ['all'];
                        }
                    }
                } else if (group === 'special') {
                    this.classList.toggle('active');
                    self.urgentFilterActive = this.classList.contains('active');
                }

                self.renderGrid();
            });
        });

        // ─── 연봉 드롭다운 ───
        var salaryTrigger = document.getElementById('salary-trigger');
        var salaryMenu    = document.getElementById('salary-menu');

        salaryTrigger.addEventListener('click', function(e) {
            e.stopPropagation();
            var isOpen = salaryMenu.classList.contains('open');
            closeAllDropdowns();
            if (!isOpen) {
                this.classList.add('open');
                salaryMenu.classList.add('open');
            }
        });

        salaryMenu.querySelectorAll('.dropdown-item').forEach(function(item) {
            item.addEventListener('click', function() {
                salaryMenu.querySelectorAll('.dropdown-item').forEach(function(i) { i.classList.remove('selected'); });
                this.classList.add('selected');

                self.minSalaryFilter = Number(this.dataset.salary);
                var label = this.dataset.salary === '0' ? '연봉' : this.textContent.trim();
                salaryTrigger.childNodes[0].textContent = label + ' ';
                salaryTrigger.classList.toggle('active', this.dataset.salary !== '0');

                salaryTrigger.classList.remove('open');
                salaryMenu.classList.remove('open');
                self.renderGrid();
            });
        });

        // ─── 고용형태 드롭다운 ───
        var typeTrigger = document.getElementById('type-trigger');
        var typeMenu    = document.getElementById('type-menu');

        typeTrigger.addEventListener('click', function(e) {
            e.stopPropagation();
            var isOpen = typeMenu.classList.contains('open');
            closeAllDropdowns();
            if (!isOpen) {
                this.classList.add('open');
                typeMenu.classList.add('open');
            }
        });

        typeMenu.querySelectorAll('.dropdown-item').forEach(function(item) {
            item.addEventListener('click', function() {
                typeMenu.querySelectorAll('.dropdown-item').forEach(function(i) { i.classList.remove('selected'); });
                this.classList.add('selected');

                self.typeFilter = this.dataset.type;
                var label = this.dataset.type === 'all' ? '고용형태' : this.textContent.trim();
                typeTrigger.childNodes[0].textContent = label + ' ';
                typeTrigger.classList.toggle('active', this.dataset.type !== 'all');

                typeTrigger.classList.remove('open');
                typeMenu.classList.remove('open');
                self.renderGrid();
            });
        });

        // ─── 경력 드롭다운 ───
        var expTrigger = document.getElementById('exp-trigger');
        var expMenu    = document.getElementById('exp-menu');

        expTrigger.addEventListener('click', function(e) {
            e.stopPropagation();
            var isOpen = expMenu.classList.contains('open');
            closeAllDropdowns();
            if (!isOpen) {
                this.classList.add('open');
                expMenu.classList.add('open');
            }
        });

        expMenu.querySelectorAll('.dropdown-item').forEach(function(item) {
            item.addEventListener('click', function() {
                expMenu.querySelectorAll('.dropdown-item').forEach(function(i) { i.classList.remove('selected'); });
                this.classList.add('selected');

                self.expFilter = this.dataset.exp;
                var label = this.dataset.exp === 'all' ? '경력' : this.textContent.trim();
                expTrigger.childNodes[0].textContent = label + ' ';
                expTrigger.classList.toggle('active', this.dataset.exp !== 'all');

                expTrigger.classList.remove('open');
                expMenu.classList.remove('open');
                self.renderGrid();
            });
        });

        // ─── 공통: 드롭다운 닫기 ───
        function closeAllDropdowns() {
            [salaryTrigger, typeTrigger, expTrigger].forEach(function(t) { t.classList.remove('open'); });
            [salaryMenu, typeMenu, expMenu].forEach(function(m) { m.classList.remove('open'); });
        }

        document.addEventListener('click', function() { closeAllDropdowns(); });
    }
};

JobList.init();