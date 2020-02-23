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
        let instream = fs.createReadStream('./data/status.real');
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
                        currentPackage.Description = tokens.slice(1, tokens.length).join(" ") + "<br>";
                        break;
                    case "Depends:":
                    case "Pre-Depends:":
                        const dependencyStr = line.replace("Depends: ", "");
                        const names = stripVersionNumbers(dependencyStr);
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
                currentPackage.Description += line.trim() + "<br>";
            }
        });
        //called when end of file is reached
        rl.on('close', () => {
            setAllDependencies(packages);
            return Promise.resolve(packages);
        });
}

function stripVersionNumbers(str) {
    const cleanArr = str.replace(/ (?=\()(.*?)(?:\))/g, "").split(/\, |\ \|\ /);
    return cleanArr;
}

function setDependencies(nameArr) {
    let dependencyArr = [];
    for(const name of nameArr) {
        const dependency = packages.find(pkg => pkg.Package == name);
        if(dependency !== undefined) {
            dependencyArr.push(dependency);
        } else {
            dependencyArr.push(name);
        }
        
    }
    return dependencyArr;
}

function setAllDependencies(arr) {
    //iterate packages
    for(const _package of arr) {
        //set dependencies
        let deps = setDependencies(_package.Dependencies);
        _package.Dependencies = deps;
        //iterate dependencies of a package
        for(const dependency of _package.Dependencies) {
            //find reverse dependency in list of packages based on dependency name
            const reverse_dependency = arr.find(pkg => pkg.Package === dependency.Package);
            //if reverse dependency is found
            if(reverse_dependency) {
                //add current package to reverse dependencies of reverse dependency package
                reverse_dependency.ReverseDependencies.push(_package);
            }
        }
    }
    //return modified array
    return arr;
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