import axios from "axios";

async function getGrades() {
  const resp = await axios.get("v1/base_info/grade/list");
  return resp.data;
}

export { getGrades };
