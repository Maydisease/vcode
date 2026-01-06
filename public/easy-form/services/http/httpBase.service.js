import axios from "axios";
import { getShortIdUtl } from "@utils/getShortId.utl.js";
import lodash from "lodash";
import { message } from "antd";
import { HTTP_ERROR } from "./httpErrorEnums.js";
import { HttpErrorService } from "./httpError.service.js";
import { PROJECT_ENV } from "../../environment/index.js";
import EventEmitter from 'eventemitter3';
export var HTTP_METHOD_ENUM;
(function (HTTP_METHOD_ENUM) {
    HTTP_METHOD_ENUM["GET"] = "get";
    HTTP_METHOD_ENUM["POST"] = "post";
})(HTTP_METHOD_ENUM || (HTTP_METHOD_ENUM = {}));
const getHostContext = () => {
    const host = typeof window !== "undefined" ? window : {};
    return {
        hostAppName: host.__EASY_FORM_HOST_APP_NAME__ || host.APP_HOST_APP_NAME,
        isStandaloneMode: !!host.__EASY_FORM_STANDALONE_MODE__,
    };
};
class HttpBaseService extends HttpErrorService {
    generateReqKey(config) {
        const { method, url, params, data } = config;
        return getShortIdUtl([method, url, JSON.stringify(params), JSON.stringify(data)].join('&'));
    }
    // 添加请求
    addRequest(config) {
        const requestKey = this.generateReqKey(config);
        // 检查是否已经有一个取消令牌源存在
        if (!this.pendingRequests.has(requestKey)) {
            // 创建一个新的取消令牌源
            const source = axios.CancelToken.source();
            // 将取消令牌源与请求关联
            config.cancelToken = source.token;
            // 将请求键和取消令牌源存储在 pendingRequests 中
            this.pendingRequests.set(requestKey, source);
        }
        else {
            // 如果已经存在请求键对应的取消令牌源，从映射中获取并使用其 token
            const pendingSource = this.pendingRequests.get(requestKey);
            config.cancelToken = pendingSource ? pendingSource.token : undefined;
        }
    }
    // 移除请求
    removeRequest(config) {
        const requestKey = this.generateReqKey(config);
        if (this.pendingRequests.has(requestKey)) {
            const cancelTokenSource = this.pendingRequests.get(requestKey);
            cancelTokenSource && cancelTokenSource.cancel();
            this.pendingRequests.delete(requestKey);
        }
    }
    initConfig() {
        this.httpClient = axios.create({
            withCredentials: true
        });
        this.setRequestInterceptors(this.httpClient);
        this.setResponseInterceptors(this.httpClient);
    }
    setRequestHost() {
    }
    setRequestHeaders(config) {
        return new Promise((resolve) => {
            const headers = config.headers;
            if (!headers.has('content-type')) {
                headers.set('content-type', 'application/json');
            }
            resolve(true);
        });
    }
    setRequestInterceptors(httpClient) {
        httpClient.interceptors.request.use(async (config) => {
            await this.setRequestHeaders(config);
            return config;
        }, error => {
            // 对请求错误做些什么
            return Promise.reject(error);
        });
    }
    blob2Json(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = function (event) {
                const target = event.target;
                // 尝试解析 JSON 数据
                if (target) {
                    try {
                        const jsonObj = JSON.parse(target.result);
                        resolve(jsonObj);
                    }
                    catch (e) {
                        console.error("解析 JSON 失败：", e);
                    }
                }
            };
            reader.onerror = function (event) {
                const target = event.target;
                if (target) {
                    console.error("文件读取出错：", target.error);
                }
            };
            reader.readAsText(blob);
        });
    }
    async fileDownloadResponse(response, reqConfig) {
        // 当文件下载失败时，服务端将会下发json格式数据，这里手动转换为json，再构造一个response传递给 applicationJsonResponse
        if (response.config.responseType === 'blob' && response.data.type === 'application/json') {
            const data = await this.blob2Json(response.data);
            return this.applicationJsonResponse({ data }, reqConfig);
        }
        if (response.config.responseType === 'blob') {
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            // 从响应头 'content-disposition' 中解析出文件名
            const contentDisposition = response.headers['content-disposition'];
            let filename = '下载文件.xlsx'; // 默认文件名
            if (contentDisposition) {
                const fileNameMatch = contentDisposition.match(/filename="?(.+)"?/);
                if (fileNameMatch.length > 1) {
                    filename = decodeURI(fileNameMatch[1]);
                }
            }
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            return [null, null];
        }
    }
    captureTokenHasExpired() {
        const { hostAppName, isStandaloneMode } = getHostContext();
        if (hostAppName === "PUBLIC_WS" && !isStandaloneMode) {
            HttpBaseService.signOutTimer && clearTimeout(HttpBaseService.signOutTimer);
            HttpBaseService.signOutTimer = setTimeout(() => {
                document.location.href = document.location.origin;
            }, 2000);
        }
    }
    // json 形式的
    applicationJsonResponse(response, reqConfig) {
        const body = lodash.get(response, 'data', null);
        if (
            // 兼容 分页信息在body上的 数据结构体
            body.hasOwnProperty('pageSize') &&
            body.hasOwnProperty('current') &&
            body.hasOwnProperty('total')) {
            const pageSize = lodash.get(body, 'pageSize', undefined);
            const current = lodash.get(body, 'current', undefined);
            const total = lodash.get(body, 'total', undefined);
            body.data.__proto__.pageinfo = {
                pageSize: pageSize,
                current: current,
                total: total
            };
        }
        let result = [null, body.data];
        if (body.code !== 200) {
            let message = body.reason || body.message;
            const { interceptCode, isIntercept } = this.interceptError(body.code, message, reqConfig);
            if (interceptCode && HTTP_ERROR.TOKEN_HAS_EXPIRED.CODE.includes(interceptCode)) {
                HttpBaseService.errorEventEmitter.emit('TOKEN_HAS_EXPIRED', { code: interceptCode });
                this.captureTokenHasExpired();
            }
            result = [
                {
                    code: body.code,
                    message
                },
                body.data
            ];
        }
        return result;
    }
    captureStatus200Err(response, reqConfig) {
        if (response.headers) {
            const respContentType = response.headers.get("content-type");
            // 错误502，nginx 代理有问题时，状态码返回的是200，但是内容描述为 nginx 502
            if (respContentType && respContentType.indexOf("text/html") > -1) {
                this.interceptError(502, "", reqConfig);
            }
        }
    }
    outputEventEmit(response) {
        HttpBaseService.outputEvent.emit("HTTP-RESPONSE", response);
    }
    setResponseInterceptors(httpClient) {
        httpClient.interceptors.response.use(async (response) => {
            console.log('response:', response);
            this.outputEventEmit(response);
            const reqConfig = response.config;
            this.captureStatus200Err(response, reqConfig);
            // post文件下载类型的
            const fileDownloadResponse = await this.fileDownloadResponse(response, reqConfig);
            if (fileDownloadResponse) {
                return fileDownloadResponse;
            }
            // application/json
            const applicationJsonResponse = this.applicationJsonResponse(response, reqConfig);
            if (applicationJsonResponse) {
                return applicationJsonResponse;
            }
        }, async (error) => {
            if (error.code === HTTP_ERROR.ERR_NETWORK.CODE) {
                message.error(HTTP_ERROR.ERR_NETWORK.MESSAGE);
            }
            return [{
                code: error.code,
                message: error.message
            }, null];
        });
    }
    setEnvProxyPrefix(url) {
        // First, check for proxy rules from the main app (VCode settings)
        const appProxyRules = (typeof window !== 'undefined' && window.APP_PROXY_RULES) || [];
        // Get active host for variable replacement
        const activeHost = (typeof window !== 'undefined' && window.APP_ACTIVE_HOST) || '';
        // Then check PROJECT_ENV as fallback
        const envProxyMapping = lodash.get(PROJECT_ENV, "extend.APP_ENV_CONFIG.PROXY_MAPPING", []);

        // Combine both rule sources, app rules take priority
        const proxyMapping = [...appProxyRules.filter(r => r.enabled !== false), ...envProxyMapping];

        let origin = "";
        let _url = url;
        if (url.startsWith("http://") || url.startsWith("https://")) {
            const urlInst = new URL(url);
            _url = urlInst.href.replace(urlInst.origin, "");
            origin = urlInst.origin;
        }
        if (proxyMapping.length > 0) {
            let findItem = proxyMapping.find((rule) => _url.startsWith(rule.prefix));
            if (findItem) {
                // Replace {{HOST}} variable with active host
                let target = findItem.target;
                if (target.includes('{{HOST}}')) {
                    target = target.replace(/\{\{HOST\}\}/g, activeHost);
                }

                // If target is a full URL, we should route it through the local Rust proxy
                // instead of sending it directly to avoid CORS and SSL issues.
                // The Rust server (localhost:1422) is configured to handle these requests.
                if (target.startsWith("http://") || target.startsWith("https://")) {
                    return "http://localhost:1422" + _url;
                }
                // Otherwise just replace the prefix
                _url = _url.replace(findItem.prefix, target);
            }
        }
        return `${origin}${_url}`;
    }
    send(options) {
        const source = axios.CancelToken.source();
        const responseType = lodash.get(options, 'options.responseType', 'json') || 'json';
        const respCodeHandle = lodash.get(options, 'options.respCodeHandle', false);
        const headers = lodash.get(options, 'options.headers', undefined);
        const config = {
            method: options.method,
            url: options.url,
            params: options.params || {},
            data: options.data,
            cancelToken: source.token,
            withCredentials: true,
            responseType,
            respCodeHandle
        };
        if (headers) {
            config.headers = headers;
        }
        config.url = this.setEnvProxyPrefix(config.url);
        return this.httpClient.request(config);
    }
    constructor() {
        super();
        this.pendingRequests = new Map();
        this.initConfig();
    }
}
HttpBaseService.outputEvent = new EventEmitter();
export { HttpBaseService };
