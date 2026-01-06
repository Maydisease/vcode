import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useEffect, useMemo, useState } from "react";
import { Dropdown, Radio } from "antd";
import lodash from "lodash";

import EasyContainer from "@components/easyContainer/index.js";
import classNames from "classnames";
import { EasyDialog } from "@components/easyDialog/index.js";
import ModifyTitleModal from "@components/easyTable/modifyTitleModal.js";
const EasyTableLayout = (props, context) => {
    const defaultTabKey = lodash.get(props, 'tabs[0].value', undefined);
    const [selectedTabKey, setSelectedTabKey] = useState(props.defaultTabKey || defaultTabKey);
    const [layoutTitle, setLayoutTitle] = useState(undefined);
    let tableRefs = {};
    let tableEventInit = () => {
        setTimeout(() => {
            let diffKey = `${selectedTabKey}`;
            for (let key in tableRefs) {
                if (tableRefs[key]) {
                    let ref = tableRefs[key]();
                    ref.clearRowSelection();
                    if (key === diffKey && !props.disabledReloadData) {
                        ref.loadDataList(true);
                    }
                }
            }
        }, 0);
    };
    const onTabChangeHandle = (value) => {
        setSelectedTabKey(value);
        setLayoutTitle(undefined);
        props.onTabsChange && props.onTabsChange(value);
        tableEventInit();
    };
    useEffect(() => {
        if (lodash.has(props, 'defaultTabKey')) {
            onTabChangeHandle(props.defaultTabKey);
        }
    }, [props.defaultTabKey]);
    const tabs = props.tabs && props.tabs.length > 0 ? (_jsx("div", { className: classNames('tabs'), style: {
            display: props.hideTabs ? "none" : "block"
        }, children: _jsx(Radio.Group, { value: selectedTabKey, optionType: "button", buttonStyle: "solid", options: props.tabs, onChange: (ev) => {
                onTabChangeHandle(ev.target.value);
            } }) })) : void 0;
    const isGodMode = useMemo(() => {
        const searchParams = new URL(document.location.href).searchParams;
        return searchParams.has("gm");
    }, []);
    const titleRender = () => {
        let titleText = layoutTitle || props.title || "查询列表";
        const items = [
            {
                label: '修改标题',
                key: '1',
                onClick: () => {
                    new EasyDialog().modal('修改标题', {
                        component: ModifyTitleModal,
                        width: 500,
                        data: {
                            record: {
                                title: titleText
                            }
                        },
                    }, (newTitle) => {
                        setLayoutTitle(newTitle);
                    });
                }
            },
        ];
        const title = (_jsx("div", { className: classNames('title', {
                'is-god-mode': isGodMode
            }), children: titleText }));
        if (isGodMode) {
            return (_jsx(Dropdown, { menu: { items }, trigger: ['contextMenu'], children: title }));
        }
        if (props.hideTitle) {
            return _jsx(_Fragment, {});
        }
        return title;
    };
    const desc = props.desc ? props.desc : void 0;
    const showChildren = (key) => {
        if (lodash.get(props, 'tabs', []).length === 0) {
            return true;
        }
        if (key === selectedTabKey) {
            return true;
        }
    };
    const updateTitle = (title) => {
        title && setLayoutTitle(title);
    };
    const propsChildren = () => {
        return React.Children.map(props.children, (child, index) => {
            if (React.isValidElement(child)) {
                const tabKey = lodash.get(child, 'props.tabKey', undefined);
                if (showChildren(tabKey)) {
                    return React.cloneElement(child, {
                        __$parentTabKey: selectedTabKey,
                        __$parentUpdateTitle: updateTitle,
                        __$parentLayoutHooks: {
                            updateRef: (key, ref) => {
                                tableRefs[key] = ref;
                            }
                        }
                    });
                }
            }
            return void 0;
        });
    };
    let easyTableContainer = _jsxs("div", { className: `easy-table-layout-container`, children: [_jsxs("div", { className: 'left-area', children: [titleRender(), desc, tabs] }), propsChildren()] });
    if (props.frameless) {
        return easyTableContainer;
    }
    return _jsx(EasyContainer, { children: easyTableContainer });
};
export default EasyTableLayout;
