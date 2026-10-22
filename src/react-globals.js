// The original prototype was a set of CDN <script> files that expected React and
// ReactDOM as window globals (e.g. `const { useState } = React`, `React.useState`,
// `ReactDOM.createRoot(...)`). We keep those files untouched and instead publish
// the same globals here. This module is imported FIRST in main.jsx, so the globals
// exist before any of the source modules evaluate.
import React from "react";
import * as ReactDOMClient from "react-dom/client";

window.React = React;
window.ReactDOM = ReactDOMClient;
