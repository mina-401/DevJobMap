var CompanyMap = {
    map: null,
    lat: null,
    lng: null,
    markers: [],
    circle: null,
    activeFilters: ['all'],
    urgentFilterActive: false,
    minSalaryFilter: 0,
    typeFilter: 'all',
    maxDistanceFilter: 1500, // 기본 반경 = 초기 원(1500m)과 동기화
    searchQuery: '',
    expFilter: 'all',       // 'all' | '신입' | '1-3' | '3+' | '5+'

    init: function() {
        // ✅ 1. 지도를 즉시 기본 위치(서울)로 먼저 렌더링
        this.lat = 37.5665;
        this.lng = 126.9780;
        this.initMap();
        this.addCircle();
        this.showMapLoading(true);  // 로딩 오버레이 표시

        // ✅ 2. 위치 요청 — 응답 오면 실제 위치로 업데이트
        navigator.geolocation.getCurrentPosition(
            this.onLocation.bind(this),
            this.onError.bind(this),
            { timeout: 8000, maximumAge: 60000 }
        );
        this.bindFilters();
    },

    // ✅ 로딩 오버레이 표시/숨김
    showMapLoading: function(show) {
        var overlay = document.getElementById('map-loading');
        if (overlay) overlay.style.display = show ? 'flex' : 'none';
    },

    onLocation: function(position) {
        this.lat = position.coords.latitude;
        this.lng = position.coords.longitude;

        // 좌표만 먼저 세팅 (거리는 map 렌더링 완료 후 재계산)
        COMPANY_DATA.forEach(function(c) {
            c.lat = this.lat + c.lat_offset;
            c.lng = this.lng + c.lng_offset;
        }.bind(this));

        this.map.flyTo([this.lat, this.lng], 15, { duration: 0.8 });
        this.addMyMarker();
        this.circle.setLatLng([this.lat, this.lng]);

        // ✅ flyTo 종료(moveend) 후 map.distance()로 정확한 거리 재계산
        var self = this;

        // flyTo는 zoom+이동을 동시에 수행하므로
        // zoomend(zoom 완료) + moveend(이동 완료) 둘 다 끝난 시점을 보장하기 위해
        // 두 이벤트를 모두 받은 후 한 번만 실행
        var zoomDone = false;
        var moveDone = false;

        function onFlyEnd() {
            if (!zoomDone || !moveDone) return;
            COMPANY_DATA.forEach(function(c) {
                c.distance = self.map.distance(
                    [self.lat, self.lng],
                    [c.lat, c.lng]
                );
            });
            self.showMapLoading(false);
            self.renderMarkers();
            self.renderCardList();
            self.updateCompareBadge();
        }

        self.map.once('zoomend', function() { zoomDone = true; onFlyEnd(); });
        self.map.once('moveend', function() { moveDone = true; onFlyEnd(); });
    },

    onError: function(err) {
        console.error("위치 오류:", err.message);

        COMPANY_DATA.forEach(function(c) {
            c.lat = this.lat + c.lat_offset;
            c.lng = this.lng + c.lng_offset;
        }.bind(this));

        // map은 이미 초기화돼 있으므로 바로 distance() 사용
        var self = this;
        COMPANY_DATA.forEach(function(c) {
            c.distance = self.map.distance(
                [self.lat, self.lng],
                [c.lat, c.lng]
            );
        });

        this.showMapLoading(false);
        this.addMyMarker();
        this.renderMarkers();
        this.renderCardList();
    },

    // map.distance() 우선 사용, map 미초기화 시 Haversine fallback
    calcDistance: function(lat1, lng1, lat2, lng2) {
        if (this.map) {
            return this.map.distance([lat1, lng1], [lat2, lng2]);
        }
        var R = 6371000;
        var rad = Math.PI / 180;
        var dLat = (lat2 - lat1) * rad;
        var dLng = (lng2 - lng1) * rad;
        var a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
              + Math.cos(lat1 * rad) * Math.cos(lat2 * rad)
              * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    },

    initMap: function() {
        this.map = L.map(document.querySelector('.map'), { zoomControl: false })
            .setView([this.lat, this.lng], 15);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(this.map);
        L.control.zoom({ position: 'bottomright' }).addTo(this.map);
    },

    addMyMarker: function() {
        var myIcon = L.divIcon({
            html: '<div style="width:14px;height:14px;background:#1a56db;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(26,86,219,0.5)"></div>',
            iconSize: [14,14], className: ''
        });
        L.marker([this.lat, this.lng], { icon: myIcon })
            .addTo(this.map)
            .bindTooltip("내 위치", { permanent: false });
    },

    addCircle: function() {
        this.circle = L.circle([this.lat, this.lng], {
            radius: 1500,
            color: '#1a56db', weight: 1.5,
            fillColor: '#1a56db', fillOpacity: 0.05
        }).addTo(this.map);
    },

    updateCircle: function(radius) {
        if (!this.circle) return;

        if (radius === 0) {
            // 전체 선택 시 원 숨김
            this.circle.setStyle({ opacity: 0, fillOpacity: 0 });
        } else {
            // 특정 거리 선택 시 원 표시 + 반경 업데이트
            this.circle.setStyle({ opacity: 1, fillOpacity: 0.05 });
            this.circle.setRadius(radius);
            this.map.flyToBounds(this.circle.getBounds(), {
                padding: [40, 40],
                duration: 0.5
            });
        }
    },

    renderMarkers: function() {
        var self = this;
        this.markers.forEach(function(m) { self.map.removeLayer(m); });
        this.markers = [];

        var filtered = this.getFiltered();
        filtered.forEach(function(company) {
            var icon = L.divIcon({
                html: '<div class="company-marker">'
                    + company.logo + ' ' + company.name + '</div>',
                className: '',
            });

            var marker = L.marker([company.lat, company.lng], { icon: icon });
            var popupHtml = '<div class="map-popup">' +
                '<div class="map-popup-logo">' + company.logo + '</div>' +
                '<div class="map-popup-name">' + company.name + '</div>' +
                '<div class="map-popup-pos">' + company.position + '</div>' +
                '<div class="map-popup-salary">' + company.salary + '</div>' +
                '<button class="map-popup-btn" onclick="location.href=\'job-detail.html?id=' + company.id + '\'">상세보기</button>' +
                '</div>';

            marker.bindPopup(popupHtml, { maxWidth: 240 }).addTo(self.map);
            self.markers.push(marker);
        });

        var badge = document.querySelector('.map-badge');
        if (badge) badge.innerHTML = '주변 채용공고 <span>' + filtered.length + '개</span>';
    },

    getFiltered: function() {
        var self = this;
        return COMPANY_DATA.filter(function(c) {
            var matchCategory = self.activeFilters.includes('all') || self.activeFilters.includes(c.industry);
            var matchUrgent   = !self.urgentFilterActive || c.deadline === '상시채용';
            var matchSalary   = c.minSalary >= self.minSalaryFilter;
            var matchType     = self.typeFilter === 'all' || c.type === self.typeFilter;
            var matchDistance = self.maxDistanceFilter === 0 || c.distance <= self.maxDistanceFilter;

            // 경력 필터
            var matchExp = true;
            if (self.expFilter === '신입')  matchExp = c.expMin === 0;
            else if (self.expFilter === '1-3') matchExp = c.expMin >= 1 && c.expMin < 3;
            else if (self.expFilter === '3+')  matchExp = c.expMin >= 3 && c.expMin < 5;
            else if (self.expFilter === '5+')  matchExp = c.expMin >= 5;

            // 검색어: 회사명 / 직무명 / 태그 포함 여부
            var q = self.searchQuery.trim().toLowerCase();
            var matchSearch = q === ''
                || c.name.toLowerCase().includes(q)
                || c.position.toLowerCase().includes(q)
                || c.tags.some(function(t){ return t.toLowerCase().includes(q); });

            return matchCategory && matchUrgent && matchSalary && matchType && matchDistance && matchExp && matchSearch;
        });
    },

    renderCardList: function() {
        var list = document.getElementById('card-list');
        if (!list) return;
        var filtered = this.getFiltered();
        filtered.sort(function(a,b){ return a.distance - b.distance; });

        list.innerHTML = '';
        filtered.forEach(function(company) {
            var stars = '★'.repeat(Math.floor(company.rating)) + '☆'.repeat(5 - Math.floor(company.rating));
            var distKm = (company.distance / 1000).toFixed(1);
            var isUrgent = company.deadline === '상시채용';

            list.insertAdjacentHTML('beforeend',
                '<div class="job-card" onclick="location.href=\'job-detail.html?id=' + company.id + '\'">' +
                    '<div class="card-top">' +
                        '<div class="company-logo">' + company.logo + '</div>' +
                        '<div class="card-info">' +
                            '<div class="company-name">' + company.name + ' · ' + company.industry + '</div>' +
                            '<div class="job-title">' + company.position + '</div>' +
                        '</div>' +
                        '<button class="bookmark-btn" data-id="' + company.id + '" onclick="event.stopPropagation();CompanyMap.toggleBookmark(this,' + company.id + ')">🔖</button>' +
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
                        company.tags.map(function(t,i){ return '<span class="tag' + (i===0?' highlight':'') + '">' + t + '</span>'; }).join('') +
                    '</div>' +
                    '<div class="rating-row">' +
                        '<span class="stars">' + stars + '</span>' +
                        '<span class="rating-score">' + company.rating + '</span>' +
                        '<span class="distance-badge">' + distKm + 'km</span>' +
                    '</div>' +
                '</div>'
            );
        });

        var countEl = document.querySelector('.list-count');
        if (countEl) countEl.innerHTML = '총 <strong>' + filtered.length + '개</strong>의 채용공고';

        // 북마크 버튼 상태 동기화
        list.querySelectorAll('.bookmark-btn[data-id]').forEach(function(btn) {
            Bookmark.syncButton(btn, btn.dataset.id);
        });

        // 비교 버튼 배지 업데이트
        CompanyMap.updateCompareBadge();
    },

    toggleBookmark: function(btn, id) {
        var result = Bookmark.toggle(id);
        if (result !== null) {
            Bookmark.syncButton(btn, id);
            this.updateCompareBadge();
        }
    },

    updateCompareBadge: function() {
        var badge = document.getElementById('compare-badge');
        if (!badge) return;
        var count = Bookmark.getAll().length;
        badge.textContent = count;
        badge.style.display = count > 0 ? 'flex' : 'none';
        var btn = document.getElementById('compare-btn');
        if (btn) btn.classList.toggle('has-items', count > 0);
    },

    bindFilters: function() {
        var self = this;

        // ─── 검색창 ───
        var searchInput = document.querySelector('.search-input');
        var clearBtn    = document.getElementById('search-clear');

        if (clearBtn) clearBtn.style.display = 'none'; // 초기 숨김

        if (searchInput) {
            searchInput.addEventListener('input', function() {
                self.searchQuery = this.value;
                if (clearBtn) clearBtn.style.display = this.value ? 'flex' : 'none';
                if (self.map) {
                    self.renderMarkers();
                    self.renderCardList();
                }
            });
        }

        if (clearBtn) {
            clearBtn.addEventListener('click', function() {
                searchInput.value = '';
                self.searchQuery = '';
                clearBtn.style.display = 'none';
                if (self.map) {
                    self.renderMarkers();
                    self.renderCardList();
                }
            });
        }

        // ─── 카테고리 / 상시채용 칩 ───
        document.querySelectorAll('.filter-chip').forEach(function(chip) {
            chip.addEventListener('click', function() {
                var group = this.dataset.filterGroup;
                var filter = this.dataset.filter;

                if (group === 'category') {
                    this.classList.toggle('active');
                    if (filter === 'all') {
                        if (this.classList.contains('active')) {
                            document.querySelectorAll('.filter-chip[data-filter-group="category"]').forEach(function(c){
                                if (c.dataset.filter !== 'all') c.classList.remove('active');
                            });
                            self.activeFilters = ['all'];
                        } else {
                            this.classList.add('active');
                            self.activeFilters = ['all'];
                        }
                    } else {
                        document.querySelectorAll('.filter-chip[data-filter-group="category"]').forEach(function(c){
                            if (c.dataset.filter === 'all') c.classList.remove('active');
                        });
                        self.activeFilters = [];
                        document.querySelectorAll('.filter-chip[data-filter-group="category"].active').forEach(function(c){
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

                if (self.map) {
                    self.renderMarkers();
                    self.renderCardList();
                }
            });
        });

        // ─── 거리 드롭다운 + 슬라이더 ───
        var distanceTrigger = document.getElementById('distance-trigger');
        var distanceMenu    = document.getElementById('distance-menu');
        var distanceSlider  = document.getElementById('distance-slider');
        var distanceLabel   = document.getElementById('distance-label');

        var distanceSteps  = [1500, 3000, 5000, 10000, 0];   // 0 = 전체(무제한)
        var distanceLabels = ['1.5km', '3km', '5km', '10km', '전체'];

        function updateSliderTrack() {
            var pct = (distanceSlider.value / distanceSlider.max) * 100;
            distanceSlider.style.setProperty('--fill', pct + '%');
        }

        distanceTrigger.addEventListener('click', function(e) {
            e.stopPropagation();
            var isOpen = distanceMenu.classList.contains('open');
            closeAllDropdowns();
            if (!isOpen) {
                this.classList.add('open');
                distanceMenu.classList.add('open');
            }
        });

        distanceSlider.addEventListener('input', function() {
            var step = Number(this.value);
            self.maxDistanceFilter = distanceSteps[step];
            distanceLabel.textContent = distanceLabels[step];

            var isDefault = step === 4; // 마지막 = 전체(무제한)
            distanceTrigger.childNodes[0].textContent = (isDefault ? '거리' : distanceLabels[step]) + ' ';
            distanceTrigger.classList.toggle('active', !isDefault);

            updateSliderTrack();

            if (self.map) {
                self.updateCircle(distanceSteps[step]);
                self.renderMarkers();
                self.renderCardList();
            }
        });

        updateSliderTrack();

        distanceMenu.addEventListener('click', function(e) {
            e.stopPropagation();
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
                salaryMenu.querySelectorAll('.dropdown-item').forEach(function(i){ i.classList.remove('selected'); });
                this.classList.add('selected');

                self.minSalaryFilter = Number(this.dataset.salary);
                var label = this.dataset.salary === '0' ? '연봉' : this.textContent.trim();
                salaryTrigger.childNodes[0].textContent = label + ' ';
                salaryTrigger.classList.toggle('active', this.dataset.salary !== '0');

                salaryTrigger.classList.remove('open');
                salaryMenu.classList.remove('open');

                if (self.map) { self.renderMarkers(); self.renderCardList(); }
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
                typeMenu.querySelectorAll('.dropdown-item').forEach(function(i){ i.classList.remove('selected'); });
                this.classList.add('selected');

                self.typeFilter = this.dataset.type;
                var label = this.dataset.type === 'all' ? '고용형태' : this.textContent.trim();
                typeTrigger.childNodes[0].textContent = label + ' ';
                typeTrigger.classList.toggle('active', this.dataset.type !== 'all');

                typeTrigger.classList.remove('open');
                typeMenu.classList.remove('open');

                if (self.map) { self.renderMarkers(); self.renderCardList(); }
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
                expMenu.querySelectorAll('.dropdown-item').forEach(function(i){ i.classList.remove('selected'); });
                this.classList.add('selected');

                self.expFilter = this.dataset.exp;
                var label = this.dataset.exp === 'all' ? '경력' : this.textContent.trim();
                expTrigger.childNodes[0].textContent = label + ' ';
                expTrigger.classList.toggle('active', this.dataset.exp !== 'all');

                expTrigger.classList.remove('open');
                expMenu.classList.remove('open');

                if (self.map) { self.renderMarkers(); self.renderCardList(); }
            });
        });

        // ─── 공통: 드롭다운 닫기 ───
        function closeAllDropdowns() {
            [distanceTrigger, salaryTrigger, typeTrigger, expTrigger].forEach(function(t){ t.classList.remove('open'); });
            [distanceMenu, salaryMenu, typeMenu, expMenu].forEach(function(m){ m.classList.remove('open'); });
        }

        document.addEventListener('click', function() {
            closeAllDropdowns();
        });
    }
};

CompanyMap.init();