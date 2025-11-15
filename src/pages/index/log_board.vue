<template>
  <v-data-table-server
    class="h-full"
    v-model:items-per-page="params['pageSize']"
    :items-length="logsData.total"
    :items="logsData.list"
    :loading="dataLoading"
    :headers="headers"
    v-model:page="params.page"
  >
    <template v-slot:item.students="{ item }">
      {{item.students[0].name}}
    </template>
  </v-data-table-server>
</template>

<script setup>
import "@/api/stu_log";
import { getStuLogs } from "@/api/stu_log";
import { ref, watch } from "vue";
// 状态保存变量
const dataLoading = ref(false);
// 参数信息
var params = ref({
  page: 2,
  pageSize: 10,
});
// Header
const headers = ref([
  { title: "学生", key: "students" },
  { title: "内容", key: "content" },
  { title: "条例", key: "rule" },
  { title: "年级", key: "grade" },
  { title: "宿舍楼", key: "dormBuilding" },
  { title: "宿舍号", key: "dormNum" },
  { title: "上报时间", key: "time" },
  { title: "已撤销", key: "revoked" },
]);
// 返回数据信息
var logsData = ref({
  totalPages: 1,
});
async function fetchLogs() {
  dataLoading.value = true;
  logsData.value = await getStuLogs(params.value);
  dataLoading.value = false;
}
fetchLogs();
watch(params.value, () => {
  fetchLogs();
});
</script>
