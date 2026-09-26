import { useEffect, useMemo, useState } from 'react';
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
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : defaultData;
  } catch {
    return defaultData;
  }
}

export default function App() {
  const initial = getStoredData();
  const [classes, setClasses] = useState(initial.classes);
  const [students, setStudents] = useState(initial.students);
  const [attendance, setAttendance] = useState(initial.attendance);
  const [selectedClassId, setSelectedClassId] = useState(initial.classes[0]?.id || '');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [className, setClassName] = useState('');
  const [studentName, setStudentName] = useState('');
  const [rollNumber, setRollNumber] = useState('');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ classes, students, attendance }));
  }, [classes, students, attendance]);

  useEffect(() => {
    if (classes.length && !classes.some((item) => item.id === selectedClassId)) {
      setSelectedClassId(classes[0].id);
    }
  }, [classes, selectedClassId]);

  const classStudents = students.filter((student) => student.classId === selectedClassId);
  const recordsForDate = attendance[selectedDate]?.[selectedClassId] || {};

  const reportRows = useMemo(() => classStudents.map((student) => {
    let present = 0;
    let absent = 0;
    let late = 0;

    Object.values(attendance).forEach((dateClasses) => {
      const record = dateClasses[selectedClassId]?.[student.id];
      if (record?.status === 'present') present += 1;
      if (record?.status === 'absent') absent += 1;
      if (record?.status === 'late') late += 1;
    });

    return { ...student, present, absent, late, total: present + absent + late };
  }), [attendance, classStudents, selectedClassId]);

  const dailyStats = classStudents.reduce((result, student) => {
    const status = recordsForDate[student.id]?.status || 'absent';
    result[status] += 1;
    return result;
  }, { present: 0, absent: 0, late: 0 });

  const updateRecord = (studentId, changes) => {
    setAttendance((previous) => ({
      ...previous,
      [selectedDate]: {
        ...(previous[selectedDate] || {}),
        [selectedClassId]: {
          ...(previous[selectedDate]?.[selectedClassId] || {}),
          [studentId]: {
            ...(previous[selectedDate]?.[selectedClassId]?.[studentId] || {}),
            ...changes
          }
        }
      }
    }));
  };

  const addClass = (event) => {
    event.preventDefault();
    const name = className.trim();
    if (!name) return;
    const newClass = { id: Date.now(), name };
    setClasses((previous) => [...previous, newClass]);
    setSelectedClassId(newClass.id);
    setClassName('');
  };

  const addStudent = (event) => {
    event.preventDefault();
    const name = studentName.trim();
    const roll = rollNumber.trim();
    if (!selectedClassId || !name || !roll) {
      alert('يرجى تعبئة جميع الحقول');
      return;
    }
    setStudents((previous) => [...previous, { id: Date.now(), classId: selectedClassId, name, rollNumber: roll }]);
    setStudentName('');
    setRollNumber('');
  };

  const saveAttendance = () => {
    if (!classStudents.length) {
      alert('لا يوجد طلاب في هذا الفصل');
      return;
    }
    setAttendance((previous) => {
      const classRecords = { ...(previous[selectedDate]?.[selectedClassId] || {}) };
      classStudents.forEach((student) => {
        classRecords[student.id] ||= { status: 'absent', notes: '' };
      });
      return { ...previous, [selectedDate]: { ...(previous[selectedDate] || {}), [selectedClassId]: classRecords } };
    });
    alert('تم حفظ الحضور بنجاح');
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <h1>سجل الحضور</h1>
        <section>
          <h2>إضافة فصل</h2>
          <form onSubmit={addClass} className="stack-form">
            <input value={className} onChange={(event) => setClassName(event.target.value)} placeholder="اسم الفصل" />
            <button type="submit">إضافة فصل</button>
          </form>
        </section>
        <section>
          <h2>إضافة طالب</h2>
          <form onSubmit={addStudent} className="stack-form">
            <select value={selectedClassId} onChange={(event) => setSelectedClassId(Number(event.target.value))}>
              {classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
            <input value={studentName} onChange={(event) => setStudentName(event.target.value)} placeholder="اسم الطالب" />
            <input value={rollNumber} onChange={(event) => setRollNumber(event.target.value)} placeholder="رقم القائمة" />
            <button type="submit">إضافة طالب</button>
          </form>
        </section>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div><h2>معهد الشروق</h2><p>إدارة الحضور والتقارير</p></div>
          <div className="date-box"><label>التاريخ</label><input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} /></div>
        </header>

        <section className="class-picker"><label>حدد الفصل</label><select value={selectedClassId} onChange={(event) => setSelectedClassId(Number(event.target.value))}>{classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></section>

        <section className="stats-grid">
          <div className="stat-card"><span>عدد الطلاب</span><strong>{classStudents.length}</strong></div>
          <div className="stat-card present"><span>حاضر اليوم</span><strong>{dailyStats.present}</strong></div>
          <div className="stat-card absent"><span>غائب اليوم</span><strong>{dailyStats.absent}</strong></div>
          <div className="stat-card late"><span>متأخر اليوم</span><strong>{dailyStats.late}</strong></div>
        </section>

        <section className="attendance-panel">
          <div className="attendance-header"><h3>تسجيل حضور يوم {selectedDate}</h3><button onClick={saveAttendance}>حفظ الحضور</button></div>
          <div className="table-wrap"><table><thead><tr><th>#</th><th>اسم الطالب</th><th>رقم القائمة</th><th>حاضر</th><th>غائب</th><th>متأخر</th><th>ملاحظات</th></tr></thead><tbody>
            {!classStudents.length ? <tr><td colSpan="7">لا يوجد طلاب في هذا الفصل</td></tr> : classStudents.map((student, index) => {
              const record = recordsForDate[student.id] || { status: 'absent', notes: '' };
              return <tr key={student.id}><td>{index + 1}</td><td>{student.name}</td><td>{student.rollNumber}</td>
                {['present', 'absent', 'late'].map((status) => <td key={status}><input type="radio" name={`status-${student.id}`} checked={record.status === status} onChange={() => updateRecord(student.id, { status })} /></td>)}
                <td><input className="notes-input" value={record.notes || ''} onChange={(event) => updateRecord(student.id, { notes: event.target.value })} placeholder="ملاحظات" /></td></tr>;
            })}
          </tbody></table></div>
        </section>

        <section className="attendance-panel report-panel">
          <div className="attendance-header"><div><h3>تقرير وإحصائيات الفصل</h3><p>ملخص جميع سجلات الحضور المحفوظة</p></div><button onClick={() => window.print()}>طباعة التقرير</button></div>
          <div className="table-wrap"><table><thead><tr><th>الطالب</th><th>عدد الأيام المسجلة</th><th>حاضر</th><th>غائب</th><th>متأخر</th><th>نسبة الحضور</th></tr></thead><tbody>
            {!reportRows.length ? <tr><td colSpan="6">لا توجد بيانات تقرير</td></tr> : reportRows.map((row) => <tr key={row.id}><td>{row.name}</td><td>{row.total}</td><td className="text-present">{row.present}</td><td className="text-absent">{row.absent}</td><td className="text-late">{row.late}</td><td>{row.total ? `${Math.round((row.present / row.total) * 100)}%` : '0%'}</td></tr>)}
          </tbody></table></div>
        </section>
      </main>
    </div>
  );
}
