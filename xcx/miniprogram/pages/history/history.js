const { get } = require('../../utils/request');
const { formatDate } = require('../../utils/format');

Page({
  data: {
    tasks: [],
    loading: false,
    page: 1,
    pageSize: 10,
    hasMore: true
  },

  onLoad() {
    this.fetchTasks(true);
  },

  onPullDownRefresh() {
    this.fetchTasks(true).then(() => {
      wx.stopPullDownRefresh();
    });
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.fetchTasks(false);
    }
  },

  fetchTasks(reset = false) {
    if (this.data.loading) return Promise.resolve();

    const page = reset ? 1 : this.data.page + 1;
    this.setData({ loading: true });

    return get('/analysis/tasks', { page, pageSize: this.data.pageSize })
      .then(res => {
        const newItems = (res.items || []).map(item => ({
          ...item,
          formattedDate: formatDate(item.createdAt)
        }));

        this.setData({
          tasks: reset ? newItems : [...this.data.tasks, ...newItems],
          page,
          hasMore: newItems.length === this.data.pageSize,
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
  }
});