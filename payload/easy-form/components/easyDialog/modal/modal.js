import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useEffect, useMemo, useRef, useState } from "react";

import { CloseOutlined } from '@ant-design/icons';
import { Button, message, Spin } from "antd";
import classNames from "classnames";
import lodash from "lodash";
const EasyModal = (props) => {
    const Guest = props.guest;
    const wrapRef = useRef(null);
    const [openState, setOpenState] = useState(false);
    const [confirming, setConfirming] = useState(false);
    const [isAnimeEnd, setIsAnimeEnd] = useState(false);
    const [activeTabValue, setActiveTabValue] = useState([]);
    const [extendTabs, setExtendTabs] = useState([]);
    const [extendFooter, setExtendFooter] = useState(null);
    const [loading, setLoading] = useState(false);
    const guestRef = useRef(null);
    const bodyRef = useRef(null);
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
    const configExtendTabs = (tabs, defaultValue) => {
        tabs = tabs.map((item, index) => {
            return {
                ...item,
                selected: item.value === defaultValue || index === 0
            };
        });
        const findSelectedTab = tabs.find((tab) => tab.selected);
        if (findSelectedTab) {
            setActiveTabValue(findSelectedTab.value);
        }
        setExtendTabs(tabs);
    };
    const configExtendFooter = (tpl) => {
        setExtendFooter(tpl);
    };
    // 遮照点击关闭
    const widgetCloseHandle = (triggerCancel = true, data = undefined) => {
        setOpenState(false);
        if (triggerCancel) {
            props.onCancel && props.onCancel(data);
        }
    };
    const triggerBtnLoad = (btnLoadState = false) => {
        setOpenState(btnLoadState);
    };
    // 绑定键盘esc的事件
    const keyboardCloseBindHandle = (evt) => {
        if (evt.code === 'Escape') {
            widgetCloseHandle();
        }
    };
    const asyncBodySizeToContainer = () => {
        const container = wrapRef.current;
        const body = bodyRef.current;
        if (container) {
            container.style.width = document.body.clientWidth + "px";
            container.style.height = document.body.clientHeight + "px";
        }
        if (body && props.frameless) {
            body.style.width = document.body.clientWidth + "px";
            body.style.height = document.body.clientHeight + "px";
        }
    };
    useEffect(() => {
        setTimeout(() => {
            setOpenState(true);
            asyncBodySizeToContainer();
        }, 100);
        // 绑定一个 esc 键盘关闭事件
        document.addEventListener('keyup', keyboardCloseBindHandle);
        window.addEventListener('resize', asyncBodySizeToContainer);
        return () => {
            // 解绑一个 esc 键盘关闭事件
            document.removeEventListener('keyup', keyboardCloseBindHandle);
            window.removeEventListener('resize', asyncBodySizeToContainer);
        };
    }, []);
    const maskActive = () => {
        return openState ? 'active' : '';
    };
    const extendAction = async (type) => {
        setConfirming(true);
        if (type === 'confirm') {
            let result;
            if (guestRef.current && guestRef.current.onConfirm) {
                result = await guestRef.current.onConfirm();
            }
            props.onConfirm && props.onConfirm(result);
            widgetCloseHandle(false);
        }
        if (type === 'cancel') {
            let result;
            if (guestRef.current && guestRef.current.onCancel) {
                result = await guestRef.current.onCancel();
            }
            widgetCloseHandle(true, result);
        }
        setConfirming(false);
    };
    const modalBodyStyle = useMemo(() => {
        let style = {
            maxHeight: props.$height,
            width: props.$width,
            height: props.$height
        };
        return style;
    }, []);
    const ExtendTabsRender = useMemo(() => {
        if (!extendTabs.length) {
            return;
        }
        return (_jsx("div", { className: 'extend-tabs', children: _jsx("div", { className: 'wrap', children: _jsx("div", { className: 'module-container', children: extendTabs.map((tab, index) => {
                        return (_jsx("div", { className: classNames('module', {
                                active: tab.selected
                            }), onClick: () => {
                                setExtendTabs((tabs) => {
                                    tabs = tabs.map((_tab) => {
                                        return {
                                            ..._tab,
                                            selected: _tab.value === tab.value
                                        };
                                    });
                                    return tabs;
                                });
                                setActiveTabValue(tab.value);
                            }, children: _jsx("div", { className: 'module-name', children: tab.label }) }, index));
                    }) }) }) }));
    }, [extendTabs]);
    const header = !props.hideHeader && !props.frameless ? (_jsxs("div", { className: 'header', children: [_jsx("div", { className: 'left', children: _jsx("span", { className: 'title', children: props.$title }) }), _jsx("div", { className: classNames('extend', {
                    lock: loading,
                }), children: _jsx(CloseOutlined, { onClick: () => extendAction('cancel') }) }), ExtendTabsRender] })) : void 0;
    const footer = !props.hideFooter && !props.frameless ? (_jsxs("div", { className: 'footer', children: [extendFooter, _jsx("div", { className: 'action', children: _jsx(Button, { disabled: loading, onClick: () => extendAction('cancel'), children: props.cancelText || '取消' }) }), _jsx("div", { className: 'action', children: _jsx(Button, { loading: loading, type: 'primary', onClick: () => extendAction('confirm'), children: props.confirmText || '确认' }) })] })) : void 0;
    return _jsxs("div", { className: classNames('easy-modal-component-container', {
            frameless: props.frameless
        }), ref: wrapRef, children: [_jsx("div", { className: `mask ${maskActive()}`, onTransitionEnd: () => {
                    animationendHandle();
                    setIsAnimeEnd(true);
                }, onClick: () => {
                    console.log('props.maskClosable', props);
                    if (props.$maskClosable) {
                        widgetCloseHandle();
                    }
                } }), _jsx("div", { className: 'container', onClick: (e) => {
                    let element = e.nativeEvent.target;
                    if (!element.closest('.easy-modal-component-panel')) {
                        if (props.$maskClosable) {
                            extendAction('cancel');
                        }
                    }
                }, children: _jsx("div", { className: `wrap ${openState ? 'active' : ''}`, children: _jsxs("div", { className: `easy-modal-component-panel ${openState ? 'active' : ''}`, children: [header, _jsxs("div", { className: 'body', ref: bodyRef, style: modalBodyStyle, children: [_jsx(Guest, { ref: guestRef, data: props.data, "$destroy": props.$destroy, "$type": props.$type, "$id": props.$id, "$bodyRef": bodyRef, "$activeTabValue": activeTabValue, "$extendAction": extendAction, "$trigger": {
                                            configExtendTabs,
                                            configExtendFooter,
                                            triggerLoading,
                                        }, "$triggerBtnLoad": triggerBtnLoad }), _jsx("div", { className: classNames("loading-lock", {
                                            active: loading,
                                        }), children: _jsxs("div", { className: 'icon', children: [_jsx(Spin, { spinning: loading }), _jsxs("span", { className: 'link', children: ["\u5904\u7406\u4E2D\uFF0C\u8BF7\u7B49\u5F85... ", _jsx("i", { onClick: () => {
                                                                triggerLoading('close');
                                                            }, children: "\u91CD\u8BD5" })] })] }) })] }), footer] }) }) })] });
};
export default EasyModal;
