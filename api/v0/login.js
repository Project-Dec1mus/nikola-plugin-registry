module.exports = async function g(__GLOBAL) {
    let crypto = require("crypto");
    let util = require("util");
    let asyncCrypto = {
        scrypt: util.promisify(crypto.scrypt)
    }

    if (!__GLOBAL.storage) {
        __GLOBAL.storage = new __GLOBAL.ItemResolvable();
        __GLOBAL.storage.resolve(await (await require("../../app/getStorage")(__GLOBAL))());
    }

    return async function resolver(req, res) {
        if (req.method !== "POST") 
            return res.status(400).json({error: "This endpoint requires method = POST."});

        if (
            typeof req.body.username !== "string" || 
            typeof req.body.password !== "string" ||
            !req.body.username.length ||
            !req.body.password.length
        ) return res.status(400).json({error: "Username + password is required."});
        
        // Comparing with the DB
        let db = await __GLOBAL.storage;
        let aInfo = await db.get("AINFO", req.body.username);
        if (!aInfo) return res.status(403).json({error: "Username doesn't exist."});

        let salt = aInfo.password.slice(0, 64).toUpperCase(); // Salt is 32 bytes long
        let hashedPassword = (await asyncCrypto.scrypt(
            req.body.password,
            Buffer.from(salt, "hex"),
            64,
            {
                N: 65536,
                maxmem: 7e+7
            }
        )).toString("hex").toUpperCase();
        
        if (salt + hashedPassword !== aInfo.password)
            return res.status(403).json({error: "Wrong password."});

        // Valid password. Generating a session ID.
        let randomAccessToken = crypto
            .createHmac("sha512", salt + hashedPassword)
            .update(crypto.randomBytes(8))
            .digest("hex")
            .toUpperCase();

        // Writing usable token to DB
        aInfo.token.push({
            t: randomAccessToken,
            from: req.ip,
            ua: req.get("user-agent"),
            issueTime: Date.now(),
            lastSeen: Date.now()
        });
        await db.set("AINFO", req.body.username, aInfo);

        return res.status(200).json({
            token: `${req.body.username}::${randomAccessToken}`
        });
    }
}