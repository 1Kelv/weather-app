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

          // Set weather animation in card
          animDiv.className = emojiClass;
          
          // Update ambient weather animations
          updateAmbientWeather(emojiClass);
          
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
  if ([2].includes(code)) return "cloudy";
  if ([3].includes(code)) return "overcast";
  if ([45, 48].includes(code)) return "foggy";
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return "rainy";
  if ([71, 73, 75].includes(code)) return "snowy";
  if ([95, 96, 99].includes(code)) return "thunder";
  return "windy";
}

function updateAmbientWeather(weatherClass) {
  const ambient = document.getElementById('ambient-container');
  
  if (!ambient) {
    console.error('Ambient container not found');
    return;
  }
  
  const clouds = ambient.querySelectorAll('.ambient-cloud');
  const rainDrops = ambient.querySelectorAll('.rain-drop');
  const snowflakes = ambient.querySelectorAll('.snowflake');
  const stars = ambient.querySelectorAll('.star');
  const lightning = ambient.querySelector('.lightning');
  const sunRays = ambient.querySelectorAll('.sun-ray');
  const sunGlow = ambient.querySelector('.sun-glow');
  const fogLayers = ambient.querySelectorAll('.fog-layer');
  
  console.log('Weather class:', weatherClass);
  
  // Hide all by default
  clouds.forEach(cloud => {
    cloud.style.display = 'none';
    cloud.style.opacity = '0';
  });
  rainDrops.forEach(drop => drop.style.display = 'none');
  snowflakes.forEach(flake => flake.style.display = 'none');
  stars.forEach(star => star.style.display = 'none');
  if (lightning) lightning.style.display = 'none';
  sunRays.forEach(ray => ray.style.display = 'none');
  if (sunGlow) sunGlow.style.display = 'none';
  fogLayers.forEach(fog => {
    fog.style.display = 'none';
    fog.style.opacity = '0';
  });
  
  // Show relevant animations based on weather
  switch(weatherClass) {
    case 'sunny':
      console.log('☀️ Showing sunny weather effects');
      sunRays.forEach(ray => ray.style.display = 'block');
      if (sunGlow) sunGlow.style.display = 'block';
      stars.forEach(star => star.style.display = 'block');
      break;
      
    case 'rainy':
      console.log('🌧️ Showing rainy weather effects');
      rainDrops.forEach(drop => drop.style.display = 'block');
      clouds.forEach(cloud => {
        cloud.style.display = 'block';
        cloud.style.opacity = '0.2';
      });
      break;
      
    case 'snowy':
      console.log('❄️ Showing snowy weather effects');
      snowflakes.forEach(flake => flake.style.display = 'block');
      clouds.forEach(cloud => {
        cloud.style.display = 'block';
        cloud.style.opacity = '0.15';
      });
      break;
      
    case 'thunder':
      console.log('⛈️ Showing thunderstorm effects');
      rainDrops.forEach(drop => drop.style.display = 'block');
      if (lightning) lightning.style.display = 'block';
      clouds.forEach(cloud => {
        cloud.style.display = 'block';
        cloud.style.opacity = '0.25';
      });
      break;
      
    case 'cloudy':
      console.log('☁️ Showing cloudy weather effects');
      clouds.forEach(cloud => {
        cloud.style.display = 'block';
        cloud.style.opacity = '0.2';
      });
      break;
      
    case 'overcast':
      console.log('☁️ Showing overcast weather effects');
      clouds.forEach(cloud => {
        cloud.style.display = 'block';
        cloud.style.opacity = '0.3';
      });
      break;
      
    case 'foggy':
      console.log('🌫️ Showing foggy weather effects');
      fogLayers.forEach(fog => {
        fog.style.display = 'block';
        fog.style.opacity = '1';
      });
      clouds.forEach(cloud => {
        cloud.style.display = 'block';
        cloud.style.opacity = '0.1';
      });
      break;
      
    case 'windy':
      console.log('💨 Showing windy weather effects');
      clouds.forEach(cloud => {
        cloud.style.display = 'block';
        cloud.style.opacity = '0.18';
        // Speed up cloud animation for windy effect
        cloud.style.animationDuration = '25s';
      });
      break;
      
    default:
      console.log('🌤️ Showing default weather effects');
      clouds.forEach(cloud => {
        cloud.style.display = 'block';
        cloud.style.opacity = '0.15';
      });
  }
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