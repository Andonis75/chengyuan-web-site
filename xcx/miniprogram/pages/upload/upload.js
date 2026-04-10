const app = getApp();

Page({
  data: {
    sampleCode: '',
    files: [],
    uploading: false,
    fromAnalysis: false
  },

  onLoad(options) {
    this.setData({
      sampleCode: options.sampleCode || '',
      fromAnalysis: options.fromAnalysis === '1'
    });
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [field]: e.detail.value });
  },

  chooseMessageFile() {
    wx.chooseMessageFile({
      count: Math.max(1, 5 - this.data.files.length),
      type: 'file',
      extension: ['csv', 'txt', 'xlsx', 'xls'],
      success: (res) => {
        const newFiles = (res.tempFiles || []).map((file) => ({
          path: file.path,
          name: file.name,
          size: file.size,
          status: 'pending'
        }));

        this.setData({
          files: [...this.data.files, ...newFiles].slice(0, 5)
        });
      }
    });
  },

  removeFile(e) {
    const index = e.currentTarget.dataset.index;
    const files = [...this.data.files];
    files.splice(index, 1);
    this.setData({ files });
  },

  submit() {
    if (!this.data.sampleCode) {
      wx.showToast({ title: '请输入样本编号', icon: 'none' });
      return;
    }

    if (this.data.files.length === 0) {
      wx.showToast({ title: '请选择光谱文件', icon: 'none' });
      return;
    }

    this.setData({ uploading: true });
    this.uploadFiles(this.data.sampleCode);
  },

  uploadFiles(sampleCode) {
    const token = app.globalData.sessionToken || wx.getStorageSync('sessionToken');
    let successCount = 0;
    let failCount = 0;
    const total = this.data.files.length;

    const uploadNext = (index) => {
      if (index >= total) {
        this.setData({ uploading: false });

        if (failCount === 0) {
          wx.showToast({ title: this.data.fromAnalysis ? '上传完成，返回分析' : '上传成功', icon: 'success' });
          setTimeout(() => {
            wx.navigateBack();
          }, 1200);
          return;
        }

        wx.showModal({
          title: '上传完成',
          content: `成功 ${successCount} 个，失败 ${failCount} 个`,
          showCancel: false
        });
        return;
      }

      this.updateFileStatus(index, 'uploading');
      const file = this.data.files[index];

      wx.uploadFile({
        url: `${app.globalData.baseUrl}/files/upload`,
        filePath: file.path,
        name: 'file',
        formData: {
          sampleCode
        },
        header: {
          Authorization: `Bearer ${token}`
        },
        success: (res) => {
          if (res.statusCode === 200 || res.statusCode === 201) {
            successCount += 1;
            this.updateFileStatus(index, 'success');
          } else {
            failCount += 1;
            this.updateFileStatus(index, 'error');
          }
        },
        fail: (err) => {
          console.error('上传文件失败', err);
          failCount += 1;
          this.updateFileStatus(index, 'error');
        },
        complete: () => {
          uploadNext(index + 1);
        }
      });
    };

    uploadNext(0);
  },

  updateFileStatus(index, status) {
    const files = [...this.data.files];
    if (files[index]) {
      files[index].status = status;
      this.setData({ files });
    }
  }
});
