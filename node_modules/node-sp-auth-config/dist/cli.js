#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var program = require("commander");
var path = require("path");
var init_1 = require("./cli/init");
var read_1 = require("./cli/read");
var version = require(path.join(__dirname, '..', 'package.json')).version;
program
    .version(version)
    .name('sp-auth')
    .usage('[command]')
    .description('Command line config options builder for node-sp-auth (SharePoint Authentication in Node.js)');
program
    .command('init')
    .description('writes new file with node-sp-auth credentials into the file system')
    .option('-p, --path [value]', 'relative path to file which will store your credentials, required')
    .option('-e, --encrypt [true, false]', 'specify false if you don\'t need to encrypt password in the file, optional, default is true', true)
    .option('-k, --masterkey [value]', 'optional key used to encrypt and decrypt your sensitive data (passwords), by default unique machine id is used', null)
    .action(init_1.init);
program
    .command('read')
    .description('reads credentials from a private.json file')
    .option('-p, --path [value]', 'relative path to file which will store your credentials, required')
    .option('-e, --encrypt [true, false]', 'specify false if you don\'t need to encrypt password in the file, optional, default is true', true)
    .option('-k, --masterkey [value]', 'optional key used to encrypt and decrypt your sensitive data (passwords), by default unique machine id is used', null)
    .option('-f, --format', 'optional key used configure formatted output')
    .action(read_1.read);
program.parse(process.argv);
if (program.args.length === 0) {
    program.help();
}
//# sourceMappingURL=cli.js.map