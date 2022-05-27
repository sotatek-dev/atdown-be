const _ = require('lodash');

const Const = use('App/Common/Const');
const ErrorFactory = use('App/Common/ErrorFactory');

class Common {
  constructor() {
    //
  }

  toSnakeCase(obj) {
    return _.transform(obj, (result, val, key) => {
      const newVal = _.isObject(val) ? this.toSnakeCase(val) : val;
      result[_.snakeCase(key)] = newVal;
    });
  }

  toCamelCase(obj) {
    let camel;
    try {
      obj = obj.toJSON();
    } catch (err) {
      if (!(err instanceof TypeError)) {
        throw err;
      }
    } finally {
      camel = _.transform(obj, (result, val, key) => {
        const newVal = _.isObject(val) ? this.toCamelCase(val) : val;
        result[_.camelCase(key)] = newVal;
      });
    }
    return camel;
  }

  saveParseJSON(jsonStr) {
    try {
      return JSON.parse(jsonStr);
    } catch (e) {
      return jsonStr;
    }
  }

  buildPaginationMetaData(pageNum, metaData) {
    return {
      pagination: {
        page: pageNum,
        page_count: metaData.lastPage,
        item_count: metaData.total
      }
    };
  }

  buildResponseWithPagination(pageNum, result, modified = null) {
    if (modified) {
      return {
        data: result.data,
        meta: {
          pagination: {
            page: result.page,
            page_count: result.lastPage,
            item_count: result.total
          }
        }
      };
    }
    return {
      data: result.toJSON().data,
      meta: {
        pagination: {
          page: result.pages.page,
          page_count: result.pages.lastPage,
          item_count: result.pages.total
        }
      }
    };
  }

  checkTxTableValid(txTable) {
    if (_.find(Const.TX_TABLE, e => e == txTable) === undefined) {
      this.throwUnknownTxTableErr(txTable);
    }
  }

  throwUnknownTxTableErr(txTable) {
    throw ErrorFactory.internal(`Unknown txTable: ${txTable}`);
  }
}

module.exports = new Common();
