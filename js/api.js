function getDirections(origin, destination) {
  return new Promise(function (resolve, reject){
    var directionsService = new google.maps.DirectionsService;
    directionsService.route({
      origin: origin,
      destination: destination,
      travelMode: 'DRIVING'
    }, function (response, status) {
      if (response["routes"].length == 0) return null;

      var overview_polyline = response["routes"][0]["overview_polyline"]
      var decodedPath = google.maps.geometry.encoding.decodePath(overview_polyline).map(function (pt) {
        return [pt.lat(), pt.lng()]
      })
      resolve(decodedPath);
    });
  });
}

function getSpritpreis(bbs, type, onlyOpen) {
  var strJson = JSON.stringify([onlyOpen, type, bbs._southWest.lng, bbs._southWest.lat, bbs._northEast.lng, bbs._northEast.lat])
  var str = encodeURIComponent(strJson)
  var myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/x-www-form-urlencoded");
  return fetch("https://cors-anywhere.herokuapp.com/http://www.spritpreisrechner.at/ts/GasStationServlet",
    {
      method: "POST",
      body: "data=" + str,
      headers: myHeaders
    })
    .then(function (res) { return res.json(); })
}

function getSpritpreisForRoute(pts, type, onlyOpen) {
  var stations = []
  var cnt = 0
  return new Promise(function (resolve, reject) {
    pts.forEach(function (pt) {
      getSpritpreis(pt, type, onlyOpen).then(function (p) {
        cnt++;
        stations = stations.concat(p)
        if (cnt == pts.length) {
          resolve(distinctStations(stations));
        }
      })
    })
  });
}

function distinctStations(stations) {
  var filtered = [];
  stations.forEach(function (val) {
    var keep = !filtered.some(el => el["city"] + el["address"] == val["city"] + val["address"]);
    if (keep) keep = val["spritPrice"][0]["amount"] != ""
    if (keep) filtered.push(val)
  });
  return filtered.sort(comparePrice);
}

function comparePrice(a, b) {
  var aP = parseFloat(a["spritPrice"][0]["amount"])
  var bP = parseFloat(b["spritPrice"][0]["amount"])
  return aP - bP
}