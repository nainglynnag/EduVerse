import { getStudentById } from "../models/studentModel.js";




const DEFAULT_LAYOUT = "students/layout/studentLayout";

// Helper function to get instructor ID from session
// const getStudentId = (req) => {
//   return req.session.user?.userId || 1;
// };


export const getStudent = async (req, res) => {
 try {
  // console.log("student id :", getStudentId);

  // const student = await getStudentById(getStudentId);
  const student = await getStudentById(1);

  console.log(student);

  if(student){
    res.render("students/index");
  }
  
 } catch (error) {
  console.error("Error in get student data:", error);
    res.status(500).send("Internal Server Error");
 } 
}