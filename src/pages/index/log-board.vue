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
    <template v-slot:top>
      <div class="flex">
        <div class="flex flex-col">
          <v-btn height="30" variant="text" @click="resetFiliter()"
            >重置条件</v-btn
          >
          <v-btn height="30" variant="text" @click="exportExcel()"
            >导出表格</v-btn
          >
        </div>
        <v-select
          :items="grades"
          v-model="params.gradeId"
          label="年级选择"
          item-title="gradeName"
          item-value="id"
          :max-width="200"
          outlined
        />
        <v-btn
          @click="isFilter = true"
          variant="outlined"
          class="mt-3 ml-2 mr-2"
          >时间筛选</v-btn
        >
      </div>
    </template>
    <template v-slot:item.revoked="{ item }">
      <p class="text-red" v-if="!item.revoked">尚未撤销</p>
      <p class="text-green" v-else>已撤销</p>
    </template>
    <template v-slot:item.students="{ item }">
      <v-tooltip
        :text="item.grade + stu.class + '班' + stu.stuNum"
        v-for="stu in item.students"
      >
        <template v-slot:activator="{ props }">
          <v-badge
            inline
            v-bind="props"
            :content="stu.name"
            color="primary"
            @click="showStudentDetail(stu)"
          ></v-badge>
        </template>
      </v-tooltip>
    </template>
    <template v-slot:item.actions="{ item }">
      <v-icon
        color="medium-emphasis"
        icon="mdi-pencil"
        size="small"
        @click="showLogDetail(item)"
      ></v-icon>
    </template>
  </v-data-table-server>
  <!-- 日志详情Dialog -->
  <v-dialog v-model="isShowDetailLog" max-width="500">
    <v-card title="日志详情">
      <v-btn variant="outlined" color="primary" @click="revoke">{{
        stuLog.revoked ? "取消撤销" : "撤销"
      }}</v-btn>
      <v-divider></v-divider>
      <template v-slot:text>
        <v-row>
          <v-col cols="12">
            <v-tooltip
              :text="`${stuLog.grade}${stu.class}班${stu.stuNum}`"
              v-for="stu in stuLog.students"
            >
              <template v-slot:activator="{ props }">
                <v-badge
                  inline
                  v-bind="props"
                  :content="stu.name"
                  color="primary"
                ></v-badge>
              </template>
            </v-tooltip>
          </v-col>
          <v-col cols="12">
            <v-text-field
              v-model="stuLog.rule"
              label="条例"
              readonly
            ></v-text-field>
          </v-col>
          <v-col cols="12">
            <v-text-field
              v-model="stuLog.content"
              label="内容"
              readonly
            ></v-text-field>
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="stuLog.dormBuilding"
              label="宿舍楼"
              readonly
            ></v-text-field>
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="stuLog.dormNum"
              label="宿舍号"
              readonly
            ></v-text-field>
          </v-col>
        </v-row>
        <viewer :images="stuLog.imageUrls">
          <img v-for="src in stuLog.imageUrls" :src="src" height="128" />
        </viewer>
      </template>
      <v-card-actions class="bg-surface-light">
        <v-btn text="好的" @click="isShowDetailLog = false"></v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
  <!-- Date Pick -->
  <v-dialog v-model="startDatePick" max-width="500">
    <v-card>
      <template v-slot:text>
        <v-date-picker v-model="startDate" />
      </template>

      <v-card-actions class="bg-surface-light">
        <v-btn
          text="好的"
          @click="
            startDatePick = false;
            startTimeShow = formatDateUsingIntl(startDate);
            params['startTime'] = Math.floor(startDate.getTime() / 1000);
          "
        ></v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
  <v-dialog v-model="endDatePick" max-width="500">
    <v-card>
      <template v-slot:text>
        <v-date-picker v-model="endDate" />
      </template>

      <v-card-actions class="bg-surface-light">
        <v-btn
          text="好的"
          @click="
            endDatePick = false;
            endTimeShow = formatDateUsingIntl(endDate);
            params['endTime'] = Math.floor(endDate.getTime() / 1000);
          "
        ></v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
  <v-dialog v-model="isFilter" max-width="500">
    <v-card>
      <template v-slot:text>
        <!-- 高级筛选工具 -->
        <!-- 开始日期选择器 -->
        <v-text-field
          v-on="on"
          v-model="startTimeShow"
          @click="startDatePick = true"
          label="开始日期"
          readonly
          outlined
        />

        <!-- 终止日期选择器 -->
        <v-text-field
          @click="endDatePick = true"
          v-model="endTimeShow"
          v-on="on"
          label="结束日期"
          readonly
          outlined
        />
      </template>

      <v-card-actions class="bg-surface-light">
        <v-btn text="好的" @click="isFilter = false"></v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
    <!-- Student Detail Dialog -->
  <v-dialog v-model="isShowDetailStu" max-width="800">
    <v-card :title="`${studentDetail.name}的日志记录`">
      <v-card-text>
        <p v-for="item in studentLogList.list">
          <span>在 </span>
          <span class="text-indigo">{{ item.time }}</span>
          <span> 因为 </span>
          <span class="text-green">{{ `${item.rule}-${item.content} ` }}</span>
          <span class="text-red">{{ `${item.score}分 ` }}</span>
          <span class="text-red" v-if="!item.revoked">未撤销</span>
          <span class="text-green" v-else>已撤销</span>
        </p>
      </v-card-text>
      <v-card-actions class="bg-surface-light">
        <v-btn text="好的" @click="isShowDetailStu = false"></v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { getGrades } from "@/api/grade";
