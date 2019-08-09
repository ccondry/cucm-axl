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
      console.log(`running cucm-axl request - ${method} ${type}`)
      // POST request to CUCM
      const res = await axios.post(url, body, {headers})
      // parse XML to JSON
      const json = await parseXmlString(res.data)
      // extract and return relevant response data
      const nsResponse = json['soapenv:Envelope']['soapenv:Body'][`ns:${methodType}Response`]
      // return nsResponse['return'][type] || nsResponse['return']
      return nsResponse['return']['row'] || nsResponse['return'][type] || nsResponse['return']
    } catch (e) {
      let errorMessage
      try {
        // try to parse the xml error
        const json = await parseXmlString(e.response.data)
        errorMessage = json['soapenv:Envelope']['soapenv:Body']['soapenv:Fault']['faultstring']
      } catch (e2) {
        // throw the whole original error message
        throw e
      }
      // throw parsed error message
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
  listLines (searchCriteria, returnedTags) {
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

  listPhones (searchCriteria, returnedTags) {
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
    return this.run('list', 'phone', innerBody)
  }

  /*** functions to remove items  ***/
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
    return this.sqlQuery(query)
  }

  getApplicationUserUuid (name) {
    let query = `SELECT pkid from applicationuser WHERE name = '${name}'`
    return this.sqlQuery(query)
  }

  /*** other functions ***/
  associateDeviceWithApplicationUser (deviceUuid, appUserName) {
    let query = `INSERT INTO applicationuserdevicemap (fkapplicationuser, fkdevice, tkuserassociation) VALUES ( (SELECT pkid from applicationuser WHERE name = '${appUserName}'), '${deviceUuid}', 1)`
    return this.sqlUpdate(query)
  }

  associateDeviceWithEndUser (deviceUuid, username) {
    let query = `INSERT INTO enduserdevicemap (fkenduser, fkdevice, tkuserassociation) VALUES ( (SELECT pkid from enduser WHERE userid = '${username}'), '${deviceUuid}', 1)`
    return this.sqlUpdate(query)
  }

  getEndUserIpccExtension (username) {
    let query = `SELECT numplan.dnorpattern, numplan.description, routepartition.name as routepartition FROM numplan
    JOIN endusernumplanmap ON (endusernumplanmap.fknumplan = numplan.pkid)
    JOIN routepartition ON (routepartition.pkid = numplan.fkroutepartition)
    WHERE fkenduser = (SELECT pkid FROM enduser WHERE userid = '${username}')
    AND tkdnusage = '2'`
    return this.sqlQuery(query)
  }

  // @deprecated
  setEndUserIpccExtension (username, extension, routePartition) {
    return insertEndUserIpccExtension(username, extension, routePartition)
  }

  insertEndUserIpccExtension (username, extension, routePartition) {
    let query = `INSERT INTO endusernumplanmap (fkenduser, fknumplan, tkdnusage)
    VALUES (
      (SELECT pkid FROM enduser WHERE userid = '${username}'),
      (SELECT numplan.pkid FROM numplan
        JOIN routepartition ON (routepartition.pkid = numplan.fkroutepartition)
        WHERE numplan.dnorpattern = '${extension}'
        AND routepartition.name = '${routePartition}'),
      '2'
    )`
    return this.sqlUpdate(query)
  }

  deleteEndUserIpccExtension (username, extension, routePartition) {
    let query = `DELETE FROM endusernumplanmap
    WHERE fkenduser = (SELECT pkid FROM enduser WHERE userid = '${username}')
    AND fknumplan = (SELECT numplan.pkid FROM numplan
        JOIN routepartition ON (routepartition.pkid = numplan.fkroutepartition)
        WHERE numplan.dnorpattern = '${extension}'
        AND routepartition.name = '${routePartition}')
    AND tkdnusage = '2'`
    return this.sqlUpdate(query)
  }

  listDevicesAndDns (pattern) {
    let query = `SELECT d.name, d.description, t.name model, n.dnorpattern dialed_number, n.tkautoanswer auto_answer
    FROM numplan n
    JOIN devicenumplanmap map ON map.fknumplan = n.pkid
    JOIN device d ON map.fkdevice = d.pkid
    JOIN typemodel t ON d.tkmodel = t.enum
    WHERE dnorpattern LIKE '${pattern}'`
    return this.sqlQuery(query)
  }

  sqlQuery (query) {
    let innerBody = `<sql>${query}</sql>`
    return this.run('execute', 'SQLQuery', innerBody)
  }

  sqlUpdate (query) {
    let innerBody = `<sql>${query}</sql>`
    return this.run('execute', 'SQLUpdate', innerBody)
  }

  // initiate a sync of the CUCM LDAP directory using name provided in parameter
  doLdapSync (name) {
    // build inner body
    const innerBody = `<name>${name}</name>  <sync>true</sync>`
    // run command
    return this.run('do', 'ldapSync', innerBody)
  }

  // get status of CUCM LDAP directory sync using name provided in parameter
  getLdapSyncStatus (name) {
    // build inner body
    const innerBody = `<name>${name}</name>`
    // run command
    return this.run('get', 'ldapSyncStatus', innerBody)
  }

  // update end user
  updateUser (userId, ipccExtension) {
    // build inner body
    const innerBody = `<userid>${userId}</userid>
    <ipccExtension>${ipccExtension}<ipccExtension>`
    // run command
    return this.run('update', 'user', innerBody)
  }

  // get end user
  getUser (searchCriteria) {
    let innerBody = ''
    for (let key in searchCriteria) {
      innerBody += `<${key}>${searchCriteria[key]}</${key}>`
    }
    // run command
    return this.run('get', 'user', innerBody)
  }

  // add end user
  addUser (details) {
    // add all specified details
    const innerBody = js2xmlparser.parse('user', details, this.js2xmlOptions)
    // run command
    return this.run('add', 'user', innerBody)
  }
}

module.exports = Axl
