# 🗺 잡맵 JobMap

<p align="center">
  <b>내 위치 기반으로 주변 채용공고를 지도에서 탐색하는 웹 서비스</b><br>
  <sub>※ 개발자 전용</sub>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/HTML-E34F26?style=flat-square&logo=html5&logoColor=white"/>
  <img src="https://img.shields.io/badge/CSS-1572B6?style=flat-square&logo=css3&logoColor=white"/>
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black"/>
  <img src="https://img.shields.io/badge/Leaflet.js-199900?style=flat-square&logo=leaflet&logoColor=white"/>
</p>

---

## 기획 배경

평소 채용공고를 확인할 때, 회사의 위치를 한눈에 파악하기 어렵다는 점이 불편하게 느껴졌습니다.  
채용 플랫폼에서는 직무나 조건에 대한 정보는 잘 제공되지만, 실제 근무 위치는 주소 형태로만 제공되는 경우가 많아  
지도에서 직관적으로 비교하거나 주변 환경을 함께 고려하기 어려웠습니다.

특히 여러 기업의 공고를 비교할 때, 각각의 위치를 따로 검색해야 하는 번거로움이 있었고,  
이 과정에서 시간 소모와 정보 탐색의 비효율이 발생했습니다.

이러한 문제를 해결하기 위해, 사용자의 현재 위치를 기반으로 주변 채용공고를 지도 위에서 직관적으로 탐색할 수 있는  
서비스 **JobMap**을 기획하게 되었습니다.

---

## 서비스 미리보기

### 미리보기
미첨부

### 배포 링크

[DevJobMap 바로가기](https://mina-401.github.io/DevJobMap/)

---
##  서비스 핵심 가치
> **"지도 위에서 직관적으로 찾는 내 주변 맞춤 일자리"**

- **위치 기반 탐색**: 지도 위 마커로 내 주변 공고를 한눈에 파악
- **스마트 필터링**: 거리, 연봉, 경력 등 복잡한 조건을 한 번에 해결
- **하이브리드 뷰**: 지도와 리스트 실시간 연동으로 탐색 효율 극대화

---

### 01. 지도 기반 실시간 탐색 (Main View)
**현 위치를 중심으로 주변 채용 공고를 지도 마커로 표시합니다.**
*   **퀵 프리뷰:** 마커 클릭 시 **회사명 · 포지션 · 연봉** 정보를 팝업으로 즉시 확인
*   **직관적 UI:** 지도를 움직이며 원하는 지역의 공고를 자유롭게 탐색

<p align="center">
  <img src="Screenshots/map.png" width="100%"/>
</p>

---

### 02. 맞춤형 필터 & 실시간 동기화
**거리 슬라이더와 상세 조건을 조합해 나에게 꼭 맞는 공고만 남깁니다.**
*   **통합 검색:** 회사명, 직무, 기술 스택 기반의 정밀 검색 지원
*   **다양한 조건:** 거리(반경), 연봉, 고용 형태, 경력, 업종 필터 제공
*   **실시간 반영:** 필터 적용 시 **지도 반경과 리스트가 즉각 업데이트**

<p align="center">
  <img src="Screenshots/navbar.png" width="100%"/>
  <img src="Screenshots/filter.png" width="100%"/>
</p>

---

### 03. 지도 + 리스트 동시 제공
**공간 정보(지도)와 상세 정보(리스트)를 한 화면에서 비교하며 탐색합니다.**
*   위치와 조건을 동시에 고려해야 하는 사용자에게 최적의 탐색 경험을 제공합니다.

<p align="center">
  <img src="Screenshots/list.png" width="100%"/>
</p>

---

### 04. 공고 상세 페이지
**지원에 필요한 모든 정보를 한 페이지에 집약했습니다.**
*   **핵심 정보:** 필수 기술 스택, 복지 혜택, 근무 방식(재택 등) 명시
*   **가독성 중심:** 불필요한 정보는 줄이고 핵심 가치 위주로 구성

<p align="center">
  <img src="Screenshots/detail.png" width="70%"/>
</p>

---

## 구현 포인트
- **Geolocation API** — 위치 확인 전 서울 기본 좌표로 지도를 먼저 렌더링, 위치 수신 후 내 위치 이동
- **Leaflet.js `map.distance()`** — `zoomend` + `moveend` 이벤트가 모두 완료된 시점에 거리 계산
