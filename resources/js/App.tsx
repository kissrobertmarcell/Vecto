import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Center, Spinner } from '@chakra-ui/react';
import { fetchCurrentUser } from './api/auth';
import { useAuthStore } from './store/auth';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { BoardPage } from './pages/BoardPage';
import { ProtectedRoute } from './components/ProtectedRoute';

export default function App() {
    const setUser = useAuthStore((state) => state.setUser);
    const user = useAuthStore((state) => state.user);

    const { data, isPending, isError } = useQuery({
        queryKey: ['auth', 'me'],
        queryFn: fetchCurrentUser,
        retry: false,
        staleTime: 1000 * 60 * 5,
    });

    // React Query v5: use useEffect instead of onSuccess/onError
    useEffect(() => {
        if (data) setUser(data);
    }, [data, setUser]);

    useEffect(() => {
        if (isError) setUser(null);
    }, [isError, setUser]);

    if (isPending) {
        return (
            <Center minH="100vh">
                <Spinner />
            </Center>
        );
    }

    return (
        <Routes>
            <Route
                path="/login"
                element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />}
            />
            <Route
                path="/register"
                element={user ? <Navigate to="/dashboard" replace /> : <RegisterPage />}
            />
            <Route
                path="/dashboard"
                element={
                    <ProtectedRoute>
                        <DashboardPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/projects/:projectId"
                element={
                    <ProtectedRoute>
                        <BoardPage />
                    </ProtectedRoute>
                }
            />
            <Route path="/*" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
        </Routes>
    );
}
