// Entry point. Order matters and mirrors the original Morning.html:
//  1. react-globals  -> puts React / ReactDOM on window (must be first)
//  2. styles         -> bundled CSS
//  3. tweaks-panel   -> publishes useTweaks + Tweak* controls to window
//  4. weather        -> publishes the bare hook aliases (useState, ...) + weather
//  5. confetti / setup / countdown / getready -> register their components
//  6. app            -> reads all of the above and calls ReactDOM.createRoot().render()
import "./react-globals.js";

import "./styles.css";
import "./ui.css";

import "./tweaks-panel.jsx";
import "./weather.jsx";
import "./confetti.jsx";
import "./setup.jsx";
import "./countdown.jsx";
import "./getready.jsx";
import "./app.jsx";
