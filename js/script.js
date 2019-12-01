var map = L.map('mapid').setView([60.59055, 15.61365,], 8);
L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibHVjaGtpaW4iLCJhIjoiY2p2aHcydDUzMDdrNDN5czFhN2xiY3h3cyJ9.8c9MPBQdQAXt28iPRwH9Zw', {
    maxZoom: 14,
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
        '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
        'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    id: 'mapbox.streets'
}).addTo(map);
L.control.scale().addTo(map);

function myForEachFeature(feature, layer) {
    if (feature.properties) {
        popmsg = "<h3><b>Store </b></h3>" + feature.properties.store + "<br><br>";
        popmsg += "<img id=websiteImg src=" + feature.properties.picURL + " width=100>";
        popmsg += "<h3><b>Address </b></h3>" + feature.properties.adress + "<br>";
        popmsg += "<h3><b>Opening hours </b></h3>" + feature.properties.openingHours + "<br>";
        popmsg += "<h3><b>Webpage </b></h3><a id=websiteLink target=_blank href=" + feature.properties.website + ">" + "Click here</a> <i class='fas fa-caret-square-right'></i><br>";
        layer.bindPopup(popmsg);
    }
};

function sideList(jData) {
    for (i = 0; jData.features.length; i++) {
        let currFeature = jData.features[i];
        let prop = currFeature.properties;
        let listings = document.getElementById('listings');
        let listing = listings.appendChild(document.createElement('div'));
        listing.className = 'item';
        listing.id = 'listing ' + i;
        let link = listing.appendChild(document.createElement('a'));
        link.href = '#';
        link.className = 'title';
        link.dataPosition = i;
        link.innerHTML = "<h3>" + prop.store + ", " + prop.adress + "</h3>";

        let info = listings.appendChild(document.createElement('div'));
        info.className = 'info';
        info.innerHTML = prop.openingHours;

        link.addEventListener("click", function () {
            let item = jData.features[this.dataPosition];
            swapElements(item);
        });
    }
}

function swapElements(item) {
    let temp = item.geometry.coordinates[0];
    item.geometry.coordinates[0] = item.geometry.coordinates[1];
    item.geometry.coordinates[1] = temp;
    highlightStore(item);
}

function highlightStore(clickedItem) {
    map.flyTo(clickedItem.geometry.coordinates, 13);
}

map.on("click", event => {
    let latlngObj = event.latlng;
    let lat = latlngObj.lat.toFixed(1);
    let lng = latlngObj.lng.toFixed(1);

    let url = "https://api.resrobot.se/v2/location.nearbystops?key=bc972fe4-be45-43ad-84dc-a52c31eee54e&originCoordLat=" + lat + "&originCoordLong=" + lng + "&format=json";
    let url1 = "https://api.openweathermap.org/data/2.5/weather?lat=" + lat + "&lon=" + lng + "&units=metric&appid=25f4530d6bd98eb444ce6b94f8db1ef8";

    $.when($.getJSON(url), $.getJSON(url1)).done(function (buss, weather) {
        let data = [buss, weather];
        createBusstops(latlngObj, data);
    });
});


function createBusstops(latlngObj, data) {
    let buss = data[0];
    let weather = data[1];
    $.each(buss[0].StopLocation, function (idx, element) {
        let marker = L.marker([element.lat, element.lon]).addTo(map);
        let popup = L.popup();
        popup.setLatLng(latlngObj);
        let tempMsg = "<img src='https://openweathermap.org/img/wn/" + weather[0].weather[0].icon + ".png' class='weather-icon-img'>" + "<h3 class='info-heading-h3'>Current weather" + "<br>" + "in " + weather[0].name + "</h3>";
        tempMsg += "<ul><li><b>Temp: </b>" + weather[0].main.temp + " &#8451</li>" + "<li><b>Condition: </b>" + weather[0].weather[0].description + "</li>" + "<li><b>Humidity: </b>" + weather[0].main.humidity + "%" + "</li>" + "<li><b>Wind: </b>" + weather[0].wind.speed + " m/s" + "</li>" + "</ul>";
        popup.setContent(tempMsg);
        popup.openOn(map);
        marker.on('click', function (e) {
            let url1 = "https://api.resrobot.se/v2/departureBoard?key=3a4b0582-ef3d-4adc-8e40-5167a782d122&id=";
            let departureTime = "";
            $.getJSON(url1 + element.id + "&maxJourneys=1&format=json", function (data) {
                $.each(data, function () {
                    busStopName = data.Departure[0].Stops.Stop[0].name;
                    departureDate = data.Departure[0].Stops.Stop[0].depDate;
                    departureTime = data.Departure[0].Stops.Stop[0].depTime;
                    let busMsg = "<img src='img/school-bus.png' class='school-bus-img'>" + "<h3 class='info-heading-h3'>Next bus</h3>";
                    busMsg += "<ul><li><b>From: </b>" + busStopName + "<li><b>Date: </b>" + departureDate + "</li>" + "</li>" + "<b><li>Departure time: </b>" + departureTime + "</li></ul>";
                    popup.setContent(busMsg);
                    popup.openOn(map);
                });
            });
        });
    });
}

let jsonfile = "json/icaStores.json";

let customIcon = L.icon({
    iconUrl: 'img/ica-marker-icon.png',
    iconSize: [40, 40]
});

$.getJSON(jsonfile, function (jsondata) {
    L.geoJSON(jsondata, {
        onEachFeature: myForEachFeature,
        pointToLayer: function (feature, latlng) {
            return L.marker(latlng, { icon: customIcon });
        }
    }).addTo(map);
    sideList(jsondata);
})
