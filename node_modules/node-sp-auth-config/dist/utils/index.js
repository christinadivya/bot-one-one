"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
var mkdirp = require("mkdirp");
var path = require("path");
var fs = require("fs");
var url = require("url");
var cpass_1 = require("cpass");
exports.convertAuthContextToSettings = function (authContext, settings) {
    if (settings === void 0) { settings = {}; }
    var passwordPropertyName = exports.getHiddenPropertyName(authContext.authOptions);
    var password = authContext.authOptions[passwordPropertyName];
    var plainContext = __assign({ siteUrl: authContext.siteUrl, strategy: authContext.strategy }, authContext.authOptions, { custom: authContext.custom });
    if (typeof password !== 'undefined' && settings.encryptPassword) {
        var cpass = new cpass_1.Cpass(settings.masterKey);
        var decodedPassword = cpass.decode(password);
        var encodedPassword = cpass.encode(decodedPassword);
        plainContext = __assign({}, plainContext);
        plainContext[passwordPropertyName] = encodedPassword;
    }
    return plainContext;
};
exports.convertSettingsToAuthContext = function (configObject, settings) {
    if (settings === void 0) { settings = {}; }
    var formattedContext = {
        siteUrl: configObject.siteUrl || '',
        strategy: configObject.strategy,
        authOptions: __assign({}, configObject),
        settings: settings,
        custom: configObject.custom
    };
    if (typeof formattedContext.custom === 'undefined') {
        delete formattedContext.custom;
    }
    delete formattedContext.authOptions.siteUrl;
    delete formattedContext.authOptions.strategy;
    delete formattedContext.authOptions.custom;
    return formattedContext;
};
exports.saveConfigOnDisk = function (authContext, settings) {
    return new Promise(function (resolve, reject) {
        var configDataJson = exports.convertAuthContextToSettings(authContext, settings);
        var saveFolderPath = path.dirname(settings.configPath);
        mkdirp(saveFolderPath, function (err) {
            if (err) {
                console.log('Error creating folder ' + '`' + saveFolderPath + ' `', err);
            }
            fs.writeFile(settings.configPath, JSON.stringify(configDataJson, null, 2), 'utf8', function (err) {
                if (err) {
                    console.log(err);
                    return reject(err);
                }
                resolve();
            });
        });
    });
};
exports.defaultPasswordMask = '********';
exports.getHiddenPropertyName = function (data) {
    if (data.password) {
        return 'password';
    }
    if (data.clientSecret) {
        return 'clientSecret';
    }
    return undefined;
};
exports.isOnPrem = function (siteUrl) {
    var host = (url.parse(siteUrl.toLocaleLowerCase())).host;
    return [
        '.sharepoint.com',
        '.sharepoint.cn',
        '.sharepoint.de',
        '.sharepoint-mil.us',
        '.sharepoint.us'
    ]
        .filter(function (uri) { return host.indexOf(uri) !== -1; })
        .length === 0;
};
//# sourceMappingURL=index.js.map