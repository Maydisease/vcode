import { jsx as _jsx } from "react/jsx-runtime";
import React, { useEffect, useMemo, useState } from 'react';
import { AutoComplete, Input } from "antd";
import useFormDebugStore from "@components/easyForm/easyFormDebug/store/index.js";
import lodash from "lodash";
class WidgetText {
}
WidgetText.Render = (props) => {
    const config = props.config;
    const $value = props.value;
    const $onChange = props.onChange;
    const isArray = Array.isArray(config.data);
    const pureData = isArray ? config.data : [];
    const [isLoad, setLoading] = useState(false);
    const [data, setData] = useState(pureData);
    const [value, setValue] = useState($value);
    useEffect(() => {
        useFormDebugStore.getState().update(props.formId, `Widget(${config.type}):${config.name}`, `EasyFormUnit:${config.name}`);
    }, []);
    // 支持异步数据
    useEffect(() => {
        if (!isArray && lodash.isFunction(config.data)) {
            setLoading(true);
            config.data().then((response) => {
                setData(response || []);
                setLoading(false);
            });
        }
        else {
            setData(config.data || []);
        }
    }, [config.data]);
    // 支持搜索关键字
    const watchOptions = useMemo(() => {
        return data.map((item) => {
            if (!value || value === "") {
                return item;
            }
            const label = item.label || ""; // 防止 label 为 null 或 undefined
            const valueLower = `${value}`.toLowerCase(); // 将搜索值转换为小写
            const labelLower = label.toLowerCase(); // 将标签值转换为小写
            const searchPos = labelLower.indexOf(valueLower); // 忽略大小写匹配
            if (label && label.length > 0 && searchPos > -1) {
                // 安全转义函数，防止 XSS
                const escapeHTML = (str) => str.replace(/&/g, "&amp;")
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;")
                    .replace(/"/g, "&quot;")
                    .replace(/'/g, "&#039;");
                // 分割文本并高亮匹配部分
                const startText = escapeHTML(label.substring(0, searchPos)); // 匹配前的部分
                const markText = `<b style="color:#ff0000; font-weight: normal">${escapeHTML(label.substring(searchPos, searchPos + value.length))}</b>`; // 高亮部分
                const endText = escapeHTML(label.substring(searchPos + value.length)); // 匹配后的部分
                // 拼接 HTML
                const text = `${startText}${markText}${endText}`;
                return {
                    value: item.value,
                    label: _jsx("div", { dangerouslySetInnerHTML: { __html: text } }),
                };
            }
            // 如果没有匹配，返回原始项
            return item;
        });
    }, [data, $value]);
    return (_jsx(AutoComplete, { value: $value, options: watchOptions, onChange: $onChange, disabled: config.disabled, children: _jsx(Input, { autoComplete: "off", allowClear: true, style: { minWidth: 140 }, placeholder: config.placeholder, ...config.features, disabled: config.disabled }) }));
};
WidgetText.component = (props) => {
    return (_jsx(WidgetText.Render, { ...props }));
};
export { WidgetText };
