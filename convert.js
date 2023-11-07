const fs = require("node:fs/promises");
const path = require("node:path");

const thisFileName = path.basename(process.argv[1]);

const EXIT_CODE_CANNOT_READ_FILE = 1;
const EXIT_CODE_CANNOT_CREATE_DIRECTORY = 2;
const EXIT_CODE_CANNOT_WRITE_FILE = 3;

const usage = `Usage: node ${thisFileName} <FILE>`;
const helpFlags = ["--help", "-h"];
const verboseFlags = ["--verbose", "-v"];
const allFlags = [...helpFlags, ...verboseFlags];

const args = process.argv.slice(2);
const hasArgs = args.length > 0;
const hasFileArg = args.filter(arg => !allFlags.includes(arg)).length > 0;
if (!hasArgs || !hasFileArg) {
    console.error(usage);
    return;
}

const isHelp = helpFlags.some(flag => args.includes(flag));
if (isHelp) {
    console.log(usage);
    return;
}

const isVerbose = verboseFlags.some(flag => args.includes(flag));
isVerbose && console.log("verbose = true");

const densities = [
    ["mdpi", 160],
    ["hdpi", 240],
];

(async function main() {
    const fileArg = args.filter(arg => !allFlags.includes(arg))[0];
    const filePath = path.resolve(fileArg);
    const fileBasename = path.basename(filePath);
    isVerbose && console.log(`filePath = ${filePath}`);

    let fileContents;
    try {
        fileContents = await fs.readFile(filePath, { encoding: "utf8" });
    } catch (error) {
        console.error(error);
        process.exit(EXIT_CODE_CANNOT_READ_FILE);
    }

    for (const [densityName, densityValue] of densities) {
        const densityDirectoryPath = path.resolve(filePath, `../../values-${densityName}`);
        const densityFilePath = path.resolve(densityDirectoryPath, fileBasename);
        const densityFileContents = fileContents.replace(/([1-9]\d*)[ds]p/g, (match, value) => {
            return match.replace(value, Math.round(+value * (160 / densityValue)));
        });

        try {
            isVerbose && console.log(`create directory ${densityDirectoryPath}`);
            await fs.mkdir(densityDirectoryPath);
            isVerbose && console.log("ok");
        } catch (error) {
            if (error.code === "EEXIST") {
                isVerbose && console.log("directory already exists");
            } else {
                console.error(error);
                process.exit(EXIT_CODE_CANNOT_CREATE_DIRECTORY);
            }
        }

        try {
            isVerbose && console.log(`write file ${densityFilePath}`);
            await fs.writeFile(densityFilePath, densityFileContents);
            isVerbose && console.log("ok");
        } catch (error) {
            console.error(error);
            process.exit(EXIT_CODE_CANNOT_WRITE_FILE);
        }
    }

    isVerbose && console.log("done");
})();
