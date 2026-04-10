const { get, post } = require('../../utils/request');

Page({
  data: {
    sampleCode: '',
    taskType: 'SINGLE', // SINGLE 或 COMPARE
    compareSampleCode: '',
    uploadedFiles: [],
    fileCount: 0,
    previewResult: null,
    loading: false,
    submitting: false,
    fileLoading: false
  },

  onLoad(options) {
    if (options.code) {
      this.setData({ sampleCode: options.code });
      this.fetchUploadedFiles();
      this.fetchPreview();
    } else {
      wx.showToast({ title: '参数错误', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1500);
    }
  },

  onShow() {
    if (this.data.sampleCode) {
      this.fetchUploadedFiles();
    }
  },

  onTaskTypeChange(e) {
    const type = e.detail.value;
    this.setData({ 
      taskType: type,
      previewResult: null
    });
    if (type === 'SINGLE') {
      this.setData({ compareSampleCode: '' });
      this.fetchPreview();
    }
  },

  onCompareCodeInput(e) {
    this.setData({ compareSampleCode: e.detail.value });
  },

  onCompareCodeBlur() {
    if (this.data.taskType === 'COMPARE' && this.data.compareSampleCode) {
      this.fetchPreview();
    }
  },

  fetchPreview() {
    if (this.data.taskType === 'COMPARE' && !this.data.compareSampleCode) {
      return;
    }

    this.setData({ loading: true });
    const payload = {
      sampleCode: this.data.sampleCode,
      taskType: this.data.taskType
    };
    
    if (this.data.taskType === 'COMPARE') {
      payload.compareSampleCode = this.data.compareSampleCode;
    }

    post('/model/predict/preview', payload)
      .then(res => {
        this.setData({
          previewResult: res.prediction,
          loading: false
        });
      })
      .catch(err => {
        console.error('获取预览失败', err);
        this.setData({ 
          previewResult: null,
          loading: false 
        });
      });
  },

  fetchUploadedFiles() {
    this.setData({ fileLoading: true });
    return get('/files', { sampleCode: this.data.sampleCode })
      .then((res) => {
        const files = res.items || [];
        this.setData({
          uploadedFiles: files.slice(0, 3),
          fileCount: files.length,
          fileLoading: false
        });
      })
      .catch((err) => {
        console.error('获取光谱文件列表失败', err);
        this.setData({
          uploadedFiles: [],
          fileCount: 0,
          fileLoading: false
        });
      });
  },

  goToUpload() {
    wx.navigateTo({
      url: `/pages/upload/upload?sampleCode=${this.data.sampleCode}&fromAnalysis=1`
    });
  },

  submitAnalysis() {
    if (this.data.fileCount < 1) {
      wx.showToast({ title: '请先上传光谱文件', icon: 'none' });
      return;
    }

    if (this.data.taskType === 'COMPARE' && !this.data.compareSampleCode) {
      wx.showToast({ title: '请输入对比样本编号', icon: 'none' });
      return;
    }

    this.setData({ submitting: true });
    const payload = {
      sampleCode: this.data.sampleCode,
      taskType: this.data.taskType
    };
    
    if (this.data.taskType === 'COMPARE') {
      payload.compareSampleCode = this.data.compareSampleCode;
    }

    post('/analysis/tasks', payload)
      .then(res => {
        this.setData({ submitting: false });
        wx.redirectTo({
          url: `/pages/analyzing/analyzing?taskId=${res.taskId}&sampleCode=${this.data.sampleCode}&taskType=${this.data.taskType}`
        });
      })
      .catch(err => {
        console.error('提交分析任务失败', err);
        this.setData({ submitting: false });
      });
  }
});
