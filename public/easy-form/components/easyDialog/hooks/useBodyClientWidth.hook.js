import { useLayoutEffect, useState } from "react";
import lodash from "lodash";
function useBodyClientWidth() {
    const getBodyW = () => typeof document !== "undefined" ? document.body.clientWidth : 0;
    const [bodyW, setBodyW] = useState(getBodyW);
    useLayoutEffect(() => {
        if (typeof window === "undefined" || typeof document === "undefined")
            return;
        // 1) 优先监听 body 实际尺寸变化（更精确，包含滚动条出现/隐藏、布局变化等）
        let ro = null;
        if ("ResizeObserver" in window) {
            ro = new ResizeObserver(() => setBodyW(getBodyW()));
            ro.observe(document.body);
        }
        // 2) 兜底：窗口 resize 时也更新
        const onResize = lodash.throttle(() => setBodyW(getBodyW()), 100);
        window.addEventListener("resize", onResize);
        // 首次同步一下
        setBodyW(getBodyW());
        return () => {
            var _a;
            ro === null || ro === void 0 ? void 0 : ro.disconnect();
            window.removeEventListener("resize", onResize);
            (_a = onResize.cancel) === null || _a === void 0 ? void 0 : _a.call(onResize);
        };
    }, []);
    return bodyW;
}
export { useBodyClientWidth };
