/**
 * plugins/index.js
 *
 * Automatically included in `./src/main.js`
 */

// Plugins
import vuetify from "./vuetify";
import router from "@/router";
import VueViewer from "v-viewer";
import "viewerjs/dist/viewer.css";
export function registerPlugins(app) {
  app
    .use(VueViewer, {
      defaultOptions: {
        zIndex: 9999,
      },
    })
    .use(vuetify)
    .use(router);
}
