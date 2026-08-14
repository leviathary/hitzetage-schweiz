const selectors = document.querySelector('#station-selectors');
const status = document.querySelector('#status');
const chart = document.querySelector('#chart');
const detailYearChart = document.querySelector('#detail-year-chart');
const detailYearLegend = document.querySelector('#detail-year-legend');
const results = document.querySelector('#results');
const legend = document.querySelector('#legend');
const stationCount = document.querySelector('#station-count');
const warmColors = ['#c85532', '#a33f2b', '#e09b2d', '#d56a3e', '#983b36', '#bd7043'];
const coldColors = ['#2878b5', '#155b91', '#4c98c9', '#315f9a', '#56a7b5', '#344f7d'];
const colors = [...warmColors];
function applyMetricColors(metricKey) {
  colors.splice(0, colors.length, ...(metricKey === 'frostDays' || metricKey === 'iceDays' ? coldColors : warmColors));
}
const translations = {};
let currentLanguage = 'de';

async function loadTranslations(language) {
  if (translations[language]) return translations[language];
  const response = await fetch(`/i18n/${language}.json`);
  if (!response.ok) throw new Error(`Could not load translations for ${language}`);
  const messages = await response.json();
  translations[language] = messages;
  return messages;
}

const validViews = ['overview', 'years', 'details', 'precipitation', 'forecast'];
const validMetrics = ['heatDays', 'summerDays', 'veryHotDays', 'tropicalNights', 'frostDays', 'iceDays'];
let currentView = validViews.includes(new URLSearchParams(location.search).get('view')) ? new URLSearchParams(location.search).get('view') : 'overview';
const tr = key => translations[currentLanguage]?.[key] || translations.de?.[key] || key;
const locale = () => ({de:'de-CH',fr:'fr-CH',it:'it-CH',rm:'rm-CH',en:'en-GB',nl:'nl-NL',pl:'pl-PL',es:'es-ES',sv:'sv-SE',nb:'nb-NO',da:'da-DK',zh:'zh-CN'}[currentLanguage]);
const metricInfo = key => key === 'heatDays'
  ? { label: tr('heatDays'), threshold: tr('heatThreshold'), extremeLabel: tr('highest'), extremeKey: 'maximumTemperatureCelsius' }
  : key === 'summerDays'
    ? { label: tr('summerDays'), threshold: tr('summerThreshold'), extremeLabel: tr('highest'), extremeKey: 'maximumTemperatureCelsius' }
  : key === 'veryHotDays'
    ? { label: tr('veryHotDays'), threshold: tr('veryHotThreshold'), extremeLabel: tr('highest'), extremeKey: 'maximumTemperatureCelsius' }
  : key === 'frostDays'
    ? { label: tr('frostDays'), threshold: tr('frostThreshold'), extremeLabel: tr('lowest'), extremeKey: 'minimumTemperatureCelsius' }
    : key === 'iceDays'
      ? { label: tr('iceDays'), threshold: tr('iceThreshold'), extremeLabel: tr('iceExtreme'), extremeKey: 'lowestMaximumTemperatureCelsius' }
    : { label: tr('tropicalNights'), threshold: tr('tropicalThreshold'), extremeLabel: tr('lowest'), extremeKey: 'minimumTemperatureCelsius' };
let stations = [];
const selectedCountries = new Set(['CH']);
let selectedRegion = 'CH';
let stationMap;
let stationMarkerLayer;
let selectedHeatDayYears = [];
let latestForecasts = [];
let latestView = null;
const currentYear = new Date().getFullYear();
document.querySelector('#fromYear').value = currentYear - 10;
document.querySelector('#toYear').value = currentYear;

function applyLanguage() {
  document.documentElement.lang = currentLanguage;
  document.querySelectorAll('[data-i18n]').forEach(element => { element.textContent = tr(element.dataset.i18n); });
  document.querySelectorAll('[data-metric-select]').forEach(select => {
    select.querySelector('option[value="heatDays"]').textContent = tr('heatOption');
    select.querySelector('option[value="summerDays"]').textContent = tr('summerOption');
    select.querySelector('option[value="veryHotDays"]').textContent = tr('veryHotOption');
    select.querySelector('option[value="tropicalNights"]').textContent = tr('tropicalOption');
    select.querySelector('option[value="frostDays"]').textContent = tr('frostOption');
    select.querySelector('option[value="iceDays"]').textContent = tr('iceOption');
  });
  document.querySelectorAll('.remove-station').forEach(button => button.setAttribute('aria-label', tr('removeStation')));
  document.querySelector('#station-add-search').placeholder = tr('stationSearchPlaceholder');
  document.querySelector('#feedback-close').setAttribute('aria-label', tr('close'));
  document.querySelector('#station-selectors').setAttribute('aria-label', tr('selectedStationsTitle'));
  document.querySelector('.country-switch').setAttribute('aria-label', tr('country'));
  document.querySelector('#station-map').setAttribute('aria-label', tr('mapToggle'));
  document.querySelector('#map-info').textContent = tr('mapHint');
  const countryLabels = {
    de:{CH:'Schweiz',EU:'Europa'}, fr:{CH:'Suisse',EU:'Europe'},
    it:{CH:'Svizzera',EU:'Europa'}, rm:{CH:'Svizra',EU:'Europa'},
    en:{CH:'Switzerland',EU:'Europe'}, nl:{CH:'Zwitserland',EU:'Europa'},
    pl:{CH:'Szwajcaria',EU:'Europa'}, es:{CH:'Suiza',EU:'Europa'}, sv:{CH:'Schweiz',EU:'Europa'},
    nb:{CH:'Sveits',EU:'Europa'}, da:{CH:'Schweiz',EU:'Europa'}, zh:{CH:'瑞士',EU:'欧洲'}
  }[currentLanguage];
  document.querySelectorAll('[data-country-label]').forEach(element => { element.textContent = countryLabels[element.dataset.countryLabel]; });
  refreshSelectedStationLabels();
  updateStationCount();
  updateViewChrome();
}

function updateViewChrome() {
  document.querySelectorAll('[data-view-link]').forEach(link => {
    const active = link.dataset.viewLink === currentView;
    link.classList.toggle('active', active);
    if (link.closest('.app-navigation')) link.setAttribute('aria-current', active ? 'page' : 'false');
  });
  const title = document.querySelector('#current-view-title');
  if (title) title.textContent = tr({ years:'navYears', details:'navDetails', precipitation:'navPrecipitation', forecast:'navForecast' }[currentView] || 'navOverview');
}

function setView(view, updateHistory = true) {
  currentView = validViews.includes(view) ? view : 'overview';
  document.querySelectorAll('.view-panel[data-view]').forEach(panel => { panel.hidden = panel.dataset.view !== currentView; });
  document.querySelectorAll('[data-detail-view]').forEach(panel => { panel.hidden = currentView === 'overview'; });
  document.body.classList.toggle('detail-active', currentView !== 'overview');
  updateViewChrome();
  if (latestView) renderViewFilterSummary(latestView.data, latestView.from, latestView.to);
  if (updateHistory) history.pushState({ view: currentView }, '', currentView === 'overview' ? location.pathname : `${location.pathname}?view=${currentView}`);
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (currentView === 'overview') refreshVisibleMap();
}

function metricOptionsMarkup(selectedMetric) {
  return [...document.querySelector('#metric').options]
    .map(option => `<option value="${option.value}"${option.value === selectedMetric ? ' selected' : ''}>${option.textContent}</option>`)
    .join('');
}

function renderViewFilterSummary(data, from, to) {
  const metricKey = document.querySelector('#metric').value;
  const interactiveMetric = ['years', 'details'].includes(currentView);
  const metricSummary = currentView === 'precipitation' ? '' : interactiveMetric
    ? `<label class="view-metric-control"><span class="visually-hidden">${tr('metric')}</span><select class="view-metric-select" data-metric-select aria-label="${tr('metric')}">${metricOptionsMarkup(metricKey)}</select></label>`
    : `<span>${metricInfo(metricKey).label}</span>`;
  const stationSummary = `<span>${data.map(item => item.station.name).join(' · ')}</span>`;
  const periodSummary = `<span>${from}–${to}</span>`;
  document.querySelector('#view-filter-summary').innerHTML = interactiveMetric
    ? `${metricSummary}${stationSummary}${periodSummary}`
    : `${stationSummary}${periodSummary}${metricSummary}`;
}

