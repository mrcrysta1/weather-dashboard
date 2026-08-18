const GEO = "https://geocoding-api.open-meteo.com/v1/search";
const WEATHER = "https://api.open-meteo.com/v1/forecast";
const AIR_QUALITY = "https://air-quality-api.open-meteo.com/v1/air-quality";

let useFahrenheit = false;
let lastWeather = null;
let lastCity = null;
let favorites = JSON.parse(localStorage.getItem("weather_favorites") || "[]");

const WMO_CODES = {
  0: ["☀️", "Clear sky", "clear"],
  1: ["🌤", "Mainly clear", "clear"],
  2: ["⛅", "Partly cloudy", "clouds"],
  3: ["☁️", "Overcast", "clouds"],
  45: ["🌫", "Foggy", "fog"],
  48: ["🌫", "Rime fog", "fog"],
  51: ["🌦", "Light drizzle", "rain"],
  53: ["🌦", "Moderate drizzle", "rain"],
  55: ["🌧", "Dense drizzle", "rain"],
  61: ["🌧", "Slight rain", "rain"],
  63: ["🌧", "Moderate rain", "rain"],
  65: ["🌧", "Heavy rain", "rain"],
  71: ["❄️", "Slight snow", "snow"],
  73: ["❄️", "Moderate snow", "snow"],
  75: ["❄️", "Heavy snow", "snow"],
  80: ["🌦", "Slight showers", "rain"],
  81: ["🌧", "Moderate showers", "rain"],
  82: ["⛈", "Violent showers", "storm"],
  95: ["⛈", "Thunderstorm", "storm"],
  96: ["⛈", "Thunderstorm with hail", "storm"],
  99: ["⛈", "Heavy hail storm", "storm"],
};

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const $ = (s) => document.querySelector(s);
const mainEl = $("#main");
const loadingEl = $("#loading");
const errorEl = $("#error");
const body = $("#body");

function showLoading() {
  mainEl.classList.add("hidden");
  errorEl.classList.add("hidden");
  loadingEl.classList.remove("hidden");
}

function showError(msg) {
  loadingEl.classList.add("hidden");
  mainEl.classList.add("hidden");
  errorEl.textContent = msg;
  errorEl.classList.remove("hidden");
}

function showMain() {
  loadingEl.classList.add("hidden");
  errorEl.classList.add("hidden");
  mainEl.classList.remove("hidden");
}

function getWMO(code) {
  return WMO_CODES[code] || ["❓", "Unknown", "clear"];
}

function toF(c) { return (c * 9) / 5 + 32; }
function tempStr(c) {
  return useFahrenheit ? `${Math.round(toF(c))}°F` : `${Math.round(c)}°C`;
}

// --- Dynamic Background ---
function applyWeatherBg(category, isNight) {
  body.className = "";
  if (isNight) {
    body.classList.add("weather-night");
  } else {
    body.classList.add(`weather-${category}`);
  }
  spawnParticles(category, isNight);
}

