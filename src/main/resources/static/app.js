const selectors = document.querySelector('#station-selectors');
const status = document.querySelector('#status');
const chart = document.querySelector('#chart');
const results = document.querySelector('#results');
const legend = document.querySelector('#legend');
const stationCount = document.querySelector('#station-count');
const colors = ['#c85532', '#1e6a55', '#e0a52f', '#5268a5', '#8a5a91', '#4a8ea5'];
const translations = {
  de: { language:'Sprache', eyebrow:'MeteoSwiss-Messstationen', title:'Hitzetage in der Schweiz', intro:'Vergleiche Messstationen und entdecke, wie häufig die Tageshöchsttemperatur 30 °C erreicht hat.', selectionTitle:'Stationen und Zeitraum', station:'Messstation', stations:'Stationen', addStation:'+ Station hinzufügen', removeStation:'Station entfernen', from:'Von', to:'Bis', metric:'Kennzahl', compare:'Stationen vergleichen', source:'Quelle: MeteoSwiss', forecastTitle:'Prognose für die nächsten neun Tage', forecastLoading:'Prognose wird mit dem Vergleich geladen.', footer:'Quelle: MeteoSwiss Open Data · Hitzetag: Maximum ≥ 30 °C · Tropennacht: Minimum ≥ 20 °C', heatDays:'Hitzetage', tropicalNights:'Tropennächte', heatOption:'Hitzetage (Maximum ≥ 30 °C)', tropicalOption:'Tropennächte (Minimum ≥ 20 °C)', heatThreshold:'Tagesmaximum ≥ 30 °C', tropicalThreshold:'Tagesminimum ≥ 20 °C', highest:'Höchstwert', lowest:'Tiefster Tageswert', perYear:'pro Jahr', forecastHatched:'Prognose (schraffiert)', measured:'gemessen', predicted:'prognostiziert', noData:'Keine Daten', forecastRun:'Prognoselauf', heatDay:'Hitzetag', tropicalNight:'Tropennacht', noForecast:'Für diese Station ist keine Punktprognose verfügbar.', selectTwo:'Bitte mindestens zwei Stationen auswählen.', uniqueStations:'Bitte jede Station nur einmal auswählen.', invalidPeriod:'Bitte einen Zeitraum von höchstens 50 Jahren auswählen.', loading:'Stationen werden geladen …', noResults:'Keine Ergebnisse.', currentForecast:'im aktuellen Prognoselauf' },
  fr: { language:'Langue', eyebrow:'Stations MeteoSwiss', title:'Journées de chaleur en Suisse', intro:'Comparez les stations et découvrez combien de fois la température maximale a atteint 30 °C.', selectionTitle:'Stations et période', station:'Station de mesure', stations:'stations', addStation:'+ Ajouter une station', removeStation:'Supprimer la station', from:'De', to:'À', metric:'Indicateur', compare:'Comparer les stations', source:'Source : MeteoSwiss', forecastTitle:'Prévisions pour les neuf prochains jours', forecastLoading:'Les prévisions sont chargées avec la comparaison.', footer:'Source : MeteoSwiss Open Data · Journée de chaleur : maximum ≥ 30 °C · Nuit tropicale : minimum ≥ 20 °C', heatDays:'Journées de chaleur', tropicalNights:'Nuits tropicales', heatOption:'Journées de chaleur (maximum ≥ 30 °C)', tropicalOption:'Nuits tropicales (minimum ≥ 20 °C)', heatThreshold:'Maximum journalier ≥ 30 °C', tropicalThreshold:'Minimum journalier ≥ 20 °C', highest:'Maximum', lowest:'Minimum journalier le plus bas', perYear:'par an', forecastHatched:'Prévision (hachurée)', measured:'mesuré', predicted:'prévu', noData:'Aucune donnée', forecastRun:'Prévision du', heatDay:'Journée chaude', tropicalNight:'Nuit tropicale', noForecast:'Aucune prévision ponctuelle disponible pour cette station.', selectTwo:'Veuillez sélectionner au moins deux stations.', uniqueStations:'Veuillez sélectionner chaque station une seule fois.', invalidPeriod:'Veuillez choisir une période de 50 ans au maximum.', loading:'Chargement des stations…', noResults:'Aucun résultat.', currentForecast:'dans la prévision actuelle' },
  it: { language:'Lingua', eyebrow:'Stazioni MeteoSwiss', title:'Giornate di caldo in Svizzera', intro:'Confronta le stazioni e scopri quante volte la temperatura massima ha raggiunto 30 °C.', selectionTitle:'Stazioni e periodo', station:'Stazione di misura', stations:'stazioni', addStation:'+ Aggiungi stazione', removeStation:'Rimuovi stazione', from:'Da', to:'A', metric:'Indicatore', compare:'Confronta stazioni', source:'Fonte: MeteoSwiss', forecastTitle:'Previsioni per i prossimi nove giorni', forecastLoading:'Le previsioni vengono caricate con il confronto.', footer:'Fonte: MeteoSwiss Open Data · Giorno di caldo: massima ≥ 30 °C · Notte tropicale: minima ≥ 20 °C', heatDays:'Giornate di caldo', tropicalNights:'Notti tropicali', heatOption:'Giornate di caldo (massima ≥ 30 °C)', tropicalOption:'Notti tropicali (minima ≥ 20 °C)', heatThreshold:'Massima giornaliera ≥ 30 °C', tropicalThreshold:'Minima giornaliera ≥ 20 °C', highest:'Valore massimo', lowest:'Minimo giornaliero più basso', perYear:"all'anno", forecastHatched:'Previsione (tratteggiata)', measured:'misurato', predicted:'previsto', noData:'Nessun dato', forecastRun:'Previsione del', heatDay:'Giorno caldo', tropicalNight:'Notte tropicale', noForecast:'Nessuna previsione puntuale disponibile per questa stazione.', selectTwo:'Seleziona almeno due stazioni.', uniqueStations:'Seleziona ogni stazione una sola volta.', invalidPeriod:'Seleziona un periodo massimo di 50 anni.', loading:'Caricamento stazioni…', noResults:'Nessun risultato.', currentForecast:'nella previsione attuale' },
  rm: { language:'Lingua', eyebrow:'Staziuns da MeteoSwiss', title:'Dis da chalira en Svizra', intro:'Cumpareglia staziuns e scuvra quants dis che la temperatura maximala ha cuntanschì 30 °C.', selectionTitle:'Staziuns e perioda', station:'Staziun da mesiraziun', stations:'staziuns', addStation:'+ Agiuntar staziun', removeStation:'Allontanar staziun', from:'Da', to:'Fin', metric:'Indicatur', compare:'Cumparegliar staziuns', source:'Funtauna: MeteoSwiss', forecastTitle:'Prognosa per ils proxims nov dis', forecastLoading:'La prognosa vegn chargiada cun la cumparegliaziun.', footer:'Funtauna: MeteoSwiss Open Data · Di da chalira: maximum ≥ 30 °C · Notg tropica: minimum ≥ 20 °C', heatDays:'Dis da chalira', tropicalNights:'Notgs tropicas', heatOption:'Dis da chalira (maximum ≥ 30 °C)', tropicalOption:'Notgs tropicas (minimum ≥ 20 °C)', heatThreshold:'Maximum dal di ≥ 30 °C', tropicalThreshold:'Minimum dal di ≥ 20 °C', highest:'Valur maximala', lowest:'Valur minimala dal di', perYear:'per onn', forecastHatched:'Prognosa (strivlada)', measured:'mesirà', predicted:'prognostitgà', noData:'Naginas datas', forecastRun:'Prognosa dals', heatDay:'Di da chalira', tropicalNight:'Notg tropica', noForecast:'Naginas prognosas localas disponiblas per questa staziun.', selectTwo:'Tscherna almain duas staziuns.', uniqueStations:'Tscherna mintga staziun mo ina giada.', invalidPeriod:'Tscherna ina perioda da maximalmain 50 onns.', loading:'Las staziuns vegnan chargiadas…', noResults:'Nagins resultats.', currentForecast:'en la prognosa actuala' },
  en: { language:'Language', eyebrow:'MeteoSwiss stations', title:'Heat days in Switzerland', intro:'Compare stations and discover how often the daily maximum temperature reached 30 °C.', selectionTitle:'Stations and period', station:'Weather station', stations:'stations', addStation:'+ Add station', removeStation:'Remove station', from:'From', to:'To', metric:'Metric', compare:'Compare stations', source:'Source: MeteoSwiss', forecastTitle:'Forecast for the next nine days', forecastLoading:'The forecast is loaded with the comparison.', footer:'Source: MeteoSwiss Open Data · Heat day: maximum ≥ 30 °C · Tropical night: minimum ≥ 20 °C', heatDays:'Heat days', tropicalNights:'Tropical nights', heatOption:'Heat days (maximum ≥ 30 °C)', tropicalOption:'Tropical nights (minimum ≥ 20 °C)', heatThreshold:'Daily maximum ≥ 30 °C', tropicalThreshold:'Daily minimum ≥ 20 °C', highest:'Highest value', lowest:'Lowest daily value', perYear:'per year', forecastHatched:'Forecast (hatched)', measured:'measured', predicted:'forecast', noData:'No data', forecastRun:'Forecast run', heatDay:'Heat day', tropicalNight:'Tropical night', noForecast:'No point forecast is available for this station.', selectTwo:'Please select at least two stations.', uniqueStations:'Please select each station only once.', invalidPeriod:'Please select a period of no more than 50 years.', loading:'Loading stations…', noResults:'No results.', currentForecast:'in the current forecast run' },
  zh: { language:'语言', eyebrow:'MeteoSwiss 气象站', title:'瑞士高温日', intro:'比较不同气象站，了解每日最高气温达到 30 °C 的频率。', selectionTitle:'气象站和时间范围', station:'气象站', stations:'个气象站', addStation:'+ 添加气象站', removeStation:'删除气象站', from:'从', to:'至', metric:'指标', compare:'比较气象站', source:'来源：MeteoSwiss', forecastTitle:'未来九天预报', forecastLoading:'预报将与比较结果一起加载。', footer:'来源：MeteoSwiss Open Data · 高温日：最高温 ≥ 30 °C · 热带夜：最低温 ≥ 20 °C', heatDays:'高温日', tropicalNights:'热带夜', heatOption:'高温日（最高温 ≥ 30 °C）', tropicalOption:'热带夜（最低温 ≥ 20 °C）', heatThreshold:'每日最高温 ≥ 30 °C', tropicalThreshold:'每日最低温 ≥ 20 °C', highest:'最高值', lowest:'最低日值', perYear:'每年', forecastHatched:'预报（斜线）', measured:'已测量', predicted:'预报', noData:'无数据', forecastRun:'预报更新时间', heatDay:'高温日', tropicalNight:'热带夜', noForecast:'此气象站暂无点位预报。', selectTwo:'请至少选择两个气象站。', uniqueStations:'每个气象站只能选择一次。', invalidPeriod:'请选择不超过 50 年的时间范围。', loading:'正在加载气象站…', noResults:'无结果。', currentForecast:'当前预报中' }
};
let currentLanguage = 'de';
const tr = key => translations[currentLanguage][key] || translations.de[key] || key;
const locale = () => ({de:'de-CH',fr:'fr-CH',it:'it-CH',rm:'rm-CH',en:'en-GB',zh:'zh-CN'}[currentLanguage]);
const metricInfo = key => key === 'heatDays'
  ? { label: tr('heatDays'), threshold: tr('heatThreshold'), extremeLabel: tr('highest'), extremeKey: 'maximumTemperatureCelsius' }
  : { label: tr('tropicalNights'), threshold: tr('tropicalThreshold'), extremeLabel: tr('lowest'), extremeKey: 'minimumTemperatureCelsius' };
