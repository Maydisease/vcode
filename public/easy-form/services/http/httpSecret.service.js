import httpSecretInit, { secret_run as secretEncode } from "../../lib/xReqId/httpSecret.js";
class HttpSecretService {
    constructor() {
        this.isLoading = false;
    }
    init() {
        var _a, _b, _c;
        let origin = document.location.origin;
        // if (PackageWrap.hostAppName === "PUBLIC_WS" && !PackageWrap.isStandaloneMode) {
        //     try {
        //         const v2EasyCoreConfig = JSON.parse(window.sessionStorage.getItem('V2_EASY_CORE_CONFIG') as string || '{}');
        //         origin = lodash.get(v2EasyCoreConfig, 'origin', document.location.origin);
        //         console.log('origin:', origin);
        //     } catch (err) {
        //         console.warn('获取 V2_EASY_CORE_CONFIG 解析失败.');
        //     }
        // }
        const host = typeof window !== "undefined" ? window : {};
        const isDev = host.APP_IS_DEVELOPMENT !== false;
        const projectName = host.__EASY_FORM_PROJECT_NAME__ ||
            ((_c = (_b = (_a = host.process) === null || _a === void 0 ? void 0 : _a.env) === null || _b === void 0 ? void 0 : _b.APP_INFO) === null || _c === void 0 ? void 0 : _c.PROJECT_NAME);
        let wasm_url = "";
        if (isDev || !projectName) {
            wasm_url = `${origin}/httpSecret/lib.wasm`;
        }
        else {
            wasm_url = `${origin}/webui-${projectName}/httpSecret/lib.wasm`;
        }
        return new Promise(async (resolve, reject) => {
            if (!this.isLoading) {
                await httpSecretInit(wasm_url);
                this.isLoading = true;
            }
            resolve(true);
        });
    }
    encode(payload) {
        return JSON.parse(secretEncode(JSON.stringify(payload)));
    }
}
const httpSecretService = new HttpSecretService();
export { httpSecretService };
