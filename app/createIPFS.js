module.exports = async function createIPFS() {
    let ipfs = require("ipfs-core");
    let path = require("path");
    let node = await ipfs.create({
        repo: path.join(__dirname, "..", process.env.IPFS_STORAGE_LOC)
    });

    return node;
}