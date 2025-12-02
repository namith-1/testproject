import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Base API URL
const API_URL = 'http://localhost:5000/api/auth';

// --- Helper for Fetch to handle JSON and Errors automatically ---
const fetchClient = async (endpoint, options = {}) => {
  const config = {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // IMPORTANT: Sends cookies/session to backend
    ...options,
  };

  const response = await fetch(`${API_URL}${endpoint}`, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }

  return data;
};

// --- Async Thunks ---

// 1. Login
export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ email, password, role }, { rejectWithValue }) => {
    try {
      const data = await fetchClient('/login', {
        method: 'POST',
        body: JSON.stringify({ email, password, role }),
      });
      return data.user;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// 2. Register
export const registerUser = createAsyncThunk(
  'auth/register',
  async ({ name, email, password, role }, { rejectWithValue }) => {
    try {
      const data = await fetchClient('/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, role }),
      });
      return data.user;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// 3. Check Session (Me)
export const checkSession = createAsyncThunk(
  'auth/me',
  async (_, { rejectWithValue }) => {
    try {
      const data = await fetchClient('/me', { method: 'GET' });
      return data.user;
    } catch (error) {
      // Quietly fail if not logged in
      console.log(error);
      return rejectWithValue(null);
    }
  }
);

// 4. Logout
export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await fetchClient('/logout', { method: 'POST' });
      return null;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// --- Slice ---

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null, // Stores: { id, name, role }
    isLoading: false,
    error: null,
  },
  reducers: {
    resetAuthStatus: (state) => {
      state.isLoading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login Cases
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Register Cases
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Check Session Cases
      .addCase(checkSession.fulfilled, (state, action) => {
        state.user = action.payload;
      })
      // Logout Cases
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
      });
  },
});

export const { resetAuthStatus } = authSlice.actions;
export default authSlice.reducer;