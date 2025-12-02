import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logoutUser, fetchAllCourses } from '../store';
import './css/InstructorDashboard.css';

const InstructorDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { user } = useSelector((state) => state.auth);
  const { list: courses, loading } = useSelector((state) => state.courses);

  // Fetch courses when dashboard loads
  useEffect(() => {
    dispatch(fetchAllCourses());
  }, [dispatch]);

  // Filter: Show only courses created by THIS instructor
  // Note: user.id comes from Redux auth slice, teacherId comes from the Course object
  const myCourses = courses.filter(course => course.teacherId === user?.id);

  const handleCreateClick = () => {
    navigate('/create-course'); // Assumes you will create this route later
  };

  return (
    <div className="instructor-dash-container">
      <header className="instructor-header">
        <div>
          <h1>Instructor Studio</h1>
          <p style={{ color: '#9ca3af' }}>Manage your content and students</p>
        </div>
        <div className="header-actions">
          <button className="create-btn" onClick={handleCreateClick}>
            + Create New Course
          </button>
          <button 
            onClick={() => dispatch(logoutUser())} 
            className="logout-btn"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="dashboard-grid">
        {/* Sidebar */}
        <nav className="sidebar-menu">
          <div className="menu-item active">My Courses</div>
          <div className="menu-item">Analytics</div>
          <div className="menu-item">Students</div>
          <div className="menu-item">Settings</div>
        </nav>

        {/* Main Content Area */}
        <main className="content-area">
          <div className="metrics-row">
            <div className="metric-box">
              <h4>Total Courses</h4>
              <span>{myCourses.length}</span>
            </div>
            <div className="metric-box">
              <h4>Total Students</h4>
              <span>0</span> {/* Placeholder until backend supports enrollment counts */}
            </div>
            <div className="metric-box">
              <h4>Avg. Rating</h4>
              <span>0.0</span>
            </div>
          </div>

          <h2 className="section-title">My Courses</h2>

          {loading ? (
            <div className="loading-state">Loading your courses...</div>
          ) : myCourses.length > 0 ? (
            <div className="course-grid">
              {myCourses.map((course) => (
                <div key={course._id} className="course-card">
                  <div className="course-card-header">
                    <span className="badge-subject">{course.subject}</span>
                    <span className="badge-rating">★ {course.rating || 0}</span>
                  </div>
                  <h3>{course.title}</h3>
                  <p className="course-desc">
                    {course.description 
                      ? course.description.substring(0, 80) + '...' 
                      : 'No description provided.'}
                  </p>
                  <div className="course-card-footer">
                    <button className="btn-edit" onClick={() => navigate(`/courses/edit/${course._id}`)}>
                      Edit
                    </button>
                    <button className="btn-view" onClick={() => navigate(`/courses/${course._id}`)}>
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state-instructor">
              <p>You haven't published any courses yet.</p>
              <button className="create-btn-small" onClick={handleCreateClick}>
                Create Your First Course
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default InstructorDashboard;