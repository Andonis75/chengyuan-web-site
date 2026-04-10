const { get } = require('../../utils/request');
const { formatDate, formatNumber } = require('../../utils/format');

Page({
  data: {
    samples: [],
    loading: false,
    page: 1,
    pageSize: 10,
    hasMore: true,
    keyword: '',
    origins: [],
    selectedOrigin: '',
    selectedOriginName: '全部产地'
  },

  onLoad() {
    this.fetchOrigins();
    this.fetchSamples(true);
  },

  onPullDownRefresh() {
    this.fetchSamples(true).then(() => {
      wx.stopPullDownRefresh();
    });
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.fetchSamples(false);
    }
  },

  onSearchInput(e) {
    this.setData({ keyword: e.detail.value });
  },

  onSearchConfirm() {
    this.fetchSamples(true);
  },

  onOriginChange(e) {
    const index = e.detail.value;
    const origin = this.data.origins[index];
    this.setData({ 
      selectedOrigin: origin.code === 'ALL' ? '' : origin.code,
      selectedOriginName: origin.name
    });
    this.fetchSamples(true);
  },

  fetchOrigins() {
    get('/origins').then(res => {
      this.setData({
        origins: [{ code: 'ALL', name: '全部产地' }, ...(res.items || [])]
      });
    }).catch(err => console.error('获取产地失败', err));
  },

  fetchSamples(reset = false) {
    if (this.data.loading) return Promise.resolve();

    const page = reset ? 1 : this.data.page + 1;
    this.setData({ loading: true });

    const params = {
      page,
      pageSize: this.data.pageSize,
      keyword: this.data.keyword,
      originCode: this.data.selectedOrigin
    };

    return get('/samples', params)
      .then(res => {
        const newItems = (res.items || []).map(item => ({
          ...item,
          formattedDate: formatDate(item.collectedAt),
          ssc: formatNumber(item.ssc),
          ta: formatNumber(item.ta)
        }));

        this.setData({
          samples: reset ? newItems : [...this.data.samples, ...newItems],
          page,
          hasMore: newItems.length === this.data.pageSize,
          loading: false
        });
      })
      .catch(err => {
        console.error('获取样本列表失败', err);
        this.setData({ loading: false });
      });
  },

  goToDetail(e) {
    const code = e.currentTarget.dataset.code;
    wx.navigateTo({
      url: `/pages/sample-detail/sample-detail?code=${code}`
    });
  }
});