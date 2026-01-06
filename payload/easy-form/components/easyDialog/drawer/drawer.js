import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useEffect, useMemo, useRef, useState } from "react";

import { EasyDialog } from "../index.js";
import { CloseOutlined } from '@ant-design/icons';
import { Button, message, Spin } from "antd";
import lodash from "lodash";
import classNames from "classnames";
import { DrawerService } from "@components/easyDialog/drawer/drawer.service.js";
import { CaretLeftOutlined } from '@ant-design/icons';
import { useBodyClientWidth } from "@components/easyDialog/hooks/useBodyClientWidth.hook.js";
const navigateTo = (to) => {
    if (!to)
        return;
    if (to.startsWith("#")) {
        window.location.hash = to;
        return;
    }
    if (to.startsWith("/")) {
        window.location.hash = `#${to}`;
        return;
    }
    window.location.href = to;
};
const EasyDrawer = (props) => {
    var _a, _b;
    const Guest = props.guest;
    const [openState, setOpenState] = useState(false);
    const [confirming, setConfirming] = useState(false);
    const [loading, setLoading] = useState(false);
    const [parentOpenState, setParentOpenState] = useState(false);
    const guestRef = useRef(null);
    const bodyW = useBodyClientWidth();
    const triggerLoading = (state, options) => {
        const timeout = lodash.get(options, "timeout", 0);
        const msg = lodash.get(options, "msg", undefined);
        if (state === "open") {
            setLoading(true);
            if (timeout) {
                setTimeout(() => {
                    if (loading) {
                        setLoading(false);
                        if (msg) {
                            message.warning(msg);
                        }
                    }
                }, timeout);
            }
        }
        if (state === "close") {
            setLoading(false);
        }
    };
    // 动画完成事件
    const animationendHandle = () => {
        if (!openState) {
            props.$destroy && props.$destroy(props.$type, props.$id);
        }
    };
    // 遮照点击关闭
    const widgetCloseHandle = (triggerCancel = true, data = undefined, level = props.level) => {
        setOpenState(false);
        if (triggerCancel) {
            props.onCancel && props.onCancel(data);
        }
    };
    // 绑定键盘esc的事件
    const keyboardCloseBindHandle = (evt) => {
        let topStackItem = DrawerService.getTopStackItem();
        if (topStackItem) {
            if (topStackItem.id === props.$id && evt.code === 'Escape') {
                extendAction('cancel');
            }
        }
    };
    const activation = () => {
        setParentOpenState(true);
    };
    const deactivation = () => {
        setParentOpenState(false);
    };
    useEffect(() => {
        let topStackItem = DrawerService.getTopStackItem();
        if (topStackItem) {
            topStackItem.method.activation();
        }
        DrawerService.addQueueStackItem({
            id: props.$id,
            method: {
                activation,
                deactivation
            }
        });
        setOpenState(true);
        document.addEventListener('keyup', keyboardCloseBindHandle);
        return () => {
            // 解绑一个 esc 键盘关闭事件
            if (EasyDialog.drawerListCount === 1) {
                document.removeEventListener('keyup', keyboardCloseBindHandle);
            }
        };
    }, []);
    const maskActive = () => {
        // 如果是打开状态时，如果层级大于 1 那么将使用更淡的透明度，否则就使用0.5透明度
        // 以防止打开3层mark太黑了
        return openState ? (props.level > 1 ? 'active-2' : 'active') : '';
    };
    const triggerBtnLoad = (btnLoadState = false) => {
        setOpenState(btnLoadState);
    };
    const extendAction = async (type) => {
        DrawerService.popQueueStackItem();
        let topStackItem = DrawerService.getTopStackItem();
        if (topStackItem) {
            topStackItem.method.deactivation();
        }
        if (type === 'confirm') {
            let result;
            if (guestRef.current && guestRef.current.onConfirm) {
                result = await guestRef.current.onConfirm();
            }
            widgetCloseHandle(false, result);
            props.onConfirm && props.onConfirm(result);
        }
        if (type === 'cancel') {
            let result;
            if (guestRef.current && guestRef.current.onCancel) {
                result = await guestRef.current.onCancel();
            }
            widgetCloseHandle(true, result);
            props.onCancel && props.onCancel(result);
        }
        setConfirming(false);
    };
    const header = !props.hideHeader ? (_jsxs("div", { className: 'header', children: [_jsxs("div", { className: 'left', children: [_jsx("span", { className: 'icon', onClick: () => extendAction('cancel'), children: _jsx(CloseOutlined, {}) }), _jsx("span", { style: { marginLeft: 10 }, className: 'title', children: props.$title }), ((_a = props.$headCallback) === null || _a === void 0 ? void 0 : _a.label) ? (_jsxs("div", { className: 'callback', onClick: () => {
                            const to = lodash.get(props, '$headCallback.callUrl.to', undefined);
                            if (to) {
                                navigateTo(to);
                            }
                        }, children: [_jsx("i", { children: _jsx(CaretLeftOutlined, {}) }), _jsx("span", { children: (_b = props.$headCallback) === null || _b === void 0 ? void 0 : _b.label })] })) : void 0] }), _jsxs("div", { className: 'extend', children: [_jsx("div", { className: 'action', children: _jsx(Button, { onClick: () => extendAction('cancel'), children: props.cancelText || '取消' }) }), _jsx("div", { className: 'action', children: _jsx(Button, { loading: confirming, type: 'primary', onClick: () => extendAction('confirm'), children: props.confirmText || '确认' }) })] })] })) : void 0;
    const propBodyWidth = useMemo(() => {
        if (lodash.isNumber(props.$width)) {
            return props.$width;
        }
        if (props.$width === "auto") {
            const offset = 80;
            return Math.max(0, bodyW - offset);
        }
        return undefined;
    }, [props.$width, bodyW]);
    const propBodyPaddingStyle = useMemo(() => {
        const style = {};
        if (props.frameless) {
            style.padding = 0;
        }
        return style;
    }, []);
    return _jsxs("div", { className: 'easy-drawer-component-container', children: [_jsx("div", { className: `mask ${maskActive()}`, onClick: () => {
                    if (props.$maskClosable) {
                        extendAction('cancel');
                    }
                    // extendAction('cancel')
                }, onTransitionEnd: () => {
                    animationendHandle();
                } }), _jsx("div", { className: `wrap ${openState ? 'active' : ''} ${parentOpenState ? 'parent-in' : ''}`, children: _jsxs("div", { className: 'panel', children: [header, _jsxs("div", { className: 'body', style: {
                                width: propBodyWidth,
                                ...propBodyPaddingStyle
                            }, children: [_jsx(Guest, { ref: guestRef, data: props.data, "$destroy": props.$destroy, "$type": props.$type, "$id": props.$id, "$headCallback": props.$headCallback, "$extendAction": extendAction, "$trigger": {
                                        triggerLoading
                                    }, "$triggerBtnLoad": triggerBtnLoad }), _jsx("div", { className: classNames("loading-lock", {
                                        active: loading,
                                    }), children: _jsxs("div", { className: 'icon', children: [_jsx(Spin, { spinning: loading }), _jsxs("span", { className: 'link', children: ["\u5904\u7406\u4E2D\uFF0C\u8BF7\u7B49\u5F85... ", _jsx("i", { onClick: () => {
                                                            triggerLoading('close');
                                                        }, children: "\u91CD\u8BD5" })] })] }) })] })] }) })] });
};
export default EasyDrawer;
