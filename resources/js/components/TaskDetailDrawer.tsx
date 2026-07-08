import {
    Badge,
    Box,
    Button,
    HStack,
    Input,
    Spinner,
    Stack,
    Text,
    Textarea,
    VStack,
} from '@chakra-ui/react';
import { DrawerBackdrop, DrawerBody, DrawerCloseTrigger, DrawerContent, DrawerHeader, DrawerRoot } from '@chakra-ui/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, Play, Trophy, Users, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getComments, createComment, deleteComment } from '../api/comments';
import {
    acceptPokerSession,
    getActivePokerSession,
    getPokerSession,
    revealPokerSession,
    startPokerSession,
    votePokerSession,
} from '../api/poker';
import { getTask, updateTask } from '../api/board';
import { useAuthStore } from '../store/auth';
import type { Task, PokerSession } from '../types/board';

interface TaskDetailDrawerProps {
    taskId: number | null;
    onClose: () => void;
}

const PRIORITY_COLORS: Record<string, string> = {
    low: 'green',
    medium: 'orange',
    high: 'red',
};

const POKER_CARDS = ['0', '1', '2', '3', '5', '8', '13', '21', '34', '55', '100', '?', 'coffee'];
const CARD_LABELS: Record<string, string> = { coffee: '☕' };

