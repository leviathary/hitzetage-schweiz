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
const translations = {
  de: { language:'Sprache', eyebrow:'MeteoSwiss-Messstationen', title:'Hitzetage in der Schweiz', intro:'Vergleiche Messstationen und entdecke, wie häufig die Tageshöchsttemperatur 30 °C erreicht hat.', selectionTitle:'Stationen und Zeitraum', station:'Messstation', stations:'Stationen', addStation:'+ Station hinzufügen', removeStation:'Station entfernen', from:'Von', to:'Bis', metric:'Kennzahl', compare:'Stationen vergleichen', source:'Quelle: MeteoSwiss', forecastTitle:'Prognose für die nächsten neun Tage', forecastLoading:'Prognose wird mit dem Vergleich geladen.', footer:'Quelle: MeteoSwiss Open Data · Hitzetag: Maximum ≥ 30 °C · Tropennacht: Minimum ≥ 20 °C', heatDays:'Hitzetage', tropicalNights:'Tropennächte', heatOption:'Hitzetage (Maximum ≥ 30 °C)', tropicalOption:'Tropennächte (Minimum ≥ 20 °C)', heatThreshold:'Tagesmaximum ≥ 30 °C', tropicalThreshold:'Tagesminimum ≥ 20 °C', highest:'Höchstwert', lowest:'Tiefster Tageswert', perYear:'pro Jahr', forecastHatched:'Prognose (schraffiert)', measured:'gemessen', predicted:'prognostiziert', noData:'Keine Daten', forecastRun:'Prognoselauf', heatDay:'Hitzetag', tropicalNight:'Tropennacht', noForecast:'Für diese Station ist keine Punktprognose verfügbar.', selectTwo:'Bitte mindestens zwei Stationen auswählen.', uniqueStations:'Bitte jede Station nur einmal auswählen.', invalidPeriod:'Bitte einen Zeitraum von höchstens 50 Jahren auswählen.', loading:'Stationen werden geladen …', noResults:'Keine Ergebnisse.', currentForecast:'im aktuellen Prognoselauf', contextTitle:'Einordnung des aktuellen Jahres', contextIntro:'Vergleich mit langjährigen Mittelwerten', provisional:'vorläufig', last20:'Letzte 20 Jahre', annualAverage:'Ø pro Jahr', normal:'Norm 1991–2020', rankSince:'Rang seit 1990', withForecast:'mit Prognose', measuredForecast:'gemessen + Prognose', moreIndicators:'Weitere Klimaindikatoren', indicator:'Indikator', definition:'Definition', trend:'Trend', perDecade:'pro Jahrzehnt', summerDays:'Sommertage', veryHotDays:'Sehr heisse Tage', longestHeatWave:'Längste Hitzewelle', warmestNight:'Wärmste Nacht', days:'Tage' },
  fr: { language:'Langue', eyebrow:'Stations MeteoSwiss', title:'Journées de chaleur en Suisse', intro:'Comparez les stations et découvrez combien de fois la température maximale a atteint 30 °C.', selectionTitle:'Stations et période', station:'Station de mesure', stations:'stations', addStation:'+ Ajouter une station', removeStation:'Supprimer la station', from:'De', to:'À', metric:'Indicateur', compare:'Comparer les stations', source:'Source : MeteoSwiss', forecastTitle:'Prévisions pour les neuf prochains jours', forecastLoading:'Les prévisions sont chargées avec la comparaison.', footer:'Source : MeteoSwiss Open Data · Journée de chaleur : maximum ≥ 30 °C · Nuit tropicale : minimum ≥ 20 °C', heatDays:'Journées de chaleur', tropicalNights:'Nuits tropicales', heatOption:'Journées de chaleur (maximum ≥ 30 °C)', tropicalOption:'Nuits tropicales (minimum ≥ 20 °C)', heatThreshold:'Maximum journalier ≥ 30 °C', tropicalThreshold:'Minimum journalier ≥ 20 °C', highest:'Maximum', lowest:'Minimum journalier le plus bas', perYear:'par an', forecastHatched:'Prévision (hachurée)', measured:'mesuré', predicted:'prévu', noData:'Aucune donnée', forecastRun:'Prévision du', heatDay:'Journée chaude', tropicalNight:'Nuit tropicale', noForecast:'Aucune prévision ponctuelle disponible pour cette station.', selectTwo:'Veuillez sélectionner au moins deux stations.', uniqueStations:'Veuillez sélectionner chaque station une seule fois.', invalidPeriod:'Veuillez choisir une période de 50 ans au maximum.', loading:'Chargement des stations…', noResults:'Aucun résultat.', currentForecast:'dans la prévision actuelle', contextTitle:"Classement de l'année en cours", contextIntro:'Comparaison avec les moyennes à long terme', provisional:'provisoire', last20:'20 dernières années', annualAverage:'moyenne annuelle', normal:'Normale 1991–2020', rankSince:'Rang depuis 1990', withForecast:'avec prévision', measuredForecast:'mesuré + prévision', moreIndicators:'Autres indicateurs climatiques', indicator:'Indicateur', definition:'Définition', trend:'Tendance', perDecade:'par décennie', summerDays:"Journées d'été", veryHotDays:'Journées très chaudes', longestHeatWave:'Plus longue vague de chaleur', warmestNight:'Nuit la plus chaude', days:'jours' },
  it: { language:'Lingua', eyebrow:'Stazioni MeteoSwiss', title:'Giornate di caldo in Svizzera', intro:'Confronta le stazioni e scopri quante volte la temperatura massima ha raggiunto 30 °C.', selectionTitle:'Stazioni e periodo', station:'Stazione di misura', stations:'stazioni', addStation:'+ Aggiungi stazione', removeStation:'Rimuovi stazione', from:'Da', to:'A', metric:'Indicatore', compare:'Confronta stazioni', source:'Fonte: MeteoSwiss', forecastTitle:'Previsioni per i prossimi nove giorni', forecastLoading:'Le previsioni vengono caricate con il confronto.', footer:'Fonte: MeteoSwiss Open Data · Giorno di caldo: massima ≥ 30 °C · Notte tropicale: minima ≥ 20 °C', heatDays:'Giornate di caldo', tropicalNights:'Notti tropicali', heatOption:'Giornate di caldo (massima ≥ 30 °C)', tropicalOption:'Notti tropicali (minima ≥ 20 °C)', heatThreshold:'Massima giornaliera ≥ 30 °C', tropicalThreshold:'Minima giornaliera ≥ 20 °C', highest:'Valore massimo', lowest:'Minimo giornaliero più basso', perYear:"all'anno", forecastHatched:'Previsione (tratteggiata)', measured:'misurato', predicted:'previsto', noData:'Nessun dato', forecastRun:'Previsione del', heatDay:'Giorno caldo', tropicalNight:'Notte tropicale', noForecast:'Nessuna previsione puntuale disponibile per questa stazione.', selectTwo:'Seleziona almeno due stazioni.', uniqueStations:'Seleziona ogni stazione una sola volta.', invalidPeriod:'Seleziona un periodo massimo di 50 anni.', loading:'Caricamento stazioni…', noResults:'Nessun risultato.', currentForecast:'nella previsione attuale', contextTitle:"Inquadramento dell'anno corrente", contextIntro:'Confronto con le medie a lungo termine', provisional:'provvisorio', last20:'Ultimi 20 anni', annualAverage:'media annua', normal:'Normale 1991–2020', rankSince:'Posizione dal 1990', withForecast:'con previsione', measuredForecast:'misurato + previsione', moreIndicators:'Altri indicatori climatici', indicator:'Indicatore', definition:'Definizione', trend:'Tendenza', perDecade:'per decennio', summerDays:'Giornate estive', veryHotDays:'Giornate molto calde', longestHeatWave:'Ondata di caldo più lunga', warmestNight:'Notte più calda', days:'giorni' },
  rm: { language:'Lingua', eyebrow:'Staziuns da MeteoSwiss', title:'Dis da chalira en Svizra', intro:'Cumpareglia staziuns e scuvra quants dis che la temperatura maximala ha cuntanschì 30 °C.', selectionTitle:'Staziuns e perioda', station:'Staziun da mesiraziun', stations:'staziuns', addStation:'+ Agiuntar staziun', removeStation:'Allontanar staziun', from:'Da', to:'Fin', metric:'Indicatur', compare:'Cumparegliar staziuns', source:'Funtauna: MeteoSwiss', forecastTitle:'Prognosa per ils proxims nov dis', forecastLoading:'La prognosa vegn chargiada cun la cumparegliaziun.', footer:'Funtauna: MeteoSwiss Open Data · Di da chalira: maximum ≥ 30 °C · Notg tropica: minimum ≥ 20 °C', heatDays:'Dis da chalira', tropicalNights:'Notgs tropicas', heatOption:'Dis da chalira (maximum ≥ 30 °C)', tropicalOption:'Notgs tropicas (minimum ≥ 20 °C)', heatThreshold:'Maximum dal di ≥ 30 °C', tropicalThreshold:'Minimum dal di ≥ 20 °C', highest:'Valur maximala', lowest:'Valur minimala dal di', perYear:'per onn', forecastHatched:'Prognosa (strivlada)', measured:'mesirà', predicted:'prognostitgà', noData:'Naginas datas', forecastRun:'Prognosa dals', heatDay:'Di da chalira', tropicalNight:'Notg tropica', noForecast:'Naginas prognosas localas disponiblas per questa staziun.', selectTwo:'Tscherna almain duas staziuns.', uniqueStations:'Tscherna mintga staziun mo ina giada.', invalidPeriod:'Tscherna ina perioda da maximalmain 50 onns.', loading:'Las staziuns vegnan chargiadas…', noResults:'Nagins resultats.', currentForecast:'en la prognosa actuala', contextTitle:"Classificaziun da l'onn actual", contextIntro:'Cumparegliaziun cun valurs medias da lunga durada', provisional:'provisoric', last20:'Ultims 20 onns', annualAverage:'media per onn', normal:'Norma 1991–2020', rankSince:'Rang dapi 1990', withForecast:'cun prognosa', measuredForecast:'mesirà + prognosa', moreIndicators:'Ulteriurs indicaturs dal clima', indicator:'Indicatur', definition:'Definiziun', trend:'Trend', perDecade:'per decenni', summerDays:'Dis da stad', veryHotDays:'Dis fitg chauds', longestHeatWave:'Perioda da chalira la pli lunga', warmestNight:'Notg la pli chauda', days:'dis' },
  en: { language:'Language', eyebrow:'MeteoSwiss stations', title:'Heat days in Switzerland', intro:'Compare stations and discover how often the daily maximum temperature reached 30 °C.', selectionTitle:'Stations and period', station:'Weather station', stations:'stations', addStation:'+ Add station', removeStation:'Remove station', from:'From', to:'To', metric:'Metric', compare:'Compare stations', source:'Source: MeteoSwiss', forecastTitle:'Forecast for the next nine days', forecastLoading:'The forecast is loaded with the comparison.', footer:'Source: MeteoSwiss Open Data · Heat day: maximum ≥ 30 °C · Tropical night: minimum ≥ 20 °C', heatDays:'Heat days', tropicalNights:'Tropical nights', heatOption:'Heat days (maximum ≥ 30 °C)', tropicalOption:'Tropical nights (minimum ≥ 20 °C)', heatThreshold:'Daily maximum ≥ 30 °C', tropicalThreshold:'Daily minimum ≥ 20 °C', highest:'Highest value', lowest:'Lowest daily value', perYear:'per year', forecastHatched:'Forecast (hatched)', measured:'measured', predicted:'forecast', noData:'No data', forecastRun:'Forecast run', heatDay:'Heat day', tropicalNight:'Tropical night', noForecast:'No point forecast is available for this station.', selectTwo:'Please select at least two stations.', uniqueStations:'Please select each station only once.', invalidPeriod:'Please select a period of no more than 50 years.', loading:'Loading stations…', noResults:'No results.', currentForecast:'in the current forecast run', contextTitle:'Current-year context', contextIntro:'Compared with long-term averages', provisional:'provisional', last20:'Last 20 years', annualAverage:'annual average', normal:'1991–2020 normal', rankSince:'Rank since 1990', withForecast:'with forecast', measuredForecast:'measured + forecast', moreIndicators:'More climate indicators', indicator:'Indicator', definition:'Definition', trend:'Trend', perDecade:'per decade', summerDays:'Summer days', veryHotDays:'Very hot days', longestHeatWave:'Longest heatwave', warmestNight:'Warmest night', days:'days' },
  zh: { language:'语言', eyebrow:'MeteoSwiss 气象站', title:'瑞士高温日', intro:'比较不同气象站，了解每日最高气温达到 30 °C 的频率。', selectionTitle:'气象站和时间范围', station:'气象站', stations:'个气象站', addStation:'+ 添加气象站', removeStation:'删除气象站', from:'从', to:'至', metric:'指标', compare:'比较气象站', source:'来源：MeteoSwiss', forecastTitle:'未来九天预报', forecastLoading:'预报将与比较结果一起加载。', footer:'来源：MeteoSwiss Open Data · 高温日：最高温 ≥ 30 °C · 热带夜：最低温 ≥ 20 °C', heatDays:'高温日', tropicalNights:'热带夜', heatOption:'高温日（最高温 ≥ 30 °C）', tropicalOption:'热带夜（最低温 ≥ 20 °C）', heatThreshold:'每日最高温 ≥ 30 °C', tropicalThreshold:'每日最低温 ≥ 20 °C', highest:'最高值', lowest:'最低日值', perYear:'每年', forecastHatched:'预报（斜线）', measured:'已测量', predicted:'预报', noData:'无数据', forecastRun:'预报更新时间', heatDay:'高温日', tropicalNight:'热带夜', noForecast:'此气象站暂无点位预报。', selectTwo:'请至少选择两个气象站。', uniqueStations:'每个气象站只能选择一次。', invalidPeriod:'请选择不超过 50 年的时间范围。', loading:'正在加载气象站…', noResults:'无结果。', currentForecast:'当前预报中', contextTitle:'本年度情况', contextIntro:'与长期平均值比较', provisional:'暂定', last20:'过去20年', annualAverage:'年均', normal:'1991–2020年常值', rankSince:'1990年以来排名', withForecast:'含预报', measuredForecast:'实测 + 预报', moreIndicators:'更多气候指标', indicator:'指标', definition:'定义', trend:'趋势', perDecade:'每十年', summerDays:'夏日', veryHotDays:'极热日', longestHeatWave:'最长热浪', warmestNight:'最热夜晚', days:'天' }
};
Object.assign(translations.de, { footer:'Quelle: MeteoSwiss Open Data' });
Object.assign(translations.fr, { footer:'Source : MeteoSwiss Open Data' });
Object.assign(translations.it, { footer:'Fonte: MeteoSwiss Open Data' });
Object.assign(translations.rm, { footer:'Funtauna: MeteoSwiss Open Data' });
Object.assign(translations.en, { footer:'Source: MeteoSwiss Open Data' });
Object.assign(translations.zh, { footer:'来源：MeteoSwiss Open Data' });
Object.assign(translations.de, { iceExtreme:'Tiefstes Tagesmaximum' });
Object.assign(translations.fr, { iceExtreme:'Maximum journalier le plus bas' });
Object.assign(translations.it, { iceExtreme:'Massima giornaliera più bassa' });
Object.assign(translations.rm, { iceExtreme:'Maximum dal di il pli bass' });
Object.assign(translations.en, { iceExtreme:'Lowest daily maximum' });
Object.assign(translations.zh, { iceExtreme:'最低日最高温' });
Object.assign(translations.de, { topYears: 'Top 5 Jahre seit 1990' });
Object.assign(translations.fr, { topYears: 'Top 5 des années depuis 1990' });
Object.assign(translations.it, { topYears: 'Le 5 annate principali dal 1990' });
Object.assign(translations.rm, { topYears: 'Ils 5 onns principals dapi 1990' });
Object.assign(translations.en, { topYears: 'Top 5 years since 1990' });
Object.assign(translations.zh, { topYears: '1990年以来排名前5的年份' });
Object.assign(translations.de, { analyze: 'Station auswerten', selectOne: 'Bitte mindestens eine Station auswählen.' });
Object.assign(translations.fr, { analyze: 'Analyser la station', selectOne: 'Veuillez sélectionner au moins une station.' });
Object.assign(translations.it, { analyze: 'Analizza la stazione', selectOne: 'Seleziona almeno una stazione.' });
Object.assign(translations.rm, { analyze: 'Evaluar la staziun', selectOne: 'Tscherna almain ina staziun.' });
Object.assign(translations.en, { analyze: 'Analyse station', selectOne: 'Please select at least one station.' });
Object.assign(translations.zh, { analyze: '分析气象站', selectOne: '请至少选择一个气象站。' });
Object.assign(translations.de, { mapToggle:'Station auf Karte wählen', mapSearch:'Station suchen', mapSearchPlaceholder:'Name oder Kanton', mapHint:'Punkt anklicken, um eine Station zur Auswertung hinzuzufügen.', altitude:'Höhe', altitudeUnit:'m ü. M.', alreadySelected:'Bereits ausgewählt', addedFromMap:'Zur Auswertung hinzugefügt', mapFull:'Es können höchstens sechs Stationen ausgewählt werden.' });
Object.assign(translations.fr, { mapToggle:'Choisir sur la carte', mapSearch:'Rechercher une station', mapSearchPlaceholder:'Nom ou canton', mapHint:'Cliquez sur un point pour ajouter une station à l’analyse.', altitude:'Altitude', altitudeUnit:'m', alreadySelected:'Déjà sélectionnée', addedFromMap:'Ajoutée à l’analyse', mapFull:'Six stations au maximum peuvent être sélectionnées.' });
Object.assign(translations.it, { mapToggle:'Scegli sulla mappa', mapSearch:'Cerca stazione', mapSearchPlaceholder:'Nome o cantone', mapHint:'Seleziona un punto per aggiungere la stazione all’analisi.', altitude:'Altitudine', altitudeUnit:'m s.l.m.', alreadySelected:'Già selezionata', addedFromMap:'Aggiunta all’analisi', mapFull:'È possibile selezionare al massimo sei stazioni.' });
Object.assign(translations.rm, { mapToggle:'Tscherner sin la charta', mapSearch:'Tschertgar staziun', mapSearchPlaceholder:'Num u chantun', mapHint:'Clicca sin in punct per agiuntar la staziun a l’evaluaziun.', altitude:'Autezza', altitudeUnit:'m s.m.', alreadySelected:'Gia tschernì', addedFromMap:'Agiuntà a l’evaluaziun', mapFull:'I pon vegnir tschernidas maximalmain sis staziuns.' });
Object.assign(translations.en, { mapToggle:'Choose on map', mapSearch:'Search station', mapSearchPlaceholder:'Name or canton', mapHint:'Select a point to add that station to the analysis.', altitude:'Elevation', altitudeUnit:'m a.s.l.', alreadySelected:'Already selected', addedFromMap:'Added to analysis', mapFull:'A maximum of six stations can be selected.' });
Object.assign(translations.zh, { mapToggle:'在地图上选择', mapSearch:'搜索气象站', mapSearchPlaceholder:'名称或州', mapHint:'点击站点，将其添加到分析中。', altitude:'海拔', altitudeUnit:'米', alreadySelected:'已选择', addedFromMap:'已添加到分析', mapFull:'最多可以选择六个气象站。' });
Object.assign(translations.de, { stationSearch:'Messstation suchen', stationSearchPlaceholder:'Name, Kanton oder Kürzel', selectedStationsTitle:'Messstationen zum Vergleich' });
Object.assign(translations.fr, { stationSearch:'Rechercher une station', stationSearchPlaceholder:'Nom, canton ou abréviation', selectedStationsTitle:'Stations à comparer' });
Object.assign(translations.it, { stationSearch:'Cerca stazione', stationSearchPlaceholder:'Nome, cantone o sigla', selectedStationsTitle:'Stazioni da confrontare' });
Object.assign(translations.rm, { stationSearch:'Tschertgar staziun', stationSearchPlaceholder:'Num, chantun u scursanida', selectedStationsTitle:'Staziuns per cumparegliar' });
Object.assign(translations.en, { stationSearch:'Search station', stationSearchPlaceholder:'Name, canton or code', selectedStationsTitle:'Stations to compare' });
Object.assign(translations.zh, { stationSearch:'搜索气象站', stationSearchPlaceholder:'名称、州或代码', selectedStationsTitle:'待比较气象站' });
Object.assign(translations.de, { privacy:'Datenschutz' });
Object.assign(translations.fr, { privacy:'Protection des données' });
Object.assign(translations.it, { privacy:'Protezione dei dati' });
Object.assign(translations.rm, { privacy:'Protecziun da datas' });
Object.assign(translations.en, { privacy:'Privacy' });
Object.assign(translations.zh, { privacy:'隐私保护' });
Object.assign(translations.de, { explainerEyebrow:'Die Zahlen richtig einordnen', explainerTitle:'Was zeigt diese Anwendung?', explainerLead:'Wähle eine oder mehrere MeteoSwiss-Messstationen und vergleiche Hitzeereignisse über Jahre und Regionen.', heatDefinitionTitle:'Was ist ein Hitzetag?', heatDefinitionText:'Ein Tag, an dem die gemessene Höchsttemperatur mindestens 30 °C erreicht.', tropicalDefinitionTitle:'Was ist eine Tropennacht?', tropicalDefinitionText:'Eine Nacht, in der die Temperatur nicht unter 20 °C fällt, ausgewertet über das Tagesminimum.', dataDefinitionTitle:'Woher stammen die Daten?', dataDefinitionText:'Historische Messwerte und Stationsangaben stammen aus dem offiziellen Open-Data-Angebot von MeteoSwiss; Prognosen werden gesondert gekennzeichnet.' });
Object.assign(translations.fr, { explainerEyebrow:'Bien interpréter les chiffres', explainerTitle:'Que montre cette application ?', explainerLead:'Sélectionnez une ou plusieurs stations MeteoSwiss et comparez les épisodes de chaleur selon les années et les régions.', heatDefinitionTitle:'Qu’est-ce qu’une journée de chaleur ?', heatDefinitionText:'Une journée durant laquelle la température maximale mesurée atteint au moins 30 °C.', tropicalDefinitionTitle:'Qu’est-ce qu’une nuit tropicale ?', tropicalDefinitionText:'Une nuit durant laquelle la température ne descend pas sous 20 °C, déterminée à partir du minimum journalier.', dataDefinitionTitle:'D’où viennent les données ?', dataDefinitionText:'Les mesures historiques et les informations sur les stations proviennent de l’offre Open Data officielle de MeteoSwiss ; les prévisions sont signalées séparément.' });
Object.assign(translations.it, { explainerEyebrow:'Interpretare correttamente i dati', explainerTitle:'Cosa mostra questa applicazione?', explainerLead:'Seleziona una o più stazioni MeteoSwiss e confronta gli eventi di caldo tra anni e regioni.', heatDefinitionTitle:'Cos’è una giornata di caldo?', heatDefinitionText:'Un giorno in cui la temperatura massima misurata raggiunge almeno 30 °C.', tropicalDefinitionTitle:'Cos’è una notte tropicale?', tropicalDefinitionText:'Una notte in cui la temperatura non scende sotto i 20 °C, valutata tramite la minima giornaliera.', dataDefinitionTitle:'Da dove provengono i dati?', dataDefinitionText:'Le misure storiche e i dati delle stazioni provengono dall’offerta Open Data ufficiale di MeteoSwiss; le previsioni sono indicate separatamente.' });
Object.assign(translations.rm, { explainerEyebrow:'Chapir endretg las cifras', explainerTitle:'Tge mussa questa applicaziun?', explainerLead:'Tscherna ina u pliras staziuns da MeteoSwiss e cumpareglia eveniments da chalira tenor onns e regiuns.', heatDefinitionTitle:'Tge è in di da chalira?', heatDefinitionText:'In di cun ina temperatura maximala mesirada dad almain 30 °C.', tropicalDefinitionTitle:'Tge è ina notg tropica?', tropicalDefinitionText:'Ina notg durant la quala la temperatura na croda betg sut 20 °C, evaluada cun il minimum dal di.', dataDefinitionTitle:'Danunder derivan las datas?', dataDefinitionText:'Las mesiraziuns istoricas e las indicaziuns da staziun derivan da l’offerta Open Data uffiziala da MeteoSwiss; prognosas vegnan marcadas separadamain.' });
Object.assign(translations.en, { explainerEyebrow:'Putting the numbers in context', explainerTitle:'What does this application show?', explainerLead:'Select one or more MeteoSwiss stations and compare heat events across years and regions.', heatDefinitionTitle:'What is a heat day?', heatDefinitionText:'A day on which the measured maximum temperature reaches at least 30 °C.', tropicalDefinitionTitle:'What is a tropical night?', tropicalDefinitionText:'A night during which the temperature does not fall below 20 °C, evaluated using the daily minimum.', dataDefinitionTitle:'Where does the data come from?', dataDefinitionText:'Historical measurements and station details come from the official MeteoSwiss Open Data service; forecasts are identified separately.' });
Object.assign(translations.zh, { explainerEyebrow:'正确理解数据', explainerTitle:'本应用展示什么？', explainerLead:'选择一个或多个 MeteoSwiss 气象站，比较不同年份和地区的高温事件。', heatDefinitionTitle:'什么是高温日？', heatDefinitionText:'实测每日最高气温达到或超过 30 °C 的一天。', tropicalDefinitionTitle:'什么是热带夜？', tropicalDefinitionText:'夜间气温不低于 20 °C，并以每日最低气温进行统计。', dataDefinitionTitle:'数据来自哪里？', dataDefinitionText:'历史观测值和站点信息来自 MeteoSwiss 官方开放数据服务；预报数据会单独标注。' });
Object.assign(translations.de, { explainerLead:'Wähle eine oder mehrere MeteoSwiss-Messstationen und vergleiche Temperaturereignisse über Jahre und Regionen.', frostDefinitionTitle:'Was ist ein Frosttag?', frostDefinitionText:'Ein Tag, an dem die gemessene Tiefsttemperatur unter 0 °C fällt.' });
Object.assign(translations.fr, { explainerLead:'Sélectionnez une ou plusieurs stations MeteoSwiss et comparez les événements de température selon les années et les régions.', frostDefinitionTitle:'Qu’est-ce qu’un jour de gel ?', frostDefinitionText:'Un jour durant lequel la température minimale mesurée descend sous 0 °C.' });
Object.assign(translations.it, { explainerLead:'Seleziona una o più stazioni MeteoSwiss e confronta gli eventi di temperatura tra anni e regioni.', frostDefinitionTitle:'Che cos’è un giorno di gelo?', frostDefinitionText:'Un giorno in cui la temperatura minima misurata scende sotto 0 °C.' });
Object.assign(translations.rm, { explainerLead:'Tscherna ina u pliras staziuns da MeteoSwiss e cumpareglia eveniments da temperatura tenor onns e regiuns.', frostDefinitionTitle:'Tge è in di da schelira?', frostDefinitionText:'In di durant il qual la temperatura minimala mesirada croda sut 0 °C.' });
Object.assign(translations.en, { explainerLead:'Select one or more MeteoSwiss stations and compare temperature events across years and regions.', frostDefinitionTitle:'What is a frost day?', frostDefinitionText:'A day on which the measured minimum temperature falls below 0 °C.' });
Object.assign(translations.zh, { explainerLead:'选择一个或多个 MeteoSwiss 气象站，比较不同年份和地区的温度事件。', frostDefinitionTitle:'什么是霜冻日？', frostDefinitionText:'实测每日最低气温低于 0 °C 的一天。' });
Object.assign(translations.de, { heatDaysDetailTitle:'Hitzetage im Detail', heatDaysDetailIntro:'Alle gemessenen Tage mit mindestens 30 °C Tagesmaximum', year:'Jahr', maximum:'Maximum', minimum:'Minimum', noHeatDays:'In diesem Jahr wurden keine Hitzetage gemessen.', heatDaysLoading:'Hitzetage werden geladen …' });
Object.assign(translations.fr, { heatDaysDetailTitle:'Journées de chaleur en détail', heatDaysDetailIntro:'Tous les jours mesurés avec un maximum journalier d’au moins 30 °C', year:'Année', maximum:'Maximum', minimum:'Minimum', noHeatDays:'Aucune journée de chaleur n’a été mesurée cette année.', heatDaysLoading:'Chargement des journées de chaleur…' });
Object.assign(translations.it, { heatDaysDetailTitle:'Giornate di caldo in dettaglio', heatDaysDetailIntro:'Tutti i giorni misurati con una massima giornaliera di almeno 30 °C', year:'Anno', maximum:'Massima', minimum:'Minima', noHeatDays:'In questo anno non sono state misurate giornate di caldo.', heatDaysLoading:'Caricamento delle giornate di caldo…' });
Object.assign(translations.rm, { heatDaysDetailTitle:'Dis da chalira en detagl', heatDaysDetailIntro:'Tut ils dis mesirads cun in maximum dal di dad almain 30 °C', year:'Onn', maximum:'Maximum', minimum:'Minimum', noHeatDays:'En quest onn n’èn vegnids mesirads nagins dis da chalira.', heatDaysLoading:'Ils dis da chalira vegnan chargiads…' });
Object.assign(translations.en, { heatDaysDetailTitle:'Heat days in detail', heatDaysDetailIntro:'All measured days with a daily maximum of at least 30 °C', year:'Year', maximum:'Maximum', minimum:'Minimum', noHeatDays:'No heat days were measured in this year.', heatDaysLoading:'Loading heat days …' });
Object.assign(translations.zh, { heatDaysDetailTitle:'高温日详情', heatDaysDetailIntro:'所有日最高气温达到或超过 30 °C 的实测日期', year:'年份', maximum:'最高气温', minimum:'最低气温', noHeatDays:'该年份未测得高温日。', heatDaysLoading:'正在加载高温日…' });
Object.assign(translations.de, { frostDays:'Frosttage', frostOption:'Frosttage (Minimum < 0 °C)', frostThreshold:'Tagesminimum < 0 °C', frostDaysDetailTitle:'Frosttage im Detail', frostDaysDetailIntro:'Alle gemessenen Tage mit einer Tiefsttemperatur unter 0 °C', frostDaysLoading:'Frosttage werden geladen …' });
Object.assign(translations.fr, { frostDays:'Jours de gel', frostOption:'Jours de gel (minimum < 0 °C)', frostThreshold:'Minimum journalier < 0 °C', frostDaysDetailTitle:'Jours de gel en détail', frostDaysDetailIntro:'Tous les jours mesurés avec une température minimale inférieure à 0 °C', frostDaysLoading:'Chargement des jours de gel…' });
Object.assign(translations.it, { frostDays:'Giorni di gelo', frostOption:'Giorni di gelo (minima < 0 °C)', frostThreshold:'Minima giornaliera < 0 °C', frostDaysDetailTitle:'Giorni di gelo in dettaglio', frostDaysDetailIntro:'Tutti i giorni misurati con una temperatura minima inferiore a 0 °C', frostDaysLoading:'Caricamento dei giorni di gelo…' });
Object.assign(translations.rm, { frostDays:'Dis da schelira', frostOption:'Dis da schelira (minimum < 0 °C)', frostThreshold:'Minimum dal di < 0 °C', frostDaysDetailTitle:'Dis da schelira en detagl', frostDaysDetailIntro:'Tut ils dis mesirads cun ina temperatura minimala sut 0 °C', frostDaysLoading:'Ils dis da schelira vegnan chargiads…' });
Object.assign(translations.en, { frostDays:'Frost days', frostOption:'Frost days (minimum < 0 °C)', frostThreshold:'Daily minimum < 0 °C', frostDaysDetailTitle:'Frost days in detail', frostDaysDetailIntro:'All measured days with a minimum temperature below 0 °C', frostDaysLoading:'Loading frost days…' });
Object.assign(translations.zh, { frostDays:'霜冻日', frostOption:'霜冻日（最低温 < 0 °C）', frostThreshold:'每日最低温 < 0 °C', frostDaysDetailTitle:'霜冻日详情', frostDaysDetailIntro:'所有最低气温低于 0 °C 的实测日期', frostDaysLoading:'正在加载霜冻日…' });
Object.assign(translations.de, { iceDays:'Eistage', iceOption:'Eistage (Maximum < 0 °C)', iceThreshold:'Tagesmaximum < 0 °C', iceDaysDetailTitle:'Eistage im Detail', iceDaysDetailIntro:'Alle gemessenen Tage mit einer Höchsttemperatur unter 0 °C', iceDaysLoading:'Eistage werden geladen …', iceDefinitionTitle:'Was ist ein Eistag?', iceDefinitionText:'Ein Tag, an dem auch die gemessene Höchsttemperatur unter 0 °C bleibt.' });
Object.assign(translations.fr, { iceDays:'Jours sans dégel', iceOption:'Jours sans dégel (maximum < 0 °C)', iceThreshold:'Maximum journalier < 0 °C', iceDaysDetailTitle:'Jours sans dégel en détail', iceDaysDetailIntro:'Tous les jours mesurés avec une température maximale inférieure à 0 °C', iceDaysLoading:'Chargement des jours sans dégel…', iceDefinitionTitle:'Qu’est-ce qu’un jour sans dégel ?', iceDefinitionText:'Un jour durant lequel même la température maximale mesurée reste sous 0 °C.' });
Object.assign(translations.it, { iceDays:'Giorni di ghiaccio', iceOption:'Giorni di ghiaccio (massima < 0 °C)', iceThreshold:'Massima giornaliera < 0 °C', iceDaysDetailTitle:'Giorni di ghiaccio in dettaglio', iceDaysDetailIntro:'Tutti i giorni misurati con una temperatura massima inferiore a 0 °C', iceDaysLoading:'Caricamento dei giorni di ghiaccio…', iceDefinitionTitle:'Che cos’è un giorno di ghiaccio?', iceDefinitionText:'Un giorno in cui anche la temperatura massima misurata rimane sotto 0 °C.' });
Object.assign(translations.rm, { iceDays:'Dis da glatsch', iceOption:'Dis da glatsch (maximum < 0 °C)', iceThreshold:'Maximum dal di < 0 °C', iceDaysDetailTitle:'Dis da glatsch en detagl', iceDaysDetailIntro:'Tut ils dis mesirads cun ina temperatura maximala sut 0 °C', iceDaysLoading:'Ils dis da glatsch vegnan chargiads…', iceDefinitionTitle:'Tge è in di da glatsch?', iceDefinitionText:'In di durant il qual er la temperatura maximala mesirada resta sut 0 °C.' });
Object.assign(translations.en, { iceDays:'Ice days', iceOption:'Ice days (maximum < 0 °C)', iceThreshold:'Daily maximum < 0 °C', iceDaysDetailTitle:'Ice days in detail', iceDaysDetailIntro:'All measured days with a maximum temperature below 0 °C', iceDaysLoading:'Loading ice days…', iceDefinitionTitle:'What is an ice day?', iceDefinitionText:'A day on which even the measured maximum temperature remains below 0 °C.' });
Object.assign(translations.zh, { iceDays:'冰冻日', iceOption:'冰冻日（最高温 < 0 °C）', iceThreshold:'每日最高温 < 0 °C', iceDaysDetailTitle:'冰冻日详情', iceDaysDetailIntro:'所有最高气温低于 0 °C 的实测日期', iceDaysLoading:'正在加载冰冻日…', iceDefinitionTitle:'什么是冰冻日？', iceDefinitionText:'实测每日最高气温仍低于 0 °C 的一天。' });
Object.assign(translations.de, { heatDaysHint:'Jahre im Diagramm anklicken, um sie auf der Zeitachse zu vergleichen.' });
Object.assign(translations.fr, { heatDaysHint:'Cliquez sur les annees du graphique pour les comparer sur la chronologie.' });
Object.assign(translations.it, { heatDaysHint:'Fai clic sugli anni nel grafico per confrontarli sulla cronologia.' });
Object.assign(translations.rm, { heatDaysHint:'Clicca sin ils onns en il diagram per cumparegliar els sin la lingia dal temp.' });
Object.assign(translations.en, { heatDaysHint:'Click years in the chart to compare them on the timeline.' });
Object.assign(translations.zh, { heatDaysHint:'Double-click a year in the chart to show its timeline.' });
Object.assign(translations.de, { removeYear:'Jahr aus dem Detailvergleich entfernen' });
Object.assign(translations.fr, { removeYear:'Retirer l’année de la comparaison détaillée' });
Object.assign(translations.it, { removeYear:'Rimuovi l’anno dal confronto dettagliato' });
Object.assign(translations.rm, { removeYear:'Allontanar l’onn da la cumparegliaziun detagliada' });
Object.assign(translations.en, { removeYear:'Remove year from detailed comparison' });
Object.assign(translations.zh, { removeYear:'从详细比较中移除该年份' });
Object.assign(translations.de, { feedback:'Feedback', feedbackTitle:'Feedback geben', feedbackIntro:'Was gefällt dir, was fehlt oder was funktioniert noch nicht?', feedbackMessage:'Deine Nachricht', feedbackEmail:'E-Mail (optional, falls du eine Antwort möchtest)', feedbackSend:'Feedback senden', feedbackSending:'Wird gesendet …', feedbackThanks:'Vielen Dank! Dein Feedback wurde gespeichert.', feedbackError:'Das Feedback konnte nicht gesendet werden. Bitte versuche es später nochmals.', feedbackTooFast:'Bitte warte kurz, bevor du weiteres Feedback sendest.', cancel:'Abbrechen', close:'Schließen' });
Object.assign(translations.fr, { feedback:'Commentaires', feedbackTitle:'Donner un avis', feedbackIntro:'Qu’est-ce qui vous plaît, qu’est-ce qui manque ou ne fonctionne pas encore ?', feedbackMessage:'Votre message', feedbackEmail:'E-mail (facultatif, si vous souhaitez une réponse)', feedbackSend:'Envoyer', feedbackSending:'Envoi en cours…', feedbackThanks:'Merci ! Votre avis a été enregistré.', feedbackError:'Impossible d’envoyer votre avis. Veuillez réessayer plus tard.', feedbackTooFast:'Veuillez patienter avant d’envoyer un autre avis.', cancel:'Annuler', close:'Fermer' });
Object.assign(translations.it, { feedback:'Feedback', feedbackTitle:'Invia un feedback', feedbackIntro:'Cosa ti piace, cosa manca o cosa non funziona ancora?', feedbackMessage:'Il tuo messaggio', feedbackEmail:'E-mail (facoltativa, se desideri una risposta)', feedbackSend:'Invia feedback', feedbackSending:'Invio…', feedbackThanks:'Grazie! Il tuo feedback è stato salvato.', feedbackError:'Non è stato possibile inviare il feedback. Riprova più tardi.', feedbackTooFast:'Attendi un momento prima di inviare un altro feedback.', cancel:'Annulla', close:'Chiudi' });
Object.assign(translations.rm, { feedback:'Resun', feedbackTitle:'Dar in resun', feedbackIntro:'Tge plascha, tge manca u tge na funcziuna anc betg?', feedbackMessage:'Tia communicaziun', feedbackEmail:'E-mail (facultativ, sche ti vuls ina resposta)', feedbackSend:'Trametter il resun', feedbackSending:'Vegn tramess…', feedbackThanks:'Grazia! Tes resun è vegnì memorisà.', feedbackError:'Il resun n’ha betg pudì vegnir tramess. Emprova pli tard anc ina giada.', feedbackTooFast:'Spetga per plaschair in mument avant che trametter in ulteriur resun.', cancel:'Interrumper', close:'Serrar' });
Object.assign(translations.en, { feedback:'Feedback', feedbackTitle:'Give feedback', feedbackIntro:'What do you like, what is missing, or what is not working yet?', feedbackMessage:'Your message', feedbackEmail:'Email (optional, if you would like a reply)', feedbackSend:'Send feedback', feedbackSending:'Sending…', feedbackThanks:'Thank you! Your feedback has been saved.', feedbackError:'Your feedback could not be sent. Please try again later.', feedbackTooFast:'Please wait a moment before sending more feedback.', cancel:'Cancel', close:'Close' });
Object.assign(translations.zh, { feedback:'反馈', feedbackTitle:'提供反馈', feedbackIntro:'你喜欢什么、缺少什么，或者哪些功能尚未正常工作？', feedbackMessage:'你的留言', feedbackEmail:'电子邮箱（可选，如需回复）', feedbackSend:'发送反馈', feedbackSending:'正在发送…', feedbackThanks:'谢谢！你的反馈已保存。', feedbackError:'无法发送反馈，请稍后重试。', feedbackTooFast:'请稍候再发送其他反馈。', cancel:'取消', close:'关闭' });
Object.assign(translations.de, { intro:'Vergleiche Messstationen und entdecke, wie häufig Hitze-, Frost- und Eistage sowie Tropennächte auftreten.', navOverview:'Übersicht', navYears:'Jahresvergleich', navDetails:'Detailtage', navForecast:'Prognose', definitionsToggle:'Definitionen und Datenquelle', overviewEyebrow:'Auf einen Blick', overviewTitle:'Zusammenfassung', overviewLoading:'Die Zusammenfassung wird mit dem Vergleich geladen.', overviewChartTitle:'Vorschau Jahresvergleich', openYears:'Jahresvergleich öffnen', openDetails:'Detailtage ansehen', changeSelection:'Auswahl ändern', currentYearShort:'Aktuelles Jahr', periodAverage:'Langjähriger Vergleich', nextDaysShort:'Nächste 9 Tage (Prognose)' });
Object.assign(translations.fr, { intro:'Comparez les stations et découvrez la fréquence des journées de chaleur, de gel et sans dégel ainsi que des nuits tropicales.', navOverview:'Aperçu', navYears:'Comparaison annuelle', navDetails:'Jours en détail', navForecast:'Prévisions', definitionsToggle:'Définitions et source des données', overviewEyebrow:'En un coup d’œil', overviewTitle:'Résumé', overviewLoading:'Le résumé est chargé avec la comparaison.', overviewChartTitle:'Aperçu de la comparaison annuelle', openYears:'Ouvrir la comparaison annuelle', openDetails:'Voir les jours en détail', changeSelection:'Modifier la sélection', currentYearShort:'Année en cours', periodAverage:'Comparaison à long terme', nextDaysShort:'9 prochains jours (prévisions)' });
Object.assign(translations.it, { intro:'Confronta le stazioni e scopri la frequenza di giornate di caldo, gelo e ghiaccio e delle notti tropicali.', navOverview:'Panoramica', navYears:'Confronto annuale', navDetails:'Giorni in dettaglio', navForecast:'Previsioni', definitionsToggle:'Definizioni e fonte dei dati', overviewEyebrow:'A colpo d’occhio', overviewTitle:'Riepilogo', overviewLoading:'Il riepilogo viene caricato con il confronto.', overviewChartTitle:'Anteprima del confronto annuale', openYears:'Apri confronto annuale', openDetails:'Vedi giorni in dettaglio', changeSelection:'Modifica selezione', currentYearShort:'Anno corrente', periodAverage:'Confronto a lungo termine', nextDaysShort:'Prossimi 9 giorni (previsioni)' });
Object.assign(translations.rm, { intro:'Cumpareglia staziuns e scuvra quant savens che dis da chalira, schelira e glatsch sco era notgs tropicas cumparan.', navOverview:'Survista', navYears:'Cumparegliaziun annuala', navDetails:'Dis en detagl', navForecast:'Prognosa', definitionsToggle:'Definiziuns e funtauna da datas', overviewEyebrow:'En survista', overviewTitle:'Resumaziun', overviewLoading:'La resumaziun vegn chargiada cun la cumparegliaziun.', overviewChartTitle:'Prevista da la cumparegliaziun annuala', openYears:'Avrir la cumparegliaziun annuala', openDetails:'Vesair ils dis en detagl', changeSelection:'Midar la selecziun', currentYearShort:'Onn actual', periodAverage:'Cumparegliaziun a lunga durada', nextDaysShort:'Proxims 9 dis (prognosa)' });
Object.assign(translations.en, { intro:'Compare stations and discover how often heat, frost and ice days as well as tropical nights occur.', navOverview:'Overview', navYears:'Year comparison', navDetails:'Detail days', navForecast:'Forecast', definitionsToggle:'Definitions and data source', overviewEyebrow:'At a glance', overviewTitle:'Summary', overviewLoading:'The summary is loaded with the comparison.', overviewChartTitle:'Year comparison preview', openYears:'Open year comparison', openDetails:'View detail days', changeSelection:'Change selection', currentYearShort:'Current year', periodAverage:'Long-term comparison', nextDaysShort:'Next 9 days (forecast)' });
Object.assign(translations.zh, { intro:'比较不同气象站，了解高温日、霜冻日、冰冻日和热带夜出现的频率。', navOverview:'概览', navYears:'年度比较', navDetails:'日期详情', navForecast:'天气预报', definitionsToggle:'定义和数据来源', overviewEyebrow:'一览', overviewTitle:'摘要', overviewLoading:'摘要将与比较结果一起加载。', overviewChartTitle:'年度比较预览', openYears:'打开年度比较', openDetails:'查看日期详情', changeSelection:'更改选择', currentYearShort:'本年度', periodAverage:'长期比较', nextDaysShort:'未来9天（预报）' });
Object.assign(translations.de, { detailYearSelectionTitle:'Jahre für den Vergleich auswählen' });
Object.assign(translations.fr, { detailYearSelectionTitle:'Choisir les années à comparer' });
Object.assign(translations.it, { detailYearSelectionTitle:'Seleziona gli anni da confrontare' });
Object.assign(translations.rm, { detailYearSelectionTitle:'Tscherner ils onns per la cumparegliaziun' });
Object.assign(translations.en, { detailYearSelectionTitle:'Select years to compare' });
Object.assign(translations.zh, { detailYearSelectionTitle:'选择要比较的年份' });
Object.assign(translations.de, { summerOption:'Sommertage (Maximum ≥ 25 °C)', veryHotOption:'Sehr heisse Tage (Maximum ≥ 35 °C)', summerThreshold:'Tagesmaximum ≥ 25 °C', veryHotThreshold:'Tagesmaximum ≥ 35 °C', summerDaysDetailTitle:'Sommertage im Detail', summerDaysDetailIntro:'Alle gemessenen Tage mit einer Höchsttemperatur von mindestens 25 °C', veryHotDaysDetailTitle:'Sehr heisse Tage im Detail', veryHotDaysDetailIntro:'Alle gemessenen Tage mit einer Höchsttemperatur von mindestens 35 °C', heatwaveHighlight:'Längste Hitzewelle im gewählten Zeitraum' });
Object.assign(translations.fr, { summerOption:'Journées d’été (maximum ≥ 25 °C)', veryHotOption:'Journées très chaudes (maximum ≥ 35 °C)', summerThreshold:'Maximum journalier ≥ 25 °C', veryHotThreshold:'Maximum journalier ≥ 35 °C', summerDaysDetailTitle:'Journées d’été en détail', summerDaysDetailIntro:'Tous les jours mesurés avec une température maximale d’au moins 25 °C', veryHotDaysDetailTitle:'Journées très chaudes en détail', veryHotDaysDetailIntro:'Tous les jours mesurés avec une température maximale d’au moins 35 °C', heatwaveHighlight:'Plus longue vague de chaleur de la période sélectionnée' });
Object.assign(translations.it, { summerOption:'Giornate estive (massima ≥ 25 °C)', veryHotOption:'Giornate molto calde (massima ≥ 35 °C)', summerThreshold:'Massima giornaliera ≥ 25 °C', veryHotThreshold:'Massima giornaliera ≥ 35 °C', summerDaysDetailTitle:'Giornate estive in dettaglio', summerDaysDetailIntro:'Tutti i giorni misurati con una massima di almeno 25 °C', veryHotDaysDetailTitle:'Giornate molto calde in dettaglio', veryHotDaysDetailIntro:'Tutti i giorni misurati con una massima di almeno 35 °C', heatwaveHighlight:'Ondata di caldo più lunga nel periodo selezionato' });
Object.assign(translations.rm, { summerOption:'Dis da stad (maximum ≥ 25 °C)', veryHotOption:'Dis fitg chauds (maximum ≥ 35 °C)', summerThreshold:'Maximum dal di ≥ 25 °C', veryHotThreshold:'Maximum dal di ≥ 35 °C', summerDaysDetailTitle:'Dis da stad en detagl', summerDaysDetailIntro:'Tut ils dis mesirads cun ina temperatura maximala dad almain 25 °C', veryHotDaysDetailTitle:'Dis fitg chauds en detagl', veryHotDaysDetailIntro:'Tut ils dis mesirads cun ina temperatura maximala dad almain 35 °C', heatwaveHighlight:'Perioda da chalira la pli lunga en la perioda tschernida' });
Object.assign(translations.en, { summerOption:'Summer days (maximum ≥ 25 °C)', veryHotOption:'Very hot days (maximum ≥ 35 °C)', summerThreshold:'Daily maximum ≥ 25 °C', veryHotThreshold:'Daily maximum ≥ 35 °C', summerDaysDetailTitle:'Summer days in detail', summerDaysDetailIntro:'All measured days with a maximum temperature of at least 25 °C', veryHotDaysDetailTitle:'Very hot days in detail', veryHotDaysDetailIntro:'All measured days with a maximum temperature of at least 35 °C', heatwaveHighlight:'Longest heatwave in the selected period' });
Object.assign(translations.zh, { summerOption:'夏日（最高温 ≥ 25 °C）', veryHotOption:'极热日（最高温 ≥ 35 °C）', summerThreshold:'每日最高温 ≥ 25 °C', veryHotThreshold:'每日最高温 ≥ 35 °C', summerDaysDetailTitle:'夏日详情', summerDaysDetailIntro:'所有最高气温达到或超过 25 °C 的实测日期', veryHotDaysDetailTitle:'极热日详情', veryHotDaysDetailIntro:'所有最高气温达到或超过 35 °C 的实测日期', heatwaveHighlight:'所选时段内最长热浪' });
Object.assign(translations.de, { intro:'Vergleiche Messstationen und entdecke Temperaturereignisse, Entwicklungen und Wetterrekorde in der Schweiz.', summerDefinitionTitle:'Was ist ein Sommertag?', summerDefinitionText:'Ein Tag, an dem die gemessene Höchsttemperatur mindestens 25 °C erreicht.', veryHotDefinitionTitle:'Was ist ein sehr heisser Tag?', veryHotDefinitionText:'Ein Tag, an dem die gemessene Höchsttemperatur mindestens 35 °C erreicht.', heatwaveDefinitionTitle:'Was bedeutet längste Hitzewelle?', heatwaveDefinitionText:'Die längste Folge aufeinanderfolgender Tage mit einer Höchsttemperatur von mindestens 30 °C.' });
Object.assign(translations.fr, { intro:'Comparez les stations et découvrez les événements thermiques, les évolutions et les records météorologiques en Suisse.', summerDefinitionTitle:'Qu’est-ce qu’une journée d’été ?', summerDefinitionText:'Une journée durant laquelle la température maximale mesurée atteint au moins 25 °C.', veryHotDefinitionTitle:'Qu’est-ce qu’une journée très chaude ?', veryHotDefinitionText:'Une journée durant laquelle la température maximale mesurée atteint au moins 35 °C.', heatwaveDefinitionTitle:'Que signifie la plus longue vague de chaleur ?', heatwaveDefinitionText:'La plus longue série de jours consécutifs avec une température maximale d’au moins 30 °C.' });
Object.assign(translations.it, { intro:'Confronta le stazioni e scopri eventi termici, tendenze e record meteorologici in Svizzera.', summerDefinitionTitle:'Che cos’è una giornata estiva?', summerDefinitionText:'Un giorno in cui la temperatura massima misurata raggiunge almeno 25 °C.', veryHotDefinitionTitle:'Che cos’è una giornata molto calda?', veryHotDefinitionText:'Un giorno in cui la temperatura massima misurata raggiunge almeno 35 °C.', heatwaveDefinitionTitle:'Cosa significa ondata di caldo più lunga?', heatwaveDefinitionText:'La più lunga sequenza di giorni consecutivi con una temperatura massima di almeno 30 °C.' });
Object.assign(translations.rm, { intro:'Cumpareglia staziuns e scuvra eveniments da temperatura, svilups e records meteorologics en Svizra.', summerDefinitionTitle:'Tge è in di da stad?', summerDefinitionText:'In di cun ina temperatura maximala mesirada dad almain 25 °C.', veryHotDefinitionTitle:'Tge è in di fitg chaud?', veryHotDefinitionText:'In di cun ina temperatura maximala mesirada dad almain 35 °C.', heatwaveDefinitionTitle:'Tge munta la perioda da chalira la pli lunga?', heatwaveDefinitionText:'La pli lunga successiun da dis consecutivs cun ina temperatura maximala dad almain 30 °C.' });
Object.assign(translations.en, { intro:'Compare stations and discover temperature events, trends and weather records across Switzerland.', summerDefinitionTitle:'What is a summer day?', summerDefinitionText:'A day on which the measured maximum temperature reaches at least 25 °C.', veryHotDefinitionTitle:'What is a very hot day?', veryHotDefinitionText:'A day on which the measured maximum temperature reaches at least 35 °C.', heatwaveDefinitionTitle:'What does longest heatwave mean?', heatwaveDefinitionText:'The longest run of consecutive days with a maximum temperature of at least 30 °C.' });
Object.assign(translations.zh, { intro:'比较不同气象站，探索瑞士各地的温度事件、变化趋势和天气纪录。', summerDefinitionTitle:'什么是夏日？', summerDefinitionText:'实测每日最高气温达到或超过 25 °C 的一天。', veryHotDefinitionTitle:'什么是极热日？', veryHotDefinitionText:'实测每日最高气温达到或超过 35 °C 的一天。', heatwaveDefinitionTitle:'最长热浪是什么意思？', heatwaveDefinitionText:'每日最高气温达到或超过 30 °C 的最长连续天数。' });
Object.assign(translations.de, { longestFrostPeriod:'Längste Frostperiode', frostPeriodHighlight:'Längste Frostperiode im gewählten Zeitraum', frostPeriodDefinitionTitle:'Was bedeutet längste Frostperiode?', frostPeriodDefinitionText:'Die längste Folge aufeinanderfolgender Tage, an denen die Tiefsttemperatur unter 0 °C fällt.' });
Object.assign(translations.fr, { longestFrostPeriod:'Plus longue période de gel', frostPeriodHighlight:'Plus longue période de gel de la période sélectionnée', frostPeriodDefinitionTitle:'Que signifie la plus longue période de gel ?', frostPeriodDefinitionText:'La plus longue série de jours consécutifs durant lesquels la température minimale descend sous 0 °C.' });
Object.assign(translations.it, { longestFrostPeriod:'Periodo di gelo più lungo', frostPeriodHighlight:'Periodo di gelo più lungo nel periodo selezionato', frostPeriodDefinitionTitle:'Cosa significa periodo di gelo più lungo?', frostPeriodDefinitionText:'La più lunga sequenza di giorni consecutivi in cui la temperatura minima scende sotto 0 °C.' });
Object.assign(translations.rm, { longestFrostPeriod:'Perioda da schelira la pli lunga', frostPeriodHighlight:'Perioda da schelira la pli lunga en la perioda tschernida', frostPeriodDefinitionTitle:'Tge munta la perioda da schelira la pli lunga?', frostPeriodDefinitionText:'La pli lunga successiun da dis consecutivs durant ils quals la temperatura minimala croda sut 0 °C.' });
Object.assign(translations.en, { longestFrostPeriod:'Longest frost period', frostPeriodHighlight:'Longest frost period in the selected period', frostPeriodDefinitionTitle:'What does longest frost period mean?', frostPeriodDefinitionText:'The longest run of consecutive days on which the minimum temperature falls below 0 °C.' });
Object.assign(translations.zh, { longestFrostPeriod:'最长霜冻期', frostPeriodHighlight:'所选时段内最长霜冻期', frostPeriodDefinitionTitle:'最长霜冻期是什么意思？', frostPeriodDefinitionText:'每日最低气温低于 0 °C 的最长连续天数。' });
Object.assign(translations.de, { warmestDay:'Wärmster Tag', coldestDay:'Kältester Tag' });
Object.assign(translations.fr, { warmestDay:'Journée la plus chaude', coldestDay:'Journée la plus froide' });
Object.assign(translations.it, { warmestDay:'Giorno più caldo', coldestDay:'Giorno più freddo' });
Object.assign(translations.rm, { warmestDay:'Di il pli chaud', coldestDay:'Di il pli fraid' });
Object.assign(translations.en, { warmestDay:'Warmest day', coldestDay:'Coldest day' });
Object.assign(translations.zh, { warmestDay:'最热日', coldestDay:'最冷日' });
let currentLanguage = 'de';
const validViews = ['overview', 'years', 'details', 'forecast'];
let currentView = validViews.includes(new URLSearchParams(location.search).get('view')) ? new URLSearchParams(location.search).get('view') : 'overview';
const tr = key => translations[currentLanguage][key] || translations.de[key] || key;
const locale = () => ({de:'de-CH',fr:'fr-CH',it:'it-CH',rm:'rm-CH',en:'en-GB',zh:'zh-CN'}[currentLanguage]);
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
  document.querySelector('#metric option[value="heatDays"]').textContent = tr('heatOption');
  document.querySelector('#metric option[value="summerDays"]').textContent = tr('summerOption');
  document.querySelector('#metric option[value="veryHotDays"]').textContent = tr('veryHotOption');
  document.querySelector('#metric option[value="tropicalNights"]').textContent = tr('tropicalOption');
  document.querySelector('#metric option[value="frostDays"]').textContent = tr('frostOption');
  document.querySelector('#metric option[value="iceDays"]').textContent = tr('iceOption');
  document.querySelectorAll('.remove-station').forEach(button => button.setAttribute('aria-label', tr('removeStation')));
  document.querySelector('#station-add-search').placeholder = tr('stationSearchPlaceholder');
  document.querySelector('#feedback-close').setAttribute('aria-label', tr('close'));
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
  if (title) title.textContent = tr({ years:'navYears', details:'navDetails', forecast:'navForecast' }[currentView] || 'navOverview');
}

