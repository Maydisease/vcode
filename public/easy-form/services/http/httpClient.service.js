import { HTTP_METHOD_ENUM, HttpBaseService } from "./httpBase.service.js";
import { AxiosHeaders } from "axios";
export class HttpClientService extends HttpBaseService {
    constructor() {
        super();
    }
    post(url, data, options) {
        return this.send({
            url,
            method: HTTP_METHOD_ENUM.POST,
            data,
            options
        });
    }
    uploadInfo(url, params, options = {}) {
        const formData = new FormData();
        if (params.files instanceof File) {
            formData.append('file', params.files);
        }
        if (params.files instanceof FileList) {
            for (let i = 0; i < params.files.length; i++) {
                const file = params.files[i];
                formData.append('files[]', file);
            }
        }
        for (let key in params) {
            if (key !== 'files') {
                formData.append(key, params[key]);
            }
        }
        let headers = new AxiosHeaders();
        headers.set('Content-Type', 'multipart/form-data');
        if (options) {
            options = { ...options, headers };
        }
        else {
            options = {};
        }
        return this.send({
            url,
            method: HTTP_METHOD_ENUM.POST,
            data: formData,
            options
        });
    }
    upload(url, files, options = {}) {
        const formData = new FormData();
        if (files instanceof File) {
            formData.append('file', files);
        }
        if (files instanceof FileList) {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                formData.append('files[]', file);
            }
        }
        let headers = new AxiosHeaders();
        headers.set('Content-Type', 'multipart/form-data');
        if (options) {
            options = { ...options, headers };
        }
        else {
            options = {};
        }
        return this.send({
            url,
            method: HTTP_METHOD_ENUM.POST,
            data: formData,
            options
        });
    }
    download(url, data, options = {}) {
        return this.send({
            url,
            method: HTTP_METHOD_ENUM.POST,
            data,
            options: { ...options, responseType: "blob" }
        });
    }
    get(url, params) {
        return this.send({
            url,
            method: HTTP_METHOD_ENUM.GET,
            params,
        });
    }
}
const httpClient = new HttpClientService();
export { httpClient };
