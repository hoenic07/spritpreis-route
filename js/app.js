mapGlobal = null;
mapChildren = []
function init() {
  if(!navigator.geolocation){
    $("#currentLocation").hide()
  }

  initMap();
  showMap(false);
  $("#search").click(search)
  $("#new-search").click(newSearch)
  $("#currentLocation").click(getCurrentLocation)
}

function initMap() {
  mapGlobal = L.map('map')
  L.tileLayer('http://a.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    id: 'mapbox.streets'
  }).addTo(mapGlobal);
}

function search() {
  var origin = $("#origin").val();
  var destination = $("#destination").val();
  var type = $('input[name=sprittype]:checked').val();
  var onlyOpen = $('#onlyopen').is(":checked");

  showMap(true);
  mapGlobal.invalidateSize();
  getDirections(origin, destination)
    .then((pts)=>{
      showRouteOnMap(pts)
      searchPts = calculateSearchPoints(pts)
      return getSpritpreisForRoute(searchPts, type, onlyOpen);
    },()=> {
      newSearch();
      alert("Keine Route gefunden!");
      return [];
    }).then(addStations);
}

function newSearch() {
  showMap(false);
  mapChildren.forEach(c => c.remove())
  mapChildren = []
}

function getCurrentLocation(){
  navigator.geolocation.getCurrentPosition((pos)=>{
    const locStr = `${pos.coords.latitude} ${pos.coords.longitude}`
    $("#origin").val(locStr);
  }, (error)=>{
    alert("Standort konnte nicht ermittelt werden!");
  });
}

function showMap(show) {
  if (show) {
    $("#input").hide();
    $("#map").show();
  }
  else {
    $("#input").show();
    $("#map").hide();
  }
}

function showRouteOnMap(routePts){
  var polyline = L.polyline(routePts, { color: 'red' }).addTo(mapGlobal);
  mapChildren.push(polyline)
  mapGlobal.fitBounds(polyline.getBounds());
}

function calculateSearchPoints(routePts) {
  let searchPts = []
  searchPts.push(routePts[0])

  let curDist = 0
  for (let i = 0; i < routePts.length - 1; i++) {
    curDist += haversineDistance(routePts[i], routePts[i + 1], false)
    if (curDist > 25) {
      curDist = 0
      searchPts.push(routePts[i])
    }
  }

  return searchPts
}

function addStations(stations){
  var cnt = 0;
  stations.forEach((st)=>{
    var price = st["prices"][0]["amount"]
    if (cnt++ < 5) cls = "station-icon-cheap"
    else cls = "station-icon"
    var today = new Date().getDay();
    if (today == 0) today == 7;
    var open = st["openingHours"].sort((a, b) => a["order"] - b["order"]).map(function (day) {
      var begin = day["from"]
      var end = day["to"]
      var label = day["label"]
  
      var labelStr = label;
  
      if (begin == end) value = label + " geschlossen"
      else value = label + " " + begin + "-" + end
      if (day["order"] == today) value = "<b>" + value + "</b>"
      return value
    }).join("<br>")
  
    const loc = st["location"]
  
    var myIcon = L.divIcon({ html: price, className: cls });
    var marker = L.marker([loc["latitude"], loc["longitude"]], { icon: myIcon })
    marker.bindPopup("<h6>" + st["name"] + "</h6>" + loc["address"] + "<br>" + loc["city"] + "<br><br>" + open).openPopup();
    marker.addTo(mapGlobal);
    mapChildren.push(marker)
  }, this);
}

$(document).ready(function () {
  init();
});