function setView(view, updateHistory = true) {
  currentView = validViews.includes(view) ? view : 'overview';
  document.querySelectorAll('.view-panel[data-view]').forEach(panel => { panel.hidden = panel.dataset.view !== currentView; });
  document.querySelectorAll('[data-detail-view]').forEach(panel => { panel.hidden = currentView === 'overview'; });
  document.body.classList.toggle('detail-active', currentView !== 'overview');
  updateViewChrome();
  if (updateHistory) history.pushState({ view: currentView }, '', currentView === 'overview' ? location.pathname : `${location.pathname}?view=${currentView}`);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function stationLabel(station) {
  return `${station.name} (${station.canton})${station.elevationMetres ? ` · ${station.elevationMetres} ${tr('altitudeUnit')}` : ''}`;
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
    if (selected.has(station.id)) return false;
    if (cantonCodes.size) return cantonCodes.has(station.canton);
    return !query || normalized(`${station.name} ${station.canton} ${station.id}`).includes(query);
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
  title.textContent = `${station.name} (${station.canton})`;
  const details = document.createElement('span');
  details.textContent = `${tr('altitude')}: ${station.elevationMetres || '–'} ${tr('altitudeUnit')}${note ? ` · ${note}` : ''}`;
  info.append(title, details);
}

function renderMap({ fitToQuery = false } = {}) {
  const panel = document.querySelector('#map-panel');
  if (!stationMap && panel.hidden) return;
  if (!stationMap) {
    stationMap = L.map('station-map', { minZoom: 6, maxZoom: 14 }).fitBounds([[45.75, 5.8], [47.85, 10.55]], { padding: [8, 8] });
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
    }).addTo(stationMap);
    stationMarkerLayer = L.layerGroup().addTo(stationMap);
  }
  const selectedIds = selectedStationIds();
  const query = normalized(document.querySelector('#station-add-search').value.trim());
  const cantonCodes = matchingCantonCodes(query);
  const visibleLocations = [];
  stationMarkerLayer.clearLayers();
  stations.filter(station => Number.isFinite(station.latitude) && Number.isFinite(station.longitude)).forEach(station => {
    const selectedIndex = selectedIds.indexOf(station.id);
    const searchText = normalized(`${station.name} ${station.canton} ${station.id}`);
    if (query && (cantonCodes.size ? !cantonCodes.has(station.canton) : !searchText.includes(query))) return;
    visibleLocations.push([station.latitude, station.longitude]);
    const marker = L.circleMarker([station.latitude, station.longitude], {
      radius: selectedIndex >= 0 ? 11 : 7,
      color: selectedIndex >= 0 ? '#7f2118' : '#ffffff',
      weight: selectedIndex >= 0 ? 3 : 2,
      fillColor: selectedIndex >= 0 ? '#d65337' : '#26322e',
      fillOpacity: selectedIndex >= 0 ? 1 : .9
    });
    marker.bindTooltip(`${station.name} (${station.canton}) · ${station.elevationMetres} ${tr('altitudeUnit')}`, { direction: 'top', offset: [0, -4] });
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
      stationMap.fitBounds([[45.75, 5.8], [47.85, 10.55]], { padding: [8, 8] });
    }
  }
}

