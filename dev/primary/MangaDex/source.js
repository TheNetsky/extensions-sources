(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Sources = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict'

exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

// Support decoding URL-safe base64 strings, as Node.js does.
// See: https://en.wikipedia.org/wiki/Base64#URL_applications
revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function getLens (b64) {
  var len = b64.length

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // Trim off extra bytes after placeholder bytes are found
  // See: https://github.com/beatgammit/base64-js/issues/42
  var validLen = b64.indexOf('=')
  if (validLen === -1) validLen = len

  var placeHoldersLen = validLen === len
    ? 0
    : 4 - (validLen % 4)

  return [validLen, placeHoldersLen]
}

// base64 is 4/3 + up to two characters of the original data
function byteLength (b64) {
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function _byteLength (b64, validLen, placeHoldersLen) {
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function toByteArray (b64) {
  var tmp
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]

  var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen))

  var curByte = 0

  // if there are placeholders, only get up to the last complete 4 chars
  var len = placeHoldersLen > 0
    ? validLen - 4
    : validLen

  var i
  for (i = 0; i < len; i += 4) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 18) |
      (revLookup[b64.charCodeAt(i + 1)] << 12) |
      (revLookup[b64.charCodeAt(i + 2)] << 6) |
      revLookup[b64.charCodeAt(i + 3)]
    arr[curByte++] = (tmp >> 16) & 0xFF
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 2) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 2) |
      (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 1) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 10) |
      (revLookup[b64.charCodeAt(i + 1)] << 4) |
      (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] +
    lookup[num >> 12 & 0x3F] +
    lookup[num >> 6 & 0x3F] +
    lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp =
      ((uint8[i] << 16) & 0xFF0000) +
      ((uint8[i + 1] << 8) & 0xFF00) +
      (uint8[i + 2] & 0xFF)
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    parts.push(
      lookup[tmp >> 2] +
      lookup[(tmp << 4) & 0x3F] +
      '=='
    )
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + uint8[len - 1]
    parts.push(
      lookup[tmp >> 10] +
      lookup[(tmp >> 4) & 0x3F] +
      lookup[(tmp << 2) & 0x3F] +
      '='
    )
  }

  return parts.join('')
}

},{}],2:[function(require,module,exports){
(function (Buffer){(function (){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

var K_MAX_LENGTH = 0x7fffffff
exports.kMaxLength = K_MAX_LENGTH

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Print warning and recommend using `buffer` v4.x which has an Object
 *               implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * We report that the browser does not support typed arrays if the are not subclassable
 * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
 * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
 * for __proto__ and has a buggy typed array implementation.
 */
Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport()

if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' &&
    typeof console.error === 'function') {
  console.error(
    'This browser lacks typed array (Uint8Array) support which is required by ' +
    '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.'
  )
}

function typedArraySupport () {
  // Can typed array instances can be augmented?
  try {
    var arr = new Uint8Array(1)
    arr.__proto__ = { __proto__: Uint8Array.prototype, foo: function () { return 42 } }
    return arr.foo() === 42
  } catch (e) {
    return false
  }
}

Object.defineProperty(Buffer.prototype, 'parent', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.buffer
  }
})

Object.defineProperty(Buffer.prototype, 'offset', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.byteOffset
  }
})

function createBuffer (length) {
  if (length > K_MAX_LENGTH) {
    throw new RangeError('The value "' + length + '" is invalid for option "size"')
  }
  // Return an augmented `Uint8Array` instance
  var buf = new Uint8Array(length)
  buf.__proto__ = Buffer.prototype
  return buf
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new TypeError(
        'The "string" argument must be of type string. Received type number'
      )
    }
    return allocUnsafe(arg)
  }
  return from(arg, encodingOrOffset, length)
}

// Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
if (typeof Symbol !== 'undefined' && Symbol.species != null &&
    Buffer[Symbol.species] === Buffer) {
  Object.defineProperty(Buffer, Symbol.species, {
    value: null,
    configurable: true,
    enumerable: false,
    writable: false
  })
}

Buffer.poolSize = 8192 // not used by this implementation

function from (value, encodingOrOffset, length) {
  if (typeof value === 'string') {
    return fromString(value, encodingOrOffset)
  }

  if (ArrayBuffer.isView(value)) {
    return fromArrayLike(value)
  }

  if (value == null) {
    throw TypeError(
      'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
      'or Array-like Object. Received type ' + (typeof value)
    )
  }

  if (isInstance(value, ArrayBuffer) ||
      (value && isInstance(value.buffer, ArrayBuffer))) {
    return fromArrayBuffer(value, encodingOrOffset, length)
  }

  if (typeof value === 'number') {
    throw new TypeError(
      'The "value" argument must not be of type number. Received type number'
    )
  }

  var valueOf = value.valueOf && value.valueOf()
  if (valueOf != null && valueOf !== value) {
    return Buffer.from(valueOf, encodingOrOffset, length)
  }

  var b = fromObject(value)
  if (b) return b

  if (typeof Symbol !== 'undefined' && Symbol.toPrimitive != null &&
      typeof value[Symbol.toPrimitive] === 'function') {
    return Buffer.from(
      value[Symbol.toPrimitive]('string'), encodingOrOffset, length
    )
  }

  throw new TypeError(
    'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
    'or Array-like Object. Received type ' + (typeof value)
  )
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(value, encodingOrOffset, length)
}

// Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
// https://github.com/feross/buffer/pull/148
Buffer.prototype.__proto__ = Uint8Array.prototype
Buffer.__proto__ = Uint8Array

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be of type number')
  } else if (size < 0) {
    throw new RangeError('The value "' + size + '" is invalid for option "size"')
  }
}

function alloc (size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(size).fill(fill, encoding)
      : createBuffer(size).fill(fill)
  }
  return createBuffer(size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(size, fill, encoding)
}

function allocUnsafe (size) {
  assertSize(size)
  return createBuffer(size < 0 ? 0 : checked(size) | 0)
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(size)
}

function fromString (string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('Unknown encoding: ' + encoding)
  }

  var length = byteLength(string, encoding) | 0
  var buf = createBuffer(length)

  var actual = buf.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    buf = buf.slice(0, actual)
  }

  return buf
}

function fromArrayLike (array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0
  var buf = createBuffer(length)
  for (var i = 0; i < length; i += 1) {
    buf[i] = array[i] & 255
  }
  return buf
}

function fromArrayBuffer (array, byteOffset, length) {
  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('"offset" is outside of buffer bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('"length" is outside of buffer bounds')
  }

  var buf
  if (byteOffset === undefined && length === undefined) {
    buf = new Uint8Array(array)
  } else if (length === undefined) {
    buf = new Uint8Array(array, byteOffset)
  } else {
    buf = new Uint8Array(array, byteOffset, length)
  }

  // Return an augmented `Uint8Array` instance
  buf.__proto__ = Buffer.prototype
  return buf
}

function fromObject (obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    var buf = createBuffer(len)

    if (buf.length === 0) {
      return buf
    }

    obj.copy(buf, 0, 0, len)
    return buf
  }

  if (obj.length !== undefined) {
    if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
      return createBuffer(0)
    }
    return fromArrayLike(obj)
  }

  if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
    return fromArrayLike(obj.data)
  }
}

function checked (length) {
  // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= K_MAX_LENGTH) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return b != null && b._isBuffer === true &&
    b !== Buffer.prototype // so Buffer.isBuffer(Buffer.prototype) will be false
}

Buffer.compare = function compare (a, b) {
  if (isInstance(a, Uint8Array)) a = Buffer.from(a, a.offset, a.byteLength)
  if (isInstance(b, Uint8Array)) b = Buffer.from(b, b.offset, b.byteLength)
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError(
      'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
    )
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!Array.isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; ++i) {
    var buf = list[i]
    if (isInstance(buf, Uint8Array)) {
      buf = Buffer.from(buf)
    }
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    throw new TypeError(
      'The "string" argument must be one of type string, Buffer, or ArrayBuffer. ' +
      'Received type ' + typeof string
    )
  }

  var len = string.length
  var mustMatch = (arguments.length > 2 && arguments[2] === true)
  if (!mustMatch && len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) {
          return mustMatch ? -1 : utf8ToBytes(string).length // assume utf8
        }
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
// to detect a Buffer instance. It's not possible to use `instanceof Buffer`
// reliably in a browserify context because there could be multiple different
// copies of the 'buffer' package in use. This method works even for Buffer
// instances that were created from another copy of the `buffer` package.
// See: https://github.com/feross/buffer/issues/154
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  var len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.toLocaleString = Buffer.prototype.toString

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  str = this.toString('hex', 0, max).replace(/(.{2})/g, '$1 ').trim()
  if (this.length > max) str += ' ... '
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (isInstance(target, Uint8Array)) {
    target = Buffer.from(target, target.offset, target.byteLength)
  }
  if (!Buffer.isBuffer(target)) {
    throw new TypeError(
      'The "target" argument must be one of type Buffer or Uint8Array. ' +
      'Received type ' + (typeof target)
    )
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset // Coerce to Number.
  if (numberIsNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i
  if (dir) {
    var foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      var found = true
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  var strLen = string.length

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (numberIsNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset >>> 0
    if (isFinite(length)) {
      length = length >>> 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
        : (firstByte > 0xBF) ? 2
          : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; ++i) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + (bytes[i + 1] * 256))
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf = this.subarray(start, end)
  // Return an augmented `Uint8Array` instance
  newBuf.__proto__ = Buffer.prototype
  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset + 3] = (value >>> 24)
  this[offset + 2] = (value >>> 16)
  this[offset + 1] = (value >>> 8)
  this[offset] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  this[offset + 2] = (value >>> 16)
  this[offset + 3] = (value >>> 24)
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!Buffer.isBuffer(target)) throw new TypeError('argument should be a Buffer')
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('Index out of range')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start

  if (this === target && typeof Uint8Array.prototype.copyWithin === 'function') {
    // Use built-in when available, missing from IE11
    this.copyWithin(targetStart, start, end)
  } else if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (var i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, end),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if ((encoding === 'utf8' && code < 128) ||
          encoding === 'latin1') {
        // Fast path: If `val` fits into a single byte, use that numeric value.
        val = code
      }
    }
  } else if (typeof val === 'number') {
    val = val & 255
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : Buffer.from(val, encoding)
    var len = bytes.length
    if (len === 0) {
      throw new TypeError('The value "' + val +
        '" is invalid for argument "value"')
    }
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node takes equal signs as end of the Base64 encoding
  str = str.split('=')[0]
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = str.trim().replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

// ArrayBuffer or Uint8Array objects from other contexts (i.e. iframes) do not pass
// the `instanceof` check but they should be treated as of that type.
// See: https://github.com/feross/buffer/issues/166
function isInstance (obj, type) {
  return obj instanceof type ||
    (obj != null && obj.constructor != null && obj.constructor.name != null &&
      obj.constructor.name === type.name)
}
function numberIsNaN (obj) {
  // For IE11 support
  return obj !== obj // eslint-disable-line no-self-compare
}

}).call(this)}).call(this,require("buffer").Buffer)
},{"base64-js":1,"buffer":2,"ieee754":11}],3:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodeHTML = exports.decodeHTMLStrict = exports.decodeXML = void 0;
var entities_json_1 = __importDefault(require("./maps/entities.json"));
var legacy_json_1 = __importDefault(require("./maps/legacy.json"));
var xml_json_1 = __importDefault(require("./maps/xml.json"));
var decode_codepoint_1 = __importDefault(require("./decode_codepoint"));
var strictEntityRe = /&(?:[a-zA-Z0-9]+|#[xX][\da-fA-F]+|#\d+);/g;
exports.decodeXML = getStrictDecoder(xml_json_1.default);
exports.decodeHTMLStrict = getStrictDecoder(entities_json_1.default);
function getStrictDecoder(map) {
    var replace = getReplacer(map);
    return function (str) { return String(str).replace(strictEntityRe, replace); };
}
var sorter = function (a, b) { return (a < b ? 1 : -1); };
exports.decodeHTML = (function () {
    var legacy = Object.keys(legacy_json_1.default).sort(sorter);
    var keys = Object.keys(entities_json_1.default).sort(sorter);
    for (var i = 0, j = 0; i < keys.length; i++) {
        if (legacy[j] === keys[i]) {
            keys[i] += ";?";
            j++;
        }
        else {
            keys[i] += ";";
        }
    }
    var re = new RegExp("&(?:" + keys.join("|") + "|#[xX][\\da-fA-F]+;?|#\\d+;?)", "g");
    var replace = getReplacer(entities_json_1.default);
    function replacer(str) {
        if (str.substr(-1) !== ";")
            str += ";";
        return replace(str);
    }
    // TODO consider creating a merged map
    return function (str) { return String(str).replace(re, replacer); };
})();
function getReplacer(map) {
    return function replace(str) {
        if (str.charAt(1) === "#") {
            var secondChar = str.charAt(2);
            if (secondChar === "X" || secondChar === "x") {
                return decode_codepoint_1.default(parseInt(str.substr(3), 16));
            }
            return decode_codepoint_1.default(parseInt(str.substr(2), 10));
        }
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
        return map[str.slice(1, -1)] || str;
    };
}

},{"./decode_codepoint":4,"./maps/entities.json":8,"./maps/legacy.json":9,"./maps/xml.json":10}],4:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var decode_json_1 = __importDefault(require("./maps/decode.json"));
// Adapted from https://github.com/mathiasbynens/he/blob/master/src/he.js#L94-L119
var fromCodePoint = 
// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
String.fromCodePoint ||
    function (codePoint) {
        var output = "";
        if (codePoint > 0xffff) {
            codePoint -= 0x10000;
            output += String.fromCharCode(((codePoint >>> 10) & 0x3ff) | 0xd800);
            codePoint = 0xdc00 | (codePoint & 0x3ff);
        }
        output += String.fromCharCode(codePoint);
        return output;
    };
function decodeCodePoint(codePoint) {
    if ((codePoint >= 0xd800 && codePoint <= 0xdfff) || codePoint > 0x10ffff) {
        return "\uFFFD";
    }
    if (codePoint in decode_json_1.default) {
        codePoint = decode_json_1.default[codePoint];
    }
    return fromCodePoint(codePoint);
}
exports.default = decodeCodePoint;

},{"./maps/decode.json":7}],5:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.escapeUTF8 = exports.escape = exports.encodeNonAsciiHTML = exports.encodeHTML = exports.encodeXML = void 0;
var xml_json_1 = __importDefault(require("./maps/xml.json"));
var inverseXML = getInverseObj(xml_json_1.default);
var xmlReplacer = getInverseReplacer(inverseXML);
/**
 * Encodes all non-ASCII characters, as well as characters not valid in XML
 * documents using XML entities.
 *
 * If a character has no equivalent entity, a
 * numeric hexadecimal reference (eg. `&#xfc;`) will be used.
 */
exports.encodeXML = getASCIIEncoder(inverseXML);
var entities_json_1 = __importDefault(require("./maps/entities.json"));
var inverseHTML = getInverseObj(entities_json_1.default);
var htmlReplacer = getInverseReplacer(inverseHTML);
/**
 * Encodes all entities and non-ASCII characters in the input.
 *
 * This includes characters that are valid ASCII characters in HTML documents.
 * For example `#` will be encoded as `&num;`. To get a more compact output,
 * consider using the `encodeNonAsciiHTML` function.
 *
 * If a character has no equivalent entity, a
 * numeric hexadecimal reference (eg. `&#xfc;`) will be used.
 */
exports.encodeHTML = getInverse(inverseHTML, htmlReplacer);
/**
 * Encodes all non-ASCII characters, as well as characters not valid in HTML
 * documents using HTML entities.
 *
 * If a character has no equivalent entity, a
 * numeric hexadecimal reference (eg. `&#xfc;`) will be used.
 */
exports.encodeNonAsciiHTML = getASCIIEncoder(inverseHTML);
function getInverseObj(obj) {
    return Object.keys(obj)
        .sort()
        .reduce(function (inverse, name) {
        inverse[obj[name]] = "&" + name + ";";
        return inverse;
    }, {});
}
function getInverseReplacer(inverse) {
    var single = [];
    var multiple = [];
    for (var _i = 0, _a = Object.keys(inverse); _i < _a.length; _i++) {
        var k = _a[_i];
        if (k.length === 1) {
            // Add value to single array
            single.push("\\" + k);
        }
        else {
            // Add value to multiple array
            multiple.push(k);
        }
    }
    // Add ranges to single characters.
    single.sort();
    for (var start = 0; start < single.length - 1; start++) {
        // Find the end of a run of characters
        var end = start;
        while (end < single.length - 1 &&
            single[end].charCodeAt(1) + 1 === single[end + 1].charCodeAt(1)) {
            end += 1;
        }
        var count = 1 + end - start;
        // We want to replace at least three characters
        if (count < 3)
            continue;
        single.splice(start, count, single[start] + "-" + single[end]);
    }
    multiple.unshift("[" + single.join("") + "]");
    return new RegExp(multiple.join("|"), "g");
}
// /[^\0-\x7F]/gu
var reNonASCII = /(?:[\x80-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])/g;
var getCodePoint = 
// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
String.prototype.codePointAt != null
    ? // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        function (str) { return str.codePointAt(0); }
    : // http://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
        function (c) {
            return (c.charCodeAt(0) - 0xd800) * 0x400 +
                c.charCodeAt(1) -
                0xdc00 +
                0x10000;
        };
function singleCharReplacer(c) {
    return "&#x" + (c.length > 1 ? getCodePoint(c) : c.charCodeAt(0))
        .toString(16)
        .toUpperCase() + ";";
}
function getInverse(inverse, re) {
    return function (data) {
        return data
            .replace(re, function (name) { return inverse[name]; })
            .replace(reNonASCII, singleCharReplacer);
    };
}
var reEscapeChars = new RegExp(xmlReplacer.source + "|" + reNonASCII.source, "g");
/**
 * Encodes all non-ASCII characters, as well as characters not valid in XML
 * documents using numeric hexadecimal reference (eg. `&#xfc;`).
 *
 * Have a look at `escapeUTF8` if you want a more concise output at the expense
 * of reduced transportability.
 *
 * @param data String to escape.
 */
function escape(data) {
    return data.replace(reEscapeChars, singleCharReplacer);
}
exports.escape = escape;
/**
 * Encodes all characters not valid in XML documents using numeric hexadecimal
 * reference (eg. `&#xfc;`).
 *
 * Note that the output will be character-set dependent.
 *
 * @param data String to escape.
 */
function escapeUTF8(data) {
    return data.replace(xmlReplacer, singleCharReplacer);
}
exports.escapeUTF8 = escapeUTF8;
function getASCIIEncoder(obj) {
    return function (data) {
        return data.replace(reEscapeChars, function (c) { return obj[c] || singleCharReplacer(c); });
    };
}

},{"./maps/entities.json":8,"./maps/xml.json":10}],6:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodeXMLStrict = exports.decodeHTML5Strict = exports.decodeHTML4Strict = exports.decodeHTML5 = exports.decodeHTML4 = exports.decodeHTMLStrict = exports.decodeHTML = exports.decodeXML = exports.encodeHTML5 = exports.encodeHTML4 = exports.escapeUTF8 = exports.escape = exports.encodeNonAsciiHTML = exports.encodeHTML = exports.encodeXML = exports.encode = exports.decodeStrict = exports.decode = void 0;
var decode_1 = require("./decode");
var encode_1 = require("./encode");
/**
 * Decodes a string with entities.
 *
 * @param data String to decode.
 * @param level Optional level to decode at. 0 = XML, 1 = HTML. Default is 0.
 * @deprecated Use `decodeXML` or `decodeHTML` directly.
 */
function decode(data, level) {
    return (!level || level <= 0 ? decode_1.decodeXML : decode_1.decodeHTML)(data);
}
exports.decode = decode;
/**
 * Decodes a string with entities. Does not allow missing trailing semicolons for entities.
 *
 * @param data String to decode.
 * @param level Optional level to decode at. 0 = XML, 1 = HTML. Default is 0.
 * @deprecated Use `decodeHTMLStrict` or `decodeXML` directly.
 */
function decodeStrict(data, level) {
    return (!level || level <= 0 ? decode_1.decodeXML : decode_1.decodeHTMLStrict)(data);
}
exports.decodeStrict = decodeStrict;
/**
 * Encodes a string with entities.
 *
 * @param data String to encode.
 * @param level Optional level to encode at. 0 = XML, 1 = HTML. Default is 0.
 * @deprecated Use `encodeHTML`, `encodeXML` or `encodeNonAsciiHTML` directly.
 */
