import { useEffect, useMemo, useState } from 'react';
import './App.css';

const STORAGE_KEY = 'attendance-system-v2';
const USERS_KEY = 'attendance-users-v1';

const defaultUsers = [
  { id: 1, username: 'admin', password: 'admin123', role: 'مدير' },
  { id: 2, username: 'teacher', password: 'teacher123', role: 'معلم' }
];

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

function getStoredUsers() {
  try {
    const saved = localStorage.getItem(USERS_KEY);
    return saved ? JSON.parse(saved) : defaultUsers;
  } catch {
    return defaultUsers;
  }
}

function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    setError('');

    const users = getStoredUsers();
    const user = users.find((u) => u.username === username && u.password === password);

    if (user) {
      localStorage.setItem('current-user', JSON.stringify(user));
      onLogin(user);
    } else {
      setError('بيانات الدخول غير صحيحة');
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <div className="logo-circle">📚</div>
          <h1>نظام إدارة الحضور</h1>
          <p>معهد الشروق</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>اسم المستخدم</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="أدخل اسم المستخدم"
              required
            />
          </div>

          <div className="form-group">
            <label>كلمة المرور</label>
            <div className="password-input-group">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="أدخل كلمة المرور"
                required
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          {error && <div className="error-message">⚠️ {error}</div>}

          <button type="submit" className="login-button">دخول</button>

          <div className="demo-credentials">
            <p>بيانات التجربة:</p>
            <small>المدير: admin / admin123</small>
            <small>المعلم: teacher / teacher123</small>
          </div>
        </form>
      </div>
    </div>
  );
}