async function loadStations() {
  try {
    const response = await fetch('/api/stations');
    if (!response.ok) throw new Error(tr('noResults'));
    stations = await response.json();
    const preferred = ['SMA', 'BAS'].map(id => stations.find(station => station.id === id)?.id).filter(Boolean);
    addStation(preferred[0] || stations[0]?.id);
    addStation(preferred[1] || stations[1]?.id);
    await compare();
  } catch (error) { status.textContent = error.message; }
}

function selectedStationIds() { return [...selectors.querySelectorAll('.station-row')].map(row => row.dataset.stationId); }

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

async function fetchDetailDays(id, year) {
  const metricKey = document.querySelector('#metric').value;
  const route = metricKey === 'frostDays' ? 'frost-days' : metricKey === 'iceDays' ? 'ice-days' : metricKey === 'summerDays' ? 'summer-days' : metricKey === 'veryHotDays' ? 'very-hot-days' : 'heat-days';
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

function renderHeatDays(yearGroups) {
  const detailMetricKey = document.querySelector('#metric').value;
  const frost = detailMetricKey === 'frostDays';
  const ice = detailMetricKey === 'iceDays';
  const detailMetric = metricInfo(detailMetricKey);
  const detailPrefix = detailMetricKey === 'frostDays' ? 'frostDays' : detailMetricKey === 'iceDays' ? 'iceDays' : detailMetricKey === 'summerDays' ? 'summerDays' : detailMetricKey === 'veryHotDays' ? 'veryHotDays' : 'heatDays';
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
        const days = timelineValues(item, year);
        const forecastCount = days.filter(day => day.forecast).length;
        const currentRangeStart = new Date(year, firstMonth, 1);
        const currentRangeEnd = new Date(year, lastMonth + 1, 1);
        const currentRangeLength = (currentRangeEnd - currentRangeStart) / 86400000;
        return `<div class="heat-days-year-row"><div class="heat-days-year-label"><strong>${year}</strong><span>${item.values.length}${forecastCount ? ` + ${forecastCount}` : ''} ${detailMetric.label}</span>${selectedHeatDayYears.length > 1 ? `<button class="remove-detail-year" type="button" data-year="${year}" aria-label="${tr('removeYear')}: ${year}" title="${tr('removeYear')}">×</button>` : ''}</div>${days.length ? `<div class="heat-days-timeline" style="--month-count:${monthCount}" aria-label="${item.station.name}: ${days.length} ${detailMetric.label} ${year}">${days.map(day => {
        const date = new Date(`${day.date}T12:00:00`);
        const minimum = day.minimumTemperatureCelsius == null ? '–' : `${formatter.format(day.minimumTemperatureCelsius)} °C`;
        const position = (date - currentRangeStart) / 86400000 / currentRangeLength * 100;
        const label = `${date.toLocaleDateString(locale(), { weekday:'short', day:'2-digit', month:'long' })}: ${tr('maximum')} ${formatter.format(day.maximumTemperatureCelsius)} °C, ${tr('minimum')} ${minimum}${day.forecast ? ` (${tr('predicted')})` : ''}`;
        const displayedTemperature = frost ? day.minimumTemperatureCelsius : day.maximumTemperatureCelsius;
        const barHeight = 8 + Math.min(24, Math.abs(frost || ice ? displayedTemperature : displayedTemperature - 30) * 2.4);
        return `<button class="heat-day-marker ${day.forecast ? 'forecast' : ''}" type="button" style="left:${position}%;--bar-height:${barHeight}px" title="${label}" aria-label="${label}"><span>${formatter.format(displayedTemperature)}°</span></button>`;
        }).join('')}<span class="timeline-arrow" aria-hidden="true"></span></div>` : `<div class="heat-days-timeline empty" style="--month-count:${monthCount}"><span class="timeline-arrow" aria-hidden="true"></span></div>`}</div>`;
      }).join('')}
    </article>`).join('');
}

function openHeatDayYear(year) {
  if (!['heatDays', 'summerDays', 'veryHotDays', 'frostDays', 'iceDays'].includes(document.querySelector('#metric').value)) return;
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
    renderHeatDays(groups);
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
      return `<div class="bar-stack" style="height:${total / maximum * 100}%;--bar-color:${colors[index]}" title="${item.station.name}: ${details}">
        <span>${total || ''}</span>
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
      current: currentValue?.[metricKey] ?? 0,
      average: values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0,
      forecast: forecastCounts.get(item.station.id) || 0,
      record: warmRecord || coldRecord ? currentValue : null,
      extreme: warmRecord || coldRecord ? currentValue?.[extremeKey] : null
    };
  });
  const card = (title, key) => `<article><h3>${title}</h3>${rows.map((row, index) => `<div class="overview-value" style="--station-color:${colors[index]}"><span>${row.name}</span><strong>${formatter.format(row[key])}</strong><small>${metric.label}</small>${key === 'current' && row.record ? `<strong class="overview-record-value">${row.record[recordKey]}</strong><small class="overview-record overview-record-series">${recordLabel} (${tr('days')})</small><strong class="overview-record-value">${formatter.format(row.extreme)}°</strong><small class="overview-record">${extremeLabel} (°C)</small>` : ''}</div>`).join('')}</article>`;
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
  document.querySelector('#view-filter-summary').innerHTML = `<span>${data.map(item => item.station.name).join(' · ')}</span><span>${from}–${to}</span><span>${metric.label}</span>`;
}

