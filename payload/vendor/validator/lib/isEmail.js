const validator = window.validator;
if (!validator) {
  throw new Error("validator UMD not loaded");
}
export default validator.isEmail;