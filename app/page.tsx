"use client";

import { AnimatePresence, motion, type Variants } from "framer-motion";
import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import toast, { Toaster } from "react-hot-toast";
import { ArrowRight, CalendarDays, ClipboardList, FileText, Flag, Moon, PieChart, Sun, Users, TrendingUp, TrendingDown } from "lucide-react";

type Role = "ops" | "moderator";
type Session = { name: string; role: Role };
type Meeting = { id: string; title: string; datetime: string; agenda: string; link: string; status?: "active" | "completed" };
type Task = { id: string; title: string; type: "question" | "excel" | "research"; detail: string; due: string; assignedTo: string; status: "pending" | "completed"; response?: string; fileName?: string };
type Announcement = { id: string; message: string; urgent: boolean; pinned: boolean; createdAt: string; audience?: "specific" | "general"; recipient?: string };
type LeaderboardItem = { name: string; position: number; points: number; status: string };
type OpsSectionId = "overview" | "meetings" | "tasks" | "forms" | "leaderboard" | "announcements" | "settings";
type TaskAssignmentMode = "specific" | "general";
type AnnouncementAudienceMode = "specific" | "general";

const OPS_PASSWORD = "HOO@07";
const MODERATOR_NAMES = ["Harshul", "Harini", "Harshith", "Praneeth", "Sunidhi", "Utkarsh"];
const SECTIONS: { id: OpsSectionId; label: string; icon: typeof PieChart }[] = [
  { id: "overview", label: "Overview", icon: PieChart },
  { id: "meetings", label: "Meetings", icon: CalendarDays },
  { id: "tasks", label: "Task Control", icon: ClipboardList },
  { id: "forms", label: "Google Forms", icon: FileText },
  { id: "leaderboard", label: "Leaderboard", icon: Flag },
  { id: "announcements", label: "Announcements", icon: Users },
  { id: "settings", label: "Settings", icon: Sun },
];
const INITIAL_LEADERBOARD: LeaderboardItem[] = [
  { name: "Harshul", position: 1, points: 420, status: "Active" },
  { name: "Harini", position: 2, points: 390, status: "Focused" },
  { name: "Harshith", position: 3, points: 356, status: "On track" },
  { name: "Praneeth", position: 4, points: 328, status: "Ready" },
  { name: "Sunidhi", position: 5, points: 301, status: "Alert" },
  { name: "Utkarsh", position: 6, points: 278, status: "Stable" },
];
const createId = () => `id-${Math.random().toString(36).slice(2, 10)}`;
const isMeetingActive = (meeting: Meeting) => meeting.status !== "completed";
const containerVariants: Variants = { 
  hidden: { opacity: 0 }, 
  visible: { 
    opacity: 1, 
    transition: { 
      staggerChildren: 0.08, 
      delayChildren: 0.1,
      type: "spring",
      damping: 20,
      stiffness: 100
    } 
  } 
};
const itemVariants: Variants = { 
  hidden: { opacity: 0, y: 16, filter: "blur(4px)" }, 
  visible: { 
    opacity: 1, 
    y: 0, 
    filter: "blur(0px)",
    transition: { 
      duration: 0.6, 
      ease: [0.23, 1, 0.32, 1]
    } 
  } 
};

