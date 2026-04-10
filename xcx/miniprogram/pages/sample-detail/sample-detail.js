const { get } = require('../../utils/request');
const { formatDate, formatNumber } = require('../../utils/format');

Page({
  data: {
    sampleCode: '',
    sample: null,
    files: [],
    analyses: [],
    loading: true
  },

  onLoad(options) {
    if (options.code) {
      this.setData({ sampleCode: options.code });
      this.fetchSampleDetail();
    } else {
      wx.showToast({ title: '参数错误', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1500);
    }
  },

  onPullDownRefresh() {
    this.fetchSampleDetail().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  fetchSampleDetail() {
    this.setData({ loading: true });
    return get(`/samples/${this.data.sampleCode}`)
      .then(res => {
        const sampleData = res.sample || {};
        const sample = {
          ...sampleData,
          formattedDate: formatDate(sampleData.collectedAt),
          ssc: formatNumber(sampleData.ssc),
          ta: formatNumber(sampleData.ta),
          ratio: formatNumber(sampleData.ratio),
          vc: formatNumber(sampleData.vc)
        };
        
        const analyses = (sampleData.analyses || []).map(item => ({
          ...item,
          formattedDate: formatDate(item.createdAt)
        }));

        const files = (sampleData.files || []).map(item => ({
          ...item,
          formattedDate: formatDate(item.uploadedAt),
          sizeKb: formatNumber(item.fileSize / 1024, 1)
        }));

        this.setData({
          sample,
          analyses,
          files,
          loading: false
        });
      })
      .catch(err => {
        console.error('获取样本详情失败', err);
        this.setData({ loading: false });
      });
  },

  goToAnalysis() {
    wx.navigateTo({
      url: `/pages/analysis/analysis?code=${this.data.sampleCode}`
    });
  },

  goToResult(e) {
    const resultId = e.currentTarget.dataset.id;
    const taskId = e.currentTarget.dataset.taskId;
    if (resultId) {
      wx.navigateTo({
        url: `/pages/result/result?id=${resultId}${taskId ? `&taskId=${taskId}` : ''}`
      });
    }
  }
});
