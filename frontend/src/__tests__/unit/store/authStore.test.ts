import { useAuthStore } from '../../../store/authStore';

const initialState = useAuthStore.getState();

beforeEach(() => {
  useAuthStore.setState(initialState);
});

describe('useAuthStore', () => {
  it('has correct initial state', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.isInitialized).toBe(false);
  });

  it('login() sets user, token, and isAuthenticated', () => {
    const user = { id: '1', name: 'Test', email: 'test@test.com', isAdmin: false };
    useAuthStore.getState().login(user, 'test-token');

    const state = useAuthStore.getState();
    expect(state.user).toEqual(user);
    expect(state.token).toBe('test-token');
    expect(state.isAuthenticated).toBe(true);
  });

  it('logout() clears user, token, and sets isAuthenticated to false', () => {
    const user = { id: '1', name: 'Test', email: 'test@test.com', isAdmin: false };
    useAuthStore.getState().login(user, 'test-token');
    useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('setInitialized() sets isInitialized to true', () => {
    expect(useAuthStore.getState().isInitialized).toBe(false);
    useAuthStore.getState().setInitialized();
    expect(useAuthStore.getState().isInitialized).toBe(true);
  });
});
