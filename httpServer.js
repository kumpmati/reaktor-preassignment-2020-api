const http = require('http');
const fs = require('fs');
const parser = require('./data/fileParser');

parser.parseData().then(() => {
    server.listen(process.env.PORT || 80, () => console.log('server is up'));
});

const server = http.createServer((req, res) => {
    res.writeHead("200");
    res.end(handleRequest(req.url, res));
});

function handleRequest(reqUrl, res) {
    switch(reqUrl) {
        case "/favicon.ico":
            break;
        default:
            console.log(reqUrl);
            res.writeHead(200, {"Content-Type": "text/html"});
            return renderPage(reqUrl.substring(1, reqUrl.length));
        case "/page.css":
            console.log("<page css>");
            res.writeHead(200, {"Content-Type": "text/css"});
            return fs.readFileSync("./data/page.css");
    }
}

function renderPage(packageName) {
    let pBody = "";
    const p = parser.getPackage(packageName);

    if(!p) {
        pBody += "<a id='backbutton' href='./'>Back to package view</a>";
        pBody += `<h1>404 - package \"${packageName}\" does not exist`;
    }
    //root with all packages
    else if(Array.isArray(p)) {
        pBody += "<div><h1>Packages:</h1><ul>";
        p.sort();
        pBody += p.map(name => `<li class='package-link'><a href='${name}'>${name}</a></li>\n`).join("");
        pBody += "</ul></div>";
    }
    else {
        pBody += "<a id='backbutton' href='./'>Back to package view</a>";
        pBody += `<h1 id='package_name'>${p.Package}</h1>`;
        pBody += `<p id='package_desc'>${p.Description}</p>`;
        pBody += `<div id='package_deps'><h3>Dependencies:</h3><ul>${renderList(p.Dependencies)}</ul></div>`;
        pBody += `<div id='package_revd'><h3>Reverse Dependencies:</h3><ul>${renderList(p.ReverseDependencies)}</ul></div>`;
    }
    
    return (`
    <html>
    <link rel='stylesheet' type='text/css' href='page.css'>
    <a href='https://github.com/kumpmati/reaktor-preassignment-2020'>GitHub</a>
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