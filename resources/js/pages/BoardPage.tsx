import {
    Badge,
    Box,
    Button,
    CardRoot,
    Heading,
    HStack,
    Input,
    Spinner,
    Stack,
    Tab,
    TabList,
    TabPanel,
    TabPanels,
    Tabs,
    Text,
    VStack,
} from '@chakra-ui/react';
import {
    DndContext,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
    PointerSensor,
    closestCorners,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Plus, Users, Zap } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { getBoard, moveTask } from '../api/board';
import { getMembers, inviteMember, removeMember, updateMemberRole } from '../api/members';
import { completeSprint, getSprints, startSprint, deleteSprint } from '../api/sprints';
import { getProject } from '../api/board';
import { CreateSprintModal } from '../components/CreateSprintModal';
import { CreateTaskModal } from '../components/CreateTaskModal';
import { TaskDetailDrawer } from '../components/TaskDetailDrawer';
import type { Column, Member, Sprint, Task } from '../types/board';
import { useAuthStore } from '../store/auth';

const PRIORITY_COLORS: Record<string, string> = {
    low: 'green',
    medium: 'orange',
    high: 'red',
};

// ── Sortable task card ────────────────────────────────────────────────────────
function SortableTaskCard({
    task,
    onClick,
}: {
    task: Task;
    onClick: (id: number) => void;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: task.id,
    });

    return (
        <Box
            ref={setNodeRef}
            style={{ transform: CSS.Transform.toString(transform), transition }}
            opacity={isDragging ? 0.4 : 1}
            bg="white"
            border="1px solid"
            borderColor="gray.200"
            rounded="md"
            p={3}
            cursor="grab"
            _hover={{ borderColor: 'blue.300', shadow: 'sm' }}
            transition="all 0.1s"
            {...attributes}
            {...listeners}
            onClick={(e) => {
                e.stopPropagation();
                onClick(task.id);
            }}
        >
            <VStack align="start" gap={1}>
                <Text fontSize="sm" fontWeight="medium" lineClamp={2}>
                    {task.title}
                </Text>
                <HStack gap={2} pt={1}>
                    <Badge colorPalette={PRIORITY_COLORS[task.priority]} size="xs">
                        {task.priority}
                    </Badge>
                    {task.story_points != null && (
                        <Badge colorPalette="blue" size="xs">
                            {task.story_points}pts
                        </Badge>
                    )}
                </HStack>
            </VStack>
        </Box>
    );
}

// ── Board column ──────────────────────────────────────────────────────────────
function BoardColumn({
    column,
    tasks,
    onCreateTask,
    onClickTask,
}: {
    column: Column;
    tasks: Task[];
    onCreateTask: () => void;
    onClickTask: (id: number) => void;
}) {
    return (
        <Box
            minW="280px"
            maxW="280px"
            bg="gray.50"
            rounded="lg"
            border="1px solid"
            borderColor="gray.200"
            display="flex"
            flexDirection="column"
        >
            <HStack px={3} py={3} borderBottom="1px solid" borderColor="gray.200">
                <Text fontWeight="semibold" fontSize="sm" flex={1}>
                    {column.name}
                </Text>
                <Badge colorPalette="gray" size="sm">
                    {tasks.length}
                </Badge>
            </HStack>
            <Box p={2} flex={1} minH="100px">
                <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                    <VStack gap={2} align="stretch">
                        {tasks.map((task) => (
                            <SortableTaskCard key={task.id} task={task} onClick={onClickTask} />
                        ))}
                    </VStack>
                </SortableContext>
            </Box>
            <Box p={2} borderTop="1px solid" borderColor="gray.100">
                <Button size="xs" variant="ghost" w="100%" onClick={onCreateTask} color="gray.500">
                    <Plus size={12} />
                    Add task
                </Button>
            </Box>
        </Box>
    );
}

