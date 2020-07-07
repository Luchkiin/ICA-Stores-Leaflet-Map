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
        popmsg = "<div class='store-image-container'><img id=websiteImg class=store-image src=" + feature.properties.picURL + " width=100><span>" + feature.properties.store + "</span></div>";
        popmsg += "<div class='store-info-wrapper'><div class='store-heading-container'><h3>Store</h3><span>" + feature.properties.store + "</span></div>";
        popmsg += "<div class='store-heading-container'><h3>Address</h3><span>" + feature.properties.adress + "</span></div>";
        popmsg += "<div class='store-heading-container'><h3>Hours</h3><span>" + feature.properties.openingHours + "</span></div>";
        popmsg += "<div class='store-heading-container'><h3>Webpage</h3><a id=websiteLink class=store-website-link target=_blank href=" + feature.properties.website + ">" + "Click here</a><i class='fas fa-caret-square-right'></i></div></div>";
        layer.bindPopup(popmsg);
    }
};

function sideList(jData) {

    for (i = 0; jData.features.length; i++) {
        let currFeature = jData.features[i];
        let prop = currFeature.properties;
        let listings = document.getElementById('sidebar');
        let listing = listings.appendChild(document.createElement('div'));
        listing.className = 'sidebar-accordion ' + i;
        listing.id = 'sidebar-accordion ' + i;

        let linkSideBarTitle = listing.appendChild(document.createElement('a'));
        linkSideBarTitle.href = '#';
        linkSideBarTitle.className = 'sidebar-title ' + i;
        linkSideBarTitle.dataPosition = i;
        linkSideBarTitle.innerHTML = "<h3>" + prop.store + "</h3>";

        let linkAccordion = listing.appendChild(document.createElement('a'));
        linkAccordion.href = '#';
        linkAccordion.className = 'accordion-icon ' + i;
        linkAccordion.dataPosition = i;

        let info = listing.appendChild(document.createElement('div'));
        info.className = 'accordion-info';
        info.innerHTML = "<div class='accordion-info-container'><div><h4>Hours</h4><span>" + prop.openingHours + "</span></div><div><h4>Address</h4><span>" + prop.adress + "</span></div></div>";

        let items = document.querySelectorAll(".sidebar-accordion .accordion-icon");
        items.forEach((item) => item.addEventListener('click', toggleAccordion));

        linkSideBarTitle.addEventListener("click", function () {
            let item = jData.features[this.dataPosition];
            swapElements(item);
        });
    }
}

function toggleAccordion() {
    this.classList.toggle('active');
    this.nextElementSibling.classList.toggle('active');
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
        let marker = L.marker([element.lat, element.lon], { icon: customBusIcon }).addTo(map);
        let popup = L.popup();
        popup.setLatLng(latlngObj);
        let tempMsg = "<div class='weather-image-container'><img src='https://openweathermap.org/img/wn/" + weather[0].weather[0].icon + ".png' class='weather-icon-img'><h3 class='info-heading-h3'>" + weather[0].name + "</h3></div>";
        tempMsg += "<div class='weather-info-wrapper'><div class='weather-heading-container'><h3>Temperature</h3><span>" + weather[0].main.temp.toFixed(1) + " &#8451;</span></div><div class='weather-heading-container'><h3>Condition</h3><span class='capitalize'>" + weather[0].weather[0].description + "</span></div><div class='weather-heading-container'><h3>Humidity</h3><span>" + weather[0].main.humidity + " %</span></div><div class='weather-heading-container'><h3>Wind</h3><span>" + weather[0].wind.speed + " m/s</span></div></div>";
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
                    let busMsg = "<div class='bus-image-container'><img src='img/bus-icon-big.png' class='bus-img'><h3 class='info-heading-h3'>Next bus</h3></div>";
                    busMsg += "<div class='bus-info-wrapper'><div class='bus-heading-container'><h3>From</h3><span>" + busStopName + "</span></div><div class='bus-heading-container'><h3>Date</h3><span>" + departureDate + "</span></div><div class='bus-heading-container'><h3>Departure time</h3><span>" + departureTime + "</span></div></div>";
                    popup.setContent(busMsg);
                    popup.openOn(map);
                });
            });
        });
    });
}

var jsonFile = "json/icaStores.json";

//Custom Marker Icons
var customStoreIcon = L.icon({
    iconUrl: 'img/ica-marker-icon.png',
    iconSize: [40],
    popupAnchor:  [0, 15]
});

var customBusIcon = L.icon({
    iconUrl: 'img/bus-marker-icon.png',
    iconSize: [28]
});

$.getJSON(jsonFile, function (jsonData) {
    L.geoJSON(jsonData, {
        onEachFeature: myForEachFeature,
        pointToLayer: function (feature, latlng) {
            return L.marker(latlng, { icon: customStoreIcon }, {icon: customBusIcon});
        }
    }).addTo(map);
    sideList(jsonData);
})


/*HAMBURGER MENU*/
const navSlide = () => {
    const burgerMenu = document.querySelector('.burger-menu');
    const nav = document.querySelector('.nav-links');
    const navLinks = document.querySelectorAll('.nav-links li');

    burgerMenu.addEventListener('click', () => {
        //Toggle Nav
        nav.classList.toggle('nav-active');

        //Animate links
        navLinks.forEach((link, index) => {
            if (link.style.animation) {
                link.style.animation = ''
            } else {
                link.style.animation = `navLinkFade 0.5s ease forwards ${index / 7 + .8}s`;
            }
        });
        //Burger Animation
        burgerMenu.classList.toggle('toggle');
    });
}

navSlide();

