const readline = require('readline');
const stream = require('stream');
const fs = require('fs');

let instream = fs.createReadStream('./status.real');
let outstream = new stream();
let rl = readline.createInterface(instream, outstream);

let packages = [];

var packageTemplate = {
    package: "",
    description: "",
    dependencies: [],
    reverse_dependencies: []
};

async function parseData() {
    let multiLine = false;
    let package = shallowCopy(packageTemplate);

    rl.on('line', line => {
        //on empty line push current package to package list
        //and clear current package
        if(line === "") {
            multiLine = false;
            packages.push(package);
            package = shallowCopy(packageTemplate);
            return;
        }
        
        if(!multiLine) {
            let tokens = line.split(" ");
            switch(tokens[0]) {
                case "Package:":
                    package.package = tokens[1];
                    break;
                case "Description:":
                    multiLine = true;
                    package.description = tokens.slice(1, tokens.length).join(" ")+'\n';
                    break;
                case "Depends:":
                    const names = stripVersionNumbers(line.replace("Depends: ", ""));
                    package.dependencies = names;   //note: this only sets the names, not the actual packages
                    break;
                default:
                    break;
            }
        } else {
            if(line.includes("Original-Maintainer:") || line.includes("Homepage:")) {
                multiLine = false;
                return;
            }
            package.description += line.trim()+"\n";
        }
    });
    //called when end of file is reached
    rl.on('close', () => {
        setAllDependencies(packages);
        return Promise.resolve(packages);
    });
}

function validateDependencies(p) {
    let dependencyArr = [];
    for(const name of p.dependencies) {
        const dependency = packages.find(pkg => pkg.package == name);

        if(dependency) {
            //set dependency
            dependencyArr.push({name: dependency.package});
            //set reverse dependency
            dependency.reverse_dependencies.push({name: p.package});
        } else {
            //set non-indexed dependency
            dependencyArr.push({name: name, not_indexed: true});
        }
    }
    p.dependencies = dependencyArr;
}

function setAllDependencies(arr) {
    for(const p of arr) {
        validateDependencies(p);
    }
}

function getPackage(name) {
    if(name === "all" || !name) return getAllPackages();
    const singlePackage = packages.find(pkg => pkg.package === name);
    return singlePackage;
}

function getAllPackages() {
    return packages.map(p => p.package);
}

/**
 * Clone a JS object without keeping any references to the original
 * @param {Object} object The object that you want to clone from
 */
function shallowCopy(object) {
    return JSON.parse(JSON.stringify(object));
}

/**
 * Input is a string with packages split with a comma in format: <pkg1Name> (<pkg1Ver>), <pkg2Name> (<pkg2Ver>).
 * Function returns just the names in an array.
 * @param {String} str the string of package names that need to be split up and cleaned
 */
function stripVersionNumbers(str) {
    return str.replace(/ (?=\()(.*?)(?:\))/g, "").split(/\, |\ \|\ /);
}

module.exports = {
    getPackage,
    parseData
};