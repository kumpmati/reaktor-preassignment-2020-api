const http = require('http');
const fs = require('fs');
const parser = require('../fileParser');

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
            res.writeHead(200, {"Content-Type": "text/html"});
            return renderPage(reqUrl.substring(1));
        case "/page.css":
            res.writeHead(200, {"Content-Type": "text/css"});
            return fs.readFileSync("./page.css");
    }
}

function renderPage(packageName) {
    const p = parser.getPackage(packageName);
    let pBody = "";
    //package doesn't exist
    if(!p) {
        pBody += "<a id='backbutton' href='./'>Back to package view</a>";
        pBody += `<h1>404 - package \"${packageName}\" does not exist`;
    }
    //root with all packages
    else if(Array.isArray(p)) {
        p.sort(); //sort alphabetically
        const list = p.map(name => {
            return `<li class='package-link'>
                        <a href='${name}'>${name}</a>
                    </li>\n`
        }).join("");

        pBody +=`<div>
                    <h1>Packages:</h1>
                    <ul>${list}</ul>
                </div>`;
    }
    else {
        //SINGLE PACKAGE VIEW
        pBody +=`<a id='backbutton' href='./'>Back to package view</a>
                <h1 id='package_name'>${p.package}</h1>
                <p id='package_desc'>${p.description.replace(/\n/gm, "<br>")}</p>

                <div id='package_deps'>
                    <h3>Dependencies:</h3>
                    <ul>${renderList(p.dependencies)}</ul>
                </div>
                <div id='package_revd'>
                    <h3>Reverse Dependencies:</h3>
                    <ul>${renderList(p.reverse_dependencies)}</ul>
                </div>
                `;
    }
    
    //FINAL HTML
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
    if(!arr.length) return "<i>none</i>";
    //map array of dependencies to HTML li-tags
    //if array item is a string, show the name without a link
    const body = arr.map(dependency => {
        let item = (dependency.not_indexed) ?
            `<p class='subtle'>${dependency.name}</p>` : //package that doesn't exist in the list
            `<a href='./${dependency.name}'>${dependency.name}</a>`;  //existing package
        return `<li class='package-link'>${item}</li>`
    });
    return body.join("");   //join the array into a string before returning
}