import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useEffect, useState } from "react";

import { EasyDialog } from "../index.js";
import { CheckCircleFilled, InfoCircleFilled, WarningFilled, CloseCircleFilled } from '@ant-design/icons';
import { Button } from "antd";
const EasyMessage = (props) => {
    const [openState, setOpenState] = useState(false);
    const [confirming, setConfirming] = useState(false);
    // 动画完成事件
    const animationendHandle = () => {
        if (!openState) {
            props.$destroy && props.$destroy(props.$type, props.$id);
        }
    };
    // 遮照点击关闭
    const widgetCloseHandle = (triggerCancel = true, data = undefined) => {
        setOpenState(false);
        if (triggerCancel) {
            props.onCancel && props.onCancel(data);
        }
    };
    // 绑定键盘esc的事件
    const keyboardCloseBindHandle = (evt) => {
        const isTopDrawer = EasyDialog.drawerListCount === props.level;
        if (evt.code === 'Escape' && isTopDrawer) {
            widgetCloseHandle();
        }
    };
    useEffect(() => {
        setOpenState(true);
        // 绑定一个 esc 键盘关闭事件
        document.addEventListener('keyup', keyboardCloseBindHandle);
        return () => {
            // 解绑一个 esc 键盘关闭事件
            document.removeEventListener('keyup', keyboardCloseBindHandle);
        };
    }, []);
    const maskActive = () => {
        return openState ? 'active' : '';
    };
    const extendAction = async (type) => {
        setConfirming(true);
        if (type === 'confirm') {
            props.onConfirm && props.onConfirm(void 0);
            widgetCloseHandle(false);
        }
        if (type === 'cancel') {
            widgetCloseHandle(true, void 0);
        }
        setConfirming(false);
    };
    const getIcon = (infoType) => {
        if (!infoType) {
            return InfoCircleFilled;
        }
        const config = {
            "info": InfoCircleFilled,
            "error": CloseCircleFilled,
            "success": CheckCircleFilled,
            "warning": WarningFilled,
        };
        return config[infoType];
    };
    const InfoTypeComponent = getIcon(props.infoType);
    return _jsxs("div", { className: 'easy-message-component-container', children: [_jsx("div", { className: `mask ${maskActive()}`, onClick: () => {
                    if (props.$maskClosable) {
                        extendAction('cancel');
                    }
                }, onTransitionEnd: () => {
                    animationendHandle();
                } }), _jsx("div", { className: `wrap ${openState ? 'active' : ''}`, children: _jsxs("div", { className: 'panel', children: [_jsxs("div", { className: 'body', children: [_jsxs("div", { className: 'title', children: [_jsx("span", { className: `icon ${props.infoType}`, children: _jsx(InfoTypeComponent, {}) }), _jsx("span", { children: props.$title })] }), _jsx("div", { className: 'content', children: props.content })] }), _jsx("div", { className: 'footer', children: _jsx("div", { className: 'action', children: _jsx(Button, { loading: confirming, type: 'primary', onClick: () => extendAction('cancel'), children: "\u597D\u7684" }) }) })] }) })] });
};
export default EasyMessage;
