import { configureStore, createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// ==========================================
// 1. API UTILITY (Internal Helper)
// ==========================================
// Adjust this port if your backend runs on a different one
const BASE_URL = 'http://localhost:5000/api';

/**
 * Universal fetch wrapper that handles JSON headers and credentials (cookies).
 */
const apiRequest = async (endpoint, method = 'GET', body = null) => {
  const config = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // CRITICAL: Allows session cookies to be sent/received
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  
    const response = await fetch(`${BASE_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || data.error || 'Something went wrong');
    }

    return data;
 
};

// ==========================================
// 2. AUTHENTICATION (Thunks & Slice)
// ==========================================

// --- Thunks ---
export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const data = await apiRequest('/auth/register', 'POST', userData);
      return data.user;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const data = await apiRequest('/auth/login', 'POST', credentials);
      return data.user;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await apiRequest('/auth/logout', 'POST');
      return null;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const checkAuthStatus = createAsyncThunk(
  'auth/checkStatus',
  async (_, { rejectWithValue }) => {
    try {
      const data = await apiRequest('/auth/me', 'GET');
      return data.user;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// Profile Update Thunk
export const updateStudentProfile = createAsyncThunk(
    'auth/updateProfile',
    async (profileData, { rejectWithValue }) => {
        try {
            // Sends PUT request to the new backend route
            const data = await apiRequest('/auth/profile', 'PUT', profileData);
            return data.user;
        } catch (err) {
            return rejectWithValue(err.message);
        }
    }
);


// --- Slice ---
const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    loading: true, // Start true to check session on load
    error: null,
  },
  reducers: {
    clearAuthErrors: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Register
      .addCase(registerUser.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(registerUser.fulfilled, (state, action) => { state.loading = false; state.user = action.payload; })
      .addCase(registerUser.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      // Login
      .addCase(loginUser.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(loginUser.fulfilled, (state, action) => { state.loading = false; state.user = action.payload; })
      .addCase(loginUser.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      // Logout
      .addCase(logoutUser.fulfilled, (state) => { state.user = null; })
      // Check Auth Status (Persistent Login)
      .addCase(checkAuthStatus.pending, (state) => { state.loading = true; })
      .addCase(checkAuthStatus.fulfilled, (state, action) => { state.loading = false; state.user = action.payload; })
      .addCase(checkAuthStatus.rejected, (state) => { state.loading = false; state.user = null; })
      // Profile Update
      .addCase(updateStudentProfile.pending, (state) => { state.error = null; })
      .addCase(updateStudentProfile.fulfilled, (state, action) => { 
        // Update name in session data immediately
        state.user = { ...state.user, name: action.payload.name };
      })
      .addCase(updateStudentProfile.rejected, (state, action) => { state.error = action.payload; });
  },
});

export const { clearAuthErrors } = authSlice.actions;

// ==========================================
// 3. COURSES (Thunks & Slice)
// ==========================================

// --- Thunks ---
export const fetchAllCourses = createAsyncThunk(
  'courses/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      // NOTE: This now uses Mongoose Aggregation in the backend
      return await apiRequest('/courses', 'GET');
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchCourseById = createAsyncThunk(
  'courses/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      // FIX: Use courseId for fetching the specific course details
      return await apiRequest(`/courses/${id}`, 'GET');
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const createNewCourse = createAsyncThunk(
  'courses/create',
  async (courseData, { rejectWithValue }) => {
    try {
      return await apiRequest('/courses', 'POST', courseData);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const updateCourse = createAsyncThunk(
  'courses/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      return await apiRequest(`/courses/${id}`, 'PUT', data);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// --- Slice ---
const courseSlice = createSlice({
  name: 'courses',
  initialState: {
    list: [],
    currentCourse: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearCurrentCourse: (state) => {
      state.currentCourse = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch All
      .addCase(fetchAllCourses.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchAllCourses.fulfilled, (state, action) => { state.loading = false; state.list = action.payload; })
      .addCase(fetchAllCourses.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      // Fetch Single
      .addCase(fetchCourseById.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchCourseById.fulfilled, (state, action) => { state.loading = false; state.currentCourse = action.payload; })
      .addCase(fetchCourseById.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      // Create (Add to list immediately)
      .addCase(createNewCourse.fulfilled, (state, action) => { state.list.push(action.payload); })
      // Update (Update list and current)
      .addCase(updateCourse.fulfilled, (state, action) => {
        state.currentCourse = action.payload;
        const index = state.list.findIndex((c) => c._id === action.payload._id);
        if (index !== -1) state.list[index] = action.payload;
      });
  },
});

export const { clearCurrentCourse } = courseSlice.actions;

// ==========================================
// 4. ENROLLMENT (Thunks & Slice)
// ==========================================

// --- Thunks ---
export const enrollInCourse = createAsyncThunk(
  'enrollment/enroll',
  async (courseId, { rejectWithValue }) => {
    try {
      const result = await apiRequest('/enrollment/enroll', 'POST', { courseId });
      return result; 
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchEnrollmentStatus = createAsyncThunk(
  'enrollment/fetchStatus',
  async (courseId, { rejectWithValue }) => {
    try {
      const enrollment = await apiRequest(`/enrollment/${courseId}`, 'GET');
      console.log("Fetched enrollment status:", enrollment);
      return enrollment; 
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const updateProgress = createAsyncThunk(
  'enrollment/updateProgress',
  async ({ courseId, progressData }, { rejectWithValue }) => {
    try {
      return await apiRequest(`/enrollment/${courseId}/progress`, 'PUT', progressData);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// NEW THUNK: Fetch all enrolled courses for MyLearning page
export const fetchEnrolledCourses = createAsyncThunk(
    'enrollment/fetchEnrolledCourses',
    async (_, { rejectWithValue }) => {
        try {
            // NOTE: This assumes the backend route GET /enrollment/my-courses exists (as discussed previously)
            return await apiRequest('/enrollment/my-courses', 'GET');
        } catch (err) {
            console.error("Error fetching enrolled courses list:", err);
            return rejectWithValue(err.message);
        }
    }
);


// --- Slice ---
const enrollmentSlice = createSlice({
  name: 'enrollment',
  initialState: {
    currentEnrollment: null, 
    enrolledList: [], // NEW STATE: List of enrolled courses for MyLearning
    loading: false,
    error: null,
  },
  reducers: {
    resetEnrollment: (state) => {
      state.currentEnrollment = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Enroll
      .addCase(enrollInCourse.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(enrollInCourse.fulfilled, (state, action) => { 
        state.loading = false; 
        state.currentEnrollment = action.payload; // Store new enrollment data
        // Optimization: Add newly enrolled course to the list
        // Since we don't have the full details here, we rely on a subsequent fetchEnrolledCourses
      })
      .addCase(enrollInCourse.rejected, (state, action) => { 
        state.loading = false; 
        state.error = action.payload; 
        if (action.payload && action.payload.includes('Already enrolled')) {
            state.currentEnrollment = true; 
            state.error = null;
        }
      })
      // Fetch Status
      .addCase(fetchEnrollmentStatus.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchEnrollmentStatus.fulfilled, (state, action) => { 
        state.loading = false; 
        state.currentEnrollment = action.payload; 
      })
      .addCase(fetchEnrollmentStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        if (action.payload && action.payload.includes('Not enrolled')) {
             state.currentEnrollment = null; 
             state.error = null; 
        }
      })
      // Fetch Enrolled Courses List (NEW REDUCER)
      .addCase(fetchEnrolledCourses.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchEnrolledCourses.fulfilled, (state, action) => { 
        state.loading = false; 
        state.enrolledList = action.payload; 
      })
      .addCase(fetchEnrolledCourses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.enrolledList = [];
      })
      // Update Progress
      .addCase(updateProgress.fulfilled, (state, action) => {
        state.currentEnrollment = action.payload;
      });
  },
});

export const { resetEnrollment } = enrollmentSlice.actions;

// ==========================================
// 5. TEACHERS (Thunks & Slice)
// ==========================================

// --- Thunks ---
export const fetchAllTeachers = createAsyncThunk(
  'teachers/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      // Use the new endpoint
      return await apiRequest('/auth/teachers', 'GET'); 
    } catch (err) {
      console.error("Error fetching teachers:", err);
      return rejectWithValue(null);
    }
  }
);

// --- Slice ---
const teachersSlice = createSlice({
  name: 'teachers',
  initialState: {
    // Stores teachers as an object for quick ID lookup: { id: {name, _id} }
    entities: {}, 
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllTeachers.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchAllTeachers.fulfilled, (state, action) => { 
        state.loading = false; 
        // Convert array payload to ID-keyed object map using _id as key
        state.entities = action.payload.reduce((acc, user) => {
            acc[user._id] = user;
            return acc;
        }, {});
      })
      .addCase(fetchAllTeachers.rejected, (state, action) => { 
        state.loading = false; 
        state.error = action.payload; 
      });
  },
});


// ==========================================
// 6. STORE CONFIGURATION (Updated)
// ==========================================
export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    courses: courseSlice.reducer,
    enrollment: enrollmentSlice.reducer,
    teachers: teachersSlice.reducer,
  },
});

export default store;