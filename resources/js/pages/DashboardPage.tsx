'use client';

import { Badge, Box, Button, HStack, Heading, Stack, Text, VStack } from '@chakra-ui/react';
import { CardRoot } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { FolderOpen, LogOut, Plus } from 'lucide-react';
import { getProjects } from '../api/projects';
import { useAuthStore } from '../store/auth';
import { logout } from '../api/auth';
import { CreateProjectModal } from '../components/CreateProjectModal';
import { SearchPopover } from '../components/SearchPopover';

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

    return (
        <Box minH="100vh" bg="gray.50">
            {/* Header */}
            <Box bg="white" borderBottom="1px solid" borderColor="gray.200" px={6} py={4}>
                <HStack justify="space-between">
                    <HStack gap={4}>
                        <HStack gap={2}>
                            <Box w={8} h={8} bg="blue.500" rounded="md" display="flex" alignItems="center" justifyContent="center">
                                <Text color="white" fontWeight="bold" fontSize="sm">V</Text>
                            </Box>
                            <Heading size="md" color="gray.900">Vecto</Heading>
                        </HStack>
                        <SearchPopover />
                    </HStack>
                    <HStack gap={3}>
                        <HStack gap={2}>
                            <Box
                                w={8} h={8} rounded="full" bg="blue.100"
                                display="flex" alignItems="center" justifyContent="center"
                            >
                                <Text fontSize="sm" fontWeight="bold" color="blue.700">
                                    {user?.name?.charAt(0)?.toUpperCase()}
                                </Text>
                            </Box>
                            <Text fontSize="sm" fontWeight="medium">{user?.name}</Text>
                        </HStack>
                        <Button variant="ghost" size="sm" onClick={handleLogout} colorPalette="red">
                            <LogOut size={16} />
                            Logout
                        </Button>
                    </HStack>
                </HStack>
            </Box>

            {/* Content */}
            <Box p={6}>
                <VStack align="stretch" gap={6} maxW="900px" mx="auto">
                    <HStack justify="space-between" align="center">
                        <VStack align="start" gap={0}>
                            <Heading size="lg">Projects</Heading>
                            <Text color="gray.500" fontSize="sm">Welcome back, {user?.name}</Text>
                        </VStack>
                        <Button colorPalette="blue" onClick={() => setCreateModalOpen(true)}>
                            <Plus size={16} />
                            New Project
                        </Button>
                    </HStack>

                    {isLoading && (
                        <Box textAlign="center" py={12}>
                            <Text color="gray.500">Loading projects…</Text>
                        </Box>
                    )}

                    {error && (
                        <Box bg="red.50" border="1px solid" borderColor="red.200" p={4} rounded="md">
                            <Text color="red.700">Failed to load projects</Text>
                        </Box>
                    )}

                    {projects && projects.length === 0 && (
                        <Box bg="gray.100" p={12} rounded="xl" textAlign="center">
                            <FolderOpen size={40} color="#9ca3af" style={{ margin: '0 auto 1rem' }} />
                            <Text color="gray.600" mb={4} fontWeight="medium">
                                No projects yet. Create one to get started.
                            </Text>
                            <Button colorPalette="blue" onClick={() => setCreateModalOpen(true)}>
                                Create your first project
                            </Button>
                        </Box>
                    )}

                    <Stack gap={3}>
                        {projects?.map((project) => (
                            <CardRoot
                                key={project.id}
                                p={4}
                                cursor="pointer"
                                _hover={{ shadow: 'md', borderColor: 'blue.200' }}
                                border="1px solid"
                                borderColor="gray.200"
                                transition="all 0.15s"
                                onClick={() => navigate(`/projects/${project.id}`)}
                            >
                                <HStack justify="space-between">
                                    <VStack align="start" gap={1}>
                                        <HStack gap={2}>
                                            <Heading size="sm">{project.name}</Heading>
                                            {project.my_role && (
                                                <Badge colorPalette="blue" size="sm">{project.my_role}</Badge>
                                            )}
                                        </HStack>
                                        {project.description && (
                                            <Text color="gray.600" fontSize="sm">
                                                {project.description}
                                            </Text>
                                        )}
                                        <HStack gap={3} mt={1}>
                                            {project.key && (
                                                <Text color="gray.400" fontSize="xs" fontFamily="mono">
                                                    {project.key}
                                                </Text>
                                            )}
                                            {project.members_count != null && (
                                                <Text color="gray.400" fontSize="xs">
                                                    {project.members_count} member{project.members_count !== 1 ? 's' : ''}
                                                </Text>
                                            )}
                                            {project.tasks_count != null && (
                                                <Text color="gray.400" fontSize="xs">
                                                    {project.tasks_count} task{project.tasks_count !== 1 ? 's' : ''}
                                                </Text>
                                            )}
                                        </HStack>
                                    </VStack>
                                    <Box color="gray.400" fontSize="xl">→</Box>
                                </HStack>
                            </CardRoot>
                        ))}
                    </Stack>
                </VStack>
            </Box>

            <CreateProjectModal open={createModalOpen} onClose={() => setCreateModalOpen(false)} />
        </Box>
    );
}
