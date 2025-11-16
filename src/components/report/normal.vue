<template>
  <div class="max-w-xl w-full flex flex-col mt-2">
    <v-autocomplete
      chips
      label="选择学生"
      v-model="studentChoose"
      :items="stduentList"
      item-title="name"
      item-value="id"
      multiple
      variant="outlined"
      @update:search="queryStudentHandler"
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
      label="Photos"
      placeholder="Upload your photos"
      prepend-icon="mdi-camera"
      multiple
    ></v-file-input>
    <v-btn @click="()=>{uploadFiles()}">upload</v-btn>
  </div>
</template>

<script setup>
import axios from "axios";
import { onMounted, ref } from "vue";
// 数据
const studentChoose = ref([]);
const ruleChoose = ref();
const scoreChange = ref(0);
const comment = ref("");

const stduentList = ref([]);
const ruleList = ref([]);
const files = ref([]);

function queryStudentHandler(value) {
  axios
    .get("/v1/base_info/student/list", {
      params: {
        page: 1,
        pageSize: 30,
        search: value,
      },
    })
    .then((data) => {
      stduentList.value = data.data.students;
      stduentList.value.forEach((item) => {
        item.name = `${item.name} ${item.stuNum} ${item.gradeName}${item.className}班`;
      });
    });
}

function queryRule() {
  axios.get("/v1/stu_log/rule").then((data) => {
    ruleList.value = data.data.list;
    ruleList.value.forEach((item) => {
      item.rule = `${item.group}  ${item.rule} ${item.score}分`;
    });
  });
}

const uploadFiles = async () => {
  const formData = new FormData();
  files.value.forEach((file) => {
    formData.append("file", file);
  });

  try {
    const res = await fetch("/upload?mode=image", {
      method: "POST",
      body: formData,
    });
    console.log("上传成功", await res.json());
  } catch (err) {
    console.error("上传失败", err);
  }
};

onMounted(() => {
  queryStudentHandler();
  queryRule();
});
</script>
