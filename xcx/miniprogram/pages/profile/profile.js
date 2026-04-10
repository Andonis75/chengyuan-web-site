const { get } = require('../../utils/request');
const { formatDate } = require('../../utils/format');

Page({
  data: {
    userInfo: null,
    historyTasks: [],
    loading: true
  },

  onLoad() {
    this.fetchProfile();
    this.fetchHistoryTasks();
  },

  onPullDownRefresh() {
    Promise.all([this.fetchProfile(), this.fetchHistoryTasks()]).then(() => {
      wx.stopPullDownRefresh();
    });
  },

  fetchProfile() {
    return get('/profile')
      .then(res => {
        this.setData({ userInfo: res.user || {} });
      })
      .catch(err => console.error('获取用户信息失败', err));
  },

  fetchHistoryTasks() {
    this.setData({ loading: true });
    return get('/analysis/tasks', { page: 1, pageSize: 5 })
      .then(res => {
        const tasks = (res.items || []).map(item => ({
          ...item,
          formattedDate: formatDate(item.createdAt)
        }));
        this.setData({
          historyTasks: tasks,
          loading: false
        });
      })
      .catch(err => {
        console.error('获取历史任务失败', err);
        this.setData({ loading: false });
      });
  },

  goToTaskDetail(e) {
    const taskId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/result/result?taskId=${taskId}`
    });
  },

  goToAllTasks() {
    wx.navigateTo({
      url: '/pages/history/history'
    });
  }
});