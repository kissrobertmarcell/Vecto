import { Box, Button, Input, Stack, Text, VStack, Dialog, DialogBody, DialogHeader, DialogContent, DialogBackdrop } from '@chakra-ui/react';
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
        if (!name.trim()) {
            alert('Project name is required');
            return;
        }
        mutation.mutate();
    };

    return (
        <Dialog open={open} onOpenChange={(details) => !details.open && onClose()}>
            <DialogBackdrop />
            <DialogContent>
                <DialogHeader>Create a new project</DialogHeader>
                <DialogBody>
                    <form onSubmit={handleSubmit}>
                        <Stack spacing={4}>
                            <div>
                                <label htmlFor="project-name" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                                    Project Name
                                </label>
                                <Input
                                    id="project-name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="My Project"
                                />
                            </div>

                            <div>
                                <label htmlFor="project-description" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                                    Description (optional)
                                </label>
                                <Input
                                    id="project-description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Describe your project"
                                />
                            </div>

                            {mutation.isError && (
                                <Box bg="red.50" border="1px solid" borderColor="red.200" p={3} rounded="md">
                                    <Text color="red.700" fontSize="sm">
                                        {mutation.error instanceof Error ? mutation.error.message : 'Failed to create project'}
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
