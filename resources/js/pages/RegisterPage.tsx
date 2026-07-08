import { Box, Button, Heading, Input, Stack, Text, VStack } from '@chakra-ui/react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { register as registerUser } from '../api/auth';
import { useAuthStore } from '../store/auth';

export function RegisterPage() {
    const navigate = useNavigate();
    const setUser = useAuthStore((state) => state.setUser);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');

    const mutation = useMutation({
        mutationFn: () =>
            registerUser({
                name,
                email,
                password,
                password_confirmation: passwordConfirm,
            }),
        onSuccess: (user) => {
            setUser(user);
            navigate('/dashboard');
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== passwordConfirm) {
            alert('Passwords do not match');
            return;
        }
        mutation.mutate();
    };

    return (
        <VStack minH="100vh" justify="center" p={8}>
            <Box maxW="sm" w="100%">
                <VStack spacing={8}>
                    <VStack spacing={2} textAlign="center">
                        <Heading size="xl">Vecto</Heading>
                        <Text color="gray.600">Create your account</Text>
                    </VStack>

                    <form onSubmit={handleSubmit} style={{ width: '100%' }}>
                        <Stack spacing={4}>
                            <div>
                                <label htmlFor="name" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                                    Full Name
                                </label>
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="John Doe"
                                />
                            </div>

                            <div>
                                <label htmlFor="email" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                                    Email
                                </label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                />
                            </div>

                            <div>
                                <label htmlFor="password" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                                    Password
                                </label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                />
                            </div>

                            <div>
                                <label htmlFor="password_confirmation" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                                    Confirm Password
                                </label>
                                <Input
                                    id="password_confirmation"
                                    type="password"
                                    value={passwordConfirm}
                                    onChange={(e) => setPasswordConfirm(e.target.value)}
                                    placeholder="••••••••"
                                />
                            </div>

                            {mutation.isError && (
                                <Box bg="red.50" border="1px solid" borderColor="red.200" p={3} rounded="md">
                                    <Text color="red.700" fontSize="sm">
                                        {mutation.error instanceof Error ? mutation.error.message : 'Registration failed'}
                                    </Text>
                                </Box>
                            )}

                            <Button
                                type="submit"
                                colorPalette="green"
                                w="100%"
                                loading={mutation.isPending}
                                disabled={mutation.isPending}
                            >
                                Create account
                            </Button>
                        </Stack>
                    </form>

                    <Box textAlign="center" fontSize="sm">
                        <Text>
                            Already have an account?{' '}
                            <RouterLink to="/login" style={{ color: '#3182ce', textDecoration: 'underline' }}>
                                Sign in
                            </RouterLink>
                        </Text>
                    </Box>
                </VStack>
            </Box>
        </VStack>
    );
}
