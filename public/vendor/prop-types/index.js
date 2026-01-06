const PropTypes = window.PropTypes;
if (!PropTypes) {
  throw new Error("prop-types UMD not loaded");
}
export default PropTypes;
export const array = PropTypes.array;
export const bigint = PropTypes.bigint;
export const bool = PropTypes.bool;
export const func = PropTypes.func;
export const number = PropTypes.number;
export const object = PropTypes.object;
export const string = PropTypes.string;
export const symbol = PropTypes.symbol;
export const any = PropTypes.any;
export const arrayOf = PropTypes.arrayOf;
export const element = PropTypes.element;
export const elementType = PropTypes.elementType;
export const instanceOf = PropTypes.instanceOf;
export const node = PropTypes.node;
export const objectOf = PropTypes.objectOf;
export const oneOf = PropTypes.oneOf;
export const oneOfType = PropTypes.oneOfType;
export const shape = PropTypes.shape;
export const exact = PropTypes.exact;
export const checkPropTypes = PropTypes.checkPropTypes;
export const resetWarningCache = PropTypes.resetWarningCache;