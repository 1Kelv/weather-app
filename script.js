// Global state
let currentWeatherData = null;
let currentUnit = 'celsius';

// Unit conversion functions
function convertTemp(temp, toUnit) {
    if (toUnit === 'fahrenheit') return Math.round((temp * 9/5) + 32);
    return Math.round(temp);
}

function convertWind(speed, toUnit) {
    // API returns wind speed in km/h
    if (toUnit === 'fahrenheit') return (speed * 0.621371).toFixed(1); // km/h to mph
    return speed.toFixed(1); // already in km/h
}

function getUnitLabel(type) {
    if (type === 'temperature') return currentUnit === 'fahrenheit' ? '°F' : '°C';
    if (type === 'speed') return currentUnit === 'fahrenheit' ? 'mph' : 'km/h';
}

// Main weather fetch function
function getWeather() {
    const city = document.getElementById('city').value.trim();
    const resultDiv = document.getElementById('weather-result');
    const animDiv = document.getElementById('weather-animation');
    const button = document.getElementById('get-weather-btn');

    resultDiv.className = 'loading';
    resultDiv.innerHTML = '<div class="loading-spinner"></div>Searching for weather data...';
    animDiv.className = '';
    button.disabled = true;

    if (!city) {
        showError('Please enter a city name');
        button.disabled = false;
        return;
    }

    // Step 1: Get city coordinates
    fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`)
        .then(response => response.json())
        .then(geoData => {
            console.log('Geocoding response:', geoData);
            
            if (!geoData.results || geoData.results.length === 0) {
                throw new Error('City "' + city + '" not found. Try another spelling or a major city.');
            }

            const locationData = geoData.results[0];
            const { latitude, longitude, name, country } = locationData;

            // Step 2: Get weather data
            const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&hourly=temperature_2m,apparent_temperature,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min&temperature_unit=celsius&wind_speed_unit=kmh&timezone=auto`;
            
            return fetch(weatherUrl).then(response => response.json()).then(weatherData => {
                console.log('Weather API response:', weatherData);
                return { weatherData, name, country };
            });
        })
        .then(({ weatherData, name, country }) => {
            console.log('Processing weather data...');
            
            // Store data globally
            currentWeatherData = {
                location: { name, country },
                weatherData: weatherData
            };

            // Display all forecasts
            displayCurrentWeather(weatherData, name, country);
            displayHourlyForecast(weatherData);
            displayDailyForecast(weatherData);
            
            button.disabled = false;
        })
        .catch(error => {
            console.error('Full error:', error);
            showError(error.message);
            button.disabled = false;
        });
}

// Display current weather
function displayCurrentWeather(weatherData, name, country) {
    const resultDiv = document.getElementById('weather-result');
    const animDiv = document.getElementById('weather-animation');

    console.log('displayCurrentWeather called with:', { weatherData, name, country });

    // Check if current exists
    if (!weatherData.current) {
        console.error('No current weather data:', weatherData);
        showError('Unable to get current weather data.');
        return;
    }

    const current = weatherData.current;
    
    // Get values with console logging
    console.log('Current object:', current);
    
    const temperature = current.temperature_2m;
    const apparent_temperature = current.apparent_temperature;
    const weather_code = current.weather_code;
    const wind_speed_10m = current.wind_speed_10m;

    console.log('Extracted values:', { temperature, apparent_temperature, weather_code, wind_speed_10m });

    // If any critical value is missing, show error
    if (temperature === null || temperature === undefined) {
        showError('Temperature data is missing from API response.');
        return;
    }

    const tempDisplay = convertTemp(temperature, currentUnit);
    const feelsLike = convertTemp(apparent_temperature, currentUnit);
    const windSpeed = convertWind(wind_speed_10m, currentUnit);

    const description = getWeatherDescription(weather_code);
    const emojiClass = getWeatherEmojiClass(weather_code);
    const shortCode = getWeatherCode(weather_code);

    resultDiv.className = 'show';
    resultDiv.innerHTML = `
        <div class="weather-info">
            <div class="location-info">
                <div class="location-name">${name}, ${country}</div>
                <div class="location-condition">${description}</div>
            </div>
            <div class="weather-stats">
                <div class="weather-stat">
                    <span class="stat-icon">🌡️</span>
                    <div class="stat-value">${tempDisplay}${getUnitLabel('temperature')}</div>
                    <div class="stat-label">Temperature</div>
                </div>
                <div class="weather-stat">
                    <span class="stat-icon">🤔</span>
                    <div class="stat-value">${feelsLike}${getUnitLabel('temperature')}</div>
                    <div class="stat-label">Feels Like</div>
                </div>
                <div class="weather-stat">
                    <span class="stat-icon">💨</span>
                    <div class="stat-value">${windSpeed}</div>
                    <div class="stat-label">${getUnitLabel('speed')}</div>
                </div>
                <div class="weather-stat">
                    <span class="stat-icon">📍</span>
                    <div class="stat-value">${shortCode}</div>
                    <div class="stat-label">Condition</div>
                </div>
            </div>
        </div>
    `;

    animDiv.className = emojiClass;
    updateAmbientWeather(emojiClass);
}

