/* global React */
/* Get-ready board — alarm loop + per-kid check-in, then per-kid checklists with confetti reward */

function GetReadyScreen({ config, weather, onRestart, onBackToSetup, tickSound }) {
  const activeKids = config.kids.filter((k) => k.on && k.name.trim());
  const tasksById = useMemo(() => {
    const m = {};
    TASK_CATALOG.forEach((t) => (m[t.id] = t));
    (config.customTasks || []).forEach((t) => (m[t.id] = t));
    return m;
  }, [config.customTasks]);
  const tasks = config.tasks.map((id) => tasksById[id]).filter(Boolean);

  const [done, setDone] = useState(() => {
    const o = {};
    activeKids.forEach((k) => (o[k.id] = []));
    return o;
  });
  const [reported, setReported] = useState({});
  const [celebrated, setCelebrated] = useState({});
  const colRefs = useRef({});
  const prevComplete = useRef({});
  const alarmRef = useRef(null);

  const allReported = activeKids.length > 0 && activeKids.every((k) => reported[k.id]);

  // Alarm rings (on a loop) until everyone has reported to the tablet
  useEffect(() => {
    try { playAlarm(); } catch (e) {}
    alarmRef.current = setInterval(() => { try { playAlarm(); } catch (e) {} }, 2400);
    return () => { if (alarmRef.current) { clearInterval(alarmRef.current); alarmRef.current = null; } };
  }, []);
  useEffect(() => {
    if (allReported && alarmRef.current) { clearInterval(alarmRef.current); alarmRef.current = null; }
  }, [allReported]);

  const report = (kidId) => {
    audioCtx(); // unlock / resume audio on tap
    setReported((r) => ({ ...r, [kidId]: true }));
  };

  const toggle = (kidId, taskId) => {
    setDone((prev) => {
      const cur = prev[kidId] || [];
      const has = cur.includes(taskId);
      if (tickSound && !has) playPop();
      return { ...prev, [kidId]: has ? cur.filter((t) => t !== taskId) : [...cur, taskId] };
    });
  };

  // detect completion per kid
  useEffect(() => {
    activeKids.forEach((k) => {
      const isComplete = tasks.length > 0 && (done[k.id] || []).length === tasks.length;
      if (isComplete && !prevComplete.current[k.id]) {
        prevComplete.current[k.id] = true;
        setCelebrated((c) => ({ ...c, [k.id]: true }));
        playWin();
        const el = colRefs.current[k.id];
        if (el) {
          const r = el.getBoundingClientRect();
          fireConfetti({ x: r.left + r.width / 2, y: r.top + r.height * 0.35, count: 150 });
        } else {
          fireConfetti({ count: 150 });
        }
      } else if (!isComplete && prevComplete.current[k.id]) {
        prevComplete.current[k.id] = false;
        setCelebrated((c) => ({ ...c, [k.id]: false }));
      }
    });
  }, [done]);

  const allDone = activeKids.length > 0 && activeKids.every((k) => (done[k.id] || []).length === tasks.length);

  let sub;
  if (allDone) sub = "Jassen aan — we gaan!";
  else if (!allReported) sub = "⏰ Meld je aan en begin met je lijstje!";
  else sub = "Tik alles aan wat je al gedaan hebt";

  return (
    <div className="board">
      <header className="board__head">
        <div>
          <h1 className="board__title display">
            {allDone ? "Helemaal klaar! 🎉" : "Maak je klaar!"}
            {!allReported && !allDone && <span className="board__bell">⏰</span>}
          </h1>
          <p className="board__sub">{sub}</p>
        </div>
        <div className="board__actions">
          <button className="iconbtn" onClick={onRestart}>↺ opnieuw</button>
          <button className="iconbtn" onClick={onBackToSetup}>⚙ aanpassen</button>
        </div>
      </header>

      <div className={"board__cols cols-" + Math.min(activeKids.length, 4)}>
        {activeKids.map((k) => {
          const kdone = done[k.id] || [];
          const complete = celebrated[k.id];
          const isReported = !!reported[k.id];
          const remaining = tasks.length - kdone.length;
          return (
            <div
              key={k.id}
              className={"kidcol" + (complete ? " kidcol--done" : "")}
              ref={(el) => (colRefs.current[k.id] = el)}
            >
              <div className="kidcol__head">
                <span className="kidcol__avatar">{k.avatar}</span>
                <span className="kidcol__name display">{k.name}</span>
                <span className="kidcol__count">
                  {complete ? "alles af!" : remaining + " te gaan"}
                </span>
              </div>

              <div className="kidcol__tiles">
                {tasks.map((t) => {
                  const checked = kdone.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      className={"chk" + (checked ? " chk--on" : "")}
                      onClick={() => toggle(k.id, t.id)}
                    >
                      <span className="chk__emoji">{t.emoji}</span>
                      <span className="chk__label">{t.label}</span>
                      <span className="chk__mark">{checked ? "✓" : ""}</span>
                    </button>
                  );
                })}
              </div>

              {!isReported && (
                <div className="kidcol__report">
                  <span className="kidcol__reportavatar">{k.avatar}</span>
                  <button className="kidcol__reportbtn" onClick={() => report(k.id)}>👋 Ik ben er!</button>
                  <span className="kidcol__reporthint">{k.name}, tik om te starten</span>
                </div>
              )}

              {complete && (
                <div className="kidcol__cheer">
                  <span className="kidcol__star">⭐</span>
                  <span className="kidcol__cheertext display">Goed gedaan,<br />{k.name}!</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

Object.assign(window, { GetReadyScreen });