export default function Home() {
  const mounted = true;
  const [theme, setTheme] = useState<"dark" | "colorful">(() => {
    if (typeof window === "undefined") return "dark";
    const storedTheme = window.localStorage.getItem("vps-ops-theme");
    return storedTheme === "dark" || storedTheme === "colorful" ? storedTheme : "dark";
  });
  const [session, setSession] = useState<Session | null>(null);
  const [openModeratorModal, setOpenModeratorModal] = useState(false);
  const [openOpsModal, setOpenOpsModal] = useState(false);
  const [openMeetingModal, setOpenMeetingModal] = useState(false);
  const [openTaskModal, setOpenTaskModal] = useState(false);
  const [openFormModal, setOpenFormModal] = useState(false);
  const [openAnnouncementModal, setOpenAnnouncementModal] = useState(false);
  const [activeSection, setActiveSection] = useState<OpsSectionId>("overview");
  const [selectedName, setSelectedName] = useState<string>(MODERATOR_NAMES[0]);
  const [password, setPassword] = useState("");
  const [opsName, setOpsName] = useState("");
  const [opsPassword, setOpsPassword] = useState("");
  const [googleFormLink, setGoogleFormLink] = useState(() => {
    if (typeof window === "undefined") return "";
    return window.localStorage.getItem("vps-ops-google-form") ?? "";
  });
  const [meetingDraft, setMeetingDraft] = useState<Partial<Meeting>>({ title: "", datetime: "", agenda: "", link: "" });
  const [taskDraft, setTaskDraft] = useState<Partial<Task>>({ title: "", type: "question", detail: "", due: "", assignedTo: MODERATOR_NAMES[0] });
  const [taskAssignmentMode, setTaskAssignmentMode] = useState<TaskAssignmentMode>("specific");
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [announcementDraft, setAnnouncementDraft] = useState("");
  const [announcementAudienceMode, setAnnouncementAudienceMode] = useState<AnnouncementAudienceMode>("specific");
  const [announcementRecipient, setAnnouncementRecipient] = useState(MODERATOR_NAMES[0]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>(INITIAL_LEADERBOARD);
  const [newParticipantName, setNewParticipantName] = useState("");
  const [newParticipantPoints, setNewParticipantPoints] = useState("0");

  // Cursor tracking
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = e.clientX;
      const y = e.clientY;
      document.documentElement.style.setProperty('--cursor-x', `${x}px`);
      document.documentElement.style.setProperty('--cursor-y', `${y}px`);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const restoreSession = () => {
      const stored = localStorage.getItem("vps-ops-session");
      if (stored) {
        try {
          setSession(JSON.parse(stored) as Session | null);
        } catch {
          localStorage.removeItem("vps-ops-session");
        }
      }
    };

    const restoreMeetings = () => {
      const stored = localStorage.getItem("vps-ops-meetings");
      if (stored) {
        try {
          setMeetings(JSON.parse(stored) as Meeting[]);
        } catch {
          localStorage.removeItem("vps-ops-meetings");
        }
      }
    };

    const restoreTasks = () => {
      const stored = localStorage.getItem("vps-ops-tasks");
      if (stored) {
        try {
          setTasks(JSON.parse(stored) as Task[]);
        } catch {
          localStorage.removeItem("vps-ops-tasks");
        }
      }
    };

    const restoreAnnouncements = () => {
      const stored = localStorage.getItem("vps-ops-announcements");
      if (stored) {
        try {
          setAnnouncements(JSON.parse(stored) as Announcement[]);
        } catch {
          localStorage.removeItem("vps-ops-announcements");
        }
      }
    };

    const restoreLeaderboard = () => {
      const stored = localStorage.getItem("vps-ops-leaderboard");
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as LeaderboardItem[];
          if (Array.isArray(parsed)) setLeaderboard(parsed);
        } catch {
          localStorage.removeItem("vps-ops-leaderboard");
        }
      }
    };

    restoreSession();
    restoreMeetings();
    restoreTasks();
    restoreAnnouncements();

    restoreLeaderboard();
  }, []);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("vps-ops-theme", theme);
    document.documentElement.dataset.theme = theme;
  }, [theme, mounted]);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("vps-ops-session", JSON.stringify(session));
  }, [session, mounted]);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("vps-ops-meetings", JSON.stringify(meetings));
  }, [meetings, mounted]);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("vps-ops-tasks", JSON.stringify(tasks));
  }, [tasks, mounted]);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("vps-ops-announcements", JSON.stringify(announcements));
  }, [announcements, mounted]);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("vps-ops-google-form", googleFormLink);
  }, [googleFormLink, mounted]);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("vps-ops-leaderboard", JSON.stringify(leaderboard));
  }, [leaderboard, mounted]);

  const pendingTasks = useMemo(() => tasks.filter((item) => item.status === "pending"), [tasks]);
  const completedTasks = useMemo(() => tasks.filter((item) => item.status === "completed"), [tasks]);
  const moderatorVisibleTasks = useMemo(
    () => tasks.filter((item) => item.status === "pending" && (item.assignedTo === "All Moderators" || item.assignedTo === session?.name)),
    [tasks, session?.name]
  );
  const activeMeetings = useMemo(() => {
    return [...meetings]
      .filter(isMeetingActive)
      .sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());
  }, [meetings]);
  const activeMeeting = useMemo(() => activeMeetings[0] ?? null, [activeMeetings]);
  const moderatorPosition = useMemo(() => leaderboard.find((item) => item.name === session?.name)?.position ?? null, [leaderboard, session]);

  const normalizeLeaderboard = (items: LeaderboardItem[]) => {
    const sorted = [...items]
      .map((item) => ({ ...item, points: Number.isFinite(item.points) ? item.points : 0 }))
      .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name));

    return sorted.map((item, index) => ({ ...item, position: index + 1 }));
  };

  const handleAddParticipant = () => {
    const trimmedName = newParticipantName.trim();
    const parsedPoints = Number(newParticipantPoints);

    if (!trimmedName) {
      toast.error("Enter a participant name.");
      return;
    }

    if (!Number.isFinite(parsedPoints)) {
      toast.error("Enter a valid point value.");
      return;
    }

    setLeaderboard((current) => normalizeLeaderboard([...current, { name: trimmedName, position: 0, points: parsedPoints, status: "New" }]));
    setNewParticipantName("");
    setNewParticipantPoints("0");
    toast.success("Participant added to leaderboard.");
  };

  const handleRemoveParticipant = (participantName: string) => {
    setLeaderboard((current) => normalizeLeaderboard(current.filter((item) => item.name !== participantName)));
    toast.success("Participant removed from leaderboard.");
  };

  const handleAdjustParticipantPoints = (participantName: string, delta: number) => {
    setLeaderboard((current) =>
      normalizeLeaderboard(current.map((item) => (item.name === participantName ? { ...item, points: item.points + delta } : item)))
    );
  };

  const handleEditParticipantPoints = (participantName: string, value: string) => {
    const parsedPoints = Number(value);
    if (!Number.isFinite(parsedPoints)) return;

    setLeaderboard((current) =>
      normalizeLeaderboard(current.map((item) => (item.name === participantName ? { ...item, points: parsedPoints } : item)))
    );
  };

  const handleThemeToggle = () => setTheme((current) => (current === "dark" ? "colorful" : "dark"));

  const handleModeratorLogin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const expected = `${selectedName.toUpperCase()}@01`;
    if (!password.trim()) {
      toast.error("Enter your password to continue.");
      return;
    }
    if (password.trim() !== expected) {
      toast.error("Credentials do not match.");
      return;
    }
    setSession({ name: selectedName, role: "moderator" });
    setPassword("");
    setOpenModeratorModal(false);
    toast.success("Access granted.");
  };

  const handleOpsLogin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!opsName.trim() || !opsPassword.trim()) {
      toast.error("Enter name and password.");
      return;
    }
    if (opsPassword.trim() !== OPS_PASSWORD) {
      toast.error("Invalid credentials.");
      return;
    }
    setSession({ name: opsName.trim(), role: "ops" });
    setOpsName("");
    setOpsPassword("");
    setOpenOpsModal(false);
    toast.success("OPS access granted.");
  };

  const handleSignOut = () => {
    setSession(null);
    setPassword("");
    setOpsPassword("");
    setOpenOpsModal(false);
    setOpenModeratorModal(false);
    toast("Session closed.");
  };

  const handleCreateMeeting = () => {
    if (!meetingDraft.title?.trim() || !meetingDraft.datetime?.trim() || !meetingDraft.agenda?.trim() || !meetingDraft.link?.trim()) {
      toast.error("Complete every field.");
      return;
    }
    setMeetings((current) => [
      {
        id: createId(),
        title: meetingDraft.title!.trim(),
        datetime: meetingDraft.datetime!.trim(),
        agenda: meetingDraft.agenda!.trim(),
        link: meetingDraft.link!.trim(),
        status: "active",
      },
      ...current,
    ]);
    setMeetingDraft({ title: "", datetime: "", agenda: "", link: "" });
    setOpenMeetingModal(false);
    toast.success("Meeting created.");
  };

  const handleCompleteMeeting = (meetingId: string) => {
    setMeetings((current) =>
      current.map((meeting) =>
        meeting.id === meetingId ? { ...meeting, status: "completed", link: "" } : meeting
      )
    );
    toast.success("Meeting completed and link discarded.");
  };

  const resetTaskDraft = () => {
    setTaskDraft({ title: "", type: "question", detail: "", due: "", assignedTo: MODERATOR_NAMES[0] });
    setTaskAssignmentMode("specific");
    setEditingTaskId(null);
  };

  const openCreateTaskModal = () => {
    resetTaskDraft();
    setOpenTaskModal(true);
  };

  const openEditTaskModal = (task: Task) => {
    setEditingTaskId(task.id);
    setTaskDraft({
      title: task.title,
      type: task.type,
      detail: task.detail,
      due: task.due,
      assignedTo: task.assignedTo === "All Moderators" ? MODERATOR_NAMES[0] : task.assignedTo,
    });
    setTaskAssignmentMode(task.assignedTo === "All Moderators" ? "general" : "specific");
    setOpenTaskModal(true);
  };

  const handleSaveTask = () => {
    if (!taskDraft.title?.trim() || !taskDraft.detail?.trim() || !taskDraft.due?.trim()) {
      toast.error("Complete every field.");
      return;
    }

    const assignedTo = taskAssignmentMode === "specific"
      ? (taskDraft.assignedTo || MODERATOR_NAMES[0])
      : "All Moderators";

    if (editingTaskId) {
      setTasks((current) =>
        current.map((item) =>
          item.id === editingTaskId
            ? {
                ...item,
                title: taskDraft.title!.trim(),
                type: taskDraft.type as "question" | "excel" | "research",
                detail: taskDraft.detail!.trim(),
                due: taskDraft.due!.trim(),
                assignedTo,
              }
            : item
        )
      );
      toast.success("Task updated.");
    } else {
      setTasks((current) => [
        {
          id: createId(),
          title: taskDraft.title!.trim(),
          type: taskDraft.type as "question" | "excel" | "research",
          detail: taskDraft.detail!.trim(),
          due: taskDraft.due!.trim(),
          assignedTo,
          status: "pending",
        },
        ...current,
      ]);
      toast.success(taskAssignmentMode === "specific" ? "Task assigned to moderator." : "General task published to all moderators.");
    }

    resetTaskDraft();
    setOpenTaskModal(false);
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks((current) => current.filter((item) => item.id !== taskId));
    toast.success("Task deleted.");
  };

  const handleRemoveCompletedTasks = () => {
    setTasks((current) => current.filter((item) => item.status !== "completed"));
    toast.success("Completed tasks removed.");
  };

  const handleSaveGoogleForm = () => {
    if (!googleFormLink.trim()) {
      toast.error("Enter a valid form URL.");
      return;
    }
    setGoogleFormLink(googleFormLink.trim());
    setOpenFormModal(false);
    toast.success("Form link saved.");
  };

  const handlePublishAnnouncement = () => {
    if (!announcementDraft.trim()) {
      toast.error("Enter a message.");
      return;
    }

    const audience = announcementAudienceMode === "specific" ? "specific" : "general";
    const recipient = audience === "specific" ? announcementRecipient : undefined;

    setAnnouncements((current) => [
      {
        id: createId(),
        message: announcementDraft.trim(),
        urgent: false,
        pinned: false,
        createdAt: new Date().toISOString(),
        audience,
        recipient,
      },
      ...current,
    ]);
    setAnnouncementDraft("");
    setAnnouncementAudienceMode("specific");
    setAnnouncementRecipient(MODERATOR_NAMES[0]);
    setOpenAnnouncementModal(false);
    toast.success(audience === "specific" ? "Announcement sent to moderator." : "General announcement posted.");
  };

  const toggleAnnouncementPin = (announcementId: string) => {
    setAnnouncements((current) =>
      current.map((item) => (item.id === announcementId ? { ...item, pinned: !item.pinned } : item))
    );
  };

  const markTaskComplete = async (taskId: string) => {
    const task = tasks.find((item) => item.id === taskId);
    if (!task) return;
    setTasks((current) =>
      current.map((item) => (item.id === taskId ? { ...item, status: "completed" } : item))
    );
    await fetch("/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        moderatorName: session?.name ?? "Moderator",
        task: task.title,
        timestamp: new Date().toISOString(),
        attachedFile: task.fileName ?? "N/A",
        message: "Task completed.",
      }),
    }).catch(() => console.error("Submission failed"));
    toast.success("Task marked complete.");
  };

  const updateTaskResponse = (taskId: string, value: string) => {
    setTasks((current) =>
      current.map((item) => (item.id === taskId ? { ...item, response: value } : item))
    );
  };

  const uploadTaskFile = async (event: ChangeEvent<HTMLInputElement>, taskId: string) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setTasks((current) =>
      current.map((item) =>
        item.id === taskId ? { ...item, fileName: file.name, status: "completed" } : item
      )
    );
    const task = tasks.find((item) => item.id === taskId);
    await fetch("/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        moderatorName: session?.name ?? "Moderator",
        task: task?.title ?? "Task upload",
        timestamp: new Date().toISOString(),
        attachedFile: file.name,
        message: "File uploaded.",
      }),
    }).catch(() => console.error("Submission failed"));
    toast.success("File attached and submitted.");
  };

  const renderLanding = () => (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-4 overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 text-center max-w-4xl mx-auto space-y-8"
      >
        <div className="space-y-4">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-6xl sm:text-7xl lg:text-8xl font-light tracking-tight text-[var(--text)]"
          >
            Command
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg sm:text-xl text-[var(--text-secondary)] font-light tracking-wide max-w-2xl mx-auto"
          >
            VPSMUN coordination network.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8"
        >
          <button
            type="button"
            onClick={() => setOpenModeratorModal(true)}
            className="glass-button glass-hover px-8 py-3 rounded-full text-sm font-medium text-[var(--text)] border border-[var(--border)] premium-border-hover hover-lift"
          >
            Access
          </button>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.6 }}
        className="absolute inset-0 z-0 pointer-events-none"
      >
        <div className="absolute top-20 right-10 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-5 animate-pulse" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-5 animate-pulse" />
      </motion.div>
    </div>
  );

  const renderModeratorConsole = () => (
    <motion.section
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8 pb-12"
    >
      <motion.div variants={itemVariants} className="rounded-2xl glass premium-border p-8 hover-lift">
        <div className="space-y-6">
          <div>
            <p className="text-xs uppercase tracking-widest text-[var(--muted)] font-medium">Assignment Desk</p>
            <h2 className="mt-2 text-3xl font-light text-[var(--text)]">{session?.name}</h2>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl glass premium-border p-6 hover:bg-[var(--panel-hover)] smooth-transition">
              <p className="text-xs uppercase tracking-widest text-[var(--muted)] font-medium">Status</p>
              <p className="mt-3 text-2xl font-light text-[var(--text)]">Rank #{moderatorPosition ?? "N/A"}</p>
              <p className="mt-2 text-xs text-[var(--text-secondary)]">On leaderboard</p>
            </div>
            <div className="rounded-xl glass premium-border p-6 hover:bg-[var(--panel-hover)] smooth-transition">
              <p className="text-xs uppercase tracking-widest text-[var(--muted)] font-medium">Active Tasks</p>
              <p className="mt-3 text-2xl font-light text-[var(--text)]">{moderatorVisibleTasks.length}</p>
              <p className="mt-2 text-xs text-[var(--text-secondary)]">Assigned to you</p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <motion.div variants={itemVariants} className="space-y-6">
          <div className="rounded-2xl glass premium-border p-8 hover-lift">
            <div className="space-y-4">
              <p className="text-xs uppercase tracking-widest text-[var(--muted)] font-medium">Next Briefing</p>
              {activeMeeting ? (
                <div className="space-y-4">
                  <h3 className="text-xl font-light text-[var(--text)]">{activeMeeting.title}</h3>
                  <p className="text-sm text-[var(--text-secondary)]">{new Date(activeMeeting.datetime).toLocaleString()}</p>
                  <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{activeMeeting.agenda}</p>
                  <a href={activeMeeting.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 mt-4 glass-button glass-hover px-4 py-2 rounded-full text-sm text-[var(--text)] border border-[var(--border)] premium-border-hover">
                    Join <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              ) : (
                <p className="text-sm text-[var(--text-secondary)]">Awaiting dispatch.</p>
              )}
            </div>
          </div>

          <div className="rounded-2xl glass premium-border p-8 hover-lift">
            <div className="space-y-4">
              <p className="text-xs uppercase tracking-widest text-[var(--muted)] font-medium">Tasks</p>
              {moderatorVisibleTasks.length ? (
                <div className="space-y-3">
                  {moderatorVisibleTasks.map((task) => (
                    <div key={task.id} className="rounded-lg glass premium-border p-4 hover:bg-[var(--panel-hover)] smooth-transition">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-xs text-[var(--muted)]">{task.type.toUpperCase()}</p>
                            <p className="mt-1 font-light text-[var(--text)]">{task.title}</p>
                            <p className="mt-1 text-[11px] uppercase tracking-wider text-[var(--muted)]">
                              {task.assignedTo === "All Moderators" ? "Visible to all moderators" : `Assigned to ${task.assignedTo}`}
                            </p>
                          </div>
                          <span className="text-xs text-[var(--muted)]">Due {new Date(task.due).toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm text-[var(--text-secondary)]">{task.detail}</p>
                        <button
                          type="button"
                          onClick={() => markTaskComplete(task.id)}
                          className="text-xs uppercase tracking-widest text-[var(--accent)] hover:text-[var(--text)] transition mt-3 smooth-transition"
                        >
                          Complete →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[var(--text-secondary)]">No tasks assigned to you.</p>
              )}
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="space-y-6">
          <div className="rounded-2xl glass premium-border p-8 hover-lift">
            <div className="space-y-4">
              <p className="text-xs uppercase tracking-widest text-[var(--muted)] font-medium">Competition</p>
              <div className="space-y-2">
                {leaderboard.slice(0, 6).map((item) => {
                  const isCurrentUser = item.name === session?.name;
                  const trend = item.position === 1 ? '↑' : item.position === 2 ? '→' : '↓';
                  return (
                    <div key={item.name} className={`flex items-center justify-between text-sm py-2 px-2 rounded transition ${isCurrentUser ? 'bg-[var(--panel-hover)] text-[var(--accent)]' : ''}`}>
                      <span className="font-light text-[var(--text)]">{trend} #{item.position} {item.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.section>
  );

  const renderOpsContent = () => {
    const section = SECTIONS.find((item) => item.id === activeSection);
    return (
      <motion.div
        key={activeSection}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="grid gap-8 lg:grid-cols-[280px_1fr]"
      >
        <aside className="rounded-2xl glass premium-border p-6 h-fit lg:sticky lg:top-6 hover-lift">
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-widest text-[var(--muted)] font-medium">Control</p>
            <nav className="space-y-1">
              {SECTIONS.map((item) => {
                const ActiveIcon = item.icon;
                const active = item.id === activeSection;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition smooth-transition ${
                      active ? "bg-[var(--panel-hover)] text-[var(--text)] border-l-2 border-[var(--accent)]" : "text-[var(--text-secondary)] hover:text-[var(--text)]"
                    }`}
                  >
                    <ActiveIcon className="w-4 h-4" />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        <section className="space-y-8">
          <div className="rounded-2xl glass premium-border p-8 hover-lift">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-widest text-[var(--muted)] font-medium">{section?.label}</p>
                <h2 className="mt-2 text-3xl font-light text-[var(--text)]">{section?.label}</h2>
              </div>
              {activeSection === "meetings" && <button type="button" onClick={() => setOpenMeetingModal(true)} className="glass-button glass-hover px-6 py-2 rounded-full text-sm text-[var(--text)] border border-[var(--border)] premium-border-hover">New</button>}
              {activeSection === "tasks" && <button type="button" onClick={openCreateTaskModal} className="glass-button glass-hover px-6 py-2 rounded-full text-sm text-[var(--text)] border border-[var(--border)] premium-border-hover">Assign</button>}
              {activeSection === "announcements" && <button type="button" onClick={() => setOpenAnnouncementModal(true)} className="glass-button glass-hover px-6 py-2 rounded-full text-sm text-[var(--text)] border border-[var(--border)] premium-border-hover">Post</button>}
              {activeSection === "forms" && <button type="button" onClick={() => setOpenFormModal(true)} className="glass-button glass-hover px-6 py-2 rounded-full text-sm text-[var(--text)] border border-[var(--border)] premium-border-hover">Add</button>}
            </div>
          </div>

          {activeSection === "overview" && (
            <div className="grid gap-6 xl:grid-cols-3">
              <div className="rounded-2xl glass premium-border p-8 hover-lift"><p className="text-xs uppercase tracking-widest text-[var(--muted)] font-medium">Active</p><p className="mt-4 text-4xl font-light text-[var(--text)]">{pendingTasks.length}</p></div>
              <div className="rounded-2xl glass premium-border p-8 hover-lift"><p className="text-xs uppercase tracking-widest text-[var(--muted)] font-medium">Complete</p><p className="mt-4 text-4xl font-light text-[var(--text)]">{completedTasks.length}</p></div>
              <div className="rounded-2xl glass premium-border p-8 hover-lift"><p className="text-xs uppercase tracking-widest text-[var(--muted)] font-medium">Next Briefing</p><p className="mt-4 text-lg font-light text-[var(--text)] line-clamp-2">{activeMeeting ? activeMeeting.title : "—"}</p></div>
            </div>
          )}

          {activeSection === "meetings" && (
            <div className="space-y-4">
              {activeMeetings.length ? (
                activeMeetings.map((meeting) => (
                  <div key={meeting.id} className="rounded-xl glass premium-border p-6 hover-lift">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="flex-1">
                        <p className="text-xs text-[var(--muted)]">{new Date(meeting.datetime).toLocaleString()}</p>
                        <h3 className="mt-2 font-light text-[var(--text)]">{meeting.title}</h3>
                        <p className="mt-2 text-sm text-[var(--text-secondary)]">{meeting.agenda}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <a href={meeting.link} target="_blank" rel="noreferrer" className="glass-button glass-hover px-4 py-2 rounded-full text-sm text-[var(--text)] border border-[var(--border)]">Join</a>
                        <button type="button" onClick={() => handleCompleteMeeting(meeting.id)} className="glass-button glass-hover px-4 py-2 rounded-full text-sm text-[var(--text)] border border-[var(--border)]">Complete</button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl glass premium-border p-6 text-sm text-[var(--text-secondary)]">No briefings scheduled.</div>
              )}
            </div>
          )}

          {activeSection === "tasks" && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button type="button" onClick={handleRemoveCompletedTasks} className="glass-button glass-hover px-4 py-2 rounded-full text-sm text-[var(--text)] border border-[var(--border)]">
                  Remove completed
                </button>
              </div>
              {tasks.length ? (
                tasks.map((task) => (
                  <div key={task.id} className="rounded-xl glass premium-border p-6 hover-lift">
                    <div className="space-y-3">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex-1">
                          <p className="text-xs text-[var(--muted)]">{task.type.toUpperCase()} → {task.assignedTo === "All Moderators" ? "Visible to all moderators" : task.assignedTo}</p>
                          <h3 className="mt-2 font-light text-[var(--text)]">{task.title}</h3>
                          <p className="mt-2 text-sm text-[var(--text-secondary)]">{task.detail}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs px-3 py-1 rounded-full bg-[var(--panel-hover)] text-[var(--text)]">{task.status}</span>
                          <button type="button" onClick={() => openEditTaskModal(task)} className="glass-button glass-hover px-3 py-2 rounded-full text-xs text-[var(--text)] border border-[var(--border)]">Edit</button>
                          <button type="button" onClick={() => handleDeleteTask(task.id)} className="glass-button glass-hover px-3 py-2 rounded-full text-xs text-[var(--text)] border border-[var(--border)]">Delete</button>
                        </div>
                      </div>
                      <p className="text-xs text-[var(--muted)]">Due {new Date(task.due).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl glass premium-border p-6 text-sm text-[var(--text-secondary)]">No active tasks.</div>
              )}
            </div>
          )}

          {activeSection === "announcements" && (
            <div className="space-y-4">
              {announcements.length ? (
                announcements.map((announcement) => (
                  <div key={announcement.id} className="rounded-xl glass premium-border p-6 hover-lift">
                    <div className="flex items-start justify-between gap-4">
                      <p className="text-sm text-[var(--text)]">{announcement.message}</p>
                      <button type="button" onClick={() => toggleAnnouncementPin(announcement.id)} className="text-xs text-[var(--muted)] hover:text-[var(--text)] transition smooth-transition">
                        {announcement.pinned ? "Pinned" : "Pin"}
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl glass premium-border p-6 text-sm text-[var(--text-secondary)]">No announcements.</div>
              )}
            </div>
          )}

          {activeSection === "forms" && (
            <div className="rounded-xl glass premium-border p-8 hover-lift">
              <div className="space-y-4">
                <p className="text-xs uppercase tracking-widest text-[var(--muted)] font-medium">External Form</p>
                {googleFormLink ? (
                  <>
                    <p className="text-sm text-[var(--text-secondary)] truncate">{googleFormLink}</p>
                    <a href={googleFormLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 glass-button glass-hover px-4 py-2 rounded-full text-sm text-[var(--text)] border border-[var(--border)]">
                      Open <ArrowRight className="w-4 h-4" />
                    </a>
                  </>
                ) : (
                  <p className="text-sm text-[var(--text-secondary)]">Not configured.</p>
                )}
              </div>
            </div>
          )}

          {activeSection === "leaderboard" && (
            <div className="rounded-xl glass premium-border p-8 hover-lift">
              <div className="space-y-6">
                <div className="mb-4 pb-4 border-b border-[var(--border)]">
                  <p className="text-xs uppercase tracking-widest text-[var(--muted)] font-medium">Competition Standings</p>
                  <p className="mt-2 text-sm text-[var(--text-secondary)]">OPS-only controls for participant management and score updates.</p>
                </div>

                <div className="rounded-xl border border-[var(--border)] bg-[var(--panel-hover)]/40 p-4 space-y-3">
                  <div className="flex flex-col gap-3 md:flex-row md:items-end">
                    <div className="flex-1">
                      <label className="block text-xs uppercase tracking-widest text-[var(--muted)] font-medium mb-2">Participant</label>
                      <input
                        type="text"
                        value={newParticipantName}
                        onChange={(event) => setNewParticipantName(event.target.value)}
                        placeholder="Add participant"
                        className="w-full glass-input px-4 py-3 rounded-lg text-sm"
                      />
                    </div>
                    <div className="w-full md:w-32">
                      <label className="block text-xs uppercase tracking-widest text-[var(--muted)] font-medium mb-2">Marks</label>
                      <input
                        type="number"
                        value={newParticipantPoints}
                        onChange={(event) => setNewParticipantPoints(event.target.value)}
                        className="w-full glass-input px-4 py-3 rounded-lg text-sm"
                      />
                    </div>
                    <button type="button" onClick={handleAddParticipant} className="glass-button glass-hover px-4 py-3 rounded-full text-sm text-[var(--text)] border border-[var(--border)]">
                      Add
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {leaderboard.map((item, idx) => {
                    const trend = idx === 0 ? <TrendingUp className="w-4 h-4 text-green-400" /> : idx === leaderboard.length - 1 ? <TrendingDown className="w-4 h-4 text-red-400" /> : <span className="text-[var(--text-secondary)]">→</span>;
                    return (
                      <div key={item.name} className="flex flex-col gap-3 rounded-xl border border-[var(--border)] bg-[var(--panel)]/50 p-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-xs font-bold text-[var(--accent)] w-6">#{item.position}</span>
                          <span className="font-light text-[var(--text)] truncate">{item.name}</span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 md:gap-3">
                          <div className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--panel-hover)]/70 px-2 py-1">
                            <button type="button" onClick={() => handleAdjustParticipantPoints(item.name, -5)} className="px-2 py-1 text-sm text-[var(--muted)] hover:text-[var(--text)]">−5</button>
                            <input
                              type="number"
                              value={item.points}
                              onChange={(event) => handleEditParticipantPoints(item.name, event.target.value)}
                              className="w-20 bg-transparent text-center text-sm font-light text-[var(--text)] outline-none"
                            />
                            <button type="button" onClick={() => handleAdjustParticipantPoints(item.name, 5)} className="px-2 py-1 text-sm text-[var(--muted)] hover:text-[var(--text)]">+5</button>
                          </div>

                          <button type="button" onClick={() => handleAdjustParticipantPoints(item.name, -1)} className="glass-button glass-hover px-3 py-2 rounded-full text-xs text-[var(--text)] border border-[var(--border)]">−1</button>
                          <button type="button" onClick={() => handleAdjustParticipantPoints(item.name, 1)} className="glass-button glass-hover px-3 py-2 rounded-full text-xs text-[var(--text)] border border-[var(--border)]">+1</button>
                          <button type="button" onClick={() => handleRemoveParticipant(item.name)} className="text-xs uppercase tracking-widest text-[var(--muted)] hover:text-[var(--text)] transition smooth-transition">
                            Remove
                          </button>
                          {trend}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeSection === "settings" && (
            <div className="rounded-xl glass premium-border p-8 hover-lift">
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3">
                  <span className="text-sm text-[var(--text)]">Theme</span>
                  <button type="button" onClick={handleThemeToggle} className="glass-button glass-hover px-4 py-2 rounded-full text-xs text-[var(--text)] border border-[var(--border)]">
                    {theme === "dark" ? "Dark" : "Light"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      </motion.div>
    );
  };

  return (
    <main className="relative min-h-screen bg-[var(--background)] text-[var(--text)]">
      <div className="relative z-10">
        <header className="sticky top-0 z-40 backdrop-blur-sm bg-[var(--panel)]/30 border-b border-[var(--border)] smooth-transition">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-[var(--muted)] font-medium">VPSMUN</p>
              <h1 className="text-lg font-light text-[var(--text)]">Command</h1>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-3 sm:gap-4 min-w-0 relative z-20">
              <button
                type="button"
                onClick={handleThemeToggle}
                className="inline-flex items-center justify-center w-10 h-10 rounded-full glass-button glass-hover border border-[var(--border)] hover-lift shrink-0"
              >
                {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              {!session ? (
                <button
                  type="button"
                  onClick={() => setOpenOpsModal(true)}
                  className="text-xs uppercase tracking-widest text-[var(--muted)] hover:text-[var(--text)] transition smooth-transition px-4 py-2 rounded-full hover:bg-[var(--panel-hover)] border border-transparent"
                  title="Executive Access"
                >
                  OPS
                </button>
              ) : (
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 glass-button glass-hover px-3 sm:px-4 py-2 rounded-full border border-[var(--border)] smooth-transition">
                  <span className="text-sm font-light text-[var(--text)] truncate max-w-[8rem] sm:max-w-none">{session.name}</span>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="text-xs uppercase tracking-widest text-[var(--muted)] hover:text-[var(--text)] transition smooth-transition"
                  >
                    Exit
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          {!session ? renderLanding() : session.role === "ops" ? renderOpsContent() : renderModeratorConsole()}
        </div>
      </div>

      <AnimatePresence>
        {openModeratorModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-md px-3 py-4 sm:px-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative z-[70] w-full max-w-md max-h-[calc(100vh-2rem)] overflow-y-auto rounded-2xl glass premium-border p-6 sm:p-8 premium-shadow-lg"
            >
              <div className="space-y-6">
                <div>
                  <p className="text-xs uppercase tracking-widest text-[var(--muted)] font-medium">Access Portal</p>
                  <h2 className="mt-2 text-2xl font-light text-[var(--text)]">Moderator</h2>
                </div>
                <form onSubmit={handleModeratorLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-[var(--muted)] font-medium mb-2">Identity</label>
                    <div className="relative z-20">
                      <select value={selectedName} onChange={(event) => setSelectedName(event.target.value)} className="w-full appearance-none glass-input px-4 py-3 pr-10 rounded-lg text-sm">
                        {MODERATOR_NAMES.map((name) => (
                          <option key={name} value={name}>
                            {name}
                          </option>
                        ))}
                      </select>
                      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[var(--muted)]">▾</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-[var(--muted)] font-medium mb-2">Passcode</label>
                    <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full glass-input px-4 py-3 rounded-lg text-sm" placeholder="Enter passcode" />
                  </div>
                  <button type="submit" className="w-full bg-[var(--accent)] hover:bg-blue-600 text-white font-medium uppercase tracking-widest text-sm py-3 rounded-lg transition smooth-transition hover:shadow-lg hover:shadow-blue-500/20">
                    Access
                  </button>
                </form>
                <button type="button" onClick={() => setOpenModeratorModal(false)} className="w-full text-xs uppercase tracking-widest text-[var(--muted)] hover:text-[var(--text)] transition py-2 smooth-transition">
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {openOpsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-md px-3 py-4 sm:px-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative z-[70] w-full max-w-md max-h-[calc(100vh-2rem)] overflow-y-auto rounded-2xl glass premium-border p-6 sm:p-8 premium-shadow-lg border-[var(--accent)]/30"
            >
              <div className="space-y-6">
                <div>
                  <p className="text-xs uppercase tracking-widest text-[var(--accent)] font-medium">Restricted Access</p>
                  <h2 className="mt-2 text-2xl font-light text-[var(--text)]">OPS</h2>
                </div>
                <form onSubmit={handleOpsLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-[var(--muted)] font-medium mb-2">Name</label>
                    <input type="text" value={opsName} onChange={(event) => setOpsName(event.target.value)} className="w-full glass-input px-4 py-3 rounded-lg text-sm" placeholder="Enter name" />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-[var(--muted)] font-medium mb-2">Passcode</label>
                    <input type="password" value={opsPassword} onChange={(event) => setOpsPassword(event.target.value)} className="w-full glass-input px-4 py-3 rounded-lg text-sm" placeholder="Enter passcode" />
                  </div>
                  <button type="submit" className="w-full bg-[var(--accent)] hover:bg-blue-600 text-white font-medium uppercase tracking-widest text-sm py-3 rounded-lg transition smooth-transition hover:shadow-lg hover:shadow-blue-500/30">
                    Verify
                  </button>
                </form>
                <button type="button" onClick={() => setOpenOpsModal(false)} className="w-full text-xs uppercase tracking-widest text-[var(--muted)] hover:text-[var(--text)] transition py-2 smooth-transition">
                  Dismiss
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {openMeetingModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md px-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-md rounded-2xl glass premium-border p-8 premium-shadow-lg"
            >
              <div className="space-y-6">
                <div>
                  <p className="text-xs uppercase tracking-widest text-[var(--muted)] font-medium">Scheduling</p>
                  <h2 className="mt-2 text-2xl font-light text-[var(--text)]">New Briefing</h2>
                </div>
                <div className="space-y-4">
                  <input type="text" value={meetingDraft.title || ""} onChange={(e) => setMeetingDraft((c) => ({ ...c, title: e.target.value }))} placeholder="Title" className="w-full glass-input px-4 py-3 rounded-lg text-sm" />
                  <input type="datetime-local" value={meetingDraft.datetime || ""} onChange={(e) => setMeetingDraft((c) => ({ ...c, datetime: e.target.value }))} className="w-full glass-input px-4 py-3 rounded-lg text-sm" />
                  <input type="url" value={meetingDraft.link || ""} onChange={(e) => setMeetingDraft((c) => ({ ...c, link: e.target.value }))} placeholder="Meeting link" className="w-full glass-input px-4 py-3 rounded-lg text-sm" />
                  <textarea rows={4} value={meetingDraft.agenda || ""} onChange={(e) => setMeetingDraft((c) => ({ ...c, agenda: e.target.value }))} placeholder="Agenda" className="w-full glass-input px-4 py-3 rounded-lg text-sm" />
                  <button type="button" onClick={handleCreateMeeting} className="w-full bg-[var(--accent)] hover:bg-blue-600 text-white font-medium uppercase tracking-widest text-sm py-3 rounded-lg transition smooth-transition hover:shadow-lg hover:shadow-blue-500/20">
                    Schedule
                  </button>
                </div>
                <button type="button" onClick={() => setOpenMeetingModal(false)} className="w-full text-xs uppercase tracking-widest text-[var(--muted)] hover:text-[var(--text)] transition py-2 smooth-transition">
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {openTaskModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-md px-3 py-4 sm:px-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative z-[70] w-full max-w-md max-h-[calc(100vh-2rem)] overflow-y-auto rounded-2xl glass premium-border p-6 sm:p-8 premium-shadow-lg"
            >
              <div className="space-y-6">
                <div>
                  <p className="text-xs uppercase tracking-widest text-[var(--muted)] font-medium">Task Assignment</p>
                  <h2 className="mt-2 text-2xl font-light text-[var(--text)]">New Task</h2>
                </div>
                <div className="space-y-4">
                  <input type="text" value={taskDraft.title || ""} onChange={(e) => setTaskDraft((c) => ({ ...c, title: e.target.value }))} placeholder="Task title" className="w-full glass-input px-4 py-3 rounded-lg text-sm" />
                  <div className="relative z-20">
                    <select value={taskDraft.type} onChange={(e) => setTaskDraft((c) => ({ ...c, type: e.target.value as Task["type"] }))} className="w-full appearance-none glass-input px-4 py-3 pr-10 rounded-lg text-sm">
                    <option value="question">Question</option>
                    <option value="excel">Excel</option>
                    <option value="research">Research</option>
                    </select>
                    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[var(--muted)]">▾</span>
                  </div>
                  <input type="date" value={taskDraft.due || ""} onChange={(e) => setTaskDraft((c) => ({ ...c, due: e.target.value }))} className="w-full glass-input px-4 py-3 rounded-lg text-sm" />
                  <div className="space-y-2">
                    <label className="block text-xs uppercase tracking-widest text-[var(--muted)] font-medium">Assignment</label>
                    <div className="relative z-20">
                      <select value={taskAssignmentMode} onChange={(e) => setTaskAssignmentMode(e.target.value as TaskAssignmentMode)} className="w-full appearance-none glass-input px-4 py-3 pr-10 rounded-lg text-sm">
                        <option value="specific">Specific moderator</option>
                        <option value="general">All moderators</option>
                      </select>
                      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[var(--muted)]">▾</span>
                    </div>
                  </div>
                  {taskAssignmentMode === "specific" && (
                    <div className="space-y-2">
                      <label className="block text-xs uppercase tracking-widest text-[var(--muted)] font-medium">Moderator</label>
                      <div className="relative z-20">
                        <select value={taskDraft.assignedTo} onChange={(e) => setTaskDraft((c) => ({ ...c, assignedTo: e.target.value }))} className="w-full appearance-none glass-input px-4 py-3 pr-10 rounded-lg text-sm">
                          {MODERATOR_NAMES.map((name) => (
                            <option key={name} value={name}>
                              {name}
                            </option>
                          ))}
                        </select>
                        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[var(--muted)]">▾</span>
                      </div>
                    </div>
                  )}
                  <textarea rows={4} value={taskDraft.detail || ""} onChange={(e) => setTaskDraft((c) => ({ ...c, detail: e.target.value }))} placeholder="Details" className="w-full glass-input px-4 py-3 rounded-lg text-sm" />
                  <button type="button" onClick={handleSaveTask} className="w-full bg-[var(--accent)] hover:bg-blue-600 text-white font-medium uppercase tracking-widest text-sm py-3 rounded-lg transition smooth-transition hover:shadow-lg hover:shadow-blue-500/20">
                    {editingTaskId ? "Save changes" : "Assign"}
                  </button>
                </div>
                <button type="button" onClick={() => { setOpenTaskModal(false); resetTaskDraft(); }} className="w-full text-xs uppercase tracking-widest text-[var(--muted)] hover:text-[var(--text)] transition py-2 smooth-transition">
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {openFormModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md px-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-md rounded-2xl glass premium-border p-8 premium-shadow-lg"
            >
              <div className="space-y-6">
                <div>
                  <p className="text-xs uppercase tracking-widest text-[var(--muted)] font-medium">External Links</p>
                  <h2 className="mt-2 text-2xl font-light text-[var(--text)]">Form Integration</h2>
                </div>
                <div className="space-y-4">
                  <input type="url" value={googleFormLink} onChange={(e) => setGoogleFormLink(e.target.value)} placeholder="Form URL" className="w-full glass-input px-4 py-3 rounded-lg text-sm" />
                  <button type="button" onClick={handleSaveGoogleForm} className="w-full bg-[var(--accent)] hover:bg-blue-600 text-white font-medium uppercase tracking-widest text-sm py-3 rounded-lg transition smooth-transition hover:shadow-lg hover:shadow-blue-500/20">
                    Save
                  </button>
                </div>
                <button type="button" onClick={() => setOpenFormModal(false)} className="w-full text-xs uppercase tracking-widest text-[var(--muted)] hover:text-[var(--text)] transition py-2 smooth-transition">
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {openAnnouncementModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md px-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-md rounded-2xl glass premium-border p-8 premium-shadow-lg"
            >
              <div className="space-y-6">
                <div>
                  <p className="text-xs uppercase tracking-widest text-[var(--muted)] font-medium">Broadcast</p>
                  <h2 className="mt-2 text-2xl font-light text-[var(--text)]">Announcement</h2>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-xs uppercase tracking-widest text-[var(--muted)] font-medium">Audience</label>
                    <div className="relative z-20">
                      <select value={announcementAudienceMode} onChange={(e) => setAnnouncementAudienceMode(e.target.value as AnnouncementAudienceMode)} className="w-full appearance-none glass-input px-4 py-3 pr-10 rounded-lg text-sm">
                        <option value="specific">Specific moderator</option>
                        <option value="general">All moderators</option>
                      </select>
                      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[var(--muted)]">▾</span>
                    </div>
                  </div>
                  {announcementAudienceMode === "specific" && (
                    <div className="space-y-2">
                      <label className="block text-xs uppercase tracking-widest text-[var(--muted)] font-medium">Moderator</label>
                      <div className="relative z-20">
                        <select value={announcementRecipient} onChange={(e) => setAnnouncementRecipient(e.target.value)} className="w-full appearance-none glass-input px-4 py-3 pr-10 rounded-lg text-sm">
                          {MODERATOR_NAMES.map((name) => (
                            <option key={name} value={name}>
                              {name}
                            </option>
                          ))}
                        </select>
                        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[var(--muted)]">▾</span>
                      </div>
                    </div>
                  )}
                  <textarea rows={5} value={announcementDraft} onChange={(e) => setAnnouncementDraft(e.target.value)} placeholder="Message" className="w-full glass-input px-4 py-3 rounded-lg text-sm" />
                  <button type="button" onClick={handlePublishAnnouncement} className="w-full bg-[var(--accent)] hover:bg-blue-600 text-white font-medium uppercase tracking-widest text-sm py-3 rounded-lg transition smooth-transition hover:shadow-lg hover:shadow-blue-500/20">
                    Publish
                  </button>
                </div>
                <button type="button" onClick={() => setOpenAnnouncementModal(false)} className="w-full text-xs uppercase tracking-widest text-[var(--muted)] hover:text-[var(--text)] transition py-2 smooth-transition">
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Toaster position="top-right" />
    </main>
  );
}
