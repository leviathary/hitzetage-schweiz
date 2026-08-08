const selectors = document.querySelector('#station-selectors');
const status = document.querySelector('#status');
const chart = document.querySelector('#chart');
const results = document.querySelector('#results');
const legend = document.querySelector('#legend');
const stationCount = document.querySelector('#station-count');
const colors = ['#c85532', '#1e6a55', '#e0a52f', '#5268a5', '#8a5a91', '#4a8ea5'];
const metrics = {
  heatDays: { label: 'Hitzetage', threshold: 'Tagesmaximum ≥ 30 °C', extremeLabel: 'Höchstwert', extremeKey: 'maximumTemperatureCelsius' },
  tropicalNights: { label: 'Tropennächte', threshold: 'Tagesminimum ≥ 20 °C', extremeLabel: 'Tiefster Tageswert', extremeKey: 'minimumTemperatureCelsius' }
};
let stations = [];
const currentYear = new Date().getFullYear();
document.querySelector('#fromYear').value = currentYear - 10;
document.querySelector('#toYear').value = currentYear;

function stationOptions(selectedId) {
  return stations.map(({ id, name, canton }) => `<option value="${id}" ${id === selectedId ? 'selected' : ''}>${name} (${canton})</option>`).join('');
}

function addStation(selectedId = '', removable = true) {
  const row = document.createElement('div');
  row.className = 'station-row';
  row.innerHTML = `<label>Messstation<select class="station-select">${stationOptions(selectedId)}</select></label>${removable ? '<button class="remove-station" type="button" aria-label="Station entfernen">×</button>' : ''}`;
  row.querySelector('.remove-station')?.addEventListener('click', () => { row.remove(); updateStationCount(); });
  selectors.append(row); updateStationCount();
}

function updateStationCount() {
  const count = selectors.querySelectorAll('.station-row').length;
  stationCount.textContent = `${count} ${count === 1 ? 'Station' : 'Stationen'}`;
  document.querySelector('#add-station').disabled = count >= colors.length;
}

async function loadStations() {
  try {
    const response = await fetch('/api/stations');
    if (!response.ok) throw new Error('Stationen konnten nicht geladen werden.');
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
    ? `Prognoselauf ${new Date(`${generated}Z`).toLocaleString('de-CH', { dateStyle: 'short', timeStyle: 'short' })}`
    : '';
  container.innerHTML = forecasts.map((item, stationIndex) => `
    <section class="forecast-station" style="--station-color:${colors[stationIndex]}">
      <h3>${item.station.name}</h3>
      <div class="forecast-days">${item.values.length ? item.values.map(day => {
        const date = new Date(`${day.date}T12:00:00`);
        const labels = [day.predictedHeatDay ? '<b class="event heat">Hitzetag</b>' : '', day.predictedTropicalNight ? '<b class="event tropical">Tropennacht</b>' : ''].filter(Boolean).join('');
        return `<article class="forecast-day">
          <time datetime="${day.date}">${date.toLocaleDateString('de-CH', { weekday: 'short', day: '2-digit', month: '2-digit' })}</time>
          <strong>${day.maximumTemperatureCelsius.toFixed(1)}°</strong>
          <span>min. ${day.minimumTemperatureCelsius.toFixed(1)} °C</span>
          <div class="events">${labels}</div>
        </article>`;
      }).join('') : '<p>Für diese Station ist keine Punktprognose verfügbar.</p>'}</div>
    </section>`).join('');
}

function renderComparison(data, forecasts, from, to) {
  const metricKey = document.querySelector('#metric').value;
  const metric = metrics[metricKey];
  const forecastFlag = metricKey === 'heatDays' ? 'predictedHeatDay' : 'predictedTropicalNight';
  const forecastCounts = new Map(forecasts.map(item => [item.station.id,
    item.values.filter(day => day.date.startsWith(String(currentYear)) && day[forecastFlag]).length
  ]));
  const years = Array.from({ length: to - from + 1 }, (_, index) => from + index);
  const maximum = Math.max(1, ...data.flatMap(item => item.values.map(value =>
    value[metricKey] + (value.year === currentYear ? (forecastCounts.get(item.station.id) || 0) : 0)
  )));
  document.querySelector('#result-title').textContent = `${metric.label} pro Jahr`;
  legend.innerHTML = data.map((item, index) => `<span><i style="background:${colors[index]}"></i>${item.station.name}</span>`).join('')
    + '<span class="forecast-key"><i></i>Prognose (schraffiert)</span>';
  chart.className = 'chart';
  chart.setAttribute('aria-label', `Balkendiagramm: ${metric.label} von ${from} bis ${to}`);
  chart.innerHTML = `<div class="y-axis"><span>${maximum}</span><span>${Math.round(maximum / 2)}</span><span>0</span></div><div class="plot">${years.map(year => {
    const bars = data.map((item, index) => {
      const value = item.values.find(entry => entry.year === year); const count = value?.[metricKey] ?? 0;
      const predicted = year === currentYear ? (forecastCounts.get(item.station.id) || 0) : 0;
      const total = count + predicted;
      const details = value ? `${count} gemessen${predicted ? ` + ${predicted} prognostiziert` : ''}; ${metric.extremeLabel} ${value[metric.extremeKey].toFixed(1)} °C` : 'Keine Daten';
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
    return `<article class="summary" style="border-color:${colors[index]}"><span>${item.station.name}</span><strong>${total}${predicted ? `<em> + ${predicted}</em>` : ''}</strong><small>${metric.label} gemessen${predicted ? ` · ${predicted} im aktuellen Prognoselauf` : ''}${extreme ? ` · ${metric.extremeLabel} ${extreme[metric.extremeKey].toFixed(1)} °C (${extreme.year})` : ''}</small></article>`;
  }).join('');
}

async function compare() {
  const ids = selectedStationIds(); const from = Number(document.querySelector('#fromYear').value); const to = Number(document.querySelector('#toYear').value);
  if (ids.length < 2) { status.textContent = 'Bitte mindestens zwei Stationen auswählen.'; return; }
  if (new Set(ids).size !== ids.length) { status.textContent = 'Bitte jede Station nur einmal auswählen.'; return; }
  if (from > to || to - from > 50) { status.textContent = 'Bitte einen Zeitraum von höchstens 50 Jahren auswählen.'; return; }
  status.textContent = `${ids.length} Stationen werden geladen …`; document.querySelector('#compare').disabled = true;
  try {
    const [data, forecasts] = await Promise.all([
      Promise.all(ids.map(id => fetchStation(id, from, to))),
      Promise.all(ids.map(id => fetchForecast(id)))
    ]);
    renderComparison(data, forecasts, from, to); renderForecast(forecasts);
    const metric = metrics[document.querySelector('#metric').value]; status.textContent = `${ids.length} Stationen · ${from}–${to} · ${metric.threshold}`;
  }
  catch (error) { status.textContent = error.message; chart.className = 'chart-empty'; chart.innerHTML = '<p>Keine Ergebnisse.</p>'; }
  finally { document.querySelector('#compare').disabled = false; }
}

document.querySelector('#add-station').addEventListener('click', () => addStation(stations[selectors.children.length]?.id));
document.querySelector('#compare').addEventListener('click', compare);
document.querySelector('#metric').addEventListener('change', compare);
loadStations();
