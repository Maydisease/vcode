import { jsx as _jsx } from "react/jsx-runtime";
import { Button, Dropdown, Popconfirm, Upload } from "antd";
import React, { useEffect, useState } from "react";
import lodash from "lodash";

import classNames from "classnames";
const BaseAction = (props) => {
    const showProps = () => {
        let isShow = true;
        if (!lodash.has(props, 'show')) {
            isShow = true;
        }
        else {
            isShow = !!props.show;
        }
        if (lodash.has(props, 'perm')) {
            isShow = !!props.perm;
        }
        return isShow;
    };
    useEffect(() => {
        setShow(showProps());
    }, [props.show, props.perm]);
    const [isShow, setShow] = useState(showProps());
    const [isLoading, setLoading] = useState(false);
    const onClickHandle = () => {
        // 顶部 批量操作按钮
        if (lodash.has(props, '__batch_ids') &&
            lodash.has(props, '__batch_data')) {
            let promiseTask = undefined;
            if (props.onHandle) {
                promiseTask = props.onHandle(props.__batch_ids, props.__batch_data);
                if (promiseTask && promiseTask instanceof Promise) {
                    setLoading(true);
                    promiseTask.then(() => {
                        props.__onHandle_callback && props.__onHandle_callback(props.onHandleAfterReloadData);
                        setLoading(false);
                    });
                }
            }
        }
        // 列表row action 按钮
        else if (lodash.has(props, '__table_record') &&
            lodash.has(props, '__table_index')) {
            let promiseTask = undefined;
            if (props.onHandle) {
                promiseTask = props.onHandle(props.__table_record_id, props.__table_record, props.__table_index);
                if (promiseTask && promiseTask instanceof Promise) {
                    setLoading(true);
                    promiseTask.then(() => {
                        props.__onHandle_callback && props.__onHandle_callback(props.onHandleAfterReloadData);
                        setLoading(false);
                    });
                }
            }
        }
        else {
            props.onHandle && props.onHandle();
        }
    };
    const renderButton = (children) => {
        // 如果是上传组件
        if (props.isUpload) {
            return (_jsx(Upload, { fileList: [], customRequest: (options) => {
                    props.onUploadHandle && props.onUploadHandle(options.file, options);
                }, children: children }));
        }
        // 如果是二次确认组件
        if (props.secTip) {
            return (_jsx(Popconfirm, { disabled: props.disabled, title: _jsx("div", { style: { maxWidth: 300 }, children: props.secTip }), onConfirm: (e) => {
                    if (!e) {
                        return;
                    }
                    e.stopPropagation();
                    e.preventDefault();
                    onClickHandle();
                }, onCancel: (e) => {
                    if (!e) {
                        return;
                    }
                    e.stopPropagation();
                    e.preventDefault();
                    props.onCancelHandle && props.onCancelHandle(e);
                }, okText: "\u786E\u8BA4", cancelText: "\u53D6\u6D88", children: children }));
        }
        // 如果是下拉组件
        if (props.dropdown &&
            lodash.isArray(props.dropdown) &&
            props.dropdown.length) {
            const items = props.dropdown.map((item) => {
                return {
                    key: item.value,
                    label: item.label
                };
            });
            return (_jsx(Dropdown, { disabled: props.disabled, menu: {
                    items,
                    onClick: ({ key }) => {
                        if (lodash.has(props, '__batch_ids') &&
                            lodash.has(props, '__batch_data')) {
                            if (props.onDropdownHandle) {
                                let promiseTask = props.onDropdownHandle(key, props.__batch_ids, props.__batch_data);
                                if (promiseTask && promiseTask instanceof Promise) {
                                    setLoading(true);
                                    promiseTask.then(() => {
                                        props.__onHandle_callback && props.__onHandle_callback(props.onHandleAfterReloadData);
                                        setLoading(false);
                                    });
                                }
                            }
                        }
                    }
                }, children: children }));
        }
        // 否则默认为按钮兜底
        return children;
    };
    const typeProps = () => {
        let type = 'default';
        if (props.buttonStyle === 'link') {
            type = 'link';
        }
        if (props.btnType) {
            type = props.btnType;
        }
        return {
            type: type
        };
    };
    const onClickProps = () => {
        if (props.isUpload) {
            return {};
        }
        if (!props.secTip) {
            return {
                onClick: (e) => {
                    onClickHandle();
                }
            };
        }
        else {
            return {};
        }
    };
    const paddingStyle = () => {
        return props.buttonStyle === 'link' ? {
            padding: `${0}px ${0}px`
        } : {};
    };
    const buttonStyle = props.buttonStyle;
    return _jsx("div", { className: classNames(buttonStyle, {
            "easy-table-action-btn": true,
            'show': isShow
        }), style: lodash.get(props, 'style', {}), children: renderButton(_jsx(Button, { loading: props.buttonStyle !== 'link' ? isLoading : false, disabled: props.disabled, icon: props.icon, danger: props.isDanger, style: { ...paddingStyle() }, ...typeProps(), ...onClickProps(), children: _jsx("span", { children: props.label }) })) });
};
export default BaseAction;
