var fs = require('fs');
var cache = {}
function now() { return (new Date).getTime(); }
var debug = false;
var hitCount = 0;
var missCount = 0;
var filePath = './';

exports.put = function(key, value, time, useFile) {
  if (debug) console.log('caching: '+key+' = '+value+' (@'+time+')');
  var oldRecord = cache[key];
	if (oldRecord) {
		clearTimeout(oldRecord.timeout);
	}
  // If three arguments are passed, and the third is boolean, then assume user is setting useFile, not expiration time
  if(arguments.length == 3 && (time === true || time === false)) {
    useFile = time;
    time = undefined;
  }

	var expire = time + now();
	var record = {value: value, expire: expire};

	if (!isNaN(expire)) {
		var timeout = setTimeout(function() {
	    exports.del(key);
	  }, time);
		record.timeout = timeout;
	}

  if(useFile) {
    if (debug) console.log('Caching to file ' + filePath + key + '.txt');
    var data = {
      expire: null,
      value: value
    }
    if (!isNaN(expire)) {
      data.expire = expire;
    }
    fs.writeFile(filePath + key + '.txt', JSON.stringify(data));
  }

	cache[key] = record;
}

exports.del = function(key) {
  delete cache[key];
}

exports.clear = function() {
  cache = {};
}

exports.get = function(key, checkFile) {
  var data = cache[key];
  if (typeof data != "undefined") {
    if (isNaN(data.expire) || data.expire >= now()) {
	  if (debug) hitCount++;
      return data.value;
    } else {
      // free some space
      if (debug) missCount++;
      exports.del(key);
    }
  }
  if(checkFile && data = fs.readFileSync(filePath + key + '.txt')) {
    data = JSON.parse(data);
    if (isNaN(data.expire) || data.expire >= now()) {
      if (debug) console.log('Loading data from file');
      return data.value;
    }
  }
  return null;
}

exports.size = function() { 
  var size = 0, key;
  for (key in cache) {
    if (cache.hasOwnProperty(key)) 
      if (exports.get(key) !== null)
        size++;
  }
  return size;
}

exports.memsize = function() { 
  var size = 0, key;
  for (key in cache) {
    if (cache.hasOwnProperty(key)) 
      size++;
  }
  return size;
}

exports.debug = function(bool) {
  debug = bool;
}

exports.hits = function() {
	return hitCount;
}

exports.misses = function() {
	return missCount;
}

exports.setFilePath = function(path) {
  filePath = path;
}
