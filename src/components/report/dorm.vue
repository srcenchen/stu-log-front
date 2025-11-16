<template>
  <div class="max-w-xl w-full flex flex-col mt-2">
    <v-autocomplete
      label="选择宿舍"
      v-model="dormChoose"
      :items="dormList"
      item-title="dormBuilding"
      item-value="id"
      variant="outlined"
      @update:model-value="queryStudentHandler"
    ></v-autocomplete>
    <v-autocomplete
      chips
      label="选择学生"
      v-model="studentChoose"
      :items="stduentList"
      item-title="name"
      item-value="id"
      multiple
      variant="outlined"
    ></v-autocomplete>
    <v-autocomplete
      label="选择条例"
      v-model="ruleChoose"
      :items="ruleList"
      item-title="rule"
      item-value="id"
      variant="outlined"
      @update:model-value="
        (value) => {
          scoreChange = ruleList.find((item) => item.id == value).score;
        }
      "
    ></v-autocomplete>
    <v-number-input
      :reverse="false"
      v-model="scoreChange"
      controlVariant="default"
      label="分数变化"
      :hideInput="false"
      :inset="false"
      variant="outlined"
    ></v-number-input>
    <v-text-field
      label="备注"
      v-model="comment"
      variant="outlined"
    ></v-text-field>
    <v-file-input
      v-model="files"
      accept="image/png, image/jpeg, image/bmp"
      label="图片"
      placeholder="上传图片"
      prepend-icon="mdi-camera"
      multiple
      chips
    ></v-file-input>
    <v-btn
      @click="
        () => {
          submit();
        }
      "
      variant="outlined"
      color="primary"
      >提交</v-btn
    >
  </div>
</template>

<script setup>
import axios from "axios";
import { onMounted, ref } from "vue";
import { toast } from "vue3-toastify";
// 数据
const studentChoose = ref([]);
const dormChoose = ref();
const ruleChoose = ref();
const scoreChange = ref(0);
const comment = ref("");

const stduentList = ref([]);
const dormList = ref([]);
const ruleList = ref([]);
const files = ref([]);

function queryStudentHandler(value) {
  axios
    .get("/v1/base_info/student/list", {
      params: {
        page: 1,
        pageSize: 30,
        dormId: value,
      },
    })
    .then((data) => {
      stduentList.value = data.data.students;
      // 先按 dormPos 升序（把可能的字符串转为数字，NaN 放到末尾）
      stduentList.value.sort((a, b) => {
        const pa = Number(a.dormPos);
        const pb = Number(b.dormPos);
        if (Number.isNaN(pa) && Number.isNaN(pb)) return 0;
        if (Number.isNaN(pa)) return 1;
        if (Number.isNaN(pb)) return -1;
        return pa - pb;
      });

      // 再拼接 name 字段
      stduentList.value.forEach((item) => {
        item.name = `${item.name} ${item.stuNum} ${item.gradeName}${item.className}班 ${item.dormPos}号床`;
      });
    });
}
function queryDorm() {
  axios.get("/v1/stu_log/dorm").then((data) => {
    dormList.value = data.data.list;
    dormList.value.forEach((item) => {
      item.dormBuilding = `${item.dormBuilding} ${item.gradeName} ${item.sex}${item.dormNum}`;
    });
  });
}
function queryRule() {
  axios.get("/v1/stu_log/rule").then((data) => {
    ruleList.value = data.data.list;
    ruleList.value.forEach((item) => {
      item.rule = `${item.group}  ${item.rule} ${item.score}分`;
    });
    // 过滤 rule 中包含“宿舍常规”
    ruleList.value = ruleList.value.filter((item) =>
      item.rule.includes("宿舍常规")
    );
  });
}

const submit = async () => {
  var imageIds = [];
  if (files.value.length != 0) {
    const formData = new FormData();
    files.value.forEach((file) => {
      formData.append("file", file);
    });
    try {
      const res = await axios.post("/v1/upload?mode=image", formData);
      imageIds = res.data.imageIds;
    } catch (err) {
      toast("出错了，上报失败", {
        type: "error",
        position: "top-center",
      });
    }
  }
  const stuInfo = await axios.get("/v1/base_info/student", {
    params: {
      id: 1,
    },
  });
  try {
    await axios.post("/v1/stu_log/report", {
      studentIds: studentChoose.value,
      ruleId: ruleChoose.value,
      content: comment.value,
      score: scoreChange.value,
      gradeId: stuInfo.data.student.gradeId,
      imageIds: imageIds,
      dormId: dormChoose.value
    });
  } catch {
    toast("出错了，上报失败", {
      type: "error",
      position: "top-center",
      autoClose: 500,
    });
  }
  toast("上报成功！", {
    type: "success",
    position: "top-center",
    autoClose: 500,
  });
  // 清空
  studentChoose.value = [];
  ruleChoose.value = "";
  scoreChange.value = 0;
  comment.value = "";
  files.value = [];
};

onMounted(() => {
  queryStudentHandler();
  queryRule();
  queryDorm();
});
</script>
