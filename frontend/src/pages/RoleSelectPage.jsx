// src/pages/RoleSelectPage.jsx
import { useNavigate } from "react-router-dom";

function RoleSelectPage() {
  const navigate = useNavigate();

  const handleSelect = (role) => {
    if (role === "student") navigate("/student");
    else if (role === "teacher") navigate("/teacher");
  };

  return (
    <div style={{ textAlign: "center", marginTop: "100px" }}>
      <h2>請選擇登入身份</h2>
      <div style={{ marginTop: "30px" }}>
        <button onClick={() => handleSelect("student")} style={{ margin: "10px" }}>
          學生身份
        </button>
        <button onClick={() => handleSelect("teacher")} style={{ margin: "10px" }}>
          教師身份
        </button>
      </div>
    </div>
  );
}

export default RoleSelectPage;
