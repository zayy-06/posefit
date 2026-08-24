import { jwtDecode } from "jwt-decode";
 
export const setToken = (token) => {
  localStorage.setItem("pose-fit", token);
};
 
export const getToken = () => {
  return localStorage.getItem("pose-fit");
};
 
export const deleteToken = () => {
  localStorage.removeItem("pose-fit");
};
 
export const getUser = () => {
  const token = getToken();
  if (!token) return null;
 
  try {
    const data = jwtDecode(token);
    const firstName = data.firstName || "";
    const lastName  = data.lastName  || "";
 
    return {
      _id:                data.userId,
      role:               data.role               || "USER",
      email:              data.email              || "",
      firstName,
      lastName,
      name:               `${firstName} ${lastName}`.trim(),
      professionalStatus: data.professionalStatus || null,
      professionalType:   data.professionalType   || null,
    };
  } catch (error) {
    console.error("JWT decode error:", error);
    return null;
  }
};
 
export const getUserRole = () => {
  const user = getUser();
  return user?.role || null;
};