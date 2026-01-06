import lodash from 'lodash';
const globalEnv = typeof window !== 'undefined' ? window : {};
const PROJECT_ENV = lodash.get(globalEnv, 'PROJECT_ENV', {});
const workspaceProjectConfig = globalEnv.APP_WORKSPACE_PROJECT_CONFIG;
const WORKSPACE_PROJECT_CONFIG = {
    appList: lodash.get(workspaceProjectConfig, 'appList', []) || [],
    disablePx2Rem: lodash.get(workspaceProjectConfig, 'disablePx2Rem', false),
    enabledOffline: lodash.get(workspaceProjectConfig, 'enabledOffline', false),
};
console.log('WORKSPACE_PROJECT_CONFIG:', WORKSPACE_PROJECT_CONFIG);
export { PROJECT_ENV, WORKSPACE_PROJECT_CONFIG };
