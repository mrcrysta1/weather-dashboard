# Weather Dashboard v2

Interactive weather dashboard with dynamic backgrounds, event recommendations, and real-time location. Powered by [Open-Meteo](https://open-meteo.com/) — no API key needed.

## Live Demo

🔗 [https://mrcrysta1.github.io/weather-dashboard/](https://mrcrysta1.github.io/weather-dashboard/)

## What's New in v2.0

- **📍 Auto-detect location** — one click to get weather for your current position
- **🎨 Dynamic backgrounds** — sky changes color based on weather (sunny, rainy, snowy, foggy, night)
- **🌧 Animated particles** — rain drops, snowflakes, fog drifts
- **🎯 Event recommendations** — smart suggestions (outdoor, umbrella, UV, picnic, stargazing)
- **🌅 Sunrise & Sunset** — with current day phase
- **🌡️ °C / °F toggle** — switch units instantly
- **📊 Smoother hourly chart** — curved lines with weather icons on top
- **🌙 Night mode** — auto-detects night time
- **📱 Fully responsive** — mobile-first design

## Features

- Search any city in the world
- Current temp, feels-like, humidity, wind, UV, pressure, visibility
- 7-day forecast with rain %, wind speed, weather icons
- 24-hour hourly temperature chart
- Beautiful dark glass-morphism UI
- URL sharing — `?city=London` or `?lat=40.7&lon=-74.0`

## Tech Stack

- Vanilla HTML5, CSS3, JavaScript (ES6+)
- Open-Meteo API (free, no key)
- Canvas API for chart
- CSS animations for particles
- Hosted on GitHub Pages

## How to run locally

```bash
open index.html
# or
python -m http.server 8000
```

## Changelog

### v2.0 (latest)
- Geolocation, dynamic backgrounds, event suggestions, sunrise/sunset, °C/°F toggle, animated particles

### v1.0
- Initial release with search, 7-day forecast, hourly chart

## License

MIT
