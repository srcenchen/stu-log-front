<template>
  <div class="">
    <div class="h-full p-4 flex flex-col max-w-xl">
      <div class="flex flex-col items-center">
        <h3>日志上报</h3>
        <v-tabs color="primary" v-model="selectedTab">
          <v-tab value="normal">常规日志</v-tab>
          <v-tab value="dorm">宿舍日志</v-tab>
        </v-tabs>
      </div>

      <v-tabs-window v-model="selectedTab">
        <v-tabs-window-item value="normal">
          <Normal />
        </v-tabs-window-item>
        <v-tabs-window-item value="dorm">
          <Dorm />
        </v-tabs-window-item>
      </v-tabs-window>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
const selectedTab = ref("normal"); // 用来控制选中的标签页
</script>

<style scoped>
/* 你可以在这里自定义样式 */
</style>