function DashboardApp({ currentUser, onLogout }) {
  const initial = getStoredData();
  const [classes, setClasses] = useState(initial.classes);
  const [students, setStudents] = useState(initial.students);
  const [attendance, setAttendance] = useState(initial.attendance);
  const [selectedClassId, setSelectedClassId] = useState(initial.classes[0]?.id || '');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [className, setClassName] = useState('');
  const [studentName, setStudentName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [activeTab, setActiveTab] = useState('attendance');

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
    let present = 0, absent = 0, late = 0;
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

  const deleteStudent = (studentId) => {
    if (confirm('هل أنت متأكد من حذف هذا الطالب؟')) {
      setStudents((previous) => previous.filter((s) => s.id !== studentId));
    }
  };

  const deleteClass = (classId) => {
    if (confirm('هل أنت متأكد من حذف هذا الفصل؟')) {
      setClasses((previous) => previous.filter((c) => c.id !== classId));
      setStudents((previous) => previous.filter((s) => s.classId !== classId));
      if (selectedClassId === classId && classes.length > 1) {
        setSelectedClassId(classes.find((c) => c.id !== classId).id);
      }
    }
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
      <header className="app-header">
        <div className="header-left">
          <h1>📚 معهد الشروق</h1>
          <p>نظام إدارة الحضور والتقارير</p>
        </div>
        <div className="header-right">
          <div className="user-info">
            <span>👤 {currentUser.username}</span>
            <span className="role-badge">{currentUser.role}</span>
          </div>
          <button className="logout-button" onClick={onLogout}>تسجيل خروج</button>
        </div>
      </header>

      <div className="app-container">
        <aside className="sidebar">
          <nav className="sidebar-nav">
            <button
              className={`nav-item ${activeTab === 'attendance' ? 'active' : ''}`}
              onClick={() => setActiveTab('attendance')}
            >
              📋 تسجيل الحضور
            </button>
            <button
              className={`nav-item ${activeTab === 'reports' ? 'active' : ''}`}
              onClick={() => setActiveTab('reports')}
            >
              📊 التقارير والإحصائيات
            </button>
            {currentUser.role === 'مدير' && (
              <button
                className={`nav-item ${activeTab === 'management' ? 'active' : ''}`}
                onClick={() => setActiveTab('management')}
              >
                ⚙️ إدارة البيانات
              </button>
            )}
          </nav>

          {activeTab === 'management' && currentUser.role === 'مدير' && (
            <div className="sidebar-content">
              <h2>إدارة الفصول والطلاب</h2>
              <section>
                <h3>إضافة فصل جديد</h3>
                <form onSubmit={addClass} className="stack-form">
                  <input value={className} onChange={(e) => setClassName(e.target.value)} placeholder="اسم الفصل" />
                  <button type="submit">➕ إضافة فصل</button>
                </form>
              </section>
              <section>
                <h3>إضافة طالب</h3>
                <form onSubmit={addStudent} className="stack-form">
                  <select value={selectedClassId} onChange={(e) => setSelectedClassId(Number(e.target.value))}>
                    {classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </select>
                  <input value={studentName} onChange={(e) => setStudentName(e.target.value)} placeholder="اسم الطالب" />
                  <input value={rollNumber} onChange={(e) => setRollNumber(e.target.value)} placeholder="رقم القائمة" />
                  <button type="submit">➕ إضافة طالب</button>
                </form>
              </section>
            </div>
          )}

          {activeTab !== 'management' && (
            <div className="sidebar-content">
              <h2>الفصول</h2>
              <div className="class-list">
                {classes.map((cls) => (
                  <div key={cls.id} className="class-item">
                    <button
                      className={`class-button ${selectedClassId === cls.id ? 'active' : ''}`}
                      onClick={() => setSelectedClassId(cls.id)}
                    >
                      {cls.name}
                    </button>
                    {currentUser.role === 'مدير' && (
                      <button className="delete-btn" onClick={() => deleteClass(cls.id)} title="حذف الفصل">🗑️</button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>

        <main className="main-content">
          <div className="content-header">
            <div>
              <h2>{activeTab === 'attendance' ? 'تسجيل الحضور' : activeTab === 'reports' ? 'التقارير' : 'إدارة البيانات'}</h2>
              <p className="selected-class-label">الفصل: {classes.find((c) => c.id === selectedClassId)?.name}</p>
            </div>
            <div className="date-box">
              <label>📅 التاريخ</label>
              <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
            </div>
          </div>

          {activeTab === 'attendance' && (
            <>
              <section className="stats-grid">
                <div className="stat-card"><span>عدد الطلاب</span><strong>{classStudents.length}</strong></div>
                <div className="stat-card present"><span>حاضر اليوم</span><strong>{dailyStats.present}</strong></div>
                <div className="stat-card absent"><span>غائب اليوم</span><strong>{dailyStats.absent}</strong></div>
                <div className="stat-card late"><span>متأخر اليوم</span><strong>{dailyStats.late}</strong></div>
              </section>

              <section className="attendance-panel">
                <div className="attendance-header">
                  <h3>تسجيل حضور {selectedDate}</h3>
                  <button onClick={saveAttendance} className="save-button">💾 حفظ الحضور</button>
                </div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>#</th><th>اسم الطالب</th><th>الرقم</th><th>حاضر</th><th>غائب</th><th>متأخر</th><th>ملاحظات</th>
                        {currentUser.role === 'مدير' && <th>حذف</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {!classStudents.length ? (
                        <tr><td colSpan={currentUser.role === 'مدير' ? '8' : '7'}>لا يوجد طلاب في هذا الفصل</td></tr>
                      ) : (
                        classStudents.map((student, index) => {
                          const record = recordsForDate[student.id] || { status: 'absent', notes: '' };
                          return (
                            <tr key={student.id}>
                              <td>{index + 1}</td>
                              <td>{student.name}</td>
                              <td>{student.rollNumber}</td>
                              {['present', 'absent', 'late'].map((status) => (
                                <td key={status}>
                                  <input
                                    type="radio"
                                    name={`status-${student.id}`}
                                    checked={record.status === status}
                                    onChange={() => updateRecord(student.id, { status })}
                                  />
                                </td>
                              ))}
                              <td>
                                <input
                                  className="notes-input"
                                  value={record.notes || ''}
                                  onChange={(e) => updateRecord(student.id, { notes: e.target.value })}
                                  placeholder="ملاحظات"
                                />
                              </td>
                              {currentUser.role === 'مدير' && (
                                <td>
                                  <button className="delete-btn" onClick={() => deleteStudent(student.id)}>🗑️</button>
                                </td>
                              )}
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}

          {activeTab === 'reports' && (
            <section className="attendance-panel report-panel">
              <div className="attendance-header">
                <div>
                  <h3>تقرير إحصائيات الفصل</h3>
                  <p>ملخص جميع سجلات الحضور المحفوظة</p>
                </div>
                <button onClick={() => window.print()} className="print-button">🖨️ طباعة التقرير</button>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>الطالب</th><th>أيام مسجلة</th><th>حاضر</th><th>غائب</th><th>متأخر</th><th>نسبة الحضور</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!reportRows.length ? (
                      <tr><td colSpan="6">لا توجد بيانات تقرير</td></tr>
                    ) : (
                      reportRows.map((row) => (
                        <tr key={row.id}>
                          <td>{row.name}</td>
                          <td>{row.total}</td>
                          <td className="text-present">{row.present}</td>
                          <td className="text-absent">{row.absent}</td>
                          <td className="text-late">{row.late}</td>
                          <td><div className="percentage-bar"><div style={{ width: row.total ? `${(row.present / row.total) * 100}%` : '0%' }}></div></div>{row.total ? `${Math.round((row.present / row.total) * 100)}%` : '0%'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('current-user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const handleLogout = () => {
    localStorage.removeItem('current-user');
    setCurrentUser(null);
  };

  return currentUser ? <DashboardApp currentUser={currentUser} onLogout={handleLogout} /> : <LoginPage onLogin={setCurrentUser} />;
}
