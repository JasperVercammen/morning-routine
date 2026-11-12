/* global React */
/* Setup screen: kids, emoji task picker, leave-time picker */
import EmojiPicker, { EmojiStyle } from "emoji-picker-react";

const ANIMALS = ["🦊", "🐻", "🐰", "🐼", "🐸", "🦁", "🐨", "🐯", "🦄", "🐧"];

const DESTINATIONS = [
  { emoji: "🏫", label: "school" },
  { emoji: "👵", label: "opa/oma" },
  { emoji: "👴", label: "mammie/pappie" },
  { emoji: "🛒", label: "winkel" },
  { emoji: "🏊", label: "zwemles" },
  { emoji: "🎶", label: "muziekschool" },
  { emoji: "🌳", label: "bossie" },
  { emoji: "🎉", label: "feestje" },
  { emoji: "🕺", label: "dansles" }
];


const TASK_CATALOG = [
  { id: "socks",   emoji: "🧦", label: "sokken" },
  { id: "shoes",   emoji: "👟", label: "schoenen" },
  { id: "jacket",  emoji: "🧥", label: "jas" },
  { id: "sun",     emoji: "🧴", label: "zonnecrème" },
  { id: "hat",     emoji: "🧢", label: "pet" },
  { id: "helmet",     emoji: "🪖", label: "helm" },
  { id: "toilet",  emoji: "🚽", label: "plassen" },
  { id: "gloves",  emoji: "🧤", label: "handschoenen" },
  { id: "pill",  emoji: "💊", label: "vitamientje" },
  { id: "bag",     emoji: "🎒", label: "tas" },
  { id: "fluo",   emoji: "🦺", label: "fluo" },
  { id: "headphone",   emoji: "🎧", label: "koptelefoon" },
];

const DEFAULT_TASKS = ["shoes", "jacket", "toilet", "bag"];

function pad(n) { return String(n).padStart(2, "0"); }

function kidTaskIds(config, kid) {
  const extras = (kid.extraTasks || []).filter((id) => !config.tasks.includes(id));
  return [...config.tasks, ...extras];
}

/* ---- Time stepper ---- */
function TimePicker({ h, m, onChange }) {
  const bump = (field, dir) => {
    if (field === "h") {
      let nh = (h + dir + 24) % 24;
      onChange(nh, m);
    } else {
      let total = h * 60 + m + dir * 5;
      total = (total + 1440) % 1440;
      onChange(Math.floor(total / 60), total % 60);
    }
  };
  return (
    <div className="timepick">
      <div className="timepick__col">
        <button className="timepick__btn" onClick={() => bump("h", 1)} aria-label="uur omhoog">▲</button>
        <span className="timepick__num display">{pad(h)}</span>
        <button className="timepick__btn" onClick={() => bump("h", -1)} aria-label="uur omlaag">▼</button>
      </div>
      <span className="timepick__sep display">:</span>
      <div className="timepick__col">
        <button className="timepick__btn" onClick={() => bump("m", 1)} aria-label="minuut omhoog">▲</button>
        <span className="timepick__num display">{pad(m)}</span>
        <button className="timepick__btn" onClick={() => bump("m", -1)} aria-label="minuut omlaag">▼</button>
      </div>
    </div>
  );
}

/* ---- Kid card ---- */
function KidCard({ kid, onChange, onRemove, canRemove }) {
  const cycleAvatar = () => {
    const i = ANIMALS.indexOf(kid.avatar);
    onChange({ ...kid, avatar: ANIMALS[(i + 1) % ANIMALS.length] });
  };
  return (
    <div className={"kidcard" + (kid.on ? " kidcard--on" : "")}>
      <button className="kidcard__avatar" onClick={cycleAvatar} title="Kies een dier">{kid.avatar}</button>
      <input
        className="kidcard__name"
        value={kid.name}
        placeholder="naam"
        onChange={(e) => onChange({ ...kid, name: e.target.value })}
      />
      <button
        className={"kidcard__toggle" + (kid.on ? " is-on" : "")}
        onClick={() => onChange({ ...kid, on: !kid.on })}
        aria-pressed={kid.on}
      >
        {kid.on ? "doet mee ✓" : "niet vandaag"}
      </button>
      {canRemove && (
        <button className="kidcard__x" onClick={onRemove} aria-label="verwijder kind">×</button>
      )}
    </div>
  );
}

