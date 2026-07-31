export const adminStudents = [
  {
    id: "student-1",
    name: "Amari Joseph",
    displayName: "Amari J.",
    initials: "AJ",
    learningCategory: "Primary",
    level: "Standard 5",
    school: "San Juan Boys' R.C. School",
    membership: "Annual",
    membershipStatus: "Active",
    status: "Active",
    membershipExpiry: "July 30, 2027",
    joinedDate: "September 8, 2025",
    gamesPlayed: 148,
    streak: 8,
    badges: 12,
    accuracy: 93,
    lastActive: "today",

    parentId: "parent-1",

    parent: {
      name: "Janelle Joseph",
      email: "janelle@example.com",
      phone: "868-555-0184",
      relationship: "Mother",
    },

    progress: [
      {
        id: "multiplication",
        label: "Multiplication",
        value: 92,
      },
      {
        id: "math-language",
        label: "Math Language",
        value: 64,
      },
      {
        id: "integers",
        label: "Integers",
        value: 78,
      },
      {
        id: "creative-writing",
        label: "Creative Writing",
        value: 41,
      },
    ],

    activity: [
      {
        id: 1,
        title: "Completed the 5 × 5 multiplication grid",
        detail: "Best time: 18.7 seconds",
        date: "Today",
      },
      {
        id: 2,
        title: "Practised Math Language",
        detail: "12 terms completed",
        date: "Yesterday",
      },
      {
        id: 3,
        title: "Earned the Consistency badge",
        detail: "Completed seven active practice days",
        date: "July 28, 2026",
      },
      {
        id: 4,
        title: "Completed an Integer Challenge",
        detail: "Accuracy: 90%",
        date: "July 26, 2026",
      },
    ],

    recommendation: {
      title: "Build Math Language confidence",
      description:
        "Amari is performing strongly in multiplication but needs more practice interpreting mathematical vocabulary.",
    },
  },

  {
    id: "student-2",
    name: "Maya Williams",
    displayName: "Maya W.",
    initials: "MW",
    learningCategory: "Primary",
    level: "Standard 3",
    school: "San Juan Girls' R.C. School",
    membership: "Term",
    membershipStatus: "Active",
    status: "Active",
    membershipExpiry: "December 18, 2026",
    joinedDate: "January 12, 2026",
    gamesPlayed: 82,
    streak: 5,
    badges: 7,
    accuracy: 87,
    lastActive: "yesterday",

    parentId: "parent-2",

    parent: {
      name: "Marissa Williams",
      email: "marissa@example.com",
      phone: "868-555-0172",
      relationship: "Mother",
    },

    progress: [
      {
        id: "multiplication",
        label: "Multiplication",
        value: 76,
      },
      {
        id: "math-language",
        label: "Math Language",
        value: 81,
      },
      {
        id: "integers",
        label: "Integers",
        value: 48,
      },
      {
        id: "creative-writing",
        label: "Creative Writing",
        value: 69,
      },
    ],

    activity: [
      {
        id: 1,
        title: "Completed a Math Language round",
        detail: "Accuracy: 90%",
        date: "Yesterday",
      },
      {
        id: 2,
        title: "Improved her 5 × 5 time",
        detail: "New personal best: 24.3 seconds",
        date: "July 28, 2026",
      },
      {
        id: 3,
        title: "Earned the Word Explorer badge",
        detail: "Completed 25 Math Language terms",
        date: "July 26, 2026",
      },
    ],

    recommendation: {
      title: "Strengthen integer foundations",
      description:
        "Maya is progressing well in Math Language and would benefit from introductory integer practice.",
    },
  },

  {
    id: "student-3",
    name: "Joshua Thomas",
    displayName: "Joshua T.",
    initials: "JT",
    learningCategory: "Secondary",
    level: "Form 1",
    school: "St. Mary's College",
    membership: "Free",
    membershipStatus: "Pending",
    status: "Pending",
    membershipExpiry: "Not applicable",
    joinedDate: "July 24, 2026",
    gamesPlayed: 19,
    streak: 2,
    badges: 2,
    accuracy: 74,
    lastActive: "3 days ago",

    parentId: "parent-3",

    parent: {
      name: "Kevin Thomas",
      email: "kevin@example.com",
      phone: "868-555-0158",
      relationship: "Father",
    },

    progress: [
      {
        id: "multiplication",
        label: "Multiplication",
        value: 58,
      },
      {
        id: "math-language",
        label: "Math Language",
        value: 44,
      },
      {
        id: "integers",
        label: "Integers",
        value: 61,
      },
      {
        id: "creative-writing",
        label: "Creative Writing",
        value: 35,
      },
    ],

    activity: [
      {
        id: 1,
        title: "Created a student profile",
        detail: "Registration awaiting review",
        date: "July 24, 2026",
      },
      {
        id: 2,
        title: "Played the 5 × 5 multiplication grid",
        detail: "Completed three attempts",
        date: "July 24, 2026",
      },
    ],

    recommendation: {
      title: "Establish a regular practice routine",
      description:
        "Joshua is new to the platform. Short, consistent multiplication sessions are recommended.",
    },
  },

  {
    id: "student-4",
    name: "Leah Ali",
    displayName: "Leah A.",
    initials: "LA",
    learningCategory: "Primary",
    level: "Standard 4",
    school: "No school selected",
    membership: "Annual",
    membershipStatus: "Active",
    status: "Active",
    membershipExpiry: "June 30, 2027",
    joinedDate: "November 3, 2025",
    gamesPlayed: 204,
    streak: 11,
    badges: 16,
    accuracy: 95,
    lastActive: "today",

    parentId: "parent-1",

    parent: {
      name: "Nadia Ali",
      email: "nadia@example.com",
      phone: "868-555-0136",
      relationship: "Mother",
    },

    progress: [
      {
        id: "multiplication",
        label: "Multiplication",
        value: 96,
      },
      {
        id: "math-language",
        label: "Math Language",
        value: 88,
      },
      {
        id: "integers",
        label: "Integers",
        value: 72,
      },
      {
        id: "creative-writing",
        label: "Creative Writing",
        value: 63,
      },
    ],

    activity: [
      {
        id: 1,
        title: "Completed the 12 × 12 multiplication grid",
        detail: "Accuracy: 100%",
        date: "Today",
      },
      {
        id: 2,
        title: "Extended her practice streak",
        detail: "Eleven consecutive active days",
        date: "Today",
      },
      {
        id: 3,
        title: "Earned the Multiplication Master badge",
        detail: "Completed 200 games",
        date: "July 27, 2026",
      },
    ],

    recommendation: {
      title: "Introduce more advanced challenges",
      description:
        "Leah is performing at a high level and appears ready for harder multiplication and integer activities.",
    },
  },

  {
    id: "student-5",
    name: "Daniel Roberts",
    displayName: "Daniel R.",
    initials: "DR",
    learningCategory: "Primary",
    level: "Standard 5",
    school: "St. Xavier's Private School",
    membership: "Free",
    membershipStatus: "Inactive",
    status: "Inactive",
    membershipExpiry: "Not applicable",
    joinedDate: "October 16, 2025",
    gamesPlayed: 41,
    streak: 0,
    badges: 4,
    accuracy: 79,
    lastActive: "2 weeks ago",

    parentId: "parent-4",

    parent: {
      name: "Simone Roberts",
      email: "simone@example.com",
      phone: "868-555-0121",
      relationship: "Mother",
    },

    progress: [
      {
        id: "multiplication",
        label: "Multiplication",
        value: 68,
      },
      {
        id: "math-language",
        label: "Math Language",
        value: 57,
      },
      {
        id: "integers",
        label: "Integers",
        value: 42,
      },
      {
        id: "creative-writing",
        label: "Creative Writing",
        value: 50,
      },
    ],

    activity: [
      {
        id: 1,
        title: "Played the multiplication trainer",
        detail: "Five attempts completed",
        date: "July 15, 2026",
      },
      {
        id: 2,
        title: "Completed a Math Language round",
        detail: "Accuracy: 70%",
        date: "July 13, 2026",
      },
    ],

    recommendation: {
      title: "Restart with a short daily activity",
      description:
        "Daniel has not practised recently. A quick 5 × 5 session can help rebuild momentum.",
    },
  },

  {
    id: "student-6",
    name: "Sariah Pierre",
    displayName: "Sariah P.",
    initials: "SP",
    learningCategory: "Secondary",
    level: "Form 2",
    school: "Holy Faith Convent",
    membership: "Term",
    membershipStatus: "Active",
    status: "Active",
    membershipExpiry: "December 18, 2026",
    joinedDate: "February 5, 2026",
    gamesPlayed: 126,
    streak: 7,
    badges: 10,
    accuracy: 89,
    lastActive: "today",

    parentId: "parent-5",

    parent: {
      name: "Renée Pierre",
      email: "renee@example.com",
      phone: "868-555-0195",
      relationship: "Mother",
    },

    progress: [
      {
        id: "multiplication",
        label: "Multiplication",
        value: 84,
      },
      {
        id: "math-language",
        label: "Math Language",
        value: 73,
      },
      {
        id: "integers",
        label: "Integers",
        value: 91,
      },
      {
        id: "creative-writing",
        label: "Creative Writing",
        value: 58,
      },
    ],

    activity: [
      {
        id: 1,
        title: "Completed an Integer Challenge",
        detail: "Accuracy: 96%",
        date: "Today",
      },
      {
        id: 2,
        title: "Earned the Integer Explorer badge",
        detail: "Completed ten integer rounds",
        date: "Yesterday",
      },
      {
        id: 3,
        title: "Practised Math Language",
        detail: "15 terms reviewed",
        date: "July 27, 2026",
      },
    ],

    recommendation: {
      title: "Develop Math Language fluency",
      description:
        "Sariah is strong in integers and should now focus on interpreting mathematical instructions and vocabulary.",
    },
  },
];

