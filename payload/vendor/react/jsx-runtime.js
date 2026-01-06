const React = window.React;
if (!React) {
  throw new Error("React UMD not loaded");
}
const { createElement, Fragment } = React;
const withKey = (props, key) => {
  if (key === undefined) return props || null;
  return Object.assign({}, props, { key });
};
export const jsx = (type, props, key) => createElement(type, withKey(props, key));
export const jsxs = jsx;
export const jsxDEV = jsx;
export { Fragment };
export default { jsx, jsxs, Fragment };