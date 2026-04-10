const { get } = require('../../utils/request');
const { formatNumber } = require('../../utils/format');
const { buildReportViewModel } = require('../../utils/report');

Page({
  data: {
    resultId: '',
    taskId: '',
    result: null,
    reportView: null,
    loading: true
  },

  onLoad(options) {
    if (options.id || options.taskId) {
      this.setData({
        resultId: options.id || '',
        taskId: options.taskId || ''
      });

      if (options.id) {
        this.fetchResult();
      } else {
        this.fetchTaskResult();
      }
    } else {
      wx.showToast({ title: '参数错误', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1500);
    }
  },

  onUnload() {
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }
  },

  onPullDownRefresh() {
    const action = this.data.resultId ? this.fetchResult() : this.fetchTaskResult();
    Promise.resolve(action).finally(() => {
      wx.stopPullDownRefresh();
    });
  },

  fetchResult() {
    this.setData({ loading: true });
    return get(`/analysis/results/${this.data.resultId}`)
      .then(res => {
        const resultData = res.result || {};
        const result = {
          ...resultData,
          confidencePercent: resultData.confidence ? (resultData.confidence * 100).toFixed(1) : '--',
          predictedSsc: formatNumber(resultData.predictedSsc),
          predictedTa: formatNumber(resultData.predictedTa),
          predictedRatio: formatNumber(resultData.predictedRatio),
          predictedVc: formatNumber(resultData.predictedVc)
        };

        this.setData({
          taskId: this.data.taskId || resultData.taskId || '',
          result,
          reportView: buildReportViewModel(resultData),
          loading: false
        });
      })
      .catch(err => {
        console.error('获取分析结果失败', err);
        this.setData({ loading: false });
      });
  },

  fetchTaskResult() {
    if (!this.data.taskId) {
      this.setData({ loading: false });
      return Promise.resolve();
    }

    this.setData({ loading: true });
    return get(`/analysis/tasks/${this.data.taskId}`)
      .then(res => {
        const task = res.task || {};

        if (task.taskStatus === 'SUCCESS' && task.result && task.result.id) {
          this.setData({
            resultId: task.result.id,
            taskId: task.id
          });
          return this.fetchResult();
        }

        if (task.taskStatus === 'FAILED') {
          wx.showToast({ title: task.errorMessage || '分析失败', icon: 'none' });
          this.setData({ loading: false });
          return null;
        }

        this.setData({ loading: false });
        this.pollTaskStatus(task.id);
        return null;
      })
      .catch(err => {
        console.error('获取任务详情失败', err);
        this.setData({ loading: false });
      });
  },

  pollTaskStatus(taskId) {
    if (!taskId) {
      return;
    }

    wx.showLoading({ title: '分析中...', mask: true });

    const checkStatus = () => {
      get(`/analysis/tasks/${taskId}`)
        .then(res => {
          const task = res.task || {};

          if (task.taskStatus === 'SUCCESS' && task.result && task.result.id) {
            this.setData({
              resultId: task.result.id,
              taskId: task.id
            });
            this.fetchResult().finally(() => {
              wx.hideLoading();
            });
            return;
          }

          if (task.taskStatus === 'FAILED') {
            wx.hideLoading();
            this.setData({ loading: false });
            wx.showToast({ title: task.errorMessage || '分析失败', icon: 'none' });
            return;
          }

          this.pollTimer = setTimeout(checkStatus, 2000);
        })
        .catch(err => {
          console.error('轮询任务状态失败', err);
          wx.hideLoading();
          wx.showToast({ title: '查询状态失败', icon: 'none' });
        });
    };

    this.pollTimer = setTimeout(checkStatus, 2000);
  },

  goToReport() {
    if (this.data.taskId) {
      wx.showLoading({ title: '加载中...' });
      get(`/analysis/tasks/${this.data.taskId}`)
        .then(res => {
          wx.hideLoading();
          const reportIds = res.task.reportIds || [];
          if (reportIds.length > 0) {
            wx.navigateTo({
              url: `/pages/report/report?id=${reportIds[0]}`
            });
          } else {
            wx.showToast({ title: '报告尚未生成', icon: 'none' });
          }
        })
        .catch(() => {
          wx.hideLoading();
          wx.showToast({ title: '获取报告失败', icon: 'none' });
        });
    } else {
      wx.showToast({ title: '缺少任务信息', icon: 'none' });
    }
  }
});
