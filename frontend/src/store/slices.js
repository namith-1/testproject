import { configureStore, createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// ==========================================
// 1. API UTILITY (Internal Helper)
// ==========================================
const BASE_URL = 'http://localhost:5000/api';

const apiRequest = async (endpoint, method = 'GET', body = null) => {
  const config = {
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // Important for cookies
  };
  if (body) config.body = JSON.stringify(body);

  const response = await fetch(`${BASE_URL}${endpoint}`, config);
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || data.error || 'Something went wrong');
  return data;
};

// ==========================================
// 2. AUTHENTICATION (Thunks & Slice)
// ==========================================

// --- Thunks ---
export const registerUser = createAsyncThunk('auth/register', async (userData, { rejectWithValue }) => {
  try { return (await apiRequest('/auth/register', 'POST', userData)).user; }
  catch (err) { return rejectWithValue(err.message); }
});

export const loginUser = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try { return (await apiRequest('/auth/login', 'POST', credentials)).user; }
  catch (err) { return rejectWithValue(err.message); }
});

export const logoutUser = createAsyncThunk('auth/logout', async (_, { rejectWithValue }) => {
  try { await apiRequest('/auth/logout', 'POST'); return null; }
  catch (err) { return rejectWithValue(err.message); }
});

export const checkAuthStatus = createAsyncThunk('auth/checkStatus', async (_, { rejectWithValue }) => {
  try { return (await apiRequest('/auth/me', 'GET')).user; }
  catch (err) { return rejectWithValue(err.message); }
});

// --- Slice ---
const authSlice = createSlice({
  name: 'auth',
  initialState: { user: null, loading: true, error: null }, // loading=true initially for auth check
  reducers: {
    clearErrors: (state) => { state.error = null; },
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
      // Check Auth Status
      .addCase(checkAuthStatus.pending, (state) => { state.loading = true; })
      .addCase(checkAuthStatus.fulfilled, (state, action) => { state.loading = false; state.user = action.payload; })
      .addCase(checkAuthStatus.rejected, (state) => { state.loading = false; state.user = null; });
  },
});

export const { clearErrors: clearAuthErrors } = authSlice.actions;

// ==========================================
// 3. COURSES (Thunks & Slice)
// ==========================================

// --- Thunks ---
export const fetchAllCourses = createAsyncThunk('courses/fetchAll', async (_, { rejectWithValue }) => {
  try { return await apiRequest('/courses', 'GET'); }
  catch (err) { return rejectWithValue(err.message); }
});

export const fetchCourseById = createAsyncThunk('courses/fetchById', async (id, { rejectWithValue }) => {
  try { return await apiRequest(`/courses/${id}`, 'GET'); }
  catch (err) { return rejectWithValue(err.message); }
});

export const createNewCourse = createAsyncThunk('courses/create', async (data, { rejectWithValue }) => {
  try { return await apiRequest('/courses', 'POST', data); }
  catch (err) { return rejectWithValue(err.message); }
});

export const updateCourse = createAsyncThunk('courses/update', async ({ id, data }, { rejectWithValue }) => {
  try { return await apiRequest(`/courses/${id}`, 'PUT', data); }
  catch (err) { return rejectWithValue(err.message); }
});

// --- Slice ---
const courseSlice = createSlice({
  name: 'courses',
  initialState: { list: [], currentCourse: null, loading: false, error: null },
  reducers: {
    clearCurrentCourse: (state) => { state.currentCourse = null; },
  },
  extraReducers: (builder) => {
    builder
      // Fetch All
      .addCase(fetchAllCourses.pending, (state) => { state.loading = true; })
      .addCase(fetchAllCourses.fulfilled, (state, action) => { state.loading = false; state.list = action.payload; })
      .addCase(fetchAllCourses.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      // Fetch Single
      .addCase(fetchCourseById.pending, (state) => { state.loading = true; })
      .addCase(fetchCourseById.fulfilled, (state, action) => { state.loading = false; state.currentCourse = action.payload; })
      .addCase(fetchCourseById.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      // Create
      .addCase(createNewCourse.fulfilled, (state, action) => { state.list.push(action.payload); })
      // Update
      .addCase(updateCourse.fulfilled, (state, action) => {
        state.currentCourse = action.payload;
        const index = state.list.findIndex(c => c._id === action.payload._id);
        if (index !== -1) state.list[index] = action.payload;
      });
  },
});

export const { clearCurrentCourse } = courseSlice.actions;

// ==========================================
// 4. ENROLLMENT (Thunks & Slice)
// ==========================================

// --- Thunks ---
export const enrollInCourse = createAsyncThunk('enrollment/enroll', async (courseId, { rejectWithValue }) => {
  try { return await apiRequest('/enrollment/enroll', 'POST', { courseId }); }
  catch (err) { return rejectWithValue(err.message); }
});

export const fetchEnrollmentStatus = createAsyncThunk('enrollment/fetchStatus', async (courseId, { rejectWithValue }) => {
  try { return await apiRequest(`/enrollment/${courseId}`, 'GET'); }
  catch (err) { return rejectWithValue(err.message); }
});

export const updateProgress = createAsyncThunk('enrollment/updateProgress', async ({ courseId, progressData }, { rejectWithValue }) => {
  try { return await apiRequest(`/enrollment/${courseId}/progress`, 'PUT', progressData); }
  catch (err) { return rejectWithValue(err.message); }
});

// --- Slice ---
const enrollmentSlice = createSlice({
  name: 'enrollment',
  initialState: { currentEnrollment: null, loading: false, error: null },
  reducers: {
    resetEnrollment: (state) => { state.currentEnrollment = null; state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      // Enroll
      .addCase(enrollInCourse.pending, (state) => { state.loading = true; })
      .addCase(enrollInCourse.fulfilled, (state, action) => { state.loading = false; state.currentEnrollment = action.payload; })
      .addCase(enrollInCourse.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      // Fetch Status
      .addCase(fetchEnrollmentStatus.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchEnrollmentStatus.fulfilled, (state, action) => { state.loading = false; state.currentEnrollment = action.payload; })
      .addCase(fetchEnrollmentStatus.rejected, (state, action) => { state.loading = false; state.error = action.payload; state.currentEnrollment = null; })
      // Update Progress
      .addCase(updateProgress.fulfilled, (state, action) => { state.currentEnrollment = action.payload; });
  },
});

export const { resetEnrollment } = enrollmentSlice.actions;

// ==========================================
// 5. STORE CONFIGURATION
// ==========================================
export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    courses: courseSlice.reducer,
    enrollment: enrollmentSlice.reducer,
  },
});