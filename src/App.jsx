import { useEffect, useState } from 'react';
import './App.css';

const STORAGE_KEY = 'attendance-system-v1';

const defaultData = {
  classes: [{ id: 1, name: 'الفصل 1' }],
  students: [
    { id: 1, classId: 1, name: 'أحمد علي', rollNumber: '01' },
    { id: 2, classId: 1, name: 'سارة حسن', rollNumber: '02' },
    { id: 3, classId: 1, name: 'خالد عمر', rollNumber: '03' }
  ],
  attendance: {}
};

function getStoredData() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return defaultData;

  try {
    return JSON.parse(saved);
  } catch {
    return defaultData;
  }
}

export default function App() {
  const [classes, setClasses] = useState(() => getStoredData().classes);
  const [students, setStudents] = useState(() => getStoredData().students);
  const [attendance, setAttendance] = useState(() => getStoredData().attendance);
  const [selectedClassId, setSelectedClassId] = useState(1);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [className, setClassName] = useState('');
  const [studentName, setStudentName] = useState('');
  const [rollNumber, setRollNumber] = useState('');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ classes, students, attendance }));
  }, [classes, students, attendance]);

  useEffect(() => {
    if (!classes.length) return;
    if (!classes.some((cls) => cls.id === selectedClassId)) {
      setSelectedClassId(classes[0].id);
    }
  }, [classes, selectedClassId]);

  const addClass = (e) => {
    e.preventDefault();
    const trimmed = className.trim();
    if (!trimmed) return;

    const newClass = { id: Date.now(), name: trimmed };
    setClasses((prev) => [...prev, newClass]);
    setSelectedClassId(newClass.id);
    setClassName('');
  };

  const addStudent = (e) => {
    e.preventDefault();
    const trimmedName = studentName.trim();
    const trimmedRoll = rollNumber.trim();

    if (!selectedClassId || !trimmedName || !trimmedRoll) {
      alert('يرجى تعبئة جميع الحقول');
      return;
    }

    const newStudent = {
      id: Date.now(),
      classId: selectedClassId,
      name: trimmedName,
      rollNumber: trimmedRoll
    };

    setStudents((prev) => [...prev, newStudent]);
    setStudentName('');
    setRollNumber('');
  };

  const classStudents = students.filter((student) => student.classId === selectedClassId);
  const recordsForDate = attendance[selectedDate]?.[selectedClassId] || {};

  const handleStatusChange = (studentId, status) => {
    setAttendance((prev) => {
      const dateMap = prev[selectedDate] || {};
      const classMap = dateMap[selectedClassId] || {};

      return {
        ...prev,
        [selectedDate]: {
          ...dateMap,
          [selectedClassId]: {
            ...classMap,
            [studentId]: {
              ...classMap[studentId],
              status
            }
          }
        }
      };
    });
  };

  const handleNoteChange = (studentId, note) => {
    setAttendance((prev) => {
      const dateMap = prev[selectedDate] || {};
      const classMap = dateMap[selectedClassId] || {};

      return {
        ...prev,
        [selectedDate]: {
          ...dateMap,
          [selectedClassId]: {
            ...classMap,
            [studentId]: {
              ...classMap[studentId],
              notes: note
            }
          }
        }
      };
    });
  };

  const saveAttendance = () => {
    if (!classStudents.length) {
      alert('لا يوجد طلاب في هذا الفصل');
      return;
    }

    const dateMap = attendance[selectedDate] || {};
    const classMap = dateMap[selectedClassId] || {};

    classStudents.forEach((student) => {
      if (!classMap[student.id]) {
        classMap[student.id] = { status: 'absent', notes: '' };
      }
    });

    setAttendance((prev) => ({
      ...prev,
      [selectedDate]: {
        ...dateMap,
        [selectedClassId]: classMap
      }
    }));

    alert('تم حفظ الحضور بنجاح');
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <h1>سجل الحضور</h1>

        <section>
          <h2>إضافة فصل</h2>
          <form onSubmit={addClass} className="stack-form">
            <input
              type="text"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              placeholder="اسم الفصل"
            />
            <button type="submit">إضافة فصل</button>
          </form>
        </section>

        <section>
          <h2>إضافة طالب</h2>
          <form onSubmit={addStudent} className="stack-form">
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(Number(e.target.value))}
            >
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>

            <input
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="اسم الطالب"
            />

            <input
              type="text"
              value={rollNumber}
              onChange={(e) => setRollNumber(e.target.value)}
              placeholder="رقم القائمة"
            />

            <button type="submit">إضافة طالب</button>
          </form>
        </section>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <h2>معهد الشروق</h2>
          </div>

          <div className="date-box">
            <label>التاريخ</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
        </header>

        <section className="class-picker">
          <label>حدد الفصل</label>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(Number(e.target.value))}
          >
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>
        </section>

        <section className="attendance-panel">
          <div className="attendance-header">
            <h3>قائمة الحضور</h3>
            <button onClick={saveAttendance}>حفظ الحضور</button>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>اسم الطالب</th>
                  <th>رقم القائمة</th>
                  <th>حاضر</th>
                  <th>غائب</th>
                  <th>متأخر</th>
                  <th>ملاحظات</th>
                </tr>
              </thead>

              <tbody>
                {classStudents.length === 0 ? (
                  <tr>
                    <td colSpan="7">لا توجد طلاب في هذا الفصل</td>
                  </tr>
                ) : (
                  classStudents.map((student, index) => {
                    const currentRecord = recordsForDate[student.id] || { status: 'absent', notes: '' };
                    const status = currentRecord.status || 'absent';
                    const notes = currentRecord.notes || '';

                    return (
                      <tr key={student.id}>
                        <td>{index + 1}</td>
                        <td>{student.name}</td>
                        <td>{student.rollNumber}</td>
                        <td>
                          <input
                            type="radio"
                            name={`status-${student.id}`}
                            checked={status === 'present'}
                            onChange={() => handleStatusChange(student.id, 'present')}
                          />
                        </td>
                        <td>
                          <input
                            type="radio"
                            name={`status-${student.id}`}
                            checked={status === 'absent'}
                            onChange={() => handleStatusChange(student.id, 'absent')}
                          />
                        </td>
                        <td>
                          <input
                            type="radio"
                            name={`status-${student.id}`}
                            checked={status === 'late'}
                            onChange={() => handleStatusChange(student.id, 'late')}
                          />
                        </td>
                        <td>
                          <input
                            className="notes-input"
                            value={notes}
                            onChange={(e) => handleNoteChange(student.id, e.target.value)}
                            placeholder="ملاحظات"
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
