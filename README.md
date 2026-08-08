# Hitzetage Schweiz

Deutschsprachige Webanwendung zur Auswertung von Hitzetagen an MeteoSwiss-Messstationen. Ein **Hitzetag** ist hier ein Tag mit einer Tageshöchsttemperatur von mindestens 30 °C.

Das Projekt ist als schlanker, lauffähiger Ausgangspunkt aufgebaut: Spring Boot stellt API und statisches JavaScript-Frontend gemeinsam bereit. Stationsliste und Tageshöchstwerte werden live aus dem offiziellen MeteoSwiss-Open-Data-Angebot geladen und für sechs Stunden im Arbeitsspeicher zwischengespeichert.

## Voraussetzungen

Wahlweise:

- Docker mit Docker Compose, oder
- JDK 21 und Maven 3.9+

## Start mit Docker

```bash
docker compose up --build
```

Danach im Browser <http://localhost:8080> öffnen. Beenden mit `Ctrl+C`; Container entfernen mit `docker compose down`.

## Start mit Java und Maven

```bash
mvn spring-boot:run
```

Tests ausführen:

```bash
mvn test
```

## Schnittstellen

- `GET /api/stations` – verfügbare Stationen
- `GET /api/stations/{stationId}/annual-values?fromYear=2022&toYear=2024` – Jahreswerte einer Station
- `GET /api/stations/{stationId}/forecast` – lokale Neun-Tage-Prognose mit Minimum, Maximum sowie erwarteten Hitzetagen und Tropennächten

Beispiel:

```bash
curl "http://localhost:8080/api/stations/ZRH/annual-values?fromYear=2022&toYear=2024"
```

Die Antwort nennt über `dataStatus: "meteoswiss"` die Datenquelle. `heatDayThresholdCelsius` dokumentiert den verwendeten Schwellenwert.

## Datenquelle und nächster Ausbauschritt

Quelle ist das offizielle [MeteoSwiss Open-Data-Angebot](https://opendatadocs.meteoswiss.ch/a-data-groundbased/a1-automatic-weather-stations). Der Datenzugriff ist durch `StationDataSource` von API und Oberfläche getrennt. `MeteoSwissStationDataSource` lädt die dokumentierten Stationsmetadaten sowie tägliche historische und aktuelle Dateien über `data.geo.admin.ch`. Aus dem offiziellen Tagesmaximum `tre200dx` wird die Anzahl der Tage ab 30 °C berechnet.

Die Prognose stammt aus der offiziellen Sammlung `ch.meteoschweiz.ogd-local-forecasting`. Messstationen werden über ihr MeteoSwiss-Stationskürzel den Prognosepunkten zugeordnet. Verwendet werden `tre200pn` (lokales Tagesminimum) und `tre200px` (lokales Tagesmaximum); Messwerte und Prognosen werden in der Oberfläche getrennt dargestellt.

Für Offline-Entwicklung lässt sich die Anwendung mit `SPRING_PROFILES_ACTIVE=demo` weiterhin mit drei Beispieldatensätzen starten. Live-Daten werden nicht still durch Demo-Werte ersetzt: Ist MeteoSwiss beim ersten Abruf nicht erreichbar, antwortet die API mit HTTP 503.

## Struktur

```text
src/main/java/ch/hitzetage/          Spring-Boot-Anwendung
src/main/java/ch/hitzetage/station/  API, Datenmodell und Datenquellen-Abstraktion
src/main/resources/static/           HTML, CSS und JavaScript
src/test/                             API-Tests
Dockerfile                            zweistufiges Container-Build
compose.yaml                          lokaler Ein-Container-Start
```

## Noch offen

- Visualisierung, Datenqualitäts-Hinweise und Export
- CI-Pipeline und später ein Remote-Repository