/* ---- Task tile ---- */
function TaskTile({ task, selected, onToggle, onRemove }) {
  return (
    <div className={"tasktile" + (selected ? " tasktile--sel" : "")} onClick={onToggle} role="button">
      <span className="tasktile__emoji">{task.emoji}</span>
      <span className="tasktile__label">{task.label}</span>
      <span className="tasktile__check">{selected ? "✓" : ""}</span>
      {onRemove && (
        <button className="tasktile__x" onClick={(e) => { e.stopPropagation(); onRemove(); }} aria-label="verwijder taak">×</button>
      )}
    </div>
  );
}

/* ---- Inline add form with a full emoji picker (shared by tasks + locations) ---- */
function EmojiLabelForm({ onAdd, onCancel, placeholder, initialEmoji = "⭐" }) {
  const [emoji, setEmoji] = useState(initialEmoji);
  const [label, setLabel] = useState("");
  const submit = () => { if (label.trim()) onAdd(emoji, label.trim()); };
  return (
    <div className="addform">
      <div className="addform__chosen">
        <span className="addform__chosen-emoji">{emoji}</span>
        <input
          className="addform__input" autoFocus placeholder={placeholder} value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
        />
      </div>
      <div className="addform__picker">
        <EmojiPicker
          emojiStyle={EmojiStyle.NATIVE}
          onEmojiClick={(d) => setEmoji(d.emoji)}
          width="100%"
          height={320}
          lazyLoadEmojis={false}
          skinTonesDisabled
          searchPlaceHolder="zoek een emoji"
          previewConfig={{ showPreview: false }}
        />
      </div>
      <div className="addform__btns">
        <button className="addform__cancel" onClick={onCancel}>annuleer</button>
        <button className="addform__add" disabled={!label.trim()} onClick={submit}>＋ toevoegen</button>
      </div>
    </div>
  );
}

/* ---- Extra tasks for one kid, on top of the shared list ---- */
function KidExtras({ kid, allTasks, sharedIds, onChange, onCreate }) {
  const [picking, setPicking] = useState(false);
  const [creating, setCreating] = useState(false);
  const extras = kid.extraTasks || [];
  const byId = useMemo(() => Object.fromEntries(allTasks.map((t) => [t.id, t])), [allTasks]);
  const candidates = allTasks.filter((t) => !sharedIds.includes(t.id) && !extras.includes(t.id));

  const close = () => { setPicking(false); setCreating(false); };
  const add = (id) => { onChange([...extras, id]); close(); };

  return (
    <div className={"kidextra" + (kid.on ? "" : " kidextra--off")}>
      <div className="kidextra__row">
        <span className="kidextra__avatar">{kid.avatar}</span>
        <span className="kidextra__name">{kid.name}</span>
        <div className="kidextra__chips">
          {extras.map((id) => byId[id] && (
            <span key={id} className="xchip">
              <span className="xchip__e">{byId[id].emoji}</span>
              <span className="xchip__l">{byId[id].label}</span>
              <button className="xchip__x" onClick={() => onChange(extras.filter((t) => t !== id))} aria-label="verwijder extra taak">×</button>
            </span>
          ))}
          <button className="xchip xchip--add" onClick={() => (picking ? close() : setPicking(true))}>
            {picking ? "sluit" : "＋ extra"}
          </button>
        </div>
      </div>
      {picking && !creating && (
        <div className="kidextra__pick">
          {candidates.map((t) => (
            <button key={t.id} className="xchip xchip--pick" onClick={() => add(t.id)}>
              <span className="xchip__e">{t.emoji}</span>
              <span className="xchip__l">{t.label}</span>
            </button>
          ))}
          <button className="xchip xchip--pick xchip--new" onClick={() => setCreating(true)}>＋ eigen</button>
        </div>
      )}
      {creating && (
        <EmojiLabelForm
          placeholder={"extra taak voor " + kid.name}
          onAdd={(emoji, label) => { onCreate(emoji, label); close(); }}
          onCancel={close}
        />
      )}
    </div>
  );
}