let stations = [];
const currentYear = new Date().getFullYear();
document.querySelector('#fromYear').value = currentYear - 10;
document.querySelector('#toYear').value = currentYear;

function applyLanguage() {
  document.documentElement.lang = currentLanguage;
  document.querySelectorAll('[data-i18n]').forEach(element => { element.textContent = tr(element.dataset.i18n); });
  document.querySelector('#metric option[value="heatDays"]').textContent = tr('heatOption');
  document.querySelector('#metric option[value="tropicalNights"]').textContent = tr('tropicalOption');
  document.querySelectorAll('.station-row label').forEach(label => { label.childNodes[0].textContent = tr('station'); });
  document.querySelectorAll('.remove-station').forEach(button => button.setAttribute('aria-label', tr('removeStation')));
  updateStationCount();
}

function stationOptions(selectedId) {
  return stations.map(({ id, name, canton }) => `<option value="${id}" ${id === selectedId ? 'selected' : ''}>${name} (${canton})</option>`).join('');
}

function addStation(selectedId = '', removable = true) {
  const row = document.createElement('div');
  row.className = 'station-row';
  row.innerHTML = `<label>${tr('station')}<select class="station-select">${stationOptions(selectedId)}</select></label>${removable ? `<button class="remove-station" type="button" aria-label="${tr('removeStation')}">×</button>` : ''}`;
  row.querySelector('.remove-station')?.addEventListener('click', () => { row.remove(); updateStationCount(); });
  selectors.append(row); updateStationCount();
}