function changeMetric(metricKey) {
  if (!validMetrics.includes(metricKey)) return;
  document.querySelectorAll('[data-metric-select]').forEach(select => { select.value = metricKey; });
  try { localStorage.setItem('hitzetage.metric', metricKey); } catch (error) { /* Storage may be unavailable. */ }
  compare();
}

function stationLabel(station) {
  const flag = { CH:'🇨🇭', DE:'🇩🇪', NL:'🇳🇱', AT:'🇦🇹', IT:'🇮🇹', PL:'🇵🇱', IE:'🇮🇪', GB:'🇬🇧', ES:'🇪🇸', DK:'🇩🇰', SE:'🇸🇪', NO:'🇳🇴' }[station.countryCode] || '🇪🇺';
  const delayed = station.dataAvailableThroughYear && station.dataAvailableThroughYear < currentYear ? ` · ${tr('dataThrough')} ${station.dataAvailableThroughYear}` : '';
  return `${flag} ${station.name} (${station.canton})${station.elevationMetres ? ` · ${station.elevationMetres} ${tr('altitudeUnit')}` : ''}${delayed}`;
}

const cantonAliases = {
  AG:['Aargau'], AI:['Appenzell Innerrhoden'], AR:['Appenzell Ausserrhoden'], BE:['Bern','Berne'],
  BL:['Basel-Landschaft','Baselland'], BS:['Basel-Stadt'], FR:['Freiburg','Fribourg'], GE:['Genf','Genève','Geneva'],
  GL:['Glarus'], GR:['Graubünden','Grisons','Grigioni'], JU:['Jura'], LU:['Luzern','Lucerne'],
  NE:['Neuenburg','Neuchâtel'], NW:['Nidwalden'], OW:['Obwalden'], SG:['St. Gallen','Saint-Gall'],
  SH:['Schaffhausen'], SO:['Solothurn'], SZ:['Schwyz'], TG:['Thurgau'], TI:['Tessin','Ticino'],
  UR:['Uri'], VD:['Waadt','Vaud'], VS:['Wallis','Valais'], ZG:['Zug'], ZH:['Zürich','Zurich']
};

function matchingCantonCodes(query) {
  if (!query) return new Set();
  return new Set(Object.entries(cantonAliases)
    .filter(([code, aliases]) => normalized(code) === query || aliases.some(alias => normalized(alias) === query))
    .map(([code]) => code));
}

function matchingStations(query) {
  const selected = new Set(selectedStationIds());
  const cantonCodes = matchingCantonCodes(query);
  return stations.filter(station => {
    if (!selectedCountries.has(station.countryCode)) return false;
    if (selected.has(station.id)) return false;
    if (cantonCodes.size) return cantonCodes.has(station.canton);
    return !query || normalized(`${station.name} ${station.canton} ${station.countryName} ${station.dataProvider} ${station.id}`).includes(query);
  });
}

function refreshSelectedStationLabels() {
  selectors.querySelectorAll('.station-row').forEach(row => {
    const station = stations.find(item => item.id === row.dataset.stationId);
    if (station) row.querySelector('.selected-station-name').textContent = stationLabel(station);
  });
}

function populateStationSearch() {
  const input = document.querySelector('#station-add-search');
  const options = document.querySelector('#station-add-options');
  const query = normalized(input.value.trim());
  const matches = matchingStations(query);
  options.replaceChildren(...matches.map(station => {
    const option = document.createElement('button');
    option.type = 'button';
    option.className = 'station-add-option';
    option.setAttribute('role', 'option');
    option.textContent = stationLabel(station);
    option.addEventListener('click', () => addStationFromSearch(station.id));
    return option;
  }));
  const open = document.activeElement === input && matches.length > 0;
  options.hidden = !open;
  input.setAttribute('aria-expanded', String(open));
}

function addStation(selectedId = '', removable = true) {
  const station = stations.find(item => item.id === selectedId);
  if (!station || selectedStationIds().includes(selectedId) || selectors.children.length >= colors.length) return;
  const row = document.createElement('div');
  row.className = 'station-row';
  row.dataset.stationId = selectedId;
  row.innerHTML = `<span class="selected-station-name"></span>${removable ? `<button class="remove-station" type="button" aria-label="${tr('removeStation')}">×</button>` : ''}`;
  row.querySelector('.selected-station-name').textContent = stationLabel(station);
  row.querySelector('.remove-station')?.addEventListener('click', () => {
    row.remove();
    updateStationCount();
    if (latestView) compare();
  });
  selectors.append(row);
  updateStationCount();
  if (latestView) compare();
}

function updateStationCount() {
  const count = selectors.querySelectorAll('.station-row').length;
  stationCount.textContent = currentLanguage === 'zh' ? `${count} ${tr('stations')}` : `${count} ${count === 1 ? tr('station') : tr('stations')}`;
  document.querySelector('#station-add-search').disabled = count >= colors.length;
  populateStationSearch();
  if (stations.length) renderMap();
}

function normalized(value) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function showMapInfo(station, note = '') {
  const info = document.querySelector('#map-info');
  info.replaceChildren();
  const title = document.createElement('strong');
  title.textContent = `${{ CH:'🇨🇭', DE:'🇩🇪', NL:'🇳🇱', AT:'🇦🇹', IT:'🇮🇹', PL:'🇵🇱', IE:'🇮🇪', GB:'🇬🇧', ES:'🇪🇸', DK:'🇩🇰', SE:'🇸🇪', NO:'🇳🇴' }[station.countryCode] || '🇪🇺'} ${station.name} (${station.canton})`;
  const details = document.createElement('span');
  const delayed = station.dataAvailableThroughYear && station.dataAvailableThroughYear < currentYear ? ` · ${tr('dataThrough')} ${station.dataAvailableThroughYear}` : '';
  details.textContent = `${tr('altitude')}: ${station.elevationMetres || '–'} ${tr('altitudeUnit')}${delayed}${note ? ` · ${note}` : ''}`;
  info.append(title, details);
}

function renderMap({ fitToQuery = false } = {}) {
  const panel = document.querySelector('#map-panel');
  if (currentView !== 'overview' || panel.hidden) return;
  if (!stationMap) {
    stationMap = L.map('station-map', { minZoom: 3, maxZoom: 14 }).fitBounds([[45.75, 5.8], [47.85, 10.55]], { padding: [8, 8] });
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
    }).addTo(stationMap);
    stationMarkerLayer = L.layerGroup().addTo(stationMap);
    stationMap.on('zoomend', () => renderMap());
  }
  const selectedIds = selectedStationIds();
  const query = normalized(document.querySelector('#station-add-search').value.trim());
  const cantonCodes = matchingCantonCodes(query);
  const visibleLocations = [];
  const zoom = stationMap.getZoom();
  const gridSize = query ? 0 : zoom <= 5 ? 1.2 : zoom === 6 ? .65 : zoom === 7 ? .32 : zoom === 8 ? .16 : 0;
  const occupiedGridCells = new Set();
  stationMarkerLayer.clearLayers();
  stations.filter(station => Number.isFinite(station.latitude) && Number.isFinite(station.longitude)).forEach(station => {
    if (!selectedCountries.has(station.countryCode)) return;
    const selectedIndex = selectedIds.indexOf(station.id);
    const searchText = normalized(`${station.name} ${station.canton} ${station.countryName} ${station.id}`);
    if (query && (cantonCodes.size ? !cantonCodes.has(station.canton) : !searchText.includes(query))) return;
    if (gridSize && selectedIndex < 0) {
      const cell = `${Math.floor(station.latitude / gridSize)}:${Math.floor(station.longitude / gridSize)}`;
      if (occupiedGridCells.has(cell)) return;
      occupiedGridCells.add(cell);
    }
    visibleLocations.push([station.latitude, station.longitude]);
    const marker = L.circleMarker([station.latitude, station.longitude], {
      radius: selectedIndex >= 0 ? 11 : zoom <= 5 ? 5 : 6,
      color: selectedIndex >= 0 ? '#7f2118' : '#ffffff',
      weight: selectedIndex >= 0 ? 3 : 2,
      fillColor: selectedIndex >= 0 ? '#d65337' : station.dataAvailableThroughYear && station.dataAvailableThroughYear < currentYear ? '#75807c' : '#26322e',
      fillOpacity: selectedIndex >= 0 ? 1 : station.dataAvailableThroughYear && station.dataAvailableThroughYear < currentYear ? .55 : .9
    });
    const availability = station.dataAvailableThroughYear && station.dataAvailableThroughYear < currentYear ? ` · ${tr('dataThrough')} ${station.dataAvailableThroughYear}` : '';
    marker.bindTooltip(`${station.name} (${station.canton}) · ${station.elevationMetres} ${tr('altitudeUnit')}${availability}`, { direction: 'top', offset: [0, -4] });
    marker.on('mouseover', () => showMapInfo(station, selectedIndex >= 0 ? tr('alreadySelected') : ''));
    marker.on('click', () => {
      if (selectedStationIds().includes(station.id)) return showMapInfo(station, tr('alreadySelected'));
      if (selectors.children.length >= colors.length) return showMapInfo(station, tr('mapFull'));
      addStation(station.id);
      showMapInfo(station, tr('addedFromMap'));
    });
    marker.addTo(stationMarkerLayer);
    if (selectedIndex >= 0) marker.bringToFront();
  });
  const info = document.querySelector('#map-info');
  if (fitToQuery && query) {
    info.textContent = `${visibleLocations.length} ${tr('stations')}`;
  } else if (fitToQuery) {
    info.textContent = tr('mapHint');
  } else if (!info.hasChildNodes() && stations.length) {
    info.textContent = tr('mapHint');
  }
  if (fitToQuery) {
    if (query && visibleLocations.length) {
      stationMap.fitBounds(visibleLocations, { padding: [45, 45], maxZoom: 10 });
    } else if (!query) {
      const bounds = selectedCountries.size === 1 && selectedCountries.has('CH') ? [[45.75, 5.8], [47.85, 10.55]] : [[35.0, -11.0], [71.5, 32.0]];
      stationMap.fitBounds(bounds, { padding: [8, 8] });
    }
  }
}

