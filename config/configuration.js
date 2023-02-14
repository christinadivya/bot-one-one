let apiPort = process.env.PORT ? process.env.PORT : 9002;
let authUrl = process.env.AUTH_URL ? process.env.AUTH_URL : "http://13.126.155.93:9002";//localhost:90012
// let authUrl = process.env.AUTH_URL ? process.env.AUTH_URL : "http://localhost:9001"

// let authUrl = process.env.AUTH_URL ? process.env.AUTH_URL : "localhost:9001"
// let Fetch39API = "http://52.45.171.205:8502/"
let Fetch39API = "http://13.126.155.93:9002/"
let erpBaseUrl = "http://54.173.185.173:9002"

let data = {

    "sharePoint": {
      "username": 'jp_sharan',
      "password": 'sha_moni_12345',
      "domain": 'ecc-web',
      "ModuleName" :"ConVerse",
      "ImageDocumentType":"ChatImage",
      "DocumentType":"ChatDocs",
      "SiteUrl": "http://appqltydocs.lntecc.com/gn/Deelchat/",
      "uploadURL": "http://moss2013-dev/Deelchat/api/SPDU/GetSPDUData"
    },
    "ERPToken":{
      "ClientID": "1666",
      "SecretKey": "5515957151157759515917575",
      "CompanyCode": "1",
      "validateTokenURL": erpBaseUrl + "EIPAccessControlAPI/EIPACSAuthenticationAPI/ACSAPI/EIP/ValidateToken",
      "generateTokenURL": erpBaseUrl + "EIPAccessControlAPI/ACSAPI/ONM/GetGenerateToken"
    },
    "ValidateAccessTokenURL": authUrl + "ConverseAPI/api/Account/ValidateAccessToken"
}

module.exports = {
  apiPort: apiPort,
  authUrl : authUrl,  
  data: data,
  Fetch39API:Fetch39API
}