// --- Animated Particles ---
function spawnParticles(category, isNight) {
  const container = $("#particles");
  container.innerHTML = "";

  if (category === "rain" || category === "storm") {
    for (let i = 0; i < 60; i++) {
      const p = document.createElement("div");
      p.className = "particle";
      p.style.left = Math.random() * 100 + "%";
      p.style.width = "2px";
      p.style.height = isNight ? "12px" : "10px";
      p.style.background = isNight ? "rgba(56,189,248,0.4)" : "rgba(150,200,255,0.5)";
      p.style.animationDuration = 0.4 + Math.random() * 0.4 + "s";
      p.style.animationDelay = Math.random() * 2 + "s";
      container.appendChild(p);
    }
  } else if (category === "snow") {
    for (let i = 0; i < 50; i++) {
      const p = document.createElement("div");
      p.className = "particle";
      p.style.left = Math.random() * 100 + "%";
      p.style.width = "6px";
      p.style.height = "6px";
      p.style.borderRadius = "50%";
      p.style.background = "rgba(255,255,255,0.7)";
      p.style.animationDuration = 3 + Math.random() * 4 + "s";
      p.style.animationDelay = Math.random() * 3 + "s";
      container.appendChild(p);
    }
  } else if (category === "fog") {
    for (let i = 0; i < 8; i++) {
      const p = document.createElement("div");
      p.className = "particle";
      p.style.left = "-20%";
      p.style.top = 10 + Math.random() * 80 + "%";
      p.style.width = "200px";
      p.style.height = "40px";
      p.style.borderRadius = "50%";
      p.style.background = "rgba(200,200,200,0.08)";
      p.style.animationDuration = 15 + Math.random() * 10 + "s";
      p.style.animationDelay = Math.random() * 5 + "s";
      p.style.animation = `drift ${15 + Math.random() * 10}s linear infinite`;
      container.appendChild(p);
    }
    // Add drift keyframes if not exists
    if (!document.getElementById("drift-style")) {
      const style = document.createElement("style");
      style.id = "drift-style";
      style.textContent = `@keyframes drift { from { transform: translateX(-100%); } to { transform: translateX(calc(100vw + 100%)); } }`;
      document.head.appendChild(style);
    }
  }
}

// --- Events & Suggestions ---
function getEvents(current, daily) {
  const events = [];
  const temp = current.temperature_2m;
  const code = current.weather_code;
  const uv = current.uv_index ?? 0;
  const wind = current.wind_speed_10m;
  const humidity = current.relative_humidity_2m;
  const [, , cat] = getWMO(code);
  const rainChance = daily.precipitation_probability_max?.[0] ?? 0;

  // Outdoor activities
  if (cat === "clear" && temp > 15 && temp < 35 && wind < 30) {
    events.push({ icon: "🏃", title: "Great for Outdoor", tip: "Perfect weather for running, cycling or walking", type: "good" });
  } else if (cat === "rain" || cat === "storm") {
    events.push({ icon: "🏠", title: "Stay Indoor", tip: "Rain expected — plan indoor activities", type: "bad" });
  } else if (cat === "snow") {
    events.push({ icon: "⛷", title: "Snow Day!", tip: "Great for skiing, snowman or cozy indoors", type: "good" });
  } else {
    events.push({ icon: "🚶", title: "Good for Walk", tip: "Pleasant weather for a stroll", type: "good" });
  }

  // UV warning
  if (uv >= 8) {
    events.push({ icon: "🧴", title: "UV Very High", tip: "Wear sunscreen & stay in shade", type: "bad" });
  } else if (uv >= 5) {
    events.push({ icon: "😎", title: "UV Moderate", tip: "Sunglasses recommended", type: "warn" });
  } else {
    events.push({ icon: "🕶", title: "UV Low", tip: "No sun protection needed", type: "good" });
  }

  // Rain / umbrella
  if (rainChance >= 60) {
    events.push({ icon: "☂️", title: "Bring Umbrella", tip: `${rainChance}% chance of rain today`, type: "bad" });
  } else if (rainChance >= 30) {
    events.push({ icon: "🌂", title: "Maybe Umbrella", tip: `${rainChance}% rain chance — be prepared`, type: "warn" });
  } else {
    events.push({ icon: "🌤", title: "Dry Day Ahead", tip: "No rain expected", type: "good" });
  }

  // Wind
  if (wind > 40) {
    events.push({ icon: "💨", title: "Strong Winds", tip: `${Math.round(wind)} km/h — secure loose items`, type: "bad" });
  } else if (wind > 20) {
    events.push({ icon: "🌬", title: "Windy", tip: `${Math.round(wind)} km/h — might feel cooler`, type: "warn" });
  }

  // Picnic
  if (cat === "clear" && temp > 20 && temp < 32 && rainChance < 20 && wind < 25) {
    events.push({ icon: "🧺", title: "Perfect Picnic!", tip: "Clear skies, warm temp — ideal outdoor lunch", type: "good" });
  }

  // Hot / cold
  if (temp > 35) {
    events.push({ icon: "🔥", title: "Very Hot", tip: "Stay hydrated, avoid midday sun", type: "bad" });
  } else if (temp < 0) {
    events.push({ icon: "🥶", title: "Freezing", tip: "Bundle up — below freezing", type: "bad" });
  }

  // Stargazing
  if (cat === "clear" && !isNightTime()) {
    events.push({ icon: "🔭", title: "Stargazing Tonight?", tip: "Clear skies — great for tonight's stars", type: "good" });
  }

  return events.slice(0, 6);
}

