const plugin = window.dayjs_plugin_isSameOrAfter;
if (!plugin) {
  throw new Error("dayjs plugin isSameOrAfter UMD not loaded");
}
export default plugin;