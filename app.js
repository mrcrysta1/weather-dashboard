const GEO = "https://geocoding-api.open-meteo.com/v1/search";
const WEATHER = "https://api.open-meteo.com/v1/forecast";

const WMO_CODES = {
  0: ["☀️", "Clear sky"],
  1: ["🌤", "Mainly clear"],
  2: ["⛅", "Partly cloudy"],
  3: ["☁️", "Overcast"],
  45: ["🌫", "Foggy"],
  48: ["🌫", "Rime fog"],
  51: ["🌦", "Light drizzle"],
  53: ["🌦", "Moderate drizzle"],
  55: ["🌧", "Dense drizzle"],
  61: ["🌧", "Slight rain"],
  63: ["🌧", "Moderate rain"],
  65: ["🌧", "Heavy rain"],
  71: ["❄️", "Slight snow"],
  73: ["❄️", "Moderate snow"],
  75: ["❄️", "Heavy snow"],
  80: ["🌦", "Slight showers"],
  81: ["🌧", "Moderate showers"],
  82: ["⛈", "Violent showers"],
  95: ["⛈", "Thunderstorm"],
  96: ["⛈", "Thunderstorm with hail"],
  99: ["⛈", "Thunderstorm with heavy hail"],
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const $ = (s) => document.querySelector(s);
const mainEl = $("#main");
const loadingEl = $("#loading");
const errorEl = $("#error");

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
  return WMO_CODES[code] || ["❓", "Unknown"];
}

async function searchCity(name) {
  const res = await fetch(`${GEO}?name=${encodeURIComponent(name)}&count=1&language=en`);
  const data = await res.json();
  if (!data.results || !data.results.length) throw new Error("City not found.");
  return data.results[0];
}

async function getWeather(lat, lon) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    current: "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,uv_index,pressure_msl",
    hourly: "temperature_2m,weather_code",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max",
    timezone: "auto",
    forecast_days: 7,
  });
  const res = await fetch(`${WEATHER}?${params}`);
  return res.json();
}

function renderCurrent(weather, city) {
  const c = weather.current;
  const [icon, desc] = getWMO(c.weather_code);
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  $("#current").innerHTML = `
    <div class="weather-icon">${icon}</div>
    <div class="info">
      <div class="city-name">${city.name}, ${city.country || ""}</div>
      <div class="date">${dateStr}</div>
      <div class="temp-big">${Math.round(c.temperature_2m)}<span>°C</span></div>
      <div class="desc">${desc}</div>
    </div>
    <div class="details">
      <div class="detail-card"><div class="label">Feels Like</div><div class="value">${Math.round(c.apparent_temperature)}°C</div></div>
      <div class="detail-card"><div class="label">Humidity</div><div class="value">${c.relative_humidity_2m}%</div></div>
      <div class="detail-card"><div class="label">Wind</div><div class="value">${Math.round(c.wind_speed_10m)} km/h</div></div>
      <div class="detail-card"><div class="label">UV Index</div><div class="value">${c.uv_index?.toFixed(1) ?? "—"}</div></div>
      <div class="detail-card"><div class="label">Pressure</div><div class="value">${Math.round(c.pressure_msl)} hPa</div></div>
    </div>
  `;
}

function renderDaily(weather) {
  const d = weather.daily;
  const grid = $("#daily-grid");
  grid.innerHTML = "";

  for (let i = 0; i < d.time.length; i++) {
    const date = new Date(d.time[i] + "T00:00");
    const dayName = i === 0 ? "Today" : DAYS[date.getDay()];
    const [icon] = getWMO(d.weather_code[i]);
    const hi = Math.round(d.temperature_2m_max[i]);
    const lo = Math.round(d.temperature_2m_min[i]);
    const rain = d.precipitation_probability_max[i];

    const card = document.createElement("div");
    card.className = "day-card" + (i === 0 ? " today" : "");
    card.innerHTML = `
      <div class="day-name">${dayName}</div>
      <div class="day-icon">${icon}</div>
      <div class="day-temps"><span class="hi">${hi}°</span> / <span class="lo">${lo}°</span></div>
      ${rain > 0 ? `<div class="day-rain">💧 ${rain}%</div>` : ""}
    `;
    grid.appendChild(card);
  }
}

function renderHourlyChart(weather) {
  const canvas = $("#hourly-chart");
  const ctx = canvas.getContext("2d");
  const rect = canvas.parentElement.getBoundingClientRect();
  canvas.width = rect.width - 32;
  canvas.height = 200;

  const temps = weather.hourly.temperature_2m.slice(0, 24);
  const times = weather.hourly.time.slice(0, 24);
  const min = Math.min(...temps) - 2;
  const max = Math.max(...temps) + 2;
  const w = canvas.width;
  const h = canvas.height;
  const padTop = 30;
  const padBot = 30;
  const padLeft = 40;
  const padRight = 20;
  const chartW = w - padLeft - padRight;
  const chartH = h - padTop - padBot;

  ctx.clearRect(0, 0, w, h);

  // grid lines
  ctx.strokeStyle = "#1e2d4a";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = padTop + (chartH / 4) * i;
    ctx.beginPath();
    ctx.moveTo(padLeft, y);
    ctx.lineTo(w - padRight, y);
    ctx.stroke();

    const val = max - ((max - min) / 4) * i;
    ctx.fillStyle = "#7a8ba5";
    ctx.font = "11px sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(`${Math.round(val)}°`, padLeft - 6, y + 4);
  }

  // line
  ctx.beginPath();
  ctx.strokeStyle = "#38bdf8";
  ctx.lineWidth = 2.5;
  ctx.lineJoin = "round";

  const points = temps.map((t, i) => ({
    x: padLeft + (chartW / (temps.length - 1)) * i,
    y: padTop + chartH - ((t - min) / (max - min)) * chartH,
  }));

  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
  ctx.stroke();

  // fill gradient
  const grad = ctx.createLinearGradient(0, padTop, 0, padTop + chartH);
  grad.addColorStop(0, "rgba(56,189,248,0.25)");
  grad.addColorStop(1, "rgba(56,189,248,0)");
  ctx.lineTo(points[points.length - 1].x, padTop + chartH);
  ctx.lineTo(points[0].x, padTop + chartH);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // dots + labels
  points.forEach((p, i) => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
    ctx.fillStyle = "#38bdf8";
    ctx.fill();

    if (i % 4 === 0) {
      const hr = new Date(times[i]).getHours();
      ctx.fillStyle = "#7a8ba5";
      ctx.font = "10px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`${hr}:00`, p.x, h - 8);
    }
  });
}

async function loadWeather(cityName) {
  showLoading();
  try {
    const city = await searchCity(cityName);
    const weather = await getWeather(city.latitude, city.longitude);
    renderCurrent(weather, city);
    renderDaily(weather);
    renderHourlyChart(weather);
    showMain();
    history.replaceState(null, "", `?city=${encodeURIComponent(city.name)}`);
  } catch (err) {
    showError(err.message || "Failed to load weather data.");
  }
}

// init
const params = new URLSearchParams(window.location.search);
const initCity = params.get("city") || "New York";
$("#search").value = initCity;
loadWeather(initCity);

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
