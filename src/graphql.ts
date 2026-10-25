import { gql } from "@apollo/client";

export interface UserDto {
  id: string;
  firstName: string;
  lastName: string;
  rut: string;
  email: string;
  role: "Student" | "Teacher" | "Admin" | "Parents";
  guardianId?: number | null;
}

export interface CourseDto {
  id: string;
  nameCourse: string;
  level: "Basica" | "Media" | "Kinder" | "PreKinder";
  subjects?: { id: string; name: string }[];
}

export interface SubjectDto {
  id: string;
  name: string;
  numberOfClasses: number;
  idTeacher: number;
  course: { id: string; nameCourse: string; level: string };
}

export interface GradeDto {
  id: string;
  grade: number;
  studentId: number;
  subjectId: number;
}

export interface NoticeDto {
  id: number;
  title: string;
  description: string;
  imageUrl?: string | null;
  createdAt: string;
}

export interface MessageDto {
  id: string;
  fromId: number;
  toId: number;
  content: string;
  createdAt: string;
}

export const LOGIN = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      id
      role
      firstName
      isChangePassword
    }
  }
`;

export const REGISTER = gql`
  mutation Register($firstName: String!, $lastName: String!, $rut: String!, $email: String!, $password: String!, $role: String!) {
    register(firstName: $firstName, lastName: $lastName, rut: $rut, email: $email, password: $password, role: $role) {
      message
    }
  }
`;

export const FORGOT_PASS = gql`
  mutation ForgotPass($email: String!) {
    forgotPass(email: $email) {
      message
    }
  }
`;

export const CHANGE_PASSWORD = gql`
  mutation ChangePassword($newPassword: String!) {
    changePassword(newPassword: $newPassword) {
      message
    }
  }
`;

export const GET_ALL_USERS = gql`
  query GetAllUsers {
    getAllUser {
      id
      firstName
      lastName
      rut
      email
      role
      guardianId
    }
  }
`;

export const GET_ALL_STUDENTS = gql`
  query GetAllStudents {
    getAllStudents {
      id
      firstName
      lastName
      rut
      email
      role
      guardianId
    }
  }
`;

export const MY_CHILDREN = gql`
  query MyChildren {
    myChildren {
      id
      firstName
      lastName
      rut
      email
      role
    }
  }
`;

export const CREATE_USER = gql`
  mutation CreateUser($createUserDto: CreateUserDto!) {
    createUser(createUserDto: $createUserDto) {
      id
    }
  }
`;

export const UPDATE_USER = gql`
  mutation UpdateUser($rut: String!, $updateUserDto: UpdateUserDto!) {
    updateUser(rut: $rut, updateUserDto: $updateUserDto) {
      id
    }
  }
`;

export const DELETE_USER = gql`
  mutation RemoveUser($rut: String!) {
    removeUser(rut: $rut)
  }
`;

export const LIST_COURSES = gql`
  query ListCourses {
    listCourses {
      id
      nameCourse
      level
      subjects {
        id
        name
      }
    }
  }
`;

export const CREATE_COURSE = gql`
  mutation CreateCourse($createCourseDto: CreateCourseDto!) {
    createCourse(createCourseDto: $createCourseDto)
  }
`;

export const DELETE_COURSE = gql`
  mutation DeleteCourse($deleteCourseDto: DeleteCourseDto!) {
    deleteCourseDto(deleteCourseDto: $deleteCourseDto)
  }
`;

const SUBJECT_FIELDS = `
  id
  name
  numberOfClasses
  idTeacher
  course {
    id
    nameCourse
    level
  }
`;

export const LIST_SUBJECTS = gql`
  query ListSubjects {
    listSubject {
      ${SUBJECT_FIELDS}
    }
  }
`;

export const SUBJECTS_BY_TEACHER = gql`
  query SubjectsByTeacher($idTeacher: Int!) {
    getAllSubjectByIdTeacher(idTeacher: $idTeacher) {
      ${SUBJECT_FIELDS}
    }
  }
`;

export const SUBJECT_BY_ID = gql`
  query SubjectById($id: Int!) {
    subjectById(id: $id) {
      ${SUBJECT_FIELDS}
    }
  }
`;

export const CREATE_SUBJECT = gql`
  mutation CreateSubject($createSubjectInput: CreateSubjectDto!) {
    createSubject(createSubjectInput: $createSubjectInput) {
      isCreateSubject
    }
  }
`;

export const CREATE_SUBJECT_ADMIN = gql`
  mutation CreateSubjectAdmin($createSubjectAdminInput: CreateSubjectAdminDto!) {
    addNewSubjectAdmin(createSubjectAdminInput: $createSubjectAdminInput) {
      isCreateSubject
    }
  }
`;

export const DELETE_SUBJECT = gql`
  mutation DeleteSubject($id: Int!) {
    deleteSubjectById(id: $id)
  }
`;

export const LIST_USERS_BY_SUBJECT = gql`
  query ListUsersBySubject($idSubject: Float!) {
    listUsersBySubject(idSubject: $idSubject) {
      user {
        id
        firstName
        lastName
        rut
        email
      }
      totalAsist
      totalAbsences
    }
  }
`;

export const TAKE_ASIST = gql`
  mutation TakeAsist($createAsistInput: CreateAsistDto!) {
    takeAsist(createAsistInput: $createAsistInput)
  }
`;

export const ENROLL_STUDENT = gql`
  mutation EnrollStudent($idUser: Int!, $idSubject: Int!) {
    enrollStudent(idUser: $idUser, idSubject: $idSubject)
  }
`;

export const UNENROLL_STUDENT = gql`
  mutation UnenrollStudent($idUser: Int!, $idSubject: Int!) {
    unenrollStudent(idUser: $idUser, idSubject: $idSubject)
  }
