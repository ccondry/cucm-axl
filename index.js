const axios = require('axios')
const parseXmlString = require('./parse-xml')
const js2xmlparser = require('js2xmlparser')

// capitalize the first letter of a string and return it
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

class Axl {
  constructor(settings) {
    this.host = settings.host
    this.user = settings.user
    this.pass = settings.pass
    this.version = settings.version

    this.js2xmlOptions = {
      attributeString: '$',
      declaration: {
        include: false
      }
    }
  }

  /*** main AXL command runner ***/
  async run (method, type, innerBody) {
    const methodType = method + capitalizeFirstLetter(type)
    const url = `https://${this.host}:8443/axl/`
    const basicAuth = new Buffer(this.user + ':' + this.pass).toString('base64')
    const headers = {
      'Authorization': `Basic ${basicAuth}`,
      'Content-Type': 'text/xml',
      'SOAPAction': `CUCM:DB ver=${this.version} ${methodType}`
    }
    const body = `<soapenv:Envelope
    xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
    xmlns:xsd="http://www.w3.org/2001/XMLSchema"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
    <soapenv:Body>
    <axl:${methodType} xmlns:axl="http://www.cisco.com/AXL/API/${this.version}">
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
      let errorMessage
      try {
        // try to parse the xml error
        const json = await parseXmlString(e.response.data)
        errorMessage = json['soapenv:Envelope']['soapenv:Body']['soapenv:Fault']['faultstring']
      } catch (e2) {
        // console.log(e2)
        errorMessage = e2
        // if parsing fails, just throw the original error
        // throw e
      }
      throw errorMessage
    }
  }

  /*** functions to add items  ***/
  addLine (details) {
    // add all specified details
    const innerBody = js2xmlparser.parse('line', details, this.js2xmlOptions)
    // run command
    return this.run('add', 'line', innerBody)
  }

  addPhone (details) {
    // add all specified phone details
    const innerBody = js2xmlparser.parse('phone', details, this.js2xmlOptions)
    // run command
    return this.run('add', 'phone', innerBody)
  }

  addRemoteDestination (details) {
    // add all specified phone details
    const innerBody = js2xmlparser.parse('remoteDestination', details, this.js2xmlOptions)
    // run command
    return this.run('add', 'remoteDestination', innerBody)
  }

  /*** functions to get items  ***/
  getLine (searchCriteria) {
    // iterate over searchCriteria and add each to the inner body
    let innerBody = ''
    for (let key in searchCriteria) {
      innerBody += `<${key}>${searchCriteria[key]}</${key}>`
    }
    // run command
    return this.run('get', 'line', innerBody)
  }

  getPhone (searchCriteria) {
    // iterate over searchCriteria and add each to the inner body
    let innerBody = ''
    for (let key in searchCriteria) {
      innerBody += `<${key}>${searchCriteria[key]}</${key}>`
    }
    // const innerBody = js2xmlparser.parse('phone', details, this.js2xmlOptions)
    // run command
    return this.run('get', 'phone', innerBody)
  }

  getRemoteDestination (searchCriteria) {
    // create XML
    // const innerBody = js2xmlparser.parse('phone', details, this.js2xmlOptions)
    let innerBody = ''
    for (let key in searchCriteria) {
      innerBody += `<${key}>${searchCriteria[key]}</${key}>`
    }
    // run command
    return this.run('get', 'remoteDestination', innerBody)
  }

  /*** functions to list items  ***/
  listLine (searchCriteria, returnedTags) {
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
    return this.run('list', 'line', innerBody)
  }

  removeLine (details) {
    // add all specified phone details
    let innerBody = ''
    for (let key in details) {
      innerBody += `<${key}>${details[key]}</${key}>`
    }
    // run command
    return this.run('remove', 'line', innerBody)
  }

  removePhone (details) {
    // add all specified phone details
    let innerBody = ''
    for (let key in details) {
      innerBody += `<${key}>${details[key]}</${key}>`
    }
    // run command
    return this.run('remove', 'phone', innerBody)
  }

  /*** functions to remove items  ***/
  removeRemoteDestination (details) {
    // add all specified phone details
    let innerBody = ''
    for (let key in details) {
      innerBody += `<${key}>${details[key]}</${key}>`
    }
    // run command
    return this.run('remove', 'remoteDestination', innerBody)
  }

  getApplicationUserDeviceAssociations (name) {
    let query = `SELECT * FROM applicationuserdevicemap
    WHERE fkapplicationuser = (SELECT pkid from applicationuser WHERE name = '${name}')`
    let innerBody = `<sql>${query}</sql>`
    return this.run('execute', 'SQLQuery', innerBody)
  }

  getApplicationUserUuid (name) {
    let query = `SELECT pkid from applicationuser WHERE name = '${name}'`
    let innerBody = `<sql>${query}</sql>`
    return this.run('execute', 'SQLQuery', innerBody)
  }

  /*** other functions ***/
  associateDeviceWithApplicationUser (deviceUuid, appUserName) {
    let query = `INSERT INTO applicationuserdevicemap (fkapplicationuser, fkdevice, tkuserassociation) VALUES ( (SELECT pkid from applicationuser WHERE name = '${appUserName}'), '${deviceUuid}', 1)`
    let innerBody = `<sql>${query}</sql>`
    // run command
    return this.run('execute', 'SQLUpdate', innerBody)
  }

}

module.exports = Axl
