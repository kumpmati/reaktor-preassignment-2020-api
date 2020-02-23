const http = require('http');
const fs = require('fs');
const parser = require('./fileParser');

parser.parseData().then(() => {
    server.listen(8080, () => console.log('server is up'));
});

const server = http.createServer((req, res) => {
    console.log(req.url);
    res.writeHead("200");
    res.end(handleRequest(req.url, res));
});

function handleRequest(reqUrl, res) {
    switch(reqUrl) {
        case "/favicon.ico":
            break;
        default:
            res.writeHead(200, {"Content-Type": "text/html"});
            return renderPage(reqUrl.substring(1, reqUrl.length));
        case "/page.css":
            res.writeHead(200, {"Content-Type": "text/css"});
            return fs.readFileSync("./page.css");
    }
}

function renderPage(packageName) {
    let pBody = "";
    const p = parser.getPackage(packageName);

    if(!p) {
        pBody += "<a id='backbutton' href='./'>Back</a>";
        pBody += `<h1>404 - package \"${packageName}\" does not exist`;
    }
    //root with all packages
    else if(Array.isArray(p)) {
        pBody += "<h1>Packages:</h1>";
        p.sort();
        pBody += p.map(name => `<li class='package-link'><a href='${name}'>${name}</a></li>`).join("");
    }
    else {
        pBody += "<a id='backbutton' href='./'>Back</a>";
        pBody += `<h1 id='package_name'>${p.Package}</h1>`;
        pBody += `<h2 id='package_desc'>${p.Description}</h2>`;
        pBody += `<div id='package_deps'><h2>Dependencies:</h2>${renderList(p.Dependencies)}</div>`;
        pBody += `<div id='package_revd'><h2>Reverse Dependencies:</h2>${renderList(p.ReverseDependencies)}</div>`;
    }
    
    return (`
    <html>
    <link rel='stylesheet' type='text/css' href='page.css'>
    <body>
        <div id="wrapper">
            ${pBody}
        </div>
    </body>
    </html>
    `);
}

function renderList(arr) {
    if(!arr.length) {
        return "<i>none</i>";
    }
    const body = arr.map(d => `<li class='package-link'><a href='./${d.Package}'>${d.Package}</a></li>`);
    return body.join("");
}