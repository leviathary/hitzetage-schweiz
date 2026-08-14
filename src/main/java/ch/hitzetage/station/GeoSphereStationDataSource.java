package ch.hitzetage.station;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component @Profile("!demo")
class GeoSphereStationDataSource extends AbstractDailyStationDataSource {
    private static final String BASE="https://dataset.api.hub.geosphere.at/v1/station/historical/klima-v2-1d";
    private final HttpClient client=HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(12)).build();
    private final ObjectMapper json=new ObjectMapper(); private final Map<String,Entry> cache=new ConcurrentHashMap<>();

    @Override public List<Station> findStations(){
        JsonNode root=get(BASE+"/metadata"); List<Station> result=new ArrayList<>();
        root.path("stations").forEach(s->{if(s.path("is_active").asBoolean() && "COMBINED".equals(s.path("type").asText())) result.add(new Station("AT:"+s.path("id").asText(),s.path("name").asText(),s.path("state").asText("Österreich"),(int)Math.round(s.path("altitude").asDouble()),s.path("lat").asDouble(),s.path("lon").asDouble(),"AT","Österreich","GeoSphere Austria"));});
        return result.stream().sorted(Comparator.comparing(Station::name,String.CASE_INSENSITIVE_ORDER)).toList();
    }
    @Override protected List<Observation> observations(String id,LocalDate start,LocalDate end){
        String station=id.replaceFirst("(?i)^AT:",""); String url=BASE+"?parameters=tlmax,tlmin,rr&station_ids="+enc(station)+"&start="+start+"&end="+end;
        JsonNode root=get(url), timestamps=root.path("timestamps"), features=root.path("features"); List<Observation> result=new ArrayList<>(); if(features.isEmpty())return result;
        JsonNode parameters=features.get(0).path("properties").path("parameters");
        for(int i=0;i<timestamps.size();i++){LocalDate date=LocalDate.parse(timestamps.get(i).asText().substring(0,10));result.add(new Observation(date,value(parameters,"tlmax",i),value(parameters,"tlmin",i),rain(value(parameters,"rr",i))));} return result;
    }
    private Double value(JsonNode p,String name,int i){JsonNode values=p.path(name).path("data");if(!values.isArray()||i>=values.size()||values.get(i).isNull())return null;return values.get(i).asDouble();}
    private Double rain(Double value){return value==null?null:Math.max(0,value);}
    private JsonNode get(String url){Entry old=cache.get(url);if(old!=null&&!old.expired())return old.value();try{var response=client.send(HttpRequest.newBuilder(URI.create(url)).timeout(Duration.ofSeconds(60)).GET().build(),HttpResponse.BodyHandlers.ofString());if(response.statusCode()!=200)throw new RuntimeException("GeoSphere antwortete mit HTTP "+response.statusCode());JsonNode value=json.readTree(response.body());cache.put(url,new Entry(value,System.nanoTime()));return value;}catch(Exception e){if(old!=null)return old.value();throw new RuntimeException("GeoSphere Austria ist momentan nicht erreichbar",e);}}
    private static String enc(String value){return URLEncoder.encode(value,StandardCharsets.UTF_8);} private record Entry(JsonNode value,long loaded){boolean expired(){return System.nanoTime()-loaded>Duration.ofHours(6).toNanos();}}
}
