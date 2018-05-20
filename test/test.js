const expect = require('chai').expect
const cucmAxl = require('../index')

// create axl connection object
const axl = new cucmAxl({
  host: 'cucm1.dcloud.cisco.com',
  user: 'axluser',
  pass: 'C1sco12345',
  version: '11.5'
})

// holds line uuid so that it can be used in device creation
let lineUuid
// holds device uuid so that it can be used in remote destination creation
let deviceUuid
// name of your route partition for creating devices and lines
// use empty string to represent the <None> value
let routePartitionName = ''

describe('getApplicationUserUuid()', function () {
  it('should show uuid for application user PG_USER', function (done) {
    axl.getApplicationUserUuid('PG_USER')
    .then(results => {
      console.log(results.pkid)
      done()
    }).catch(e => done(e))
  })
})

describe('getApplicationUserDeviceAssociations()', function () {
  it('should list device associations for application user PG_USER', function (done) {
    axl.getApplicationUserDeviceAssociations('PG_USER')
    .then(results => {
      console.log('associated devices:', results.length)
      done()
    }).catch(e => done(e))
  })
})

describe('addLine()', function () {
  it('should add line 49377', function (done) {
    axl.addLine({
      pattern: '49377',
      description: 'ccondry virtual extension',
      alertingName: 'Coty Condry',
      asciiAlertingName: 'Coty Condry',
      routePartitionName
      // routePartitionName: 'Everyone'
    })
    .then(results => {
      console.log(results)
      lineUuid = results.slice(1, results.length - 1)
      done()
    }).catch(e => done(e))
  })
})

describe('getLine()', function () {
  it('should return line details for 49377', function (done) {
    axl.getLine({
      pattern: '49377',
      routePartitionName
      // routePartitionName: 'Everyone'
    })
    .then(results => {
      console.log(results['$'])
      // console.log(results)
      done()
    }).catch(e => done(e))
  })
})

describe('listLine()', function () {
  it('should return list of lines matching 4%377', function (done) {
    axl.listLines({
      pattern: '4%377',
      routePartitionName
      // routePartitionName: 'Everyone'
    }, [
      'pattern',
      'description'
    ])
    .then(results => {
      console.log(`found lines:`, results.length)
      done()
    }).catch(e => done(e))
  })
})

describe('addPhone()', function () {
  it('should create a new phone (CTIRD9377) on CUCM', function (done) {
    axl.addPhone({
      // pattern: '*377'
      name: 'CTIRD9377',
      description: 'ccondry virtual phone 49377',
      product: 'CTI Remote Device',
      class: 'Phone',
      protocol: 'CTI Remote Device',
      protocolSide: 'User',
      devicePoolName: 'dCloud_DP',
      commonPhoneConfigName: 'Standard Common Phone Profile',
      locationName: 'Hub_None',
      useDevicePoolCgpnTransformCss: 'true',
      ownerUserName: 'ccondry',
      presenceGroupName: 'Standard Presence group',
      callingSearchSpaceName: 'Call_Everyone',
      rerouteCallingSearchSpaceName: 'Call_Everyone',
      enableCallRoutingToRdWhenNoneIsActive: 'true',
      lines: [{
        line: {
          index: 1,
          dirn: {
            '$': {
              uuid: lineUuid
            }
          },
          associatedEndusers: [{
            enduser: {
              userId: 'ccondry'
            }
          }],
          maxNumcalls: 2,
          busyTrigger: 1
        }
      }]

    })
    .then(results => {
      console.log(results)
      deviceUuid = results.slice(1, results.length - 1)
      done()
    }).catch(e => {
      done(e)
    })
  })
})

describe('getPhone()', function () {
  it('should return phone details for CTIRD9377', function (done) {
    axl.getPhone({name: 'CTIRD9377'})
    .then(results => {
      console.log(results['$'])
      done()
    }).catch(e => done(e))
  })
})

describe('listPhones()', function () {
  it('should return list of phones', function (done) {
    axl.listPhones({
      name: 'CTIRD%'
    }, [
      'name',
      'description'
    ])
    .then(results => {
      console.log(`found phones:`, results.length)
      done()
    }).catch(e => done(e))
  })
})

describe('listDevicesAndDns()', function () {
  it('should return list of devices and their DNs', function (done) {
    axl.listDevicesAndDns('4%377')
    .then(results => {
      console.log(`found phones:`, results)
      done()
    }).catch(e => done(e))
  })
})

describe('addRemoteDestination()', function () {
  it('should create remote destination 4449377 on CTIRD9377', function (done) {
    axl.addRemoteDestination({
      name: '4449377',
      destination: '4449377',
      answerTooSoonTimer: '1500',
      answerTooLateTimer: '19000',
      delayBeforeRingingCell: '4000',
      ownerUserId: 'ccondry',
      // remoteDestinationProfileName: '',
      ctiRemoteDeviceName: 'CTIRD9377',
      // dualModeDeviceName: '',
      isMobilePhone: 'true',
      enableMobileConnect: 'true'
      // lineAssociations: '',
      // timeZone: 'Etc/GMT',
      // todAccessName:
      // { _: 'TOD-RD-3c15875b-b80a-52a7-990b-5a6a30d07a59',
      // '$': { uuid: '{A363CD86-7EAA-4DED-BF8F-1D5489F0F3DF}' } },
      // mobileSmartClientName: '',
      // mobilityProfileName: '',
      // singleNumberReachVoicemail: 'Use System Default',
      // dialViaOfficeReverseVoicemail: 'Use System Default',
      // ringSchedule: '',
      // accessListName: ''
    })
    .then(results => {
      console.log(results)
      done()
    }).catch(e => done(e))
  })
})

describe('getRemoteDestination()', function () {
  it('should return remote destination details for 4449377', function (done) {
    axl.getRemoteDestination({
      destination: '4449377'
      // uuid: 'your-uuid-here'
    })
    .then(results => {
      console.log(results['$'].uuid)
      done()
    }).catch(e => done(e))
  })
})

describe('associateDeviceWithApplicationUser()', function () {
  it('should associate device 49377 with application user PG_USER', function (done) {
    axl.associateDeviceWithApplicationUser(deviceUuid.toLowerCase(), 'PG_USER')
    .then(results => {
      console.log('rows updated:', results.rowsUpdated)
      done()
    }).catch(e => done(e))
  })
})

describe('associateDeviceWithEndUser()', function () {
  it('should associate device 49377 with end user ccondry', function (done) {
    axl.associateDeviceWithEndUser(deviceUuid.toLowerCase(), 'ccondry')
    .then(results => {
      console.log('rows updated:', results.rowsUpdated)
      done()
    }).catch(e => done(e))
  })
})

describe('removeRemoteDestination()', function () {
  it('should remove remote destination 4449377', function (done) {
    axl.removeRemoteDestination({
      destination: '4449377'
      // uuid: 'your-uuid-here'
    })
    .then(results => {
      console.log(results)
      done()
    }).catch(e => done(e))
  })
})

describe('removePhone()', function () {
  it('should remove phone CTIRD9377', function (done) {
    axl.removePhone({name: 'CTIRD9377'})
    .then(results => {
      console.log(results)
      done()
    }).catch(e => done(e))
  })
})

describe('removeLine()', function () {
  it('should remove line 49377', function (done) {
    axl.removeLine({
      pattern: '49377',
      routePartitionName
      // routePartitionName: 'Everyone'
    })
    .then(results => {
      console.log(results)
      done()
    }).catch(e => done(e))
  })
})
