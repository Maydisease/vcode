var _a;
import { jsx as _jsx } from "react/jsx-runtime";
import antd, { ConfigProvider } from 'antd';
import React, { forwardRef } from 'react';
import { createRoot } from "react-dom/client";
import { getRandomIdUtil } from "@utils/getRandom.util.js";
import EventEmitter from "eventemitter3";
import { ListService } from "@services/List.service.js";
import EasyDrawer from "./drawer/drawer.js";

import lodash from "lodash";
import { StyleProvider, px2remTransformer, legacyLogicalPropertiesTransformer } from '@ant-design/cssinjs';
import EasyModal from "./modal/modal.js";
import EasyConfirm from "./confirm/confirm.js";
import EasyMessage from "./message/message.js";
import { antdComponentsTheme } from "@config/antdTheme.js";
import { WORKSPACE_PROJECT_CONFIG } from "../../environment/index.js";
const px2rem = px2remTransformer({
    rootValue: 100, // 32px = 1rem; @default 16,
});
const styleProviderTransformers = [legacyLogicalPropertiesTransformer];
if (!WORKSPACE_PROJECT_CONFIG.disablePx2Rem) {
    styleProviderTransformers.push(px2rem);
}
const zhCN = (_a = antd === null || antd === void 0 ? void 0 : antd.locales) === null || _a === void 0 ? void 0 : _a.zh_CN;
const getOverlayContainer = () => {
    return window.__EASY_FORM_SHADOW_ROOT__ || document.body;
};
const getOverlayZIndex = () => {
    const config = window.__EASY_FORM_CONFIG__;
    return lodash.get(config, 'uiLayout.overlayContainer.zIndex', undefined);
};
export var DialogComponentTypeEnum;
(function (DialogComponentTypeEnum) {
    DialogComponentTypeEnum["modal"] = "modal";
    DialogComponentTypeEnum["drawer"] = "drawer";
    DialogComponentTypeEnum["message"] = "message";
    DialogComponentTypeEnum["confirm"] = "confirm";
})(DialogComponentTypeEnum || (DialogComponentTypeEnum = {}));
export let mousePosition;
const getClickPosition = (e) => {
    mousePosition = {
        x: e.pageX,
        y: e.pageY,
    };
    // 100ms 内发生过点击事件，则从点击位置动画展示
    // 否则直接 zoom 展示
    // 这样可以兼容非点击方式展开
    setTimeout(() => {
        mousePosition = null;
    }, 100);
};
document.documentElement.addEventListener('click', getClickPosition, true);
export class EasyDialog {
    constructor() {
        this.antdStyleWrapper = (children) => {
            return (_jsx(ConfigProvider, { prefixCls: 'v5-antd', iconPrefixCls: 'v5-antd', theme: antdComponentsTheme, locale: zhCN, getPopupContainer: () => getOverlayContainer(), children: _jsx(StyleProvider, { hashPriority: "high", container: getOverlayContainer(), transformers: styleProviderTransformers, children: children }) }));
        };
    }
    renderDrawer(type, options, id, mountContainer) {
        if (this.root &&
            this.mountContainer &&
            type === DialogComponentTypeEnum.drawer &&
            options.component) {
            EasyDialog.drawerListCount++;
            this.root.render(this.antdStyleWrapper(_jsx(EasyDrawer, { level: EasyDialog.drawerListCount, ...options.props, guest: options.component, frameless: options.frameless, hideHeader: options.hideHeader, confirmText: options.confirmText, cancelText: options.cancelText })));
            EasyDialog.drawerList.push({ id, type, root: this.root, mountContainer: this.mountContainer, hide: false });
        }
    }
    renderModal(type, options, id, mountContainer) {
        if (this.root &&
            this.mountContainer &&
            type === DialogComponentTypeEnum.modal &&
            options.component) {
            EasyDialog.modalListCount++;
            this.root.render(this.antdStyleWrapper(_jsx(EasyModal, { level: EasyDialog.modalListCount, ...options.props, data: options.data, guest: options.component, frameless: options.frameless, hideHeader: options.hideHeader, hideFooter: options.hideFooter, confirmText: options.confirmText, cancelText: options.cancelText })));
            EasyDialog.modalList.push({ id, type, root: this.root, mountContainer: this.mountContainer, hide: false });
        }
    }
    renderConfirm(type, options, id, mountContainer) {
        if (this.root &&
            this.mountContainer &&
            type === DialogComponentTypeEnum.confirm &&
            options.content) {
            EasyDialog.confirmListCount++;
            this.root.render(this.antdStyleWrapper(_jsx(EasyConfirm, { level: EasyDialog.confirmListCount, ...options.props, content: options.content })));
            EasyDialog.confirmList.push({ id, type, root: this.root, mountContainer: this.mountContainer, hide: false });
        }
    }
    renderMessage(type, options, id, mountContainer) {
        if (this.root &&
            this.mountContainer &&
            type === DialogComponentTypeEnum.message &&
            options.content) {
            EasyDialog.confirmListCount++;
            this.root.render(this.antdStyleWrapper(_jsx(EasyMessage, { level: EasyDialog.messageListCount, ...options.props, infoType: options.infoType, content: options.content })));
            EasyDialog.messageList.push({ id, type, root: this.root, mountContainer: this.mountContainer, hide: false });
        }
    }
    render(options, type) {
        const querySelector = `easy-${type}-overlay-container`;
        this.mountContainer = document.createElement('div');
        // 允许初始化pkg时，传递层级关系进来;
        const overlayContainerZIndex = getOverlayZIndex();
        if (overlayContainerZIndex !== undefined) {
            this.mountContainer.style.zIndex = `${overlayContainerZIndex}`;
        }
        if (!this.root) {
            this.root = createRoot(this.mountContainer);
        }
        const id = getRandomIdUtil();
        this.mountContainer.className = querySelector;
        if (options.props) {
            options.props.$destroy = this.$destroy.bind(this);
            options.props.$id = id;
            options.props.$type = type;
            options.props.$title = options.title;
            options.props.$width = options.width;
            options.props.$height = options.height;
            options.props.$headCallback = options.headCallback;
            options.props.$event = EasyDialog.eventEmitter;
            options.props.$maskClosable = lodash.get(options, 'maskClosable', false);
            if (options.data) {
                options.props.data = options.data;
            }
        }
        this.renderDrawer(type, options, id, this.mountContainer);
        this.renderModal(type, options, id, this.mountContainer);
        this.renderConfirm(type, options, id, this.mountContainer);
        this.renderMessage(type, options, id, this.mountContainer);
        getOverlayContainer().appendChild(this.mountContainer);
    }
    $destroy() {
        this.root.unmount();
        this.mountContainer.remove();
        this.root = undefined;
        this.mountContainer = undefined;
    }
    open(options, type) {
        this.render(options, type);
    }
    modal(title, context, onConfirm, onCancel) {
        this.open({
            title,
            hideHeader: context.hideHeader,
            hideFooter: context.hideFooter,
            confirmText: context.confirmText,
            cancelText: context.cancelText,
            component: context.component,
            maskClosable: context.maskClosable,
            width: context.width,
            height: context.height,
            data: context.data,
            frameless: context.frameless,
            props: {
                onConfirm,
                onCancel
            }
        }, DialogComponentTypeEnum.modal);
    }
    drawer(title, context, onConfirm, onCancel) {
        this.open({
            title,
            component: context.component,
            maskClosable: context.maskClosable,
            hideHeader: context.hideHeader,
            confirmText: context.confirmText,
            cancelText: context.cancelText,
            width: context.width,
            data: context.data,
            headCallback: context.headCallback,
            frameless: context.frameless,
            props: {
                onConfirm,
                onCancel
            }
        }, DialogComponentTypeEnum.drawer);
    }
    message(infoType, title, content, onConfirm, onCancel) {
        this.open({
            title,
            content,
            infoType,
            props: { onConfirm, onCancel }
        }, DialogComponentTypeEnum.message);
    }
    confirm(title, content, onConfirm, onCancel) {
        this.open({
            title,
            content,
            props: { onConfirm, onCancel }
        }, DialogComponentTypeEnum.confirm);
    }
}
EasyDialog.drawerList = new ListService();
EasyDialog.drawerListCount = 0;
EasyDialog.modalList = new ListService();
EasyDialog.modalListCount = 0;
EasyDialog.confirmList = new ListService();
EasyDialog.confirmListCount = 0;
EasyDialog.messageList = new ListService();
EasyDialog.messageListCount = 0;
EasyDialog.eventEmitter = new EventEmitter();

export function dialogWrapper(Component) {
    const ForwardedComponent = (props, ref) => {
        return (_jsx(Component, { ...props, forwardedRef: ref }));
    };
    return forwardRef(ForwardedComponent);
}

export default EasyDialog;
