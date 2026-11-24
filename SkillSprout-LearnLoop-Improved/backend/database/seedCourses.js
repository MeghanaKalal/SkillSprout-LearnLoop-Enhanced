const tracks = ['Full-Stack Web Development', 'Artificial Intelligence', 'Data Science'];
const courses = [
  ['CS101','Programming Fundamentals',3,'Beginner',1,['Logic','Problem solving'],'Get comfortable with variables, decisions, loops and the building blocks of programming.',[],tracks],
  ['MA101','Engineering Mathematics I',4,'Beginner',1,['Mathematics'],'Build confidence with the mathematical ideas used throughout engineering.',[],tracks],
  ['CS102','Digital & Computer Basics',3,'Beginner',1,['Computer systems'],'Understand how computers represent information and how their main parts work together.',[],tracks],
  ['WD101','HTML & CSS Essentials',3,'Beginner',1,['HTML','CSS','Web'],'Create your first web pages and give them structure, color and personality.',[],['Full-Stack Web Development']],
  ['CS201','Object-Oriented Programming',3,'Intermediate',2,['OOP','Java'],'Organize code into reusable pieces and learn the ideas behind object-oriented design.',['CS101'],tracks],
  ['WD201','JavaScript Foundations',3,'Beginner',2,['JavaScript','Web'],'Bring websites to life with events, functions, arrays and interactive behavior.',['WD101','CS101'],['Full-Stack Web Development']],
  ['DB201','Database Fundamentals',3,'Beginner',2,['SQL','Databases'],'Learn how applications store, organize and retrieve information.',['CS101'],['Full-Stack Web Development','Data Science']],
  ['MA201','Discrete Mathematics',3,'Intermediate',2,['Logic','Sets','Graphs'],'Explore logic, sets, relations and graphs — useful tools for computer science.',['MA101'],tracks],
  ['DS301','Data Structures & Algorithms',4,'Intermediate',3,['Algorithms','Problem solving'],'Choose the right way to organize data and solve problems efficiently.',['CS101','CS201','MA201'],tracks],
  ['WD301','Frontend Development with React',3,'Intermediate',3,['React','JavaScript'],'Build reusable interface components and small single-page applications.',['WD201'],['Full-Stack Web Development']],
  ['AI301','Introduction to Artificial Intelligence',3,'Intermediate',3,['AI','Python'],'Meet the core ideas behind intelligent systems and practical AI applications.',['CS101','MA201'],['Artificial Intelligence']],
  ['DS301B','Data Analysis with Python',3,'Intermediate',3,['Python','Data analysis'],'Use Python to clean, explore and understand real-world datasets.',['CS101','MA101'],['Artificial Intelligence','Data Science']],
  ['WD401','Backend Development Basics',3,'Intermediate',4,['Node.js','APIs'],'Understand servers, APIs and how the frontend talks to the backend.',['WD201','DB201'],['Full-Stack Web Development']],
  ['WD402','Full-Stack Project Studio',4,'Advanced',4,['Projects','Deployment'],'Bring frontend, backend and data together in a project you can show.',['WD301','WD401','DB201'],['Full-Stack Web Development']],
  ['AI401','Machine Learning Foundations',4,'Advanced',4,['Machine learning','Python'],'Explore how models learn patterns from data and make predictions.',['AI301','DS301B'],['Artificial Intelligence','Data Science']],
  ['DS401','Data Visualization & Storytelling',3,'Intermediate',4,['Visualization','Analytics'],'Turn analysis into clear charts and stories that help people make decisions.',['DS301B'],['Data Science','Artificial Intelligence']]
];
module.exports = courses.map(([id,title,credits,level,semester,skills,description,prerequisites,courseTracks]) => ({ id,title,credits,level,semester,skills,description,prerequisites,tracks:courseTracks }));
