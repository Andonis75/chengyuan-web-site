App({
  globalData: {
    userInfo: null,
    sessionToken: null,
    baseUrl: 'http://127.0.0.1:4300/api',
    loginPromise: null
  },

  onLaunch() {
    const token = wx.getStorageSync('sessionToken');
    if (token) {
      this.globalData.sessionToken = token;
      this.globalData.loginPromise = Promise.resolve(token);
    } else {
      this.login();
    }
  },

  login() {
    if (this.globalData.loginPromise) {
      return this.globalData.loginPromise;
    }

    this.globalData.loginPromise = new Promise((resolve, reject) => {
      wx.login({
        success: (res) => {
          if (!res.code) {
            this.globalData.loginPromise = null;
            reject(new Error(res.errMsg || 'wx.login failed'));
            return;
          }

          wx.request({
            url: `${this.globalData.baseUrl}/auth/wechat/login`,
            method: 'POST',
            data: {
              code: res.code,
              nickname: '微信用户',
              avatarUrl: ''
            },
            success: (loginRes) => {
              if (loginRes.statusCode === 200 && loginRes.data.sessionToken) {
                this.globalData.sessionToken = loginRes.data.sessionToken;
                wx.setStorageSync('sessionToken', loginRes.data.sessionToken);
                resolve(loginRes.data.sessionToken);
                return;
              }

              this.globalData.loginPromise = null;
              reject(new Error('登录失败'));
            },
            fail: (err) => {
              this.globalData.loginPromise = null;
              reject(err);
            }
          });
        },
        fail: (err) => {
          this.globalData.loginPromise = null;
          reject(err);
        }
      });
    });

    return this.globalData.loginPromise;
  }
});
