import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
// Extend dayjs with the necessary plugins
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);
const calculateTime = (type) => {
    switch (type) {
        case "last15m":
            return [dayjs().subtract(15, "minute"), dayjs()];
        case "last30m":
            return [dayjs().subtract(30, "minute"), dayjs()];
        case "last1h":
            return [dayjs().subtract(1, "hour"), dayjs()];
        case "1d":
            // 今日，从今天的00:00到23:59
            return [dayjs().startOf("day"), dayjs().endOf("day")];
        case "last1d":
            return [dayjs().subtract(1, "day"), dayjs()];
        case "last15d":
            return [dayjs().subtract(15, "day"), dayjs()];
        case "last30d":
            return [dayjs().subtract(30, "day"), dayjs()];
        case "last60d":
            return [dayjs().subtract(60, "day"), dayjs()];
        case "last120d":
            return [dayjs().subtract(120, "day"), dayjs()];
        default:
            return [dayjs().subtract(1, "day"), dayjs()];
    }
};
export { calculateTime };
