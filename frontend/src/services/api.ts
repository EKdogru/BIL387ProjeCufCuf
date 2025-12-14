import axios from "axios";

// Backend adresimiz burası (Java 8080 portunda çalışıyor)
const api = axios.create({
  baseURL: "http://localhost:8081/api",
});

export default api;
