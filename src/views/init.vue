<template>
  <div class="mainDiv">
    <el-drawer
        :visible.sync="showTable"
        direction="rtl"
        :title="'替换样例文本即可进行文本比对！当前文本相似度为：' + this.calculateSimilarity + ' %'"
        size="100%">
      <code-diff
          :old-string="text_left"
          :new-string="text_right"
          output-format="side-by-side"
          diffStyle="char"
          trim="true"/>
      <div>
        <el-input
            type="textarea"
            resize="none"
            :rows="20"
            placeholder="第一段文本"
            v-model="text_left"
            style="width: 750px; height: 600px; margin-top: 5px; margin-left: 5px; box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);"
        >
        </el-input>
        <el-input
            type="textarea"
            resize="none"
            :rows="20"
            placeholder="第二段文本"
            v-model="text_right"
            style="width: 750px; height: 600px; margin-top: 5px; margin-left: 5px; box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);"
        >
        </el-input>
      </div>
    </el-drawer>
    <div class="div1">
      <div class="contrastDiv">
        <span class="contrast" @click="showTable = true" style=" font-size: 22px; cursor: pointer; color: #409eff;">打开文本比对器</span>
      </div>
      <div class="upload">
        <el-upload
            v-show="index"
            drag
            action="http://localhost:8181/upload"
            :http-request="uploadFile"
            multiple
            :limit="1"
            :before-upload="beforeUpload"
            :on-success="handleSuccess"
            @change="handleChange"
        >
          <i class="el-icon-upload"></i>
          <div class="el-upload__text">将.txt文件拖到此处，或<em>点击上传</em><br></div>
        </el-upload>
        <div class="counter" :style="{color: counterColor}">{{ inputLength }} / 10000</div>
      </div>
    </div>
    <div class="div2">
      <div class="box">
        <el-select v-model="selectedDynasty" clearable placeholder="选择朝代" @change="handleDynastyChange">
          <el-option
              v-for="item in options_dynasty"
              :key="item.value"
              :label="item.label"
              :value="item.value">
          </el-option>
        </el-select>
      </div>
      <div class="box">
        <el-select v-model="selectedAlgorithm" clearable placeholder="选择模型" @change="handleAlgorithmChange">
          <el-option
              v-for="item in options_algorithm"
              :key="item.value"
              :label="item.label"
              :value="item.value">
          </el-option>
        </el-select>
      </div>
      <div class="temp"></div>
      <div class="input-container">
        <el-input
            type="textarea"
            resize="none"
            :rows="16"
            placeholder="请输入需要分词的文本"
            v-model="input"
            :style="{ border: inputBorder }"
            style="width: 550px; height: 493px; margin-top: 20px; margin-left: 20px;
            background-color: transparent !important; box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);"
            @focus="hideUpload"
            @blur="showUpload"
        >
        </el-input>
      </div>
      <div class="output-container">
        <el-input
            type="textarea"
            resize="none"
            readonly
            :rows="16"
            placeholder="分词后的结果将在这里展示"
            v-model="output"
            style="width: 550px; height: 493px; margin-top: 20px; margin-left: 20px; box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);"
        >
        </el-input>
      </div>
      <div class="history">
        历史记录
        <br>
        ---------------------------------
        <br>
        <el-tag
            class="tag"
            v-for="history in historyRecode"
            :key="history.id"
            closable
            :disable-transitions="false"
            @close="handleClose(history)"
            @click="setHistoryInput(history)"
            :title=" history.history | moreTruncateText " >
          {{ history.history | truncateText }}
        </el-tag>
      </div>
      <div class="temp"></div>
      <div class="buttonDiv">
        <el-button type="primary" :disabled="isOver()" :title="tips()" round @click="DivideWord()">实时分词</el-button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "init",
  filters: {
    truncateText(value) {
      if (value && value.length > 18) {
        return value.slice(0, 18) + '...';
      }
      return value;
    },
    moreTruncateText(value) {
      if (value && value.length > 100) {
        return value.slice(0, 100) + '......';
      }
      return value;
    }
  },
  computed: {
    inputLength() {
      return this.input.length;
    },
    inputBorder() {
      return this.inputLength > 10000 ? '1px solid red' : '';
    },
    counterColor() {
      return this.inputLength > 10000 ? 'red' : 'gray';
    }
  },
  watch: {
    text_left(value) {
      this.calculatePojo.inputLeft = value;
      this.calculatePojo.inputRight = this.text_right;
      console.log("value: " + value)
      console.log("calculatePojo: " + this.calculatePojo.inputLeft + "//////" + this.calculatePojo.inputRight)
      this.calculate();
    },
    text_right(value) {
      this.calculatePojo.inputLeft = this.text_left;
      this.calculatePojo.inputRight = value;
      console.log("value: " + value)
      console.log("calculatePojo: " + this.calculatePojo)
      this.calculate();
    }
  },
  methods: {
    async DivideWord() {

      const _this = this;
      const loading = this.$loading({
        lock: true,
        text: '正在加载分词模型...稍后显示分词结果...',
        spinner: 'el-icon-loading',
        background: 'rgba(0, 0, 0, 0.7)'
      });

      _this.inputPojo.inputString = _this.input;

      this.$axios.post('http://localhost:8181/divideWord', _this.inputPojo).then(response => {
        this.$set(this, "output", response.data)
        loading.close();
        this.$message({
          message: '分词成功！',
          type: 'success'
        });
      });

      try {
        // 先发送 POST 请求添加数据
        await this.$axios.post('http://localhost:8181/addHistory', _this.input);
        // 然后发送 GET 请求获取最新数据
        const resp = await _this.$axios.get('http://localhost:8181/getHistory');
        this.$set(this, "historyRecode", resp.data)
      } catch (error) {
        console.error('Error:', error);
      }
    },
    async uploadFile(param) {
      const formData = new FormData()
      formData.append('file', param.file)
      this.$axios.post('http://localhost:8181/upload', formData).then(response => {
        console.log(response.data)
      }).catch(response => {
        console.log('发生了未知异常！')
      })
      this.index = false;
    },
    calculate() {
      const _this = this;
      this.$axios.post('http://localhost:8181/getCalculateSimilarity', this.calculatePojo).then(function(resp) {
        _this.$set(_this, "calculateSimilarity", resp.data);
      }).catch(function(error) {
        console.error('Error:', error);
      });
    },
    tips() {
      return this.inputLength > 10000 ? '编辑文本后进行分词！' : '实时分词';
    },
    isOver() {
      if (this.inputLength > 10000) {
        this.$notify({
          title: '警告',
          message: '超出文本最大长度！请分段输入！',
          type: 'warning',
          duration: 0
        });
      }
      return this.input.length > 10000;
    },
    handleChange(fileList) {
      // 检查用户选择的文件数量
      if (fileList.length > 1) {
        this.$message.error('只能上传一个文件，请重新选择');
        // 清空已选择的文件列表
        fileList.splice(0, fileList.length - 1);
      }
    },
    beforeUpload(file) {
      // 检查文件类型是否为 txt
      if (file.type !== 'text/plain') {
        this.$message.error('请上传 .txt 格式的文件');
        return false; // 阻止上传
      }
      return true; // 允许上传
    },
    handleSuccess(response, file) {

      const loading = this.$loading({
        lock: true,
        text: '正在加载文件...请稍后...',
        spinner: 'el-icon-loading',
        background: 'rgba(0, 0, 0, 0.7)'
      }); setTimeout(() => {
        loading.close();
      }, 1000);

      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target.result;
        this.$set(this, "input", content);
        this.sendContentToBackend(content, file);
      };
      loading.close();
      reader.readAsText(file.raw);
    },
    sendContentToBackend(content, file) {
      const formData = new FormData();
      formData.append('file', file.raw); // 以 FormData 的形式将文件添加到请求中
      formData.append('content', content); // 也可以将文件内容作为 formData 的一个字段添加到请求中
      this.$axios.post('http://localhost:8181/upload', formData).then(response => {
        console.log(response.data);
      }).catch(error => {
        console.log('发生了未知异常！');
      });
    },
    setHistoryInput(history) {
      this.index = false;
      this.$set(this, "input", history.history);
    },
    hideUpload() {
      if (this.input === '')
        this.index = false;
    },
    showUpload() {
      if (this.input === '')
        this.index = true;
    },
    handleClose(history) {
      this.historyRecode.splice(this.historyRecode.indexOf(history), 1);
      this.$axios.post('http://localhost:8181/deleteHistory/' + history.id).then(function(resp) {
      })
    },
    handleDynastyChange(value) {
      this.inputPojo.selectedDynastyString = value;
    },
    handleAlgorithmChange(value) {
      this.inputPojo.selectedAlgorithmString = value;
    }
  },
  data() {
    return {
      options_dynasty: [{
        value: '选项1',
        label: '春秋'
      }, {
        value: '选项2',
        label: '不区分朝代'
      }],
      options_algorithm: [{
        value: '选项1',
        label: 'CRF'
      }, {
        value: '选项2',
        label: 'HanLP'
      }, {
        value: '选项3',
        label: '不指定分词模型'
      }],
      inputPojo: {
        inputString: '',
        selectedDynastyString: '',
        selectedAlgorithmString: ''
      },
      calculatePojo: {
        inputLeft: '',
        inputRight: ''
      },
      selectedDynasty: '',
      selectedAlgorithm: '',
      value1: '',
      value2: '',
      input: '',
      output: '',
      index: true,
      historyRecode: [],
      borderColorNormal: '#c0c4cc', // 正常情况下的边框颜色
      borderColorRed: 'red',  // 边框超出长度限制时的颜色
      showLoading: false,
      showTable: false,
      text_left: `(以下为示例文本)
黄河之水天上来
黄 河 之 水 天 上 来
黄河水天上来`,
      text_right: `(以下为示例文本)
黄河之水天下来
黄 河 之 水 天 上来
黄河之水天上来`,
      calculateSimilarity: 92.10526
    }
  },
  created(){
    const _this = this
    _this.$axios.get('http://localhost:8181/getHistory').then(function(resp) {
       _this.historyRecode = resp.data
    })
  }
}
</script>

