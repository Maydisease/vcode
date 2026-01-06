const plugin = window.dayjs_plugin_timezone;
if (!plugin) {
  throw new Error("dayjs plugin timezone UMD not loaded");
}
export default plugin;