function encode(data, level) {
    return (!level || level <= 0 ? encode_1.encodeXML : encode_1.encodeHTML)(data);
}
exports.encode = encode;
var encode_2 = require("./encode");
Object.defineProperty(exports, "encodeXML", { enumerable: true, get: function () { return encode_2.encodeXML; } });
Object.defineProperty(exports, "encodeHTML", { enumerable: true, get: function () { return encode_2.encodeHTML; } });
Object.defineProperty(exports, "encodeNonAsciiHTML", { enumerable: true, get: function () { return encode_2.encodeNonAsciiHTML; } });
Object.defineProperty(exports, "escape", { enumerable: true, get: function () { return encode_2.escape; } });
Object.defineProperty(exports, "escapeUTF8", { enumerable: true, get: function () { return encode_2.escapeUTF8; } });
// Legacy aliases (deprecated)
Object.defineProperty(exports, "encodeHTML4", { enumerable: true, get: function () { return encode_2.encodeHTML; } });
Object.defineProperty(exports, "encodeHTML5", { enumerable: true, get: function () { return encode_2.encodeHTML; } });
var decode_2 = require("./decode");
Object.defineProperty(exports, "decodeXML", { enumerable: true, get: function () { return decode_2.decodeXML; } });
Object.defineProperty(exports, "decodeHTML", { enumerable: true, get: function () { return decode_2.decodeHTML; } });
Object.defineProperty(exports, "decodeHTMLStrict", { enumerable: true, get: function () { return decode_2.decodeHTMLStrict; } });
// Legacy aliases (deprecated)
Object.defineProperty(exports, "decodeHTML4", { enumerable: true, get: function () { return decode_2.decodeHTML; } });
Object.defineProperty(exports, "decodeHTML5", { enumerable: true, get: function () { return decode_2.decodeHTML; } });
Object.defineProperty(exports, "decodeHTML4Strict", { enumerable: true, get: function () { return decode_2.decodeHTMLStrict; } });
Object.defineProperty(exports, "decodeHTML5Strict", { enumerable: true, get: function () { return decode_2.decodeHTMLStrict; } });
Object.defineProperty(exports, "decodeXMLStrict", { enumerable: true, get: function () { return decode_2.decodeXML; } });

},{"./decode":3,"./encode":5}],7:[function(require,module,exports){
module.exports={"0":65533,"128":8364,"130":8218,"131":402,"132":8222,"133":8230,"134":8224,"135":8225,"136":710,"137":8240,"138":352,"139":8249,"140":338,"142":381,"145":8216,"146":8217,"147":8220,"148":8221,"149":8226,"150":8211,"151":8212,"152":732,"153":8482,"154":353,"155":8250,"156":339,"158":382,"159":376}

},{}],8:[function(require,module,exports){
module.exports={"Aacute":"Á","aacute":"á","Abreve":"Ă","abreve":"ă","ac":"∾","acd":"∿","acE":"∾̳","Acirc":"Â","acirc":"â","acute":"´","Acy":"А","acy":"а","AElig":"Æ","aelig":"æ","af":"⁡","Afr":"𝔄","afr":"𝔞","Agrave":"À","agrave":"à","alefsym":"ℵ","aleph":"ℵ","Alpha":"Α","alpha":"α","Amacr":"Ā","amacr":"ā","amalg":"⨿","amp":"&","AMP":"&","andand":"⩕","And":"⩓","and":"∧","andd":"⩜","andslope":"⩘","andv":"⩚","ang":"∠","ange":"⦤","angle":"∠","angmsdaa":"⦨","angmsdab":"⦩","angmsdac":"⦪","angmsdad":"⦫","angmsdae":"⦬","angmsdaf":"⦭","angmsdag":"⦮","angmsdah":"⦯","angmsd":"∡","angrt":"∟","angrtvb":"⊾","angrtvbd":"⦝","angsph":"∢","angst":"Å","angzarr":"⍼","Aogon":"Ą","aogon":"ą","Aopf":"𝔸","aopf":"𝕒","apacir":"⩯","ap":"≈","apE":"⩰","ape":"≊","apid":"≋","apos":"'","ApplyFunction":"⁡","approx":"≈","approxeq":"≊","Aring":"Å","aring":"å","Ascr":"𝒜","ascr":"𝒶","Assign":"≔","ast":"*","asymp":"≈","asympeq":"≍","Atilde":"Ã","atilde":"ã","Auml":"Ä","auml":"ä","awconint":"∳","awint":"⨑","backcong":"≌","backepsilon":"϶","backprime":"‵","backsim":"∽","backsimeq":"⋍","Backslash":"∖","Barv":"⫧","barvee":"⊽","barwed":"⌅","Barwed":"⌆","barwedge":"⌅","bbrk":"⎵","bbrktbrk":"⎶","bcong":"≌","Bcy":"Б","bcy":"б","bdquo":"„","becaus":"∵","because":"∵","Because":"∵","bemptyv":"⦰","bepsi":"϶","bernou":"ℬ","Bernoullis":"ℬ","Beta":"Β","beta":"β","beth":"ℶ","between":"≬","Bfr":"𝔅","bfr":"𝔟","bigcap":"⋂","bigcirc":"◯","bigcup":"⋃","bigodot":"⨀","bigoplus":"⨁","bigotimes":"⨂","bigsqcup":"⨆","bigstar":"★","bigtriangledown":"▽","bigtriangleup":"△","biguplus":"⨄","bigvee":"⋁","bigwedge":"⋀","bkarow":"⤍","blacklozenge":"⧫","blacksquare":"▪","blacktriangle":"▴","blacktriangledown":"▾","blacktriangleleft":"◂","blacktriangleright":"▸","blank":"␣","blk12":"▒","blk14":"░","blk34":"▓","block":"█","bne":"=⃥","bnequiv":"≡⃥","bNot":"⫭","bnot":"⌐","Bopf":"𝔹","bopf":"𝕓","bot":"⊥","bottom":"⊥","bowtie":"⋈","boxbox":"⧉","boxdl":"┐","boxdL":"╕","boxDl":"╖","boxDL":"╗","boxdr":"┌","boxdR":"╒","boxDr":"╓","boxDR":"╔","boxh":"─","boxH":"═","boxhd":"┬","boxHd":"╤","boxhD":"╥","boxHD":"╦","boxhu":"┴","boxHu":"╧","boxhU":"╨","boxHU":"╩","boxminus":"⊟","boxplus":"⊞","boxtimes":"⊠","boxul":"┘","boxuL":"╛","boxUl":"╜","boxUL":"╝","boxur":"└","boxuR":"╘","boxUr":"╙","boxUR":"╚","boxv":"│","boxV":"║","boxvh":"┼","boxvH":"╪","boxVh":"╫","boxVH":"╬","boxvl":"┤","boxvL":"╡","boxVl":"╢","boxVL":"╣","boxvr":"├","boxvR":"╞","boxVr":"╟","boxVR":"╠","bprime":"‵","breve":"˘","Breve":"˘","brvbar":"¦","bscr":"𝒷","Bscr":"ℬ","bsemi":"⁏","bsim":"∽","bsime":"⋍","bsolb":"⧅","bsol":"\\","bsolhsub":"⟈","bull":"•","bullet":"•","bump":"≎","bumpE":"⪮","bumpe":"≏","Bumpeq":"≎","bumpeq":"≏","Cacute":"Ć","cacute":"ć","capand":"⩄","capbrcup":"⩉","capcap":"⩋","cap":"∩","Cap":"⋒","capcup":"⩇","capdot":"⩀","CapitalDifferentialD":"ⅅ","caps":"∩︀","caret":"⁁","caron":"ˇ","Cayleys":"ℭ","ccaps":"⩍","Ccaron":"Č","ccaron":"č","Ccedil":"Ç","ccedil":"ç","Ccirc":"Ĉ","ccirc":"ĉ","Cconint":"∰","ccups":"⩌","ccupssm":"⩐","Cdot":"Ċ","cdot":"ċ","cedil":"¸","Cedilla":"¸","cemptyv":"⦲","cent":"¢","centerdot":"·","CenterDot":"·","cfr":"𝔠","Cfr":"ℭ","CHcy":"Ч","chcy":"ч","check":"✓","checkmark":"✓","Chi":"Χ","chi":"χ","circ":"ˆ","circeq":"≗","circlearrowleft":"↺","circlearrowright":"↻","circledast":"⊛","circledcirc":"⊚","circleddash":"⊝","CircleDot":"⊙","circledR":"®","circledS":"Ⓢ","CircleMinus":"⊖","CirclePlus":"⊕","CircleTimes":"⊗","cir":"○","cirE":"⧃","cire":"≗","cirfnint":"⨐","cirmid":"⫯","cirscir":"⧂","ClockwiseContourIntegral":"∲","CloseCurlyDoubleQuote":"”","CloseCurlyQuote":"’","clubs":"♣","clubsuit":"♣","colon":":","Colon":"∷","Colone":"⩴","colone":"≔","coloneq":"≔","comma":",","commat":"@","comp":"∁","compfn":"∘","complement":"∁","complexes":"ℂ","cong":"≅","congdot":"⩭","Congruent":"≡","conint":"∮","Conint":"∯","ContourIntegral":"∮","copf":"𝕔","Copf":"ℂ","coprod":"∐","Coproduct":"∐","copy":"©","COPY":"©","copysr":"℗","CounterClockwiseContourIntegral":"∳","crarr":"↵","cross":"✗","Cross":"⨯","Cscr":"𝒞","cscr":"𝒸","csub":"⫏","csube":"⫑","csup":"⫐","csupe":"⫒","ctdot":"⋯","cudarrl":"⤸","cudarrr":"⤵","cuepr":"⋞","cuesc":"⋟","cularr":"↶","cularrp":"⤽","cupbrcap":"⩈","cupcap":"⩆","CupCap":"≍","cup":"∪","Cup":"⋓","cupcup":"⩊","cupdot":"⊍","cupor":"⩅","cups":"∪︀","curarr":"↷","curarrm":"⤼","curlyeqprec":"⋞","curlyeqsucc":"⋟","curlyvee":"⋎","curlywedge":"⋏","curren":"¤","curvearrowleft":"↶","curvearrowright":"↷","cuvee":"⋎","cuwed":"⋏","cwconint":"∲","cwint":"∱","cylcty":"⌭","dagger":"†","Dagger":"‡","daleth":"ℸ","darr":"↓","Darr":"↡","dArr":"⇓","dash":"‐","Dashv":"⫤","dashv":"⊣","dbkarow":"⤏","dblac":"˝","Dcaron":"Ď","dcaron":"ď","Dcy":"Д","dcy":"д","ddagger":"‡","ddarr":"⇊","DD":"ⅅ","dd":"ⅆ","DDotrahd":"⤑","ddotseq":"⩷","deg":"°","Del":"∇","Delta":"Δ","delta":"δ","demptyv":"⦱","dfisht":"⥿","Dfr":"𝔇","dfr":"𝔡","dHar":"⥥","dharl":"⇃","dharr":"⇂","DiacriticalAcute":"´","DiacriticalDot":"˙","DiacriticalDoubleAcute":"˝","DiacriticalGrave":"`","DiacriticalTilde":"˜","diam":"⋄","diamond":"⋄","Diamond":"⋄","diamondsuit":"♦","diams":"♦","die":"¨","DifferentialD":"ⅆ","digamma":"ϝ","disin":"⋲","div":"÷","divide":"÷","divideontimes":"⋇","divonx":"⋇","DJcy":"Ђ","djcy":"ђ","dlcorn":"⌞","dlcrop":"⌍","dollar":"$","Dopf":"𝔻","dopf":"𝕕","Dot":"¨","dot":"˙","DotDot":"⃜","doteq":"≐","doteqdot":"≑","DotEqual":"≐","dotminus":"∸","dotplus":"∔","dotsquare":"⊡","doublebarwedge":"⌆","DoubleContourIntegral":"∯","DoubleDot":"¨","DoubleDownArrow":"⇓","DoubleLeftArrow":"⇐","DoubleLeftRightArrow":"⇔","DoubleLeftTee":"⫤","DoubleLongLeftArrow":"⟸","DoubleLongLeftRightArrow":"⟺","DoubleLongRightArrow":"⟹","DoubleRightArrow":"⇒","DoubleRightTee":"⊨","DoubleUpArrow":"⇑","DoubleUpDownArrow":"⇕","DoubleVerticalBar":"∥","DownArrowBar":"⤓","downarrow":"↓","DownArrow":"↓","Downarrow":"⇓","DownArrowUpArrow":"⇵","DownBreve":"̑","downdownarrows":"⇊","downharpoonleft":"⇃","downharpoonright":"⇂","DownLeftRightVector":"⥐","DownLeftTeeVector":"⥞","DownLeftVectorBar":"⥖","DownLeftVector":"↽","DownRightTeeVector":"⥟","DownRightVectorBar":"⥗","DownRightVector":"⇁","DownTeeArrow":"↧","DownTee":"⊤","drbkarow":"⤐","drcorn":"⌟","drcrop":"⌌","Dscr":"𝒟","dscr":"𝒹","DScy":"Ѕ","dscy":"ѕ","dsol":"⧶","Dstrok":"Đ","dstrok":"đ","dtdot":"⋱","dtri":"▿","dtrif":"▾","duarr":"⇵","duhar":"⥯","dwangle":"⦦","DZcy":"Џ","dzcy":"џ","dzigrarr":"⟿","Eacute":"É","eacute":"é","easter":"⩮","Ecaron":"Ě","ecaron":"ě","Ecirc":"Ê","ecirc":"ê","ecir":"≖","ecolon":"≕","Ecy":"Э","ecy":"э","eDDot":"⩷","Edot":"Ė","edot":"ė","eDot":"≑","ee":"ⅇ","efDot":"≒","Efr":"𝔈","efr":"𝔢","eg":"⪚","Egrave":"È","egrave":"è","egs":"⪖","egsdot":"⪘","el":"⪙","Element":"∈","elinters":"⏧","ell":"ℓ","els":"⪕","elsdot":"⪗","Emacr":"Ē","emacr":"ē","empty":"∅","emptyset":"∅","EmptySmallSquare":"◻","emptyv":"∅","EmptyVerySmallSquare":"▫","emsp13":" ","emsp14":" ","emsp":" ","ENG":"Ŋ","eng":"ŋ","ensp":" ","Eogon":"Ę","eogon":"ę","Eopf":"𝔼","eopf":"𝕖","epar":"⋕","eparsl":"⧣","eplus":"⩱","epsi":"ε","Epsilon":"Ε","epsilon":"ε","epsiv":"ϵ","eqcirc":"≖","eqcolon":"≕","eqsim":"≂","eqslantgtr":"⪖","eqslantless":"⪕","Equal":"⩵","equals":"=","EqualTilde":"≂","equest":"≟","Equilibrium":"⇌","equiv":"≡","equivDD":"⩸","eqvparsl":"⧥","erarr":"⥱","erDot":"≓","escr":"ℯ","Escr":"ℰ","esdot":"≐","Esim":"⩳","esim":"≂","Eta":"Η","eta":"η","ETH":"Ð","eth":"ð","Euml":"Ë","euml":"ë","euro":"€","excl":"!","exist":"∃","Exists":"∃","expectation":"ℰ","exponentiale":"ⅇ","ExponentialE":"ⅇ","fallingdotseq":"≒","Fcy":"Ф","fcy":"ф","female":"♀","ffilig":"ﬃ","fflig":"ﬀ","ffllig":"ﬄ","Ffr":"𝔉","ffr":"𝔣","filig":"ﬁ","FilledSmallSquare":"◼","FilledVerySmallSquare":"▪","fjlig":"fj","flat":"♭","fllig":"ﬂ","fltns":"▱","fnof":"ƒ","Fopf":"𝔽","fopf":"𝕗","forall":"∀","ForAll":"∀","fork":"⋔","forkv":"⫙","Fouriertrf":"ℱ","fpartint":"⨍","frac12":"½","frac13":"⅓","frac14":"¼","frac15":"⅕","frac16":"⅙","frac18":"⅛","frac23":"⅔","frac25":"⅖","frac34":"¾","frac35":"⅗","frac38":"⅜","frac45":"⅘","frac56":"⅚","frac58":"⅝","frac78":"⅞","frasl":"⁄","frown":"⌢","fscr":"𝒻","Fscr":"ℱ","gacute":"ǵ","Gamma":"Γ","gamma":"γ","Gammad":"Ϝ","gammad":"ϝ","gap":"⪆","Gbreve":"Ğ","gbreve":"ğ","Gcedil":"Ģ","Gcirc":"Ĝ","gcirc":"ĝ","Gcy":"Г","gcy":"г","Gdot":"Ġ","gdot":"ġ","ge":"≥","gE":"≧","gEl":"⪌","gel":"⋛","geq":"≥","geqq":"≧","geqslant":"⩾","gescc":"⪩","ges":"⩾","gesdot":"⪀","gesdoto":"⪂","gesdotol":"⪄","gesl":"⋛︀","gesles":"⪔","Gfr":"𝔊","gfr":"𝔤","gg":"≫","Gg":"⋙","ggg":"⋙","gimel":"ℷ","GJcy":"Ѓ","gjcy":"ѓ","gla":"⪥","gl":"≷","glE":"⪒","glj":"⪤","gnap":"⪊","gnapprox":"⪊","gne":"⪈","gnE":"≩","gneq":"⪈","gneqq":"≩","gnsim":"⋧","Gopf":"𝔾","gopf":"𝕘","grave":"`","GreaterEqual":"≥","GreaterEqualLess":"⋛","GreaterFullEqual":"≧","GreaterGreater":"⪢","GreaterLess":"≷","GreaterSlantEqual":"⩾","GreaterTilde":"≳","Gscr":"𝒢","gscr":"ℊ","gsim":"≳","gsime":"⪎","gsiml":"⪐","gtcc":"⪧","gtcir":"⩺","gt":">","GT":">","Gt":"≫","gtdot":"⋗","gtlPar":"⦕","gtquest":"⩼","gtrapprox":"⪆","gtrarr":"⥸","gtrdot":"⋗","gtreqless":"⋛","gtreqqless":"⪌","gtrless":"≷","gtrsim":"≳","gvertneqq":"≩︀","gvnE":"≩︀","Hacek":"ˇ","hairsp":" ","half":"½","hamilt":"ℋ","HARDcy":"Ъ","hardcy":"ъ","harrcir":"⥈","harr":"↔","hArr":"⇔","harrw":"↭","Hat":"^","hbar":"ℏ","Hcirc":"Ĥ","hcirc":"ĥ","hearts":"♥","heartsuit":"♥","hellip":"…","hercon":"⊹","hfr":"𝔥","Hfr":"ℌ","HilbertSpace":"ℋ","hksearow":"⤥","hkswarow":"⤦","hoarr":"⇿","homtht":"∻","hookleftarrow":"↩","hookrightarrow":"↪","hopf":"𝕙","Hopf":"ℍ","horbar":"―","HorizontalLine":"─","hscr":"𝒽","Hscr":"ℋ","hslash":"ℏ","Hstrok":"Ħ","hstrok":"ħ","HumpDownHump":"≎","HumpEqual":"≏","hybull":"⁃","hyphen":"‐","Iacute":"Í","iacute":"í","ic":"⁣","Icirc":"Î","icirc":"î","Icy":"И","icy":"и","Idot":"İ","IEcy":"Е","iecy":"е","iexcl":"¡","iff":"⇔","ifr":"𝔦","Ifr":"ℑ","Igrave":"Ì","igrave":"ì","ii":"ⅈ","iiiint":"⨌","iiint":"∭","iinfin":"⧜","iiota":"℩","IJlig":"Ĳ","ijlig":"ĳ","Imacr":"Ī","imacr":"ī","image":"ℑ","ImaginaryI":"ⅈ","imagline":"ℐ","imagpart":"ℑ","imath":"ı","Im":"ℑ","imof":"⊷","imped":"Ƶ","Implies":"⇒","incare":"℅","in":"∈","infin":"∞","infintie":"⧝","inodot":"ı","intcal":"⊺","int":"∫","Int":"∬","integers":"ℤ","Integral":"∫","intercal":"⊺","Intersection":"⋂","intlarhk":"⨗","intprod":"⨼","InvisibleComma":"⁣","InvisibleTimes":"⁢","IOcy":"Ё","iocy":"ё","Iogon":"Į","iogon":"į","Iopf":"𝕀","iopf":"𝕚","Iota":"Ι","iota":"ι","iprod":"⨼","iquest":"¿","iscr":"𝒾","Iscr":"ℐ","isin":"∈","isindot":"⋵","isinE":"⋹","isins":"⋴","isinsv":"⋳","isinv":"∈","it":"⁢","Itilde":"Ĩ","itilde":"ĩ","Iukcy":"І","iukcy":"і","Iuml":"Ï","iuml":"ï","Jcirc":"Ĵ","jcirc":"ĵ","Jcy":"Й","jcy":"й","Jfr":"𝔍","jfr":"𝔧","jmath":"ȷ","Jopf":"𝕁","jopf":"𝕛","Jscr":"𝒥","jscr":"𝒿","Jsercy":"Ј","jsercy":"ј","Jukcy":"Є","jukcy":"є","Kappa":"Κ","kappa":"κ","kappav":"ϰ","Kcedil":"Ķ","kcedil":"ķ","Kcy":"К","kcy":"к","Kfr":"𝔎","kfr":"𝔨","kgreen":"ĸ","KHcy":"Х","khcy":"х","KJcy":"Ќ","kjcy":"ќ","Kopf":"𝕂","kopf":"𝕜","Kscr":"𝒦","kscr":"𝓀","lAarr":"⇚","Lacute":"Ĺ","lacute":"ĺ","laemptyv":"⦴","lagran":"ℒ","Lambda":"Λ","lambda":"λ","lang":"⟨","Lang":"⟪","langd":"⦑","langle":"⟨","lap":"⪅","Laplacetrf":"ℒ","laquo":"«","larrb":"⇤","larrbfs":"⤟","larr":"←","Larr":"↞","lArr":"⇐","larrfs":"⤝","larrhk":"↩","larrlp":"↫","larrpl":"⤹","larrsim":"⥳","larrtl":"↢","latail":"⤙","lAtail":"⤛","lat":"⪫","late":"⪭","lates":"⪭︀","lbarr":"⤌","lBarr":"⤎","lbbrk":"❲","lbrace":"{","lbrack":"[","lbrke":"⦋","lbrksld":"⦏","lbrkslu":"⦍","Lcaron":"Ľ","lcaron":"ľ","Lcedil":"Ļ","lcedil":"ļ","lceil":"⌈","lcub":"{","Lcy":"Л","lcy":"л","ldca":"⤶","ldquo":"“","ldquor":"„","ldrdhar":"⥧","ldrushar":"⥋","ldsh":"↲","le":"≤","lE":"≦","LeftAngleBracket":"⟨","LeftArrowBar":"⇤","leftarrow":"←","LeftArrow":"←","Leftarrow":"⇐","LeftArrowRightArrow":"⇆","leftarrowtail":"↢","LeftCeiling":"⌈","LeftDoubleBracket":"⟦","LeftDownTeeVector":"⥡","LeftDownVectorBar":"⥙","LeftDownVector":"⇃","LeftFloor":"⌊","leftharpoondown":"↽","leftharpoonup":"↼","leftleftarrows":"⇇","leftrightarrow":"↔","LeftRightArrow":"↔","Leftrightarrow":"⇔","leftrightarrows":"⇆","leftrightharpoons":"⇋","leftrightsquigarrow":"↭","LeftRightVector":"⥎","LeftTeeArrow":"↤","LeftTee":"⊣","LeftTeeVector":"⥚","leftthreetimes":"⋋","LeftTriangleBar":"⧏","LeftTriangle":"⊲","LeftTriangleEqual":"⊴","LeftUpDownVector":"⥑","LeftUpTeeVector":"⥠","LeftUpVectorBar":"⥘","LeftUpVector":"↿","LeftVectorBar":"⥒","LeftVector":"↼","lEg":"⪋","leg":"⋚","leq":"≤","leqq":"≦","leqslant":"⩽","lescc":"⪨","les":"⩽","lesdot":"⩿","lesdoto":"⪁","lesdotor":"⪃","lesg":"⋚︀","lesges":"⪓","lessapprox":"⪅","lessdot":"⋖","lesseqgtr":"⋚","lesseqqgtr":"⪋","LessEqualGreater":"⋚","LessFullEqual":"≦","LessGreater":"≶","lessgtr":"≶","LessLess":"⪡","lesssim":"≲","LessSlantEqual":"⩽","LessTilde":"≲","lfisht":"⥼","lfloor":"⌊","Lfr":"𝔏","lfr":"𝔩","lg":"≶","lgE":"⪑","lHar":"⥢","lhard":"↽","lharu":"↼","lharul":"⥪","lhblk":"▄","LJcy":"Љ","ljcy":"љ","llarr":"⇇","ll":"≪","Ll":"⋘","llcorner":"⌞","Lleftarrow":"⇚","llhard":"⥫","lltri":"◺","Lmidot":"Ŀ","lmidot":"ŀ","lmoustache":"⎰","lmoust":"⎰","lnap":"⪉","lnapprox":"⪉","lne":"⪇","lnE":"≨","lneq":"⪇","lneqq":"≨","lnsim":"⋦","loang":"⟬","loarr":"⇽","lobrk":"⟦","longleftarrow":"⟵","LongLeftArrow":"⟵","Longleftarrow":"⟸","longleftrightarrow":"⟷","LongLeftRightArrow":"⟷","Longleftrightarrow":"⟺","longmapsto":"⟼","longrightarrow":"⟶","LongRightArrow":"⟶","Longrightarrow":"⟹","looparrowleft":"↫","looparrowright":"↬","lopar":"⦅","Lopf":"𝕃","lopf":"𝕝","loplus":"⨭","lotimes":"⨴","lowast":"∗","lowbar":"_","LowerLeftArrow":"↙","LowerRightArrow":"↘","loz":"◊","lozenge":"◊","lozf":"⧫","lpar":"(","lparlt":"⦓","lrarr":"⇆","lrcorner":"⌟","lrhar":"⇋","lrhard":"⥭","lrm":"‎","lrtri":"⊿","lsaquo":"‹","lscr":"𝓁","Lscr":"ℒ","lsh":"↰","Lsh":"↰","lsim":"≲","lsime":"⪍","lsimg":"⪏","lsqb":"[","lsquo":"‘","lsquor":"‚","Lstrok":"Ł","lstrok":"ł","ltcc":"⪦","ltcir":"⩹","lt":"<","LT":"<","Lt":"≪","ltdot":"⋖","lthree":"⋋","ltimes":"⋉","ltlarr":"⥶","ltquest":"⩻","ltri":"◃","ltrie":"⊴","ltrif":"◂","ltrPar":"⦖","lurdshar":"⥊","luruhar":"⥦","lvertneqq":"≨︀","lvnE":"≨︀","macr":"¯","male":"♂","malt":"✠","maltese":"✠","Map":"⤅","map":"↦","mapsto":"↦","mapstodown":"↧","mapstoleft":"↤","mapstoup":"↥","marker":"▮","mcomma":"⨩","Mcy":"М","mcy":"м","mdash":"—","mDDot":"∺","measuredangle":"∡","MediumSpace":" ","Mellintrf":"ℳ","Mfr":"𝔐","mfr":"𝔪","mho":"℧","micro":"µ","midast":"*","midcir":"⫰","mid":"∣","middot":"·","minusb":"⊟","minus":"−","minusd":"∸","minusdu":"⨪","MinusPlus":"∓","mlcp":"⫛","mldr":"…","mnplus":"∓","models":"⊧","Mopf":"𝕄","mopf":"𝕞","mp":"∓","mscr":"𝓂","Mscr":"ℳ","mstpos":"∾","Mu":"Μ","mu":"μ","multimap":"⊸","mumap":"⊸","nabla":"∇","Nacute":"Ń","nacute":"ń","nang":"∠⃒","nap":"≉","napE":"⩰̸","napid":"≋̸","napos":"ŉ","napprox":"≉","natural":"♮","naturals":"ℕ","natur":"♮","nbsp":" ","nbump":"≎̸","nbumpe":"≏̸","ncap":"⩃","Ncaron":"Ň","ncaron":"ň","Ncedil":"Ņ","ncedil":"ņ","ncong":"≇","ncongdot":"⩭̸","ncup":"⩂","Ncy":"Н","ncy":"н","ndash":"–","nearhk":"⤤","nearr":"↗","neArr":"⇗","nearrow":"↗","ne":"≠","nedot":"≐̸","NegativeMediumSpace":"​","NegativeThickSpace":"​","NegativeThinSpace":"​","NegativeVeryThinSpace":"​","nequiv":"≢","nesear":"⤨","nesim":"≂̸","NestedGreaterGreater":"≫","NestedLessLess":"≪","NewLine":"\n","nexist":"∄","nexists":"∄","Nfr":"𝔑","nfr":"𝔫","ngE":"≧̸","nge":"≱","ngeq":"≱","ngeqq":"≧̸","ngeqslant":"⩾̸","nges":"⩾̸","nGg":"⋙̸","ngsim":"≵","nGt":"≫⃒","ngt":"≯","ngtr":"≯","nGtv":"≫̸","nharr":"↮","nhArr":"⇎","nhpar":"⫲","ni":"∋","nis":"⋼","nisd":"⋺","niv":"∋","NJcy":"Њ","njcy":"њ","nlarr":"↚","nlArr":"⇍","nldr":"‥","nlE":"≦̸","nle":"≰","nleftarrow":"↚","nLeftarrow":"⇍","nleftrightarrow":"↮","nLeftrightarrow":"⇎","nleq":"≰","nleqq":"≦̸","nleqslant":"⩽̸","nles":"⩽̸","nless":"≮","nLl":"⋘̸","nlsim":"≴","nLt":"≪⃒","nlt":"≮","nltri":"⋪","nltrie":"⋬","nLtv":"≪̸","nmid":"∤","NoBreak":"⁠","NonBreakingSpace":" ","nopf":"𝕟","Nopf":"ℕ","Not":"⫬","not":"¬","NotCongruent":"≢","NotCupCap":"≭","NotDoubleVerticalBar":"∦","NotElement":"∉","NotEqual":"≠","NotEqualTilde":"≂̸","NotExists":"∄","NotGreater":"≯","NotGreaterEqual":"≱","NotGreaterFullEqual":"≧̸","NotGreaterGreater":"≫̸","NotGreaterLess":"≹","NotGreaterSlantEqual":"⩾̸","NotGreaterTilde":"≵","NotHumpDownHump":"≎̸","NotHumpEqual":"≏̸","notin":"∉","notindot":"⋵̸","notinE":"⋹̸","notinva":"∉","notinvb":"⋷","notinvc":"⋶","NotLeftTriangleBar":"⧏̸","NotLeftTriangle":"⋪","NotLeftTriangleEqual":"⋬","NotLess":"≮","NotLessEqual":"≰","NotLessGreater":"≸","NotLessLess":"≪̸","NotLessSlantEqual":"⩽̸","NotLessTilde":"≴","NotNestedGreaterGreater":"⪢̸","NotNestedLessLess":"⪡̸","notni":"∌","notniva":"∌","notnivb":"⋾","notnivc":"⋽","NotPrecedes":"⊀","NotPrecedesEqual":"⪯̸","NotPrecedesSlantEqual":"⋠","NotReverseElement":"∌","NotRightTriangleBar":"⧐̸","NotRightTriangle":"⋫","NotRightTriangleEqual":"⋭","NotSquareSubset":"⊏̸","NotSquareSubsetEqual":"⋢","NotSquareSuperset":"⊐̸","NotSquareSupersetEqual":"⋣","NotSubset":"⊂⃒","NotSubsetEqual":"⊈","NotSucceeds":"⊁","NotSucceedsEqual":"⪰̸","NotSucceedsSlantEqual":"⋡","NotSucceedsTilde":"≿̸","NotSuperset":"⊃⃒","NotSupersetEqual":"⊉","NotTilde":"≁","NotTildeEqual":"≄","NotTildeFullEqual":"≇","NotTildeTilde":"≉","NotVerticalBar":"∤","nparallel":"∦","npar":"∦","nparsl":"⫽⃥","npart":"∂̸","npolint":"⨔","npr":"⊀","nprcue":"⋠","nprec":"⊀","npreceq":"⪯̸","npre":"⪯̸","nrarrc":"⤳̸","nrarr":"↛","nrArr":"⇏","nrarrw":"↝̸","nrightarrow":"↛","nRightarrow":"⇏","nrtri":"⋫","nrtrie":"⋭","nsc":"⊁","nsccue":"⋡","nsce":"⪰̸","Nscr":"𝒩","nscr":"𝓃","nshortmid":"∤","nshortparallel":"∦","nsim":"≁","nsime":"≄","nsimeq":"≄","nsmid":"∤","nspar":"∦","nsqsube":"⋢","nsqsupe":"⋣","nsub":"⊄","nsubE":"⫅̸","nsube":"⊈","nsubset":"⊂⃒","nsubseteq":"⊈","nsubseteqq":"⫅̸","nsucc":"⊁","nsucceq":"⪰̸","nsup":"⊅","nsupE":"⫆̸","nsupe":"⊉","nsupset":"⊃⃒","nsupseteq":"⊉","nsupseteqq":"⫆̸","ntgl":"≹","Ntilde":"Ñ","ntilde":"ñ","ntlg":"≸","ntriangleleft":"⋪","ntrianglelefteq":"⋬","ntriangleright":"⋫","ntrianglerighteq":"⋭","Nu":"Ν","nu":"ν","num":"#","numero":"№","numsp":" ","nvap":"≍⃒","nvdash":"⊬","nvDash":"⊭","nVdash":"⊮","nVDash":"⊯","nvge":"≥⃒","nvgt":">⃒","nvHarr":"⤄","nvinfin":"⧞","nvlArr":"⤂","nvle":"≤⃒","nvlt":"<⃒","nvltrie":"⊴⃒","nvrArr":"⤃","nvrtrie":"⊵⃒","nvsim":"∼⃒","nwarhk":"⤣","nwarr":"↖","nwArr":"⇖","nwarrow":"↖","nwnear":"⤧","Oacute":"Ó","oacute":"ó","oast":"⊛","Ocirc":"Ô","ocirc":"ô","ocir":"⊚","Ocy":"О","ocy":"о","odash":"⊝","Odblac":"Ő","odblac":"ő","odiv":"⨸","odot":"⊙","odsold":"⦼","OElig":"Œ","oelig":"œ","ofcir":"⦿","Ofr":"𝔒","ofr":"𝔬","ogon":"˛","Ograve":"Ò","ograve":"ò","ogt":"⧁","ohbar":"⦵","ohm":"Ω","oint":"∮","olarr":"↺","olcir":"⦾","olcross":"⦻","oline":"‾","olt":"⧀","Omacr":"Ō","omacr":"ō","Omega":"Ω","omega":"ω","Omicron":"Ο","omicron":"ο","omid":"⦶","ominus":"⊖","Oopf":"𝕆","oopf":"𝕠","opar":"⦷","OpenCurlyDoubleQuote":"“","OpenCurlyQuote":"‘","operp":"⦹","oplus":"⊕","orarr":"↻","Or":"⩔","or":"∨","ord":"⩝","order":"ℴ","orderof":"ℴ","ordf":"ª","ordm":"º","origof":"⊶","oror":"⩖","orslope":"⩗","orv":"⩛","oS":"Ⓢ","Oscr":"𝒪","oscr":"ℴ","Oslash":"Ø","oslash":"ø","osol":"⊘","Otilde":"Õ","otilde":"õ","otimesas":"⨶","Otimes":"⨷","otimes":"⊗","Ouml":"Ö","ouml":"ö","ovbar":"⌽","OverBar":"‾","OverBrace":"⏞","OverBracket":"⎴","OverParenthesis":"⏜","para":"¶","parallel":"∥","par":"∥","parsim":"⫳","parsl":"⫽","part":"∂","PartialD":"∂","Pcy":"П","pcy":"п","percnt":"%","period":".","permil":"‰","perp":"⊥","pertenk":"‱","Pfr":"𝔓","pfr":"𝔭","Phi":"Φ","phi":"φ","phiv":"ϕ","phmmat":"ℳ","phone":"☎","Pi":"Π","pi":"π","pitchfork":"⋔","piv":"ϖ","planck":"ℏ","planckh":"ℎ","plankv":"ℏ","plusacir":"⨣","plusb":"⊞","pluscir":"⨢","plus":"+","plusdo":"∔","plusdu":"⨥","pluse":"⩲","PlusMinus":"±","plusmn":"±","plussim":"⨦","plustwo":"⨧","pm":"±","Poincareplane":"ℌ","pointint":"⨕","popf":"𝕡","Popf":"ℙ","pound":"£","prap":"⪷","Pr":"⪻","pr":"≺","prcue":"≼","precapprox":"⪷","prec":"≺","preccurlyeq":"≼","Precedes":"≺","PrecedesEqual":"⪯","PrecedesSlantEqual":"≼","PrecedesTilde":"≾","preceq":"⪯","precnapprox":"⪹","precneqq":"⪵","precnsim":"⋨","pre":"⪯","prE":"⪳","precsim":"≾","prime":"′","Prime":"″","primes":"ℙ","prnap":"⪹","prnE":"⪵","prnsim":"⋨","prod":"∏","Product":"∏","profalar":"⌮","profline":"⌒","profsurf":"⌓","prop":"∝","Proportional":"∝","Proportion":"∷","propto":"∝","prsim":"≾","prurel":"⊰","Pscr":"𝒫","pscr":"𝓅","Psi":"Ψ","psi":"ψ","puncsp":" ","Qfr":"𝔔","qfr":"𝔮","qint":"⨌","qopf":"𝕢","Qopf":"ℚ","qprime":"⁗","Qscr":"𝒬","qscr":"𝓆","quaternions":"ℍ","quatint":"⨖","quest":"?","questeq":"≟","quot":"\"","QUOT":"\"","rAarr":"⇛","race":"∽̱","Racute":"Ŕ","racute":"ŕ","radic":"√","raemptyv":"⦳","rang":"⟩","Rang":"⟫","rangd":"⦒","range":"⦥","rangle":"⟩","raquo":"»","rarrap":"⥵","rarrb":"⇥","rarrbfs":"⤠","rarrc":"⤳","rarr":"→","Rarr":"↠","rArr":"⇒","rarrfs":"⤞","rarrhk":"↪","rarrlp":"↬","rarrpl":"⥅","rarrsim":"⥴","Rarrtl":"⤖","rarrtl":"↣","rarrw":"↝","ratail":"⤚","rAtail":"⤜","ratio":"∶","rationals":"ℚ","rbarr":"⤍","rBarr":"⤏","RBarr":"⤐","rbbrk":"❳","rbrace":"}","rbrack":"]","rbrke":"⦌","rbrksld":"⦎","rbrkslu":"⦐","Rcaron":"Ř","rcaron":"ř","Rcedil":"Ŗ","rcedil":"ŗ","rceil":"⌉","rcub":"}","Rcy":"Р","rcy":"р","rdca":"⤷","rdldhar":"⥩","rdquo":"”","rdquor":"”","rdsh":"↳","real":"ℜ","realine":"ℛ","realpart":"ℜ","reals":"ℝ","Re":"ℜ","rect":"▭","reg":"®","REG":"®","ReverseElement":"∋","ReverseEquilibrium":"⇋","ReverseUpEquilibrium":"⥯","rfisht":"⥽","rfloor":"⌋","rfr":"𝔯","Rfr":"ℜ","rHar":"⥤","rhard":"⇁","rharu":"⇀","rharul":"⥬","Rho":"Ρ","rho":"ρ","rhov":"ϱ","RightAngleBracket":"⟩","RightArrowBar":"⇥","rightarrow":"→","RightArrow":"→","Rightarrow":"⇒","RightArrowLeftArrow":"⇄","rightarrowtail":"↣","RightCeiling":"⌉","RightDoubleBracket":"⟧","RightDownTeeVector":"⥝","RightDownVectorBar":"⥕","RightDownVector":"⇂","RightFloor":"⌋","rightharpoondown":"⇁","rightharpoonup":"⇀","rightleftarrows":"⇄","rightleftharpoons":"⇌","rightrightarrows":"⇉","rightsquigarrow":"↝","RightTeeArrow":"↦","RightTee":"⊢","RightTeeVector":"⥛","rightthreetimes":"⋌","RightTriangleBar":"⧐","RightTriangle":"⊳","RightTriangleEqual":"⊵","RightUpDownVector":"⥏","RightUpTeeVector":"⥜","RightUpVectorBar":"⥔","RightUpVector":"↾","RightVectorBar":"⥓","RightVector":"⇀","ring":"˚","risingdotseq":"≓","rlarr":"⇄","rlhar":"⇌","rlm":"‏","rmoustache":"⎱","rmoust":"⎱","rnmid":"⫮","roang":"⟭","roarr":"⇾","robrk":"⟧","ropar":"⦆","ropf":"𝕣","Ropf":"ℝ","roplus":"⨮","rotimes":"⨵","RoundImplies":"⥰","rpar":")","rpargt":"⦔","rppolint":"⨒","rrarr":"⇉","Rrightarrow":"⇛","rsaquo":"›","rscr":"𝓇","Rscr":"ℛ","rsh":"↱","Rsh":"↱","rsqb":"]","rsquo":"’","rsquor":"’","rthree":"⋌","rtimes":"⋊","rtri":"▹","rtrie":"⊵","rtrif":"▸","rtriltri":"⧎","RuleDelayed":"⧴","ruluhar":"⥨","rx":"℞","Sacute":"Ś","sacute":"ś","sbquo":"‚","scap":"⪸","Scaron":"Š","scaron":"š","Sc":"⪼","sc":"≻","sccue":"≽","sce":"⪰","scE":"⪴","Scedil":"Ş","scedil":"ş","Scirc":"Ŝ","scirc":"ŝ","scnap":"⪺","scnE":"⪶","scnsim":"⋩","scpolint":"⨓","scsim":"≿","Scy":"С","scy":"с","sdotb":"⊡","sdot":"⋅","sdote":"⩦","searhk":"⤥","searr":"↘","seArr":"⇘","searrow":"↘","sect":"§","semi":";","seswar":"⤩","setminus":"∖","setmn":"∖","sext":"✶","Sfr":"𝔖","sfr":"𝔰","sfrown":"⌢","sharp":"♯","SHCHcy":"Щ","shchcy":"щ","SHcy":"Ш","shcy":"ш","ShortDownArrow":"↓","ShortLeftArrow":"←","shortmid":"∣","shortparallel":"∥","ShortRightArrow":"→","ShortUpArrow":"↑","shy":"­","Sigma":"Σ","sigma":"σ","sigmaf":"ς","sigmav":"ς","sim":"∼","simdot":"⩪","sime":"≃","simeq":"≃","simg":"⪞","simgE":"⪠","siml":"⪝","simlE":"⪟","simne":"≆","simplus":"⨤","simrarr":"⥲","slarr":"←","SmallCircle":"∘","smallsetminus":"∖","smashp":"⨳","smeparsl":"⧤","smid":"∣","smile":"⌣","smt":"⪪","smte":"⪬","smtes":"⪬︀","SOFTcy":"Ь","softcy":"ь","solbar":"⌿","solb":"⧄","sol":"/","Sopf":"𝕊","sopf":"𝕤","spades":"♠","spadesuit":"♠","spar":"∥","sqcap":"⊓","sqcaps":"⊓︀","sqcup":"⊔","sqcups":"⊔︀","Sqrt":"√","sqsub":"⊏","sqsube":"⊑","sqsubset":"⊏","sqsubseteq":"⊑","sqsup":"⊐","sqsupe":"⊒","sqsupset":"⊐","sqsupseteq":"⊒","square":"□","Square":"□","SquareIntersection":"⊓","SquareSubset":"⊏","SquareSubsetEqual":"⊑","SquareSuperset":"⊐","SquareSupersetEqual":"⊒","SquareUnion":"⊔","squarf":"▪","squ":"□","squf":"▪","srarr":"→","Sscr":"𝒮","sscr":"𝓈","ssetmn":"∖","ssmile":"⌣","sstarf":"⋆","Star":"⋆","star":"☆","starf":"★","straightepsilon":"ϵ","straightphi":"ϕ","strns":"¯","sub":"⊂","Sub":"⋐","subdot":"⪽","subE":"⫅","sube":"⊆","subedot":"⫃","submult":"⫁","subnE":"⫋","subne":"⊊","subplus":"⪿","subrarr":"⥹","subset":"⊂","Subset":"⋐","subseteq":"⊆","subseteqq":"⫅","SubsetEqual":"⊆","subsetneq":"⊊","subsetneqq":"⫋","subsim":"⫇","subsub":"⫕","subsup":"⫓","succapprox":"⪸","succ":"≻","succcurlyeq":"≽","Succeeds":"≻","SucceedsEqual":"⪰","SucceedsSlantEqual":"≽","SucceedsTilde":"≿","succeq":"⪰","succnapprox":"⪺","succneqq":"⪶","succnsim":"⋩","succsim":"≿","SuchThat":"∋","sum":"∑","Sum":"∑","sung":"♪","sup1":"¹","sup2":"²","sup3":"³","sup":"⊃","Sup":"⋑","supdot":"⪾","supdsub":"⫘","supE":"⫆","supe":"⊇","supedot":"⫄","Superset":"⊃","SupersetEqual":"⊇","suphsol":"⟉","suphsub":"⫗","suplarr":"⥻","supmult":"⫂","supnE":"⫌","supne":"⊋","supplus":"⫀","supset":"⊃","Supset":"⋑","supseteq":"⊇","supseteqq":"⫆","supsetneq":"⊋","supsetneqq":"⫌","supsim":"⫈","supsub":"⫔","supsup":"⫖","swarhk":"⤦","swarr":"↙","swArr":"⇙","swarrow":"↙","swnwar":"⤪","szlig":"ß","Tab":"\t","target":"⌖","Tau":"Τ","tau":"τ","tbrk":"⎴","Tcaron":"Ť","tcaron":"ť","Tcedil":"Ţ","tcedil":"ţ","Tcy":"Т","tcy":"т","tdot":"⃛","telrec":"⌕","Tfr":"𝔗","tfr":"𝔱","there4":"∴","therefore":"∴","Therefore":"∴","Theta":"Θ","theta":"θ","thetasym":"ϑ","thetav":"ϑ","thickapprox":"≈","thicksim":"∼","ThickSpace":"  ","ThinSpace":" ","thinsp":" ","thkap":"≈","thksim":"∼","THORN":"Þ","thorn":"þ","tilde":"˜","Tilde":"∼","TildeEqual":"≃","TildeFullEqual":"≅","TildeTilde":"≈","timesbar":"⨱","timesb":"⊠","times":"×","timesd":"⨰","tint":"∭","toea":"⤨","topbot":"⌶","topcir":"⫱","top":"⊤","Topf":"𝕋","topf":"𝕥","topfork":"⫚","tosa":"⤩","tprime":"‴","trade":"™","TRADE":"™","triangle":"▵","triangledown":"▿","triangleleft":"◃","trianglelefteq":"⊴","triangleq":"≜","triangleright":"▹","trianglerighteq":"⊵","tridot":"◬","trie":"≜","triminus":"⨺","TripleDot":"⃛","triplus":"⨹","trisb":"⧍","tritime":"⨻","trpezium":"⏢","Tscr":"𝒯","tscr":"𝓉","TScy":"Ц","tscy":"ц","TSHcy":"Ћ","tshcy":"ћ","Tstrok":"Ŧ","tstrok":"ŧ","twixt":"≬","twoheadleftarrow":"↞","twoheadrightarrow":"↠","Uacute":"Ú","uacute":"ú","uarr":"↑","Uarr":"↟","uArr":"⇑","Uarrocir":"⥉","Ubrcy":"Ў","ubrcy":"ў","Ubreve":"Ŭ","ubreve":"ŭ","Ucirc":"Û","ucirc":"û","Ucy":"У","ucy":"у","udarr":"⇅","Udblac":"Ű","udblac":"ű","udhar":"⥮","ufisht":"⥾","Ufr":"𝔘","ufr":"𝔲","Ugrave":"Ù","ugrave":"ù","uHar":"⥣","uharl":"↿","uharr":"↾","uhblk":"▀","ulcorn":"⌜","ulcorner":"⌜","ulcrop":"⌏","ultri":"◸","Umacr":"Ū","umacr":"ū","uml":"¨","UnderBar":"_","UnderBrace":"⏟","UnderBracket":"⎵","UnderParenthesis":"⏝","Union":"⋃","UnionPlus":"⊎","Uogon":"Ų","uogon":"ų","Uopf":"𝕌","uopf":"𝕦","UpArrowBar":"⤒","uparrow":"↑","UpArrow":"↑","Uparrow":"⇑","UpArrowDownArrow":"⇅","updownarrow":"↕","UpDownArrow":"↕","Updownarrow":"⇕","UpEquilibrium":"⥮","upharpoonleft":"↿","upharpoonright":"↾","uplus":"⊎","UpperLeftArrow":"↖","UpperRightArrow":"↗","upsi":"υ","Upsi":"ϒ","upsih":"ϒ","Upsilon":"Υ","upsilon":"υ","UpTeeArrow":"↥","UpTee":"⊥","upuparrows":"⇈","urcorn":"⌝","urcorner":"⌝","urcrop":"⌎","Uring":"Ů","uring":"ů","urtri":"◹","Uscr":"𝒰","uscr":"𝓊","utdot":"⋰","Utilde":"Ũ","utilde":"ũ","utri":"▵","utrif":"▴","uuarr":"⇈","Uuml":"Ü","uuml":"ü","uwangle":"⦧","vangrt":"⦜","varepsilon":"ϵ","varkappa":"ϰ","varnothing":"∅","varphi":"ϕ","varpi":"ϖ","varpropto":"∝","varr":"↕","vArr":"⇕","varrho":"ϱ","varsigma":"ς","varsubsetneq":"⊊︀","varsubsetneqq":"⫋︀","varsupsetneq":"⊋︀","varsupsetneqq":"⫌︀","vartheta":"ϑ","vartriangleleft":"⊲","vartriangleright":"⊳","vBar":"⫨","Vbar":"⫫","vBarv":"⫩","Vcy":"В","vcy":"в","vdash":"⊢","vDash":"⊨","Vdash":"⊩","VDash":"⊫","Vdashl":"⫦","veebar":"⊻","vee":"∨","Vee":"⋁","veeeq":"≚","vellip":"⋮","verbar":"|","Verbar":"‖","vert":"|","Vert":"‖","VerticalBar":"∣","VerticalLine":"|","VerticalSeparator":"❘","VerticalTilde":"≀","VeryThinSpace":" ","Vfr":"𝔙","vfr":"𝔳","vltri":"⊲","vnsub":"⊂⃒","vnsup":"⊃⃒","Vopf":"𝕍","vopf":"𝕧","vprop":"∝","vrtri":"⊳","Vscr":"𝒱","vscr":"𝓋","vsubnE":"⫋︀","vsubne":"⊊︀","vsupnE":"⫌︀","vsupne":"⊋︀","Vvdash":"⊪","vzigzag":"⦚","Wcirc":"Ŵ","wcirc":"ŵ","wedbar":"⩟","wedge":"∧","Wedge":"⋀","wedgeq":"≙","weierp":"℘","Wfr":"𝔚","wfr":"𝔴","Wopf":"𝕎","wopf":"𝕨","wp":"℘","wr":"≀","wreath":"≀","Wscr":"𝒲","wscr":"𝓌","xcap":"⋂","xcirc":"◯","xcup":"⋃","xdtri":"▽","Xfr":"𝔛","xfr":"𝔵","xharr":"⟷","xhArr":"⟺","Xi":"Ξ","xi":"ξ","xlarr":"⟵","xlArr":"⟸","xmap":"⟼","xnis":"⋻","xodot":"⨀","Xopf":"𝕏","xopf":"𝕩","xoplus":"⨁","xotime":"⨂","xrarr":"⟶","xrArr":"⟹","Xscr":"𝒳","xscr":"𝓍","xsqcup":"⨆","xuplus":"⨄","xutri":"△","xvee":"⋁","xwedge":"⋀","Yacute":"Ý","yacute":"ý","YAcy":"Я","yacy":"я","Ycirc":"Ŷ","ycirc":"ŷ","Ycy":"Ы","ycy":"ы","yen":"¥","Yfr":"𝔜","yfr":"𝔶","YIcy":"Ї","yicy":"ї","Yopf":"𝕐","yopf":"𝕪","Yscr":"𝒴","yscr":"𝓎","YUcy":"Ю","yucy":"ю","yuml":"ÿ","Yuml":"Ÿ","Zacute":"Ź","zacute":"ź","Zcaron":"Ž","zcaron":"ž","Zcy":"З","zcy":"з","Zdot":"Ż","zdot":"ż","zeetrf":"ℨ","ZeroWidthSpace":"​","Zeta":"Ζ","zeta":"ζ","zfr":"𝔷","Zfr":"ℨ","ZHcy":"Ж","zhcy":"ж","zigrarr":"⇝","zopf":"𝕫","Zopf":"ℤ","Zscr":"𝒵","zscr":"𝓏","zwj":"‍","zwnj":"‌"}

},{}],9:[function(require,module,exports){
module.exports={"Aacute":"Á","aacute":"á","Acirc":"Â","acirc":"â","acute":"´","AElig":"Æ","aelig":"æ","Agrave":"À","agrave":"à","amp":"&","AMP":"&","Aring":"Å","aring":"å","Atilde":"Ã","atilde":"ã","Auml":"Ä","auml":"ä","brvbar":"¦","Ccedil":"Ç","ccedil":"ç","cedil":"¸","cent":"¢","copy":"©","COPY":"©","curren":"¤","deg":"°","divide":"÷","Eacute":"É","eacute":"é","Ecirc":"Ê","ecirc":"ê","Egrave":"È","egrave":"è","ETH":"Ð","eth":"ð","Euml":"Ë","euml":"ë","frac12":"½","frac14":"¼","frac34":"¾","gt":">","GT":">","Iacute":"Í","iacute":"í","Icirc":"Î","icirc":"î","iexcl":"¡","Igrave":"Ì","igrave":"ì","iquest":"¿","Iuml":"Ï","iuml":"ï","laquo":"«","lt":"<","LT":"<","macr":"¯","micro":"µ","middot":"·","nbsp":" ","not":"¬","Ntilde":"Ñ","ntilde":"ñ","Oacute":"Ó","oacute":"ó","Ocirc":"Ô","ocirc":"ô","Ograve":"Ò","ograve":"ò","ordf":"ª","ordm":"º","Oslash":"Ø","oslash":"ø","Otilde":"Õ","otilde":"õ","Ouml":"Ö","ouml":"ö","para":"¶","plusmn":"±","pound":"£","quot":"\"","QUOT":"\"","raquo":"»","reg":"®","REG":"®","sect":"§","shy":"­","sup1":"¹","sup2":"²","sup3":"³","szlig":"ß","THORN":"Þ","thorn":"þ","times":"×","Uacute":"Ú","uacute":"ú","Ucirc":"Û","ucirc":"û","Ugrave":"Ù","ugrave":"ù","uml":"¨","Uuml":"Ü","uuml":"ü","Yacute":"Ý","yacute":"ý","yen":"¥","yuml":"ÿ"}

},{}],10:[function(require,module,exports){
module.exports={"amp":"&","apos":"'","gt":">","lt":"<","quot":"\""}

},{}],11:[function(require,module,exports){
/*! ieee754. BSD-3-Clause License. Feross Aboukhadijeh <https://feross.org/opensource> */
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = ((value * c) - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],12:[function(require,module,exports){
"use strict";
/**
 * Request objects hold information for a particular source (see sources for example)
 * This allows us to to use a generic api to make the calls against any source
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.urlEncodeObject = exports.convertTime = exports.Source = void 0;
class Source {
    constructor(cheerio) {
        this.cheerio = cheerio;
    }
    /**
     * @deprecated use {@link Source.getSearchResults getSearchResults} instead
     */
    searchRequest(query, metadata) {
        return this.getSearchResults(query, metadata);
    }
    /**
     * @deprecated use {@link Source.getSearchTags} instead
     */
    async getTags() {
        // @ts-ignore
        return this.getSearchTags?.();
    }
}
exports.Source = Source;
// Many sites use '[x] time ago' - Figured it would be good to handle these cases in general
function convertTime(timeAgo) {
    let time;
    let trimmed = Number((/\d*/.exec(timeAgo) ?? [])[0]);
    trimmed = (trimmed == 0 && timeAgo.includes('a')) ? 1 : trimmed;
    if (timeAgo.includes('minutes')) {
        time = new Date(Date.now() - trimmed * 60000);
    }
    else if (timeAgo.includes('hours')) {
        time = new Date(Date.now() - trimmed * 3600000);
    }
    else if (timeAgo.includes('days')) {
        time = new Date(Date.now() - trimmed * 86400000);
    }
    else if (timeAgo.includes('year') || timeAgo.includes('years')) {
        time = new Date(Date.now() - trimmed * 31556952000);
    }
    else {
        time = new Date(Date.now());
    }
    return time;
}
exports.convertTime = convertTime;
/**
 * When a function requires a POST body, it always should be defined as a JsonObject
 * and then passed through this function to ensure that it's encoded properly.
 * @param obj
 */
function urlEncodeObject(obj) {
    let ret = {};
    for (const entry of Object.entries(obj)) {
        ret[encodeURIComponent(entry[0])] = encodeURIComponent(entry[1]);
    }
    return ret;
}
exports.urlEncodeObject = urlEncodeObject;

},{}],13:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tracker = void 0;
class Tracker {
    constructor(cheerio) {
        this.cheerio = cheerio;
    }
}
exports.Tracker = Tracker;

},{}],14:[function(require,module,exports){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("./Source"), exports);
__exportStar(require("./Tracker"), exports);

},{"./Source":12,"./Tracker":13}],15:[function(require,module,exports){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("./base"), exports);
__exportStar(require("./models"), exports);

},{"./base":14,"./models":57}],16:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],17:[function(require,module,exports){
arguments[4][16][0].apply(exports,arguments)
},{"dup":16}],18:[function(require,module,exports){
arguments[4][16][0].apply(exports,arguments)
},{"dup":16}],19:[function(require,module,exports){
arguments[4][16][0].apply(exports,arguments)
},{"dup":16}],20:[function(require,module,exports){
arguments[4][16][0].apply(exports,arguments)
},{"dup":16}],21:[function(require,module,exports){
arguments[4][16][0].apply(exports,arguments)
},{"dup":16}],22:[function(require,module,exports){
arguments[4][16][0].apply(exports,arguments)
},{"dup":16}],23:[function(require,module,exports){
arguments[4][16][0].apply(exports,arguments)
},{"dup":16}],24:[function(require,module,exports){
arguments[4][16][0].apply(exports,arguments)
},{"dup":16}],25:[function(require,module,exports){
arguments[4][16][0].apply(exports,arguments)
},{"dup":16}],26:[function(require,module,exports){
arguments[4][16][0].apply(exports,arguments)
},{"dup":16}],27:[function(require,module,exports){
arguments[4][16][0].apply(exports,arguments)
},{"dup":16}],28:[function(require,module,exports){
arguments[4][16][0].apply(exports,arguments)
},{"dup":16}],29:[function(require,module,exports){
arguments[4][16][0].apply(exports,arguments)
},{"dup":16}],30:[function(require,module,exports){
arguments[4][16][0].apply(exports,arguments)
},{"dup":16}],31:[function(require,module,exports){
arguments[4][16][0].apply(exports,arguments)
},{"dup":16}],32:[function(require,module,exports){
arguments[4][16][0].apply(exports,arguments)
},{"dup":16}],33:[function(require,module,exports){
arguments[4][16][0].apply(exports,arguments)
},{"dup":16}],34:[function(require,module,exports){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("./Button"), exports);
__exportStar(require("./Form"), exports);
__exportStar(require("./Header"), exports);
__exportStar(require("./InputField"), exports);
__exportStar(require("./Label"), exports);
__exportStar(require("./Link"), exports);
__exportStar(require("./MultilineLabel"), exports);
__exportStar(require("./NavigationButton"), exports);
__exportStar(require("./OAuthButton"), exports);
__exportStar(require("./Section"), exports);
__exportStar(require("./Select"), exports);
__exportStar(require("./Switch"), exports);
__exportStar(require("./WebViewButton"), exports);
__exportStar(require("./FormRow"), exports);
__exportStar(require("./Stepper"), exports);

},{"./Button":19,"./Form":20,"./FormRow":21,"./Header":22,"./InputField":23,"./Label":24,"./Link":25,"./MultilineLabel":26,"./NavigationButton":27,"./OAuthButton":28,"./Section":29,"./Select":30,"./Stepper":31,"./Switch":32,"./WebViewButton":33}],35:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HomeSectionType = void 0;
var HomeSectionType;
(function (HomeSectionType) {
    HomeSectionType["singleRowNormal"] = "singleRowNormal";
    HomeSectionType["singleRowLarge"] = "singleRowLarge";
    HomeSectionType["doubleRow"] = "doubleRow";
    HomeSectionType["featured"] = "featured";
})(HomeSectionType = exports.HomeSectionType || (exports.HomeSectionType = {}));

},{}],36:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LanguageCode = void 0;
var LanguageCode;
(function (LanguageCode) {
    LanguageCode["UNKNOWN"] = "_unknown";
    LanguageCode["BENGALI"] = "bd";
    LanguageCode["BULGARIAN"] = "bg";
    LanguageCode["BRAZILIAN"] = "br";
    LanguageCode["CHINEESE"] = "cn";
    LanguageCode["CZECH"] = "cz";
    LanguageCode["GERMAN"] = "de";
    LanguageCode["DANISH"] = "dk";
    LanguageCode["ENGLISH"] = "gb";
    LanguageCode["SPANISH"] = "es";
    LanguageCode["FINNISH"] = "fi";
    LanguageCode["FRENCH"] = "fr";
    LanguageCode["WELSH"] = "gb";
    LanguageCode["GREEK"] = "gr";
    LanguageCode["CHINEESE_HONGKONG"] = "hk";
    LanguageCode["HUNGARIAN"] = "hu";
    LanguageCode["INDONESIAN"] = "id";
    LanguageCode["ISRELI"] = "il";
    LanguageCode["INDIAN"] = "in";
    LanguageCode["IRAN"] = "ir";
    LanguageCode["ITALIAN"] = "it";
    LanguageCode["JAPANESE"] = "jp";
    LanguageCode["KOREAN"] = "kr";
    LanguageCode["LITHUANIAN"] = "lt";
    LanguageCode["MONGOLIAN"] = "mn";
    LanguageCode["MEXIAN"] = "mx";
    LanguageCode["MALAY"] = "my";
    LanguageCode["DUTCH"] = "nl";
    LanguageCode["NORWEGIAN"] = "no";
    LanguageCode["PHILIPPINE"] = "ph";
    LanguageCode["POLISH"] = "pl";
    LanguageCode["PORTUGUESE"] = "pt";
    LanguageCode["ROMANIAN"] = "ro";
    LanguageCode["RUSSIAN"] = "ru";
    LanguageCode["SANSKRIT"] = "sa";
    LanguageCode["SAMI"] = "si";
    LanguageCode["THAI"] = "th";
    LanguageCode["TURKISH"] = "tr";
    LanguageCode["UKRAINIAN"] = "ua";
    LanguageCode["VIETNAMESE"] = "vn";
})(LanguageCode = exports.LanguageCode || (exports.LanguageCode = {}));

},{}],37:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MangaStatus = void 0;
var MangaStatus;
(function (MangaStatus) {
    MangaStatus[MangaStatus["ONGOING"] = 1] = "ONGOING";
    MangaStatus[MangaStatus["COMPLETED"] = 0] = "COMPLETED";
    MangaStatus[MangaStatus["UNKNOWN"] = 2] = "UNKNOWN";
    MangaStatus[MangaStatus["ABANDONED"] = 3] = "ABANDONED";
    MangaStatus[MangaStatus["HIATUS"] = 4] = "HIATUS";
})(MangaStatus = exports.MangaStatus || (exports.MangaStatus = {}));

},{}],38:[function(require,module,exports){
arguments[4][16][0].apply(exports,arguments)
},{"dup":16}],39:[function(require,module,exports){
arguments[4][16][0].apply(exports,arguments)
},{"dup":16}],40:[function(require,module,exports){
arguments[4][16][0].apply(exports,arguments)
},{"dup":16}],41:[function(require,module,exports){
arguments[4][16][0].apply(exports,arguments)
},{"dup":16}],42:[function(require,module,exports){
arguments[4][16][0].apply(exports,arguments)
},{"dup":16}],43:[function(require,module,exports){
arguments[4][16][0].apply(exports,arguments)
},{"dup":16}],44:[function(require,module,exports){
arguments[4][16][0].apply(exports,arguments)
},{"dup":16}],45:[function(require,module,exports){
arguments[4][16][0].apply(exports,arguments)
},{"dup":16}],46:[function(require,module,exports){
arguments[4][16][0].apply(exports,arguments)
},{"dup":16}],47:[function(require,module,exports){
arguments[4][16][0].apply(exports,arguments)
},{"dup":16}],48:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchOperator = void 0;
var SearchOperator;
(function (SearchOperator) {
    SearchOperator["AND"] = "AND";
    SearchOperator["OR"] = "OR";
})(SearchOperator = exports.SearchOperator || (exports.SearchOperator = {}));

},{}],49:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentRating = void 0;
/**
 * A content rating to be attributed to each source.
 */