const STORAGE_KEY = "countmeintt-admin-students";

function readStoredStudents() {
  try {
    const storedStudents = localStorage.getItem(STORAGE_KEY);

    return storedStudents
      ? JSON.parse(storedStudents)
      : [];
  } catch (error) {
    console.error(
      "Unable to read stored students:",
      error,
    );

    return [];
  }
}

function saveStoredStudents(students) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(students),
    );
  } catch (error) {
    console.error(
      "Unable to save student data:",
      error,
    );
  }
}

export function getStudentsByParentId(parentId) {
  return getAdminStudents().filter(
    (student) => student.parentId === parentId,
  );
}

export function getAdminStudents() {
  const storedStudents = readStoredStudents();

  const mergedStudents = [...adminStudents];

  storedStudents.forEach((storedStudent) => {
    const index = mergedStudents.findIndex(
      (student) => student.id === storedStudent.id,
    );

    if (index >= 0) {
      mergedStudents[index] = storedStudent;
    } else {
      mergedStudents.push(storedStudent);
    }
  });

  return mergedStudents;
}

export function getAdminStudentById(studentId) {
  return getAdminStudents().find(
    (student) => student.id === studentId,
  );
}

export function updateAdminStudent(studentId, updates) {
  const storedStudents = readStoredStudents();

  const existingStudent = getAdminStudentById(studentId);

  if (!existingStudent) {
    return null;
  }

  const updatedStudent = {
    ...existingStudent,
    ...updates,
    id: studentId,
  };

  const updatedStudents = storedStudents.some(
    (student) => student.id === studentId,
  )
    ? storedStudents.map((student) =>
        student.id === studentId
          ? updatedStudent
          : student,
      )
    : [...storedStudents, updatedStudent];

  saveStoredStudents(updatedStudents);

  return updatedStudent;
}

export function createAdminStudent(studentData) {
  const storedStudents = readStoredStudents();

  const newStudent = {
    ...studentData,
    id:
      studentData.id ||
      `student-${Date.now()}`,
  };

  const existingIndex =
    storedStudents.findIndex(
      (student) =>
        student.id === newStudent.id,
    );

  const updatedStudents =
    existingIndex >= 0
      ? storedStudents.map((student) =>
          student.id === newStudent.id
            ? newStudent
            : student,
        )
      : [...storedStudents, newStudent];

  saveStoredStudents(updatedStudents);

  return newStudent;
}


