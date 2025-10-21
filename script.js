// Sticky subscribe bar intro
window.addEventListener("DOMContentLoaded", () => {
  document.querySelector(".subbar")?.classList.add("is-in");
});

// Leaflet map + radar tiles
const map = L.map("map", { zoomControl: true }).setView([39.5, -98.35], 4);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 10,
  attribution: "&copy; OpenStreetMap",
}).addTo(map);

L.tileLayer(
  "https://tilecache.rainviewer.com/v2/radar/{z}/{x}/{y}/2/1_1.png",
  { opacity: 0.8, zIndex: 3, attribution: "Radar © RainViewer" }
).addTo(map);

// Alerts layer + list
const alertsList = document.getElementById("alertsList");

const alertLayer = L.geoJSON(null, {
  style: () => ({ color: "#ff4d4f", weight: 2, fill: false }),
  onEachFeature: (f, layer) => {
    const p = f.properties || {};
    layer.bindPopup(
      `<strong>${p.event || "Alert"}</strong><br>${p.areaDesc || ""}<br><em>${
        p.severity || ""
      }</em>`
    );
  },
}).addTo(map);

async function loadAlerts(params = {}) {
  alertsList.innerHTML = '<div class="muted">Loading alerts…</div>';
  try {
    let url = 'https://api.weather.gov/alerts/active?status=actual&message_type=alert&limit=200';
    if (params.point) {
      url += `&point=${params.point.lat},${params.point.lon}`;
    } else if (params.area) {
      url += `&area=${encodeURIComponent(params.area)}`;
    }

    const res = await fetch(url, { headers: { Accept: "application/geo+json" } });
    const geo = await res.json();

    alertsList.innerHTML = "";
    if (!geo.features?.length) {
      alertsList.innerHTML =
        '<div class="muted">No active alerts for the current filter.</div>';
    } else {
      geo.features.forEach((f) => {
        const p = f.properties || {};
        const div = document.createElement("div");
        div.className = "alert";
        div.innerHTML = `
          <div class="alert-title">${p.event || "Alert"}</div>
          <div class="muted">${p.areaDesc || ""}</div>
          <div class="muted">${p.severity || ""} • ${p.urgency || ""}</div>
        `;
        alertsList.appendChild(div);
      });
    }

    alertLayer.clearLayers();
    alertLayer.addData(geo);

    const lastUpdated = document.getElementById("lastUpdated");
    if (lastUpdated) {
      const now = new Date();
      lastUpdated.textContent = `Last updated: ${now.toLocaleString(undefined, {
        dateStyle: "short",
        timeStyle: "short"
      })}`;
    }

  } catch (e) {
    console.error(e);
    alertsList.innerHTML =
      '<div class="muted">Failed to load alerts (NWS API). Try again later.</div>';
  }
}

loadAlerts();

/* ================================
   CURRENT CONDITIONS (Open-Meteo)
   ================================ */
async function loadWeather(lat = 39.5, lon = -98.35) {
  const el = document.getElementById("currentWeather");
  if (!el) return;

  try {
    el.textContent = "Loading current weather…";

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&temperature_unit=fahrenheit&windspeed_unit=mph&precipitation_unit=inch&timezone=auto`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(res.statusText);
    const data = await res.json();
    const cw = data.current_weather;

    if (!cw) {
      el.innerHTML = `<span class="muted">No current weather available for this location.</span>`;
      return;
    }

    const dir = (d) => {
      const a = ["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"];
      return a[Math.round((d % 360) / 22.5) % 16];
    };

    el.innerHTML = `
      <div class="wx-card">
        <div class="wx-title">Temperature</div>
        <div class="wx-value">${Math.round(cw.temperature)}°F</div>
      </div>
      <div class="wx-card">
        <div class="wx-title">Wind</div>
        <div class="wx-value">${Math.round(cw.windspeed)} mph ${cw.winddirection != null ? dir(cw.winddirection) : ""}</div>
      </div>
      <div class="wx-card">
        <div class="wx-title">Observed</div>
        <div class="wx-value">${new Date(cw.time).toLocaleString()}</div>
      </div>
    `;
  } catch (e) {
    console.error("Open-Meteo error:", e);
    el.innerHTML = `
      <div class="muted">
        ⚠️ Unable to load current conditions.
        <button class="btn" id="retryWx" style="margin-left:8px;">Retry</button>
      </div>`;
    document.getElementById("retryWx")?.addEventListener("click", () => loadWeather(lat, lon));
  }
}

// initial conditions (US center) until user selects a place
loadWeather();

// ZIP search
document.getElementById("applyZip").addEventListener("click", async () => {
  const zip = document.getElementById("zip").value.trim();
  if (!zip) return;
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&countrycodes=us&postalcode=${encodeURIComponent(
        zip
      )}`
    );
    const data = await res.json();
    if (data && data[0]) {
      const { lat, lon } = data[0];
      map.setView([+lat, +lon], 7);
      loadAlerts({ point: { lat: +lat, lon: +lon } });
      loadWeather(+lat, +lon); // ← added
    }
  } catch (e) {
    console.error(e);
  }
});

// Geolocation
document.getElementById("locate").addEventListener("click", () => {
  if (!navigator.geolocation) {
    alert("Location not supported.");
    return;
  }
  navigator.geolocation.getCurrentPosition((pos) => {
    const { latitude: lat, longitude: lon } = pos.coords;
    map.setView([lat, lon], 7);
    loadAlerts({ point: { lat, lon } });
    loadWeather(lat, lon); // ← added
  });
});

// Subscribe Gate
(function () {
  const KEY = "subGateDismissedAt";
  const HOURS = 24;
  const gate = document.getElementById("subGate");
  const btn = document.getElementById("continueBtn");

  const shouldShow = () => {
    try {
      const ts = +localStorage.getItem(KEY) || 0;
      return (Date.now() - ts) / 36e5 >= HOURS;
    } catch {
      return true;
    }
  };

  const showGate = () => {
    gate.classList.add("is-open");
  };

  const hideGate = () => {
    gate.classList.remove("is-open");
    try {
      localStorage.setItem(KEY, String(Date.now()));
    } catch {}
  };

  window.addEventListener("DOMContentLoaded", () => {
    if (shouldShow()) showGate();
  });

  btn?.addEventListener("click", hideGate);
})();