async function loadStations() {
  try {
    const response = await fetch('/api/stations');
    if (!response.ok) throw new Error(tr('noResults'));
    stations = await response.json();
    const swissStations = stations.filter(station => station.countryCode === 'CH');
    const preferred = swissStations.find(station => station.id === 'SMA');
    addStation(preferred?.id || swissStations[0]?.id);
    addStation(swissStations.find(station => station.id !== (preferred?.id || swissStations[0]?.id))?.id);
    await compare();
  } catch (error) { status.textContent = error.message; }
}

function chooseCountry(region) {
  if (!['CH', 'EU'].includes(region) || region === selectedRegion) return;
  selectedRegion = region;
  selectedCountries.clear();
  selectedCountries.add('CH');
  if (region === 'EU') stations.forEach(station => selectedCountries.add(station.countryCode));
  document.querySelectorAll('[data-country]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.country === selectedRegion)));
  selectors.querySelectorAll('.station-row').forEach(row => {
    const station = stations.find(item => item.id === row.dataset.stationId);
    if (station && !selectedCountries.has(station.countryCode)) row.remove();
  });
  if (!selectedStationIds().length) stations.filter(station => selectedCountries.has(station.countryCode)).slice(0, 2).forEach(station => addStation(station.id));
  document.querySelector('#station-add-search').value = '';
  updateStationCount();
  renderMap({ fitToQuery: true });
  if (latestView) compare();
}

function selectedStationIds() { return [...selectors.querySelectorAll('.station-row')].map(row => row.dataset.stationId); }

async function fetchStation(id, from, to) {
  const response = await fetch(`/api/stations/${encodeURIComponent(id)}/annual-values?fromYear=${from}&toYear=${to}`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || `Daten für ${id} konnten nicht geladen werden.`);
  return data;
}

async function fetchPrecipitation(id, from, to, year) {
  const response = await fetch(`/api/stations/${encodeURIComponent(id)}/precipitation?fromYear=${from}&toYear=${to}&year=${year}`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || `Niederschlagsdaten für ${id} konnten nicht geladen werden.`);
  return data;
}

let precipitationData = [];
let precipitationComparisonData = [];
let selectedPrecipitationYears = [];
let precipitationToDate = false;
const rainColors = ['#2778a8', '#45a7c4', '#285f91', '#58b4a7', '#487cb5', '#166a83'];
const rainNumber = value => new Intl.NumberFormat(locale(), { maximumFractionDigits: 1 }).format(value || 0);
const precipitationCutoff = () => ({ month:new Date().getMonth() + 1, day:new Date().getDate() });
function precipitationValuesToDate(response) {
  const { month:cutoffMonth, day:cutoffDay } = precipitationCutoff();
  return response.precipitation.daily.filter(value => {
    const month = Number(value.date.slice(5,7)), day = Number(value.date.slice(8,10));
    return month < cutoffMonth || (month === cutoffMonth && day <= cutoffDay);
  });
}
function precipitationTotalToDate(response) {
  return precipitationValuesToDate(response).reduce((sum, value) => sum + value.millimetres, 0);
}
function rainBars(groups, valueFor, labelFor, className = '') {
  const maximum = Math.max(1, ...groups.flatMap(group => precipitationData.map(item => valueFor(item, group))));
  return groups.map(group => `<div class="precipitation-bar-group ${className}" data-rain-group="${group}"><div class="precipitation-bar-stack">${precipitationData.map((item, index) => { const value = valueFor(item, group); return `<span style="height:${Math.max(value ? 3 : 0, value / maximum * 100)}%;background:${rainColors[index]}" title="${item.station.name}: ${rainNumber(value)} mm"><i>${value ? rainNumber(value) : ''}</i></span>`; }).join('')}</div><small>${labelFor(group)}</small></div>`).join('');
}
function renderPrecipitation() {
  if (!precipitationData.length) return;
  document.querySelector('#precipitation-records').innerHTML = precipitationData.map((item, index) => {
    const p = item.precipitation, strongest = p.strongestRainDay, driest = p.driestMonth;
    return `<article style="--rain-color:${rainColors[index]}"><h3>${item.station.name}</h3><div><strong>${strongest ? rainNumber(strongest.millimetres) : '–'} <small>mm</small></strong><span>${tr('strongestRainDay')}${strongest ? ` · ${new Date(strongest.date).toLocaleDateString(locale())}` : ''}</span></div><div><strong>${driest ? rainNumber(driest.millimetres) : '–'} <small>mm</small></strong><span>${tr('driestMonth')}${driest ? ` · ${new Date(`${driest.month}-01`).toLocaleDateString(locale(), {month:'long',year:'numeric'})}` : ''}</span></div><div><strong>${p.longestDrySpellDays}</strong><span>${tr('longestDrySpell')}${p.longestDrySpellYear ? ` · ${p.longestDrySpellYear}` : ''}</span></div></article>`;
  }).join('');
  const from = Number(document.querySelector('#fromYear').value), to = Number(document.querySelector('#toYear').value);
  document.querySelector('#precipitation-record-period').textContent = `${tr('precipitationRecordsPeriod')} · ${from}–${to}`;
  const years = Array.from({length: to - from + 1}, (_, i) => from + i);
  document.querySelector('#precipitation-annual').innerHTML = rainBars(years, (item, y) => {
    if (!precipitationToDate) return item.precipitation.annual.find(v => v.year === y)?.millimetres || 0;
    return item.precipitation.annualToDate?.find(v => v.year === y)?.millimetres || 0;
  }, y => y, 'clickable');
  const toDateHint = document.querySelector('#precipitation-to-date-hint');
  const cutoff = new Date(currentYear, precipitationCutoff().month - 1, precipitationCutoff().day);
  toDateHint.hidden = !precipitationToDate;
  toDateHint.textContent = tr('precipitationToDateHint').replace('{date}', cutoff.toLocaleDateString(locale(), {day:'numeric',month:'long'}));
  document.querySelector('#precipitation-annual').querySelectorAll('[data-rain-group]').forEach(el => el.classList.toggle('selected', selectedPrecipitationYears.includes(Number(el.dataset.rainGroup))));
  renderPrecipitationComparison();
}

function renderPrecipitationComparison() {
  if (!precipitationComparisonData.length) return;
  const comparisonYears = [...selectedPrecipitationYears].sort((a,b) => a-b);
  const months = Array.from({length:12}, (_, i) => i + 1);
  document.querySelector('#precipitation-compare-daily').innerHTML = precipitationComparisonData.map((entry, stationIndex) => {
    const color = rainColors[stationIndex % rainColors.length];
    const yearRows = comparisonYears.map(year => {
      const response = entry.years[year];
      if (!precipitationToDate) return { year, months:response.precipitation.monthly, total:response.precipitation.monthly.reduce((sum,value)=>sum+value.millimetres,0) };
      const values = precipitationValuesToDate(response), { month:cutoffMonth } = precipitationCutoff();
      const months = response.precipitation.monthly.filter(value => Number(value.month.slice(5)) < cutoffMonth)
        .concat([{ month:`${year}-${String(cutoffMonth).padStart(2,'0')}`, millimetres:values.filter(value => Number(value.date.slice(5,7)) === cutoffMonth).reduce((sum,value)=>sum+value.millimetres,0) }]);
      return { year, months, total:precipitationTotalToDate(response) };
    });
    const maximum = Math.max(1, ...yearRows.flatMap(row => row.months.map(value => value.millimetres)));
    const monthLabels = months.map(month => `<span style="left:${(month - .5) / 12 * 100}%">${new Date(currentYear,month-1,1).toLocaleDateString(locale(),{month:'short'})}</span>`).join('');
    return `<article class="precipitation-timeline-card" data-station-id="${entry.station.id}" style="--rain-color:${color};--rain-days:12"><h4>${entry.station.name}</h4><p class="precipitation-timeline-hint">${tr('clickMonthForDays')}</p><div class="precipitation-timeline-labels" aria-hidden="true">${monthLabels}</div>${yearRows.map(row => `<div class="precipitation-timeline-row"><div class="precipitation-timeline-year"><strong>${row.year}</strong><span>${rainNumber(row.total)} mm</span></div><div class="precipitation-timeline-track">${row.months.map(value => { const month = Number(value.month.slice(5)); return `<button class="precipitation-rain-marker precipitation-month-marker" type="button" data-rain-year="${row.year}" data-rain-month="${month}" style="left:${(month - .5) / 12 * 100}%;height:${Math.max(3, value.millimetres / maximum * 42)}px" title="${new Date(row.year,month-1,1).toLocaleDateString(locale(),{month:'long',year:'numeric'})}: ${rainNumber(value.millimetres)} mm"><i>${rainNumber(value.millimetres)}</i></button>`; }).join('')}<span class="precipitation-timeline-arrow"></span></div></div>`).join('')}</article>`;
  }).join('');
}

function openPrecipitationDayDialog(stationId, year, month) {
  const stationEntry = precipitationComparisonData.find(entry => entry.station.id === stationId);
  const response = stationEntry?.years[year];
  if (!response) return;
  const days = response.precipitation.daily.filter(value => Number(value.date.slice(5,7)) === month);
  const daysInMonth = new Date(year, month, 0).getDate();
  const maximum = Math.max(1, ...days.map(value => value.millimetres));
  const monthName = new Date(year, month - 1, 1).toLocaleDateString(locale(), { month:'long', year:'numeric' });
  document.querySelector('#precipitation-day-dialog-title').textContent = `${tr('dailyRainfall')} · ${monthName}`;
  document.querySelector('#precipitation-day-dialog-subtitle').textContent = stationEntry.station.name;
  document.querySelector('#precipitation-day-dialog-chart').innerHTML = Array.from({length:daysInMonth}, (_, index) => index + 1).map(day => { const value = days.find(entry => Number(entry.date.slice(8,10)) === day)?.millimetres || 0; return `<div class="precipitation-day-dialog-bar"><span style="height:${Math.max(value ? 3 : 0, value / maximum * 100)}%" title="${day}. ${monthName}: ${rainNumber(value)} mm"><i>${value ? rainNumber(value) : ''}</i></span><small>${day}</small></div>`; }).join('');
  document.querySelector('#precipitation-day-dialog').showModal();
}

async function loadPrecipitationComparison() {
  const ids = selectedStationIds(), from = Number(document.querySelector('#fromYear').value), to = Number(document.querySelector('#toYear').value);
  document.querySelector('#precipitation-compare-daily').innerHTML = `<p>${tr('loading')}</p>`;
  precipitationComparisonData = await Promise.all(ids.map(async id => {
    const responses = await Promise.all(selectedPrecipitationYears.map(year => fetchPrecipitation(id, from, to, year)));
    return { station:responses[0].station, years:Object.fromEntries(selectedPrecipitationYears.map((year,index) => [year,responses[index]])) };
  }));
  renderPrecipitationComparison();
}

async function loadPrecipitation() {
  const ids = selectedStationIds(), from = Number(document.querySelector('#fromYear').value), to = Number(document.querySelector('#toYear').value);
  selectedPrecipitationYears = selectedPrecipitationYears.filter(value => value >= from && value <= to);
  if (!selectedPrecipitationYears.length) selectedPrecipitationYears = [to];
  document.querySelector('#precipitation-records').innerHTML = `<p>${tr('loading')}</p>`;
  precipitationData = await Promise.all(ids.map(id => fetchPrecipitation(id, from, to, selectedPrecipitationYears[0])));
  renderPrecipitation();
  document.querySelector('#precipitation-annual').querySelectorAll('[data-rain-group]').forEach(el => el.classList.toggle('selected', selectedPrecipitationYears.includes(Number(el.dataset.rainGroup))));
  await loadPrecipitationComparison();
}

async function fetchForecast(id) {
  const response = await fetch(`/api/stations/${encodeURIComponent(id)}/forecast`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || `Prognose für ${id} konnte nicht geladen werden.`);
  return data;
}

async function fetchDetailDays(id, year) {
  const metricKey = document.querySelector('#metric').value;
  const route = metricKey === 'frostDays' ? 'frost-days' : metricKey === 'iceDays' ? 'ice-days' : metricKey === 'summerDays' ? 'summer-days' : metricKey === 'veryHotDays' ? 'very-hot-days' : metricKey === 'tropicalNights' ? 'tropical-nights' : 'heat-days';
  const response = await fetch(`/api/stations/${encodeURIComponent(id)}/${route}?year=${year}`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || `${metricInfo(metricKey).label} für ${id} konnten nicht geladen werden.`);
  return data;
}

function populateHeatDayYears(from, to) {
  const select = document.querySelector('#heat-day-year');
  const previous = Number(select.value);
  select.innerHTML = Array.from({ length: to - from + 1 }, (_, index) => to - index)
    .map(year => `<option value="${year}">${year}</option>`).join('');
  select.value = String(previous >= from && previous <= to ? previous : to);
  selectedHeatDayYears = selectedHeatDayYears.filter(year => year >= from && year <= to);
  if (!selectedHeatDayYears.length) selectedHeatDayYears = [Number(select.value)];
}

function renderHeatDays(yearGroups, annualData = []) {
  const detailMetricKey = document.querySelector('#metric').value;
  const frost = detailMetricKey === 'frostDays';
  const ice = detailMetricKey === 'iceDays';
  const tropical = detailMetricKey === 'tropicalNights';
  const detailMetric = metricInfo(detailMetricKey);
  const detailPrefix = detailMetricKey === 'frostDays' ? 'frostDays' : detailMetricKey === 'iceDays' ? 'iceDays' : detailMetricKey === 'summerDays' ? 'summerDays' : detailMetricKey === 'veryHotDays' ? 'veryHotDays' : detailMetricKey === 'tropicalNights' ? 'tropicalNights' : 'heatDays';
  document.querySelector('[data-i18n="heatDaysDetailTitle"]').textContent = tr(`${detailPrefix}DetailTitle`);
  document.querySelector('[data-i18n="heatDaysDetailIntro"]').textContent = tr(`${detailPrefix}DetailIntro`);
  const formatter = new Intl.NumberFormat(locale(), { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const timelineValues = (item, year) => {
    const measured = item.values.map(day => ({ ...day, forecast:false }));
    if (year !== currentYear) return measured;
    const measuredDates = new Set(measured.map(day => day.date));
    const forecast = latestForecasts.find(entry => entry.station.id === item.station.id)?.values
      .filter(day => forecastMatchesMetric(day, detailMetricKey) && day.date.startsWith(String(year)) && !measuredDates.has(day.date))
      .map(day => ({ ...day, forecast:true })) || [];
    return [...measured, ...forecast].sort((a, b) => a.date.localeCompare(b.date));
  };
  const allDates = yearGroups.flatMap(group => group.items.flatMap(item => timelineValues(item, group.year).map(day => new Date(`${day.date}T12:00:00`))));
  const eventMonths = allDates.map(date => date.getMonth());
  const firstMonth = eventMonths.length ? Math.min(...eventMonths) : 0;
  const lastMonth = eventMonths.length ? Math.max(...eventMonths) : 11;
  const labelYear = selectedHeatDayYears[0];
  const rangeStart = new Date(labelYear, firstMonth, 1);
  const rangeEnd = new Date(labelYear, lastMonth + 1, 1);
  const rangeLength = (rangeEnd - rangeStart) / 86400000;
  const monthCount = lastMonth - firstMonth + 1;
  const months = Array.from({ length: monthCount }, (_, index) => {
    const date = new Date(labelYear, firstMonth + index, 1);
    const position = (date - rangeStart) / 86400000 / rangeLength * 100;
    return `<span style="left:${position}%">${date.toLocaleDateString(locale(), { month:'short' })}</span>`;
  }).join('');
  const stationsForFirstYear = yearGroups[0]?.items || [];
  document.querySelector('#heat-days-detail').innerHTML = stationsForFirstYear.map((stationItem, stationIndex) => `
    <article class="heat-days-card" style="--station-color:${colors[stationIndex]}">
      <div class="heat-days-card-heading"><h3>${stationItem.station.name}</h3></div>
      <div class="heat-days-timeline-months" style="--month-count:${monthCount}" aria-hidden="true">${months}</div>
      ${yearGroups.map(group => {
        const item = group.items[stationIndex];
        const year = group.year;
        const annualStation = annualData.find(entry => entry.station.id === item.station.id);
        const dataAvailable = annualStation?.values.some(value => value.year === year) ?? false;
        const days = timelineValues(item, year);
        const forecastCount = days.filter(day => day.forecast).length;
        const currentRangeStart = new Date(year, firstMonth, 1);
        const currentRangeEnd = new Date(year, lastMonth + 1, 1);
        const currentRangeLength = (currentRangeEnd - currentRangeStart) / 86400000;
        const countLabel = dataAvailable || forecastCount ? `${item.values.length}${forecastCount ? ` + ${forecastCount}` : ''} ${detailMetric.label}` : tr('noData');
        return `<div class="heat-days-year-row"><div class="heat-days-year-label"><strong>${year}</strong><span>${countLabel}</span>${selectedHeatDayYears.length > 1 ? `<button class="remove-detail-year" type="button" data-year="${year}" aria-label="${tr('removeYear')}: ${year}" title="${tr('removeYear')}">×</button>` : ''}</div>${days.length ? `<div class="heat-days-timeline" style="--month-count:${monthCount}" aria-label="${item.station.name}: ${days.length} ${detailMetric.label} ${year}">${days.map(day => {
        const date = new Date(`${day.date}T12:00:00`);
        const minimum = day.minimumTemperatureCelsius == null ? '–' : `${formatter.format(day.minimumTemperatureCelsius)} °C`;
        const position = (date - currentRangeStart) / 86400000 / currentRangeLength * 100;
        const label = `${date.toLocaleDateString(locale(), { weekday:'short', day:'2-digit', month:'long' })}: ${tr('maximum')} ${formatter.format(day.maximumTemperatureCelsius)} °C, ${tr('minimum')} ${minimum}${day.forecast ? ` (${tr('predicted')})` : ''}`;
        const displayedTemperature = frost || tropical ? day.minimumTemperatureCelsius : day.maximumTemperatureCelsius;
        const referenceTemperature = tropical ? 20 : frost || ice ? 0 : detailMetricKey === 'summerDays' ? 25 : detailMetricKey === 'veryHotDays' ? 35 : 30;
        const barHeight = 8 + Math.min(24, Math.abs(displayedTemperature - referenceTemperature) * 2.4);
        return `<button class="heat-day-marker ${day.forecast ? 'forecast' : ''}" type="button" style="left:${position}%;--bar-height:${barHeight}px" title="${label}" aria-label="${label}"><span>${formatter.format(displayedTemperature)}°</span></button>`;
        }).join('')}<span class="timeline-arrow" aria-hidden="true"></span></div>` : `<div class="heat-days-timeline empty" style="--month-count:${monthCount}"><span class="timeline-arrow" aria-hidden="true"></span></div>`}</div>`;
      }).join('')}
    </article>`).join('');
}

function openHeatDayYear(year) {
  if (!validMetrics.includes(document.querySelector('#metric').value)) return;
  const select = document.querySelector('#heat-day-year');
  if (![...select.options].some(option => Number(option.value) === year)) return;
  if (selectedHeatDayYears.includes(year)) {
    if (selectedHeatDayYears.length > 1) selectedHeatDayYears = selectedHeatDayYears.filter(selectedYear => selectedYear !== year);
  } else {
    selectedHeatDayYears = [...selectedHeatDayYears, year].sort((a, b) => a - b);
  }
  select.value = String(year);
  detailYearChart.querySelectorAll('.year-group').forEach(group => {
    const selected = selectedHeatDayYears.includes(Number(group.dataset.year));
    group.classList.toggle('selected', selected);
    group.setAttribute('aria-pressed', String(selected));
  });
  loadHeatDayDetails();
}

async function loadHeatDayDetails(ids = selectedStationIds()) {
  const container = document.querySelector('#heat-days-detail');
  if (!ids.length || !selectedHeatDayYears.length) return;
  const metricKey = document.querySelector('#metric').value;
  container.innerHTML = `<p class="heat-days-empty">${tr(metricKey === 'frostDays' ? 'frostDaysLoading' : metricKey === 'iceDays' ? 'iceDaysLoading' : 'heatDaysLoading')}</p>`;
  try {
    const groups = await Promise.all(selectedHeatDayYears.map(async year => ({ year, items: await Promise.all(ids.map(id => fetchDetailDays(id, year))) })));
    if (latestView) latestView.heatDays = groups;
    renderHeatDays(groups, latestView?.data || []);
  } catch (error) {
    container.innerHTML = `<p class="heat-days-empty">${error.message}</p>`;
  }
}

function renderForecast(forecasts) {
  const container = document.querySelector('#forecast');
  const generated = forecasts.map(item => item.generatedAtUtc).filter(Boolean).sort().at(-1);
  document.querySelector('#forecast-updated').textContent = generated
    ? `${tr('forecastRun')} ${new Date(`${generated}Z`).toLocaleString(locale(), { dateStyle: 'short', timeStyle: 'short' })}`
    : '';
  container.innerHTML = forecasts.map((item, stationIndex) => `
    <section class="forecast-station" style="--station-color:${colors[stationIndex]}">
      <h3>${item.station.name}</h3>
      <div class="forecast-days">${item.values.length ? item.values.map(day => {
        const date = new Date(`${day.date}T12:00:00`);
        const labels = [day.predictedHeatDay ? `<b class="event heat">${tr('heatDay')}</b>` : '', day.predictedTropicalNight ? `<b class="event tropical">${tr('tropicalNight')}</b>` : ''].filter(Boolean).join('');
        return `<article class="forecast-day">
          <time datetime="${day.date}">${date.toLocaleDateString(locale(), { weekday: 'short', day: '2-digit', month: '2-digit' })}</time>
          <strong>${day.maximumTemperatureCelsius.toFixed(1)}°</strong>
          <span>min. ${day.minimumTemperatureCelsius.toFixed(1)} °C</span>
          <div class="events">${labels}</div>
        </article>`;
      }).join('') : `<p>${tr('noForecast')}</p>`}</div>
    </section>`).join('');
}

function averageForPeriod(values, metricKey, fromYear, toYear) {
  const period = values.filter(value => value.year >= fromYear && value.year <= toYear);
  return period.length ? period.reduce((sum, value) => sum + value[metricKey], 0) / period.length : null;
}

function trendPerDecade(values, metricKey) {
  const complete = values.filter(value => value.year >= 1990 && value.year < currentYear);
  if (complete.length < 2) return null;
  const meanYear = complete.reduce((sum, value) => sum + value.year, 0) / complete.length;
  const meanValue = complete.reduce((sum, value) => sum + value[metricKey], 0) / complete.length;
  const numerator = complete.reduce((sum, value) => sum + (value.year - meanYear) * (value[metricKey] - meanValue), 0);
  const denominator = complete.reduce((sum, value) => sum + (value.year - meanYear) ** 2, 0);
  return denominator ? numerator / denominator * 10 : null;
}

function removeDetailYear(year) {
  if (selectedHeatDayYears.length <= 1 || !selectedHeatDayYears.includes(year)) return;
  selectedHeatDayYears = selectedHeatDayYears.filter(selectedYear => selectedYear !== year);
  document.querySelector('#heat-day-year').value = String(selectedHeatDayYears.at(-1));
  detailYearChart.querySelectorAll('.year-group').forEach(group => {
    const selected = selectedHeatDayYears.includes(Number(group.dataset.year));
    group.classList.toggle('selected', selected);
    group.setAttribute('aria-pressed', String(selected));
  });
  loadHeatDayDetails();
}

function forecastMatchesMetric(day, metricKey) {
  if (metricKey === 'heatDays') return day.predictedHeatDay;
  if (metricKey === 'summerDays') return day.maximumTemperatureCelsius >= 25;
  if (metricKey === 'veryHotDays') return day.maximumTemperatureCelsius >= 35;
  if (metricKey === 'frostDays') return day.minimumTemperatureCelsius < 0;
  if (metricKey === 'iceDays') return day.maximumTemperatureCelsius < 0;
  return day.predictedTropicalNight;
}

function renderClimateContext(contexts, forecasts) {
  const metricKey = document.querySelector('#metric').value;
  const metric = metricInfo(metricKey);
  const formatter = new Intl.NumberFormat(locale(), { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const forecastCounts = new Map(forecasts.map(item => [item.station.id, item.values.filter(day => day.date.startsWith(String(currentYear)) && forecastMatchesMetric(day, metricKey)).length]));
  document.querySelector('#context-year').textContent = `${currentYear} · ${tr('provisional')}`;
  document.querySelector('#climate-context').innerHTML = contexts.map((item, index) => {
    const current = item.values.find(value => value.year === currentYear);
    const measured = current?.[metricKey] || 0;
    const predicted = forecastCounts.get(item.station.id) || 0;
    const projected = measured + predicted;
    const average20 = averageForPeriod(item.values, metricKey, currentYear - 20, currentYear - 1);
    const normal = averageForPeriod(item.values, metricKey, 1991, 2020);
    const rank = 1 + item.values.filter(value => value.year >= 1990 && value.year < currentYear && value[metricKey] > projected).length;
    return `<article class="context-card" style="--station-color:${colors[index]}">
      <h3>${item.station.name}</h3>
      <div class="context-current"><strong>${measured}${predicted ? ` + ${predicted}` : ''}</strong><span>${predicted ? tr('measuredForecast') : tr('measured')}</span></div>
      <div class="context-facts">
        <div class="context-fact"><span>${tr('last20')}</span><strong>${average20 == null ? '–' : formatter.format(average20)}</strong><small>${tr('annualAverage')}</small></div>
        <div class="context-fact"><span>${tr('normal')}</span><strong>${normal == null ? '–' : formatter.format(normal)}</strong><small>${tr('annualAverage')}</small></div>
        <div class="context-fact"><span>${tr('rankSince')}</span><strong>${rank}.</strong><small>${predicted ? tr('withForecast') : tr('provisional')}</small></div>
      </div>
    </article>`;
  }).join('');

  document.querySelector('#top-years-title').textContent = `${metric.label}: ${tr('topYears')}`;
  document.querySelector('#top-years').innerHTML = contexts.map((item, index) => {
    const predicted = forecastCounts.get(item.station.id) || 0;
    const entries = item.values.filter(value => value.year >= 1990).map(value => ({
      year: value.year,
      measured: value[metricKey],
      predicted: value.year === currentYear ? predicted : 0,
      total: value[metricKey] + (value.year === currentYear ? predicted : 0)
    }));
    if (!entries.some(entry => entry.year === currentYear) && predicted) entries.push({ year: currentYear, measured: 0, predicted, total: predicted });
    const topFive = entries.sort((a, b) => b.total - a.total || b.year - a.year).slice(0, 5);
    return `<article class="top-years-card" style="--station-color:${colors[index]}"><h4>${item.station.name}</h4>${topFive.map((entry, rankIndex) => `<div class="top-year-row ${entry.year === currentYear ? 'provisional' : ''}">
      <span class="top-year-rank">${rankIndex + 1}.</span><span>${entry.year}</span><span class="top-year-value">${entry.measured}${entry.predicted ? ` + ${entry.predicted}` : ''}</span>
      ${entry.year === currentYear ? `<small>${tr('provisional')}${entry.predicted ? ` · ${tr('measuredForecast')}` : ''}</small>` : ''}
    </div>`).join('')}</article>`;
  }).join('');

  const stationHeaders = contexts.map(item => `<th>${item.station.name}</th>`).join('');
  const detailRows = [
    [tr('trend'), item => { const value = trendPerDecade(item.values, 'heatDays'); return value == null ? '–' : `${value >= 0 ? '+' : ''}${formatter.format(value)}`; }, `${tr('heatDays')} ${tr('perDecade')}`],
    [tr('summerDays'), item => item.values.find(value => value.year === currentYear)?.summerDays ?? '–', 'Maximum ≥ 25 °C'],
    [tr('veryHotDays'), item => item.values.find(value => value.year === currentYear)?.veryHotDays ?? '–', 'Maximum ≥ 35 °C'],
    [tr('longestHeatWave'), item => { const value = item.values.find(entry => entry.year === currentYear)?.longestHeatWaveDays; return value == null ? '–' : `${value} ${tr('days')}`; }, 'Maximum ≥ 30 °C'],
    [tr('longestFrostPeriod'), item => { const value = item.values.find(entry => entry.year === currentYear)?.longestFrostPeriodDays; return value == null ? '–' : `${value} ${tr('days')}`; }, 'Minimum < 0 °C'],
    [tr('warmestNight'), item => { const value = item.values.find(entry => entry.year === currentYear)?.warmestNightCelsius; return value == null ? '–' : `${formatter.format(value)} °C`; }, tr('tropicalThreshold')]
  ];
  document.querySelector('#climate-details').innerHTML = `<table class="climate-table"><thead><tr><th>${tr('indicator')}</th>${stationHeaders}<th>${tr('definition')}</th></tr></thead><tbody>${detailRows.map(row => `<tr><td>${row[0]}</td>${contexts.map(item => `<td>${row[1](item)}</td>`).join('')}<td>${row[2]}</td></tr>`).join('')}</tbody></table>`;
}

function renderComparison(data, forecasts, from, to) {
  const metricKey = document.querySelector('#metric').value;
  const metric = metricInfo(metricKey);
  const forecastCounts = new Map(forecasts.map(item => [item.station.id,
    item.values.filter(day => day.date.startsWith(String(currentYear)) && forecastMatchesMetric(day, metricKey)).length
  ]));
  const years = Array.from({ length: to - from + 1 }, (_, index) => from + index);
  const maximum = Math.max(1, ...data.flatMap(item => item.values.map(value =>
    value[metricKey] + (value.year === currentYear ? (forecastCounts.get(item.station.id) || 0) : 0)
  )));
  document.querySelector('#result-title').textContent = `${metric.label} ${tr('perYear')}`;
  legend.innerHTML = data.map((item, index) => `<span><i style="background:${colors[index]}"></i>${item.station.name}</span>`).join('')
    + `<span class="forecast-key"><i></i>${tr('forecastHatched')}</span>`;
  chart.className = 'chart';
  chart.setAttribute('aria-label', `Balkendiagramm: ${metric.label} von ${from} bis ${to}`);
  chart.innerHTML = `<div class="y-axis"><span>${maximum}</span><span>${Math.round(maximum / 2)}</span><span>0</span></div><div class="plot">${years.map(year => {
    const bars = data.map((item, index) => {
      const value = item.values.find(entry => entry.year === year); const count = value?.[metricKey] ?? 0;
      const predicted = year === currentYear ? (forecastCounts.get(item.station.id) || 0) : 0;
      const total = count + predicted;
      const details = value ? `${count} ${tr('measured')}${predicted ? ` + ${predicted} ${tr('predicted')}` : ''}; ${metric.extremeLabel} ${value[metric.extremeKey].toFixed(1)} °C` : tr('noData');
      const measuredShare = total ? count / total * 100 : 0;
      const forecastShare = total ? predicted / total * 100 : 0;
      return `<div class="bar-stack ${value || predicted ? '' : 'no-data'}" style="height:${total / maximum * 100}%;--bar-color:${colors[index]}" title="${item.station.name}: ${details}">
        <span>${value || predicted ? (total || '') : '–'}</span>
        ${predicted ? `<div class="bar-forecast" style="height:${forecastShare}%"></div>` : ''}
        <div class="bar-measured" style="height:${measuredShare}%"></div>
      </div>`;
    }).join('');
    const selected = selectedHeatDayYears.includes(year);
    return `<div class="year-group ${selected ? 'selected' : ''}" data-year="${year}" role="button" tabindex="0" aria-pressed="${selected}" aria-label="${year}: ${tr('heatDaysHint')}" title="${tr('heatDaysHint')}"><div class="bars">${bars}</div><span class="year-label">${year}</span></div>`;
  }).join('')}</div>`;
  detailYearLegend.innerHTML = legend.innerHTML;
  detailYearChart.className = 'chart';
  detailYearChart.setAttribute('aria-label', chart.getAttribute('aria-label'));
  detailYearChart.innerHTML = chart.innerHTML;
  chart.querySelectorAll('.year-group').forEach(group => {
    group.classList.remove('selected');
    group.classList.add('readonly');
    group.removeAttribute('data-year');
    group.removeAttribute('role');
    group.removeAttribute('tabindex');
    group.removeAttribute('aria-pressed');
    group.removeAttribute('aria-label');
    group.removeAttribute('title');
  });
  results.innerHTML = data.map((item, index) => {
    const total = item.values.reduce((sum, value) => sum + value[metricKey], 0);
    const predicted = forecastCounts.get(item.station.id) || 0;
    const coldMetric = metricKey === 'frostDays' || metricKey === 'iceDays';
    const extreme = item.values.reduce((best, value) => !best
      || (coldMetric ? value[metric.extremeKey] < best[metric.extremeKey] : value[metric.extremeKey] > best[metric.extremeKey]) ? value : best, null);
    return `<article class="summary" style="--station-color:${colors[index]}"><span>${item.station.name}</span><strong>${total}${predicted ? `<em> + ${predicted}</em>` : ''}</strong><small>${metric.label} ${tr('measured')}${predicted ? ` · ${predicted} ${tr('currentForecast')}` : ''}${extreme ? ` · ${metric.extremeLabel} ${extreme[metric.extremeKey].toFixed(1)} °C (${extreme.year})` : ''}</small></article>`;
  }).join('');
  const heatwaveHighlight = document.querySelector('#heatwave-highlight');
  const warmRecord = ['heatDays', 'summerDays', 'veryHotDays'].includes(metricKey);
  const coldRecord = ['frostDays', 'iceDays'].includes(metricKey);
  const recordKey = coldRecord ? 'longestFrostPeriodDays' : 'longestHeatWaveDays';
  heatwaveHighlight.hidden = !warmRecord && !coldRecord;
  if (warmRecord || coldRecord) {
    heatwaveHighlight.innerHTML = `<h3>${tr(coldRecord ? 'frostPeriodHighlight' : 'heatwaveHighlight')}</h3><div>${data.map((item, index) => {
      const record = item.values.reduce((best, value) => !best || value[recordKey] > best[recordKey] ? value : best, null);
      return `<article style="--station-color:${colors[index]}"><span>${item.station.name}</span><strong>${record?.[recordKey] || 0} <small>${tr('days')}</small></strong><em>${record?.year || '–'}</em></article>`;
    }).join('')}</div>`;
  }
}

function renderOverview(data, forecasts, from, to) {
  const metricKey = document.querySelector('#metric').value;
  const metric = metricInfo(metricKey);
  const warmRecord = ['heatDays', 'summerDays', 'veryHotDays'].includes(metricKey);
  const coldRecord = ['frostDays', 'iceDays'].includes(metricKey);
  const recordKey = coldRecord ? 'longestFrostPeriodDays' : 'longestHeatWaveDays';
  const recordLabel = tr(coldRecord ? 'longestFrostPeriod' : 'longestHeatWave');
  const extremeKey = coldRecord ? 'minimumTemperatureCelsius' : 'maximumTemperatureCelsius';
  const extremeLabel = tr(coldRecord ? 'coldestDay' : 'warmestDay');
  const formatter = new Intl.NumberFormat(locale(), { minimumFractionDigits: 0, maximumFractionDigits: 1 });
  const forecastCounts = new Map(forecasts.map(item => [item.station.id,
    item.values.filter(day => day.date.startsWith(String(currentYear)) && forecastMatchesMetric(day, metricKey)).length
  ]));
  const rows = data.map(item => {
    const values = item.values.map(value => value[metricKey]);
    const currentValue = item.values.find(value => value.year === currentYear);
    return {
      name: item.station.name,
      current: currentValue?.[metricKey] ?? null,
      average: values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0,
      forecast: forecastCounts.get(item.station.id) || 0,
      record: warmRecord || coldRecord ? currentValue : null,
      extreme: warmRecord || coldRecord ? currentValue?.[extremeKey] : null
    };
  });
  const card = (title, key) => `<article><h3>${title}</h3>${rows.map((row, index) => `<div class="overview-value" style="--station-color:${colors[index]}"><span>${row.name}</span><strong>${row[key] == null ? '–' : formatter.format(row[key])}</strong><small>${row[key] == null ? tr('noData') : metric.label}</small>${key === 'current' && row.record ? `<strong class="overview-record-value">${row.record[recordKey]}</strong><small class="overview-record overview-record-series">${recordLabel} (${tr('days')})</small><strong class="overview-record-value">${formatter.format(row.extreme)}°</strong><small class="overview-record">${extremeLabel} (°C)</small>` : ''}</div>`).join('')}</article>`;
  document.querySelector('#overview-summary').innerHTML = card(`${tr('currentYearShort')} (${currentYear})`, 'current')
    + card(`${tr('periodAverage')} (${from}–${to})`, 'average')
    + card(tr('nextDaysShort'), 'forecast');
  const years = Array.from({ length: to - from + 1 }, (_, index) => from + index);
  const maximum = Math.max(1, ...data.flatMap(item => item.values.map(value => value[metricKey] || 0)));
  document.querySelector('#overview-chart-period').textContent = `${from}–${to}`;
  document.querySelector('#overview-chart-legend').innerHTML = data.map((item, index) => `<span><i style="background:${colors[index]}"></i>${item.station.name}</span>`).join('');
  document.querySelector('#overview-chart-preview').innerHTML = years.map(year => {
    const bars = data.map((item, index) => {
      const value = item.values.find(entry => entry.year === year)?.[metricKey] || 0;
      return `<span class="overview-mini-bar" style="height:${Math.max(2, value / maximum * 100)}%;background:${colors[index]}" title="${item.station.name}: ${value}"></span>`;
    }).join('');
    return `<div class="overview-mini-year"><div>${bars}</div><small>${year}</small></div>`;
  }).join('');
  renderViewFilterSummary(data, from, to);
}

function renderLatestView() {
  if (!latestView) return;
  const { data, forecasts, contexts, heatDays, from, to, stationCount: count } = latestView;
  latestForecasts = forecasts;
  renderComparison(data, forecasts, from, to);
  renderHeatDays(heatDays, data);
  renderClimateContext(contexts, forecasts);
  renderForecast(forecasts);
  renderOverview(data, forecasts, from, to);
  const metric = metricInfo(document.querySelector('#metric').value);
  status.textContent = `${count} ${tr('stations')} · ${from}–${to} · ${metric.threshold}`;
}

async function compare() {
  const ids = selectedStationIds(); const from = Number(document.querySelector('#fromYear').value); const to = Number(document.querySelector('#toYear').value);
  applyMetricColors(document.querySelector('#metric').value);
  if (ids.length < 1) { status.textContent = tr('selectOne'); return; }
  if (new Set(ids).size !== ids.length) { status.textContent = tr('uniqueStations'); return; }
  if (from > to || to - from > 50) { status.textContent = tr('invalidPeriod'); return; }
  status.textContent = `${ids.length} ${tr('loading')}`;
  try {
    populateHeatDayYears(from, to);
    const [data, forecasts, contexts, heatDays] = await Promise.all([
      Promise.all(ids.map(id => fetchStation(id, from, to))),
      Promise.all(ids.map(id => fetchForecast(id))),
      Promise.all(ids.map(id => fetchStation(id, 1990, currentYear))),
      Promise.all(selectedHeatDayYears.map(async year => ({ year, items: await Promise.all(ids.map(id => fetchDetailDays(id, year))) })))
    ]);
    latestView = { data, forecasts, contexts, heatDays, from, to, stationCount: ids.length };
    renderLatestView();
    await loadPrecipitation();
  }
  catch (error) { status.textContent = error.message; chart.className = 'chart-empty'; chart.innerHTML = `<p>${tr('noResults')}</p>`; }
}

function addStationFromSearch(stationId) {
  const input = document.querySelector('#station-add-search');
  const query = normalized(input.value.trim());
  const station = stationId
    ? stations.find(item => item.id === stationId)
    : matchingStations(query)[0];
  if (!station) return;
  input.value = '';
  document.querySelector('#station-add-options').hidden = true;
  input.setAttribute('aria-expanded', 'false');
  addStation(station.id);
  document.querySelector('#station-add-options').hidden = true;
  input.setAttribute('aria-expanded', 'false');
  renderMap({ fitToQuery: true });
}

document.querySelector('#station-add-search').addEventListener('input', () => {
  populateStationSearch();
  renderMap({ fitToQuery: true });
});
document.querySelector('#station-add-search').addEventListener('focus', populateStationSearch);
document.querySelector('#station-add-search').addEventListener('blur', () => setTimeout(() => {
  document.querySelector('#station-add-options').hidden = true;
  document.querySelector('#station-add-search').setAttribute('aria-expanded', 'false');
}, 150));
document.querySelector('#station-add-search').addEventListener('keydown', event => {
  if (event.key === 'Enter') {
    event.preventDefault();
    addStationFromSearch();
  }
});
const desktopMapQuery = window.matchMedia('(min-width: 980px)');
let mapResizeTimer;
function refreshVisibleMap() {
  const panel = document.querySelector('#map-panel');
  if (currentView !== 'overview' || panel.hidden) return;
  requestAnimationFrame(() => requestAnimationFrame(() => {
    renderMap();
    stationMap?.invalidateSize({ pan: false });
    clearTimeout(mapResizeTimer);
    mapResizeTimer = setTimeout(() => stationMap?.invalidateSize({ pan: false }), 150);
  }));
}

function syncMapLayout() {
  const button = document.querySelector('#map-toggle');
  const panel = document.querySelector('#map-panel');
  if (desktopMapQuery.matches) {
    button.setAttribute('aria-expanded', 'true');
    panel.hidden = false;
    refreshVisibleMap();
  } else {
    button.setAttribute('aria-expanded', 'false');
    panel.hidden = true;
  }
}
desktopMapQuery.addEventListener('change', syncMapLayout);
document.querySelector('#map-toggle').addEventListener('click', event => {
  const button = event.currentTarget;
  const open = button.getAttribute('aria-expanded') === 'true';
  button.setAttribute('aria-expanded', String(!open));
  document.querySelector('#map-panel').hidden = open;
  if (!open) {
    refreshVisibleMap();
  }
});
document.querySelector('#metric').addEventListener('change', event => changeMetric(event.target.value));
document.querySelectorAll('[data-country]').forEach(button => button.addEventListener('click', () => chooseCountry(button.dataset.country)));
document.querySelector('#view-filter-summary').addEventListener('change', event => {
  if (event.target.matches('.view-metric-select')) changeMetric(event.target.value);
});
document.querySelector('#fromYear').addEventListener('change', compare);
document.querySelector('#toYear').addEventListener('change', compare);
document.querySelector('#precipitation-to-date').addEventListener('change', event => {
  precipitationToDate = event.target.checked;
  renderPrecipitation();
});
document.querySelector('#heat-day-year').addEventListener('change', event => { selectedHeatDayYears = [Number(event.target.value)]; loadHeatDayDetails(); });
document.querySelector('#heat-days-detail').addEventListener('click', event => {
  const button = event.target.closest('.remove-detail-year');
  if (button) removeDetailYear(Number(button.dataset.year));
});
document.querySelector('#precipitation-annual').addEventListener('click', async event => {
  const group = event.target.closest('[data-rain-group]');
  if (!group) return;
  const year = Number(group.dataset.rainGroup);
  if (selectedPrecipitationYears.includes(year)) {
    if (selectedPrecipitationYears.length === 1) return;
    selectedPrecipitationYears = selectedPrecipitationYears.filter(value => value !== year);
  } else selectedPrecipitationYears.push(year);
  document.querySelector('#precipitation-annual').querySelectorAll('[data-rain-group]').forEach(el => el.classList.toggle('selected', selectedPrecipitationYears.includes(Number(el.dataset.rainGroup))));
  await loadPrecipitationComparison();
});
document.querySelector('#precipitation-compare-daily').addEventListener('click', event => {
  const marker = event.target.closest('.precipitation-month-marker');
  if (marker) openPrecipitationDayDialog(marker.closest('[data-station-id]').dataset.stationId, Number(marker.dataset.rainYear), Number(marker.dataset.rainMonth));
});
const precipitationDayDialog = document.querySelector('#precipitation-day-dialog');
document.querySelector('#precipitation-day-dialog-close').addEventListener('click', () => precipitationDayDialog.close());
precipitationDayDialog.addEventListener('click', event => { if (event.target === precipitationDayDialog) precipitationDayDialog.close(); });
detailYearChart.addEventListener('click', event => {
  const group = event.target.closest('.year-group');
  if (group) openHeatDayYear(Number(group.dataset.year));
});
detailYearChart.addEventListener('keydown', event => {
  const group = event.target.closest('.year-group');
  if (group && (event.key === 'Enter' || event.key === ' ')) {
    event.preventDefault();
    openHeatDayYear(Number(group.dataset.year));
  }
});
document.querySelector('#language').addEventListener('change', async event => {
  const requestedLanguage = event.target.value;
  try {
    await loadTranslations(requestedLanguage);
    currentLanguage = requestedLanguage;
    applyLanguage();
    renderLatestView();
    renderPrecipitation();
  } catch (error) {
    event.target.value = currentLanguage;
    status.textContent = 'Die gewählte Sprache konnte nicht geladen werden.';
  }
});
document.querySelector('#climate-details-toggle').addEventListener('click', event => {
  const button = event.currentTarget;
  const open = button.getAttribute('aria-expanded') === 'true';
  button.setAttribute('aria-expanded', String(!open));
  document.querySelector('#climate-details').classList.toggle('open', !open);
});
document.addEventListener('click', event => {
  const link = event.target.closest('[data-view-link]');
  if (!link) return;
  event.preventDefault();
  setView(link.dataset.viewLink);
});
window.addEventListener('popstate', () => {
  const requested = new URLSearchParams(location.search).get('view') || 'overview';
  setView(requested, false);
});
const feedbackDialog = document.querySelector('#feedback-dialog');
const closeFeedback = () => feedbackDialog.close();
document.querySelector('#feedback-open').addEventListener('click', () => {
  document.querySelector('#feedback-form').reset();
  document.querySelector('#feedback-status').textContent = '';
  document.querySelector('#feedback-fields').hidden = false;
  document.querySelector('#feedback-success').hidden = true;
  feedbackDialog.showModal();
  document.querySelector('#feedback-message').focus();
});
document.querySelector('#feedback-close').addEventListener('click', closeFeedback);
document.querySelector('#feedback-cancel').addEventListener('click', closeFeedback);
feedbackDialog.addEventListener('click', event => {
  if (event.target === feedbackDialog) closeFeedback();
});
document.querySelector('#feedback-form').addEventListener('submit', async event => {
  event.preventDefault();
  const submit = document.querySelector('#feedback-submit');
  const feedbackStatus = document.querySelector('#feedback-status');
  submit.disabled = true;
  submit.textContent = tr('feedbackSending');
  feedbackStatus.textContent = '';
  try {
    const response = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: document.querySelector('#feedback-message').value, email: document.querySelector('#feedback-email').value, language: currentLanguage, website: document.querySelector('#feedback-website').value })
    });
    if (!response.ok) throw new Error(response.status === 429 ? 'too-fast' : 'failed');
    event.target.reset();
    document.querySelector('#feedback-fields').hidden = true;
    document.querySelector('#feedback-success').hidden = false;
  } catch (error) {
    feedbackStatus.textContent = tr(error.message === 'too-fast' ? 'feedbackTooFast' : 'feedbackError');
  } finally {
    submit.disabled = false;
    submit.textContent = tr('feedbackSend');
  }
});
try {
  const storedMetric = localStorage.getItem('hitzetage.metric');
  if (validMetrics.includes(storedMetric)) document.querySelector('#metric').value = storedMetric;
} catch (error) { /* Storage may be unavailable. */ }
async function initializeApplication() {
  await loadTranslations('de');
  applyLanguage();
  setView(currentView, false);
  syncMapLayout();
  await loadStations();
}

initializeApplication().catch(error => {
  console.error(error);
  status.textContent = 'Die Anwendung konnte nicht vollständig geladen werden.';
});
