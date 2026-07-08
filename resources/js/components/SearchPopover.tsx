import { Box, Input, Text, VStack, HStack, Badge } from '@chakra-ui/react';
import { Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { globalSearch } from '../api/search';

export function SearchPopover() {
    const [query, setQuery] = useState('');
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    const { data } = useQuery({
        queryKey: ['search', query],
        queryFn: () => globalSearch(query),
        enabled: query.length >= 2,
        staleTime: 1000 * 30,
    });

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const hasResults = (data?.projects?.length ?? 0) + (data?.tasks?.length ?? 0) > 0;

    return (
        <Box ref={ref} position="relative" w="280px">
            <Box position="relative">
                <Box position="absolute" left={3} top="50%" transform="translateY(-50%)" color="gray.400" pointerEvents="none">
                    <Search size={16} />
                </Box>
                <Input
                    id="global-search"
                    pl={9}
                    placeholder="Search projects & tasks…"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setOpen(true);
                    }}
                    onFocus={() => setOpen(true)}
                    bg="white"
                    border="1px solid"
                    borderColor="gray.200"
                    _focus={{ borderColor: 'blue.400', boxShadow: '0 0 0 1px #3b82f6' }}
                    fontSize="sm"
                />
            </Box>

            {open && query.length >= 2 && (
                <Box
                    position="absolute"
                    top="calc(100% + 4px)"
                    left={0}
                    right={0}
                    bg="white"
                    border="1px solid"
                    borderColor="gray.200"
                    rounded="lg"
                    shadow="lg"
                    zIndex={50}
                    maxH="360px"
                    overflowY="auto"
                >
                    {!hasResults && (
                        <Box p={4} textAlign="center">
                            <Text color="gray.500" fontSize="sm">
                                No results for &quot;{query}&quot;
                            </Text>
                        </Box>
                    )}

                    {(data?.projects?.length ?? 0) > 0 && (
                        <Box>
                            <Box px={3} py={2} bg="gray.50" borderBottom="1px solid" borderColor="gray.100">
                                <Text fontSize="xs" fontWeight="semibold" color="gray.500" textTransform="uppercase" letterSpacing="wider">
                                    Projects
                                </Text>
                            </Box>
                            <VStack align="stretch" gap={0}>
                                {data!.projects.map((project) => (
                                    <HStack
                                        key={project.id}
                                        px={3}
                                        py={2}
                                        _hover={{ bg: 'blue.50' }}
                                        cursor="pointer"
                                        gap={2}
                                        onClick={() => {
                                            navigate(`/projects/${project.id}`);
                                            setOpen(false);
                                            setQuery('');
                                        }}
                                    >
                                        <Box
                                            w={6}
                                            h={6}
                                            rounded="sm"
                                            bg="blue.100"
                                            display="flex"
                                            alignItems="center"
                                            justifyContent="center"
                                            flexShrink={0}
                                        >
                                            <Text fontSize="xs" fontWeight="bold" color="blue.700">
                                                {project.name?.charAt(0)?.toUpperCase()}
                                            </Text>
                                        </Box>
                                        <VStack align="start" gap={0} flex={1} minW={0}>
                                            <Text fontSize="sm" fontWeight="medium" noOfLines={1}>
                                                {project.name}
                                            </Text>
                                            {project.description && (
                                                <Text fontSize="xs" color="gray.500" noOfLines={1}>
                                                    {project.description}
                                                </Text>
                                            )}
                                        </VStack>
                                    </HStack>
                                ))}
                            </VStack>
                        </Box>
                    )}

                    {(data?.tasks?.length ?? 0) > 0 && (
                        <Box>
                            <Box px={3} py={2} bg="gray.50" borderBottom="1px solid" borderColor="gray.100">
                                <Text fontSize="xs" fontWeight="semibold" color="gray.500" textTransform="uppercase" letterSpacing="wider">
                                    Tasks
                                </Text>
                            </Box>
                            <VStack align="stretch" gap={0}>
                                {data!.tasks.map((task) => (
                                    <HStack
                                        key={task.id}
                                        px={3}
                                        py={2}
                                        _hover={{ bg: 'blue.50' }}
                                        cursor="pointer"
                                        gap={2}
                                        onClick={() => {
                                            navigate(`/projects/${task.project_id}?task=${task.id}`);
                                            setOpen(false);
                                            setQuery('');
                                        }}
                                    >
                                        <VStack align="start" gap={0} flex={1} minW={0}>
                                            <Text fontSize="sm" fontWeight="medium" noOfLines={1}>
                                                {task.title}
                                            </Text>
                                            <HStack gap={1}>
                                                <Badge
                                                    colorPalette={
                                                        task.priority === 'high'
                                                            ? 'red'
                                                            : task.priority === 'medium'
                                                              ? 'orange'
                                                              : 'green'
                                                    }
                                                    size="xs"
                                                >
                                                    {task.priority}
                                                </Badge>
                                                {task.story_points != null && (
                                                    <Badge size="xs" colorPalette="blue">
                                                        {task.story_points}pts
                                                    </Badge>
                                                )}
                                            </HStack>
                                        </VStack>
                                    </HStack>
                                ))}
                            </VStack>
                        </Box>
                    )}
                </Box>
            )}
        </Box>
    );
}
