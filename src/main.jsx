// Entry point. Order matters and mirrors the original Morning.html:
//  1. react-globals  -> puts React / ReactDOM on window (must be first)
//  2. styles         -> bundled CSS
//  3. weather        -> publishes the bare hook aliases (useState, ...) + weather
//  4. confetti / setup / countdown / getready -> register their components
//  5. app            -> reads all of the above and calls ReactDOM.createRoot().render()
import "./react-globals.js";

import "./styles.css";
import "./ui.css";

import "./weather.jsx";
import "./confetti.jsx";
import "./setup.jsx";
import "./countdown.jsx";
import "./getready.jsx";
import "./app.jsx";
