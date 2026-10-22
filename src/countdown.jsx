/* global React */
/* Countdown screen — 3 styles, current+leave time, weather strip */

function fmtClock(d) {
  return pad(d.getHours()) + ":" + pad(d.getMinutes());
}

function remainingText(ms) {
  if (ms <= 0) return "Tijd om te gaan!";
  const totalSec = Math.ceil(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  if (min >= 1) {
    return "nog " + min + (min === 1 ? " minuut" : " minuten");
  }
  return "nog " + sec + " seconden";
}

function urgencyColor(remainMs) {
  const min = remainMs / 60000;
  if (min > 10) return "var(--accent-2)";
  if (min > 3) return "var(--accent-3)";
  return "var(--accent)";
}

/* ---- Style 1: progress bar (rider travels home → destination) ---- */
function CountBar({ progress, leadAvatar, color, destination }) {
  const pct = Math.min(100, Math.max(0, progress * 100));
  return (
    <div className="cbar">
      <span className="cbar__start">🏡</span>
      <div className="cbar__track">
        <div className="cbar__fill" style={{ width: pct + "%", background: color }}>
          <span className="cbar__rider">{leadAvatar}</span>
        </div>
      </div>
      <span className="cbar__dest">{destination}</span>
    </div>
  );
}

/* ---- Style 2: emptying ring ---- */
function CountRing({ progress, color, centerTop, centerBottom }) {
  const R = 150, C = 2 * Math.PI * R;
  const remain = Math.max(0, 1 - progress);
  return (
    <div className="cring">
      <svg viewBox="0 0 360 360" className="cring__svg">
        <circle cx="180" cy="180" r={R} className="cring__bg" />
        <circle
          cx="180" cy="180" r={R}
          className="cring__fg"
          stroke={color}
          strokeDasharray={C}
          strokeDashoffset={C * (1 - remain)}
          transform="rotate(-90 180 180)"
        />
      </svg>
      <div className="cring__center">
        <span className="cring__top display">{centerTop}</span>
        <span className="cring__bottom">{centerBottom}</span>
      </div>
    </div>
  );
}

/* ---- Style 3: journey across the sky ---- */
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

function CountdownScreen({ config, weather, now, startTs, leaveTs, style, onBack }) {
  const MIN_SPAN = 30 * 60 * 1000; // bar always represents at least 30 min so emojis move calmly
  const displayStart = Math.min(startTs, leaveTs - MIN_SPAN);
  const total = Math.max(1, leaveTs - displayStart);
  const elapsed = now - displayStart;
  const progress = Math.min(1, Math.max(0, elapsed / total));
  const remainMs = leaveTs - now;
  const color = urgencyColor(remainMs);

  const activeKids = config.kids.filter((k) => k.on && k.name.trim());
  const leadAvatar = activeKids[0] ? activeKids[0].avatar : "🙸";
  const destination = config.destination || "🏫";
  const destLabel = config.destinationLabel || "weg";

  const leaveDate = new Date(leaveTs);
  const remTotalSec = Math.max(0, Math.ceil(remainMs / 1000));
  const remMin = Math.floor(remTotalSec / 60);
  const remSec = remTotalSec % 60;
  const ringTop = remMin >= 1 ? String(remMin) : String(remSec);
  const ringBottom = remMin >= 1 ? (remMin === 1 ? "minuut" : "minuten") : "seconden";

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
        {style === "bar" && <CountBar progress={progress} leadAvatar={leadAvatar} color={color} destination={destination} />}
        {style === "ring" && <CountRing progress={progress} color={color} centerTop={ringTop} centerBottom={ringBottom} />}
        {style === "journey" && <CountJourney progress={progress} kids={activeKids} color={color} destination={destination} destLabel={destLabel} />}
        <div className="count__remain display" style={{ color }}>{remainingText(remainMs)}</div>
      </div>

      <div className="count__footer">
        <WeatherStrip weather={weather} leaveHour={leaveDate.getHours()} />
      </div>
    </div>
  );
}

Object.assign(window, { CountdownScreen, fmtClock, remainingText });
