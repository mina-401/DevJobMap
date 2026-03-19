document.addEventListener('DOMContentLoaded', function() {
    var id = Number(new URLSearchParams(window.location.search).get('id'));
    var company = COMPANY_DATA.find(function(c){ return c.id === id; });

    if (!company) {
        document.querySelector('.detail-main').innerHTML = '<p style="padding:40px;color:var(--text-3)">채용공고를 찾을 수 없습니다.</p>';
        return;
    }

    document.title = company.name + ' - ' + company.position + ' | 잡맵';
    document.getElementById('detail-logo').textContent         = company.logo;
    document.getElementById('detail-company-name').textContent = company.name + ' · ' + company.industry;
    document.getElementById('detail-position').textContent     = company.position;
    document.getElementById('detail-type').textContent         = company.type;
    document.getElementById('detail-experience').textContent   = company.experience;
    document.getElementById('detail-education').textContent    = company.education;
    document.getElementById('detail-salary').textContent       = company.salary;
    document.getElementById('detail-deadline').textContent     = company.deadline === '상시채용' ? '🔥 상시채용' : '~' + company.deadline;
    document.getElementById('detail-address').textContent      = company.address;
    document.getElementById('detail-employees').textContent    = company.employees;
    document.getElementById('sidebar-salary').textContent      = company.salary;

    // 근무 방식
    var workEl = document.getElementById('detail-work-style');
    (company.work_style || []).forEach(function(w) {
        var span = document.createElement('span');
        span.className = 'badge-item work';
        span.textContent = w;
        workEl.appendChild(span);
    });

    // 복지 혜택
    var welfareEl = document.getElementById('detail-welfare');
    (company.welfare_items || []).forEach(function(w) {
        var span = document.createElement('span');
        span.className = 'badge-item';
        span.textContent = w;
        welfareEl.appendChild(span);
    });

    // 기술스택 태그
    var tagsEl = document.getElementById('detail-tags');
    company.tags.forEach(function(t) {
        var span = document.createElement('span');
        span.className = 'detail-tag';
        span.textContent = t;
        tagsEl.appendChild(span);
    });

    // 업무 내용
    document.getElementById('detail-description').innerHTML =
        '<ul style="padding-left:18px">' +
        '<li style="margin-bottom:8px">' + company.position + ' 관련 개발 및 운영 업무</li>' +
        '<li style="margin-bottom:8px">서비스 품질 향상을 위한 기술적 과제 해결</li>' +
        '<li style="margin-bottom:8px">팀원들과의 협업 및 코드 리뷰 참여</li>' +
        '<li style="margin-bottom:8px">사용자 경험 개선을 위한 지속적인 개발</li>' +
        '</ul>';
});