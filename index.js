(async () => {
    let fs = require("fs");
    let path = require("path");

    let dotenv = require("dotenv");
    dotenv.config();

    let __GLOBAL = {
        // Promise-like placeholder for resolving. Sort of. (no chaining)
        ItemResolvable: class ItemResolvable {
            #flist = [];

            #ready = false;
            get ready() { return this.#ready; }

            #object;
            get object() { return this.#object; }

            resolve(obj) {
                if (this.#ready) throw new Error("Cannot call resolve() more than once.");
                this.#object = obj;
                this.#ready = true;
                
                this.#flist.forEach(f => f(obj));
            }

            then(f) {
                if (!this.#ready) {
                    this.#flist.push(f);
                } else {
                    f(this.#object);
                }
                return this;
            }
        }
    };

    let express = require("express");
    let app = express();

    // API building
    let apiRouter = express.Router();
    router.use(express.json());
    router.use(express.urlencoded());
    const apiVersionFolderMapping = ["api/v0"];

    let routerList = await Promise.all(apiVersionFolderMapping.map(async function (version, i) {
        let router = express.Router();
        let apiList = await fs.promises.readdir(path.join(__dirname, version), { withFileTypes: true, encoding: "utf8" });
        apiList = apiList
            .filter(x => x.isFile() && /^.*\.js$/.test(path.parse(x.name).base))
            .map(y => path.parse(y.name).name);

        for (let api of apiList) {
            console.log(`Loading APIv${i}:${api}`);
            router.use(`/${api}`, await require(path.join(__dirname, version, api))(__GLOBAL));
        }
        router.use(function (_, res) {
            return res.status(404).json({ error: "API not found. Please take a look at API documentation at https://github.com/Project-Dec1mus/nikola-plugin-registry" })
        });
        return router;
    }));

    routerList.forEach((r, i) => apiRouter.use(`/v${i}`, r));
    apiRouter.use("/", routerList[routerList.length - 1]);
    app.use("/api", apiRouter);

    // Listen.
    app.listen(process.env.PORT || process.env.LISTEN_PORT || 3000);
})();