function isNightTime() {
  const h = new Date().getHours();
  return h < 6 || h > 20;
}

// --- Sunrise / Sunset ---
function renderSun(sunrise, sunset) {
  const riseTime = sunrise.split("T")[1];
  const setTime = sunset.split("T")[1];

  const now = new Date();
  const riseDate = new Date(sunrise);
  const setDate = new Date(sunset);
  const dayProgress = Math.max(0, Math.min(1, (now - riseDate) / (setDate - riseDate)));

  let phase = "Day";
  if (now < riseDate) phase = "Before Sunrise";
  else if (now > setDate) phase = "After Sunset";
  else if (dayProgress < 0.25) phase = "Morning";
  else if (dayProgress < 0.5) phase = "Midday";
  else if (dayProgress < 0.75) phase = "Afternoon";
  else phase = "Evening";

  $("#sun-cards").innerHTML = `
    <div class="sun-card sunrise">
      <div class="sun-icon">🌅</div>
      <div class="sun-label">Sunrise</div>
      <div class="sun-time">${riseTime}</div>
    </div>
    <div class="sun-card sunset">
      <div class="sun-icon">🌇</div>
      <div class="sun-label">Sunset</div>
      <div class="sun-time">${setTime}</div>
    </div>
  `;
}

// --- Render Current ---
function renderCurrent(weather, city) {
  const c = weather.current;
  const [icon, desc, cat] = getWMO(c.weather_code);
  const isNight = isNightTime();

  applyWeatherBg(cat, isNight);

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
  const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  $("#current").innerHTML = `
    <div class="weather-icon">${isNight && cat === "clear" ? "🌙" : icon}</div>
    <div class="info">
      <div class="city-name">${city.name}, ${city.admin1 || ""} ${city.country || ""}</div>
      <div class="date">${dateStr} · ${timeStr}</div>
      <div class="temp-big">${tempStr(c.temperature_2m)}</div>
      <div class="desc">${desc} ${isNight ? "(Night)" : ""}</div>
    </div>
    <div class="details">
      <div class="detail-card"><div class="label">Feels Like</div><div class="value">${tempStr(c.apparent_temperature)}</div></div>
      <div class="detail-card"><div class="label">Humidity</div><div class="value">${c.relative_humidity_2m}%</div></div>
      <div class="detail-card"><div class="label">Wind</div><div class="value">${Math.round(c.wind_speed_10m)} km/h</div></div>
      <div class="detail-card"><div class="label">UV Index</div><div class="value">${c.uv_index?.toFixed(1) ?? "—"}</div></div>
      <div class="detail-card"><div class="label">Pressure</div><div class="value">${Math.round(c.pressure_msl)} hPa</div></div>
      <div class="detail-card"><div class="label">Visibility</div><div class="value">${(c.visibility / 1000).toFixed(1)} km</div></div>
    </div>
  `;
}

// --- Render Events ---
function renderEvents(weather) {
  const events = getEvents(weather.current, weather.daily);
  const grid = $("#events-grid");
  grid.innerHTML = events.map((e) => `
    <div class="event-card ${e.type}">
      <div class="event-icon">${e.icon}</div>
      <div class="event-title">${e.title}</div>
      <div class="event-tip">${e.tip}</div>
    </div>
  `).join("");
}

