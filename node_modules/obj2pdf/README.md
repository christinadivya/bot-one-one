# obj2pdf
A server-side npm package to convert a JSON object to a PDF.

[![Build Status](https://travis-ci.org/NikhilNanjappa/obj2pdf.svg?branch=master)](https://travis-ci.org/NikhilNanjappa/obj2pdf)
[![Coverage Status](https://coveralls.io/repos/github/NikhilNanjappa/obj2pdf/badge.svg?branch=master)](https://coveralls.io/github/NikhilNanjappa/obj2pdf?branch=master)
[![npm version](https://badge.fury.io/js/obj2pdf.svg)](https://badge.fury.io/js/obj2pdf)

# Table of contents

- [Dependencies](https://github.com/NikhilNanjappa/obj2pdf#dependencies)
- [Installation](https://github.com/NikhilNanjappa/obj2pdf#installation)
- [Usage](https://github.com/NikhilNanjappa/obj2pdf#usage)
- [How to use the base64 PDF data string](https://github.com/NikhilNanjappa/obj2pdf#how-to-use-the-base64-pdf-data-string)
- [Generated PDF Sample](https://github.com/NikhilNanjappa/obj2pdf#generated-pdf-sample)
- [Generated PDF Specs](https://github.com/NikhilNanjappa/obj2pdf#generated-pdf-specs)

# Dependencies

This package is dependent on the [`pdfmake`](https://github.com/bpampuch/pdfmake) package.

# Installation

```shell
npm install obj2pdf --save
```

or

```shell
yarn add obj2pdf
```

# Usage

1. Import the package

Typescript:

```shell
import * as obj2pdf from 'obj2pdf';
```

or 

Javascript:

```shell
const obj2pdf = require('obj2pdf');
```

2. Now, simply use the exposed `.generatePDF` function which takes in a valid JSON object as the parameter. It returns a base64 encoded string containing the PDF data.

Provide a `heading` property if needed to generate a heading for the PDF which would be center aligned(see sample image below).

Each property(except heading) in the JSON corresponds a "Section" in the generated PDF (for eg. Employee Details, Employer Details in the below JSON example).

The value of each property(Section) in the JSON can be one of `object`, `string` or `number`.

An `object` value would specify sub-sections within a section(works atmost with 1 level nesting).

A `string`/`number` value prints it as-is below the Section(no sub-sections).

```javascript
const inputJSON = {
  "heading": "PDF Heading",
  "Employee Details": {
    "First name": "John",
    "Last name": "Doe",
    "Gender": "Male"
  },
  "Employer Details": {
    "Name": "Google",
    "Location": "London"
  },
  "Currency": "£",
  "Amount": 10
};

obj2pdf.generatePDF(inputJSON)
  .then((pdfData) => {
    // do something with pdfData
  })
  .catch((err) => {
    console.log(`error caught : ${err}`);
  });
```

# How to use the base64 PDF data string

The base64 encoded string response should look something like

```
data:application/pdf;base64,JVBERi0xLjcKCjEgMCBvYmogICUgZW50cnkgcG9pbnQKPDwKICAvVHlwZSAvQ2F0YWxvZwogIC9Q...
```

This can then be used on client-side as the value to a `href` attribute of a HTML anchor element.

```html
<a href="data:application/pdf;base64,JVBERi0xLjc…">
  Open PDF
</a>
```

# Generated PDF Sample

If you used the JSON above, the generated PDF data upon viewing should look like

![PDF Sample](https://github.com/NikhilNanjappa/obj2pdf/blob/master/lib/obj2pdf_sample.PNG "PDF Sample")

# Generated PDF Specs

- Fonts being used are **Roboto regular/bold**
- PDF heading is **15px**, **center aligned**, **bold**.
- Section heading is **12px**, **bold**.
- Sub-section heading is **10px**, **bold**.
- Section/Sub-section value is **8px**.