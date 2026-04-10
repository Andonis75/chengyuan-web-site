const { get } = require('../../utils/request');

Page({
  data: {
    taskId: '',
    sampleCode: '',
    taskType: 'SINGLE',
    progress: 10,
    taskStatus: 'PENDING',
    stepText: '分析任务已创建，正在准备模型计算...',
    failed: false,
    errorMessage: '',
    steps: [
      { key: 'created', label: '任务已创建', done: true },
      { key: 'running', label: '模型分析中', done: false },
      { key: 'report', label: '生成分析报告', done: false }
    ]
  },

  onLoad(options) {
    if (!options.taskId) {
      wx.showToast({ title: '缺少任务信息', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1200);
      return;
    }

    this.setData({
      taskId: options.taskId,
      sampleCode: options.sampleCode || '',
      taskType: options.taskType || 'SINGLE'
    });

    this.pollTaskStatus();
  },

  onUnload() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  },

  pollTaskStatus() {
    get(`/analysis/tasks/${this.data.taskId}`)
      .then((res) => {
        const task = res.task || {};
        const progress = typeof task.progress === 'number' ? Math.max(task.progress, 10) : 10;
        const isRunning = task.taskStatus === 'RUNNING' || task.taskStatus === 'SUCCESS';
        const isSuccess = task.taskStatus === 'SUCCESS';
        const steps = [
          { key: 'created', label: '任务已创建', done: true },
          { key: 'running', label: '模型分析中', done: isRunning },
          { key: 'report', label: '生成分析报告', done: isSuccess }
        ];

        this.setData({
          progress,
          taskStatus: task.taskStatus || 'PENDING',
          stepText: isSuccess ? '分析完成，正在跳转结果页...' : (isRunning ? '模型正在识别产地与品质指标...' : '正在准备分析任务...'),
          steps
        });

        if (task.taskStatus === 'SUCCESS' && task.result && task.result.id) {
          setTimeout(() => {
            wx.redirectTo({
              url: `/pages/result/result?id=${task.result.id}&taskId=${task.id}`
            });
          }, 500);
          return;
        }

        if (task.taskStatus === 'FAILED') {
          this.setData({
            failed: true,
            errorMessage: task.errorMessage || '分析失败，请稍后重试。',
            stepText: '分析任务执行失败'
          });
          return;
        }

        this.timer = setTimeout(() => this.pollTaskStatus(), 1800);
      })
      .catch((err) => {
        console.error('查询分析任务失败', err);
        this.timer = setTimeout(() => this.pollTaskStatus(), 2200);
      });
  },

  goBack() {
    wx.navigateBack();
  }
});

