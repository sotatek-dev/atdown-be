class AxiosErrorHandler {
  static getErrorInfo(err) {
    if (err.response) {
      const { data } = err.response;
      if (typeof data === 'string') {
        return data;
      }

      return JSON.stringify(data);
    }

    return `Unknown Error`;
  }
}

module.exports = AxiosErrorHandler;
