const userTab = document.querySelector("[data-userWeather]");
const searchTab = document.querySelector("[data-searchWeather]");
const userContainer = document.querySelector(".weather-container");

const grantAccessContainer = document.querySelector(".grant-location-container");
const searchForm = document.querySelector("[data-searchForm]");
const loadingScreen = document.querySelector(".loading-container");
const userInfoContainer = document.querySelector(".user-info-container");
const grantAccessBtn = document.querySelector("[data-grantAccess]");
const searchInput = document.querySelector("[data-searchInput]");

// ... (keep all your existing variable declarations)

async function fetchUserWeatherInfo(coordinates) {
    const {lat, lon} = coordinates;
    grantAccessContainer.classList.remove("active");
    loadingScreen.classList.add("active");

    try {
        // First get location name from coordinates
        const locationResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/reverse?latitude=${lat}&longitude=${lon}`);
        const locationData = await locationResponse.json();
        
        if (!locationData.results || locationData.results.length === 0) {
            throw new Error("Location not found");
        }
        
        const cityName = locationData.results[0].name;
        const countryCode = locationData.results[0].country_code;

        // Then get weather data
        const weatherResponse = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,relativehumidity_2m,windspeed_10m,cloudcover`
        );
        const weatherData = await weatherResponse.json();

        loadingScreen.classList.remove("active");
        userInfoContainer.classList.add("active");
        
        renderWeatherInfo(weatherData, cityName, countryCode);
    } catch(err) {
        loadingScreen.classList.remove("active");
        console.error("Error in fetchUserWeatherInfo:", err);
        
        // Show error to user
        grantAccessContainer.classList.add("active");
        grantAccessContainer.innerHTML = `
            <img src="./images/location.png" alt="location icon" width="80" height="80" loading="lazy">
            <p>Failed to get weather data</p>
            <p>${err.message || "Please try again"}</p>
            <button class="btn" data-grantAccess>Try Again</button>
        `;
        
        // Re-add event listener to the new button
        document.querySelector("[data-grantAccess]").addEventListener("click", getLocation);
    }
}

function getLocation() {
    if (navigator.geolocation) {
        // Show loading state while waiting for permission
        grantAccessContainer.innerHTML = `
            <img src="./images/loading.gif" alt="loading" width="80" height="80">
            <p>Requesting location access...</p>
        `;
        
        navigator.geolocation.getCurrentPosition(
            showPosition,
            handleLocationError,
            { timeout: 10000 } // 10 second timeout
        );
    } else {
        grantAccessContainer.innerHTML = `
            <img src="./images/location.png" alt="location icon" width="80" height="80" loading="lazy">
            <p>Geolocation not supported</p>
            <p>Your browser doesn't support location access</p>
        `;
    }
}

function showPosition(position) {
    const userCoordinates = {
        lat: position.coords.latitude,
        lon: position.coords.longitude,
    };
    sessionStorage.setItem("user-coordinates", JSON.stringify(userCoordinates));
    fetchUserWeatherInfo(userCoordinates);
}

function handleLocationError(error) {
    console.error("Geolocation error:", error);
    let errorMessage = "Error getting location";
    
    switch(error.code) {
        case error.PERMISSION_DENIED:
            errorMessage = "Location access was denied. Please allow access to use this feature.";
            break;
        case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable.";
            break;
        case error.TIMEOUT:
            errorMessage = "The request to get location timed out.";
            break;
        case error.UNKNOWN_ERROR:
            errorMessage = "An unknown error occurred.";
            break;
    }
    
    grantAccessContainer.innerHTML = `
        <img src="./images/location.png" alt="location icon" width="80" height="80" loading="lazy">
        <p>${errorMessage}</p>
        <button class="btn" data-grantAccess>Try Again</button>
    `;
    document.querySelector("[data-grantAccess]").addEventListener("click", getLocation);
}
let currentTab = userTab;
currentTab.classList.add("current-tab");
getfromSessionStorage();

function switchTab(clickedTab) {
    if(clickedTab != currentTab) {
        currentTab.classList.remove("current-tab");
        currentTab = clickedTab;
        currentTab.classList.add("current-tab");
        
        if(!searchForm.classList.contains("active")) {
            userInfoContainer.classList.remove("active");
            grantAccessContainer.classList.remove("active");
            searchForm.classList.add("active");
        } else {
            searchForm.classList.remove("active");
            userInfoContainer.classList.remove("active");
            getfromSessionStorage();
        }
    }
}

function getfromSessionStorage() {
    const localCoordinates = sessionStorage.getItem("user-coordinates");
    if(!localCoordinates) {
        grantAccessContainer.classList.add("active");
    } else {
        const coordinates = JSON.parse(localCoordinates);
        fetchUserWeatherInfo(coordinates);
    }
}

