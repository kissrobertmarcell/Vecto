'use client';

import { Box, Button, Card, Heading, HStack, Stack, Text, VStack } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { getProjects } from '../api/projects';
import { useAuthStore } from '../store/auth';
import { logout } from '../api/auth';
import { CreateProjectModal } from '../components/CreateProjectModal';

export function DashboardPage() {
    const navigate = useNavigate();
    const user = useAuthStore((state) => state.user);
    const setUser = useAuthStore((state) => state.setUser);
    const [createModalOpen, setCreateModalOpen] = useState(false);

    const { data: projects, isLoading, error } = useQuery({
        queryKey: ['projects'],
        queryFn: getProjects,
    });

    const handleLogout = async () => {
        try {
            await logout();
            setUser(null);
            navigate('/login');
        } catch (err) {
            console.error('Logout failed:', err);
        }
    };

    const handleProjectClick = (projectId: number) => {
        navigate(`/projects/${projectId}`);
    };

    return (
        <Box minH="100vh" bg="gray.50">
            <Box bg="white" borderBottom="1px solid" borderColor="gray.200" p={6}>
                <HStack justify="space-between">
                    <VStack align="start" spacing={0}>
                        <Heading size="lg">Dashboard</Heading>
                        <Text color="gray.600" fontSize="sm">
                            Welcome back, {user?.name}
                        </Text>
                    </VStack>
                    <Button variant="outline" onClick={handleLogout} colorPalette="red">
                        Logout
                    </Button>
                </HStack>
            </Box>

            <Box p={6}>
                <VStack align="start" spacing={6}>
                    <VStack align="start" w="100%">
                        <HStack justify="space-between" w="100%">
                            <Heading size="md">Projects</Heading>
                            <Button colorPalette="blue" onClick={() => setCreateModalOpen(true)}>
                                New project
                            </Button>
                        </HStack>
                    </VStack>

                    {isLoading && <Text>Loading projects...</Text>}

                    {error && (
                        <Box bg="red.50" border="1px solid" borderColor="red.200" p={4} rounded="md" w="100%">
                            <Text color="red.700">Failed to load projects</Text>
                        </Box>
                    )}

                    {projects && projects.length === 0 && (
                        <Box bg="gray.100" p={12} rounded="md" w="100%" textAlign="center">
                            <Text color="gray.600" mb={4}>No projects yet. Create one to get started.</Text>
                            <Button colorPalette="blue" onClick={() => setCreateModalOpen(true)}>
                                Create your first project
                            </Button>
                        </Box>
                    )}

                    <Stack w="100%" spacing={4}>
                        {projects?.map((project) => (
                            <Card key={project.id} p={4} cursor="pointer" _hover={{ bg: 'gray.100' }} onClick={() => handleProjectClick(project.id)}>
                                <HStack justify="space-between">
                                    <VStack align="start" spacing={1}>
                                        <Heading size="sm">{project.name}</Heading>
                                        {project.description && (
                                            <Text color="gray.600" fontSize="sm">
                                                {project.description}
                                            </Text>
                                        )}
                                        <Text color="gray.500" fontSize="xs">
                                            {project.key}
                                        </Text>
                                    </VStack>
                                </HStack>
                            </Card>
                        ))}
                    </Stack>
                </VStack>
            </Box>

            <CreateProjectModal open={createModalOpen} onClose={() => setCreateModalOpen(false)} />
        </Box>
    );
}
