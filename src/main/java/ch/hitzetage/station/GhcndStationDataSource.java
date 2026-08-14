package ch.hitzetage.station;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Component @Profile("!demo")
class GhcndStationDataSource extends AbstractDailyStationDataSource {
    private static final String BASE="https://www.ncei.noaa.gov/pub/data/ghcn/daily/";
    private static final Map<String,Country> COUNTRIES=Map.of(
            "IT",new Country("IT","Italien"), "PL",new Country("PL","Polen"),
            "EI",new Country("IE","Irland"), "UK",new Country("GB","Vereinigtes Königreich"),
            "SP",new Country("ES","Spanien"), "SW",new Country("SE","Schweden"),
            "NO",new Country("NO","Norwegen"));
    private final HttpClient client=HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(15)).build(); private final Map<String,Entry> cache=new ConcurrentHashMap<>();
    @Override public List<Station> findStations(){
        String stations=text(BASE+"ghcnd-stations.txt"),inventory=text(BASE+"ghcnd-inventory.txt"); int cutoff=LocalDate.now().getYear()-2; Set<String> usable=ConcurrentHashMap.newKeySet(); Map<String,Integer> latest=new HashMap<>();
        inventory.lines().filter(l->l.length()>=45&&COUNTRIES.containsKey(l.substring(0,2))).forEach(l->{String element=slice(l,31,35).trim();int end=integer(slice(l,41,45),0);if(element.equals("TMAX")||element.equals("TMIN")){latest.merge(slice(l,0,11),end,Math::min);if(end>=cutoff)usable.add(slice(l,0,11));}});
        List<Station> result=new ArrayList<>();stations.lines().filter(l->l.length()>=71&&COUNTRIES.containsKey(l.substring(0,2))&&usable.contains(slice(l,0,11))).forEach(l->{Country c=COUNTRIES.get(l.substring(0,2));String id=slice(l,0,11),name=slice(l,41,71).trim();double latitude=number(slice(l,12,20)),longitude=number(slice(l,21,30));
            // GHCN-Daily UKE00107650 carries Heathrow's longitude with the wrong sign.
            if(id.equals("UKE00107650")){latitude=51.478;longitude=-0.461;}
            result.add(new Station(c.code()+":"+id,name,c.name(),(int)Math.round(number(slice(l,31,37))),latitude,longitude,c.code(),c.name(),"NOAA/NCEI GHCN-Daily",latest.get(id)));});
        Map<String,Station> unique=new HashMap<>();
        result.stream().filter(s->s.latitude()!=0&&s.longitude()!=0).forEach(station->{String key=station.countryCode()+":"+station.name().strip().toUpperCase(java.util.Locale.ROOT);Station previous=unique.get(key);if(previous==null||latest.getOrDefault(ghcnId(station),0)>latest.getOrDefault(ghcnId(previous),0))unique.put(key,station);});
        return unique.values().stream().sorted(Comparator.comparing(Station::countryCode).thenComparing(Station::name,String.CASE_INSENSITIVE_ORDER)).toList();
    }
    @Override protected List<Observation> observations(String stationId,LocalDate start,LocalDate end){String ghcn=stationId.substring(stationId.indexOf(':')+1);String data=text(BASE+"all/"+ghcn+".dly");Map<LocalDate,Mutable> rows=new HashMap<>();
        for(String line:data.lines().toList()){if(line.length()<269)continue;int year=integer(slice(line,11,15),0),month=integer(slice(line,15,17),0);if(year<start.getYear()||year>end.getYear())continue;String element=slice(line,17,21);if(!List.of("TMAX","TMIN","PRCP").contains(element))continue;for(int day=1;day<=31;day++){int at=21+(day-1)*8;int raw=integer(slice(line,at,at+5),-9999);char qualityFlag=line.charAt(at+6);if(raw==-9999||qualityFlag!=' ')continue;try{LocalDate date=LocalDate.of(year,month,day);if(date.isBefore(start)||date.isAfter(end))continue;Mutable m=rows.computeIfAbsent(date,k->new Mutable());double value=raw/10.0;if(element.equals("TMAX"))m.max=value;else if(element.equals("TMIN"))m.min=value;else m.rain=Math.max(0,value);}catch(RuntimeException ignored){}}}
        return rows.entrySet().stream().sorted(Map.Entry.comparingByKey()).map(e->new Observation(e.getKey(),e.getValue().max,e.getValue().min,e.getValue().rain)).toList();}
    private String text(String url){Entry old=cache.get(url);if(old!=null&&!old.expired())return old.value();try{var r=client.send(HttpRequest.newBuilder(URI.create(url)).timeout(Duration.ofSeconds(60)).GET().build(),HttpResponse.BodyHandlers.ofString());if(r.statusCode()!=200)throw new RuntimeException("NOAA antwortete mit HTTP "+r.statusCode());cache.put(url,new Entry(r.body(),System.nanoTime()));return r.body();}catch(Exception e){if(old!=null)return old.value();throw new RuntimeException("NOAA/NCEI ist momentan nicht erreichbar",e);}}
    private static String slice(String s,int a,int b){return s.substring(Math.min(a,s.length()),Math.min(b,s.length()));}private static int integer(String s,int fallback){try{return Integer.parseInt(s.trim());}catch(Exception e){return fallback;}}private static double number(String s){try{return Double.parseDouble(s.trim());}catch(Exception e){return 0;}}
    private static String ghcnId(Station station){return station.id().substring(station.id().indexOf(':')+1);}
    private static final class Mutable{Double max,min,rain;}private record Country(String code,String name){}private record Entry(String value,long loaded){boolean expired(){return System.nanoTime()-loaded>Duration.ofHours(12).toNanos();}}
}
