const cssinjs = window.antdCssinjs;
if (!cssinjs) {
  throw new Error("@ant-design/cssinjs UMD not loaded");
}
export default cssinjs;
export const Keyframes = cssinjs.Keyframes;
export const NaNLinter = cssinjs.NaNLinter;
export const StyleProvider = cssinjs.StyleProvider;
export const Theme = cssinjs.Theme;
export const _experimental = cssinjs._experimental;
export const createCache = cssinjs.createCache;
export const createTheme = cssinjs.createTheme;
export const extractStyle = cssinjs.extractStyle;
export const getComputedToken = cssinjs.getComputedToken;
export const legacyLogicalPropertiesTransformer = cssinjs.legacyLogicalPropertiesTransformer;
export const legacyNotSelectorLinter = cssinjs.legacyNotSelectorLinter;
export const logicalPropertiesLinter = cssinjs.logicalPropertiesLinter;
export const parentSelectorLinter = cssinjs.parentSelectorLinter;
export const px2remTransformer = cssinjs.px2remTransformer;
export const token2CSSVar = cssinjs.token2CSSVar;
export const unit = cssinjs.unit;
export const useCSSVarRegister = cssinjs.useCSSVarRegister;
export const useCacheToken = cssinjs.useCacheToken;
export const useStyleRegister = cssinjs.useStyleRegister;