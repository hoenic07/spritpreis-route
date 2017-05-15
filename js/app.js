mapGlobal = null;
mapChildren = []
function init() {
  initMap();
  showMap(false);
  $("#search").click(search)
  $("#new-search").click(newSearch)

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
  var onlyOpen = "checked";
  if ($('#onlyopen').is(":checked")) {
    onlyOpen = ""
  }

  showMap(true);
  mapGlobal.invalidateSize();
  getDirections(origin, destination).then(function (pts) {

    if (pts == null) {
      newSearch();
      alert("Keine Route gefunden!");
      return [];
    }

    var polyline = L.polyline(pts, { color: 'red' }).addTo(mapGlobal);
    mapChildren.push(polyline)
    mapGlobal.fitBounds(polyline.getBounds());

    var searchPts = []
    searchPts.push(pts[0])

    var curDist = 0
    for (var i = 0; i < pts.length - 1; i++) {
      curDist += haversineDistance(pts[i], pts[i + 1], false)
      if (curDist > 25) {
        curDist = 0
        searchPts.push(pts[i])
      }
    }

    bbs = searchPts.map(function (pt) {
      var cc = L.circle(pt, { radius: 15000 })
      var bb = cc.addTo(mapGlobal).getBounds();
      mapChildren.push(cc)
      cc.remove();
      return bb;
    })

    return getSpritpreisForRoute(bbs, type, onlyOpen);
  }).then(function (stations) {
    var cnt = 0;
    stations.forEach(function (st) {
      var price = st["spritPrice"][0]["amount"]
      if (cnt++ < 5) cls = "station-icon-cheap"
      else cls = "station-icon"
      var today = new Date().getDay();
      if (today == 0) today == 7;
      var open = st["openingHours"].sort((a, b) => a["day"]["order"] - b["day"]["order"]).map(function (day) {
        var begin = day["beginn"]
        var end = day["end"]
        var label = day["day"]["dayLabel"]

        var labelStr = label;

        if (begin == end) value = label + " geschlossen"
        else value = label + " " + begin + "-" + end
        if (day["day"]["order"] == today) value = "<b>" + value + "</b>"
        return value
      }).join("<br>")

      var myIcon = L.divIcon({ html: price, className: cls });
      var marker = L.marker([st["latitude"], st["longitude"]], { icon: myIcon })
      marker.bindPopup("<h6>" + st["gasStationName"] + "</h6>" + st["address"] + "<br>" + st["city"] + "<br><br>" + open).openPopup();
      marker.addTo(mapGlobal);
      mapChildren.push(marker)
    }, this);
  });
}

function newSearch() {
  showMap(false);
  mapChildren.forEach(c => c.remove())
  mapChildren = []
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

$(document).ready(function () {
  init();
});