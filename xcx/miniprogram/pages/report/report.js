const { get } = require('../../utils/request');
const app = getApp();
const { buildReportViewModel } = require('../../utils/report');

function safeParse(content) {
  try {
    const parsed = JSON.parse(content);
    if (parsed && parsed.grade && Array.isArray(parsed.metrics)) {
      return parsed;
    }
    return null;
  } catch (error) {
    return null;
  }
}

Page({
  data: {
    reportId: '',
    report: null,
    reportView: null,
    loading: true,
    downloading: false
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ reportId: options.id });
      this.fetchReport();
    } else {
      wx.showToast({ title: '参数错误', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1500);
    }
  },

  fetchReport() {
    this.setData({ loading: true });
    return get(`/reports/${this.data.reportId}`)
      .then(res => {
        const report = res.report || {};
        const parsed = report.structuredContent || safeParse(report.content || '');
        const fallbackResult = parsed
          ? {
              predictedOrigin: parsed.originConclusion ? parsed.originConclusion.predictedOrigin : '',
              confidence: parsed.originConclusion ? parsed.originConclusion.confidence : 0,
              predictedSsc: parsed.metrics && parsed.metrics[0] ? parsed.metrics[0].value : null,
              predictedTa: parsed.metrics && parsed.metrics[1] ? parsed.metrics[1].value : null,
              predictedRatio: parsed.metrics && parsed.metrics[2] ? parsed.metrics[2].value : null,
              predictedVc: parsed.metrics && parsed.metrics[3] ? parsed.metrics[3].value : null,
              sample: {
                originName: parsed.originConclusion ? parsed.originConclusion.sampleOriginName : '--'
              },
              compareSample: parsed.originConclusion && parsed.originConclusion.compareSampleOriginName
                ? { originName: parsed.originConclusion.compareSampleOriginName }
                : null
            }
          : null;

        this.setData({
          report,
          reportView: parsed || (fallbackResult ? buildReportViewModel(fallbackResult) : null),
          loading: false
        });
      })
      .catch(err => {
        console.error('获取报告失败', err);
        this.setData({ loading: false });
      });
  },

  downloadPdf() {
    if (this.data.downloading) return;
    
    this.setData({ downloading: true });
    wx.showLoading({ title: '正在生成PDF...' });

    const token = app.globalData.sessionToken || wx.getStorageSync('sessionToken');
    
    wx.downloadFile({
      url: `${app.globalData.baseUrl}/reports/${this.data.reportId}/pdf`,
      header: {
        'Authorization': `Bearer ${token}`
      },
      success: (res) => {
        if (res.statusCode === 200) {
          const filePath = res.tempFilePath;
          wx.openDocument({
            filePath: filePath,
            showMenu: true,
            success: () => {
              wx.hideLoading();
              this.setData({ downloading: false });
            },
            fail: (err) => {
              console.error('打开文档失败', err);
              wx.hideLoading();
              wx.showToast({ title: '打开PDF失败', icon: 'none' });
              this.setData({ downloading: false });
            }
          });
        } else {
          wx.hideLoading();
          wx.showToast({ title: '下载PDF失败', icon: 'none' });
          this.setData({ downloading: false });
        }
      },
      fail: (err) => {
        console.error('下载文件失败', err);
        wx.hideLoading();
        wx.showToast({ title: '网络异常', icon: 'none' });
        this.setData({ downloading: false });
      }
    });
  }
});
