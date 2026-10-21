import { useEffect, useRef } from "react";
import { View } from "react-native";
import { WebView as RNWebView, type WebViewMessageEvent, type WebViewProps } from "react-native-webview";

interface WebViewHandle {
  injectJavaScript: (script: string) => void;
}

// react-native-webview's class typings resolve every prop to `never` under
// React 19 types, so describe the bits we use explicitly.
const WebView = RNWebView as unknown as React.ComponentType<WebViewProps & { ref?: React.Ref<WebViewHandle> }>;

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  name: string;
}

interface LeafletMapProps {
  center: { lat: number; lng: number };
  radiusKm: number;
  markers: MapMarker[];
  // Bump to re-fit the view around the search circle (first load, "my location").
  recenterKey: number;
  height?: number;
  onPick: (point: { lat: number; lng: number }) => void;
  onSelectMarker: (id: string) => void;
}

// Leaflet + OpenStreetMap inside a WebView: no API key, same stack as the web
// finder (apps/web/src/shared/components/LocationPicker.tsx).
const HTML = `<!doctype html><html><head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<style>html,body,#map{height:100%;margin:0;padding:0;background:#e8efe9}</style>
</head><body><div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
function send(m){window.ReactNativeWebView.postMessage(JSON.stringify(m));}
if(!window.L){send({type:"error"});}else{
var pin=L.divIcon({className:"",iconSize:[30,30],iconAnchor:[15,30],
  html:'<div style="width:30px;height:30px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:#1f6b53;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.4);box-sizing:border-box"><div style="width:10px;height:10px;border-radius:50%;background:#fff;margin:7px"></div></div>'});
var map=L.map("map").setView([10.7769,106.7009],13);
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:"&copy; OpenStreetMap"}).addTo(map);
var me=null,ring=null,group=L.layerGroup().addTo(map),lastKey=-1;
map.on("click",function(e){send({type:"pick",lat:e.latlng.lat,lng:e.latlng.lng});});
window.update=function(d){
  if(me)map.removeLayer(me);if(ring)map.removeLayer(ring);group.clearLayers();
  me=L.circleMarker([d.center.lat,d.center.lng],{radius:9,color:"#1d4ed8",weight:3,fillColor:"#3b82f6",fillOpacity:1}).addTo(map);
  ring=L.circle([d.center.lat,d.center.lng],{radius:d.radiusKm*1000,color:"#1f6b53",weight:1,fillColor:"#1f6b53",fillOpacity:0.07}).addTo(map);
  d.markers.forEach(function(m){
    L.marker([m.lat,m.lng],{title:m.name,icon:pin}).addTo(group).on("click",function(){send({type:"select",id:m.id});});
  });
  if(d.recenterKey!==lastKey){lastKey=d.recenterKey;map.fitBounds(ring.getBounds());}
};
send({type:"ready"});
}
</script></body></html>`;

export function LeafletMap({ center, radiusKm, markers, recenterKey, height = 360, onPick, onSelectMarker }: LeafletMapProps) {
  const webview = useRef<WebViewHandle>(null);
  const ready = useRef(false);

  function push() {
    if (!ready.current) return;
    webview.current?.injectJavaScript(`window.update(${JSON.stringify({ center, radiusKm, markers, recenterKey })});true;`);
  }

  // Re-send whenever the search point, radius, results or recenter request change.
  useEffect(push, [center, radiusKm, markers, recenterKey]);

  function handleMessage(event: WebViewMessageEvent) {
    const message = JSON.parse(event.nativeEvent.data) as { type: string; lat?: number; lng?: number; id?: string };
    if (message.type === "ready") {
      ready.current = true;
      push();
    } else if (message.type === "pick" && message.lat !== undefined && message.lng !== undefined) {
      onPick({ lat: message.lat, lng: message.lng });
    } else if (message.type === "select" && message.id) {
      onSelectMarker(message.id);
    }
  }

  return (
    <View style={{ height, borderRadius: 18, overflow: "hidden" }} accessibilityLabel="Bản đồ phòng khám">
      <WebView
        ref={webview}
        originWhitelist={["*"]}
        source={{ html: HTML }}
        javaScriptEnabled
        nestedScrollEnabled
        onMessage={handleMessage}
        style={{ flex: 1 }}
      />
    </View>
  );
}
