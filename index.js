const axios = require('axios')
const xml2js = require('xml2js')

// load environment file
require('dotenv').load()

function parseString (string) {
  return new Promise(function(resolve, reject)
  {
    xml2js.parseString(string, {explicitArray: false}, function(err, result){
      if(err){
        reject(err);
      }
      else {
        resolve(result);
      }
    })
  })
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

async function run (method, type, innerBody) {
  const methodType = method + capitalizeFirstLetter(type)
  const url = `https://${process.env.AXL_HOST}:8443/axl/`
  const basicAuth = new Buffer(process.env.AXL_USER + ':' + process.env.AXL_PASS).toString('base64')
  const headers = {
    'Authorization': `Basic ${basicAuth}`,
    'Content-Type': 'text/xml',
    'SOAPAction': `CUCM:DB ver=${process.env.AXL_VERSION} ${methodType}`
  }
  const body = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
  xmlns:xsd="http://www.w3.org/2001/XMLSchema"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <soapenv:Body>
  <axl:${methodType} xmlns:axl="http://www.cisco.com/AXL/API/${process.env.AXL_VERSION}">
  ${innerBody}
  </axl:${methodType}>
  </soapenv:Body>
  </soapenv:Envelope>`

  // POST request to CUCM
  const res = await axios.post(url, body, {headers})
  // parse XML to JSON
  const json = await parseString(res.data)
  // extract and return relevant response data
  return json['soapenv:Envelope']['soapenv:Body'][`ns:${methodType}Response`]['return'][type]
}
//
// go('get', 'line', '<pattern>41377</pattern>').then(res => {
//   console.log(res)
// }).catch(e => {
//   console.log(e)
// })


// run('list', 'line', '<searchCriteria><pattern>4%377</pattern></searchCriteria><returnedTags><description/></returnedTags>').then(res => {
//   console.log(res)
// }).catch(e => {
//   console.log(e)
// })

module.exports = {
  run,
  getLine: function (searchCriteria) {
    // iterate over searchCriteria and add each to the inner body
    let innerBody = ''
    for (let key in searchCriteria) {
      innerBody += `<${key}>${searchCriteria[key]}</${key}>`
    }

    // run command
    return run('get', 'line', innerBody)
  },
  listLine: function (searchCriteria, returnedTags) {
    // add all specified search criteria
    let innerBody = '<searchCriteria>'
    for (let key in searchCriteria) {
      innerBody += `<${key}>${searchCriteria[key]}</${key}>`
    }
    innerBody += '</searchCriteria>'

    // add all specified returnedTags
    innerBody += '<returnedTags>'
    for (let key in returnedTags) {
      innerBody += `<${returnedTags[key]}/>`
    }
    innerBody += '</returnedTags>'
    // run command
    return run('list', 'line', innerBody)
  }
}
