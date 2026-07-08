import { Box, Button, Input, Stack, Text } from '@chakra-ui/react';
import { DialogBackdrop, DialogBody, DialogContent, DialogHeader, DialogRoot } from '@chakra-ui/react';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createProject } from '../api/projects';

interface CreateProjectModalProps {
    open: boolean;
    onClose: () => void;
}

export function CreateProjectModal({ open, onClose }: CreateProjectModalProps) {
    const queryClient = useQueryClient();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    const mutation = useMutation({
        mutationFn: () => createProject({ name, description }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            setName('');
            setDescription('');
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
                    Create a new project
                </DialogHeader>
                <DialogBody pb={6}>
                    <form onSubmit={handleSubmit}>
                        <Stack gap={4}>
                            <Box>
                                <label
                                    htmlFor="project-name"
                                    style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}
                                >
                                    Project Name
                                </label>
                                <Input
                                    id="project-name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="My Project"
                                    autoFocus
                                />
                            </Box>

                            <Box>
                                <label
                                    htmlFor="project-description"
                                    style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}
                                >
                                    Description (optional)
                                </label>
                                <Input
                                    id="project-description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Describe your project"
                                />
                            </Box>

                            {mutation.isError && (
                                <Box bg="red.50" border="1px solid" borderColor="red.200" p={3} rounded="md">
                                    <Text color="red.700" fontSize="sm">
                                        {mutation.error instanceof Error ? mutation.error.message : 'Failed to create project'}
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
