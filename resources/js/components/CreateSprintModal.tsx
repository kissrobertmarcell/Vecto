import { Box, Button, Input, Stack, Text, Textarea } from '@chakra-ui/react';
import { DialogBackdrop, DialogBody, DialogContent, DialogHeader, DialogRoot } from '@chakra-ui/react';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createSprint } from '../api/sprints';

interface CreateSprintModalProps {
    open: boolean;
    projectId: number;
    onClose: () => void;
}

export function CreateSprintModal({ open, projectId, onClose }: CreateSprintModalProps) {
    const queryClient = useQueryClient();
    const [name, setName] = useState('');
    const [goal, setGoal] = useState('');
    const [startsAt, setStartsAt] = useState('');
    const [endsAt, setEndsAt] = useState('');

    const mutation = useMutation({
        mutationFn: () =>
            createSprint(projectId, {
                name,
                goal: goal || undefined,
                starts_at: startsAt || undefined,
                ends_at: endsAt || undefined,
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sprints', projectId] });
            setName('');
            setGoal('');
            setStartsAt('');
            setEndsAt('');
            onClose();
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        mutation.mutate();
    };

    return (
        <DialogRoot open={open} onOpenChange={(d) => !d.open && onClose()}>
            <DialogBackdrop />
            <DialogContent>
                <DialogHeader fontSize="lg" fontWeight="semibold">
                    Create a new sprint
                </DialogHeader>
                <DialogBody pb={6}>
                    <form onSubmit={handleSubmit}>
                        <Stack gap={4}>
                            <Box>
                                <label
                                    htmlFor="sprint-name"
                                    style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}
                                >
                                    Sprint Name
                                </label>
                                <Input
                                    id="sprint-name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Sprint 1"
                                    autoFocus
                                />
                            </Box>

                            <Box>
                                <label
                                    htmlFor="sprint-goal"
                                    style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}
                                >
                                    Sprint Goal (optional)
                                </label>
                                <Textarea
                                    id="sprint-goal"
                                    value={goal}
                                    onChange={(e) => setGoal(e.target.value)}
                                    placeholder="What do you want to achieve in this sprint?"
                                    rows={3}
                                />
                            </Box>

                            <Stack direction="row" gap={3}>
                                <Box flex={1}>
                                    <label
                                        htmlFor="sprint-starts"
                                        style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}
                                    >
                                        Start Date
                                    </label>
                                    <Input
                                        id="sprint-starts"
                                        type="date"
                                        value={startsAt}
                                        onChange={(e) => setStartsAt(e.target.value)}
                                    />
                                </Box>
                                <Box flex={1}>
                                    <label
                                        htmlFor="sprint-ends"
                                        style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}
                                    >
                                        End Date
                                    </label>
                                    <Input
                                        id="sprint-ends"
                                        type="date"
                                        value={endsAt}
                                        onChange={(e) => setEndsAt(e.target.value)}
                                    />
                                </Box>
                            </Stack>

                            {mutation.isError && (
                                <Box bg="red.50" border="1px solid" borderColor="red.200" p={3} rounded="md">
                                    <Text color="red.700" fontSize="sm">
                                        {mutation.error instanceof Error ? mutation.error.message : 'Failed to create sprint'}
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
                                    disabled={mutation.isPending || !name.trim()}
                                    flex={1}
                                >
                                    Create Sprint
                                </Button>
                            </Stack>
                        </Stack>
                    </form>
                </DialogBody>
            </DialogContent>
        </DialogRoot>
    );
}
