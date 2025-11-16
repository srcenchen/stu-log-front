<template>
  <v-layout class="rounded rounded-md border h-screen">
    <v-app-bar title="学生日志管理系统" elevation="0" class="border-b">
      <template v-slot:prepend>
        <v-app-bar-nav-icon
          @click="drawer = !drawer"
          v-show="isMobile"
        ></v-app-bar-nav-icon>
      </template>
    </v-app-bar>
    <v-navigation-drawer v-model="drawer" :location="isMobile ? 'top' : 'left'">
      <v-list nav density="compact">
        <v-list-item
          v-for="tab in tabs"
          color="primary"
          v-bind:key="tab.to"
          :prepend-icon="tab.icon"
          :title="tab.title"
          :to="tab.to"
        ></v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-main>
      <router-view>
      </router-view>
    </v-main>
  </v-layout>
</template>

<script setup>
import { computed, ref } from "vue";
import { useDisplay } from "vuetify";
// tabs 显示控制
const drawer = ref(false);
const { mobile } = useDisplay();
if (!mobile.value) drawer.value = true;
const isMobile = computed(() => mobile.value);
// tabs 列
const tabs = [
  // {
  //   title: "首页",
  //   icon: "mdi-view-dashboard",
  //   to: "dashboard",
  // },
  {
    title: "日志上报",
    icon: "mdi-tray-plus",
    to: "log-report",
  },
  {
    title: "日志管理",
    icon: "mdi-chart-box",
    to: "log-board",
  },
  {
    title: "基础信息",
    icon: "mdi-information-box",
    to: "base-info",
  },
];
</script>
