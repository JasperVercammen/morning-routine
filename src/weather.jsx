/* global React */
const { useState, useEffect, useMemo, useRef } = React;
Object.assign(window, { useState, useEffect, useMemo, useRef });

/* ---- WMO weather code -> condition info (Dutch) ---- */
function wmoInfo(code, isDay = true) {
  const c = Number(code);
  if (c === 0) return isDay ? { key: "clear", emoji: "☀️", label: "Zonnig" } : { key: "clear", emoji: "🌙", label: "Helder" };
  if (c === 1) return isDay ? { key: "partly", emoji: "🌤️", label: "Mooi weer" } : { key: "partly", emoji: "🌙", label: "Vrij helder" };
  if (c === 2) return isDay ? { key: "partly", emoji: "⛅", label: "Halfbewolkt" } : { key: "partly", emoji: "☁️", label: "Halfbewolkt" };
  if (c === 3) return { key: "cloudy", emoji: "☁️", label: "Bewolkt" };
  if (c === 45 || c === 48) return { key: "fog", emoji: "🌫️", label: "Mist" };
  if (c >= 51 && c <= 57) return { key: "rain", emoji: "🌦️", label: "Motregen" };
  if (c >= 61 && c <= 65) return { key: "rain", emoji: "🌧️", label: "Regen" };
  if (c === 66 || c === 67) return { key: "rain", emoji: "🌧️", label: "IJzel" };
  if (c >= 71 && c <= 77) return { key: "snow", emoji: "🌨️", label: "Sneeuw" };
  if (c >= 80 && c <= 82) return { key: "rain", emoji: "🌧️", label: "Buien" };
  if (c === 85 || c === 86) return { key: "snow", emoji: "🌨️", label: "Sneeuwbuien" };
  if (c >= 95) return { key: "storm", emoji: "⛈️", label: "Onweer" };
  return { key: "partly", emoji: "🌤️", label: "Wisselend" };
}

/* ---- Live weather hook (geolocation + Open-Meteo, graceful fallback) ---- */
function useWeather() {
  const [state, setState] = useState({ status: "loading", current: null, hourly: [], place: "" });

  useEffect(() => {
    let cancelled = false;

    async function load(lat, lon, place) {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
          `&current=temperature_2m,weather_code,is_day&hourly=temperature_2m,weather_code,is_day` +
          `&daily=sunrise,sunset` +
          `&timezone=auto&forecast_days=1`;
        const res = await fetch(url);
        const data = await res.json();
        if (cancelled) return;
        const nowIso = data.current.time;
        const startIdx = Math.max(0, data.hourly.time.findIndex((t) => t >= nowIso));
        const hourly = [];
        for (let i = startIdx; i < startIdx + 8 && i < data.hourly.time.length; i++) {
          hourly.push({
            time: data.hourly.time[i],
            hour: new Date(data.hourly.time[i]).getHours(),
            temp: Math.round(data.hourly.temperature_2m[i]),
            code: data.hourly.weather_code[i],
            isDay: data.hourly.is_day[i] === 1,
          });
        }
        setState({
          status: "ok",
          current: {
            temp: Math.round(data.current.temperature_2m),
            code: data.current.weather_code,
            isDay: data.current.is_day === 1,
          },
          hourly,
          sun: { rise: new Date(data.daily.sunrise[0]).getTime(), set: new Date(data.daily.sunset[0]).getTime() },
          place: place || "",
        });
      } catch (e) {
        if (!cancelled) fallbackMock();
      }
    }

    // Demo fallback so the screen is never empty (e.g. offline / blocked)
    function fallbackMock() {
      const h = new Date().getHours();
      const codes = [3, 61, 80, 2];
      const hourly = Array.from({ length: 8 }, (_, i) => ({
        time: "", hour: (h + i) % 24, temp: 11 + ((i * 3) % 5), code: codes[i % codes.length],
        isDay: (h + i) % 24 >= 8 && (h + i) % 24 < 17,
      }));
      const rise = new Date(); rise.setHours(8, 0, 0, 0);
      const set = new Date(); set.setHours(17, 0, 0, 0);
      setState({
        status: "mock", current: { temp: 12, code: 61, isDay: h >= 8 && h < 17 }, hourly, place: "Voorbeeld",
        sun: { rise: rise.getTime(), set: set.getTime() },
      });
    }

    // Default fallback location: Antwerp
    const FALLBACK = { lat: 51.2194, lon: 4.4025, place: "" };
    if (navigator.geolocation) {
      const timer = setTimeout(() => load(FALLBACK.lat, FALLBACK.lon, ""), 6000); // don't hang forever
      navigator.geolocation.getCurrentPosition(
        (pos) => { clearTimeout(timer); load(pos.coords.latitude, pos.coords.longitude, ""); },
        () => { clearTimeout(timer); load(FALLBACK.lat, FALLBACK.lon, ""); },
        { timeout: 5500, maximumAge: 600000 }
      );
    } else {
      load(FALLBACK.lat, FALLBACK.lon, "");
    }
    return () => { cancelled = true; };
  }, []);

  return state;
}

/* ---- Time of day: night / dawn / day / dusk around sunrise & sunset ---- */
const TWILIGHT_BEFORE = 45 * 60 * 1000;
const TWILIGHT_AFTER = 30 * 60 * 1000;

