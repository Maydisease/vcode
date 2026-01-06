const ReactDOM = window.ReactDOM;
if (!ReactDOM) {
  throw new Error("ReactDOM UMD not loaded");
}
export const createRoot = ReactDOM.createRoot;
export const hydrateRoot = ReactDOM.hydrateRoot;
export default { createRoot, hydrateRoot };