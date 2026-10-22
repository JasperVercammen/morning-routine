/* global React, ReactDOM, useTweaks, TweaksPanel, TweakSection, TweakRadio, TweakSelect, TweakToggle, TweakButton */
/* Morning — app orchestrator */

const STORE_KEY = "morning.state.v1";

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "soft",
  "countdownStyle": "journey",
  "previewWeather": "auto",
  "tickSound": false
}/*EDITMODE-END*/;

function defaultConfig() {
  return {
    kids: [
      { id: "ila", name: "Ila", avatar: "🦊", on: true },
      { id: "walt", name: "Walt", avatar: "🐻", on: true },
    ],
    tasks: [...DEFAULT_TASKS],
    customTasks: [],
    customDestinations: [],
    destination: "🏫",
    destinationLabel: "school",
    leaveH: 8,
    leaveM: 5,
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) { return null; }
}

function todayAt(h, m) {
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.getTime();
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const saved = useRef(loadState());

  const [config, setConfig] = useState(() => (saved.current && saved.current.config) || defaultConfig());
  const stale = saved.current && saved.current.leaveTs && (Date.now() - saved.current.leaveTs > 2 * 3600 * 1000);
  const [phase, setPhase] = useState(() => (!stale && saved.current && saved.current.phase) || "setup");
  const [startTs, setStartTs] = useState(() => (saved.current && saved.current.startTs) || 0);
  const [leaveTs, setLeaveTs] = useState(() => (saved.current && saved.current.leaveTs) || 0);
  const [now, setNow] = useState(Date.now());

  const weather = useWeather();
  const chimeFired = useRef(false);

  // tick
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);

  // persist
  useEffect(() => {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({ config, phase, startTs, leaveTs }));
    } catch (e) {}
  }, [config, phase, startTs, leaveTs]);

  // auto-advance to board when the leave time arrives (the board owns the alarm loop)
  useEffect(() => {
    if (phase === "count" && leaveTs && now >= leaveTs) {
      setPhase("board");
    }
  }, [now, phase, leaveTs]);

  const handleStart = () => {
    audioCtx(); // unlock audio on user gesture
    const s = Date.now();
    let l = todayAt(config.leaveH, config.leaveM);
    if (l <= s + 2000) l = s + 60 * 1000; // if time already passed, give a 1-min window
    chimeFired.current = false;
    setStartTs(s);
    setLeaveTs(l);
    setPhase("count");
  };

  const backToSetup = () => { chimeFired.current = false; setPhase("setup"); };
  const restartBoard = () => {
    // re-run the same routine: short refresh window for a fresh board
    chimeFired.current = true;
    setPhase("board");
    // force re-mount of board to clear ticks
    setRemountKey((k) => k + 1);
  };
  const [remountKey, setRemountKey] = useState(0);

  // resolve weather condition (with optional preview override)
  const liveCondition = weather.current ? wmoInfo(weather.current.code).key : "partly";
  const condition = t.previewWeather && t.previewWeather !== "auto" ? t.previewWeather : liveCondition;

  const showSky = phase !== "setup";

  return (
    <div className="app" data-theme={t.theme} style={{ background: "var(--paper)" }}>
      {showSky && <WeatherScene condition={condition} />}

      <div className="screen" style={{ position: "relative", zIndex: 1, height: "100%" }}>
        {phase === "setup" && (
          <SetupScreen config={config} setConfig={setConfig} onStart={handleStart} weather={weather} />
        )}
        {phase === "count" && (
          <CountdownScreen
            config={config}
            weather={weather}
            now={now}
            startTs={startTs}
            leaveTs={leaveTs}
            style={t.countdownStyle}
            onBack={backToSetup}
          />
        )}
        {phase === "board" && (
          <GetReadyScreen
            key={remountKey}
            config={config}
            weather={weather}
            tickSound={t.tickSound}
            onRestart={restartBoard}
            onBackToSetup={backToSetup}
          />
        )}
      </div>

      <TweaksPanel>
        <TweakSection label="Uiterlijk" />
        <TweakRadio
          label="Thema"
          value={t.theme}
          options={["soft", "bold", "calm"]}
          onChange={(v) => setTweak("theme", v)}
        />
        <TweakSection label="Aftellen" />
        <TweakRadio
          label="Stijl"
          value={t.countdownStyle}
          options={["bar", "ring", "journey"]}
          onChange={(v) => setTweak("countdownStyle", v)}
        />
        <TweakSection label="Weer (test)" />
        <TweakSelect
          label="Lucht"
          value={t.previewWeather}
          options={["auto", "clear", "partly", "cloudy", "rain", "snow", "storm", "fog"]}
          onChange={(v) => setTweak("previewWeather", v)}
        />
        <TweakSection label="Geluid" />
        <TweakToggle
          label="Tik-geluid bij afvinken"
          value={t.tickSound}
          onChange={(v) => setTweak("tickSound", v)}
        />
        <TweakSection label="Uitproberen" />
        <TweakButton
          label="⏩ Spoel naar bijna klaar"
          onClick={() => { if (phase === "count") { setLeaveTs(Date.now() + 8000); } }}
        />
        <TweakButton
          label="↺ Begin opnieuw"
          onClick={backToSetup}
        />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
