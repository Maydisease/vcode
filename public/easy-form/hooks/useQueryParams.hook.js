import { HashQueryParams } from "@utils/hashQueryParams.util.js";
function useQueryParams() {
    const currentTime = new Date().getTime();
    const search = HashQueryParams.decode("sch").sch;
    const param = HashQueryParams.decode("param").param;
    const searchExpired = Number(search['__$expired']);
    const paramExpired = Number(param['__$expired']);
    let payload = {
        search: {},
        param: {},
    };
    // 如果在一秒以内的话【参数的时效性】
    if (!(currentTime - searchExpired > 3000)) {
        delete search['__$expired'];
        payload.search = search;
    }
    // 如果在一秒以内的话【参数的时效性】
    if (!(currentTime - paramExpired > 3000)) {
        delete param['__$expired'];
        payload.param = param;
    }
    return payload;
}
export default useQueryParams;
