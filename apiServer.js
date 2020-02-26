const http = require('http');
const { parseData, getPackage } = require('./fileParser');
const stringify = JSON.stringify.bind(this);

const PORT = process.env.PORT;
const server = http.createServer(requestListener);
parseData().then(() => {
    server.listen(PORT, () => console.log(`API server is up on port ${PORT}`));
});

function requestListener(req, res) {
    console.log(req.url);
    try {
        res.setHeader('Access-Control-Allow-Origin', '*');
        if (!req.url.startsWith("/api/")) {
            res.writeHead(403, "requests must go to: /api/");
            return res.end();
        }
        if (req.method !== "GET") {
            res.writeHead(405, "GET requests only");
            return res.end();
        }
        const addr = req.url.replace("/api/", "");
        const package = getPackage(addr);
        if (package) {
            res.writeHead(200, { "Content-Type": "application/json" });
            if (!addr)
                res.end(stringify({ type: "package_list", package }));
            res.end(stringify({ type: "single_package", ...package }));
        } else {
            res.writeHead(404, { "Content-Type": "application/json" });
            res.end(stringify({ type: "error", message: "Package does not exist" }));
        }
    } catch (e) {
        console.log(`request error: ${e.message}`);
    }
}
