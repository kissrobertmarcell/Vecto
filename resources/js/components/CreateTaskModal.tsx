import { Box, Button, Input, Select, Stack, Text, VStack, Dialog, DialogBody, DialogHeader, DialogContent, DialogBackdrop } from '@chakra-ui/react';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createTask } from '../api/board';

interface CreateTaskModalProps {
    open: boolean;
    columnId: number | null;
    projectId: number;
    onClose: () => void;
}

export function CreateTaskModal({ open, columnId, projectId, onClose }: CreateTaskModalProps) {
    const queryClient = useQueryClient();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState('medium');

    const mutation = useMutation({
        mutationFn: () =>
            createTask({
                column_id: columnId!,
                project_id: projectId,
                title,
                description,
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['column', columnId, 'tasks'] });
            setTitle('');
            setDescription('');
            setPriority('medium');
            onClose();
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) {
            alert('Task title is required');
            return;
        }
        mutation.mutate();
    };

    return (
        <Dialog open={open} onOpenChange={(details) => !details.open && onClose()}>
            <DialogBackdrop />
            <DialogContent>
                <DialogHeader>Create a new task</DialogHeader>
                <DialogBody>
                    <form onSubmit={handleSubmit}>
                        <Stack spacing={4}>
                            <div>
                                <label htmlFor="task-title" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                                    Task Title
                                </label>
                                <Input
                                    id="task-title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="What needs to be done?"
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label htmlFor="task-description" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                                    Description (optional)
                                </label>
                                <Input
                                    id="task-description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Add details..."
                                />
                            </div>

                            <div>
                                <label htmlFor="task-priority" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                                    Priority
                                </label>
                                <Select value={priority} onChange={(e) => setPriority(e.target.value)}>
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                </Select>
                            </div>

                            {mutation.isError && (
                                <Box bg="red.50" border="1px solid" borderColor="red.200" p={3} rounded="md">
                                    <Text color="red.700" fontSize="sm">
                                        {mutation.error instanceof Error ? mutation.error.message : 'Failed to create task'}
                                    </Text>
                                </Box>
                            )}

                            <Stack direction="row" spacing={2} pt={4}>
                                <Button variant="outline" onClick={onClose} flex={1}>
                                    Cancel
                                </Button>
                                <Button
                                    colorPalette="blue"
                                    type="submit"
                                    loading={mutation.isPending}
                                    disabled={mutation.isPending}
                                    flex={1}
                                >
                                    Create
                                </Button>
                            </Stack>
                        </Stack>
                    </form>
                </DialogBody>
            </DialogContent>
        </Dialog>
    );
}
