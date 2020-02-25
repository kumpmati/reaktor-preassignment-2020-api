const http = require('http');
const {parseData, getPackage} = require('./fileParser');

const stringify = JSON.stringify.bind(this);

const server = http.createServer(requestListener);

parseData().then(() => {
    server.listen(process.env.PORT | 9001, () => console.log("API server is up"));
});

function requestListener(req, res) {
    console.log(req.url);
    try {
        res.setHeader('Access-Control-Allow-Origin', '*');
        if(!req.url.startsWith("/api/")) return;
        const addr = req.url.replace("/api/", "");
        const package = getPackage(addr);
        if(package) {
            res.writeHead(200, {"Content-Type": "application/json"});
            if(addr === "all" || !addr)
                res.end(stringify({type: "package_list", package}));
            res.end(stringify({type: "single_package", ...package}));
        } else {
            res.writeHead(404, {"Content-Type": "application/json"});
            res.end(stringify({type: "error", message: "Package does not exist"}));
        }
    } catch(e) {
        console.log(e.message);
    }
}
