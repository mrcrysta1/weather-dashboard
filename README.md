# Weather Dashboard

Interactive weather dashboard with 7-day forecast and hourly temperature chart. Powered by [Open-Meteo](https://open-meteo.com/) — no API key needed.

## Live Demo

🔗 [https://mrcrysta1.github.io/weather-dashboard/](https://mrcrysta1.github.io/weather-dashboard/)

## Features

- Search any city in the world
- Current temperature, feels-like, humidity, wind, UV index, pressure
- 7-day forecast with weather icons and rain probability
- 24-hour hourly temperature chart (canvas-drawn)
- Beautiful dark gradient theme
- Responsive — works on mobile and desktop
- URL sharing — `?city=London` in the URL
- Pure HTML/CSS/JS — zero dependencies

## Tech Stack

- Vanilla HTML5, CSS3, JavaScript (ES6+)
- Open-Meteo API (free, no key)
- Canvas API for hourly chart
- Hosted on GitHub Pages

## How to run locally

```bash
# No build step — just open in browser
open index.html
# or
python -m http.server 8000
# visit http://localhost:8000
```

## License

MIT
