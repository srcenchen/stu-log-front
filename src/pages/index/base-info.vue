<template>
  <v-data-table-server
    class="h-full"
    v-model:items-per-page="params['pageSize']"
    :items-length="studentsData.total"
    :items="studentsData.students"
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
          label="选择年级"
          item-title="gradeName"
          item-value="id"
          :max-width="200"
          outlined
        />
        <v-text-field
          v-model="params.search"
          label="搜索学生（支持姓名和学号的模糊查询）"
          outlined
          dense
        />
      </div>
    </template>

    <!-- Table Row Details -->
    <template v-slot:item.name="{ item }">
      <v-tooltip :text="item.name">
        <template v-slot:activator="{ props }">
          <v-badge
            inline
            v-bind="props"
            :content="item.name"
            color="primary"
          ></v-badge>
        </template>
      </v-tooltip>
    </template>

    <template v-slot:item.actions="{ item }">
      <v-icon
        color="medium-emphasis"
        icon="mdi-pencil"
        size="small"
        @click="showStudentDetail(item)"
      ></v-icon>
    </template>
  </v-data-table-server>

  <!-- Student Detail Dialog -->
  <v-dialog v-model="isShowDetailLog" max-width="800">
    <v-card :title="`${studentDetail.name}的日志记录`">
      <v-card-text>
        <v-row>
          <v-col cols="12" md="4">
            <v-text-field
              label="姓名"
              v-model="studentDetail.name"
              readonly
            ></v-text-field>
          </v-col>
          <v-col cols="12" md="4">
            <v-text-field
              label="性别"
              v-model="studentDetail.sex"
              readonly
            ></v-text-field>
          </v-col>
          <v-col cols="12" md="4">
            <v-text-field
              label="学号"
              v-model="studentDetail.stuNum"
              readonly
            ></v-text-field>
          </v-col>
          <v-col cols="12" md="4">
            <v-text-field
              label="年级"
              v-model="studentDetail.gradeName"
              readonly
            ></v-text-field>
          </v-col>
          <v-col cols="12" md="4">
            <v-text-field
              label="班级"
              v-model="studentDetail.className"
              readonly
            ></v-text-field>
          </v-col>
          <v-col cols="12" md="4">
            <v-text-field
              label="分数"
              v-model="studentDetail.score"
              readonly
            ></v-text-field>
          </v-col>
        </v-row>
        <p v-for="item in studentLogList.list">
          <span>在 </span>
          <span class="text-indigo">{{ item.time }}</span>
          <span> 因为 </span>
          <span class="text-green">{{ `${item.rule}-${item.content} ` }}</span>
          <span class="text-red">{{ `${item.score}分 ` }}</span>
          <span class="text-red" v-if="!item.revoked">未撤销</span>
          <span class="text-green" v-else>已撤销</span>
          <v-btn
            variant="text"
            size="small"
            @click="
              isShowDetail = true;
              stuLog = item;
            "
            >详情</v-btn
          >
        </p>
      </v-card-text>
      <v-card-actions class="bg-surface-light">
        <v-btn text="好的" @click="isShowDetailLog = false"></v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
  <!-- 日志详情Dialog -->
  <v-dialog v-model="isShowDetail" max-width="500">
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
        <v-btn text="好的" @click="isShowDetail = false"></v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { getGrades } from "@/api/grade";
import { getStuLogs } from "@/api/stu_log";
import axios from "axios";
import { onMounted, ref, watch } from "vue";
import { toast } from "vue3-toastify";

// 状态保存变量
const dataLoading = ref(false);
const isShowDetailLog = ref(false);
const studentDetail = ref({});
const grades = ref([]);
const studentsData = ref({});
const isShowDetail = ref(false);
const stuLog = ref({});
// 参数信息
var params = ref({
  page: 1,
  pageSize: 25,
  search: "",
  gradeId: -1, // 默认值为 -1，表示选择全部年级
});

// 表头
const headers = ref([
  { title: "姓名", key: "name" },
  { title: "性别", key: "sex" },
  { title: "分数", key: "score" },
  { title: "学号", key: "stuNum" },
  { title: "年级", key: "gradeName" },
  { title: "班级", key: "className" },
  { title: "宿舍楼", key: "dormBuilding" },
  { title: "宿舍号", key: "dormName" },
  { title: "床位", key: "dormPos" },
  { title: "操作", key: "actions" },
]);

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
const studentLogList = ref([]);
// 打开学生详情
async function showStudentDetail(item) {
  studentDetail.value = item;
  isShowDetailLog.value = true;
  studentLogList.value = await getStuLogs({
    studentId: item.id,
  });
  console.log(studentLogList.value.list);
}

// 重置查询
function resetFiliter() {
  params.value.search = "";
  // fetchStudents(); // 重新获取学生列表
}

// 导出excel
function exportExcel() {
  axios
    .get("/v1/base_info/student/export", {
      params: params.value,
    })
    .then((data) => {
      window.open(data.data.exportPath);
    });
  toast("操作成功", {
    type: "success",
    position: "top-center",
    autoClose: 500,
  });
}

// 获取学生列表
async function fetchStudentList() {
  dataLoading.value = true;
  const response = await axios.get("/v1/base_info/student/list", {
    params: {
      page: params.value.page,
      pageSize: params.value.pageSize,
      search: params.value.search,
      gradeId: params.value.gradeId, // 添加年级筛选
    },
  });
  studentsData.value = response.data;
  dataLoading.value = false;
}

onMounted(() => {
  fetchGrades(); // 获取年级数据
  fetchStudentList(); // 获取学生数据
});
// 撤销/取消撤销
async function revoke() {
  isShowDetail.value = false;
  const resp = await axios.get("/v1/stu_log/revoke", {
    params: {
      id: stuLog.value.id,
      revoke: !stuLog.value.revoked,
    },
  });
  studentLogList.value = await getStuLogs({
    studentId: studentDetail.value.id,
  });
  toast("操作成功", {
    type: "success",
    position: "top-center",
    autoClose: 500,
  });
  fetchStudentList();
}
watch(params.value, () => {
  fetchStudentList(); // 监听参数变化并重新获取数据
});
</script>
