const app = getApp();

const request = (options) => {
  return new Promise((resolve, reject) => {
    // 确保登录完成后再发请求
    const loginPromise = app.globalData.loginPromise || app.login();
    
    loginPromise.then(token => {
      const header = {
        'Content-Type': 'application/json',
        ...options.header
      };

      if (token) {
        header['Authorization'] = `Bearer ${token}`;
      }

      wx.request({
        url: `${app.globalData.baseUrl}${options.url}`,
        method: options.method || 'GET',
        data: options.data,
        header: header,
        success: (res) => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(res.data);
          } else if (res.statusCode === 401) {
            // Token 过期或无效，重新登录并重试一次
            wx.removeStorageSync('sessionToken');
            app.globalData.sessionToken = null;
            app.globalData.loginPromise = null;
            
            if (!options._retry) {
              options._retry = true;
              app.login().then(() => {
                request(options).then(resolve).catch(reject);
              }).catch(reject);
            } else {
              reject(new Error('认证失败，请重新登录'));
            }
          } else {
            wx.showToast({
              title: res.data.message || '请求失败',
              icon: 'none'
            });
            reject(res.data);
          }
        },
        fail: (err) => {
          wx.showToast({
            title: '网络异常，请稍后重试',
            icon: 'none'
          });
          reject(err);
        }
      });
    }).catch(err => {
      reject(err);
    });
  });
};

module.exports = {
  request,
  get: (url, data, header) => request({ url, method: 'GET', data, header }),
  post: (url, data, header) => request({ url, method: 'POST', data, header }),
  put: (url, data, header) => request({ url, method: 'PUT', data, header }),
  delete: (url, data, header) => request({ url, method: 'DELETE', data, header })
};