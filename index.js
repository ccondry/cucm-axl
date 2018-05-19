const axios = require('axios')
const parseXmlString = require('./parse-xml')
const js2xmlparser = require('js2xmlparser')
// load environment file
require('dotenv').load()

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
  const body = `<soapenv:Envelope
  xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
  xmlns:xsd="http://www.w3.org/2001/XMLSchema"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <soapenv:Body>
  <axl:${methodType} xmlns:axl="http://www.cisco.com/AXL/API/${process.env.AXL_VERSION}">
  ${innerBody}
  </axl:${methodType}>
  </soapenv:Body>
  </soapenv:Envelope>`

  try {
    // POST request to CUCM
    const res = await axios.post(url, body, {headers})
    // parse XML to JSON
    const json = await parseXmlString(res.data)
    // extract and return relevant response data
    const nsResponse = json['soapenv:Envelope']['soapenv:Body'][`ns:${methodType}Response`]
    return nsResponse['return'][type] || nsResponse['return']
  } catch (e) {
    const json = await parseXmlString(e.response.data)
    throw json['soapenv:Envelope']['soapenv:Body']['soapenv:Fault']['faultstring']
  }
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

const js2xmlOptions = {
  attributeString: '$',
  declaration: {
    include: false
  }
}

module.exports = {
  run,
  addLine: function (details) {
    // add all specified details
    let innerBody = '<line>'
    for (let key in details) {
      innerBody += `<${key}>${details[key]}</${key}>`
    }
    innerBody += '</line>'

    // run command
    return run('add', 'line', innerBody)
  },
  addPhone: function (details) {
    // add all specified phone details
    const innerBody = js2xmlparser.parse('phone', details, js2xmlOptions)
    // console.log(innerBody)
    // run command
    return run('add', 'phone', innerBody)
  },
  addRemoteDestination: function (details) {
    // add all specified phone details
    const innerBody = js2xmlparser.parse('remoteDestination', details, js2xmlOptions)
    // run command
    return run('add', 'remoteDestination', innerBody)
  },
  getLine: function (searchCriteria) {
    // iterate over searchCriteria and add each to the inner body
    let innerBody = ''
    for (let key in searchCriteria) {
      innerBody += `<${key}>${searchCriteria[key]}</${key}>`
    }
    // run command
    return run('get', 'line', innerBody)
  },
  getPhone: function (searchCriteria) {
    // iterate over searchCriteria and add each to the inner body
    let innerBody = ''
    for (let key in searchCriteria) {
      innerBody += `<${key}>${searchCriteria[key]}</${key}>`
    }
    // const innerBody = js2xmlparser.parse('phone', details, js2xmlOptions)
    // run command
    return run('get', 'phone', innerBody)
  },
  getRemoteDestination: function (searchCriteria) {
    // create XML
    // const innerBody = js2xmlparser.parse('phone', details, js2xmlOptions)
    let innerBody = ''
    for (let key in searchCriteria) {
      innerBody += `<${key}>${searchCriteria[key]}</${key}>`
    }
    // run command
    return run('get', 'remoteDestination', innerBody)
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
  },
  removeLine: function (details) {
    // add all specified phone details
    let innerBody = ''
    for (let key in details) {
      innerBody += `<${key}>${details[key]}</${key}>`
    }
    // console.log(innerBody)
    // run command
    return run('remove', 'line', innerBody)
  },
  removePhone: function (details) {
    // add all specified phone details
    let innerBody = ''
    for (let key in details) {
      innerBody += `<${key}>${details[key]}</${key}>`
    }
    // console.log(innerBody)
    // run command
    return run('remove', 'phone', innerBody)
  },
  removeRemoteDestination: function (details) {
    // add all specified phone details
    let innerBody = ''
    for (let key in details) {
      innerBody += `<${key}>${details[key]}</${key}>`
    }
    // console.log(innerBody)
    // run command
    return run('remove', 'remoteDestination', innerBody)
  }
}