async function fetchCoordinates(city) {
    try {
        const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1`);
        const data = await response.json();
        if(!data.results || data.results.length === 0) {
            throw new Error("City not found");
        }
        return {
            lat: data.results[0].latitude,
            lon: data.results[0].longitude,
            name: data.results[0].name,
            country: data.results[0].country_code
        };
    } catch(err) {
        console.error("Error fetching coordinates:", err);
        throw err;
    }
}

async function fetchWeatherData(lat, lon) {
    try {
        const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,relativehumidity_2m,windspeed_10m,cloudcover`
        );
        return await response.json();
    } catch(err) {
        console.error("Error fetching weather data:", err);
        throw err;
    }
}

async function fetchUserWeatherInfo(coordinates) {
    const {lat, lon} = coordinates;
    grantAccessContainer.classList.remove("active");
    loadingScreen.classList.add("active");

    try {
        const weatherData = await fetchWeatherData(lat, lon);
        loadingScreen.classList.remove("active");
        userInfoContainer.classList.add("active");
        
        // For user's weather, we'll use the location from coordinates
        const locationResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/reverse?latitude=${lat}&longitude=${lon}`);
        const locationData = await locationResponse.json();
        
        const cityName = locationData.results?.[0]?.name || "Your Location";
        const countryCode = locationData.results?.[0]?.country_code || "";
        
        renderWeatherInfo(weatherData, cityName, countryCode);
    } catch(err) {
        loadingScreen.classList.remove("active");
        console.log("Error fetching user weather info", err);
        alert("Could not fetch weather data. Please try again.");
    }
}

function renderWeatherInfo(weatherData, cityName, countryCode) {
    const cityNameElement = document.querySelector("[data-cityName]");
    const countryIcon = document.querySelector("[data-countryIcon]");
    const weatherDesc = document.querySelector("[data-weatherDesc]");
    const temp = document.querySelector("[data-temp]");
    const windspeed = document.querySelector("[data-windSpeed]");
    const humidity = document.querySelector("[data-humidity]");
    const cloudiness = document.querySelector("[data-Clouds]");

    // Open-Meteo doesn't provide weather descriptions like OpenWeatherMap
    // So we'll create simple descriptions based on weather code
    const weatherCode = weatherData.current_weather.weathercode;
    const weatherDescriptions = {
        0: "Clear sky",
        1: "Mainly clear",
        2: "Partly cloudy",
        3: "Overcast",
        45: "Fog",
        48: "Depositing rime fog",
        51: "Light drizzle",
        53: "Moderate drizzle",
        55: "Dense drizzle",
        56: "Light freezing drizzle",
        57: "Dense freezing drizzle",
        61: "Slight rain",
        63: "Moderate rain",
        65: "Heavy rain",
        66: "Light freezing rain",
        67: "Heavy freezing rain",
        71: "Slight snow fall",
        73: "Moderate snow fall",
        75: "Heavy snow fall",
        77: "Snow grains",
        80: "Slight rain showers",
        81: "Moderate rain showers",
        82: "Violent rain showers",
        85: "Slight snow showers",
        86: "Heavy snow showers",
        95: "Thunderstorm",
        96: "Thunderstorm with slight hail",
        99: "Thunderstorm with heavy hail"
    };

    cityNameElement.innerText = cityName;
    countryIcon.src = `https://flagcdn.com/144x108/${countryCode.toLowerCase()}.png`;
    weatherDesc.innerText = weatherDescriptions[weatherCode] || "Weather data available";
    temp.innerText = `${weatherData.current_weather.temperature} °C`;
    windspeed.innerText = `${weatherData.current_weather.windspeed} km/h`;
    
    // Get humidity from hourly data (current hour)
    const now = new Date();
    const currentHour = now.getHours();
    humidity.innerText = `${weatherData.hourly.relativehumidity_2m[currentHour]}%`;
    
    // Get cloudiness from hourly data
    cloudiness.innerText = `${weatherData.hourly.cloudcover[currentHour]}%`;
}

function getLocation() {
    if(navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition);
    } else {
        alert("Geolocation is not supported by this browser.");
    }
}

function showPosition(position) {
    const userCoordinates = {
        lat: position.coords.latitude,
        lon: position.coords.longitude,
    };
    sessionStorage.setItem("user-coordinates", JSON.stringify(userCoordinates));
    fetchUserWeatherInfo(userCoordinates);
}

// Event listeners
grantAccessBtn.addEventListener("click", getLocation);

searchForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    let cityName = searchInput.value.trim();
    if(cityName === "") return;

    loadingScreen.classList.add("active");
    userInfoContainer.classList.remove("active");
    grantAccessContainer.classList.remove("active");

    try {
        // First get coordinates for the city
        const {lat, lon, name, country} = await fetchCoordinates(cityName);
        
        // Then get weather data
        const weatherData = await fetchWeatherData(lat, lon);
        
        loadingScreen.classList.remove("active");
        userInfoContainer.classList.add("active");
        renderWeatherInfo(weatherData, name, country);
    } catch(err) {
        loadingScreen.classList.remove("active");
        alert("City not found or API error. Please try another city.");
    }
});

userTab.addEventListener("click", () => {
    switchTab(userTab);
});

searchTab.addEventListener("click", () => {
    switchTab(searchTab);
});