// --- Render Daily ---
function renderDaily(weather) {
  const d = weather.daily;
  const grid = $("#daily-grid");
  grid.innerHTML = "";

  for (let i = 0; i < d.time.length; i++) {
    const date = new Date(d.time[i] + "T00:00");
    const dayName = i === 0 ? "Today" : DAYS_SHORT[date.getDay()];
    const [icon] = getWMO(d.weather_code[i]);
    const hi = d.temperature_2m_max[i];
    const lo = d.temperature_2m_min[i];
    const rain = d.precipitation_probability_max[i];
    const wind = d.wind_speed_10m_max[i];

    const card = document.createElement("div");
    card.className = "day-card" + (i === 0 ? " today" : "");
    card.innerHTML = `
      <div class="day-name">${dayName}</div>
      <div class="day-icon">${icon}</div>
      <div class="day-temps"><span class="hi">${tempStr(hi)}</span> / <span class="lo">${tempStr(lo)}</span></div>
      ${rain > 0 ? `<div class="day-rain">💧 ${rain}%</div>` : ""}
      <div class="day-wind">💨 ${Math.round(wind)} km/h</div>
    `;
    grid.appendChild(card);
  }
}

// --- Hourly Chart ---
function renderHourlyChart(weather) {
  const canvas = $("#hourly-chart");
  const ctx = canvas.getContext("2d");
  const rect = canvas.parentElement.getBoundingClientRect();
  canvas.width = rect.width - 32;
  canvas.height = 220;

  const temps = weather.hourly.temperature_2m.slice(0, 24);
  const times = weather.hourly.time.slice(0, 24);
  const codes = weather.hourly.weather_code?.slice(0, 24) || [];
  const min = Math.min(...temps) - 3;
  const max = Math.max(...temps) + 3;
  const w = canvas.width;
  const h = canvas.height;
  const padTop = 35;
  const padBot = 35;
  const padLeft = 45;
  const padRight = 20;
  const chartW = w - padLeft - padRight;
  const chartH = h - padTop - padBot;

  ctx.clearRect(0, 0, w, h);

  // Grid
  ctx.strokeStyle = "rgba(30,45,74,0.6)";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 5; i++) {
    const y = padTop + (chartH / 5) * i;
    ctx.beginPath();
    ctx.moveTo(padLeft, y);
    ctx.lineTo(w - padRight, y);
    ctx.stroke();
    const val = max - ((max - min) / 5) * i;
    ctx.fillStyle = "#7a8ba5";
    ctx.font = "11px sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(`${Math.round(val)}°`, padLeft - 8, y + 4);
  }

  // Points
  const points = temps.map((t, i) => ({
    x: padLeft + (chartW / (temps.length - 1)) * i,
    y: padTop + chartH - ((t - min) / (max - min)) * chartH,
  }));

  // Gradient fill
  const grad = ctx.createLinearGradient(0, padTop, 0, padTop + chartH);
  grad.addColorStop(0, "rgba(56,189,248,0.3)");
  grad.addColorStop(1, "rgba(56,189,248,0)");

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    const xc = (points[i - 1].x + points[i].x) / 2;
    const yc = (points[i - 1].y + points[i].y) / 2;
    ctx.quadraticCurveTo(points[i - 1].x, points[i - 1].y, xc, yc);
  }
  ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);

  // Stroke line
  ctx.strokeStyle = "#38bdf8";
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Fill area
  ctx.lineTo(points[points.length - 1].x, padTop + chartH);
  ctx.lineTo(points[0].x, padTop + chartH);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // Dots + weather icons + time labels
  points.forEach((p, i) => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
    ctx.fillStyle = "#38bdf8";
    ctx.fill();

    // Weather icon every 3 hours
    if (i % 3 === 0 && codes[i] !== undefined) {
      const [ic] = getWMO(codes[i]);
      ctx.font = "14px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(ic, p.x, padTop - 10);
    }

    // Time label
    if (i % 3 === 0) {
      const hr = new Date(times[i]).getHours();
      ctx.fillStyle = "#7a8ba5";
      ctx.font = "10px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`${hr}:00`, p.x, h - 8);
    }
  });
}

