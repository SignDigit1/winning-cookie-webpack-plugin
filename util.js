/*
 * @Author: qiangfeng@winning.com.cn
 * @Date: 2019-11-22 08:40:25
 * @Last Modified by: qiangfeng@wining.com.cn
 * @Last Modified time: 2019-11-22 08:43:23
 */

/**
 * Merges two  objects, giving the last one precedence
 * @param {Object} target
 * @param {Object} source
 */
exports.objectMerge = function (target, source) {
  if (typeof target !== 'object') {
    target = {}
  }
  if (Array.isArray(source)) {
    return source.slice()
  }
  Object.keys(source).forEach(property => {
    const sourceProperty = source[property]
    if (sourceProperty instanceof Object) {
      target[property] = exports.objectMerge(target[property], sourceProperty)
    } else {
      target[property] = sourceProperty
    }
  })
  return target
}