export function TaskDetailDrawer({ taskId, onClose }: TaskDetailDrawerProps) {
    const queryClient = useQueryClient();
    const user = useAuthStore((s) => s.user);

    // ── Task data ──────────────────────────────────────────────────────
    const { data: task, isLoading: taskLoading } = useQuery({
        queryKey: ['task', taskId],
        queryFn: () => getTask(taskId!),
        enabled: taskId !== null,
        staleTime: 0,
    });

    // ── Editable fields ────────────────────────────────────────────────
    const [editTitle, setEditTitle] = useState('');
    const [editDesc, setEditDesc] = useState('');
    const [editingTitle, setEditingTitle] = useState(false);
    const [editingDesc, setEditingDesc] = useState(false);

    useEffect(() => {
        if (task) {
            setEditTitle(task.title);
            setEditDesc(task.description ?? '');
        }
    }, [task]);

    const updateMut = useMutation({
        mutationFn: (data: Partial<Task>) => updateTask(taskId!, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['task', taskId] });
            queryClient.invalidateQueries({ queryKey: ['board'] });
        },
    });

    const saveTitle = () => {
        if (editTitle.trim() && editTitle !== task?.title) {
            updateMut.mutate({ title: editTitle.trim() });
        }
        setEditingTitle(false);
    };

    const saveDesc = () => {
        if (editDesc !== task?.description) {
            updateMut.mutate({ description: editDesc });
        }
        setEditingDesc(false);
    };

    // ── Comments ───────────────────────────────────────────────────────
    const { data: comments = [] } = useQuery({
        queryKey: ['comments', taskId],
        queryFn: () => getComments(taskId!),
        enabled: taskId !== null,
    });

    const [commentText, setCommentText] = useState('');
    const commentMut = useMutation({
        mutationFn: () => createComment(taskId!, commentText.trim()),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['comments', taskId] });
            setCommentText('');
        },
    });

    const deleteCommentMut = useMutation({
        mutationFn: (id: number) => deleteComment(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['comments', taskId] }),
    });

    // ── Planning Poker ─────────────────────────────────────────────────
    const [activeSession, setActiveSession] = useState<PokerSession | null>(null);
    const [pokerSessionId, setPokerSessionId] = useState<number | null>(null);

    const { data: pokerData, refetch: refetchPoker } = useQuery({
        queryKey: ['poker', taskId],
        queryFn: () => getActivePokerSession(taskId!),
        enabled: taskId !== null,
        refetchInterval: activeSession?.status === 'voting' || activeSession?.status === 'revealed' ? 2000 : false,
    });

    useEffect(() => {
        if (pokerData) {
            setActiveSession(pokerData);
            setPokerSessionId(pokerData.id);
        }
    }, [pokerData]);

    const { data: fullSession } = useQuery({
        queryKey: ['poker-session', pokerSessionId],
        queryFn: () => getPokerSession(pokerSessionId!),
        enabled: pokerSessionId !== null && activeSession?.status !== 'accepted',
        refetchInterval: activeSession?.status === 'voting' || activeSession?.status === 'revealed' ? 2000 : false,
    });

    const session = fullSession ?? activeSession;

    const startPokerMut = useMutation({
        mutationFn: () => startPokerSession(taskId!),
        onSuccess: (data) => {
            setActiveSession(data);
            setPokerSessionId(data.id);
            queryClient.invalidateQueries({ queryKey: ['poker', taskId] });
        },
    });

    const voteMut = useMutation({
        mutationFn: (vote: string) => votePokerSession(session!.id, vote),
        onSuccess: () => refetchPoker(),
    });

    const revealMut = useMutation({
        mutationFn: () => revealPokerSession(session!.id),
        onSuccess: (data) => {
            setActiveSession(data);
            queryClient.invalidateQueries({ queryKey: ['poker-session', session?.id] });
        },
    });

    const acceptMut = useMutation({
        mutationFn: (pts: number) => acceptPokerSession(session!.id, pts),
        onSuccess: () => {
            setActiveSession(null);
            setPokerSessionId(null);
            queryClient.invalidateQueries({ queryKey: ['task', taskId] });
            queryClient.invalidateQueries({ queryKey: ['poker', taskId] });
        },
    });

    const myVote = session?.votes?.find((v) => v.user?.id === user?.id);
    const votedCount = session?.votes?.filter((v) => v.has_voted).length ?? 0;

    return (
        <DrawerRoot open={taskId !== null} onOpenChange={(d) => !d.open && onClose()} size="lg">
            <DrawerBackdrop />
            <DrawerContent>
                <DrawerHeader borderBottomWidth="1px">
                    <HStack justify="space-between">
                        <Text fontWeight="semibold" fontSize="sm" color="gray.500">
                            Task Details
                        </Text>
                        <DrawerCloseTrigger />
                    </HStack>
                </DrawerHeader>

                <DrawerBody>
                    {taskLoading && (
                        <Box display="flex" justifyContent="center" py={12}>
                            <Spinner />
                        </Box>
                    )}

                    {task && (
                        <VStack align="stretch" gap={6} py={2}>
                            {/* ── Title ── */}
                            <Box>
                                {editingTitle ? (
                                    <Input
                                        value={editTitle}
                                        onChange={(e) => setEditTitle(e.target.value)}
                                        onBlur={saveTitle}
                                        onKeyDown={(e) => e.key === 'Enter' && saveTitle()}
                                        autoFocus
                                        fontSize="xl"
                                        fontWeight="bold"
                                        border="none"
                                        borderBottom="2px solid"
                                        borderColor="blue.400"
                                        rounded={0}
                                        px={0}
                                        _focus={{ boxShadow: 'none' }}
                                    />
                                ) : (
                                    <Text
                                        fontSize="xl"
                                        fontWeight="bold"
                                        cursor="text"
                                        _hover={{ bg: 'gray.50' }}
                                        p={1}
                                        rounded="md"
                                        onClick={() => setEditingTitle(true)}
                                    >
                                        {task.title}
                                    </Text>
                                )}
                            </Box>

                            {/* ── Meta badges ── */}
                            <HStack gap={2} flexWrap="wrap">
                                <Badge colorPalette={PRIORITY_COLORS[task.priority] ?? 'gray'} size="md">
                                    {task.priority} priority
                                </Badge>
                                {task.story_points != null && (
                                    <Badge colorPalette="blue" size="md">
                                        {task.story_points} pts
                                    </Badge>
                                )}
                                {task.sprint && (
                                    <Badge colorPalette="purple" size="md">
                                        {task.sprint.name}
                                    </Badge>
                                )}
                                {task.due_date && (
                                    <Badge colorPalette="gray" size="md">
                                        Due {task.due_date}
                                    </Badge>
                                )}
                            </HStack>

                            {/* ── Description ── */}
                            <Box>
                                <HStack mb={2}>
                                    <Text fontSize="sm" fontWeight="semibold" color="gray.700">
                                        Description
                                    </Text>
                                </HStack>
                                {editingDesc ? (
                                    <VStack align="stretch" gap={2}>
                                        <Textarea
                                            value={editDesc}
                                            onChange={(e) => setEditDesc(e.target.value)}
                                            rows={5}
                                            autoFocus
                                        />
                                        <HStack gap={2}>
                                            <Button size="sm" colorPalette="blue" onClick={saveDesc}>
                                                Save
                                            </Button>
                                            <Button size="sm" variant="ghost" onClick={() => setEditingDesc(false)}>
                                                Cancel
                                            </Button>
                                        </HStack>
                                    </VStack>
                                ) : (
                                    <Box
                                        minH={16}
                                        p={3}
                                        rounded="md"
                                        border="1px solid"
                                        borderColor="gray.200"
                                        cursor="text"
                                        _hover={{ borderColor: 'blue.300' }}
                                        onClick={() => setEditingDesc(true)}
                                    >
                                        {task.description ? (
                                            <Text fontSize="sm" whiteSpace="pre-wrap">
                                                {task.description}
                                            </Text>
                                        ) : (
                                            <Text fontSize="sm" color="gray.400">
                                                Click to add a description…
                                            </Text>
                                        )}
                                    </Box>
                                )}
                            </Box>

                            {/* ── Planning Poker ── */}
                            <Box borderTop="1px solid" borderColor="gray.100" pt={4}>
                                <HStack mb={3}>
                                    <Zap size={16} />
                                    <Text fontWeight="semibold" fontSize="sm">
                                        Planning Poker
                                    </Text>
                                </HStack>

                                {!session || session.status === 'accepted' ? (
                                    <VStack align="stretch" gap={2}>
                                        {session?.status === 'accepted' && (
                                            <HStack bg="green.50" p={3} rounded="md" gap={2}>
                                                <Trophy size={16} color="green" />
                                                <Text fontSize="sm" color="green.700" fontWeight="medium">
                                                    Final estimate accepted: {task.story_points} pts
                                                </Text>
                                            </HStack>
                                        )}
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            colorPalette="purple"
                                            onClick={() => startPokerMut.mutate()}
                                            loading={startPokerMut.isPending}
                                            w="fit-content"
                                        >
                                            <Play size={14} />
                                            {session?.status === 'accepted' ? 'Re-estimate' : 'Start Planning Poker'}
                                        </Button>
                                    </VStack>
                                ) : (
                                    <VStack align="stretch" gap={4}>
                                        {/* Voter status */}
                                        <HStack gap={2}>
                                            <Users size={14} />
                                            <Text fontSize="sm" color="gray.600">
                                                {votedCount} of {session.votes?.length ?? 0} voted
                                            </Text>
                                            {session.status === 'voting' && (
                                                <Badge colorPalette="yellow">Voting…</Badge>
                                            )}
                                            {session.status === 'revealed' && (
                                                <Badge colorPalette="green">Revealed</Badge>
                                            )}
                                        </HStack>

                                        {/* Card grid */}
                                        {session.status === 'voting' && (
                                            <Box>
                                                <Text fontSize="xs" color="gray.500" mb={2}>
                                                    {myVote?.value ? `Your vote: ${myVote.value}` : 'Pick your estimate:'}
                                                </Text>
                                                <Box display="flex" flexWrap="wrap" gap={2}>
                                                    {POKER_CARDS.map((card) => (
                                                        <Button
                                                            key={card}
                                                            size="sm"
                                                            variant={myVote?.value === card ? 'solid' : 'outline'}
                                                            colorPalette={myVote?.value === card ? 'blue' : 'gray'}
                                                            minW={10}
                                                            onClick={() => voteMut.mutate(card)}
                                                            loading={voteMut.isPending}
                                                        >
                                                            {CARD_LABELS[card] ?? card}
                                                        </Button>
                                                    ))}
                                                </Box>
                                            </Box>
                                        )}

                                        {/* Reveal votes table */}
                                        {session.status === 'revealed' && session.votes?.length > 0 && (
                                            <Box>
                                                <VStack align="stretch" gap={1} mb={3}>
                                                    {session.votes.map((vote) => (
                                                        <HStack
                                                            key={vote.id}
                                                            justify="space-between"
                                                            bg="gray.50"
                                                            px={3}
                                                            py={2}
                                                            rounded="md"
                                                        >
                                                            <Text fontSize="sm">{vote.user?.name}</Text>
                                                            <Badge colorPalette="blue">
                                                                {vote.value != null ? (CARD_LABELS[vote.value] ?? vote.value) : '–'}
                                                            </Badge>
                                                        </HStack>
                                                    ))}
                                                </VStack>
                                                {session.average != null && (
                                                    <HStack bg="blue.50" p={3} rounded="md" justify="space-between">
                                                        <Text fontSize="sm" fontWeight="medium">
                                                            Average
                                                        </Text>
                                                        <Badge colorPalette="blue" size="lg">
                                                            {session.average}
                                                        </Badge>
                                                    </HStack>
                                                )}
                                                <Text fontSize="xs" color="gray.500" mt={2} mb={1}>
                                                    Accept an estimate:
                                                </Text>
                                                <Box display="flex" flexWrap="wrap" gap={2}>
                                                    {POKER_CARDS.filter((c) => c !== '?' && c !== 'coffee').map((card) => (
                                                        <Button
                                                            key={card}
                                                            size="sm"
                                                            variant="outline"
                                                            colorPalette="green"
                                                            minW={10}
                                                            onClick={() => acceptMut.mutate(Number(card))}
                                                            loading={acceptMut.isPending}
                                                        >
                                                            {card}
                                                        </Button>
                                                    ))}
                                                </Box>
                                            </Box>
                                        )}

                                        {/* Reveal button (for session creator) */}
                                        {session.status === 'voting' && (
                                            <Button
                                                size="sm"
                                                colorPalette="purple"
                                                onClick={() => revealMut.mutate()}
                                                loading={revealMut.isPending}
                                                w="fit-content"
                                            >
                                                Reveal Votes
                                            </Button>
                                        )}
                                    </VStack>
                                )}
                            </Box>

                            {/* ── Comments ── */}
                            <Box borderTop="1px solid" borderColor="gray.100" pt={4}>
                                <HStack mb={3}>
                                    <MessageSquare size={16} />
                                    <Text fontWeight="semibold" fontSize="sm">
                                        Comments
                                    </Text>
                                    <Badge colorPalette="gray" size="sm">
                                        {comments.length}
                                    </Badge>
                                </HStack>

                                <VStack align="stretch" gap={3} mb={4}>
                                    {comments.map((comment) => (
                                        <Box
                                            key={comment.id}
                                            bg="gray.50"
                                            rounded="md"
                                            p={3}
                                            borderLeft="3px solid"
                                            borderColor="blue.200"
                                        >
                                            <HStack justify="space-between" mb={1}>
                                                <Text fontSize="xs" fontWeight="semibold" color="gray.700">
                                                    {comment.user?.name}
                                                </Text>
                                                <HStack gap={2}>
                                                    <Text fontSize="xs" color="gray.400">
                                                        {new Date(comment.created_at).toLocaleDateString()}
                                                    </Text>
                                                    {comment.user?.id === user?.id && (
                                                        <Button
                                                            size="xs"
                                                            variant="ghost"
                                                            colorPalette="red"
                                                            onClick={() => deleteCommentMut.mutate(comment.id)}
                                                        >
                                                            ✕
                                                        </Button>
                                                    )}
                                                </HStack>
                                            </HStack>
                                            <Text fontSize="sm" whiteSpace="pre-wrap">
                                                {comment.content}
                                            </Text>
                                        </Box>
                                    ))}
                                </VStack>

                                <Stack gap={2}>
                                    <Textarea
                                        placeholder="Write a comment…"
                                        value={commentText}
                                        onChange={(e) => setCommentText(e.target.value)}
                                        rows={3}
                                        fontSize="sm"
                                    />
                                    <Button
                                        size="sm"
                                        colorPalette="blue"
                                        disabled={!commentText.trim()}
                                        loading={commentMut.isPending}
                                        onClick={() => commentMut.mutate()}
                                        w="fit-content"
                                    >
                                        Post Comment
                                    </Button>
                                </Stack>
                            </Box>
                        </VStack>
                    )}
                </DrawerBody>
            </DrawerContent>
        </DrawerRoot>
    );
}