// --- Fetch ---
async function searchCity(name) {
  const res = await fetch(`${GEO}?name=${encodeURIComponent(name)}&count=1&language=en`);
  const data = await res.json();
  if (!data.results || !data.results.length) throw new Error("City not found. Try another name.");
  return data.results[0];
}

async function getWeather(lat, lon) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    current: "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,uv_index,pressure_msl,visibility",
    hourly: "temperature_2m,weather_code",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max,sunrise,sunset",
    timezone: "auto",
    forecast_days: 7,
  });
  const res = await fetch(`${WEATHER}?${params}`);
  return res.json();
}

async function loadWeather(cityName) {
  showLoading();
  try {
    const city = await searchCity(cityName);
    const weather = await getWeather(city.latitude, city.longitude);
    lastWeather = weather;
    lastCity = city;
    renderCurrent(weather, city);
    renderEvents(weather);
    renderHourlyChart(weather);
    renderDaily(weather);
    checkAlerts(weather);
    updateFavButton();

    // Sunrise/sunset
    if (weather.daily.sunrise?.[0]) {
      renderSun(weather.daily.sunrise[0], weather.daily.sunset[0]);
    }

    // Air quality
    const aqiData = await loadAirQuality(city.latitude, city.longitude);
    renderAirQuality(aqiData);

    showMain();
    history.replaceState(null, "", `?city=${encodeURIComponent(city.name)}`);
  } catch (err) {
    showError(err.message || "Failed to load weather data.");
  }
}