// Display hourly forecast
function displayHourlyForecast(weatherData) {
    const hourlyDiv = document.getElementById('hourly-forecast');

    if (!weatherData.hourly) {
        console.warn('No hourly data');
        hourlyDiv.innerHTML = '<p style="padding: 2rem; text-align: center; color: #666;">Hourly data unavailable</p>';
        return;
    }

    const hourly = weatherData.hourly;
    const times = hourly.time || [];
    const temps = hourly.temperature_2m || [];
    const codes = hourly.weather_code || [];

    if (!times.length) {
        hourlyDiv.innerHTML = '<p style="padding: 2rem; text-align: center; color: #666;">No hourly data available</p>';
        return;
    }

    let html = '<div class="forecast-scroll"><div class="forecast-cards">';

    for (let i = 0; i < Math.min(24, times.length); i++) {
        const timeStr = times[i];
        const hour = new Date(timeStr).getHours().toString().padStart(2, '0');
        const temp = temps[i];
        const code = codes[i];

        const tempDisplay = convertTemp(temp, currentUnit);
        const emoji = getWeatherEmoji(code);

        html += `
            <div class="forecast-card">
                <div class="forecast-time">${hour}:00</div>
                <div class="forecast-emoji">${emoji}</div>
                <div class="forecast-temp">${tempDisplay}${getUnitLabel('temperature')}</div>
            </div>
        `;
    }

    html += '</div></div>';
    hourlyDiv.innerHTML = html;
}

// Display daily forecast
function displayDailyForecast(weatherData) {
    const dailyDiv = document.getElementById('daily-forecast');

    if (!weatherData.daily) {
        console.warn('No daily data');
        dailyDiv.innerHTML = '<p style="padding: 2rem; text-align: center; color: #666;">Daily data unavailable</p>';
        return;
    }

    const daily = weatherData.daily;
    const times = daily.time || [];
    const maxTemps = daily.temperature_2m_max || [];
    const minTemps = daily.temperature_2m_min || [];
    const codes = daily.weather_code || [];

    if (!times.length) {
        dailyDiv.innerHTML = '<p style="padding: 2rem; text-align: center; color: #666;">No daily data available</p>';
        return;
    }

    let html = '<div class="forecast-cards forecast-daily">';

    for (let i = 0; i < Math.min(7, times.length); i++) {
        const date = new Date(times[i]);
        const dayName = date.toLocaleDateString('en-GB', { weekday: 'short' });
        const dayDate = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

        const maxTemp = maxTemps[i];
        const minTemp = minTemps[i];
        const code = codes[i];

        const maxDisplay = convertTemp(maxTemp, currentUnit);
        const minDisplay = convertTemp(minTemp, currentUnit);
        const description = getWeatherDescription(code);
        const emoji = getWeatherEmoji(code);

        html += `
            <div class="forecast-card forecast-card-daily">
                <div class="forecast-day">${dayName}</div>
                <div class="forecast-date">${dayDate}</div>
                <div class="forecast-emoji-large">${emoji}</div>
                <div class="forecast-desc">${description}</div>
                <div class="daily-temps">
                    <div class="temp-group">
                        <div class="temp-label">High</div>
                        <div class="temp-value">${maxDisplay}${getUnitLabel('temperature')}</div>
                    </div>
                    <div class="temp-group">
                        <div class="temp-label">Low</div>
                        <div class="temp-value">${minDisplay}${getUnitLabel('temperature')}</div>
                    </div>
                </div>
            </div>
        `;
    }

    html += '</div>';
    dailyDiv.innerHTML = html;
}

// Show error message
function showError(message) {
    const resultDiv = document.getElementById('weather-result');
    const animDiv = document.getElementById('weather-animation');
    const button = document.getElementById('get-weather-btn');

    resultDiv.className = 'show error';
    resultDiv.innerHTML = `⚠️ ${message}`;
    animDiv.className = '';
    button.disabled = false;
}

// Get weather description
function getWeatherDescription(code) {
    const codes = {
        0: 'Clear Sky', 1: 'Mainly Clear', 2: 'Partly Cloudy', 3: 'Overcast',
        45: 'Foggy', 48: 'Foggy', 51: 'Drizzle', 53: 'Drizzle', 55: 'Drizzle',
        61: 'Light Rain', 63: 'Rain', 65: 'Heavy Rain',
        71: 'Light Snow', 73: 'Snow', 75: 'Heavy Snow',
        80: 'Showers', 81: 'Showers', 82: 'Heavy Showers',
        95: 'Thunderstorm', 96: 'Hail', 99: 'Hail'
    };
    return codes[code] || 'Unknown';
}

