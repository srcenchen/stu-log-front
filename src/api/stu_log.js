import axios from "axios";

async function getStuLogs(req) {
  const resp = await axios.get("/v1/stu_log/list", { params: req });
  return resp.data;
}

export { getStuLogs };