// --- Geolocation ---
function loadMyLocation() {
  if (!navigator.geolocation) {
    showError("Geolocation is not supported by your browser.");
    return;
  }
  showLoading();
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      try {
        const { latitude, longitude } = pos.coords;
        const weather = await getWeather(latitude, longitude);
        // Reverse geocode city name
        const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=&latitude=${latitude}&longitude=${longitude}&count=1`);
        // Fallback: use coordinates as name
        lastWeather = weather;
        lastCity = { name: `${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`, country: "" };
        renderCurrent(weather, lastCity);
        renderEvents(weather);
        renderHourlyChart(weather);
        renderDaily(weather);
        if (weather.daily.sunrise?.[0]) renderSun(weather.daily.sunrise[0], weather.daily.sunset[0]);
        showMain();
        history.replaceState(null, "", `?lat=${latitude}&lon=${longitude}`);
      } catch (err) {
        showError("Failed to load weather for your location.");
      }
    },
    () => {
      showError("Location access denied. Please search a city manually.");
    },
    { timeout: 10000 }
  );
}

// --- Unit Toggle ---
function toggleUnit() {
  useFahrenheit = !useFahrenheit;
  const btn = $("#unit-toggle");
  btn.textContent = useFahrenheit ? "°F" : "°C";
  btn.classList.toggle("active", useFahrenheit);

  if (lastWeather && lastCity) {
    renderCurrent(lastWeather, lastCity);
    renderDaily(lastWeather);
    renderHourlyChart(lastWeather);
  }
}

// --- Favorites ---
function saveFavorites() {
  localStorage.setItem("weather_favorites", JSON.stringify(favorites));
}

function toggleFavorite() {
  if (!lastCity) return;
  const name = lastCity.name;
  const idx = favorites.findIndex((f) => f.name === name);
  if (idx >= 0) {
    favorites.splice(idx, 1);
  } else {
    favorites.push({ name, lat: lastCity.latitude, lon: lastCity.longitude });
  }
  saveFavorites();
  renderFavorites();
  updateFavButton();
}

function updateFavButton() {
  const btn = $("#fav-btn");
  if (!lastCity) return;
  const isFav = favorites.some((f) => f.name === lastCity.name);
  btn.textContent = isFav ? "⭐" : "☆";
  btn.classList.toggle("active", isFav);
}

function renderFavorites() {
  const bar = $("#favorites-bar");
  const list = $("#favorites-list");
  if (favorites.length === 0) {
    bar.classList.add("hidden");
    return;
  }
  bar.classList.remove("hidden");
  list.innerHTML = favorites
    .map(
      (f, i) =>
        `<div class="fav-chip" data-idx="${i}">
          <span class="fav-name">${f.name}</span>
          <span class="fav-remove" data-idx="${i}">&times;</span>
        </div>`
    )
    .join("");

  list.querySelectorAll(".fav-chip").forEach((chip) => {
    chip.addEventListener("click", (e) => {
      if (e.target.classList.contains("fav-remove")) {
        const idx = parseInt(e.target.dataset.idx);
        favorites.splice(idx, 1);
        saveFavorites();
        renderFavorites();
        updateFavButton();
        return;
      }
      const idx = parseInt(chip.dataset.idx);
      const fav = favorites[idx];
      if (fav.name) loadWeather(fav.name);
    });
  });
}

// --- Share ---
async function shareWeather() {
  if (!lastWeather || !lastCity) return;
  const c = lastWeather.current;
  const [icon, desc] = getWMO(c.weather_code);
  const text = `${icon} ${lastCity.name}: ${Math.round(c.temperature_2m)}°C, ${desc}\n🌡 Feels like ${Math.round(c.apparent_temperature)}°C | 💧 ${c.relative_humidity_2m}% | 💨 ${Math.round(c.wind_speed_10m)} km/h\n\nvia Weather Dashboard`;

  if (navigator.share) {
    try {
      await navigator.share({ title: `Weather - ${lastCity.name}`, text });
    } catch {}
  } else {
    try {
      await navigator.clipboard.writeText(text);
      const btn = $("#share-btn");
      btn.textContent = "✅ Copied!";
      setTimeout(() => (btn.textContent = "📤 Share"), 2000);
    } catch {
      alert("Copy this:\n\n" + text);
    }
  }
}

// --- Weather Alerts ---
function checkAlerts(weather) {
  const c = weather.current;
  const alerts = [];

  if (c.uv_index >= 8) {
    alerts.push({ icon: "⚠️", title: "Extreme UV Index", desc: `UV index is ${c.uv_index.toFixed(1)} — avoid outdoor exposure` });
  }
  if (c.wind_speed_10m > 50) {
    alerts.push({ icon: "💨", title: "High Wind Warning", desc: `Wind speed ${Math.round(c.wind_speed_10m)} km/h — secure loose objects` });
  }
  if (c.temperature_2m > 40) {
    alerts.push({ icon: "🔥", title: "Extreme Heat", desc: `${Math.round(c.temperature_2m)}°C — stay hydrated, avoid sun` });
  }
  if (c.temperature_2m < -10) {
    alerts.push({ icon: "🥶", title: "Extreme Cold", desc: `${Math.round(c.temperature_2m)}°C — bundle up, risk of frostbite` });
  }

  const rainChance = weather.daily.precipitation_probability_max?.[0] ?? 0;
  if (rainChance >= 80) {
    alerts.push({ icon: "🌧", title: "Heavy Rain Expected", desc: `${rainChance}% chance — flash flood risk in low areas` });
  }

  const code = c.weather_code;
  if (code >= 95) {
    alerts.push({ icon: "⛈", title: "Thunderstorm Alert", desc: "Severe thunderstorm — stay indoors if possible" });
  }

  const alertEl = $("#weather-alert");
  if (alerts.length === 0) {
    alertEl.classList.add("hidden");
    return;
  }

  alertEl.classList.remove("hidden");
  alertEl.innerHTML = alerts
    .map(
      (a) => `
    <div class="alert-icon">${a.icon}</div>
    <div class="alert-text">
      <div class="alert-title">${a.title}</div>
      <div class="alert-desc">${a.desc}</div>
    </div>
  `
    )
    .join("") + '<button class="alert-close" onclick="this.parentElement.classList.add(\'hidden\')">&times;</button>';
}

// --- Air Quality ---
async function loadAirQuality(lat, lon) {
  try {
    const res = await fetch(`${AIR_QUALITY}?latitude=${lat}&longitude=${lon}&current=european_aqi,us_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide`);
    return await res.json();
  } catch {
    return null;
  }
}

function renderAirQuality(aqiData) {
  const cards = $("#aqi-cards");
  if (!aqiData?.current) {
    cards.innerHTML = '<div class="aqi-card"><div class="aqi-label">Air Quality</div><div class="aqi-value">—</div><div class="aqi-status">Data unavailable</div></div>';
    return;
  }

  const c = aqiData.current;
  const usAqi = c.us_aqi ?? 0;
  let status, cls;

  if (usAqi <= 50) { status = "Good"; cls = "aqi-good"; }
  else if (usAqi <= 100) { status = "Moderate"; cls = "aqi-moderate"; }
  else if (usAqi <= 150) { status = "Unhealthy (Sensitive)"; cls = "aqi-unhealthy"; }
  else if (usAqi <= 200) { status = "Unhealthy"; cls = "aqi-bad"; }
  else { status = "Very Unhealthy"; cls = "aqi-very-bad"; }

  cards.innerHTML = `
    <div class="aqi-card ${cls}">
      <div class="aqi-label">US AQI</div>
      <div class="aqi-value">${usAqi}</div>
      <div class="aqi-status">${status}</div>
    </div>
    <div class="aqi-card">
      <div class="aqi-label">PM2.5</div>
      <div class="aqi-value">${c.pm2_5?.toFixed(1) ?? "—"}</div>
      <div class="aqi-status">µg/m³</div>
    </div>
    <div class="aqi-card">
      <div class="aqi-label">PM10</div>
      <div class="aqi-value">${c.pm10?.toFixed(1) ?? "—"}</div>
      <div class="aqi-status">µg/m³</div>
    </div>
    <div class="aqi-card">
      <div class="aqi-label">NO₂</div>
      <div class="aqi-value">${c.nitrogen_dioxide?.toFixed(1) ?? "—"}</div>
      <div class="aqi-status">µg/m³</div>
    </div>
  `;
}

// --- Init ---
const params = new URLSearchParams(window.location.search);
const initCity = params.get("city");
const initLat = params.get("lat");
const initLon = params.get("lon");

if (initLat && initLon) {
  // Load by coordinates
  (async () => {
    showLoading();
    try {
      const weather = await getWeather(parseFloat(initLat), parseFloat(initLon));
      lastWeather = weather;
      lastCity = { name: `${parseFloat(initLat).toFixed(2)}°, ${parseFloat(initLon).toFixed(2)}°`, country: "" };
      renderCurrent(weather, lastCity);
      renderEvents(weather);
      renderHourlyChart(weather);
      renderDaily(weather);
      if (weather.daily.sunrise?.[0]) renderSun(weather.daily.sunrise[0], weather.daily.sunset[0]);
      showMain();
    } catch { showError("Failed to load."); }
  })();
} else {
  loadWeather(initCity || "New York");
  if (!initCity) $("#search").value = "New York";
  else $("#search").value = initCity;
}

// --- Event Listeners ---
$("#search-btn").addEventListener("click", () => {
  const q = $("#search").value.trim();
  if (q) loadWeather(q);
});

$("#search").addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const q = $("#search").value.trim();
    if (q) loadWeather(q);
  }
});

$("#locate-btn").addEventListener("click", loadMyLocation);
$("#unit-toggle").addEventListener("click", toggleUnit);
$("#share-btn").addEventListener("click", shareWeather);
$("#fav-btn").addEventListener("click", toggleFavorite);

// Render favorites on load
renderFavorites();

// Redraw chart on resize
let resizeTimer;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if (lastWeather) renderHourlyChart(lastWeather);
  }, 200);
});
