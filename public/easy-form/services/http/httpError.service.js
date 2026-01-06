import { HTTP_ERROR } from "./httpErrorEnums.js";
import lodash from "lodash";
import { message } from "antd";
import md5 from 'blueimp-md5';
import { getShortIdUtl } from "@utils/getShortId.utl.js";
import EventEmitter from "eventemitter3";
class HttpErrorService {
    constructor() {
        this.timer = null;
    }
    interceptError(code, errMsg, reqConfig) {
        let isIntercept = false;
        let interceptCode = null;
        let interceptMsg = null;
        // 内置错误处理
        for (let key in HTTP_ERROR) {
            if (lodash.has(HTTP_ERROR, key)) {
                const item = lodash.get(HTTP_ERROR, `[${key}]`, undefined);
                if (item) {
                    const codes = lodash.get(item, 'CODE', []);
                    const msg = lodash.get(item, 'MESSAGE', undefined);
                    if (codes.includes(code)) {
                        const hash = md5(getShortIdUtl(JSON.stringify(codes)));
                        if (!HttpErrorService.ErrorClosureStore.has(hash)) {
                            message.error(msg);
                            HttpErrorService.ErrorClosureStore.add(hash);
                            isIntercept = true;
                            interceptCode = code;
                            interceptMsg = msg;
                            clearTimeout(this.timer);
                            this.timer = setTimeout(() => {
                                HttpErrorService.ErrorClosureStore.delete(hash);
                            }, 1000);
                        }
                    }
                }
            }
        }
        // 常规错误处理
        if (!isIntercept) {
            interceptCode = code;
            isIntercept = true;
            let msg = errMsg;
            let isRespCodeHandleAll = (typeof reqConfig.respCodeHandle === 'boolean' &&
                reqConfig.respCodeHandle);
            let isRespCodeHandle = (reqConfig.respCodeHandle &&
                Array.isArray(reqConfig.respCodeHandle) &&
                reqConfig.respCodeHandle.includes(code));
            // 请求方拦截了msg，这里将不展示错误消息
            if (isRespCodeHandleAll || isRespCodeHandle) {
                msg = "";
            }
            if (msg) {
                message.error(msg);
            }
        }
        return { isIntercept, interceptCode, interceptMsg };
    }
}
HttpErrorService.errorEventEmitter = new EventEmitter();
HttpErrorService.ErrorClosureStore = new Set();
export { HttpErrorService };
