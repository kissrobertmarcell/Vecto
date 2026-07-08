import { Box, Button, Card, Heading, HStack, Stack, Text, VStack } from '@chakra-ui/react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { getBoard, getBoardColumns, getColumnTasks } from '../api/board';
import { CreateTaskModal } from '../components/CreateTaskModal';

export function BoardPage() {
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();
    const [createTaskOpen, setCreateTaskOpen] = useState(false);
    const [selectedColumnId, setSelectedColumnId] = useState<number | null>(null);

    const boardQuery = useQuery({
        queryKey: ['board', projectId],
        queryFn: () => getBoard(Number(projectId)),
        enabled: !!projectId,
    });

    const columnsQuery = useQuery({
        queryKey: ['board', boardQuery.data?.id, 'columns'],
        queryFn: () => getBoardColumns(boardQuery.data!.id),
        enabled: !!boardQuery.data,
    });

    return (
        <Box minH="100vh" bg="gray.50">
            <Box bg="white" borderBottom="1px solid" borderColor="gray.200" p={6}>
                <HStack justify="space-between">
                    <VStack align="start" spacing={0}>
                        <Button variant="ghost" onClick={() => navigate('/dashboard')}>
                            ← Back
                        </Button>
                        <Heading size="lg">{boardQuery.data?.name}</Heading>
                    </VStack>
                </HStack>
            </Box>

            {boardQuery.isLoading && <Text p={6}>Loading board...</Text>}

            {boardQuery.error && (
                <Box bg="red.50" border="1px solid" borderColor="red.200" p={4} m={6} rounded="md">
                    <Text color="red.700">Failed to load board</Text>
                </Box>
            )}

            {columnsQuery.data && (
                <Box p={6} overflowX="auto">
                    <HStack align="start" spacing={6}>
                        {columnsQuery.data.map((column) => (
                            <ColumnView
                                key={column.id}
                                column={column}
                                onCreateTask={() => {
                                    setSelectedColumnId(column.id);
                                    setCreateTaskOpen(true);
                                }}
                            />
                        ))}
                    </HStack>
                </Box>
            )}

            <CreateTaskModal
                open={createTaskOpen}
                columnId={selectedColumnId}
                projectId={Number(projectId)}
                onClose={() => setCreateTaskOpen(false)}
            />
        </Box>
    );
}

function ColumnView({ column, onCreateTask }: { column: any; onCreateTask: () => void }) {
    const { data: tasks, isLoading } = useQuery({
        queryKey: ['column', column.id, 'tasks'],
        queryFn: () => getColumnTasks(column.id),
    });

    return (
        <Box minW="300px" bg="white" rounded="md" border="1px solid" borderColor="gray.200" p={4}>
            <VStack spacing={4} align="start" w="100%">
                <HStack justify="space-between" w="100%">
                    <Heading size="sm">{column.name}</Heading>
                    <Text fontSize="xs" color="gray.500">
                        {tasks?.length || 0}
                    </Text>
                </HStack>

                {isLoading && <Text fontSize="sm" color="gray.500">Loading...</Text>}

                <Stack w="100%" spacing={3}>
                    {tasks?.map((task) => (
                        <Card key={task.id} p={3} bg="gray.50" _hover={{ bg: 'gray.100' }} cursor="pointer">
                            <VStack align="start" spacing={1}>
                                <Heading size="xs">{task.title}</Heading>
                                {task.description && <Text fontSize="xs" color="gray.600">{task.description}</Text>}
                                <HStack spacing={2} pt={2}>
                                    {task.story_points && (
                                        <Box bg="blue.100" px={2} py={1} rounded="sm">
                                            <Text fontSize="xs" color="blue.700">
                                                {task.story_points}pts
                                            </Text>
                                        </Box>
                                    )}
                                    <Box bg="gray.200" px={2} py={1} rounded="sm">
                                        <Text fontSize="xs" textTransform="capitalize">
                                            {task.priority}
                                        </Text>
                                    </Box>
                                </HStack>
                            </VStack>
                        </Card>
                    ))}
                </Stack>

                <Button size="sm" variant="outline" w="100%" onClick={onCreateTask}>
                    + Add task
                </Button>
            </VStack>
        </Box>
    );
}