function updateStationCount() {
  const count = selectors.querySelectorAll('.station-row').length;
  stationCount.textContent = currentLanguage === 'zh' ? `${count} ${tr('stations')}` : `${count} ${count === 1 ? tr('station') : tr('stations')}`;
  document.querySelector('#add-station').disabled = count >= colors.length;
}

async function loadStations() {
  try {
    const response = await fetch('/api/stations');
    if (!response.ok) throw new Error(tr('noResults'));
    stations = await response.json();
    const preferred = ['SMA', 'BAS'].map(id => stations.find(station => station.id === id)?.id).filter(Boolean);
    addStation(preferred[0] || stations[0]?.id, false);
    addStation(preferred[1] || stations[1]?.id);
    await compare();
  } catch (error) { status.textContent = error.message; }
}

function selectedStationIds() { return [...document.querySelectorAll('.station-select')].map(select => select.value); }

async function fetchStation(id, from, to) {
  const response = await fetch(`/api/stations/${encodeURIComponent(id)}/annual-values?fromYear=${from}&toYear=${to}`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || `Daten für ${id} konnten nicht geladen werden.`);
  return data;
}

async function fetchForecast(id) {
  const response = await fetch(`/api/stations/${encodeURIComponent(id)}/forecast`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || `Prognose für ${id} konnte nicht geladen werden.`);
  return data;
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

function renderComparison(data, forecasts, from, to) {
  const metricKey = document.querySelector('#metric').value;
  const metric = metricInfo(metricKey);
  const forecastFlag = metricKey === 'heatDays' ? 'predictedHeatDay' : 'predictedTropicalNight';
  const forecastCounts = new Map(forecasts.map(item => [item.station.id,
    item.values.filter(day => day.date.startsWith(String(currentYear)) && day[forecastFlag]).length
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
      return `<div class="bar-stack" style="height:${total / maximum * 100}%;--bar-color:${colors[index]}" title="${item.station.name}: ${details}">
        <span>${total ? (predicted ? `${count}+${predicted}` : count) : ''}</span>
        ${predicted ? `<div class="bar-forecast" style="height:${forecastShare}%"></div>` : ''}
        <div class="bar-measured" style="height:${measuredShare}%"></div>
      </div>`;
    }).join('');
    return `<div class="year-group"><div class="bars">${bars}</div><span class="year-label">${year}</span></div>`;
  }).join('')}</div>`;
  results.innerHTML = data.map((item, index) => {
    const total = item.values.reduce((sum, value) => sum + value[metricKey], 0);
    const predicted = forecastCounts.get(item.station.id) || 0;
    const extreme = item.values.reduce((best, value) => !best || (metricKey === 'heatDays' ? value[metric.extremeKey] > best[metric.extremeKey] : value[metric.extremeKey] < best[metric.extremeKey]) ? value : best, null);
    return `<article class="summary" style="--station-color:${colors[index]}"><span>${item.station.name}</span><strong>${total}${predicted ? `<em> + ${predicted}</em>` : ''}</strong><small>${metric.label} ${tr('measured')}${predicted ? ` · ${predicted} ${tr('currentForecast')}` : ''}${extreme ? ` · ${metric.extremeLabel} ${extreme[metric.extremeKey].toFixed(1)} °C (${extreme.year})` : ''}</small></article>`;
  }).join('');
}

async function compare() {
  const ids = selectedStationIds(); const from = Number(document.querySelector('#fromYear').value); const to = Number(document.querySelector('#toYear').value);
  if (ids.length < 2) { status.textContent = tr('selectTwo'); return; }
  if (new Set(ids).size !== ids.length) { status.textContent = tr('uniqueStations'); return; }
  if (from > to || to - from > 50) { status.textContent = tr('invalidPeriod'); return; }
  status.textContent = `${ids.length} ${tr('loading')}`; document.querySelector('#compare').disabled = true;
  try {
    const [data, forecasts] = await Promise.all([
      Promise.all(ids.map(id => fetchStation(id, from, to))),
      Promise.all(ids.map(id => fetchForecast(id)))
    ]);
    renderComparison(data, forecasts, from, to); renderForecast(forecasts);
    const metric = metricInfo(document.querySelector('#metric').value); status.textContent = `${ids.length} ${tr('stations')} · ${from}–${to} · ${metric.threshold}`;
  }
  catch (error) { status.textContent = error.message; chart.className = 'chart-empty'; chart.innerHTML = `<p>${tr('noResults')}</p>`; }
  finally { document.querySelector('#compare').disabled = false; }
}

document.querySelector('#add-station').addEventListener('click', () => addStation(stations[selectors.children.length]?.id));
document.querySelector('#compare').addEventListener('click', compare);
document.querySelector('#metric').addEventListener('change', compare);
document.querySelector('#language').addEventListener('change', event => { currentLanguage = event.target.value; applyLanguage(); if (stations.length) compare(); });
applyLanguage();
loadStations();