function renderLatestView() {
  if (!latestView) return;
  const { data, forecasts, contexts, heatDays, from, to, stationCount: count } = latestView;
  latestForecasts = forecasts;
  renderComparison(data, forecasts, from, to);
  renderHeatDays(heatDays);
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
function syncMapLayout() {
  const button = document.querySelector('#map-toggle');
  const panel = document.querySelector('#map-panel');
  if (desktopMapQuery.matches) {
    button.setAttribute('aria-expanded', 'true');
    panel.hidden = false;
    renderMap();
    setTimeout(() => stationMap?.invalidateSize(), 0);
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
    renderMap();
    setTimeout(() => stationMap.invalidateSize(), 0);
  }
});
document.querySelector('#metric').addEventListener('change', compare);
document.querySelector('#fromYear').addEventListener('change', compare);
document.querySelector('#toYear').addEventListener('change', compare);
document.querySelector('#heat-day-year').addEventListener('change', event => { selectedHeatDayYears = [Number(event.target.value)]; loadHeatDayDetails(); });
document.querySelector('#heat-days-detail').addEventListener('click', event => {
  const button = event.target.closest('.remove-detail-year');
  if (button) removeDetailYear(Number(button.dataset.year));
});
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
document.querySelector('#language').addEventListener('change', event => {
  currentLanguage = event.target.value;
  applyLanguage();
  renderLatestView();
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
applyLanguage();
setView(currentView, false);
syncMapLayout();
loadStations();