<style scoped>

  ::v-deep .el-textarea__inner{
    font-family: "Helvetica Neue",Helvetica,"PingFang SC","Hiragino Sans GB","Microsoft YaHei","微软雅黑",Arial,sans-serif;
    font-size: 20px;
  }

  .mainDiv {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    /* 背景图 */
    background-image: url('/src/pictures/R.jpg');
    background-size: cover;
  }

  .mainDiv::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    /* 背景图的透明度 */
    background-color: rgba(255, 255, 255, 0.90); /* 可根据需要调整透明度，最后一个参数为透明度，取值范围为0到1 */
  }

  .contrastDiv {
    margin-left: 980px;
    margin-top: 20px;
    position: absolute; /* 使用绝对定位 */
  }

  .contrast {
    font-size: 16px;
    text-decoration: none; /* 移除默认的下划线 */
    border-bottom: 1px solid transparent; /* 初始时设置下划线为透明 */
    transition: border-color 0.1s, border-bottom-width 0.1s; /* 添加过渡效果 */
  }

  .contrast:hover {
    border-color: #409eff;
    border-bottom-width: 2px; /* 鼠标悬停时增加下划线的宽度 */
  }

  .div1, .div2 {
    position: relative;
    z-index: 1; /* 保证 div2 在 div1 下方 */
  }

  .div1 {
    z-index: 2; /* div1 在 div2 之上 */
  }

  .counter {
    text-align: left; /* 设置文本左对齐 */
    position: fixed; /* 相对于文档固定位置 */
    top: 590px; /* 调整顶部位置 */
    left: 560px; /* 调整左侧位置 */
    transform: translateX(-100%); /* 使文本内容向左扩展 */
  }

  .upload {
    position: absolute; /* 使用绝对定位 */
    left: 100px; /* 调整左侧位置 */
    top: 350px; /* 调整顶部位置 */
  }

  .tag {
    margin-right: 5px;
    margin-top: 5px;
    cursor: pointer;
  }

  .history{
    margin-top: 20px;
    margin-left: 20px;
    width: 250px;
    height: 450px;
    border: 1px solid white;
    overflow-y: auto; /* 在内容溢出时显示垂直滚动条 */
    overflow-x: hidden; /* 隐藏水平滚动条 */
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
    color: black;
    float: left; /* 让元素向左浮动 */
    border-radius: 10px; /*边框圆角*/
    padding: 20px;
  }

  .box{
    margin-top: 20px;
    float: left; /* 让元素向左浮动 */
    margin-left: 20px;
    border-radius: 10px; /*边框圆角*/
  }

  .temp{
    clear: both; /* 清除浮动 */
  }

  .input-container {
    float: left; /* 让元素向左浮动 */
  }

  .output-container {
    float: left;
  }

  .buttonDiv{
    margin-top: 30px;
    margin-left: 1050px;
  }
</style>