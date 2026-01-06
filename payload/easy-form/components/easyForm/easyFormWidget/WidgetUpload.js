import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useEffect, useState } from 'react';
import { Popconfirm } from "antd";
import { DeleteFilled, UploadOutlined } from '@ant-design/icons';
import useFormDebugStore from "@components/easyForm/easyFormDebug/store/index.js";

class WidgetUpload {
}
WidgetUpload.Render = (props) => {
    const config = props.config;
    let $value = props.value;
    const $onChange = props.onChange;
    const isArray = Array.isArray(config.data);
    const pureData = isArray ? config.data : [];
    const [isLoad, setLoading] = useState(false);
    const [data, setData] = useState(pureData);
    const [tempFileInfo, setTempFileInfo] = useState();
    useEffect(() => {
        useFormDebugStore.getState().update(props.formId, `Widget(${config.type}):${config.name}`, `EasyFormUnit:${config.name}`);
    }, []);
    const fileUpload = (event) => {
        const files = event.target.files;
        const file = files === null || files === void 0 ? void 0 : files[0];
        if (files && file) {
            setTempFileInfo({
                name: file.name,
                type: file.type,
                size: file.size
            });
            $onChange({
                action: "upload",
                uploadFile: file,
                existFileList: data,
            });
        }
    };
    const deleteFileHandle = (removeId, file) => {
        $onChange({
            action: "remove",
            id: removeId,
            removeFile: file
        });
    };
    useEffect(() => {
        $value = data;
    }, [props.value]);
    useEffect(() => {
        console.log('更新了...');
    }, [config.data]);
    return (_jsx("div", { className: 'widget-upload-custom-container', children: _jsxs("div", { className: 'files', children: [_jsxs("div", { className: 'upload', children: [_jsx("div", { className: 'name', children: (tempFileInfo === null || tempFileInfo === void 0 ? void 0 : tempFileInfo.name) || $value }), _jsx("div", { className: 'spacer' }), _jsxs("div", { className: 'widget', children: [_jsx(UploadOutlined, {}), _jsx("input", { onChange: fileUpload, type: 'file' })] })] }), _jsx("div", { className: 'list', children: _jsx("div", { className: 'wrap', children: data.map((item) => {
                            return _jsxs("div", { className: 'file', children: [_jsx(Popconfirm, { title: "\u5220\u9664\u9644\u4EF6", description: "\u786E\u8BA4\u8981\u5220\u9664\u8FD9\u4E2A\u9644\u4EF6\u5417\uFF1F", okText: "\u662F", cancelText: "\u5426", onConfirm: () => {
                                            deleteFileHandle(item.id, item);
                                        }, children: _jsx("span", { className: 'delete', children: _jsx(DeleteFilled, {}) }) }), _jsxs("div", { className: 'name', children: [item.name, " ", item.type] })] }, item.id);
                        }) }) })] }) }));
};
WidgetUpload.component = (props) => {
    return (_jsx(WidgetUpload.Render, { ...props }));
};
export { WidgetUpload };
