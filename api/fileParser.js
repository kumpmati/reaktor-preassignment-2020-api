const readline = require('readline');
const stream = require('stream');
const fs = require('fs');

let packages = [];

var currentPackage = {
    Package: "",
    Description: "",
    Dependencies: [],
    ReverseDependencies: []
};

async function parseData() {
        let instream = fs.createReadStream('./api/status.real');
        let outstream = new stream();
        let rl = readline.createInterface(instream, outstream);

        let multiLine = false;
        rl.on('line', line => {
            //on empty line push current package to package list
            //and clear current package
            if(line === "") {
                multiLine = false;
                packages.push(currentPackage);
                currentPackage = {
                    Package: "",
                    Description: "",
                    Dependencies: [],
                    ReverseDependencies: []
                };
                return;
            }
            
            if(!multiLine) {
                let tokens = line.split(" ");
                switch(tokens[0]) {
                    case "Package:":
                        currentPackage.Package = tokens[1];
                        break;
                    case "Description:":
                        multiLine = true;
                        currentPackage.Description = tokens.slice(1, tokens.length).join(" ");
                        break;
                    case "Depends:":
                        const names = stripVersionNumbers(line.replace("Depends: ", ""));
                        currentPackage.Dependencies = names;   //note: this only sets the names, not the actual packages
                        break;
                    default:
                        break;
                }
            } else {
                if(line.includes("Original-Maintainer:") || line.includes("Homepage:")) {
                    multiLine = false;
                    return;
                }
                currentPackage.Description += line.trim();
            }
        });
        //called when end of file is reached
        rl.on('close', () => {
            setAllDependencies(packages);
            return Promise.resolve(packages);
        });
}

function stripVersionNumbers(str) {
    return str.replace(/ (?=\()(.*?)(?:\))/g, "").split(/\, |\ \|\ /);
}

function setDependencies(p) {
    let dependencyArr = [];
    for(const name of p.Dependencies) {
        const dependency = packages.find(pkg => pkg.Package == name);
        if(dependency !== undefined) {
            dependencyArr.push(dependency);
        } else {
            dependencyArr.push(name);
        }
    }
    p.Dependencies = dependencyArr;
}

function setAllDependencies(arr) {
    for(const p of arr) {
        setDependencies(p);
    }
    for(const p of arr) {
        setReverseDependencies(p);
    }
}

function setReverseDependencies(p) {
    //iterate given array
    for(const dependency of p.Dependencies) {
        if(typeof(dependency) === "string") continue;
        //find reverse dependency in list of packages based on dependency name
        const reverse_dependency = packages.find(pkg => pkg.Package === dependency.Package);
        //if reverse dependency is found
        if(reverse_dependency) {
            //add current package to reverse dependencies of reverse dependency package
            reverse_dependency.ReverseDependencies.push(p);
        }
    }
}

function getPackage(name) {
    if(!name) return getAllPackages();
    const singlePackage = packages.find(pkg => pkg.Package === name);
    return singlePackage;
}

function getAllPackages() {
    return packages.map(p => p.Package);
}

module.exports = {
    getPackage,
    parseData
};