var ContentRating;
(function (ContentRating) {
    ContentRating["EVERYONE"] = "EVERYONE";
    ContentRating["MATURE"] = "MATURE";
    ContentRating["ADULT"] = "ADULT";
})(ContentRating = exports.ContentRating || (exports.ContentRating = {}));

},{}],50:[function(require,module,exports){
arguments[4][16][0].apply(exports,arguments)
},{"dup":16}],51:[function(require,module,exports){
arguments[4][16][0].apply(exports,arguments)
},{"dup":16}],52:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TagType = void 0;
/**
 * An enumerator which {@link SourceTags} uses to define the color of the tag rendered on the website.
 * Five types are available: blue, green, grey, yellow and red, the default one is blue.
 * Common colors are red for (Broken), yellow for (+18), grey for (Country-Proof)
 */
var TagType;
(function (TagType) {
    TagType["BLUE"] = "default";
    TagType["GREEN"] = "success";
    TagType["GREY"] = "info";
    TagType["YELLOW"] = "warning";
    TagType["RED"] = "danger";
})(TagType = exports.TagType || (exports.TagType = {}));

},{}],53:[function(require,module,exports){
arguments[4][16][0].apply(exports,arguments)
},{"dup":16}],54:[function(require,module,exports){
arguments[4][16][0].apply(exports,arguments)
},{"dup":16}],55:[function(require,module,exports){
arguments[4][16][0].apply(exports,arguments)
},{"dup":16}],56:[function(require,module,exports){
arguments[4][16][0].apply(exports,arguments)
},{"dup":16}],57:[function(require,module,exports){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("./Chapter"), exports);
__exportStar(require("./ChapterDetails"), exports);
__exportStar(require("./HomeSection"), exports);
__exportStar(require("./Manga"), exports);
__exportStar(require("./MangaTile"), exports);
__exportStar(require("./RequestObject"), exports);
__exportStar(require("./SearchRequest"), exports);
__exportStar(require("./TagSection"), exports);
__exportStar(require("./SourceTag"), exports);
__exportStar(require("./Languages"), exports);
__exportStar(require("./Constants"), exports);
__exportStar(require("./MangaUpdate"), exports);
__exportStar(require("./PagedResults"), exports);
__exportStar(require("./ResponseObject"), exports);
__exportStar(require("./RequestManager"), exports);
__exportStar(require("./RequestHeaders"), exports);
__exportStar(require("./SourceInfo"), exports);
__exportStar(require("./SourceStateManager"), exports);
__exportStar(require("./RequestInterceptor"), exports);
__exportStar(require("./DynamicUI"), exports);
__exportStar(require("./TrackedManga"), exports);
__exportStar(require("./SourceManga"), exports);
__exportStar(require("./TrackedMangaChapterReadAction"), exports);
__exportStar(require("./TrackerActionQueue"), exports);
__exportStar(require("./SearchField"), exports);
__exportStar(require("./RawData"), exports);

},{"./Chapter":16,"./ChapterDetails":17,"./Constants":18,"./DynamicUI":34,"./HomeSection":35,"./Languages":36,"./Manga":37,"./MangaTile":38,"./MangaUpdate":39,"./PagedResults":40,"./RawData":41,"./RequestHeaders":42,"./RequestInterceptor":43,"./RequestManager":44,"./RequestObject":45,"./ResponseObject":46,"./SearchField":47,"./SearchRequest":48,"./SourceInfo":49,"./SourceManga":50,"./SourceStateManager":51,"./SourceTag":52,"./TagSection":53,"./TrackedManga":54,"./TrackedMangaChapterReadAction":55,"./TrackerActionQueue":56}],58:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MangaDex = exports.MangaDexInfo = void 0;
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable no-case-declarations */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
const paperback_extensions_common_1 = require("paperback-extensions-common");
const entities = require("entities");
const MangaDexSettings_1 = require("./MangaDexSettings");
const MangaDexHelper_1 = require("./MangaDexHelper");
const MangaDexSimilarManga_1 = require("./MangaDexSimilarManga");
const tag_json_1 = __importDefault(require("./external/tag.json"));
const MangaDexParser_1 = require("./MangaDexParser");
const MANGADEX_DOMAIN = 'https://mangadex.org';
const MANGADEX_API = 'https://api.mangadex.org';
const COVER_BASE_URL = 'https://uploads.mangadex.org/covers';
// Titles recommendations are shown on the homepage when enabled in source settings.
// Recommendations are made using https://github.com/Similar-Manga
const RECOMMENDATION_URL = 'https://framboisepi.github.io/SimilarData';
exports.MangaDexInfo = {
    author: 'nar1n',
    description: 'Extension that pulls manga from MangaDex',
    icon: 'icon.png',
    name: 'MangaDex',
    version: '2.1.5',
    authorWebsite: 'https://github.com/nar1n',
    websiteBaseURL: MANGADEX_DOMAIN,
    contentRating: paperback_extensions_common_1.ContentRating.EVERYONE,
    language: paperback_extensions_common_1.LanguageCode.ENGLISH,
    sourceTags: [
        {
            text: 'Recommended',
            type: paperback_extensions_common_1.TagType.BLUE,
        },
        {
            text: 'Notifications',
            type: paperback_extensions_common_1.TagType.GREEN
        }
    ],
};
class MangaDex extends paperback_extensions_common_1.Source {
    constructor() {
        super(...arguments);
        this.MANGADEX_DOMAIN = MANGADEX_DOMAIN;
        this.MANGADEX_API = MANGADEX_API;
        this.COVER_BASE_URL = COVER_BASE_URL;
        this.requestManager = createRequestManager({
            requestsPerSecond: 4,
            requestTimeout: 15000,
            interceptor: {
                interceptRequest: async (request) => {
                    // Impossible to have undefined headers, ensured by the app
                    request.headers = {
                        ...request.headers,
                        referer: `${this.MANGADEX_DOMAIN}/`
                    };
                    var accessToken = await (0, MangaDexSettings_1.getAccessToken)(this.stateManager);
                    if (request.url.includes('auth/') || !accessToken)
                        return request;
                    // Padding 60 secs to make sure it wont expire in-transit if the connection is really bad
                    if (Number(accessToken.tokenBody.exp) <= (Date.now() / 1000) - 60) {
                        try {
                            const response = await (0, MangaDexSettings_1.authEndpointRequest)(this.requestManager, 'refresh', {
                                token: accessToken.refreshToken
                            });
                            accessToken = await (0, MangaDexSettings_1.saveAccessToken)(this.stateManager, response.token.session, response.token.refresh);
                            if (!accessToken)
                                return request;
                        }
                        catch {
                            return request;
                        }
                    }
                    // Impossible to have undefined headers, ensured by the app
                    request.headers = {
                        ...request.headers,
                        authorization: 'Bearer ' + accessToken.accessToken
                    };
                    return request;
                },
                interceptResponse: async (x) => x
            }
        });
        this.stateManager = createSourceStateManager({});
    }
    async getSourceMenu() {
        return Promise.resolve(createSection({
            id: 'main',
            header: 'Source Settings',
            rows: async () => [
                await (0, MangaDexSettings_1.accountSettings)(this.stateManager, this.requestManager),
                (0, MangaDexSettings_1.contentSettings)(this.stateManager),
                (0, MangaDexSettings_1.thumbnailSettings)(this.stateManager),
                (0, MangaDexSettings_1.homepageSettings)(this.stateManager),
                (0, MangaDexSettings_1.resetSettings)(this.stateManager),
            ]
        }));
    }
    getMangaShareUrl(mangaId) {
        return `${this.MANGADEX_DOMAIN}/title/${mangaId}`;
    }
    async getSearchTags() {
        const sections = {};
        for (const tag of tag_json_1.default) {
            const group = tag.data.attributes.group;
            if (sections[group] == null) {
                sections[group] = createTagSection({
                    id: group,
                    label: group.charAt(0).toUpperCase() + group.slice(1),
                    tags: []
                });
            }
            const tagObject = createTag({ id: tag.data.id, label: tag.data.attributes.name.en });
            sections[group].tags = [...sections[group]?.tags ?? [], tagObject];
        }
        return Object.values(sections);
    }
    async supportsSearchOperators() {
        return true;
    }
    async supportsTagExclusion() {
        return true;
    }
    async getMDHNodeURL(chapterId) {
        const request = createRequestObject({
            url: `${this.MANGADEX_API}/at-home/server/${chapterId}`,
            method: 'GET',
        });
        const response = await this.requestManager.schedule(request, 1);
        const json = (typeof response.data) === 'string' ? JSON.parse(response.data) : response.data;
        console.log(`Using MD@H node: ${json.baseUrl}`);
        return json.baseUrl;
    }
    async getCustomListRequestURL(listId, ratings) {
        const request = createRequestObject({
            url: `${this.MANGADEX_API}/list/${listId}`,
            method: 'GET',
        });
        const response = await this.requestManager.schedule(request, 1);
        const json = (typeof response.data) === 'string' ? JSON.parse(response.data) : response.data;
        return new MangaDexHelper_1.URLBuilder(this.MANGADEX_API)
            .addPathComponent('manga')
            .addQueryParameter('limit', 100)
            .addQueryParameter('contentRating', ratings)
            .addQueryParameter('includes', ['cover_art'])
            .addQueryParameter('ids', json.data.relationships.filter((x) => x.type == 'manga').map((x) => x.id))
            .buildUrl();
    }
    async getCoversMapping(mangaIds, ratings) {
        const mapping = {};
        const request = createRequestObject({
            url: new MangaDexHelper_1.URLBuilder(this.MANGADEX_API)
                .addPathComponent('manga')
                .addQueryParameter('limit', 100)
                .addQueryParameter('contentRating', ratings)
                .addQueryParameter('ids', mangaIds)
                .addQueryParameter('includes', ['cover_art'])
                .buildUrl(),
            method: 'GET'
        });
        const response = await this.requestManager.schedule(request, 1);
        const json = (typeof response.data) === 'string' ? JSON.parse(response.data) : response.data;
        for (const manga of json.data) {
            const mangaId = manga.id;
            const coverFileName = manga.relationships.filter((x) => x.type == 'cover_art').map((x) => x.attributes?.fileName)[0];
            if (!mangaId || !coverFileName)
                continue;
            mapping[mangaId] = coverFileName;
        }
        return mapping;
    }
    async getMangaDetails(mangaId) {
        if (!mangaId.includes('-')) {
            // Legacy Id
            console.log('OLD ID: PLEASE MIGRATE');
            throw new Error('OLD ID: PLEASE MIGRATE');
        }
        const request = createRequestObject({
            url: new MangaDexHelper_1.URLBuilder(this.MANGADEX_API)
                .addPathComponent('manga')
                .addPathComponent(mangaId)
                .addQueryParameter('includes', ['author', 'artist', 'cover_art'])
                .buildUrl(),
            method: 'GET',
        });
        const response = await this.requestManager.schedule(request, 1);
        const json = (typeof response.data) === 'string' ? JSON.parse(response.data) : response.data;
        const mangaDetails = json.data.attributes;
        const titles = [
            ...Object.values(mangaDetails.title),
            ...mangaDetails.altTitles.flatMap((x) => Object.values(x))
        ].map((x) => this.decodeHTMLEntity(x));
        const desc = this.decodeHTMLEntity(mangaDetails.description.en).replace(/\[\/{0,1}[bus]\]/g, ''); // Get rid of BBcode tags
        let status = paperback_extensions_common_1.MangaStatus.COMPLETED;
        if (mangaDetails.status == 'ongoing') {
            status = paperback_extensions_common_1.MangaStatus.ONGOING;
        }
        const tags = [];
        for (const tag of mangaDetails.tags) {
            const tagName = tag.attributes.name;
            tags.push(createTag({
                id: tag.id,
                label: Object.keys(tagName).map(keys => tagName[keys])[0] ?? 'Unknown'
            }));
        }
        const author = json.data.relationships.filter((x) => x.type == 'author').map((x) => x.attributes.name).join(', ');
        const artist = json.data.relationships.filter((x) => x.type == 'artist').map((x) => x.attributes.name).join(', ');
        const coverFileName = json.data.relationships.filter((x) => x.type == 'cover_art').map((x) => x.attributes?.fileName)[0];
        let image;
        if (coverFileName) {
            image = `${this.COVER_BASE_URL}/${mangaId}/${coverFileName}${MangaDexHelper_1.MDImageQuality.getEnding(await (0, MangaDexSettings_1.getMangaThumbnail)(this.stateManager))}`;
        }
        else {
            image = 'https://mangadex.org/_nuxt/img/cover-placeholder.d12c3c5.jpg';
        }
        return createManga({
            id: mangaId,
            titles,
            image,
            author,
            artist,
            desc,
            rating: 5,
            status,
            tags: [createTagSection({
                    id: 'tags',
                    label: 'Tags',
                    tags: tags
                })]
        });
    }
    async getChapters(mangaId) {
        if (!mangaId.includes('-')) {
            // Legacy Id
            console.log('OLD ID: PLEASE MIGRATE');
            throw new Error('OLD ID: PLEASE MIGRATE');
        }
        const languages = await (0, MangaDexSettings_1.getLanguages)(this.stateManager);
        const skipSameChapter = await (0, MangaDexSettings_1.getSkipSameChapter)(this.stateManager);
        const ratings = await (0, MangaDexSettings_1.getRatings)(this.stateManager);
        const collectedChapters = [];
        const chapters = [];
        let offset = 0;
        let sortingIndex = 0;
        let hasResults = true;
        while (hasResults) {
            const request = createRequestObject({
                url: new MangaDexHelper_1.URLBuilder(this.MANGADEX_API)
                    .addPathComponent('manga')
                    .addPathComponent(mangaId)
                    .addPathComponent('feed')
                    .addQueryParameter('limit', 500)
                    .addQueryParameter('offset', offset)
                    .addQueryParameter('includes', ['scanlation_group'])
                    .addQueryParameter('translatedLanguage', languages)
                    .addQueryParameter('order', { 'volume': 'desc', 'chapter': 'desc', 'publishAt': 'desc' })
                    .addQueryParameter('contentRating', ratings)
                    .addQueryParameter('includeFutureUpdates', '0')
                    .buildUrl(),
                method: 'GET',
            });
            const response = await this.requestManager.schedule(request, 1);
            const json = (typeof response.data) === 'string' ? JSON.parse(response.data) : response.data;
            offset += 500;
            if (json.data === undefined)
                throw new Error(`Failed to parse json results for ${mangaId}`);
            for (const chapter of json.data) {
                const chapterId = chapter.id;
                const chapterDetails = chapter.attributes;
                const name = this.decodeHTMLEntity(chapterDetails.title);
                const chapNum = Number(chapterDetails?.chapter);
                const volume = Number(chapterDetails?.volume);
                const langCode = MangaDexHelper_1.MDLanguages.getPBCode(chapterDetails.translatedLanguage);
                const time = new Date(chapterDetails.publishAt);
                const group = chapter.relationships.filter((x) => x.type == 'scanlation_group').map((x) => x.attributes.name).join(', ');
                const identifier = `${volume}-${chapNum}-${chapterDetails.translatedLanguage}`;
                if (!collectedChapters.includes(identifier) || !skipSameChapter) {
                    chapters.push(createChapter({
                        id: chapterId,
                        mangaId: mangaId,
                        name,
                        chapNum,
                        volume,
                        langCode,
                        group,
                        time,
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        // @ts-ignore
                        sortingIndex
                    }));
                    collectedChapters.push(identifier);
                    sortingIndex--;
                }
            }
            if (json.total <= offset) {
                hasResults = false;
            }
        }
        return chapters;
    }
    async getChapterDetails(mangaId, chapterId) {
        if (!chapterId.includes('-')) {
            // Numeric ID
            console.log('OLD ID: PLEASE MIGRATE');
            throw new Error('OLD ID: PLEASE REFRESH AND CLEAR ORPHANED CHAPTERS');
        }
        const serverUrl = await this.getMDHNodeURL(chapterId);
        const dataSaver = await (0, MangaDexSettings_1.getDataSaver)(this.stateManager);
        const request = createRequestObject({
            url: `${this.MANGADEX_API}/chapter/${chapterId}`,
            method: 'GET',
        });
        const response = await this.requestManager.schedule(request, 1);
        const json = (typeof response.data) === 'string' ? JSON.parse(response.data) : response.data;
        const chapterDetails = json.data.attributes;
        let pages;
        if (dataSaver) {
            pages = chapterDetails.dataSaver.map((x) => `${serverUrl}/data-saver/${chapterDetails.hash}/${x}`);
        }
        else {
            pages = chapterDetails.data.map((x) => `${serverUrl}/data/${chapterDetails.hash}/${x}`);
        }
        // The chapter is being read, add the mangaId to the recommendation list
        (0, MangaDexSimilarManga_1.addRecommendedId)(this.stateManager, mangaId);
        return createChapterDetails({
            id: chapterId,
            mangaId: mangaId,
            pages,
            longStrip: false
        });
    }
    async getSearchResults(query, metadata) {
        const ratings = await (0, MangaDexSettings_1.getRatings)(this.stateManager);
        const offset = metadata?.offset ?? 0;
        let results = [];
        const searchType = query.title?.match(/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i) ? 'ids[]' : 'title';
        const url = new MangaDexHelper_1.URLBuilder(this.MANGADEX_API)
            .addPathComponent('manga')
            .addQueryParameter(searchType, (query.title?.length ?? 0) > 0 ? encodeURIComponent(query.title) : undefined)
            .addQueryParameter('limit', 100)
            .addQueryParameter('offset', offset)
            .addQueryParameter('contentRating', ratings)
            .addQueryParameter('includes', ['cover_art'])
            .addQueryParameter('includedTags', query.includedTags?.map(x => x.id))
            .addQueryParameter('includedTagsMode', query.includeOperator)
            .addQueryParameter('excludedTags', query.excludedTags?.map(x => x.id))
            .addQueryParameter('excludedTagsMode', query.excludeOperator)
            .buildUrl();
        const request = createRequestObject({
            url: url,
            method: 'GET',
        });
        const response = await this.requestManager.schedule(request, 1);
        if (response.status != 200) {
            return createPagedResults({ results });
        }
        const json = (typeof response.data) === 'string' ? JSON.parse(response.data) : response.data;
        if (json.data === undefined) {
            throw new Error('Failed to parse json for the given search');
        }
        results = await (0, MangaDexParser_1.parseMangaList)(json.data, this, MangaDexSettings_1.getSearchThumbnail);
        return createPagedResults({
            results,
            metadata: { offset: offset + 100 }
        });
    }
    async getHomePageSections(sectionCallback) {
        const ratings = await (0, MangaDexSettings_1.getRatings)(this.stateManager);
        const languages = await (0, MangaDexSettings_1.getLanguages)(this.stateManager);
        const promises = [];
        // On the homepage we only show sections enabled in source settings:
        // enabled_homepage_sections and recommended titles sections
        const enabled_homepage_sections = await (0, MangaDexSettings_1.getEnabledHomePageSections)(this.stateManager);
        const sections = [
            {
                request: createRequestObject({
                    url: await this.getCustomListRequestURL('d434f5f1-ff90-4fa5-be7c-2c070da79120', ratings),
                    method: 'GET',
                }),
                section: createHomeSection({
                    id: 'seasonal',
                    title: 'Seasonal',
                    type: paperback_extensions_common_1.HomeSectionType.featured
                }),
            },
            {
                request: createRequestObject({
                    url: new MangaDexHelper_1.URLBuilder(this.MANGADEX_API)
                        .addPathComponent('manga')
                        .addQueryParameter('limit', 20)
                        .addQueryParameter('order', { 'followedCount': 'desc' })
                        .addQueryParameter('contentRating', ratings)
                        .addQueryParameter('includes', ['cover_art'])
                        .buildUrl(),
                    method: 'GET',
                }),
                section: createHomeSection({
                    id: 'popular',
                    title: 'Popular',
                    view_more: true,
                }),
            },
            {
                request: createRequestObject({
                    url: new MangaDexHelper_1.URLBuilder(this.MANGADEX_API)
                        .addPathComponent('chapter')
                        .addQueryParameter('limit', 100)
                        .addQueryParameter('order', { 'publishAt': 'desc' })
                        .addQueryParameter('translatedLanguage', languages)
                        .addQueryParameter('includes', ['manga'])
                        .addQueryParameter('includeFutureUpdates', '0')
                        .buildUrl(),
                    method: 'GET',
                }),
                section: createHomeSection({
                    id: 'latest_updates',
                    title: 'Latest Updates',
                    view_more: true,
                }),
            },
        ];
        for (const section of sections) {
            // We only add the section if it is requested by the user in settings
            if (enabled_homepage_sections.includes(section.section.id)) {
                // Let the app load empty sections
                sectionCallback(section.section);
                // Get the section data
                promises.push(this.requestManager.schedule(section.request, 1).then(async (response) => {
                    const json = (typeof response.data) === 'string' ? JSON.parse(response.data) : response.data;
                    if (json.data === undefined)
                        throw new Error(`Failed to parse json results for section ${section.section.title}`);
                    switch (section.section.id) {
                        case 'latest_updates':
                            const coversMapping = await this.getCoversMapping(json.data.map((x) => x.relationships.filter((x) => x.type == 'manga').map((x) => x.id)[0]), ratings);
                            section.section.items = await (0, MangaDexParser_1.parseChapterList)(json.data, coversMapping, this, MangaDexSettings_1.getHomepageThumbnail, ratings);
                            break;
                        default:
                            section.section.items = await (0, MangaDexParser_1.parseMangaList)(json.data, this, MangaDexSettings_1.getHomepageThumbnail);
                    }
                    sectionCallback(section.section);
                }));
            }
        }
        // If the user want to see recommendations on the homepage, we process them
        if (await (0, MangaDexSettings_1.getEnabledRecommendations)(this.stateManager)) {
            const recommendedIds = await (0, MangaDexSimilarManga_1.getRecommendedIds)(this.stateManager);
            for (const recommendedId of recommendedIds) {
                // First we fetch similar titles
                const similarRequest = createRequestObject({
                    url: `${RECOMMENDATION_URL}/similar/${recommendedId}.json`,
                    method: 'GET',
                });
                promises.push(this.requestManager.schedule(similarRequest, 1).then(async (similarResponse) => {
                    // We should only process if the response is valid
                    // We won't throw an error but silently pass as an error can occurre with 
                    // titles unsupported by SimilarManga (new titles for example)
                    if (similarResponse.status !== 200) {
                        console.log(`Could not fetch similar titles for id: ${recommendedId}, request failed with status ${similarResponse.status}`);
                    }
                    else {
                        const similarJson = (typeof similarResponse.data) === 'string' ? JSON.parse(similarResponse.data) : similarResponse.data;
                        // We should only process if the result is valid
                        // We won't throw an error but silently pass as an error can occurre with 
                        // titles unsupported by SimilarManga (new titles for example)
                        if (similarJson.id === undefined) {
                            console.log('Could not fetch similar titles for id: ' + recommendedId + ', json is invalid');
                        }
                        else {
                            // We know the title of the recommended manga, we can thus create the homepage section
                            const section = createHomeSection({
                                id: recommendedId,
                                // Can titles be html encoded?
                                title: 'More like ' + this.decodeHTMLEntity(similarJson.title.en),
                                view_more: false,
                            });
                            // Let the app load empty sections
                            sectionCallback(section);
                            // Generate the MangaTiles list, sorted by decreasing similarity
                            const results = [];
                            // We first add the title used for the recommendation
                            let image;
                            if (similarJson.coverFileName === 'unknown') {
                                image = 'https://mangadex.org/_nuxt/img/cover-placeholder.d12c3c5.jpg';
                            }
                            else {
                                image = `${COVER_BASE_URL}/${recommendedId}/${similarJson.coverFileName}${MangaDexHelper_1.MDImageQuality.getEnding(await (0, MangaDexSettings_1.getMangaThumbnail)(this.stateManager))}`;
                            }
                            results.push(createMangaTile({
                                id: recommendedId,
                                title: createIconText({ text: this.decodeHTMLEntity(similarJson.title.en) }),
                                image
                            }));
                            // We then add similar titles, ordered by decreasing similarity
                            for (const manga of similarJson.matches) {
                                // We should only add the title if its rating is enabled
                                if (ratings.includes(manga.contentRating)) {
                                    // The similar api contains the coverFileName or 'unknown'
                                    let image;
                                    if (manga.coverFileName === 'unknown') {
                                        image = 'https://mangadex.org/_nuxt/img/cover-placeholder.d12c3c5.jpg';
                                    }
                                    else {
                                        image = `${COVER_BASE_URL}/${manga.id}/${manga.coverFileName}${MangaDexHelper_1.MDImageQuality.getEnding(await (0, MangaDexSettings_1.getMangaThumbnail)(this.stateManager))}`;
                                    }
                                    results.push(createMangaTile({
                                        id: manga.id,
                                        title: createIconText({ text: this.decodeHTMLEntity(manga.title.en) }),
                                        subtitleText: createIconText({ text: `Similarity ${manga.score.toFixed(2)}` }),
                                        image
                                    }));
                                }
                            }
                            section.items = results;
                            sectionCallback(section);
                        }
                    }
                }));
            }
        }
        // Make sure the function completes
        await Promise.all(promises);
    }
    async getViewMoreItems(homepageSectionId, metadata) {
        const offset = metadata?.offset ?? 0;
        const collectedIds = metadata?.collectedIds ?? [];
        let results = [];
        const ratings = await (0, MangaDexSettings_1.getRatings)(this.stateManager);
        const languages = await (0, MangaDexSettings_1.getLanguages)(this.stateManager);
        let url = '';
        switch (homepageSectionId) {
            case 'popular': {
                url = new MangaDexHelper_1.URLBuilder(this.MANGADEX_API)
                    .addPathComponent('manga')
                    .addQueryParameter('limit', 100)
                    .addQueryParameter('order', { 'followedCount': 'desc' })
                    .addQueryParameter('offset', offset)
                    .addQueryParameter('contentRating', ratings)
                    .addQueryParameter('includes', ['cover_art'])
                    .buildUrl();
                break;
            }
            case 'latest_updates': {
                url = new MangaDexHelper_1.URLBuilder(this.MANGADEX_API)
                    .addPathComponent('chapter')
                    .addQueryParameter('limit', 100)
                    .addQueryParameter('offset', offset)
                    .addQueryParameter('order', { 'publishAt': 'desc' })
                    .addQueryParameter('translatedLanguage', languages)
                    .addQueryParameter('includes', ['manga'])
                    .addQueryParameter('includeFutureUpdates', '0')
                    .buildUrl();
                break;
            }
        }
        const request = createRequestObject({
            url,
            method: 'GET',
        });
        const response = await this.requestManager.schedule(request, 1);
        const json = (typeof response.data) === 'string' ? JSON.parse(response.data) : response.data;
        if (json.data === undefined)
            throw new Error('Failed to parse json results for getViewMoreItems');
        switch (homepageSectionId) {
            case 'latest_updates':
                const coversMapping = await this.getCoversMapping(json.data.map((x) => x.relationships.filter((x) => x.type == 'manga').map((x) => x.id)[0]), ratings);
                results = await (0, MangaDexParser_1.parseChapterList)(json.data, coversMapping, this, MangaDexSettings_1.getHomepageThumbnail, ratings);
                break;
            default:
                results = await (0, MangaDexParser_1.parseMangaList)(json.data, this, MangaDexSettings_1.getHomepageThumbnail);
        }
        return createPagedResults({
            results,
            metadata: { offset: offset + 100, collectedIds }
        });
    }
    async filterUpdatedManga(mangaUpdatesFoundCallback, time, ids) {
        let offset = 0;
        const maxRequests = 100;
        let loadNextPage = true;
        const updatedManga = [];
        const updatedAt = time.toISOString().split('.')[0]; // They support a weirdly truncated version of an ISO timestamp
        const languages = await (0, MangaDexSettings_1.getLanguages)(this.stateManager);
        while (loadNextPage) {
            const request = createRequestObject({
                url: new MangaDexHelper_1.URLBuilder(this.MANGADEX_API)
                    .addPathComponent('chapter')
                    .addQueryParameter('limit', 100)
                    .addQueryParameter('offset', offset)
                    .addQueryParameter('publishAtSince', updatedAt)
                    .addQueryParameter('order', { 'publishAt': 'desc' })
                    .addQueryParameter('translatedLanguage', languages)
                    .addQueryParameter('includeFutureUpdates', '0')
                    .buildUrl(),
                method: 'GET',
            });
            const response = await this.requestManager.schedule(request, 1);
            // If we have no content, there are no updates available
            if (response.status == 204) {
                return;
            }
            const json = (typeof response.data) === 'string' ? JSON.parse(response.data) : response.data;
            if (json.data === undefined) {
                // Log this, no need to throw.
                console.log(`Failed to parse JSON results for filterUpdatedManga using the date ${updatedAt} and the offset ${offset}`);
                return;
            }
            const mangaToUpdate = [];
            for (const chapter of json.data) {
                const mangaId = chapter.relationships.filter((x) => x.type == 'manga')[0]?.id;
                if (ids.includes(mangaId) && !updatedManga.includes(mangaId)) {
                    mangaToUpdate.push(mangaId);
                    updatedManga.push(mangaId);
                }
            }
            offset = offset + 100;
            if (json.total <= offset || offset >= 100 * maxRequests) {
                loadNextPage = false;
            }
            if (mangaToUpdate.length > 0) {
                mangaUpdatesFoundCallback(createMangaUpdates({
                    ids: mangaToUpdate
                }));
            }
        }
        mangaUpdatesFoundCallback(createMangaUpdates({ ids: [] }));
    }
    decodeHTMLEntity(str) {
        return entities.decodeHTML(str);
    }
}
exports.MangaDex = MangaDex;

},{"./MangaDexHelper":59,"./MangaDexParser":60,"./MangaDexSettings":61,"./MangaDexSimilarManga":62,"./external/tag.json":63,"entities":6,"paperback-extensions-common":15}],59:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MDImageQuality = exports.URLBuilder = exports.MDHomepageSections = exports.MDRatings = exports.MDLanguages = void 0;
class MDLanguagesClass {
    constructor() {
        this.Languages = [
            {
                // Arabic
                name: 'اَلْعَرَبِيَّةُ',
                MDCode: 'ar',
                PBCode: 'sa'
            },
            {
                // Bulgarian
                name: 'български',
                MDCode: 'bg',
                PBCode: 'bg'
            },
            {
                // Bengali
                name: 'বাংলা',
                MDCode: 'bn',
                PBCode: 'bd'
            },
            {
                // Catalan
                name: 'Català',
                MDCode: 'ca',
                PBCode: 'es'
            },
            {
                // Czech
                name: 'Čeština',
                MDCode: 'cs',
                PBCode: 'cz'
            },
            {
                // Danish
                name: 'Dansk',
                MDCode: 'da',
                PBCode: 'dk'
            },
            {
                // German
                name: 'Deutsch',
                MDCode: 'de',
                PBCode: 'de'
            },
            {
                // English
                name: 'English',
                MDCode: 'en',
                PBCode: 'gb',
                default: true
            },
            {
                // Spanish
                name: 'Español',
                MDCode: 'es',
                PBCode: 'es'
            },
            {
                // Spanish (Latin American)
                name: 'Español (Latinoamérica)',
                MDCode: 'es-la',
                PBCode: 'es'
            },
            {
                // Farsi
                name: 'فارسی',
                MDCode: 'fa',
                PBCode: 'ir'
            },
            {
                // Finnish
                name: 'Suomi',
                MDCode: 'fi',
                PBCode: 'fi'
            },
            {
                // French
                name: 'Français',
                MDCode: 'fr',
                PBCode: 'fr'
            },
            {
                // Hebrew
                name: 'עִבְרִית',
                MDCode: 'he',
                PBCode: 'il'
            },
            {
                // Hindi
                name: 'हिन्दी',
                MDCode: 'hi',
                PBCode: 'in'
            },
            {
                // Hungarian
                name: 'Magyar',
                MDCode: 'hu',
                PBCode: 'hu'
            },
            {
                // Indonesian
                name: 'Indonesia',
                MDCode: 'id',
                PBCode: 'id'
            },
            {
                // Italian
                name: 'Italiano',
                MDCode: 'it',
                PBCode: 'it'
            },
            {
                // Japanese
                name: '日本語',
                MDCode: 'ja',
                PBCode: 'jp'
            },
            {
                // Korean
                name: '한국어',
                MDCode: 'ko',
                PBCode: 'kr'
            },
            {
                // Lithuanian
                name: 'Lietuvių',
                MDCode: 'lt',
                PBCode: 'lt'
            },
            {
                // Mongolian
                name: 'монгол',
                MDCode: 'mn',
                PBCode: 'mn'
            },
            {
                // Malay
                name: 'Melayu',
                MDCode: 'ms',
                PBCode: 'my'
            },
            {
                // Burmese
                name: 'မြန်မာဘာသာ',
                MDCode: 'my',
                PBCode: 'mm'
            },
            {
                // Dutch
                name: 'Nederlands',
                MDCode: 'nl',
                PBCode: 'nl'
            },
            {
                // Norwegian
                name: 'Norsk',
                MDCode: 'no',
                PBCode: 'no'
            },
            {
                // Polish
                name: 'Polski',
                MDCode: 'pl',
                PBCode: 'pl'
            },
            {
                // Portuguese
                name: 'Português',
                MDCode: 'pt',
                PBCode: 'pt'
            },
            {
                // Portuguese (Brazilian)
                name: 'Português (Brasil)',
                MDCode: 'pt-br',
                PBCode: 'pt'
            },
            {
                // Romanian
                name: 'Română',
                MDCode: 'ro',
                PBCode: 'ro'
            },
            {
                // Russian
                name: 'Pусский',
                MDCode: 'ru',
                PBCode: 'ru'
            },
            {
                // Serbian
                name: 'Cрпски',
                MDCode: 'sr',
                PBCode: 'rs'
            },
            {
                // Swedish
                name: 'Svenska',
                MDCode: 'sv',
                PBCode: 'se'
            },
            {
                // Thai
                name: 'ไทย',
                MDCode: 'th',
                PBCode: 'th'
            },
            {
                // Tagalog
                name: 'Filipino',
                MDCode: 'tl',
                PBCode: 'ph'
            },
            {
                // Turkish
                name: 'Türkçe',
                MDCode: 'tr',
                PBCode: 'tr'
            },
            {
                // Ukrainian
                name: 'Yкраї́нська',
                MDCode: 'uk',
                PBCode: 'ua'
            },
            {
                // Vietnamese
                name: 'Tiếng Việt',
                MDCode: 'vi',
                PBCode: 'vn'
            },
            {
                // Chinese (Simplified)
                name: '中文 (简化字)',
                MDCode: 'zh',
                PBCode: 'cn'
            },
            {
                // Chinese (Traditional)
                name: '中文 (繁體字)',
                MDCode: 'zh-hk',
                PBCode: 'hk'
            },
        ];
        // Sorts the languages based on name
        this.Languages = this.Languages.sort((a, b) => a.name > b.name ? 1 : -1);
    }
    getMDCodeList() {
        return this.Languages.map(Language => Language.MDCode);
    }
    getName(MDCode) {
        return this.Languages.filter(Language => Language.MDCode == MDCode)[0]?.name ?? 'Unknown';
    }
    getPBCode(MDCode) {
        return this.Languages.filter(Language => Language.MDCode == MDCode)[0]?.PBCode ?? '_unknown';
    }
    getDefault() {
        return this.Languages.filter(Language => Language.default).map(Language => Language.MDCode);
    }
}
exports.MDLanguages = new MDLanguagesClass;
class MDContentRatingClass {
    constructor() {
        this.Ratings = [
            {
                name: 'Safe',
                enum: 'safe',
                default: true
            },
            {
                name: 'Suggestive',
                enum: 'suggestive',
            },
            {
                name: 'Erotica',
                enum: 'erotica'
            },
            {
                name: 'Pornographic',
                enum: 'pornographic'
            }
        ];
    }
    getEnumList() {
        return this.Ratings.map(Rating => Rating.enum);
    }
    getName(ratingEum) {
        return this.Ratings.filter(Rating => Rating.enum == ratingEum)[0]?.name ?? '';
    }
    getDefault() {
        return this.Ratings.filter(Rating => Rating.default).map(Rating => Rating.enum);
    }
}
exports.MDRatings = new MDContentRatingClass;
class MDHomepageSectionsClass {
    constructor() {
        this.Sections = [
            {
                name: 'Seasonal',
                enum: 'seasonal',
                default: true
            },
            {
                name: 'Popular',
                enum: 'popular',
                default: true
            },
            {
                name: 'Latest Updates',
                enum: 'latest_updates',
                default: true
            }
        ];
    }
    getEnumList() {
        return this.Sections.map(Sections => Sections.enum);
    }
    getName(sectionsEnum) {
        return this.Sections.filter(Sections => Sections.enum == sectionsEnum)[0]?.name ?? '';
    }
    getDefault() {
        return this.Sections.filter(Sections => Sections.default).map(Sections => Sections.enum);
    }
}
exports.MDHomepageSections = new MDHomepageSectionsClass;
class URLBuilder {
    constructor(baseUrl) {
        this.parameters = {};
        this.pathComponents = [];
        this.baseUrl = baseUrl.replace(/(^\/)?(?=.*)(\/$)?/gim, '');
    }
    addPathComponent(component) {
        this.pathComponents.push(component.replace(/(^\/)?(?=.*)(\/$)?/gim, ''));
        return this;
    }
    addQueryParameter(key, value) {
        this.parameters[key] = value;
        return this;
    }
    buildUrl({ addTrailingSlash, includeUndefinedParameters } = { addTrailingSlash: false, includeUndefinedParameters: false }) {
        let finalUrl = this.baseUrl + '/';
        finalUrl += this.pathComponents.join('/');
        finalUrl += addTrailingSlash ? '/' : '';
        finalUrl += Object.values(this.parameters).length > 0 ? '?' : '';
        finalUrl += Object.entries(this.parameters).map(entry => {
            if (!entry[1] && !includeUndefinedParameters) {
                return undefined;
            }
            if (Array.isArray(entry[1])) {
                return entry[1].map(value => value || includeUndefinedParameters ? `${entry[0]}[]=${value}` : undefined)
                    .filter(x => x !== undefined)
                    .join('&');
            }
            if (typeof entry[1] === 'object') {
                return Object.keys(entry[1]).map(key => entry[1][key] || includeUndefinedParameters ? `${entry[0]}[${key}]=${entry[1][key]}` : undefined)
                    .filter(x => x !== undefined)
                    .join('&');
            }
            return `${entry[0]}=${entry[1]}`;
        }).filter(x => x !== undefined).join('&');
        return finalUrl;
    }
}
exports.URLBuilder = URLBuilder;
class MDImageQualityClass {
    constructor() {
        this.ImageQualities = [
            {
                name: 'Source (Original/Best)',
                enum: 'source',
                ending: '',
                default: ['manga']
            },
            {
                name: '<= 512px',
                enum: '512',
                ending: '.512.jpg'
            },
            {
                name: '<= 256px',
                enum: '256',
                ending: '.256.jpg',
                default: ['homepage', 'search']
            }
        ];
    }
    getEnumList() {
        return this.ImageQualities.map(ImageQuality => ImageQuality.enum);
    }
    getName(imageQualityEnum) {
        return this.ImageQualities.filter(ImageQuality => ImageQuality.enum == imageQualityEnum)[0]?.name ?? '';
    }
    getEnding(imageQualityEnum) {
        return this.ImageQualities.filter(ImageQuality => ImageQuality.enum == imageQualityEnum)[0]?.ending ?? '';
    }
    getDefault(section) {
        return this.ImageQualities.filter(ImageQuality => ImageQuality.default?.includes(section)).map(ImageQuality => ImageQuality.enum)[0] ?? '';
    }
}
exports.MDImageQuality = new MDImageQualityClass;

},{}],60:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseChapterList = exports.parseMangaList = void 0;
const MangaDexHelper_1 = require("./MangaDexHelper");
const parseMangaList = async (object, source, thumbnailSelector) => {
    const results = [];
    for (const manga of object) {
        const mangaId = manga.id;
        const mangaDetails = manga.attributes;
        const title = source.decodeHTMLEntity(Object.values(mangaDetails.title)[0]);
        const coverFileName = manga.relationships.filter((x) => x.type == 'cover_art').map((x) => x.attributes?.fileName)[0];
        const image = coverFileName ? `${source.COVER_BASE_URL}/${mangaId}/${coverFileName}${MangaDexHelper_1.MDImageQuality.getEnding(await thumbnailSelector(source.stateManager))}` : 'https://mangadex.org/_nuxt/img/cover-placeholder.d12c3c5.jpg';
        results.push(createMangaTile({
            id: mangaId,
            title: createIconText({ text: title }),
            image
        }));
    }
    return results;
};
exports.parseMangaList = parseMangaList;
const parseChapterList = async (chapterObject, coversMapping, source, thumbnailSelector, ratings) => {
    const results = [];
    for (const chapter of chapterObject) {
        const mangaId = chapter.relationships.filter((x) => x.type == 'manga').map((x) => x.id)[0];
        const title = chapter.relationships.filter((x) => x.type == 'manga').map((x) => x.attributes.title.en)[0];
        const volume_num = chapter.attributes.volume;
        const chapter_num = chapter.attributes.chapter;
        const subtitle = `${volume_num ? `Vol. ${volume_num}` : ''} ${chapter_num ? `Ch. ${chapter_num}` : ''}`;
        const coverFileName = coversMapping[mangaId];
        const image = coverFileName ? `${source.COVER_BASE_URL}/${mangaId}/${coverFileName}${MangaDexHelper_1.MDImageQuality.getEnding(await thumbnailSelector(source.stateManager))}` : 'https://mangadex.org/_nuxt/img/cover-placeholder.d12c3c5.jpg';
        if (!mangaId || !title || !ratings.includes(chapter.relationships.filter((x) => x.type == 'manga').map((x) => x.attributes.contentRating)[0]))
            continue;
        results.push(createMangaTile({
            id: mangaId,
            title: createIconText({ text: title }),
            subtitleText: createIconText({ text: subtitle }),
            image: image
        }));
    }
    return results;
};
exports.parseChapterList = parseChapterList;

},{"./MangaDexHelper":59}],61:[function(require,module,exports){
(function (Buffer){(function (){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.homepageSettings = exports.getAmountRecommendations = exports.getEnabledRecommendations = exports.getEnabledHomePageSections = exports.resetSettings = exports.thumbnailSettings = exports.accountSettings = exports.authEndpointRequest = exports.parseAccessToken = exports.saveAccessToken = exports.getAccessToken = exports.getMangaThumbnail = exports.getSearchThumbnail = exports.getHomepageThumbnail = exports.contentSettings = exports.getSkipSameChapter = exports.getDataSaver = exports.getRatings = exports.getLanguages = void 0;
const MangaDexHelper_1 = require("./MangaDexHelper");
const MangaDexSimilarManga_1 = require("./MangaDexSimilarManga");
const getLanguages = async (stateManager) => {
    return await stateManager.retrieve('languages') ?? MangaDexHelper_1.MDLanguages.getDefault();
};
exports.getLanguages = getLanguages;
const getRatings = async (stateManager) => {
    return await stateManager.retrieve('ratings') ?? MangaDexHelper_1.MDRatings.getDefault();
};
exports.getRatings = getRatings;
const getDataSaver = async (stateManager) => {
    return await stateManager.retrieve('data_saver') ?? false;
};
exports.getDataSaver = getDataSaver;
const getSkipSameChapter = async (stateManager) => {
    return await stateManager.retrieve('skip_same_chapter') ?? false;
};
exports.getSkipSameChapter = getSkipSameChapter;
const contentSettings = (stateManager) => {
    return createNavigationButton({
        id: 'content_settings',
        value: '',
        label: 'Content Settings',
        form: createForm({
            onSubmit: (values) => {
                return Promise.all([
                    stateManager.store('languages', values.languages),
                    stateManager.store('ratings', values.ratings),
                    stateManager.store('data_saver', values.data_saver),
                    stateManager.store('skip_same_chapter', values.skip_same_chapter)
                ]).then();
            },
            validate: () => {
                return Promise.resolve(true);
            },
            sections: () => {
                return Promise.resolve([
                    createSection({
                        id: 'content',
                        footer: 'When enabled, same chapters from different scanlation group will not be shown.',
                        rows: () => {
                            return Promise.all([
                                (0, exports.getLanguages)(stateManager),
                                (0, exports.getRatings)(stateManager),
                                (0, exports.getDataSaver)(stateManager),
                                (0, exports.getSkipSameChapter)(stateManager)
                            ]).then(async (values) => {
                                return [
                                    createSelect({
                                        id: 'languages',
                                        label: 'Languages',
                                        options: MangaDexHelper_1.MDLanguages.getMDCodeList(),
                                        displayLabel: option => MangaDexHelper_1.MDLanguages.getName(option),
                                        value: values[0],
                                        allowsMultiselect: true,
                                        minimumOptionCount: 1,
                                    }),
                                    createSelect({
                                        id: 'ratings',
                                        label: 'Content Rating',
                                        options: MangaDexHelper_1.MDRatings.getEnumList(),
                                        displayLabel: option => MangaDexHelper_1.MDRatings.getName(option),
                                        value: values[1],
                                        allowsMultiselect: true,
                                        minimumOptionCount: 1
                                    }),
                                    createSwitch({
                                        id: 'data_saver',
                                        label: 'Data Saver',
                                        value: values[2]
                                    }),
                                    createSwitch({
                                        id: 'skip_same_chapter',
                                        label: 'Skip Same Chapter',
                                        value: values[3]
                                    })
                                ];
                            });
                        }
                    })
                ]);
            }
        })
    });
};
exports.contentSettings = contentSettings;
const getHomepageThumbnail = async (stateManager) => {
    return await stateManager.retrieve('homepage_thumbnail') ?? MangaDexHelper_1.MDImageQuality.getDefault('homepage');
};
exports.getHomepageThumbnail = getHomepageThumbnail;
const getSearchThumbnail = async (stateManager) => {
    return await stateManager.retrieve('search_thumbnail') ?? MangaDexHelper_1.MDImageQuality.getDefault('search');
};
exports.getSearchThumbnail = getSearchThumbnail;
const getMangaThumbnail = async (stateManager) => {
    return await stateManager.retrieve('manga_thumbnail') ?? MangaDexHelper_1.MDImageQuality.getDefault('manga');
};
exports.getMangaThumbnail = getMangaThumbnail;
const getAccessToken = async (stateManager) => {
    const accessToken = await stateManager.keychain.retrieve('access_token');
    if (!accessToken)
        return undefined;
    const refreshToken = await stateManager.keychain.retrieve('refresh_token');
    return {
        accessToken,
        refreshToken,
        tokenBody: await (0, exports.parseAccessToken)(accessToken)
    };
};
exports.getAccessToken = getAccessToken;
const saveAccessToken = async (stateManager, accessToken, refreshToken) => {
    await Promise.all([
        stateManager.keychain.store('access_token', accessToken),
        stateManager.keychain.store('refresh_token', refreshToken)
    ]);
    if (!accessToken)
        return undefined;
    const obj = {
        accessToken,
        refreshToken,
        tokenBody: await (0, exports.parseAccessToken)(accessToken)
    };
    return obj;
};
exports.saveAccessToken = saveAccessToken;
const parseAccessToken = async (accessToken) => {
    if (!accessToken)
        return undefined;
    const tokenBodyBase64 = accessToken.split('.')[1];
    if (!tokenBodyBase64)
        return undefined;
    const tokenBodyJSON = Buffer.from(tokenBodyBase64, 'base64').toString('ascii');
    return JSON.parse(tokenBodyJSON);
};
exports.parseAccessToken = parseAccessToken;
const authEndpointRequest = async (requestManager, endpoint, payload) => {
    const response = await requestManager.schedule(createRequestObject({
        method: 'POST',
        url: 'https://api.mangadex.org/auth/' + endpoint,
        headers: {
            "content-type": 'application/json'
        },
        data: payload
    }), 1);
    if (response.status > 399) {
        throw new Error('Request failed with error code:' + response.status);
    }
    const jsonData = typeof (response.data) === 'string' ? JSON.parse(response.data) : response.data;
    if (jsonData.result != 'ok') {
        throw new Error('Request failed with errors: ' + jsonData.errors.map(x => `[${x.title}]: ${x.detail}`));
    }
    return jsonData;
};
exports.authEndpointRequest = authEndpointRequest;
const accountSettings = async (stateManager, requestManager) => {
    const accessToken = await (0, exports.getAccessToken)(stateManager);
    if (!accessToken) {
        return createNavigationButton({
            id: 'login_button',
            label: 'Login',
            value: undefined,
            form: createForm({
                onSubmit: async (values) => {
                    if (!values.username) {
                        throw new Error('Username must not be empty');
                    }
                    if (!values.password) {
                        throw new Error('Password must not be empty');
                    }
                    let response = await (0, exports.authEndpointRequest)(requestManager, 'login', {
                        username: values.username,
                        password: values.password
                    });
                    await (0, exports.saveAccessToken)(stateManager, response.token.session, response.token.refresh);
                },
                validate: async (form) => true,
                sections: async () => [
                    createSection({
                        id: 'username_section',
                        header: 'Username',
                        footer: 'Enter your MangaDex account username',
                        rows: async () => [
                            createInputField({
                                id: 'username',
                                placeholder: 'Username',
                                value: '',
                                maskInput: false
                            })
                        ]
                    }),
                    createSection({
                        id: 'password_section',
                        header: 'Password',
                        footer: 'Enter the password associated with your MangaDex account Username',
                        rows: async () => [
                            createInputField({
                                id: 'password',
                                placeholder: 'Password',
                                value: '',
                                maskInput: true
                            })
                        ]
                    })
                ]
            })
        });
    }
    return createNavigationButton({
        id: 'account_settings',
        value: undefined,
        label: 'Session Info',
        form: createForm({
            onSubmit: async () => { },
            validate: async (form) => true,
            sections: async () => {
                const accessToken = await (0, exports.getAccessToken)(stateManager);
                if (!accessToken) {
                    return [
                        createSection({
                            id: 'not_logged_in_section',
                            rows: async () => [
                                createLabel({
                                    id: 'not_logged_in',
                                    label: 'Not Logged In',
                                    value: undefined
                                })
                            ]
                        })
                    ];
                }
                return [
                    createSection({
                        id: 'introspect',
                        rows: async () => {
                            return Object.keys(accessToken.tokenBody).map(key => {
                                const value = accessToken.tokenBody[key];
                                return createMultilineLabel({
                                    id: key,
                                    label: key,
                                    value: Array.isArray(value) ? value.join('\n') : `${value}`
                                });
                            });
                        }
                    }),
                    createSection({
                        id: 'refresh_button_section',
                        rows: async () => [
                            createButton({
                                id: 'refresh_token_button',
                                label: 'Refresh Token',
                                value: undefined,
                                onTap: async () => {
                                    const response = await (0, exports.authEndpointRequest)(requestManager, 'refresh', {
                                        token: accessToken.refreshToken
                                    });
                                    await (0, exports.saveAccessToken)(stateManager, response.token.session, response.token.refresh);
                                }
                            }),
                            createButton({
                                id: 'logout_button',
                                label: 'Logout',
                                value: undefined,
                                onTap: async () => {
                                    await (0, exports.authEndpointRequest)(requestManager, 'logout', {});
                                    await (0, exports.saveAccessToken)(stateManager, undefined, undefined);
                                }
                            })
                        ]
                    })
                ];
            }
        })
    });
};
exports.accountSettings = accountSettings;
const thumbnailSettings = (stateManager) => {
    return createNavigationButton({
        id: 'thumbnail_settings',
        value: '',
        label: 'Thumbnail Quality',
        form: createForm({
            onSubmit: (values) => {
                return Promise.all([
                    stateManager.store('homepage_thumbnail', values.homepage_thumbnail[0]),
                    stateManager.store('search_thumbnail', values.search_thumbnail[0]),
                    stateManager.store('manga_thumbnail', values.manga_thumbnail[0]),
                ]).then();
            },
            validate: () => {
                return Promise.resolve(true);
            },
            sections: () => {
                return Promise.resolve([
                    createSection({
                        id: 'thumbnail',
                        rows: () => {
                            return Promise.all([
                                (0, exports.getHomepageThumbnail)(stateManager),
                                (0, exports.getSearchThumbnail)(stateManager),
                                (0, exports.getMangaThumbnail)(stateManager)
                            ]).then(async (values) => {
                                return [
                                    createSelect({
                                        id: 'homepage_thumbnail',
                                        label: 'Homepage Thumbnail',
                                        options: MangaDexHelper_1.MDImageQuality.getEnumList(),
                                        displayLabel: option => MangaDexHelper_1.MDImageQuality.getName(option),
                                        value: [values[0]],
                                        allowsMultiselect: false,
                                        minimumOptionCount: 1
                                    }),
                                    createSelect({
                                        id: 'search_thumbnail',
                                        label: 'Search Thumbnail',
                                        options: MangaDexHelper_1.MDImageQuality.getEnumList(),
                                        displayLabel: option => MangaDexHelper_1.MDImageQuality.getName(option),
                                        value: [values[1]],
                                        allowsMultiselect: false,
                                        minimumOptionCount: 1
                                    }),
                                    createSelect({
                                        id: 'manga_thumbnail',
                                        label: 'Manga Thumbnail',
                                        options: MangaDexHelper_1.MDImageQuality.getEnumList(),
                                        displayLabel: option => MangaDexHelper_1.MDImageQuality.getName(option),
                                        value: [values[2]],
                                        allowsMultiselect: false,
                                        minimumOptionCount: 1
                                    })
                                ];
                            });
                        }
                    })
                ]);
            }
        })
    });
};
exports.thumbnailSettings = thumbnailSettings;
const resetSettings = (stateManager) => {
    return createButton({
        id: 'reset',
        label: 'Reset to Default',
        value: '',
        onTap: () => {
            return Promise.all([
                stateManager.store('languages', null),
                stateManager.store('ratings', null),
                stateManager.store('data_saver', null),
                stateManager.store('skip_same_chapter', null),
                stateManager.store('homepage_thumbnail', null),
                stateManager.store('search_thumbnail', null),
                stateManager.store('manga_thumbnail', null),
                stateManager.store('recommendedIds', null),
                stateManager.store('enabled_homepage_sections', null),
                stateManager.store('enabled_recommendations', null),
                stateManager.store('amount_of_recommendations', null)
            ]).then();
        }
    });
};
exports.resetSettings = resetSettings;
const getEnabledHomePageSections = async (stateManager) => {
    const enabled_homepage_sections = await stateManager.retrieve('enabled_homepage_sections');
    return enabled_homepage_sections != undefined && enabled_homepage_sections.length > 0 ? enabled_homepage_sections : MangaDexHelper_1.MDHomepageSections.getDefault();
};
exports.getEnabledHomePageSections = getEnabledHomePageSections;
const getEnabledRecommendations = async (stateManager) => {
    return await stateManager.retrieve('enabled_recommendations') ?? false;
};
exports.getEnabledRecommendations = getEnabledRecommendations;
const getAmountRecommendations = async (stateManager) => {
    return await stateManager.retrieve('amount_of_recommendations') ?? 5;
};
exports.getAmountRecommendations = getAmountRecommendations;
const homepageSettings = (stateManager) => {
    return createNavigationButton({
        id: 'homepage_settings',
        value: '',
        label: 'Homepage Settings',
        form: createForm({
            onSubmit: (values) => {
                return Promise.all([
                    stateManager.store('enabled_homepage_sections', values.enabled_homepage_sections),
                    // The `as boolean` seems required to prevent Paperback from throwing 
                    // `Invalid type for key value; expected `Bool` got `Optional<JSValue>``
                    stateManager.store('enabled_recommendations', values.enabled_recommendations),
                    stateManager.store('amount_of_recommendations', values.amount_of_recommendations),
                    (0, MangaDexSimilarManga_1.sliceRecommendedIds)(stateManager, values.amount_of_recommendations),
                ]).then();
            },
            validate: () => {
                return Promise.resolve(true);
            },
            sections: () => {
                return Promise.resolve([
                    createSection({
                        id: 'homepage_sections_section',
                        //footer: 'Which sections should be shown on the homepage',
                        rows: () => {
                            return Promise.all([
                                (0, exports.getEnabledHomePageSections)(stateManager),
                            ]).then(async (values) => {
                                return [
                                    createSelect({
                                        id: 'enabled_homepage_sections',
                                        label: 'Homepage sections',
                                        options: MangaDexHelper_1.MDHomepageSections.getEnumList(),
                                        displayLabel: option => MangaDexHelper_1.MDHomepageSections.getName(option),
                                        value: values[0] ?? [],
                                        allowsMultiselect: true,
                                        minimumOptionCount: 0
                                    }),
                                ];
                            });
                        }
                    }),
                    createSection({
                        id: 'recommendations_settings_section',
                        header: 'Titles recommendations',
                        footer: 'Recommendation are based on recently read chapters and shown on the homepage',
                        rows: () => {
                            return Promise.all([
                                (0, exports.getEnabledRecommendations)(stateManager),
                                (0, exports.getAmountRecommendations)(stateManager),
                                // Can be used to debug recommended ids
                                //getRecommendedIds(stateManager)
                            ]).then(async (values) => {
                                return [
                                    createSwitch({
                                        id: 'enabled_recommendations',
                                        label: 'Enable recommendations',
                                        value: values[0] ?? false
                                    }),
                                    createStepper({
                                        id: 'amount_of_recommendations',
                                        label: 'Amount of recommendation',
                                        value: values[1] ?? 5,
                                        min: 1,
                                        max: 15,
                                        step: 1
                                    }),
                                    createButton({
                                        id: 'reset_recommended_ids',
                                        label: 'Reset recommended titles',
                                        value: '',
                                        onTap: () => {
                                            return Promise.all([
                                                stateManager.store('recommendedIds', null),
                                            ]).then();
                                        }
                                    })
                                    // Can be used to debug recommended ids
                                    //createMultilineLabel({
                                    //    id: 'recommendation_ids_list',
                                    //    value: '',
                                    //    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                                    //    label: values[2]!.toString(),
                                    //}),   
                                ];
                            });
                        }
                    }),
                ]);
            }
        })
    });
};
exports.homepageSettings = homepageSettings;

}).call(this)}).call(this,require("buffer").Buffer)
},{"./MangaDexHelper":59,"./MangaDexSimilarManga":62,"buffer":2}],62:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addRecommendedId = exports.sliceRecommendedIds = exports.getRecommendedIds = void 0;
const MangaDexSettings_1 = require("./MangaDexSettings");
const getRecommendedIds = async (stateManager) => {
    // Return the list of ids that should be used for recommendations
    // We don't need to check the length of the list. If the max length was changed by the user, 
    // the list should have been modified
    return await stateManager.retrieve('recommendedIds') ?? [];
};
exports.getRecommendedIds = getRecommendedIds;
const sliceRecommendedIds = async (stateManager, amount) => {
    // Only keep `amount` elements in the recommendation list
    const recommendedIds = await (0, exports.getRecommendedIds)(stateManager);
    stateManager.store('recommendedIds', recommendedIds.slice(0, amount));
};
exports.sliceRecommendedIds = sliceRecommendedIds;
const addRecommendedId = async (stateManager, mangaId) => {
    // Add an id to the list of manga that should be used for recommendations
    const recommendedIds = await (0, exports.getRecommendedIds)(stateManager);
    // If the id is already in the list, we remove it to put it at the beginning
    const index = recommendedIds.indexOf(mangaId, 0);
    if (index > -1) {
        recommendedIds.splice(index, 1);
    }
    // We add the id at the beginning of list
    recommendedIds.unshift(mangaId);
    // We only keep the right amount of titles in order to prevent the list from being to large
    stateManager.store('recommendedIds', recommendedIds.slice(0, await (0, MangaDexSettings_1.getAmountRecommendations)(stateManager)));
};
exports.addRecommendedId = addRecommendedId;
/*
async removeRecommendedId(id: string): Promise<void>{
    const recommendedIds: string[] = await this.getRecommendedIds()
    
    // If the id is already in the list, we put it at the end
    const index = recommendedIds.indexOf(id, 0)
    if (index > -1) {
        recommendedIds.splice(index, 1)
    }
    
    this.stateManager.store('recommendedIds', recommendedIds)
}
*/ 

},{"./MangaDexSettings":61}],63:[function(require,module,exports){
module.exports=[{"result":"ok","data":{"id":"0234a31e-a729-4e28-9d6a-3f87c4966b9e","type":"tag","attributes":{"name":{"en":"Oneshot"},"description":[],"group":"format","version":1}},"relationships":[]},{"result":"ok","data":{"id":"07251805-a27e-4d59-b488-f0bfbec15168","type":"tag","attributes":{"name":{"en":"Thriller"},"description":[],"group":"genre","version":1}},"relationships":[]},{"result":"ok","data":{"id":"0a39b5a1-b235-4886-a747-1d05d216532d","type":"tag","attributes":{"name":{"en":"Award Winning"},"description":[],"group":"format","version":1}},"relationships":[]},{"result":"ok","data":{"id":"0bc90acb-ccc1-44ca-a34a-b9f3a73259d0","type":"tag","attributes":{"name":{"en":"Reincarnation"},"description":[],"group":"theme","version":1}},"relationships":[]},{"result":"ok","data":{"id":"256c8bd9-4904-4360-bf4f-508a76d67183","type":"tag","attributes":{"name":{"en":"Sci-Fi"},"description":[],"group":"genre","version":1}},"relationships":[]},{"result":"ok","data":{"id":"292e862b-2d17-4062-90a2-0356caa4ae27","type":"tag","attributes":{"name":{"en":"Time Travel"},"description":[],"group":"theme","version":1}},"relationships":[]},{"result":"ok","data":{"id":"2bd2e8d0-f146-434a-9b51-fc9ff2c5fe6a","type":"tag","attributes":{"name":{"en":"Genderswap"},"description":[],"group":"theme","version":1}},"relationships":[]},{"result":"ok","data":{"id":"2d1f5d56-a1e5-4d0d-a961-2193588b08ec","type":"tag","attributes":{"name":{"en":"Loli"},"description":[],"group":"theme","version":1}},"relationships":[]},{"result":"ok","data":{"id":"31932a7e-5b8e-49a6-9f12-2afa39dc544c","type":"tag","attributes":{"name":{"en":"Traditional Games"},"description":[],"group":"theme","version":1}},"relationships":[]},{"result":"ok","data":{"id":"320831a8-4026-470b-94f6-8353740e6f04","type":"tag","attributes":{"name":{"en":"Official Colored"},"description":[],"group":"format","version":1}},"relationships":[]},{"result":"ok","data":{"id":"33771934-028e-4cb3-8744-691e866a923e","type":"tag","attributes":{"name":{"en":"Historical"},"description":[],"group":"genre","version":1}},"relationships":[]},{"result":"ok","data":{"id":"36fd93ea-e8b8-445e-b836-358f02b3d33d","type":"tag","attributes":{"name":{"en":"Monsters"},"description":[],"group":"theme","version":1}},"relationships":[]},{"result":"ok","data":{"id":"391b0423-d847-456f-aff0-8b0cfc03066b","type":"tag","attributes":{"name":{"en":"Action"},"description":[],"group":"genre","version":1}},"relationships":[]},{"result":"ok","data":{"id":"39730448-9a5f-48a2-85b0-a70db87b1233","type":"tag","attributes":{"name":{"en":"Demons"},"description":[],"group":"theme","version":1}},"relationships":[]},{"result":"ok","data":{"id":"3b60b75c-a2d7-4860-ab56-05f391bb889c","type":"tag","attributes":{"name":{"en":"Psychological"},"description":[],"group":"genre","version":1}},"relationships":[]},{"result":"ok","data":{"id":"3bb26d85-09d5-4d2e-880c-c34b974339e9","type":"tag","attributes":{"name":{"en":"Ghosts"},"description":[],"group":"theme","version":1}},"relationships":[]},{"result":"ok","data":{"id":"3de8c75d-8ee3-48ff-98ee-e20a65c86451","type":"tag","attributes":{"name":{"en":"Animals"},"description":[],"group":"theme","version":1}},"relationships":[]},{"result":"ok","data":{"id":"3e2b8dae-350e-4ab8-a8ce-016e844b9f0d","type":"tag","attributes":{"name":{"en":"Long Strip"},"description":[],"group":"format","version":1}},"relationships":[]},{"result":"ok","data":{"id":"423e2eae-a7a2-4a8b-ac03-a8351462d71d","type":"tag","attributes":{"name":{"en":"Romance"},"description":[],"group":"genre","version":1}},"relationships":[]},{"result":"ok","data":{"id":"489dd859-9b61-4c37-af75-5b18e88daafc","type":"tag","attributes":{"name":{"en":"Ninja"},"description":[],"group":"theme","version":1}},"relationships":[]},{"result":"ok","data":{"id":"4d32cc48-9f00-4cca-9b5a-a839f0764984","type":"tag","attributes":{"name":{"en":"Comedy"},"description":[],"group":"genre","version":1}},"relationships":[]},{"result":"ok","data":{"id":"50880a9d-5440-4732-9afb-8f457127e836","type":"tag","attributes":{"name":{"en":"Mecha"},"description":[],"group":"genre","version":1}},"relationships":[]},{"result":"ok","data":{"id":"51d83883-4103-437c-b4b1-731cb73d786c","type":"tag","attributes":{"name":{"en":"Anthology"},"description":[],"group":"format","version":1}},"relationships":[]},{"result":"ok","data":{"id":"5920b825-4181-4a17-beeb-9918b0ff7a30","type":"tag","attributes":{"name":{"en":"Boys\u0027 Love"},"description":[],"group":"genre","version":1}},"relationships":[]},{"result":"ok","data":{"id":"5bd0e105-4481-44ca-b6e7-7544da56b1a3","type":"tag","attributes":{"name":{"en":"Incest"},"description":[],"group":"theme","version":1}},"relationships":[]},{"result":"ok","data":{"id":"5ca48985-9a9d-4bd8-be29-80dc0303db72","type":"tag","attributes":{"name":{"en":"Crime"},"description":[],"group":"genre","version":1}},"relationships":[]},{"result":"ok","data":{"id":"5fff9cde-849c-4d78-aab0-0d52b2ee1d25","type":"tag","attributes":{"name":{"en":"Survival"},"description":[],"group":"theme","version":1}},"relationships":[]},{"result":"ok","data":{"id":"631ef465-9aba-4afb-b0fc-ea10efe274a8","type":"tag","attributes":{"name":{"en":"Zombies"},"description":[],"group":"theme","version":1}},"relationships":[]},{"result":"ok","data":{"id":"65761a2a-415e-47f3-bef2-a9dababba7a6","type":"tag","attributes":{"name":{"en":"Reverse Harem"},"description":[],"group":"theme","version":1}},"relationships":[]},{"result":"ok","data":{"id":"69964a64-2f90-4d33-beeb-f3ed2875eb4c","type":"tag","attributes":{"name":{"en":"Sports"},"description":[],"group":"genre","version":1}},"relationships":[]},{"result":"ok","data":{"id":"7064a261-a137-4d3a-8848-2d385de3a99c","type":"tag","attributes":{"name":{"en":"Superhero"},"description":[],"group":"genre","version":1}},"relationships":[]},{"result":"ok","data":{"id":"799c202e-7daa-44eb-9cf7-8a3c0441531e","type":"tag","attributes":{"name":{"en":"Martial Arts"},"description":[],"group":"theme","version":1}},"relationships":[]},{"result":"ok","data":{"id":"7b2ce280-79ef-4c09-9b58-12b7c23a9b78","type":"tag","attributes":{"name":{"en":"Fan Colored"},"description":[],"group":"format","version":1}},"relationships":[]},{"result":"ok","data":{"id":"81183756-1453-4c81-aa9e-f6e1b63be016","type":"tag","attributes":{"name":{"en":"Samurai"},"description":[],"group":"theme","version":1}},"relationships":[]},{"result":"ok","data":{"id":"81c836c9-914a-4eca-981a-560dad663e73","type":"tag","attributes":{"name":{"en":"Magical Girls"},"description":[],"group":"genre","version":1}},"relationships":[]},{"result":"ok","data":{"id":"85daba54-a71c-4554-8a28-9901a8b0afad","type":"tag","attributes":{"name":{"en":"Mafia"},"description":[],"group":"theme","version":1}},"relationships":[]},{"result":"ok","data":{"id":"87cc87cd-a395-47af-b27a-93258283bbc6","type":"tag","attributes":{"name":{"en":"Adventure"},"description":[],"group":"genre","version":1}},"relationships":[]},{"result":"ok","data":{"id":"891cf039-b895-47f0-9229-bef4c96eccd4","type":"tag","attributes":{"name":{"en":"User Created"},"description":[],"group":"format","version":1}},"relationships":[]},{"result":"ok","data":{"id":"8c86611e-fab7-4986-9dec-d1a2f44acdd5","type":"tag","attributes":{"name":{"en":"Virtual Reality"},"description":[],"group":"theme","version":1}},"relationships":[]},{"result":"ok","data":{"id":"92d6d951-ca5e-429c-ac78-451071cbf064","type":"tag","attributes":{"name":{"en":"Office Workers"},"description":[],"group":"theme","version":1}},"relationships":[]},{"result":"ok","data":{"id":"9438db5a-7e2a-4ac0-b39e-e0d95a34b8a8","type":"tag","attributes":{"name":{"en":"Video Games"},"description":[],"group":"theme","version":1}},"relationships":[]},{"result":"ok","data":{"id":"9467335a-1b83-4497-9231-765337a00b96","type":"tag","attributes":{"name":{"en":"Post-Apocalyptic"},"description":[],"group":"theme","version":1}},"relationships":[]},{"result":"ok","data":{"id":"97893a4c-12af-4dac-b6be-0dffb353568e","type":"tag","attributes":{"name":{"en":"Sexual Violence"},"description":[],"group":"content","version":1}},"relationships":[]},{"result":"ok","data":{"id":"9ab53f92-3eed-4e9b-903a-917c86035ee3","type":"tag","attributes":{"name":{"en":"Crossdressing"},"description":[],"group":"theme","version":1}},"relationships":[]},{"result":"ok","data":{"id":"a1f53773-c69a-4ce5-8cab-fffcd90b1565","type":"tag","attributes":{"name":{"en":"Magic"},"description":[],"group":"theme","version":1}},"relationships":[]},{"result":"ok","data":{"id":"a3c67850-4684-404e-9b7f-c69850ee5da6","type":"tag","attributes":{"name":{"en":"Girls\u0027 Love"},"description":[],"group":"genre","version":1}},"relationships":[]},{"result":"ok","data":{"id":"aafb99c1-7f60-43fa-b75f-fc9502ce29c7","type":"tag","attributes":{"name":{"en":"Harem"},"description":[],"group":"theme","version":1}},"relationships":[]},{"result":"ok","data":{"id":"ac72833b-c4e9-4878-b9db-6c8a4a99444a","type":"tag","attributes":{"name":{"en":"Military"},"description":[],"group":"theme","version":1}},"relationships":[]},{"result":"ok","data":{"id":"acc803a4-c95a-4c22-86fc-eb6b582d82a2","type":"tag","attributes":{"name":{"en":"Wuxia"},"description":[],"group":"genre","version":1}},"relationships":[]},{"result":"ok","data":{"id":"ace04997-f6bd-436e-b261-779182193d3d","type":"tag","attributes":{"name":{"en":"Isekai"},"description":[],"group":"genre","version":1}},"relationships":[]},{"result":"ok","data":{"id":"b11fda93-8f1d-4bef-b2ed-8803d3733170","type":"tag","attributes":{"name":{"en":"4-Koma"},"description":[],"group":"format","version":1}},"relationships":[]},{"result":"ok","data":{"id":"b13b2a48-c720-44a9-9c77-39c9979373fb","type":"tag","attributes":{"name":{"en":"Doujinshi"},"description":[],"group":"format","version":1}},"relationships":[]},{"result":"ok","data":{"id":"b1e97889-25b4-4258-b28b-cd7f4d28ea9b","type":"tag","attributes":{"name":{"en":"Philosophical"},"description":[],"group":"genre","version":1}},"relationships":[]},{"result":"ok","data":{"id":"b29d6a3d-1569-4e7a-8caf-7557bc92cd5d","type":"tag","attributes":{"name":{"en":"Gore"},"description":[],"group":"content","version":1}},"relationships":[]},{"result":"ok","data":{"id":"b9af3a63-f058-46de-a9a0-e0c13906197a","type":"tag","attributes":{"name":{"en":"Drama"},"description":[],"group":"genre","version":1}},"relationships":[]},{"result":"ok","data":{"id":"c8cbe35b-1b2b-4a3f-9c37-db84c4514856","type":"tag","attributes":{"name":{"en":"Medical"},"description":[],"group":"genre","version":1}},"relationships":[]},{"result":"ok","data":{"id":"caaa44eb-cd40-4177-b930-79d3ef2afe87","type":"tag","attributes":{"name":{"en":"School Life"},"description":[],"group":"theme","version":1}},"relationships":[]},{"result":"ok","data":{"id":"cdad7e68-1419-41dd-bdce-27753074a640","type":"tag","attributes":{"name":{"en":"Horror"},"description":[],"group":"genre","version":1}},"relationships":[]},{"result":"ok","data":{"id":"cdc58593-87dd-415e-bbc0-2ec27bf404cc","type":"tag","attributes":{"name":{"en":"Fantasy"},"description":[],"group":"genre","version":1}},"relationships":[]},{"result":"ok","data":{"id":"d14322ac-4d6f-4e9b-afd9-629d5f4d8a41","type":"tag","attributes":{"name":{"en":"Villainess"},"description":[],"group":"theme","version":1}},"relationships":[]},{"result":"ok","data":{"id":"d7d1730f-6eb0-4ba6-9437-602cac38664c","type":"tag","attributes":{"name":{"en":"Vampires"},"description":[],"group":"theme","version":1}},"relationships":[]},{"result":"ok","data":{"id":"da2d50ca-3018-4cc0-ac7a-6b7d472a29ea","type":"tag","attributes":{"name":{"en":"Delinquents"},"description":[],"group":"theme","version":1}},"relationships":[]},{"result":"ok","data":{"id":"dd1f77c5-dea9-4e2b-97ae-224af09caf99","type":"tag","attributes":{"name":{"en":"Monster Girls"},"description":[],"group":"theme","version":1}},"relationships":[]},{"result":"ok","data":{"id":"ddefd648-5140-4e5f-ba18-4eca4071d19b","type":"tag","attributes":{"name":{"en":"Shota"},"description":[],"group":"theme","version":1}},"relationships":[]},{"result":"ok","data":{"id":"df33b754-73a3-4c54-80e6-1a74a8058539","type":"tag","attributes":{"name":{"en":"Police"},"description":[],"group":"theme","version":1}},"relationships":[]},{"result":"ok","data":{"id":"e197df38-d0e7-43b5-9b09-2842d0c326dd","type":"tag","attributes":{"name":{"en":"Web Comic"},"description":[],"group":"format","version":1}},"relationships":[]},{"result":"ok","data":{"id":"e5301a23-ebd9-49dd-a0cb-2add944c7fe9","type":"tag","attributes":{"name":{"en":"Slice of Life"},"description":[],"group":"genre","version":1}},"relationships":[]},{"result":"ok","data":{"id":"e64f6742-c834-471d-8d72-dd51fc02b835","type":"tag","attributes":{"name":{"en":"Aliens"},"description":[],"group":"theme","version":1}},"relationships":[]},{"result":"ok","data":{"id":"ea2bc92d-1c26-4930-9b7c-d5c0dc1b6869","type":"tag","attributes":{"name":{"en":"Cooking"},"description":[],"group":"theme","version":1}},"relationships":[]},{"result":"ok","data":{"id":"eabc5b4c-6aff-42f3-b657-3e90cbd00b75","type":"tag","attributes":{"name":{"en":"Supernatural"},"description":[],"group":"theme","version":1}},"relationships":[]},{"result":"ok","data":{"id":"ee968100-4191-4968-93d3-f82d72be7e46","type":"tag","attributes":{"name":{"en":"Mystery"},"description":[],"group":"genre","version":1}},"relationships":[]},{"result":"ok","data":{"id":"f4122d1c-3b44-44d0-9936-ff7502c39ad3","type":"tag","attributes":{"name":{"en":"Adaptation"},"description":[],"group":"format","version":1}},"relationships":[]},{"result":"ok","data":{"id":"f42fbf9e-188a-447b-9fdc-f19dc1e4d685","type":"tag","attributes":{"name":{"en":"Music"},"description":[],"group":"theme","version":1}},"relationships":[]},{"result":"ok","data":{"id":"f5ba408b-0e7a-484d-8d49-4e9125ac96de","type":"tag","attributes":{"name":{"en":"Full Color"},"description":[],"group":"format","version":1}},"relationships":[]},{"result":"ok","data":{"id":"f8f62932-27da-4fe4-8ee1-6779a8c5edba","type":"tag","attributes":{"name":{"en":"Tragedy"},"description":[],"group":"genre","version":1}},"relationships":[]},{"result":"ok","data":{"id":"fad12b5e-68ba-460e-b933-9ae8318f5b65","type":"tag","attributes":{"name":{"en":"Gyaru"},"description":[],"group":"theme","version":1}},"relationships":[]}]
},{}]},{},[58])(58)
});
