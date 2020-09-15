import Multimap = require('multimap');
import md5 = require('md5');

interface Mailable {
	followCourse(course_id: number);
	giveCourse(course_id: number);
	email: string,
	id: number,
}

// classe contrôleur GRASP
export class SgbController {
	multimap:Multimap;

	constructor() {
		this.multimap = new Multimap();
	}

	/**
	*  opérations systèmes
	*/

	public login(email:string, password:string){
		let  students = require('../data/students.json');
		for( var student in students){
			if(students[student].email == email) {
				return md5(email)
			}
		}

		let  teachers = require('../data/teachers.json');
		for( var teacher in teachers){
			if(teachers[teacher].email == email){
				return md5(email)
			}
		}
		throw new Error("Email and password do not match a student or a teacher")
	}

	public loginV2(email:string, password:string){
		let  students = require('../data/students.json');
		for( var student in students){
			if(students[student].email == email) {
				let current_student = students[student]
				current_student.password = ''
				return [md5(email),current_student]
			}
		}

		let  teachers = require('../data/teachers.json');
		for( var teacher in teachers){
			if(teachers[teacher].email == email){
				let current_teacher = teachers[teacher]
				current_teacher.password = ''
				return [md5(email),current_teacher]
			}
		}
		throw new Error("Email and password do not match a student or a teacher")
	}

	public courses(token: string) {
		let teacher = this.teacherFromToken(token); // will generate an error if token is invalid
		let   course = require('../data/courses.json');
		let   course_teacher = require('../data/course_teacher.json');
		let data = []
		// try {
			for(let i in course_teacher){
				if(teacher.id == course_teacher[i].teacher_id){
					for(let c in course){
						if (course[c].id == course_teacher[i].course_id)
							data.push(course[c])
					}
				}
			}
		// } catch(error){
		// 	console.log("XXXXX",error);
		// }
		return data;

	}

	public students(token: string,course_id:number) {
		let teacher = this.teacherFromToken(token); // will generate an error if token is invalid
		let students = require('../data/students.json');
		let course_student = require('../data/course_student.json');
		let course_teacher = require('../data/course_teacher.json');
		let data = []
			for(let ct in course_teacher){
				if(course_teacher[ct].teacher_id == teacher.id && course_teacher[ct].course_id == course_id){
					for(let cs in course_student){
						if(course_student[cs].course_id == course_id){
							for(let s in students){
								if(students[s].id == course_student[cs].student_id){
									data.push(students[s])
								}
							}
						}
					}
				}
			}
		return data;
	}

	
/** teacher will assigne note to a student work */
	public note(token:string, student_id:number, course_id:number, type:string, type_id:number, note:number) {
		let teacher:Mailable = this.teacherFromToken(token); // will generate an error if token is invalid
		let student:Mailable = this.studentFromId(student_id)
		if (!teacher.giveCourse(course_id))
			throw new Error("This teacher do not give this course")

		if (!student.followCourse(course_id))
			throw new Error("This student to not follow this course")

			this.multimap.set(student_id.toString(),{"course": course_id, "type":type, "type_id":type_id, "note":note});
	}
	
	private studentFromId(student_id: number): Mailable {
		let  students = require('../data/students.json');

		for( var student in students){
			if(students[student].id == student_id){
				return students[student]
			}
		}
		throw new Error("student not found");
	}

	public studentNote(token:string, course:number, type:string, type_id:number, note:number) {
		let student:Mailable = this.studentFromToken(token); // will generate an error if token is invalid
		this.multimap.set(student.id,{"course": course, "type":type, "type_id":type_id, "note":note});
	}

	public studentNotes(token:string){
		let student = this.studentFromToken(token); // will generate an error if token is invalid
		return this.multimap.get(student.id);
	}

	public studentCourses(token:string){
		let student = this.studentFromToken(token); // will generate an error if token is invalid
		let course_student = require('../data/course_student.json');
		var results = new Array();
		let courses = require('../data/courses.json');
		
		for(let course_index in course_student){
			if (student.id == course_student[course_index].student_id){
				for(let course in courses){
					if (courses[course].id == course_student[course_index].course_id){
						results.push(courses[course])
					}
				}
			}
		}

		return results
	}

	public courseNotes(token:string,course_id:number){
		this.teacherFromToken(token); // will generate an error if token is invalid
		var results = new Array();
		this.multimap.forEach((entry,key)=> {
			if(entry.course == course_id){
				entry["student"]=key
				results.push(entry)
			}
		})
		return results
	}

	public clearNotes(token:string,){
		this.teacherFromToken(token); // will generate an error if token is invalid
		this.multimap = new Multimap();
	}

	//*********************************  privte *****************************


	private teacherFromToken(token){
		let  teachers = require('../data/teachers.json');
		console.log("Token: ", token);
		for( var teacher in teachers){

			if(md5(teachers[teacher].email) == token){
				console.log(md5(teachers[teacher].email));
				return teachers[teacher]
			}
		}
		throw new Error("Authentification error, token do not match any teacher");
	}

	private studentFromToken(token){
		let  students = require('../data/students.json');

		for( var student in students){
			if(md5(students[student].email) == token){
				return students[student]
			}
		}
		throw new Error("Authentification error, token do not match any student");
	}
}