const xml2js = require('xml2js')

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

module.exports = parseString