import "@/api/stu_log";
import { getStuLogs } from "@/api/stu_log";
import axios from "axios";
import { onMounted, ref, watch } from "vue";
// 状态保存变量
const dataLoading = ref(false);
const isShowDetailLog = ref(false);
const stuLog = ref({});
const startDatePick = ref(false);
const endDatePick = ref(false);
const startDate = ref("");
const startTimeShow = ref("");
const endTimeShow = ref("");
const endDate = ref("");
const isFilter = ref(false);
const grades = ref([]);
const isShowDetailStu = ref(false);
const studentLogList = ref([]);
// 参数信息
var params = ref({
  page: 1,
  pageSize: 25,
  gradeId: -1,
});

// Header
const headers = ref([
  { title: "学生", key: "students" },
  { title: "内容", key: "content" },
  { title: "条例", key: "rule" },
  { title: "分数", key: "score" },
  { title: "年级", key: "grade" },
  { title: "宿舍楼", key: "dormBuilding" },
  { title: "宿舍号", key: "dormNum" },
  { title: "时间", key: "time" },
  { title: "状态", key: "revoked" },
  { title: "操作", key: "actions" },
]);
// 返回数据信息
var logsData = ref({});
async function fetchLogs() {
  dataLoading.value = true;
  logsData.value = await getStuLogs(params.value);
  dataLoading.value = false;
}
// 获取年级表
async function fetchGrades() {
  dataLoading.value = true;
  grades.value = await getGrades();
  grades.value = grades.value.list;
  grades.value.unshift({
    id: -1,
    gradeName: "全部",
  });
  console.log(grades.value);
  dataLoading.value = false;
}
// 打开详情页面
function showLogDetail(item) {
  stuLog.value = item;
  isShowDetailLog.value = true;
}
// 撤销/取消撤销
async function revoke() {
  dataLoading.value = true;
  isShowDetailLog.value = false;
  const resp = await axios.get("/v1/stu_log/revoke", {
    params: {
      id: stuLog.value.id,
      revoke: !stuLog.value.revoked,
    },
  });
  fetchLogs();
}
onMounted(() => {
  fetchLogs();
  fetchGrades();
});
// 打开学生详情
const studentDetail = ref({})
async function showStudentDetail(item) {
  studentDetail.value = item;
  isShowDetailStu.value = true;
  studentLogList.value = await getStuLogs({
    studentId: item.id,
  });
  console.log(studentLogList.value.list);
}

watch(params.value, () => {
  fetchLogs();
});
function formatDateUsingIntl(date) {
  const options = { year: "numeric", month: "2-digit", day: "2-digit" };
  return new Intl.DateTimeFormat("cn", options).format(new Date(date));
}
// 重置查询
function resetFiliter() {
  startTimeShow.value = "";
  endTimeShow.value = "";
  startDate.value = "";
  endDate.value = "";
  delete params.value.startTime;
  delete params.value.endTime;
  //fetchLogs()
}
// 导出excel
function exportExcel() {
  axios
    .get("/v1/stu_log/export", {
      params: params.value,
    })
    .then((data) => {
      window.open(data.data.exportPath);
    });
}

</script>
