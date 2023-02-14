"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var pdfMake = require("pdfmake/src/printer");
function generatePDF(obj, fontsPath) {
    return new Promise(function (resolve) {
        var fontDescriptors;
        if (fontsPath) {
            fontDescriptors = {
                'Roboto': {
                    normal: fontsPath + '/Roboto-Regular.ttf',
                    bold: fontsPath + '/Roboto-Bold.ttf',
                    italics: fontsPath + '/Roboto-Italic.ttf',
                    bolditalics: fontsPath + '/Roboto-BoldItalic.ttf'
                }
            };
        }
        else {
            fontDescriptors = {
                'Roboto': {
                    normal: 'node_modules/obj2pdf/public/fonts/Roboto-Regular.ttf',
                    bold: 'node_modules/obj2pdf/public/fonts/Roboto-Bold.ttf',
                    italics: 'node_modules/obj2pdf/public/fonts/Roboto-Italic.ttf',
                    bolditalics: 'node_modules/obj2pdf/public/fonts/Roboto-BoldItalic.ttf'
                }
            };
        }
        var printer = new pdfMake(fontDescriptors);
        var doc = printer.createPdfKitDocument(createDocDefinition(obj));
        var chunks = [];
        doc.on('data', function (chunk) {
            chunks.push(chunk);
        });
        doc.on('end', function () {
            var result = Buffer.concat(chunks);
            resolve('data:application/pdf;base64,' + result.toString('base64'));
        });
        doc.end();
    });
}
exports.generatePDF = generatePDF;
var createDocDefinition = function (obj) {
    try {
        var docDefinition = {
            content: []
        };
        // If heading property exists, use it
        if (obj.heading) {
            docDefinition.content.push({ text: obj.heading, fontSize: 15, alignment: "center", bold: true, margin: [0, 10] });
        }
        // Margins : [left, top, right, bottom] or [horizontal, vertical]
        for (var prop in obj) {
            if (typeof (obj[prop]) === "object") {
                // Push the obj key as section heading 
                docDefinition.content.push({ text: prop, fontSize: 12, bold: true, margin: [0, 10] });
                // Push obj 'value' as sub-section contents
                for (var elem in obj[prop]) {
                    docDefinition.content.push({ text: elem, fontSize: 10, bold: true }, { text: obj[prop][elem], fontSize: 8, margin: [0, 0, 0, 10] });
                }
            }
            else if (typeof (obj[prop]) === "string" || typeof (obj[prop]) === "number") {
                if (prop !== "heading") {
                    docDefinition.content.push({ text: prop, fontSize: 12, bold: true, margin: [0, 10, 0, 0] }, { text: obj[prop], fontSize: 8, margin: [0, 0, 0, 10] });
                }
            }
        }
        return docDefinition;
    }
    catch (err) {
        console.log("createDocDefinition error : " + err);
    }
};
