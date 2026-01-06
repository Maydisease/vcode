const dayjs = window.dayjs;
if (!dayjs) {
  throw new Error("dayjs UMD not loaded");
}
export default dayjs;