/* global React */
/* Countdown screen — journey, current+leave time, weather strip */

function fmtClock(d) {
  return pad(d.getHours()) + ":" + pad(d.getMinutes());
}

function remainingText(ms) {
  if (ms <= 0) return "Tijd om te gaan!";
  const min = Math.ceil(ms / 60000);
  return "nog " + min + (min === 1 ? " minuut" : " minuten");
}

function urgencyColor(remainMs) {
  const min = remainMs / 60000;
  if (min > 10) return "var(--accent-2)";
  if (min > 3) return "var(--accent-3)";
  return "var(--accent)";
}

/* ---- journey across the sky ---- */
function CountJourney({ progress, kids, color, destination, destLabel }) {
  const frac = Math.min(1, Math.max(0, progress));
  return (
    <div className="cjourney">
      <div className="cjourney__track">
        <div className="cjourney__line" />
        <div className="cjourney__done" style={{ width: `calc((100% - 80px) * ${frac})`, background: color }} />
        <span className="cjourney__start">🏡</span>
        <span className="cjourney__end">{destination}</span>
        <div className="cjourney__walkers" style={{ left: `calc(40px + (100% - 80px) * ${frac})` }}>
          {kids.map((k) => (
            <span key={k.id} className="cjourney__walker">{k.avatar || "🧒"}</span>
          ))}
        </div>
      </div>
      <div className="cjourney__caption">van thuis naar {destLabel || "weg"}</div>
    </div>
  );
}

function CountdownScreen({ config, weather, now, startTs, leaveTs, onBack }) {
  const MIN_SPAN = 30 * 60 * 1000; // bar always represents at least 30 min so emojis move calmly
  const displayStart = Math.min(startTs, leaveTs - MIN_SPAN);
  const total = Math.max(1, leaveTs - displayStart);
  const elapsed = now - displayStart;
  const progress = Math.min(1, Math.max(0, elapsed / total));
  const remainMs = leaveTs - now;
  const color = urgencyColor(remainMs);

  const activeKids = config.kids.filter((k) => k.on && k.name.trim());
  const destination = config.destination || "🏫";
  const destLabel = config.destinationLabel || "weg";

  const leaveDate = new Date(leaveTs);

  const info = weather && weather.current ? wmoInfo(weather.current.code) : null;

  return (
    <div className="count">
      <div className="count__topbar">
        <button className="iconbtn" onClick={onBack} aria-label="terug">‹ terug</button>
        <div className="count__weatherbadge">
          {info && (
            <>
              <span className="count__wemoji">{info.emoji}</span>
              <span className="count__wtemp display">{weather.current.temp}°</span>
              <span className="count__wlabel">{info.label}</span>
            </>
          )}
        </div>
      </div>

      <div className="count__clocks">
        <div className="count__nowwrap">
          <span className="count__nowlabel">het is nu</span>
          <span className="count__now display">{fmtClock(new Date(now))}</span>
        </div>
        <div className="count__leavewrap">
          <span className="count__leavelabel">we gaan om</span>
          <span className="count__leave display">{fmtClock(leaveDate)}</span>
        </div>
      </div>

      <div className="count__stage">
        <CountJourney progress={progress} kids={activeKids} color={color} destination={destination} destLabel={destLabel} />
        <div className="count__remain display" style={{ color }}>{remainingText(remainMs)}</div>
      </div>

      <div className="count__footer">
        <WeatherStrip weather={weather} leaveHour={leaveDate.getHours()} />
      </div>
    </div>
  );
}

Object.assign(window, { CountdownScreen, fmtClock, remainingText });