function timeOfDay(now, sun) {
  let rise = sun && sun.rise;
  let set = sun && sun.set;
  if (!rise || !set) {
    const d = new Date(now);
    rise = new Date(d).setHours(8, 0, 0, 0);
    set = new Date(d).setHours(17, 0, 0, 0);
  }
  if (now < rise - TWILIGHT_BEFORE) return "night";
  if (now < rise + TWILIGHT_AFTER) return "dawn";
  if (now < set - TWILIGHT_AFTER) return "day";
  if (now < set + TWILIGHT_BEFORE) return "dusk";
  return "night";
}

/* ---- Animated sky background ---- */
function WeatherScene({ condition, tod = "day" }) {
  const key = condition || "partly";
  const isNight = tod === "night";

  const clouds = useMemo(() => {
    const n = key === "clear" ? 2 : (key === "fog" ? 2 : 4);
    return Array.from({ length: n }, (_, i) => ({
      top: 4 + Math.random() * 24 + "%",
      w: 130 + Math.random() * 150,
      h: 40 + Math.random() * 22,
      dur: 38 + Math.random() * 40,
      delay: -Math.random() * 40,
    }));
  }, [key]);

  const drops = useMemo(() => {
    if (key !== "rain" && key !== "storm") return [];
    const n = key === "storm" ? 90 : 70;
    return Array.from({ length: n }, () => ({
      left: Math.random() * 100 + "%",
      dur: 0.5 + Math.random() * 0.5,
      delay: -Math.random() * 2,
      h: 40 + Math.random() * 40,
      op: 0.4 + Math.random() * 0.5,
    }));
  }, [key]);

  const flakes = useMemo(() => {
    if (key !== "snow") return [];
    return Array.from({ length: 55 }, () => ({
      left: Math.random() * 100 + "%",
      dur: 5 + Math.random() * 6,
      delay: -Math.random() * 8,
      size: 5 + Math.random() * 9,
      sx: (Math.random() * 80 - 40) + "px",
    }));
  }, [key]);

  const stars = useMemo(() => {
    if (!isNight || (key !== "clear" && key !== "partly")) return [];
    return Array.from({ length: key === "clear" ? 70 : 35 }, () => ({
      left: Math.random() * 100 + "%",
      top: Math.random() * 60 + "%",
      size: 1.5 + Math.random() * 2.5,
      dur: 2 + Math.random() * 4,
      delay: -Math.random() * 6,
    }));
  }, [key, isNight]);

  const showSun = !isNight && (key === "clear" || key === "partly");
  const showMoon = isNight && (key === "clear" || key === "partly");
  const lowSun = tod === "dawn" || tod === "dusk";

  return (
    <div className={`sky sky--${key} sky--${tod}`}>
      {stars.map((s, i) => (
        <div key={"s" + i} className="star" style={{
          left: s.left, top: s.top, width: s.size, height: s.size,
          animationDuration: s.dur + "s", animationDelay: s.delay + "s",
        }} />
      ))}
      {showSun && <div className={"sun" + (key === "partly" ? " sun--peek" : "") + (lowSun ? " sun--low" : "")} />}
      {showMoon && <div className={key === "partly" ? "moon moon--peek" : "moon"} />}
      {(key !== "clear") && clouds.map((c, i) => (
        <div key={"c" + i} className="cloud" style={{
          top: c.top, width: c.w, height: c.h,
          animationDuration: c.dur + "s", animationDelay: c.delay + "s",
        }} />
      ))}
      {key === "clear" && clouds.map((c, i) => (
        <div key={"c" + i} className="cloud" style={{
          top: c.top, width: c.w * 0.8, height: c.h, opacity: 0.8,
          animationDuration: c.dur + "s", animationDelay: c.delay + "s",
        }} />
      ))}
      {drops.map((d, i) => (
        <div key={"d" + i} className="drop" style={{
          left: d.left, height: d.h, opacity: d.op,
          animationDuration: d.dur + "s", animationDelay: d.delay + "s",
        }} />
      ))}
      {flakes.map((f, i) => (
        <div key={"f" + i} className="flake" style={{
          left: f.left, width: f.size, height: f.size, "--sx": f.sx,
          animationDuration: f.dur + "s", animationDelay: f.delay + "s",
        }} />
      ))}
      {key === "fog" && [0, 1, 2].map((i) => (
        <div key={"fg" + i} className="fogbank" style={{
          top: 20 + i * 22 + "%", animationDuration: 50 + i * 14 + "s", animationDelay: -i * 10 + "s",
        }} />
      ))}
      {key === "storm" && <div className="flash" />}
    </div>
  );
}

/* ---- Hourly forecast strip ---- */
function WeatherStrip({ weather, leaveHour }) {
  if (!weather || !weather.current) return null;
  return (
    <div className="wstrip">
      {weather.hourly.map((h, i) => {
        const info = wmoInfo(h.code, h.isDay);
        const isLeave = leaveHour != null && h.hour === leaveHour;
        return (
          <div key={i} className={"whour" + (i === 0 ? " whour--now" : "") + (isLeave ? " whour--leave" : "")}>
            <span className="whour__t">{i === 0 ? "nu" : h.hour + "u"}</span>
            <span className="whour__e">{info.emoji}</span>
            <span className="whour__d">{h.temp}°</span>
            {isLeave && <span className="whour__flag">weg!</span>}
          </div>
        );
      })}
    </div>
  );
}

Object.assign(window, { wmoInfo, useWeather, timeOfDay, WeatherScene, WeatherStrip });
