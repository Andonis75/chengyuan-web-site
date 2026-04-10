const { get } = require('../../utils/request');

Page({
  data: {
    summaryCards: [],
    recentAnalyses: [],
    loading: true
  },

  onLoad() {
    this.fetchHomeData();
  },

  onPullDownRefresh() {
    this.fetchHomeData().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  fetchHomeData() {
    this.setData({ loading: true });
    return get('/home')
      .then(res => {
        this.setData({
          summaryCards: res.summaryCards || [],
          recentAnalyses: res.recentAnalyses || [],
          loading: false
        });
      })
      .catch(err => {
        console.error('获取首页数据失败', err);
        this.setData({ loading: false });
      });
  },

  goToSamples() {
    wx.switchTab({
      url: '/pages/samples/samples'
    });
  },

  goToAnalysis() {
    wx.showToast({
      title: '请先选择样本',
      icon: 'none'
    });

    setTimeout(() => {
      wx.switchTab({
        url: '/pages/samples/samples'
      });
    }, 400);
  }
});
