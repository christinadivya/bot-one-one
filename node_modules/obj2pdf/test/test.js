'use strict';
const expect = require('chai').expect;
const index = require('../dist/index.js');
const base64regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;

describe('OBJ2PDF', () => {
  it('should return a base64 string', () => {

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

    index.generatePDF(inputJSON, 'public/fonts')
      .then((response) => {
        expect(base64regex.test(response.split('base64,')[1])).to.be.true;
      })
      .catch((err) => {
        console.log("error is : ", err);
      });

  });

  it('should throw an error if JSON object is null', () => {
    index.generatePDF(null)
      .then(() => {})
      .catch((err) => {
        expect(err).not.to.be.undefined;
      });
  });
});
