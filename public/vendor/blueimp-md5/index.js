const md5 = window.md5;
if (!md5) {
  throw new Error("blueimp-md5 UMD not loaded");
}
export default md5;