// ── Sprint card (backlog view) ────────────────────────────────────────────────
function SprintCard({
    sprint,
    projectId,
    onSelectTask,
}: {
    sprint: Sprint;
    projectId: number;
    onSelectTask: (id: number) => void;
}) {
    const queryClient = useQueryClient();

    const startMut = useMutation({
        mutationFn: () => startSprint(sprint.id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sprints', projectId] }),
    });
    const completeMut = useMutation({
        mutationFn: () => completeSprint(sprint.id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sprints', projectId] }),
    });
    const deleteMut = useMutation({
        mutationFn: () => deleteSprint(sprint.id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sprints', projectId] }),
    });

    const statusColor: Record<string, string> = {
        planned: 'gray',
        active: 'green',
        completed: 'blue',
    };

    return (
        <Box border="1px solid" borderColor="gray.200" rounded="lg" overflow="hidden">
            <HStack px={4} py={3} bg="white" borderBottom="1px solid" borderColor="gray.100" justify="space-between">
                <HStack gap={3}>
                    <Text fontWeight="semibold">{sprint.name}</Text>
                    <Badge colorPalette={statusColor[sprint.status]}>{sprint.status}</Badge>
                    {sprint.tasks_count != null && (
                        <Text fontSize="sm" color="gray.500">
                            {sprint.tasks_count} task{sprint.tasks_count !== 1 ? 's' : ''}
                        </Text>
                    )}
                    {sprint.story_points_total != null && sprint.story_points_total > 0 && (
                        <Badge colorPalette="blue" size="sm">
                            {sprint.story_points_total}pts
                        </Badge>
                    )}
                </HStack>
                <HStack gap={2}>
                    {sprint.starts_at && (
                        <Text fontSize="xs" color="gray.400">
                            {sprint.starts_at} → {sprint.ends_at}
                        </Text>
                    )}
                    {sprint.status === 'planned' && (
                        <>
                            <Button
                                size="xs"
                                colorPalette="green"
                                onClick={() => startMut.mutate()}
                                loading={startMut.isPending}
                            >
                                Start
                            </Button>
                            <Button
                                size="xs"
                                variant="ghost"
                                colorPalette="red"
                                onClick={() => deleteMut.mutate()}
                                loading={deleteMut.isPending}
                            >
                                Delete
                            </Button>
                        </>
                    )}
                    {sprint.status === 'active' && (
                        <Button
                            size="xs"
                            colorPalette="blue"
                            onClick={() => completeMut.mutate()}
                            loading={completeMut.isPending}
                        >
                            Complete
                        </Button>
                    )}
                </HStack>
            </HStack>

            {sprint.tasks && sprint.tasks.length > 0 && (
                <Box bg="gray.50" p={3}>
                    <VStack gap={2} align="stretch">
                        {sprint.tasks.map((task) => (
                            <HStack
                                key={task.id}
                                bg="white"
                                border="1px solid"
                                borderColor="gray.200"
                                rounded="md"
                                px={3}
                                py={2}
                                cursor="pointer"
                                _hover={{ borderColor: 'blue.300' }}
                                onClick={() => onSelectTask(task.id)}
                            >
                                <Text fontSize="sm" flex={1}>
                                    {task.title}
                                </Text>
                                <Badge colorPalette={PRIORITY_COLORS[task.priority]} size="xs">
                                    {task.priority}
                                </Badge>
                                {task.story_points != null && (
                                    <Badge colorPalette="blue" size="xs">
                                        {task.story_points}pts
                                    </Badge>
                                )}
                            </HStack>
                        ))}
                    </VStack>
                </Box>
            )}
            {(!sprint.tasks || sprint.tasks.length === 0) && (
                <Box bg="gray.50" p={6} textAlign="center">
                    <Text fontSize="sm" color="gray.400">
                        No tasks in this sprint
                    </Text>
                </Box>
            )}
        </Box>
    );
}

// ── Members tab ───────────────────────────────────────────────────────────────
function MembersTab({ projectId }: { projectId: number }) {
    const queryClient = useQueryClient();
    const me = useAuthStore((s) => s.user);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('member');

    const { data: members = [], isLoading } = useQuery({
        queryKey: ['members', projectId],
        queryFn: () => getMembers(projectId),
    });

    const inviteMut = useMutation({
        mutationFn: () => inviteMember(projectId, inviteEmail, inviteRole),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['members', projectId] });
            setInviteEmail('');
        },
    });

    const roleMut = useMutation({
        mutationFn: ({ memberId, role }: { memberId: number; role: string }) =>
            updateMemberRole(projectId, memberId, role),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['members', projectId] }),
    });

    const removeMut = useMutation({
        mutationFn: (memberId: number) => removeMember(projectId, memberId),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['members', projectId] }),
    });

    if (isLoading) return <Spinner />;

    return (
        <VStack align="stretch" gap={6}>
            {/* Invite form */}
            <Box bg="white" border="1px solid" borderColor="gray.200" rounded="lg" p={4}>
                <Text fontWeight="semibold" mb={3}>
                    Invite Member
                </Text>
                <HStack gap={3}>
                    <Input
                        placeholder="teammate@example.com"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        type="email"
                        flex={1}
                    />
                    <select
                        value={inviteRole}
                        onChange={(e) => setInviteRole(e.target.value)}
                        style={{
                            padding: '0.5rem 0.75rem',
                            border: '1px solid #e2e8f0',
                            borderRadius: '0.375rem',
                            fontSize: '0.875rem',
                        }}
                    >
                        <option value="admin">Admin</option>
                        <option value="member">Member</option>
                        <option value="viewer">Viewer</option>
                    </select>
                    <Button
                        colorPalette="blue"
                        onClick={() => inviteMut.mutate()}
                        loading={inviteMut.isPending}
                        disabled={!inviteEmail.trim()}
                    >
                        Invite
                    </Button>
                </HStack>
                {inviteMut.isError && (
                    <Text color="red.600" fontSize="sm" mt={2}>
                        {inviteMut.error instanceof Error ? inviteMut.error.message : 'Failed to invite'}
                    </Text>
                )}
            </Box>

            {/* Member list */}
            <VStack align="stretch" gap={3}>
                {members.map((member: Member) => (
                    <HStack
                        key={member.id}
                        bg="white"
                        border="1px solid"
                        borderColor="gray.200"
                        rounded="lg"
                        p={3}
                        justify="space-between"
                    >
                        <HStack gap={3}>
                            <Box
                                w={9}
                                h={9}
                                rounded="full"
                                bg="blue.100"
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                                fontWeight="bold"
                                color="blue.700"
                                fontSize="sm"
                            >
                                {member.user?.name?.charAt(0)?.toUpperCase()}
                            </Box>
                            <VStack align="start" gap={0}>
                                <Text fontWeight="medium" fontSize="sm">
                                    {member.user?.name}
                                    {member.user?.id === me?.id && (
                                        <Text as="span" color="gray.400" fontWeight="normal">
                                            {' '}(you)
                                        </Text>
                                    )}
                                </Text>
                                <Text fontSize="xs" color="gray.500">
                                    {member.user?.email}
                                </Text>
                            </VStack>
                        </HStack>
                        <HStack gap={2}>
                            {member.role === 'owner' ? (
                                <Badge colorPalette="purple">Owner</Badge>
                            ) : (
                                <select
                                    value={member.role}
                                    onChange={(e) =>
                                        roleMut.mutate({ memberId: member.id, role: e.target.value })
                                    }
                                    style={{
                                        padding: '0.25rem 0.5rem',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '0.375rem',
                                        fontSize: '0.75rem',
                                    }}
                                >
                                    <option value="admin">Admin</option>
                                    <option value="member">Member</option>
                                    <option value="viewer">Viewer</option>
                                </select>
                            )}
                            {member.role !== 'owner' && member.user?.id !== me?.id && (
                                <Button
                                    size="xs"
                                    variant="ghost"
                                    colorPalette="red"
                                    onClick={() => removeMut.mutate(member.id)}
                                    loading={removeMut.isPending}
                                >
                                    Remove
                                </Button>
                            )}
                        </HStack>
                    </HStack>
                ))}
            </VStack>
        </VStack>
    );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export function BoardPage() {
    const { projectId } = useParams<{ projectId: string }>();
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const pid = Number(projectId);

    const [selectedTaskId, setSelectedTaskId] = useState<number | null>(() => {
        const t = searchParams.get('task');
        return t ? Number(t) : null;
    });
    const [createTaskOpen, setCreateTaskOpen] = useState(false);
    const [selectedColumnId, setSelectedColumnId] = useState<number | null>(null);
    const [createSprintOpen, setCreateSprintOpen] = useState(false);
    const [activeTaskDrag, setActiveTaskDrag] = useState<Task | null>(null);

    // Sync taskId to URL param
    const openTask = useCallback(
        (id: number) => {
            setSelectedTaskId(id);
            setSearchParams((p) => { p.set('task', String(id)); return p; });
        },
        [setSearchParams],
    );
    const closeTask = useCallback(() => {
        setSelectedTaskId(null);
        setSearchParams((p) => { p.delete('task'); return p; });
    }, [setSearchParams]);

    // ── Project & board data ──
    const { data: project } = useQuery({
        queryKey: ['project', pid],
        queryFn: () => getProject(pid),
        enabled: !!pid,
    });

    const boardId = project?.boards?.[0]?.id;

    const { data: board, isLoading: boardLoading } = useQuery({
        queryKey: ['board', boardId],
        queryFn: () => getBoard(boardId!),
        enabled: !!boardId,
    });

    // Build local column → tasks map from board data
    const [columnsState, setColumnsState] = useState<Map<number, Task[]>>(new Map());

    useEffect(() => {
        if (board?.columns) {
            const map = new Map<number, Task[]>();
            for (const col of board.columns) {
                map.set(col.id, col.tasks ?? []);
            }
            setColumnsState(map);
        }
    }, [board]);

    // ── Sprints data ──
    const { data: sprints = [] } = useQuery({
        queryKey: ['sprints', pid],
        queryFn: () => getSprints(pid),
        enabled: !!pid,
    });

    // ── DnD ──
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

    const handleDragStart = (event: DragStartEvent) => {
        const taskId = event.active.id as number;
        for (const tasks of columnsState.values()) {
            const found = tasks.find((t) => t.id === taskId);
            if (found) { setActiveTaskDrag(found); break; }
        }
    };

    const moveMut = useMutation({
        mutationFn: ({ taskId, columnId, position }: { taskId: number; columnId: number; position: number }) =>
            moveTask(taskId, columnId, position),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['board', boardId] }),
    });

    const handleDragEnd = (event: DragEndEvent) => {
        setActiveTaskDrag(null);
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const activeId = active.id as number;
        const overId = over.id as number;

        // Find source column
        let sourceColId = -1;
        let destColId = -1;

        for (const [colId, tasks] of columnsState.entries()) {
            if (tasks.find((t) => t.id === activeId)) sourceColId = colId;
            if (tasks.find((t) => t.id === overId)) destColId = colId;
        }

        // Also support dropping onto a column itself (overId may be a column id)
        if (destColId === -1 && columnsState.has(overId)) destColId = overId;

        if (sourceColId === -1) return;
        if (destColId === -1) destColId = sourceColId;

        setColumnsState((prev) => {
            const next = new Map(prev);
            const sourceTasks = [...(next.get(sourceColId) ?? [])];
            const destTasks = sourceColId === destColId ? sourceTasks : [...(next.get(destColId) ?? [])];

            const oldIndex = sourceTasks.findIndex((t) => t.id === activeId);
            const newIndex = destTasks.findIndex((t) => t.id === overId);

            if (sourceColId === destColId) {
                next.set(sourceColId, arrayMove(sourceTasks, oldIndex, newIndex < 0 ? destTasks.length : newIndex));
            } else {
                const [movedTask] = sourceTasks.splice(oldIndex, 1);
                movedTask.column_id = destColId;
                const insertAt = newIndex < 0 ? destTasks.length : newIndex;
                destTasks.splice(insertAt, 0, movedTask);
                next.set(sourceColId, sourceTasks);
                next.set(destColId, destTasks);
            }

            // Fire API call
            const finalDestTasks = next.get(destColId) ?? [];
            const finalPos = finalDestTasks.findIndex((t) => t.id === activeId);
            moveMut.mutate({ taskId: activeId, columnId: destColId, position: finalPos });

            return next;
        });
    };

    // ── Backlog tasks (no sprint) ──
    const allTasks = Array.from(columnsState.values()).flat();
    const backlogTasks = allTasks.filter((t) => !t.sprint_id);

    return (
        <Box minH="100vh" bg="gray.50" display="flex" flexDirection="column">
            {/* Header */}
            <Box bg="white" borderBottom="1px solid" borderColor="gray.200" px={6} py={3}>
                <HStack gap={4}>
                    <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
                        <ChevronLeft size={16} />
                        Back
                    </Button>
                    <Box w="1px" h={5} bg="gray.200" />
                    <Heading size="md">{project?.name ?? '…'}</Heading>
                    {project?.my_role && (
                        <Badge colorPalette="blue" size="sm">
                            {project.my_role}
                        </Badge>
                    )}
                </HStack>
            </Box>

            {/* Tabs */}
            <Box flex={1} overflow="hidden">
                <Tabs variant="line" colorPalette="blue" h="100%">
                    <TabList px={6} bg="white" borderBottom="1px solid" borderColor="gray.200">
                        <Tab>
                            <Zap size={14} />
                            Board
                        </Tab>
                        <Tab>
                            <Zap size={14} />
                            Backlog & Sprints
                        </Tab>
                        <Tab>
                            <Users size={14} />
                            Members
                        </Tab>
                    </TabList>

                    <TabPanels h="calc(100% - 42px)" overflowY="auto">
                        {/* ── Board tab ── */}
                        <TabPanel p={0} h="100%">
                            {boardLoading ? (
                                <Box display="flex" justifyContent="center" py={16}>
                                    <Spinner />
                                </Box>
                            ) : (
                                <Box overflowX="auto" p={6} h="100%">
                                    <DndContext
                                        sensors={sensors}
                                        collisionDetection={closestCorners}
                                        onDragStart={handleDragStart}
                                        onDragEnd={handleDragEnd}
                                    >
                                        <HStack align="start" gap={4} h="100%">
                                            {board?.columns?.map((column) => (
                                                <BoardColumn
                                                    key={column.id}
                                                    column={column}
                                                    tasks={columnsState.get(column.id) ?? []}
                                                    onCreateTask={() => {
                                                        setSelectedColumnId(column.id);
                                                        setCreateTaskOpen(true);
                                                    }}
                                                    onClickTask={openTask}
                                                />
                                            ))}
                                        </HStack>

                                        <DragOverlay>
                                            {activeTaskDrag && (
                                                <Box
                                                    bg="white"
                                                    border="2px solid"
                                                    borderColor="blue.400"
                                                    rounded="md"
                                                    p={3}
                                                    shadow="xl"
                                                    w="280px"
                                                >
                                                    <Text fontSize="sm" fontWeight="medium">
                                                        {activeTaskDrag.title}
                                                    </Text>
                                                </Box>
                                            )}
                                        </DragOverlay>
                                    </DndContext>
                                </Box>
                            )}
                        </TabPanel>

                        {/* ── Backlog & Sprints tab ── */}
                        <TabPanel p={6}>
                            <VStack align="stretch" gap={6}>
                                <HStack justify="space-between">
                                    <Heading size="sm">Sprints</Heading>
                                    <Button
                                        size="sm"
                                        colorPalette="blue"
                                        onClick={() => setCreateSprintOpen(true)}
                                    >
                                        <Plus size={14} />
                                        New Sprint
                                    </Button>
                                </HStack>

                                {sprints.length === 0 && (
                                    <Box bg="gray.100" rounded="lg" p={8} textAlign="center">
                                        <Text color="gray.500">No sprints yet. Create your first one!</Text>
                                    </Box>
                                )}

                                <VStack align="stretch" gap={3}>
                                    {sprints.map((sprint: Sprint) => (
                                        <SprintCard
                                            key={sprint.id}
                                            sprint={sprint}
                                            projectId={pid}
                                            onSelectTask={openTask}
                                        />
                                    ))}
                                </VStack>

                                {/* Backlog */}
                                <Box>
                                    <HStack justify="space-between" mb={3}>
                                        <Heading size="sm">Backlog</Heading>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => {
                                                setSelectedColumnId(null);
                                                setCreateTaskOpen(true);
                                            }}
                                        >
                                            <Plus size={14} />
                                            Add Task
                                        </Button>
                                    </HStack>
                                    {backlogTasks.length === 0 ? (
                                        <Box bg="gray.100" rounded="lg" p={8} textAlign="center">
                                            <Text color="gray.500" fontSize="sm">No backlog tasks</Text>
                                        </Box>
                                    ) : (
                                        <Stack gap={2}>
                                            {backlogTasks.map((task) => (
                                                <CardRoot
                                                    key={task.id}
                                                    p={3}
                                                    cursor="pointer"
                                                    _hover={{ shadow: 'sm', borderColor: 'blue.300' }}
                                                    border="1px solid"
                                                    borderColor="gray.200"
                                                    onClick={() => openTask(task.id)}
                                                >
                                                    <HStack justify="space-between">
                                                        <Text fontSize="sm" fontWeight="medium">
                                                            {task.title}
                                                        </Text>
                                                        <HStack gap={2}>
                                                            <Badge colorPalette={PRIORITY_COLORS[task.priority]} size="xs">
                                                                {task.priority}
                                                            </Badge>
                                                            {task.story_points != null && (
                                                                <Badge colorPalette="blue" size="xs">
                                                                    {task.story_points}pts
                                                                </Badge>
                                                            )}
                                                        </HStack>
                                                    </HStack>
                                                </CardRoot>
                                            ))}
                                        </Stack>
                                    )}
                                </Box>
                            </VStack>
                        </TabPanel>

                        {/* ── Members tab ── */}
                        <TabPanel p={6}>
                            <MembersTab projectId={pid} />
                        </TabPanel>
                    </TabPanels>
                </Tabs>
            </Box>

            {/* Modals & Drawer */}
            <CreateTaskModal
                open={createTaskOpen}
                columnId={selectedColumnId}
                projectId={pid}
                onClose={() => setCreateTaskOpen(false)}
            />

            <CreateSprintModal
                open={createSprintOpen}
                projectId={pid}
                onClose={() => setCreateSprintOpen(false)}
            />

            <TaskDetailDrawer taskId={selectedTaskId} onClose={closeTask} />
        </Box>
    );
}
