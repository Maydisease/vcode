export const HTTP_ERROR = {
    TOKEN_HAS_EXPIRED: {
        CODE: [5000, 5001],
        MESSAGE: "用户登录身份失效"
    },
    ERR_NETWORK: {
        CODE: "ERR_NETWORK",
        MESSAGE: "与服务器的连接网络中断，请检查网络"
    },
    ERR_SERVER: {
        CODE: [502],
        MESSAGE: "服务器访问失败，请检查服务器服务是否运行正常"
    }
};