`;

export const ATTENDANCE_BY_STUDENT = gql`
  query AttendanceByStudent($studentId: Int!) {
    attendanceByStudent(studentId: $studentId) {
      totalAsist
      totalAbsences
      subject {
        id
        name
        numberOfClasses
        course {
          nameCourse
        }
      }
    }
  }
`;

export const GRADES_BY_SUBJECT = gql`
  query GradesBySubject($subjectId: Float!) {
    gradesBySubjectId(subjectId: $subjectId) {
      id
      grade
      studentId
      subjectId
    }
  }
`;

export const GRADES_BY_STUDENT = gql`
  query GradesByStudent($studentId: Float!) {
    gradesByStudentId(studentId: $studentId) {
      id
      grade
      studentId
      subjectId
    }
  }
`;

export const CREATE_GRADE = gql`
  mutation CreateGrade($createGradeDto: CreateGradeDto!) {
    createGrade(createGradeDto: $createGradeDto) {
      id
    }
  }
`;

export const UPDATE_GRADE = gql`
  mutation UpdateGrade($id: Float!, $updateGradeDto: UpdateGradeDto!) {
    updateGrade(id: $id, updateGradeDto: $updateGradeDto) {
      id
    }
  }
`;

export const DELETE_GRADE = gql`
  mutation DeleteGrade($id: Float!) {
    deleteGrade(id: $id)
  }
`;

export const GET_ALL_NOTICES = gql`
  query GetAllNotices {
    getAllNotices {
      id
      title
      description
      imageUrl
      createdAt
    }
  }
`;

export const CREATE_NOTICE = gql`
  mutation CreateNotice($title: String!, $description: String!, $imageUrl: String) {
    createNotice(title: $title, description: $description, imageUrl: $imageUrl) {
      isCreateNotice
    }
  }
`;

export const DELETE_NOTICE = gql`
  mutation DeleteNotice($id: Int!) {
    deleteNotice(id: $id)
  }
`;

export const CHAT_CONTACTS = gql`
  query ChatContacts {
    chatContacts {
      id
      firstName
      lastName
      role
    }
  }
`;

export const CONVERSATION = gql`
  query Conversation($withId: Int!) {
    conversation(withId: $withId) {
      id
      fromId
      toId
      content
      createdAt
    }
  }
`;

export const SEND_MESSAGE = gql`
  mutation SendMessage($toId: Int!, $content: String!) {
    sendMessage(toId: $toId, content: $content) {
      id
    }
  }
`;

export interface StudentSummaryDto {
  totalAsist: number;
  totalAbsences: number;
  percentage: number;
  user: Pick<UserDto, "id" | "firstName" | "lastName" | "rut">;
}

export interface SubjectSummaryDto {
  subject: { id: string; name: string; numberOfClasses: number; course: { id: string; nameCourse: string } };
  students: number;
  classesHeld: number;
  totalAsist: number;
  totalAbsences: number;
  percentage: number;
  studentsSummary: StudentSummaryDto[];
}

export interface CourseSummaryDto {
  course: { id: string; nameCourse: string; level: string };
  students: number;
  classesHeld: number;
  totalAsist: number;
  totalAbsences: number;
  percentage: number;
  subjects: SubjectSummaryDto[];
  studentsSummary: StudentSummaryDto[];
}

const STUDENT_SUMMARY_FIELDS = `
  totalAsist
  totalAbsences
  percentage
  user {
    id
    firstName
    lastName
    rut
  }
`;

const SUBJECT_SUMMARY_FIELDS = `
  subject {
    id
    name
    numberOfClasses
    course {
      id
      nameCourse
    }
  }
  students
  classesHeld
  totalAsist
  totalAbsences
  percentage
  studentsSummary {
    ${STUDENT_SUMMARY_FIELDS}
  }
`;

export const SUBJECT_ATTENDANCE_SUMMARY = gql`
  query SubjectAttendanceSummary($subjectId: Int!) {
    subjectAttendanceSummary(subjectId: $subjectId) {
      ${SUBJECT_SUMMARY_FIELDS}
    }
  }
`;

export const COURSE_ATTENDANCE_SUMMARIES = gql`
  query CourseAttendanceSummaries {
    courseAttendanceSummaries {
      course {
        id
        nameCourse
        level
      }
      students
      classesHeld
      totalAsist
      totalAbsences
      percentage
      subjects {
        ${SUBJECT_SUMMARY_FIELDS}
      }
      studentsSummary {
        ${STUDENT_SUMMARY_FIELDS}
      }
    }
  }
`;

export interface DaySummaryDto {
  date: string;
  present: number;
  absent: number;
  percentage: number;
}

export interface StudentCalendarDto {
  totalAsist: number;
  totalAbsences: number;
  percentage: number;
  marks: { date: string; present: boolean }[];
  user: Pick<UserDto, "id" | "firstName" | "lastName" | "rut">;
}

export interface SubjectCalendarDto {
  subject: { id: string; name: string; numberOfClasses: number; course: { id: string; nameCourse: string } };
  days: DaySummaryDto[];
  students: StudentCalendarDto[];
}

export const SUBJECT_ATTENDANCE_CALENDAR = gql`
  query SubjectAttendanceCalendar($subjectId: Int!) {
    subjectAttendanceCalendar(subjectId: $subjectId) {
      subject {
        id
        name
        numberOfClasses
        course {
          id
          nameCourse
        }
      }
      days {
        date
        present
        absent
        percentage
      }
      students {
        totalAsist
        totalAbsences
        percentage
        marks {
          date
          present
        }
        user {
          id
          firstName
          lastName
          rut
        }
      }
    }
  }
`;
