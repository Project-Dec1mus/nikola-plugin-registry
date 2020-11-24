module.exports = async function g(__GLOBAL) {
    if (!__GLOBAL.ipfs) {
        __GLOBAL.ipfs = new __GLOBAL.ItemResolvable();
        __GLOBAL.ipfs.resolve(await (require("../../app/createIPFS")()));
    }

    return async function resolver(_, res) {
        let ipfs = await __GLOBAL.ipfs;

        let nodeList = (await global.ipfsNode.bootstrap.list()).Peers;
        return res.status(200).json({
            ready: nodeList.length !== 0,
            nodeList
        })
    }
}