// Get short weather code
function getWeatherCode(code) {
    const codes = {
        0: 'Clear', 1: 'Clear', 2: 'Cloudy', 3: 'Overcast',
        45: 'Foggy', 48: 'Foggy', 51: 'Drizzle', 53: 'Drizzle', 55: 'Drizzle',
        61: 'Light Rain', 63: 'Rain', 65: 'Heavy Rain',
        71: 'Light Snow', 73: 'Snow', 75: 'Heavy Snow',
        80: 'Showers', 81: 'Showers', 82: 'Heavy Showers',
        95: 'Thunder', 96: 'Hail', 99: 'Hail'
    };
    return codes[code] || 'Unknown';
}

// Get emoji for weather
function getWeatherEmoji(code) {
    if ([0, 1].includes(code)) return '☀️';
    if ([2].includes(code)) return '⛅';
    if ([3].includes(code)) return '☁️';
    if ([45, 48].includes(code)) return '🌫️';
    if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return '🌧️';
    if ([71, 73, 75].includes(code)) return '❄️';
    if ([95, 96, 99].includes(code)) return '⛈️';
    return '🌤️';
}

// Get emoji class for animations
function getWeatherEmojiClass(code) {
    if ([0, 1].includes(code)) return 'sunny';
    if ([2].includes(code)) return 'cloudy';
    if ([3].includes(code)) return 'overcast';
    if ([45, 48].includes(code)) return 'foggy';
    if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return 'rainy';
    if ([71, 73, 75].includes(code)) return 'snowy';
    if ([95, 96, 99].includes(code)) return 'thunder';
    return 'windy';
}

// Update ambient animations
function updateAmbientWeather(weatherClass) {
    const ambient = document.getElementById('ambient-container');
    if (!ambient) return;

    const clouds = ambient.querySelectorAll('.ambient-cloud');
    const rainDrops = ambient.querySelectorAll('.rain-drop');
    const snowflakes = ambient.querySelectorAll('.snowflake');
    const stars = ambient.querySelectorAll('.star');
    const lightning = ambient.querySelector('.lightning');
    const sunRays = ambient.querySelectorAll('.sun-ray');
    const sunGlow = ambient.querySelector('.sun-glow');
    const fogLayers = ambient.querySelectorAll('.fog-layer');

    // Hide everything first
    [clouds, rainDrops, snowflakes, stars].forEach(group => {
        if (group) group.forEach(el => { el.style.display = 'none'; el.style.opacity = '0'; });
    });
    if (lightning) lightning.style.display = 'none';
    sunRays.forEach(el => el.style.display = 'none');
    if (sunGlow) sunGlow.style.display = 'none';
    fogLayers.forEach(el => { el.style.display = 'none'; el.style.opacity = '0'; });

    // Show based on weather
    switch(weatherClass) {
        case 'sunny':
            sunRays.forEach(el => el.style.display = 'block');
            if (sunGlow) sunGlow.style.display = 'block';
            break;
        case 'rainy':
            rainDrops.forEach(el => el.style.display = 'block');
            clouds.forEach(el => { el.style.display = 'block'; el.style.opacity = '0.2'; });
            break;
        case 'snowy':
            snowflakes.forEach(el => el.style.display = 'block');
            clouds.forEach(el => { el.style.display = 'block'; el.style.opacity = '0.15'; });
            break;
        case 'thunder':
            rainDrops.forEach(el => el.style.display = 'block');
            if (lightning) lightning.style.display = 'block';
            clouds.forEach(el => { el.style.display = 'block'; el.style.opacity = '0.25'; });
            break;
        case 'cloudy':
            clouds.forEach(el => { el.style.display = 'block'; el.style.opacity = '0.2'; });
            break;
        case 'foggy':
            fogLayers.forEach(el => { el.style.display = 'block'; el.style.opacity = '1'; });
            break;
        default:
            clouds.forEach(el => { el.style.display = 'block'; el.style.opacity = '0.15'; });
    }
}

// Setup event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Unit toggle
    const unitBtns = document.querySelectorAll('.unit-btn');
    unitBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            unitBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentUnit = this.dataset.unit;
            
            if (currentWeatherData) {
                displayCurrentWeather(currentWeatherData.weatherData, currentWeatherData.location.name, currentWeatherData.location.country);
                displayHourlyForecast(currentWeatherData.weatherData);
                displayDailyForecast(currentWeatherData.weatherData);
            }
        });
    });

    // Tab navigation
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tabName = this.dataset.tab;
            tabBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            document.querySelectorAll('.forecast-container').forEach(el => el.classList.remove('active'));

            if (tabName === 'current') document.getElementById('current-forecast').classList.add('active');
            else if (tabName === 'hourly') document.getElementById('hourly-forecast').classList.add('active');
            else if (tabName === 'daily') document.getElementById('daily-forecast').classList.add('active');
        });
    });

    document.getElementById('city').focus();
});

// Enter key
document.getElementById('city').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') getWeather();
});