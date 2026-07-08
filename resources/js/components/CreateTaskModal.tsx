import { Box, Button, Input, Stack, Text } from '@chakra-ui/react';
import { DialogBackdrop, DialogBody, DialogContent, DialogHeader, DialogRoot } from '@chakra-ui/react';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createTask } from '../api/board';

interface CreateTaskModalProps {
    open: boolean;
    columnId: number | null;
    projectId: number;
    onClose: () => void;
}

const PRIORITIES = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
];

export function CreateTaskModal({ open, columnId, projectId, onClose }: CreateTaskModalProps) {
    const queryClient = useQueryClient();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');

    const mutation = useMutation({
        mutationFn: () =>
            createTask(projectId, {
                column_id: columnId ?? undefined,
                title,
                description,
                priority,
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['board'] });
            queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
            setTitle('');
            setDescription('');
            setPriority('medium');
            onClose();
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;
        mutation.mutate();
    };

    return (
        <DialogRoot open={open} onOpenChange={(d) => !d.open && onClose()}>
            <DialogBackdrop />
            <DialogContent>
                <DialogHeader fontSize="lg" fontWeight="semibold">
                    Create a new task
                </DialogHeader>
                <DialogBody pb={6}>
                    <form onSubmit={handleSubmit}>
                        <Stack gap={4}>
                            <Box>
                                <label
                                    htmlFor="task-title"
                                    style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}
                                >
                                    Task Title
                                </label>
                                <Input
                                    id="task-title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="What needs to be done?"
                                    autoFocus
                                />
                            </Box>

                            <Box>
                                <label
                                    htmlFor="task-description"
                                    style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}
                                >
                                    Description (optional)
                                </label>
                                <Input
                                    id="task-description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Add details..."
                                />
                            </Box>

                            <Box>
                                <label
                                    htmlFor="task-priority"
                                    style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}
                                >
                                    Priority
                                </label>
                                <select
                                    id="task-priority"
                                    value={priority}
                                    onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
                                    style={{
                                        width: '100%',
                                        padding: '0.5rem 0.75rem',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '0.375rem',
                                        fontSize: '0.875rem',
                                        background: 'white',
                                    }}
                                >
                                    {PRIORITIES.map((p) => (
                                        <option key={p.value} value={p.value}>
                                            {p.label}
                                        </option>
                                    ))}
                                </select>
                            </Box>

                            {mutation.isError && (
                                <Box bg="red.50" border="1px solid" borderColor="red.200" p={3} rounded="md">
                                    <Text color="red.700" fontSize="sm">
                                        {mutation.error instanceof Error ? mutation.error.message : 'Failed to create task'}
                                    </Text>
                                </Box>
                            )}

                            <Stack direction="row" gap={2} pt={2}>
                                <Button variant="outline" onClick={onClose} flex={1}>
                                    Cancel
                                </Button>
                                <Button
                                    colorPalette="blue"
                                    type="submit"
                                    loading={mutation.isPending}
                                    disabled={mutation.isPending || !title.trim()}
                                    flex={1}
                                >
                                    Create
                                </Button>
                            </Stack>
                        </Stack>
                    </form>
                </DialogBody>
            </DialogContent>
        </DialogRoot>
    );
}
