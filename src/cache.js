

export default function createCache(len = 100) {
  var cache = Object.create(null)
	var keys = [];

  return {
    get: key => cache[key],
    set: (key, value) => {
      if (keys.push(key) > len)
  			delete cache[keys.shift()];

  		return (cache[key] = value);
    }
  }
}
