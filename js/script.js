//skapar upp en ny map med hjälp av L.map som hämtas från Leaflet biblioteket
//Sätter vyn med koordinater för longitud och latitud
var map = L.map('mapid').setView([60.59055, 15.61365,], 8);
//Lägger på ett tileLayer (dvs, kartlager)
L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibHVjaGtpaW4iLCJhIjoiY2p2aHcydDUzMDdrNDN5czFhN2xiY3h3cyJ9.8c9MPBQdQAXt28iPRwH9Zw', {
    maxZoom: 14,
    //Ger cred till api som vi har använts oss utav 
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
        '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
        'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    id: 'mapbox.streets'
}).addTo(map);
L.control.scale().addTo(map);

//Foreach som loopar genom alla features i JSON-filen för att komma åt samtliga properties 
function myForEachFeature(feature, layer) {
    if (feature.properties) {
        popmsg = "<h3><b>Store </b></h3>" + feature.properties.store + "<br><br>";
        popmsg += "<img id=websiteImg src=" + feature.properties.picURL + " width=100>";
        popmsg += "<h3><b>Address </b></h3>" + feature.properties.adress + "<br>";
        popmsg += "<h3><b>Opening hours </b></h3>" + feature.properties.openingHours + "<br>";
        popmsg += "<h3><b>Webpage </b></h3><a id=websiteLink target=_blank href=" + feature.properties.website + ">" + "Click here</a> <i class='fas fa-caret-square-right'></i><br>";
        //binder upp i ett Popup-fönster
        layer.bindPopup(popmsg);
    }
};

//funktion som skapar listan för alla våra våra butiker. Presenteras via en lista I HTML-dokumentet
function sideList(jData) {
    //for-loop. Loopar för varje varv i loopen som skapar divar och appendar butikerna
    for (i = 0; jData.features.length; i++) {
        let currFeature = jData.features[i];
        let prop = currFeature.properties;
        //hämtar listingselemenet via getElementById('listings') 
        let listings = document.getElementById('listings');
        //Appendar nytt div-element 
        let listing = listings.appendChild(document.createElement('div'));
        listing.className = 'item';
        listing.id = 'listing ' + i;

        //titel på butiken samt adress som en link i listan
        let link = listing.appendChild(document.createElement('a'));
        link.href = '#';
        link.className = 'title';
        link.dataPosition = i;
        link.innerHTML = "<h3>" + prop.store + ", " + prop.adress + "</h3>";

        //övrig info angående butikerna 
        let info = listings.appendChild(document.createElement('div'));
        info.className = 'info';
        info.innerHTML = prop.openingHours;

        //event som skickar överensstämmande butiksdata via onclick till funktionen swap element
        link.addEventListener("click", function () {
            let item = jData.features[this.dataPosition];
            swapElements(item);
        });
    }
}

//i GEOJSON är longitud före latitud, så vi byter positioner med varandra för att få flyTo att funka 
function swapElements(item) {
    let temp = item.geometry.coordinates[0];
    item.geometry.coordinates[0] = item.geometry.coordinates[1];
    item.geometry.coordinates[1] = temp;
    console.log(item.geometry.coordinates);
    //Efter position byte skickar vi vidare datat till en annan funktion 
    highlightStore(item);
}

//centrerar kartan till den klickade butikens position 
function highlightStore(clickedItem) {
    //Zoomar in till nivå 14 för den klickade butikens position via map.flyTo
    map.flyTo(clickedItem.geometry.coordinates, 13);
}

//onclick som hämtar data från två externa leverantörer baserat på koordinater
map.on("click", event => {
    let latlngObj = event.latlng;
    let lat = latlngObj.lat.toFixed(1);
    let lng = latlngObj.lng.toFixed(1);
    console.log(latlngObj);

    let url = "https://api.resrobot.se/v2/location.nearbystops?key=bc972fe4-be45-43ad-84dc-a52c31eee54e&originCoordLat=" + lat + "&originCoordLong=" + lng + "&format=json";
    let url1 = "http://api.openweathermap.org/data/2.5/weather?lat=" + lat + "&lon=" + lng + "&units=metric&appid=25f4530d6bd98eb444ce6b94f8db1ef8";

    //$.when hämtar data från två urls samtidigt
    $.when($.getJSON(url), $.getJSON(url1)).done(function (buss, weather) {
        let data = [buss, weather];
        console.log(buss[0].StopLocation);
        console.log(weather);
        //skickar sedan detta till en annan funktion
        createBusstops(latlngObj, data);
    });
    // $.getJSON(url1, function(data){
    //     createWeatherPopUp(latlngObj,data);
    // })

});


//Funktion för att skapa upp närliggande busshållplatser i förhållande till vald marker (affär) för busshållplatsinfo
function createBusstops(latlngObj, data) {
    let buss = data[0];
    let weather = data[1];
    //loopar genom varje busshållsplats och skapar markers och popups för de, samt för vädret 
    $.each(buss[0].StopLocation, function (idx, element) {
        let marker = L.marker([element.lat, element.lon]).addTo(map);
        let popup = L.popup();
        popup.setLatLng(latlngObj);
        //skapar upp väder-Popup:et
        let tempMsg = "<img src='http://openweathermap.org/img/w/" + weather[0].weather[0].icon + ".png' class='weather-icon-img'><br>";
        tempMsg += "In <b>" + weather[0].name + "</b></br>";
        tempMsg += " it's <b>" + weather[0].weather[0].description + "</b><br>";
        tempMsg += " and the temp is <b>" + weather[0].main.temp + " &#8451";
        //Sätter content
        popup.setContent(tempMsg);
        popup.openOn(map);
        //Ett click event som hämtar anländningstiden gällande för busshållplats 
        marker.on('click', function (e) {
            let deptTime = "";
            //Hämtar busstider för för busshållsplats via ID
            $.getJSON("https://api.resrobot.se/v2/departureBoard?key=0b245f24-07d3-464e-9838-9e1b9fd5530a&id=" + element.id + "&maxJourneys=1&format=json", function (data) {
                //loopar genom datat baserat på ID som vi hämtar när vi klickar på en buss-marker och lägger det i en popup
                $.each(data, function (idx, item) {
                    console.log(data);
                    deptTime = data.Departure[0].Stops.Stop[0].depTime;
                    busstopName = data.Departure[0].Stops.Stop[0].name;
                    console.log(data.Departure[0].name);
                    console.log(item);
                    let busMsg = "<img src='img/school-bus.png' class='school-bus-img'>" + "<h4>Next bus</h4>";
                    busMsg += "<p>" + busstopName + "<br>" + "departs at: " + deptTime + "</p>";
                    popup.setContent(busMsg);
                    popup.openOn(map);
                });
            });
        });
    });
}

//hämtar JSON-fil för ICA-affärerna
let jsonfile = "json/icaStores.json";

//Skapar upp en egenvald ikon för affärerna
let customIcon = L.icon({
    iconUrl: 'img/ica-marker-icon.png',
    iconSize: [40, 40]
});

//hämtar jsondata och skickar de till andra funktioner, samt stylar butikmarkers 
$.getJSON(jsonfile, function (jsondata) {
    L.geoJSON(jsondata, {
        onEachFeature: myForEachFeature,
        pointToLayer: function (feature, latlng) {
            return L.marker(latlng, { icon: customIcon });
        }
    }).addTo(map);
    sideList(jsondata);
})