const { get } = require('../../utils/request');

Page({
  data: {
    insights: null,
    loading: true
  },

  onLoad() {
    this.fetchInsights();
  },

  onPullDownRefresh() {
    this.fetchInsights().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  fetchInsights() {
    this.setData({ loading: true });
    return get('/insights')
      .then(res => {
        const topOrigins = (res.topOrigins || []).map(item => ({
          ...item,
          originName: item.name,
          score: Math.max(20, Math.min(100, Math.round((item.avgRatio || 0) * 5)))
        }));
        const maxBandCount = Math.max(...(res.qualityBands || []).map(item => item.count), 1);
        const qualityBands = (res.qualityBands || []).map(item => ({
          ...item,
          level: item.label,
          percentage: Math.round((item.count / maxBandCount) * 100)
        }));

        this.setData({
          insights: {
            ...res,
            topOrigins,
            qualityBands
          },
          loading: false
        });
      })
      .catch(err => {
        console.error('获取洞察数据失败', err);
        this.setData({ loading: false });
      });
  }
});
