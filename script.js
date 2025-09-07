function getWeather() {
  const city = document.getElementById("city").value.trim();
  const resultDiv = document.getElementById("weather-result");
  const animDiv = document.getElementById("weather-animation");
  const button = document.getElementById("get-weather-btn");

  // Clear previous results and show loading
  resultDiv.className = "loading";
  resultDiv.innerHTML = `<div class="loading-spinner"></div>Searching for weather data...`;
  animDiv.className = "";
  button.disabled = true;

  if (!city) {
    showError("Please enter a city name");
    return;
  }

  // Geocoding API call
  fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`)
    .then(res => res.json())
    .then(data => {
      if (!data.results || data.results.length === 0) {
        throw new Error("City not found. Please check the spelling and try again.");
      }

      const { latitude, longitude, name, country } = data.results[0];

      // Weather API call
      return fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`)
        .then(res => res.json())
        .then(weatherData => {
          const weather = weatherData.current_weather;
          const { temperature, windspeed, weathercode } = weather;
          const description = getWeatherDescription(weathercode);
          const emojiClass = getWeatherEmojiClass(weathercode);

          // Display weather information with enhanced styling
          resultDiv.className = "show";
          resultDiv.innerHTML = `
            <div class="weather-info">
              <div class="location-info">
                <div class="location-name">${name}, ${country}</div>
                <div style="color: var(--text-secondary); font-size: 0.9rem;">${description}</div>
              </div>
              <div class="weather-stats">
                <div class="weather-stat">
                  <span class="stat-icon">🌡️</span>
                  <div class="stat-value">${temperature}°C</div>
                  <div class="stat-label">Temperature</div>
                </div>
                <div class="weather-stat">
                  <span class="stat-icon">💨</span>
                  <div class="stat-value">${windspeed}</div>
                  <div class="stat-label">km/h</div>
                </div>
                <div class="weather-stat">
                  <span class="stat-icon">📍</span>
                  <div class="stat-value">${getWeatherCode(weathercode)}</div>
                  <div class="stat-label">Condition</div>
                </div>
              </div>
            </div>
          `;

          // Set weather animation
          animDiv.className = emojiClass;
          
          // Re-enable button
          button.disabled = false;
        });
    })
    .catch(error => {
      showError(error.message);
    });
}

function showError(message) {
  const resultDiv = document.getElementById("weather-result");
  const animDiv = document.getElementById("weather-animation");
  const button = document.getElementById("get-weather-btn");
  
  resultDiv.className = "show error";
  resultDiv.innerHTML = `⚠️ ${message}`;
  animDiv.className = "";
  button.disabled = false;
}

function getWeatherDescription(code) {
  const codes = {
    0: "Clear Sky",
    1: "Mainly Clear",
    2: "Partly Cloudy",
    3: "Overcast",
    45: "Foggy",
    48: "Depositing Rime Fog",
    51: "Light Drizzle",
    53: "Moderate Drizzle",
    55: "Dense Drizzle",
    61: "Slight Rain",
    63: "Moderate Rain",
    65: "Heavy Rain",
    71: "Slight Snow Fall",
    73: "Moderate Snow Fall",
    75: "Heavy Snow Fall",
    80: "Slight Rain Showers",
    81: "Moderate Rain Showers",
    82: "Violent Rain Showers",
    95: "Thunderstorm",
    96: "Thunderstorm with Slight Hail",
    99: "Thunderstorm with Heavy Hail",
  };
  return codes[code] || "Unknown Weather";
}

function getWeatherCode(code) {
  const codes = {
    0: "Clear", 1: "Clear", 2: "Cloudy", 3: "Overcast",
    45: "Foggy", 48: "Foggy", 51: "Drizzle", 53: "Drizzle", 55: "Drizzle",
    61: "Light Rain", 63: "Rain", 65: "Heavy Rain",
    71: "Light Snow", 73: "Snow", 75: "Heavy Snow",
    80: "Showers", 81: "Showers", 82: "Heavy Showers",
    95: "Thunder", 96: "Hail", 99: "Heavy Hail"
  };
  return codes[code] || "Unknown";
}

function getWeatherEmojiClass(code) {
  if ([0, 1].includes(code)) return "sunny";
  if ([2, 3].includes(code)) return "cloudy";
  if ([45, 48].includes(code)) return "foggy";
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return "rainy";
  if ([71, 73, 75].includes(code)) return "snowy";
  if ([95, 96, 99].includes(code)) return "thunder";
  return "windy";
}

// Allow Enter key to trigger weather search
document.getElementById('city').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        getWeather();
    }
});

// Focus input on page load
window.addEventListener('load', function() {
    document.getElementById('city').focus();
});