import { getStudentById, getStudentEnrolledCourses } from "../models/studentModel.js";




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
    res.render("students/dashboard/index", {
      layout: DEFAULT_LAYOUT,
      active: "dashboard",
      title: "Dashboard",
      student,
      
    });
  }

 } catch (error) {
  console.error("Error in get student data:", error);
    res.status(500).send("Internal Server Error");
 } 
}

export const getStudentCourses = async (req, res) => {
 try {
  const courses = await getStudentEnrolledCourses(1);
  console.log(courses);

  res.render("students/course/index", {
      layout: DEFAULT_LAYOUT,
      active: "mycourses",
      title: "My Courses",
      courses,
      
    });
 } catch (error) {
  
 } 
}