/* ---- Setup screen ---- */
function SetupScreen({ config, setConfig, onStart, weather }) {
  const [adding, setAdding] = useState(false);
  const [addingDest, setAddingDest] = useState(false);
  const allTasks = useMemo(
    () => [...TASK_CATALOG, ...(config.customTasks || [])],
    [config.customTasks]
  );
  const customIds = useMemo(
    () => new Set((config.customTasks || []).map((c) => c.id)),
    [config.customTasks]
  );
  const allDestinations = useMemo(
    () => [...DESTINATIONS, ...(config.customDestinations || [])],
    [config.customDestinations]
  );
  const customDestKeys = useMemo(
    () => new Set((config.customDestinations || []).map((d) => d.emoji + "|" + d.label)),
    [config.customDestinations]
  );

  const updateKid = (id, kid) =>
    setConfig({ ...config, kids: config.kids.map((k) => (k.id === id ? kid : k)) });
  const removeKid = (id) =>
    setConfig({ ...config, kids: config.kids.filter((k) => k.id !== id) });
  const addKid = () =>
    setConfig({
      ...config,
      kids: [...config.kids, { id: "k" + Date.now(), name: "", avatar: ANIMALS[config.kids.length % ANIMALS.length], on: true }],
    });

  const toggleTask = (id) => {
    const has = config.tasks.includes(id);
    setConfig({ ...config, tasks: has ? config.tasks.filter((t) => t !== id) : [...config.tasks, id] });
  };

  const addCustom = (emoji, label) => {
    const id = "custom" + Date.now();
    setConfig({
      ...config,
      customTasks: [...(config.customTasks || []), { id, emoji, label }],
      tasks: [...config.tasks, id],
    });
    setAdding(false);
  };

  const removeCustom = (id) => {
    setConfig({
      ...config,
      customTasks: (config.customTasks || []).filter((c) => c.id !== id),
      tasks: config.tasks.filter((t) => t !== id),
      kids: config.kids.map((k) => ({ ...k, extraTasks: (k.extraTasks || []).filter((t) => t !== id) })),
    });
  };

  const setKidExtras = (kidId, extraTasks) =>
    setConfig({ ...config, kids: config.kids.map((k) => (k.id === kidId ? { ...k, extraTasks } : k)) });

  const addCustomForKid = (kidId, emoji, label) => {
    const id = "custom" + Date.now();
    setConfig({
      ...config,
      customTasks: [...(config.customTasks || []), { id, emoji, label }],
      kids: config.kids.map((k) => (k.id === kidId ? { ...k, extraTasks: [...(k.extraTasks || []), id] } : k)),
    });
  };

  const addCustomDest = (emoji, label) => {
    setConfig({
      ...config,
      customDestinations: [...(config.customDestinations || []), { emoji, label }],
      destination: emoji,
      destinationLabel: label,
    });
    setAddingDest(false);
  };

  const removeCustomDest = (emoji, label) => {
    const wasSelected = config.destination === emoji && config.destinationLabel === label;
    setConfig({
      ...config,
      customDestinations: (config.customDestinations || []).filter((d) => !(d.emoji === emoji && d.label === label)),
      ...(wasSelected ? { destination: DESTINATIONS[0].emoji, destinationLabel: DESTINATIONS[0].label } : {}),
    });
  };

  const activeKids = config.kids.filter((k) => k.on && k.name.trim());
  const namedKids = config.kids.filter((k) => k.name.trim());
  const canStart = activeKids.length > 0 && activeKids.every((k) => kidTaskIds(config, k).length > 0);

  const info = weather && weather.current ? wmoInfo(weather.current.code, weather.current.isDay) : null;

  return (
    <div className="setup">
      <header className="setup__head">
        <h1 className="setup__title display">Goedemorgen! ☀️</h1>
        <p className="setup__sub">
          {info
            ? <>Buiten is het <strong>{info.label.toLowerCase()}</strong>, {weather.current.temp}° {info.emoji}</>
            : "We maken ons klaar om te vertrekken"}
        </p>
      </header>

      <div className="setup__grid">
        {/* LEFT: kids + time */}
        <section className="panel">
          <h2 className="panel__h display">Wie maakt zich klaar?</h2>
          <div className="kidlist">
            {config.kids.map((k) => (
              <KidCard
                key={k.id}
                kid={k}
                onChange={(kid) => updateKid(k.id, kid)}
                onRemove={() => removeKid(k.id)}
                canRemove={config.kids.length > 1}
              />
            ))}
            {config.kids.length < 4 && (
              <button className="kidadd" onClick={addKid}>＋ kind</button>
            )}
          </div>

          <h2 className="panel__h display" style={{ marginTop: 26 }}>Hoe laat gaan we weg?</h2>
          <TimePicker
            h={config.leaveH}
            m={config.leaveM}
            onChange={(h, m) => setConfig({ ...config, leaveH: h, leaveM: m })}
          />

          <h2 className="panel__h display" style={{ marginTop: 26 }}>Waar gaan we heen?</h2>
          <div className="destgrid">
            {allDestinations.map((d) => {
              const isCustom = customDestKeys.has(d.emoji + "|" + d.label);
              const sel = config.destination === d.emoji && config.destinationLabel === d.label;
              return (
                <div key={d.emoji + "|" + d.label} className="destwrap">
                  <button
                    className={"destchip" + (sel ? " destchip--sel" : "")}
                    onClick={() => setConfig({ ...config, destination: d.emoji, destinationLabel: d.label })}
                  >
                    <span className="destchip__e">{d.emoji}</span>
                    <span className="destchip__l">{d.label}</span>
                  </button>
                  {isCustom && (
                    <button
                      className="destchip__x"
                      onClick={(e) => { e.stopPropagation(); removeCustomDest(d.emoji, d.label); }}
                      aria-label="verwijder plek"
                    >×</button>
                  )}
                </div>
              );
            })}
            {!addingDest && (
              <button className="destchip destchip--add" onClick={() => setAddingDest(true)}>
                <span className="destchip__e">＋</span>
                <span className="destchip__l">nieuw</span>
              </button>
            )}
          </div>
          {addingDest && (
            <EmojiLabelForm
              placeholder="naam van de plek"
              initialEmoji="📍"
              onAdd={addCustomDest}
              onCancel={() => setAddingDest(false)}
            />
          )}
        </section>

        {/* RIGHT: tasks */}
        <section className="panel">
          <h2 className="panel__h display">Wat moeten we doen?</h2>
          <div className="taskgrid">
            {allTasks.map((t) => (
              <TaskTile
                key={t.id}
                task={t}
                selected={config.tasks.includes(t.id)}
                onToggle={() => toggleTask(t.id)}
                onRemove={customIds.has(t.id) ? () => removeCustom(t.id) : null}
              />
            ))}
            {adding ? (
              <EmojiLabelForm
                placeholder="naam van de taak"
                onAdd={addCustom}
                onCancel={() => setAdding(false)}
              />
            ) : (
              <button className="tasktile tasktile--add" onClick={() => setAdding(true)}>
                <span className="tasktile__emoji">＋</span>
                <span className="tasktile__label">eigen</span>
              </button>
            )}
          </div>

          {namedKids.length > 0 && (
            <>
              <h2 className="panel__h display" style={{ marginTop: 26 }}>Extra voor één kind</h2>
              <div className="kidextras">
                {namedKids.map((k) => (
                  <KidExtras
                    key={k.id}
                    kid={k}
                    allTasks={allTasks}
                    sharedIds={config.tasks}
                    onChange={(ids) => setKidExtras(k.id, ids)}
                    onCreate={(emoji, label) => addCustomForKid(k.id, emoji, label)}
                  />
                ))}
              </div>
            </>
          )}
        </section>
      </div>

      <footer className="setup__foot">
        <button className="bigbtn" disabled={!canStart} onClick={onStart}>
          Start! <span className="bigbtn__play">▶</span>
        </button>
        {!canStart && <span className="setup__hint">Kies minstens één kind en voor elk kind één taak</span>}
      </footer>
    </div>
  );
}

Object.assign(window, { ANIMALS, TASK_CATALOG, DEFAULT_TASKS, TASK_CATALOG_BY_ID: Object.fromEntries(TASK_CATALOG.map(t => [t.id, t])), SetupScreen, pad, kidTaskIds });
