const expect = require('chai').expect
const axl = require('../index')

describe('getLine()', function () {
  it('should return line details', function (done) {
    axl.getLine({pattern: '41377'})
    .then(line => {
      console.log(line['$'])
      done()
    }).catch(e => done(e))
  })
})

describe('listLine()', function () {
  it('should return list of lines matching criteria', function (done) {
    axl.listLine({pattern: '*377'}, ['description'])
    .then(lines => {
      console.log(lines)
      done()
    }).catch(e => done(e))
  })
})
//
// describe('listLine()', function () {
//   it('should return list of lines matching criteria', function (done) {
//     axl.listLine({pattern: '*377'}, ['description'])
//     .then(line => done()).catch(e => done(e))
//   })
// })
