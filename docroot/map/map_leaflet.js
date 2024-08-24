
import { fetchApiData } from "../utils/network.js";
import { generatePopupHTML } from "../utils/map.js";
import { markerStyle, strokeStyle } from "../utils/map_leaflet.js";

export async function initialize(dataUrl) {

  const data = fetchApiData({url: dataUrl});
  var loca = (' ' + window.location).slice(1);
  loca = loca.replace("geojson","linestring");
  var sear=window.location.search;
  sear = sear.replace("geojson","linestring");
 
  const endpoint = "locations"
  const apiUrl = new URL(`${ false ? "./" : "../" }${ false ? "ws" : "api/0" }${endpoint === undefined ? "" : `/${endpoint}`}`, loca);

  apiUrl.search = sear

  const data2 = fetchApiData({url: apiUrl});

  const map = L.map('map-canvas').setView([0.0, 0.0], 1);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);

  const empty_geojson = {
    type: "FeatureCollection",
    features: [],
  };
  let lastLatLng = L.latLng(0.0, 0.0);

  const geojsonLayer = new L.GeoJSON(empty_geojson, {
    pointToLayer: function (feature, latlng) {
      return L.circleMarker(latlng, markerStyle);
    },
    onEachFeature: function(feature, layer) {
      if (feature.geometry.type === 'Point') {
        const description = generatePopupHTML({
          ...feature.properties,
          lat: feature.geometry.coordinates[1].toFixed(5),
          lon: feature.geometry.coordinates[0].toFixed(5),
        });

        layer.bindPopup(description);
      }
    },
    style: function(feature) {
      if (feature.geometry.type === 'Point') {
        return {};
      } else {
        return strokeStyle;
      }
    },
    coordsToLatLng: function(coords) {
      let lat = coords[1];
      let lon = coords[0];
      const dist0 = Math.abs(lon - lastLatLng.lng);
      const dist1 = Math.abs(lon + 360.0 - lastLatLng.lng);
      const dist2 = Math.abs(lon - 360.0 - lastLatLng.lng);
      if (dist0 > dist1 || dist0 > dist2) {
        if (dist0 > dist1) {
          lon += 360.0;
        } else {
          lon -= 360.0;
        }
      }
      const latLng = L.GeoJSON.coordsToLatLng([lon, lat]);
      lastLatLng = latLng;
      return latLng;
    },
  });

  map.addLayer(geojsonLayer);

  geojsonLayer.addData(await data2);
  geojsonLayer.addData(await data);
  if (geojsonLayer.getBounds().isValid()) map.fitBounds(geojsonLayer.getBounds());
  else map.openTooltip('No Data!',L.latLng(0.0,0.0));
}
